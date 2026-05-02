<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  current: { type: Number, required: true },
  steps: { type: Array, required: true },
})

const router = useRouter()

function isComplete(stepIndex) {
  return stepIndex < props.current
}

function isActive(stepIndex) {
  return stepIndex === props.current
}

function go(step) {
  router.push(step.path)
}
</script>

<template>
  <nav class="px-3 py-4">
    <ol class="space-y-1">
      <li v-for="step in steps" :key="step.key">
        <button
          type="button"
          class="group w-full flex items-center gap-3 rounded-md px-3 py-2 text-start transition"
          :class="{
            'bg-[color:var(--color-surface-2)]': isActive(step.index),
            'hover:bg-[color:var(--color-surface-2)]': !isActive(step.index),
          }"
          @click="go(step)"
        >
          <span
            class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0 border"
            :style="
              isActive(step.index)
                ? 'background-color: var(--color-primary); border-color: var(--color-primary); color: white'
                : isComplete(step.index)
                ? 'background-color: var(--color-primary-soft); border-color: var(--color-primary-soft); color: white'
                : 'background-color: transparent; border-color: var(--color-border); color: var(--color-text-muted)'
            "
          >
            {{ step.index === 8 ? '✓' : step.index }}
          </span>
          <span
            class="flex-1 min-w-0 text-sm truncate"
            :style="
              isActive(step.index)
                ? 'color: var(--color-text); font-weight: 600'
                : 'color: var(--color-text-muted)'
            "
          >
            {{ step.name }}
          </span>
        </button>
      </li>
    </ol>
  </nav>
</template>