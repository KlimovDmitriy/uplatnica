<script setup lang="ts">
/** Plain stacked form for narrow screens, where the slip is too small to type into. */
import type { SlipForm } from '~/composables/useSlip'
import { PAYMENT_CODES } from '~/data/paymentCodes'

const { t } = useI18n()
const l = useLocalized()
const { form } = useSlip()
const { problemFor } = useSlipProblems()

const isPrenos = computed(() => form.value.kind === 'prenos')
const label = (f: keyof SlipForm) => t(slipFieldLabel(f, form.value.kind))
/** aria-invalid / aria-describedby: present only on fields listed in the error summary. */
const invalid = (f: keyof SlipForm) => (problemFor(f) ? 'true' : undefined)
const describedBy = (f: keyof SlipForm) => (problemFor(f) ? slipErrorId(f) : undefined)
</script>

<template>
  <form
    class="slip-form"
    novalidate
    @submit.prevent
  >
    <label class="field">{{ label('payer') }}
      <textarea
        id="f-payer"
        v-model="form.payer"
        rows="3"
        enterkeyhint="next"
        :aria-invalid="invalid('payer')"
        :aria-describedby="describedBy('payer')"
      /></label>
    <label class="field">{{ label('purpose') }}
      <input
        id="f-purpose"
        v-model="form.purpose"
        enterkeyhint="next"
        :aria-invalid="invalid('purpose')"
        :aria-describedby="describedBy('purpose')"
      ></label>
    <label class="field">{{ label('payee') }}
      <textarea
        id="f-payee"
        v-model="form.payee"
        rows="3"
        enterkeyhint="next"
        :aria-invalid="invalid('payee')"
        :aria-describedby="describedBy('payee')"
      /></label>
    <div class="row">
      <label class="field code">{{ label('paymentCode') }}
        <input
          id="f-paymentCode"
          v-model="form.paymentCode"
          class="mono"
          list="form-codes"
          inputmode="numeric"
          maxlength="3"
          enterkeyhint="next"
          :aria-invalid="invalid('paymentCode')"
          :aria-describedby="describedBy('paymentCode')"
        ></label>
      <label class="field grow">{{ label('amount') }}, RSD
        <input
          id="f-amount"
          v-model="form.amount"
          inputmode="decimal"
          placeholder="0,00"
          enterkeyhint="next"
          :aria-invalid="invalid('amount')"
          :aria-describedby="describedBy('amount')"
        ></label>
    </div>
    <template v-if="isPrenos">
      <label class="field">{{ label('payerAccount') }}
        <input
          id="f-payerAccount"
          v-model="form.payerAccount"
          class="mono"
          inputmode="numeric"
          enterkeyhint="next"
        ></label>
      <div class="row">
        <label class="field code">{{ label('debitModel') }}
          <input
            id="f-debitModel"
            v-model="form.debitModel"
            class="mono"
            inputmode="numeric"
            maxlength="2"
            enterkeyhint="next"
          ></label>
        <label class="field grow">{{ label('debitReference') }}
          <input
            id="f-debitReference"
            v-model="form.debitReference"
            class="mono"
            inputmode="text"
            enterkeyhint="next"
          ></label>
      </div>
    </template>
    <label class="field">{{ label('account') }}
      <input
        id="f-account"
        v-model="form.account"
        class="mono"
        inputmode="numeric"
        placeholder="000-0000000000000-00"
        enterkeyhint="next"
        :aria-invalid="invalid('account')"
        :aria-describedby="describedBy('account')"
      ></label>
    <div class="row">
      <label class="field code">{{ label('model') }}
        <input
          id="f-model"
          v-model="form.model"
          class="mono"
          inputmode="numeric"
          maxlength="2"
          enterkeyhint="next"
          :aria-invalid="invalid('model')"
          :aria-describedby="describedBy('model')"
        ></label>
      <label class="field grow">{{ label('reference') }}
        <input
          id="f-reference"
          v-model="form.reference"
          class="mono"
          inputmode="text"
          enterkeyhint="next"
          :aria-invalid="invalid('reference')"
          :aria-describedby="describedBy('reference')"
        ></label>
    </div>
    <label
      v-if="isPrenos"
      class="check"
    ><input
      v-model="form.urgent"
      type="checkbox"
    > {{ label('urgent') }}</label>

    <datalist id="form-codes">
      <option
        v-for="c in PAYMENT_CODES"
        :key="c.base"
        :value="`2${c.base}`"
      >
        {{ l(c.label) }}
      </option>
    </datalist>
  </form>
</template>

<style scoped>
.slip-form { display: grid; gap: var(--s-4); max-width: 600px; }
.row { display: flex; gap: var(--s-3); align-items: end; }
.code { width: 88px; flex: none; }
.grow { flex: 1; min-width: 0; }
</style>
