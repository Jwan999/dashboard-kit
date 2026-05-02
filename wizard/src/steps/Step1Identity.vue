<script setup>
const phase2Items = [
  'Dashboard machine name + display name',
  'One-paragraph description (who/what)',
  'Logo upload (light + dark variants)',
  'Primary domain / route prefix',
]
</script>

<template>
  <div class="max-w-2xl">
    <h2 class="text-2xl font-semibold">Identity & Purpose</h2>
    <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
      Tell the wizard who this dashboard is for and what it should be called.
    </p>

    <div
      class="mt-6 rounded-xl border p-5"
      style="border-color: var(--color-border); background-color: var(--color-surface)"
    >
      <div class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted)">
        Phase 2 will add
      </div>
      <ul class="mt-3 space-y-2 text-sm">
        <li v-for="item in phase2Items" :key="item" class="flex items-start gap-2">
          <span
            class="mt-1.5 inline-block w-1.5 h-1.5 rounded-full shrink-0"
            style="background-color: var(--color-primary)"
          ></span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>