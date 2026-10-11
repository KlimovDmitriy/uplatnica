<script setup lang="ts">
/**
 * First visit in a browser whose language differs from the page: offers to switch instead of
 * re-rendering the page after load. A fixed overlay, so it never moves the layout.
 * The text is in the offered language, whatever the page is in.
 */
const OFFER: Record<string, { text: string, action: string, dismiss: string }> = {
  'sr': { text: 'Ova stranica je dostupna na srpskom.', action: 'Srpski', dismiss: 'Zatvori' },
  'sr-cyrl': { text: 'Ова страница је доступна на српском.', action: 'Српски', dismiss: 'Затвори' },
  'en': { text: 'This page is available in English.', action: 'English', dismiss: 'Close' },
  'ru': { text: 'Эта страница доступна на русском.', action: 'Русский', dismiss: 'Закрыть' },
}

const { locale, setLocale } = useI18n()
const suggested = useLangSuggestion()
const offer = computed(() => (suggested.value ? OFFER[suggested.value] : undefined))

function hide() {
  suggested.value = null
}

function dismiss() {
  try { localStorage.setItem('uplatnica:lang-hint', '1') }
  catch { /* storage unavailable */ }
  hide()
}

async function accept() {
  const code = suggested.value
  hide()
  if (code) await setLocale(code as typeof locale.value)
}

// Picking a language in the switcher makes the offer pointless.
watch(locale, hide)
</script>

<template>
  <div
    v-if="offer"
    class="suggest no-print"
    role="region"
    :lang="suggested === 'sr-cyrl' ? 'sr-Cyrl' : suggested!"
  >
    <p>{{ offer.text }}</p>
    <button
      type="button"
      class="btn primary small"
      @click="accept"
    >
      {{ offer.action }}
    </button>
    <button
      type="button"
      class="btn quiet small"
      @click="dismiss"
    >
      {{ offer.dismiss }}
    </button>
  </div>
</template>

<style scoped>
.suggest {
  position: fixed; left: var(--s-3); right: var(--s-3); bottom: var(--s-3); z-index: 20;
  display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-2) var(--s-3);
  max-width: 480px; margin-inline: auto; padding: var(--s-3) var(--s-4);
  border: 1px solid var(--border); border-radius: var(--r-md);
  background: var(--surface); box-shadow: var(--shadow-dialog);
  font-size: var(--fs-sm);
}
.suggest p { flex: 1 1 200px; margin: 0; }
</style>
