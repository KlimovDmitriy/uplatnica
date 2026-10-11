<script setup lang="ts">
import { BANK_CODES } from '~/data/bankCodes'

const { t } = useI18n()

const input = ref('')
const account = computed(() => normalizeAccount(input.value))
const valid = computed(() => !!account.value && isAccountChecksumValid(account.value))
const bank = computed(() => {
  const code = account.value?.slice(0, 3) ?? input.value.replace(/\D/g, '').slice(0, 3)
  return code.length === 3 ? BANK_CODES.find(b => b.code === code) : undefined
})
/** Correct control digits when the user typed a wrong or missing pair. */
const expected = computed(() => {
  if (!account.value || valid.value) return ''
  const body = account.value.slice(0, 16)
  return String(98 - Number(BigInt(`${body}00`) % BigInt(97))).padStart(2, '0')
})
</script>

<template>
  <div>
    <section class="card tool">
      <FormField
        id="acc"
        :label="t('slip.payeeAccount')"
        :hint="t('form.accountHint')"
      >
        <input
          id="acc"
          v-model="input"
          class="mono"
          :aria-invalid="input.trim() && !valid ? 'true' : undefined"
          :aria-describedby="input.trim() && !valid ? 'acc-verdict acc-hint' : 'acc-hint'"
          type="text"
          inputmode="numeric"
          placeholder="160-5100000000-02"
        >
      </FormField>

      <div
        class="result"
        aria-live="polite"
      >
        <template v-if="input.trim()">
          <p
            id="acc-verdict"
            class="verdict"
            :class="valid ? 'ok' : 'bad'"
          >
            <template v-if="!account">
              ✕ {{ t('errors.account.invalid') }}
            </template>
            <template v-else-if="valid">
              ✓ {{ t('accountPage.valid') }}
            </template>
            <template v-else>
              ✕ {{ t('accountPage.invalid', { control: expected }) }}
            </template>
          </p>
          <dl>
            <template v-if="account">
              <dt>{{ t('accountPage.full') }}</dt>
              <dd class="mono">
                {{ formatAccount(account) }}
              </dd>
              <dt>{{ t('accountPage.digits') }}</dt>
              <dd class="mono">
                {{ account }}
              </dd>
            </template>
            <dt>{{ t('accountPage.bank') }}</dt>
            <dd>{{ bank?.name ?? t('accountPage.unknownBank') }}</dd>
          </dl>
        </template>
      </div>
    </section>

    <section
      v-if="BANK_CODES.length"
      class="banks"
    >
      <h2>{{ t('accountPage.banksTitle') }}</h2>
      <div class="table-scroll">
        <table class="table">
          <tbody>
            <tr
              v-for="b in BANK_CODES"
              :key="b.code"
            >
              <td class="mono code">
                {{ b.code }}
              </td>
              <td>{{ b.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <article class="prose">
      <h2>{{ t('faq.title') }}</h2>
      <template
        v-for="k in ['format', 'control', 'bank']"
        :key="k"
      >
        <h3>{{ t(`accountPage.faq.${k}.q`) }}</h3>
        <p>{{ t(`accountPage.faq.${k}.a`) }}</p>
      </template>
    </article>
  </div>
</template>

<style scoped>
.result { display: grid; gap: var(--s-3); }
.result:not(:empty) { margin-top: var(--s-4); }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 0; }
dt { color: var(--text-muted); font-size: var(--fs-sm); }
dd { margin: 0; overflow-wrap: anywhere; }
.banks { margin: var(--s-6) 0; }
.banks h2 { font-size: var(--fs-lg); }
td.code { width: 64px; }
@media (max-width: 599.98px) {
  dl { grid-template-columns: 1fr; gap: 2px; }
  dd + dt { margin-top: var(--s-2); }
}
</style>
