import { Effect } from "effect";
import { DbService } from "../db/services.js";
import { BotService } from "./services.js";
import { quotes } from "./quotes.js";

function pickQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function greetingPrefix(hour: number): string {
  return hour < 12 ? "Good morning" : "Good evening";
}

export function runCron(overrideHour?: number) {
  const hour = overrideHour ?? new Date().getUTCHours();
  const prefix = greetingPrefix(hour);

  return Effect.flatMap(DbService, (db) =>
    Effect.flatMap(BotService, (bot) =>
      db.getAllReadyUsers().pipe(
        Effect.flatMap((users) =>
          Effect.all(
            users.map((user) => {
              const text = `${prefix}, ${user.name}!\n${pickQuote()}`;
              return bot.sendMessage(user.chatId, text).pipe(
                Effect.tap(() =>
                  db.saveMessage({
                    chatId: user.chatId,
                    direction: "bot",
                    text,
                    sentAt: new Date(),
                  }),
                ),
              );
            }),
            { concurrency: "unbounded" },
          ),
        ),
      ),
    ),
  );
}
