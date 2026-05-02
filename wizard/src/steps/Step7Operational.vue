<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config.js'

const config = useConfigStore()

const isSpa = computed(() => config.architecture.integrationModel === 'spa')

const deploymentTarget = computed({
  get: () => config.operational.deploymentTarget,
  set: (v) => config.setBatch('operational', { deploymentTarget: v }),
})

const performanceBudget = computed({
  get: () => config.operational.performanceBudget,
  set: (v) => config.setBatch('operational', { performanceBudget: v }),
})

const accessibility = computed({
  get: () => config.operational.accessibility,
  set: (v) => config.setBatch('operational', { accessibility: v }),
})
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Operational</h2>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
        Where this dashboard runs and the constraints it has to respect.
      </p>
    </header>

    <div class="card">
      <div class="section-title">Deployment target</div>
      <select v-model="deploymentTarget" class="select-input max-w-xs">
        <option value="forge">Laravel Forge</option>
        <option value="pm2-nginx">PM2 + Nginx</option>
        <option value="vercel" :disabled="!isSpa">
          Vercel (SPA only{{ isSpa ? '' : ' — switch architecture to enable' }})
        </option>
        <option value="other">Other</option>
      </select>
    </div>

    <div class="card">
      <div class="section-title">Performance budget</div>
      <p class="section-sub">
        Slow-connection mode pre-selected for Iraq-based deploys (skeleton screens, lazy loading,
        smaller image variants).
      </p>
      <div class="segmented">
        <button
          type="button"
          :class="{ 'is-active': performanceBudget === 'standard' }"
          @click="performanceBudget = 'standard'"
        >
          Standard
        </button>
        <button
          type="button"
          :class="{ 'is-active': performanceBudget === 'slow' }"
          @click="performanceBudget = 'slow'"
        >
          Slow connection (Iraq default)
        </button>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <div class="section-title" style="margin-bottom: 4px">Accessibility</div>
          <p class="text-xs" style="color: var(--color-text-muted)">
            WCAG AA — keyboard nav, focus rings, color contrast.
            <span style="color: #fca5a5">Disabling is not recommended.</span>
          </p>
        </div>
        <button
          type="button"
          class="toggle"
          :class="{ 'is-on': accessibility }"
          :aria-pressed="accessibility"
          @click="accessibility = !accessibility"
        ></button>
      </div>
    </div>
  </div>
</template>