"use client";

import React, { useState } from "react";
import { AppContainer, AppHeader } from "./AppContainer";
import { AppPermission } from "@/types/devices";

interface PermissionRequestProps {
  appName: string;
  permissions: AppPermission[];
  onGrant: () => void;
  onDeny: () => void;
  onClose: () => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({
  appName,
  permissions,
  onGrant,
  onDeny,
  onClose,
}) => {
  const [grantedPermissions, setGrantedPermissions] = useState<Set<string>>(new Set());

  const handlePermissionToggle = (permissionType: string, checked: boolean) => {
    const newGranted = new Set(grantedPermissions);
    if (checked) {
      newGranted.add(permissionType);
    } else {
      newGranted.delete(permissionType);
    }
    setGrantedPermissions(newGranted);
  };

  const handleGrant = () => {
    // In a real app, you'd request actual browser permissions here
    permissions.forEach(async (permission) => {
      if (permission.type === 'camera') {
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (error) {
          console.warn('Camera permission denied:', error);
        }
      } else if (permission.type === 'microphone') {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (error) {
          console.warn('Microphone permission denied:', error);
        }
      } else if (permission.type === 'location') {
        try {
          await navigator.geolocation.getCurrentPosition(() => {});
        } catch (error) {
          console.warn('Location permission denied:', error);
        }
      }
      // Handle other permission types...
    });

    onGrant();
  };

  const requiredPermissions = permissions.filter(p => p.required);
  const optionalPermissions = permissions.filter(p => !p.required);

  return (
    <AppContainer backgroundColor="bg-gray-900">
      <AppHeader title={`${appName} Permissions`} onClose={onClose} />

      <div className="flex-1 p-6 space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Permission Request
          </h2>
          <p className="text-gray-300 text-sm">
            {appName} would like to access the following:
          </p>
        </div>

        {/* Required Permissions */}
        {requiredPermissions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium">Required Permissions</h3>
            <div className="space-y-2">
              {requiredPermissions.map((permission) => (
                <div
                  key={permission.type}
                  className="bg-red-900/20 border border-red-700/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-white font-medium capitalize">
                        {permission.type}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {permission.description}
                      </div>
                    </div>
                    <div className="text-red-400 text-sm">Required</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optional Permissions */}
        {optionalPermissions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium">Optional Permissions</h3>
            <div className="space-y-2">
              {optionalPermissions.map((permission) => (
                <div
                  key={permission.type}
                  className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
                >
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={grantedPermissions.has(permission.type)}
                      onChange={(e) => handlePermissionToggle(permission.type, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="text-white font-medium capitalize">
                        {permission.type}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {permission.description}
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button
            onClick={handleGrant}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Grant Permissions
          </button>

          <button
            onClick={onDeny}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Deny All
          </button>

          <button
            onClick={onClose}
            className="w-full bg-transparent text-gray-400 py-2 px-4 rounded-lg font-medium hover:text-white transition-colors"
          >
            Ask Later
          </button>
        </div>

        <div className="text-center text-xs text-gray-500 mt-4">
          You can change these permissions later in Settings
        </div>
      </div>
    </AppContainer>
  );
};
