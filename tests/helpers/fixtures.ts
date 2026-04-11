import type { Message, User } from '../../src/backend/db/types.js';

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    chatId: 1,
    name: null,
    state: 'awaiting_name',
    createdAt: new Date(),
    ...overrides,
  };
}

export function buildMessage(overrides: Partial<Message> = {}): Message {
  return {
    chatId: 1,
    direction: 'user',
    text: 'hello',
    sentAt: new Date(),
    ...overrides,
  };
}
