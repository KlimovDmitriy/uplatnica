<script setup lang="ts">
import type { SlipForm } from '~/composables/useSlip'

const { t } = useI18n()
const { form, fieldError } = useSlip()

const FIELDS: [keyof SlipForm, string][] = [
  ['payer', 'slip.payer'],
  ['payee', 'slip.payee'],
  ['purpose', 'slip.purpose'],
  ['paymentCode', 'slip.paymentCode'],
  ['amount', 'slip.amount'],
  ['account', 'slip.payeeAccount'],
  ['model', 'slip.model'],
  ['reference', 'slip.reference'],
]

/** The drawing clips what the QR would still carry: lines beyond the third and lines wider than the box. */
function layoutError(field: keyof SlipForm): string | undefined {
  const box = slipBoxes(form.value.kind).find(b => b.key === field && b.multiline)
  const problem = box && slipTextProblem(String(form.value[field]), box.w)
  return problem ? `layout.${problem}` : undefined
}

const problems = computed(() => FIELDS
  .map(([field, label]) => {
    const e = fieldError(field) ?? layoutError(field)
    return e && { field, label: t(label), text: t(`errors.${e}`, { max: LIMITS[field as keyof typeof LIMITS] }), code: e }
  })
  .filter(Boolean) as { field: keyof SlipForm, label: string, text: string, code: string }[])

/** Control digits can only be computed for a digits-only body (letters have no model 97 value). */
const referenceBody = computed(() => form.value.reference.replace(/[\s-]/g, ''))
const canAddControl = computed(() => /^\d+$/.test(referenceBody.value))

function fixControl() {
  if (canAddControl.value) form.value.reference = model97Control(referenceBody.value) + referenceBody.value
}
</script>

<template>
  <ul
    v-if="problems.length"
    class="errors"
    role="alert"
  >
    <li
      v-for="p in problems"
      :key="p.field"
    >
      <b>{{ p.label }}:</b> {{ p.text }}
      <button
        v-if="p.code === 'reference.checksum' && canAddControl"
        type="button"
        class="link"
        @click="fixControl"
      >
        {{ t('form.addControl') }}
      </button>
    </li>
  </ul>
</template>

<style scoped>
.errors { margin: 0; padding: 8px 12px 8px 28px; border: 1px solid #000; font-size: 13px; }
.errors li + li { margin-top: 2px; }
</style>
