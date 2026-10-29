<script setup lang="ts">
import type { SlipForm, SlipKind } from '~/composables/useSlip'

const props = defineProps<{
  /** Prefills the slip (template pages). Applied on the server too, so the prerendered HTML shows it. */
  preset?: Partial<SlipForm>
  /** Restore/save the local draft (main and tool pages). Shared links are read on every page. */
  persist?: boolean
  /** Show the after-slip ad slot below the actions. */
  ads?: boolean
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
  <section
    class="panel generator"
    :aria-label="t('nav.generator')"
  >
    <div class="head no-print">
      <fieldset class="choice segmented kind">
        <legend class="sr-only">
          {{ t('form.kind') }}
        </legend>
        <label><input
          v-model="form.kind"
          type="radio"
          class="sr-only"
          name="slip-kind"
          value="uplata"
          @change="onKind('uplata')"
        ><span>{{ t('kinds.uplata.title') }}</span></label>
        <label><input
          v-model="form.kind"
          type="radio"
          class="sr-only"
          name="slip-kind"
          value="prenos"
          @change="onKind('prenos')"
        ><span>{{ t('kinds.prenos.title') }}</span></label>
      </fieldset>
      <fieldset class="choice segmented script">
        <legend class="sr-only">
          {{ t('form.script') }}
        </legend>
        <label><input
          v-model="script"
          type="radio"
          class="sr-only"
          name="slip-script"
          value="latn"
        ><span lang="sr-Latn">latinica</span></label>
        <label><input
          v-model="script"
          type="radio"
          class="sr-only"
          name="slip-script"
          value="cyrl"
        ><span lang="sr-Cyrl">ћирилица</span></label>
      </fieldset>
    </div>

    <p class="hint wide-only no-print">
      {{ t('form.editorHint') }}
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
    <h3 class="preview-title narrow-only no-print">
      {{ t('form.preview') }}
    </h3>
    <SlipPreview class="print-area narrow-only" />

    <SlipErrors class="no-print" />
    <SlipActions
      class="no-print"
      :import-open="showImport"
      @import="showImport = !showImport"
    />

    <AdSlot
      v-if="ads"
      name="after-slip"
    />

    <div
      v-if="showImport"
      class="card import no-print"
    >
      <LazyQrImport @decoded="onDecoded" />
      <p
        v-if="importError"
        class="verdict bad"
        role="alert"
      >
        ✕ {{ t('import.notIps') }}
      </p>
    </div>

    <BatchPanel class="no-print" />
  </section>
</template>

<style scoped>
.generator { display: grid; gap: var(--s-4); }
.generator > * { margin: 0; min-width: 0; }
.head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: var(--s-3) var(--s-4); }
.kind { width: max-content; min-width: 360px; }
.script { width: max-content; }
.script label { min-height: 32px; padding: 2px 10px; font-size: var(--fs-sm); }
.hint { font-size: var(--fs-sm); color: var(--text-muted); margin-top: calc(-1 * var(--s-2)) !important; }
.preview-title { font-size: var(--fs-sm); font-weight: var(--fw-semibold); color: var(--text-muted); margin-bottom: calc(-1 * var(--s-2)) !important; }
.import { display: grid; gap: var(--s-3); }
.import .verdict { margin: 0; }
@media (max-width: 1199.98px) { .generator { padding: var(--s-4); } }
@media (pointer: coarse), (max-width: 959.98px) { .script label { min-height: 44px; } }
@media (max-width: 599.98px) {
  .generator { margin-inline: calc(-1 * var(--gutter)); border-inline: 0; border-radius: 0; padding: var(--s-4); }
  .kind, .script { width: 100%; min-width: 0; }
}
</style>
