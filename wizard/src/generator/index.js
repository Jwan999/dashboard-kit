/**
 * Generator orchestrator.
 *
 * Input: a `dashboard.config.json` shape (see asJson() in stores/config.js).
 * Output: { files: [{ path, content }], steps: [string] }
 *
 * The generator is fully synchronous and pure aside from the template loader,
 * which is a bag of strings injected at module load time. This makes it easy
 * to run from a Node smoke test (importing the loader will fail under Node, so
 * the smoke test passes its own template map — see runGenerator.injectTemplates).
 */
import { interpolate } from './interpolate.js'
import { buildManifest } from './manifest.js'
import { buildSteps } from './steps.js'
import { generateDarkScale } from './darkScale.js'
import { NEUTRAL_PALETTES } from '../utils/neutrals.js'
import { RADIUS_MAP, DENSITY_MAP, SHADOW_MAP, MOTION_MAP } from '../utils/visual.js'
import { readableTextOn } from '../utils/color.js'

const FONT_STACKS = {
  arabic: {
    'IBM Plex Arabic': "'IBM Plex Arabic', 'IBM Plex Sans Arabic', 'Tajawal', 'Cairo', system-ui, sans-serif",
    'Cairo': "'Cairo', 'Tajawal', 'IBM Plex Arabic', system-ui, sans-serif",
    'Tajawal': "'Tajawal', 'Cairo', 'IBM Plex Arabic', system-ui, sans-serif",
    'Noto Sans Arabic': "'Noto Sans Arabic', 'IBM Plex Arabic', 'Tajawal', system-ui, sans-serif",
  },
  latin: {
    'Inter': "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    'IBM Plex Sans': "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
    'Roboto': "'Roboto', 'Inter', system-ui, sans-serif",
  },
}

function fontStack(kind, name) {
  const map = FONT_STACKS[kind] || {}
  return map[name] || `'${name}', system-ui, sans-serif`
}

const SHADOW_TRIPLE = {
  flat: { sm: 'none', md: 'none', lg: 'none' },
  soft: {
    sm: '0 1px 2px rgba(15,23,42,.05)',
    md: '0 1px 2px rgba(15,23,42,.05), 0 4px 12px rgba(15,23,42,.08)',
    lg: '0 1px 2px rgba(15,23,42,.05), 0 8px 24px rgba(15,23,42,.12), 0 16px 32px rgba(15,23,42,.10)',
  },
  layered: {
    sm: '0 1px 2px rgba(15,23,42,.06)',
    md: '0 1px 2px rgba(15,23,42,.04), 0 4px 8px rgba(15,23,42,.06), 0 12px 28px rgba(15,23,42,.12)',
    lg: '0 1px 2px rgba(15,23,42,.04), 0 4px 8px rgba(15,23,42,.06), 0 12px 28px rgba(15,23,42,.12), 0 24px 48px rgba(15,23,42,.10)',
  },
}

/**
 * Map the wizard's primary hex into shadcn-vue's "baseColor" enum. shadcn only
 * understands a fixed list — we pick the closest semantic match.
 */
function shadcnBaseColor(neutral) {
  return ({ cool: 'slate', warm: 'stone', true: 'neutral', slate: 'gray' }[neutral]) || 'slate'
}

function buildTokens(config) {
  const primary = config.brand.primary
  const scale = config.brand.primaryScale
  const dark = generateDarkScale(primary)
  const neutral = NEUTRAL_PALETTES[config.brand.neutral] || NEUTRAL_PALETTES.cool
  const shadow = SHADOW_TRIPLE[config.visual.shadow] || SHADOW_TRIPLE.soft
  const density = DENSITY_MAP[config.visual.density] || DENSITY_MAP.default
  const motion = MOTION_MAP[config.visual.motion] || MOTION_MAP.standard
  const accent = config.brand.accent || scale[400] || '#22d3ee'

  const tokens = {
    DISPLAY_NAME: config.identity.displayName || 'Dashboard',
    MACHINE_NAME: config.identity.machineName || 'dashboard',
    DESCRIPTION: (config.identity.description || '').replace(/"/g, '\\"'),
    DOMAIN: config.identity.domain || 'localhost',
    ROUTE_PREFIX: config.identity.routePrefix || '/dashboard',

    PRIMARY_HEX: primary,
    PRIMARY_FG: readableTextOn(scale[600] || primary),
    PRIMARY_FG_DARK: readableTextOn(dark[400] || primary),
    ACCENT: accent,
    NEUTRAL_FLAVOR: config.brand.neutral || 'cool',
    SEMANTIC_SUCCESS: config.brand.semantic.success,
    SEMANTIC_WARNING: config.brand.semantic.warning,
    SEMANTIC_ERROR: config.brand.semantic.error,
    SEMANTIC_INFO: config.brand.semantic.info,

    FONT_LATIN: config.brand.fontLatin,
    FONT_ARABIC: config.brand.fontArabic,
    FONT_LATIN_STACK: fontStack('latin', config.brand.fontLatin),
    FONT_ARABIC_STACK: fontStack('arabic', config.brand.fontArabic),

    RADIUS_BASE: RADIUS_MAP[config.visual.radius] || '12px',
    SHADOW_BASE: shadow.md,
    SHADOW_SM: shadow.sm,
    SHADOW_MD: shadow.md,
    SHADOW_LG: shadow.lg,

    DENSITY_PAD_X: density.padX,
    DENSITY_PAD_Y: density.padY,
    DENSITY_ROW_H: density.rowH,
    DENSITY_FONT: density.fontSize,
    MOTION_DURATION: `${motion.duration}ms`,
    MOTION_EASING: motion.easing,

    SHADCN_BASE_COLOR: shadcnBaseColor(config.brand.neutral),
    DEFAULT_LANGUAGE: config.language.defaultLanguage,
    FALLBACK_LOCALE: config.language.fallbackLocale,
    DEFAULT_DIRECTION: config.language.direction,
    DEFAULT_CHART_LIBRARY: config.data.chartsLibrary,
    AUTH_MODEL: config.architecture.auth,
    WITH_CREDENTIALS: config.architecture.auth === 'sanctum-cookie' ? 'true' : 'false',
    AUTH_INTERCEPTOR: buildAuthInterceptor(config),
    TENANCY_STRATEGY: config.architecture.multiTenant ? (config.architecture.tenancyStrategy || 'path') : 'none',

    LOCALE_IMPORTS: config.language.languages.map((l) => `import ${l} from './locales/${l}.json'`).join('\n'),
    SUPPORTED_LOCALES_JSON: JSON.stringify(config.language.languages),
    INITIAL_MESSAGES: config.language.languages.map((l) => `    ${l}: ${l},`).join('\n'),
  }

  // Scale stops
  for (const stop of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]) {
    tokens[`PRIMARY_SCALE_${stop}`] = scale[stop]
    tokens[`PRIMARY_DARK_${stop}`] = dark[stop]
    tokens[`NEUTRAL_${stop}`] = neutral[stop]
  }

  return tokens
}

function buildAuthInterceptor(config) {
  switch (config.architecture.auth) {
    case 'sanctum-tokens':
      return `  try {\n    const t = localStorage.getItem('${config.identity.machineName || 'dashboard'}:token')\n    if (t) config.headers.Authorization = \`Bearer \${t}\`\n  } catch (_) { /* noop */ }`
    case 'sanctum-cookie':
      return `  // Cookie-based auth — browser sends the session cookie automatically.`
    case 'external-idp':
      return `  // TODO (external-idp): fetch token from your provider's SDK and attach as Bearer.`
    default:
      return '  // No auth interceptor configured.'
  }
}

function buildConditions(config) {
  return {
    pagination: !!config.data?.tables?.pagination,
    rowSelection: !!config.data?.tables?.rowSelection,
    bulkActions: !!config.data?.tables?.bulkActions,
    export: !!config.data?.tables?.export,
  }
}

/**
 * Synthesize a placeholder locale file for languages we don't ship a built-in
 * translation for. Keeps the i18n bootstrap from breaking; user fills in copy.
 */
function synthesizeLocale(lang, config) {
  const display = (config.identity.displayName || 'Dashboard').replace(/"/g, '\\"')
  return JSON.stringify({
    app: { name: display, description: config.identity.description || '' },
    nav: { dashboard: 'Dashboard', settings: 'Settings', logout: 'Log out', profile: 'Profile' },
    actions: { save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'Create', search: 'Search', export: 'Export', filter: 'Filter' },
    auth: { login: 'Sign in', email: 'Email', password: 'Password', remember: 'Remember me', forgot: 'Forgot password?', submit: 'Sign in' },
    empty: { title: 'No data yet', subtitle: 'Records will appear here once added.' },
    table: { of: 'of', rows: 'rows', selected: 'selected', page: 'page' },
    _generated: `Placeholder locale for "${lang}" — translate the strings above.`,
  }, null, 2) + '\n'
}

/**
 * Run the generator.
 *
 * @param {object} config - the dashboard.config.json shape
 * @param {object} [opts]
 * @param {object} [opts.templates] - inject a templates map (used by the smoke test under Node)
 * @returns {{ files: Array<{path: string, content: string}>, steps: string[] }}
 */
export function runGenerator(config, opts = {}) {
  // The smoke test injects its own template map. In the browser, the wizard
  // uses runGeneratorWithBundledTemplates() (in browserEntry.js) which loads
  // templates via Vite's import.meta.glob. This split keeps Node + Vite happy.
  const templates = opts.templates
  if (!templates) {
    throw new Error('runGenerator: pass { templates } or use runGeneratorWithBundledTemplates() in the wizard.')
  }
  const tokens = buildTokens(config)
  const conditions = buildConditions(config)
  const manifest = buildManifest(config)

  const files = []

  for (const entry of manifest) {
    let content = templates[entry.source]

    if (content === undefined && entry.synthesizeIfMissing && entry.lang) {
      // Locale we don't ship — emit a placeholder.
      files.push({ path: entry.dest, content: synthesizeLocale(entry.lang, config) })
      continue
    }

    if (content === undefined) {
      console.warn(`[generator] missing template: ${entry.source}`)
      continue
    }

    files.push({ path: entry.dest, content: interpolate(content, tokens, conditions) })
  }

  // Always append `dashboard.config.json` at the project root so the wizard can
  // re-load it next time.
  files.push({
    path: 'dashboard.config.json',
    content: JSON.stringify(config, null, 2) + '\n',
  })

  // Generate a generator-readme that tells humans not to hand-edit the stubs.
  files.push({
    path: 'docs/DASHBOARD_KIT.md',
    content: buildDashboardReadme(config, files.length),
  })

  return { files, steps: buildSteps(config) }
}

function buildDashboardReadme(config, fileCount) {
  return `# ${config.identity.displayName || 'Dashboard'}

Generated by [dashboard-kit](https://github.com/Jwan999/dashboard-kit).

## Re-running the wizard

\`\`\`bash
php artisan dashboard:scaffold
\`\`\`

The wizard will read \`dashboard.config.json\` (at the repo root) and pre-load
your previous answers. Files are overwritten; if you have hand-edits in
\`resources/css/tokens.css\`, \`resources/js/components/**\`, or
\`resources/js/composables/**\`, commit them before re-running.

## What was generated

${fileCount} files. Brand: ${config.brand.primary}, neutral: ${config.brand.neutral},
fonts: ${config.brand.fontLatin} + ${config.brand.fontArabic},
direction: ${config.language.direction}, charts: ${config.data.chartsLibrary},
integration: ${config.architecture.integrationModel}.

## Adding a new primitive

Use shadcn-vue:

\`\`\`bash
npx shadcn-vue@latest add <component>
\`\`\`

The generated \`components.json\` is preconfigured with your token-driven theme
so any added primitive picks up your colors automatically.

## Adding a new chart adapter

1. Create \`resources/js/components/charts/adapters/<your-lib>.js\`
2. Export a default function \`(el, theme) => ({ setOption, resize, dispose })\`
3. Register it in \`resources/js/components/charts/adapters/index.js\`
4. Use via \`<Chart adapter="your-lib" :option="..." />\`
`
}