# AGENTS.md

Instructions for AI coding agents (Cursor, Copilot, Codex, etc.) working in this repository. See [CLAUDE.md](./CLAUDE.md) for the full architecture writeup — this file summarizes the same conventions in the generic `agents.md` format.

## Setup & commands

```bash
npm install
npm run dev       # Vite dev server on :5173, proxies /api to a running onecrawler-backend
npm run build     # tsc -b (type-check) + production build to dist/
npm run preview   # preview the production build
npm run lint      # eslint .
```

There is no test suite and no separate typecheck script — `npm run build` is what type-checks. Always run `npm run lint` and `npm run build` before considering a change done.

This UI has no backend of its own; it's a client for a sibling FastAPI project (`onecrawler-backend`) reached through `/api`. Point `API_PROXY_TARGET` (env var, see `vite.config.ts`) at a running backend instance if you need to exercise real requests.

## Architecture summary

- One `CrawlSettings` object (`src/lib/types.ts`) mirrors `onecrawler`'s Python `Settings` class and drives the whole app. Adding a new setting means touching three places: `types.ts`, the relevant `src/components/crawl-form/` section, and `src/lib/api-mapper.ts` (converts UI state to the backend's snake_case payload).
- All backend calls go through `apiFetch` in `src/lib/api.ts` (auth headers, 401 → refresh → retry). Don't call `fetch` directly for API requests.
- Auth state lives in `src/store/auth-store.ts` (zustand, persisted JWTs). It registers itself with `api.ts` via `configureApiAuth()` — keep that indirection; `api.ts` must not import the auth store directly (would create a circular import).
- Live views (Crawl Detail, History, Dashboard) poll rather than use websockets, via `src/hooks/use-polled-resource.ts`. Reuse it instead of hand-rolled polling.
- Path alias `@/*` → `src/*`.

## Conventions

- Follow the existing ESLint config (`eslint.config.js`); fix lint warnings rather than suppressing them.
- New animated UI should go through `framer-motion` (already wrapped in `MotionConfig reducedMotion="user"` at the root) so reduced-motion preferences are respected automatically.
- Don't add a test suite, CI workflow, or new tooling unless explicitly asked.

## Commit messages

Keep commit messages short — a single one-line summary. No multi-paragraph bodies or bullet-point explanations unless explicitly asked for.
