<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config.js'

const config = useConfigStore()

const isSpa = computed(() => config.architecture.integrationModel === 'spa')

const chartsLibrary = computed({
  get: () => config.data.chartsLibrary,
  set: (v) => config.setBatch('data', { chartsLibrary: v }),
})

const tableToggles = [
  { key: 'pagination', label: 'Server-side pagination', desc: 'Recommended for large datasets.' },
  { key: 'bulkActions', label: 'Bulk actions', desc: 'Multi-row delete, archive, export.' },
  { key: 'rowSelection', label: 'Row selection', desc: 'Checkboxes on each row.' },
  { key: 'export', label: 'CSV / Excel export', desc: 'Per-table download button.' },
]

function setTable(key, value) {
  config.setDataTables({ [key]: !!value })
}

const REALTIME_OPTIONS = [
  { key: 'none', label: 'None', desc: 'Refresh on user action only.' },
  { key: 'polling', label: 'Polling', desc: 'Periodic re-fetch (configurable interval).' },
  { key: 'websockets', label: 'WebSockets', desc: 'Laravel Echo + Reverb push.' },
]

function setRealtime(k) {
  config.setBatch('data', { realTime: k })
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Data & Visualization</h2>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
        Charts go through a thin wrapper so the underlying lib is swappable later.
      </p>
    </header>

    <div class="card">
      <div class="section-title">Chart library</div>
      <p class="section-sub">
        The <code>&lt;Chart&gt;</code> wrapper API stays identical regardless of which lib backs it.
      </p>
      <select v-model="chartsLibrary" class="select-input max-w-xs">
        <option value="echarts">ECharts (default)</option>
        <option value="chartjs">Chart.js</option>
        <option value="apexcharts">ApexCharts</option>
        <option value="recharts" :disabled="!isSpa">
          Recharts (SPA only{{ isSpa ? '' : ' — switch architecture to enable' }})
        </option>
      </select>
    </div>

    <div class="card">
      <div class="section-title">Tables</div>
      <div class="space-y-2">
        <div
          v-for="opt in tableToggles"
          :key="opt.key"
          class="flex items-center justify-between rounded-md border px-3 py-2"
          style="border-color: var(--color-border); background-color: var(--color-surface-2)"
        >
          <div>
            <div class="text-sm font-medium">{{ opt.label }}</div>
            <div class="text-[11px]" style="color: var(--color-text-muted)">{{ opt.desc }}</div>
          </div>
          <button
            type="button"
            class="toggle"
            :class="{ 'is-on': config.data.tables[opt.key] }"
            :aria-pressed="config.data.tables[opt.key]"
            @click="setTable(opt.key, !config.data.tables[opt.key])"
          ></button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Real-time</div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          v-for="opt in REALTIME_OPTIONS"
          :key="opt.key"
          type="button"
          class="radio-card"
          :class="{ 'is-active': config.data.realTime === opt.key }"
          @click="setRealtime(opt.key)"
        >
          <div class="radio-card-title">{{ opt.label }}</div>
          <div class="radio-card-desc">{{ opt.desc }}</div>
        </button>
      </div>
    </div>
  </div>
</template>