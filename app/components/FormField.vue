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
      class="msg error"
      role="alert"
    >
      ✕ {{ error }}
    </p>
    <p
      v-else-if="hint"
      class="msg"
    >
      {{ hint }}
    </p>
  </div>
</template>

<style scoped>
.field { display: grid; gap: 6px; align-content: start; min-width: 0; }
.head { display: flex; justify-content: space-between; gap: 8px; }
label { font-weight: 500; font-size: 14px; }
.req { color: var(--muted); }
.counter { color: var(--muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.msg { margin: 0; font-size: 12.5px; color: var(--muted); }
.msg.error { color: var(--text); font-weight: 500; }
.invalid :slotted(input), .invalid :slotted(textarea) { border-color: var(--text); }
</style>
