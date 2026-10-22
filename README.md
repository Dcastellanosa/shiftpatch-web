# shiftpatch-web

Frontend for ShiftPatch, a healthcare staffing platform where agencies post nursing shifts, nurses claim them, and
administrators monitor shift status.

Stack: React 19 + Vite 8 + TypeScript, React Router 7 (declarative), TanStack Query 5, Zustand 5 and Sass,
deployed on Vercel.

> Status: the challenge baseline. Sign in with a bearer token, role-aware navigation, the nurse marketplace with
> one-click claims and the required notification banner, My Shifts with advance cancellation, credential upload,
> agency shift posting from a dialog and no-show / advance cancellation with history, the admin reporting table,
> audit log and timesheets, admin management of agencies, branches and users (email invitations), agency control of
> nurse eligibility per branch, and invitation / password-recovery links that land on `/set-password`.

## Architecture: one bearer-token API

```
Browser ──same-origin /api/*──▶ Vite dev proxy (local) │ Vercel route (deployed)
   Authorization: Bearer <token>       │  strips /api, forwards the Authorization header + Origin
                                       ▼
                               shiftpatch-api (Express) ──▶ Supabase
```

- React only renders UI and calls the backend through **relative `/api/*` paths**, both locally and in production.
- React **never** talks to Supabase. There is no Supabase client, no `@supabase/*` dependency, and no Supabase
  environment variable. `tests/no-supabase.test.ts` enforces this, and also checks that the `Authorization` header
  is built only under `src/shared/api/` and that no source file uses browser storage.
- [shiftpatch-api](https://github.com/Dcastellanosa/shiftpatch-api) owns login, token verification, authorization
  and all data access. `POST /api/auth/login` answers `{ token, user: { id, name, role } }`; the token goes into the
  API client's in-memory holder (`src/shared/api/token/`) and leaves it only as the `Authorization` header. There
  are no cookies (`credentials: 'omit'`), no refresh tokens and no persistence: **a page reload starts anonymous
  and the user signs in again** (the token lives one hour).
- A `401` on any protected request means the token is gone: the client forgets it and the app signs out locally.

## Security model

- Identity, role and agency come from the sign-in response (`user.id` is the public id: `nurse-1`, `admin-1`, or
  the agency `agency-a` for agency logins) and are re-derived by the API from its bearer token on every request.
  The client never sends a user ID, role, agency ID or credential state. Posting a shift sends only
  `{ role, date, startTime, endTime }` (+ `branchId` for a multi-branch agency), claiming sends no body,
  cancelling sends `{ reason }`.
- Role-based navigation and route guards only shape the UI. The API, Row Level Security and the atomic database
  commands make every authorization decision. A nurse who opens `/admin/shifts` sees "no access" and no admin data
  is requested.
- The API's error envelope is exactly `{ "error": "<message>" }`. Screens and banners show that message (never
  stack traces or internals) and branch on the HTTP status, never on a machine code.

## Role matrix (UI)

| Screen | Path | Nurse | Agency | Admin |
|---|---|---|---|---|
| Available shifts (marketplace) + one-click claim | `/shifts` | ✓ | | |
| My shifts (upcoming / past) + advance cancellation | `/my-shifts` | ✓ | | |
| Credentials: upload (file + expiry) and the list on file | `/credentials` | ✓ | | |
| Timesheets (own / agency's / all) | `/timesheets` | ✓ | ✓ | ✓ |
| Agency shifts + post dialog + cancel (no-show / advance) + history | `/agency/shifts` | | ✓ | |
| All shifts: reporting table, badges, counts and filters | `/admin/shifts` | | | ✓ |
| Audit log | `/admin/audit-log` | | | ✓ |
| Nurses: eligibility per branch | `/agency/nurses` | | ✓ | |
| Agencies, branches and their status | `/admin/agencies`, `/admin/agencies/:agencyId` | | | ✓ |
| Users and invitations | `/admin/users` | | | ✓ |
| Set password (invitation or recovery link) | `/set-password` | public | public | public |

`/` redirects to the role's home screen. A signed-in user without a provisioned role sees an "account not set up"
message.

## Screens

- **Sign in.** Email and password through `POST /api/auth/login` (`login-email-input`, `login-password-input`,
  `login-submit-button`). A wrong password shows the API's "Invalid email or password".
- **Available shifts (nurse).** The marketplace: every open shift of every agency (`shift-list-item`), with the
  agency name, the facility-local date and times exactly as the facility reads them (`19:00 – 07:00 (next day)`)
  and the hours. **One click** on `shift-claim-button` claims; the outcome appears in the notification banner
  (`notification-banner`): "Shift claimed", or the API's own refusal, for example "Credential expired, cannot
  claim shift" for James Cook, or "You are not active at this branch…" when the agency suspended the nurse.
- **My shifts (nurse).** Upcoming and past assigned shifts. An upcoming filled shift carries `shift-cancel-button`,
  which releases it in advance (the API refuses a nurse's no-show).
- **Credentials (nurse).** `credential-upload-input` (PDF, PNG or JPEG, 4 MB) and `credential-expiry-date-input`
  post a multipart form to `POST /api/me/credentials`; the API validates the bytes, stores the document privately
  and records the expiry. The list on file shows type, expiry, status (an expired date reads "Expired") and the
  document name. A renewed licence immediately unblocks claims.
- **Agency shifts.** `agency-post-shift-button` opens the "Post a shift" dialog: role, facility-local date, start
  and end (an end at or before the start means the next day; a branch picker appears only for multi-branch
  agencies); `agency-post-shift-submit-button` posts it. The table (own agency, via
  `GET /api/agencies/:agencyId/shifts`) shows status, the nurse's public id and an expandable history; a filled row
  has a reason picker (`advance` / `no-show`) next to `shift-cancel-button`, and the banner reports "Shift
  reopened". A status filter is kept in the URL.
- **All shifts (admin).** The reporting table (`admin-dashboard-shift-table`) with a status badge per row
  (`admin-shift-status-badge`), agency, nurse and local times for every shift. Status counts double as filters;
  agency and date-range filters are kept in the URL (`?agency=&from=&to=&status=`).
- **Audit log (admin).** `audit-log-table`, read through `GET /api/admin/audit-events` (admin only; the tables are
  unreadable by every client): who did what, when, on which agency, branch, user, eligibility or shift.
- **Timesheets (every role).** `timesheet-table`, read through `GET /api/timesheets`: one row per filled shift
  (nurse, agency, role, date, local times, scheduled hours, scheduled / worked), scoped by the API to the caller.
- **Agencies (admin).** Create agencies in a modal, open one to add branches (name, address, IANA time zone), rename
  it, and activate or deactivate agencies and branches after a confirmation. Inactive ones stop taking shifts and
  claims and disappear from nurses' lists; the API enforces this, the UI explains it. Deleting an agency asks for
  confirmation and only succeeds while it never had shifts (`agency_has_shifts` otherwise).
- **Users (admin).** Every account with role, status (invited / active) and access. The invitation form adapts to the
  role: agency users pick one or more active agencies, nurses one active branch, admins nothing else. The API emails
  the link; the browser never sees it. An existing email is shown on the field (`email_exists`). Invitations open in a
  modal. Deleting a user asks for confirmation; the API refuses users with shifts or recorded actions and the
  viewer's own account, and the viewer's row shows no delete action.
- **Nurses (agency).** A nurses × branches grid for the agency's branches. Each cell shows the nurse's status there
  and the one action that changes it (activate / suspend). Suspending hides future shifts only.
- **Set password.** `/set-password` is the public landing page of invitation and recovery emails. The token in the
  URL fragment is read once, removed from the address bar, kept only in component state and posted to
  `/api/auth/complete-password` with the chosen password; success starts the session like a login. The sign-in page
  offers "Forgot your password?", which posts `/api/auth/recover` and shows the same confirmation for any address.

Every screen has loading, empty, error (with retry) and unauthorized states. Tables collapse into stacked rows on
narrow screens.

**Trial-data note.** The specification's sample shifts are dated 2026-10-02 to 2026-10-04 (already in the past) and
its post example is dated too. The post-shift form therefore has no "today or later" rule and the API has no
"already started" rule, so the required flows (claim `shift-1`, post a dated shift) work deterministically. A
claimed dated shift sits under "Past" in My Shifts.

**Intentionally out of scope:** one-click credential export, shift notifications (email on claim / cancellation),
analytics (no third-party script is loaded) and shift completion (timesheets mark a filled shift as "Worked" once
it has ended).

### Frontend pieces

| File | Role |
|---|---|
| `src/shared/api/client/client.ts` | The only gateway to the backend: relative `/api` paths, `credentials: 'omit'`, the `Authorization` header from the token holder, `ApiError` (status-derived `code`, the API's message). Auth (incl. password links), shift (marketplace, agency, post, claim, cancel), event, branch, My Shifts, credentials, timesheets, audit log, admin agency/user and nurse-eligibility calls. A `401` on a protected route drops the token and notifies the session. |
| `src/shared/api/token/token.ts` | The in-memory access token holder: `setAccessToken`, `clearAccessToken`, `authorizationHeaders`, `onSessionLost`. Never persisted, never exposed as a value. |
| `src/app/providers/query-client/query-client.ts` | TanStack Query client: 30 s `staleTime` for operational data, retries only network failures (max 2), background-refresh failures become toasts. In memory only. |
| `src/features/auth/` | `SessionProvider` exposes the `['session']` query (the user the API reported at sign-in; `initialData: null`, never fetched or refetched) and the login/logout mutations as `useSession()`, and signs out locally when the client reports a lost session. Logout clears the cache; login clears it only after success. |
| `src/app/router/routes/routes.tsx`, `src/app/router/RequireRole/` | React Router v7 declarative routes (`Routes`/`Route`/`Navigate`) and the UX-only role guard. |
| `src/app/router/navigation/navigation.ts` | Screens per role, nested-path rule for the guard, home redirects. |
| `src/features/shifts/`, `src/features/agency-management/`, `src/features/admin-dashboard/` | Query and mutation hooks per feature (`useAvailableShifts`, `useClaimShift`, `useCancelShift`, `useAgencyShifts`, `useCreateShift`, `useAdminShifts`), the cancel control (reason picker + button) and the post-shift form. |
| `src/features/credentials/`, `src/entities/credential/` | The credential upload form (file + expiry + type), `useUploadCredential` (multipart) and the `['me','credentials']` query with type and status labels. |
| `src/entities/timesheet/`, `src/entities/audit/` | The `['timesheets']` and `['admin','audit-events']` queries behind the timesheet and audit-log pages. |
| `src/entities/shift/`, `src/entities/branch/` | Shift model (`open` \| `filled`), query keys (`['shifts','list']`, `['shifts','agency',id]`, events) and history, the shift table (optional test ids and row-action slot), status badge and the when piece; branches. |
| `src/features/admin-agencies/`, `src/entities/agency/` | Agency and branch forms, the status toggle with confirmation, create/update hooks and the `['agencies', …]` queries. |
| `src/features/admin-users/`, `src/entities/user/` | Users table, role-dependent invitation form, `useInviteUser`, the `['admin','users']` query and role/status labels. |
| `src/features/nurse-eligibility/` | Nurses × branches grid, eligibility toggle, `['agency','nurses']` query and `useSetEligibility` (PUT activates, DELETE suspends). |
| `src/features/auth/password-link/`, `src/pages/SetPasswordPage/`, `src/features/auth/ForgotPasswordForm/` | Fragment parsing and clearing, the public set-password page, `useCompletePassword` (drops every other query, overwrites the session) and the recovery form. |
| `src/shared/ui/ConfirmDialog/`, `src/shared/ui/Modal/` | Focus-managed confirmation dialog used before status changes and deletions; labelled modal that hosts the create-agency and invite-user forms. |
| `src/stores/ui-store/ui-store.ts` | The single Zustand store: the global toast queue, rendered by `src/shared/ui/Toaster/`. Never API data. |
| `src/shared/lib/format/format.ts` | Facility-local date and time-range formatting (no zone conversion), scheduled hours, timestamps. |
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
| `pnpm dev` / `pnpm preview` | Vite proxy (`vite.config.ts`): `/api/shifts` → `http://localhost:3000/shifts`, `Authorization` forwarded. Override the target with `API_PROXY_TARGET`. Vite serves `index.html` for client routes. |
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

Sign in with a trial account (shiftpatch-api README → Trial accounts; `pnpm seed` there loads exactly the
specification's data, password `Trial2026!`): `maria.lopez@example.com` (nurse, valid licence),
`james.cook@example.com` (nurse, expired licence → "Credential expired, cannot claim shift"),
`admin@sunrisehealth.example` / `admin@metrocare.example` (agencies) and `alex.kim@example.com` (admin).

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Vite dev server with HMR and the `/api` proxy |
| `pnpm build` | Typecheck (`tsc -b`) and production build to `dist/` |
| `pnpm typecheck` | Typecheck app, tests, E2E and tooling configs |
| `pnpm lint` | ESLint (with `eslint-config-prettier`) |
| `pnpm format` / `pnpm format:check` | Prettier: rewrite / verify formatting |
| `pnpm test` | Vitest: API client contract (bearer header, one-key envelope, flat shift shape, multipart upload), the no-Supabase / no-persistence / Authorization-only-in-the-client guards, the 15 required test ids (`tests/test-ids.test.ts`), role-aware navigation, route guards, screen states and local date/time formatting. Runs in CI. |
| `pnpm test:e2e` | Playwright against the local stack, on the specification's seed only: the challenge flows through the required test ids, nurse eligibility, agency/branch lifecycle, invitation + password recovery through the local mail catcher |
| `pnpm preview` | Serve the production build locally (with the `/api` proxy) |

CI (`.github/workflows/ci.yml`) runs install → typecheck → lint → format check → test → build on every push to
`main` and every pull request, plus an advisory `pnpm audit`; Dependabot opens weekly grouped updates. The E2E
suite needs Docker, the local Supabase stack and a sibling shiftpatch-api checkout, so it runs locally.

### End-to-end tests

Fully local and deterministic. `pnpm test:e2e`:

1. starts shiftpatch-api on `:3100` against the **local** Supabase stack (`pnpm e2e:api` there: keys come from
   `supabase status`, `.env` is ignored, non-local addresses are refused),
2. starts Vite on `:5174` proxying `/api` to it (a dev server on `:5173` can keep running),
3. resets and seeds exactly the specification's dataset (`e2e/global-setup.ts` → `pnpm e2e:reset` in the API repo,
   password `Trial2026!`), locates the local Mailpit, and
4. runs the spec files in order on one worker, **re-seeding before every file** (`e2e/reset.ts`), so no file
   observes another file's changes to `shift-1..3`, the trial accounts or their eligibility. Extra scenarios create
   uniquely named agencies and shifts. Nothing reloads a page after sign-in (the token is in memory): a check from
   another angle signs in again in a fresh context.

```bash
pnpm exec playwright install chromium     # once
# shiftpatch-api checked out next to this repo, Docker running, `pnpm db:start` done there
pnpm test:e2e
```

| Spec | Covers |
|---|---|
| `e2e/challenge-flows.spec.ts` | The challenge baseline through the required test ids: Sunrise posts from the dialog; Maria browses both agencies, claims `shift-1` in one click ("Shift claimed") and releases the new shift in advance; James gets "Credential expired, cannot claim shift"; Sunrise reports a no-show on `shift-2` (reopened, history); Maria uploads a licence; Alex reads the reporting table with badges, the audit log and the timesheets |
| `e2e/eligibility.spec.ts` | Suspending a nurse at a branch makes her claims there fail with the API's message until she is activated again (the marketplace still lists every shift) |
| `e2e/agency-admin.spec.ts` | Admin creates a uniquely named agency (modal) and a branch, deactivates / reactivates both, deletes the agency after confirming, is refused for Sunrise (it has shifts) |
| `e2e/invitation.spec.ts` | Admin invites a nurse (modal) → the emailed link (read from the local Mailpit) sets a password and signs in with the returned bearer token → "Forgot your password?" → recovery link → new password works, old one does not → the admin deletes the nurse after confirming and she can no longer sign in |

No password is configured (`E2E_PASSWORD` is ignored): the accounts use the specification's `Trial2026!`.
Optional `.env.e2e.local` (gitignored): `E2E_API_DIR` when the API checkout is not `../shiftpatch-api`. The suite
never depends on, modifies or restores remote or shared users or data.

## Environment variables

There are **no `VITE_*` variables**, so nothing configurable is bundled into the browser.

| Variable | Where | Required | Description |
|---|---|---|---|
| `API_PROXY_TARGET` | local `.env.local` | no | Vite proxy target for `/api/*`. Default `http://localhost:3000`. |

Nothing else: the browser holds no Supabase key and no secret. The `supabase/.temp/` link file of an earlier local
setup is untracked and ignored (`.gitignore`).
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
3. Add this app's production origin to the API's `CORS_ORIGINS`. The API's origin check for browser requests uses
   that list too; `Authorization` passes through the Vercel route untouched.
4. Deploy. `vercel.json` already routes `/api/*` to the API and falls back to `index.html` for client routes.
