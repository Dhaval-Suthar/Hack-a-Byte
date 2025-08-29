"use client";

import React, { Suspense, lazy, useEffect, useRef } from "react";
import { AppRouterProps } from "@/types/devices";
import { TerminalApp } from "../apps/TerminalApp";
import { NetworkScannerApp } from "../apps/NetworkScannerApp";
import { CryptoToolkitApp } from "../apps/CryptoToolkitApp";
import { DefaultApp } from "../apps/DefaultApp";
import { AppErrorBoundary } from "../shared/AppErrorBoundary";
import { useAppAnalytics } from "../shared/AppAnalytics";

// Lazy load complex app components
const CalculatorApp = lazy(() => import("./CalculatorApp"));
const MessagingApp = lazy(() => import("./MessagingApp"));
const MapApp = lazy(() => import("./MapApp"));
const MailApp = lazy(() => import("./MailApp"));
const SafariApp = lazy(() => import("./SafariApp"));
const YouTubeApp = lazy(() => import("./YouTubeApp"));
const WeatherApp = lazy(() => import("./WeatherApp"));
const MusicApp = lazy(() => import("./MusicApp"));
const PhoneApp = lazy(() => import("./PhoneApp"));
const ClockApp = lazy(() => import("./ClockApp"));
const CameraApp = lazy(() => import("./CameraApp"));
const ContactsApp = lazy(() => import("./ContactsApp"));
const FileApp = lazy(() => import("./FileApp"));
const GalleryApp = lazy(() => import("./GalleryApp"));
const StockMarketApp = lazy(() => import("../apps/StockMarketApp"));
const SnakeeGame = lazy(() => import("../apps/SnakeeGame"));
const NotesApp = lazy(() => import("../apps/NotesApp"));
const AppStore = lazy(() => import("../apps/AppStore"));
const SettingsApp = lazy(() => import("../apps/SettingsApp"));
const SentinelApp = lazy(() => import("../apps/SentinelApp"));
const CryptoHeistApp = lazy(() => import("../apps/CryptoHeistApp"));
const Calendar = lazy(() => import("../apps/Calendar/Calendar"));

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
  const renderApp = () => {
    const wrapWithErrorBoundary = (app: React.ReactNode, appId: string) => (
      <AppErrorBoundary appId={appId} key={appId}>
        {app}
      </AppErrorBoundary>
    );

    switch (appId) {
      // Inline apps (simple, no lazy loading needed)
      case "terminal":
        return wrapWithErrorBoundary(<TerminalApp user={user} />, appId);
      case "network":
        return wrapWithErrorBoundary(<NetworkScannerApp />, appId);
      case "crypto":
        return wrapWithErrorBoundary(<CryptoToolkitApp />, appId);

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
            <MapApp onClose={onClose} time={time} />
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
            <StockMarketApp time={time} />
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
      case "contacts":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <ContactsApp onClose={onClose} time={time} onOpenPhone={() => onOpenApp?.("phone")} />
          </Suspense>,
          appId
        );
      case "phone":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <PhoneApp onClose={onClose} time={time} onOpenContacts={() => onOpenApp?.("contacts")} initialPhoneNumber={initialPhoneNumber} />
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
            <AppStore onClose={onClose} time={time} />
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
            <SettingsApp onClose={onClose} onBack={() => onAppSwitch?.('game')} />
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

      case "cryptoheist":
        return wrapWithErrorBoundary(
          <Suspense fallback={<LoadingSpinner />}>
            <CryptoHeistApp />
          </Suspense>,
          appId
        );

      default:
        return wrapWithErrorBoundary(<DefaultApp appId={appId} />, appId);
    }
  };

  return renderApp();
};

export default HackPhoneAppsRouter;
