/**
 * Template loader.
 *
 * Vite eager-loads every .stub under ../../templates/** as a raw string at build
 * time so the generator can run in the browser (Mode A — ZIP download) without
 * any filesystem access. The keys are the paths relative to the package root,
 * e.g. "templates/shared/resources/css/tokens.css.stub".
 */
const raw = import.meta.glob('../../../templates/**/*.stub', {
  eager: true,
  query: '?raw',
  import: 'default',
})

/**
 * Returns a map keyed by `category/relative-path` (without the .stub suffix and
 * without the `templates/<category>/` prefix). Categories: shared, inertia, spa,
 * auth, realtime.
 */
export function loadTemplates() {
  const out = {}
  for (const fullPath of Object.keys(raw)) {
    // Strip the leading `../../../templates/` and the trailing `.stub`.
    const rel = fullPath.replace(/^.*\/templates\//, '').replace(/\.stub$/, '')
    out[rel] = raw[fullPath]
  }
  return out
}