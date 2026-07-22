# AGENTS.md — tokenprice

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # fetch-prices.js → models.json → vite build
```

`build` runs two steps: data fetch then Vite build. Use `node src/fetch-prices.js` standalone to regenerate `models.json` without building.

## Architecture

- Single-page app, no framework. Entry: `index.html` → `src/main.js` imports `style.css`, `models.json`
- `src/fetch-prices.js` — ESM script, fetches OpenRouter API, writes compact `src/data/models.json` (numeric prices). Negative pricing excluded. On fetch failure: exit 0 if existing file present, else exit 1.
- Prices stored as USD per million tokens (numbers). UI can toggle CNY at fixed 7.2.
- Default UI hides free models (`avg === 0`). Popular = major platforms, last 90 days, paid, newest 20.
- `vite.config.js` — `base: '/tokenprice/'` (required for GitHub Pages subpath). `models.json` is git-tracked.

## Deploy

- GitHub Actions: daily at 00:00 UTC + manual dispatch via `workflow_dispatch`
- CI: `npm ci` → `npm run build` → `upload-pages-artifact` → `deploy-pages`
- `dist/` is gitignored; CI builds it fresh
- Node 20, vite 6

## Notable

- No tests, lint, or typecheck setup
- `type: "module"` in package.json
- `.gitignore` excludes `node_modules/`, `dist/`, `.superpowers/brainstorm/`