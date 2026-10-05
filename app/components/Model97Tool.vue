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
    <div class="tools">
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
            type="text"
            inputmode="numeric"
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
            type="text"
            inputmode="numeric"
            placeholder="163220000111111111000"
          >
        </FormField>
        <p
          v-if="checkResult"
          class="verdict"
          :class="checkResult"
          role="status"
        >
          <template v-if="checkResult === 'ok'">
            ✓ {{ t('model97.ok') }}
          </template>
          <template v-else-if="checkResult === 'bad'">
            ✕ {{ t('model97.bad', { control: expectedControl }) }}
          </template>
          <template v-else>
            {{ t('model97.format') }}
          </template>
        </p>
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
.tools { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0 40px; }
.card h2 { font-size: 17px; margin: 0 0 14px; }
.result { display: grid; gap: 6px; margin-top: 16px; padding: 14px; border-radius: 4px; background: var(--hover); justify-items: start; }
.big { font-size: 22px; font-weight: 700; letter-spacing: .03em; word-break: break-all; }
.verdict { margin: 14px 0 0; padding: 10px 12px; border-radius: 4px; font-weight: 600; }
@media (max-width: 720px) { .tools { grid-template-columns: 1fr; } }
</style>
