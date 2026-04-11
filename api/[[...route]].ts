import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from './app.js';
import { ensureAppLayer } from './context.js';
import { createVercelHonoHandler } from './vercelHonoHandler.js';

const delegate = createVercelHonoHandler(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  ensureAppLayer();
  return delegate(req, res);
}
