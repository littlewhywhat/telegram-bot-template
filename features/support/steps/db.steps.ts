import { strict as assert } from 'node:assert';
import { Given, Then } from '@cucumber/cucumber';
import type { BotWorld } from '../world.js';

Given(
  'no user exists with chatId {int}',
  async function (this: BotWorld, chatId: number) {
    await this.db.collection('users').deleteMany({ chatId });
  },
);

Given(
  'a user exists with chatId {int} and state {string}',
  async function (this: BotWorld, chatId: number, state: string) {
    await this.db.collection('users').insertOne({
      chatId,
      name: null,
      state,
      createdAt: new Date(),
    });
  },
);

Given(
  'a user exists with chatId {int} and state {string} and name {string}',
  async function (this: BotWorld, chatId: number, state: string, name: string) {
    await this.db.collection('users').insertOne({
      chatId,
      name,
      state,
      createdAt: new Date(),
    });
  },
);

Given('the current UTC hour is {int}', function (this: BotWorld, hour: number) {
  this.mockedHour = hour;
});

Then(
  'a user record exists with chatId {int} and state {string}',
  async function (this: BotWorld, chatId: number, state: string) {
    const user = await this.db.collection('users').findOne({ chatId });
    assert.ok(user, `Expected user with chatId ${chatId}`);
    assert.equal(user.state, state);
  },
);

Then(
  'the user with chatId {int} has state {string}',
  async function (this: BotWorld, chatId: number, state: string) {
    const user = await this.db.collection('users').findOne({ chatId });
    assert.ok(user, `Expected user with chatId ${chatId}`);
    assert.equal(user.state, state);
  },
);

Then(
  'the user with chatId {int} has name {string}',
  async function (this: BotWorld, chatId: number, name: string) {
    const user = await this.db.collection('users').findOne({ chatId });
    assert.ok(user, `Expected user with chatId ${chatId}`);
    assert.equal(user.name, name);
  },
);

Then(
  'a bot message {string} is stored for chatId {int}',
  async function (this: BotWorld, text: string, chatId: number) {
    const msg = await this.db
      .collection('messages')
      .findOne({ chatId, direction: 'bot', text });
    assert.ok(msg, `Expected bot message "${text}" for chatId ${chatId}`);
  },
);

Then(
  'a user message {string} is stored for chatId {int}',
  async function (this: BotWorld, text: string, chatId: number) {
    const msg = await this.db
      .collection('messages')
      .findOne({ chatId, direction: 'user', text });
    assert.ok(msg, `Expected user message "${text}" for chatId ${chatId}`);
  },
);

Then(
  '{int} bot messages are stored with direction {string}',
  async function (this: BotWorld, count: number, direction: string) {
    const messages = await this.db
      .collection('messages')
      .find({ direction })
      .toArray();
    assert.equal(messages.length, count);
  },
);
