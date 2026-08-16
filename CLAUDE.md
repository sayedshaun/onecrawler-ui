# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server on :5173, proxies /api to API_PROXY_TARGET (default http://localhost:8000)
npm run build     # tsc -b (type-check) + production build to dist/
npm run preview   # preview the production build locally
npm run lint      # eslint .
```

No test suite exists in this repo. There is no separate typecheck script — `npm run build` is what type-checks.

Docker (this UI has no functionality without a running `onecrawler-backend`):

```bash
docker compose -f docker-compose.dev.yml up   # hot-reload dev server, :5173
docker compose up                              # production-like build served by Caddy, :8080
```

## Architecture

This is a React + TypeScript + Vite dashboard for a Python crawling library called `onecrawler`. It has **no backend of its own** — it's a thin client over a sibling FastAPI project (`onecrawler-backend`), reachable through Vite's dev proxy (or Caddy in prod) at `/api`.

### Settings mirror the Python library

The entire app revolves around one `CrawlSettings` object (`src/lib/types.ts`) that mirrors `onecrawler`'s Python `Settings` class field-for-field: discovery mode (sitemap / link extraction / full crawler / direct scraper), scraping strategy (heuristic or GenAI with a schema builder), content filters (`by_date` / `by_keywords` / `by_files` / `by_extension` / `by_cosine_similarity`, composable with AND/OR), proxies, and browser/human-behavior settings. The New Crawl form (`src/components/crawl-form/`) builds this object in UI state; `src/lib/api-mapper.ts` is the single place that converts it to the backend's snake_case payload (`link_extraction_limit`, `proxy_rotation_method`, `scraping_output_format`, etc.). When adding a new setting, it must be threaded through all three: `types.ts`, the form section, and `api-mapper.ts`.

### API layer

- `src/lib/api.ts` — `apiFetch`, the one fetch wrapper everything goes through. Handles auth headers, transparent 401 → refresh-token → retry, and the ngrok browser-warning bypass header. It's intentionally decoupled from the auth store via `configureApiAuth()` (a setter the auth store calls on load) to avoid a circular import — `api.ts` cannot import `auth-store.ts` directly.
- `src/lib/crawls-api.ts` — all crawl/data/discovered-URL/log REST endpoints, built on `apiFetch`.
- `src/store/auth-store.ts` — zustand store holding JWT access/refresh tokens, persisted to `localStorage`. Owns token refresh (with in-flight dedup so concurrent 401s share one refresh call) and registers itself with `api.ts` via `configureApiAuth`.
- `src/store/settings-store.ts` — persisted default `CrawlSettings` used to prefill New Crawl.

### Live/polling views

Crawl Detail, Crawl History, and Dashboard poll the backend rather than using websockets. `src/hooks/use-polled-resource.ts` is the shared polling hook — reuse it rather than hand-rolling `setInterval` fetch loops.

### Structure

```
src/
  components/
    ui/            shadcn-style primitives (button, card, dialog, select, ...)
    layout/        app shell, sidebar, top bar, theme toggle
    auth/          shared login/signup layout
    crawl-form/    New Crawl / Settings page form sections
    crawl-detail/  live progress, logs, results, discovered URLs
    dashboard/     dashboard-only widgets
    shared/        cross-page widgets (status badge, crawls table, result drawer, empty state, pagination)
  pages/           one file per route
  hooks/           use-polled-resource, use-debounced-value, use-media-query
  store/           zustand stores (auth session, persisted crawl-form defaults)
  lib/             types.ts, api.ts, crawls-api.ts, api-mapper.ts, jwt.ts
  providers/       theme provider (light/dark/system)
```

Path alias `@/*` maps to `src/*` (configured in both `vite.config.ts` and `tsconfig`).

## Conventions worth knowing

- Auth: JWT-based, access + refresh tokens persisted in `localStorage` via the zustand `persist` middleware. `selectIsAuthenticated` treats a live refresh token as "authenticated" even after access-token expiry, since `apiFetch` refreshes transparently on the next request.
- `MotionConfig reducedMotion="user"` in `main.tsx` makes every framer-motion animation honor the OS reduce-motion setting automatically — don't bypass it with raw CSS transitions for new animated components.
- Dev server file watching uses polling (`usePolling: true` in `vite.config.ts`) because Docker Desktop on Windows doesn't reliably forward inotify events across the bind mount.

## Commit messages

Keep commit messages short — a single one-line summary (e.g. `fix: stack templates row layout on mobile`). No multi-paragraph bodies, no bullet-point explanations, unless explicitly asked for.
