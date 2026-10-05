<script setup lang="ts">
import type { IpsError } from '#shared/utils/ips'

const { t } = useI18n()
const { setForm } = useSlip()

const payload = ref('')
const parsed = computed(() => (payload.value.trim() ? parseIpsString(payload.value) : null))
const errors = computed<IpsError[]>(() => (parsed.value ? validateIps(parsed.value.input) : []))
const valid = computed(() => parsed.value && !parsed.value.formatErrors.length && !errors.value.length)

const TAG_ERRORS: Record<string, string[]> = {
  R: ['account.invalid', 'account.checksum'],
  N: ['payee.required', 'payee.tooLong'],
  P: ['payer.tooLong'],
  I: ['amount.invalid'],
  SF: ['paymentCode.invalid'],
  S: ['purpose.tooLong'],
  RO: ['model.invalid', 'reference.tooLong', 'reference.invalid', 'reference.checksum'],
}

function tagProblem(tag: string): string {
  if (parsed.value?.formatErrors.includes(tag)) return t('checkQr.badFormat')
  const e = errors.value.find(err => TAG_ERRORS[tag]?.includes(err))
  return e ? t(`errors.${e}`, { max: LIMITS[e.split('.')[0] as keyof typeof LIMITS] }) : ''
}

/** Fills the slip on this page with the decoded QR and scrolls to it. */
function openInGenerator() {
  if (!parsed.value) return
  setForm(formFromIps(parsed.value.input))
  document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div>
    <section class="card input">
      <QrImport @decoded="payload = $event" />
      <FormField
        id="ips-text"
        :label="t('checkQr.textLabel')"
      >
        <textarea
          id="ips-text"
          v-model="payload"
          rows="4"
          spellcheck="false"
          placeholder="K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD|I:RSD3596,13|SF:189|RO:97163220000111111111000"
        />
      </FormField>
    </section>

    <section
      v-if="parsed"
      class="card report"
      aria-live="polite"
    >
      <p
        class="verdict"
        :class="valid ? 'ok' : 'bad'"
      >
        {{ valid ? `✓ ${t('checkQr.valid')}` : `✕ ${t('checkQr.invalid')}` }}
      </p>
      <table>
        <thead>
          <tr>
            <th>{{ t('checkQr.tag') }}</th>
            <th>{{ t('checkQr.value') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="([tag, value], i) in parsed.tags"
            :key="i"
            :class="{ problem: tagProblem(tag) }"
          >
            <td>
              <b class="mono">{{ tag }}</b>
              <small>{{ t(`checkQr.tags.${tag}`, tag) }}</small>
            </td>
            <td>
              <span class="value">{{ value }}</span>
              <small
                v-if="tagProblem(tag)"
                class="err"
              >{{ tagProblem(tag) }}</small>
            </td>
          </tr>
        </tbody>
      </table>
      <button
        type="button"
        class="btn primary"
        @click="openInGenerator"
      >
        {{ t('checkQr.open') }}
      </button>
    </section>

    <article class="prose">
      <h2>{{ t('checkQr.aboutTitle') }}</h2>
      <p>{{ t('checkQr.about1') }}</p>
      <p>{{ t('checkQr.about2') }}</p>
    </article>
  </div>
</template>

<style scoped>
.input { display: grid; gap: 16px; margin-top: 24px; }
.report { margin-top: 16px; display: grid; gap: 14px; justify-items: start; }
.verdict { margin: 0; padding: 10px 12px; border-radius: 4px; font-weight: 600; justify-self: stretch; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: left; color: var(--muted); font-weight: 500; font-size: 13px; padding: 6px 8px; border-bottom: 1px solid var(--border); }
td { padding: 8px; border-bottom: 1px solid var(--border); vertical-align: top; }
td:first-child { width: 34%; }
td small { display: block; color: var(--muted); font-size: 12.5px; }
.value { white-space: pre-wrap; overflow-wrap: anywhere; }
tr.problem td { font-weight: 600; }
.err { color: var(--text) !important; }
</style>
