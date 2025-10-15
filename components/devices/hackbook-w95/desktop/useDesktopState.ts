"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGameFailureHandler } from "../hooks/useGameFailureHandler";
import { App } from "./app-config";

export interface DeviceUser {
  _id: string;
  username: string;
  progress?: {
    unlockedApplications?: string[];
    skills?: Record<string, number>;
  };
}

export const useDesktopState = () => {
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
  const [link, setLink] = useState("https://en.wikipedia.org/wiki/Wikipedia:About");
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

  // Database-driven unlocked applications state
  const [unlockedApplications, setUnlockedApplications] = useState<string[]>([]);

  // Device user state
  const [deviceUser, setDeviceUser] = useState<DeviceUser | null>(null);
  const [playspaceId, setPlayspaceId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Add refs to track pending database operations to prevent duplicate calls
  const pendingDbOperations = useRef<Set<string>>(new Set());

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

  return {
    // Alert state
    alertOpen,
    setAlertOpen,
    alertMessage,
    setAlertMessage,
    alertCallback,
    setAlertCallback,

    // UI state
    unreadCount,
    setUnreadCount,
    openMenu,
    setOpenMenu,
    selectedApp,
    setSelectedApp,
    date,
    setDate,
    isClient,
    setIsClient,
    link,
    setLink,
    showProgramsMenu,
    setShowProgramsMenu,
    hasSeenMission,
    setHasSeenMission,
    showShutdownDialog,
    setShowShutdownDialog,
    showWelcomeDialog,
    setShowWelcomeDialog,
    showRestartAnimation,
    setShowRestartAnimation,
    showShutdownAnimation,
    setShowShutdownAnimation,
    showLogoutAnimation,
    setShowLogoutAnimation,
    runningApps,
    setRunningApps,

    // Feature availability state
    networkToolInstalled,
    setNetworkToolInstalled,
    showInstallNotification,
    setShowInstallNotification,
    neuralNetworkUnlocked,
    setNeuralNetworkUnlocked,
    showNeuralNetworkNotification,
    setShowNeuralNetworkNotification,
    vaultUnlocked,
    setVaultUnlocked,
    showVaultNotification,
    setShowVaultNotification,
    showNumberJumpingGame,
    setShowNumberJumpingGame,
    mission2JustCompleted,
    setMission2JustCompleted,
    devToolsUnlocked,
    setDevToolsUnlocked,
    unlockedApplications,
    setUnlockedApplications,

    // Device state
    deviceUser,
    setDeviceUser,
    playspaceId,
    setPlayspaceId,
    deviceId,
    setDeviceId,

    // Refs
    pendingDbOperations,

    // Utilities
    router,
    searchParams,
    handleFailure,
    formatTime,
  };
};
