# Migration: Effect Layers → Awilix

## Current State

- `DbService` and `BotService` defined as `Context.GenericTag` with `Layer.succeed` / `Layer.merge`
- Composition root in `src/backend/api/context.ts` — mutable singleton `appLayer`
- Handlers use `Fx.all({ db: DbService, bot: BotService })` to pull from Effect context (R channel)
- Routes call `Fx.provide(getAppLayer())` before `Fx.runPromiseExit`
- Tests use `setAppLayer(Layer.merge(...))` to inject mocks

## What Changes

| Aspect | Before | After |
|---|---|---|
| DI container | Effect `Layer` + `Context.GenericTag` | awilix `AwilixContainer` |
| Service tags | `Context.GenericTag<BotService>('BotService')` | removed |
| Layer factories | `makeDbLayer`, `makeBotLayer` | removed |
| Composition root | `context.ts` with `ensureAppLayer` / `getAppLayer` / `setAppLayer` | `container.ts` with `createContainer()` returning `AwilixContainer` |
| Getting deps in handlers | `Fx.all({ db: DbService, bot: BotService })` at start of pipe | destructure from cradle: `const { db, bot, logger } = deps` passed as arg |
| Providing deps in routes | `Fx.provide(getAppLayer())` | gone — Effect `R` channel is `never` everywhere |
| Logger | `console.error` scattered in routes | `Logger` service registered in container |
| Tests | `setAppLayer(Layer.merge(dbLayer, mockBotLayer))` | `createContainer({ db, bot: mockBot, logger })` |

## New Dependency

```
pnpm add awilix
```

## Resulting File Structure

```
src/backend/
├── container.ts              ← NEW: single awilix registration file
├── logger.ts                 ← NEW: Logger interface + factory
├── api/
│   ├── app.ts                ← MODIFIED: receives container, no Fx.provide
│   ├── context.ts            ← DELETED (replaced by container.ts)
│   └── validate-init-data.ts (unchanged)
├── bot/
│   ├── index.ts              (unchanged)
│   ├── errors.ts             (unchanged)
│   ├── quotes.ts             (unchanged)
│   ├── cron.ts               ← MODIFIED: deps as param, no Fx.all for services
│   ├── services.ts           ← MODIFIED: keep interface + factory, remove Tag + Layer
│   └── handlers/
│       ├── start.ts          ← MODIFIED: deps as param
│       └── message.ts        ← MODIFIED: deps as param
└── db/
    ├── client.ts             (unchanged)
    ├── collections.ts        (unchanged)
    ├── types.ts              (unchanged)
    └── services.ts           ← MODIFIED: keep interface + factory, remove Tag + Layer

tests/helpers/
├── setup.ts                  (unchanged)
├── mock-bot.ts               ← MODIFIED: returns plain BotService, no Layer
└── fixtures.ts               (unchanged)

tests/integration/
├── webhook.test.ts           ← MODIFIED: createContainer with mocks
├── cron.test.ts              ← MODIFIED: same
└── health.test.ts            ← MODIFIED: same

features/support/
├── hooks.ts                  ← MODIFIED: createContainer with mocks
└── world.ts                  (unchanged)
```

## Container Design (`src/backend/container.ts`)

Single file where everything registers:

```ts
import { asFunction, asValue, createContainer as createAwilixContainer, type AwilixContainer, InjectionMode } from 'awilix'
import type { Bot } from 'grammy'
import type { Db } from 'mongodb'
import { makeLogger, type Logger } from './logger.js'
import { makeBotService, type BotService } from './bot/services.js'
import { makeDbService, type DbService } from './db/services.js'

export interface Cradle {
  db: DbService
  bot: BotService
  logger: Logger
}

export type AppContainer = AwilixContainer<Cradle>

export function createContainer(overrides?: {
  mongoDb?: Db
  grammy?: Bot
  logger?: Logger
}): AppContainer {
  const container = createAwilixContainer<Cradle>({ injectionMode: InjectionMode.PROXY })

  container.register({
    logger: asFunction(() => overrides?.logger ?? makeLogger()).singleton(),
    db: asFunction(() => makeDbService(overrides?.mongoDb ?? getDb())).singleton(),
    bot: asFunction(() => makeBotService(overrides?.grammy ?? createBot(process.env.BOT_TOKEN!))).singleton(),
  })

  return container
}
```

For production, a module-level singleton (like the current `appLayer`):

```ts
let _container: AppContainer | null = null

export function ensureContainer(): boolean { ... }
export function getContainer(): AppContainer { ... }
export function setContainer(c: AppContainer): void { ... }
```

## Logger Design (`src/backend/logger.ts`)

```ts
export interface Logger {
  info: (msg: string, meta?: Record<string, unknown>) => void
  error: (msg: string, meta?: Record<string, unknown>) => void
  warn: (msg: string, meta?: Record<string, unknown>) => void
}

export function makeLogger(): Logger {
  return {
    info: (msg, meta) => console.log(JSON.stringify({ level: 'info', msg, ...meta })),
    error: (msg, meta) => console.error(JSON.stringify({ level: 'error', msg, ...meta })),
    warn: (msg, meta) => console.warn(JSON.stringify({ level: 'warn', msg, ...meta })),
  }
}
```

## Handler Pattern (before → after)

### Before (`handleStart`)

```ts
export function handleStart(chatId: number) {
  return pipe(
    Fx.all({ db: DbService, bot: BotService }),  // pulls from Effect R channel
    Fx.tap(({ db }) => db.upsertUser(chatId, { ... })),
    Fx.tap(({ bot }) => bot.sendMessage(chatId, REPLY)),
    ...
  )
}
```

### After (`handleStart`)

```ts
import type { Cradle } from '../container.js'

export function handleStart(deps: Cradle, chatId: number) {
  const { db, bot, logger } = deps
  return pipe(
    db.upsertUser(chatId, { state: 'awaiting_name', name: null }),
    Fx.tap(() => bot.sendMessage(chatId, REPLY)),
    Fx.tap(() => db.saveMessage({ chatId, direction: 'bot', text: REPLY, sentAt: new Date() })),
    Fx.tap(() => logger.info('start handled', { chatId })),
  )
}
```

- Effect `R` type parameter becomes `never` — no `Fx.provide` needed
- Deps come from `container.cradle` at the call site (route handler)
- `pipe` stays, `Fx.flatMap` / `Fx.tap` / `Fx.map` stay — only DI mechanism changes

### For complex handlers that need intermediate bindings — use `Fx.Do`

```ts
export function handleMessage(deps: Cradle, chatId: number, text: string) {
  const { db, bot } = deps
  return pipe(
    Fx.Do,
    Fx.bind('user', () => db.getUser(chatId)),
    Fx.flatMap(({ user }) =>
      // existing branching logic stays the same
    ),
  )
}
```

## Route Pattern (before → after)

### Before

```ts
app.post('/webhook', requireAppLayer, async (c) => {
  ...
  const exit = await Fx.runPromiseExit(
    pipe(
      validateSecret,
      Fx.flatMap(() => handleUpdate),
      Fx.provide(getAppLayer()),     // ← this goes away
    ),
  )
  ...
})
```

### After

```ts
app.post('/webhook', requireContainer, async (c) => {
  const deps = getContainer().cradle
  ...
  const exit = await Fx.runPromiseExit(
    pipe(
      validateSecret,
      Fx.flatMap(() => handleUpdate(deps, chatId, text)),
    ),
  )
  ...
})
```

- `Fx.provide(getAppLayer())` removed from every route
- middleware `requireAppLayer` → `requireContainer` (calls `ensureContainer()`)

## Service Files (before → after)

### `src/backend/bot/services.ts`

Remove: `Context.GenericTag`, `Layer.succeed`, `makeBotLayer`
Keep: `BotService` interface, `makeBotService(bot: Bot): BotService`

### `src/backend/db/services.ts`

Remove: `Context.GenericTag`, `Layer.succeed`, `makeDbLayer`
Keep: `DbService` interface, `makeDbService(db: Db): DbService`

## Test Setup (before → after)

### Before

```ts
const { layer: botLayer } = createMockBotLayer()
setAppLayer(Layer.merge(makeDbLayer(db), botLayer))
```

### After

```ts
import { createContainer } from '../../src/backend/container.js'

const mockBot = createMockBot()
const container = createContainer({ mongoDb: db, logger: mockLogger })
// or override bot:
setContainer(createContainer({ mongoDb: db, grammy: mockGrammyBot, logger: mockLogger }))
```

`mock-bot.ts` returns a plain `BotService` object instead of a `Layer`:

```ts
export function createMockBot(): { service: BotService; sent: SentMessage[] } {
  const sent: SentMessage[] = []
  return {
    service: {
      sendMessage: (chatId, text) => Fx.sync(() => { sent.push({ chatId, text }) }),
    },
    sent,
  }
}
```

## Effect Imports Cleanup

These imports get removed across the codebase:
- `Context` from `effect`
- `Layer` from `effect` (except test files if still needed elsewhere)
- `Layer.succeed`, `Layer.merge`, `Context.GenericTag`

Kept from `effect`:
- `Effect as Fx`, `pipe`, `Exit`, `Cause`, `Data` — all still used for control flow and error typing

## Migration Order

1. Add `awilix` dependency
2. Create `src/backend/logger.ts`
3. Create `src/backend/container.ts`
4. Strip `Context.GenericTag` / `Layer` from `bot/services.ts` and `db/services.ts`
5. Update handlers (`start.ts`, `message.ts`, `cron.ts`) — add `deps` param, remove `Fx.all({ db: DbService, ... })`
6. Update `api/app.ts` — replace `Fx.provide(getAppLayer())` with `getContainer().cradle`
7. Delete `api/context.ts`
8. Update test helpers (`mock-bot.ts`)
9. Update integration tests and cucumber hooks to use `createContainer` / `setContainer`
10. Run lint + typecheck
