import mongoose from 'mongoose';
// Polyfill before importing mongodb-memory-server dependencies that rely on TextEncoder
import { TextEncoder, TextDecoder } from 'util';
(globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
(globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongo: MongoMemoryServer | null = null;

export async function startMemoryMongo() {
  if (mongo) return mongo.getUri();
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  process.env.MONGODB_URI = uri; // ensure code under test uses memory uri
  return uri;
}

export async function stopMemoryMongo() {
  if (mongo) {
    await mongoose.connection.close().catch(() => {});
    await mongo.stop();
    mongo = null;
  }
}

export async function cleanupMemoryMongo() {
  const { connections } = mongoose;
  for (const conn of connections) {
    const db = conn.db;
    if (!db) continue;
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
      await db.collection(c.name).deleteMany({});
    }
  }
}
