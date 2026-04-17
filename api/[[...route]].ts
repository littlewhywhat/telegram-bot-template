import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/backend/api/app.js';
import { createVercelHonoHandler } from './vercelHonoHandler.js';

const delegate = createVercelHonoHandler(app);

export default function handler(req: VercelRequest, res: VercelResponse) {
  return delegate(req, res);
}
