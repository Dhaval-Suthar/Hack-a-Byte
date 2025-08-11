# HackPhone - Retro iOS Interface

A retro iPhone-inspired interface for the HackaByte platform, featuring:

## Features

### 🎨 Authentic iOS Design
- Classic iOS home screen with app grid layout
- Retro status bar with signal, time, and battery indicators
- Smooth animations and transitions
- Glassmorphism effects on UI elements
- iOS-style app icons with gradients and shine effects

### 📱 Core Interface Elements
- **Boot Screen**: Apple-style boot animation with loading progress
- **Lock Screen**: iOS-inspired lock screen with time display and gradient background
- **Home Screen**: 4x4 app grid with dock containing core apps
- **Status Bar**: Signal strength, carrier, time, and battery level

### 🔧 Built-in Apps
- **Terminal**: Command-line interface with hacker-themed commands
- **Files**: iOS-style file browser with folders and files
- **Network Scanner**: Network scanning tool with device discovery
- **Crypto Toolkit**: Hash generators, base64 encoder/decoder, key generator
- **Settings**: System configuration (planned)
- **Games**: Integration with HackaByte game system (planned)

### 🔒 Authentication & Security
- **Slide to Unlock**: Classic iPhone-style slide to unlock interface
- **Smart Lock Screen**: Automatically shows slide to unlock on first access
- **Credential Fallback**: Alternative credential entry for secured access
- Playspace-based user authentication
- Device-specific login for managed environments
- Secure session management
- Auto-login for returning users

## Technical Implementation

### Components Structure
- `HackPhoneBootScreen`: Apple-style boot animation
- `HackPhoneLoginScreen`: Lock screen with authentication
- `HackPhoneHomeScreen`: Main interface with app grid
- `HackPhoneDesktop`: Main container managing app states
- `HackPhoneApps`: Individual app implementations

### Key Features
- Responsive design optimized for mobile devices
- TypeScript for type safety
- Tailwind CSS for styling
- Next.js 15 App Router integration
- Real-time clock updates
- Smooth page transitions

## Usage

Navigate to `/hackphone/login` to access the interface. The system will:

1. Show boot animation (3 seconds)
2. Check for existing authentication
3. Display **slide to unlock** interface for first-time access
4. Allow credential entry via "Enter credentials instead" button
5. Present home screen after successful authentication or unlock

### Slide to Unlock Features
- **Touch/Mouse Support**: Works with both touch gestures and mouse drag
- **Visual Feedback**: Animated slider with shine effect
- **Progressive Unlock**: Must slide 80% to trigger unlock
- **Auto Reset**: Returns to start position if not completed
- **Smooth Animation**: CSS transitions for fluid movement

## Future Enhancements

- Additional native-style apps
- Notification system
- Control Center
- App Store for hacktools
- Multi-page app organization
- Gesture-based navigation
- Dark/Light theme switching
