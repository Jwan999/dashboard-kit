<script setup>
import { computed, ref, watch } from 'vue'
import { normalizeHex } from '../utils/color.js'

const props = defineProps({
  modelValue: { type: String, required: true },
  label: { type: String, default: '' },
  showPaste: { type: Boolean, default: true },
})
const emit = defineEmits(['update:modelValue'])

const hexLocal = ref(props.modelValue)
const dirty = ref(false)
const pasteState = ref('')

watch(
  () => props.modelValue,
  (v) => {
    if (!dirty.value) hexLocal.value = v
  },
)

const isValid = computed(() => normalizeHex(hexLocal.value) !== null)

function commitHex() {
  const safe = normalizeHex(hexLocal.value)
  dirty.value = false
  if (safe) {
    emit('update:modelValue', safe)
    hexLocal.value = safe
  } else {
    hexLocal.value = props.modelValue
  }
}

function onColorInput(e) {
  const safe = normalizeHex(e.target.value)
  if (safe) {
    hexLocal.value = safe
    emit('update:modelValue', safe)
  }
}

function onHexInput(e) {
  dirty.value = true
  hexLocal.value = e.target.value
}

async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    const safe = normalizeHex(text)
    if (safe) {
      hexLocal.value = safe
      emit('update:modelValue', safe)
      pasteState.value = 'ok'
    } else {
      pasteState.value = 'bad'
    }
  } catch (_) {
    pasteState.value = 'bad'
  }
  setTimeout(() => (pasteState.value = ''), 1200)
}
</script>

<template>
  <div>
    <label v-if="label" class="field-label">{{ label }}</label>
    <div class="flex items-center gap-2">
      <input
        type="color"
        class="swatch"
        :value="modelValue"
        @input="onColorInput"
      />
      <input
        type="text"
        class="text-input font-mono"
        style="max-width: 130px"
        :value="hexLocal"
        @input="onHexInput"
        @blur="commitHex"
        @keydown.enter.prevent="commitHex"
      />
      <button
        v-if="showPaste"
        type="button"
        class="text-xs px-2 py-1 rounded-md border"
        style="border-color: var(--color-border); color: var(--color-text-muted)"
        @click="pasteFromClipboard"
      >
        {{ pasteState === 'ok' ? 'pasted' : pasteState === 'bad' ? 'invalid' : 'paste' }}
      </button>
    </div>
    <div v-if="!isValid" class="field-error">Hex must be 3 or 6 chars (e.g. #6366f1).</div>
  </div>
</template>
