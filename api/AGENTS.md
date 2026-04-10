# API Layer

## Pattern

```
route handler → build Effect program → Fx.provide(getAppLayer()) → Fx.runPromise → Hono response
```
