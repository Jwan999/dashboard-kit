<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfigStore } from '../stores/config.js'
import { runGeneratorWithBundledTemplates } from '../generator/browserEntry.js'
import { downloadZip, postToHost, probeHostMode } from '../generator/deliver.js'

const config = useConfigStore()
const router = useRouter()

const json = computed(() => JSON.stringify(config.asJson, null, 2))

const sections = computed(() => {
  const c = config.asJson
  return [
    {
      title: 'Identity & Purpose',
      step: '/step/1',
      rows: [
        ['Display name', c.identity.displayName || '—'],
        ['Machine name', c.identity.machineName || '—'],
        ['Description', c.identity.description || '—'],
        ['Domain', c.identity.domain || '—'],
        ['Route prefix', c.identity.routePrefix || '—'],
        ['Light logo', c.identity.logoLight ? c.identity.logoLight.name : '—'],
        ['Dark logo', c.identity.logoDark ? c.identity.logoDark.name : c.identity.logoDarkDerived ? 'auto-derived' : '—'],
      ],
    },
    {
      title: 'Language & Direction',
      step: '/step/2',
      rows: [
        ['Languages', c.language.languages.join(', ')],
        ['Default', c.language.defaultLanguage],
        ['Direction', c.language.direction],
        ['Fallback', c.language.fallbackLocale],
      ],
    },
    {
      title: 'Brand Tokens',
      step: '/step/3',
      rows: [
        ['Primary', c.brand.primary],
        ['Accent', c.brand.accent || '—'],
        ['Neutral', c.brand.neutral],
        ['Success', c.brand.semantic.success],
        ['Warning', c.brand.semantic.warning],
        ['Error', c.brand.semantic.error],
        ['Info', c.brand.semantic.info],
        ['Latin font', c.brand.fontLatin],
        ['Arabic font', c.brand.fontArabic],
        ['Font hosting', c.brand.fontHosting],
      ],
    },
    {
      title: 'Visual Language',
      step: '/step/4',
      rows: [
        ['Radius', c.visual.radius],
        ['Density', c.visual.density],
        ['Shadow', c.visual.shadow],
        ['Motion', c.visual.motion],
      ],
    },
    {
      title: 'Architecture',
      step: '/step/5',
      rows: [
        ['Integration', c.architecture.integrationModel],
        ['Auth', c.architecture.auth],
        ['Multi-tenant', c.architecture.multiTenant ? 'yes' : 'no'],
        ...(c.architecture.multiTenant
          ? [['Tenancy strategy', c.architecture.tenancyStrategy]]
          : []),
      ],
    },
    {
      title: 'Data & Visualization',
      step: '/step/6',
      rows: [
        ['Charts', c.data.chartsLibrary],
        ['Pagination', c.data.tables.pagination ? 'on' : 'off'],
        ['Bulk actions', c.data.tables.bulkActions ? 'on' : 'off'],
        ['Row selection', c.data.tables.rowSelection ? 'on' : 'off'],
        ['Export', c.data.tables.export ? 'on' : 'off'],
        ['Real-time', c.data.realTime],
      ],
    },
    {
      title: 'Operational',
      step: '/step/7',
      rows: [
        ['Deployment', c.operational.deploymentTarget],
        ['Performance', c.operational.performanceBudget],
        ['Accessibility (WCAG AA)', c.operational.accessibility ? 'on' : 'off'],
      ],
    },
  ]
})

function gotoStep(path) {
  router.push(path)
}

const downloadName = computed(() => {
  const slug = config.identity.machineName || 'dashboard'
  return `${slug}.config.json`
})

function downloadConfig() {
  const blob = new Blob([json.value], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadName.value
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const copyState = ref('')
async function copyConfig() {
  try {
    await navigator.clipboard.writeText(json.value)
    copyState.value = 'ok'
  } catch (_) {
    copyState.value = 'bad'
  }
  setTimeout(() => (copyState.value = ''), 1400)
}

// ---------- Phase 3 — generate scaffold ----------
const hostAvailable = ref(false)
const hostCwd = ref('')
const generating = ref(false)
const result = ref(null) // { mode, files, steps, error? }

onMounted(async () => {
  try {
    const ok = await probeHostMode()
    hostAvailable.value = ok
    if (ok) {
      const r = await fetch('/__dashboard_kit/api/ping').then((r) => r.json()).catch(() => null)
      if (r) {
        hostAvailable.value = !!r.ok && !r.standalone
        hostCwd.value = r.cwd || ''
      }
    }
  } catch (_) { /* noop */ }
})

async function generate() {
  generating.value = true
  result.value = null
  try {
    const cfg = config.asJson
    const { files, steps } = runGeneratorWithBundledTemplates(cfg)
    if (hostAvailable.value) {
      const resp = await postToHost({ files, steps })
      result.value = { mode: 'host', files: resp.files, steps: resp.steps, cwd: resp.cwd }
    } else {
      await downloadZip(files, (cfg.identity.machineName || 'dashboard') + '-scaffold')
      result.value = { mode: 'zip', files: files.map((f) => f.path), steps }
    }
  } catch (e) {
    result.value = { mode: 'error', error: String(e?.message || e) }
  } finally {
    generating.value = false
  }
}

const generateLabel = computed(() => {
  if (generating.value) return 'Generating…'
  if (hostAvailable.value) return 'Generate scaffold (write to project)'
  return 'Generate scaffold (download ZIP)'
})
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Review</h2>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
        Confirm everything looks right. Phase 3 will turn this into a real dashboard scaffold on disk.
      </p>
    </header>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="section in sections"
        :key="section.title"
        class="card"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="section-title" style="margin-bottom: 0">{{ section.title }}</div>
          <button
            type="button"
            class="text-xs underline-offset-2 hover:underline"
            style="color: var(--color-primary)"
            @click="gotoStep(section.step)"
          >
            edit
          </button>
        </div>
        <dl class="text-xs space-y-1">
          <div v-for="[k, v] in section.rows" :key="k" class="flex items-start gap-2">
            <dt class="w-32 shrink-0" style="color: var(--color-text-muted)">{{ k }}</dt>
            <dd class="flex-1 truncate font-mono">{{ v }}</dd>
          </div>
        </dl>
      </div>
    </div>

    <div class="card">
      <div class="flex items-center justify-between mb-3">
        <div class="section-title" style="margin-bottom: 0">dashboard.config.json</div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="text-xs px-3 py-1.5 rounded-md border"
            style="border-color: var(--color-border); color: var(--color-text)"
            @click="copyConfig"
          >
            {{ copyState === 'ok' ? 'copied' : copyState === 'bad' ? 'failed' : 'Copy' }}
          </button>
          <button
            type="button"
            class="text-xs px-3 py-1.5 rounded-md border"
            style="border-color: var(--color-border); color: var(--color-text)"
            @click="downloadConfig"
          >
            Download
          </button>
        </div>
      </div>
      <pre
        class="text-[11px] leading-relaxed overflow-x-auto p-3 rounded-md"
        style="background-color: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text-muted); max-height: 360px"
      ><code>{{ json }}</code></pre>
    </div>

    <div class="card">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="section-title" style="margin-bottom: 4px">Generate scaffold</div>
          <p class="text-xs" style="color: var(--color-text-muted)">
            Writes tokens.css, tailwind config, components.json, AppLayout, i18n, &lt;Chart&gt; wrapper, and integration-specific pages.
          </p>
          <p class="text-xs mt-2" style="color: var(--color-text-muted)">
            <span v-if="hostAvailable">
              Host project detected at <code class="font-mono">{{ hostCwd }}</code> — files will be written in place.
              Existing files at the same paths will be overwritten.
            </span>
            <span v-else>
              No host Laravel project detected — you'll get a ZIP to unzip into your project root.
            </span>
          </p>
        </div>
        <button
          type="button"
          class="px-4 py-2 text-sm rounded-md font-medium shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          style="background-color: var(--color-primary); color: #fff"
          :disabled="generating"
          @click="generate"
        >
          {{ generateLabel }}
        </button>
      </div>

      <div
        v-if="result && result.mode === 'error'"
        class="mt-4 p-3 rounded-md text-xs"
        style="background-color: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error); border: 1px solid var(--color-error)"
      >
        {{ result.error }}
      </div>

      <div v-if="result && result.mode !== 'error'" class="mt-4 space-y-3">
        <div class="text-xs" style="color: var(--color-text-muted)">
          <strong style="color: var(--color-text)">{{ result.mode === 'host' ? 'Wrote to disk' : 'ZIP downloaded' }}.</strong>
          {{ Array.isArray(result.files) ? result.files.length : 0 }} files.
          <span v-if="result.cwd"> at <code class="font-mono">{{ result.cwd }}</code></span>
        </div>
        <details class="text-xs">
          <summary class="cursor-pointer" style="color: var(--color-text-muted)">Files ({{ Array.isArray(result.files) ? result.files.length : 0 }})</summary>
          <ul class="mt-2 ps-4 space-y-0.5 font-mono" style="color: var(--color-text-muted)">
            <li v-for="f in result.files" :key="f">{{ f }}</li>
          </ul>
        </details>
        <div v-if="result.steps && result.steps.length">
          <div class="text-xs font-semibold mb-2" style="color: var(--color-text)">Next steps</div>
          <ol class="space-y-2 text-xs">
            <li
              v-for="(step, i) in result.steps"
              :key="i"
              class="p-2 rounded-md font-mono whitespace-pre-wrap"
              style="background-color: var(--color-bg); border: 1px solid var(--color-border); color: var(--color-text)"
            >{{ step }}</li>
          </ol>
        </div>
      </div>
    </div>
  </div>
</template>