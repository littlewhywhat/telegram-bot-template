# Bot Layer

## Rules

- Pipe syntax with `Effect.flatMap` / `Effect.tap` — never generators/yield
- Handlers are Effect programs, not grammY middleware
- Handlers follow collect → decide → execute: gather all context from services first, then determine the action, then execute and respond

## Adding a Command

1. Create `bot/handlers/<command>.ts` returning an Effect
2. Pipe from `BotService` / `DbService`
3. Wire in webhook route's update dispatch
