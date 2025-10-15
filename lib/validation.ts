import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Common validation schemas
export const emailSchema = z.string().email().max(254);
export const passwordSchema = z.string().min(8).max(128).regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
);
export const usernameSchema = z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');
export const nameSchema = z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, apostrophes, and hyphens');

// Input sanitization functions
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
  });
}

export function sanitizeSql(input: string): string {
  // Basic SQL injection prevention
  return input.replace(/['";\\]/g, '').trim();
}

export function sanitizeFilename(input: string): string {
  // Remove potentially dangerous characters from filenames
  return input.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim();
}

export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Validation functions
export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): boolean {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
}

export function validateUsername(username: string): boolean {
  try {
    usernameSchema.parse(username);
    return true;
  } catch {
    return false;
  }
}

// Comprehensive input validation
export function validateAndSanitizeInput(input: string, options: {
  maxLength?: number;
  allowHtml?: boolean;
  allowSpecialChars?: boolean;
} = {}): string {
  const { maxLength = 1000, allowHtml = false, allowSpecialChars = true } = options;

  let sanitized = input.trim();

  // Length validation
  if (sanitized.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }

  // HTML sanitization
  if (!allowHtml) {
    sanitized = sanitizeHtml(sanitized);
  }

  // Special characters validation
  if (!allowSpecialChars && /[<>'"&]/.test(sanitized)) {
    throw new Error('Special characters are not allowed');
  }

  return sanitized;
}

// Rate limiting for form submissions
const submissionStore = new Map<string, { count: number; resetTime: number }>();
const SUBMISSION_WINDOW = 60 * 1000; // 1 minute
const MAX_SUBMISSIONS = 5; // Max submissions per minute

export function checkFormSubmissionRate(identifier: string): boolean {
  const now = Date.now();
  const windowKey = `${identifier}:${Math.floor(now / SUBMISSION_WINDOW)}`;

  const current = submissionStore.get(windowKey) || { count: 0, resetTime: now + SUBMISSION_WINDOW };

  if (now > current.resetTime) {
    // Reset window
    submissionStore.set(windowKey, { count: 1, resetTime: now + SUBMISSION_WINDOW });
    return true;
  } else if (current.count >= MAX_SUBMISSIONS) {
    return false; // Rate limit exceeded
  } else {
    // Increment counter
    submissionStore.set(windowKey, { ...current, count: current.count + 1 });
    return true;
  }
}

// CSRF protection helper
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

// API request validation schemas
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const walletTransactionSchema = z.object({
  teamId: objectIdSchema,
  type: z.enum(['credit', 'debit', 'transfer', 'mining', 'attack', 'defense']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(500).optional(),
  attackerId: objectIdSchema.optional(),
  defenderId: objectIdSchema.optional(),
  transactionHash: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional().default('completed'),
});

export const deviceSecuritySchema = z.object({
  deviceId: z.string(),
  toggles: z.record(z.boolean()).optional(),
});

export const teamCreationSchema = z.object({
  name: z.string().min(1).max(100),
  maxPlayers: z.number().int().min(1).max(6).optional().default(6),
  gameMode: z.enum(['cryptoheist', 'base']).optional().default('cryptoheist'),
});

export const userRegistrationSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const userLoginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Enhanced validation helper functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: z.ZodError['errors'];
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error.errors };
  }
}

export function validateQueryParams<T>(schema: z.ZodSchema<T>, query: Record<string, unknown>): T {
  const result = schema.safeParse(query);

  if (!result.success) {
    // For query params, we'll use defaults and ignore invalid values
    // This prevents breaking existing functionality
    return schema.parse({});
  }

  return result.data;
}
