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
import Solitaire from "@/components/hackbook-w95/apps/Solitaire";
import ProgramsMenu from "@/components/hackbook-w95/menus/ProgramsMenu";
import ShutdownDialog from "@/components/hackbook-w95/dialogs/ShutdownDialog";
import RestartAnimation from "@/components/hackbook-w95/restart-animation";
import ShutdownAnimation from "@/components/hackbook-w95/shutdown-animation";
import LogoutAnimation from "@/components/hackbook-w95/logout-animation";

import SystemSounds from "@/components/hackbook-w95/SystemSounds";
import ScreenSaver from "@/components/hackbook-w95/ScreenSaver";
import useWindowManager from "@/components/hackbook-w95/hooks/useWindowManager";
import Win95Window from "@/components/hackbook-w95/Win95Window";
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
  new App("Recycle Bin", "/hackbook-W95/app-icon/recyclebin.png"),
  new App("Minesweeper", "/hackbook-W95/app-icon/minesweeper.png"),
  new App("CD Player", "/hackbook-W95/app-icon/cdplayer.png"),
  new App("Terminal", "/hackbook-W95/app-icon/terminal.png"),
  new App("Notepad", "/hackbook-W95/app-icon/notepad.png"),
  new App("Calculator", "/hackbook-W95/app-icon/calculator.png"),
  new App("Paint", "/hackbook-W95/app-icon/paint.png"),
  new App("Solitaire", "/hackbook-W95/app-icon/solitaire.png"),
];

const DefaultValues = {
  LINK: "https://www.google.com",
};

const Desktop = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [openMenu, setOpenMenu] = useState(false);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [date, setDate] = useState(Date.now());
  const [link, setLink] = useState(DefaultValues.LINK as string);
  const [showProgramsMenu, setShowProgramsMenu] = useState(false);
  const [hasSeenMission, setHasSeenMission] = useState(false);
  const [showShutdownDialog, setShowShutdownDialog] = useState(false);
  const [showRestartAnimation, setShowRestartAnimation] = useState(false);
  const [showShutdownAnimation, setShowShutdownAnimation] = useState(false);
  const [showLogoutAnimation, setShowLogoutAnimation] = useState(false);
  const [runningApps, setRunningApps] = useState<App[]>([]);

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
          if (!id) {
            id = searchParams.get("playspaceId");
            // If found in URL, save to localStorage for future use
            if (id) {
              localStorage.setItem("playspaceId", id);
            }
          }

          // Check URL for deviceId
          const urlDeviceId = searchParams.get("deviceId");
          if (urlDeviceId) {
            devId = urlDeviceId;
            localStorage.setItem("selectedDeviceId", urlDeviceId);
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

  // Function to play system sounds
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
          return <Inbox onClose={() => handleCloseApp(app)} openLink={openLink} />;
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
        case "Solitaire":
          return <Solitaire onClose={() => handleCloseApp(app)} />;
        default:
          return null;
      }
    },
    [handleCloseApp, link, setLink, openLink]
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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("win95openfile", handleOpenFile as EventListener);

    const interval = setInterval(() => {
      setDate(new Date().getTime());
    }, 1000);

    // Check for mission briefing after component is fully mounted and all handlers are defined
    if (!hasSeenMission && deviceUser) {
      setTimeout(() => {
        // Play notification sound
        const audio = new Audio("/hackbook-W95/sounds/ding.mp3");
        audio.play().catch((e) => console.log("Audio play failed:", e));

        // Show mission briefing
        const inboxApp = APPS.find((app) => app.name === "Inbox");
        if (inboxApp) {
          handleOpenApp(inboxApp);
          setHasSeenMission(true);
          
          // Use user-specific storage
          import('./hooks/useUserStorage').then(({ userStorage }) => {
            userStorage.setItem("missionBriefingSeen", true);
          });
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("win95openfile", handleOpenFile as EventListener);
      clearInterval(interval);
    };
  }, [handleOpenApp, selectedApp, hasSeenMission, deviceUser]);

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
            {APPS.map((app) => (
              <div
                key={app.name}
                className={clsx("flex flex-col items-center z-10 p-1 w-24", {
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
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image
                    className="object-contain max-w-full max-h-full"
                    src={app.icon}
                    alt={app.name}
                    width={60}
                    height={60}
                    priority
                  />
                </div>
                <h4
                  className={clsx("w-24 mt-1 text-xs text-white text-center px-1 shadow-sm", {
                    "bg-[#000080]": app === selectedApp,
                  })}
                >
                  {app.name}
                </h4>
              </div>
            ))}
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
            {new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>
    </main>
  );
};

// Terminal Component with command processing
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
      let audio: HTMLAudioElement;

      switch (soundType) {
        case "click":
          audio = new Audio("/hackbook-W95/sounds/click.mp3");
          break;
        case "error":
          audio = new Audio("/hackbook-W95/sounds/error.mp3");
          break;
        case "success":
          audio = new Audio("/hackbook-W95/sounds/ding.mp3");
          break;
        default:
          audio = new Audio("/hackbook-W95/sounds/click.mp3");
      }

      audio.volume = 0.5;
      audio.play().catch((e) => console.log("Terminal audio play failed:", e));
    } catch (error) {
      console.error("Terminal sound error:", error);
    }
  };

  // Check if hidden files are enabled in user-specific storage when component mounts
  useEffect(() => {
    const checkHiddenFilesEnabled = async () => {
      try {
        const { userStorage } = await import('./hooks/useUserStorage');
        const showHidden = userStorage.getItem("showHiddenFiles", false) as boolean;
        setHiddenFilesEnabled(showHidden === true);
      } catch (error) {
        console.error("Error reading hidden files setting:", error);
      }
    };
    
    checkHiddenFilesEnabled();
  }, []);

  // Output scroll into view whenever command history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  // Auto focus on input field
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Add a welcome message when the terminal is first opened
  useEffect(() => {
    setCommandHistory([
      "Microsoft(R) Windows 95",
      "(C)Copyright Microsoft Corp 1981-1995.",
      "",
      'Type "help" for a list of available commands.',
    ]);
  }, []);

  // List of available commands for autocompletion
  const availableCommands = [
    "help",
    "dir",
    "clear",
    "cls",
    "type",
    "cd",
    "pwd",
    "systeminfo",
    "show hidden files",
    "access",
    "decrypt-file",
    "ver",
    "date",
    "time",
    "echo",
    "exit",
    "mem",
    "edit",
    "prompt",
    "net",
    "netstat",
    "ping",
    "vol",
    "md",
    "rd",
    "rename",
    "more",
    "find",
  ];

  // Generate tab completion suggestions
  const getTabSuggestions = (cmd: string): string[] => {
    if (!cmd) return [];

    // Command completion
    if (!cmd.includes(" ")) {
      return availableCommands.filter((c) => c.startsWith(cmd.toLowerCase()));
    }

    // File/directory completion for commands like cd, type
    const parts = cmd.split(" ");
    const command = parts[0].toLowerCase();
    const partial = parts[parts.length - 1];

    if (["cd", "type", "md", "rd"].includes(command)) {
      const items = fs.getCurrentItems();
      return items
        .filter((item) => item.name.toLowerCase().startsWith(partial.toLowerCase()))
        .filter((item) => !item.isHidden || hiddenFilesEnabled)
        .map((item) => {
          // If it's the only part after command, replace the whole thing
          if (parts.length === 2) {
            return `${command} ${item.name}`;
          }

          // Replace just the last part
          const newParts = [...parts];
          newParts[newParts.length - 1] = item.name;
          return newParts.join(" ");
        });
    }

    return [];
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Hide suggestions on any key except tab
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
        // If we're not already navigating history or we can go further back
        if (historyIndex < prevCommands.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setCurrentCommand(prevCommands[prevCommands.length - 1 - newIndex]);
          playTerminalSound("click");
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      // If we're navigating history
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(prevCommands[prevCommands.length - 1 - newIndex]);
        playTerminalSound("click");
      } else if (historyIndex === 0) {
        // Return to empty command when reaching the most recent command
        setHistoryIndex(-1);
        setCurrentCommand("");
        playTerminalSound("click");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();

      const suggestions = getTabSuggestions(currentCommand);

      if (suggestions.length === 1) {
        // If there's only one suggestion, use it
        setCurrentCommand(suggestions[0]);
        setShowSuggestions(false);
        playTerminalSound("click");
      } else if (suggestions.length > 1) {
        // If multiple suggestions, show them and cycle through on repeated tabs
        setTabSuggestions(suggestions);
        setShowSuggestions(true);
        playTerminalSound("ding"); // Play a notification sound for multiple suggestions
      }
    } else if (e.key === "Escape") {
      // Clear command on Escape
      setCurrentCommand("");
      setHistoryIndex(-1);
      setShowSuggestions(false);
      playTerminalSound("click");
    }
  };

  const formatPath = (path: string): string => {
    // For root directory, display C:\>
    if (path === "C:") {
      return "C:\\>";
    }
    // For other directories, display C:\Directory>
    return `${path}>`;
  };

  // Format command output for display
  const formatOutput = (command: string, output: string): string[] => {
    // Get just the command name
    const commandName = command.split(" ")[0].toLowerCase();

    // Special formatting for specific commands
    switch (commandName) {
      case "dir":
        return output.split("\n");
      case "type":
        return output.split("\n");
      default:
        return output.split("\n");
    }
  };

  const processCommand = () => {
    const command = currentCommand.trim();
    let output = "";

    if (command) {
      // Add command to history with proper formatting
      setCommandHistory((prev) => [...prev, `${formatPath(currentDirectory)} ${currentCommand}`]);

      // Process different commands (case-insensitive)
      const cmdLower = command.toLowerCase();

      if (cmdLower === "help") {
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
          "decrypt-file     - Decrypt a file (requires path and key)";
      } else if (cmdLower === "clear" || cmdLower === "cls") {
        setCommandHistory([]);
        setCurrentCommand("");
        return;
      } else if (cmdLower.startsWith("access ")) {
        const code = command.substring(7);
        if (code === "FIRST_MISSION_1995") {
          setAccessGranted(true);
          output = "ACCESS GRANTED\nWelcome to secure terminal.\nYou now have access to decryption tools.";

          // Play success sound
          playTerminalSound("success");
        } else {
          output = "ACCESS DENIED: Invalid security code";

          // Play error sound
          playTerminalSound("error");
        }
      } else if (cmdLower.startsWith("decrypt-file ")) {
        if (!accessGranted) {
          output = 'ERROR: You need proper access to use decryption tools.\nUse "access [CODE]" first.';
        } else {
          const params = command.substring(13).match(/--([a-z]+) "([^"]+)"|--([a-z]+) ([^\s"]+)/g);
          if (params) {
            let path = "";
            let key = "";

            params.forEach((param) => {
              const paramMatch = param.match(/--([a-z]+) "?([^"]+)"?/);
              if (paramMatch) {
                if (paramMatch[1] === "path") path = paramMatch[2];
                if (paramMatch[1] === "key") key = paramMatch[2];
              }
            });

            if (path && key) {
              // Handle the mission data file specifically
              if (path.toLowerCase() === "c:\\documents\\encrypted\\mission_data.txt" && key === "3") {
                output =
                  "DECRYPTION SUCCESSFUL\n\n=== DECRYPTED CONTENT ===\n\nThis file contains secret mission data.\n\nThe password is: HACKBOOK\n\n=== MISSION COMPLETE ===\n\nCongratulations! You have successfully completed the first security mission.\nReport this password to your security supervisor to unlock additional missions.";

                // Store mission completion in user-specific storage
                import('./hooks/useMissionTracker').then(({ MissionTracker }) => {
                  MissionTracker.completeMission('mission1');
                });

                // Play success sound
                playTerminalSound("success");
              }
              // Handle other encrypted files
              else if (path.toLowerCase() === "c:\\documents\\encrypted\\secret_message.txt" && key === "3") {
                output =
                  "DECRYPTION SUCCESSFUL\n\n=== DECRYPTED CONTENT ===\n\nHACKBOOK IS THE PASSWORD\n\n=== END OF FILE ===";
              } else {
                output = `Attempting to decrypt file: ${path}\nWith key: ${key}\n\nERROR: Invalid path or decryption key`;
              }
            } else {
              output =
                'Usage: decrypt-file --path "file_path" --key key_value\n\nExample: decrypt-file --path "C:\\Documents\\Encrypted\\MISSION_DATA.txt" --key 3';
            }
          } else {
            output =
              'Usage: decrypt-file --path "file_path" --key key_value\n\nExample: decrypt-file --path "C:\\Documents\\Encrypted\\MISSION_DATA.txt" --key 3';
          }
        }
      } else if (cmdLower === "dir") {
        // Get the items from the current directory
        const items = fs.getCurrentItems();
        output = `\n Volume in drive ${currentDirectory.charAt(
          0
        )} is WINDOWS95\n Volume Serial Number is 1337-1995\n\n Directory of ${currentDirectory}\\\n\n`;

        // Add parent directory entry (except on root)
        if (currentDirectory !== "C:") {
          output += `${new Date().toLocaleDateString().padEnd(12)}  <DIR>          ..\n`;
        }

        // List directories first
        items
          .filter((item) => item.type === "directory" && (!item.isHidden || hiddenFilesEnabled))
          .forEach((dir) => {
            // Convert lastModified to Date if it's a string or use current date as fallback
            const lastMod = dir.lastModified
              ? dir.lastModified instanceof Date
                ? dir.lastModified
                : new Date(dir.lastModified)
              : new Date();
            output += `${lastMod.toLocaleDateString().padEnd(12)}  <DIR>          ${dir.name}\n`;
          });

        // Then list files
        items
          .filter((item) => item.type === "file" && (!item.isHidden || hiddenFilesEnabled))
          .forEach((file) => {
            // Convert lastModified to Date if it's a string or use current date as fallback
            const lastMod = file.lastModified
              ? file.lastModified instanceof Date
                ? file.lastModified
                : new Date(file.lastModified)
              : new Date();
            output += `${lastMod.toLocaleDateString().padEnd(12)}  ${file.size?.toString().padStart(14)}  ${
              file.name
            }\n`;
          });

        // Count visible files and directories
        const visibleItems = items.filter((item) => !item.isHidden || hiddenFilesEnabled);
        const fileCount = visibleItems.filter((item) => item.type === "file").length;
        const dirCount = visibleItems.filter((item) => item.type === "directory").length;
        const totalFileSize = visibleItems
          .filter((item) => item.type === "file")
          .reduce((acc, file) => acc + (file.size || 0), 0);

        output += `${fileCount} File(s)      ${totalFileSize.toLocaleString()} bytes\n`;
        output += `${dirCount} Dir(s)      523,425,792 bytes free`;
      } else if (cmdLower === "show hidden files") {
        setHiddenFilesEnabled(true);
        localStorage.setItem("showHiddenFiles", "true");
        output = "Hidden files will now be visible in the file explorer.\nPlease restart My Computer to apply changes.";
      } else if (cmdLower.startsWith("type ")) {
        const filePath = command.substring(5).trim();

        // Handle relative file paths
        const fullPath = filePath.includes(":")
          ? filePath.toLowerCase()
          : currentDirectory === "C:"
          ? `c:\\${filePath}`.toLowerCase()
          : `${currentDirectory.toLowerCase()}\\${filePath}`;

        if (fullPath === "c:\\documents\\encrypted\\readme.txt") {
          output =
            'ENCRYPTED FILES\n\nThe files in this directory are encrypted and require special tools to access.\n\nFor security personnel only:\nTo decrypt files, use the Terminal and enter "help" for available commands.\n\nHint: Try using "decrypt-file" with appropriate parameters and the correct key (Caesar cipher with key=3).';
        } else if (fullPath === "c:\\windows\\system32\\.secure_notes.txt") {
          if (hiddenFilesEnabled) {
            output =
              'Security Notes:\n\nImportant: The Caesar cipher uses a shift of 3 positions.\nRemember to use "access FIRST_MISSION_1995" to gain access to secure terminal functions.\n\nThe mission files are in: C:\\Documents\\Encrypted\\';
          } else {
            output = "ERROR: Cannot find the specified file.";
          }
        } else if (fullPath === "c:\\documents\\readme.txt") {
          output =
            "Welcome to HackBook W95!\n\nThis system is designed for security training purposes. As you progress through missions, you will gain access to more tools and features.\n\nYour first mission is to explore the system and familiarize yourself with its interface.\n\nGood luck!";
        } else if (fullPath === "c:\\config.sys") {
          output =
            "DEVICE=C:\\WINDOWS\\HIMEM.SYS\nDOS=HIGH,UMB\nDEVICE=C:\\WINDOWS\\EMM386.EXE NOEMS\nDEVICEHIGH=C:\\WINDOWS\\COMMAND\\ANSI.SYS\nFILES=40\nBUFFERS=10";
        } else if (fullPath === "c:\\autoexec.bat") {
          output =
            "@ECHO OFF\nPATH C:\\WINDOWS;C:\\WINDOWS\\COMMAND\nSET TEMP=C:\\TEMP\nSET TMP=C:\\TEMP\nPROMPT $P$G\nwin";
        } else {
          output = "ERROR: Cannot find the specified file.";
        }
      } else if (cmdLower === "systeminfo") {
        output =
          "Host Name:                 HACKBOOKW95\nOS Name:                   Microsoft Windows 95\nOS Version:                4.00.950\nOS Manufacturer:           Microsoft Corporation\nSystem Type:               x86-based PC\nProcessor(s):              1 Processor(s) Installed\n                          [01]: x86 Family 5 Model 2 Stepping 12 GenuineIntel ~90 Mhz\nBIOS Version:              Phoenix ROM BIOS PLUS Version 1.10 A04\nSystem Directory:          C:\\WINDOWS\\SYSTEM\nTotal Physical Memory:     16 MB\nAvailable Physical Memory: 8 MB\nPage File Space:           32 MB\nPage File:                 C:\\PAGEFILE.SYS\nDomain:                    HACKNET\nLogon Server:              \\\\HACKNET-DC1\nHotfix(s):                 1 Hotfix(s) Installed\n                          [01]: KB123456";
      } else if (cmdLower.startsWith("cd ") || cmdLower === "cd") {
        if (cmdLower === "cd") {
          // Display current directory when no argument is provided
          output = `Current directory: ${currentDirectory}`;
        } else {
          const targetPath = command.substring(3).trim();

          // Handle special cases
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
            // Convert forward slashes to backslashes for consistency
            const normalizedPath = targetPath.replace(/\//g, "\\");

            // Handle absolute path
            if (normalizedPath.startsWith("C:\\") || normalizedPath.startsWith("c:\\")) {
              if (fs.navigateTo(normalizedPath)) {
                setCurrentDirectory(normalizedPath);
                output = `Directory changed to ${normalizedPath}`;
              } else {
                output = `Error: Directory not found - ${normalizedPath}`;
              }
            }
            // Handle relative path
            else {
              const newPath =
                currentDirectory === "C:" ? `C:\\${normalizedPath}` : `${currentDirectory}\\${normalizedPath}`;

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
        output = `
Memory Type       Total       Used        Free
--------------  --------   ---------   ---------
Conventional      640K        145K        495K
Upper              0K          0K          0K
Reserved          384K        384K          0K
Extended (XMS)  15,360K     5,628K      9,732K
--------------  --------   ---------   ---------
Total memory    16,384K     6,157K     10,227K
`;
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

      // Add output to history if there's any
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

      {/* Tab suggestions */}
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

      {/* Command input */}
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
