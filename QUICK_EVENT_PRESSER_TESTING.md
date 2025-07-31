# Quick Event Presser - Mini-Game 6 Testing Guide

## Overview
The Quick Event Presser is the final mini-game in the hack-a-byte challenge, designed to simulate disabling ShadowByte's remote wipe countdown. It creates an intense, panic-inducing environment where players must complete rapid-fire events under extreme time pressure.

## How to Access the Mini-Game

### Method 1: Through Game Progression (Recommended)
1. Complete all previous mini-games in sequence
2. Access the Secure Vault (Fingerprint Hack)
3. Successfully complete the fingerprint scanning
4. The remote wipe countdown will automatically activate
5. The Quick Event Presser will launch automatically

### Method 2: Direct Terminal Access (For Testing)
1. Open the Terminal app in HackBook W95
2. Type `help` to see all available commands
3. Type `emergency-abort` to trigger the emergency protocol
4. The Quick Event Presser will launch after a 2-second countdown

## Game Mechanics

### Objective
- Complete 10 quick events before the 30-second timer runs out
- Each successful event adds 2 seconds to the timer
- Each failed event removes 3 seconds from the timer

### Event Types
1. **Keypress Events**: Press specific keys (ESC, ENTER, SPACEBAR, CTRL+ALT+DEL)
2. **Click Events**: Click OK or CANCEL buttons
3. **Type Events**: Type specific words (ABORT, STOP)
4. **Right-Click Events**: Right-click on target areas
5. **Drag Events**: Drag windows to designated zones

### Visual Effects
- Screen flickering and color changes to simulate system instability
- Large countdown timer with color-coded urgency (white → yellow → red)
- Error messages and system glitches
- Progress bar showing completed events
- Animated system instability effects

### Audio Feedback
- Alarm sounds for new events
- Success chimes for completed events
- Error sounds for failed events
- Tick sounds during final countdown

## Success/Failure States

### Success (Complete 10 events)
- **WIPE ABORTED!** message displayed
- Congratulatory message about stopping ShadowByte
- Mission completion notification
- System reboot simulation

### Failure (Timer reaches zero)
- **SYSTEM WIPED** message displayed
- Option to try again or exit
- Mission failure notification

## Testing Scenarios

### Basic Functionality Test
1. Launch the game using `emergency-abort` command
2. Complete a few different event types
3. Verify timer counts down correctly
4. Verify success/failure states work

### Stress Test
1. Intentionally fail several events to test time penalty
2. Complete events quickly to test time bonus
3. Let timer run down to test urgency effects
4. Test all different event types

### Integration Test
1. Complete the full game progression
2. Access through Fingerprint Hack completion
3. Verify proper integration with mission system
4. Test final completion notifications

## Game Flow Integration

The Quick Event Presser serves as the climactic finale to the hack-a-byte experience:

1. **Setup**: Player has successfully infiltrated ShadowByte's systems
2. **Trigger**: Accessing the secure vault triggers detection
3. **Crisis**: Remote wipe protocol activates automatically
4. **Action**: Player must complete the emergency protocol
5. **Resolution**: Success prevents data loss and completes the mission

## Design Notes

- The game deliberately creates panic through visual and audio cues
- Difficulty increases as events must be completed faster over time
- The timer creates urgency while bonuses/penalties add strategy
- System "glitches" enhance the atmosphere of a failing system
- The win condition requires skill and speed rather than luck

## Technical Implementation

- Built with React hooks for state management
- Uses CSS animations for visual effects
- Implements multiple input types (keyboard, mouse, drag)
- Includes audio feedback system
- Integrates with existing HackBook W95 ecosystem

This mini-game successfully captures the intended atmosphere of "pure panic" and "race against the clock" while providing a satisfying conclusion to the overall hack-a-byte experience.
