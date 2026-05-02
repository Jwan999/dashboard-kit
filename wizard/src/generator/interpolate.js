/**
 * Replace `__TOKEN__` placeholders and process `{{#if key}}…{{/if}}` blocks.
 *
 * Why both syntaxes?
 *   - `__TOKEN__` works inside any file format (CSS, PHP, JSON, Vue) without
 *     looking like a templating engine. Easy to grep for unreplaced tokens.
 *   - `{{#if}}` blocks let us conditionally include code inside Vue/JS files
 *     (e.g. row selection in DataTable) without two parallel templates.
 *
 * Both are intentionally minimal — no nested ifs, no else, no loops. If the
 * generator grows past these primitives, swap in mustache. For now this is
 * dependency-free.
 */

export function interpolate(content, tokens, conditions = {}) {
  let out = stripIfBlocks(content, conditions)
  out = replaceTokens(out, tokens)
  return out
}

function replaceTokens(s, tokens) {
  // Order longest-key-first so __PRIMARY_SCALE_500__ replaces before __PRIMARY__
  const keys = Object.keys(tokens).sort((a, b) => b.length - a.length)
  let out = s
  for (const k of keys) {
    const needle = `__${k}__`
    if (!out.includes(needle)) continue
    out = out.split(needle).join(String(tokens[k] ?? ''))
  }
  return out
}

function stripIfBlocks(s, conditions) {
  // Match `{{#if KEY}}…{{/if}}` non-greedily across newlines.
  const re = /\{\{#if\s+([a-zA-Z0-9_]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g
  return s.replace(re, (_, key, body) => (conditions[key] ? body : ''))
}

/**
 * Walk a string and return all `__TOKEN__` placeholders that remain. Used by
 * the smoke test to assert nothing was left unreplaced.
 */
export function findUnreplaced(content) {
  const re = /__([A-Z][A-Z0-9_]+)__/g
  const seen = new Set()
  let m
  while ((m = re.exec(content)) !== null) seen.add(m[1])
  return Array.from(seen)
}