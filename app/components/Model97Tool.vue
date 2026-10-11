<script setup lang="ts">
const { t } = useI18n()

const body = ref('')
const digits = computed(() => body.value.replace(/[\s-]/g, ''))
const bodyValid = computed(() => /^\d{1,20}$/.test(digits.value))
const control = computed(() => (bodyValid.value ? model97Control(digits.value) : ''))
const full = computed(() => (control.value ? control.value + digits.value : ''))

const check = ref('')
const checkDigits = computed(() => check.value.replace(/[\s-]/g, ''))
const checkResult = computed(() => {
  if (!checkDigits.value) return null
  if (!/^\d{3,22}$/.test(checkDigits.value)) return 'format'
  return isModel97Valid(checkDigits.value) ? 'ok' : 'bad'
})
const expectedControl = computed(() =>
  checkResult.value === 'bad' ? model97Control(checkDigits.value.slice(2)) : '')

const copied = ref(false)
async function copy() {
  await navigator.clipboard.writeText(full.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div>
    <div class="pair">
      <section class="card">
        <h2>{{ t('model97.calcTitle') }}</h2>
        <FormField
          id="m97-body"
          :label="t('model97.bodyLabel')"
          :hint="t('model97.bodyHint')"
          :error="digits && !bodyValid ? t('model97.bodyError') : ''"
        >
          <input
            id="m97-body"
            v-model="body"
            class="mono"
            :aria-invalid="digits && !bodyValid ? 'true' : undefined"
            :aria-describedby="digits && !bodyValid ? 'm97-body-error' : 'm97-body-hint'"
            type="text"
            inputmode="text"
            placeholder="3220000111111111000"
          >
        </FormField>
        <output
          v-if="full"
          class="result"
          for="m97-body"
        >
          <span class="muted">{{ t('model97.control') }}: <b>{{ control }}</b></span>
          <span class="big mono">{{ control }}<span class="muted">{{ digits }}</span></span>
          <button
            type="button"
            class="btn small"
            @click="copy"
          >
            {{ copied ? t('actions.copied') : t('actions.copy') }}
          </button>
        </output>
      </section>

      <section class="card">
        <h2>{{ t('model97.checkTitle') }}</h2>
        <FormField
          id="m97-check"
          :label="t('model97.checkLabel')"
        >
          <input
            id="m97-check"
            v-model="check"
            class="mono"
            :aria-invalid="checkResult === 'bad' || checkResult === 'format' ? 'true' : undefined"
            :aria-describedby="checkResult === 'bad' || checkResult === 'format' ? 'm97-check-verdict' : undefined"
            type="text"
            inputmode="text"
            placeholder="163220000111111111000"
          >
        </FormField>
        <div aria-live="polite">
          <p
            v-if="checkResult"
            id="m97-check-verdict"
            class="verdict"
            :class="checkResult === 'ok' ? 'ok' : 'bad'"
          >
            <template v-if="checkResult === 'ok'">
              ✓ {{ t('model97.ok') }}
            </template>
            <template v-else-if="checkResult === 'bad'">
              ✕ {{ t('model97.bad', { control: expectedControl }) }}
            </template>
            <template v-else>
              ✕ {{ t('model97.format') }}
            </template>
          </p>
        </div>
      </section>
    </div>

    <article class="prose">
      <h2>{{ t('model97.howTitle') }}</h2>
      <p>{{ t('model97.how1') }}</p>
      <ol>
        <li>{{ t('model97.step1') }}</li>
        <li>{{ t('model97.step2') }}</li>
        <li>{{ t('model97.step3') }}</li>
        <li>{{ t('model97.step4') }}</li>
      </ol>
      <p>{{ t('model97.example') }}</p>

      <h2>{{ t('faq.title') }}</h2>
      <template
        v-for="k in ['what', 'where', 'letters']"
        :key="k"
      >
        <h3>{{ t(`model97.faq.${k}.q`) }}</h3>
        <p>{{ t(`model97.faq.${k}.a`) }}</p>
      </template>
    </article>
  </div>
</template>

<style scoped>
.pair { display: grid; gap: var(--s-4); margin: 0 0 var(--s-6); }
.card h2 { font-size: var(--fs-lg); margin: 0 0 var(--s-4); }
.result { display: grid; gap: 6px; margin-top: var(--s-4); padding: 14px; border-radius: var(--r-sm); background: var(--surface-2); justify-items: start; }
.big { font-size: var(--fs-xl); font-weight: 700; letter-spacing: .03em; word-break: break-all; }
.card .verdict { margin-top: var(--s-4); }
@media (min-width: 960px) { .pair { grid-template-columns: 1fr 1fr; } }
</style>
