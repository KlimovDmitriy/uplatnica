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

const problems = computed(() => FIELDS
  .map(([field, label]) => {
    const e = fieldError(field)
    return e && { field, label: t(label), text: t(`errors.${e}`, { max: LIMITS[field as keyof typeof LIMITS] }), code: e }
  })
  .filter(Boolean) as { field: keyof SlipForm, label: string, text: string, code: string }[])

function fixControl() {
  const body = form.value.reference.replace(/[\s-]/g, '')
  if (/^\d+$/.test(body)) form.value.reference = model97Control(body) + body
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
        v-if="p.code === 'reference.checksum'"
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
