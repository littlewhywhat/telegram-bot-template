import { Effect as Fx, pipe } from 'effect';
import { DbService } from '../../db/services.js';
import { BotService } from '../services.js';

const PROMPT = 'Please tell me your name.';

export function handleMessage(chatId: number, text: string) {
  const trimmed = text.trim();
  const hasName = () => trimmed.length > 0;

  return pipe(
    Fx.all({ db: DbService, bot: BotService }),
    Fx.flatMap(({ db, bot }) =>
      pipe(
        db.getUser(chatId),
        Fx.flatMap((user) => {
          if (!user || user.state !== 'awaiting_name') {
            return Fx.void;
          }

          return pipe(
            Fx.when(
              db.saveMessage({
                chatId,
                direction: 'user',
                text,
                sentAt: new Date(),
              }),
              hasName,
            ),
            Fx.tap(() =>
              Fx.when(
                db.upsertUser(chatId, { name: trimmed, state: 'ready' }),
                hasName,
              ),
            ),
            Fx.flatMap(() =>
              Fx.if(hasName(), {
                onTrue: () => Fx.succeed(`Nice to meet you, ${trimmed}!`),
                onFalse: () => Fx.succeed(PROMPT),
              }),
            ),
            Fx.flatMap((reply) =>
              pipe(
                bot.sendMessage(chatId, reply),
                Fx.tap(() =>
                  db.saveMessage({
                    chatId,
                    direction: 'bot',
                    text: reply,
                    sentAt: new Date(),
                  }),
                ),
              ),
            ),
          );
        }),
      ),
    ),
  );
}
