<script setup>
import { computed, ref } from 'vue'
import { useConfigStore } from '../stores/config.js'
import { RADIUS_MAP, DENSITY_MAP, SHADOW_MAP, MOTION_MAP } from '../utils/visual.js'

const config = useConfigStore()

const RADIUS_OPTIONS = [
  { key: 'sharp', label: 'Sharp', desc: '0px — modernist, hard edges.' },
  { key: 'subtle', label: 'Subtle', desc: '6px — quiet softening.' },
  { key: 'rounded', label: 'Rounded', desc: '12px — friendly default.' },
  { key: 'pill', label: 'Pill', desc: '9999px — playful, casual.' },
]

const SHADOW_OPTIONS = [
  { key: 'flat', label: 'Flat', desc: 'No shadow. Cleanest.' },
  { key: 'soft', label: 'Soft', desc: 'One light layer.' },
  { key: 'layered', label: 'Layered', desc: 'Multi-layer depth.' },
]

const DENSITY_OPTIONS = [
  { key: 'comfortable', label: 'Comfortable' },
  { key: 'default', label: 'Default' },
  { key: 'compact', label: 'Compact' },
]

const MOTION_OPTIONS = [
  { key: 'minimal', label: 'Minimal' },
  { key: 'standard', label: 'Standard' },
  { key: 'expressive', label: 'Expressive' },
]

function setRadius(k) {
  config.setBatch('visual', { radius: k })
}
function setDensity(k) {
  config.setBatch('visual', { density: k })
}
function setShadow(k) {
  config.setBatch('visual', { shadow: k })
}
function setMotion(k) {
  config.setBatch('visual', { motion: k })
}

const density = computed(() => DENSITY_MAP[config.visual.density])
const motion = computed(() => MOTION_MAP[config.visual.motion])

const showMotionModal = ref(false)
function testMotion() {
  showMotionModal.value = true
  setTimeout(() => {
    showMotionModal.value = false
  }, Math.max(motion.value.duration + 800, 1400))
}

const motionStyle = computed(() => ({
  transition: `transform ${motion.value.duration}ms ${motion.value.easing}, opacity ${motion.value.duration}ms ${motion.value.easing}`,
}))
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Visual Language</h2>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
        The personality dial: sharp vs soft, dense vs roomy, still vs lively.
      </p>
    </header>

    <!-- Radius -->
    <div class="card">
      <div class="section-title">Radius</div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          v-for="opt in RADIUS_OPTIONS"
          :key="opt.key"
          type="button"
          class="radio-card"
          :class="{ 'is-active': config.visual.radius === opt.key }"
          @click="setRadius(opt.key)"
        >
          <div class="radio-card-title">{{ opt.label }}</div>
          <div class="radio-card-desc">{{ opt.desc }}</div>
          <div class="mt-2 flex items-center justify-center">
            <div
              class="px-3 py-1.5 text-[11px] font-semibold text-white"
              :style="{ backgroundColor: 'var(--color-primary)', borderRadius: RADIUS_MAP[opt.key] }"
            >
              Button
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Density -->
    <div class="card">
      <div class="section-title">Density</div>
      <div class="segmented mb-3">
        <button
          v-for="opt in DENSITY_OPTIONS"
          :key="opt.key"
          type="button"
          :class="{ 'is-active': config.visual.density === opt.key }"
          @click="setDensity(opt.key)"
        >
          {{ opt.label }}
        </button>
      </div>
      <div
        class="rounded-md border overflow-hidden"
        style="border-color: var(--color-border); background-color: var(--color-surface-2)"
      >
        <div
          v-for="row in ['Sara Ali', 'Hasan Q.', 'Lina M.']"
          :key="row"
          class="flex items-center justify-between border-b last:border-b-0"
          :style="{
            paddingTop: density.padY,
            paddingBottom: density.padY,
            paddingInline: density.padX,
            fontSize: density.fontSize,
            borderColor: 'var(--color-border)',
          }"
        >
          <span>{{ row }}</span>
          <span class="text-xs" style="color: var(--color-text-muted)">Active</span>
        </div>
      </div>
    </div>

    <!-- Shadow -->
    <div class="card">
      <div class="section-title">Shadow</div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          v-for="opt in SHADOW_OPTIONS"
          :key="opt.key"
          type="button"
          class="radio-card"
          :class="{ 'is-active': config.visual.shadow === opt.key }"
          @click="setShadow(opt.key)"
        >
          <div class="radio-card-title">{{ opt.label }}</div>
          <div class="radio-card-desc">{{ opt.desc }}</div>
          <div class="mt-3 flex items-center justify-center" style="padding: 12px 0">
            <div
              class="w-24 h-12 rounded-md"
              style="background-color: #fff"
              :style="{ boxShadow: SHADOW_MAP[opt.key] }"
            ></div>
          </div>
        </button>
      </div>
    </div>

    <!-- Motion -->
    <div class="card">
      <div class="section-title">Motion</div>
      <div class="flex items-center gap-3 mb-3">
        <div class="segmented">
          <button
            v-for="opt in MOTION_OPTIONS"
            :key="opt.key"
            type="button"
            :class="{ 'is-active': config.visual.motion === opt.key }"
            @click="setMotion(opt.key)"
          >
            {{ opt.label }}
          </button>
        </div>
        <button
          type="button"
          class="text-xs px-3 py-1.5 rounded-md border"
          style="border-color: var(--color-border); color: var(--color-text)"
          @click="testMotion"
        >
          Test it
        </button>
      </div>
      <div class="text-xs" style="color: var(--color-text-muted)">
        {{ motion.duration }}ms · <code>{{ motion.easing }}</code>
      </div>
    </div>

    <!-- Motion test modal -->
    <div v-if="showMotionModal" class="motion-modal-backdrop" @click.self="showMotionModal = false">
      <div class="motion-modal motion-modal-anim" :style="motionStyle">
        <div class="text-base font-semibold">Hello!</div>
        <div class="mt-1 text-xs" style="color: var(--color-text-muted)">
          {{ motion.duration }}ms · {{ config.visual.motion }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.motion-modal-anim {
  animation: motionPop var(--motion-dur, 200ms) var(--motion-ease, ease-out);
}
@keyframes motionPop {
  from {
    transform: scale(0.85) translateY(8px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>