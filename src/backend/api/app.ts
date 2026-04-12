import { Cause, Exit, Effect as Fx, pipe } from 'effect';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { runCron } from '../bot/cron.js';
import { AuthError, BotError, ConfigError, DbError } from '../bot/errors.js';
import { handleMessage } from '../bot/handlers/message.js';
import { handleStart } from '../bot/handlers/start.js';
import { createBot } from '../bot/index.js';
import { getClient } from '../db/client.js';
import { DbService } from '../db/services.js';
import { ensureAppLayer, getAppLayer, REQUIRED_ENV } from './context.js';
import { validateInitData } from './validate-init-data.js';

const requireAppLayer: MiddlewareHandler = async (c, next) => {
  const ready = ensureAppLayer();
  if (!ready) return c.json({ error: 'Internal Server Error' }, 500);
  await next();
};

const app = new Hono().basePath('/api');

app.get('/health', async (c) => {
  const checkEnv = Fx.suspend(() => {
    const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
    return missing.length > 0
      ? Fx.fail(
          new ConfigError({
            message: `missing env: ${missing.join(', ')}`,
          }),
        )
      : Fx.void;
  });

  const checkDb = Fx.tryPromise({
    try: () => getClient().db().command({ ping: 1 }),
    catch: (cause) => new DbError({ cause }),
  });

  const checkBot = Fx.try({
    try: () => createBot(process.env.BOT_TOKEN ?? ''),
    catch: (cause) => new BotError({ cause }),
  });

  const exit = await Fx.runPromiseExit(
    pipe(
      checkEnv,
      Fx.flatMap(() => checkDb),
      Fx.flatMap(() => checkBot),
      Fx.timeout('5 seconds'),
    ),
  );

  if (Exit.isSuccess(exit)) {
    ensureAppLayer();
    return c.json({ status: 'ok', time: new Date().toISOString() });
  }

  return c.json(
    {
      status: 'degraded',
      time: new Date().toISOString(),
      error: String(Cause.squash(exit.cause)),
    },
    503,
  );
});

app.post('/webhook', requireAppLayer, async (c) => {
  const validateSecret = Fx.suspend(() =>
    c.req.header('X-Telegram-Bot-Api-Secret-Token') !==
    process.env.WEBHOOK_SECRET
      ? Fx.fail(new AuthError({ message: 'unauthorized' }))
      : Fx.void,
  );

  const handleUpdate = pipe(
    Fx.promise(() => c.req.json()),
    Fx.flatMap((body) => {
      const message = body.message;
      if (!message) return Fx.void;
      const chatId: number = message.chat.id;
      const text: string = message.text ?? '';
      return text === '/start'
        ? handleStart(chatId)
        : handleMessage(chatId, text);
    }),
  );

  const exit = await Fx.runPromiseExit(
    pipe(
      validateSecret,
      Fx.flatMap(() => handleUpdate),
      Fx.provide(getAppLayer()),
    ),
  );

  if (Exit.isSuccess(exit)) return c.json({ ok: true });

  const error = Cause.squash(exit.cause);
  if (error instanceof AuthError) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  console.error('[webhook]', error);
  return c.json({ ok: false, error: 'Internal error' }, 500);
});

app.get('/cron', requireAppLayer, async (c) => {
  const hour = c.req.query('hour');
  const overrideHour = hour !== undefined ? Number(hour) : undefined;

  const exit = await Fx.runPromiseExit(
    pipe(runCron(overrideHour), Fx.provide(getAppLayer())),
  );

  if (Exit.isSuccess(exit)) return c.json({ ok: true });

  console.error('[cron]', Cause.squash(exit.cause));
  return c.json({ ok: false, error: 'Cron failed' }, 500);
});

app.post('/miniapp/me', requireAppLayer, async (c) => {
  const body = await c.req.json<{ initData: string }>();
  const tgUser = validateInitData(
    body.initData,
    process.env.BOT_TOKEN as string,
  );
  if (!tgUser) return c.json({ error: 'Unauthorized' }, 401);

  const program = pipe(
    DbService,
    Fx.flatMap((db) => db.getUser(tgUser.id)),
    Fx.map((user) => ({ name: user?.name ?? null })),
  );

  const exit = await Fx.runPromiseExit(
    pipe(program, Fx.provide(getAppLayer())),
  );

  if (Exit.isSuccess(exit)) return c.json(exit.value);

  console.error('[miniapp/me]', Cause.squash(exit.cause));
  return c.json({ ok: false, error: 'Internal error' }, 500);
});

export default app;
