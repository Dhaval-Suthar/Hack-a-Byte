import '@testing-library/jest-dom';

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
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.RAZORPAY_KEY_ID = 'test-key-id';
process.env.RAZORPAY_KEY_SECRET = 'test-key-secret';

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
