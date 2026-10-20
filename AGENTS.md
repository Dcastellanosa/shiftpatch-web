# AGENTS.md — shiftpatch-web

Guidance for AI coding agents (and humans) working in this repository.

## Project

ShiftPatch is a healthcare staffing platform: agencies create open nursing shifts, nurses browse and claim them,
administrators monitor shift status, and nurses with expired credentials are blocked from claiming.

This repository is the **frontend** (React 19 + Vite + TypeScript, deployed on Vercel). The backend lives in the
separate `shiftpatch-api` repository (Express + TypeScript on Vercel). Supabase provides the database and Auth.

Architecture rules:

- Backend-for-frontend (BFF): React only renders UI and calls the API through same-origin `/api/*` paths via
  `src/lib/api-client/api-client.ts`. The Vite dev proxy (local) and `vercel.json` (deployed) forward `/api/*` to shiftpatch-api.
- React **never** uses Supabase: no `@supabase/*` dependency, no Supabase client, no `VITE_SUPABASE_*` variables.
  `tests/no-supabase.test.ts` enforces this.
- Sessions live in HttpOnly cookies managed by the API. React never reads, decodes, stores, or validates tokens.
  `GET /api/auth/me` (via `SessionProvider` / `useSession`) is the only source of session truth.
- Authorization decisions (roles, ownership, credential validity, shift availability) are enforced by the API and
  the database. Client-side checks are UX only, never security.

## Development workflow

1. Prerequisites: Node.js 24.x, pnpm (pinned in `package.json` → `packageManager`).
2. `pnpm install`. No environment variables are required locally (`.env.example` lists optional ones).
3. Start `shiftpatch-api` (`pnpm dev` there, port 3000), then `pnpm dev` here (http://localhost:5173).
4. Make small, focused changes. Keep commits scoped to one concern with a conventional prefix
   (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `refactor:`).
5. Run the full verification suite (below) before every commit. Do not commit with failing checks.
6. Do not push, deploy, or change Vercel or Supabase settings unless explicitly asked.

## Verification commands

Run all of these. CI (`.github/workflows/ci.yml`) runs the same steps on every push to `main` and every pull request.

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test        # Vitest (src/**/*.test.{ts,tsx}, tests/**/*.test.{ts,tsx})
pnpm build
```

For workflow changes, also run the Playwright flow against a running, seeded shiftpatch-api
(see README → End-to-end test):

```bash
pnpm exec playwright install chromium   # once
pnpm test:e2e                           # needs E2E_PASSWORD (in .env.e2e.local)
```

## Security rules

- Never commit secrets. `.env`, `.env.*` (except `.env.example`) and `.vercel/` are gitignored. Keep it that way.
- Every `VITE_*` variable is bundled into public JavaScript. The app currently needs none. Never add Supabase
  keys, URLs, or any other credential to this repository, its environment variables, or client code.
- Call the backend only through `src/lib/api-client/api-client.ts`: relative `/api` paths with `credentials: 'include'`.
  Never call the API by absolute URL, send `Authorization` headers, or store session data in `localStorage`,
  `sessionStorage`, IndexedDB, or `document.cookie`.
- Never send user IDs, roles, agency IDs, or credential state as authority. The API derives identity from its own
  session cookies.
- Do not commit machine-specific files or files containing local absolute paths (agent tooling directories such as
  `.claude/`, `.codex/`, `.kiro/`, `.agents/`, `skills/` are gitignored for this reason).
- Do not add analytics, third-party scripts, or new runtime dependencies without stating why.
- Routing is a small History API router (`src/lib/router/router.ts`). There is no routing dependency. Role-based route
  guards are UX only. The API returns 401/403/404 regardless.

## AI session transcripts

AI-assisted work is part of the hiring-challenge deliverable.

- **Export and preserve every AI session transcript unedited.** Do not delete, truncate, redact, summarize, or
  otherwise modify transcripts or agent session history.
- **Never paste secrets, tokens, credentials, or private environment values into an AI chat.** Because transcripts
  are kept verbatim, anything shared in a session becomes part of the deliverable. Refer to secrets by variable name
  only (e.g. `SUPABASE_SERVICE_ROLE_KEY`), never by value.
- Transcripts may be stored in this repository (e.g. `docs/ai-transcripts/YYYY-MM-DD-<topic>.md`) or delivered
  separately from the public repository if that is more appropriate.
