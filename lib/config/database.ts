// Database configuration
export const DATABASE_CONFIG = {
  // Connection settings
  connection: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },

  // Collection names
  collections: {
    devices: 'devices',
    deviceUsers: 'device_users',
    playspaces: 'playspaces',
    teams: 'teams',
    events: 'events',
    eventRegistrations: 'event_registrations',
    accessCodes: 'access_codes',
    leaderboard: 'leaderboard',
    sponsors: 'sponsors',
    sponsorContacts: 'sponsor_contacts',
    missions: 'missions',
  },

  // Indexes
  indexes: {
    devices: [
      { key: { deviceMacAddress: 1 }, options: { unique: true } },
      { key: { deviceType: 1 } },
    ],
    deviceUsers: [
      { key: { username: 1 }, options: { unique: true } },
      { key: { deviceId: 1 } },
    ],
  },
} as const;
