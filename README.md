# shiftpatch-web

Frontend for ShiftPatch, a healthcare staffing platform where agencies post nursing shifts, nurses claim them, and
administrators monitor shift status.

Stack: React 19 + Vite 8 + TypeScript, React Router 7 (declarative), TanStack Query 5, Zustand 5 and Sass,
deployed on Vercel.

> Status: vertical slice plus agency administration. Sign in, role-aware navigation, nurse shift browsing and
> claiming, My Shifts, agency shift creation with status and history, an admin operational list with counts and
> filters, admin management of agencies, branches and users (email invitations), agency control of nurse
> eligibility per branch, and invitation / password-recovery links that land on `/set-password`.

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
| Nurses: eligibility per branch | `/agency/nurses` | | ✓ | |
| Agencies, branches and their status | `/admin/agencies`, `/admin/agencies/:agencyId` | | | ✓ |
| Users and invitations | `/admin/users` | | | ✓ |
| Set password (invitation or recovery link) | `/set-password` | public | public | public |

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
- **Agencies (admin).** Create agencies, open one to add branches (name, address, IANA time zone), rename it, and
  activate or deactivate agencies and branches after a confirmation. Inactive ones stop taking shifts and claims and
  disappear from nurses' lists; the API enforces this, the UI explains it.
- **Users (admin).** Every account with role, status (invited / active) and access. The invitation form adapts to the
  role: agency users pick one or more active agencies, nurses one active branch, admins nothing else. The API emails
  the link; the browser never sees it. An existing email is shown on the field (`email_exists`).
- **Nurses (agency).** A nurses × branches grid for the agency's branches. Each cell shows the nurse's status there
  and the one action that changes it (activate / suspend). Suspending hides future shifts only.
- **Set password.** `/set-password` is the public landing page of invitation and recovery emails. The token in the
  URL fragment is read once, removed from the address bar, kept only in component state and posted to
  `/api/auth/complete-password` with the chosen password; success starts the session like a login. The sign-in page
  offers "Forgot your password?", which posts `/api/auth/recover` and shows the same confirmation for any address.

Every screen has loading, empty, error (with retry) and unauthorized states. Tables collapse into stacked rows on
narrow screens.

### Frontend pieces

| File | Role |
|---|---|
| `src/shared/api/client/client.ts` | The only gateway to the backend: relative `/api` paths, `credentials: 'include'`, `ApiError`. Auth (incl. password links), shift, event, branch, My Shifts, admin agency/user and nurse-eligibility calls. |
| `src/app/providers/query-client/query-client.ts` | TanStack Query client: 30 s `staleTime` for operational data, retries only network failures (max 2), background-refresh failures become toasts. In memory only. |
| `src/features/auth/` | `SessionProvider` exposes the `['session']` query (`GET /api/auth/me`, `staleTime: Infinity`, no refetch on focus) and the login/logout mutations as `useSession()`. Logout clears the cache; login clears it only after success. |
| `src/app/router/routes/routes.tsx`, `src/app/router/RequireRole/` | React Router v7 declarative routes (`Routes`/`Route`/`Navigate`) and the UX-only role guard. |
| `src/app/router/navigation/navigation.ts` | Screens per role, nested-path rule for the guard, home redirects. |
| `src/features/shifts/`, `src/features/agency-management/`, `src/features/admin-dashboard/` | Query and mutation hooks per feature (`useAvailableShifts`, `useClaimShift`, `useCreateShift`, `useAdminShifts`, …), the claim dialog and the create-shift form. |
| `src/entities/shift/`, `src/entities/branch/` | Shift model, query keys and history, the shift table, status badge and when/where pieces; branches. |
| `src/features/admin-agencies/`, `src/entities/agency/` | Agency and branch forms, the status toggle with confirmation, create/update hooks and the `['agencies', …]` queries. |
| `src/features/admin-users/`, `src/entities/user/` | Users table, role-dependent invitation form, `useInviteUser`, the `['admin','users']` query and role/status labels. |
| `src/features/nurse-eligibility/` | Nurses × branches grid, eligibility toggle, `['agency','nurses']` query and `useSetEligibility` (PUT activates, DELETE suspends). |
| `src/features/auth/password-link/`, `src/pages/SetPasswordPage/`, `src/features/auth/ForgotPasswordForm/` | Fragment parsing and clearing, the public set-password page, `useCompletePassword` (drops every other query, overwrites the session) and the recovery form. |
| `src/shared/ui/ConfirmDialog/` | Focus-managed confirmation dialog used before status changes. |
| `src/stores/ui-store/ui-store.ts` | The single Zustand store: the global toast queue, rendered by `src/shared/ui/Toaster/`. Never API data. |
| `src/features/shifts/claim-errors/claim-errors.ts` | User-facing copy for claim error codes. |
| `src/shared/lib/format/format.ts` | `Intl` date/time formatting in the branch time zone, and branch-local time → UTC conversion. |
| `src/pages/<PageName>/` | One folder per screen, with component, styles, test and snapshot. |

Layout: `src/app/` (App, providers, router, global styles), `src/pages/`, `src/features/`, `src/entities/`,
`src/shared/` (api, ui, lib) and `src/stores/`. Components, pages, hooks and logic modules keep their tests beside
the implementation. Visual pieces also keep their SCSS and snapshots there; `src/main.tsx` and
`src/app/styles/index.scss` are the global entry points. Each module folder exposes its public imports through
`index.ts`. Tests render through `tests/render-with-providers.tsx` (router + query client with `retry: false`).

Styles use SCSS compiled by Vite with the `sass` development dependency, with global BEM class names and no CSS
Modules. The light and dark palettes live in `src/app/styles/_theme.scss` and generate CSS custom properties, so
the active theme still follows the user's color scheme. The shared narrow-screen breakpoint lives in
`src/app/styles/_breakpoints.scss`; component styles load it with Sass `@use`. `pnpm-workspace.yaml` disables
automatic optional peer installation so Vite uses the portable compiler consistently.

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
| `pnpm test:e2e` | Playwright against a freshly reset local stack: claim workflow, agency/branch lifecycle and inactive restrictions, nurse eligibility, invitation + password recovery through the local mail catcher |
| `pnpm preview` | Serve the production build locally (with the `/api` proxy) |

CI (`.github/workflows/ci.yml`) runs install → typecheck → lint → test → build. The E2E suite needs Docker and
the local Supabase stack, so it runs locally.

### End-to-end tests

Fully local and deterministic. `pnpm test:e2e`:

1. starts shiftpatch-api on `:3100` against the **local** Supabase stack (`pnpm e2e:api` there: keys come from
   `supabase status`, `.env` is ignored, non-local addresses are refused),
2. starts Vite on `:5174` proxying `/api` to it (a dev server on `:5173` can keep running),
3. resets and seeds the local database with a password generated for the run (`e2e/global-setup.ts` →
   `pnpm e2e:reset` in the API repo; never printed or stored), locates the local Mailpit, and
4. runs the specs in order on one worker.

```bash
pnpm exec playwright install chromium     # once
# shiftpatch-api checked out next to this repo, Docker running, `pnpm db:start` done there
pnpm test:e2e
```

| Spec | Covers |
|---|---|
| `e2e/agency-admin.spec.ts` | Admin creates an agency and a branch, deactivates / reactivates both; an inactive branch rejects new shifts until it is active again |
| `e2e/claim-workflow.spec.ts` | Agency posts a shift → nurse sees and claims it → My Shifts → agency table and history show the assignment |
| `e2e/eligibility.spec.ts` | Suspending a nurse at a branch hides its open shifts; activating restores them |
| `e2e/invitation.spec.ts` | Admin invites a nurse → the emailed link (read from the local Mailpit) sets a password and signs in → "Forgot your password?" → recovery link → new password works, old one does not |

No password is configured: `E2E_PASSWORD` is ignored. Seeded accounts and the password live only in the run.
Optional `.env.e2e.local` (gitignored): `E2E_API_DIR` when the API checkout is not `../shiftpatch-api`. The suite
never depends on, modifies or restores remote or shared users or data.

## Environment variables

There are **no `VITE_*` variables**, so nothing configurable is bundled into the browser.

| Variable | Where | Required | Description |
|---|---|---|---|
| `API_PROXY_TARGET` | local `.env.local` | no | Vite proxy target for `/api/*`. Default `http://localhost:3000`. |
| `API_ORIGIN` | Vercel project env | yes (on Vercel) | Origin of the deployed shiftpatch-api, used by `vercel.json`. |
| `E2E_API_DIR` | `.env.e2e.local` | no | Path of the shiftpatch-api checkout for `test:e2e`. Default `../shiftpatch-api`. |

Never add Supabase keys, URLs, or any other credential to this repository.

## Deployment prerequisites

Separate Vercel project (framework preset: Vite, output: `dist`):

1. Deploy shiftpatch-api first, with migrations applied, its `WEB_ORIGIN` set to this app's origin and
   `<this origin>/set-password` on the Supabase redirect allowlist, so invitation and recovery emails land here
   (see the API README → Deployment prerequisites).
2. Set `API_ORIGIN` in this project to the API's origin for every environment that should work (Production,
   Preview).
3. Add this app's production origin to the API's `CORS_ORIGINS`. The CSRF origin check uses that list too.
4. Deploy. `vercel.json` already routes `/api/*` to the API and falls back to `index.html` for client routes.
