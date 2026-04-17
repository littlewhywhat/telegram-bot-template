import { After, Before } from '@cucumber/cucumber';
import { Effect as Fx, Layer, ManagedRuntime } from 'effect';
import { createApp } from '../../src/backend/api/app.js';
import { BotService } from '../../src/backend/bot/services.js';
import { DbService, makeDbService } from '../../src/backend/db/services.js';
import type { BotWorld } from './world.js';

Before(async function (this: BotWorld) {
  await this.startDb();
  this.sent = [];
  this.mockedHour = null;

  process.env.WEBHOOK_SECRET = 'test-secret';

  const botService: BotService = {
    sendMessage: (chatId: number, text: string) =>
      Fx.sync(() => {
        this.sent.push({ chatId, text });
      }),
  };

  const layer = Layer.merge(
    Layer.succeed(DbService, makeDbService(this.db)),
    Layer.succeed(BotService, botService),
  );

  this.app = createApp(ManagedRuntime.make(layer));
});

After(async function (this: BotWorld) {
  await this.stopDb();
});
