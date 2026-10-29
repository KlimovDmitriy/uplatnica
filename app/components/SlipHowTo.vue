<script setup lang="ts">
/**
 * "How to fill in the slip", collapsed below the generator. Home: the slip fields step by step and
 * what the IPS QR code holds (texts in i18n `howTo`). Template page: the fields of each payment,
 * generated from its preset, referenceHint and amountNote in data/templates.ts.
 */
import type { PaymentTemplate } from '~/data/templates'

const props = defineProps<{ template?: PaymentTemplate }>()
const { t, locale } = useI18n()
const l = useLocalized()

const STEPS = ['payer', 'payee', 'code', 'amount', 'account', 'reference'] as const

// Values go on the slip as they are; the Cyrillic interface prints the slip in Cyrillic.
const onSlip = (s: string) => (locale.value === 'sr-cyrl' ? toCyrillic(s) : s)
// Presets leave gaps for what the payer adds ("Porez paušal za ", "za  . tromesečje"); line breaks stay.
const gaps = (s: string) => s.replace(/ {2,}\.?/g, ' … ').replace(/ +$/, ' …')

const payments = computed(() => (props.template?.payments ?? []).map(p => ({
  id: p.id,
  label: l(p.label),
  rows: [
    p.preset.kind && [t('howTo.kind'), t(`kinds.${p.preset.kind}.title`)],
    p.preset.payee && [t('slip.payee'), onSlip(gaps(p.preset.payee))],
    p.preset.account && [t('slip.payeeAccount'), p.preset.account],
    p.preset.paymentCode && [t('slip.paymentCode'), p.preset.paymentCode],
    p.preset.model && [t('slip.model'), p.preset.model],
    p.preset.purpose && [t('slip.purpose'), onSlip(gaps(p.preset.purpose))],
    (p.preset.amount || p.amountNote) && [t('slip.amount'), [p.preset.amount && `${p.preset.amount} RSD`, p.amountNote && l(p.amountNote)].filter(Boolean).join('. ')],
    p.referenceHint && [t('slip.reference'), l(p.referenceHint)],
  ].filter((r): r is [string, string] => !!r),
})))
</script>

<template>
  <div
    v-if="!template || payments.length"
    class="tools card howto"
  >
    <details>
      <summary>
        <!-- A real <h2> inside <summary> loses its heading role in screen readers. -->
        <span
          class="title"
          role="heading"
          aria-level="2"
        >{{ template ? t('howTo.templateTitle') : t('howTo.title') }}</span>
      </summary>
      <div class="tool-body prose">
        <template v-if="template">
          <div
            v-for="p in payments"
            :key="p.id"
          >
            <h3
              v-if="payments.length > 1"
              class="label"
            >
              {{ p.label }}
            </h3>
            <dl class="fields">
              <template
                v-for="[name, value] in p.rows"
                :key="name"
              >
                <dt>{{ name }}</dt>
                <dd>{{ value }}</dd>
              </template>
            </dl>
          </div>
        </template>
        <template v-else>
          <ol>
            <li
              v-for="k in STEPS"
              :key="k"
            >
              <strong>{{ t(`howTo.steps.${k}.title`) }}.</strong> {{ t(`howTo.steps.${k}.text`) }}
            </li>
          </ol>
          <h3 class="label">
            {{ t('howTo.ipsTitle') }}
          </h3>
          <p>{{ t('howTo.ipsText') }}</p>
        </template>
      </div>
    </details>
  </div>
</template>

<style scoped>
.label { margin: var(--s-4) 0 var(--s-2); font-size: var(--fs-md); }
.tool-body > :first-child, .tool-body > div:first-child .label { margin-top: 0; }
.fields { display: grid; grid-template-columns: max-content 1fr; gap: var(--s-2) var(--s-4); margin: 0; }
.fields dt { color: var(--text-muted); font-weight: var(--fw-semibold); }
.fields dd { margin: 0; min-width: 0; overflow-wrap: anywhere; white-space: pre-line; }
@media (max-width: 599.98px) {
  .fields { grid-template-columns: 1fr; gap: 2px; }
  .fields dd + dt { margin-top: var(--s-2); }
}
</style>
