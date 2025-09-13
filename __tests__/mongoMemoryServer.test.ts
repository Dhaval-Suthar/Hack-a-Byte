// Test file for MongoDB Memory Server utilities
import { startMemoryMongo, stopMemoryMongo, cleanupMemoryMongo } from '../lib/mongoMemoryServer';

describe('MongoDB Memory Server Utilities', () => {
  it('should export required utility functions', () => {
    expect(typeof startMemoryMongo).toBe('function');
    expect(typeof stopMemoryMongo).toBe('function');
    expect(typeof cleanupMemoryMongo).toBe('function');
  });

  it('should be able to start memory mongo server', async () => {
    const uri = await startMemoryMongo();
    expect(uri).toBeDefined();
    expect(typeof uri).toBe('string');
    expect(uri).toMatch(/^mongodb:\/\//);
  });
});
