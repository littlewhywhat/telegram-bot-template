import { Layer } from 'effect';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../../src/backend/api/app.js';
import { setAppLayer } from '../../src/backend/api/context.js';
import { makeDbLayer } from '../../src/backend/db/services.js';
import { createMockBotLayer } from '../helpers/mock-bot.js';
import { cleanDb, getDb, startDb, stopDb } from '../helpers/setup.js';

describe('GET /api/cron', () => {
  beforeAll(async () => {
    const db = await startDb();
    const { layer: botLayer } = createMockBotLayer();
    setAppLayer(Layer.merge(makeDbLayer(db), botLayer));
  });

  afterAll(async () => {
    await stopDb();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  it('sends messages to ready users only', async () => {
    const db = getDb();
    await db.collection('users').insertMany([
      { chatId: 100, name: 'Alice', state: 'ready', createdAt: new Date() },
      { chatId: 200, name: 'Bob', state: 'ready', createdAt: new Date() },
      {
        chatId: 300,
        name: null,
        state: 'awaiting_name',
        createdAt: new Date(),
      },
    ]);

    const res = await app.request('/api/cron');
    expect(res.status).toBe(200);

    const messages = await db
      .collection('messages')
      .find({ direction: 'bot' })
      .toArray();
    expect(messages).toHaveLength(2);

    const chatIds = messages.map((m) => m.chatId).sort();
    expect(chatIds).toEqual([100, 200]);
  });

  it('does not send messages when no ready users exist', async () => {
    const res = await app.request('/api/cron');
    expect(res.status).toBe(200);

    const db = getDb();
    const messages = await db
      .collection('messages')
      .find({ direction: 'bot' })
      .toArray();
    expect(messages).toHaveLength(0);
  });
});
