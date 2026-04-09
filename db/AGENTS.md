# Database Layer

## Rules

- Never import `db/client.ts` directly in handlers — always go through `DbService`
- Keep `db/types.ts` in sync with `spec/entities.puml`
