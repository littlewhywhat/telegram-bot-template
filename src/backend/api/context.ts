import { Effect as Fx, Layer, ManagedRuntime } from 'effect';
import { createBot } from '../bot/index.js';
import { BotService, makeBotService } from '../bot/services.js';
import { getDb } from '../db/client.js';
import { DbService, makeDbService } from '../db/services.js';

export const REQUIRED_ENV = [
  'BOT_TOKEN',
  'WEBHOOK_SECRET',
  'MONGODB_URI',
] as const;

const AppLayer = Layer.merge(
  Layer.effect(
    DbService,
    Fx.sync(() => makeDbService(getDb())),
  ),
  Layer.effect(
    BotService,
    Fx.sync(() => makeBotService(createBot(process.env.BOT_TOKEN as string))),
  ),
);

export type AppRuntime = ManagedRuntime.ManagedRuntime<
  DbService | BotService,
  never
>;

export const appRuntime = ManagedRuntime.make(AppLayer);
