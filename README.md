# shiftpatch-web

Frontend for ShiftPatch, a healthcare staffing platform where agencies post nursing shifts, nurses claim them, and administrators monitor shift status.

Stack: React 19 + Vite 8 + TypeScript, deployed on Vercel. Business data comes from the
[shiftpatch-api](https://github.com/Dcastellanosa/shiftpatch-api) Express service; Supabase is used in the browser for authentication only.

> Status: repository baseline. No product screens yet.

## Local setup

Prerequisites: Node.js 24.x and pnpm (version pinned in `package.json` → `packageManager`; `corepack enable` will pick it up).

```bash
pnpm install
cp .env.example .env.local   # then fill in values
pnpm dev                     # http://localhost:5173
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | Start the Vite dev server with HMR |
| `pnpm build` | Typecheck (`tsc -b`) and produce a production build in `dist/` |
| `pnpm typecheck` | Typecheck app and tooling configs (`tsc -b`, no JS output) |
| `pnpm lint` | Run ESLint |
| `pnpm preview` | Serve the production build locally |

CI (`.github/workflows/ci.yml`) runs install → typecheck → lint → build on every push to `main` and every pull request.

## Environment variables

Defined in `.env.example`. Copy it to `.env.local` for local development and set the same keys in the Vercel project settings.

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | yes | Base URL of shiftpatch-api, no trailing slash (local: `http://localhost:3000`) |
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | Supabase publishable (anon) key, used for Auth only |

**All `VITE_*` variables are embedded in the browser bundle and are public.** Never put the Supabase secret / service-role key, or any other secret, in this repository or its environment variables.

## Deployment

Deployed as a separate Vercel project (framework preset: Vite, output: `dist`). Set the environment variables above for each Vercel environment. The API's `CORS_ORIGINS` must include this app's deployed origin.
