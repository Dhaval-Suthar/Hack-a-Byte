// Early environment polyfills executed before other modules
import { TextEncoder, TextDecoder } from 'util';
(globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
(globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;

// Inject minimal required env variables for tests if absent
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackabyte-test-dummy';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'x'.repeat(64);
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'y'.repeat(64);
process.env.RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rk_test';
process.env.RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rks_test';
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'test@example.com';
process.env.SMTP_HOST = process.env.SMTP_HOST || 'localhost';
process.env.SMTP_PORT = process.env.SMTP_PORT || '1025';
process.env.SMTP_USER = process.env.SMTP_USER || 'user';
process.env.SMTP_PASS = process.env.SMTP_PASS || 'pass';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
