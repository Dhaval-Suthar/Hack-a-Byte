import mongoose from 'mongoose';
import { logger } from '@/lib/logger';

/**
 * Database query optimization utilities
 */

export interface QueryOptions {
  lean?: boolean;
  populate?: Array<{
    path: string;
    select?: string;
    model?: string;
  }>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  select?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult {
  data: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Execute an optimized database query with common options
 */
export async function executeQuery(
  model: mongoose.Model<unknown>,
  filter: Record<string, unknown> = {},
  options: QueryOptions = {}
): Promise<unknown[]> {
  let query = model.find(filter);

  // Apply population
  if (options.populate) {
    options.populate.forEach(pop => {
      query = query.populate(pop);
    });
  }

  // Apply sorting
  if (options.sort) {
    query = query.sort(options.sort);
  }

  // Apply field selection
  if (options.select) {
    query = query.select(options.select);
  }

  // Apply pagination
  if (options.skip) {
    query = query.skip(options.skip);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  // Use lean for better performance when no mongoose methods needed
  if (options.lean) {
    return query.lean().exec();
  }

  return query.exec();
}

/**
 * Execute a paginated query
 */
export async function executePaginatedQuery(
  model: mongoose.Model<unknown>,
  filter: Record<string, unknown> = {},
  pagination: PaginationOptions = {},
  options: Omit<QueryOptions, 'limit' | 'skip'> = {}
): Promise<PaginatedResult> {
  const page = Math.max(1, pagination.page || 1);
  const limit = Math.min(100, Math.max(1, pagination.limit || 10)); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Get total count
  const total = await model.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  // Execute query
  const data = await executeQuery(model, filter, {
    ...options,
    limit,
    skip,
  });

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Create optimized indexes for common queries
 */
export async function ensureIndexes(model: mongoose.Model<unknown>, indexes: Array<{
  fields: Record<string, 1 | -1>;
  options?: { unique?: boolean; sparse?: boolean; background?: boolean };
}>): Promise<void> {
  for (const index of indexes) {
    try {
      await model.collection.createIndex(index.fields, {
        background: true,
        ...index.options,
      });
    } catch (error) {
      logger.warn(`Failed to create index on ${model.modelName}:`, { error });
    }
  }
}

/**
 * Cache frequently accessed data
 */
class QueryCache {
  private cache = new Map<string, { data: unknown; expires: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: unknown, ttl?: number): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttl || this.defaultTTL)
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const queryCache = new QueryCache();
