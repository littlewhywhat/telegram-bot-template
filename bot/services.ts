import { Context, Effect } from "effect";
import type { BotError } from "./errors.js";

export interface BotService {
  sendMessage: (
    chatId: number,
    text: string,
  ) => Effect.Effect<void, BotError>;
}

export const BotService = Context.GenericTag<BotService>("BotService");
