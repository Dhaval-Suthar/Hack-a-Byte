import { Ransomware, NetworkSystem, DecryptionTool, SecurityMeasure } from '@/app/(pages)/pvp/ransomware/types';

/**
 * Calculate the probability of a ransomware successfully encrypting a system
 */
export function calculateEncryptionProbability(
  ransomware: Ransomware,
  targetSystem: NetworkSystem
): number {
  // Base encryption chance based on ransomware properties
  let encryptionChance = ransomware.propagationSpeed / 10;
  
  // System security level reduces encryption chance
  encryptionChance -= targetSystem.securityLevel / 20;
  
  // Unpatched vulnerabilities increase encryption chance
  const exploitableVulnerabilities = targetSystem.vulnerabilities.filter(v => !v.patchAvailable || v.exploited);
  if (exploitableVulnerabilities.length > 0) {
    // Each vulnerability increases chance based on its severity
    const vulnerabilityBoost = exploitableVulnerabilities.reduce(
      (sum, vuln) => sum + (vuln.severity / 100),
      0
    );
    encryptionChance += vulnerabilityBoost;
  }
  
  // Security measures on the system reduce encryption chance
  if (targetSystem.securityMeasures && targetSystem.securityMeasures.length > 0) {
    const securityReduction = targetSystem.securityMeasures.reduce(
      (sum, measure) => sum + (measure.strength / 30),
      0
    );
    encryptionChance -= securityReduction;
  }
  
  // Ransomware stealth rating increases chance of successful encryption
  encryptionChance += ransomware.stealthRating / 20;
  
  // Ensure probability is between 0 and 1
  return Math.max(0, Math.min(1, encryptionChance));
}

/**
 * Calculate the probability of successfully decrypting a system without the key
 */
export function calculateDecryptionProbability(
  decryptionTool: DecryptionTool,
  ransomware: Ransomware
): number {
  // Base decryption chance based on tool strength
  let decryptionChance = decryptionTool.strength / 10;
  
  // Ransomware encryption strength reduces decryption chance
  decryptionChance -= ransomware.encryptionStrength / 15;
  
  // Adjust based on success rate of the decryption tool
  decryptionChance *= decryptionTool.successRate;
  
  // Additional factors based on ransomware features
  const encryptionFeatures = ransomware.features.filter(f => f.type === 'encryption');
  if (encryptionFeatures.length > 0) {
    const encryptionStrength = encryptionFeatures.reduce(
      (sum, feature) => sum + (feature.effectiveness / 100),
      0
    );
    decryptionChance -= encryptionStrength;
  }
  
  // Ensure probability is between 0 and 1
  return Math.max(0, Math.min(1, decryptionChance));
}

/**
 * Calculate the time needed to decrypt a system
 */
export function calculateDecryptionTimeInMinutes(
  decryptionTool: DecryptionTool,
  ransomware: Ransomware,
  systemImportance: number
): number {
  // Base time based on ransomware encryption strength
  let decryptionTime = ransomware.encryptionStrength * 5;
  
  // Decryption tool strength reduces time
  decryptionTime -= decryptionTool.strength * 2;
  
  // System importance increases decryption time (more critical systems have more data)
  decryptionTime += systemImportance * 2;
  
  // Ensure minimum time of 5 minutes
  return Math.max(5, decryptionTime);
}

/**
 * Calculate the ransom amount based on system importance
 */
export function calculateOptimalRansom(encryptedSystems: NetworkSystem[]): number {
  if (!encryptedSystems || encryptedSystems.length === 0) {
    return 0;
  }
  
  // Calculate based on total data value and system importance
  const totalValue = encryptedSystems.reduce(
    (sum, system) => sum + (system.dataValue * system.importance),
    0
  );
  
  // Base calculation
  const baseAmount = 100 * encryptedSystems.length;
  
  return baseAmount + (totalValue * 10);
}

/**
 * Calculate propagation path for ransomware across network systems
 */
export function calculateRansomwarePropagationPath(
  startSystemId: string,
  network: NetworkSystem[],
  ransomware: Ransomware,
  maxSystems: number = 5
): string[] {
  // Simple implementation for determining which systems will be targeted
  // In a real implementation, this would consider network topology
  
  // Start with the initial system
  const targetSystems: string[] = [startSystemId];
  
  // Get the start system
  const startSystem = network.find(system => system.id === startSystemId);
  if (!startSystem) return targetSystems;
  
  // Sort other systems by vulnerability (most vulnerable first)
  const otherSystems = network
    .filter(system => system.id !== startSystemId)
    .sort((a, b) => {
      // Calculate vulnerability score
      const aVulnScore = (a.vulnerabilities?.filter(v => !v.patchAvailable).length || 0) / 
        (a.securityLevel || 1);
      const bVulnScore = (b.vulnerabilities?.filter(v => !v.patchAvailable).length || 0) / 
        (b.securityLevel || 1);
      
      return bVulnScore - aVulnScore; // Descending order
    });
  
  // Add systems up to the limit or until we run out
  for (let i = 0; i < Math.min(maxSystems - 1, otherSystems.length); i++) {
    // For faster ransomware, target more systems
    if (i >= ransomware.propagationSpeed && Math.random() > 0.5) {
      break;
    }
    targetSystems.push(otherSystems[i].id);
  }
  
  return targetSystems;
}

/**
 * Calculate the score for encrypting a system
 */
export function calculateEncryptionScore(systemType: NetworkSystem['type']): number {
  switch (systemType) {
    case 'file-server':
      return 60;
    case 'database':
      return 70;
    case 'web-server':
      return 50;
    case 'email-server':
      return 55;
    case 'workstation':
      return 30;
    case 'backup-system':
      return 100; // Highest value target
    default:
      return 20;
  }
}

/**
 * Calculate the score for successfully decrypting/recovering a system
 */
export function calculateDecryptionScore(
  system: NetworkSystem,
  wasBackupRestore: boolean
): number {
  // Base score
  let score = 40;
  
  // Bonus based on system importance
  score += system.importance * 5;
  
  // Different bonus for backup restore vs decryption tool
  if (wasBackupRestore) {
    score += 10; // Extra points for having good backups
  } else {
    score += 20; // Extra points for technical solution
  }
  
  // Bonus for valuable systems
  if (system.type === 'database' || system.type === 'file-server') {
    score += 15;
  }
  
  return score;
}

/**
 * Generate a unique ransomware name
 */
export function generateRansomwareName(): string {
  const prefixes = ['Crypto', 'Lock', 'Dark', 'Shadow', 'Black', 'Cyber', 'Mega', 'Royal', 'Chaos', 'Nightmare'];
  const suffixes = ['Locker', 'Crypt', 'Ransom', 'Lock', 'Coder', 'Encoder', 'Vault', 'Blocker', 'Guardian', 'Parasite'];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  
  return `${prefix}${suffix}`;
}

/**
 * Generate a random vulnerability for a system
 */
export function generateRandomVulnerability(): {
  id: string;
  name: string;
  type: 'unpatched-software' | 'misconfiguration' | 'weak-credentials' | 'phishing-susceptibility' | 'insider-threat';
  severity: number;
  exploited: boolean;
  patchAvailable: boolean;
} {
  const vulnTypes = [
    'unpatched-software', 
    'misconfiguration',
    'weak-credentials',
    'phishing-susceptibility',
    'insider-threat'
  ] as const;
  
  const vulnNames = {
    'unpatched-software': ['Outdated Operating System', 'Legacy Application Vulnerability', 'Unpatched Service'],
    'misconfiguration': ['Insecure Settings', 'Default Configuration', 'Exposed Service', 'Unnecessary Permissions'],
    'weak-credentials': ['Weak Password Policy', 'Insufficient Authentication', 'Missing MFA', 'Shared Credentials'],
    'phishing-susceptibility': ['Lack of Training', 'Email Filtering Bypass', 'Social Engineering Vulnerability'],
    'insider-threat': ['Privileged Account Misuse', 'Excessive Permissions', 'Lack of Monitoring']
  };
  
  const type = vulnTypes[Math.floor(Math.random() * vulnTypes.length)];
  const names = vulnNames[type];
  const name = names[Math.floor(Math.random() * names.length)];
  
  return {
    id: `vuln-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name,
    type,
    severity: Math.floor(Math.random() * 8) + 3, // 3-10
    exploited: false,
    patchAvailable: Math.random() > 0.3 // 70% chance a patch is available
  };
}

/**
 * Generate a random network system
 */
export function generateRandomSystem(
  id: string,
  networkSize: number
): NetworkSystem {
  const systemTypes = [
    'file-server', 
    'database', 
    'web-server', 
    'email-server', 
    'workstation', 
    'backup-system'
  ] as const;
  
  const systemNames = {
    'file-server': ['File Server', 'Document Storage', 'Asset Repository', 'Data Archive'],
    'database': ['Customer Database', 'Financial Records', 'Inventory System', 'Analytics Database'],
    'web-server': ['Corporate Website', 'Internal Portal', 'API Server', 'E-commerce Platform'],
    'email-server': ['Mail Server', 'Exchange Server', 'Communication System'],
    'workstation': ['Executive Workstation', 'Developer Machine', 'Accounting Station', 'HR Computer'],
    'backup-system': ['Backup Server', 'Disaster Recovery', 'Archives System']
  };
  
  // Determine type based on network size to ensure a good distribution
  let type: NetworkSystem['type'];
  const typeIndex = id.charCodeAt(0) % systemTypes.length;
  type = systemTypes[typeIndex];
  
  // For larger networks, ensure we have at least one of each type
  if (networkSize > systemTypes.length) {
    const idNum = parseInt(id.replace(/[^0-9]/g, '')) % networkSize;
    if (idNum < systemTypes.length) {
      type = systemTypes[idNum];
    }
  }
  
  // Get name based on type
  const nameOptions = systemNames[type];
  const name = nameOptions[Math.floor(Math.random() * nameOptions.length)];
  
  // System-specific attributes
  let importance, securityLevel;
  
  switch (type) {
    case 'database':
    case 'file-server':
      importance = Math.floor(Math.random() * 3) + 8; // 8-10
      securityLevel = Math.floor(Math.random() * 4) + 6; // 6-9
      break;
    case 'backup-system':
      importance = Math.floor(Math.random() * 3) + 7; // 7-9
      securityLevel = Math.floor(Math.random() * 3) + 7; // 7-9
      break;
    case 'email-server':
    case 'web-server':
      importance = Math.floor(Math.random() * 4) + 5; // 5-8
      securityLevel = Math.floor(Math.random() * 4) + 5; // 5-8
      break;
    case 'workstation':
      importance = Math.floor(Math.random() * 5) + 3; // 3-7
      securityLevel = Math.floor(Math.random() * 5) + 3; // 3-7
      break;
    default:
      importance = Math.floor(Math.random() * 5) + 5; // 5-9
      securityLevel = Math.floor(Math.random() * 5) + 5; // 5-9
  }
  
  // Generate 1-3 random vulnerabilities
  const vulnerabilities = [];
  const vulnCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < vulnCount; i++) {
    vulnerabilities.push(generateRandomVulnerability());
  }
  
  return {
    id,
    name: `${name} ${id.slice(-3)}`,
    type,
    importance,
    encrypted: false,
    encryptedBy: null,
    backupStatus: Math.random() > 0.3 ? (Math.random() > 0.5 ? 'complete' : 'partial') : 'none',
    securityLevel,
    dataValue: importance * (Math.floor(Math.random() * 5) + 5), // 5-9 * importance
    vulnerabilities,
    securityMeasures: []
  };
}
