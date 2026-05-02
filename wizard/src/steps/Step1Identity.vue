<script setup>
import { computed, ref } from 'vue'
import { useConfigStore } from '../stores/config.js'
import { readFileAsDataUrl } from '../utils/file.js'

const config = useConfigStore()

const machineEditing = ref(false)
const dragOver = ref({ light: false, dark: false })
const fileError = ref({ light: '', dark: '' })

const displayName = computed({
  get: () => config.identity.displayName,
  set: (v) => config.setIdentity({ displayName: v }),
})

const description = computed({
  get: () => config.identity.description,
  set: (v) => config.setIdentity({ description: v }),
})

const machineName = computed({
  get: () => config.identity.machineName,
  set: (v) => config.setMachineName(v),
})

const routePrefix = computed({
  get: () => config.identity.routePrefix,
  set: (v) => config.setIdentity({ routePrefix: v }),
})

const domain = computed({
  get: () => config.identity.domain,
  set: (v) => config.setIdentity({ domain: v }),
})

// Validation: routePrefix must start with `/` OR be a valid hostname.
const HOST_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i
const routeError = computed(() => {
  const v = (routePrefix.value || '').trim()
  if (!v) return ''
  if (v.startsWith('/')) {
    if (!/^\/[a-z0-9-/_]*$/i.test(v)) return 'Path may only contain letters, numbers, "-", "_", "/".'
    return ''
  }
  if (HOST_RE.test(v)) return ''
  return 'Must start with "/" (route prefix) or be a valid hostname (e.g. app.example.com).'
})

const domainError = computed(() => {
  const v = (domain.value || '').trim()
  if (!v) return ''
  if (HOST_RE.test(v)) return ''
  return 'Hostname looks invalid (e.g. dashboard.example.com).'
})

function toggleMachineEdit() {
  machineEditing.value = !machineEditing.value
  if (!machineEditing.value && !config.identity.machineName) {
    config.resetMachineNameToAuto()
  }
}

function resetMachineName() {
  config.resetMachineNameToAuto()
  machineEditing.value = false
}

async function handleFile(variant, file) {
  fileError.value[variant] = ''
  if (!file) return
  try {
    const stored = await readFileAsDataUrl(file)
    config.setLogo(variant, stored)
  } catch (err) {
    fileError.value[variant] = err.message || 'Failed to read file.'
  }
}

function onDrop(variant, evt) {
  evt.preventDefault()
  dragOver.value[variant] = false
  const file = evt.dataTransfer?.files?.[0]
  if (file) handleFile(variant, file)
}

function onPick(variant, evt) {
  const file = evt.target.files?.[0]
  if (file) handleFile(variant, file)
  evt.target.value = ''
}

function clearLogo(variant) {
  config.setLogo(variant, null)
  fileError.value[variant] = ''
}

const lightLogo = computed(() => config.identity.logoLight)
const darkLogo = computed(() => config.identity.logoDark)
const darkAuto = computed(() => config.identity.logoDarkAuto)
const derivedDarkPreview = computed(() => lightLogo.value?.dataUrl || null)

function toggleDarkMode() {
  config.setDarkLogoAuto(!darkAuto.value)
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Identity & Purpose</h2>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
        Tell the wizard who this dashboard is for and what it should be called.
      </p>
    </header>

    <div class="card space-y-4">
      <div>
        <label class="field-label" for="display-name">Display name</label>
        <input
          id="display-name"
          v-model="displayName"
          type="text"
          class="text-input"
          placeholder="Messarat Admin"
          autocomplete="off"
        />
        <div class="field-hint">Shown in the header and browser tab.</div>
      </div>

      <div>
        <label class="field-label">Machine name</label>
        <div class="flex items-center gap-2">
          <input
            v-if="machineEditing"
            v-model="machineName"
            type="text"
            class="text-input"
            placeholder="messarat-admin"
            autocomplete="off"
          />
          <code
            v-else
            class="flex-1 px-3 py-2 rounded-md text-xs font-mono"
            style="background-color: var(--color-surface-2); color: var(--color-text-muted); border: 1px solid var(--color-border)"
          >
            {{ machineName || 'auto-generated from display name' }}
          </code>
          <button
            type="button"
            class="text-xs underline-offset-2 hover:underline"
            style="color: var(--color-primary)"
            @click="toggleMachineEdit"
          >
            {{ machineEditing ? 'done' : 'edit' }}
          </button>
          <button
            v-if="!config.identity.machineNameAuto"
            type="button"
            class="text-xs underline-offset-2 hover:underline"
            style="color: var(--color-text-muted)"
            @click="resetMachineName"
          >
            reset
          </button>
        </div>
        <div class="field-hint">
          Used in package names and folders. Lowercase, hyphenated.
        </div>
      </div>

      <div>
        <label class="field-label" for="description">Description</label>
        <textarea
          id="description"
          v-model="description"
          class="text-area"
          placeholder="Who uses this dashboard, and what do they do here?"
        />
      </div>

      <div>
        <label class="field-label" for="domain">Domain (optional)</label>
        <input
          id="domain"
          v-model="domain"
          type="text"
          class="text-input"
          placeholder="dashboard.example.com"
          autocomplete="off"
        />
        <div v-if="domainError" class="field-error">{{ domainError }}</div>
        <div v-else class="field-hint">Just for documentation; nothing is wired here yet.</div>
      </div>

      <div>
        <label class="field-label" for="route">Route prefix</label>
        <input
          id="route"
          v-model="routePrefix"
          type="text"
          class="text-input"
          placeholder="/dashboard"
          autocomplete="off"
        />
        <div v-if="routeError" class="field-error">{{ routeError }}</div>
        <div v-else class="field-hint">e.g. <span class="kbd">/admin</span> or <span class="kbd">/app</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Logo</div>
      <p class="section-sub">SVG, PNG, JPEG, or WebP up to 512&nbsp;KB each.</p>

      <div class="grid grid-cols-2 gap-3">
        <!-- Light variant -->
        <div>
          <div class="field-label">Light variant</div>
          <label
            class="dropzone block"
            :class="{ 'is-over': dragOver.light }"
            @dragover.prevent="dragOver.light = true"
            @dragleave="dragOver.light = false"
            @drop="onDrop('light', $event)"
          >
            <input
              type="file"
              class="hidden"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              @change="onPick('light', $event)"
            />
            <div v-if="!lightLogo" class="text-xs" style="color: var(--color-text-muted)">
              Drop or click to upload
            </div>
            <div v-else class="flex flex-col items-center gap-2">
              <div
                class="w-20 h-20 rounded-md flex items-center justify-center"
                style="background-color: #fff"
              >
                <img :src="lightLogo.dataUrl" :alt="lightLogo.name" class="max-w-full max-h-full" />
              </div>
              <div class="text-[11px] truncate w-full" style="color: var(--color-text-muted)">
                {{ lightLogo.name }}
              </div>
            </div>
          </label>
          <div class="flex items-center justify-between mt-1">
            <div v-if="fileError.light" class="field-error">{{ fileError.light }}</div>
            <div v-else class="field-hint">Used on light backgrounds.</div>
            <button
              v-if="lightLogo"
              type="button"
              class="text-[11px] underline-offset-2 hover:underline"
              style="color: var(--color-text-muted)"
              @click="clearLogo('light')"
            >
              remove
            </button>
          </div>
        </div>

        <!-- Dark variant -->
        <div>
          <div class="field-label flex items-center justify-between">
            <span>Dark variant</span>
            <button
              type="button"
              class="text-[11px] underline-offset-2 hover:underline font-normal"
              style="color: var(--color-primary)"
              @click="toggleDarkMode"
            >
              {{ darkAuto ? 'upload your own' : 'derive from light' }}
            </button>
          </div>

          <!-- Auto-derived preview -->
          <div
            v-if="darkAuto"
            class="dropzone flex items-center justify-center"
            style="cursor: default"
          >
            <div v-if="!derivedDarkPreview" class="text-xs" style="color: var(--color-text-muted)">
              Upload a light variant to auto-derive
            </div>
            <div v-else class="flex flex-col items-center gap-2">
              <div
                class="w-20 h-20 rounded-md flex items-center justify-center"
                style="background-color: #0b0d12"
              >
                <img
                  :src="derivedDarkPreview"
                  :alt="lightLogo.name"
                  class="max-w-full max-h-full"
                  style="filter: invert(1) hue-rotate(180deg)"
                />
              </div>
              <div class="text-[11px]" style="color: var(--color-text-muted)">
                Auto-derived (CSS preview)
              </div>
            </div>
          </div>

          <!-- Manual upload -->
          <label
            v-else
            class="dropzone block"
            :class="{ 'is-over': dragOver.dark }"
            @dragover.prevent="dragOver.dark = true"
            @dragleave="dragOver.dark = false"
            @drop="onDrop('dark', $event)"
          >
            <input
              type="file"
              class="hidden"
              accept="image/svg+xml,image/png,image/jpeg,image/webp"
              @change="onPick('dark', $event)"
            />
            <div v-if="!darkLogo" class="text-xs" style="color: var(--color-text-muted)">
              Drop or click to upload
            </div>
            <div v-else class="flex flex-col items-center gap-2">
              <div
                class="w-20 h-20 rounded-md flex items-center justify-center"
                style="background-color: #0b0d12"
              >
                <img :src="darkLogo.dataUrl" :alt="darkLogo.name" class="max-w-full max-h-full" />
              </div>
              <div class="text-[11px] truncate w-full" style="color: var(--color-text-muted)">
                {{ darkLogo.name }}
              </div>
            </div>
          </label>

          <div class="flex items-center justify-between mt-1">
            <div v-if="fileError.dark" class="field-error">{{ fileError.dark }}</div>
            <div v-else class="field-hint">
              {{ darkAuto ? 'CSS filter; real asset transform comes later.' : 'Used on dark backgrounds.' }}
            </div>
            <button
              v-if="darkLogo && !darkAuto"
              type="button"
              class="text-[11px] underline-offset-2 hover:underline"
              style="color: var(--color-text-muted)"
              @click="clearLogo('dark')"
            >
              remove
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>