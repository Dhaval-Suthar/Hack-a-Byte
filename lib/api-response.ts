import { NextApiResponse } from 'next';
import { ApiResponse } from '@/types/global';

/**
 * Standardized API response utilities
 */

export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'ApiError';

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createSuccessResponse = <T>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200,
  message?: string
): void => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message })
  };
  res.status(statusCode).json(response);
};

export const createErrorResponse = (
  res: NextApiResponse,
  error: string | Error | ApiError,
  statusCode: number = 500,
  details?: unknown
): void => {
  const message = error instanceof Error ? error.message : error;

  const response: ApiResponse = {
    success: false,
    error: message,
    ...(details !== undefined && { details })
  };

  // Log error for debugging
  if (statusCode >= 500) {
    console.error('API Error:', {
      message,
      statusCode,
      details,
      stack: error instanceof Error ? error.stack : undefined
    });
  }

  res.status(statusCode).json(response);
};

export const handleApiError = (
  res: NextApiResponse,
  error: unknown
): void => {
  if (error instanceof ApiError) {
    createErrorResponse(res, error.message, error.statusCode);
  } else if (error instanceof Error) {
    // Check for common database errors
    if (error.message.includes('Cast to ObjectId failed')) {
      createErrorResponse(res, 'Invalid ID format', 400);
    } else if (error.message.includes('duplicate key error')) {
      createErrorResponse(res, 'Resource already exists', 409);
    } else if (error.message.includes('ValidationError')) {
      createErrorResponse(res, 'Validation failed', 400, error.message);
    } else {
      createErrorResponse(res, 'Internal server error', 500);
    }
  } else {
    createErrorResponse(res, 'Unknown error occurred', 500);
  }
};

export const validateMethod = (
  res: NextApiResponse,
  method: string,
  allowedMethods: string[]
): boolean => {
  if (!allowedMethods.includes(method)) {
    createErrorResponse(
      res,
      `Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      405
    );
    return false;
  }
  return true;
};

export const validateRequiredFields = (
  res: NextApiResponse,
  body: Record<string, unknown>,
  requiredFields: string[]
): boolean => {
  const missingFields = requiredFields.filter(field => !body[field]);

  if (missingFields.length > 0) {
    createErrorResponse(
      res,
      `Missing required fields: ${missingFields.join(', ')}`,
      400
    );
    return false;
  }
  return true;
};
