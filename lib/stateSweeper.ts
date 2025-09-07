// Simple in-process sweeper for transient in-memory maps.
// NOTE: For multi-instance deployments replace with Redis + key TTL.
// Import attack modules lazily to avoid mongoose connection issues during instrumentation
const getWormTokens = async () => {
  const { wormTokens } = await import('@/pages/api/attack/worm');
  return wormTokens;
};
const getActiveFakeBank = async () => {
  const { activeFakeBank } = await import('@/pages/api/attack/fakebank');
  return activeFakeBank;
};
const getActiveRansomDemands = async () => {
  const { activeRansomDemands } = await import('@/pages/api/attack/ransomware');
  return activeRansomDemands;
};

// Import random message functions lazily
const getRandomMessageFunctions = async () => {
  const { processScheduledMessages, scheduleMessagesForOnlineDevices } = await import('@/lib/randomMessageGenerator');
  return { processScheduledMessages, scheduleMessagesForOnlineDevices };
};

const g = global as unknown as { __sweeperStarted?: boolean };
if (!g.__sweeperStarted) {
  g.__sweeperStarted = true;
  console.log('🚀 StateSweeper starting up...');
  
  // Kick off random message system immediately once at startup
  (async () => {
    try {
      const { processScheduledMessages, scheduleMessagesForOnlineDevices } = await getRandomMessageFunctions();
      // Initial pass: process any ready items, then schedule new ones
      await processScheduledMessages();
      await scheduleMessagesForOnlineDevices();
    } catch (err) {
      console.error('❌ Initial random message run failed:', err);
    }
  })();

  setInterval(async () => {
    const now = Date.now();
    try {
      const wormTokens = await getWormTokens();
      const activeFakeBank = await getActiveFakeBank();
      const activeRansomDemands = await getActiveRansomDemands();
      
      // Worm tokens prune
      for (const [id,t] of Object.entries(wormTokens)) {
        if (t.expires < now) delete wormTokens[id];
      }
      // Fake bank windows
      for (const [teamId, win] of Object.entries(activeFakeBank)) {
        if (win.expires < now) delete activeFakeBank[teamId];
      }
      // Ransom demands (shape: { [teamId]: { expires:number } })
      for (const [key, demand] of Object.entries(activeRansomDemands)) {
        if (demand.expires < now) delete activeRansomDemands[key];
      }
    } catch (err) {
      console.error('❌ Error in state sweeper cleanup:', err);
    }
  }, 30_000);

    // Schedule new messages every 2 minutes (more frequent now that probability is removed)
    setInterval(async () => {
    try {
      const { scheduleMessagesForOnlineDevices } = await getRandomMessageFunctions();
      await scheduleMessagesForOnlineDevices();
    } catch (error) {
      console.error('❌ Error scheduling messages:', error);
    }
    }, 2 * 60 * 1000);

  // Process ready scheduled messages moderately (every 60s)
  setInterval(async () => {
    try {
      const { processScheduledMessages } = await getRandomMessageFunctions();
      await processScheduledMessages();
    } catch {}
  }, 60_000);
  
  console.log('✅ StateSweeper fully initialized');
}
