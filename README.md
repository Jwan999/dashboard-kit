# dashboard-kit

A Laravel + Vue dashboard scaffolder. Run an interactive wizard to capture brand tokens, language, direction, charts, and architecture choices, then emit a brand-customizable, structurally-identical dashboard scaffold any Laravel project can adopt.

> **Status: Phase 1 of 3** — package skeleton + wizard shell. The 7-step wizard navigates through placeholder screens. Step controls and scaffold generation land in Phase 2 + 3.

## Naming heads-up

Two different handles are involved — they are **not the same**:

| Where | Handle | Why |
| --- | --- | --- |
| GitHub repo | `Jwan999/dashboard-kit` | The author's GitHub username is `Jwan999`. |
| Composer / npm vendor | `jwan/dashboard-kit` | Shorter, lowercase vendor namespace for package managers. |

So you clone from `github.com/Jwan999/dashboard-kit` but install with `composer require jwan/dashboard-kit`.

## Install

Once published to Packagist (Phase 3):

```bash
composer require jwan/dashboard-kit --dev
```

For now (Phase 1) — install from source:

```bash
git clone https://github.com/Jwan999/dashboard-kit.git
cd dashboard-kit
composer install
cd wizard && npm install && cd ..
```

## Usage

From any Laravel host project that has the package installed:

```bash
php artisan dashboard:scaffold
```

The command will:

1. Pick a free localhost port (5173–5199).
2. Boot the Vite dev server for the wizard app (`npm run dev` inside `wizard/`).
3. Open your default browser to the local URL.
4. Walk you through 7 batches of questions and emit a scaffold (Phase 2 + 3).

Press **Ctrl+C** in the terminal to stop the wizard.

### Running the wizard standalone (no Laravel needed)

For development on the package itself:

```bash
cd wizard
npm install
npm run dev
```

Vite will print the local URL (default `http://localhost:5173`).

## Wizard layout

Three panes:

- **Left:** stepper showing the 7 batches + Review.
- **Center:** active step content (Phase 2 will fill these in).
- **Right:** live preview pane (Phase 2 will render the in-progress dashboard).

RTL-first: the wizard ships with logical Tailwind classes (`ms-*`, `me-*`, `ps-*`, `pe-*`) so flipping direction is a one-line change.

## The 7 batches

1. **Identity & Purpose** — name, description, logo, route prefix.
2. **Language & Direction** — locales, RTL/LTR, fallback.
3. **Brand Tokens** — primary/accent colors, neutrals, semantics, fonts.
4. **Visual Language** — radius, density, shadow, motion.
5. **Architecture** — Inertia vs SPA, auth, multi-tenancy.
6. **Data & Visualization** — charts, tables, real-time.
7. **Operational** — deployment, performance budget, a11y target.

Followed by a **Review** screen and a **Generate** button.

## Roadmap

### Phase 1 — done
- Composer package skeleton (`jwan/dashboard-kit`).
- Artisan command stub (`dashboard:scaffold`) that boots the wizard.
- Vite + Vue 3 + Tailwind v4 wizard shell with 3-pane layout.
- Stepper navigation across 7 placeholder steps + Review.
- Pinia-style reactive store for wizard config.
- Public GitHub repo with MIT license.

### Phase 2 — next
- Real step controls: color picker with auto-generated 50–900 scale, font preview, RTL flip toggle, radius/density/shadow radio cards with live preview, logo dropzone, semantic color overrides, language multi-select.
- Live preview pane wired to the config store.
- Persist wizard state to `dashboard.config.json` on every change.

### Phase 3 — later
- Scaffold emitter: from `dashboard.config.json` produce `tokens.css`, `tailwind.config.js`, `components.json` (shadcn-vue), `AppLayout.vue`, i18n setup, `<Chart>` ECharts wrapper, primitive bootstrap list.
- Inertia vs separate SPA generators.
- Migration helper for retrofitting existing dashboards.
- Publish to Packagist + npm.

## License

MIT. See [LICENSE](LICENSE).