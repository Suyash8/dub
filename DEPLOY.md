# Self-hosting Dub on Vercel — Step-by-step Deploy Guide

This fork of [dubinc/dub](https://github.com/dubinc/dub) is pre-configured for
self-hosting on Vercel, with upstream sync automated via GitHub Actions so you
keep receiving updates from the main project.

**Your configuration (replace `example.com` with your real domain):**

| What | Value |
| --- | --- |
| Dashboard (app UI) | `https://app.example.com` |
| Short links | `https://go.example.com/<key>` |

> **Why two hostnames?** Dub's middleware routes by hostname: one host cannot
> serve both the dashboard and the redirect engine. Two subdomains of the same
> domain (e.g. `app.acme.com` + `go.acme.com`) is the standard setup and is
> what this repo is configured for.

---

## 0. Run the one-time config script

Replace the placeholder domains with yours (only needed once, before pushing):

```bash
./set-domains.sh app.yourdomain.com go.yourdomain.com
git add -A && git commit -m "Configure self-host domains"
```

This patches `packages/utils/src/constants/main.ts` (routing domains) and
`packages/email/src/resend/constants.ts` (email sender addresses). Verify with
`git diff`.

---

## 1. Create the accounts & services (free tiers all work)

Create these in any order; copy each value as you go — you will paste them
into Vercel in step 4.

### 1a. PostgreSQL database — Neon via Vercel Storage (required, free tier)
This self-host fork is converted from MySQL/PlanetScale to **PostgreSQL** so you can use Vercel's free Neon Postgres storage:
- In your Vercel project → **Storage** → **Create Database** → **Neon (Serverless Postgres)** (Free tier, 0.5 GB storage, no credit card required), OR create a free database at https://neon.tech.
- Copy the Postgres connection string (looks like `postgresql://neondb_owner:PASSWORD@ep-xxx.aws.neon.tech/neondb?sslmode=require`).

The value goes into **`DATABASE_URL`** (if Vercel Storage adds `POSTGRES_PRISMA_URL` / `DATABASE_URL` automatically, verify `DATABASE_URL` is set for Production).

### 1b. Upstash Redis (required — link caching/redirects)
https://upstash.com → create a **Redis** database (any region, Global works) →
copy the REST URL and REST token (Settings → REST API).

- **`UPSTASH_REDIS_REST_URL`** — e.g. `https://xxx.upstash.io`
- **`UPSTASH_REDIS_REST_TOKEN`**

### 1c. Upstash QStash (required — background jobs)
In the same Upstash account: **QStash** → copy:

- **`QSTASH_TOKEN`**
- **`QSTASH_CURRENT_SIGNING_KEY`**
- **`QSTASH_NEXT_SIGNING_KEY`**
- (`QSTASH_URL` stays `https://qstash-us-east-1.upstash.io` unless your
  console shows a different regional URL)

### 1d. Tinybird (required — click analytics)
You chose full analytics, so:
1. Sign up at https://tinybird.co (Free Builder plan).
2. Install their CLI once: `pip install tinybird-cli`.
3. Clone nothing extra — Dub ships its Tinybird datasources in
   `apps/web/lib/tinybird`; the official instructions are at
   https://dub.co/docs/self-hosting#setting-up-tinybird (run `tb deploy` on the
   dub tinybird datasource directory per that page).
4. Copy your **Admin token** (Tokens page) → **`TINYBIRD_API_KEY`**.
5. If your workspace is in the EU, set **`TINYBIRD_API_URL`** to
   `https://api.eu-central-1.tinybird.co`; otherwise the US default
   `https://api.tinybird.co` is correct.

### 1e. Resend (required — email magic-link login)
You chose email magic-link auth:
1. Sign up at https://resend.com → **API Keys** → create →
   **`RESEND_API_KEY`**.
2. Add and verify your **root domain** (`yourdomain.com`, DNS records Resend
   shows you) so emails can be sent from `system@yourdomain.com` (the sender
   was patched by `set-domains.sh`).

### 1f. Vercel account (you already have it)
Needed now:
- **`TEAM_ID_VERCEL`** — your team/scope id (Vercel dashboard → Settings →
  General → "Vercel ID", starts with `team_...`). Personal accounts have an id
  too — copy it the same way.
- **`VERCEL_API_KEY`** — create an access token at
  https://vercel.com/account/tokens (Dub uses the Vercel Domains API to add
  your short domain + SSL).

---

## 2. Push to your GitHub

```bash
unzip dub-selfhost.zip && cd dub-selfhost   # if starting from the zip
./set-domains.sh app.yourdomain.com go.yourdomain.com
git add -A && git commit -m "Configure self-host domains"
gh repo create my-dub --private --source=. --push   # or push manually
```

The full git history (upstream `origin` = dubinc/dub) is preserved in the zip,
so merges from upstream work. The included workflow
`.github/workflows/sync-upstream.yml` runs every Monday and opens a PR (or
pushes directly) when upstream has new commits.

## 3. Import to Vercel

1. Vercel → Add New → **Project** → import your new repo.
2. Framework preset: **Next.js**. Build command / install: defaults
   (`pnpm` workspace is auto-detected; root directory **leave empty** — Vercel
   builds `apps/web` automatically via Turborepo; if it doesn't, set Root
   Directory to `apps/web`).
3. **Don't deploy yet** — set the env vars first (step 4).
4. Node.js version: 20+ (Settings → General).

## 4. Environment variables (Vercel → Settings → Environment Variables)

Add these to **Production** (and Preview if you use it). Secrets first:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # run twice for the two secrets
```

| Variable | Value |
| --- | --- |
| `NEXTAUTH_SECRET` | random base64 (command above) |
| `ENCRYPTION_KEY` | random base64 (command above) |
| `NEXTAUTH_URL` | `https://app.yourdomain.com` |
| `DATABASE_URL` | PostgreSQL URI from 1a (Neon) |
| `UPSTASH_REDIS_REST_URL` | from 1b |
| `UPSTASH_REDIS_REST_TOKEN` | from 1b |
| `QSTASH_TOKEN` | from 1c |
| `QSTASH_CURRENT_SIGNING_KEY` | from 1c |
| `QSTASH_NEXT_SIGNING_KEY` | from 1c |
| `TINYBIRD_API_KEY` | from 1d |
| `TINYBIRD_API_URL` | from 1d |
| `RESEND_API_KEY` | from 1e |
| `TEAM_ID_VERCEL` | `team_...` from 1f |
| `VERCEL_API_KEY` | token from 1f |
| `CRON_SECRET` | random string (e.g. `openssl rand -hex 32`) |

**Deploy** now (first deploy will fail on the DB step below is fine — run
Prisma push first, see 5).

## 5. Initialize the database (one time, from your machine)

```bash
pnpm install
DATABASE_URL="<your neon postgres url>" pnpm -F web exec prisma generate --schema=prisma/schema
DATABASE_URL="<your neon postgres url>" pnpm -F web exec prisma db push --schema=prisma/schema
```

(Requires Node 20+ and pnpm: `npm i -g pnpm`.)

## 6. DNS + domains

1. **Dashboard:** in your DNS add `app.yourdomain.com` CNAME →
   `cname.vercel-dns.com` (or add the domain in Vercel → Project → Settings →
   Domains and follow its instructions). Wait for SSL to be issued.
2. **Short domain:** add `go.yourdomain.com` the same way.
3. In the Dub dashboard (logged in as the first user), go to
   **Settings → Domains → Add domain** → `go.yourdomain.com`. Because
   `VERCEL_API_KEY`/`TEAM_ID_VERCEL` are set, Dub adds it to your Vercel
   project automatically and SSL is provisioned.

## 7. First login

1. Visit `https://app.yourdomain.com/register`, enter your email, sign in via
   the magic link (check spam; sender is `system@yourdomain.com`).
2. The first workspace you create is your personal workspace — add your short
   domain there (step 6.3) and you're done: create a link, test
   `https://go.yourdomain.com/<key>`.

## Troubleshooting

- **Login email not arriving** → Resend domain not verified, or
  `RESEND_API_KEY` wrong.
- **Redirects 404** → short domain not added in the dashboard (6.3) or
  `go.example.com` placeholder still in `packages/utils/src/constants/main.ts`.
- **500 on /api routes** → `DATABASE_URL` unreachable (Neon requires
  `?sslmode=require`), Redis/QStash keys missing.
- **No analytics recorded** → `TINYBIRD_API_KEY`/`TINYBIRD_API_URL` wrong, or
  Tinybird datasources not deployed (step 1d).
- **Sync PR shows conflicts** → resolve per the PR body instructions; your
  customizations are only in `packages/utils/src/constants/main.ts`,
  `packages/email/src/resend/constants.ts`, `DEPLOY.md`, `set-domains.sh` and
  `.github/workflows/sync-upstream.yml`, so conflicts should be rare.

## License note

Dub is AGPL-3.0. Self-hosting for personal/internal use is fine; if you offer
it publicly as a hosted service you must publish your source (this repo does).
