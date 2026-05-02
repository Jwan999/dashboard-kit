<script setup>
import { computed, ref } from 'vue'
import { useConfigStore } from '../stores/config.js'
import ColorInput from '../components/ColorInput.vue'
import { readableTextOn, suggestNeutral } from '../utils/color.js'
import { NEUTRAL_PALETTES, NEUTRAL_LABELS } from '../utils/neutrals.js'

const config = useConfigStore()

const SCALE_STOPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]

const primary = computed({
  get: () => config.brand.primary,
  set: (v) => config.setPrimary(v),
})

const accent = computed({
  get: () => config.brand.accent,
  set: (v) => config.setAccent(v),
})

const accentEnabled = computed({
  get: () => config.brand.accentEnabled,
  set: (v) => config.setAccentEnabled(v),
})

const effectiveScale = computed(() => config.effectivePrimaryScale)

const overriddenStops = computed(() => Object.keys(config.brand.primaryScaleOverrides).map(Number))

const neutralSuggestion = computed(() => suggestNeutral(config.brand.primary))

const NEUTRAL_KEYS = ['cool', 'warm', 'true', 'slate']

function setNeutral(flavor) {
  config.setNeutral(flavor)
}

function setShade(stop, hex) {
  config.setPrimaryShadeOverride(stop, hex)
}
function resetShade(stop) {
  config.resetPrimaryShade(stop)
}
function resetAllShades() {
  config.resetAllPrimaryShades()
}

const editingStop = ref(null)

function isOverridden(stop) {
  return Object.prototype.hasOwnProperty.call(config.brand.primaryScaleOverrides, stop)
}

const SEMANTIC_KEYS = [
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
  { key: 'info', label: 'Info' },
]

function setSemantic(key, hex) {
  config.setSemantic(key, hex)
}

const LATIN_FONTS = ['Inter', 'Roboto', 'IBM Plex Sans', 'System UI']
const ARABIC_FONTS = ['IBM Plex Arabic', 'Cairo', 'Tajawal', 'Noto Sans Arabic']

const fontLatin = computed({
  get: () => config.brand.fontLatin,
  set: (v) => config.setBatch('brand', { fontLatin: v }),
})
const fontArabic = computed({
  get: () => config.brand.fontArabic,
  set: (v) => config.setBatch('brand', { fontArabic: v }),
})
const fontHosting = computed({
  get: () => config.brand.fontHosting,
  set: (v) => config.setBatch('brand', { fontHosting: v }),
})
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Brand Tokens</h2>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
        Foundation first. Colors and typography drive every component downstream.
      </p>
    </header>

    <!-- Primary -->
    <div class="card space-y-4">
      <div class="section-title">Primary color</div>
      <ColorInput v-model="primary" />

      <div>
        <div class="flex items-center justify-between mb-2">
          <div class="text-xs font-semibold" style="color: var(--color-text)">Auto-generated scale</div>
          <button
            v-if="overriddenStops.length"
            type="button"
            class="text-[11px] underline-offset-2 hover:underline"
            style="color: var(--color-primary)"
            @click="resetAllShades"
          >
            reset all to auto
          </button>
        </div>
        <div class="grid grid-cols-10 gap-1.5">
          <div
            v-for="stop in SCALE_STOPS"
            :key="stop"
            class="flex flex-col items-center gap-1"
          >
            <button
              type="button"
              class="w-full h-12 rounded-md border relative"
              :style="{
                backgroundColor: effectiveScale[stop],
                borderColor: 'var(--color-border)',
              }"
              :title="`${stop}: ${effectiveScale[stop]}`"
              @click="editingStop = editingStop === stop ? null : stop"
            >
              <span
                v-if="isOverridden(stop)"
                class="absolute top-1 end-1 w-1.5 h-1.5 rounded-full"
                style="background-color: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3)"
              ></span>
            </button>
            <div class="text-[9px] font-mono" style="color: var(--color-text-muted)">{{ stop }}</div>
            <div
              class="text-[9px] font-mono truncate w-full text-center"
              style="color: var(--color-text-muted)"
            >
              {{ effectiveScale[stop].slice(1) }}
            </div>
          </div>
        </div>

        <!-- Per-shade popover -->
        <div
          v-if="editingStop !== null"
          class="mt-3 rounded-md border p-3"
          style="background-color: var(--color-surface-2); border-color: var(--color-border)"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="text-xs font-semibold">Fine-tune shade {{ editingStop }}</div>
            <div class="flex items-center gap-2">
              <button
                v-if="isOverridden(editingStop)"
                type="button"
                class="text-[11px] underline-offset-2 hover:underline"
                style="color: var(--color-primary)"
                @click="resetShade(editingStop)"
              >
                reset to auto
              </button>
              <button
                type="button"
                class="text-[11px]"
                style="color: var(--color-text-muted)"
                @click="editingStop = null"
              >
                close
              </button>
            </div>
          </div>
          <ColorInput
            :model-value="effectiveScale[editingStop]"
            :show-paste="false"
            @update:model-value="(v) => setShade(editingStop, v)"
          />
        </div>
      </div>
    </div>

    <!-- Accent -->
    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <div class="section-title" style="margin-bottom: 4px">Accent color</div>
          <p class="text-xs" style="color: var(--color-text-muted)">
            Optional second-string color (links, highlights).
          </p>
        </div>
        <button
          type="button"
          class="toggle"
          :class="{ 'is-on': accentEnabled }"
          :aria-pressed="accentEnabled"
          @click="accentEnabled = !accentEnabled"
        ></button>
      </div>
      <div v-if="accentEnabled" class="mt-3">
        <ColorInput v-model="accent" />
      </div>
    </div>

    <!-- Neutral -->
    <div class="card">
      <div class="section-title">Neutral palette</div>
      <p class="section-sub">
        Suggested:
        <span style="color: var(--color-primary)">{{ NEUTRAL_LABELS[neutralSuggestion] }}</span>
        based on your primary's hue.
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="key in NEUTRAL_KEYS"
          :key="key"
          type="button"
          class="radio-card"
          :class="{ 'is-active': config.brand.neutral === key }"
          @click="setNeutral(key)"
        >
          <div class="radio-card-title flex items-center justify-between">
            <span>{{ NEUTRAL_LABELS[key] }}</span>
            <span
              v-if="key === neutralSuggestion"
              class="text-[9px] font-normal px-1.5 py-0.5 rounded-full"
              style="background-color: rgba(99, 102, 241, 0.18); color: var(--color-primary)"
            >
              suggested
            </span>
          </div>
          <div class="flex gap-0.5 mt-1">
            <div
              v-for="stop in [200, 400, 600, 800]"
              :key="stop"
              class="flex-1 h-3 rounded-sm"
              :style="{ backgroundColor: NEUTRAL_PALETTES[key][stop] }"
            ></div>
          </div>
        </button>
      </div>
    </div>

    <!-- Semantic -->
    <div class="card">
      <div class="section-title">Semantic colors</div>
      <p class="section-sub">Sensible defaults — override per project.</p>
      <div class="grid grid-cols-2 gap-3">
        <div v-for="item in SEMANTIC_KEYS" :key="item.key">
          <ColorInput
            :label="item.label"
            :model-value="config.brand.semantic[item.key]"
            :show-paste="false"
            @update:model-value="(v) => setSemantic(item.key, v)"
          />
        </div>
      </div>
    </div>

    <!-- Fonts -->
    <div class="card">
      <div class="section-title">Fonts</div>
      <p class="section-sub">Latin + Arabic fonts. Live preview below each.</p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="field-label" for="latin-font">Latin font</label>
          <select id="latin-font" v-model="fontLatin" class="select-input">
            <option v-for="f in LATIN_FONTS" :key="f" :value="f">{{ f }}</option>
          </select>
          <div
            class="mt-2 px-3 py-2 rounded-md text-sm"
            style="background-color: var(--color-surface-2); border: 1px solid var(--color-border)"
            :style="{ fontFamily: `${fontLatin}, ui-sans-serif, system-ui, sans-serif` }"
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
        <div>
          <label class="field-label" for="arabic-font">Arabic font</label>
          <select id="arabic-font" v-model="fontArabic" class="select-input">
            <option v-for="f in ARABIC_FONTS" :key="f" :value="f">{{ f }}</option>
          </select>
          <div
            class="mt-2 px-3 py-2 rounded-md text-sm"
            style="background-color: var(--color-surface-2); border: 1px solid var(--color-border)"
            :style="{ fontFamily: `${fontArabic}, 'Noto Sans Arabic', ui-sans-serif, sans-serif` }"
            dir="rtl"
          >
            نموذج النص العربي السريع
          </div>
        </div>
      </div>

      <div class="mt-4">
        <div class="field-label">Hosting</div>
        <div class="segmented">
          <button
            type="button"
            :class="{ 'is-active': fontHosting === 'self' }"
            @click="fontHosting = 'self'"
          >
            Self-host (recommended)
          </button>
          <button
            type="button"
            :class="{ 'is-active': fontHosting === 'cdn' }"
            @click="fontHosting = 'cdn'"
          >
            Google Fonts CDN
          </button>
        </div>
        <div class="field-hint">
          Self-hosting is faster on slow connections and avoids third-party tracking.
        </div>
      </div>
    </div>
  </div>
</template>
