<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config.js'
import { NEUTRAL_PALETTES } from '../utils/neutrals.js'
import { RADIUS_MAP, DENSITY_MAP, SHADOW_MAP } from '../utils/visual.js'
import { readableTextOn } from '../utils/color.js'

const config = useConfigStore()

const dir = computed(() => config.resolvedDirection)
const isRtl = computed(() => dir.value === 'rtl')

const scale = computed(() => config.effectivePrimaryScale)
const neutral = computed(() => NEUTRAL_PALETTES[config.brand.neutral] || NEUTRAL_PALETTES.cool)
const radius = computed(() => RADIUS_MAP[config.visual.radius] || RADIUS_MAP.rounded)
const density = computed(() => DENSITY_MAP[config.visual.density] || DENSITY_MAP.default)
const shadow = computed(() => SHADOW_MAP[config.visual.shadow] || SHADOW_MAP.soft)

const accentEnabled = computed(() => config.brand.accentEnabled)
const accent = computed(() => config.brand.accent)

const primary = computed(() => scale.value[500])
const primaryFg = computed(() => readableTextOn(primary.value))
const primarySoft = computed(() => scale.value[100])
const primaryStrong = computed(() => scale.value[700])

// Sample text per script.
const fontLatin = computed(() => `"${config.brand.fontLatin}", ui-sans-serif, system-ui, sans-serif`)
const fontArabic = computed(
  () => `"${config.brand.fontArabic}", "Noto Sans Arabic", ui-sans-serif, sans-serif`,
)
const previewFont = computed(() => (isRtl.value ? fontArabic.value : fontLatin.value))

const navItems = computed(() => {
  if (isRtl.value) {
    return [
      { label: 'لوحة التحكم', icon: '◧', active: true },
      { label: 'العملاء', icon: '◐' },
      { label: 'التقارير', icon: '◓' },
    ]
  }
  return [
    { label: 'Overview', icon: '◧', active: true },
    { label: 'Customers', icon: '◐' },
    { label: 'Reports', icon: '◓' },
  ]
})

const cardCopy = computed(() => {
  if (isRtl.value) {
    return {
      title: config.identity.displayName || 'لوحة تحكم تجريبية',
      body:
        config.identity.description ||
        'تتغير هذه المعاينة فورياً مع كل خيار تختاره — الألوان والخطوط واتجاه الكتابة.',
      primaryCta: 'إجراء أساسي',
      secondaryCta: 'إلغاء',
    }
  }
  return {
    title: config.identity.displayName || 'Sample dashboard',
    body:
      config.identity.description ||
      'This preview re-skins live as you change tokens — color, font, density, radius, direction.',
    primaryCta: 'Primary action',
    secondaryCta: 'Cancel',
  }
})

const tableRows = computed(() =>
  isRtl.value
    ? [
        { name: 'سارة علي', status: 'نشط', amount: '٢٤٠٠ د.ع' },
        { name: 'حسن قاسم', status: 'معلّق', amount: '١٢٠٠ د.ع' },
      ]
    : [
        { name: 'Sara Ali', status: 'Active', amount: '$2,400' },
        { name: 'Hasan Q.', status: 'Pending', amount: '$1,200' },
      ],
)

const tableHeaders = computed(() =>
  isRtl.value ? ['الاسم', 'الحالة', 'المبلغ'] : ['Name', 'Status', 'Amount'],
)

// Sparkline points for the chart-placeholder block.
const sparkPath = computed(() => {
  const pts = [10, 22, 14, 30, 24, 38, 28, 46, 36, 52, 42, 58]
  const w = 240
  const h = 60
  const stepX = w / (pts.length - 1)
  const max = Math.max(...pts)
  return pts
    .map((p, i) => {
      const x = i * stepX
      const y = h - (p / max) * h * 0.9 - 4
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ')
})

const previewVars = computed(() => ({
  '--p-primary': primary.value,
  '--p-primary-fg': primaryFg.value,
  '--p-primary-soft': primarySoft.value,
  '--p-primary-strong': primaryStrong.value,
  '--p-accent': accent.value,
  '--p-bg': neutral.value[50],
  '--p-surface': '#ffffff',
  '--p-surface-2': neutral.value[100],
  '--p-border': neutral.value[200],
  '--p-text': neutral.value[900],
  '--p-text-muted': neutral.value[500],
  '--p-radius': radius.value,
  '--p-pad-y': density.value.padY,
  '--p-pad-x': density.value.padX,
  '--p-row-h': density.value.rowH,
  '--p-font-size': density.value.fontSize,
  '--p-shadow': shadow.value,
  '--p-font': previewFont.value,
}))

const logoSrc = computed(() => {
  if (isRtl.value || config.identity.logoLight === null) {
    // dark-mode preview area is light, so the light logo is fine in both
  }
  return config.identity.logoLight?.dataUrl || null
})

const logoAlt = computed(() => config.identity.displayName || 'logo')
</script>

<template>
  <div class="flex flex-col h-full">
    <div class="px-5 py-4 border-b" style="border-color: var(--color-border)">
      <div class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted)">
        Live preview
      </div>
      <div class="mt-0.5 text-sm font-medium flex items-center gap-2">
        Updates as you choose
        <span
          class="text-[10px] px-1.5 py-0.5 rounded-full border uppercase tracking-wide"
          style="border-color: var(--color-border); color: var(--color-text-muted)"
        >
          {{ dir }}
        </span>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <!-- The whole preview surface uses logical Tailwind classes and flips with `dir`. -->
      <div
        :dir="dir"
        :style="previewVars"
        class="preview-root rounded-xl overflow-hidden border"
      >
        <!-- Header -->
        <div class="preview-header">
          <div class="flex items-center gap-2 min-w-0">
            <img
              v-if="logoSrc"
              :src="logoSrc"
              :alt="logoAlt"
              class="w-7 h-7 object-contain shrink-0"
            />
            <div
              v-else
              class="w-7 h-7 shrink-0 rounded-md"
              :style="{ backgroundColor: 'var(--p-primary)' }"
            ></div>
            <div class="text-sm font-semibold truncate">{{ cardCopy.title }}</div>
          </div>
          <div class="flex items-center gap-2">
            <div
              class="hidden sm:block text-[11px] truncate"
              style="color: var(--p-text-muted); max-width: 120px"
            >
              {{ isRtl ? 'مرحباً، سارة' : 'Hi, Sara' }}
            </div>
            <div
              class="w-7 h-7 rounded-full"
              :style="{ backgroundColor: accentEnabled ? 'var(--p-accent)' : 'var(--p-primary-strong)' }"
            ></div>
          </div>
        </div>

        <div class="preview-body">
          <!-- Sidebar -->
          <nav class="preview-sidebar">
            <button
              v-for="item in navItems"
              :key="item.label"
              type="button"
              class="preview-nav-item"
              :class="{ 'is-active': item.active }"
            >
              <span class="text-[15px] leading-none" :class="{ 'rtl:rotate-180': false }">{{ item.icon }}</span>
              <span class="truncate">{{ item.label }}</span>
            </button>
          </nav>

          <!-- Content -->
          <div class="preview-content">
            <div class="preview-card">
              <div class="text-xs uppercase tracking-wider" style="color: var(--p-text-muted)">
                {{ isRtl ? 'بطاقة عينة' : 'Sample card' }}
              </div>
              <div class="mt-1 text-base font-semibold">{{ cardCopy.title }}</div>
              <p class="mt-2 text-[13px] leading-relaxed" style="color: var(--p-text-muted)">
                {{ cardCopy.body }}
              </p>
              <div class="mt-3 flex items-center gap-2">
                <button type="button" class="btn-primary">{{ cardCopy.primaryCta }}</button>
                <button type="button" class="btn-secondary">{{ cardCopy.secondaryCta }}</button>
              </div>
            </div>

            <div class="preview-card">
              <div class="flex items-center justify-between">
                <div class="text-xs uppercase tracking-wider" style="color: var(--p-text-muted)">
                  {{ isRtl ? 'تحليلات' : 'Trend' }}
                </div>
                <div class="text-[11px]" style="color: var(--p-text-muted)">7d</div>
              </div>
              <svg viewBox="0 0 240 60" class="mt-2 w-full h-14">
                <defs>
                  <linearGradient id="sparkFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" :stop-color="primary" stop-opacity="0.32" />
                    <stop offset="100%" :stop-color="primary" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path
                  :d="sparkPath + ' L 240 60 L 0 60 Z'"
                  fill="url(#sparkFill)"
                  stroke="none"
                />
                <path :d="sparkPath" :stroke="primary" stroke-width="2" fill="none" stroke-linecap="round" />
              </svg>
            </div>

            <div class="preview-table">
              <div class="preview-row preview-row-head">
                <div v-for="h in tableHeaders" :key="h">{{ h }}</div>
              </div>
              <div v-for="row in tableRows" :key="row.name" class="preview-row">
                <div class="truncate">{{ row.name }}</div>
                <div>
                  <span class="status-pill">{{ row.status }}</span>
                </div>
                <div class="text-end">{{ row.amount }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.preview-root {
  background-color: var(--p-bg);
  color: var(--p-text);
  font-family: var(--p-font);
  font-size: var(--p-font-size);
  border-color: var(--p-border);
  box-shadow: var(--p-shadow);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background-color: var(--p-surface);
  border-bottom: 1px solid var(--p-border);
  padding: var(--p-pad-y) var(--p-pad-x);
}

.preview-body {
  display: grid;
  grid-template-columns: 110px 1fr;
  background-color: var(--p-bg);
  min-height: 280px;
}

.preview-sidebar {
  background-color: var(--p-surface);
  border-inline-end: 1px solid var(--p-border);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.preview-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: start;
  padding: 8px 10px;
  border-radius: var(--p-radius);
  background: transparent;
  color: var(--p-text-muted);
  font-size: 12px;
  border: none;
  cursor: pointer;
  transition: background-color 120ms ease;
}
.preview-nav-item:hover {
  background-color: var(--p-surface-2);
}
.preview-nav-item.is-active {
  background-color: var(--p-primary-soft);
  color: var(--p-primary-strong);
  font-weight: 600;
}

.preview-content {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-card {
  background-color: var(--p-surface);
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius);
  padding: var(--p-pad-y) var(--p-pad-x);
}

.btn-primary {
  background-color: var(--p-primary);
  color: var(--p-primary-fg);
  border-radius: var(--p-radius);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: filter 120ms ease;
}
.btn-primary:hover {
  filter: brightness(0.95);
}

.btn-secondary {
  background-color: transparent;
  color: var(--p-text);
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius);
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.preview-table {
  background-color: var(--p-surface);
  border: 1px solid var(--p-border);
  border-radius: var(--p-radius);
  overflow: hidden;
}
.preview-row {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  align-items: center;
  gap: 8px;
  padding: 0 var(--p-pad-x);
  height: var(--p-row-h);
  font-size: 12px;
  border-bottom: 1px solid var(--p-border);
}
.preview-row:last-child {
  border-bottom: none;
}
.preview-row-head {
  background-color: var(--p-surface-2);
  color: var(--p-text-muted);
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
}
.status-pill {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--p-radius);
  background-color: var(--p-primary-soft);
  color: var(--p-primary-strong);
}
.text-end {
  text-align: end;
}
</style>