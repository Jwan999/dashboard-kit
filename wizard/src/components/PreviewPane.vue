<script setup>
// Phase 1: placeholder. Phase 2 will render a live preview of the in-progress dashboard
// (sidebar + header + sample card) reactive to the wizard config store.
</script>

<template>
  <div class="flex flex-col h-full">
    <div
      class="px-5 py-4 border-b"
      style="border-color: var(--color-border)"
    >
      <div class="text-xs uppercase tracking-wider" style="color: var(--color-text-muted)">
        Live preview
      </div>
      <div class="mt-0.5 text-sm font-medium">Will update as you choose</div>
    </div>

    <div class="flex-1 flex items-center justify-center px-6 py-10">
      <div
        class="w-full max-w-xs rounded-xl border p-6 text-center"
        style="border-color: var(--color-border); background-color: var(--color-surface-2)"
      >
        <div
          class="mx-auto mb-3 w-10 h-10 rounded-full"
          style="background-color: var(--color-primary)"
        ></div>
        <div class="text-sm font-medium">Preview coming in Phase 2</div>
        <div class="mt-1 text-xs" style="color: var(--color-text-muted)">
          You'll see the dashboard re-skin in real time as you change tokens.
        </div>
      </div>
    </div>
  </div>
</template>