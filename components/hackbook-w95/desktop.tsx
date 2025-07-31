"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import useFileSystem from "@/components/hackbook-w95/hooks/useFileSystem";
import { getDeviceUser, logoutDeviceUser } from "@/app/actions/deviceUser";

import Inbox from "@/components/hackbook-w95/apps/Inbox";
import InternetExplorer from "@/components/hackbook-w95/apps/InternetExplorer";
import RecycleBin from "@/components/hackbook-w95/apps/RecycleBin";
import MyComputer from "@/components/hackbook-w95/apps/MyComputer";
import Minesweeper from "@/components/hackbook-w95/apps/Minesweeper";
import CDPlayer from "@/components/hackbook-w95/apps/CDPlayer";
import Notepad from "@/components/hackbook-w95/apps/Notepad";
import Calculator from "@/components/hackbook-w95/apps/Calculator";
import Paint from "@/components/hackbook-w95/apps/Paint";

import ZipArchive from "@/components/hackbook-w95/apps/ZipArchive";
import WinTalk95 from "@/components/hackbook-w95/apps/WinTalk95";
import NetworkNeighborhood from "@/components/hackbook-w95/apps/NetworkNeighborhood";
import UntangleNeuralNetwork from "@/components/hackbook-w95/apps/UntangleNeuralNetwork";
import NumberJumpingGame from "@/components/hackbook-w95/apps/NumberJumpingGame";
import FingerprintHack from "@/components/hackbook-w95/apps/FingerprintHack";
import QuickEventPresser from "@/components/hackbook-w95/apps/QuickEventPresser";
import DevTools from "@/components/hackbook-w95/apps/DevTools";
import ProgramsMenu from "@/components/hackbook-w95/menus/ProgramsMenu";
import ShutdownDialog from "@/components/hackbook-w95/dialogs/ShutdownDialog";
import WelcomeDialog from "@/components/hackbook-w95/dialogs/WelcomeDialog";
import RestartAnimation from "@/components/hackbook-w95/restart-animation";
import ShutdownAnimation from "@/components/hackbook-w95/shutdown-animation";
import LogoutAnimation from "@/components/hackbook-w95/logout-animation";

import SystemSounds from "@/components/hackbook-w95/SystemSounds";
import ScreenSaver from "@/components/hackbook-w95/ScreenSaver";
import useWindowManager from "@/components/hackbook-w95/hooks/useWindowManager";
import Win95Window from "@/components/hackbook-w95/Win95Window";
import NotificationBadge from "../ui/notification_badge";
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
  new App("Network Neighborhood", "/hackbook-W95/app-icon/ie.png"), // Using IE icon as network placeholder
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

const DefaultValues = {
  LINK: "https://en.wikipedia.org/wiki/Wikipedia:About",
};

const Desktop = () => {
  // Unread count state for Inbox
  const [unreadCount, setUnreadCount] = useState(1); // Default to 1 for initial notification

  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [neuralNetworkUnlocked, setNeuralNetworkUnlocked] = useState(false);
  const [showNeuralNetworkNotification, setShowNeuralNetworkNotification] = useState(false);

  // Secure Vault availability state
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [showVaultNotification, setShowVaultNotification] = useState(false);

  // Mission 2 completion state for Number Jumping Game
  const [showNumberJumpingGame, setShowNumberJumpingGame] = useState(false);
  const [mission2JustCompleted, setMission2JustCompleted] = useState(false);

  // Dev Tools availability state
  const [devToolsUnlocked, setDevToolsUnlocked] = useState(false);

  // Set client state after hydration to prevent SSR mismatch
  useEffect(() => {
    setIsClient(true);
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
    const checkMission1Status = async () => {
      try {
        const { MissionTracker } = await import('./hooks/useMissionTracker');
        const mission1Complete = MissionTracker.isMissionCompleted('mission1');
        setNetworkToolInstalled(mission1Complete);
      } catch (error) {
        console.error('Error checking mission status:', error);
      }
    };
    
    checkMission1Status();
  }, []);

  // Check if Neural Network data is discovered to show Neural Network Analyzer
  useEffect(() => {
    const checkNeuralNetworkUnlock = async () => {
      try {
        const { MissionTracker } = await import('./hooks/useMissionTracker');
        // Unlock Neural Network Analyzer when network tool is installed and user has progressed
        const mission1Complete = MissionTracker.isMissionCompleted('mission1');
        const neuralDataDiscovered = MissionTracker.isMissionCompleted('neural_data_discovered');
        
        if ((mission1Complete && networkToolInstalled) || neuralDataDiscovered) {
          setNeuralNetworkUnlocked(true);
        }
      } catch (error) {
        console.error('Error checking neural network unlock status:', error);
      }
    };
    
    checkNeuralNetworkUnlock();
  }, [networkToolInstalled, neuralNetworkUnlocked]);

  // Check if Mission 2 is already completed on load
  useEffect(() => {
    const checkMission2Status = async () => {
      try {
        const { MissionTracker } = await import('./hooks/useMissionTracker');
        const mission2Complete = MissionTracker.isMissionCompleted('mission2');
        if (mission2Complete && !mission2JustCompleted) {
          // Mission 2 was completed previously, don't show the notification again
          // but make the firewall bypass available if needed
          console.log('Mission 2 already completed');
        }
      } catch (error) {
        console.error('Error checking mission 2 status:', error);
      }
    };
    
    checkMission2Status();
  }, [mission2JustCompleted]);

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
            }
          }
        }

        if (id && devId) {
          setPlayspaceId(id);
          setDeviceId(devId);

          // Check if user exists by calling getDeviceUser server action
          const result = await getDeviceUser(devId || "", "hackbook-w95");   

          if (result.isLoggedIn && result.user) {
            // Set user data compatible with updated schema
            setDeviceUser({
              _id: result.user._id,
              username: result.user.username
            });

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
            
            return; // User is logged in, no need to redirect
          }

          // If we get here, either no session or invalid session
          // Redirect to login with deviceId
          const loginUrl = `/hackbook-w95/login?playspaceId=${id}&deviceId=${devId}`;
          router.push(loginUrl);
        } else {
          // No playspace ID or device ID found, redirect to device selection
          router.push('/device-selection');
        }
      } catch (error) {
        console.error("Error checking device user:", error);
        // On error, redirect to login
        router.push('/hackbook-w95/login');
      }
    };

    checkDeviceUser();
  }, [router, searchParams, deviceId]);

  // Function to play system sounds - moved up to be available for useEffect hooks
  const playSound = useCallback((sound: string) => {
    if (typeof window !== "undefined") {
      const win = window as Window & {
        playWin95Sound?: (sound: string) => void;
      };

      if (win.playWin95Sound) {
        win.playWin95Sound(sound);
      } else {
        // Fallback if the global function isn't available
        try {
          const audio = new Audio(`/hackbook-w95/sounds/${sound}.mp3`);
          audio.volume = 0.5;
          audio.play().catch((e) => console.log("Audio play failed:", e));
        } catch (error) {
          console.error("Sound playback error:", error);
        }
      }
    }
  }, []);

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
      console.log(`HackBook W95 connected to device instance: ${deviceId}`);
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
      console.error("Error logging out:", error);
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
    const handleNetworkToolInstall = () => {
      setNetworkToolInstalled(true);
      setShowInstallNotification(true);
      // Play installation sound
      playSound("ding");
      
      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowInstallNotification(false);
      }, 5000);
    };

    const handleNetworkToolRemove = () => {
      setNetworkToolInstalled(false);
      // Close any open Network Neighborhood windows
      setRunningApps(prev => prev.filter(app => app.name !== "Network Neighborhood"));
    };

    window.addEventListener('networkToolInstalled', handleNetworkToolInstall);
    window.addEventListener('networkToolRemoved', handleNetworkToolRemove);
    return () => {
      window.removeEventListener('networkToolInstalled', handleNetworkToolInstall);
      window.removeEventListener('networkToolRemoved', handleNetworkToolRemove);
    };
  }, [playSound]);

  // Listen for neural network data discovery
  useEffect(() => {
    const handleNeuralNetworkDiscovery = () => {
      setNeuralNetworkUnlocked(true);
      setShowNeuralNetworkNotification(true);
      // Play discovery sound
      playSound("ding");
      
      // Hide notification after 6 seconds
      setTimeout(() => {
        setShowNeuralNetworkNotification(false);
      }, 6000);
    };

    const handleNeuralNetworkComplete = () => {
      // When neural network is completed, unlock the secure vault
      setVaultUnlocked(true);
      setShowVaultNotification(true);
      playSound("ding");
      
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
  }, [playSound]);

  // Listen for mission 2 completion to trigger Number Jumping Game
  useEffect(() => {
    const handleMissionComplete = (event: CustomEvent) => {
      const { missionId } = event.detail;
      
      if (missionId === 'mission2' && !mission2JustCompleted) {
        setMission2JustCompleted(true);
        
        // Show a brief notification, then automatically open the Number Jumping Game
        setTimeout(() => {
          // Create the Firewall Bypass app instance
          const firewallApp = new App("Firewall Bypass", "/hackbook-W95/app-icon/key.png");
          firewallApp.id = `firewallBypass_${Date.now()}`;
          
          // Register and open the app
          windowManager.registerWindow(firewallApp.id);
          setRunningApps((prev) => [...prev, firewallApp]);
          setSelectedApp(firewallApp);
          windowManager.activateWindow(firewallApp.id);
          playSound("ding");
          
          setShowNumberJumpingGame(true);
        }, 2000);
      }
    };

    window.addEventListener('missionComplete', handleMissionComplete as EventListener);
    return () => {
      window.removeEventListener('missionComplete', handleMissionComplete as EventListener);
    };
  }, [playSound, windowManager, mission2JustCompleted]);

  // Listen for zebra code activation to unlock Dev Tools
  useEffect(() => {
    const handleZebraCodeActivation = () => {
      setDevToolsUnlocked(true);
      playSound("ding");
    };

    window.addEventListener('zebraCodeActivated', handleZebraCodeActivation);
    return () => {
      window.removeEventListener('zebraCodeActivated', handleZebraCodeActivation);
    };
  }, [playSound]);

  // Clear selections (menu, desktop icons, etc)
  const deSelect = useCallback(() => {
    setSelectedApp(null);
    setOpenMenu(false);
    setShowProgramsMenu(false);
  }, []);

  // Close an application window
  const handleCloseApp = useCallback(
    (app: App) => {
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
      // Check if an app with the same name is already running
      const existingApp = runningApps.find(runningApp => runningApp.name === app.name);
      
      if (existingApp) {
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
        
        // Set a unique ID for this instance
        appInstance.id = appInstanceId;
        
        // Register the window in the window manager with the unique ID
        windowManager.registerWindow(appInstanceId);
        
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
    [windowManager, deSelect, playSound, runningApps]
  );

  // Listen for development app launch events
  useEffect(() => {
    const handleDevLaunchApp = (event: CustomEvent) => {
      const { appName, app: customApp } = event.detail;
      
      if (customApp) {
        // Handle custom app object
        handleOpenApp(customApp);
      } else if (appName) {
        // Handle app by name
        const app = APPS.find(a => a.name === appName);
        if (app) {
          handleOpenApp(app);
        }
      }
    };

    window.addEventListener('devLaunchApp', handleDevLaunchApp as EventListener);
    return () => {
      window.removeEventListener('devLaunchApp', handleDevLaunchApp as EventListener);
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
                console.log("Neural Network Data Restored:", data);
                // Trigger vault unlock
                window.dispatchEvent(new CustomEvent('neuralNetworkCompleted'));
                // Handle the success - maybe open a new file or trigger next mission
                // For now, just close the app
                handleCloseApp(app);
              }}
              difficulty="intermediate"
            />
          );
        case "Secure Vault":
          return (
            <FingerprintHack 
              onClose={() => handleCloseApp(app)}
              onSuccess={() => {
                console.log("Vault accessed successfully!");
                
                // Close the vault
                handleCloseApp(app);
                
                // Trigger the emergency protocol after a brief delay
                setTimeout(() => {
                  // Show alert about remote wipe
                  alert("🚨 CRITICAL ALERT! 🚨\n\nShadowByte's security system has detected the breach!\nRemote wipe protocol activated!\n\nYou must act quickly to stop the data destruction!");
                  
                  // Auto-launch the emergency protocol
                  const quickEventApp = new App("Emergency Protocol", "/hackbook-w95/app-icon/settings.png");
                  quickEventApp.metadata = {
                    type: "quick-event"
                  };
                  
                  handleOpenApp(quickEventApp);
                }, 2000);
              }}
            />
          );
        case "Emergency Protocol":
          return (
            <QuickEventPresser 
              onClose={() => handleCloseApp(app)}
              onSuccess={() => {
                // Handle successful completion of emergency protocol
                console.log("Emergency protocol completed successfully!");
                
                // Trigger final mission completion
                window.dispatchEvent(new CustomEvent('finalMissionComplete'));
                
                // Close the app
                handleCloseApp(app);
                
                // Show completion message after brief delay
                setTimeout(() => {
                  alert("🎉 CONGRATULATIONS! 🎉\n\nYou have successfully completed all missions and stopped ShadowByte's attack!\n\nThe system is now secure and all evidence has been preserved.\n\nMission accomplished, Agent!");
                }, 1000);
              }}
              onFailure={() => {
                console.log("Emergency protocol failed!");
                // Could trigger a game over state or restart
              }}
            />
          );
        case "Dev Tools":
          return <DevTools onClose={() => handleCloseApp(app)} />;
        case "Firewall Bypass":
          return <NumberJumpingGame onClose={() => handleCloseApp(app)} />;
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
    [handleCloseApp, handleOpenApp, link, setLink, openLink, unreadCount, setUnreadCount]
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
        const notepadApp = APPS.find((app) => app.name === "Notepad");
        if (notepadApp) {
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
              // Regular game progression filters
              // Network Neighborhood is hidden until network tool is installed
              if (app.name === "Network Neighborhood" && !networkToolInstalled) {
                return false;
              }
              // Neural Network Analyzer is hidden by default
              if (app.name === "Neural Network Analyzer") {
                return false;
              }
              // Secure Vault is hidden until neural network is completed
              if (app.name === "Secure Vault" && !vaultUnlocked) {
                return false;
              }
              // Dev Tools is hidden until zebra code is activated
              if (app.name === "Dev Tools" && !devToolsUnlocked) {
                return false;
              }
              // Solitaire is removed
              if (app.name === "Solitaire") {
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
                    // Only handle selection on click, don't attempt to open
                    if (selectedApp !== app) {
                      setSelectedApp(app);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    playSound("click");
                    // Direct call to handleOpenApp on double click
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

export default Desktop;
