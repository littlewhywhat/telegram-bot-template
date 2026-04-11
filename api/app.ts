import { Cause, Exit, Effect as Fx, pipe } from 'effect';
import { Hono } from 'hono';
import { runCron } from '../bot/cron.js';
import { handleMessage } from '../bot/handlers/message.js';
import { handleStart } from '../bot/handlers/start.js';
import { getAppLayer } from './context.js';

function logError(context: string, exit: Exit.Exit<unknown, unknown>) {
  if (Exit.isFailure(exit)) {
    console.error(`[${context}]`, Cause.squash(exit.cause));
  }
}

const app = new Hono().basePath('/api');

app.get('/health', (c) => {
  const envKeys = ['BOT_TOKEN', 'WEBHOOK_SECRET', 'MONGODB_URI'] as const;
  const env: Record<string, string> = {};
  for (const key of envKeys) {
    env[key] = process.env[key] ? 'set' : 'MISSING';
  }

  let layer = 'not_configured';
  try {
    getAppLayer();
    layer = 'ok';
  } catch {
    layer = 'not_configured';
  }

  const healthy =
    Object.values(env).every((v) => v === 'set') && layer === 'ok';

  return c.json(
    {
      status: healthy ? 'ok' : 'degraded',
      time: new Date().toISOString(),
      env,
      layer,
    },
    healthy ? 200 : 503,
  );
});

app.post('/webhook', async (c) => {
  const secret = c.req.header('X-Telegram-Bot-Api-Secret-Token');
  if (secret !== process.env.WEBHOOK_SECRET) {
    console.warn('[webhook] unauthorized request');
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json();
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

app.get('/cron', async (c) => {
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
