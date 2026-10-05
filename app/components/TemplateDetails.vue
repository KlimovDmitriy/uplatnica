<script setup lang="ts">
/** Template intro, official portal, fees, payment tabs and reference hints; the chosen payment is v-model. */
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
        class="btn primary"
      >{{ t('templatesPage.payAt', { portal: template.officialPay.label }) }} ↗</a>
    </p>

    <table
      v-if="template.fees?.length"
      class="fees"
    >
      <caption>{{ t('templatesPage.fees', { date: feesFrom }) }}</caption>
      <tbody>
        <tr
          v-for="(f, i) in template.fees"
          :key="i"
        >
          <td>{{ l(f.label) }}</td>
          <td class="mono">
            {{ rsd(f.amount) }}
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="template.payments.length > 1"
      class="payments"
      role="tablist"
    >
      <button
        v-for="(p, i) in template.payments"
        :key="p.id"
        type="button"
        role="tab"
        :aria-selected="active === p.id"
        @click="active = p.id"
      >
        {{ i + 1 }}. {{ l(p.label) }}
      </button>
    </div>

    <template v-if="payment">
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
    </template>
  </div>
</template>

<style scoped>
.details { display: grid; gap: 14px; }
.details > * { margin: 0; }
.fees { border-collapse: collapse; width: 100%; max-width: 600px; font-size: 14.5px; }
.fees caption { text-align: left; color: var(--muted); font-size: 13px; padding-bottom: 6px; }
.fees td { padding: 6px 0; border-bottom: 1px solid var(--border); }
.fees td.mono { text-align: right; white-space: nowrap; }
.payments { display: flex; flex-wrap: wrap; gap: 4px 20px; border-bottom: 1px solid var(--border); }
.payments button {
  border: 0; background: none; font: inherit; font-size: 14px; color: var(--muted); cursor: pointer;
  padding: 0 0 8px; margin-bottom: -1px; border-bottom: 2px solid transparent;
}
.payments button[aria-selected="true"] { color: var(--text); border-bottom-color: var(--text); }
.hints { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; font-size: 14px; }
.hints dt { color: var(--muted); }
.hints dd { margin: 0; }
</style>
