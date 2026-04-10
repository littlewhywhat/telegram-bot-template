import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

const client = new MongoClient(uri);

async function seed() {
  await client.connect();
  const db = client.db();

  await db.collection('users').insertMany([
    { chatId: 1001, name: 'Alice', state: 'ready', createdAt: new Date() },
    { chatId: 1002, name: 'Bob', state: 'ready', createdAt: new Date() },
    { chatId: 1003, name: null, state: 'awaiting_name', createdAt: new Date() },
  ]);
  console.log('Seeded 3 users');

  await db.collection('messages').insertMany([
    {
      chatId: 1001,
      direction: 'bot',
      text: 'What is your name?',
      sentAt: new Date(),
    },
    { chatId: 1001, direction: 'user', text: 'Alice', sentAt: new Date() },
    {
      chatId: 1001,
      direction: 'bot',
      text: 'Nice to meet you, Alice!',
      sentAt: new Date(),
    },
  ]);
  console.log('Seeded 3 messages');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => client.close());
