import { MongoClient } from "mongodb";

let client: MongoClient | null = null;

export function getClient(): MongoClient {
  if (!client) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    client = new MongoClient(uri);
  }
  return client;
}

export function getDb(name?: string) {
  return getClient().db(name);
}
