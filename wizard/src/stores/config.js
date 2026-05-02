import { defineStore } from 'pinia'
import { generateScale, suggestNeutral, normalizeHex } from '../utils/color.js'

const STORAGE_KEY = 'dashboard-kit:wizard:v1'

/**
 * Default state — Iraq-friendly defaults: Arabic + English, RTL, slow-connection budget,
 * WCAG AA on. Brand defaults to indigo so the preview pane has color from frame 1.
 */
function defaultState() {
  const primary = '#6366f1'
  return {
    identity: {
      displayName: '',
      machineName: '',
      machineNameAuto: true,
      description: '',
      logoLight: null, // { name, type, dataUrl }
      logoDark: null,
      logoDarkAuto: true, // when true, dark variant is derived from light via CSS filter
      domain: '',
      routePrefix: '/dashboard',
    },
    language: {
      languages: ['ar', 'en'],
      defaultLanguage: 'ar',
      direction: 'rtl', // 'rtl' | 'ltr' | 'auto'
      fallbackLocale: 'en',
    },
    brand: {
      primary,
      primaryScale: generateScale(primary),
      primaryScaleOverrides: {}, // stop -> hex (per-shade overrides)
      accent: '#22d3ee',
      accentEnabled: false,
      neutral: suggestNeutral(primary), // 'cool' | 'warm' | 'true' | 'slate'
      semantic: {
        success: '#16a34a',
        warning: '#f59e0b',
        error: '#dc2626',
        info: '#0ea5e9',
      },
      fontLatin: 'Inter',
      fontArabic: 'IBM Plex Arabic',
      fontHosting: 'self', // 'self' | 'cdn'
    },
    visual: {
      radius: 'rounded', // 'sharp' | 'subtle' | 'rounded' | 'pill'
      density: 'default', // 'comfortable' | 'default' | 'compact'
      shadow: 'soft', // 'flat' | 'soft' | 'layered'
      motion: 'standard', // 'minimal' | 'standard' | 'expressive'
    },
    architecture: {
      integrationModel: 'inertia', // 'inertia' | 'spa'
      auth: 'sanctum-cookie', // 'sanctum-cookie' | 'sanctum-tokens' | 'external-idp'
      multiTenant: false,
      tenancyStrategy: 'path', // 'path' | 'subdomain' | 'header'
    },
    data: {
      chartsLibrary: 'echarts', // 'echarts' | 'chartjs' | 'apexcharts' | 'recharts'
      tables: {
        pagination: true,
        bulkActions: false,
        rowSelection: true,
        export: true,
      },
      realTime: 'none', // 'none' | 'polling' | 'websockets'
    },
    operational: {
      deploymentTarget: 'forge', // 'forge' | 'pm2-nginx' | 'vercel' | 'other'
      performanceBudget: 'slow', // 'standard' | 'slow'
      accessibility: true,
    },
  }
}

function loadPersisted() {
  if (typeof window === 'undefined' || !window.localStorage) return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed
  } catch (_) {
    return null
  }
  return null
}

function persist(state) {
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const snapshot = {
      identity: state.identity,
      language: state.language,
      brand: state.brand,
      visual: state.visual,
      architecture: state.architecture,
      data: state.data,
      operational: state.operational,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch (_) {
    // localStorage may be full or disabled — fail silently.
  }
}

export const useConfigStore = defineStore('config', {
  state: () => {
    const base = defaultState()
    const persisted = loadPersisted()
    if (!persisted) return base
    // Shallow-merge by section so newly added fields in later versions still get defaults.
    return {
      identity: { ...base.identity, ...(persisted.identity || {}) },
      language: { ...base.language, ...(persisted.language || {}) },
      brand: {
        ...base.brand,
        ...(persisted.brand || {}),
        semantic: { ...base.brand.semantic, ...((persisted.brand || {}).semantic || {}) },
      },
      visual: { ...base.visual, ...(persisted.visual || {}) },
      architecture: { ...base.architecture, ...(persisted.architecture || {}) },
      data: {
        ...base.data,
        ...(persisted.data || {}),
        tables: { ...base.data.tables, ...((persisted.data || {}).tables || {}) },
      },
      operational: { ...base.operational, ...(persisted.operational || {}) },
    }
  },

  getters: {
    /**
     * Effective primary scale = generated scale overlaid with per-shade overrides.
     */
    effectivePrimaryScale(state) {
      return { ...state.brand.primaryScale, ...state.brand.primaryScaleOverrides }
    },

    /**
     * Resolved direction for the preview — 'auto' resolves to the default language's natural dir.
     */
    resolvedDirection(state) {
      if (state.language.direction !== 'auto') return state.language.direction
      const rtlLangs = new Set(['ar', 'fa', 'he', 'ur'])
      return rtlLangs.has(state.language.defaultLanguage) ? 'rtl' : 'ltr'
    },

    /**
     * The `dashboard.config.json` shape an end user will produce. Phase 3 reads this verbatim.
     */
    asJson(state) {
      return {
        $schema: 'https://github.com/Jwan999/dashboard-kit/schema/v1',
        version: '0.2.0',
        generatedAt: new Date().toISOString(),
        identity: {
          displayName: state.identity.displayName,
          machineName: state.identity.machineName,
          description: state.identity.description,
          logoLight: state.identity.logoLight
            ? { name: state.identity.logoLight.name, type: state.identity.logoLight.type }
            : null,
          logoDark: state.identity.logoDark
            ? { name: state.identity.logoDark.name, type: state.identity.logoDark.type }
            : null,
          logoDarkDerived: state.identity.logoDarkAuto && !state.identity.logoDark,
          domain: state.identity.domain,
          routePrefix: state.identity.routePrefix,
        },
        language: { ...state.language },
        brand: {
          primary: state.brand.primary,
          primaryScale: { ...state.brand.primaryScale, ...state.brand.primaryScaleOverrides },
          accent: state.brand.accentEnabled ? state.brand.accent : null,
          neutral: state.brand.neutral,
          semantic: { ...state.brand.semantic },
          fontLatin: state.brand.fontLatin,
          fontArabic: state.brand.fontArabic,
          fontHosting: state.brand.fontHosting,
        },
        visual: { ...state.visual },
        architecture: { ...state.architecture },
        data: {
          chartsLibrary: state.data.chartsLibrary,
          tables: { ...state.data.tables },
          realTime: state.data.realTime,
        },
        operational: { ...state.operational },
      }
    },
  },

  actions: {
    /** Patch a section. */
    setBatch(key, patch) {
      if (!Object.prototype.hasOwnProperty.call(this.$state, key)) return
      this[key] = { ...this[key], ...patch }
    },

    /** Patch identity, with auto-slug if machineName is in auto mode. */
    setIdentity(patch) {
      const next = { ...this.identity, ...patch }
      if (next.machineNameAuto && (patch.displayName !== undefined || !next.machineName)) {
        next.machineName = slugify(next.displayName || '')
      }
      this.identity = next
    },

    setMachineName(value) {
      this.identity = { ...this.identity, machineName: value, machineNameAuto: false }
    },

    resetMachineNameToAuto() {
      this.identity = {
        ...this.identity,
        machineName: slugify(this.identity.displayName || ''),
        machineNameAuto: true,
      }
    },

    setLogo(variant, file) {
      // file: { name, type, dataUrl } or null
      if (variant === 'light') this.identity = { ...this.identity, logoLight: file }
      if (variant === 'dark') this.identity = { ...this.identity, logoDark: file, logoDarkAuto: !file }
    },

    setDarkLogoAuto(auto) {
      this.identity = { ...this.identity, logoDarkAuto: !!auto, logoDark: auto ? null : this.identity.logoDark }
    },

    /** Set primary color, regenerate scale, suggest neutral. */
    setPrimary(hex) {
      const safe = normalizeHex(hex) || this.brand.primary
      const scale = generateScale(safe)
      this.brand = {
        ...this.brand,
        primary: safe,
        primaryScale: scale,
        primaryScaleOverrides: {},
        neutral: suggestNeutral(safe),
      }
    },

    setPrimaryShadeOverride(stop, hex) {
      const safe = normalizeHex(hex)
      if (!safe) return
      this.brand = {
        ...this.brand,
        primaryScaleOverrides: { ...this.brand.primaryScaleOverrides, [stop]: safe },
      }
    },

    resetPrimaryShade(stop) {
      const next = { ...this.brand.primaryScaleOverrides }
      delete next[stop]
      this.brand = { ...this.brand, primaryScaleOverrides: next }
    },

    resetAllPrimaryShades() {
      this.brand = { ...this.brand, primaryScaleOverrides: {} }
    },

    setAccent(hex) {
      const safe = normalizeHex(hex) || this.brand.accent
      this.brand = { ...this.brand, accent: safe }
    },

    setAccentEnabled(enabled) {
      this.brand = { ...this.brand, accentEnabled: !!enabled }
    },

    setNeutral(flavor) {
      this.brand = { ...this.brand, neutral: flavor }
    },

    setSemantic(key, hex) {
      const safe = normalizeHex(hex)
      if (!safe) return
      this.brand = { ...this.brand, semantic: { ...this.brand.semantic, [key]: safe } }
    },

    setLanguages(list) {
      const next = Array.isArray(list) ? Array.from(new Set(list)) : []
      let defaultLanguage = this.language.defaultLanguage
      let fallbackLocale = this.language.fallbackLocale
      if (!next.includes(defaultLanguage)) defaultLanguage = next[0] || ''
      if (!next.includes(fallbackLocale)) fallbackLocale = next.find((l) => l !== defaultLanguage) || defaultLanguage
      this.language = { ...this.language, languages: next, defaultLanguage, fallbackLocale }
    },

    setDataTables(patch) {
      this.data = { ...this.data, tables: { ...this.data.tables, ...patch } }
    },

    /** Reset everything to defaults and clear persisted state. */
    reset() {
      this.$patch(defaultState())
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(STORAGE_KEY)
        }
      } catch (_) {
        /* noop */
      }
    },
  },
})

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

/**
 * Subscribe the store to localStorage persistence. Called once from main.js
 * after the Pinia instance is wired so the wizard auto-saves on every change.
 */
export function attachPersistence(pinia) {
  const store = useConfigStore(pinia)
  store.$subscribe((_mutation, state) => persist(state), { detached: true })
}