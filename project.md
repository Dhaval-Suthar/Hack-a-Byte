# Hack-A-Byte Project Documentation

## Overview

Hack-A-Byte is a comprehensive cybersecurity education platform featuring two distinct gaming experiences:

1. **Base Game**: A free-to-play experience with 6 mini-games on the hackbook-w95 device
2. **CryptoHeist**: A premium, event-based competitive game played on hackbook-w95 (PC/laptop) and hackphone (mobile) devices

## 1. Base Game (hackbook-w95)

### Description
The base game is a free educational experience designed to introduce players to basic cybersecurity concepts through interactive mini-games.

### Features
- **Device**: hackbook-w95 (simulated Windows 95 desktop environment)
- **Content**: 6 mini-games covering various cybersecurity topics
- **Access**: Completely free to play
- **Purpose**: Educational introduction to cybersecurity fundamentals

### Mini-Games
1. **Game 1**: [Description]
2. **Game 2**: [Description]
3. **Game 3**: [Description]
4. **Game 4**: [Description]
5. **Game 5**: [Description]
6. **Game 6**: [Description]

## 2. CryptoHeist Game

### Description
CryptoHeist is a competitive, team-based cybersecurity simulation game where players participate in paid events to battle for cryptocurrency dominance.

### Game Structure
- **Event-Based**: Requires registration and payment
- **Team Play**: 1-6 players per team
- **Devices**: hackbook-w95 (PC/laptop) or hackphone (mobile)
- **Objective**: Achieve the highest cryptocurrency wallet balance

### Registration Process
1. **Event Registration**: Teams register for the event and make payment
2. **Device/Playspace/Code/Wallet Creation**: A Device is created based on registration preference then linked to a new playspace and which is accessed by new access code. also a wallet is created and linked with the team.
2. **Credentials Distribution**: Upon successful registration, participants receive:
   - Unique access code
   - Personal cryptocurrency wallet details (address and private key)
   - All information sent via email

### Playspace Access
1. **Access Code Usage**: Use the provided access code to enter the dedicated playspace
2. **Device Status**: When all the team members join, the device becomes online without the need to reload
3. **Team Coordination**: All team members must be in the same playspace

### Role Selection
Once in the playspace, team members select their specialized roles:
- **Professor (Planner)**: Strategic commander
- **Attacker (Tokyo/Rio)**: Cyber warfare operative
- **Defender (Berlin)**: System security specialist
- **Extractor (Nairobi/Denver)**: Resource acquisition specialist

### Device Launch
- After role assignment, the selected device becomes active
- Players launch their device to access the desktop/homescreen

### App Usage and Training
1. **Role-Specific Apps**: Each role has dedicated applications
2. **Interactive Demos**: Upon opening apps, players receive guided tutorials
3. **Skill Development**: Demos teach practical usage of tools and strategies

### Winning Condition
- **Primary Metric**: Cryptocurrency wallet balance
- **Team Victory**: The team with the highest balance at event conclusion wins
- **Real-Time Tracking**: Balances are monitored throughout the event

## 3. Roles and Tasks

### Professor (Planner) - Strategic Commander
**Primary Mission**: Coordinate overall team strategy and resource management

**Key Responsibilities:**
- Monitor all team members and current activities
- Select target devices for Attacker operations
- Manage and instruct team members with real-time guidance
- Monitor team's cryptocurrency balance and game status
- Make critical decision to end game early if team has sufficient currency
- Coordinate timing of all team operations for maximum efficiency

**Tasks:**
- Search for online devices in the sentinel app to get it's ip address, mac address, crypto balance, email, phone no, security level. (though the scan takes 1 minute to complete and he can only get details of one device per scan which he can choose from the list)
- Invest in the stock market app to increase crypto balance
- Check live top wallet addresses from the sentinel app
- Transfer money from one wallet address to another if the sender wallet's private key is known
- End the game if he thinks they have enough balance and don't want to risk (ending the game will make the device offline and will force all its member, redirect to the thanks for playing game and a option to play again by registering again)

### Attacker (Tokyo/Rio) - Cyber Warfare Operative
**Primary Mission**: Breach enemy defenses and gain control of opponent devices

**Key Responsibilities:**
- Launch various malware attacks (viruses, trojans, ransomware)
- Purchase and deploy specialized attack tools
- Attempt to destroy enemy devices or gain temporary control
- Extract data and resources during brief control windows
- Coordinate attack timing with team strategy

**Team Scaling:** 2 Attackers allowed in 5-6 player teams

### Malware Details

#### Virus Category
- **SysTrojan Pro** (ID: virus-001)  
    Advanced system infiltrator that embeds deep into the target OS. Provides persistent backdoor access with military-grade stealth capabilities. (requires mac address, ip address) (this virus have less chances of success but if it succeed, it destroys the target device which makes it under maintenance and force the players of the target device to redirect to the game over page)

- **StealthViral** (ID: virus-002)  
    Polymorphic virus that mutates to avoid detection. Self-replicating with advanced rootkit capabilities and signature evasion. (this virus needs the mac address and ip address of the target, once this virus is installed, the target device's berlin gets a alert that this virus is attacked and a window opens to tackle this virus, he needs to click the virus quickly before they cover the whole screen, give live updates on the attacker side too)

- **DataMiner X** (ID: virus-003)  
    Harvests credentials, browser data, and system information. Silent operation with encrypted exfiltration protocols.  (requires mac address, ip address) (this virus requires have less chance of success but gets the private key of the target device's team, also this attack can't be stop by berlin but he will be notified)

#### Worm Category
- **EmailSpread Pro** (ID: worm-001)  
    Self-propagating email worm. Harvests contact lists and spreads sophisticated phishing campaigns automatically across networks. (requires email address) (this worm attacks sends scam emails to all devices currently online, if anyone opens that email, the attacker device gets 10 bitcoins)

- **NetCrawler** (ID: worm-002)  
    Network-spreading worm that exploits vulnerabilities. Creates distributed botnet infrastructure for large-scale operations. (requires ip address) (this worm attacks sends scam emails and scam sms to all devices currently online, if anyone opens that email/sms, the attacker device gets 5 bitcoins)

- **SocialHook** (ID: worm-003)  
    Social media worm that spreads through messaging platforms. Advanced social engineering with contact harvesting. (this worm attacks sends scam sms to all devices currently online, if anyone opens that sms, the attacker device gets 10 bitcoins)
    
#### Ransomware Category
- **CryptoLocker Elite** (ID: ransom-001)  
    Military-grade file encryption ransomware. Deploys professional fake recovery sites with integrated payment systems. (requres ip address) (upon attack, berlin have to type the flashing words quickly to tackle the attack, if the target is affected by this ransomware, a window appears on the screen on all the team members screen to transfer requested amount of bitcoins to the attacker else the game ends right there)

- **FakeBank Portal** (ID: ransom-002)  
    Creates convincing banking site replicas. Advanced phishing with real-time credential capture and payment processing. (requires ip address) (it creates a 1 minute window for the target device, if any transactions happends in the target device in that time peroid the attacker get's that transaction amount) ( berlin should warm about this ransomware if he gets notified)

- **SystemLock Pro** (ID: ransom-003)  
    System-wide encryption with custom payment portal. Includes psychological pressure tactics and deadline enforcement. (requires ip address of the bank) (this is particularily for the bank it works 100 percent but you have to be the first to attack, if the attack is successful the bank device gets offline again for some random time like 5-10 mins)

### Bank System
The bank system is a special in-game feature that becomes available at random intervals, typically every 10-15 minutes, but with unpredictable timing to simulate real-world unpredictability. When online, it offers high-reward opportunities for the team. The bank system is a special in-game device that comes online at random intervals and appears in the Sentinel app for scanning. If an Attacker successfully attacks it using SystemLock Pro (ID: ransom-003), they receive 100 bitcoins as a reward.

### Defender (Berlin) - System Security Specialist
**Primary Mission**: Protect team's cryptocurrency wallet and infrastructure

**Key Responsibilities:**
- Set and manage strong passwords for device access
- Configure and maintain firewalls and encryption protocols
- Connect to secure networks and maintain safe connections
- Actively counter malware attacks and intrusions
- Monitor system health and respond to security alerts

**Tasks:**
- Secure the device by toggling vpn, encrpytion, etc
- Monitor and Tackle attacks

### Extractor (Nairobi/Denver) - Resource Acquisition Specialist
**Primary Mission**: Generate bitcoin through mining and opportunistic extraction

**Key Responsibilities:**
- Browse the internet searching for legitimate bitcoin faucets and opportunities
- operate bitcoin mining software
- Balance risk vs reward when accessing suspicious sites
- Optimize mining efficiency and resource allocation

**Team Scaling:** 2 Extractors allowed in 5-6 player teams

**Tasks:**
- open system generated emails to get rewards though not all are safe.
- open system generated sms to get rewards though not all are safe.
- browse safari to get bitcoins
- use the bitcoin mining software in which he have to arrange the numbers in the ascending order for each round he gets 10 bitcoins. he can even play the snake game to earn bitcoins.
