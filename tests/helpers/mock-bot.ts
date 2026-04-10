import { Layer, Effect } from "effect";
import { BotService } from "../../bot/services.js";

export interface SentMessage {
  chatId: number;
  text: string;
}

export function createMockBotLayer(): {
  layer: Layer.Layer<BotService>;
  sent: SentMessage[];
} {
  const sent: SentMessage[] = [];

  const layer = Layer.succeed(BotService, {
    sendMessage: (chatId: number, text: string) =>
      Effect.sync(() => {
        sent.push({ chatId, text });
      }),
  });

  return { layer, sent };
}
