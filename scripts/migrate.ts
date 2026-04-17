import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

const client = new MongoClient(uri);

async function migrate() {
  await client.connect();
  const db = client.db();

  console.log('Creating index: users.chatId (unique)');
  await db.collection('users').createIndex({ chatId: 1 }, { unique: true });

  console.log('Creating index: messages.chatId + sentAt (compound)');
  await db.collection('messages').createIndex({ chatId: 1, sentAt: -1 });

  console.log('Migration complete');
}

migrate()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => client.close());
