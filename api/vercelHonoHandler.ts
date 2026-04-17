import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Hono } from 'hono';

// Hono Vercel adapters don't work for POST on Vercel's Node.js runtime.

export function createVercelHonoHandler(
  app: Hono,
): (req: VercelRequest, res: VercelResponse) => Promise<void> {
  return async (req: VercelRequest, res: VercelResponse) => {
    const url = new URL(req.url ?? '/', `https://${req.headers.host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value)
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }

    const init: RequestInit = { method: req.method, headers };
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      init.body = JSON.stringify(req.body);
    }

    try {
      const response = await app.fetch(new Request(url.toString(), init));
      res.status(response.status);
      response.headers.forEach((v, k) => {
        res.setHeader(k, v);
      });
      res.end(await response.text());
    } catch (err) {
      console.error('[handler]', err);
      res.status(500);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
  };
}
