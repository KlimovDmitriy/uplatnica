<script setup lang="ts">
/**
 * One tool on the page. `focus` (the tool's own URL) renders it open with the page heading;
 * otherwise it's a collapsed <details> whose body mounts only when opened, so the prerendered
 * pages don't repeat every tool's text.
 */
import type { Tool } from '~/data/tools'
import AccountCheck from './AccountCheck.vue'
import Model97Tool from './Model97Tool.vue'
import PaymentCodes from './PaymentCodes.vue'
import QrCheck from './QrCheck.vue'

const props = defineProps<{ tool: Tool, focus?: boolean }>()
const { t } = useI18n()

const COMPONENTS = { AccountCheck, Model97Tool, PaymentCodes, QrCheck }
const is = COMPONENTS[props.tool.component]
const open = ref(false)
</script>

<template>
  <section
    v-if="focus"
    class="tool focus"
  >
    <component :is="is" />
  </section>
  <details
    v-else
    :id="tool.slug"
    class="tool"
    @toggle="open = ($event.target as HTMLDetailsElement).open"
  >
    <summary>
      <h2>{{ t(`${tool.prefix}.title`) }}</h2>
    </summary>
    <p class="lead">
      {{ t(`${tool.prefix}.lead`) }}
    </p>
    <component
      :is="is"
      v-if="open"
    />
  </details>
</template>

<style scoped>
details.tool { border-top: 1px solid var(--border); padding: 10px 0; }
summary { cursor: pointer; }
summary h2 { display: inline; font-size: 17px; margin: 0; }
.lead { color: var(--muted); font-size: 14px; }
</style>
