import { Layer } from 'effect';
import { createBot } from '../bot/index.js';
import type { BotService } from '../bot/services.js';
import { makeBotLayer } from '../bot/services.js';
import { getDb } from '../db/client.js';
import type { DbService } from '../db/services.js';
import { makeDbLayer } from '../db/services.js';

export const REQUIRED_ENV = [
  'BOT_TOKEN',
  'WEBHOOK_SECRET',
  'MONGODB_URI',
] as const;

let appLayer: Layer.Layer<DbService | BotService> | null = null;

export function ensureAppLayer(): void {
  if (appLayer !== null) return;
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) return;
  const db = getDb();
  const bot = createBot(process.env.BOT_TOKEN as string);
  setAppLayer(Layer.merge(makeDbLayer(db), makeBotLayer(bot)));
}

export function setAppLayer(layer: Layer.Layer<DbService | BotService>): void {
  appLayer = layer;
}

export function getAppLayer(): Layer.Layer<DbService | BotService> {
  if (!appLayer)
    throw new Error('App layer not configured. Call setAppLayer() first.');
  return appLayer;
}
