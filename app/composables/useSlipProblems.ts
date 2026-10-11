import type { SlipForm, SlipKind } from './useSlip'

/** i18n key of a slip field's label; the wording follows the slip kind (payer or debtor, …). */
export function slipFieldLabel(field: keyof SlipForm, kind: SlipKind): string {
  const prenos = kind === 'prenos'
  const KEYS: Record<keyof SlipForm, string> = {
    kind: 'kind',
    payer: prenos ? 'debtor' : 'payer',
    purpose: prenos ? 'purposeTransfer' : 'purpose',
    payee: prenos ? 'creditor' : 'payee',
    paymentCode: 'paymentCode',
    amount: 'amount',
    account: prenos ? 'creditorAccount' : 'payeeAccount',
    model: prenos ? 'modelCredit' : 'model',
    reference: prenos ? 'referenceCredit' : 'reference',
    payerAccount: 'debtorAccount',
    debitModel: 'modelDebit',
    debitReference: 'referenceDebit',
    urgent: 'urgent',
  }
  return `slip.${KEYS[field]}`
}

const FIELDS: (keyof SlipForm)[] = ['payer', 'payee', 'purpose', 'paymentCode', 'amount', 'account', 'model', 'reference']

export interface SlipProblem { field: keyof SlipForm, label: string, text: string, code: string }

/**
 * What the error summary lists: IPS validation errors plus text the drawing would clip (lines beyond
 * the third, lines wider than the box). The fields use it for aria-invalid / aria-describedby.
 */
export function useSlipProblems() {
  const { t } = useI18n()
  const { form, fieldError } = useSlip()

  function layoutError(field: keyof SlipForm): string | undefined {
    const box = slipBoxes(form.value.kind).find(b => b.key === field && b.multiline)
    const problem = box && slipTextProblem(String(form.value[field]), box.w)
    return problem ? `layout.${problem}` : undefined
  }

  const problems = computed(() => FIELDS
    .map((field) => {
      const e = fieldError(field) ?? layoutError(field)
      return e && {
        field,
        label: t(slipFieldLabel(field, form.value.kind)),
        text: t(`errors.${e}`, { max: LIMITS[field as keyof typeof LIMITS] }),
        code: e,
      }
    })
    .filter(Boolean) as SlipProblem[])

  const problemFor = (field: keyof SlipForm) => problems.value.find(p => p.field === field)

  return { problems, problemFor }
}

/** id of a field's entry in the error summary (aria-describedby target). */
export const slipErrorId = (field: keyof SlipForm) => `err-${field}`
