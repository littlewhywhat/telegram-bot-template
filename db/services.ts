import { Context, Effect as Fx, Layer } from 'effect';
import type { Db } from 'mongodb';
import { DbError } from '../bot/errors.js';
import { messages, users } from './collections.js';
import type { Message, User } from './types.js';

export interface DbService {
  getUser: (chatId: number) => Fx.Effect<User | null, DbError>;
  upsertUser: (
    chatId: number,
    data: Partial<Omit<User, 'chatId'>>,
  ) => Fx.Effect<void, DbError>;
  saveMessage: (message: Message) => Fx.Effect<void, DbError>;
  getAllReadyUsers: () => Fx.Effect<ReadonlyArray<User>, DbError>;
}

export const DbService = Context.GenericTag<DbService>('DbService');

export function makeDbService(db: Db): DbService {
  return {
    getUser: (chatId) =>
      Fx.tryPromise({
        try: () => users(db).findOne({ chatId }) as Promise<User | null>,
        catch: (cause) => new DbError({ cause }),
      }),

    upsertUser: (chatId, data) =>
      Fx.tryPromise({
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
      Fx.tryPromise({
        try: () =>
          messages(db)
            .insertOne(
              message as Parameters<
                ReturnType<typeof messages>['insertOne']
              >[0],
            )
            .then(() => undefined),
        catch: (cause) => new DbError({ cause }),
      }),

    getAllReadyUsers: () =>
      Fx.tryPromise({
        try: () =>
          users(db).find({ state: 'ready' }).toArray() as Promise<User[]>,
        catch: (cause) => new DbError({ cause }),
      }),
  };
}

export function makeDbLayer(db: Db): Layer.Layer<DbService> {
  return Layer.succeed(DbService, makeDbService(db));
}
