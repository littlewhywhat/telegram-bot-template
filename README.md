# Telegram Bot Template

Telegram bot + Mini App monorepo template. grammY + Effect TS + Hono serverless on Vercel, React + Radix UI frontend, MongoDB.

## Prerequisites

- **Node 22** (see `.nvmrc`)
- **pnpm** (package manager)

## 1. Create Your Telegram Bots

Open [BotFather](https://t.me/BotFather) and create two bots:

- **Staging bot** — for `develop` branch deploys
- **Production bot** — for production deploys

BotFather will ask for a **name** and a **username**:

- **Name** (display name) — 1–64 characters, no restrictions on format. Overwritten on each deploy from `bot-settings.ts`, so use any placeholder.
- **Username** (the `@handle`) — 5–32 characters, only `a-z`, `0-9`, `_`, must end with `bot`. Permanent, cannot be changed later.

Generate a random staging username in the browser console:

```js
console.log(`yourprefix_stag_${crypto.randomUUID().slice(0,5)}_bot`)
```

Save both tokens.

## 2. Setup MongoDB Atlas

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Create a database user with read/write access
4. Under Network Access, allow `0.0.0.0/0` (required for Vercel serverless)
5. Copy the connection string, append your database name: `mongodb+srv://user:pass@cluster.mongodb.net/mybot`
6. Create separate databases for staging and production

## 2. Setup Vercel

1. Create a new project at [vercel.com/new](https://vercel.com/new) and import the repo
2. Set Framework Preset to **Other**
3. Disable git-based deployments (handled by GitHub Actions via `vercel.json`)
4. Copy **Project ID** and **Org ID** from Project Settings → General
5. Get a deploy token from [vercel.com/account/tokens](https://vercel.com/account/tokens) (one token works for all projects)
6. Disable **Deployment Protection** (Settings → Deployment Protection → set to **Off**) so Telegram webhook requests can reach the API endpoints
7. Add environment variables for both Preview (Staging) and Production scopes (see [Vercel secrets](#vercel))

## 3. Setup Secrets

Staging in GitHub corresponds to **Preview** scope in Vercel.

| Purpose | Environment | Vercel | GitHub |
|---------|-------------|--------|--------|
| GitHub PAT (`contents: write`) for **Release Prepare** | all | | `GH_PAT` |
| Vercel deploy token | all | | `VERCEL_TOKEN` |
| Vercel org ID | all | | `VERCEL_ORG_ID` |
| Vercel project ID | all | | `VERCEL_PROJECT_ID` |
| Telegram bot token | staging | `BOT_TOKEN` | `STAGING_BOT_TOKEN` |
| Webhook secret | staging | `WEBHOOK_SECRET` | `STAGING_WEBHOOK_SECRET` |
| MongoDB connection string | staging | `MONGODB_URI` | `STAGING_MONGODB_URI` |
| Telegram bot token | production | `BOT_TOKEN` | `PROD_BOT_TOKEN` |
| Webhook secret | production | `WEBHOOK_SECRET` | `PROD_WEBHOOK_SECRET` |
| MongoDB connection string | production | `MONGODB_URI` | `PROD_MONGODB_URI` |
| Frontend environment flag | staging | `VITE_ENV` = `preview` | |
| Frontend environment flag | production | `VITE_ENV` = `production` | |

## 4. Run Tests

```bash
pnpm test                  # all tests
pnpm run test:integration  # vitest integration only
pnpm run test:e2e          # cucumber E2E only
pnpm run test:watch        # vitest watch mode
```

All tests use `mongodb-memory-server` — no Docker or external DB required.

Add the `e2e` label to run e2e tests on PR

## 5. Deploy

- Push to `develop` → deploys to Vercel Preview automatically
- PRs → add the `deploy-staging` label to deploy PR to Vercel Preview
- **Release Prepare** (manual) → bumps version, updates changelog, creates `vX.Y.Z` tag on `develop`
- **Deploy Production** (manual, on a `vX.Y.Z` tag) → runs CI then deploys to Vercel Production
