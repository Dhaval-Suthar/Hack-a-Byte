"use client";

import { useState, useCallback } from "react";

export const useAppNavigation = () => {
  const [currentApp, setCurrentApp] = useState<string | null>(null);

  const openApp = useCallback((appId: string) => {
    setCurrentApp(appId);
  }, []);

  const closeApp = useCallback(() => {
    setCurrentApp(null);
  }, []);

  const switchApp = useCallback((appId: string) => {
    setCurrentApp(appId);
  }, []);

  return {
    currentApp,
    openApp,
    closeApp,
    switchApp,
  };
};
