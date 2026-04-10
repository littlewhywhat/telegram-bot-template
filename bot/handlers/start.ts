import { Effect } from "effect";
import { DbService } from "../../db/services.js";
import { BotService } from "../services.js";

const REPLY = "What is your name?";

export function handleStart(chatId: number) {
  return Effect.flatMap(DbService, (db) =>
    Effect.flatMap(BotService, (bot) =>
      db.upsertUser(chatId, { state: "awaiting_name", name: null }).pipe(
        Effect.tap(() => bot.sendMessage(chatId, REPLY)),
        Effect.tap(() =>
          db.saveMessage({
            chatId,
            direction: "bot",
            text: REPLY,
            sentAt: new Date(),
          }),
        ),
      ),
    ),
  );
}
