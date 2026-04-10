import { After, Before } from '@cucumber/cucumber';
import { Effect, Layer } from 'effect';
import { setAppLayer } from '../../api/context.js';
import { BotService } from '../../bot/services.js';
import { makeDbLayer } from '../../db/services.js';
import type { BotWorld } from './world.js';

Before(async function (this: BotWorld) {
  await this.startDb();
  this.sent = [];
  this.mockedHour = null;

  process.env.WEBHOOK_SECRET = 'test-secret';

  const dbLayer = makeDbLayer(this.db);
  const botLayer = Layer.succeed(BotService, {
    sendMessage: (chatId: number, text: string) =>
      Effect.sync(() => {
        this.sent.push({ chatId, text });
      }),
  });
  setAppLayer(Layer.merge(dbLayer, botLayer));
});

After(async function (this: BotWorld) {
  await this.stopDb();
});
