import { Cause, Exit, Effect as Fx, pipe } from 'effect';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { runCron } from '../bot/cron.js';
import { handleMessage } from '../bot/handlers/message.js';
import { handleStart } from '../bot/handlers/start.js';
import { DbService } from '../db/services.js';
import { ensureAppLayer, getAppLayer, REQUIRED_ENV } from './context.js';

function logError(context: string, exit: Exit.Exit<unknown, unknown>) {
  if (Exit.isFailure(exit)) {
    console.error(`[${context}]`, Cause.squash(exit.cause));
  }
}

const requireAppLayer: MiddlewareHandler = async (c, next) => {
  const ready = ensureAppLayer();
  if (!ready) return c.json({ error: 'Internal Server Error' }, 500);
  await next();
};

const app = new Hono().basePath('/api');

app.get('/health', async (c) => {
  const env: Record<string, string> = {};
  for (const key of REQUIRED_ENV) {
    env[key] = process.env[key] ? 'set' : 'MISSING';
  }

  let layer = 'not_configured';
  try {
    getAppLayer();
    layer = 'ok';
  } catch {
    layer = 'not_configured';
  }

  let dbHost = '';
  if (process.env.MONGODB_URI) {
    try {
      const parsed = new URL(process.env.MONGODB_URI);
      dbHost = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      dbHost = 'invalid_uri';
    }
  }

  let db = 'skipped';
  if (Object.values(env).every((v) => v === 'set') && layer === 'ok') {
    const exit = await Fx.runPromiseExit(
      pipe(
        Fx.all({ db: DbService }),
        Fx.flatMap(({ db: svc }) => svc.ping()),
        Fx.timeout('5 seconds'),
        Fx.provide(getAppLayer()),
      ),
    );
    if (Exit.isSuccess(exit)) {
      db = 'ok';
    } else {
      db = `error: ${String(Cause.squash(exit.cause))}`;
    }
  }

  const healthy =
    Object.values(env).every((v) => v === 'set') &&
    layer === 'ok' &&
    db === 'ok';

  return c.json(
    {
      status: healthy ? 'ok' : 'degraded',
      time: new Date().toISOString(),
      env,
      layer,
      db,
      dbHost,
    },
    healthy ? 200 : 503,
  );
});

app.post('/webhook', requireAppLayer, async (c) => {
  console.log('[webhook] handler entered');
  const secret = c.req.header('X-Telegram-Bot-Api-Secret-Token');
  console.log('[webhook] secret check done');
  if (secret !== process.env.WEBHOOK_SECRET) {
    console.warn('[webhook] unauthorized request');
    return c.json({ error: 'Unauthorized' }, 401);
  }

  console.log('[webhook] parsing body...');
  const body = await c.req.json();
  console.log('[webhook] body parsed');
  const message = body.message;
  if (!message) return c.json({ ok: true });

  const chatId: number = message.chat.id;
  const text: string = message.text ?? '';

  console.log(`[webhook] chatId=${chatId} text=${JSON.stringify(text)}`);

  const program =
    text === '/start' ? handleStart(chatId) : handleMessage(chatId, text);

  const exit = await Fx.runPromiseExit(
    pipe(program, Fx.provide(getAppLayer())),
  );
  logError(`webhook chatId=${chatId}`, exit);

  if (Exit.isFailure(exit)) {
    return c.json({ ok: false, error: 'Internal error' }, 500);
  }

  return c.json({ ok: true });
});

app.get('/cron', requireAppLayer, async (c) => {
  const hour = c.req.query('hour');
  const overrideHour = hour !== undefined ? Number(hour) : undefined;

  console.log(`[cron] hour=${overrideHour ?? 'auto'}`);

  const exit = await Fx.runPromiseExit(
    pipe(runCron(overrideHour), Fx.provide(getAppLayer())),
  );
  logError('cron', exit);

  if (Exit.isFailure(exit)) {
    return c.json({ ok: false, error: 'Cron failed' }, 500);
  }

  return c.json({ ok: true });
});

export default app;
