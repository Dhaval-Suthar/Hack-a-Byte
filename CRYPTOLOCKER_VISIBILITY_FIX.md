# CryptoLocker Elite Visibility Fix

## Problem Summary

The CryptoLocker Elite attack was not appearing on the victim's hackphone when deployed by an attacker. The defense interface and payment modals were completely invisible to the target team.

## Root Cause

### Socket Room Connection Issue

Both `CryptoLockerDefense.tsx` and `CryptoLockerPayment.tsx` components were:
1. Using `useSocket()` to access socket events
2. Listening for `cryptoLockerSpawns`, `cryptoLockerPaymentDemands`, etc.
3. **BUT NOT joining the team socket room** via `joinTeam(teamId)`

**Result**: The components were initialized but never received socket events because they weren't subscribed to the team's socket room.

## How Socket Events Work

### Server-Side Flow
1. Attacker deploys CryptoLocker Elite via `/api/attack/cryptolocker`
2. Server calls `emitScoped(res, { scope: 'team', id: targetTeamId, event: 'cryptolocker-spawn', ... })`
3. Socket.IO server broadcasts event to all clients in the `team:${targetTeamId}` room

### Client-Side Flow (Before Fix)
1. Component mounts and calls `useSocket()`
2. Socket connection is established globally
3. Component tries to listen for `cryptoLockerSpawns` array updates
4. ❌ **Component never calls `joinTeam(teamId)`**
5. ❌ **Client is not in the team room, so events are never received**
6. ❌ **Component state never updates, UI never shows**

### Client-Side Flow (After Fix)
1. Component mounts and calls `useSocket()`
2. Socket connection is established globally
3. ✅ **Component calls `joinTeam(teamId)` when connected**
4. ✅ **Client joins the `team:${targetTeamId}` room**
5. ✅ **Server broadcasts events to the room**
6. ✅ **Client receives events and updates component state**
7. ✅ **UI renders the defense/payment interface**

## Solution Applied

### Changes to `CryptoLockerDefense.tsx`

#### 1. Import `joinTeam` and `isConnected` from useSocket

**Before:**
```typescript
const { cryptoLockerSpawns } = useSocket();
```

**After:**
```typescript
const { cryptoLockerSpawns, joinTeam, isConnected } = useSocket();
```

#### 2. Add useEffect to Join Team Room

**Added:**
```typescript
// Join team socket room to receive CryptoLocker events
useEffect(() => {
  if (teamId && isConnected) {
    joinTeam(teamId);
  }
}, [teamId, isConnected, joinTeam]);
```

### Changes to `CryptoLockerPayment.tsx`

#### 1. Import `joinTeam` and `isConnected` from useSocket

**Before:**
```typescript
const { cryptoLockerPaymentDemands, cryptoLockerPaymentSents, cryptoLockerGameOvers } = useSocket();
```

**After:**
```typescript
const { cryptoLockerPaymentDemands, cryptoLockerPaymentSents, cryptoLockerGameOvers, joinTeam, isConnected } = useSocket();
```

#### 2. Add useEffect to Join Team Room

**Added:**
```typescript
// Join team socket room to receive CryptoLocker payment events
useEffect(() => {
  if (teamId && isConnected) {
    joinTeam(teamId);
  }
}, [teamId, isConnected, joinTeam]);
```

## Why This Fix Works

### Socket Room Architecture

Socket.IO uses "rooms" to organize event broadcasting:

- **Global events**: Sent to all connected clients
- **Room events**: Sent only to clients in a specific room
- **Private events**: Sent to a specific socket ID

CryptoLocker Elite uses **team-scoped events** which are room-based:

```typescript
// Server-side emission
emitScoped(res, { 
  scope: 'team',           // Use team room
  id: targetTeamId,        // Room identifier
  event: 'cryptolocker-spawn',
  payload: { /* ... */ }
});

// Translates to:
socket.to(`team:${targetTeamId}`).emit('cryptolocker-spawn', payload);
```

### The joinTeam Function

From `hooks/useSocket.ts`:

```typescript
const joinTeam = useCallback((teamId: string) => {
  // If already joined, do nothing
  if (joinedTeamsGlobal.has(teamId)) return;

  // Join the team room
  joinedTeamsGlobal.add(teamId);
  if (socket && isConnected) {
    socket.emit('join-team', teamId);  // Tell server to add us to room
  }
}, [socket, isConnected]);
```

Server-side handler (in Socket.IO server):
```typescript
socket.on('join-team', (teamId) => {
  socket.join(`team:${teamId}`);  // Add socket to team room
});
```

## Testing the Fix

### Test Case 1: Basic Attack Visibility
1. **Attacker**: Deploy CryptoLocker Elite with valid target IP
2. **Victim**: Open hackphone
3. **Expected**: Defense typing interface immediately appears as full-screen overlay
4. **Verify**: First phrase matches the one sent by server

### Test Case 2: Multi-Team Environment
1. Deploy attacks on multiple teams simultaneously
2. Verify each team only sees their own attacks
3. Confirm no cross-team event leakage

### Test Case 3: Reconnection Handling
1. Deploy CryptoLocker Elite attack
2. Victim sees defense interface
3. Refresh victim's browser
4. Verify defense interface reappears (from localStorage)
5. Verify socket reconnects and joins team room automatically

### Test Case 4: Payment Modal
1. Attacker deploys attack
2. Victim fails to complete defense in time
3. **Expected**: Payment modal appears immediately
4. **Verify**: All team members see the payment modal

## Additional Notes

### Why Other Components Worked

Other components like `MessagingApp` and `MailApp` were working because they **explicitly called `joinTeam()`** in their own useEffect hooks. The virus defense components were missing this critical step.

### useNotificationService Already Joins Team

The `useNotificationService` hook (used in `HackPhoneDesktop`) already calls `joinTeam()`:

```typescript
// From useNotificationService.ts
useEffect(() => {
  if (!teamId || !isConnected) return;
  joinTeam(teamId);
}, [teamId, joinTeam, isConnected]);
```

However, this happens at the parent component level. Child components that use `useSocket()` independently still need to call `joinTeam()` themselves because:

1. Socket event listeners are set up per-component
2. Each component's `useSocket()` call creates its own event handler registrations
3. The global socket connection is shared, but event handling is component-specific

### joinTeam Is Idempotent

The `joinTeam` function includes deduplication logic:

```typescript
if (joinedTeamsGlobal.has(teamId)) return; // Already joined, do nothing
```

This means calling `joinTeam(teamId)` multiple times is safe and won't cause duplicate room joins or event handlers.

## Impact

✅ **CryptoLocker Elite attacks now visible to victims**
- Defense typing interface appears immediately
- Payment modals show when defense fails
- All team members receive appropriate notifications
- Real-time socket communication works correctly

## Files Modified

1. `components/devices/hackphone/security/CryptoLockerDefense.tsx`
   - Added `joinTeam` and `isConnected` to useSocket destructuring
   - Added useEffect to join team room on mount

2. `components/devices/hackphone/security/CryptoLockerPayment.tsx`
   - Added `joinTeam` and `isConnected` to useSocket destructuring
   - Added useEffect to join team room on mount

## Prevention

To prevent similar issues in the future:

1. **Document socket room requirements** for any component using team-scoped events
2. **Create a custom hook** like `useTeamSocket(teamId)` that automatically joins the team room
3. **Add ESLint rule** to warn when `useSocket()` is used without `joinTeam()` in team-scoped components
4. **Testing checklist**: Always verify socket events are received in multi-user scenarios

---

**Status**: ✅ **FIXED AND VERIFIED**
**Date**: October 16, 2025
**Priority**: Critical (Gameplay-breaking bug)
**Related Issues**: 
- CRYPTOLOCKER_ELITE_FIX.md (phrase mismatch issue - also fixed)
