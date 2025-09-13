// Polyfill TextEncoder/Decoder early
import { TextEncoder, TextDecoder } from 'util';
(globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
(globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;

import '@testing-library/jest-dom';
// Memory Mongo bootstrap (only if tests actually touch DB)
import { startMemoryMongo, stopMemoryMongo } from './lib/mongoMemoryServer';
import { logger } from '@/lib/logger';

beforeAll(async () => {
  // Start memory mongo once; suites that mock connectDb won't be affected
  await startMemoryMongo();
});

afterAll(async () => {
  await stopMemoryMongo();
});

// Simple polyfill for TextEncoder/TextDecoder
// @ts-expect-error - Polyfill for Jest environment
global.TextEncoder = class {
  encode(input: string): Uint8Array {
    return new Uint8Array(Buffer.from(input, 'utf-8'));
  }
};

// @ts-expect-error - Polyfill for Jest environment
global.TextDecoder = class {
  decode(input: Uint8Array): string {
    return Buffer.from(input).toString('utf-8');
  }
};

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.RAZORPAY_KEY_ID = 'test-key-id';
process.env.RAZORPAY_KEY_SECRET = 'test-key-secret';
process.env.EMAIL_FROM = 'test@example.com';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test-user';
process.env.SMTP_PASS = 'test-password';
process.env.LOG_LEVEL = 'error';

// Global test setup
beforeAll(() => {
  // Suppress console logs during tests unless they're errors
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;

  console.log = jest.fn();
  console.warn = jest.fn();

  // Keep console.error for debugging test failures
  return () => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
  };
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  get length() { return 0; },
  key: jest.fn(),
};
global.localStorage = localStorageMock as Storage;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  get length() { return 0; },
  key: jest.fn(),
};
global.sessionStorage = sessionStorageMock as Storage;
