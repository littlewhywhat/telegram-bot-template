import { Effect as Fx, pipe } from 'effect';
import { DbService } from '../../db/services.js';
import { BotService } from '../services.js';

const REPLY = 'What is your name?';

export function handleStart(chatId: number) {
  return pipe(
    Fx.all({ db: DbService, bot: BotService }),
    Fx.tap(({ db }) =>
      db.upsertUser(chatId, { state: 'awaiting_name', name: null }),
    ),
    Fx.tap(({ bot }) => bot.sendMessage(chatId, REPLY)),
    Fx.tap(({ db }) =>
      db.saveMessage({
        chatId,
        direction: 'bot',
        text: REPLY,
        sentAt: new Date(),
      }),
    ),
  );
}
