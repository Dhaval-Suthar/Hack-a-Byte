# Random Email/SMS System Implementation

## Overview

I have successfully implemented a comprehensive system that sends random emails and SMS messages at random intervals to online hackphone devices, which extractors (Nairobi/Denver) can check for potential rewards.

## What Was Implemented

### 1. Background Message Generator (`lib/randomMessageGenerator.ts`)

- **Email Templates**: Created 7 different email templates including:
  - Legitimate reward emails (BitRewards, CryptoFaucet, Mining Pool dividends)
  - Scam emails (fake security alerts, lottery scams, IRS scams)
  - Neutral emails (newsletters, market updates)

- **SMS Templates**: Created 5 different SMS templates including:
  - Legitimate reward SMS (BTC alerts, faucet drips)
  - Scam SMS (fake bank alerts, phishing links)
  - Neutral SMS (market updates)

- **Weighted Random System**: Each template has a probability weight determining how often it appears
- **Device Targeting**: Automatically identifies online hackphone devices by querying teams with online hackphone devices
- **Reward/Penalty System**: Messages can contain rewards (BTC gains) or penalties (BTC losses) for scams

### 2. Background Scheduler Integration

- **State Sweeper Integration**: Added the random message system to the existing `lib/stateSweeper.ts`
- **Random Intervals**: System runs every 2-5 minutes with randomized scheduling
- **Message Scheduling**: Messages are scheduled with random delays (0-15 minutes) before delivery

### 3. API Endpoints

- **`/api/extract/get-messages`**: Fetches system-generated emails and SMS for a team
- **`/api/extract/open-message`**: Processes message opening, applies rewards/penalties, and updates team balance
- **`/api/team/get-team-id`**: Gets team ID from playspace ID for proper message targeting

### 4. Enhanced Mail and Messaging Apps

#### MailApp Updates (`components/devices/hackphone/apps/MailApp.tsx`)
- **Real-time Integration**: Fetches system emails every 30 seconds
- **Visual Indicators**: Shows scam warnings (⚠️), reward indicators (💰), and processing status (✅/❌)
- **Reward Processing**: Clicking on system emails processes rewards/losses automatically
- **Notification System**: Shows success/error messages when opening emails
- **Mixed Content**: Combines static sample emails with dynamic system emails

#### MessagingApp Updates (`components/devices/hackphone/apps/MessagingApp.tsx`)
- **SMS Integration**: Groups system SMS by sender into conversations
- **Visual Indicators**: Color-coded messages (red for scams, green for rewards)
- **Touch Processing**: Tap system messages to process rewards/penalties
- **Conversation Management**: System SMS appears as separate conversations from regular contacts
- **Real-time Updates**: Automatically refreshes SMS messages every 30 seconds

### 5. System Architecture Updates

- **Type System**: Extended interfaces to support system messages with reward/scam indicators
- **Router Integration**: Updated HackPhoneAppsRouter to fetch and pass team IDs to apps
- **Playspace Integration**: Connected playspace IDs to team IDs for proper message targeting
- **Socket Integration**: Real-time updates for balance changes and extractor events

## How It Works

### For Extractors (Nairobi/Denver Role):

1. **Automatic Delivery**: System automatically sends random emails and SMS to online hackphone devices
2. **Mixed Content**: Players see both legitimate and scam messages mixed with regular content
3. **Risk/Reward**: Players must decide which messages are safe to open
4. **Immediate Feedback**: Opening messages provides instant results:
   - **Legitimate messages**: Gain BTC rewards (25-100 BTC)
   - **Scam messages**: Lose BTC (20-150 BTC)
   - **Neutral messages**: No impact

### Visual Cues:
- **Mail App**: Border colors indicate message types (red=scam, green=reward)
- **SMS App**: Message bubbles are color-coded and show warnings
- **Processing Status**: Shows if message was already processed
- **Notifications**: Pop-up confirmations for all actions

### For Game Balance:
- **Weighted Distribution**: More scam messages than legitimate ones (realistic scenario)
- **Variable Rewards**: Rewards and penalties are randomized within ranges
- **Team Coordination**: All team members can see the same messages
- **Strategic Decisions**: Teams must decide who opens which messages

## Testing the System

1. **Start the server**: `pnpm dev`
2. **Access a hackphone device** with a team in an active game
3. **Check Mail and Messages apps** - system messages should appear within 2-5 minutes
4. **Open messages** to see reward/penalty processing in action
5. **Monitor balance changes** in real-time

## Technical Features

- **Background Processing**: Non-blocking message generation and delivery
- **Database Integration**: Uses existing Notification model for message storage
- **Team Integration**: Properly links to team wallet balances
- **Socket Integration**: Real-time updates for immediate feedback
- **Error Handling**: Graceful fallbacks and error management
- **TypeScript Support**: Fully typed system with proper interfaces

The system is now ready for extractors to receive and process random emails and SMS messages, adding an engaging risk/reward mechanic to the CryptoHeist game experience.
