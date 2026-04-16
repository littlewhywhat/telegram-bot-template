import { type Db, MongoClient } from 'mongodb';
import type { User } from '../../../src/backend/db/types.js';

let cached: { client: MongoClient; db: Db } | null = null;

async function getDb(): Promise<Db> {
  if (cached) return cached.db;
  const uri = process.env.TEST_MONGO_URI;
  if (!uri) throw new Error('TEST_MONGO_URI not set — globalSetup did not run');
  const client = await MongoClient.connect(uri);
  cached = { client, db: client.db() };
  return cached.db;
}

export async function resetDb(): Promise<void> {
  const db = await getDb();
  const collections = await db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function seedUser(
  user: Partial<User> & Pick<User, 'chatId'>,
): Promise<void> {
  const db = await getDb();
  await db.collection('users').insertOne({
    name: null,
    state: 'ready',
    createdAt: new Date(),
    ...user,
  });
}
