import { Layer } from 'effect';
import { handle } from 'hono/vercel';
import { createBot } from '../bot/index.js';
import { makeBotLayer } from '../bot/services.js';
import { getDb } from '../db/client.js';
import { makeDbLayer } from '../db/services.js';
import app from './app.js';
import { setAppLayer } from './context.js';

const requiredEnv = ['BOT_TOKEN', 'WEBHOOK_SECRET', 'MONGODB_URI'] as const;
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`[init] Missing env vars: ${missing.join(', ')}`);
} else {
  const db = getDb();
  const bot = createBot(process.env.BOT_TOKEN as string);
  setAppLayer(Layer.merge(makeDbLayer(db), makeBotLayer(bot)));
  console.log('[init] App layer configured');
}

export default handle(app);
