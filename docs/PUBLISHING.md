# Publishing

This package is **not yet published**. Phase 3 documents the steps so you can do it when ready. Do not run these without making sure you actually want to release publicly under this name.

## Packagist (`jwan/dashboard-kit`)

1. Make sure `composer.json` has the right `name`, `description`, and `license`. (It does as of v0.3.0.)
2. Tag a release on GitHub: `git tag v0.3.0 && git push origin v0.3.0`. Packagist won't accept submissions without at least one tagged version.
3. Sign in at <https://packagist.org/login> with your GitHub account.
4. Visit <https://packagist.org/packages/submit> and paste the GitHub URL: `https://github.com/Jwan999/dashboard-kit`.
5. Packagist will validate `composer.json` and create the package page.
6. **Set up the GitHub webhook** so Packagist auto-updates on every push:
   - On the package page, copy the API URL Packagist shows you.
   - In the GitHub repo: **Settings → Webhooks → Add webhook**.
   - Payload URL: paste from Packagist.
   - Content type: `application/json`.
   - Trigger on: `Just the push event`.
   - Save.
7. Subsequent releases: just `git tag vX.Y.Z && git push origin vX.Y.Z`. Packagist picks it up within a minute.

After this, end users install with:

```bash
composer require jwan/dashboard-kit --dev
```

## npm (optional — the wizard sub-app)

Most users do not need this. Publish only if you want other tools to embed the wizard UI. Requires teasing the wizard out of the package as its own sub-package — currently `wizard/package.json` is `private: true`.

Sketch:

1. Decide on a name: `@jwan/dashboard-kit-wizard`.
2. In `wizard/package.json`:
   - `"name": "@jwan/dashboard-kit-wizard"`
   - `"private": false`
   - `"version": "0.3.0"`
   - Add `"files": ["dist", "src"]` and a real entry point.
3. Build a library bundle (`vite build --mode lib` with a Vite library config) — currently the wizard is bundled as an app, not a lib.
4. `npm login` (with an npm account that owns the `@jwan` scope).
5. `npm publish --access public`.

Don't bother with this for v0.3.0 — the wizard ships inside the Composer package and runs via Artisan. npm publish is a future-v1 conversation.

## Versioning policy

- **SemVer.** `MAJOR.MINOR.PATCH`.
- Breaking changes in:
  - `dashboard.config.schema.json` shape
  - `runGenerator`'s public signature
  - any template path the user might depend on (e.g. renaming `Pages/Dashboard.vue`)
  
  → bump **MAJOR**.

- New features (new step in wizard, new chart adapter, new template):
  → bump **MINOR**.

- Bug fixes, doc-only changes, internal refactors:
  → bump **PATCH**.

- The `version` field in `dashboard.config.json` (written by the wizard) tracks the *schema* version, which lives lockstep with the package's MAJOR.MINOR.

- The generator must support reading configs from the current MAJOR and **one MAJOR back**. Add migrators to `wizard/src/generator/migrate.js` (does not exist yet — create on first breaking change).

## Release checklist

For each new release:

1. Update `README.md`'s "Status" line + Roadmap section.
2. Bump `version` in `wizard/package.json`.
3. Bump the version returned by `asJson()` in `wizard/src/stores/config.js`.
4. Run `composer validate --strict`.
5. Run `cd wizard && npm run build` — verify no errors.
6. Run `node wizard/tests/generator-smoke.mjs` — must pass.
7. Lint: `find src -name "*.php" -exec php -l {} \;` — must pass.
8. Smoke-test: install in a fresh Laravel app:
   ```bash
   composer create-project laravel/laravel /tmp/dk-smoke
   cd /tmp/dk-smoke
   composer config repositories.dk path /path/to/dashboard-kit
   composer require jwan/dashboard-kit --dev
   php artisan dashboard:scaffold
   ```
   Walk through the wizard and verify the scaffold lands.
9. Commit and tag: `git tag vX.Y.Z && git push origin main vX.Y.Z`.
10. Create GitHub release: `gh release create vX.Y.Z --notes-file CHANGELOG-vX.Y.Z.md`.
11. Wait ~30s, check Packagist updated.
