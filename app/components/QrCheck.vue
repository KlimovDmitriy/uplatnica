<script setup lang="ts">
import type { IpsError } from '#shared/utils/ips'

const { t } = useI18n()
const { form, setForm } = useSlip()
const localePath = useLangPath()

const payload = ref('')
const parsed = computed(() => (payload.value.trim() ? parseIpsString(payload.value) : null))
const errors = computed<IpsError[]>(() => (parsed.value ? validateIps(parsed.value.input) : []))
const valid = computed(() => parsed.value && !parsed.value.formatErrors.length && !errors.value.length)

const TAG_ERRORS: Record<string, string[]> = {
  R: ['account.invalid', 'account.checksum'],
  N: ['payee.required', 'payee.tooLong', 'payee.tooManyLines'],
  P: ['payer.tooLong', 'payer.tooManyLines'],
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

/**
 * Fills the slip on this page with the decoded QR and scrolls to it. Pages without a
 * generator (portal-only templates) open the home page with the slip in the share link.
 */
function openInGenerator() {
  if (!parsed.value) return
  setForm(formFromIps(parsed.value.input))
  const generator = document.getElementById('generator')
  if (generator) generator.scrollIntoView({ behavior: 'smooth' })
  else navigateTo(`${localePath('/')}#${SHARE_PARAM}=${encodeSlip(form.value)}`)
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
          class="mono"
          rows="4"
          spellcheck="false"
          placeholder="K:PR|V:01|C:1|R:845000000040484987|N:JP EPS BEOGRAD|I:RSD3596,13|SF:189|RO:97163220000111111111000"
        />
      </FormField>
    </section>

    <!-- Only the verdict is live: the tag table would be re-read on every keystroke. -->
    <div
      class="live"
      aria-live="polite"
    >
      <p
        v-if="parsed"
        class="verdict"
        :class="valid ? 'ok' : 'bad'"
      >
        {{ valid ? `✓ ${t('checkQr.valid')}` : `✕ ${t('checkQr.invalid')}` }}
      </p>
    </div>
    <section
      v-if="parsed"
      class="card report"
    >
      <div class="table-scroll">
        <table class="table">
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
      </div>
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
.input { display: grid; gap: var(--s-4); }
.live:not(:empty) { margin-top: var(--s-4); }
.report { margin-top: var(--s-3); display: grid; gap: var(--s-4); justify-items: start; }
.report > * { margin: 0; }
.report .table-scroll { justify-self: stretch; }
td:first-child { width: 34%; }
td small { display: block; color: var(--text-muted); font-size: var(--fs-xs); }
.value { white-space: pre-wrap; overflow-wrap: anywhere; }
tr.problem td { font-weight: var(--fw-semibold); }
.err { color: var(--error) !important; }
.prose { margin-top: var(--s-6); }
</style>
