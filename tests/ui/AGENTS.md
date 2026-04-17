# UI E2E Tests

Playwright against a built SPA served by the real Hono app over in-memory Mongo.

## Rules

- Import `test` / `expect` from `./fixtures/telegram`, never from `@playwright/test`
- Telegram `initData` is signed with real HMAC using `process.env.BOT_TOKEN` — never mock the signature
- Seed data via `helpers/db.ts` (`seedUser`, `resetDb`); do not hit the backend to create state
- Each test starts with `resetDb()` in `beforeEach`
- No Vite dev server: `globalSetup` requires `dist/` to exist (run `pnpm run build` first, or rely on the `test:ui` script)
