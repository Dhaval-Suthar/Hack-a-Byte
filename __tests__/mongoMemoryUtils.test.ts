import { startMemoryMongo, stopMemoryMongo } from '../lib/mongoMemoryServer';

// MongoDB Memory Server Utilities Test
describe('MongoDB Memory Server Utilities', () => {
  test('should export utility functions', () => {
    expect(typeof startMemoryMongo).toBe('function');
    expect(typeof stopMemoryMongo).toBe('function');
  });

  test('should start and return MongoDB URI', async () => {
    // Test starting the memory server
    const uri = await startMemoryMongo();
    expect(uri).toBeDefined();
    expect(uri).toContain('mongodb://');
    
    // Cleanup
    await stopMemoryMongo();
  }, 15000); // 15 second timeout for MongoDB operations

  test('should return existing URI when mongo is already running', async () => {
    // Start server first time
    const uri1 = await startMemoryMongo();
    
    // Call again - should return same URI without creating new instance
    const uri2 = await startMemoryMongo();
    expect(uri2).toBe(uri1);
    
    // Cleanup
    await stopMemoryMongo();
  }, 15000);
});
