import { z } from 'zod';
import { logger } from '@/lib/logger';

// Environment variables schema
const envSchema = z.object({
  // Database
  MONGODB_URI: z.string().url('MONGODB_URI must be a valid MongoDB connection string'),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters long').optional(),

  // Payment
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),

  // Email
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email address'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  // Optional but recommended
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

type EnvSchema = z.infer<typeof envSchema>;

// Validate environment variables
function validateEnvironment(): EnvSchema {
  try {
    const env = envSchema.parse(process.env);
    logger.info('Environment variables validated successfully');
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorDetails = error.errors.map(err => ({ path: err.path.join('.'), message: err.message }));
      logger.error('Environment validation failed', { errors: errorDetails });
      error.errors.forEach((err) => {
        logger.error(`Environment validation error: ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      logger.error('Unexpected error during environment validation', { error: error instanceof Error ? error.message : String(error), errorObject: error });
    }
  // Never exit the process in Edge/Next runtimes; always throw to let caller handle
  throw error;
  }
}

// Export validated environment
export const env = validateEnvironment();

// Helper function to get environment variable with fallback
export function getEnvVar(key: keyof EnvSchema, fallback?: string): string {
  const value = env[key];
  if (value === undefined && fallback === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return (value as string) || fallback!;
}

// Development mode helpers
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Logging helper
export function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, ...args: unknown[]) {
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = levels[env.LOG_LEVEL];

  if (levels[level] <= currentLevel) {
    console[level](message, { args });
  }
}
