"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Win95Alert from "@/components/devices/hackbook-w95/Win95Alert";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { logoutDeviceUser } from "@/app/actions/deviceUser";
import audioManager from "@/components/devices/hackbook-w95/hooks/useAudioManager";
import { isDesktopAppAllowed } from "@/lib/role-access-matrix";

import Inbox from "@/components/devices/hackbook-w95/apps/Inbox";
import InternetExplorer from "@/components/devices/hackbook-w95/apps/InternetExplorer";
import RecycleBin from "@/components/devices/hackbook-w95/apps/RecycleBin";
import MyComputer from "@/components/devices/hackbook-w95/apps/MyComputer";
import Minesweeper from "@/components/devices/hackbook-w95/apps/Minesweeper";
import CDPlayer from "@/components/devices/hackbook-w95/apps/CDPlayer";
import Notepad from "@/components/devices/hackbook-w95/apps/Notepad";
import Calculator from "@/components/devices/hackbook-w95/apps/Calculator";
import Paint from "@/components/devices/hackbook-w95/apps/Paint";

import ZipArchive from "@/components/devices/hackbook-w95/apps/ZipArchive";
import WinTalk95 from "@/components/devices/hackbook-w95/apps/WinTalk95";
import NetworkNeighborhood from "@/components/devices/hackbook-w95/apps/NetworkNeighborhood";
import UntangleNeuralNetwork from "@/components/devices/hackbook-w95/apps/UntangleNeuralNetwork";
import NumberJumpingGame from "@/components/devices/hackbook-w95/apps/NumberJumpingGame";
import FingerprintHack from "@/components/devices/hackbook-w95/apps/FingerprintHack";
import BruteForceGame from "@/components/devices/hackbook-w95/apps/BruteForceGame";
import QuickEventPresser from "@/components/devices/hackbook-w95/apps/QuickEventPresser";
import DevTools from "@/components/devices/hackbook-w95/apps/DevTools";
import ProgramsMenu from "@/components/devices/hackbook-w95/menus/ProgramsMenu";
import ShutdownDialog from "@/components/devices/hackbook-w95/dialogs/ShutdownDialog";
import WelcomeDialog from "@/components/devices/hackbook-w95/dialogs/WelcomeDialog";
import RestartAnimation from "@/components/devices/hackbook-w95/restart-animation";
import ShutdownAnimation from "@/components/devices/hackbook-w95/shutdown-animation";
import LogoutAnimation from "@/components/devices/hackbook-w95/logout-animation";

import SystemSounds from "@/components/devices/hackbook-w95/SystemSounds";
import ScreenSaver from "@/components/devices/hackbook-w95/ScreenSaver";
import useWindowManager from "@/components/devices/hackbook-w95/hooks/useWindowManager";
import Win95Window from "@/components/devices/hackbook-w95/Win95Window";
import NotificationBadge from "@/components/devices/hackbook-w95/ui/notification_badge";
import { useGameFailureHandler } from "@/components/devices/hackbook-w95/hooks/useGameFailureHandler";
class App {
  name: string;
  icon: string;
  fullscreen: boolean;
  metadata?: Record<string, string>;
  id?: string; // Add an optional id property for unique instance identification

  constructor(name: string, icon: string) {
    this.name = name;
    this.icon = icon;
    this.fullscreen = false;
    this.id = `${name}_${Date.now()}`; // Generate a unique ID by default
  }
}

const APPS: App[] = [
  new App("My Computer", "/hackbook-W95/app-icon/mycomputer.png"),
  new App("Internet Explorer", "/hackbook-W95/app-icon/ie.png"),
  new App("Inbox", "/hackbook-W95/app-icon/inbox.png"),
  new App("Network Neighborhood", "/hackbook-W95/app-icon/nn.png"), 
  new App("Recycle Bin", "/hackbook-W95/app-icon/recyclebin.png"),
  new App("Minesweeper", "/hackbook-W95/app-icon/minesweeper.png"),
  new App("CD Player", "/hackbook-W95/app-icon/cdplayer.png"),
  new App("Terminal", "/hackbook-W95/app-icon/terminal.png"),
  new App("Notepad", "/hackbook-W95/app-icon/notepad.png"),
  new App("Calculator", "/hackbook-W95/app-icon/calculator.png"),
  new App("Paint", "/hackbook-W95/app-icon/paint.png"),
  // new App("Solitaire", "/hackbook-W95/app-icon/solitaire.png"), // REMOVED
  new App("WinTalk 95", "/hackbook-W95/app-icon/wintalk.png"),
  new App("Neural Network Analyzer", "/hackbook-W95/app-icon/network.svg"), // Hidden app - will be revealed through gameplay
  new App("Secure Vault", "/hackbook-W95/app-icon/lock.svg"), // Hidden app - will be revealed after neural network completion
  new App("Dev Tools", "/hackbook-W95/app-icon/settings.png"), // Development app for testing missions
];

// Set fullscreen for game apps
APPS.find(app => app.name === "Network Neighborhood")!.fullscreen = true;
APPS.find(app => app.name === "Neural Network Analyzer")!.fullscreen = true;
APPS.find(app => app.name === "Secure Vault")!.fullscreen = true;

// Define window sizes for different app types
const APP_WINDOW_SIZES: Record<string, { width: string | number; height: string | number }> = {
  "Calculator": { width: 280, height: 400 },
  "Minesweeper": { width: 350, height: 450 },
  "CD Player": { width: 400, height: 300 },
  "Paint": { width: 700, height: 600 },
  "Terminal": { width: 650, height: 500 },
  "WinTalk 95": { width: 500, height: 600 },
  "Dev Tools": { width: 700, height: 600 },
  // Default size for unlisted apps
  "default": { width: '80vw', height: '80vh' }
};

const DefaultValues = {
  LINK: "https://en.wikipedia.org/wiki/Wikipedia:About",
};

const Desktop = () => {
  // Win95Alert state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState<(() => void) | null>(null);
  // Unread count state for Inbox
  const [unreadCount, setUnreadCount] = useState(1); // Default to 1 for initial notification

  const router = useRouter();
  const searchParams = useSearchParams();

  // Game failure handler
  const { handleFailure } = useGameFailureHandler();

  const [openMenu, setOpenMenu] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [date, setDate] = useState(Date.now());
  const [isClient, setIsClient] = useState(false);
  const [link, setLink] = useState(DefaultValues.LINK as string);
  const [showProgramsMenu, setShowProgramsMenu] = useState(false);
  const [hasSeenMission, setHasSeenMission] = useState(false);
  const [showShutdownDialog, setShowShutdownDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showRestartAnimation, setShowRestartAnimation] = useState(false);
  const [showShutdownAnimation, setShowShutdownAnimation] = useState(false);
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const [runningApps, setRunningApps] = useState<App[]>([]);

  // Network Neighborhood availability state
  const [networkToolInstalled, setNetworkToolInstalled] = useState(false);
  const [showInstallNotification, setShowInstallNotification] = useState(false);

  // Neural Network Analyzer availability state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [neuralNetworkUnlocked, setNeuralNetworkUnlocked] = useState(false);
  const [showNeuralNetworkNotification, setShowNeuralNetworkNotification] = useState(false);

  // Secure Vault availability state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [showVaultNotification, setShowVaultNotification] = useState(false);

  // Mission 2 completion state for Number Jumping Game
  const [showNumberJumpingGame, setShowNumberJumpingGame] = useState(false);
  const [mission2JustCompleted, setMission2JustCompleted] = useState(false);

  // Dev Tools availability state
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [devToolsUnlocked, setDevToolsUnlocked] = useState(false);

  // Database-driven unlocked applications state
  const [unlockedApplications, setUnlockedApplications] = useState<string[]>([]);

  // User role and team size for access control
  const [userRole, setUserRole] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [teamSize, setTeamSize] = useState<number | null>(null);

  // Set client state after hydration to prevent SSR mismatch
  useEffect(() => {
    setIsClient(true);
    
    // Preload common sounds after component mounts
    const commonSounds = [
      "/hackbook-W95/sounds/ding.mp3",
      "/hackbook-W95/sounds/click.mp3",
      "/hackbook-W95/sounds/open.mp3",
      "/hackbook-W95/sounds/close.mp3",
      "/hackbook-W95/sounds/minimize.mp3",
      "/hackbook-W95/sounds/error.mp3"
    ];
    
    // Preload after a brief delay to not block initial render
    setTimeout(() => {
      audioManager.preloadSounds(commonSounds);
    }, 1000);
  }, []);

  // Consistent time formatting function to prevent hydration mismatch
  const formatTime = useCallback((timestamp: number) => {
    if (!isClient) {
      // Return a consistent fallback for SSR
      return "12:00";
    }
    
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    
    return `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }, [isClient]);

  // Check if Mission 1 is completed to show Network Neighborhood
  useEffect(() => {
    let isMounted = true;
    
    const checkMission1Status = async () => {
      if (!isMounted) return;
      
      try {
        const { MissionTracker } = await import('./hooks/useMissionTracker');
        
        if (!isMounted) return;
        
        const mission1Complete = MissionTracker.isMissionCompleted('mission1');
        if (isMounted) {
          setNetworkToolInstalled(mission1Complete);
        }
      } catch (error) {
        if (isMounted) {
          logger.error('Error checking mission status:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        }
      }
    };
    
    checkMission1Status();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Load game state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Only load from localStorage if the state isn't already set from database
      // Check if network tool is installed
      if (localStorage.getItem("networkToolInstalled") === "true") {
        setNetworkToolInstalled(true);
      }
      
      // Check if neural network has been unlocked
      if (localStorage.getItem("neuralNetworkUnlocked") === "true") {
        setNeuralNetworkUnlocked(true);
      }
      
      // Check if secure vault has been completed
      if (localStorage.getItem("secureVaultCompleted") === "true") {
        setVaultUnlocked(true);
      }
      
      // Check if dev tools have been unlocked
      if (localStorage.getItem("devToolsUnlocked") === "true") {
        setDevToolsUnlocked(true);
      }
    }
  }, []); // Remove state dependencies to prevent infinite loops

  // Check if Neural Network data is discovered to show Neural Network Analyzer
  useEffect(() => {
    let isMounted = true;
    
    const checkNeuralNetworkUnlock = async () => {
      if (!isMounted) return;
      
      try {
        const { MissionTracker } = await import('./hooks/useMissionTracker');
        
        if (!isMounted) return;
        
        // Unlock Neural Network Analyzer when network tool is installed and user has progressed
        const mission1Complete = MissionTracker.isMissionCompleted('mission1');
        const neuralDataDiscovered = MissionTracker.isMissionCompleted('neural_data_discovered');
        
        if (isMounted && ((mission1Complete && networkToolInstalled) || neuralDataDiscovered)) {
          setNeuralNetworkUnlocked(true);
        }
      } catch (error) {
        if (isMounted) {
          logger.error('Error checking neural network unlock status:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        }
      }
    };
    
    // Only run if networkToolInstalled changes to true
    if (networkToolInstalled) {
      checkNeuralNetworkUnlock();
    }
    
    return () => {
      isMounted = false;
    };
  }, [networkToolInstalled]); // Removed neuralNetworkUnlocked dependency to prevent infinite loop

  // Check if Mission 2 is already completed on load
  useEffect(() => {
    let isMounted = true;
    
    const checkMission2Status = async () => {
      if (!isMounted) return;
      
      try {
        const { MissionTracker } = await import('./hooks/useMissionTracker');
        
        if (!isMounted) return;
        
        const mission2Complete = MissionTracker.isMissionCompleted('mission2');
        if (isMounted && mission2Complete && !mission2JustCompleted) {
          // Mission 2 was completed previously, don't show the notification again
          // but make the firewall bypass available if needed
        }
      } catch (error) {
        if (isMounted) {
          logger.error('Error checking mission 2 status:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        }
      }
    };
    
    checkMission2Status();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount, remove mission2JustCompleted dependency

  // Device user state
  const [deviceUser, setDeviceUser] = useState<{
    _id: string;
    username: string;
    progress?: {
      unlockedApplications?: string[];
      skills?: Record<string, number>;
    };
  } | null>(null);
  const [playspaceId, setPlayspaceId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Add refs to track pending database operations to prevent duplicate calls
  const pendingDbOperations = useRef<Set<string>>(new Set());

  // Enhanced mission checking with database support
  useEffect(() => {
    let isMounted = true;
    
    const checkMissionsFromDatabase = async () => {
      if (!deviceId || !isMounted) return;
      
      try {
        // Check Mission 1 status from database
        const { getMissionStatus } = await import('@/app/actions/userProgress');
        
        if (!isMounted) return;
        
        const mission1Result = await getMissionStatus(deviceId, 'hackbook-w95', 'mission1');
        if (isMounted && mission1Result.success && mission1Result.mission) {
          setNetworkToolInstalled(mission1Result.mission.completed);
        }

        if (!isMounted) return;

        // Check neural data discovered status
        const neuralResult = await getMissionStatus(deviceId, 'hackbook-w95', 'neural_data_discovered');
        if (isMounted && neuralResult.success && neuralResult.mission?.completed) {
          setNeuralNetworkUnlocked(true);
        }

        if (!isMounted) return;

        // Check Mission 2 status
        const mission2Result = await getMissionStatus(deviceId, 'hackbook-w95', 'mission2');
        if (isMounted && mission2Result.success && mission2Result.mission?.completed) {
        }
      } catch (error) {
        if (isMounted) {
          logger.error('Error checking mission statuses from database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
          // Fall back to local storage checks if database fails
        }
      }
    };
    
    // Add a debounce delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      checkMissionsFromDatabase();
    }, 200);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [deviceId]);

  // Load unlocked applications from database
  useEffect(() => {
    let isMounted = true;
    
    const loadUnlockedApplications = async () => {
      if (!deviceId || !isMounted) return;
      
      try {
        const { getUnlockedApplications } = await import('@/app/actions/userProgress');
        const result = await getUnlockedApplications(deviceId, 'hackbook-w95');
        
        if (!isMounted) return;
        
        if (result.success && result.unlockedApplications) {
          setUnlockedApplications(result.unlockedApplications);
          
          // Update individual app states based on database data
          setNetworkToolInstalled(result.unlockedApplications.includes('Network Neighborhood'));
          setNeuralNetworkUnlocked(result.unlockedApplications.includes('Neural Network Analyzer'));
          setVaultUnlocked(result.unlockedApplications.includes('Secure Vault'));
          setDevToolsUnlocked(result.unlockedApplications.includes('Dev Tools'));
        } else {
          // Default unlocked applications for new users
          const defaultApps = ['Notepad', 'Calculator', 'Paint', 'MyComputer', 'Inbox', 'Terminal', 'Recycle Bin', 'Minesweeper', 'CD Player', 'WinTalk 95'];
          setUnlockedApplications(defaultApps);
          
          // Save default apps to database for new users
          try {
            const { updateUnlockedApplications } = await import('@/app/actions/userProgress');
            await updateUnlockedApplications(deviceId, 'hackbook-w95', defaultApps);
          } catch (error) {
            logger.error('Error saving default apps to database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
          }
        }
      } catch (error) {
        if (isMounted) {
          logger.error('Error loading unlocked applications:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
          // Fallback to default apps
          const defaultApps = ['Notepad', 'Calculator', 'Paint', 'MyComputer', 'Inbox', 'Terminal', 'Recycle Bin', 'Minesweeper', 'CD Player', 'WinTalk 95'];
          setUnlockedApplications(defaultApps);
        }
      }
    };
    
    loadUnlockedApplications();
    
    return () => {
      isMounted = false;
    };
  }, [deviceId]);

  // Check if there's a device-specific user logged in
  useEffect(() => {
    const checkDeviceUser = async () => {
      try {
        // Get playspace ID and device ID from localStorage and URL params
        let id = null;
        let devId = null;

        if (typeof window !== "undefined") {
          id = localStorage.getItem("playspaceId");
          devId = localStorage.getItem("selectedDeviceId");

          // If not in localStorage, check URL as fallback (for backwards compatibility)
          if (!id && searchParams) {
            id = searchParams.get("playspaceId");
            // If found in URL, save to localStorage for future use
            if (id) {
              localStorage.setItem("playspaceId", id);
            }
          }

          // Check URL for deviceId
          if (searchParams) {
            const urlDeviceId = searchParams.get("deviceId");
            if (urlDeviceId) {
              devId = urlDeviceId;
              localStorage.setItem("selectedDeviceId", urlDeviceId);
              localStorage.setItem("device_mac_address", urlDeviceId);
            }
          }
        }

        if (id && devId) {
          setPlayspaceId(id);
          setDeviceId(devId);

          // Skip session check, just set user as present
          setDeviceUser({
            _id: devId,
            username: "User"
          });

          // Load user role and team size from localStorage or fetch from server
          try {
            const storedRole = localStorage.getItem("selectedRole");
            const storedTeamSize = localStorage.getItem("teamSize");
            
            if (storedRole) {
              setUserRole(storedRole);
            }
            
            if (storedTeamSize) {
              setTeamSize(parseInt(storedTeamSize, 10));
            }

            // If we don't have role/team data in localStorage, try to fetch from server
            if (!storedRole || !storedTeamSize) {
              const { getDeviceUser } = await import('@/app/actions/deviceUser');
              const deviceUserData = await getDeviceUser(devId, 'hackbook-w95');
              
              if (deviceUserData.isLoggedIn && deviceUserData.user?.role) {
                setUserRole(deviceUserData.user.role);
                localStorage.setItem("selectedRole", deviceUserData.user.role);
              }
            }
          } catch (error) {
            logger.warn('Error loading user role/team data:', { error: error instanceof Error ? error.message : 'Unknown error' });
            // Continue without role-based restrictions if we can't load the data
          }

          // Check if user has seen mission briefing in user-specific storage
          import('./hooks/useUserStorage').then(({ userStorage }) => {
            const missionSeen = userStorage.getItem("missionBriefingSeen", false) as boolean;
            setHasSeenMission(missionSeen === true);
          });

          // Log device connection
          import('./hooks/useUserLogs').then(({ UserLogManager }) => {
            UserLogManager.addSystemLog(
              'system',
              `Connected to device instance: ${devId}`,
              'Device instance selection'
            );
          });

          return; // Always allow access if IDs are present
        } else {
          // No playspace ID or device ID found, redirect to device selection
          router.push('/device-selection');
        }
      } catch (error) {
        logger.error('Error checking device user:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        // On error, redirect to device selection
        router.push('/device-selection');
      }
    };

    checkDeviceUser();
  }, [router, searchParams]); // Removed deviceId dependency to prevent infinite loop

  // Function to play system sounds - moved up to be available for useEffect hooks
  const playSound = useCallback((sound: string) => {
    if (typeof window !== "undefined") {
      const win = window as Window & {
        playWin95Sound?: (sound: string) => void;
      };

      if (win.playWin95Sound) {
        win.playWin95Sound(sound);
      } else {
        // Use audio manager for proper sound handling
        audioManager.playSound(`/hackbook-W95/sounds/${sound}.mp3`, 0.5);
      }
    }
  }, []);

  // Helper function to unlock applications in database
  const unlockApplications = useCallback(async (applications: string[]) => {
    if (!deviceId) return;
    
    try {
      const { updateUnlockedApplications } = await import('@/app/actions/userProgress');
      const result = await updateUnlockedApplications(deviceId, 'hackbook-w95', applications);
      
      if (result.success && result.unlockedApplications) {
        setUnlockedApplications(result.unlockedApplications);
        
        // Update individual app states
        setNetworkToolInstalled(result.unlockedApplications.includes('Network Neighborhood'));
        setNeuralNetworkUnlocked(result.unlockedApplications.includes('Neural Network Analyzer'));
        setVaultUnlocked(result.unlockedApplications.includes('Secure Vault'));
        setDevToolsUnlocked(result.unlockedApplications.includes('Dev Tools'));
      }
    } catch (error) {
      logger.error('Error unlocking applications:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }, [deviceId]);

  // Show welcome dialog when user logs in
  useEffect(() => {
    if (deviceUser && typeof window !== "undefined") {
      // Check if user has disabled the welcome dialog
      const hideWelcome = localStorage.getItem("hideWelcomeDialog");
      
      if (!hideWelcome) {
        // Show welcome dialog after a brief delay to let the desktop load
        setTimeout(() => {
          setShowWelcomeDialog(true);
          playSound("ding");
        }, 1500);
      }
    }
  }, [deviceUser, playSound]);

  // Debug log for development
  useEffect(() => {
    if (deviceId) {
    }
  }, [deviceId]);

  // Handle logout from device
  const handleLogout = async () => {
    // Show logout animation immediately
    setShowLogoutAnimation(true);
  };

  // Handle logout animation completion
  const handleLogoutComplete = async () => {
    try {
      if (playspaceId && deviceUser) {
        // Logout from device session - this will clear the httpOnly cookie on server side
        await logoutDeviceUser(
          localStorage.getItem("selectedDeviceId") || "",
          "hackbook-w95"
        );

        // Clear only device-specific localStorage items, preserve playspaceId
        if (typeof window !== "undefined") {
          // Keep playspaceId and selectedDeviceId for proper redirection
          // Only remove device type to reset device-specific state
          localStorage.removeItem("selectedDeviceType");
        }
      }

      // Navigate back to hackbook-w95 login with preserved playspaceId and deviceId
      const storedPlayspaceId = localStorage.getItem("playspaceId") || playspaceId;
      const storedDeviceId = localStorage.getItem("selectedDeviceId") || deviceId;
      
      if (storedPlayspaceId && storedDeviceId) {
        router.push(`/hackbook-w95/login?playspaceId=${storedPlayspaceId}&deviceId=${storedDeviceId}&fromLogout=true`);
      } else {
        // Fallback to device selection only if we don't have the required IDs
        router.push("/device-selection");
      }
    } catch (error) {
      logger.error('Error logging out:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      // Even if logout fails, try to redirect to hackbook-w95 login with preserved IDs
      if (typeof window !== "undefined") {
        const storedPlayspaceId = localStorage.getItem("playspaceId") || playspaceId;
        const storedDeviceId = localStorage.getItem("selectedDeviceId") || deviceId;
        
        if (storedPlayspaceId && storedDeviceId) {
          router.push(`/hackbook-w95/login?playspaceId=${storedPlayspaceId}&deviceId=${storedDeviceId}&fromLogout=true`);
        } else {
          // Only clear localStorage and go to device selection as last resort
          localStorage.removeItem("playspaceId");
          localStorage.removeItem("selectedDeviceId");
          router.push("/device-selection");
        }
      }
    }
  };

  // Use our window manager
  const windowManager = useWindowManager({
    onWindowActivate: (id) => {
      // Find the app with this ID
      const app = APPS.find((app) => app.name === id);
      if (app) {
        setSelectedApp(app);
      }
    },
  });

  // Listen for network tool installation from WinTalk95
  useEffect(() => {
    const handleNetworkToolInstall = async () => {
      const operationKey = `mission1_install_${deviceId}`;
      
      // Prevent duplicate operations
      if (pendingDbOperations.current.has(operationKey)) {
        return;
      }
      
      setNetworkToolInstalled(true);
      setShowInstallNotification(true);
      // Play installation sound
      playSound("ding");
      
      // Unlock Network Neighborhood in database
      await unlockApplications(['Network Neighborhood']);
      
      // Store installation state in localStorage for backwards compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("networkToolInstalled", "true");
      }
      
      // Save network tool installation to database
      if (deviceId) {
        try {
          pendingDbOperations.current.add(operationKey);
          const { updateMissionProgress } = await import('@/app/actions/userProgress');
          const result = await updateMissionProgress(deviceId, "hackbook-w95", "mission1", {
            title: "Network Tool Installed",
            description: "Successfully installed the Network Neighborhood tool",
            completed: true,
            progress: 100
          });
          
          if (result.error) {
            logger.error('Database error:', { error: String(result.error || 'Unknown error'), errorObject: result.error });
          }
        } catch (error) {
          logger.error('Error saving network tool installation to database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        } finally {
          pendingDbOperations.current.delete(operationKey);
        }
      }
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowInstallNotification(false);
      }, 5000);
    };

    const handleNetworkToolRemove = async () => {
      const operationKey = `mission1_remove_${deviceId}`;
      
      // Prevent duplicate operations
      if (pendingDbOperations.current.has(operationKey)) {
        return;
      }
      
      setNetworkToolInstalled(false);
      // Close any open Network Neighborhood windows
      setRunningApps(prev => prev.filter(app => app.name !== "Network Neighborhood"));
      
      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("networkToolInstalled");
      }
      
      // Update network tool removal in database
      if (deviceId) {
        try {
          pendingDbOperations.current.add(operationKey);
          const { updateMissionProgress } = await import('@/app/actions/userProgress');
          const result = await updateMissionProgress(deviceId, "hackbook-w95", "mission1", {
            title: "Network Tool Uninstalled",
            description: "Network Neighborhood tool was removed",
            completed: false,
            progress: 0
          });
          
          if (result.error) {
            logger.error('Database error:', { error: String(result.error || 'Unknown error'), errorObject: result.error });
          }
        } catch (error) {
          logger.error('Error updating network tool removal in database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        } finally {
          pendingDbOperations.current.delete(operationKey);
        }
      }
    };

    window.addEventListener('networkToolInstalled', handleNetworkToolInstall);
    window.addEventListener('networkToolRemoved', handleNetworkToolRemove);
    return () => {
      window.removeEventListener('networkToolInstalled', handleNetworkToolInstall);
      window.removeEventListener('networkToolRemoved', handleNetworkToolRemove);
    };
  }, [playSound, deviceId, unlockApplications]);

  // Listen for neural network data discovery
  useEffect(() => {
    const handleNeuralNetworkDiscovery = async () => {
      const operationKey = `neural_discovery_${deviceId}`;
      
      // Prevent duplicate operations
      if (pendingDbOperations.current.has(operationKey)) {
        return;
      }
      
      setNeuralNetworkUnlocked(true);
      setShowNeuralNetworkNotification(true);
      // Play discovery sound
      playSound("ding");
      
      // Unlock Neural Network Analyzer in database
      await unlockApplications(['Neural Network Analyzer']);
      
      // Store in localStorage for backwards compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("neuralNetworkUnlocked", "true");
      }
      
      // Save neural network discovery to database
      if (deviceId) {
        try {
          pendingDbOperations.current.add(operationKey);
          const { updateMissionProgress } = await import('@/app/actions/userProgress');
          const result = await updateMissionProgress(deviceId, "hackbook-w95", "neural_data_discovered", {
            title: "Neural Data Discovered",
            description: "Found fragmented neural network data",
            completed: true,
            progress: 100
          });
          
          if (result.error) {
            logger.error('Database error:', { error: String(result.error || 'Unknown error'), errorObject: result.error });
          }
        } catch (error) {
          logger.error('Error saving neural network discovery to database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        } finally {
          pendingDbOperations.current.delete(operationKey);
        }
      }
      
      // Hide notification after 6 seconds
      setTimeout(() => {
        setShowNeuralNetworkNotification(false);
      }, 6000);
    };

    const handleNeuralNetworkComplete = async () => {
      const operationKey = `neural_complete_${deviceId}`;
      
      // Prevent duplicate operations
      if (pendingDbOperations.current.has(operationKey)) {
        return;
      }
      
      // When neural network is completed, unlock the secure vault
      setVaultUnlocked(true);
      setShowVaultNotification(true);
      playSound("ding");
      
      // Unlock Secure Vault in database
      await unlockApplications(['Secure Vault']);
      
      // Track neural network completion and vault unlocking in localStorage for backwards compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("neuralNetworkCompleted", "true");
        localStorage.setItem("vaultUnlocked", "true");
      }
      
      // Save neural network completion to database
      if (deviceId) {
        try {
          pendingDbOperations.current.add(operationKey);
          const { updateMissionProgress } = await import('@/app/actions/userProgress');
          const result = await updateMissionProgress(deviceId, "hackbook-w95", "neural_network_completed", {
            title: "Neural Network Completed",
            description: "Successfully reconstructed the neural network",
            completed: true,
            progress: 100
          });
          
          if (result.error) {
            logger.error('Database error:', { error: String(result.error || 'Unknown error'), errorObject: result.error });
          }
        } catch (error) {
          logger.error('Error saving neural network completion to database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        } finally {
          pendingDbOperations.current.delete(operationKey);
        }
      }
      
      // Hide notification after 6 seconds
      setTimeout(() => {
        setShowVaultNotification(false);
      }, 6000);
    };

    window.addEventListener('neuralNetworkDiscovered', handleNeuralNetworkDiscovery);
    window.addEventListener('neuralNetworkCompleted', handleNeuralNetworkComplete);
    return () => {
      window.removeEventListener('neuralNetworkDiscovered', handleNeuralNetworkDiscovery);
      window.removeEventListener('neuralNetworkCompleted', handleNeuralNetworkComplete);
    };
  }, [playSound, deviceId, unlockApplications]);

  // Listen for mission 2 completion to trigger Number Jumping Game
  useEffect(() => {
    const handleMissionComplete = async (event: Event) => {
      const customEvent = event as CustomEvent;
      const { missionId } = customEvent.detail;
      
      if (missionId === 'mission2' && !mission2JustCompleted) {
        const operationKey = `mission2_complete_${deviceId}`;
        
        // Prevent duplicate operations
        if (pendingDbOperations.current.has(operationKey)) {
          return;
        }
        
        setMission2JustCompleted(true);
        
        // Save mission completion to database
        if (deviceId) {
          try {
            pendingDbOperations.current.add(operationKey);
            const { updateMissionProgress } = await import('@/app/actions/userProgress');
            const result = await updateMissionProgress(deviceId, "hackbook-w95", "mission2", {
              title: "Mission 2 Completed",
              description: "Successfully completed the second mission",
              completed: true,
              progress: 100
            });
            
            if (result.error) {
              logger.error('Database error:', { error: String(result.error || 'Unknown error'), errorObject: result.error });
            }
          } catch (error) {
            logger.error('Error saving mission completion to database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
          } finally {
            pendingDbOperations.current.delete(operationKey);
          }
        }
        
        // Show a brief notification, then automatically open the Number Jumping Game
        setTimeout(() => {
          // Create the Firewall Bypass app instance
          const firewallApp = new App("Firewall Bypass", "/hackbook-W95/app-icon/key.png");
          firewallApp.id = `firewallBypass_${Date.now()}`;
          firewallApp.fullscreen = true; // Set fullscreen for game
          
          // Register and open the app with fullscreen
          const initialPosition = {
            isFullscreen: true,
            x: 0,
            y: 0,
            width: '100%',
            height: '100%'
          };
          windowManager.registerWindow(firewallApp.id, initialPosition);
          setRunningApps((prev) => [...prev, firewallApp]);
          setSelectedApp(firewallApp);
          windowManager.activateWindow(firewallApp.id);
          playSound("ding");
          
          setShowNumberJumpingGame(true);
        }, 2000);
      }
    };

    window.addEventListener('missionComplete', handleMissionComplete);
    return () => {
      window.removeEventListener('missionComplete', handleMissionComplete);
    };
  }, [playSound, windowManager, mission2JustCompleted, deviceId]);

  // Listen for zebra code activation to unlock Dev Tools
  useEffect(() => {
    const handleZebraCodeActivation = async () => {
      const operationKey = `zebra_code_${deviceId}`;
      
      // Prevent duplicate operations
      if (pendingDbOperations.current.has(operationKey)) {
        return;
      }
      
      setDevToolsUnlocked(true);
      playSound("ding");
      
      // Unlock Dev Tools in database
      await unlockApplications(['Dev Tools']);
      
      // Store in localStorage for backwards compatibility
      if (typeof window !== "undefined") {
        localStorage.setItem("devToolsUnlocked", "true");
      }
      
      // Save dev tools unlock to database
      if (deviceId) {
        try {
          pendingDbOperations.current.add(operationKey);
          const { updateMissionProgress } = await import('@/app/actions/userProgress');
          const result = await updateMissionProgress(deviceId, "hackbook-w95", "zebra_code_activated", {
            title: "Dev Tools Unlocked",
            description: "Zebra Code activated the developer tools",
            completed: true,
            progress: 100
          });
          
          if (result.error) {
            logger.error('Database error:', { error: String(result.error || 'Unknown error'), errorObject: result.error });
          }
        } catch (error) {
          logger.error('Error saving dev tools unlock to database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        } finally {
          pendingDbOperations.current.delete(operationKey);
        }
      }
    };

    window.addEventListener('zebraCodeActivated', handleZebraCodeActivation);
    return () => {
      window.removeEventListener('zebraCodeActivated', handleZebraCodeActivation);
    };
  }, [playSound, deviceId, unlockApplications]);
  
  // Listen for final mission completion
  useEffect(() => {
    const handleFinalMissionComplete = async () => {
      // This is a backup to ensure mission completion is saved to the database
      // even if the onSuccess callback in the QuickEventPresser component fails
      if (deviceId) {
        try {
          const { getMissionStatus, updateMissionProgress } = await import('@/app/actions/userProgress');
          
          // Check if the mission is already completed in the database
          const missionResult = await getMissionStatus(deviceId, "hackbook-w95", "final_mission");
          
          // Only update if not already completed
          if (!missionResult.completed) {
            await updateMissionProgress(deviceId, "hackbook-w95", "final_mission", {
              title: "ShadowByte Defeated",
              description: "Successfully prevented the data wipe and defeated ShadowByte",
              completed: true,
              progress: 100
            });
          }
        } catch (error) {
          logger.error('Error saving final mission completion to database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        }
      }
    };

    window.addEventListener('finalMissionComplete', handleFinalMissionComplete);
    return () => {
      window.removeEventListener('finalMissionComplete', handleFinalMissionComplete);
    };
  }, [deviceId]);
  
  // Listen for game state reset event
  useEffect(() => {
    const handleResetGameState = async () => {
      // Reset all app installation states
      setNetworkToolInstalled(false);
      setNeuralNetworkUnlocked(false);
      setVaultUnlocked(false);
      setDevToolsUnlocked(false);
      setMission2JustCompleted(false);
      setShowNumberJumpingGame(false);
      
      // Reset unlocked applications to default
      const defaultApps = ['Notepad', 'Calculator', 'Paint', 'MyComputer', 'Inbox', 'Terminal', 'Recycle Bin', 'Minesweeper', 'CD Player', 'WinTalk 95'];
      setUnlockedApplications(defaultApps);
      
      // Update database with default unlocked applications
      if (deviceId) {
        try {
          const { updateUnlockedApplications } = await import('@/app/actions/userProgress');
          await updateUnlockedApplications(deviceId, 'hackbook-w95', defaultApps);
        } catch (error) {
          logger.error('Error resetting unlocked applications in database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        }
      }
      
      // Clear all mission-related localStorage items
      if (typeof window !== 'undefined') {
        // Clear any mission flags from localStorage
        localStorage.removeItem("mission1Completed");
        localStorage.removeItem("mission2Completed");
        localStorage.removeItem("neural_data_discovered");
        localStorage.removeItem("mission2JustCompleted");
        localStorage.removeItem("zebra_code_activated");
        
        // Clear app installation states from localStorage
        localStorage.removeItem("networkToolInstalled");
        localStorage.removeItem("neuralNetworkUnlocked");
        localStorage.removeItem("secureVaultCompleted");
        localStorage.removeItem("devToolsUnlocked");
      }
      
      // Close any related open windows
      setRunningApps(prev => prev.filter(app => 
        !["Network Neighborhood", "Neural Network Analyzer", "Secure Vault", "Emergency Protocol", "Dev Tools",
          "Firewall Bypass", "Password Cracker"]
        .includes(app.name)
      ));
    };

    window.addEventListener('resetGameState', handleResetGameState);
    return () => {
      window.removeEventListener('resetGameState', handleResetGameState);
    };
  }, [deviceId, setUnlockedApplications]);

  // Clear selections (menu, desktop icons, etc)
  const deSelect = useCallback(() => {
    setSelectedApp(null);
    setOpenMenu(false);
    setShowProgramsMenu(false);
  }, []);

  // Close an application window
  const handleCloseApp = useCallback(
    (app: App) => {
      // Special handling for Emergency Protocol app when closed
      if (app.name === 'Emergency Protocol') {
        // Dispatch event to notify that Emergency Protocol was closed
        window.dispatchEvent(new CustomEvent('emergencyProtocolClosed'));
      }
      
      // Use the app's unique ID instead of name for window operations
      if (app.id) {
        // Close the window
        windowManager.closeWindow(app.id);
      }

      // Remove this specific app instance from running apps
      setRunningApps((prev) => prev.filter((runningApp) => runningApp !== app));

      // Deselect if this was the selected app
      if (selectedApp === app) {
        setSelectedApp(null);
      }

      playSound("close");
    },
    [windowManager, selectedApp, playSound]
  );

  // Open an application
  const handleOpenApp = useCallback(
    (app: App) => {
      // Check role-based access control first
      if (userRole && !isDesktopAppAllowed(app.name, userRole)) {
        // Show access denied alert
        setAlertMessage(
          `Access Denied: Your role "${userRole}" does not have permission to use "${app.name}". ` +
          `This application is restricted based on your team role and responsibilities.`
        );
        setAlertOpen(true);
        playSound("error");
        return;
      }

      // Check if app is Notepad with filePath metadata
      const isNewNotepadFile = app.name === "Notepad" && app.metadata && app.metadata.filePath;
      
      // Check if an app with the same name is already running
      const existingApp = runningApps.find(runningApp => 
        runningApp.name === app.name && 
        // For Notepad, only consider it existing if it's the same file
        !(app.name === "Notepad" && app.metadata?.filePath && 
          runningApp.metadata?.filePath !== app.metadata.filePath)
      );
      
      if (existingApp && !isNewNotepadFile) {
        // If app is already running, just activate its window
        if (existingApp.id) {
          windowManager.activateWindow(existingApp.id);
          setSelectedApp(existingApp);
          playSound("click");
          
          // Close any open menus
          deSelect();
        }
      } else {
        // Create new instance only if app isn't already running
        const appInstanceId = `${app.name}_${Date.now()}`;
        const appInstance = new App(app.name, app.icon);
        
        // Copy any metadata from the original app
        if (app.metadata) {
          appInstance.metadata = { ...app.metadata };
        }
        
        // Copy fullscreen setting from the original app
        if (app.fullscreen) {
          appInstance.fullscreen = app.fullscreen;
        }
        
        // Set a unique ID for this instance
        appInstance.id = appInstanceId;
        
        // Prepare initial window position - set to fullscreen if app requires it
        let initialPosition;
        if (appInstance.fullscreen) {
          initialPosition = {
            isFullscreen: true,
            x: 0,
            y: 0,
            width: '100%',
            height: '100%'
          };
        } else {
          // Get app-specific window size or use default
          const appSize = APP_WINDOW_SIZES[app.name] || APP_WINDOW_SIZES.default;
          initialPosition = {
            width: appSize.width,
            height: appSize.height
          };
        }
        
        // Register the window in the window manager with the unique ID
        windowManager.registerWindow(appInstanceId, initialPosition);
        
        // Add to running apps
        setRunningApps((prev) => [...prev, appInstance]);
        
        // Set as selected app
        setSelectedApp(appInstance);
        
        // Activate the window
        windowManager.activateWindow(appInstanceId);
        
        // Play open sound
        playSound("open");
        
        // Close any open menus
        deSelect();
      }
    },
    [windowManager, deSelect, playSound, runningApps, userRole]
  );

  // Listen for development app launch events
  useEffect(() => {
    const handleDevLaunchApp = (event: CustomEvent) => {
      const { appName, app: customApp, forceFullscreen } = event.detail;
      
      if (customApp) {
        // Handle custom app object - set fullscreen if specified
        if (forceFullscreen || customApp.metadata?.forceFullscreen === 'true') {
          customApp.fullscreen = true;
        }
        handleOpenApp(customApp);
      } else if (appName) {
        // Handle app by name
        const app = APPS.find(a => a.name === appName);
        if (app) {
          // Create a copy of the app to avoid modifying the original
          const appInstance = new App(app.name, app.icon);
          appInstance.metadata = { ...app.metadata };
          
          // Set fullscreen if specified
          if (forceFullscreen) {
            appInstance.fullscreen = true;
          }
          handleOpenApp(appInstance);
        }
      }
    };

    window.addEventListener('devLaunchApp', handleDevLaunchApp as EventListener);
    
    // Handle Notepad launch events (for new documents)
    const handleLaunchNotepad = (event: CustomEvent) => {
      const notepadData = event.detail;
      
      // Find Notepad app template
      const notepadAppTemplate = APPS.find((app) => app.name === "Notepad");
      
      if (notepadAppTemplate) {
        // Create a new instance of Notepad
        const notepadApp = new App(notepadAppTemplate.name, notepadAppTemplate.icon);
        
        // Add file metadata
        notepadApp.metadata = {
          filePath: notepadData.filePath,
          initialContent: notepadData.content
        };
        
        // Launch the app
        handleOpenApp(notepadApp);
      }
    };
    
    window.addEventListener('launchNotepad', handleLaunchNotepad as EventListener);
    
    return () => {
      window.removeEventListener('devLaunchApp', handleDevLaunchApp as EventListener);
      window.removeEventListener('launchNotepad', handleLaunchNotepad as EventListener);
    };
  }, [handleOpenApp]);

  // Toggle fullscreen for a window
  const handleToggleFullscreen = useCallback(
    (app: App) => {
      // Use app's unique ID instead of name
      if (app.id) {
        windowManager.toggleFullscreen(app.id);
      }
    },
    [windowManager]
  );

  // Handle minimize functionality
  const handleMinimizeApp = useCallback(
    (app: App) => {
      if (app.id) {
        windowManager.minimizeWindow(app.id);
        playSound("minimize");
      }
    },
    [windowManager, playSound]
  );

  // Handle restore functionality
  const handleRestoreApp = useCallback(
    (app: App) => {
      if (app.id) {
        windowManager.activateWindow(app.id);
        playSound("open");
      }
    },
    [windowManager, playSound]
  );

  // No need for a separate icon selection handler, we handle it directly in the click event

  // Function to open a link in Internet Explorer
  const openLink = useCallback(
    (linkUrl: string) => {
      const app = APPS.find((app) => app.name === "Internet Explorer");
      if (app) {
        handleOpenApp(app);
      }

      const searchBar = document.getElementById("searchBar") as HTMLInputElement;
      if (searchBar) {
        searchBar.value = linkUrl;
      }

      setLink(linkUrl);
    },
    [handleOpenApp]
  );

  // Render application content based on app type
  const renderAppContent = useCallback(
    (app: App) => {
      switch (app.name) {
        case "My Computer":
          return <MyComputer onClose={() => handleCloseApp(app)} />;
        case "Internet Explorer":
          return <InternetExplorer link={link} setLink={setLink} onClose={() => handleCloseApp(app)} />;
        case "Inbox":
          return <Inbox onClose={() => handleCloseApp(app)} openLink={openLink} unreadCount={unreadCount} setUnreadCount={setUnreadCount} />;
        case "Network Neighborhood":
          return <NetworkNeighborhood onClose={() => handleCloseApp(app)} />;
        case "Recycle Bin":
          return <RecycleBin onClose={() => handleCloseApp(app)} />;
        case "Minesweeper":
          return <Minesweeper onClose={() => handleCloseApp(app)} />;
        case "CD Player":
          return <CDPlayer onClose={() => handleCloseApp(app)} />;
        case "Terminal":
          return (
            <div className="w-full h-full bg-black text-green-500 p-4 font-mono overflow-auto">
              <div className="flex justify-between items-start">
                <div className="w-full">
                  <p className="font-bold mb-2">Microsoft(R) Windows 95 - MS-DOS Prompt</p>
                  <TerminalComponent />
                </div>
                <button className="text-green-500 hover:text-white px-1" onClick={() => handleCloseApp(app)}>
                  X
                </button>
              </div>
            </div>
          );
        case "Notepad":
          return (
            <Notepad
              onClose={() => handleCloseApp(app)}
              filePath={app.metadata?.filePath}
              initialContent={app.metadata?.content}
            />
          );
        case "Calculator":
          return <Calculator onClose={() => handleCloseApp(app)} />;
        case "Paint":
          return <Paint onClose={() => handleCloseApp(app)} />;
        // case "Solitaire":
        //   return <Solitaire onClose={() => handleCloseApp(app)} />; // REMOVED
        case "WinTalk 95":
          return <WinTalk95 onClose={() => handleCloseApp(app)} />;
        case "Neural Network Analyzer":
          return (
            <UntangleNeuralNetwork 
              onClose={() => handleCloseApp(app)} 
              onSuccess={(data) => {
                try {
                  // Trigger vault unlock
                  window.dispatchEvent(new CustomEvent('neuralNetworkCompleted', {
                    detail: { dataLength: data?.length || 0 } // Only pass safe, serializable data
                  }));
                  // Handle the success - maybe open a new file or trigger next mission
                  // For now, just close the app
                  handleCloseApp(app);
                } catch (error) {
                  logger.error('Error in neural network success handler:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
                  handleCloseApp(app);
                }
              }}
            />
          );
        case "Secure Vault":
          return (
            <FingerprintHack 
              onClose={() => handleCloseApp(app)}
              onSuccess={() => {
                // Close the vault
                handleCloseApp(app);
                
                // Use a flag in localStorage to prevent duplicate launches
                if (typeof window !== "undefined" && !localStorage.getItem("emergencyProtocolLaunched")) {
                  // Mark that the emergency protocol has been launched
                  localStorage.setItem("emergencyProtocolLaunched", "true");
                  // Also mark that secure vault has been completed
                  localStorage.setItem("secureVaultCompleted", "true");
                  
                  // Show Win95Alert after a brief delay
                  setTimeout(() => {
                    setAlertMessage("🚨 CRITICAL ALERT! 🚨\n\nShadowByte's security system has detected the breach!\nRemote wipe protocol activated!\n\nYou must act quickly to stop the data destruction!");
                    setAlertOpen(true);
                    setAlertCallback(() => () => {
                      // Auto-launch the emergency protocol after alert is closed
                      const quickEventApp = new App("Emergency Protocol", "/hackbook-w95/app-icon/settings.png");
                      quickEventApp.fullscreen = true; // Set fullscreen for game
                      quickEventApp.metadata = {
                        type: "quick-event"
                      };
                      handleOpenApp(quickEventApp);
                    });
                  }, 2000);
                }
              }}
            />
          );
        case "Emergency Protocol":
          return (
            <QuickEventPresser 
              onClose={() => handleCloseApp(app)}
              onSuccess={async () => {
                // Handle successful completion of emergency protocol
                
                // Save final mission completion to database
                if (deviceId) {
                  try {
                    const { updateMissionProgress } = await import('@/app/actions/userProgress');
                    await updateMissionProgress(deviceId, "hackbook-w95", "final_mission", {
                      title: "ShadowByte Defeated",
                      description: "Successfully prevented the data wipe and defeated ShadowByte",
                      completed: true,
                      progress: 100
                    });
                  } catch (error) {
                    logger.error('Error saving final mission completion to database:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
                  }
                }
                
                // Trigger final mission completion
                window.dispatchEvent(new CustomEvent('finalMissionComplete'));
                
                // Don't auto-close the app anymore - let user see score screen and set difficulty
                // Show Win95Alert only when user manually closes the score screen
                const congratHandler = () => {
                  // Listen for app close event
                  const handleAppClose = () => {
                    // Remove this listener after first execution
                    window.removeEventListener('emergencyProtocolClosed', handleAppClose);
                    
                    // Show congratulation alert
                    setAlertMessage("🎉 CONGRATULATIONS! 🎉\n\nYou have successfully completed all missions and stopped ShadowByte's attack!\n\nThe system is now secure and all evidence has been preserved.\n\nCheck your score in the Quick Event game and see if you made it to the leaderboard!\n\nMission accomplished, Agent!");
                    setAlertOpen(true);
                    setAlertCallback(null);
                  };
                  
                  // Set up listener for when user closes the app
                  window.addEventListener('emergencyProtocolClosed', handleAppClose);
                };
                
                // Set up the congratulations handler
                congratHandler();
              }}
              onFailure={() => {
                // Trigger account deletion and redirect to login
                handleFailure();
              }}
            />
          );
        case "Dev Tools":
          return <DevTools onClose={() => handleCloseApp(app)} />;
        case "Firewall Bypass":
          return (
            <NumberJumpingGame
              onClose={() => {
                handleCloseApp(app);
                // After Firewall Bypass closes, open Neural Network Analyzer
                setTimeout(() => {
                  const neuralApp = APPS.find(a => a.name === "Neural Network Analyzer");
                  if (neuralApp) {
                    handleOpenApp(neuralApp);
                  }
                }, 1000); // 1s delay for smooth transition
              }}
            />
          );
        case "Password Cracker":
          return (
            <BruteForceGame 
              onClose={() => handleCloseApp(app)}
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              onSuccess={(_password) => {
                // Check if there's a parent callback function to call
                if (app.metadata?.parentCallback) {
                  const callback = app.metadata.parentCallback as unknown as () => void;
                  callback();
                }
                handleCloseApp(app);
              }}
              targetFileName={app.metadata?.targetFileName as string || "ShadowByte_Archive.zip"}
            />
          );
        case "ZIP Archive":
          return (
            <ZipArchive
              onClose={() => handleCloseApp(app)}
              filePath={app.metadata?.filePath as string}
              isLocked={Boolean(app.metadata?.isPasswordProtected)}
              password={app.metadata?.password as string}
            />
          );
        default:
          return null;
      }
    },
    [handleCloseApp, handleOpenApp, link, setLink, openLink, unreadCount, setUnreadCount, deviceId, handleFailure]
  );

  // Handle keyboard events and file opening
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selectedApp) {
        handleOpenApp(selectedApp);
      }
    };

    // Add handler for opening files from MyComputer
    const handleOpenFile = (e: CustomEvent) => {
      const fileData = e.detail;
      if (fileData.extension === "txt") {
        // Find Notepad app
        const notepadAppTemplate = APPS.find((app) => app.name === "Notepad");
        if (notepadAppTemplate) {
          // Create a new instance of the Notepad app for this file
          const notepadApp = new App(notepadAppTemplate.name, notepadAppTemplate.icon);
          // Add file metadata to the app
          notepadApp.metadata = {
            filePath: fileData.path,
            content: fileData.content || "",
          };
          // Open the app
          handleOpenApp(notepadApp);
        }
      } else if (fileData.extension === "zip") {
        // Create a new ZIP Archive app instance
        const zipApp = new App("ZIP Archive", "/hackbook-w95/file-icons/archive.png");
        zipApp.metadata = {
          filePath: fileData.path,
          isPasswordProtected: fileData.isPasswordProtected,
          password: fileData.password
        };
        // Open the app
        handleOpenApp(zipApp);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("win95openfile", handleOpenFile as EventListener);

    const interval = setInterval(() => {
      setDate(new Date().getTime());
    }, 1000);

    // Removed automatic mission briefing - users can manually open Inbox when needed
    // Mission briefing seen status is still tracked for individual user preferences
    if (!hasSeenMission && deviceUser) {
      // Just mark as seen without opening the app
      import('./hooks/useUserStorage').then(({ userStorage }) => {
        userStorage.setItem("missionBriefingSeen", true);
      });
      setHasSeenMission(true);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("win95openfile", handleOpenFile as EventListener);
      clearInterval(interval);
    };
  }, [handleOpenApp, selectedApp, hasSeenMission, deviceUser]); // Removed runningApps dependency

  return (
    <main id="screen" className="h-screen w-screen overscroll-none fixed text-black">
      <SystemSounds enabled={true} />
      <ScreenSaver timeoutMinutes={2} />

      {/* Win95Alert for critical events */}
      {alertOpen && (
        <Win95Alert 
          message={alertMessage}
          onClose={() => {
            setAlertOpen(false);
            if (alertCallback) {
              alertCallback();
              setAlertCallback(null);
            }
          }}
        />
      )}

      {/* Desktop background with icons */}
      <div
        id="desktop"
        className="bg-[#008080] w-full h-[96%] z-0 text-black p-2 relative overflow-hidden"
        onClick={deSelect}
      >
        {/* App icons - using grid layout with consistent sizing */}
        <div className="absolute top-4 left-4">
          <div className="grid grid-cols-3 gap-6">
            {APPS.filter(app => {
              // Check if app is unlocked in database
              const isUnlocked = unlockedApplications.includes(app.name);
              
              // Always show basic apps (these are unlocked by default)
              const basicApps = ['Notepad', 'Calculator', 'Paint', 'MyComputer', 'Inbox', 'Terminal', 'Recycle Bin', 'Minesweeper', 'CD Player', 'WinTalk 95'];
              if (basicApps.includes(app.name)) {
                // Even basic apps should respect role restrictions
                if (userRole) {
                  return isDesktopAppAllowed(app.name, userRole);
                }
                return true;
              }
              
              // Special cases - these apps are never shown as desktop icons
              if (app.name === "Solitaire") return false;
              if (app.name === "Emergency Protocol") return false;
              
              // For mission-specific apps, check database unlock status AND role permissions
              if (['Network Neighborhood', 'Neural Network Analyzer', 'Secure Vault', 'Dev Tools'].includes(app.name)) {
                if (!isUnlocked) return false;
                
                // Check role-based access control
                if (userRole && !isDesktopAppAllowed(app.name, userRole)) {
                  return false;
                }
                
                return true;
              }
              
              // For other apps, check role permissions if user role is available
              if (userRole && !isDesktopAppAllowed(app.name, userRole)) {
                return false;
              }
              
              return true;
            }).map((app) => {
              const isInbox = app.name === "Inbox";
              return (
                <div
                  key={app.name}
                  className={clsx("flex flex-col items-center z-10 p-1 w-24 relative", {
                    "bg-[#000080]/40": app === selectedApp,
                  })}
                  onClick={(e) => {
                    e.stopPropagation();
                    playSound("click");
                    if (selectedApp !== app) {
                      setSelectedApp(app);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    playSound("click");
                    handleOpenApp(app);
                  }}
                >
                  <div className="w-12 h-12 flex items-center justify-center relative">
                    <Image
                      className="object-contain max-w-full max-h-full"
                      src={app.icon}
                      alt={app.name}
                      width={60}
                      height={60}
                      priority
                    />
                    {/* Notification badge for Inbox */}
                    {isInbox && unreadCount > 0 && (
                      <NotificationBadge />
                    )}
                  </div>
                  <h4
                    className={clsx("w-24 mt-1 text-xs text-white text-center px-1 shadow-sm", {
                      "bg-[#000080]": app === selectedApp,
                    })}
                  >
                    {app.name}
                  </h4>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Running application windows */}
      {runningApps.map((app) => {
        // Use the app's unique ID for window state lookup
        const windowId = app.id || app.name;
        const windowState = windowManager.getWindowState(windowId);
        if (!windowState) return null;
        // Render all windows but show/hide based on minimized state
        // Windows stay rendered and in their position even when not active
        return (
          <Win95Window
            key={windowId}
            id={windowId}
            title={app.name}
            icon={app.icon}
            position={windowState.position}
            isActive={windowState.isActive}
            visible={!windowState.isMinimized} // Hide window when minimized
            onActivate={() => windowManager.activateWindow(windowId)}
            onClose={() => handleCloseApp(app)}
            onMinimize={() => handleMinimizeApp(app)}
            onToggleFullscreen={() => handleToggleFullscreen(app)}
            onPositionChange={(position) => windowManager.updateWindowPosition(windowId, position)}
          >
            {renderAppContent(app)}
          </Win95Window>
        );
      })}

      {/* Start menu */}
      {openMenu && (
        <div className="absolute bottom-[4%] left-0 w-64 z-40 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-md">
          <div className="w-full h-8 bg-gradient-to-r from-[#000080] to-[#1084d0] flex items-center px-2">
            <div className="flex items-center">
              <Image
                src="/hackbook-W95/app-icon/windows-logo.png"
                alt="Windows Logo"
                width={24}
                height={24}
                className="h-6 w-6 mr-1"
                priority
              />
              <h1 className="text-white font-bold text-lg">Windows 95</h1>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-1">
            {/* Programs menu item */}
            <div
              className="px-1 py-1 border-b border-b-[#808080] flex items-center hover:bg-[#000080] hover:text-white cursor-pointer"
              onClick={() => {
                setShowProgramsMenu(!showProgramsMenu);
              }}
            >
              <div className="w-8 h-8 flex items-center justify-center mr-1">
                <Image src="/hackbook-W95/app-icon/programs.png" alt="Programs" width={32} height={32} priority />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Programs</span>
                <span className="text-sm">▶</span>
              </div>
            </div>

            {/* Documents category */}
            <div className="px-1 py-1 border-b border-b-[#808080] flex items-center hover:bg-[#000080] hover:text-white cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center mr-1">
                <Image src="/hackbook-W95/app-icon/documents.png" alt="Documents" width={32} height={32} priority />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Documents</span>
                <span className="text-sm">▶</span>
              </div>
            </div>

            {/* Settings category */}
            <div className="px-1 py-1 border-b border-b-[#808080] flex items-center hover:bg-[#000080] hover:text-white cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center mr-1">
                <Image src="/hackbook-W95/app-icon/settings.png" alt="Settings" width={32} height={32} priority />
              </div>
              <div className="flex-1 flex items-center justify-between">
                <span className="text-sm">Settings</span>
                <span className="text-sm">▶</span>
              </div>
            </div>

            {/* Run menu item */}
            <div className="px-1 py-1 border-b border-b-[#808080] flex items-center hover:bg-[#000080] hover:text-white cursor-pointer">
              <div className="w-8 h-8 flex items-center justify-center mr-1">
                <Image src="/hackbook-W95/app-icon/run.png" alt="Run" width={32} height={32} priority />
              </div>
              <span className="text-sm">Run...</span>
            </div>

            {/* Shutdown item */}
            <div
              className="px-1 py-1 flex items-center hover:bg-[#000080] hover:text-white cursor-pointer"
              onClick={() => {
                setShowShutdownDialog(true);
                setOpenMenu(false);
              }}
            >
              <div className="w-8 h-8 flex items-center justify-center mr-1">
                <Image src="/hackbook-W95/app-icon/shut-down.png" alt="Shut Down" width={32} height={32} priority />
              </div>
              <span className="text-sm">Shut Down...</span>
            </div>
          </div>
        </div>
      )}

      {/* Programs submenu */}
      {showProgramsMenu && openMenu && (
        <ProgramsMenu
          onClose={() => setShowProgramsMenu(false)}
          onProgramClick={(programName) => {
            const app = APPS.find((a) => a.name === programName);
            if (app) {
              handleOpenApp(app);
              setShowProgramsMenu(false);
              setOpenMenu(false);
            }
          }}
        />
      )}

      {/* Welcome dialog */}
      {showWelcomeDialog && (
        <WelcomeDialog
          onClose={() => setShowWelcomeDialog(false)}
          username={deviceUser?.username}
        />
      )}

      {/* Shutdown dialog */}
      {showShutdownDialog && (
        <ShutdownDialog
          onCancel={() => setShowShutdownDialog(false)}
          onShutDown={() => {
            setShowShutdownDialog(false);
            setShowShutdownAnimation(true);
          }}
          onRestart={() => {
            setShowShutdownDialog(false);
            setShowRestartAnimation(true);
          }}
          onLogout={handleLogout}
          showLogout={!!deviceUser}
        />
      )}

      {/* Restart animation */}
      {showRestartAnimation && (
        <RestartAnimation
          onComplete={() => {
            setShowRestartAnimation(false);
            // Animation completes without reloading the page. This is intentional for the hackbook-w95 simulation and does not perform a full restart.
          }}
        />
      )}

      {/* Shutdown animation */}
      {showShutdownAnimation && (
        <ShutdownAnimation
          onComplete={() => {
            setShowShutdownAnimation(false);
            router.push("/device-selection");
          }}
        />
      )}

      {/* Logout animation */}
      {showLogoutAnimation && (
        <LogoutAnimation
          username={deviceUser?.username || "User"}
          onComplete={handleLogoutComplete}
        />
      )}

      {/* Bottom taskbar */}
      <div
        id="taskbar"
        className="w-full bg-[#c0c0c0] h-[4%] flex justify-between border-t-2 border-t-[#ffffff] shadow-inner"
      >
        <button
          type="button"
          aria-expanded="false"
          id="menu-button"
          className={clsx(
            "text-center my-auto flex items-center h-[80%] font-bold border-2 rounded-none px-2 m-0.5 text-sm bg-[#c0c0c0]",
            {
              "border-[#808080] border-t-[#404040] border-l-[#404040] shadow-inner": openMenu,
              "border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] win95-shadow": !openMenu,
            }
          )}
          onClick={() => {
            setOpenMenu(!openMenu);
            playSound("click");
          }}
        >
          <Image
            src="/hackbook-W95/app-icon/windows-logo.png"
            alt="Windows Logo"
            width={16}
            height={16}
            className="h-5 w-5 mr-1"
            priority
          />
          <span>Start</span>
        </button>

        {/* Taskbar separator */}
        <div className="h-full w-[1px] bg-[#808080] mx-1"></div>

        {/* Taskbar apps */}
        <div id="panel" className="w-[85%] h-full flex justify-start">
          {runningApps.filter(app => app.name !== "Solitaire").map((app) => {
            const windowId = app.id || app.name;
            const windowState = windowManager.getWindowState(windowId);
            if (!windowState) return null;
            
            const isActive = windowState.isActive;
            const isMinimized = windowState.isMinimized;

            return (
              <div
                key={windowId}
                className={clsx("max-w-[200px] h-[80%] my-auto border-2 flex items-center mx-1", {
                  "bg-[#dcdcdc] border-t-[#ffffff] border-l-[#ffffff] border-r-[#808080] border-b-[#808080] shadow-inner":
                    isActive,
                  "bg-[#c0c0c0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] win95-shadow":
                    !isActive && !isMinimized,
                  "bg-[#a0a0a0] border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]":
                    isMinimized
                })}
                onClick={() => {
                  if (isMinimized || !isActive) {
                    handleRestoreApp(app);
                  } else {
                    handleMinimizeApp(app);
                  }
                  playSound("click");
                }}
              >
                <Image className="h-6 w-6 mx-1" src={app.icon} alt="App Icon" width={24} height={24} priority />
                <h1 className="text-black text-left truncate font-normal text-sm pr-2">{app.name}</h1>
              </div>
            );
          })}
        </div>
        {/* System tray with notifications and clock */}
        <div className="flex items-center gap-2">
          {/* Clock */}
          <div className="text-center h-[80%] my-auto px-2 border-2 text-sm border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] flex items-center bg-[#c0c0c0]">
            {formatTime(date)}
          </div>
        </div>
      </div>

      {/* Network Tool Installation Notification */}
      {showInstallNotification && (
        <div className="absolute top-4 right-4 z-[9999] bg-[#c0c0c0] border-2 border-outset p-4 min-w-64 animate-pulse">
          <div className="bg-green-600 text-white p-2 mb-2 text-center">
            <h3 className="font-bold">Software Installation</h3>
          </div>
          <div className="text-center">
            <p className="mb-2">📥 Network Neighborhood v2.1</p>
            <p className="text-sm">Installation Complete!</p>
            <p className="text-xs text-gray-600 mt-2">
              New desktop icon added. Double-click to launch.
            </p>
          </div>
        </div>
      )}

      {/* Neural Network Discovery Notification */}
      {showNeuralNetworkNotification && (
        <div className="absolute top-4 right-4 z-[9999] bg-[#c0c0c0] border-2 border-outset p-4 min-w-64 animate-pulse">
          <div className="bg-purple-600 text-white p-2 mb-2 text-center">
            <h3 className="font-bold">🧠 NEURAL DATA DISCOVERED</h3>
          </div>
          <div className="text-center">
            <p className="mb-2">🔍 Fragmented Intelligence Found</p>
            <p className="text-sm">Neural Network Analyzer Unlocked!</p>
            <p className="text-xs text-gray-600 mt-2">
              Restore the fragmented data to reveal critical intelligence.
            </p>
          </div>
        </div>
      )}

      {/* Secure Vault Unlock Notification */}
      {showVaultNotification && (
        <div className="absolute top-4 right-4 z-[9999] bg-[#c0c0c0] border-2 border-outset p-4 min-w-64 animate-pulse">
          <div className="bg-red-600 text-white p-2 mb-2 text-center">
            <h3 className="font-bold">🔐 VAULT ACCESS DETECTED</h3>
          </div>
          <div className="text-center">
            <p className="mb-2">🗝️ ShadowByte&apos;s Secure Archive Located</p>
            <p className="text-sm">Biometric Scanner Required!</p>
            <p className="text-xs text-gray-600 mt-2">
              Access the secure vault to retrieve critical intel.
            </p>
          </div>
        </div>
      )}

      {/* Mission 2 Completion Notification */}
      {mission2JustCompleted && !showNumberJumpingGame && (
        <div className="absolute top-4 right-4 z-[9999] bg-[#c0c0c0] border-2 border-outset p-4 min-w-80 animate-pulse">
          <div className="bg-[#000080] text-white p-2 mb-2 text-center">
            <h3 className="font-bold">🔒 SECURITY PROTOCOL ACTIVATED</h3>
          </div>
          <div className="text-center">
            <p className="mb-2 font-bold">TARGET LOCATED!</p>
            <p className="text-sm mb-2">ShadowByte&apos;s IP has been identified.</p>
            <p className="text-sm mb-2">⚠️ FIREWALL BREACH PROTOCOL REQUIRED</p>
            <p className="text-xs text-gray-600 mt-2">
              Initializing bypass tools...
            </p>
          </div>
        </div>
      )}
    </main>
  );
};


// --- TerminalComponent: Functional Win95 Terminal ---
// (No import needed here, already imported at top)
import useFileSystem from "@/components/devices/hackbook-w95/hooks/useFileSystem";
import { logger } from '@/lib/logger';

const TerminalComponent: React.FC = () => {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [accessGranted, setAccessGranted] = useState(false);
  const [hiddenFilesEnabled, setHiddenFilesEnabled] = useState(false);
  const [prevCommands, setPrevCommands] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [currentDirectory, setCurrentDirectory] = useState<string>("C:");
  const [tabSuggestions, setTabSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const fs = useFileSystem();

  // Function to play terminal sounds
  const playTerminalSound = (soundType: string) => {
    try {
      switch (soundType) {
        case "click":
          audioManager.playSound("/hackbook-W95/sounds/click.mp3", 0.5);
          break;
        case "error":
          audioManager.playSound("/hackbook-W95/sounds/error.mp3", 0.5);
          break;
        case "success":
          audioManager.playSound("/hackbook-W95/sounds/ding.mp3", 0.5);
          break;
        default:
          audioManager.playSound("/hackbook-W95/sounds/click.mp3", 0.5);
      }
    } catch (error) {
      logger.error('Terminal sound error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  };

  useEffect(() => {
    const checkHiddenFilesEnabled = async () => {
      try {
        const { userStorage } = await import('./hooks/useUserStorage');
        const showHidden = userStorage.getItem("showHiddenFiles", false) as boolean;
        setHiddenFilesEnabled(showHidden === true);
      } catch (error) {
        logger.error('Error reading hidden files setting:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    };
    checkHiddenFilesEnabled();
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    setCommandHistory([
      "Microsoft(R) Windows 95",
      "(C)Copyright Microsoft Corp 1981-1995.",
      "",
      'Type "help" for a list of available commands.',
    ]);
  }, []);

  const availableCommands = [
    "help","dir","clear","cls","type","cd","pwd","systeminfo","show hidden files","access","decrypt-file","emergency-abort","ver","date","time","echo","exit","mem","md","rd"
  ];

  const getTabSuggestions = (cmd: string): string[] => {
    if (!cmd) return [];
    if (!cmd.includes(" ")) {
      return availableCommands.filter((c) => c.startsWith(cmd.toLowerCase()));
    }
    const parts = cmd.split(" ");
    const command = parts[0].toLowerCase();
    const partial = parts[parts.length - 1];
    if (["cd", "type", "md", "rd"].includes(command)) {
      const items = fs.getCurrentItems();
      return items
        .filter((item) => item.name.toLowerCase().startsWith(partial.toLowerCase()))
        .filter((item) => !item.isHidden || hiddenFilesEnabled)
        .map((item) => {
          if (parts.length === 2) {
            return `${command} ${item.name}`;
          }
          const newParts = [...parts];
          newParts[newParts.length - 1] = item.name;
          return newParts.join(" ");
        });
    }
    return [];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Tab" && showSuggestions) {
      setShowSuggestions(false);
    }
    if (e.key === "Enter") {
      if (currentCommand.trim()) {
        setPrevCommands((prev) => [...prev, currentCommand]);
        setHistoryIndex(-1);
        setShowSuggestions(false);
        processCommand();
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (prevCommands.length > 0) {
        if (historyIndex < prevCommands.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCurrentCommand(prevCommands[prevCommands.length - 1 - newIndex]);
          playTerminalSound("click");
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(prevCommands[prevCommands.length - 1 - newIndex]);
        playTerminalSound("click");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand("");
        playTerminalSound("click");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const suggestions = getTabSuggestions(currentCommand);
      if (suggestions.length === 1) {
        setCurrentCommand(suggestions[0]);
        setShowSuggestions(false);
        playTerminalSound("click");
      } else if (suggestions.length > 1) {
        setTabSuggestions(suggestions);
        setShowSuggestions(true);
        playTerminalSound("ding");
      }
    } else if (e.key === "Escape") {
      setCurrentCommand("");
      setHistoryIndex(-1);
      setShowSuggestions(false);
      playTerminalSound("click");
    }
  };

  const formatPath = (path: string): string => {
    if (path === "C:") {
      return "C:\\>";
    }
    return `${path}>`;
  };

  const formatOutput = (command: string, output: string): string[] => {
    return output.split("\n");
  };

  const processCommand = () => {
    const command = currentCommand.trim();
    let output = "";
    if (command) {
      setCommandHistory((prev) => [...prev, `${formatPath(currentDirectory)} ${currentCommand}`]);
      const cmdLower = command.toLowerCase();
      if (cmdLower === "zebra") {
        output = "🦓 ZEBRA CODE ACTIVATED!\nDeveloper Tools unlocked! Check your desktop for the new Dev Tools app.";
        window.dispatchEvent(new CustomEvent('zebraCodeActivated'));
        playTerminalSound("success");
      } else if (cmdLower === "help") {
        output =
          "Available commands:\n" +
          "help         - Show this help message\n" +
          "dir          - List files in current directory\n" +
          "clear, cls   - Clear terminal\n" +
          "type <file>  - View contents of a text file\n" +
          "cd <dir>     - Change directory\n" +
          "pwd          - Show current directory path\n" +
          "md <dir>     - Make directory\n" +
          "rd <dir>     - Remove directory\n" +
          "date         - Display current date\n" +
          "time         - Display current time\n" +
          "ver          - Display OS version\n" +
          "systeminfo   - Show system information\n" +
          "echo <text>  - Display text\n" +
          "exit         - Close this terminal\n" +
          "mem          - Show memory usage\n" +
          "\nAdvanced commands:\n" +
          "show hidden files - Make hidden files visible in explorer\n" +
          "access <code>    - Access secure system (requires security code)\n" +
          "decrypt-file     - Decrypt a file (requires path and key)\n" +
          "\nEmergency commands:\n" +
          "emergency-abort  - Activate emergency protocol (DANGER!)";
      } else if (cmdLower === "clear" || cmdLower === "cls") {
        setCommandHistory([]);
        setCurrentCommand("");
        return;
      } else if (cmdLower.startsWith("access ")) {
        const code = command.substring(7);
        if (code === "FIRST_MISSION_1995") {
          setAccessGranted(true);
          output = "ACCESS GRANTED\nWelcome to secure terminal.\nYou now have access to decryption tools.";
          playTerminalSound("success");
        } else {
          output = "ACCESS DENIED: Invalid security code";
          playTerminalSound("error");
        }
      } else if (cmdLower.startsWith("decrypt-file ")) {
        if (!accessGranted) {
          output = 'ERROR: You need proper access to use decryption tools.\nUse "access [CODE]" first.';
        } else {
          output = 'Decryption functionality simulated.';
        }
      } else if (cmdLower === "emergency-abort") {
        output = "🚨 EMERGENCY PROTOCOL ACTIVATED 🚨\nRemote wipe detected! Opening emergency tools...";
        setTimeout(() => {
          // Use the App class from the outer scope
          const quickEventApp = new App("Emergency Protocol", "/hackbook-w95/app-icon/settings.png");
          quickEventApp.fullscreen = true; // Set fullscreen for game
          quickEventApp.metadata = { type: "quick-event" };
          window.dispatchEvent(new CustomEvent('devLaunchApp', { detail: { app: quickEventApp } }));
        }, 2000);
        playTerminalSound("error");
      } else if (cmdLower === "dir") {
        const items = fs.getCurrentItems();
        output = `\n Volume in drive ${currentDirectory.charAt(0)} is WINDOWS95\n Volume Serial Number is 1337-1995\n\n Directory of ${currentDirectory}\\\n\n`;
        if (currentDirectory !== "C:") {
          output += `${new Date().toLocaleDateString().padEnd(12)}  <DIR>          ..\n`;
        }
        items.filter((item) => item.type === "directory" && (!item.isHidden || hiddenFilesEnabled)).forEach((dir) => {
          const lastMod = dir.lastModified ? (dir.lastModified instanceof Date ? dir.lastModified : new Date(dir.lastModified)) : new Date();
          output += `${lastMod.toLocaleDateString().padEnd(12)}  <DIR>          ${dir.name}\n`;
        });
        items.filter((item) => item.type === "file" && (!item.isHidden || hiddenFilesEnabled)).forEach((file) => {
          const lastMod = file.lastModified ? (file.lastModified instanceof Date ? file.lastModified : new Date(file.lastModified)) : new Date();
          output += `${lastMod.toLocaleDateString().padEnd(12)}  ${file.size?.toString().padStart(14)}  ${file.name}\n`;
        });
        const visibleItems = items.filter((item) => !item.isHidden || hiddenFilesEnabled);
        const fileCount = visibleItems.filter((item) => item.type === "file").length;
        const dirCount = visibleItems.filter((item) => item.type === "directory").length;
        const totalFileSize = visibleItems.filter((item) => item.type === "file").reduce((acc, file) => acc + (file.size || 0), 0);
        output += `${fileCount} File(s)      ${totalFileSize.toLocaleString()} bytes\n`;
        output += `${dirCount} Dir(s)      523,425,792 bytes free`;
      } else if (cmdLower === "show hidden files") {
        setHiddenFilesEnabled(true);
        localStorage.setItem("showHiddenFiles", "true");
        output = "Hidden files will now be visible in the file explorer.\nPlease restart My Computer to apply changes.";
      } else if (cmdLower.startsWith("type ")) {
        output = "File viewing simulated.";
      } else if (cmdLower === "systeminfo") {
        output = "Host Name:                 HACKBOOKW95\nOS Name:                   Microsoft Windows 95\nOS Version:                4.00.950\nOS Manufacturer:           Microsoft Corporation\nSystem Type:               x86-based PC\nProcessor(s):              1 Processor(s) Installed\n                          [01]: x86 Family 5 Model 2 Stepping 12 GenuineIntel ~90 Mhz\nBIOS Version:              Phoenix ROM BIOS PLUS Version 1.10 A04\nSystem Directory:          C:\\WINDOWS\\SYSTEM\nTotal Physical Memory:     16 MB\nAvailable Physical Memory: 8 MB\nPage File Space:           32 MB\nPage File:                 C:\\PAGEFILE.SYS\nDomain:                    HACKNET\nLogon Server:              \\HACKNET-DC1\nHotfix(s):                 1 Hotfix(s) Installed\n                          [01]: KB123456";
      } else if (cmdLower.startsWith("cd ") || cmdLower === "cd") {
        if (cmdLower === "cd") {
          output = `Current directory: ${currentDirectory}`;
        } else {
          const targetPath = command.substring(3).trim();
          if (targetPath === "\\" || targetPath === "/") {
            if (fs.navigateTo("C:")) {
              setCurrentDirectory("C:");
              output = "Directory changed to C:\\";
            } else {
              output = "Error: Cannot navigate to root directory";
            }
          } else if (targetPath === "..") {
            if (fs.navigateUp()) {
              setCurrentDirectory(fs.currentDirectory);
              output = `Directory changed to ${fs.currentDirectory}`;
            } else {
              output = "Error: Already at root directory";
            }
          } else {
            const normalizedPath = targetPath.replace(/\//g, "\\");
            if (normalizedPath.startsWith("C:\\") || normalizedPath.startsWith("c:\\")) {
              if (fs.navigateTo(normalizedPath)) {
                setCurrentDirectory(normalizedPath);
                output = `Directory changed to ${normalizedPath}`;
              } else {
                output = `Error: Directory not found - ${normalizedPath}`;
              }
            } else {
              const newPath = currentDirectory === "C:" ? `C:\\${normalizedPath}` : `${currentDirectory}\\${normalizedPath}`;
              if (fs.navigateTo(newPath)) {
                setCurrentDirectory(newPath);
                output = `Directory changed to ${newPath}`;
              } else {
                output = `Error: Directory not found - ${normalizedPath}`;
              }
            }
          }
        }
      } else if (cmdLower === "pwd") {
        output = `Current directory: ${currentDirectory}`;
      } else if (cmdLower.startsWith("md ")) {
        const dirName = command.substring(3).trim();
        if (dirName) {
          if (fs.createItem(dirName, "directory")) {
            output = `Directory created: ${dirName}`;
          } else {
            output = `Error: Could not create directory '${dirName}'`;
          }
        } else {
          output = "Error: Directory name not provided";
        }
      } else if (cmdLower.startsWith("rd ")) {
        const dirName = command.substring(3).trim();
        output = `Directory removed: ${dirName} (Simulated - functionality limited in this demo)`;
      } else if (cmdLower.startsWith("echo ")) {
        output = command.substring(5);
      } else if (cmdLower === "ver") {
        output = "Microsoft Windows 95 [Version 4.00.950]";
      } else if (cmdLower === "date") {
        output = new Date().toLocaleDateString();
      } else if (cmdLower === "time") {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        output = `The current time is: ${hours}:${minutes}:${seconds}`;
      } else if (cmdLower === "mem") {
        output = `\nMemory Type       Total       Used        Free\n--------------  --------   ---------   ---------\nConventional      640K        145K        495K\nUpper              0K          0K          0K\nReserved          384K        384K          0K\nExtended (XMS)  15,360K     5,628K      9,732K\n--------------  --------   ---------   ---------\nTotal memory    16,384K     6,157K     10,227K\n`;
      } else if (cmdLower === "exit") {
        output = "Exiting MS-DOS session...";
        setTimeout(() => {
          // Close the Terminal app by simulating clicking the X button
          const terminalApp = document.querySelector('.window[data-app="Terminal"] .close-btn');
          if (terminalApp instanceof HTMLElement) {
            terminalApp.click();
          }
        }, 1000);
      } else {
        output = `'${command}' is not recognized as an internal or external command,\noperable program or batch file.`;
      }
      if (output) {
        const formattedOutput = formatOutput(command, output);
        setCommandHistory((prev) => [...prev, ...formattedOutput]);
      }
    }
    setCurrentCommand("");
  };

  return (
    <div className="w-full h-full" onClick={() => inputRef.current?.focus()}>
      <div ref={terminalRef} className="mb-4 whitespace-pre-wrap overflow-auto max-h-80 text-green-500">
        {commandHistory.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {showSuggestions && tabSuggestions.length > 0 && (
        <div className="mb-2 text-yellow-300 border border-green-800 p-1 bg-black">
          <div>Suggestions:</div>
          <div className="flex flex-wrap gap-4">
            {tabSuggestions.map((suggestion, i) => (
              <div
                key={i}
                className="cursor-pointer hover:bg-green-900"
                onClick={() => {
                  playTerminalSound("click");
                  setCurrentCommand(suggestion);
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex">
        <span className="mr-1 text-green-500">{formatPath(currentDirectory)}</span>
        <input
          ref={inputRef}
          type="text"
          value={currentCommand}
          onChange={(e) => setCurrentCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-black text-green-500 outline-none border-none"
        />
      </div>
    </div>
  );
};

export default Desktop;
