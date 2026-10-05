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
const { form, script, ipsString, fieldError } = useSlip()

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

const caption = (b: SlipBox) => slipLabels('latn')[b.caption]
</script>

<template>
  <div class="editor">
    <div
      class="paper"
      v-html="background"
    />
    <template
      v-for="b in boxes"
      :key="b.key"
    >
      <textarea
        v-if="b.multiline"
        v-model="form[b.key] as string"
        class="cell multi"
        :class="{ invalid: fieldError(b.key) }"
        :style="pos(b)"
        :aria-label="caption(b)"
        :placeholder="b.key === 'payee' ? t('form.payeePlaceholder') : b.key === 'payer' ? t('form.payerPlaceholder') : ''"
        rows="3"
        spellcheck="false"
      />
      <input
        v-else
        v-model="form[b.key] as string"
        class="cell"
        :class="{ invalid: fieldError(b.key), mono: b.mono, end: b.anchor === 'end' }"
        :style="pos(b)"
        :aria-label="caption(b)"
        :placeholder="PLACEHOLDER[b.key] ?? ''"
        :list="b.key === 'paymentCode' ? 'slip-codes' : b.key === 'model' || b.key === 'debitModel' ? 'slip-models' : undefined"
        :inputmode="b.key === 'amount' ? 'decimal' : b.key === 'purpose' ? 'text' : 'numeric'"
        :maxlength="b.key === 'paymentCode' ? 3 : b.key === 'model' || b.key === 'debitModel' ? 2 : undefined"
        autocomplete="off"
        spellcheck="false"
      >
    </template>
    <button
      v-if="form.kind === 'prenos'"
      type="button"
      class="urgent"
      :aria-pressed="form.urgent"
      :aria-label="t('slip.urgent')"
      @click="form.urgent = !form.urgent"
    >
      {{ form.urgent ? '×' : '' }}
    </button>

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
  border: 1px solid #bbb;
  background: #fff;
}
.paper { position: absolute; inset: 0; line-height: 0; }
.paper :deep(svg) { width: 100%; height: 100%; display: block; }

.cell {
  position: absolute;
  margin: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
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
.cell:hover { background: rgb(0 0 0 / .03); }
.cell:focus { outline: none; background: rgb(0 0 0 / .06); }
.cell.invalid { outline: 2px solid #000; outline-offset: -2px; }
.cell::placeholder { color: #aaa; font-weight: 400; }

.urgent {
  position: absolute;
  left: calc(117 / 210 * 100%);
  top: calc(7.8 / 99 * 100%);
  width: calc(3.4 / 210 * 100%);
  height: calc(3.4 / 99 * 100%);
  padding: 0; border: 0; background: transparent; cursor: pointer;
  font-size: calc(3.4 * var(--u)); line-height: 1; color: #000;
}
</style>
