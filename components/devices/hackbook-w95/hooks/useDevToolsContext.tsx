"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DevToolsContextType {
  devToolsVisible: boolean;
  setDevToolsVisible: (visible: boolean) => void;
  checkZebraCode: (input: string) => boolean;
}

const DevToolsContext = createContext<DevToolsContextType | undefined>(undefined);

export function DevToolsProvider({ children }: { children: ReactNode }) {
  const [devToolsVisible, setDevToolsVisible] = useState(false);

  // Function to check if "zebra" is typed in the terminal
  const checkZebraCode = (input: string) => {
    if (input.toLowerCase() === "zebra") {
      setDevToolsVisible(true);
      return true;
    }
    return false;
  };

  return (
    <DevToolsContext.Provider value={{ devToolsVisible, setDevToolsVisible, checkZebraCode }}>
      {children}
    </DevToolsContext.Provider>
  );
}

export function useDevToolsContext() {
  const context = useContext(DevToolsContext);
  if (context === undefined) {
    throw new Error('useDevToolsContext must be used within a DevToolsProvider');
  }
  return context;
}
