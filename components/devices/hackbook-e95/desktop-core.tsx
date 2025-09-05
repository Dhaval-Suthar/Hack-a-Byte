"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
// Win95Alert removed for E95 - only essential apps
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { logoutDeviceUser } from "@/app/actions/deviceUser";
import audioManager from "@/components/devices/hackbook-w95/hooks/useAudioManager";

// Essential apps only - includes classic Minesweeper
import Inbox from "@/components/devices/hackbook-w95/apps/Inbox";
import InternetExplorer from "@/components/devices/hackbook-w95/apps/InternetExplorer";
import RecycleBin from "@/components/devices/hackbook-w95/apps/RecycleBin";
import MyComputer from "@/components/devices/hackbook-w95/apps/MyComputer";
import Minesweeper from "@/components/devices/hackbook-w95/apps/Minesweeper";
import CDPlayer from "@/components/devices/hackbook-w95/apps/CDPlayer";
import Notepad from "@/components/devices/hackbook-w95/apps/Notepad";
import Calculator from "@/components/devices/hackbook-w95/apps/Calculator";
import Paint from "@/components/devices/hackbook-w95/apps/Paint";

// E95 Exclusive Apps
import BlackMart from "@/components/devices/hackbook-e95/apps/BlackMart";

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
import NotificationBadge from "@/components/devices/hackbook-e95/ui/notification_badge";

class App {
  name: string;
  icon: string;
  fullscreen: boolean;
  metadata?: Record<string, string>;
  id?: string;

  constructor(name: string, icon: string) {
    this.name = name;
    this.icon = icon;
    this.fullscreen = false;
    this.id = `${name}_${Date.now()}`;
  }
}

// Essential apps only - no games or hacking tools
const APPS: App[] = [
  new App("My Computer", "/hackbook-W95/app-icon/mycomputer.png"),
  new App("Internet Explorer", "/hackbook-W95/app-icon/ie.png"),
  new App("Inbox", "/hackbook-W95/app-icon/inbox.png"),
  new App("Recycle Bin", "/hackbook-W95/app-icon/recyclebin.png"),
  new App("Minesweeper", "/hackbook-W95/app-icon/minesweeper.png"),
  new App("CD Player", "/hackbook-W95/app-icon/cdplayer.png"),
  new App("Notepad", "/hackbook-W95/app-icon/notepad.png"),
  new App("Calculator", "/hackbook-W95/app-icon/calculator.png"),
  new App("Paint", "/hackbook-W95/app-icon/paint.png"),
  new App("BlackMart", "/hackbook-W95/app-icon/blackmart.svg"),
];

// Define window sizes for different app types
const APP_WINDOW_SIZES: Record<string, { width: string | number; height: string | number }> = {
  "Calculator": { width: 280, height: 400 },
  "CD Player": { width: 400, height: 300 },
  "Paint": { width: 700, height: 600 },
  "Minesweeper": { width: 400, height: 450 },
  "BlackMart": { width: "90vw", height: "85vh" },
  "default": { width: "80vw", height: "80vh" }
};

const DefaultValues = {
  LINK: "https://en.wikipedia.org/wiki/Wikipedia:About",
};

export default function HackBookE95DesktopCore() {
  // Alert system removed for E95 - only essential apps

  // Navigation
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // App management
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [runningApps, setRunningApps] = useState<App[]>([]);
  
  // UI states
  const [openMenu, setOpenMenu] = useState(false);
  const [showProgramsMenu, setShowProgramsMenu] = useState(false);
  const [showShutdownDialog, setShowShutdownDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [showRestartAnimation, setShowRestartAnimation] = useState(false);
  const [showShutdownAnimation, setShowShutdownAnimation] = useState(false);
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  
  // Screen saver states  
  const [showScreenSaver, setShowScreenSaver] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const screenSaverTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // User and device states
  const [deviceUser, setDeviceUser] = useState<{
    _id: string;
    username: string;
  } | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playspaceId, setPlayspaceId] = useState<string | null>(null);
  
  // App data states
  const [unreadCount, setUnreadCount] = useState(0);
  const [link, setLink] = useState(DefaultValues.LINK);
  // Remove unused openLink state - it's handled internally in components
  
  // Client-side rendering flag
  const [isClient, setIsClient] = useState(false);

  // Window manager hook
  const windowManager = useWindowManager();

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

          // Log device connection
          import('@/components/devices/hackbook-w95/hooks/useUserLogs').then(({ UserLogManager }) => {
            UserLogManager.addSystemLog(
              'system',
              `Connected to HackBook E95 device instance: ${devId}`,
              'Device instance selection'
            );
          });

          return; // Always allow access if IDs are present
        } else {
          // No playspace ID or device ID found, redirect to device selection
          router.push('/device-selection');
        }
      } catch (error) {
        console.error("Error checking device user:", error);
        // On error, redirect to device selection
        router.push('/device-selection');
      }
    };

    checkDeviceUser();
  }, [router, searchParams]);

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

  // Handle logout from device
  const handleLogout = async () => {
    // Show logout animation immediately
    setShowLogoutAnimation(true);
  };

  // Handle logout animation completion
  const handleLogoutComplete = async () => {
    try {
      if (playspaceId && deviceId) {
        await logoutDeviceUser(playspaceId, deviceId);
      }
    } catch (error) {
      console.error("Error logging out device user:", error);
    } finally {
      // Always redirect to device selection after logout attempt
      router.push('/device-selection');
    }
  };

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    setShowScreenSaver(false);
    
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (screenSaverTimerRef.current) {
      clearTimeout(screenSaverTimerRef.current);
    }

    // Show screensaver after 10 minutes
    screenSaverTimerRef.current = setTimeout(() => {
      setShowScreenSaver(true);
    }, 10 * 60 * 1000);
  }, []);

  // Initialize idle timer
  useEffect(() => {
    const idleTimer = idleTimerRef.current;
    const screenSaverTimer = screenSaverTimerRef.current;
    resetIdleTimer();
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (screenSaverTimer) clearTimeout(screenSaverTimer);
    };
  }, [resetIdleTimer]);

  // Handle opening apps
  const handleOpenApp = useCallback(
    (app: App) => {
      resetIdleTimer();
      
      // Create a new instance of the app with a unique ID
      const appInstance = new App(app.name, app.icon);
      appInstance.fullscreen = app.fullscreen;
      appInstance.metadata = app.metadata;
      appInstance.id = `${app.name}_${Date.now()}_${Math.random()}`;

      setRunningApps((prev) => [...prev, appInstance]);
      setSelectedApp(appInstance);
      playSound("click");

      // Initialize window for this app
      const windowSize = APP_WINDOW_SIZES[app.name] || APP_WINDOW_SIZES.default;
      const initialPosition = {
        x: 50 + runningApps.length * 30, 
        y: 50 + runningApps.length * 30,
        width: windowSize.width,
        height: windowSize.height,
        isFullscreen: false,
        zIndex: Date.now()
      };
      
      windowManager.registerWindow(appInstance.id!, initialPosition);
    },
    [resetIdleTimer, playSound, runningApps.length, windowManager]
  );

  // Handle closing apps
  const handleCloseApp = useCallback(
    (app: App) => {
      resetIdleTimer();
      setRunningApps((prev) => prev.filter((a) => a.id !== app.id));
      
      // Clean up window state
      if (app.id) {
        windowManager.closeWindow(app.id);
      }
      
      if (selectedApp?.id === app.id) {
        // Find the next active window or set to null
        const remainingApps = runningApps.filter((a) => a.id !== app.id);
        if (remainingApps.length > 0) {
          setSelectedApp(remainingApps[remainingApps.length - 1]);
        } else {
          setSelectedApp(null);
        }
      }
      playSound("click");
    },
    [resetIdleTimer, playSound, selectedApp, runningApps, windowManager]
  );

  // Handle app content rendering
  const renderAppContent = useCallback(
    (app: App) => {
      const openLinkHandler = (url: string) => {
        setLink(url);
        // Open link in Internet Explorer if not already running
        const ieApp = APPS.find(app => app.name === "Internet Explorer");
        if (ieApp && !runningApps.some(app => app.name === "Internet Explorer")) {
          handleOpenApp(ieApp);
        }
      };

      switch (app.name) {
        case "My Computer":
          return <MyComputer onClose={() => handleCloseApp(app)} isE95={true} />;
        case "Internet Explorer":
          return (
            <InternetExplorer
              onClose={() => handleCloseApp(app)}
              link={link}
              setLink={setLink}
            />
          );
        case "Inbox":
          return (
            <Inbox
              onClose={() => handleCloseApp(app)}
              openLink={openLinkHandler}
              unreadCount={unreadCount}
              setUnreadCount={setUnreadCount}
            />
          );
        case "Recycle Bin":
          return <RecycleBin onClose={() => handleCloseApp(app)} />;
        case "CD Player":
          return <CDPlayer onClose={() => handleCloseApp(app)} />;
        case "Notepad":
          return <Notepad onClose={() => handleCloseApp(app)} />;
        case "Calculator":
          return <Calculator onClose={() => handleCloseApp(app)} />;
        case "Paint":
          return <Paint onClose={() => handleCloseApp(app)} />;
        case "Minesweeper":
          return <Minesweeper onClose={() => handleCloseApp(app)} />;
        case "BlackMart":
          return <BlackMart onClose={() => handleCloseApp(app)} />;
        default:
          return null;
      }
    },
    [handleCloseApp, handleOpenApp, link, unreadCount, setUnreadCount, runningApps]
  );

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && selectedApp) {
        handleOpenApp(selectedApp);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedApp, handleOpenApp]);

  // Handle mouse activity for idle timer
  useEffect(() => {
    const handleActivity = () => resetIdleTimer();
    
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
    };
  }, [resetIdleTimer]);

  return (
    <div
      id="desktop"
      className="w-screen h-screen relative overflow-hidden"
    >
      {/* Screen saver overlay */}
      {showScreenSaver && (
        <div className="absolute inset-0 z-50">
          <ScreenSaver onExit={() => {
            setShowScreenSaver(false);
            resetIdleTimer();
          }} />
        </div>
      )}

      {/* System sounds */}
      <SystemSounds />

      {/* Alert system removed for E95 - only essential apps */}

      {/* Welcome dialog */}
      {showWelcomeDialog && (
        <WelcomeDialog
          username={deviceUser?.username || "User"}
          onClose={() => setShowWelcomeDialog(false)}
        />
      )}

      {/* Desktop background with icons */}
      <div
        className="bg-[#008080] w-full h-[96%] z-0 text-black p-2 relative overflow-hidden"
        onClick={() => setSelectedApp(null)}
      >
        {/* Desktop icons */}
        <div className="absolute top-4 left-4">
          <div className="grid grid-cols-3 gap-6">
        {APPS.map((app) => (
          <div
            key={app.name}
            className={clsx(
              "w-16 h-20 flex flex-col items-center justify-center cursor-pointer p-1 rounded",
              {
                "bg-[#000080] text-white": selectedApp?.name === app.name,
                "hover:bg-[#000080] hover:bg-opacity-30": selectedApp?.name !== app.name,
              }
            )}
            onClick={() => {
              setSelectedApp(app);
              resetIdleTimer();
            }}
            onDoubleClick={() => handleOpenApp(app)}
          >
            <div className="relative w-8 h-8 mb-1">
              <Image
                src={app.icon}
                alt={app.name}
                width={32}
                height={32}
                className="h-8 w-8"
                priority
              />
            </div>
            <span className="text-xs text-center font-bold text-white drop-shadow-lg">
              {app.name}
            </span>
          </div>
        ))}
          </div>
        </div>
      </div>

      {/* Running applications */}
      {runningApps.map((app) => {
        const windowId = app.id || app.name;
        const windowState = windowManager.getWindowState(windowId);
        if (!windowState || windowState.isMinimized) return null;

        return (
          <Win95Window
            key={windowId}
            title={app.name}
            icon={app.icon}
            position={windowState.position}
            isActive={windowState.isActive}
            onActivate={() => {
              windowManager.activateWindow(windowId);
              setSelectedApp(app);
              resetIdleTimer();
            }}
            onClose={() => handleCloseApp(app)}
            onMinimize={() => windowManager.minimizeWindow(windowId)}
            onToggleFullscreen={() => windowManager.toggleFullscreen(windowId)}
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

            {/* Shutdown */}
            <div
              className="px-1 py-1 flex items-center hover:bg-[#000080] hover:text-white cursor-pointer"
              onClick={() => {
                setOpenMenu(false);
                setShowShutdownDialog(true);
                playSound("click");
              }}
            >
              <div className="w-8 h-8 flex items-center justify-center mr-1">
                <Image src="/hackbook-W95/app-icon/shut-down.png" alt="Shut Down" width={32} height={32} priority />
              </div>
              <span className="text-sm">Shut Down...</span>
            </div>
          </div>

          {/* Programs submenu */}
          {showProgramsMenu && (
            <ProgramsMenu
              onClose={() => setShowProgramsMenu(false)}
              onProgramClick={(programName: string) => {
                const app = APPS.find(a => a.name === programName);
                if (app) {
                  handleOpenApp(app);
                }
                setShowProgramsMenu(false);
                setOpenMenu(false);
              }}
            />
          )}
        </div>
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
            // Animation completes without reloading the page. This is intentional for the hackbook-e95 simulation and does not perform a full restart.
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
          {runningApps.map((app) => {
            const windowId = app.id || app.name;
            const windowState = windowManager.getWindowState(windowId);
            if (!windowState) return null;
            
            const isActive = windowState.isActive;
            const isMinimized = windowState.isMinimized;

            return (
              <div
                key={windowId}
                className={clsx("max-w-[200px] h-[80%] my-auto border-2 flex items-center mx-1", {
                  "border-t-[#404040] border-l-[#404040] border-r-[#ffffff] border-b-[#ffffff] shadow-inner bg-[#c0c0c0]": isActive && !isMinimized,
                  "border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] win95-shadow bg-[#c0c0c0]": !isActive || isMinimized,
                })}
                onClick={() => {
                  if (isMinimized) {
                    windowManager.activateWindow(windowId);
                  } else if (isActive) {
                    windowManager.minimizeWindow(windowId);
                  } else {
                    windowManager.activateWindow(windowId);
                    setSelectedApp(app);
                  }
                  resetIdleTimer();
                  playSound("click");
                }}
              >
                <Image
                  src={app.icon}
                  alt={app.name}
                  width={16}
                  height={16}
                  className="h-4 w-4 mx-1"
                  priority
                />
                <span className="text-xs font-bold text-black truncate px-1">
                  {app.name}
                </span>
                {app.name === "Inbox" && unreadCount > 0 && (
                  <NotificationBadge count={unreadCount} />
                )}
              </div>
            );
          })}
        </div>

        {/* System tray */}
        <div className="flex items-center mr-2">
          <div className="text-xs font-bold text-black">
            {isClient ? formatTime(Date.now()) : "12:00"}
          </div>
        </div>
      </div>
    </div>
  );
}
