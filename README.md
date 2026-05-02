# dashboard-kit

A Laravel + Vue dashboard scaffolder. Run an interactive wizard to capture brand tokens, language, direction, charts, and architecture choices, then emit a brand-customizable, structurally-identical dashboard scaffold any Laravel project can adopt.

> **Status: v0.3.0 — MVP complete.** Three-phase build done: package skeleton, interactive wizard with live preview, and the scaffold generator that writes a working dashboard into your Laravel project.

## Naming heads-up

Two different handles are involved — they are **not the same**:

| Where | Handle | Why |
| --- | --- | --- |
| GitHub repo | `Jwan999/dashboard-kit` | The author's GitHub username is `Jwan999`. |
| Composer / npm vendor | `jwan/dashboard-kit` | Shorter, lowercase vendor namespace for package managers. |

So you clone from `github.com/Jwan999/dashboard-kit` but install with `composer require jwan/dashboard-kit`.

## Install

Once published to Packagist:

```bash
composer require jwan/dashboard-kit --dev
```

Until then, install from source (works today):

```bash
git clone https://github.com/Jwan999/dashboard-kit.git
cd dashboard-kit
composer install
cd wizard && npm install && cd ..
```

If you cloned into a Laravel app's `vendor/jwan/dashboard-kit` directory manually, also run `npm install` inside the package's `wizard/` once.

## End-to-end usage

From any Laravel project that has the package installed:

```bash
php artisan dashboard:scaffold
```

The command:

1. Picks a free localhost port (5173–5199).
2. Boots the Vite dev server for the wizard, with cwd pointing at your project.
3. Opens your browser to the wizard URL.
4. You walk through 7 batches: identity, language, brand tokens, visual language, architecture, data, operational.
5. Hit **Generate scaffold** on the Review step.
6. Files are written directly into your Laravel project root (or downloaded as a ZIP if no project context is detected — see "Standalone" below).
7. The wizard shows the next-steps checklist (npm install, composer require, php artisan).

If you re-run the wizard, it pre-loads `dashboard.config.json` from your project root so you can update settings rather than starting over.

### Standalone mode (no Laravel host)

For developing on the package itself, or to grab a scaffold ZIP without a project:

```bash
cd wizard
npm install
npm run dev
```

Open the printed URL. Any "Generate scaffold" click produces a downloadable ZIP. Unzip into your Laravel project root.

You can also force standalone from a host project: `php artisan dashboard:scaffold --standalone`.

## What gets generated

Roughly 30–40 files, depending on choices:

```
resources/css/tokens.css                       # CSS variables — the source of truth
resources/css/app.css                          # Tailwind v4 + @theme wiring
tailwind.config.js                             # plugin registration
components.json                                # shadcn-vue pre-configured
resources/js/lib/utils.js                      # cn()
resources/js/composables/useTheme.js           # light/dark
resources/js/composables/useDirection.js       # RTL/LTR
resources/js/composables/usePolling.js         # only if realTime=polling
resources/js/realtime/echo.js                  # only if realTime=websockets
resources/js/i18n/index.js                     # vue-i18n bootstrap
resources/js/i18n/locales/{lang}.json          # one per chosen locale
resources/js/components/ui/*.vue               # primitives (Button, Input, Card, ...)
resources/js/components/data/DataTable.vue     # TanStack Table — features toggled by config
resources/js/components/data/FilterBar.vue
resources/js/components/charts/Chart.vue       # lib-agnostic wrapper
resources/js/components/charts/adapters/*.js   # echarts.js + chartjs.js
resources/js/components/layout/AppLayout.vue   # sidebar + topbar + breadcrumbs
resources/js/Pages/Dashboard.vue               # Inertia integration
resources/js/Pages/Settings.vue
resources/js/Pages/Auth/{Login,ForgotPassword,ResetPassword}.vue
routes/dashboard.php                           # Inertia routes
src/views/Dashboard.vue                        # SPA integration (instead of Pages/)
src/router.js
src/api/client.js                              # axios + auth interceptor
docs/AUTH.md                                   # auth flow notes for chosen scheme
docs/DASHBOARD_KIT.md                          # what was generated, how to extend
dashboard.config.json                          # snapshot — wizard reads this on re-run
```

## Token reference

Every `__TOKEN__` placeholder the generator replaces:

| Token | What it is |
| --- | --- |
| `__DISPLAY_NAME__` | Identity — display name (e.g. "Acme Dashboard") |
| `__MACHINE_NAME__` | Identity — slug used for storage keys, namespacing |
| `__DESCRIPTION__` | One-paragraph description from intake |
| `__DOMAIN__` | Production domain, used for Sanctum stateful config |
| `__ROUTE_PREFIX__` | URL prefix for the dashboard area (default `/dashboard`) |
| `__PRIMARY_HEX__` | Primary color, raw hex |
| `__PRIMARY_FG__` | Readable foreground (#fff or near-black) for primary |
| `__PRIMARY_FG_DARK__` | Same, computed against the dark-mode primary |
| `__PRIMARY_SCALE_50__` … `__PRIMARY_SCALE_900__` | OKLCH-derived 50–900 scale |
| `__PRIMARY_DARK_50__` … `__PRIMARY_DARK_900__` | Mirror-image lightness scale for dark mode |
| `__ACCENT__` | Optional accent (or a default if disabled) |
| `__NEUTRAL_FLAVOR__` | One of cool/warm/true/slate |
| `__NEUTRAL_50__` … `__NEUTRAL_900__` | Static palette for the chosen flavor |
| `__SEMANTIC_SUCCESS__` / `WARNING` / `ERROR` / `INFO` | Semantic colors |
| `__FONT_LATIN__` / `__FONT_ARABIC__` | Font names |
| `__FONT_LATIN_STACK__` / `__FONT_ARABIC_STACK__` | Full CSS font-family stacks |
| `__RADIUS_BASE__` | Base radius (sharp/subtle/rounded/pill → px value) |
| `__SHADOW_SM__` / `__SHADOW_MD__` / `__SHADOW_LG__` | Shadow triple based on flat/soft/layered choice |
| `__DENSITY_PAD_X__` / `__PAD_Y__` / `__ROW_H__` / `__FONT__` | Spacing rhythm |
| `__MOTION_DURATION__` / `__MOTION_EASING__` | Motion tokens |
| `__SHADCN_BASE_COLOR__` | Closest shadcn-vue baseColor (slate/stone/neutral/gray) |
| `__DEFAULT_LANGUAGE__` / `__FALLBACK_LOCALE__` | i18n setup |
| `__DEFAULT_DIRECTION__` | rtl/ltr/auto |
| `__DEFAULT_CHART_LIBRARY__` | echarts/chartjs/etc. — used by the wrapper as default adapter |
| `__AUTH_MODEL__` | sanctum-cookie/sanctum-tokens/external-idp |
| `__WITH_CREDENTIALS__` | true if cookie auth, else false |
| `__AUTH_INTERCEPTOR__` | Axios interceptor body for the chosen auth flow |
| `__TENANCY_STRATEGY__` | path/subdomain/header (or "none") |
| `__LOCALE_IMPORTS__` | i18n eager-import lines |
| `__SUPPORTED_LOCALES_JSON__` / `__INITIAL_MESSAGES__` | i18n bootstrap helpers |

There are also `{{#if pagination}}…{{/if}}` blocks (and `rowSelection`, `bulkActions`, `export`) used inside `DataTable.vue` to toggle features.

## Extending

### Add a new primitive component

```bash
npx shadcn-vue@latest add <component>
```

The generated `components.json` ensures it picks up your tokens automatically.

### Add a new chart adapter

1. Create `resources/js/components/charts/adapters/<lib>.js` exporting a default function `(el, theme) => { setOption, resize, dispose }`
2. Register it in `resources/js/components/charts/adapters/index.js`
3. Use via `<Chart adapter="lib" :option="..." />`

### Add a new wizard step

1. Add a state slice + setters in `wizard/src/stores/config.js`
2. Create `wizard/src/steps/StepN.vue`
3. Register it in `wizard/src/router.js`'s `stepDefinitions` array
4. Update `Review.vue` to surface the new fields

### Add new templates

1. Drop `*.stub` files under `templates/<category>/<path>`
2. Update `wizard/src/generator/manifest.js` to include them based on config
3. Add any new `__TOKEN__` placeholders to `wizard/src/generator/index.js`'s `buildTokens()`

## FAQ

**Can I re-run the wizard?**
Yes. It reads `dashboard.config.json` from your project root and pre-loads your previous answers. Hit Generate again to overwrite.

**What gets overwritten?**
Everything in the manifest. If you've hand-edited primitives, commit them first. The wizard's regen is structural — the safest pattern is to override styling via `tokens.css` (which the wizard does write, so don't hand-edit that — change values in the wizard instead).

**How do I add my own templates?**
See "Extending → Add new templates" above. The generator picks up new files in `templates/` automatically once `manifest.js` references them.

**What if I want a chart library not in the list?**
Pick the closest at intake (default ECharts is a good first guess). After scaffolding, follow "Add a new chart adapter" and update the `<Chart adapter>` prop.

**Inertia or SPA?**
Default to Inertia for most Laravel dashboards: shared session auth, no CORS, simpler deploy. Pick SPA only if the dashboard must be reused across multiple backends, run on a different domain, or share an API with mobile clients.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the three-layer model: wizard (intake) → config (truth) → generator (templates → files).

## Publishing

The package is not yet on Packagist or npm — see [docs/PUBLISHING.md](docs/PUBLISHING.md) for the steps.

## Roadmap

### v0.1.0 — done (Phase 1)
Composer skeleton, Artisan command, Vite + Vue 3 wizard shell, Pinia store, GitHub repo.

### v0.2.0 — done (Phase 2)
Full step controls, OKLCH-derived primary scales, live preview, semantic color overrides, localStorage persistence.

### v0.3.0 — done (Phase 3, this release)
Scaffold templates, generator, ZIP and host-write modes, Vite middleware bridge, update mode (re-load existing `dashboard.config.json`), publishing docs.

### v1.0.0 — deferred
Packagist + npm publish, schema migrators for breaking changes, retrofit helper for existing dashboards, more chart adapters (Recharts, Unovis), broader auth presets (Auth0, Clerk pre-wired stubs), e2e test fixture (boots a fresh Laravel app, runs scaffold, asserts pages render).

## License

MIT. See [LICENSE](LICENSE).
