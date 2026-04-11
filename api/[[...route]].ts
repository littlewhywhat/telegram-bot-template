import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Layer } from 'effect';
import { createBot } from '../bot/index.js';
import { makeBotLayer } from '../bot/services.js';
import { getDb } from '../db/client.js';
import { makeDbLayer } from '../db/services.js';
import app from './app.js';
import { REQUIRED_ENV, setAppLayer } from './context.js';
import { createVercelHonoHandler } from './vercelHonoHandler.js';

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[init] Missing env vars: ${missing.join(', ')}`);
} else {
  const db = getDb();
  const bot = createBot(process.env.BOT_TOKEN as string);
  setAppLayer(Layer.merge(makeDbLayer(db), makeBotLayer(bot)));
  console.log('[init] App layer configured');
}

const delegate = createVercelHonoHandler(app, 9000);

export default function handler(req: VercelRequest, res: VercelResponse) {
  return delegate(req, res);
}
