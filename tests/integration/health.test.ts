import { Layer } from 'effect';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import app from '../../api/app.js';
import { setAppLayer } from '../../api/context.js';
import { makeDbLayer } from '../../db/services.js';
import { createMockBotLayer } from '../helpers/mock-bot.js';
import { getDb, getUri, startDb, stopDb } from '../helpers/setup.js';

describe('GET /api/health', () => {
  beforeAll(async () => {
    await startDb();
    process.env.MONGODB_URI = getUri();
    process.env.BOT_TOKEN = 'test-token';
    process.env.WEBHOOK_SECRET = 'test-secret';
    const { layer: botLayer } = createMockBotLayer();
    setAppLayer(Layer.merge(makeDbLayer(getDb()), botLayer));
  });

  afterAll(async () => {
    delete process.env.MONGODB_URI;
    delete process.env.BOT_TOKEN;
    delete process.env.WEBHOOK_SECRET;
    await stopDb();
  });

  it('returns 200 with status ok when configured', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.time).toBeDefined();
    expect(body.env.BOT_TOKEN).toBe('set');
    expect(body.env.WEBHOOK_SECRET).toBe('set');
    expect(body.env.MONGODB_URI).toBe('set');
    expect(body.layer).toBe('ok');
    expect(body.db).toBe('ok');
  });

  it('returns 503 when env vars are missing', async () => {
    const saved = process.env.BOT_TOKEN;
    delete process.env.BOT_TOKEN;

    const res = await app.request('/api/health');
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe('degraded');
    expect(body.env.BOT_TOKEN).toBe('MISSING');

    process.env.BOT_TOKEN = saved;
  });
});
