import { setWorldConstructor, World } from '@cucumber/cucumber';
import { type Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { SentMessage } from '../../tests/helpers/mock-bot.js';

export class BotWorld extends World {
  mongod!: MongoMemoryServer;
  client!: MongoClient;
  db!: Db;
  sent: SentMessage[] = [];
  mockedHour: number | null = null;

  async startDb(): Promise<void> {
    this.mongod = await MongoMemoryServer.create();
    this.client = await MongoClient.connect(this.mongod.getUri());
    this.db = this.client.db();
  }

  async stopDb(): Promise<void> {
    await this.client?.close();
    await this.mongod?.stop();
  }

  async cleanDb(): Promise<void> {
    const collections = await this.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  }
}

setWorldConstructor(BotWorld);
