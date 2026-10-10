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
  | 'payee.tooManyLines'
  | 'payer.tooLong'
  | 'payer.tooManyLines'
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

/**
 * Characters NBS accepts in N/P/S: Latin letters (incl. čćžšđ), digits, space and
 * ! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ ] ^ _ { } ~ ` (the validator rejects
 * en dash, checked 2026-10). "|" is the tag separator, so it is not allowed either.
 */
const NBS_DISALLOWED = /[^A-Za-zČčĆćŽžŠšĐđ0-9 !"#$%&'()*+,\-./:;<=>?@[\]^_{}~`\r\n]/g

/** Typographic characters that have a plain ASCII equivalent. */
function asciiPunctuation(s: string): string {
  return s
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B]/g, '\'')
    .replace(/\u2026/g, '...')
    .replace(/\u20AC/g, 'EUR')
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000\t|]/g, ' ')
}

/** Other Latin letters lose their marks (é → e, ü → u); the rest outside the NBS set is dropped. */
function keepAllowed(s: string): string {
  return s.replace(NBS_DISALLOWED, ch => ch.normalize('NFD').replace(NBS_DISALLOWED, ''))
}

// QR text must be Latin (NBS): Cyrillic typed by the user is transliterated, typographic
// punctuation is replaced and anything else outside the NBS set is dropped.
const clean = (s: string | undefined) =>
  keepAllowed(asciiPunctuation(toLatin(s ?? '')))
    .split(/\r?\n/)
    .map(l => l.replace(/ {2,}/g, ' ').trim())
    .filter(Boolean)
    .join('\r\n')

/** Lines drawn in a multiline box of the slip (the QR carries up to 3 as well). */
export const SLIP_MAX_LINES = 3
/** Slip text is Arial 3 mm with 1.2 mm padding on each side (see slipSvg.ts). */
const SLIP_FONT_MM = 3
const SLIP_PADDING_MM = 1.2

// Arial advance widths in 1/1000 em; anything not listed (digits, most punctuation) is 556, Cyrillic is 640.
const ARIAL_WIDTHS: Record<string, number> = {
  ' ': 278, '.': 278, ',': 278, ':': 278, ';': 278, '/': 278, '!': 278, '-': 333, '(': 333, ')': 333, '\'': 191, '"': 355,
  'a': 556, 'b': 556, 'c': 500, 'd': 556, 'e': 556, 'f': 278, 'g': 556, 'h': 556, 'i': 222, 'j': 222, 'k': 500, 'l': 222, 'm': 833,
  'n': 556, 'o': 556, 'p': 556, 'q': 556, 'r': 333, 's': 500, 't': 278, 'u': 556, 'v': 500, 'w': 722, 'x': 500, 'y': 500, 'z': 500,
  'č': 500, 'ć': 500, 'š': 500, 'ž': 500, 'đ': 556,
  'A': 667, 'B': 667, 'C': 722, 'D': 722, 'E': 667, 'F': 611, 'G': 778, 'H': 722, 'I': 278, 'J': 500, 'K': 667, 'L': 556, 'M': 833,
  'N': 722, 'O': 778, 'P': 667, 'Q': 778, 'R': 722, 'S': 667, 'T': 611, 'U': 722, 'V': 667, 'W': 944, 'X': 667, 'Y': 667, 'Z': 611,
  'Č': 722, 'Ć': 722, 'Š': 667, 'Ž': 611, 'Đ': 722,
}

/** Estimated width of one line of slip text in millimetres (Arial, 3 mm). */
export function slipTextWidthMm(line: string): number {
  let units = 0
  for (const ch of line) units += ARIAL_WIDTHS[ch] ?? (/[Ѐ-ӿ]/.test(ch) ? 640 : 556)
  return units / 1000 * SLIP_FONT_MM
}

/**
 * The drawing keeps 3 lines and clips what does not fit the box, while the QR carries up to
 * 70 characters: report text that would be cut off on the printed slip. Measured with Arial
 * widths, so a 94 mm box takes about 55 lowercase letters or 43 capitals per line.
 */
export function slipTextProblem(text: string, boxWidthMm: number): 'lines' | 'wide' | null {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length > SLIP_MAX_LINES) return 'lines'
  const room = boxWidthMm - 2 * SLIP_PADDING_MM
  return lines.some(l => slipTextWidthMm(l) > room) ? 'wide' : null
}

const lineCount = (s: string) => s.split(/\r?\n/).length

/** S is a single line: validation measures the same string that goes into the payload. */
const purposeText = (purpose: string | undefined) => clean(purpose).replace(/\r\n/g, ' ')

export function validateIps(input: IpsInput): IpsError[] {
  const errors: IpsError[] = []
  const account = normalizeAccount(input.account)
  if (!account) errors.push('account.invalid')
  else if (!isAccountChecksumValid(account)) errors.push('account.checksum')

  const payee = clean(input.payee)
  if (!payee) errors.push('payee.required')
  else if (payee.length > LIMITS.payee) errors.push('payee.tooLong')
  else if (lineCount(payee) > SLIP_MAX_LINES) errors.push('payee.tooManyLines')

  const payer = clean(input.payer)
  if (payer.length > LIMITS.payer) errors.push('payer.tooLong')
  else if (lineCount(payer) > SLIP_MAX_LINES) errors.push('payer.tooManyLines')
  // Tag I is "RSD" + at most 15 chars ("999999999999,99"), so the amount stays below 1e12.
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount >= 1e12) errors.push('amount.invalid')
  if (!/^[12]\d{2}$/.test(input.paymentCode)) errors.push('paymentCode.invalid')
  if (purposeText(input.purpose).length > LIMITS.purpose) errors.push('purpose.tooLong')

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
  const purpose = purposeText(input.purpose)
  if (purpose) tags.push(`S:${purpose}`)
  const reference = normalizeReference(input.model ?? '', input.reference ?? '')
  if (reference) tags.push(`RO:${(input.model || '00')}${reference}`)
  return tags.join('|')
}
