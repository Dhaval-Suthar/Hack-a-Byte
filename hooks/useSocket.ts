'use client';

import { useCallback, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';
import { useGlobalSocket } from '@/components/SocketProvider';

export interface AttackData {
  attackerPlayspaceId: string;
  targetInfo: string;
  malwareType: string;
  malwareId: string;
  attackerName: string;
  timestamp: number;
}

export interface AttackEffect {
  // One of these scopes will be present
  playspaceId?: string;
  teamId?: string;
  effect: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  timestamp: number;
}

export interface TournamentUpdate {
  tournamentId: string;
  type: 'registration' | 'start' | 'match_update' | 'end';
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface ChatMessage {
  teamId: string;
  message: string;
  senderId?: string; // Made optional
  senderName: string;
  type?: string;
  timestamp: number;
}

export interface AchievementNotification {
  userId: string;
  achievementId: string;
  achievementName: string;
  points: number;
  timestamp: number;
}

export interface WalletUpdate {
  teamId: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: number;
}

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
  timestamp: number;
}

// Stealth viral + ransomware realtime events
export interface StealthViralSpawn { targetKey: string; clicksRequired: number; ts: number; }
export interface StealthViralProgress { targetKey: string; clicks: number; clicksRequired: number; coveragePercent: number; progressPercent: number; message: string; ts: number; }
export interface StealthViralDefeated { targetKey: string; ts: number; }
export interface VirusNotification { targetKey: string; virusType: string; message: string; severity: 'info' | 'warning' | 'critical'; ts: number; }

// CryptoLocker Elite events
export interface CryptoLockerSpawn { sessionKey: string; targetIP: string; attackerTeamId: string; phrase: string; timeLimit: number; demand: number; expires: number; ts: number; }
export interface CryptoLockerNeutralized { sessionKey: string; message: string; ts: number; }
export interface CryptoLockerPaymentDemand { attackerTeamId: string; demand: number; targetIP: string; deadline: number; message: string; ts: number; }
export interface CryptoLockerPaymentSent { amount: number; newBalance: number; message: string; ts: number; }
export interface CryptoLockerGameOver { reason: string; demanded: number; available: number; message: string; ts: number; }

// Legacy ransomware events
export interface RansomwareSpawn { targetKey: string; phrase: string; rewardDemand: number; ts: number; }
export interface RansomwareProgress { targetKey: string; progress: number; total: number; ts: number; }
export interface RansomwareNeutralized { targetKey: string; ts: number; }
export interface RansomwareExpired { targetKey: string; demand: number; ts: number; }
export interface RansomwareDemand { targetKey: string; demand: number; attackerTeamId?: string; windowMs: number; ts: number; expires?: number; }
export interface RansomwarePaid { targetKey: string; demand: number; defenderBalance?: number; attackerBalance?: number; ts: number; }
export interface RansomwareUnpaid { targetKey: string; demand: number; ts: number; }
// SystemLock & SysTrojan events
export interface SystemLockSuccess { attackerTeamId: string; amount: number; offlineUntil: number; ts: number; }
export interface SysTrojanSuccess { targetDeviceId: string; siphon: number; newAttackerBalance: number; ts: number; }
export interface SysTrojanFailure { targetDeviceId: string; ts: number; }
export interface BankStateEvent { online: boolean; offlineUntil?: number; reason?: string; ts: number; }
export interface DeviceRecoveredEvent { deviceId: string; ts: number; }
// Role metadata broadcast (server will emit on connect / role changes)
export interface RoleMetadataEvent { teamId?: string; roles?: string[]; ts: number; }
// Game over unified event
export interface GameOverEvent { sessionId: string; winner?: string; ts: number; }
// Worm & DataMiner & Wallet events
export interface WormPayloadEvent { tokenId: string; wormId: string; channel: 'email'|'sms'; targetTeamId: string; expires: number; ts: number; }
export interface WormOpenedEvent { tokenId: string; wormId: string; channel: 'email'|'sms'; reward: number; attackerTeamId: string; victimTeamId: string; ts: number; }
export interface DataMinerExfilEvent { targetTeamId: string; walletAddress: string; ts: number; }
export interface WalletTransferEvent { fromAddress: string; toAddress: string; amount: number; senderBalance: number; receiverBalance: number; ts: number; }
export interface MiningRewardEvent { teamId: string; type: 'sort' | 'snake'; reward: number; attempts: number; windowExpires: number; balance: number; ts: number; }

// Team timer events
export interface TeamTimerStartedEvent { teamId: string; deviceId: string; startTime: number; endTime: number; duration: number; message: string; }
export interface TeamTimerExpiredEvent { teamId: string; deviceId: string; message: string; }
export interface TeamTimerStoppedEvent { teamId: string; message: string; }

// Room join caches (dedupe joins per tab + enables auto-rejoin on reconnect)
const joinedTeamsGlobal = new Set<string>();
const joinedUsersGlobal = new Set<string>();
const joinedTournamentsGlobal = new Set<string>();

let useSocketCallCount = 0;

export const useSocket = () => {
  useSocketCallCount++;
  console.log('🎣 useSocket hook called #', useSocketCallCount);
  
  const { socket: globalSocket, isConnected: globalIsConnected } = useGlobalSocket();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingAttacks, setIncomingAttacks] = useState<AttackData[]>([]);
  const [globalEffects, setGlobalEffects] = useState<AttackEffect[]>([]);
  const [tournamentUpdates, setTournamentUpdates] = useState<TournamentUpdate[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [achievementNotifications, setAchievementNotifications] = useState<AchievementNotification[]>([]);
  const [walletUpdates, setWalletUpdates] = useState<WalletUpdate[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [stealthSpawns, setStealthSpawns] = useState<StealthViralSpawn[]>([]);
  const [stealthProgress, setStealthProgress] = useState<StealthViralProgress[]>([]);
  const [stealthDefeated, setStealthDefeated] = useState<StealthViralDefeated[]>([]);
  const [virusNotifications, setVirusNotifications] = useState<VirusNotification[]>([]);
  
  // CryptoLocker events
  const [cryptoLockerSpawns, setCryptoLockerSpawns] = useState<CryptoLockerSpawn[]>([]);
  const [cryptoLockerPaymentDemands, setCryptoLockerPaymentDemands] = useState<CryptoLockerPaymentDemand[]>([]);
  const [cryptoLockerPaymentSents, setCryptoLockerPaymentSents] = useState<CryptoLockerPaymentSent[]>([]);
  const [cryptoLockerGameOvers, setCryptoLockerGameOvers] = useState<CryptoLockerGameOver[]>([]);
  
  // Legacy ransomware events
  const [ransomSpawns, setRansomSpawns] = useState<RansomwareSpawn[]>([]);
  const [ransomProgress, setRansomProgress] = useState<RansomwareProgress[]>([]);
  const [ransomNeutralized, setRansomNeutralized] = useState<RansomwareNeutralized[]>([]);
  const [ransomExpired, setRansomExpired] = useState<RansomwareExpired[]>([]);
  const [ransomDemands, setRansomDemands] = useState<RansomwareDemand[]>([]);
  const [ransomPaid, setRansomPaid] = useState<RansomwarePaid[]>([]);
  const [ransomUnpaid, setRansomUnpaid] = useState<RansomwareUnpaid[]>([]);
  const [systemLockEvents, setSystemLockEvents] = useState<SystemLockSuccess[]>([]);
  const [sysTrojanSuccesses, setSysTrojanSuccesses] = useState<SysTrojanSuccess[]>([]);
  const [sysTrojanFailures, setSysTrojanFailures] = useState<SysTrojanFailure[]>([]);
  const [bankEvents, setBankEvents] = useState<BankStateEvent[]>([]);
  const [deviceRecoveredEvents, setDeviceRecoveredEvents] = useState<DeviceRecoveredEvent[]>([]);
  const [roleMetaEvents, setRoleMetaEvents] = useState<RoleMetadataEvent[]>([]);
  const [gameOverEvents, setGameOverEvents] = useState<GameOverEvent[]>([]);
  const [wormPayloads, setWormPayloads] = useState<WormPayloadEvent[]>([]);
  const [wormOpened, setWormOpened] = useState<WormOpenedEvent[]>([]);
  const [dataMinerExfils, setDataMinerExfils] = useState<DataMinerExfilEvent[]>([]);
  const [walletTransfers, setWalletTransfers] = useState<WalletTransferEvent[]>([]);
  const [miningRewards, setMiningRewards] = useState<MiningRewardEvent[]>([]);
  
  // Team timer events
  const [teamTimerStarted, setTeamTimerStarted] = useState<TeamTimerStartedEvent[]>([]);
  const [teamTimerExpired, setTeamTimerExpired] = useState<TeamTimerExpiredEvent[]>([]);
  const [teamTimerStopped, setTeamTimerStopped] = useState<TeamTimerStoppedEvent[]>([]);

  useEffect(() => {
    // Use the global socket and set up event handlers
    const localHandlers: Array<[string, (...args: unknown[]) => void]> = [];
    
    if (!globalSocket) {
      console.log('🎣 useSocket: No global socket available yet');
      return;
    }

    console.log('🎣 useSocket: Setting up event handlers for global socket');
    
    // Update local state to reflect global socket
    setSocket(globalSocket);
    setIsConnected(globalIsConnected);

    const addHandler = (event: string, handler: (...args: unknown[]) => void) => {
      globalSocket.on(event, handler);
      localHandlers.push([event, handler]);
    };

    // Set up all event handlers
    addHandler('mining-reward', (dataUnknown: unknown) => {
      const data = dataUnknown as MiningRewardEvent;
      setMiningRewards(prev => [...prev, data]);
    });

    addHandler('connect', () => {
      setIsConnected(true);
    });

    addHandler('disconnect', () => {
      setIsConnected(false);
    });

    addHandler('connect_error', (errorUnknown: unknown) => {
      const error = errorUnknown as { message?: string };
      logger.error('Socket.IO connection error:', { 
        error: error?.message ?? String(error || 'Unknown error'),
        errorType: typeof error,
        hasMessage: !!error?.message
      });
      setIsConnected(false);
    });

    addHandler('connect_timeout', () => {
      setIsConnected(false);
    });

    addHandler('reconnect', () => {
      setIsConnected(true);
    });

    addHandler('reconnect_error', (errorUnknown: unknown) => {
      const error = errorUnknown as { message?: string };
      logger.warn('❌ Socket.IO reconnection error:', { error: error?.message ?? String(error || 'Unknown error') });
    });

    // Stealth viral events
    addHandler('malware-stealth-viral-spawn', (dataUnknown: unknown) => {
      const data = dataUnknown as StealthViralSpawn;
      setStealthSpawns(prev => [...prev, data]);
    });

    addHandler('malware-stealth-viral-progress', (dataUnknown: unknown) => {
      const data = dataUnknown as StealthViralProgress;
      setStealthProgress(prev => [...prev, data]);
    });

    addHandler('malware-stealth-viral-defeated', (dataUnknown: unknown) => {
      const data = dataUnknown as StealthViralDefeated;
      setStealthDefeated(prev => [...prev, data]);
    });

    // Virus notifications
    addHandler('virus-notification', (dataUnknown: unknown) => {
      const data = dataUnknown as VirusNotification;
      setVirusNotifications(prev => [...prev, data]);
    });

    // Private key compromised (DataMiner specific)
    addHandler('private-key-compromised', (dataUnknown: unknown) => {
      const data = dataUnknown as VirusNotification;
      setVirusNotifications(prev => [...prev, { 
        ...data, 
        severity: 'critical' as const,
        virusType: data.virusType || 'DataMiner X'
      }]);
    });

    // Ransomware events
    addHandler('ransomware-spawn', (dataUnknown: unknown) => {
      const data = dataUnknown as RansomwareSpawn;
      setRansomSpawns(prev => [...prev, data]);
    });

    addHandler('ransomware-progress', (dataUnknown: unknown) => {
      const data = dataUnknown as RansomwareProgress;
      setRansomProgress(prev => [...prev, data]);
    });

    addHandler('ransomware-neutralized', (dataUnknown: unknown) => {
      const data = dataUnknown as RansomwareNeutralized;
      setRansomNeutralized(prev => [...prev, data]);
    });

    addHandler('ransomware-expired', (dataUnknown: unknown) => {
      const data = dataUnknown as RansomwareExpired;
      setRansomExpired(prev => [...prev, data]);
    });

    addHandler('ransomware-demand', (dataUnknown: unknown) => {
      const data = dataUnknown as RansomwareDemand;
      setRansomDemands(prev => prev.filter(d=>d.targetKey!==data.targetKey).concat(data));
    });

    addHandler('ransomware-paid', (dataUnknown: unknown) => {
      const data = dataUnknown as RansomwarePaid;
      setRansomPaid(prev => [...prev, data]);
      setRansomDemands(prev => prev.filter(d=>d.targetKey!==data.targetKey));
    });

    addHandler('ransomware-unpaid', (dataUnknown: unknown) => {
      const data = dataUnknown as RansomwareUnpaid;
      setRansomUnpaid(prev => [...prev, data]);
      setRansomDemands(prev => prev.filter(d=>d.targetKey!==data.targetKey));
    });

    // Handle tournament updates
    addHandler('tournament-notification', (updateUnknown: unknown) => {
      const updateData = updateUnknown as TournamentUpdate;
      setTournamentUpdates(prev => [...prev, updateData]);
    });

    // Handle new chat messages
    addHandler('new-message', (messageUnknown: unknown) => {
      const messageData = messageUnknown as ChatMessage;
      setChatMessages(prev => [...prev, messageData]);
    });

    // Handle achievement notifications
    addHandler('achievement-notification', (achievementUnknown: unknown) => {
      const achievementData = achievementUnknown as AchievementNotification;
      setAchievementNotifications(prev => [...prev, achievementData]);
    });

    // Handle wallet updates
    addHandler('wallet-update', (walletUnknown: unknown) => {
      const walletData = walletUnknown as WalletUpdate;
      setWalletUpdates(prev => [...prev, walletData]);
    });

    // Handle notifications
    addHandler('new-notification', (notificationUnknown: unknown) => {
      const notificationData = notificationUnknown as NotificationData;
      setNotifications(prev => [...prev, notificationData]);
    });

    // Incoming attack stream (drives attack banner UI)
    addHandler('incoming-attack', (attackUnknown: unknown) => {
      const attackData = attackUnknown as AttackData;
      setIncomingAttacks(prev => [...prev, attackData]);
      setTimeout(() => {
        setIncomingAttacks(prev => prev.filter(attack => attack.timestamp !== attackData.timestamp));
      }, 10000);
    });

    // Attack sent confirmation
    addHandler('attack-sent', () => {
      // Attack sent confirmation received
    });

    // Global effects
    addHandler('global-effect', (effectUnknown: unknown) => {
      const effectData = effectUnknown as AttackEffect;
      setGlobalEffects(prev => [...prev, effectData]);
      setTimeout(() => {
        setGlobalEffects(prev => prev.filter(effect => effect.timestamp !== effectData.timestamp));
      }, effectData.duration || 30000);
    });

    // CryptoLocker Elite events
    addHandler('cryptolocker-spawn', (dataUnknown: unknown) => {
      const data = dataUnknown as CryptoLockerSpawn;
      setCryptoLockerSpawns(prev => [...prev, data]);
    });

    addHandler('cryptolocker-payment-demand', (dataUnknown: unknown) => {
      const data = dataUnknown as CryptoLockerPaymentDemand;
      setCryptoLockerPaymentDemands(prev => [...prev, data]);
    });

    addHandler('cryptolocker-payment-sent', (dataUnknown: unknown) => {
      const data = dataUnknown as CryptoLockerPaymentSent;
      setCryptoLockerPaymentSents(prev => [...prev, data]);
    });

    addHandler('cryptolocker-game-over', (dataUnknown: unknown) => {
      const data = dataUnknown as CryptoLockerGameOver;
      setCryptoLockerGameOvers(prev => [...prev, data]);
    });

    // SystemLock events
    addHandler('systemlock-success', (dataUnknown: unknown) => {
      const data = dataUnknown as SystemLockSuccess;
      setSystemLockEvents(prev => [...prev, data]);
    });

    // SysTrojan events
    addHandler('systrojan-success', (dataUnknown: unknown) => {
      const data = dataUnknown as SysTrojanSuccess;
      setSysTrojanSuccesses(prev => [...prev, data]);
    });

    addHandler('systrojan-failure', (dataUnknown: unknown) => {
      const data = dataUnknown as SysTrojanFailure;
      setSysTrojanFailures(prev => [...prev, data]);
    });

    // Bank state events
    addHandler('bank-state', (dataUnknown: unknown) => {
      const data = dataUnknown as BankStateEvent;
      setBankEvents(prev => [...prev, data]);
    });

    addHandler('device-recovered', (dataUnknown: unknown) => {
      const data = dataUnknown as DeviceRecoveredEvent;
      setDeviceRecoveredEvents(prev => [...prev, data]);
    });

    // Bank online explicit event (alias when transitioning online)
    addHandler('bank-online', (dataUnknown: unknown) => {
      const data = dataUnknown as BankStateEvent;
      setBankEvents(prev => [...prev, { ...data, online: true }]);
    });

    // Role metadata events
    addHandler('role-metadata', (dataUnknown: unknown) => {
      const data = dataUnknown as RoleMetadataEvent;
      setRoleMetaEvents(prev => [...prev, data]);
    });

    // Game over events (server emits game-session-ended; we alias as game-over)
    addHandler('game-session-ended', (dataUnknown: unknown) => {
      const data = dataUnknown as GameOverEvent;
      setGameOverEvents(prev => [...prev, data]);
    });

    addHandler('game-over', (dataUnknown: unknown) => {
      const data = dataUnknown as GameOverEvent;
      setGameOverEvents(prev => [...prev, data]);
    });
    
    // Game termination event (when admin terminates the game)
    addHandler('game-terminated', (dataUnknown: unknown) => {
      const data = dataUnknown as GameOverEvent;
      setGameOverEvents(prev => [...prev, { ...data, sessionId: 'TERMINATED', ts: Date.now() }]);
    });

    // Worm events
    addHandler('worm-payload', (dataUnknown: unknown) => {
      const data = dataUnknown as WormPayloadEvent;
      setWormPayloads(prev => [...prev.filter(p=>p.tokenId!==data.tokenId), data]);
    });

    addHandler('worm-opened', (dataUnknown: unknown) => {
      const data = dataUnknown as WormOpenedEvent;
      setWormOpened(prev => [...prev, data]);
      setWormPayloads(prev => prev.filter(p=>p.tokenId!==data.tokenId));
    });

    // DataMiner alert
    addHandler('dataminer-exfil', (dataUnknown: unknown) => {
      const data = dataUnknown as DataMinerExfilEvent;
      setDataMinerExfils(prev => [...prev, data]);
    });

    // Wallet transfers
    addHandler('wallet-transfer', (dataUnknown: unknown) => {
      const data = dataUnknown as WalletTransferEvent;
      setWalletTransfers(prev => [...prev, data]);
    });

    // Team timer events
    addHandler('team-timer-started', (dataUnknown: unknown) => {
      const data = dataUnknown as TeamTimerStartedEvent;
      setTeamTimerStarted(prev => [...prev, data]);
      // Auto-remove after 10 seconds to avoid memory buildup
      setTimeout(() => {
        setTeamTimerStarted(prev => prev.filter(event => event.startTime !== data.startTime));
      }, 10000);
    });

    addHandler('team-timer-expired', (dataUnknown: unknown) => {
      const data = dataUnknown as TeamTimerExpiredEvent;
      setTeamTimerExpired(prev => [...prev, data]);
      // Auto-remove after 30 seconds
      setTimeout(() => {
        setTeamTimerExpired(prev => prev.filter(event => event !== data));
      }, 30000);
    });

    addHandler('team-timer-stopped', (dataUnknown: unknown) => {
      const data = dataUnknown as TeamTimerStoppedEvent;
      setTeamTimerStopped(prev => [...prev, data]);
      // Auto-remove after 10 seconds
      setTimeout(() => {
        setTeamTimerStopped(prev => prev.filter(event => event !== data));
      }, 10000);
    });

    return () => {
      // Remove this hook instance's event handlers to avoid duplicates
      if (globalSocket && localHandlers.length) {
        try {
          for (const [event, handler] of localHandlers) {
            globalSocket.off(event, handler as (...args: unknown[]) => void);
          }
        } catch {
          // ignore
        }
      }
    };
  }, [globalSocket, globalIsConnected]);

  // Function to send malware attack
  const sendMalwareAttack = (attackData: Omit<AttackData, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('malware-attack', attackData);
    } else {
      logger.warn('Socket not connected, cannot send attack');
    }
  };

  // Function to trigger attack effect
  const triggerAttackEffect = (effectData: Omit<AttackEffect, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('attack-effect', effectData);
    } else {
      logger.warn('Socket not connected, cannot trigger effect');
    }
  };

  // Function to join team room (memoized + idempotent per connection)
  const joinTeam = useCallback((teamId: string) => {
    // If already joined, do nothing
    if (joinedTeamsGlobal.has(teamId)) return;

    // If switching teams, leave previously joined ones on this connection to
    // avoid receiving events for multiple teams in the same tab/window.
    if (socket && isConnected && joinedTeamsGlobal.size > 0) {
      for (const prev of Array.from(joinedTeamsGlobal)) {
        if (prev !== teamId) {
          try {
            socket.emit('leave-team', prev);
            joinedTeamsGlobal.delete(prev);
          } catch {}
        }
      }
    }

    joinedTeamsGlobal.add(teamId);
    if (socket && isConnected) {
      socket.emit('join-team', teamId);
    } else {
      logger.warn('Queued team join until connected:', { teamId });
    }
  }, [socket, isConnected]);

  // Function to join user room
  const joinUser = (userId: string) => {
    if (joinedUsersGlobal.has(userId)) return;
    joinedUsersGlobal.add(userId);
    if (socket && isConnected) {
      socket.emit('join-user', userId);
    } else {
      logger.warn('Queued user join until connected:', { userId });
    }
  };

  // Function to join tournament room
  const joinTournament = (tournamentId: string) => {
    if (joinedTournamentsGlobal.has(tournamentId)) return;
    joinedTournamentsGlobal.add(tournamentId);
    if (socket && isConnected) {
      socket.emit('join-tournament', tournamentId);
    } else {
      logger.warn('Queued tournament join until connected:', { tournamentId });
    }
  };

  // Function to send chat message
  const sendMessage = (messageData: Omit<ChatMessage, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
    } else {
      logger.warn('Socket not connected, cannot send message');
    }
  };

  // Function to send tournament update
  const sendTournamentUpdate = (updateData: Omit<TournamentUpdate, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('tournament-update', updateData);
    } else {
      logger.warn('Socket not connected, cannot send tournament update');
    }
  };

  // Function to send achievement notification
  const sendAchievementNotification = (achievementData: Omit<AchievementNotification, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('achievement-unlocked', achievementData);
    } else {
      logger.warn('Socket not connected, cannot send achievement notification');
    }
  };

  // Function to send wallet update
  const sendWalletUpdate = (walletData: Omit<WalletUpdate, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('wallet-transaction', walletData);
    } else {
      logger.warn('Socket not connected, cannot send wallet update');
    }
  };

  // Function to send notification
  const sendNotification = (notificationData: Omit<NotificationData, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('send-notification', notificationData);
    } else {
      logger.warn('Socket not connected, cannot send notification');
    }
  };

  return {
    socket,
    isConnected,
    incomingAttacks,
    globalEffects,
    tournamentUpdates,
    chatMessages,
    achievementNotifications,
    walletUpdates,
    notifications,
    stealthSpawns,
    stealthProgress,
    stealthDefeated,
    virusNotifications,
    cryptoLockerSpawns,
    cryptoLockerPaymentDemands,
    cryptoLockerPaymentSents,
    cryptoLockerGameOvers,
    ransomSpawns,
    ransomProgress,
    ransomNeutralized,
    ransomExpired,
    ransomDemands,
    ransomPaid,
    ransomUnpaid,
    systemLockEvents,
    sysTrojanSuccesses,
    sysTrojanFailures,
    bankEvents,
    deviceRecoveredEvents,
    roleMetaEvents,
    gameOverEvents,
    wormPayloads,
    wormOpened,
    dataMinerExfils,
    walletTransfers,
    miningRewards,
    teamTimerStarted,
    teamTimerExpired,
    teamTimerStopped,
    sendMalwareAttack,
    triggerAttackEffect,
    joinTeam,
    joinUser,
    joinTournament,
    sendMessage,
    sendTournamentUpdate,
    sendAchievementNotification,
    sendWalletUpdate,
    sendNotification,
  };
};