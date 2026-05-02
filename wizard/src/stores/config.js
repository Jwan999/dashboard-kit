import { defineStore } from 'pinia'

/**
 * Wizard config store.
 *
 * Phase 1: empty schema per batch. Phase 2 will populate these as the user clicks through.
 * Phase 3 will serialize this into `dashboard.config.json` and feed it to the scaffold emitter.
 */
export const useConfigStore = defineStore('config', {
  state: () => ({
    identity: {
      // name, displayName, description, logoLight, logoDark, routePrefix
    },
    language: {
      // locales, defaultLocale, direction, fallback
    },
    brand: {
      // primary, accent, neutral, semantics, fontLatin, fontArabic
    },
    visual: {
      // radius, density, shadow, motion
    },
    architecture: {
      // model (inertia|spa), auth, multiTenant
    },
    data: {
      // chartLib, tableFeatures, realtime
    },
    operational: {
      // deployTarget, performanceBudget, a11yTarget
    },
  }),

  getters: {
    /**
     * Returns the full config as a plain object — what Phase 3 will write to dashboard.config.json.
     */
    asJson: (state) => ({
      $schema: 'https://github.com/Jwan999/dashboard-kit/schema/v1',
      version: '0.1.0',
      identity: state.identity,
      language: state.language,
      brand: state.brand,
      visual: state.visual,
      architecture: state.architecture,
      data: state.data,
      operational: state.operational,
    }),
  },

  actions: {
    /**
     * Patch a single batch (e.g. setBatch('brand', { primary: '#6366f1' })).
     */
    setBatch(key, patch) {
      if (!Object.prototype.hasOwnProperty.call(this.$state, key)) {
        return
      }
      this[key] = { ...this[key], ...patch }
    },

    reset() {
      this.$reset()
    },
  },
})