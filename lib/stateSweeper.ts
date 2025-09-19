// Simple in-process sweeper for transient in-memory maps.
// NOTE: For multi-instance deployments replace with Redis + key TTL.
// Import attack modules lazily to avoid mongoose connection issues during instrumentation

import { logger } from '@/lib/logger';

// Import random message functions lazily
const getRandomMessageFunctions = async () => {
  const { processScheduledMessages, scheduleMessagesForOnlineDevices } = await import('@/lib/randomMessageGenerator');
  return { processScheduledMessages, scheduleMessagesForOnlineDevices };
};

const g = global as unknown as { __sweeperStarted?: boolean };
if (!g.__sweeperStarted) {
  g.__sweeperStarted = true;
  
  // Kick off random message system immediately once at startup
  (async () => {
    try {
      const { processScheduledMessages, scheduleMessagesForOnlineDevices } = await getRandomMessageFunctions();
      // Initial pass: process any ready items, then schedule new ones
      await processScheduledMessages();
      await scheduleMessagesForOnlineDevices();
    } catch (err) {
      logger.error('❌ Initial random message run failed:', { error: err instanceof Error ? err.message : String(err || 'Unknown error'), errorObject: err });
    }
  })();

  setInterval(async () => {
    try {
      // No active cleanup needed for removed FakeBank functionality
    } catch (err) {
      logger.error('❌ Error in state sweeper cleanup:', { error: err instanceof Error ? err.message : String(err || 'Unknown error'), errorObject: err });
    }
  }, 30_000);

    // Schedule new messages every 2 minutes (more frequent now that probability is removed)
    setInterval(async () => {
    try {
      const { scheduleMessagesForOnlineDevices } = await getRandomMessageFunctions();
      await scheduleMessagesForOnlineDevices();
    } catch (error) {
      logger.error('❌ Error scheduling messages:', { error: error instanceof Error ? error.message : String(error || 'Unknown error'), errorObject: error });
    }
    }, 2 * 60 * 1000);

  // Process ready scheduled messages moderately (every 60s)
  setInterval(async () => {
    try {
      const { processScheduledMessages } = await getRandomMessageFunctions();
      await processScheduledMessages();
    } catch {}
  }, 60_000);
  
}

// Export empty object to make this a proper module
const stateSweeper = {};
export default stateSweeper;
