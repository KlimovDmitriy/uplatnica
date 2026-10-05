import type { IpsError, IpsInput } from '#shared/utils/ips'

export type SlipKind = 'uplata' | 'prenos'
export type SlipScript = 'latn' | 'cyrl'

export interface SlipForm {
  kind: SlipKind
  payer: string
  purpose: string
  payee: string
  paymentCode: string
  amount: string
  account: string
  model: string
  reference: string
  // Nalog za prenos only
  payerAccount: string
  debitModel: string
  debitReference: string
  urgent: boolean
}

const DRAFT_KEY = 'uplatnica:draft:v1'

export const emptyForm = (): SlipForm => ({
  kind: 'uplata',
  payer: '',
  purpose: '',
  payee: '',
  paymentCode: '189',
  amount: '',
  account: '',
  model: '97',
  reference: '',
  payerAccount: '',
  debitModel: '',
  debitReference: '',
  urgent: false,
})


/** Accepts "1.234,56", "1234,56", "1234.56" and "1 234". */
export function parseAmount(raw: string): number {
  let s = raw.replace(/[\s ]/g, '')
  if (!s) return Number.NaN
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
  else if (/\.\d{3}(\.|$)/.test(s)) s = s.replace(/\./g, '')
  return /^\d+(\.\d{1,2})?$/.test(s) ? Number(s) : Number.NaN
}

/** 1234.5 → "1.234,50" (Serbian notation used in the form). */
export function formatAmount(n: number): string {
  return Number.isFinite(n) ? n.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''
}

export function formFromIps(input: IpsInput): Partial<SlipForm> {
  return {
    account: input.account,
    payee: input.payee,
    amount: formatAmount(input.amount),
    payer: input.payer ?? '',
    paymentCode: input.paymentCode,
    purpose: input.purpose ?? '',
    model: input.model ?? '',
    reference: input.reference ?? '',
  }
}

export function toIpsInput(form: SlipForm): IpsInput {
  return {
    account: form.account,
    payee: form.payee,
    amount: parseAmount(form.amount),
    payer: form.payer,
    paymentCode: form.paymentCode,
    purpose: form.purpose,
    model: form.model,
    reference: form.reference,
  }
}

/** IPS payload for a slip, or '' while it is incomplete. */
export function slipIps(form: SlipForm): string {
  const input = toIpsInput(form)
  return validateIps(input).length ? '' : buildIpsString(input)
}

export function useSlip() {
  const form = useState<SlipForm>('slip-form', emptyForm)
  const script = useState<SlipScript>('slip-script', () => 'latn')
  /** Set when the form was filled from a shared link, so the UI can say so. */
  const fromLink = useState<boolean>('slip-from-link', () => false)

  const ipsInput = computed(() => toIpsInput(form.value))

  const errors = computed<IpsError[]>(() => validateIps(ipsInput.value))
  const ipsString = computed(() => (errors.value.length ? '' : buildIpsString(ipsInput.value)))

  /** Error to show next to a field; stays silent while the field is empty. */
  function fieldError(field: keyof SlipForm): IpsError | undefined {
    if (!String(form.value[field]).trim()) return undefined
    return errors.value.find(e => e.startsWith(`${field}.`))
  }

  function setForm(values: Partial<SlipForm> = {}) {
    form.value = { ...emptyForm(), ...values }
  }

  function patch(values: Partial<SlipForm>) {
    form.value = { ...form.value, ...values }
  }

  const reset = () => setForm({ kind: form.value.kind })

  function shareUrl(): string {
    const url = new URL(window.location.href)
    url.hash = `${SHARE_PARAM}=${encodeSlip(form.value)}`
    return url.toString()
  }

  /**
   * Main generator page only: restores the slip from a shared link or the local draft,
   * then keeps the draft in localStorage.
   */
  function persistDraft() {
    onMounted(() => {
      const shared = new URLSearchParams(window.location.hash.slice(1)).get(SHARE_PARAM)
      const fromHash = shared ? decodeSlip(shared) : null
      if (fromHash) {
        setForm(fromHash)
        fromLink.value = true
        // Saved right away, so a remount (e.g. switching language) keeps the shared slip.
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form.value)) }
        catch { /* storage unavailable */ }
        history.replaceState(history.state, '', window.location.pathname + window.location.search)
      }
      else {
        try {
          const saved = localStorage.getItem(DRAFT_KEY)
          if (saved) setForm(JSON.parse(saved))
        }
        catch { /* storage unavailable */ }
      }
      watch(form, (v) => {
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(v)) }
        catch { /* storage unavailable */ }
      }, { deep: true })
    })
  }

  return { form, script, fromLink, errors, ipsString, fieldError, setForm, patch, reset, shareUrl, persistDraft }
}
