import { strict as assert } from 'node:assert';
import { Then, When } from '@cucumber/cucumber';
import app from '../../../src/backend/api/app.js';
import type { BotWorld } from '../world.js';

When(
  'the user sends {string} from chatId {int}',
  async function (this: BotWorld, text: string, chatId: number) {
    const update = {
      update_id: 1,
      message: {
        message_id: 1,
        chat: { id: chatId, type: 'private' },
        from: { id: chatId, is_bot: false, first_name: 'Test' },
        date: Math.floor(Date.now() / 1000),
        text,
      },
    };

    await app.request('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token':
          process.env.WEBHOOK_SECRET || 'test-secret',
      },
      body: JSON.stringify(update),
    });
  },
);

When('the cron job runs', async function (this: BotWorld) {
  const url =
    this.mockedHour !== null
      ? `/api/cron?hour=${this.mockedHour}`
      : '/api/cron';
  await app.request(url);
});

Then(
  'the bot replies {string} to chatId {int}',
  async function (this: BotWorld, expected: string, chatId: number) {
    const match = this.sent.find(
      (m) => m.chatId === chatId && m.text === expected,
    );
    assert.ok(match, `Expected bot to reply "${expected}" to chatId ${chatId}`);
  },
);

Then(
  'the bot sends a message starting with {string} to chatId {int}',
  async function (this: BotWorld, prefix: string, chatId: number) {
    const match = this.sent.find(
      (m) => m.chatId === chatId && m.text.startsWith(prefix),
    );
    assert.ok(
      match,
      `Expected bot message starting with "${prefix}" to chatId ${chatId}`,
    );
  },
);

Then(
  'the bot does not send a message to chatId {int}',
  async function (this: BotWorld, chatId: number) {
    const match = this.sent.find((m) => m.chatId === chatId);
    assert.ok(!match, `Expected no message to chatId ${chatId}`);
  },
);

Then(
  'each sent message contains a quote from the quotes list',
  async function (this: BotWorld) {
    assert.ok(this.sent.length > 0, 'Expected at least one sent message');
    for (const msg of this.sent) {
      assert.ok(
        msg.text.includes('\n'),
        'Expected message to contain a quote after greeting',
      );
    }
  },
);
