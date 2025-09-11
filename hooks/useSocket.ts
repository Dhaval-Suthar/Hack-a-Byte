'use client';

import { useCallback, useEffect, useState } from 'react';
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

// --- Per-tab singleton state ---
let sharedSocket: Socket | null = null;
let socketRefCount = 0;
let creatingSocket: Promise<Socket> | null = null;
// Room join caches (dedupe joins per tab + enables auto-rejoin on reconnect)
const joinedTeamsGlobal = new Set<string>();
const joinedUsersGlobal = new Set<string>();
const joinedTournamentsGlobal = new Set<string>();

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
  const [virusNotifications, setVirusNotifications] = useState<VirusNotification[]>([]);
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

  useEffect(() => {
    console.log('useSocket hook initialized');
    // Initialize socket connection
  let localHandlers: Array<[string, (...args: unknown[]) => void]> = [];
    const initSocket = async () => {
      if (typeof window === 'undefined') {
        console.log('useSocket: Skipping server-side execution');
        return;
      }

      console.log('useSocket: Initializing socket connection');

      try {
        console.log('Initializing Socket.IO client connection to:', process.env.NODE_ENV === 'production' ? '' : window.location.origin);

        // Create the shared socket once per tab
        if (!sharedSocket) {
          if (creatingSocket) {
            await creatingSocket;
          } else {
            creatingSocket = (async () => {
              // Ensure the server-side Socket.IO is initialized before connecting
              try {
                await fetch('/api/socketio', { method: 'GET', cache: 'no-store', keepalive: true });
                console.log('Primed /api/socketio successfully');
              } catch (primeErr) {
                console.warn('Failed to prime /api/socketio:', primeErr);
              }

              // Add a small delay to ensure server is ready
              await new Promise(resolve => setTimeout(resolve, 300));

              const base = process.env.NODE_ENV === 'production' ? '' : window.location.origin;
              const s = io(base, {
                path: '/api/socketio',
                transports: ['websocket', 'polling'],
                timeout: 30000,
                // Do NOT force new connections; reuse the single client
                forceNew: false,
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 2000,
                reconnectionDelayMax: 10000,
                randomizationFactor: 0.5,
              });

              // Attach one-time global connection lifecycle handlers
              s.on('connect', () => {
                console.log('✅ Connected to Socket.IO server');
                // On a fresh connection (or reconnect), join playspace and any tracked rooms
                const playspaceId = getPlayspaceId();
                console.log('Device playspace ID for room joining:', playspaceId);
                if (playspaceId) {
                  s.emit('join-playspace', playspaceId);
                  console.log('Joined playspace:', playspaceId);
                } else {
                  console.warn('No playspace ID found, cannot join playspace room');
                }
                // Re-join all remembered rooms (teams/users/tournaments)
                if (joinedTeamsGlobal.size) {
                  for (const teamId of joinedTeamsGlobal) {
                    s.emit('join-team', teamId);
                  }
                  console.log('Re-joined team rooms:', [...joinedTeamsGlobal]);
                }
                if (joinedUsersGlobal.size) {
                  for (const userId of joinedUsersGlobal) {
                    s.emit('join-user', userId);
                  }
                  console.log('Re-joined user rooms:', [...joinedUsersGlobal]);
                }
                if (joinedTournamentsGlobal.size) {
                  for (const tid of joinedTournamentsGlobal) {
                    s.emit('join-tournament', tid);
                  }
                  console.log('Re-joined tournament rooms:', [...joinedTournamentsGlobal]);
                }
              });

              s.on('disconnect', (reason) => {
                console.log('🔌 Socket.IO disconnected:', reason);
              });

              s.on('connect_error', (error) => {
                console.warn('❌ Socket.IO connection error:', error.message);
              });

              s.on('reconnect', (attemptNumber) => {
                console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts');
              });

              s.on('reconnect_error', (error) => {
                console.warn('❌ Socket.IO reconnection error:', error.message);
              });

              sharedSocket = s;
              return s;
            })();
            await creatingSocket;
            creatingSocket = null;
          }
        }

        // Increase reference count and expose to this hook instance
        socketRefCount += 1;
        const newSocket = sharedSocket!;
        localHandlers = [];
        const addHandler = (event: string, handler: (...args: unknown[]) => void) => {
          newSocket.on(event, handler);
          localHandlers.push([event, handler]);
        };

        addHandler('mining-reward', (dataUnknown: unknown) => {
          const data = dataUnknown as MiningRewardEvent;
          setMiningRewards(prev => [...prev, data]);
        });
        addHandler('fake-bank-victim', (dataUnknown: unknown) => {
          const data = dataUnknown as FakeBankVictimEvent;
          setFakeBankVictimEvents(prev => [...prev, data]);
        });
        addHandler('fake-bank-attacker', (dataUnknown: unknown) => {
          const data = dataUnknown as FakeBankAttackerEvent;
          setFakeBankAttackerEvents(prev => [...prev, data]);
        });
        setSocket(newSocket);

  addHandler('connect', () => {
          // Only update connection state here; room joins handled by global handler above
          setIsConnected(true);
        });
        addHandler('disconnect', () => {
          setIsConnected(false);
        });
        addHandler('connect_error', (errorUnknown: unknown) => {
          const error = errorUnknown as { message?: string };
          console.error('Socket.IO connection error:', error?.message ?? error);
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
          console.warn('❌ Socket.IO reconnection error:', error?.message ?? error);
        });

  // Also log timeouts with addHandler above; duplicate warning removed

        // Stealth viral events
        addHandler('malware-stealth-viral-spawn', (dataUnknown: unknown) => {
          const data = dataUnknown as StealthViralSpawn;
          console.log('🦠 Received stealth-viral-spawn:', data);
          setStealthSpawns(prev => [...prev, data]);
        });
        addHandler('malware-stealth-viral-progress', (dataUnknown: unknown) => {
          const data = dataUnknown as StealthViralProgress;
          console.log('📊 Received stealth-viral-progress:', data);
          setStealthProgress(prev => [...prev, data]);
        });
        addHandler('malware-stealth-viral-defeated', (dataUnknown: unknown) => {
          const data = dataUnknown as StealthViralDefeated;
          console.log('✅ Received stealth-viral-defeated:', data);
          setStealthDefeated(prev => [...prev, data]);
        });

        // Virus notifications
        addHandler('virus-notification', (dataUnknown: unknown) => {
          const data = dataUnknown as VirusNotification;
          console.log('🚨 Received virus-notification:', data);
          setVirusNotifications(prev => [...prev, data]);
        });

        // Private key compromised (DataMiner specific)
        addHandler('private-key-compromised', (dataUnknown: unknown) => {
          const data = dataUnknown as VirusNotification;
          console.log('🔑 Received private-key-compromised:', data);
          // Treat as a virus notification for UI display
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
          console.log('Tournament update received:', updateData);
          setTournamentUpdates(prev => [...prev, updateData]);
        });

        // Handle new chat messages
        addHandler('new-message', (messageUnknown: unknown) => {
          const messageData = messageUnknown as ChatMessage;
          console.log('New chat message received:', messageData);
          setChatMessages(prev => [...prev, messageData]);
        });

        // Handle achievement notifications
        addHandler('achievement-notification', (achievementUnknown: unknown) => {
          const achievementData = achievementUnknown as AchievementNotification;
          console.log('Achievement notification received:', achievementData);
          setAchievementNotifications(prev => [...prev, achievementData]);
        });

        // Handle wallet updates
        addHandler('wallet-update', (walletUnknown: unknown) => {
          const walletData = walletUnknown as WalletUpdate;
          console.log('Wallet update received:', walletData);
          setWalletUpdates(prev => [...prev, walletData]);
        });

        // Handle notifications
        addHandler('new-notification', (notificationUnknown: unknown) => {
          const notificationData = notificationUnknown as NotificationData;
          console.log('Notification received:', notificationData);
          setNotifications(prev => [...prev, notificationData]);
        });

  // Duplicate connect_error handler removed (handled above)

        // Incoming attack stream (drives attack banner UI)
        addHandler('incoming-attack', (attackUnknown: unknown) => {
          const attackData = attackUnknown as AttackData;
          console.log('Incoming attack received:', attackData);
          setIncomingAttacks(prev => [...prev, attackData]);
          setTimeout(() => {
            setIncomingAttacks(prev => prev.filter(attack => attack.timestamp !== attackData.timestamp));
          }, 10000);
        });
        // Attack sent confirmation
        addHandler('attack-sent', (attackUnknown: unknown) => {
          const attackData = attackUnknown as AttackData;
          console.log('Attack sent confirmation:', attackData);
        });

        // Global effects
        addHandler('global-effect', (effectUnknown: unknown) => {
          const effectData = effectUnknown as AttackEffect;
          console.log('Global effect triggered:', effectData);
          setGlobalEffects(prev => [...prev, effectData]);
          setTimeout(() => {
            setGlobalEffects(prev => prev.filter(effect => effect.timestamp !== effectData.timestamp));
          }, effectData.duration || 30000);
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

        // Ransom-demand already handled (alias exists as ransomware-demand)

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

        // FakeBank siphon
        addHandler('fake-bank-siphon', (dataUnknown: unknown) => {
          const data = dataUnknown as FakeBankSiphonEvent;
          setFakeBankSiphons(prev => [...prev, data]);
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

      } catch (error) {
        console.error('Failed to initialize socket:', error);
      }
    };

    initSocket();

    return () => {
      // Remove this hook instance's event handlers to avoid duplicates
      if (sharedSocket && localHandlers.length) {
        try {
          for (const [event, handler] of localHandlers) {
            sharedSocket.off(event, handler as (...args: unknown[]) => void);
          }
        } catch {
          // ignore
        }
      }
      // Decrement ref count and disconnect only when last consumer unmounts
      socketRefCount = Math.max(0, socketRefCount - 1);
      if (socketRefCount === 0 && sharedSocket) {
        try {
          sharedSocket.disconnect();
  } catch {
          // ignore
        }
        sharedSocket = null;
        joinedTeamsGlobal.clear();
        joinedUsersGlobal.clear();
        joinedTournamentsGlobal.clear();
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
            console.log('Left team room:', prev);
          } catch {}
        }
      }
    }

    joinedTeamsGlobal.add(teamId);
    if (socket && isConnected) {
      socket.emit('join-team', teamId);
      console.log('Joined team room:', teamId);
    } else {
      console.warn('Queued team join until connected:', teamId);
    }
  }, [socket, isConnected]);

  // Function to join user room
  const joinUser = (userId: string) => {
    if (joinedUsersGlobal.has(userId)) return;
    joinedUsersGlobal.add(userId);
    if (socket && isConnected) {
      socket.emit('join-user', userId);
      console.log('Joined user room:', userId);
    } else {
      console.warn('Queued user join until connected:', userId);
    }
  };

  // Function to join tournament room
  const joinTournament = (tournamentId: string) => {
    if (joinedTournamentsGlobal.has(tournamentId)) return;
    joinedTournamentsGlobal.add(tournamentId);
    if (socket && isConnected) {
      socket.emit('join-tournament', tournamentId);
      console.log('Joined tournament room:', tournamentId);
    } else {
      console.warn('Queued tournament join until connected:', tournamentId);
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
  virusNotifications,
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
