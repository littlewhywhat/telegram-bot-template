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

## 3. Setup Secrets

### GitHub

| Secret | Purpose |
|--------|---------|
| `GH_PAT` | Personal access token with `contents: write` — used by the **Release Prepare** workflow to push the version commit and tag to `develop` |
| `STAGING_MONGODB_URI` | MongoDB connection string for staging |
| `STAGING_BOT_TOKEN` | Telegram bot token for staging |
| `STAGING_WEBHOOK_SECRET` | Webhook secret for staging |
| `PROD_MONGODB_URI` | MongoDB connection string for production |
| `PROD_BOT_TOKEN` | Telegram bot token for production |
| `PROD_WEBHOOK_SECRET` | Webhook secret for production |

### Vercel

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

## 4. Install and Run

```bash
pnpm install
vercel dev            # start local dev server
```

## 5. Run Tests

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
