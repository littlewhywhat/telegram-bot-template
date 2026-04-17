import { type Db, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;
let client: MongoClient;
let db: Db;

export async function startDb(): Promise<Db> {
  mongod = await MongoMemoryServer.create();
  client = await MongoClient.connect(mongod.getUri());
  db = client.db();
  return db;
}

export function getUri(): string {
  return mongod.getUri();
}

export async function stopDb(): Promise<void> {
  await client?.close();
  await mongod?.stop();
}

export async function cleanDb(): Promise<void> {
  const collections = await db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export function getDb(): Db {
  return db;
}
