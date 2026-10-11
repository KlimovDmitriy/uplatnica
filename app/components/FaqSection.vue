<script setup lang="ts">
defineProps<{ keys: readonly string[] }>()
const { t } = useI18n()
</script>

<template>
  <section class="prose">
    <h2>{{ t('faq.title') }}</h2>
    <div class="faq">
      <details
        v-for="k in keys"
        :key="k"
      >
        <summary>
          <!-- A real <h3> inside <summary> loses its heading role in screen readers. -->
          <span
            class="q"
            role="heading"
            aria-level="3"
          >{{ t(`faq.${k}.q`) }}</span>
        </summary>
        <p>{{ t(`faq.${k}.a`) }}</p>
      </details>
    </div>
  </section>
</template>
