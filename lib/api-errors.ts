import type { NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

export interface RoleForbiddenMeta { allowed?: string[]; appId?: string }

// Standardized error classes
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class ValidationError extends GameError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends GameError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends GameError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends GameError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends GameError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends GameError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

// Error response formatter
export function formatErrorResponse(error: unknown) {
  if (error instanceof GameError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }

  // Handle unexpected errors
  logger.error('Unexpected error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
  return {
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
  };
}

// Enhanced error handler for API routes
export async function handleApiError(error: unknown, context?: string) {
  const response = formatErrorResponse(error);

  // Log error with context
  if (error instanceof Error) {
    logger.error(`API Error${context ? ` in ${context}` : ''}`, {
      message: error.message,
      stack: error.stack,
      code: (error as GameError).code,
      statusCode: (error as GameError).statusCode,
    }, error);
  }

  return response;
}

// Validation helpers
export function validateRequired(value: unknown, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
}

export function validateString(value: unknown, fieldName: string, maxLength?: number): void {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  if (maxLength && value.length > maxLength) {
    throw new ValidationError(`${fieldName} must be less than ${maxLength} characters`);
  }
}

export function validateNumber(value: unknown, fieldName: string, min?: number, max?: number): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  if (min !== undefined && value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName} must be at most ${max}`);
  }
}

export function roleForbidden(res: NextApiResponse, meta: RoleForbiddenMeta) {
  return res.status(403).json({ success: false, error: 'FORBIDDEN_ROLE', code: 'ROLE_FORBIDDEN', allowed: meta.allowed, appId: meta.appId });
}

export function methodNotAllowed(res: NextApiResponse) {
  return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED', code: 'METHOD_NOT_ALLOWED' });
}

export function badRequest(res: NextApiResponse, message: string) {
  return res.status(400).json({ success: false, error: 'BAD_REQUEST', code: 'BAD_REQUEST', message });
}

export function notFound(res: NextApiResponse, message: string) {
  return res.status(404).json({ success: false, error: 'NOT_FOUND', code: 'NOT_FOUND', message });
}

export function unauthorized(res: NextApiResponse, message = 'Unauthorized') {
  return res.status(401).json({ success: false, error: 'UNAUTHORIZED', code: 'UNAUTHORIZED', message });
}

export function internalError(res: NextApiResponse, detail?: string) {
  return res.status(500).json({ success: false, error: 'INTERNAL_ERROR', code: 'INTERNAL_ERROR', detail });
}
