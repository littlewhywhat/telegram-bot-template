import { Layer } from 'effect';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../../api/app.js';
import { setAppLayer } from '../../api/context.js';
import { makeDbLayer } from '../../db/services.js';
import { createMockBotLayer } from '../helpers/mock-bot.js';
import { cleanDb, getDb, startDb, stopDb } from '../helpers/setup.js';

function telegramUpdate(chatId: number, text: string) {
  return {
    update_id: 1,
    message: {
      message_id: 1,
      chat: { id: chatId, type: 'private' as const },
      from: { id: chatId, is_bot: false, first_name: 'Test' },
      date: Math.floor(Date.now() / 1000),
      text,
    },
  };
}

describe('POST /api/webhook', () => {
  beforeAll(async () => {
    const db = await startDb();
    const { layer: botLayer } = createMockBotLayer();
    setAppLayer(Layer.merge(makeDbLayer(db), botLayer));
    process.env.WEBHOOK_SECRET = 'test-secret';
  });

  afterAll(async () => {
    await stopDb();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  it('creates user and replies on /start', async () => {
    const res = await app.request('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test-secret',
      },
      body: JSON.stringify(telegramUpdate(123, '/start')),
    });

    expect(res.status).toBe(200);

    const db = getDb();
    const user = await db.collection('users').findOne({ chatId: 123 });
    expect(user).not.toBeNull();
    expect(user?.state).toBe('awaiting_name');

    const messages = await db
      .collection('messages')
      .find({ chatId: 123, direction: 'bot' })
      .toArray();
    expect(messages.length).toBeGreaterThanOrEqual(1);
    expect(messages[0].text).toBe('What is your name?');
  });

  it('stores name and transitions to ready state', async () => {
    const db = getDb();
    await db.collection('users').insertOne({
      chatId: 789,
      name: null,
      state: 'awaiting_name',
      createdAt: new Date(),
    });

    const res = await app.request('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'test-secret',
      },
      body: JSON.stringify(telegramUpdate(789, 'Alice')),
    });

    expect(res.status).toBe(200);

    const user = await db.collection('users').findOne({ chatId: 789 });
    expect(user?.name).toBe('Alice');
    expect(user?.state).toBe('ready');
  });

  it('rejects requests without valid secret', async () => {
    const res = await app.request('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Bot-Api-Secret-Token': 'wrong-secret',
      },
      body: JSON.stringify(telegramUpdate(123, '/start')),
    });

    expect(res.status).toBe(401);
  });
});
