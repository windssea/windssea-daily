# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-07
**Commit:** bd51559
**Branch:** main

## OVERVIEW

个人每日待办应用 — Cloudflare Workers + D1 + Hono API + React SPA。中文 UI，"温暖手账感"设计。

## STRUCTURE

```
src/
├── client/         # React 19 SPA (Vite)
│   ├── main.tsx    # ReactDOM entry
│   ├── App.tsx     # Page router (welcome/todo)
│   ├── lib/api.ts  # Fetch wrapper → /api/*
│   └── pages/      # Components + CSS Modules
├── server/
│   ├── index.ts    # Hono app, Worker entry (wrangler.toml → main)
│   └── routes/
│       └── todos.ts  # CRUD: GET/POST/PUT/DELETE
└── shared/
    └── types.ts    # Todo/TodoRow interfaces + rowToTodo()
migrations/         # D1 schema (SQLite)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Add API endpoint | `src/server/routes/` | Create new file, mount in `server/index.ts` via `app.route()` |
| Add frontend page | `src/client/pages/` | Component + `.module.css` pair, import in `App.tsx` |
| Change DB schema | `migrations/` | New `NNNN_name.sql`, apply with `pnpm db:migrate:local` |
| Shared types | `src/shared/types.ts` | Both client and server import from here |
| Design tokens/colors | `.impeccable.md` | Brand personality + palette (暖纸色系) |
| API proxy config | `vite.config.ts` | `/api` → `localhost:8787` |

## CONVENTIONS

- **CSS Modules only** — no Tailwind, no global CSS. One `.module.css` per page component.
- **No router library** — `App.tsx` uses `useState<'welcome'|'todo'>` for page switching.
- **D1 row mapping** — SQLite `INTEGER` (0/1) ↔ JS `boolean`. Always use `rowToTodo()` from `shared/types.ts`.
- **Locale** — All user-facing text is Chinese (`zh-CN`).
- **Datetime** — Server uses `datetime('now', 'localtime')` in SQL, not JS Date.
- **Package manager** — pnpm exclusively (`packageManager: "pnpm@10.33.0"`).
- **Env type** — `Env = { Bindings: { DB: D1Database } }` defined per-file, not centralized.
- **Error responses** — `{ error: string }` shape, HTTP status codes. No error codes enum.
- **API prefix** — All routes mounted at `/api/*`, CORS enabled on `/api/*`.

## ANTI-PATTERNS (THIS PROJECT)

- **NEVER** use Tailwind or global CSS — CSS Modules only
- **NEVER** use a router library — keep the `useState` page pattern
- **NEVER** return raw D1 rows to client — always `rowToTodo()` to convert `INTEGER→boolean`
- **NEVER** use `as any` to suppress type errors from D1 results — use `rowToTodo(row as any)` only in the specific places it already exists (D1 `.first()` returns untyped)
- **NEVER** use tech-blue, dark glass, neon, or enterprise-style aesthetics — see `.impeccable.md`

## UNIQUE STYLES

- **Warm notebook aesthetic** — 暖纸色 (#fdf6e9), 肉桂棕 (#c47c5a), 鼠尾草绿 (#7a9e7e) for completed state
- **Fonts**: ZCOOL XiaoWei (display) + Noto Sans SC (body) via Google Fonts
- **Mobile-first** — max-width 480px, single-hand operation
- **Paper texture** — decorative rules (#e8d5b7), subtle shadows, no hard borders

## COMMANDS

```bash
pnpm install                  # Install deps
pnpm dev                      # API (wrangler :8787) + client (vite :5173) concurrently
pnpm build                    # Vite build → dist/client/
pnpm db:migrate:local         # Apply D1 migrations locally
pnpm db:migrate:remote        # Apply D1 migrations to production
pnpm deploy                   # Deploy Worker + static assets
```

## NOTES

- Wrangler serves the built SPA as static assets from `dist/client/` (configured in `wrangler.toml [assets]`)
- Dev mode runs TWO servers: Vite (HMR, port 5173) + Wrangler (D1, port 8787). Vite proxies `/api` to Wrangler.
- `test-api.ps1` — manual smoke test script (PowerShell), not automated tests. No test framework configured.
- `.impeccable.md` — design system source of truth. Read before any UI change.
- `docs/superpowers/` — legacy planning docs, not part of app code.
- D1 database binding name: `DB` (in `wrangler.toml` and `Env` type)
- React 19 (not 18) — `createRoot` from `react-dom/client`
- TypeScript 6 with `strict: true`, `noEmit: true` (Vite handles compilation)
