"use client";

import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import { AppRouterProps } from "@/types/devices";
import { TerminalApp } from "../apps/TerminalApp";
import { NetworkScannerApp } from "../apps/NetworkScannerApp";
import { DefaultApp } from "../apps/DefaultApp";
import { AppErrorBoundary } from "../shared/AppErrorBoundary";
import { useAppAnalytics } from "../shared/AppAnalytics";
import { AttackReceiver } from "../shared/AttackReceiver";
import { AttackEffects } from "../shared/AttackEffects";
import { useNotificationService } from "@/hooks/useNotificationService";
import IOS4Notification from "@/components/ui/IOS4Notification";
import { logger } from '@/lib/logger';
import { isHackPhoneAppAllowed } from '@/lib/role-access-matrix';

// Lazy load complex app components
const CalculatorApp = lazy(() => import("../apps/CalculatorApp"));
const MessagingApp = lazy(() => import("../apps/MessagingApp"));
const MapApp = lazy(() => import("../apps/MapApp"));
const MailApp = lazy(() => import("../apps/MailApp"));
const SafariApp = lazy(() => import("../apps/SafariApp"));
const YouTubeApp = lazy(() => import("../apps/YouTubeApp"));
const WeatherApp = lazy(() => import("../apps/WeatherApp"));
const MusicApp = lazy(() => import("../apps/MusicApp"));
const PhoneApp = lazy(() => import("../apps/PhoneApp"));
const ClockApp = lazy(() => import("../apps/ClockApp"));
const CameraApp = lazy(() => import("../apps/EnhancedCameraApp"));
const FileApp = lazy(() => import("../apps/FileApp"));
const GalleryApp = lazy(() => import("../apps/EnhancedGalleryApp"));
const StockMarketApp = lazy(() => import("../apps/StockMarketApp"));
const SnakeeGame = lazy(() => import("../apps/SnakeeGame"));
const NotesApp = lazy(() => import("../apps/NotesApp"));
const AppStore = lazy(() => import("../apps/AppStore"));
const SettingsApp = lazy(() => import("../apps/SettingsApp"));
const SentinelApp = lazy(() => import("../apps/SentinelApp"));
const Calendar = lazy(() => import("../apps/Calendar/Calendar"));
const MiningApp = lazy(() => import("../apps/MiningApp"));
const EmailSmsExtractor = lazy(() => import("../apps/EmailSmsExtractor"));

const LoadingSpinner = () => (
  <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-white">Loading...</div>
  </div>
);

const HackPhoneAppsRouter: React.FC<AppRouterProps> = ({
  appId,
  onClose,
  user,
  time,
  onAppSwitch,
  onOpenApp,
  initialPhoneNumber,
  deviceId,
  playspaceId,
}) => {
  const analytics = useAppAnalytics();
  const sessionStartTime = useRef<number>(Date.now());
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

    // Check localStorage for selected role on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedRole = localStorage.getItem('selectedRole');
      setUserRole(selectedRole);
      // Attempt to read cached team info (if stored) else fetch minimal
      const cachedSize = localStorage.getItem('teamSize');
      if (cachedSize) {
        setTeamSize(parseInt(cachedSize, 10));
      }
    }
  }, []);

  // Fetch teamId when playspaceId is available
  useEffect(() => {
    const fetchTeamId = async () => {
      if (playspaceId) {
        try {
          const response = await fetch(`/api/team/get-team-id?playspaceId=${playspaceId}`);
          const data = await response.json();
          if (data.success) {
            setTeamId(data.teamId);
          }
        } catch (error) {
          logger.error('Failed to fetch team ID:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        }
      }
    };

    fetchTeamId();
  }, [playspaceId]);

  // Phone number state for PhoneApp integration
  const [phoneNumber] = useState<string>('');

  // Notification system
  const { notification, dismissNotification } = useNotificationService(teamId || undefined);

  // Track app open
  useEffect(() => {
    sessionStartTime.current = Date.now();
    analytics.trackAppOpen(appId, user?._id);

    // Track app close when component unmounts or appId changes
    return () => {
      const sessionDuration = Date.now() - sessionStartTime.current;
      analytics.trackAppClose(appId, user?._id, sessionDuration);
    };
  }, [appId, user?._id, analytics]);

  const wrapWithErrorBoundary = (app: React.ReactNode, appId: string) => (
    <AppErrorBoundary appId={appId} key={appId}>
      <div className="w-screen h-screen pb-20 overflow-hidden">
        {app}
      </div>
    </AppErrorBoundary>
  );

  const renderApp = () => {
    // Use the new centralized role access control
    const normalizedRole = userRole?.toLowerCase() || null;
    
    // Check if the current app is allowed for this user's role and team size
    if (normalizedRole && teamSize && !isHackPhoneAppAllowed(appId, teamSize, normalizedRole)) {
      return wrapWithErrorBoundary(
        <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h2>
            <p className="text-gray-300 mb-4">
              Your role <span className="font-semibold text-blue-400">{userRole}</span> in a team of <span className="font-semibold text-blue-400">{teamSize}</span> 
              {' '}does not have permission to access this application.
            </p>
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">Role Restrictions</h3>
              <p className="text-sm text-gray-400">
                Access to <span className="font-semibold">{appId}</span> is restricted for your current role and team configuration.
                Contact your team leader or check the role permissions matrix for more information.
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Return to Home
            </button>
          </div>
        </div>,
        appId
      );
    }

    // Still loading role from localStorage
    if (normalizedRole === null || teamSize === null) {
      return wrapWithErrorBoundary(
        <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-2xl mb-4">⏳</div>
            <p className="text-gray-300">Loading user permissions...</p>
          </div>
        </div>,
        appId
      );
    }

    switch (appId) {
      // Inline apps (simple, no lazy loading needed)
      case "terminal":
        return wrapWithErrorBoundary(<TerminalApp user={user} />, appId);
      case "network":
        return wrapWithErrorBoundary(<NetworkScannerApp />, appId);

      // Lazy loaded apps
      case "calculator":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <CalculatorApp onClose={onClose} time={time.toLocaleTimeString()} />
          </Suspense>,
          appId
        );
      case "clock":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <ClockApp onClose={onClose} />
          </Suspense>,
          appId
        );
      case "safari":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <SafariApp onClose={onClose} />
          </Suspense>,
          appId
        );
      case "messages":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <MessagingApp time={time} teamId={teamId || undefined} />
          </Suspense>,
          appId
        );
      case "maps":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <MapApp time={time} />
          </Suspense>,
          appId
        );
      case "music":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <MusicApp />
          </Suspense>,
          appId
        );
      case "youtube":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <YouTubeApp onClose={onClose} time={time} />
          </Suspense>,
          appId
        );
      case "camera":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <CameraApp
              onClose={onClose}
              time={time}
              onOpenGallery={() => onAppSwitch?.('photos')}
            />
          </Suspense>,
          appId
        );
      case "photos":
      case "gallery":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <GalleryApp
              time={time}
              onClose={onClose}
              onOpenCamera={() => onAppSwitch?.('camera')}
            />
          </Suspense>,
          appId
        );
      case "stocks":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <StockMarketApp />
          </Suspense>,
          appId
        );
      case "snakee":
      case "game":
      case "games":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <SnakeeGame onClose={onClose} time={time} />
          </Suspense>,
          appId
        );
      case "mining":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}> 
            <MiningApp />
          </Suspense>,
          appId
        );
      case "email-sms":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}> 
            <EmailSmsExtractor />
          </Suspense>,
          appId
        );
      case "contacts":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <PhoneApp time={time} onOpenContacts={() => onOpenApp?.("contacts")} initialPhoneNumber={phoneNumber || initialPhoneNumber} />
          </Suspense>,
          appId
        );
      case "phone":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <PhoneApp time={time} onOpenContacts={() => onOpenApp?.("contacts")} initialPhoneNumber={phoneNumber || initialPhoneNumber} />
          </Suspense>,
          appId
        );
      case "weather":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <WeatherApp onClose={onClose} time={time} />
          </Suspense>,
          appId
        );
      case "notes":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <NotesApp onClose={onClose} time={time.toLocaleTimeString()} deviceId={deviceId || ''} />
          </Suspense>,
          appId
        );
      case "appStore":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <AppStore onClose={onClose} time={time} user={user} attackerTeamId={teamId || undefined} />
          </Suspense>,
          appId
        );
      case "files":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <FileApp
              onClose={() => {
                onClose();
              }}
              time={time.toLocaleTimeString()}
            />
          </Suspense>,
          appId
        );
      case "mail":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <MailApp onClose={onClose} time={time} teamId={teamId || undefined} />
          </Suspense>,
          appId
        );
      case "settings":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsApp />
          </Suspense>,
          appId
        );
      case "sentinel":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <SentinelApp onClose={onClose} time={time.toLocaleTimeString()} teamId={teamId || undefined} />
          </Suspense>,
          appId
        );
      case "calendar":
      case "calender":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <div className="w-screen h-screen bg-gray-50 flex flex-col">
              <div className="flex-1 overflow-hidden">
                <Calendar time={time} />
              </div>
            </div>
          </Suspense>,
          appId
        );

      default:
        return wrapWithErrorBoundary(<DefaultApp appId={appId} />, appId);
    }
  };

  return (
    <>
      <AttackReceiver onAttackReceived={
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (info: unknown) => {
          // Here you could add additional attack handling logic
          // like triggering device-wide effects, notifications, etc.
        }
      } />
      <AttackEffects onEffectTriggered={
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        (attack: unknown) => {
          // Here you could add device-wide responses to effects
          // like screen shake, sound alerts, etc.
        }
      } />
      {renderApp()}
      
      {/* iOS 4 Style Notifications */}
      {notification && (
        <IOS4Notification
          message={notification.body}
          type={notification.type}
          isVisible={!!notification}
          onDismiss={dismissNotification}
          onOpen={() => {
            // Open the appropriate app when notification is tapped
            if (onOpenApp) {
              if (notification.type === 'sms') {
                onOpenApp('messages');
              } else if (notification.type === 'email') {
                onOpenApp('mail');
              }
            }
            dismissNotification();
          }}
        />
      )}
    </>
  );
};

export default HackPhoneAppsRouter;
