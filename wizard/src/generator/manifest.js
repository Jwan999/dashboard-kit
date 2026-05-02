/**
 * Decide which templates to emit and where they should land in the host project.
 *
 * Returns an array of { source, dest } where source is the key into the loaded
 * templates map (e.g. "shared/resources/css/tokens.css") and dest is the path
 * relative to the host project root.
 */

export function buildManifest(config) {
  const out = []

  // ---------- always-on shared layer ----------
  const sharedAlways = [
    'shared/resources/css/tokens.css',
    'shared/resources/css/app.css',
    'shared/tailwind.config.js',
    'shared/components.json',
    'shared/resources/js/lib/utils.js',
    'shared/resources/js/composables/useTheme.js',
    'shared/resources/js/composables/useDirection.js',
    'shared/resources/js/i18n/index.js',
    // UI primitives
    'shared/resources/js/components/ui/Button.vue',
    'shared/resources/js/components/ui/Input.vue',
    'shared/resources/js/components/ui/Label.vue',
    'shared/resources/js/components/ui/Card.vue',
    'shared/resources/js/components/ui/Dialog.vue',
    'shared/resources/js/components/ui/DropdownMenu.vue',
    'shared/resources/js/components/ui/Sheet.vue',
    'shared/resources/js/components/ui/Tabs.vue',
    'shared/resources/js/components/ui/Sidebar.vue',
    'shared/resources/js/components/ui/Toast.vue',
    'shared/resources/js/components/ui/Skeleton.vue',
    'shared/resources/js/components/ui/EmptyState.vue',
    'shared/resources/js/components/ui/PageHeader.vue',
    // Data
    'shared/resources/js/components/data/DataTable.vue',
    'shared/resources/js/components/data/FilterBar.vue',
    // Charts — wrapper + adapter registry
    'shared/resources/js/components/charts/Chart.vue',
    'shared/resources/js/components/charts/adapters/index.js',
    // Layout
    'shared/resources/js/components/layout/AppLayout.vue',
  ]
  for (const src of sharedAlways) {
    out.push({ source: src, dest: stripPrefix(src, 'shared/') })
  }

  // ---------- locales — only the languages chosen ----------
  for (const lang of config.language?.languages || []) {
    const src = `shared/resources/js/i18n/locales/${lang}.json`
    out.push({
      source: src,
      dest: stripPrefix(src, 'shared/'),
      // Mark languages we don't ship a built-in translation for so the generator
      // can synthesize a placeholder.
      synthesizeIfMissing: true,
      lang,
    })
  }

  // ---------- chart adapters — primary always, alternates always (so swapping is a config flip) ----------
  out.push({ source: 'shared/resources/js/components/charts/adapters/echarts.js', dest: 'resources/js/components/charts/adapters/echarts.js' })
  out.push({ source: 'shared/resources/js/components/charts/adapters/chartjs.js', dest: 'resources/js/components/charts/adapters/chartjs.js' })

  // ---------- integration model ----------
  if (config.architecture?.integrationModel === 'inertia') {
    out.push(
      { source: 'inertia/resources/js/Pages/Dashboard.vue', dest: 'resources/js/Pages/Dashboard.vue' },
      { source: 'inertia/resources/js/Pages/Settings.vue', dest: 'resources/js/Pages/Settings.vue' },
      { source: 'inertia/resources/js/Pages/Auth/Login.vue', dest: 'resources/js/Pages/Auth/Login.vue' },
      { source: 'inertia/resources/js/Pages/Auth/ForgotPassword.vue', dest: 'resources/js/Pages/Auth/ForgotPassword.vue' },
      { source: 'inertia/resources/js/Pages/Auth/ResetPassword.vue', dest: 'resources/js/Pages/Auth/ResetPassword.vue' },
      { source: 'inertia/routes/web.php', dest: 'routes/dashboard.php' }, // don't clobber app's web.php
    )
  } else if (config.architecture?.integrationModel === 'spa') {
    out.push(
      { source: 'spa/src/views/Dashboard.vue', dest: 'src/views/Dashboard.vue' },
      { source: 'spa/src/views/Settings.vue', dest: 'src/views/Settings.vue' },
      { source: 'spa/src/router.js', dest: 'src/router.js' },
      { source: 'spa/src/api/client.js', dest: 'src/api/client.js' },
    )
  }

  // ---------- auth README — alongside the generated code ----------
  const authMap = {
    'sanctum-cookie': 'auth/sanctum-cookie/AUTH_README.md',
    'sanctum-tokens': 'auth/sanctum-token/AUTH_README.md',
    'external-idp': 'auth/external-idp/AUTH_README.md',
  }
  const authSrc = authMap[config.architecture?.auth]
  if (authSrc) out.push({ source: authSrc, dest: 'docs/AUTH.md' })

  // ---------- realtime ----------
  if (config.data?.realTime === 'websockets') {
    out.push({ source: 'realtime/echo.js', dest: 'resources/js/realtime/echo.js' })
  } else if (config.data?.realTime === 'polling') {
    out.push({ source: 'realtime/polling.js', dest: 'resources/js/composables/usePolling.js' })
  }

  return out
}

function stripPrefix(s, prefix) {
  return s.startsWith(prefix) ? s.slice(prefix.length) : s
}