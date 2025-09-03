import { startMemoryMongo } from './__tests__/testMongoMemory';

export default async function globalSetup() {
  await startMemoryMongo();
}

