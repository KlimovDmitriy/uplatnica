<script setup lang="ts">
import type { SlipForm, SlipKind } from '~/composables/useSlip'

const props = defineProps<{
  /** Prefills the slip (template pages). Applied on the server too, so the prerendered HTML shows it. */
  preset?: Partial<SlipForm>
  /** Restore/save the local draft (main and tool pages). Shared links are read on every page. */
  persist?: boolean
}>()

const { t, locale } = useI18n()
const { form, setForm, patch, script, fromLink, restore } = useSlip()

if (props.preset) setForm(props.preset)
// Another payment tab of the template: its preset replaces the slip, but what the user typed into
// fields the new preset does not set (payer, amount, reference…) carries over.
watch(() => props.preset, (preset, old) => {
  if (preset) setForm({ ...changedFields(form.value, old), ...preset })
})
restore(!!props.persist)

// Cyrillic UI → Cyrillic slip by default; the radio can still override it.
watch(locale, l => (script.value = l === 'sr-cyrl' ? 'cyrl' : 'latn'), { immediate: true })

// Cash at the counter for "uplata", transfer for "prenos": a sensible default when switching.
function onKind(kind: SlipKind) {
  form.value.paymentCode = (kind === 'uplata' ? '1' : '2') + form.value.paymentCode.slice(1)
}

const showImport = ref(false)
const importError = ref(false)

function onDecoded(payload: string) {
  const parsed = parseIpsString(payload)
  importError.value = parsed.formatErrors.includes('K')
  if (!importError.value) {
    patch(formFromIps(parsed.input))
    showImport.value = false
  }
}
</script>

<template>
  <section class="generator">
    <p class="options no-print">
      <span>
        <label><input
          v-model="form.kind"
          type="radio"
          value="uplata"
          @change="onKind('uplata')"
        > {{ t('kinds.uplata.title') }}</label>
        <label><input
          v-model="form.kind"
          type="radio"
          value="prenos"
          @change="onKind('prenos')"
        > {{ t('kinds.prenos.title') }}</label>
      </span>
      <span>
        <label><input
          v-model="script"
          type="radio"
          value="latn"
        > latinica</label>
        <label><input
          v-model="script"
          type="radio"
          value="cyrl"
        > ћирилица</label>
      </span>
    </p>

    <p
      v-if="fromLink"
      class="note no-print"
      role="status"
    >
      {{ t('share.loaded') }}
    </p>

    <SlipEditor class="wide-only no-print" />
    <SlipForm class="narrow-only no-print" />
    <SlipPreview class="print-area narrow-only" />

    <SlipErrors class="no-print" />
    <SlipActions
      class="no-print"
      @import="showImport = !showImport"
    />

    <div
      v-if="showImport"
      class="no-print"
    >
      <QrImport @decoded="onDecoded" />
      <p
        v-if="importError"
        role="alert"
      >
        {{ t('import.notIps') }}
      </p>
    </div>

    <BatchPanel class="no-print" />
  </section>
</template>

<style scoped>
.generator { display: grid; gap: 12px; max-width: 900px; }
.options { margin: 0; display: flex; flex-wrap: wrap; gap: 6px 32px; }
.options span { display: flex; gap: 16px; }
.options label { display: inline-flex; gap: 5px; align-items: center; cursor: pointer; }
.options input { margin: 0; }
.note { margin: 0; padding: 6px 10px; border: 1px solid #000; }

</style>
