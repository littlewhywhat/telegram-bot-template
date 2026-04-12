import { Effect as Fx } from 'effect';
import type { BotService } from '../../src/backend/bot/services.js';

export interface SentMessage {
  chatId: number;
  text: string;
}

export function createMockBotService(): {
  service: BotService;
  sent: SentMessage[];
} {
  const sent: SentMessage[] = [];

  const service: BotService = {
    sendMessage: (chatId: number, text: string) =>
      Fx.sync(() => {
        sent.push({ chatId, text });
      }),
  };

  return { service, sent };
}
