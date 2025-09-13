import 'server-only';

export const runtime = 'nodejs';

// Ensures background services start under `next dev` and `next start` without the custom server.
export async function register() {
  // Keep logs minimal but visible during debugging
  // Avoid running in Edge runtime where Node APIs are not available
  if ((globalThis as unknown as { EdgeRuntime?: string }).EdgeRuntime) {
    // Still try to run services in development
    if (process.env.NODE_ENV === 'development') {
      // Wait for database connection before importing services
      setTimeout(async () => {
        try {
          // First establish database connection
          const { ensureDatabaseConnection } = await import('@/lib/database');
          await ensureDatabaseConnection();

                    // Now safely import services that depend on models
          // Use dynamic import to avoid bundling server-side code in client
          // Temporarily disabled to fix build issues
          // if (typeof window === 'undefined') {
          //   await import('./lib/stateSweeper');
          // }

          // Try to initialize Socket.IO server
          try {
            await import('./lib/socket');
          } catch (error) {
            console.warn('⚠️ Socket.IO initialization failed in instrumentation:', error);
          }
        } catch (dbError) {
          console.error('❌ Database connection failed in instrumentation:', dbError);
        }
      }, 2000); // Increased delay to ensure database is ready
    }
    return;
  }

    // For Node.js runtime, establish database connection first
  try {
    const { ensureDatabaseConnection } = await import('@/lib/database');
    await ensureDatabaseConnection();
  } catch (dbError) {
    console.error('❌ Database connection failed in instrumentation:', dbError);
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
