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

// File upload validation
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'text/plain', 'application/msword'],
  archives: ['application/zip', 'application/x-rar-compressed'],
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(file: File, allowedTypes: string[] = []): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  // Check filename
  const sanitizedName = sanitizeFilename(file.name);
  if (sanitizedName !== file.name) {
    return { valid: false, error: 'Filename contains invalid characters' };
  }

  return { valid: true };
}
