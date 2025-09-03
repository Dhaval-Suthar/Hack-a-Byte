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
import { AttackData } from "@/hooks/useSocket";
import { APP_ROLE_ACCESS, formatAllowedRoles } from '@/lib/constants/app-constants';

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
const CameraApp = lazy(() => import("../apps/CameraApp"));
const FileApp = lazy(() => import("../apps/FileApp"));
const GalleryApp = lazy(() => import("../apps/GalleryApp"));
const StockMarketApp = lazy(() => import("../apps/StockMarketApp"));
const SnakeeGame = lazy(() => import("../apps/SnakeeGame"));
const NotesApp = lazy(() => import("../apps/NotesApp"));
const AppStore = lazy(() => import("../apps/AppStore"));
const SettingsApp = lazy(() => import("../apps/SettingsApp"));
const SentinelApp = lazy(() => import("../apps/SentinelApp"));
const Calendar = lazy(() => import("../apps/Calendar/Calendar"));
const MiningApp = lazy(() => import("../apps/MiningApp"));
const SecurityCenterApp = lazy(() => import("../apps/SecurityCenterApp"));
const DefenderStealthViral = lazy(() => import("../apps/DefenderStealthViral"));
const DefenderRansomware = lazy(() => import("../apps/DefenderRansomware"));
const BankStatusApp = lazy(() => import("../apps/BankStatusApp"));
const WormPhishingApp = lazy(() => import("../apps/WormPhishingApp"));
const SafariFaucet = lazy(() => import("../apps/SafariFaucet"));
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
}) => {
  const analytics = useAppAnalytics();
  const sessionStartTime = useRef<number>(Date.now());
  const [userRole, setUserRole] = useState<string | null>(null);
  const [teamSize, setTeamSize] = useState<number | null>(null);

  // Check localStorage for selected role on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const selectedRole = localStorage.getItem('selectedRole');
      setUserRole(selectedRole);
      // Attempt to read cached team info (if stored) else fetch minimal
      const cachedSize = localStorage.getItem('teamSize');
      if (cachedSize) {
        setTeamSize(Number(cachedSize));
      } else {
        // Lightweight fetch to infer size (ignoring errors silently)
        fetch('/api/team', { method: 'GET' })
          .then(async r=>({ ok: r.ok, status: r.status, json: r.ok ? await r.json(): null }))
          .then(({ ok, json }) => {
            if (!ok) return; // silently ignore 400 (no playspace yet)
            if (json && Array.isArray(json.teamMembers)) {
              setTeamSize(json.teamMembers.length);
              localStorage.setItem('teamSize', String(json.teamMembers.length));
            }
          }).catch(()=>{});
      }
    }
  }, []);

  // Phone number state for PhoneApp integration
  const [phoneNumber] = useState<string>('');

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
    // Centralized role gating
    let requiredRoles = APP_ROLE_ACCESS[appId];
    const normalizedRole = userRole?.toLowerCase() || null;
    // Client-side mirror of small-team fallback; keep in sync with server logic
    if (requiredRoles && teamSize) {
      if (teamSize === 1) {
        requiredRoles = []; // unrestricted
      } else if (teamSize === 2) {
        const onlyAttack = requiredRoles.every(r=>['rio','tokyo'].includes(r));
        const onlyExtract = requiredRoles.every(r=>['nairobi','denver'].includes(r));
        if (onlyAttack || onlyExtract) {
          requiredRoles = [...requiredRoles, 'professor','berlin'];
        }
      } else if (teamSize === 3) {
        const onlyExtract = requiredRoles.every(r=>['nairobi','denver'].includes(r));
        if (onlyExtract) {
          requiredRoles = [...requiredRoles, 'professor','rio','tokyo'];
        }
      }
    }
    const isRestricted = Array.isArray(requiredRoles);

    if (isRestricted) {
      // Still loading role from localStorage
      if (normalizedRole === null || (requiredRoles && teamSize === null)) {
        return wrapWithErrorBoundary(
          <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-2xl mb-4">⏳</div>
              <h3 className="text-lg font-medium text-white mb-2">Loading...</h3>
              <p className="text-gray-400 text-sm">Checking access permissions</p>
            </div>
          </div>,
          appId
        );
      }
      // Deny if user's role not allowed
      if (requiredRoles.length && !requiredRoles.includes(normalizedRole)) {
        // Special styling for appStore denial to retain prior UX flair
        if (appId === 'appStore') {
          return wrapWithErrorBoundary(
            <div className="w-screen h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-red-900/30 flex flex-col font-sans text-white overflow-hidden relative">
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="text-6xl mb-4">🔒</div>
                  <h3 className="text-xl font-bold text-red-400 mb-2">ACCESS DENIED</h3>
                  <p className="text-gray-400 text-sm">Restricted to: {formatAllowedRoles(appId)}</p>
                  <p className="text-gray-500 text-xs mt-2">Current role: {userRole}</p>
                  <button 
                    onClick={onClose}
                    className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition-colors"
                  >Return to Desktop</button>
                </div>
              </div>
            </div>,
            appId
          );
        }
        // Generic denial UI
        return wrapWithErrorBoundary(
          <div className="w-screen h-screen bg-gray-900 flex items-center justify-center">
            <div className="text-center px-4 max-w-xs">
              <div className="text-5xl mb-4">🔒</div>
              <h3 className="text-lg font-semibold text-white mb-2">Access Restricted</h3>
              <p className="text-gray-400 text-sm mb-2">This application is limited to specific roles.</p>
              <p className="text-gray-300 text-xs mb-4">Allowed: {formatAllowedRoles(appId)}</p>
              <p className="text-gray-500 text-xs mt-2">Your role: {userRole}</p>
              <button 
                onClick={onClose}
                className="mt-4 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs"
              >Return</button>
            </div>
          </div>,
          appId
        );
      }
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
            <MessagingApp time={time} />
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
      case "security":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}> 
            <SecurityCenterApp />
          </Suspense>,
          appId
        );
      case "def-stealth":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}> 
            <DefenderStealthViral />
          </Suspense>,
          appId
        );
      case "def-ransom":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}> 
            <DefenderRansomware />
          </Suspense>,
          appId
        );
      case "bank-status":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}> 
            <BankStatusApp />
          </Suspense>,
          appId
        );
      case "worm-phish":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}> 
            <WormPhishingApp />
          </Suspense>,
          appId
        );
      case "faucet":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}> 
            <SafariFaucet />
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
            <NotesApp onClose={onClose} time={time.toLocaleTimeString()} />
          </Suspense>,
          appId
        );
      case "appStore":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <AppStore onClose={onClose} time={time} user={user} />
          </Suspense>,
          appId
        );
      case "files":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <FileApp
              onClose={(info) => {
                console.log('Files app closed:', info);
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
            <MailApp onClose={onClose} time={time} />
          </Suspense>,
          appId
        );
      case "settings":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsApp onClose={onClose} onBack={() => onAppSwitch?.('game')} user={user} />
          </Suspense>,
          appId
        );
      case "sentinel":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <SentinelApp onClose={onClose} time={time.toLocaleTimeString()} />
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
      <AttackReceiver onAttackReceived={(attack: AttackData) => {
        console.log('HackPhoneAppsRouter: Attack received:', attack);
        // Here you could add additional attack handling logic
        // like triggering device-wide effects, notifications, etc.
      }} />
      <AttackEffects onEffectTriggered={(effect) => {
        console.log('HackPhoneAppsRouter: Attack effect triggered:', effect);
        // Here you could add device-wide responses to effects
        // like screen shake, sound alerts, etc.
      }} />
      {renderApp()}
    </>
  );
};

export default HackPhoneAppsRouter;
