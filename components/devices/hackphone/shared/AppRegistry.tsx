import { AppConfig } from "@/types/devices";

export const APP_REGISTRY: AppConfig[] = [
  {
    id: "messages",
    name: "Messages",
    icon: "/hackphone/apps/message/app-icon.png",
    category: "communication",
    description: "Send and receive text messages",
    isSystemApp: true,
    permissions: [
      { type: 'contacts', required: false, description: 'Access contacts for messaging' }
    ]
  },
  {
    id: "calender",
    name: "Calendar",
    icon: "/hackphone/apps/calender/app-icon.png",
    category: "productivity",
    description: "Manage your schedule and events",
    isSystemApp: true
  },
  {
    id: "photos",
    name: "Photos",
    icon: "/hackphone/apps/photos/app-icon.png",
    category: "media",
    description: "View and manage your photo gallery",
    isSystemApp: true,
    permissions: [
      { type: 'storage', required: true, description: 'Access photo storage' }
    ]
  },
  {
    id: "camera",
    name: "Camera",
    icon: "/hackphone/apps/camera/app-icon.png",
    category: "media",
    description: "Take photos and videos",
    isSystemApp: true,
    permissions: [
      { type: 'camera', required: true, description: 'Access camera hardware' },
      { type: 'storage', required: true, description: 'Save photos and videos' }
    ]
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: "/hackphone/apps/youtube/app-icon.png",
    category: "media",
    description: "Watch videos and browse content",
    permissions: [
      { type: 'network', required: true, description: 'Internet access for streaming' }
    ]
  },
  {
    id: "stocks",
    name: "Stocks",
    icon: "/hackphone/apps/stocks/app-icon.png",
    category: "finance",
    description: "Track stock prices and market data",
    permissions: [
      { type: 'network', required: true, description: 'Access financial data' }
    ]
  },
  {
    id: "maps",
    name: "Maps",
    icon: "/hackphone/apps/map/app-icon.png",
    category: "utility",
    description: "Navigate and find locations",
    permissions: [
      { type: 'location', required: false, description: 'Access current location' },
      { type: 'network', required: true, description: 'Download map data' }
    ]
  },
  {
    id: "weather",
    name: "Weather",
    icon: "/hackphone/apps/weather/app-icon.png",
    category: "utility",
    description: "Check weather forecasts",
    permissions: [
      { type: 'location', required: false, description: 'Get local weather' },
      { type: 'network', required: true, description: 'Fetch weather data' }
    ]
  },
  {
    id: "notes",
    name: "Notes",
    icon: "/hackphone/apps/notes/app-icon.png",
    category: "productivity",
    description: "Create and manage notes",
    permissions: [
      { type: 'storage', required: true, description: 'Save notes locally' }
    ]
  },
  {
    id: "settings",
    name: "Settings",
    icon: "/hackphone/apps/setting/app-icon.png",
    category: "system",
    description: "Configure device settings",
    isSystemApp: true
  },
  {
    id: "phone",
    name: "Phone",
    icon: "/hackphone/apps/phone/app-icon.png",
    category: "communication",
    description: "Make and receive calls",
    isSystemApp: true,
    permissions: [
      { type: 'microphone', required: true, description: 'Voice calls' }
    ]
  },
  {
    id: "mail",
    name: "Mail",
    icon: "/hackphone/apps/mail/app-icon.png",
    category: "communication",
    description: "Send and receive emails",
    permissions: [
      { type: 'network', required: true, description: 'Email server access' }
    ]
  },
  {
    id: "safari",
    name: "Safari",
    icon: "/hackphone/apps/safari/app-icon.png",
    category: "utility",
    description: "Browse the web",
    permissions: [
      { type: 'network', required: true, description: 'Internet access' }
    ]
  },
  {
    id: "music",
    name: "iPod",
    icon: "/hackphone/apps/music/app-icon.png",
    category: "media",
    description: "Play music and manage playlists",
    permissions: [
      { type: 'storage', required: true, description: 'Access music files' }
    ]
  },
  {
    id: "calculator",
    name: "Calculator",
    icon: "/hackphone/apps/calculator/app-icon.png",
    category: "utility",
    description: "Perform mathematical calculations",
    isSystemApp: true
  },
  {
    id: "clock",
    name: "Clock",
    icon: "/hackphone/apps/clock/app-icon.png",
    category: "utility",
    description: "Time, alarms, and stopwatch",
    isSystemApp: true
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: "/hackphone/apps/contact/app-icon.png",
    category: "communication",
    description: "Manage your contacts",
    isSystemApp: true,
    permissions: [
      { type: 'contacts', required: true, description: 'Access contact list' },
      { type: 'storage', required: true, description: 'Save contact data' }
    ]
  },
  {
    id: "game",
    name: "Games",
    icon: "/hackphone/apps/game/app-icon.png",
    category: "entertainment",
    description: "Play games and have fun",
    permissions: [
      { type: 'storage', required: false, description: 'Save game progress' }
    ]
  },
  {
    id: "appStore",
    name: "App Store",
    icon: "/hackphone/apps/appStore/app-icon.png",
    category: "system",
    description: "Download and manage apps",
    isSystemApp: true,
    permissions: [
      { type: 'network', required: true, description: 'Download apps' },
      { type: 'storage', required: true, description: 'Install apps' }
    ]
  },
  {
    id: "files",
    name: "Files",
    icon: "/hackphone/apps/files/app_icon.png",
    category: "utility",
    description: "Browse and manage files",
    isSystemApp: true,
    permissions: [
      { type: 'storage', required: true, description: 'Access file system' }
    ]
  },
  {
    id: "sentinel",
    name: "Sentinel",
    icon: "/hackphone/apps/sentinel/app-icon.png",
    category: "security",
    description: "Security and monitoring tools",
    requiresAuth: true,
    permissions: [
      { type: 'network', required: true, description: 'Security scanning' },
      { type: 'storage', required: true, description: 'Log security events' }
    ]
  }
  ,
  {
    id: "mining",
    name: "Mining",
    icon: "/hackphone/apps/game/app-icon.png", // reuse game icon until custom asset added
    category: "finance",
    description: "Mine bitcoins via sorting mini-game",
    permissions: [
      { type: 'storage', required: false, description: 'Persist mining progress' }
    ]
  },
  {
    id: "security",
    name: "Security",
    icon: "/hackphone/apps/sentinel/app-icon.png",
    category: "security",
    description: "Configure defensive systems",
    permissions: [
      { type: 'storage', required: true, description: 'Persist security configuration' }
    ]
  },
  {
    id: "def-stealth",
    name: "Stealth Defense",
    icon: "/hackphone/apps/sentinel/app-icon.png",
    category: "security",
    description: "Neutralize stealth viral infections via rapid taps",
    permissions: [ { type: 'network', required: true, description: 'Poll infection status' } ]
  },
  {
    id: "def-ransom",
    name: "Ransomware",
    icon: "/hackphone/apps/sentinel/app-icon.png",
    category: "security",
    description: "Type code phrases to decrypt and stop ransomware",
    permissions: [ { type: 'network', required: true, description: 'Send typing progress' } ]
  },
  {
    id: "bank-status",
    name: "Bank",
    icon: "/hackphone/apps/stocks/app-icon.png",
    category: "finance",
    description: "Monitor bank online/offline state and SystemLock",
    permissions: [ { type: 'network', required: true, description: 'Receive bank state events' } ]
  },
  {
    id: "worm-phish",
    name: "Worm Phish",
    icon: "/hackphone/apps/game/app-icon.png",
    category: "attack",
    description: "Launch worm phishing reward exploit",
    permissions: [ { type: 'network', required: true, description: 'Trigger worm phishing endpoint' } ]
  }
];

// Dock apps (always visible)
export const DOCK_APPS = ["phone", "messages", "safari", "music"];

export const getAppById = (id: string): AppConfig | undefined => {
  return APP_REGISTRY.find(app => app.id === id);
};

export const getAppsByCategory = (category: string): AppConfig[] => {
  return APP_REGISTRY.filter(app => app.category === category);
};

export const getAllCategories = (): string[] => {
  const categories = APP_REGISTRY
    .map(app => app.category)
    .filter((category): category is string => category !== undefined);
  return [...new Set(categories)];
};

export const getSystemApps = (): AppConfig[] => {
  return APP_REGISTRY.filter(app => app.isSystemApp);
};

export const getUserApps = (): AppConfig[] => {
  return APP_REGISTRY.filter(app => !app.isSystemApp);
};

export const checkAppPermissions = (appId: string): { hasAllPermissions: boolean; missingPermissions: string[] } => {
  const app = getAppById(appId);
  if (!app || !app.permissions) {
    return { hasAllPermissions: true, missingPermissions: [] };
  }

  const missingPermissions: string[] = [];
  const requiredPermissions = app.permissions.filter(p => p.required);

  // In a real app, you'd check actual browser permissions here
  // For now, we'll simulate permission checking
  requiredPermissions.forEach(permission => {
    // Simulate permission check - in reality you'd use:
    // navigator.permissions.query({ name: permission.type })
    if (permission.type === 'camera' || permission.type === 'microphone') {
      // Assume these might not be granted
      missingPermissions.push(permission.description);
    }
  });

  return {
    hasAllPermissions: missingPermissions.length === 0,
    missingPermissions
  };
};

export const getAppsRequiringPermission = (permissionType: string): AppConfig[] => {
  return APP_REGISTRY.filter(app =>
    app.permissions?.some(p => p.type === permissionType)
  );
};
