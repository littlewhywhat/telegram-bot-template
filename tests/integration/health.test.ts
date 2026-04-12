import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/backend/api/app.js';
import { createMockBotService } from '../helpers/mock-bot.js';
import { getDb, getUri, startDb, stopDb } from '../helpers/setup.js';
import { createTestRuntime } from '../helpers/test-runtime.js';

describe('GET /api/health', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await startDb();
    process.env.MONGODB_URI = getUri();
    process.env.BOT_TOKEN = 'test-token';
    process.env.WEBHOOK_SECRET = 'test-secret';
    const { service } = createMockBotService();
    const runtime = createTestRuntime(getDb(), service);
    app = createApp(runtime);
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
  });

  it('returns 503 when env vars are missing', async () => {
    const saved = process.env.BOT_TOKEN;
    delete process.env.BOT_TOKEN;

    const res = await app.request('/api/health');
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe('degraded');
    expect(body.error).toContain('BOT_TOKEN');

    process.env.BOT_TOKEN = saved;
  });
});
