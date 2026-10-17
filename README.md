# shiftpatch-web

Frontend for ShiftPatch, a healthcare staffing platform where agencies post nursing shifts, nurses claim them, and
administrators monitor shift status.

Stack: React 19 + Vite 8 + TypeScript, deployed on Vercel.

> Status: first vertical slice. Sign in, role-aware navigation, nurse shift browsing and claiming, My Shifts,
> agency shift creation with status and history, and an admin operational list with counts and filters.

## Architecture: backend-for-frontend (BFF)

```
Browser ──same-origin /api/*──▶ Vite dev proxy (local) │ Vercel route (deployed)
                                       │  strips /api, forwards cookies + Origin
                                       ▼
                               shiftpatch-api (Express) ──▶ Supabase
```

- React only renders UI and calls the backend through **relative `/api/*` paths**, both locally and in production.
- React **never** talks to Supabase. There is no Supabase client, no `@supabase/*` dependency, and no Supabase
  environment variable. `tests/no-supabase.test.ts` enforces this, and also checks that no source file sets an
  `Authorization` header or uses browser storage.
- [shiftpatch-api](https://github.com/Dcastellanosa/shiftpatch-api) owns login, sessions, authorization and all
  data access. Session tokens live in `HttpOnly` cookies that JavaScript cannot read.

## Security model

- Identity, role and agency come from `GET /api/auth/me`. The client never sends a user ID, role, agency ID or
  credential state. Creating a shift sends only `{ branchId, title, startsAt, endsAt }`, and claiming sends no body.
- Role-based navigation and route guards only shape the UI. The API, Row Level Security and the atomic
  `claim_shift` database function make every authorization decision. A nurse who opens `/admin/shifts` sees
  "no access" and no admin data is requested.
- Error screens show the API's safe `error.message` or fixed copy, never stack traces or internals.

## Role matrix (UI)

| Screen | Path | Nurse | Agency | Admin |
|---|---|---|---|---|
| Available shifts + claim | `/shifts` | ✓ | | |
| My shifts (upcoming / past) | `/my-shifts` | ✓ | | |
| Agency shifts + create form + history | `/agency/shifts` | | ✓ | |
| All shifts: counts and filters | `/admin/shifts` | | | ✓ |

`/` redirects to the role's home screen. A signed-in user without a provisioned role sees an "account not set up"
message.

## Screens

- **Sign in.** Email and password through `POST /api/auth/login`, with a session loading state.
- **Available shifts (nurse).** Future open shifts at branches where the nurse is active, showing branch, agency,
  date, local time (branch time zone) and duration. Claim opens a confirmation dialog. Failures are explained in
  plain language:

  | API code | Message |
  |---|---|
  | `credential_expired` / `credential_missing` / `credential_revoked` | A required credential has expired / is missing / was revoked |
  | `eligibility_inactive` | You are not active at this branch |
  | `shift_not_open` | This shift was already claimed (the list refreshes) |
  | `schedule_conflict` | This overlaps a shift you already have |

- **My shifts (nurse).** Upcoming and past assigned shifts.
- **Agency shifts.** Create an open shift for one of the agency's branches. Times are entered in the branch's
  local time and converted to UTC. An end time at or before the start means the shift ends the next day. The
  table shows status, assigned nurse and an expandable event history, with a status filter kept in the URL.
- **All shifts (admin).** Agency, branch, nurse, time and status for every shift. Status counts double as
  filters. Agency, branch and date-range filters are kept in the URL (`?agency=&branch=&from=&to=&status=`).

Every screen has loading, empty, error (with retry) and unauthorized states. Tables collapse into stacked rows on
narrow screens.

### Frontend pieces

| File | Role |
|---|---|
| `src/lib/api-client.ts` | The only gateway to the backend: relative `/api` paths, `credentials: 'include'`, `ApiError`. Auth, shift, event, branch and My Shifts calls. |
| `src/auth/SessionProvider.tsx` | Calls `GET /api/auth/me` on startup and provides `loading`, `user`, `login`, `logout`. |
| `src/lib/router.ts`, `src/components/Link.tsx` | Minimal History API router (four screens did not justify a dependency). |
| `src/components/navigation.ts` | Screens per role, home redirects, route guards (UX only). |
| `src/lib/errors.ts` | User-facing copy for claim error codes. |
| `src/lib/format.ts` | `Intl` date/time formatting in the branch time zone, and branch-local time → UTC conversion. |
| `src/pages/*` | One component per screen. |

## Routing

| Environment | How `/api/*` reaches the API |
|---|---|
| `pnpm dev` / `pnpm preview` | Vite proxy (`vite.config.ts`): `/api/auth/me` → `http://localhost:3000/auth/me`. Override the target with `API_PROXY_TARGET`. Vite serves `index.html` for client routes. |
| Vercel | `vercel.json`: `/api/(.*)` → `${API_ORIGIN}/$1`, then static files, then an SPA fallback to `/index.html`. |

`${API_ORIGIN}` expansion works only with the legacy `routes` property, which cannot be combined with `rewrites`,
`redirects`, `headers`, `cleanUrls` or `trailingSlash`. If those are needed later, move to `vercel.ts`.

## Local setup

Prerequisites: Node.js 24.x and pnpm (pinned in `package.json`).

```bash
# 1. shiftpatch-api: configure .env, apply migrations, seed, run (see its README)
pnpm dev                     # API on http://localhost:3000

# 2. This repo
pnpm install
pnpm dev                     # http://localhost:5173 (no env vars required)
```

Sign in with a seeded account (shiftpatch-api README → Test accounts). For example, use
`nurse.ava@shiftpatch.test` to claim, `nurse.ben@shiftpatch.test` to see the expired-credential message,
`agency.northwind@shiftpatch.test` to post shifts, and `admin@shiftpatch.test` for the global view. Passwords are
whatever `SEED_USER_PASSWORD` was when you seeded. None are stored in this repository.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Vite dev server with HMR and the `/api` proxy |
| `pnpm build` | Typecheck (`tsc -b`) and production build to `dist/` |
| `pnpm typecheck` | Typecheck app, tests, E2E and tooling configs |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest: API client contract, BFF boundary, role-aware navigation, route guards, claim error messages, screen states, time-zone conversion. Runs in CI. |
| `pnpm test:e2e` | Playwright: the full claim workflow through the real UI, API and database |
| `pnpm preview` | Serve the production build locally (with the `/api` proxy) |

CI (`.github/workflows/ci.yml`) runs install → typecheck → lint → test → build. The E2E flow needs a running,
seeded API and is run locally.

### End-to-end test

`e2e/claim-workflow.spec.ts`: the agency posts a shift → the nurse signs in, sees it, claims it → it appears in
My Shifts → the agency table shows the assigned nurse and the history.

```bash
pnpm exec playwright install chromium     # once
# shiftpatch-api running against a seeded database, then:
echo 'E2E_PASSWORD=<the seed password>' > .env.e2e.local   # gitignored
pnpm test:e2e                             # starts Vite on :5173 unless E2E_BASE_URL is set
```

Optional overrides: `E2E_BASE_URL`, `E2E_NURSE_EMAIL`, `E2E_NURSE_NAME`, `E2E_AGENCY_EMAIL`, `E2E_BRANCH`. Each run
creates a uniquely named shift in a far-future slot so repeated runs do not overlap.

## Environment variables

There are **no `VITE_*` variables**, so nothing configurable is bundled into the browser.

| Variable | Where | Required | Description |
|---|---|---|---|
| `API_PROXY_TARGET` | local `.env.local` | no | Vite proxy target for `/api/*`. Default `http://localhost:3000`. |
| `API_ORIGIN` | Vercel project env | yes (on Vercel) | Origin of the deployed shiftpatch-api, used by `vercel.json`. |
| `E2E_PASSWORD` | `.env.e2e.local` | for `test:e2e` | Seeded accounts' password. |

Never add Supabase keys, URLs, or any other credential to this repository.

## Deployment prerequisites

Separate Vercel project (framework preset: Vite, output: `dist`):

1. Deploy shiftpatch-api first, with migrations applied and accounts provisioned.
2. Set `API_ORIGIN` in this project to the API's origin for every environment that should work (Production,
   Preview).
3. Add this app's production origin to the API's `CORS_ORIGINS`. The CSRF origin check uses that list too.
4. Deploy. `vercel.json` already routes `/api/*` to the API and falls back to `index.html` for client routes.
