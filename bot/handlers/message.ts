import { Effect as Fx, pipe } from "effect";
import { DbService } from "../../db/services.js";
import { BotService } from "../services.js";

const PROMPT = "Please tell me your name.";

export function handleMessage(chatId: number, text: string) {
  const trimmed = text.trim();
  const hasName = () => trimmed.length > 0;

  return pipe(
    Fx.all({ db: DbService, bot: BotService }),
    Fx.flatMap(({ db, bot }) =>
      pipe(
        db.getUser(chatId),
        Fx.flatMap((user) =>
          Fx.when(Fx.succeed({ db, bot }), () =>
            !!user && user.state === "awaiting_name",
          ),
        ),
      ),
    ),
    Fx.flatten,
    Fx.tap(({ db }) =>
      Fx.when(
        db.saveMessage({ chatId, direction: "user", text, sentAt: new Date() }),
        hasName,
      ),
    ),
    Fx.tap(({ db }) =>
      Fx.when(db.upsertUser(chatId, { name: trimmed, state: "ready" }), hasName),
    ),
    Fx.flatMap(({ db, bot }) =>
      Fx.if(hasName(), {
        onTrue: () => Fx.succeed(`Nice to meet you, ${trimmed}!`),
        onFalse: () => Fx.succeed(PROMPT),
      }).pipe(
        Fx.flatMap((reply) =>
          pipe(
            bot.sendMessage(chatId, reply),
            Fx.tap(() =>
              db.saveMessage({ chatId, direction: "bot", text: reply, sentAt: new Date() }),
            ),
          ),
        ),
      ),
    ),
  );
}
