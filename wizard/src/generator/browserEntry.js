/**
 * Browser entry — wraps runGenerator with the Vite-bundled templates map. The
 * Review.vue button calls this. Node smoke tests use runGenerator directly with
 * a templates argument.
 */
import { runGenerator } from './index.js'
import { loadTemplates } from './templates.js'

export function runGeneratorWithBundledTemplates(config) {
  return runGenerator(config, { templates: loadTemplates() })
}
