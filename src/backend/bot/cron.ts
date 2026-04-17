import { Effect as Fx, pipe } from 'effect';
import { DbService } from '../db/services.js';
import { quotes } from './quotes.js';
import { BotService } from './services.js';

function pickQuote(): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}

function greetingPrefix(hour: number): string {
  return hour < 12 ? 'Good morning' : 'Good evening';
}

export function runCron(overrideHour?: number) {
  const hour = overrideHour ?? new Date().getUTCHours();
  const prefix = greetingPrefix(hour);

  return pipe(
    Fx.all({ db: DbService, bot: BotService }),
    Fx.flatMap(({ db, bot }) =>
      Fx.map(db.getAllReadyUsers(), (users) => ({ db, bot, users })),
    ),
    Fx.flatMap(({ db, bot, users }) =>
      Fx.all(
        users.map((user) => {
          const text = `${prefix}, ${user.name}!\n${pickQuote()}`;
          return pipe(
            bot.sendMessage(user.chatId, text),
            Fx.tap(() =>
              db.saveMessage({
                chatId: user.chatId,
                direction: 'bot',
                text,
                sentAt: new Date(),
              }),
            ),
          );
        }),
        { concurrency: 'unbounded' },
      ),
    ),
  );
}
