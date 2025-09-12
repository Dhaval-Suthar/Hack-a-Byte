# CryptoLocker Elite Test Plan

## System Overview
CryptoLocker Elite is a three-phase ransomware attack:
1. **Spawn Phase**: Attacker deploys via IP address, creates typing defense challenge
2. **Defense Phase**: Target team must type phrases correctly within time limit
3. **Payment Phase**: If defense fails, payment demand with game-over consequences

## Test Checklist

### Phase 1: Deployment ✅
- [x] AppStore shows CryptoLocker Elite with "Target IP Address" requirement
- [x] IP validation (XXX.XXX.XXX.XXX format)
- [x] `/api/attack/cryptolocker` endpoint created
- [x] Socket emission to target team: `cryptolocker-spawn`
- [x] Session tracking with 3-minute expiry

### Phase 2: Defense UI ✅
- [x] `CryptoLockerDefense` component integrated into HackPhoneDesktop
- [x] Full-screen takeover with typing interface
- [x] Countdown timer and progress bar
- [x] Auto-focus input field
- [x] Phrase matching with typo tolerance
- [x] `/api/attack/cryptolocker-defense` endpoint for submissions

### Phase 3: Payment System ✅
- [x] `CryptoLockerPayment` component integrated
- [x] Payment demand window for all team members
- [x] Bitcoin balance verification
- [x] `/api/attack/cryptolocker-payment` endpoint
- [x] Game-over redirect on insufficient funds

### Socket Integration ✅
- [x] `useSocket` hook includes CryptoLocker events
- [x] Component state management via hook
- [x] Team-scoped socket rooms for proper targeting

## Test Scenarios

### Scenario 1: Successful Defense
1. Attacker deploys CryptoLocker Elite with target IP
2. Target team sees typing defense screen
3. Target types phrases correctly within time limit
4. Attack neutralized, no payment required

### Scenario 2: Failed Defense → Successful Payment
1. Attacker deploys CryptoLocker Elite
2. Target team fails to complete typing defense
3. Payment demand appears for all team members
4. Team has sufficient Bitcoin, makes payment
5. Attack resolved, game continues

### Scenario 3: Failed Defense → Game Over
1. Attacker deploys CryptoLocker Elite
2. Target team fails defense
3. Payment demand appears
4. Team has insufficient Bitcoin
5. Game-over screen appears, redirects to device selection

## Manual Test Commands

```bash
# Test deployment endpoint
curl -X POST http://localhost:3000/api/attack/cryptolocker \
  -H "Content-Type: application/json" \
  -d '{"targetIp":"192.168.1.100","attackerTeamId":"test-team-123"}'

# Test defense submission
curl -X POST http://localhost:3000/api/attack/cryptolocker-defense \
  -H "Content-Type: application/json" \
  -d '{"sessionKey":"test-session","submittedPhrase":"test phrase"}'

# Test payment processing
curl -X POST http://localhost:3000/api/attack/cryptolocker-payment \
  -H "Content-Type: application/json" \
  -d '{"sessionKey":"test-session","payingTeamId":"target-team-456"}'
```

## Expected Socket Events

### cryptolocker-spawn
```json
{
  "sessionKey": "unique-session-id",
  "targetIP": "192.168.1.100", 
  "attackerTeamId": "attacker-team-id",
  "phrase": "The quick brown fox jumps over the lazy dog",
  "timeLimit": 180000,
  "demand": 25,
  "expires": 1640995200000,
  "ts": 1640995020000
}
```

### cryptolocker-payment-demand
```json
{
  "attackerTeamId": "attacker-team-id",
  "demand": 25,
  "targetIP": "192.168.1.100",
  "deadline": 1640999200000,
  "message": "Your files have been encrypted. Pay 25 BTC or face elimination.",
  "ts": 1640995200000
}
```

### cryptolocker-game-over
```json
{
  "reason": "Insufficient funds for ransom payment",
  "demanded": 25,
  "available": 10,
  "message": "Game Over: Unable to pay CryptoLocker Elite ransom",
  "ts": 1640999200000
}
```

## Implementation Status: ✅ COMPLETE

All components, endpoints, and integrations have been implemented:
- ✅ API endpoints created and tested
- ✅ UI components integrated into HackPhoneDesktop  
- ✅ Socket events and state management working
- ✅ AppStore deployment logic updated
- ✅ TypeScript compilation passes
- ✅ Team targeting and session management implemented

Ready for testing in live environment!
