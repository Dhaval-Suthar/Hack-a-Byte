# Device Maintenance and Protection System

## Overview
Implemented comprehensive device protection that blocks access when devices are offline or under maintenance, with proper user redirection and cleanup.

## Components Created

### 1. Device Status Guard (`DeviceStatusGuard.tsx`)
- **Purpose**: Checks device status before allowing access to any device functionality
- **Features**:
  - Validates device MAC address from URL or localStorage
  - Calls `/api/device/online-sync` to check status
  - Redirects to appropriate pages based on device state
  - Periodic status checks every 30 seconds
  - Handles missing device/playspace data

### 2. Maintenance Page (`/device-maintenance`)
- **Purpose**: Informs users when their device is compromised/under maintenance
- **Features**:
  - Clear explanation of what happened (SysTrojan Pro attack)
  - Recovery time estimate (2-3 minutes)
  - Options to play again with new device or return home
  - Device restoration check button

### 3. Offline Page (`/device-offline`)
- **Purpose**: Handles devices that are offline or disconnected
- **Features**:
  - Connection troubleshooting information
  - Retry connection functionality
  - New device selection option

### 4. Game Over Listener (`GameOverListener.tsx`)
- **Purpose**: Listens for critical game-over events and forces immediate redirects
- **Features**:
  - Monitors game-over socket events for the user's team
  - Automatically clears device data when compromised
  - Forces redirect to maintenance page

## Integration Points

### Updated HackPhoneDesktop
- Wrapped entire device interface with `DeviceStatusGuard`
- Added `GameOverListener` for real-time event handling
- Maintains existing functionality while adding protection

### Enhanced SysTrojan Pro API
- Now emits team-scoped events to target team room
- Sends immediate game-over event with device maintenance redirect
- Better event targeting for affected users

## User Flow

1. **Normal Access**: User visits `/hackphone` → DeviceStatusGuard checks status → Allows access if device is online
2. **Maintenance State**: Device gets compromised → SysTrojan emits game-over event → GameOverListener triggers redirect → User sees maintenance page
3. **Direct Access Blocked**: User tries to access `/hackphone` while device is offline/maintenance → DeviceStatusGuard redirects to appropriate error page
4. **Recovery**: User can check device status, play with new device, or wait for automatic recovery

## Security Features

- **No Bypass**: All device routes are protected by the status guard
- **Data Cleanup**: localStorage is cleared when device is compromised
- **Real-time Updates**: Continuous monitoring prevents stale access
- **Multiple Entry Points**: Handles URL access, direct navigation, and localStorage scenarios

## Testing Scenarios

1. **SysTrojan Attack**: Deploy SysTrojan Pro → Target device should immediately redirect to maintenance page
2. **Direct URL Access**: While device is in maintenance, try accessing `/hackphone` → Should redirect to maintenance page
3. **Missing Data**: Clear localStorage and try accessing device → Should redirect to device selection
4. **Recovery**: Wait for device recovery or check status → Should allow access when device is restored

## API Endpoints Used

- `GET /api/device/online-sync?deviceId={mac}` - Check device status
- `POST /api/attack/systrojan` - Enhanced to emit team-scoped events
- Team room socket events for real-time updates

This system ensures that when a device is compromised, users cannot continue playing and are properly informed about what happened and their options to continue.
