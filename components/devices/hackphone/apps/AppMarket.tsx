"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { AppConfig } from "@/types/devices";
import { APP_REGISTRY, getAppsByCategory, getAllCategories, checkAppPermissions } from "../shared/AppRegistry";
import { useAppAnalytics } from "../shared/AppAnalytics";
import { PermissionRequest } from "../shared/PermissionRequest";
import { AppContainer, AppHeader } from "../shared/AppContainer";

interface AppMarketProps {
  onAppInstall?: (appId: string) => void;
  onAppOpen?: (appId: string) => void;
  installedApps?: string[];
  user?: { _id: string; [key: string]: unknown } | null;
}

export const AppMarket: React.FC<AppMarketProps> = ({
  onAppInstall,
  onAppOpen,
  installedApps = [],
  user,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPermissionRequest, setShowPermissionRequest] = useState(false);
  const [pendingApp, setPendingApp] = useState<AppConfig | null>(null);
  const [installingApp, setInstallingApp] = useState<string | null>(null);

  const analytics = useAppAnalytics();
  const categories = useMemo(() => ['all', ...getAllCategories()], []);

  const filteredApps = useMemo(() => {
    let apps = selectedCategory === 'all'
      ? APP_REGISTRY
      : getAppsByCategory(selectedCategory);

    if (searchQuery) {
      apps = apps.filter((app: AppConfig) =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return apps;
  }, [selectedCategory, searchQuery]);

  const handleAppAction = async (app: AppConfig) => {
    analytics.trackAppInteraction(app.id, 'app_market_click', user?._id, {
      category: selectedCategory,
      searchQuery,
    });

    if (installedApps.includes(app.id)) {
      // App is installed, open it
      onAppOpen?.(app.id);
      analytics.trackAppOpen(app.id, user?._id, { source: 'app_market' });
    } else {
      // Check permissions before installing
      const permissionCheck = checkAppPermissions(app.id);

      if (!permissionCheck.hasAllPermissions) {
        setPendingApp(app);
        setShowPermissionRequest(true);
        return;
      }

      // Install the app
      await handleInstallApp(app);
    }
  };

  const handleInstallApp = async (app: AppConfig) => {
    setInstallingApp(app.id);

    try {
      // Simulate installation process
      await new Promise(resolve => setTimeout(resolve, 2000));

      onAppInstall?.(app.id);
      analytics.trackAppInteraction(app.id, 'app_install_success', user?._id);

      // Show success message (you could add a toast notification here)
      console.log(`✅ ${app.name} installed successfully!`);

    } catch (error) {
      console.error(`❌ Failed to install ${app.name}:`, error);
      analytics.trackAppInteraction(app.id, 'app_install_failed', user?._id, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setInstallingApp(null);
    }
  };

  const handlePermissionGrant = () => {
    if (pendingApp) {
      handleInstallApp(pendingApp);
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
    <AppContainer backgroundColor="bg-gray-900">
      <AppHeader title="App Market" />

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-6 py-3 border-b border-gray-800">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                category === selectedCategory
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category === 'all' ? 'All Apps' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Apps Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h2 className="text-white text-xl font-semibold">
              {selectedCategory === 'all' ? 'All Apps' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Apps`}
              {searchQuery && ` • "${searchQuery}"`}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {filteredApps.length} app{filteredApps.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {filteredApps.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📱</div>
              <p className="text-gray-400 mb-2">No apps found</p>
              <p className="text-gray-500 text-sm">
                {searchQuery ? 'Try a different search term' : 'Check back later for new apps'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredApps.map((app: AppConfig) => {
                const isInstalled = installedApps.includes(app.id);
                const isInstalling = installingApp === app.id;
                const permissionCheck = checkAppPermissions(app.id);
                const hasAllPermissions = permissionCheck.hasAllPermissions;

                return (
                  <div
                    key={app.id}
                    className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-colors"
                  >
                    {/* App Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                          <Image
                            src={app.icon}
                            alt={`${app.name} icon`}
                            width={32}
                            height={32}
                            className="object-cover rounded-lg"
                          />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{app.name}</h3>
                          <p className="text-gray-400 text-sm capitalize">{app.category}</p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-col items-end space-y-1">
                        {app.isSystemApp && (
                          <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                            System
                          </span>
                        )}
                        {isInstalled && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                            Installed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* App Description */}
                    <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                      {app.description || 'No description available'}
                    </p>

                    {/* Permissions Warning */}
                    {!hasAllPermissions && (
                      <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-400 text-sm">⚠️</span>
                          <span className="text-yellow-300 text-sm">
                            Requires additional permissions
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => handleAppAction(app)}
                      disabled={isInstalling}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                        isInstalled
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : isInstalling
                          ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isInstalling ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Installing...</span>
                        </div>
                      ) : isInstalled ? (
                        'Open App'
                      ) : (
                        'Install'
                      )}
                    </button>

                    {/* App Metadata */}
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                      <span>v{app.version || '1.0'}</span>
                      {app.permissions && app.permissions.length > 0 && (
                        <span>{app.permissions.length} permission{app.permissions.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppContainer>
  );
};

export default AppMarket;
