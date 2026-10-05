<script setup lang="ts">
/** Plain stacked form for narrow screens, where the slip is too small to type into. */
import type { SlipForm } from '~/composables/useSlip'
import { PAYMENT_CODES } from '~/data/paymentCodes'

const { t } = useI18n()
const l = useLocalized()
const { form, fieldError } = useSlip()

const isPrenos = computed(() => form.value.kind === 'prenos')
const invalid = (f: keyof SlipForm) => !!fieldError(f)
</script>

<template>
  <form
    class="slip-form"
    novalidate
    @submit.prevent
  >
    <label>{{ t(isPrenos ? 'slip.debtor' : 'slip.payer') }}
      <textarea
        v-model="form.payer"
        rows="3"
        :class="{ invalid: invalid('payer') }"
      /></label>
    <label>{{ t(isPrenos ? 'slip.purposeTransfer' : 'slip.purpose') }}
      <input
        v-model="form.purpose"
        :class="{ invalid: invalid('purpose') }"
      ></label>
    <label>{{ t(isPrenos ? 'slip.creditor' : 'slip.payee') }}
      <textarea
        v-model="form.payee"
        rows="3"
        :class="{ invalid: invalid('payee') }"
      /></label>
    <div class="row">
      <label class="code">{{ t('slip.paymentCode') }}
        <input
          v-model="form.paymentCode"
          list="form-codes"
          inputmode="numeric"
          maxlength="3"
          :class="{ invalid: invalid('paymentCode') }"
        ></label>
      <label class="grow">{{ t('slip.amount') }}, RSD
        <input
          v-model="form.amount"
          inputmode="decimal"
          placeholder="0,00"
          :class="{ invalid: invalid('amount') }"
        ></label>
    </div>
    <template v-if="isPrenos">
      <label>{{ t('slip.debtorAccount') }}
        <input
          v-model="form.payerAccount"
          inputmode="numeric"
        ></label>
      <div class="row">
        <label class="code">{{ t('slip.model') }}
          <input
            v-model="form.debitModel"
            inputmode="numeric"
            maxlength="2"
          ></label>
        <label class="grow">{{ t('slip.referenceDebit') }}
          <input v-model="form.debitReference"></label>
      </div>
    </template>
    <label>{{ t(isPrenos ? 'slip.creditorAccount' : 'slip.payeeAccount') }}
      <input
        v-model="form.account"
        inputmode="numeric"
        placeholder="000-0000000000000-00"
        :class="{ invalid: invalid('account') }"
      ></label>
    <div class="row">
      <label class="code">{{ t('slip.model') }}
        <input
          v-model="form.model"
          inputmode="numeric"
          maxlength="2"
          :class="{ invalid: invalid('model') }"
        ></label>
      <label class="grow">{{ t(isPrenos ? 'slip.referenceCredit' : 'slip.reference') }}
        <input
          v-model="form.reference"
          :class="{ invalid: invalid('reference') }"
        ></label>
    </div>
    <label
      v-if="isPrenos"
      class="check"
    ><input
      v-model="form.urgent"
      type="checkbox"
    > {{ t('slip.urgent') }}</label>

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
.slip-form { display: grid; gap: 10px; }
label { display: grid; gap: 3px; font-size: 13px; }
.row { display: flex; gap: 10px; }
.code { width: 80px; flex: none; }
.grow { flex: 1; min-width: 0; }
.check { display: flex; gap: 6px; align-items: center; }
.invalid { border-color: #000; outline: 1px solid #000; }
</style>
