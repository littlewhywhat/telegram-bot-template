import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Layer } from 'effect';
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

export const config = { maxDuration: 10 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url ?? '/', `https://${req.headers.host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value)
      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
  }

  const init: RequestInit = { method: req.method, headers };
  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    init.body = JSON.stringify(req.body);
  }

  const response = await Promise.race([
    app.fetch(new Request(url.toString(), init)),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Handler timeout (10s)')), 9000),
    ),
  ]);

  res.status(response.status);
  response.headers.forEach((v, k) => {
    res.setHeader(k, v);
  });
  res.end(await response.text());
}
