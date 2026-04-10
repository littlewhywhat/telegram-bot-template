import { Context, Effect } from "effect";
import type { User, Message } from "./types.js";
import type { DbError } from "../bot/errors.js";

export interface DbService {
  getUser: (chatId: number) => Effect.Effect<User | null, DbError>;
  upsertUser: (
    chatId: number,
    data: Partial<Omit<User, "chatId">>,
  ) => Effect.Effect<void, DbError>;
  saveMessage: (message: Message) => Effect.Effect<void, DbError>;
  getAllReadyUsers: () => Effect.Effect<ReadonlyArray<User>, DbError>;
}

export const DbService = Context.GenericTag<DbService>("DbService");
