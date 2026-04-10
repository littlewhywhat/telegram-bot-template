import { Hono } from "hono";
import { Effect } from "effect";
import { getAppLayer } from "./context.js";
import { handleStart } from "../bot/handlers/start.js";
import { handleMessage } from "../bot/handlers/message.js";
import { runCron } from "../bot/cron.js";

const app = new Hono().basePath("/api");

app.get("/health", (c) =>
  c.json({ status: "ok", time: new Date().toISOString() }),
);

app.post("/webhook", async (c) => {
  const secret = c.req.header("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const message = body.message;
  if (!message) return c.json({ ok: true });

  const chatId: number = message.chat.id;
  const text: string = message.text ?? "";

  const effect =
    text === "/start" ? handleStart(chatId) : handleMessage(chatId, text);

  await Effect.runPromise(effect.pipe(Effect.provide(getAppLayer())));

  return c.json({ ok: true });
});

app.get("/cron", async (c) => {
  const hour = c.req.query("hour");
  const overrideHour = hour !== undefined ? Number(hour) : undefined;
  await Effect.runPromise(
    runCron(overrideHour).pipe(Effect.provide(getAppLayer())),
  );
  return c.json({ ok: true });
});

export default app;
