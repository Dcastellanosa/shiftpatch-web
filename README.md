# shiftpatch-web

Frontend for ShiftPatch, a healthcare staffing platform where agencies post nursing shifts, nurses claim them, and administrators monitor shift status.

Stack: React 19 + Vite 8 + TypeScript, deployed on Vercel.

> Status: authentication plumbing only. The UI is a minimal session shell (sign in / sign out). There are no product screens yet.

## Architecture: backend-for-frontend (BFF)

```
Browser ──same-origin /api/*──▶ Vite dev proxy (local) │ Vercel route (deployed)
                                       │  strips /api, forwards cookies + Origin
                                       ▼
                               shiftpatch-api (Express) ──▶ Supabase
```

- React only renders UI and calls the backend through **relative `/api/*` paths**, both locally and in production.
- React **never** talks to Supabase. There is no Supabase client, no `@supabase/*` dependency, and no Supabase
  environment variable (`tests/no-supabase.test.ts` enforces this).
- [shiftpatch-api](https://github.com/Dcastellanosa/shiftpatch-api) owns login, sessions, token validation,
  authorization and all data access. Session tokens live in `HttpOnly` cookies that JavaScript cannot read.
  Because requests are same-origin, the cookies are host-only on the frontend's domain.

### Frontend pieces

| File | Role |
|---|---|
| `src/lib/api-client.ts` | The only gateway to the backend. Relative `/api` paths, `credentials: 'include'`, consistent `ApiError` handling. Exposes `login`, `logout`, `getCurrentSession`. Never decodes, stores, or validates tokens. |
| `src/auth/SessionProvider.tsx` | Calls `GET /api/auth/me` on startup and tracks `loading`, `authenticated`, `user`, `error`. Provides `login` / `logout`. |
| `src/auth/session-context.ts` | `useSession()` hook. |
| `src/App.tsx` | Minimal session shell (sign-in form / signed-in state). |

`GET /api/auth/me` is the only source of session truth: a `401` means signed out.

## Routing

| Environment | How `/api/*` reaches the API |
|---|---|
| `pnpm dev` / `pnpm preview` | Vite proxy (`vite.config.ts`): `/api/auth/me` → `http://localhost:3000/auth/me`. Cookies and `Set-Cookie` pass through, and the browser's `Origin` is forwarded for the API's CSRF check. Override the target with `API_PROXY_TARGET`. |
| Vercel | `vercel.json` route `/api/(.*)` → `${API_ORIGIN}/$1`. Vercel expands `API_ORIGIN` from the project's environment variables, so no API URL is hardcoded. |

Vercel notes:

- Environment-variable expansion in a destination is only supported by the legacy `routes` property. It is not
  supported by `rewrites`. `routes` cannot be combined with `rewrites`, `redirects`, `headers`, `cleanUrls` or
  `trailingSlash` in the same file. If those are needed later, switch to `vercel.ts` (`@vercel/config`), which
  can build the rewrite destination from `process.env` at build time.
- `API_ORIGIN` must be set for every Vercel environment (Production, and Preview if previews should work).
  Without it, the route has no valid destination.
- A client-side router will later need an SPA fallback route to `/index.html`.

## Local setup

Prerequisites: Node.js 24.x and pnpm (version pinned in `package.json` → `packageManager`; `corepack enable` will pick it up).

```bash
# 1. In shiftpatch-api: configure .env (CORS_ORIGINS=http://localhost:5173, Supabase vars) and run
pnpm dev                     # API on http://localhost:3000

# 2. In this repo
pnpm install
pnpm dev                     # http://localhost:5173 (no env vars required)
```

The frontend starts without any environment variables. If the API is not running, `/api/*` requests fail and the
shell shows an error.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Start the Vite dev server with HMR and the `/api` proxy |
| `pnpm build` | Typecheck (`tsc -b`) and produce a production build in `dist/` |
| `pnpm typecheck` | Typecheck app, tests and tooling configs (`tsc -b`, no JS output) |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run Vitest (API client contract, no-Supabase boundary) |
| `pnpm preview` | Serve the production build locally (with the `/api` proxy) |

CI (`.github/workflows/ci.yml`) runs install → typecheck → lint → test → build on every push to `main` and every pull request.

## Environment variables

There are **no `VITE_*` variables**, so nothing configurable is bundled into the browser. Both variables below are
read only by tooling.

| Variable | Where | Required | Description |
|---|---|---|---|
| `API_PROXY_TARGET` | local `.env.local` | no | Vite proxy target for `/api/*`. Default `http://localhost:3000`. |
| `API_ORIGIN` | Vercel project env | yes (on Vercel) | Origin of the deployed shiftpatch-api, e.g. `https://shiftpatch-api.vercel.app`, used by `vercel.json`. |

Never add Supabase keys, URLs, or any other credential to this repository.

## Deployment

Separate Vercel project (framework preset: Vite, output: `dist`):

1. Deploy shiftpatch-api first.
2. Set `API_ORIGIN` in this project to the API's origin, then deploy.
3. Add this app's production origin to the API's `CORS_ORIGINS`. The CSRF origin check uses that list too.
