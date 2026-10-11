<script setup lang="ts">
/** Template intro, official portal, fees, payment choice and reference hints; the chosen payment is v-model. */
import type { PaymentTemplate } from '~/data/templates'

const props = defineProps<{ template: PaymentTemplate }>()
const active = defineModel<string>({ required: true })

const { t } = useI18n()
const l = useLocalized()

const payment = computed(() => props.template.payments.find(p => p.id === active.value))
const feesFrom = props.template.feesValidFrom?.split('-').reverse().join('.')
const rsd = (n: number) => `${n.toLocaleString('sr-RS')} RSD`
</script>

<template>
  <div class="details">
    <p class="lead">
      {{ l(template.intro) }}
    </p>

    <p v-if="template.officialPay">
      <a
        :href="template.officialPay.url"
        target="_blank"
        rel="noopener"
        class="btn"
        :class="{ primary: template.payments.length === 0 }"
      >{{ t('templatesPage.payAt', { portal: template.officialPay.label }) }} ↗</a>
    </p>

    <div
      v-if="template.fees?.length"
      class="table-scroll"
    >
      <table class="table fees">
        <caption>{{ t('templatesPage.fees', { date: feesFrom }) }}</caption>
        <tbody>
          <tr
            v-for="(f, i) in template.fees"
            :key="i"
          >
            <td>{{ l(f.label) }}</td>
            <td class="num">
              {{ rsd(f.amount) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <fieldset
      v-if="template.payments.length > 1"
      class="choice pills"
    >
      <legend>{{ t('form.payment') }}</legend>
      <label
        v-for="(p, i) in template.payments"
        :key="p.id"
        class="chip"
      >
        <input
          v-model="active"
          type="radio"
          class="sr-only"
          name="template-payment"
          :value="p.id"
        >
        {{ i + 1 }}. {{ l(p.label) }}
      </label>
    </fieldset>

    <div
      v-if="payment && (payment.referenceHint || payment.amountNote || payment.referenceTool === 'rat')"
      class="note neutral"
    >
      <dl
        v-if="payment.referenceHint || payment.amountNote"
        class="hints"
      >
        <template v-if="payment.referenceHint">
          <dt>{{ t('slip.reference') }}</dt>
          <dd>{{ l(payment.referenceHint) }}</dd>
        </template>
        <template v-if="payment.amountNote">
          <dt>{{ t('slip.amount') }}</dt>
          <dd>{{ l(payment.amountNote) }}</dd>
        </template>
      </dl>
      <RatReference v-if="payment.referenceTool === 'rat'" />
    </div>
  </div>
</template>

<style scoped>
.details { display: grid; gap: var(--s-4); }
.details > * { margin: 0; }
.fees { max-width: 640px; }
.hints { display: grid; grid-template-columns: max-content 1fr; gap: var(--s-2) var(--s-4); margin: 0; font-size: var(--fs-sm); }
.hints dt { color: var(--text-muted); font-weight: var(--fw-semibold); }
.hints dd { margin: 0; }
@media (max-width: 599.98px) {
  .hints { grid-template-columns: 1fr; gap: 2px; }
  .hints dd + dt { margin-top: var(--s-2); }
}
</style>
