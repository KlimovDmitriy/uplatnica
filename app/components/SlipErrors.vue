<script setup lang="ts">
import type { SlipForm } from '~/composables/useSlip'

const { t } = useI18n()
const { form } = useSlip()
const { problems } = useSlipProblems()
const errorId = slipErrorId

/** Control digits can only be computed for a digits-only body (letters have no model 97 value). */
const referenceBody = computed(() => form.value.reference.replace(/[\s-]/g, ''))
const canAddControl = computed(() => /^\d+$/.test(referenceBody.value))

/** Focuses the field in whichever is shown: the slip editor (e-*) or the stacked form (f-*). */
function focusField(field: keyof SlipForm) {
  const el = [`e-${field}`, `f-${field}`]
    .map(id => document.getElementById(id))
    .find(e => e && e.offsetParent !== null)
  el?.focus()
}

function fixControl() {
  if (canAddControl.value) form.value.reference = model97Control(referenceBody.value) + referenceBody.value
}
</script>

<template>
  <div aria-live="polite">
    <div
      v-if="problems.length"
      class="error-summary"
    >
      <p class="title">
        {{ t('errors.summary') }}
      </p>
      <ul>
        <li
          v-for="p in problems"
          :key="p.field"
        >
          <button
            type="button"
            class="link"
            @click="focusField(p.field)"
          >
            {{ p.label }}</button>: <span :id="errorId(p.field)">{{ p.text }}</span>
          <button
            v-if="p.code === 'reference.checksum' && canAddControl"
            type="button"
            class="btn small fix"
            @click="fixControl"
          >
            {{ t('form.addControl') }}
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.fix { margin-left: var(--s-2); vertical-align: middle; }
</style>
