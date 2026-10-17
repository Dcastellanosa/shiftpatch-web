# AGENTS.md — shiftpatch-web

Guidance for AI coding agents (and humans) working in this repository.

## Project

ShiftPatch is a healthcare staffing platform: agencies create open nursing shifts, nurses browse and claim them,
administrators monitor shift status, and nurses with expired credentials are blocked from claiming.

This repository is the **frontend** (React 19 + Vite + TypeScript, deployed on Vercel). The backend lives in the
separate `shiftpatch-api` repository (Express + TypeScript on Vercel). Supabase provides the database and Auth.

Architecture rules:

- All business data and shift operations go through the Express API (`VITE_API_URL`). The browser must not query
  Supabase tables or RPCs directly.
- The Supabase client in the browser is used for **authentication only** (sign-in, sign-out, session, access token).
- Authorization decisions (roles, ownership, credential validity, shift availability) are enforced by the API and
  the database. Client-side checks are UX only, never security.

## Development workflow

1. Prerequisites: Node.js 24.x, pnpm (pinned in `package.json` → `packageManager`).
2. `pnpm install` then `cp .env.example .env.local` and fill in values.
3. `pnpm dev` runs the app at http://localhost:5173. Run `shiftpatch-api` locally for API calls.
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
pnpm build
```

No test runner is configured yet. When one is added, add its command here and to CI.

## Security rules

- Never commit secrets. `.env`, `.env.*` (except `.env.example`) and `.vercel/` are gitignored. Keep it that way.
- Every `VITE_*` variable is bundled into public JavaScript. Only public values belong there: the API URL, the
  Supabase URL, and the Supabase publishable (anon) key.
- **Never** place the Supabase secret / service-role key, a JWT secret, or any other credential in this repository,
  its environment variables, or client code.
- Send the user's Supabase access token to the API as `Authorization: Bearer <token>`. Do not store tokens in
  `localStorage` yourself. Rely on the Supabase client's session handling.
- Do not commit machine-specific files or files containing local absolute paths (agent tooling directories such as
  `.claude/`, `.codex/`, `.kiro/`, `.agents/`, `skills/` are gitignored for this reason).
- Do not add analytics, third-party scripts, or new runtime dependencies without stating why.

## AI session transcripts

AI-assisted work is part of the challenge deliverable. **Preserve every AI session transcript.**

- Do not delete, truncate, or overwrite agent session history.
- At the end of each working session, export the transcript (e.g. into `docs/ai-transcripts/YYYY-MM-DD-<topic>.md`)
  and commit it with a `docs:` commit.
- Redact secrets, tokens, and personal data before committing a transcript. Keep everything else verbatim.
