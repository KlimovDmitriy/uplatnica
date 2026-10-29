import type { IpsError, IpsInput } from '#shared/utils/ips'
import type { ReferenceRule } from '~/data/templates'

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

/**
 * Accepts "1.234,56", "1234,56", "1234.56" and "1 234". Dots are thousands separators only in
 * the "1.234" / "1.234,56" form; a single dot before 1–2 digits is a decimal point. Anything else
 * ("1234.567", "0.500", "1.23,45") is ambiguous and gives NaN instead of a 1000× wrong amount.
 */
export function parseAmount(raw: string): number {
  const s = raw.replace(/\s/g, '')
  if (/^[1-9]\d{0,2}(\.\d{3})+(,\d{1,2})?$/.test(s)) return Number(s.replace(/\./g, '').replace(',', '.'))
  if (/^\d+(,\d{1,2})?$/.test(s)) return Number(s.replace(',', '.'))
  if (/^\d+\.\d{1,2}$/.test(s)) return Number(s)
  return Number.NaN
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

/** Fields of `form` that differ from what `preset` puts on an empty slip, i.e. what the user typed. */
export function changedFields(form: SlipForm, preset: Partial<SlipForm> = {}): Partial<SlipForm> {
  const base: SlipForm = { ...emptyForm(), ...preset }
  return Object.fromEntries(
    Object.entries(form).filter(([key, value]) => value !== base[key as keyof SlipForm]),
  ) as Partial<SlipForm>
}

/** "#n=…" → the slip it carries; undefined when the hash is not a share link, null when the link is broken. */
export function slipFromHash(hash: string): Partial<SlipForm> | null | undefined {
  const data = new URLSearchParams(hash.replace(/^#/, '')).get(SHARE_PARAM)
  return data === null ? undefined : decodeSlip(data)
}

/** A slip from a shared link, waiting for the generator to show it (set by plugins/share-link.client.ts). */
export const useSharedSlip = () => useState<Partial<SlipForm> | null>('slip-shared', () => null)

export function useSlip() {
  const form = useState<SlipForm>('slip-form', emptyForm)
  const script = useState<SlipScript>('slip-script', () => 'latn')
  /** Set when the form was filled from a shared link, so the UI can say so. */
  const fromLink = useState<boolean>('slip-from-link', () => false)
  /** Set while the slip is a template payment whose reference may not stay empty; any other slip clears it. */
  const referenceRule = useState<ReferenceRule | null>('slip-reference-rule', () => null)
  const shared = useSharedSlip()
  const { editing } = useBatch()
  const router = useRouter()

  const ipsInput = computed(() => toIpsInput(form.value))

  const errors = computed<IpsError[]>(() => validateIps(ipsInput.value))
  const ipsString = computed(() => (errors.value.length ? '' : buildIpsString(ipsInput.value)))

  /** Error to show next to a field; stays silent while the field is empty. */
  function fieldError(field: keyof SlipForm): IpsError | undefined {
    if (!String(form.value[field]).trim()) return undefined
    return errors.value.find(e => e.startsWith(`${field}.`))
  }

  /**
   * Replaces the whole slip. This also ends editing a batch item (BatchPanel sets `editing` again
   * right after) and hides the "loaded from a link" note, so neither outlives the slip it was about.
   */
  function setForm(values: Partial<SlipForm> = {}, rule: ReferenceRule | null = null) {
    form.value = { ...emptyForm(), ...values }
    referenceRule.value = rule
    editing.value = null
    fromLink.value = false
  }

  function patch(values: Partial<SlipForm>) {
    form.value = { ...form.value, ...values }
  }

  const reset = () => setForm({ kind: form.value.kind })

  /** Link to the home page in the current route's language, with the slip in the hash. */
  function shareUrl(): string {
    const home = withLangPrefix(splitLangPrefix(router.currentRoute.value.path).code, '/')
    const url = new URL(router.resolve(home).href, window.location.origin)
    url.hash = `${SHARE_PARAM}=${encodeSlip(form.value)}`
    return url.toString()
  }

  /** Shows the slip of a pending shared link, if there is one. */
  function takeShared(): boolean {
    const slip = shared.value
    if (!slip) return false
    shared.value = null
    setForm(slip)
    fromLink.value = true
    return true
  }

  /**
   * Generator setup on the client. A shared link wins over everything, including a template preset.
   * With `persist` (home and tool pages) the slip otherwise comes from the local draft, or starts
   * blank rather than keeping what the previous page (a template) left, and edits are saved as the draft.
   */
  function restore(persist: boolean) {
    const save = () => {
      if (!persist) return
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form.value)) }
      catch { /* storage unavailable */ }
    }
    onMounted(() => {
      if (takeShared()) {
        save()
      }
      else if (persist) {
        let draft: Partial<SlipForm> | null = null
        try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null') }
        catch { /* storage unavailable or corrupted */ }
        setForm(draft ?? {})
      }
      // A link opened while this page is showing, e.g. pasted into the address bar.
      watch(shared, () => {
        if (takeShared()) save()
      })
      if (persist) watch(form, save, { deep: true })
    })
  }

  return { form, script, fromLink, referenceRule, errors, ipsString, fieldError, setForm, patch, reset, shareUrl, restore }
}

/**
 * For helpers that fill a few slip fields (reference builders). `write(values)` sets exactly
 * `values`; a field written earlier but missing from `values` goes back to what it was before the
 * helper first wrote it, unless the user has changed it since. Fields it never wrote stay untouched.
 */
export function useSlipWriter() {
  const { form, patch } = useSlip()
  const written: Record<string, unknown> = {}
  const before: Record<string, unknown> = {}

  function write(values: Partial<SlipForm>) {
    const current = form.value as unknown as Record<string, unknown>
    const next: Record<string, unknown> = {}
    for (const key of Object.keys(written)) {
      if (key in values) continue
      if (current[key] === written[key]) next[key] = before[key]
      delete written[key]
      delete before[key]
    }
    for (const [key, value] of Object.entries(values)) {
      if (!(key in written)) before[key] = current[key]
      written[key] = value
      if (current[key] !== value) next[key] = value
    }
    if (Object.keys(next).length) patch(next as Partial<SlipForm>)
  }

  return { write }
}
