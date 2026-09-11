import { MongoClient, type Db } from 'mongodb';

const uri = import.meta.env.MONGODB_URI;
const dbName = import.meta.env.MONGODB_DB ?? 'detickovo';

const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

export async function getDb(): Promise<Db> {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  globalForMongo.mongoClientPromise ??= new MongoClient(uri).connect();
  const client = await globalForMongo.mongoClientPromise;
  return client.db(dbName);
}