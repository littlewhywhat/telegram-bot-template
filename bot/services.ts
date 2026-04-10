import { Context, Effect, Layer } from "effect";
import type { Bot } from "grammy";
import { BotError } from "./errors.js";

export interface BotService {
  sendMessage: (
    chatId: number,
    text: string,
  ) => Effect.Effect<void, BotError>;
}

export const BotService = Context.GenericTag<BotService>("BotService");

export function makeBotService(bot: Bot): BotService {
  return {
    sendMessage: (chatId, text) =>
      Effect.tryPromise({
        try: () => bot.api.sendMessage(chatId, text).then(() => undefined),
        catch: (cause) => new BotError({ cause }),
      }),
  };
}

export function makeBotLayer(bot: Bot): Layer.Layer<BotService> {
  return Layer.succeed(BotService, makeBotService(bot));
}
