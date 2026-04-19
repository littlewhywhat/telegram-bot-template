# Telegram Bot Template

Telegram bot + Mini App monorepo template. grammY + Effect TS + Hono serverless on Vercel, React + Radix UI frontend, MongoDB.

## Prerequisites

- **Node 22** (see `.nvmrc`)
- **pnpm** (package manager)

## 1. Create Your Telegram Bots

Open [BotFather](https://t.me/BotFather) and create two bots:

- **Staging bot** — for `develop` branch deploys
- **Production bot** — for production deploys

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
6. Add environment variables for both Preview (Staging) and Production scopes (see [Vercel secrets](#vercel))

## 3. Setup Secrets

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

## 6. Deploy

- Push to `develop` → deploys to staging automatically
- PRs → add the `deploy-staging` label to deploy a preview
- **Release Prepare** (manual) → bumps version, updates changelog, creates `vX.Y.Z` tag on `develop`
- **Deploy Production** (manual, on a `vX.Y.Z` tag) → runs CI then deploys to production
