#!/usr/bin/env node
/**
 * Generator smoke test (Node-only).
 *
 * - Loads every .stub from ../templates/ from disk into a map matching what
 *   Vite's import.meta.glob would produce.
 * - Runs the generator twice — once with Inertia config, once with SPA — and
 *   asserts:
 *     1. Files were emitted.
 *     2. No `__TOKEN__` placeholders remain in any output.
 *     3. Inertia run produces Pages/, no spa/src/views/. SPA inverse.
 *     4. Chart adapter for the chosen library is present.
 *     5. Auth README matches the chosen flow.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { runGenerator } from '../src/generator/index.js'
import { findUnreplaced } from '../src/generator/interpolate.js'
import { generateScale } from '../src/utils/color.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PACKAGE_ROOT = path.resolve(__dirname, '../..')
const TEMPLATES_ROOT = path.join(PACKAGE_ROOT, 'templates')

function loadTemplatesFromDisk() {
  const out = {}
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile() && entry.name.endsWith('.stub')) {
        const rel = path.relative(TEMPLATES_ROOT, full).replace(/\.stub$/, '').split(path.sep).join('/')
        out[rel] = fs.readFileSync(full, 'utf8')
      }
    }
  }
  walk(TEMPLATES_ROOT)
  return out
}

function makeConfig(overrides = {}) {
  const primary = '#6366f1'
  return {
    version: '0.3.0',
    identity: {
      displayName: 'Acme Dashboard',
      machineName: 'acme',
      description: 'Smoke test dashboard',
      domain: 'acme.test',
      routePrefix: '/dashboard',
      logoLight: null, logoDark: null, logoDarkDerived: false,
    },
    language: { languages: ['ar', 'en'], defaultLanguage: 'ar', direction: 'rtl', fallbackLocale: 'en' },
    brand: {
      primary,
      primaryScale: generateScale(primary),
      accent: null,
      neutral: 'cool',
      semantic: { success: '#16a34a', warning: '#f59e0b', error: '#dc2626', info: '#0ea5e9' },
      fontLatin: 'Inter',
      fontArabic: 'IBM Plex Arabic',
      fontHosting: 'self',
    },
    visual: { radius: 'rounded', density: 'default', shadow: 'soft', motion: 'standard' },
    architecture: { integrationModel: 'inertia', auth: 'sanctum-cookie', multiTenant: false, tenancyStrategy: 'path' },
    data: {
      chartsLibrary: 'echarts',
      tables: { pagination: true, bulkActions: true, rowSelection: true, export: true },
      realTime: 'polling',
    },
    operational: { deploymentTarget: 'forge', performanceBudget: 'slow', accessibility: true },
    ...overrides,
  }
}

const templates = loadTemplatesFromDisk()
console.log(`[smoke] Loaded ${Object.keys(templates).length} templates from disk`)

let failures = 0
function assert(cond, msg) {
  if (cond) console.log(`  ok  ${msg}`)
  else { console.error(`  FAIL ${msg}`); failures++ }
}

// ---------- Inertia run ----------
{
  const cfg = makeConfig()
  const { files, steps } = runGenerator(cfg, { templates })
  console.log(`\n[smoke] inertia run → ${files.length} files, ${steps.length} steps`)
  assert(files.length >= 25, `inertia: expected at least 25 files, got ${files.length}`)
  assert(files.some((f) => f.path === 'resources/js/Pages/Dashboard.vue'), 'inertia: Pages/Dashboard.vue present')
  assert(files.some((f) => f.path === 'resources/js/Pages/Auth/Login.vue'), 'inertia: Pages/Auth/Login.vue present')
  assert(files.some((f) => f.path === 'routes/dashboard.php'), 'inertia: routes/dashboard.php present')
  assert(!files.some((f) => f.path.startsWith('src/views/')), 'inertia: no SPA views emitted')
  assert(files.some((f) => f.path === 'resources/js/components/charts/adapters/echarts.js'), 'inertia: echarts adapter present')
  assert(files.some((f) => f.path === 'resources/js/i18n/locales/ar.json'), 'inertia: ar locale present')
  assert(files.some((f) => f.path === 'resources/js/i18n/locales/en.json'), 'inertia: en locale present')
  assert(files.some((f) => f.path === 'docs/AUTH.md' && f.content.includes('Sanctum cookie')), 'inertia: sanctum-cookie auth README')
  assert(files.some((f) => f.path === 'resources/js/composables/usePolling.js'), 'inertia: polling realtime emitted')
  assert(files.some((f) => f.path === 'dashboard.config.json'), 'inertia: dashboard.config.json snapshot present')
  assert(files.some((f) => f.path === 'resources/css/tokens.css'), 'inertia: tokens.css present')

  // No unreplaced tokens
  let leftover = []
  for (const f of files) {
    if (f.path.endsWith('.json') || f.path.endsWith('.md')) continue // these are JSON/docs and may legitimately contain `__`
    const found = findUnreplaced(f.content)
    if (found.length) leftover.push({ path: f.path, tokens: found })
  }
  assert(leftover.length === 0, `inertia: no unreplaced __TOKEN__ remain (${leftover.length} files had leftovers)`)
  if (leftover.length) {
    for (const l of leftover.slice(0, 5)) {
      console.error(`    - ${l.path}: ${l.tokens.join(', ')}`)
    }
  }
}

// ---------- SPA + sanctum-tokens + websockets + chartjs ----------
{
  const cfg = makeConfig({
    architecture: { integrationModel: 'spa', auth: 'sanctum-tokens', multiTenant: true, tenancyStrategy: 'subdomain' },
    data: {
      chartsLibrary: 'chartjs',
      tables: { pagination: false, bulkActions: false, rowSelection: false, export: false },
      realTime: 'websockets',
    },
    language: { languages: ['en'], defaultLanguage: 'en', direction: 'ltr', fallbackLocale: 'en' },
  })
  const { files, steps } = runGenerator(cfg, { templates })
  console.log(`\n[smoke] spa run → ${files.length} files, ${steps.length} steps`)
  assert(files.some((f) => f.path === 'src/views/Dashboard.vue'), 'spa: src/views/Dashboard.vue present')
  assert(files.some((f) => f.path === 'src/router.js'), 'spa: src/router.js present')
  assert(files.some((f) => f.path === 'src/api/client.js'), 'spa: src/api/client.js present')
  assert(!files.some((f) => f.path.startsWith('resources/js/Pages/')), 'spa: no Inertia Pages emitted')
  assert(!files.some((f) => f.path === 'routes/dashboard.php'), 'spa: no routes/dashboard.php emitted')
  assert(files.some((f) => f.path === 'docs/AUTH.md' && f.content.includes('Bearer')), 'spa: sanctum-tokens auth README')
  assert(files.some((f) => f.path === 'resources/js/realtime/echo.js'), 'spa: websockets echo.js emitted')
  // Multi-tenancy: AppLayout should carry the strategy attribute.
  const appLayout = files.find((f) => f.path === 'resources/js/components/layout/AppLayout.vue')
  assert(appLayout && appLayout.content.includes('data-tenant-strategy="subdomain"'), 'spa: tenancy strategy stamped')
  // Conditional blocks stripped: DataTable should not contain {{#if}} markers.
  const dt = files.find((f) => f.path === 'resources/js/components/data/DataTable.vue')
  assert(dt && !dt.content.includes('{{#if'), 'spa: DataTable conditional markers stripped')
  assert(dt && !dt.content.includes('rowSelection'), 'spa: DataTable rowSelection branch removed')
  // SPA api client interceptor uses the token-based code
  const apiClient = files.find((f) => f.path === 'src/api/client.js')
  assert(apiClient && apiClient.content.includes("localStorage.getItem('acme:token')"), 'spa: token interceptor present')
  // Only 1 locale
  assert(files.filter((f) => f.path.startsWith('resources/js/i18n/locales/')).length === 1, 'spa: single locale emitted')

  let leftover = []
  for (const f of files) {
    if (f.path.endsWith('.json') || f.path.endsWith('.md')) continue
    const found = findUnreplaced(f.content)
    if (found.length) leftover.push({ path: f.path, tokens: found })
  }
  assert(leftover.length === 0, `spa: no unreplaced __TOKEN__ remain`)
  if (leftover.length) {
    for (const l of leftover.slice(0, 5)) console.error(`    - ${l.path}: ${l.tokens.join(', ')}`)
  }
}

// ---------- Print sample manifest ----------
{
  const cfg = makeConfig()
  const { files } = runGenerator(cfg, { templates })
  console.log(`\n[smoke] sample inertia manifest (first 10 paths):`)
  for (const f of files.slice(0, 10)) console.log(`  - ${f.path}`)
  console.log(`  ... (${files.length} total)`)
}

console.log(`\n[smoke] ${failures === 0 ? 'PASS' : `FAIL (${failures} assertions failed)`}`)
process.exit(failures === 0 ? 0 : 1)
