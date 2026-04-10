import { Context, Effect, Layer } from "effect";
import type { Db } from "mongodb";
import type { User, Message } from "./types.js";
import { DbError } from "../bot/errors.js";
import { users, messages } from "./collections.js";

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

export function makeDbService(db: Db): DbService {
  return {
    getUser: (chatId) =>
      Effect.tryPromise({
        try: () => users(db).findOne({ chatId }) as Promise<User | null>,
        catch: (cause) => new DbError({ cause }),
      }),

    upsertUser: (chatId, data) =>
      Effect.tryPromise({
        try: () =>
          users(db)
            .updateOne(
              { chatId },
              { $set: data, $setOnInsert: { chatId, createdAt: new Date() } },
              { upsert: true },
            )
            .then(() => undefined),
        catch: (cause) => new DbError({ cause }),
      }),

    saveMessage: (message) =>
      Effect.tryPromise({
        try: () => messages(db).insertOne(message as any).then(() => undefined),
        catch: (cause) => new DbError({ cause }),
      }),

    getAllReadyUsers: () =>
      Effect.tryPromise({
        try: () =>
          users(db)
            .find({ state: "ready" })
            .toArray() as Promise<User[]>,
        catch: (cause) => new DbError({ cause }),
      }),
  };
}

export function makeDbLayer(db: Db): Layer.Layer<DbService> {
  return Layer.succeed(DbService, makeDbService(db));
}
