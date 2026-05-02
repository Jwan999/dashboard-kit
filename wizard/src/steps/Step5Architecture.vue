<script setup>
import { computed, watch } from 'vue'
import { useConfigStore } from '../stores/config.js'

const config = useConfigStore()

function setModel(m) {
  config.setBatch('architecture', { integrationModel: m })
}

// Auto-default auth based on integration model.
watch(
  () => config.architecture.integrationModel,
  (m) => {
    const auth = config.architecture.auth
    if (m === 'inertia' && auth === 'sanctum-tokens') {
      config.setBatch('architecture', { auth: 'sanctum-cookie' })
    }
    if (m === 'spa' && auth === 'sanctum-cookie') {
      config.setBatch('architecture', { auth: 'sanctum-tokens' })
    }
  },
)

const auth = computed({
  get: () => config.architecture.auth,
  set: (v) => config.setBatch('architecture', { auth: v }),
})

const multiTenant = computed({
  get: () => config.architecture.multiTenant,
  set: (v) => config.setBatch('architecture', { multiTenant: v }),
})

const tenancyStrategy = computed({
  get: () => config.architecture.tenancyStrategy,
  set: (v) => config.setBatch('architecture', { tenancyStrategy: v }),
})
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <header>
      <h2 class="text-2xl font-semibold">Architecture</h2>
      <p class="mt-2 text-sm" style="color: var(--color-text-muted)">
        How the dashboard talks to Laravel. Inertia is recommended for single-Laravel apps; SPA for multi-backend reuse.
      </p>
    </header>

    <div class="card">
      <div class="section-title">Integration model</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          class="radio-card"
          :class="{ 'is-active': config.architecture.integrationModel === 'inertia' }"
          @click="setModel('inertia')"
        >
          <div class="radio-card-title flex items-center gap-2">
            Inertia.js + Vue
            <span
              class="text-[10px] font-normal px-1.5 py-0.5 rounded-full"
              style="background-color: rgba(99, 102, 241, 0.18); color: var(--color-primary)"
            >
              recommended
            </span>
          </div>
          <ul class="mt-2 space-y-1 text-[11px]" style="color: var(--color-text-muted)">
            <li>Shared Laravel session auth</li>
            <li>No CORS, no token plumbing</li>
            <li>Faster first paint</li>
            <li>Best for single-Laravel apps</li>
          </ul>
        </button>
        <button
          type="button"
          class="radio-card"
          :class="{ 'is-active': config.architecture.integrationModel === 'spa' }"
          @click="setModel('spa')"
        >
          <div class="radio-card-title">Separate SPA + Laravel API</div>
          <ul class="mt-2 space-y-1 text-[11px]" style="color: var(--color-text-muted)">
            <li>Independent deploy</li>
            <li>Reusable across multiple backends</li>
            <li>Mobile-friendly (shared API)</li>
            <li>Best for multi-host dashboards</li>
          </ul>
        </button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Auth strategy</div>
      <p class="section-sub">
        Defaults to
        <span style="color: var(--color-primary)">{{
          config.architecture.integrationModel === 'inertia' ? 'Sanctum cookie' : 'Sanctum tokens'
        }}</span>
        based on the model above.
      </p>
      <select v-model="auth" class="select-input max-w-xs">
        <option value="sanctum-cookie">Sanctum cookie (same-domain)</option>
        <option value="sanctum-tokens">Sanctum tokens (cross-domain)</option>
        <option value="external-idp">External IdP (OAuth/SAML)</option>
      </select>
    </div>

    <div class="card">
      <div class="flex items-center justify-between">
        <div>
          <div class="section-title" style="margin-bottom: 4px">Multi-tenant</div>
          <p class="text-xs" style="color: var(--color-text-muted)">
            Multiple isolated tenants share one deploy.
          </p>
        </div>
        <button
          type="button"
          class="toggle"
          :class="{ 'is-on': multiTenant }"
          :aria-pressed="multiTenant"
          @click="multiTenant = !multiTenant"
        ></button>
      </div>
      <div v-if="multiTenant" class="mt-3">
        <label class="field-label" for="tenancy">Tenancy strategy</label>
        <select id="tenancy" v-model="tenancyStrategy" class="select-input max-w-xs">
          <option value="path">Path-based (/t/{tenant}/...)</option>
          <option value="subdomain">Subdomain ({tenant}.app.com)</option>
          <option value="header">Header (X-Tenant-ID)</option>
        </select>
      </div>
    </div>
  </div>
</template>