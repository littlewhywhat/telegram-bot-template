import { handle } from '@hono/node-server/vercel';
import { Layer } from 'effect';
import { createBot } from '../bot/index.js';
import { makeBotLayer } from '../bot/services.js';
import { getDb } from '../db/client.js';
import { makeDbLayer } from '../db/services.js';
import app from './app.js';
import { setAppLayer } from './context.js';

const db = getDb();
const bot = createBot(process.env.BOT_TOKEN ?? '');
setAppLayer(Layer.merge(makeDbLayer(db), makeBotLayer(bot)));

export default handle(app);
