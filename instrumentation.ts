export const runtime = 'nodejs';

// Ensures background services start under `next dev` and `next start` without the custom server.
export async function register() {
  // Keep logs minimal but visible during debugging
  console.log('🧭 instrumentation.register: initializing background services');
  // Avoid running in Edge runtime where Node APIs are not available
  if ((globalThis as unknown as { EdgeRuntime?: string }).EdgeRuntime) {
    console.log('🧭 instrumentation: Edge runtime detected – skipping services');
    // Still try to run services in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧭 Development mode detected – forcing service initialization');
      // Wait a bit for database connection before importing services
      setTimeout(async () => {
        await import('./lib/stateSweeper');
        // Try to initialize Socket.IO server
        try {
          console.log('🔌 Attempting to initialize Socket.IO in instrumentation...');
          await import('./lib/socket');
          console.log('✅ Socket.IO import successful');
        } catch (error) {
          console.warn('⚠️ Socket.IO initialization failed in instrumentation:', error);
        }
      }, 1000);
    }
    return;
  }
  // Initialize the in-process state sweeper (idempotent via global guard)
  await import('./lib/stateSweeper');

  // Do not import Socket.IO directly here; primed from /api/socketio when client connects
  // This avoids importing heavy models in the Edge instrumentation context.
}
