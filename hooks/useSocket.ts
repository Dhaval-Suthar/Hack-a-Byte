'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getPlayspaceId } from '@/lib/playspace-utils';

export interface AttackData {
  attackerPlayspaceId: string;
  targetInfo: string;
  malwareType: string;
  malwareId: string;
  attackerName: string;
  timestamp: number;
}

export interface AttackEffect {
  playspaceId: string;
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
export interface StealthViralProgress { targetKey: string; clicks: number; clicksRequired: number; ts: number; }
export interface StealthViralDefeated { targetKey: string; ts: number; }
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
// Worm & FakeBank & DataMiner & Wallet events
export interface WormPayloadEvent { tokenId: string; wormId: string; channel: 'email'|'sms'; targetTeamId: string; expires: number; ts: number; }
export interface WormOpenedEvent { tokenId: string; wormId: string; channel: 'email'|'sms'; reward: number; attackerTeamId: string; victimTeamId: string; ts: number; }
export interface FakeBankSiphonEvent { attackerTeamId: string; victimTeamId: string; amount: number; attackerBalance: number; remainingMs: number; ts: number; }
export interface DataMinerExfilEvent { targetTeamId: string; walletAddress: string; ts: number; }
export interface WalletTransferEvent { fromAddress: string; toAddress: string; amount: number; senderBalance: number; receiverBalance: number; ts: number; }
export interface MiningRewardEvent { teamId: string; type: 'sort' | 'snake'; reward: number; attempts: number; windowExpires: number; balance: number; ts: number; }
export interface FakeBankVictimEvent { targetTeamId: string; attackerTeamId: string; windowMs: number; ts: number; }
export interface FakeBankAttackerEvent { attackerTeamId: string; targetTeamId: string; windowMs: number; ts: number; }

export const useSocket = () => {
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
  const [fakeBankSiphons, setFakeBankSiphons] = useState<FakeBankSiphonEvent[]>([]);
  const [dataMinerExfils, setDataMinerExfils] = useState<DataMinerExfilEvent[]>([]);
  const [walletTransfers, setWalletTransfers] = useState<WalletTransferEvent[]>([]);
  const [miningRewards, setMiningRewards] = useState<MiningRewardEvent[]>([]);
  const [fakeBankVictimEvents, setFakeBankVictimEvents] = useState<FakeBankVictimEvent[]>([]);
  const [fakeBankAttackerEvents, setFakeBankAttackerEvents] = useState<FakeBankAttackerEvent[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    console.log('useSocket hook initialized');
    // Initialize socket connection
    const initSocket = async () => {
      if (typeof window === 'undefined') {
        console.log('useSocket: Skipping server-side execution');
        return;
      }

      console.log('useSocket: Initializing socket connection');

      try {
        console.log('Initializing Socket.IO client connection to:', process.env.NODE_ENV === 'production' ? '' : window.location.origin);
        const newSocket = io(process.env.NODE_ENV === 'production' ? '' : window.location.origin, {
          path: '/api/socketio',
          transports: ['websocket', 'polling'],
        });
        newSocket.on('mining-reward', (data: MiningRewardEvent) => {
          setMiningRewards(prev => [...prev, data]);
        });
        newSocket.on('fake-bank-victim', (data: FakeBankVictimEvent) => {
          setFakeBankVictimEvents(prev => [...prev, data]);
        });
        newSocket.on('fake-bank-attacker', (data: FakeBankAttackerEvent) => {
          setFakeBankAttackerEvents(prev => [...prev, data]);
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
          console.log('✅ Connected to Socket.IO server');
          setIsConnected(true);

          // Join playspace room
          const playspaceId = getPlayspaceId();
          console.log('Device playspace ID for room joining:', playspaceId);
          if (playspaceId) {
            newSocket.emit('join-playspace', playspaceId);
            console.log('Joined playspace:', playspaceId);
          } else {
            console.warn('No playspace ID found, cannot join room');
          }
        });

        newSocket.on('disconnect', () => {
          console.log('❌ Disconnected from Socket.IO server');
          setIsConnected(false);
        });

        // Handle incoming attacks
        newSocket.on('incoming-attack', (attackData: AttackData) => {
          console.log('Incoming attack received:', attackData);
          setIncomingAttacks(prev => [...prev, attackData]);

          // Auto-remove after 10 seconds
          setTimeout(() => {
            setIncomingAttacks(prev => prev.filter(attack => attack.timestamp !== attackData.timestamp));
          }, 10000);
        });

        // Handle attack confirmation
        newSocket.on('attack-sent', (attackData: AttackData) => {
          console.log('Attack sent confirmation:', attackData);
        });

        // Handle global effects
        newSocket.on('global-effect', (effectData: AttackEffect) => {
          console.log('Global effect triggered:', effectData);
          setGlobalEffects(prev => [...prev, effectData]);

          // Auto-remove after duration or 30 seconds
          setTimeout(() => {
            setGlobalEffects(prev => prev.filter(effect => effect.timestamp !== effectData.timestamp));
          }, effectData.duration || 30000);
        });

        // Handle tournament updates
        newSocket.on('tournament-notification', (updateData: TournamentUpdate) => {
          console.log('Tournament update received:', updateData);
          setTournamentUpdates(prev => [...prev, updateData]);
        });

        // Handle new chat messages
        newSocket.on('new-message', (messageData: ChatMessage) => {
          console.log('New chat message received:', messageData);
          setChatMessages(prev => [...prev, messageData]);
        });

        // Handle achievement notifications
        newSocket.on('achievement-notification', (achievementData: AchievementNotification) => {
          console.log('Achievement notification received:', achievementData);
          setAchievementNotifications(prev => [...prev, achievementData]);
        });

        // Handle wallet updates
        newSocket.on('wallet-update', (walletData: WalletUpdate) => {
          console.log('Wallet update received:', walletData);
          setWalletUpdates(prev => [...prev, walletData]);
        });

        // Handle notifications
        newSocket.on('new-notification', (notificationData: NotificationData) => {
          console.log('Notification received:', notificationData);
          setNotifications(prev => [...prev, notificationData]);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          setIsConnected(false);
        });

        // Stealth viral events
        newSocket.on('malware-stealth-viral-spawn', (data: StealthViralSpawn) => {
          setStealthSpawns(prev => [...prev, data]);
        });
        newSocket.on('malware-stealth-viral-progress', (data: StealthViralProgress) => {
          setStealthProgress(prev => [...prev, data]);
        });
        newSocket.on('malware-stealth-viral-defeated', (data: StealthViralDefeated) => {
          setStealthDefeated(prev => [...prev, data]);
        });

        // Ransomware events
        newSocket.on('ransomware-spawn', (data: RansomwareSpawn) => {
          setRansomSpawns(prev => [...prev, data]);
        });
        newSocket.on('ransomware-progress', (data: RansomwareProgress) => {
          setRansomProgress(prev => [...prev, data]);
        });
        newSocket.on('ransomware-neutralized', (data: RansomwareNeutralized) => {
          setRansomNeutralized(prev => [...prev, data]);
        });
        newSocket.on('ransomware-expired', (data: RansomwareExpired) => {
          setRansomExpired(prev => [...prev, data]);
        });
        newSocket.on('ransomware-demand', (data: RansomwareDemand) => {
          setRansomDemands(prev => [...prev.filter(d=>d.targetKey!==data.targetKey), data]);
        });
        newSocket.on('ransomware-paid', (data: RansomwarePaid) => {
          setRansomPaid(prev => [...prev, data]);
          setRansomDemands(prev => prev.filter(d=>d.targetKey!==data.targetKey));
        });
        newSocket.on('ransomware-unpaid', (data: RansomwareUnpaid) => {
          setRansomUnpaid(prev => [...prev, data]);
          setRansomDemands(prev => prev.filter(d=>d.targetKey!==data.targetKey));
        });

        // SystemLock events
        newSocket.on('systemlock-success', (data: SystemLockSuccess) => {
          setSystemLockEvents(prev => [...prev, data]);
        });

        // SysTrojan events
        newSocket.on('systrojan-success', (data: SysTrojanSuccess) => {
          setSysTrojanSuccesses(prev => [...prev, data]);
        });
        newSocket.on('systrojan-failure', (data: SysTrojanFailure) => {
          setSysTrojanFailures(prev => [...prev, data]);
        });

        // Bank state events
        newSocket.on('bank-state', (data: BankStateEvent) => {
          setBankEvents(prev => [...prev, data]);
        });
        newSocket.on('device-recovered', (data: DeviceRecoveredEvent) => {
          setDeviceRecoveredEvents(prev => [...prev, data]);
        });
        // Bank online explicit event (alias when transitioning online)
        newSocket.on('bank-online', (data: BankStateEvent) => {
          setBankEvents(prev => [...prev, { ...data, online: true }]);
        });

        // Ransom-demand already handled (alias exists as ransomware-demand)

        // Role metadata events
        newSocket.on('role-metadata', (data: RoleMetadataEvent) => {
          setRoleMetaEvents(prev => [...prev, data]);
        });

        // Game over events (server emits game-session-ended; we alias as game-over)
        newSocket.on('game-session-ended', (data: GameOverEvent) => {
          setGameOverEvents(prev => [...prev, data]);
        });
        newSocket.on('game-over', (data: GameOverEvent) => {
          setGameOverEvents(prev => [...prev, data]);
        });

        // Worm events
        newSocket.on('worm-payload', (data: WormPayloadEvent) => {
          setWormPayloads(prev => [...prev.filter(p=>p.tokenId!==data.tokenId), data]);
        });
        newSocket.on('worm-opened', (data: WormOpenedEvent) => {
          setWormOpened(prev => [...prev, data]);
          setWormPayloads(prev => prev.filter(p=>p.tokenId!==data.tokenId));
        });

        // FakeBank siphon
        newSocket.on('fake-bank-siphon', (data: FakeBankSiphonEvent) => {
          setFakeBankSiphons(prev => [...prev, data]);
        });

        // DataMiner alert
        newSocket.on('dataminer-exfil', (data: DataMinerExfilEvent) => {
          setDataMinerExfils(prev => [...prev, data]);
        });

        // Wallet transfers
        newSocket.on('wallet-transfer', (data: WalletTransferEvent) => {
          setWalletTransfers(prev => [...prev, data]);
        });

      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Function to send malware attack
  const sendMalwareAttack = (attackData: Omit<AttackData, 'timestamp'>) => {
    console.log('sendMalwareAttack called with:', attackData);
    console.log('Socket connected:', isConnected);
    console.log('Socket object:', socket);

    if (socket && isConnected) {
      socket.emit('malware-attack', attackData);
      console.log('Malware attack sent:', attackData);
    } else {
      console.warn('Socket not connected, cannot send attack');
    }
  };

  // Function to trigger attack effect
  const triggerAttackEffect = (effectData: Omit<AttackEffect, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('attack-effect', effectData);
      console.log('Attack effect triggered:', effectData);
    } else {
      console.warn('Socket not connected, cannot trigger effect');
    }
  };

  // Function to join team room
  const joinTeam = (teamId: string) => {
    if (socket && isConnected) {
      socket.emit('join-team', teamId);
      console.log('Joined team room:', teamId);
    } else {
      console.warn('Socket not connected, cannot join team');
    }
  };

  // Function to join user room
  const joinUser = (userId: string) => {
    if (socket && isConnected) {
      socket.emit('join-user', userId);
      console.log('Joined user room:', userId);
    } else {
      console.warn('Socket not connected, cannot join user');
    }
  };

  // Function to join tournament room
  const joinTournament = (tournamentId: string) => {
    if (socket && isConnected) {
      socket.emit('join-tournament', tournamentId);
      console.log('Joined tournament room:', tournamentId);
    } else {
      console.warn('Socket not connected, cannot join tournament');
    }
  };

  // Function to send chat message
  const sendMessage = (messageData: Omit<ChatMessage, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('send-message', messageData);
      console.log('Chat message sent:', messageData);
    } else {
      console.warn('Socket not connected, cannot send message');
    }
  };

  // Function to send tournament update
  const sendTournamentUpdate = (updateData: Omit<TournamentUpdate, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('tournament-update', updateData);
      console.log('Tournament update sent:', updateData);
    } else {
      console.warn('Socket not connected, cannot send tournament update');
    }
  };

  // Function to send achievement notification
  const sendAchievementNotification = (achievementData: Omit<AchievementNotification, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('achievement-unlocked', achievementData);
      console.log('Achievement notification sent:', achievementData);
    } else {
      console.warn('Socket not connected, cannot send achievement notification');
    }
  };

  // Function to send wallet update
  const sendWalletUpdate = (walletData: Omit<WalletUpdate, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('wallet-transaction', walletData);
      console.log('Wallet update sent:', walletData);
    } else {
      console.warn('Socket not connected, cannot send wallet update');
    }
  };

  // Function to send notification
  const sendNotification = (notificationData: Omit<NotificationData, 'timestamp'>) => {
    if (socket && isConnected) {
      socket.emit('send-notification', notificationData);
      console.log('Notification sent:', notificationData);
    } else {
      console.warn('Socket not connected, cannot send notification');
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
  fakeBankSiphons,
  dataMinerExfils,
  walletTransfers,
  miningRewards,
  fakeBankVictimEvents,
  fakeBankAttackerEvents,
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
