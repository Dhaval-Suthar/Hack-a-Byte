/**
 * Game Configuration
 * 
 * This file contains the core configuration for the HackaByte game,
 * including missions, challenges, progression paths, and unlockable items.
 */

interface Objective {
  id: string;
  description: string;
  validationFunction?: string; // Name of function to validate completion
  manualValidation?: boolean; // If true, requires manual marking as complete
}

interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'file_system' | 'encryption' | 'social_engineering' | 'network' | 'terminal' | 'puzzle';
  difficulty: number; // 1-5
  chapter: number;
  objectives: Objective[];
  hints: string[];
  reward: {
    xp: number;
    unlocksApplication?: string;
    credits?: number;
    skillPoints?: {
      [key: string]: number; // e.g., {'encryption': 5}
    };
  };
  prerequisites?: {
    missions?: string[]; // IDs of missions that must be completed first
    applications?: string[]; // Applications that must be unlocked
    skills?: {
      [key: string]: number; // Minimum skill levels required, e.g., {'encryption': 3}
    };
  };
  emailTrigger?: {
    sender: string;
    subject: string;
    body: string;
  };
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  difficulty: number;
  timeLimit?: number; // in seconds, if applicable
  reward: {
    xp: number;
    credits: number;
    skillPoints?: {
      [key: string]: number;
    };
  };
}

interface ProgressionPath {
  name: string;
  description: string;
  skills: string[];
  specializations: {
    name: string;
    description: string;
    requiredSkillLevels: {
      [key: string]: number;
    };
    bonuses: {
      description: string;
      effect: string;
    }[];
  }[];
}

interface Application {
  id: string;
  name: string;
  icon: string;
  description: string;
  chapter: number;
  requiredXP?: number;
  cost?: number;
  features: {
    name: string;
    description: string;
    availableAtStart: boolean;
    unlocksAfterMission?: string;
  }[];
}

// PVP game mode configurations
interface PVPMode {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  players: string; // e.g., "2-8 players"
  duration: string; // e.g., "10 minutes"
  rules: string[];
  rewards: {
    winnerXp: number;
    participationXp: number;
    skillPoints?: {
      [key: string]: number;
    };
  };
  available: boolean;
}

// PVP Mode configurations
export const pvpModes: PVPMode[] = [
  {
    id: 'koth',
    name: 'King of the Hill',
    description: 'Secure a central server and defend against attackers. Points earned for successful defense time.',
    difficulty: 'beginner',
    players: '4-10 players',
    duration: '10 minutes',
    rules: [
      'One team starts as defenders with control of the central server',
      'Attackers attempt to breach the server security',
      'When security reaches 0, attackers take control',
      'Points awarded for time in control and successful attacks/defenses',
      'Team with the most points at the end wins'
    ],
    rewards: {
      winnerXp: 500,
      participationXp: 100,
      skillPoints: {
        'defense': 5,
        'attack': 5
      }
    },
    available: true
  },
  {
    id: 'ctf',
    name: 'Capture the Flag',
    description: 'Hunt for hidden flags in opponent systems while defending your own flags with creative protections.',
    difficulty: 'intermediate',
    players: '4-12 players',
    duration: '15 minutes',
    rules: [
      'Each team has a flag at their base',
      'Objective is to steal the opponent\'s flag and bring it to your base',
      'You can only capture if your flag is at your base',
      'Teams earn points for captures and defensive upgrades',
      'Team with the most points at the end wins'
    ],
    rewards: {
      winnerXp: 750,
      participationXp: 150,
      skillPoints: {
        'stealth': 8,
        'defense': 6,
        'strategy': 5
      }
    },
    available: true
  },
  {
    id: 'stealth',
    name: 'Stealth Operations',
    description: 'Points awarded for undetected infiltration. Set up detection systems to catch opponents.',
    difficulty: 'advanced',
    players: '2-6 players',
    duration: '20 minutes',
    rules: [
      'Infiltrate systems without triggering alerts',
      'Set up detection traps to catch opposing infiltrators',
      'Points awarded for successful undetected infiltration',
      'Points deducted for being detected',
      'Infiltrator with most points wins'
    ],
    rewards: {
      winnerXp: 1000,
      participationXp: 200,
      skillPoints: {
        'stealth': 15,
        'detection': 10,
        'tactics': 8
      }
    },
    available: false
  }
];

export const MISSIONS: Mission[] = [
  // Chapter 1: Accessing the System
  {
    id: 'welcome_to_hackbook',
    title: 'Welcome to HackBook',
    description: 'Your first day as a cyber security trainee. Learn to navigate the system.',
    type: 'file_system',
    difficulty: 1,
    chapter: 1,
    objectives: [
      { id: 'obj1', description: 'Open My Computer from the desktop', validationFunction: 'checkMyComputerOpened' },
      { id: 'obj2', description: 'Open the Readme.txt file in C:\\Documents', validationFunction: 'checkReadmeOpened' },
      { id: 'obj3', description: 'Close the Readme file', validationFunction: 'checkReadmeClosed' }
    ],
    hints: [
      'Look for the My Computer icon on your desktop.',
      'Double-click on the C: drive icon when My Computer opens.',
      'Navigate to the Documents folder.',
      'Find and double-click on Readme.txt.',
      'To close the file, click the X in the top-right corner of the Notepad window.'
    ],
    reward: {
      xp: 50,
      credits: 10,
      skillPoints: {
        'computer_basics': 1
      }
    },
    emailTrigger: {
      sender: 'mentor@hackbyte.org',
      subject: 'Welcome to Your First Day',
      body: 'Welcome to your first day of training!\n\nI\'m your mentor, and I\'ll be guiding you through your journey to becoming a skilled cybersecurity expert. To get started, let\'s make sure you can navigate the basic system.\n\nYour first task is simple: open My Computer and find the Readme.txt file in the Documents folder.\n\nGood luck!\n\n- Your Mentor'
    }
  },
  {
    id: 'first_terminal_commands',
    title: 'Terminal Basics',
    description: 'Learn to use command line interface to interact with the system.',
    type: 'terminal',
    difficulty: 1,
    chapter: 1,
    objectives: [
      { id: 'obj1', description: 'Open the Terminal application', validationFunction: 'checkTerminalOpened' },
      { id: 'obj2', description: 'Use the "help" command to view available commands', validationFunction: 'checkHelpCommand' },
      { id: 'obj3', description: 'Use "ls" or "dir" command to list files', validationFunction: 'checkListCommand' },
      { id: 'obj4', description: 'Use "cd Documents" to change directory', validationFunction: 'checkCdCommand' },
      { id: 'obj5', description: 'Use "cat secret.txt" or "type secret.txt" to view a file', validationFunction: 'checkCatCommand' }
    ],
    hints: [
      'Open the Terminal from the Start Menu or desktop.',
      'Type "help" and press Enter to see available commands.',
      'Type "ls" (Linux/Mac style) or "dir" (Windows style) to list files.',
      'Type "cd Documents" to change to the Documents directory.',
      'Use "cat secret.txt" or "type secret.txt" to view the contents of the file.'
    ],
    reward: {
      xp: 100,
      unlocksApplication: 'Terminal',
      credits: 25,
      skillPoints: {
        'terminal': 2,
        'computer_basics': 1
      }
    },
    prerequisites: {
      missions: ['welcome_to_hackbook']
    },
    emailTrigger: {
      sender: 'mentor@hackbyte.org',
      subject: 'Learning the Command Line',
      body: 'Great job navigating the file system using the graphical interface!\n\nNow it\'s time to learn how to use the Terminal. Real hackers need to be comfortable with command line interfaces, as they provide more power and flexibility than graphical ones.\n\nI\'ve unlocked the Terminal application for you. Open it from the Start Menu and try out some basic commands.\n\nRemember, if you get stuck, type "help" to see available commands.\n\n- Your Mentor'
    }
  },
  
  // Chapter 1: Hidden Files Challenge
  {
    id: 'hidden_files',
    title: 'Finding Hidden Data',
    description: 'Learn to find hidden files and extract sensitive information.',
    type: 'file_system',
    difficulty: 2,
    chapter: 1,
    objectives: [
      { id: 'obj1', description: 'Find the hidden folder in C:\\', validationFunction: 'checkHiddenFolderFound' },
      { id: 'obj2', description: 'Locate the password file within the hidden folder', validationFunction: 'checkPasswordFileFound' },
      { id: 'obj3', description: 'Use Notepad to view the password', validationFunction: 'checkPasswordViewed' },
      { id: 'obj4', description: 'Enter the discovered password in the Terminal', validationFunction: 'checkPasswordEntered' }
    ],
    hints: [
      'Hidden folders may not be visible by default.',
      'Check system folders carefully.',
      'Look for options to show hidden files.',
      'Try using the Terminal to list all files including hidden ones with "ls -a" or "dir /a".',
      'The password must be entered exactly as found in the file.'
    ],
    reward: {
      xp: 150,
      credits: 50,
      skillPoints: {
        'reconnaissance': 2,
        'file_system': 1
      }
    },
    prerequisites: {
      missions: ['first_terminal_commands']
    }
  },
  
  // Chapter 2: System Breach
  {
    id: 'simple_encryption',
    title: 'Breaking Simple Encryption',
    description: 'Learn to decrypt a simply encrypted message using Caesar cipher.',
    type: 'encryption',
    difficulty: 2,
    chapter: 2,
    objectives: [
      { id: 'obj1', description: 'Find the encrypted file in C:\\Documents\\Encrypted', validationFunction: 'checkEncryptedFileFound' },
      { id: 'obj2', description: 'Open the file and identify the encryption type', manualValidation: true },
      { id: 'obj3', description: 'Decrypt the message using Caesar cipher (hint: key is 3)', manualValidation: true },
      { id: 'obj4', description: 'Enter the decrypted passphrase in the Terminal', validationFunction: 'checkPassphraseEntered' }
    ],
    hints: [
      'Caesar cipher is a simple substitution cipher where each letter is shifted by a fixed number in the alphabet.',
      'For a key of 3, "A" becomes "D", "B" becomes "E", and so on.',
      'To decrypt, shift each letter backward by the key amount.',
      'For example, with key 3, "KHOOR" decrypts to "HELLO".',
      'The passphrase is case-sensitive, so pay attention to capitalization.'
    ],
    reward: {
      xp: 200,
      unlocksApplication: 'InternetExplorer',
      credits: 75,
      skillPoints: {
        'cryptography': 3,
        'problem_solving': 1
      }
    },
    prerequisites: {
      missions: ['hidden_files']
    },
    emailTrigger: {
      sender: 'cryptomaster@hackbyte.org',
      subject: 'Encryption Challenge',
      body: 'Hello recruit,\n\nIt\'s time to test your basic cryptography skills. I\'ve placed an encrypted file in the Documents\\Encrypted folder.\n\nThe file contains a message encrypted with a simple Caesar cipher. Your task is to decrypt it and find the hidden passphrase.\n\nOnce you have the passphrase, enter it in the Terminal to prove you\'ve solved the challenge.\n\nHappy decrypting!\n\n- CryptoMaster'
    }
  }
];

export const APPLICATIONS: Application[] = [
  {
    id: 'notepad',
    name: 'Notepad',
    icon: 'notepad.png',
    description: 'Simple text editor for viewing and editing files.',
    chapter: 1,
    features: [
      {
        name: 'Text Editing',
        description: 'Create and edit text files',
        availableAtStart: true
      },
      {
        name: 'File Save/Open',
        description: 'Save and open text files',
        availableAtStart: true
      }
    ]
  },
  {
    id: 'terminal',
    name: 'Terminal',
    icon: 'terminal.png',
    description: 'Command line interface for advanced system interaction.',
    chapter: 1,
    requiredXP: 100,
    features: [
      {
        name: 'Basic Commands',
        description: 'Navigate directories, list files, view file contents',
        availableAtStart: true
      },
      {
        name: 'Network Commands',
        description: 'Ping, nslookup, traceroute',
        availableAtStart: false,
        unlocksAfterMission: 'network_basics'
      },
      {
        name: 'Advanced Commands',
        description: 'Process management, system information',
        availableAtStart: false,
        unlocksAfterMission: 'system_admin'
      }
    ]
  },
  {
    id: 'internet_explorer',
    name: 'Internet Explorer',
    icon: 'ie.png',
    description: 'Web browser for accessing websites and network resources.',
    chapter: 2,
    requiredXP: 200,
    features: [
      {
        name: 'Web Browsing',
        description: 'Access websites',
        availableAtStart: true
      },
      {
        name: 'Downloads',
        description: 'Download files from the web',
        availableAtStart: false,
        unlocksAfterMission: 'web_security'
      }
    ]
  },
  {
    id: 'email_client',
    name: 'HackMail',
    icon: 'email.png',
    description: 'Email client for sending and receiving messages.',
    chapter: 2,
    requiredXP: 250,
    features: [
      {
        name: 'Receive Emails',
        description: 'Receive mission updates and hints',
        availableAtStart: true
      },
      {
        name: 'Send Emails',
        description: 'Communicate with NPCs',
        availableAtStart: true
      },
      {
        name: 'Attachments',
        description: 'Send and receive file attachments',
        availableAtStart: false,
        unlocksAfterMission: 'email_security'
      }
    ]
  },
  {
    id: 'codebreaker',
    name: 'CodeBreaker',
    icon: 'codebreaker.png',
    description: 'Tool for cryptography and code breaking challenges.',
    chapter: 3,
    requiredXP: 500,
    cost: 100,
    features: [
      {
        name: 'Basic Ciphers',
        description: 'Caesar, substitution, and transposition ciphers',
        availableAtStart: true
      },
      {
        name: 'Hash Functions',
        description: 'MD5, SHA1, SHA256 hashing',
        availableAtStart: false,
        unlocksAfterMission: 'hash_cracking'
      },
      {
        name: 'Advanced Encryption',
        description: 'RSA, AES encryption and decryption',
        availableAtStart: false,
        unlocksAfterMission: 'public_key_crypto'
      }
    ]
  }
];

export const PROGRESSION_PATHS: ProgressionPath[] = [
  {
    name: 'Security Analyst',
    description: 'Focus on identifying vulnerabilities and securing systems',
    skills: ['system_security', 'network_security', 'cryptography', 'defensive_tactics'],
    specializations: [
      {
        name: 'System Hardening Expert',
        description: 'Specialize in making systems impenetrable',
        requiredSkillLevels: {
          'system_security': 5,
          'defensive_tactics': 3
        },
        bonuses: [
          {
            description: '+25% effectiveness when defending systems',
            effect: 'defense_bonus_25'
          },
          {
            description: 'Ability to detect 50% more intrusion attempts',
            effect: 'detection_bonus_50'
          }
        ]
      },
      {
        name: 'Cryptography Specialist',
        description: 'Master of encryption and decryption',
        requiredSkillLevels: {
          'cryptography': 5,
          'problem_solving': 4
        },
        bonuses: [
          {
            description: '50% faster decryption speed',
            effect: 'decrypt_speed_50'
          },
          {
            description: 'Access to advanced encryption tools',
            effect: 'unlock_adv_crypto_tools'
          }
        ]
      }
    ]
  },
  {
    name: 'Penetration Tester',
    description: 'Focus on offensive security and finding exploits',
    skills: ['exploitation', 'social_engineering', 'network_penetration', 'offensive_tactics'],
    specializations: [
      {
        name: 'Social Engineering Guru',
        description: 'Master the art of human manipulation',
        requiredSkillLevels: {
          'social_engineering': 5,
          'psychology': 3
        },
        bonuses: [
          {
            description: '75% higher success rate in phishing attacks',
            effect: 'phishing_bonus_75'
          },
          {
            description: 'Ability to create more convincing fake identities',
            effect: 'identity_creation_bonus'
          }
        ]
      },
      {
        name: 'Zero-Day Hunter',
        description: 'Specialist in finding previously unknown vulnerabilities',
        requiredSkillLevels: {
          'exploitation': 5,
          'programming': 4,
          'reverse_engineering': 3
        },
        bonuses: [
          {
            description: '50% chance to find hidden vulnerabilities',
            effect: 'vuln_discovery_50'
          },
          {
            description: 'Custom exploit development tools',
            effect: 'unlock_exploit_dev_tools'
          }
        ]
      }
    ]
  }
];

const gameConfig = {
  MISSIONS,
  APPLICATIONS,
  PROGRESSION_PATHS,
  pvpModes
};

export default gameConfig;
