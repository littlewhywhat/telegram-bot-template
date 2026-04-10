import { Effect } from "effect";
import { DbService } from "../../db/services.js";
import { BotService } from "../services.js";

const PROMPT = "Please tell me your name.";

export function handleMessage(chatId: number, text: string) {
  return Effect.flatMap(DbService, (db) =>
    Effect.flatMap(BotService, (bot) =>
      db.getUser(chatId).pipe(
        Effect.flatMap((user) => {
          if (!user || user.state !== "awaiting_name") {
            return Effect.void;
          }

          const trimmed = text.trim();
          if (!trimmed) {
            return bot.sendMessage(chatId, PROMPT).pipe(
              Effect.tap(() =>
                db.saveMessage({
                  chatId,
                  direction: "bot",
                  text: PROMPT,
                  sentAt: new Date(),
                }),
              ),
            );
          }

          const reply = `Nice to meet you, ${trimmed}!`;
          return db
            .upsertUser(chatId, { name: trimmed, state: "ready" })
            .pipe(
              Effect.tap(() =>
                db.saveMessage({
                  chatId,
                  direction: "user",
                  text,
                  sentAt: new Date(),
                }),
              ),
              Effect.tap(() => bot.sendMessage(chatId, reply)),
              Effect.tap(() =>
                db.saveMessage({
                  chatId,
                  direction: "bot",
                  text: reply,
                  sentAt: new Date(),
                }),
              ),
            );
        }),
      ),
    ),
  );
}
