import type { Collection, Db } from 'mongodb';
import type { Message, User } from './types.js';

export function users(db: Db): Collection<User> {
  return db.collection<User>('users');
}

export function messages(db: Db): Collection<Message> {
  return db.collection<Message>('messages');
}
