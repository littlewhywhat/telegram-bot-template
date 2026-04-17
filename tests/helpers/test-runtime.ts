import { Layer, ManagedRuntime } from 'effect';
import type { Db } from 'mongodb';
import {
  BotService,
  type BotService as BotServiceType,
} from '../../src/backend/bot/services.js';
import { DbService, makeDbService } from '../../src/backend/db/services.js';

export function createTestRuntime(db: Db, bot: BotServiceType) {
  const layer = Layer.merge(
    Layer.succeed(DbService, makeDbService(db)),
    Layer.succeed(BotService, bot),
  );
  return ManagedRuntime.make(layer);
}
