# Deploying Travio

Travio is four Next.js apps in one pnpm/Turborepo monorepo, all backed by
one Supabase project. Each app is deployed as its own project (the steps
below use Vercel; any Next.js host works the same way).

| App | Folder | Local port | Audience |
|---|---|---|---|
| Website | `apps/website` | 3000 | public marketing site + agency signup |
| Dashboard | `apps/dashboard` | 3001 | agency staff |
| Customer portal | `apps/customer-portal` | 3002 | travellers (invited customers) |
| Admin | `apps/admin` | 3003 | Travio staff (not functional yet) |

## 1. One hosting project per app

For each app, create a project pointing at this repository with:

- **Root directory**: the app's folder (e.g. `apps/dashboard`)
- **Framework**: Next.js
- **Install command**: `pnpm install --frozen-lockfile` (run from the repo root;
  Vercel does this automatically when it detects `pnpm-lock.yaml`)
- **Build command**: `cd ../.. && pnpm turbo run build --filter=@travio/<app>`
  (e.g. `@travio/dashboard`)
- **Node.js**: 22.x (matches `.nvmrc`)

## 2. Environment variables

`NEXT_PUBLIC_*` values are **baked in at build time**. Set them before the
first build, and redeploy after changing one. The others are read at
request time.

| Variable | Website | Dashboard | Portal | Admin | When read |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | required | required | required | required | build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required | required | required | required | build |
| `SUPABASE_SERVICE_ROLE_KEY` | required | required | — | — | request |
| `NEXT_PUBLIC_DASHBOARD_URL` | required | — | — | — | build |
| `LOG_LEVEL` | optional | optional | optional | optional | request |

- `SUPABASE_SERVICE_ROLE_KEY` **bypasses RLS**. Server-side only: never give it
  a `NEXT_PUBLIC_` name, and only set it on the website and dashboard. The
  website uses it for contact-form inquiries; the dashboard for team and
  customer-portal invites.
- `NEXT_PUBLIC_DASHBOARD_URL` is the dashboard's public URL (e.g.
  `https://app.example.com`). Signup sends people there, and it's the
  confirmation email's link target (`<url>/login?confirmed=1`).

Each app checks its variables when the server starts
(`src/instrumentation.ts`, using `packages/config/next/env.mjs`). In
production a missing or malformed value stops the server with a message
naming the variable (never its value); in development the production-only
ones are just a warning.

## 3. Supabase settings (dashboard → Authentication)

- **URL Configuration → Site URL**: the website's URL.
- **URL Configuration → Redirect URLs**: add `https://<dashboard-domain>/**`
  (the same value as `NEXT_PUBLIC_DASHBOARD_URL`, plus `/**`). Without it,
  confirmation links fall back to the Site URL.
- **Sign In / Providers → Email → Confirm email**: ON. Signup then sends a
  confirmation email, and the agency is created on the owner's first
  dashboard sign-in.
- **Emails → SMTP**: the built-in sender is heavily rate-limited (a few
  emails per hour) and meant for testing. Configure your own SMTP before
  real signups.
- **Free plan**: projects pause after about a week without activity, which
  takes the whole backend down until someone restores it in the dashboard.
  Use a paid plan for anything people rely on.

## 4. Database migrations

Migrations live in `supabase/migrations` and are applied with the Supabase
CLI from the repo root, **after** the change is merged to `main`:

```bash
supabase migration list --linked   # what's applied vs. local
supabase db push --dry-run         # exactly what would be applied
supabase db push                   # apply
```

Apply migrations **before** deploying app code that depends on them (e.g. the
analytics functions). The database tests in `supabase/tests` run in CI on
every pull request (`database` job).

## 5. What every app already sends

Security headers from `packages/config/next/security-headers.mjs`:
`X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`,
`Permissions-Policy`, `Strict-Transport-Security` (effective on https only), and a
`Content-Security-Policy` limited to `frame-ancestors`, `base-uri`,
`form-action` and `object-src`. A full script/connect CSP needs nonces and
is not set yet.

## Checklist for a first production deploy

1. Supabase on a paid plan, custom SMTP configured, "Confirm email" ON.
2. `supabase migration list --linked` shows nothing pending.
3. Four hosting projects created with the root directories above.
4. Environment variables set per the table **before** the first build.
5. Supabase Site URL = website URL; Redirect URLs include the dashboard's `/**`.
6. Smoke test: sign up an agency on the website → confirm the email → sign in
   on the dashboard → the agency is created.
