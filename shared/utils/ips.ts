/**
 * IPS QR (NBS "Instant Payment Serbia") helpers.
 *
 * Payload format for a printed slip (K:PR), tags in mandatory order:
 *   K:PR|V:01|C:1|R:<18 digits>|N:<payee>|I:RSD<amount>|P:<payer>|SF:<code>|S:<purpose>|RO:<model+ref>
 *
 * Spec: https://ips.nbs.rs/PDF/pdfPreporukeValidacija.pdf
 * Official validator: https://ips.nbs.rs/sr_lat/qr-validacija-generisanje
 */
import { toLatin } from './translit'

export const LIMITS = {
  payee: 70,
  payer: 70,
  purpose: 35,
  /** RO is at most 25 chars: 2 for the model + 23 for the reference. */
  reference: 23,
} as const

export interface IpsInput {
  /** Payee account, any common notation: "845-0000000404849-87", "845-404849-87" or 18 digits. */
  account: string
  /** Payee name and address; up to 3 lines. */
  payee: string
  /** Amount in RSD. */
  amount: number
  /** Payer name and address; optional. */
  payer?: string
  /** 3-digit payment code (šifra plaćanja). */
  paymentCode: string
  /** Purpose of payment; optional. */
  purpose?: string
  /** 2-digit model, e.g. "97"; empty when there is none. */
  model?: string
  /** Reference number (poziv na broj). */
  reference?: string
}

export type IpsError =
  | 'account.invalid'
  | 'account.checksum'
  | 'payee.required'
  | 'payee.tooLong'
  | 'payer.tooLong'
  | 'amount.invalid'
  | 'paymentCode.invalid'
  | 'purpose.tooLong'
  | 'model.invalid'
  | 'reference.tooLong'
  | 'reference.invalid'
  | 'reference.checksum'

const MOD = BigInt(97)
const mod97 = (digits: string) => Number(BigInt(digits) % MOD)

/** Returns 18-digit account or null when the notation can't be parsed. */
export function normalizeAccount(input: string): string | null {
  const raw = input.replace(/\s/g, '')
  if (/^\d{18}$/.test(raw)) return raw
  const m = raw.match(/^(\d{3})-(\d{1,13})-(\d{2})$/)
  if (!m) return null
  return m[1]! + m[2]!.padStart(13, '0') + m[3]!
}

/** 845000000040484987 → 845-0000000404849-87 (bank-account-control). */
export function formatAccount(account18: string): string {
  return `${account18.slice(0, 3)}-${account18.slice(3, 16)}-${account18.slice(16)}`
}

export function isAccountChecksumValid(account18: string): boolean {
  return mod97(account18) === 1
}

/** Reference as it goes into the QR: model 97 is digits only, others keep dashes. */
export function normalizeReference(model: string, reference: string): string {
  const ref = reference.replace(/\s/g, '')
  return model === '97' ? ref.replace(/-/g, '') : ref
}

/** Model 97 (ISO 7064 MOD 97-10): leading two digits are the control number. */
export function isModel97Valid(reference: string): boolean {
  const ref = reference.replace(/[\s-]/g, '')
  if (!/^\d{3,}$/.test(ref)) return false
  return mod97(ref.slice(2) + ref.slice(0, 2)) === 1
}

/** Control digits to prepend to a model 97 reference body. */
export function model97Control(body: string): string {
  const digits = body.replace(/[\s-]/g, '')
  return String(98 - mod97(digits + '00')).padStart(2, '0')
}

/** 1234.5 → "1234,50" */
export function formatIpsAmount(amount: number): string {
  return amount.toFixed(2).replace('.', ',')
}

// QR text must be Latin (NBS): Cyrillic typed by the user is transliterated.
const clean = (s: string | undefined) =>
  toLatin(s ?? '')
    .replace(/\|/g, ' ')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .join('\r\n')

export function validateIps(input: IpsInput): IpsError[] {
  const errors: IpsError[] = []
  const account = normalizeAccount(input.account)
  if (!account) errors.push('account.invalid')
  else if (!isAccountChecksumValid(account)) errors.push('account.checksum')

  const payee = clean(input.payee)
  if (!payee) errors.push('payee.required')
  else if (payee.length > LIMITS.payee) errors.push('payee.tooLong')

  if (clean(input.payer).length > LIMITS.payer) errors.push('payer.tooLong')
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount >= 1e15) errors.push('amount.invalid')
  if (!/^[12]\d{2}$/.test(input.paymentCode)) errors.push('paymentCode.invalid')
  if (clean(input.purpose).length > LIMITS.purpose) errors.push('purpose.tooLong')

  const model = input.model ?? ''
  const reference = normalizeReference(model, input.reference ?? '')
  if (model && !/^\d{2}$/.test(model)) errors.push('model.invalid')
  if (reference.length > LIMITS.reference) errors.push('reference.tooLong')
  else if (reference && !/^[\dA-Za-z-]+$/.test(reference)) errors.push('reference.invalid')
  else if (model === '97' && reference && !isModel97Valid(reference)) errors.push('reference.checksum')

  return errors
}

export interface ParsedIps {
  /** Raw tag → value map, in payload order. */
  tags: [string, string][]
  input: IpsInput
  /** Payload-level problems (unknown header, bad amount notation); field problems come from validateIps. */
  formatErrors: string[]
}

/** Parses an IPS QR payload (any K: type) back into slip fields. */
export function parseIpsString(payload: string): ParsedIps {
  const tags: [string, string][] = payload.trim().split('|').map((part) => {
    const i = part.indexOf(':')
    return i < 0 ? [part, ''] : [part.slice(0, i).toUpperCase(), part.slice(i + 1)]
  })
  const get = (tag: string) => tags.find(([t]) => t === tag)?.[1] ?? ''
  const lines = (s: string) => s.replace(/\r\n?/g, '\n')
  const formatErrors: string[] = []

  if (!['PR', 'PT', 'PK', 'EK'].includes(get('K'))) formatErrors.push('K')
  if (get('V') !== '01') formatErrors.push('V')
  if (get('C') !== '1') formatErrors.push('C')

  const amountTag = get('I')
  const amountMatch = amountTag.match(/^RSD(\d+)(?:,(\d{0,2}))?$/)
  if (!amountMatch) formatErrors.push('I')
  const amount = amountMatch ? Number(`${amountMatch[1]}.${amountMatch[2] || '0'}`) : Number.NaN

  const ro = get('RO')
  return {
    tags,
    formatErrors,
    input: {
      account: get('R'),
      payee: lines(get('N')),
      amount,
      payer: lines(get('P')),
      paymentCode: get('SF'),
      purpose: get('S'),
      model: ro.slice(0, 2),
      reference: ro.slice(2),
    },
  }
}

/** Builds the IPS QR payload. Call validateIps first; this does not validate. */
export function buildIpsString(input: IpsInput): string {
  const tags: string[] = [
    'K:PR',
    'V:01',
    'C:1',
    `R:${normalizeAccount(input.account)}`,
    `N:${clean(input.payee)}`,
    `I:RSD${formatIpsAmount(input.amount)}`,
  ]
  const payer = clean(input.payer)
  if (payer) tags.push(`P:${payer}`)
  tags.push(`SF:${input.paymentCode}`)
  const purpose = clean(input.purpose).replace(/\r\n/g, ' ')
  if (purpose) tags.push(`S:${purpose}`)
  const reference = normalizeReference(input.model ?? '', input.reference ?? '')
  if (reference) tags.push(`RO:${(input.model || '00')}${reference}`)
  return tags.join('|')
}
