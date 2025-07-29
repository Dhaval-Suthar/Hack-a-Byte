# First Contract & Password Recovery Mission

## Overview
This mission introduces players to their first hacking challenge in the Win95 environment through a password recovery task that leads to a brute force mini-game.

## Mission Flow

### 1. Initial Email
- Player receives an email from "Ghost" with the first contract
- Email contains instructions to find and crack a ZIP file
- Located in the player's Inbox automatically upon first login

### 2. File Discovery
- ZIP file is located at: `C:\Documents\Old_Files\Archive.zip`
- Also includes a briefing text file in the same directory
- Files are discoverable through "My Computer" application

### 3. ZIP File Interaction
- Double-clicking the ZIP file opens the ZipArchive component
- Shows password protection dialog
- Offers two options:
  - Manual password entry
  - Brute force attack (launches mini-game)

### 4. Brute Force Mini-Game
- Interactive character-by-character password cracking simulation
- Player must click or press SPACE when correct character appears
- Increasing difficulty/speed as progress is made
- Password to crack: "GHOST" (5 characters)

### 5. Success & Rewards
- Successfully cracking reveals ZIP contents:
  - `client_data.txt` - Contains WinTalk 95 credentials
  - `recovery_log.txt` - Background story information
  - `readme.txt` - Context about the recovery
  
### 6. Next Steps
- Client data file contains login credentials for WinTalk 95:
  - Username: ghost_agent_001
  - Password: PHANTOM95
  - Server: secure.ghostnet.corp
  - Port: 2847

### 7. WinTalk 95 Connection
- Player can launch WinTalk 95 from desktop
- Use recovered credentials to connect
- Chat with "Cipher_Master" for next mission briefings

## Components Created

### New Applications
- **ZipArchive.tsx** - ZIP file viewer with password protection
- **BruteForceGame.tsx** - Interactive password cracking mini-game
- **WinTalk95.tsx** - Instant messenger application

### Updated Components
- **InboxMails.tsx** - Added Ghost's contract email
- **useFileSystem.tsx** - Added ZIP file and Old_Files directory
- **MyComputer.tsx** - Added ZIP file opening support
- **desktop.tsx** - Integrated new applications

## Mission Objectives
1. ✅ Create atmospheric retro email system
2. ✅ Implement password-protected ZIP file
3. ✅ Build interactive brute force mini-game
4. ✅ Create instant messenger for progression
5. ✅ Establish progression system with mission tracking

## File Structure
```
C:\Documents\Old_Files\
├── Archive.zip (password: GHOST)
│   ├── client_data.txt
│   ├── recovery_log.txt
│   └── readme.txt
└── READ_ME_FIRST.txt
```

## Technical Notes
- Uses Win95-style UI components throughout
- Sound effects for authentic retro experience
- Mission progress tracking via useMissionTracker hook
- Responsive design maintaining 4:3 aspect ratio aesthetic
- All components follow Win95 design language

## Difficulty Progression
- **Beginner**: Clear instructions and hints provided
- **Intermediate**: Requires exploration and file system navigation
- **Advanced**: Introduces basic "hacking" concepts through mini-game

This mission serves as the perfect introduction to the hacking simulation while maintaining the nostalgic Win95 atmosphere.
