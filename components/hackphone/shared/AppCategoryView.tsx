"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { AppConfig } from "../types";
import { getAppsByCategory, getAllCategories, checkAppPermissions } from "./AppRegistry";
import { PermissionRequest } from "./PermissionRequest";

interface AppCategoryViewProps {
  onAppOpen: (appId: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export const AppCategoryView: React.FC<AppCategoryViewProps> = ({
  onAppOpen,
  selectedCategory,
  onCategoryChange,
}) => {
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [pendingApp, setPendingApp] = useState<AppConfig | null>(null);

  const categories = useMemo(() => getAllCategories(), []);
  const currentCategory = selectedCategory || categories[0] || 'communication';
  const appsInCategory = useMemo(() => getAppsByCategory(currentCategory), [currentCategory]);

  const handleAppClick = (app: AppConfig) => {
    // Check permissions before opening
    const permissionCheck = checkAppPermissions(app.id);

    if (!permissionCheck.hasAllPermissions) {
      setPendingApp(app);
      setShowPermissionRequest(true);
      return;
    }

    onAppOpen(app.id);
  };

  const handlePermissionGrant = () => {
    if (pendingApp) {
      onAppOpen(pendingApp.id);
    }
    setShowPermissionRequest(false);
    setPendingApp(null);
  };

  const handlePermissionDeny = () => {
    setShowPermissionRequest(false);
    setPendingApp(null);
  };

  if (showPermissionRequest && pendingApp) {
    return (
      <PermissionRequest
        appName={pendingApp.name}
        permissions={pendingApp.permissions || []}
        onGrant={handlePermissionGrant}
        onDeny={handlePermissionDeny}
        onClose={() => setShowPermissionRequest(false)}
      />
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col">
      {/* Category Tabs */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex space-x-1 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => onCategoryChange?.(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                category === currentCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white text-xl font-semibold mb-6 capitalize">
            {currentCategory} Apps
          </h2>

          {appsInCategory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-gray-400">No apps in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {appsInCategory.map((app) => {
                const permissionCheck = checkAppPermissions(app.id);
                const hasAllPermissions = permissionCheck.hasAllPermissions;

                return (
                  <button
                    key={app.id}
                    onClick={() => handleAppClick(app)}
                    disabled={app.isLocked}
                    className={`group flex flex-col items-center p-4 rounded-xl transition-all duration-200 ${
                      app.isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : hasAllPermissions
                        ? 'hover:bg-gray-800 active:scale-95'
                        : 'hover:bg-yellow-900/20 active:scale-95 ring-2 ring-yellow-500/50'
                    }`}
                  >
                    {/* App Icon */}
                    <div className="relative mb-3">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                          app.isLocked ? 'bg-gray-700' : 'bg-white/10'
                        }`}
                      >
                        <Image
                          src={app.icon}
                          alt={`${app.name} icon`}
                          width={48}
                          height={48}
                          className="object-cover rounded-xl"
                        />
                      </div>

                      {/* Permission Warning Indicator */}
                      {!hasAllPermissions && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-black font-bold">!</span>
                        </div>
                      )}

                      {/* System App Badge */}
                      {app.isSystemApp && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">S</span>
                        </div>
                      )}
                    </div>

                    {/* App Name */}
                    <span className="text-white text-sm font-medium text-center leading-tight">
                      {app.name}
                    </span>

                    {/* App Description */}
                    {app.description && (
                      <span className="text-gray-400 text-xs text-center mt-1 leading-tight">
                        {app.description}
                      </span>
                    )}

                    {/* Lock Indicator */}
                    {app.isLocked && (
                      <div className="mt-2 text-yellow-500 text-xs">
                        🔒 Locked
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Stats */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-3">
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>{appsInCategory.length} apps</span>
          <span>{categories.length} categories</span>
        </div>
      </div>
    </div>
  );
};
