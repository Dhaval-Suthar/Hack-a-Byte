// Import DEVICE_TYPES to avoid circular dependency
import { DEVICE_TYPES } from './app-constants';

// Device-specific configurations
export const DEVICE_CONFIGS = {
  [DEVICE_TYPES.HACKPHONE]: {
    name: 'HackPhone',
    description: 'iPhone-inspired hacking device',
    apps: [
      'Calculator',
      'Camera',
      'Clock',
      'Contacts',
      'Files',
      'Gallery',
      'Mail',
      'Maps',
      'Messages',
      'Music',
      'Phone',
      'Safari',
      'Weather',
      'YouTube',
      'AppMarket',
      'BlackMart',
      'NetworkScanner',
      'Sentinel',
      'Settings',
      'Snakee',
      'StockMarket',
      'Terminal',
    ],
    defaultWallpaper: '/hackphone/wallpaper/default.jpg',
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif'],
  },
  [DEVICE_TYPES.HACKBOOK_W95]: {
    name: 'HackBook W95',
    description: 'Full Windows 95 experience',
    apps: [
      'My Computer',
      'Internet Explorer',
      'Inbox',
      'Recycle Bin',
      'Minesweeper',
      'CD Player',
      'Notepad',
      'Calculator',
      'Paint',
      'BlackMart',
      // Add more W95-specific apps
    ],
    defaultWallpaper: '/hackbook-w95/wallpaper/default.jpg',
    supportedFormats: ['image/jpeg', 'image/png'],
  },
} as const;
