import type { Db, Collection } from "mongodb";
import type { User, Message } from "./types.js";

export function users(db: Db): Collection<User> {
  return db.collection<User>("users");
}

export function messages(db: Db): Collection<Message> {
  return db.collection<Message>("messages");
}
