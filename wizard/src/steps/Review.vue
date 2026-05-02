<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config.js'

const config = useConfigStore()
const json = computed(() => JSON.stringify(config.asJson, null, 2))
</script>

<template>
  <div class="max-w-3xl">
    <h2 class="text-2xl font-semibold">Review</h2>
    <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
      Confirm everything looks right. Phase 3 will turn this into a real dashboard scaffold on disk.
    </p>

    <div
      class="mt-6 rounded-xl border overflow-hidden"
      style="border-color: var(--color-border); background-color: var(--color-surface)"
    >
      <div
        class="px-5 py-3 border-b flex items-center justify-between"
        style="border-color: var(--color-border)"
      >
        <div class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted)">
          dashboard.config.json (preview)
        </div>
        <span
          class="text-xs px-2 py-0.5 rounded-full border"
          style="border-color: var(--color-border); color: var(--color-text-muted)"
        >
          empty in Phase 1
        </span>
      </div>
      <pre
        class="px-5 py-4 text-xs leading-relaxed overflow-x-auto"
        style="color: var(--color-text-muted)"
      ><code>{{ json }}</code></pre>
    </div>

    <div
      class="mt-6 rounded-xl border p-5"
      style="border-color: var(--color-border); background-color: var(--color-surface)"
    >
      <div class="text-sm font-medium">Phase 3 will add</div>
      <ul class="mt-3 space-y-2 text-sm" style="color: var(--color-text-muted)">
        <li>Generate scaffold button — writes tokens.css, tailwind.config, components.json, AppLayout.vue, i18n setup, &lt;Chart&gt; wrapper.</li>
        <li>Inertia vs SPA generators.</li>
        <li>Migration helper for retrofitting existing dashboards.</li>
      </ul>
    </div>
  </div>
</template>