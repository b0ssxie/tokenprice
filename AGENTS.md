# AGENTS.md — tokenprice

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # fetch-prices.js → models.json → vite build
```

`build` runs two steps: data fetch then Vite build. Use `node src/fetch-prices.js` standalone to regenerate `models.json` without building.

## Architecture

- Single-page app, no framework. Entry: `index.html` → `src/main.js` imports `style.css`, `models.json`, `plans.json`
- `src/fetch-prices.js` — ESM script, fetches OpenRouter API, writes `src/data/models.json`. Filtered: models with negative pricing (prompt/completion < 0) excluded. Price per million tokens computed from per-token API values. `models.json` is committed to git (not gitignored).
- `src/data/plans.json` — manually maintained, not auto-generated
- `vite.config.js` — `base: '/tokenprice/'` (required for GitHub Pages subpath)

## Deploy

- GitHub Actions: daily at 00:00 UTC + manual dispatch via `workflow_dispatch`
- CI: `npm ci` → `npm run build` → `upload-pages-artifact` → `deploy-pages`
- `dist/` is gitignored; CI builds it fresh
- Node 20, vite 6

## Notable

- No tests, lint, or typecheck setup
- `type: "module"` in package.json
- `.gitignore` excludes `node_modules/`, `dist/`, `.superpowers/brainstorm/`