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

## 3. Clone and Configure

```bash
git clone <repo-url> my-bot
cd my-bot
cp .env.example .env
```

Fill in `.env`:

```
BOT_TOKEN=<your-test-bot-token>
WEBHOOK_SECRET=<random-string>
MONGODB_URI=mongodb://localhost:27017/bot-dev
```

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
- Production (`main`) → requires manual workflow trigger
- PRs → add the `deploy-staging` label to deploy a preview
