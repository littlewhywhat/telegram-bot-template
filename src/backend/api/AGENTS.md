# API Layer

## Pattern

```
route handler → build Effect program → Fx.provide(getAppLayer()) → Fx.runPromise → Hono response
```

## Rules

- Keep all routes single-segment (e.g. `/me`, `/health`) — Vercel's `api/[[...route]]` catch-all does not route multi-segment paths like `/miniapp/me` to the serverless function; they 404 at the routing layer
- Mini App requests are validated statelessly via Telegram's HMAC-SHA-256 init-data signature using the bot token — `user.id` maps to `users.chatId`
