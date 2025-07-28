# Fingerprint Hack Mini-Game

## Overview
The Fingerprint Hack is a biometric bypass challenge game that serves as the final security test in the hack-a-byte project. Players must reconstruct a fragmented fingerprint pattern to gain access to ShadowByte's secure vault.

## Game Flow

### 1. Introduction Phase
- Shows the biometric scanner interface
- Displays "Accessing ShadowByte's secure vault..." message
- Loading animation with spinning icon

### 2. Security Scanning Phase
- Shows "BIOMETRIC MISMATCH!" warning
- Displays security breach notification dialog
- Flickering screen effect for atmosphere
- 2-second preparation time

### 3. Playing Phase
- **Objective**: Reconstruct the complete fingerprint by arranging 6 segments
- **Time Limit**: 45 seconds per attempt
- **Attempts**: 3 maximum attempts before lockdown
- **Controls**:
  - Drag segments from the palette to the scanner area
  - Double-click segments to rotate them
  - Segments snap to correct positions when close enough (within 40 pixels)

### 4. Success Sequence
- **Access Granted**: Shows vault unlock animation
- **Vault Breached**: Triggers security alarm with flashing red background
- **Remote Wipe**: Final warning screen with mission completion

### 5. Failure States
- **Time Up**: Resets puzzle with new configuration, consumes one attempt
- **Max Attempts**: Shows lockdown screen and closes game

## Visual Elements

### Fingerprint Patterns
The game uses 6 different SVG patterns:
1. **Whorl**: Circular spiral pattern
2. **Arch**: Simple curved arch
3. **Loop**: Curved loop pattern
4. **Ridge**: Straight ridge lines
5. **Spiral**: Complex spiral
6. **Parallel Lines**: Straight parallel ridges

### Scanner Interface
- Black background with green scanning lines
- Base fingerprint outline (3 concentric ellipses)
- Real-time scanning overlay animation
- Progress indicator showing completed segments

### Audio Effects
- **Click**: Segment interaction sounds
- **Ding**: Success and notification sounds
- **Error**: Failed attempt alarm
- **Alarm**: Continuous alarm during vault breach

## Game Mechanics

### Segment Placement
- Segments must be placed within 40 pixels of correct position
- Rotation must be within 30 degrees of correct angle
- Both position and rotation must be correct for segment to be marked as complete

### Difficulty Scaling
- Segments start with random rotations
- Each failed attempt may slightly change segment positions
- Time pressure increases tension

### Win Condition
All 6 segments must be correctly placed and rotated within the time limit.

## Integration

### Mission Flow
1. Triggered after completing the Neural Network Analyzer
2. Unlocks the "Secure Vault" desktop icon
3. Completes the 'biometric_bypass' mission
4. Triggers the next phase of the storyline

### Event System
- Listens for `neuralNetworkCompleted` event
- Dispatches `missionComplete` event with `biometric_bypass` ID
- Shows vault unlock notification

## Atmosphere & Story
The game creates high-stakes tension through:
- Ominous security warnings
- Flickering screen effects
- Time pressure with countdown
- Multiple attempt system with consequences
- Alarming audio feedback
- Classic Win95 error dialog aesthetics

The narrative emphasizes this is ShadowByte's most secure vault, making success feel significant and failure genuinely threatening.
