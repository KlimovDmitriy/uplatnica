<script setup lang="ts">
defineProps<{
  id: string
  label: string
  hint?: string
  error?: string
  counter?: string
  required?: boolean
}>()
</script>

<template>
  <div
    class="field"
    :class="{ invalid: error }"
  >
    <div class="head">
      <label :for="id">{{ label }}<span
        v-if="required"
        class="req"
        aria-hidden="true"
      > *</span></label>
      <span
        v-if="counter"
        class="counter"
      >{{ counter }}</span>
    </div>
    <slot />
    <p
      v-if="error"
      :id="`${id}-error`"
      class="error-text"
      role="alert"
    >
      ✕ {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="`${id}-hint`"
      class="hint"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.head { display: flex; justify-content: space-between; gap: var(--s-2); }
.req, .counter { color: var(--text-muted); font-weight: var(--fw-regular); }
.counter { font-size: var(--fs-xs); font-variant-numeric: tabular-nums; }
.invalid :slotted(input), .invalid :slotted(textarea) { border-color: var(--error); }
</style>
