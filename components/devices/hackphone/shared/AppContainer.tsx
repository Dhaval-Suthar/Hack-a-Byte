"use client";

import React from "react";

interface AppContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  className?: string;
}

export const AppContainer: React.FC<AppContainerProps> = ({
  children,
  backgroundColor = "bg-gray-900",
  className = ""
}) => {
  return (
    <div className={`w-screen h-screen ${backgroundColor} flex flex-col ${className}`}>
      {children}
    </div>
  );
};

interface AppHeaderProps {
  title: string;
  onClose?: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onClose,
  showBackButton = false,
  onBack,
  className = ""
}) => {
  return (
    <div className={`bg-white/10 border-b border-white/20 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="text-white hover:text-gray-300 transition-colors"
            >
              ←
            </button>
          )}
          <h1 className="text-lg font-semibold text-white">{title}</h1>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

interface AppContentProps {
  children: React.ReactNode;
  className?: string;
}

export const AppContent: React.FC<AppContentProps> = ({
  children,
  className = ""
}) => {
  return (
    <div className={`flex-1 overflow-hidden ${className}`}>
      {children}
    </div>
  );
};
