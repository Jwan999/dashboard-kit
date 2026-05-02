<script setup>
import { computed } from 'vue'
import { useConfigStore } from '../stores/config.js'

const config = useConfigStore()

const LANGUAGES = [
  { code: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { code: 'fr', label: 'French', native: 'Français', dir: 'ltr' },
  { code: 'ku', label: 'Kurdish', native: 'کوردی', dir: 'rtl' },
  { code: 'tr', label: 'Turkish', native: 'Türkçe', dir: 'ltr' },
]

const selected = computed(() => new Set(config.language.languages))

function toggleLang(code) {
  const next = new Set(selected.value)
  if (next.has(code)) {
    next.delete(code)
  } else {
    next.add(code)
  }
  config.setLanguages(Array.from(next))
}

function setDefault(code) {
  if (!selected.value.has(code)) return
  let fallback = config.language.fallbackLocale
  if (fallback === code) {
    fallback = config.language.languages.find((l) => l !== code) || code
  }
  config.setBatch('language', { defaultLanguage: code, fallbackLocale: fallback })
}

function setDirection(dir) {
  config.setBatch('language', { direction: dir })
}

function setFallback(code) {
  config.setBatch('language', { fallbackLocale: code })
}

const direction = computed(() => config.language.direction)
const fallbackOptions = computed(() =>
  LANGUAGES.filter((l) => selected.value.has(l.code) && l.code !== config.language.defaultLanguage),
)
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Language & Direction</h2>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
        Pick the languages this dashboard ships with. The preview pane flips immediately when you change direction.
      </p>
    </header>

    <div class="card">
      <div class="section-title">Languages</div>
      <p class="section-sub">Defaults to Arabic + English (Iraq-friendly).</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="lang in LANGUAGES"
          :key="lang.code"
          type="button"
          class="chip"
          :class="{ 'is-active': selected.has(lang.code) }"
          @click="toggleLang(lang.code)"
        >
          <span>{{ lang.label }}</span>
          <span style="opacity: 0.7">{{ lang.native }}</span>
        </button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Default language</div>
      <p class="section-sub">Which language loads first.</p>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          v-for="lang in LANGUAGES.filter((l) => selected.has(l.code))"
          :key="lang.code"
          type="button"
          class="radio-card"
          :class="{ 'is-active': config.language.defaultLanguage === lang.code }"
          @click="setDefault(lang.code)"
        >
          <div class="radio-card-title">{{ lang.label }}</div>
          <div class="radio-card-desc">{{ lang.native }} · {{ lang.dir.toUpperCase() }}</div>
        </button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Default direction</div>
      <p class="section-sub">Auto follows the default language's natural direction.</p>
      <div class="segmented">
        <button
          type="button"
          :class="{ 'is-active': direction === 'rtl' }"
          @click="setDirection('rtl')"
        >
          RTL
        </button>
        <button
          type="button"
          :class="{ 'is-active': direction === 'ltr' }"
          @click="setDirection('ltr')"
        >
          LTR
        </button>
        <button
          type="button"
          :class="{ 'is-active': direction === 'auto' }"
          @click="setDirection('auto')"
        >
          Auto
        </button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Locale fallback</div>
      <p class="section-sub">Used when a translation key is missing from the active language.</p>
      <select
        v-if="fallbackOptions.length"
        class="select-input max-w-xs"
        :value="config.language.fallbackLocale"
        @change="setFallback($event.target.value)"
      >
        <option v-for="lang in fallbackOptions" :key="lang.code" :value="lang.code">
          {{ lang.label }} ({{ lang.native }})
        </option>
      </select>
      <p v-else class="text-xs" style="color: var(--color-text-muted)">
        Add a second language above to set a fallback.
      </p>
    </div>
  </div>
</template>
