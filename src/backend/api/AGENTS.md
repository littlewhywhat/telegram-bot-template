# API Layer

## Pattern

```
route handler → build Effect program → Fx.provide(getAppLayer()) → Fx.runPromise → Hono response
```

## Rules

- Mini App requests are validated statelessly via Telegram's HMAC-SHA-256 init-data signature using the bot token — `user.id` maps to `users.chatId`
