import 'server-only';

import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// Ensures background services start under `next dev` and `next start` without the custom server.
export async function register() {
  // Keep logs minimal but visible during debugging
  // Avoid running in Edge runtime where Node APIs are not available
  if (typeof window !== 'undefined' || (globalThis as unknown as { EdgeRuntime?: string }).EdgeRuntime) {
    logger.info('Running in browser or Edge runtime, skipping database-dependent services');
    return;
  }

  // For Node.js runtime, establish database connection first
  try {
    const { ensureDatabaseConnection } = await import('@/lib/database');
    await ensureDatabaseConnection();
  } catch (dbError) {
    logger.error('❌ Database connection failed in instrumentation:', { error: dbError instanceof Error ? dbError.message : String(dbError || 'Unknown error') });
    return; // Don't proceed if database connection fails
  }

  // Initialize the in-process state sweeper (idempotent via global guard)
  // Temporarily disabled to fix build issues
  // if (typeof window === 'undefined') {
  //   eval('import("./lib/stateSweeper")');
  // }

  // Do not import Socket.IO directly here; primed from /api/socketio when client connects
  // This avoids importing heavy models in the Edge instrumentation context.
}
