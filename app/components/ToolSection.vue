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
  <!-- The tools bring their own cards, so the open tool is not wrapped in another one. -->
  <section
    v-if="focus"
    class="tool"
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
      <!-- A real <h2> inside <summary> loses its heading role in screen readers. -->
      <span
        class="title"
        role="heading"
        aria-level="2"
      >{{ t(`${tool.prefix}.title`) }}</span>
    </summary>
    <div class="tool-body">
      <p class="lead">
        {{ t(`${tool.prefix}.lead`) }}
      </p>
      <component
        :is="is"
        v-if="open"
      />
    </div>
  </details>
</template>

<style scoped>
.tool-body .lead { font-size: var(--fs-md); }
</style>
