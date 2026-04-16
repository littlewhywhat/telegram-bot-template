import path from 'node:path';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../src/backend/api/app.js';
import { createMockBotService } from '../helpers/mock-bot.js';
import { createTestRuntime } from '../helpers/test-runtime.js';

const PORT = 5173;
const DIST_DIR = path.resolve(process.cwd(), 'dist');

export default async function globalSetup() {
  process.env.BOT_TOKEN = 'test-bot-token';
  process.env.WEBHOOK_SECRET = 'test-secret';

  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  const client = await MongoClient.connect(uri);
  const db = client.db();

  const { service: bot, sent } = createMockBotService();
  const runtime = createTestRuntime(db, bot);
  const apiApp = createApp(runtime);

  const root = new Hono();
  root.route('/', apiApp);
  root.use(
    '/*',
    serveStatic({
      root: path.relative(process.cwd(), DIST_DIR) || '.',
    }),
  );
  root.notFound(async (c) => {
    const fs = await import('node:fs/promises');
    const html = await fs.readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
    return c.html(html);
  });

  const server = serve({
    fetch: root.fetch,
    port: PORT,
    hostname: '127.0.0.1',
  });

  process.env.TEST_MONGO_URI = uri;

  const state = globalThis as unknown as {
    __e2e__?: {
      server: ReturnType<typeof serve>;
      client: MongoClient;
      mongod: MongoMemoryServer;
      runtime: ReturnType<typeof createTestRuntime>;
      sent: typeof sent;
    };
  };
  state.__e2e__ = { server, client, mongod, runtime, sent };
}
