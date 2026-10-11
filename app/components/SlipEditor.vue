<script setup lang="ts">
/**
 * The slip itself is the form: the blank drawing (renderSlipSvg without values) with
 * transparent inputs placed over its boxes. Used on screens wide enough to type into it.
 */
import type { SlipBox } from '~/utils/slipSvg'
import type { SlipForm } from '~/composables/useSlip'
import { PAYMENT_CODES } from '~/data/paymentCodes'

const { t } = useI18n()
const l = useLocalized()
const { form, script, ipsString } = useSlip()
const { problemFor } = useSlipProblems()

const background = computed(() => renderSlipSvg(form.value, script.value, ipsString.value, false))
const boxes = computed(() => slipBoxes(form.value.kind).filter(b => b.key !== 'currency') as (SlipBox & { key: keyof SlipForm })[])

const PLACEHOLDER: Partial<Record<keyof SlipForm, string>> = {
  paymentCode: '289',
  amount: '0,00',
  account: '000-0000000000000-00',
  payerAccount: '000-0000000000000-00',
  model: '97',
}

const pos = (b: SlipBox) => ({
  left: `${(b.x / 210) * 100}%`,
  top: `${(b.y / 99) * 100}%`,
  width: `${(b.w / 210) * 100}%`,
  height: `${(b.h / 99) * 100}%`,
})

/** Translated label, kind-aware, with distinct labels for the two model fields of a "nalog za prenos". */
const label = (key: keyof SlipForm) => t(slipFieldLabel(key, form.value.kind))
const invalid = (key: keyof SlipForm) => (problemFor(key) ? 'true' : undefined)
const describedBy = (key: keyof SlipForm) => (problemFor(key) ? slipErrorId(key) : undefined)

/** Digits-only fields get the numeric keypad; references may contain letters and dashes. */
const NUMERIC = new Set<keyof SlipForm>(['paymentCode', 'account', 'payerAccount', 'model', 'debitModel'])
const inputMode = (key: keyof SlipForm) => (key === 'amount' ? 'decimal' : NUMERIC.has(key) ? 'numeric' : 'text')
</script>

<template>
  <div class="editor">
    <div
      class="paper"
      aria-hidden="true"
      v-html="background"
    />
    <template
      v-for="b in boxes"
      :key="b.key"
    >
      <!-- "Hitno" sits at the top of the right column, so it is tabbed to right before the payment code. -->
      <button
        v-if="b.key === 'paymentCode' && form.kind === 'prenos'"
        type="button"
        class="urgent"
        :aria-pressed="form.urgent"
        :aria-label="t('slip.urgent')"
        @click="form.urgent = !form.urgent"
      >
        {{ form.urgent ? '×' : '' }}
      </button>
      <textarea
        v-if="b.multiline"
        :id="`e-${b.key}`"
        v-model="form[b.key] as string"
        class="cell multi"
        :aria-invalid="invalid(b.key)"
        :aria-describedby="describedBy(b.key)"
        :style="pos(b)"
        :aria-label="label(b.key)"
        :placeholder="b.key === 'payee' ? t('form.payeePlaceholder') : b.key === 'payer' ? t('form.payerPlaceholder') : ''"
        rows="3"
        spellcheck="false"
      />
      <input
        v-else
        :id="`e-${b.key}`"
        v-model="form[b.key] as string"
        class="cell"
        :class="{ mono: b.mono, end: b.anchor === 'end' }"
        :aria-invalid="invalid(b.key)"
        :aria-describedby="describedBy(b.key)"
        :style="pos(b)"
        :aria-label="label(b.key)"
        :placeholder="PLACEHOLDER[b.key] ?? ''"
        :list="b.key === 'paymentCode' ? 'slip-codes' : b.key === 'model' || b.key === 'debitModel' ? 'slip-models' : undefined"
        :inputmode="inputMode(b.key)"
        :maxlength="b.key === 'paymentCode' ? 3 : b.key === 'model' || b.key === 'debitModel' ? 2 : undefined"
        autocomplete="off"
        spellcheck="false"
      >
    </template>

    <datalist id="slip-codes">
      <option
        v-for="c in PAYMENT_CODES"
        :key="c.base"
        :value="`2${c.base}`"
      >
        {{ l(c.label) }}
      </option>
    </datalist>
    <datalist id="slip-models">
      <option value="97" />
      <option value="11" />
      <option value="00" />
    </datalist>
  </div>
</template>

<style scoped>
.editor {
  --u: calc(100cqw / 210);
  container-type: inline-size;
  position: relative;
  aspect-ratio: 210 / 99;
  border: 0;
  background: #fff;
  box-shadow: var(--shadow-paper);
}
.paper { position: absolute; inset: 0; line-height: 0; }
.paper :deep(svg) { width: 100%; height: 100%; display: block; }

.cell {
  position: absolute;
  margin: 0;
  min-height: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: rgb(29 91 191 / .05);
  transition: background-color .12s;
  color: #000;
  font-family: Arial, Helvetica, sans-serif;
  font-size: calc(3 * var(--u));
  line-height: calc(3.8 * var(--u));
  padding: calc(.6 * var(--u)) calc(1.2 * var(--u));
  resize: none;
  overflow: hidden;
}
.cell.mono { font-family: 'Courier New', monospace; font-weight: 700; }
.cell.end { text-align: right; }
.cell:hover { background: rgb(29 91 191 / .09); }
.cell:focus { outline: 2px solid var(--accent); outline-offset: -2px; background: #fff; box-shadow: none; }
/* Error: dashed red, so it never looks like the solid blue focus ring; focused + error is solid red. */
.cell[aria-invalid="true"] { outline: 2px dashed var(--error); outline-offset: -2px; background: rgb(180 35 24 / .06); }
.cell[aria-invalid="true"]:focus { outline-style: solid; background: #fff; }
.cell::placeholder { color: var(--text-muted); font-weight: 400; }

/* Centred on the drawn 3.4 mm box (x 117, y 7.8), with a hit area of at least 24 × 24 px. */
.urgent {
  position: absolute;
  left: calc(118.7 / 210 * 100%);
  top: calc(9.5 / 99 * 100%);
  width: max(24px, calc(3.4 * var(--u)));
  height: max(24px, calc(3.4 * var(--u)));
  transform: translate(-50%, -50%);
  display: grid; place-items: center;
  padding: 0; border: 0; border-radius: 2px; background: transparent; cursor: pointer;
  font-size: calc(3.4 * var(--u)); line-height: 1; color: #000;
}
.urgent:hover { background: rgb(29 91 191 / .09); }
.urgent:focus-visible { outline: 2px solid var(--accent); outline-offset: 0; }
</style>
