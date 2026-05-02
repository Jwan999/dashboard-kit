<script setup>
import { onMounted } from 'vue'
import WizardShell from './components/WizardShell.vue'
import { useConfigStore } from './stores/config.js'
import { loadExistingConfig } from './generator/deliver.js'

const config = useConfigStore()

// On first mount, if the host project already has a dashboard.config.json, pull
// it in so the wizard runs as an "update" (Phase 3.3).
onMounted(async () => {
  try {
    const existing = await loadExistingConfig()
    if (existing && existing.identity) {
      config.loadExternalConfig(existing)
    }
  } catch (_) { /* noop — wizard runs from scratch */ }
})
</script>

<template>
  <WizardShell />
</template>