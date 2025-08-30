"use client";

import React from "react";
import { AppContainer } from "../shared/AppContainer";

interface DefaultAppProps {
  appId: string;
}

export const DefaultApp: React.FC<DefaultAppProps> = ({ appId }) => {
  return (
    <AppContainer backgroundColor="bg-gray-900">
      <div className="flex-1 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-xl font-medium mb-2">App Under Development</h2>
          <p className="text-gray-400">The {appId} app is coming soon!</p>
        </div>
      </div>
    </AppContainer>
  );
};
