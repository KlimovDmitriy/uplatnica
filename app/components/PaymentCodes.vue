<script setup lang="ts">
import { PAYMENT_CODES, PAYMENT_CODES_SOURCE } from '~/data/paymentCodes'

const { t } = useI18n()
const l = useLocalized()

const query = ref('')
const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'dj')
const rows = computed(() => {
  const q = normalize(query.value.trim())
  if (!q) return PAYMENT_CODES
  const digits = q.replace(/\D/g, '')
  return PAYMENT_CODES.filter(c =>
    (digits && (digits.length >= 3 ? c.base === digits.slice(1, 3) : c.base.startsWith(digits)))
    || normalize(l(c.label)).includes(q) || normalize(c.label.sr).includes(q))
})
</script>

<template>
  <div>
    <p class="legend">
      <span><b class="mono">1xx</b> {{ t('codesPage.cash') }}</span>
      <span><b class="mono">2xx</b> {{ t('codesPage.nonCash') }}</span>
      <span><b class="mono">3xx</b> {{ t('codesPage.settlement') }}</span>
    </p>

    <input
      v-model="query"
      type="search"
      class="search"
      :placeholder="t('codesPage.search')"
      :aria-label="t('codesPage.search')"
    >

    <div class="table-scroll">
      <table class="table codes">
      <thead>
        <tr>
          <th>{{ t('codesPage.nonCashShort') }}</th>
          <th>{{ t('codesPage.cashShort') }}</th>
          <th>{{ t('codesPage.basis') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in rows"
          :key="c.base"
        >
          <td class="mono code">
            <b>2{{ c.base }}</b>
          </td>
          <td class="mono code muted">
            1{{ c.base }}
          </td>
          <td>{{ l(c.label) }}</td>
        </tr>
      </tbody>
      </table>
    </div>
    <p
      v-if="!rows.length"
      class="muted"
    >
      {{ t('codesPage.nothing') }}
    </p>
    <p class="source">
      <a
        :href="PAYMENT_CODES_SOURCE"
        target="_blank"
        rel="noopener"
      >{{ t('codesPage.source') }}</a>
    </p>

    <article class="prose">
      <h2>{{ t('faq.title') }}</h2>
      <template
        v-for="k in ['first', 'which', 'wrong']"
        :key="k"
      >
        <h3>{{ t(`codesPage.faq.${k}.q`) }}</h3>
        <p>{{ t(`codesPage.faq.${k}.a`) }}</p>
      </template>
    </article>
  </div>
</template>

<style scoped>
.legend { display: flex; flex-wrap: wrap; gap: 6px 20px; margin: 0 0 var(--s-4); font-size: var(--fs-sm); color: var(--text-muted); }
.legend b { color: var(--text); }
.search { margin-bottom: var(--s-3); }
.codes td.code { width: 64px; white-space: nowrap; }
.source { font-size: var(--fs-sm); margin: var(--s-3) 0 var(--s-6); }
.source a { display: inline-flex; align-items: center; min-height: 24px; color: var(--text-muted); }
</style>
