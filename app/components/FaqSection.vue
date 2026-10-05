<script setup lang="ts">
defineProps<{ keys: readonly string[] }>()
const { t } = useI18n()
</script>

<template>
  <section class="prose">
    <h2>{{ t('faq.title') }}</h2>
    <template
      v-for="k in keys"
      :key="k"
    >
      <h3>{{ t(`faq.${k}.q`) }}</h3>
      <p>{{ t(`faq.${k}.a`) }}</p>
    </template>
  </section>
</template>
