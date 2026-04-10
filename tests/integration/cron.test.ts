import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { startDb, stopDb, cleanDb, getDb } from "../helpers/setup.js";
import app from "../../api/app.js";

describe("GET /api/cron", () => {
  beforeAll(async () => {
    await startDb();
  });

  afterAll(async () => {
    await stopDb();
  });

  beforeEach(async () => {
    await cleanDb();
  });

  it("sends messages to ready users only", async () => {
    const db = getDb();
    await db.collection("users").insertMany([
      { chatId: 100, name: "Alice", state: "ready", createdAt: new Date() },
      { chatId: 200, name: "Bob", state: "ready", createdAt: new Date() },
      {
        chatId: 300,
        name: null,
        state: "awaiting_name",
        createdAt: new Date(),
      },
    ]);

    const res = await app.request("/api/cron");
    expect(res.status).toBe(200);

    const messages = await db
      .collection("messages")
      .find({ direction: "bot" })
      .toArray();
    expect(messages).toHaveLength(2);

    const chatIds = messages.map((m) => m.chatId).sort();
    expect(chatIds).toEqual([100, 200]);
  });

  it("does not send messages when no ready users exist", async () => {
    const res = await app.request("/api/cron");
    expect(res.status).toBe(200);

    const db = getDb();
    const messages = await db
      .collection("messages")
      .find({ direction: "bot" })
      .toArray();
    expect(messages).toHaveLength(0);
  });
});
