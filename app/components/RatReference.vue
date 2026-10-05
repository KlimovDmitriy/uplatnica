<script setup lang="ts">
/** Builds a RAT poziv na broj: model 97 check digits + municipality code + JBKJS of the authority. */
import { MUNICIPALITIES } from '~/data/municipalities'

const { t } = useI18n()
const { patch } = useSlip()

const municipality = ref('')
const jbkjs = ref('')

const code = computed(() => MUNICIPALITIES.find(([name]) => name === municipality.value)?.[1] ?? '')
const jbkjsOk = computed(() => /^\d{5}$/.test(jbkjs.value.trim()))
const reference = computed(() => {
  if (!code.value || !jbkjsOk.value) return ''
  const body = code.value + jbkjs.value.trim()
  return `${model97Control(body)}-${code.value}-${jbkjs.value.trim()}`
})

watch(reference, (r) => { if (r) patch({ model: '97', reference: r }) })
</script>

<template>
  <div class="rat">
    <FormField
      id="rat-municipality"
      :label="t('rat.municipality')"
    >
      <input
        id="rat-municipality"
        v-model="municipality"
        list="rat-municipalities"
        autocomplete="off"
        :placeholder="t('rat.municipalityPlaceholder')"
      >
      <datalist id="rat-municipalities">
        <option
          v-for="[name, c] in MUNICIPALITIES"
          :key="c"
          :value="name"
        />
      </datalist>
    </FormField>
    <FormField
      id="rat-jbkjs"
      label="JBKJS"
      :hint="t('rat.jbkjsHint')"
    >
      <input
        id="rat-jbkjs"
        v-model="jbkjs"
        inputmode="numeric"
        maxlength="5"
        placeholder="09852"
      >
    </FormField>
    <p
      v-if="reference"
      class="result"
    >
      {{ t('slip.reference') }}: <b class="mono">97 {{ reference }}</b>
    </p>
  </div>
</template>

<style scoped>
.rat { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; }
.result { grid-column: 1 / -1; margin: 0; font-size: 14px; }
@media (max-width: 640px) { .rat { grid-template-columns: 1fr; } }
</style>
