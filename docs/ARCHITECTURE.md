# Architecture

dashboard-kit has three layers. Each does one thing.

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1 — Wizard (intake)                                  │
│  Vue 3 + Pinia + Vite. Lives in wizard/                     │
│  - 7 step components capture brand + architecture choices    │
│  - Pinia store is the single source of truth                 │
│  - localStorage persistence so refresh doesn't lose progress │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ store.asJson  (versioned)
┌─────────────────────────────────────────────────────────────┐
│  Layer 2 — Config (truth)                                   │
│  dashboard.config.json — JSON Schema-validated shape         │
│  - Lives at the host project root                            │
│  - On wizard re-run, pre-loads to enable "update" mode       │
│  - Schema versioned via top-level `version` field            │
│  - Generator supports the current major + one back           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ runGenerator(config)
┌─────────────────────────────────────────────────────────────┐
│  Layer 3 — Generator (templates → files)                    │
│  wizard/src/generator/                                       │
│  - manifest.js   picks templates based on config             │
│  - interpolate.js replaces __TOKEN__ + processes {{#if}}     │
│  - templates.js  loads templates/**/*.stub via Vite          │
│  - steps.js      builds the post-generation checklist        │
│  - deliver.js    Mode A (ZIP) or Mode B (POST to middleware) │
│  Output: { files: [{path, content}], steps: [string] }       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
   Mode A — ZIP download            Mode B — POST to host
   (via jszip in browser)           (Vite middleware writes
   Used when no Laravel host         to host project root)
   detected, or --standalone)        Default when launched via
                                     `php artisan dashboard:scaffold`
```

## Why the split?

- **Wizard is just a UI.** Swapping the wizard for a CLI flag-parser would still produce the same `dashboard.config.json` and the same scaffold.
- **Config is the contract.** Any tool that produces a valid config can drive the generator. The wizard is one producer.
- **Generator is dumb on purpose.** It does `templates × tokens × conditions = files`. No I/O decisions live here — `deliver.js` chooses between ZIP and host write.

## Why two delivery modes?

| | Mode A (ZIP) | Mode B (Host write) |
| --- | --- | --- |
| Triggered by | No host detected, or `--standalone` | `php artisan dashboard:scaffold` from a Laravel root |
| File I/O happens in | Browser (via jszip) | Node (via Vite middleware) |
| User does | Unzip into project root | Nothing — files appear |
| Safe for | Any context | Hosts launched via Artisan |

Mode B is preferred when available — fewer steps, fewer mistakes (no "I unzipped to the wrong place"). Mode A is the fallback that always works.

## Why CSS variables (not Tailwind config) for tokens?

- Variables live at runtime — light/dark switching is one attribute change on `<html>`.
- The same variable name resolves differently per `[data-theme]`, so the dark-mode scale is a free side-effect.
- Tailwind v4's `@theme` reads CSS variables natively, so we get atomic class compatibility without fighting the framework.
- Hand-edits to `tokens.css` survive package upgrades better than config-file diffs.

## Why placeholders, not a templating engine?

`__TOKEN__` and `{{#if}}` are enough. They cost zero dependencies, are greppable in any file format, and the smoke test asserts no `__TOKEN__` survives generation. Mustache or Handlebars would buy nothing here and add 50–80 KB to the wizard bundle.

## Where's the type safety?

Light, intentional:

- `dashboard.config.schema.json` is the public contract — JSON Schema draft-07.
- The wizard runs in Vue + JS (no TypeScript) to keep contributor onboarding low.
- Smoke test (`wizard/tests/generator-smoke.mjs`) validates structure: emitted file paths, conditional stripping, no leftover placeholders.

If a future v1.0 wants TS, the generator surface (`runGenerator`, `interpolate`, `manifest`) is the right place to start.

## File trail

- `wizard/src/stores/config.js` — Pinia state shape == `dashboard.config.json` shape (via `asJson` getter).
- `wizard/src/generator/index.js` — `runGenerator(config, { templates })`.
- `wizard/src/generator/manifest.js` — what to emit, where it lands.
- `wizard/src/generator/interpolate.js` — placeholder replacement.
- `wizard/src/generator/hostMiddleware.js` — Vite middleware for Mode B.
- `wizard/src/generator/deliver.js` — chooses ZIP vs POST.
- `templates/` — `.stub` files. The categorical layout (shared/inertia/spa/auth/realtime) maps to manifest decisions.
- `dashboard.config.schema.json` — versioned contract.
- `src/Console/ScaffoldCommand.php` — Artisan command that boots the wizard with the right cwd + env.