import { startMemoryMongo } from './lib/mongoMemoryServer';

export default async function globalSetup() {
  await startMemoryMongo();
}

