<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Stepper from './Stepper.vue'
import PreviewPane from './PreviewPane.vue'
import { stepDefinitions } from '../router.js'

const route = useRoute()
const router = useRouter()

const currentStepIndex = computed(() => {
  const idx = route.meta?.stepIndex
  return typeof idx === 'number' ? idx : 1
})

const totalSteps = stepDefinitions.length

const currentStepName = computed(() => route.meta?.stepName ?? '')

const isFirst = computed(() => currentStepIndex.value <= 1)
const isLast = computed(() => currentStepIndex.value >= totalSteps)

function goPrev() {
  if (isFirst.value) return
  const target = stepDefinitions[currentStepIndex.value - 2]
  router.push(target.path)
}

function goNext() {
  if (isLast.value) return
  const target = stepDefinitions[currentStepIndex.value]
  router.push(target.path)
}

function skipStep() {
  // Phase 2 will mark this batch as "skipped" in the store before navigating.
  goNext()
}
</script>

<template>
  <div class="flex h-full w-full">
    <!-- Left: Stepper -->
    <aside
      class="hidden md:flex w-72 shrink-0 border-e flex-col"
      style="border-color: var(--color-border); background-color: var(--color-surface)"
    >
      <div
        class="px-5 py-5 border-b"
        style="border-color: var(--color-border)"
      >
        <div class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted)">
          dashboard-kit
        </div>
        <div class="mt-1 text-base font-semibold">Scaffolding wizard</div>
        <div class="mt-0.5 text-xs" style="color: var(--color-text-muted)">
          Phase 1 — placeholder shell
        </div>
      </div>
      <Stepper :current="currentStepIndex" :steps="stepDefinitions" class="flex-1 overflow-y-auto" />
    </aside>

    <!-- Center: Active step -->
    <main class="flex-1 flex flex-col min-w-0">
      <header
        class="flex items-center justify-between px-6 py-4 border-b"
        style="border-color: var(--color-border); background-color: var(--color-surface)"
      >
        <div class="min-w-0">
          <div class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted)">
            Step {{ currentStepIndex }} of {{ totalSteps }}
          </div>
          <h1 class="mt-0.5 text-lg font-semibold truncate">{{ currentStepName }}</h1>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="px-3 py-2 text-sm rounded-md border transition disabled:opacity-40 disabled:cursor-not-allowed"
            style="border-color: var(--color-border); color: var(--color-text)"
            :disabled="isFirst"
            @click="goPrev"
          >
            Back
          </button>
          <button
            v-if="!isLast"
            type="button"
            class="px-3 py-2 text-sm rounded-md border transition"
            style="border-color: var(--color-border); color: var(--color-text-muted)"
            @click="skipStep"
          >
            Skip
          </button>
          <button
            type="button"
            class="px-4 py-2 text-sm rounded-md font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
            style="background-color: var(--color-primary); color: white"
            :disabled="isLast"
            @click="goNext"
          >
            Next
          </button>
        </div>
      </header>

      <section class="flex-1 overflow-y-auto px-6 py-6">
        <router-view />
      </section>
    </main>

    <!-- Right: Preview -->
    <aside
      class="hidden lg:flex w-96 shrink-0 border-s"
      style="border-color: var(--color-border); background-color: var(--color-surface)"
    >
      <PreviewPane class="w-full" />
    </aside>
  </div>
</template>