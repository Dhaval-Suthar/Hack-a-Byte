import { stopMemoryMongo } from './lib/mongoMemoryServer';

export default async function globalTeardown() {
  await stopMemoryMongo();
}
