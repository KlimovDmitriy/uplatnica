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
          type="text"
          inputmode="numeric"
          placeholder="160-5100000000-02"
        >
      </FormField>

      <div
        v-if="input.trim()"
        class="result"
        aria-live="polite"
      >
        <p
          class="verdict"
          :class="valid ? 'ok' : 'bad'"
        >
          <template v-if="!account">
            {{ t('errors.account.invalid') }}
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
      </div>
    </section>

    <section
      v-if="BANK_CODES.length"
      class="banks"
    >
      <h2>{{ t('accountPage.banksTitle') }}</h2>
      <table>
        <tbody>
          <tr
            v-for="b in BANK_CODES"
            :key="b.code"
          >
            <td class="mono">
              {{ b.code }}
            </td>
            <td>{{ b.name }}</td>
          </tr>
        </tbody>
      </table>
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
.tool { margin-top: 24px; display: grid; gap: 16px; }
.verdict { margin: 0 0 12px; padding: 10px 12px; border-radius: 4px; font-weight: 600; }
dl { display: grid; grid-template-columns: max-content 1fr; gap: 6px 16px; margin: 0; }
dt { color: var(--muted); font-size: 14px; }
dd { margin: 0; }
.banks { margin-top: 40px; }
.banks h2 { font-size: 20px; margin: 0 0 12px; }
table { width: 100%; border-collapse: collapse; background: var(--bg); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; font-size: 14.5px; }
td { padding: 8px 12px; border-bottom: 1px solid var(--border); }
td.mono { width: 64px; }
</style>
