import { stopMemoryMongo } from './__tests__/testMongoMemory';

export default async function globalTeardown() {
  await stopMemoryMongo();
}
