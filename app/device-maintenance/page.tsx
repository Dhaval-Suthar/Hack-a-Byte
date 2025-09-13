'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DeviceMaintenanceContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceId = searchParams?.get('deviceId');
  const reason = searchParams?.get('reason');

  const handlePlayAgain = () => {
    // Clear device data and redirect to device selection
    try {
      localStorage.removeItem('device_mac_address');
      localStorage.removeItem('hackphone_password');
      localStorage.removeItem('device_user');
    } catch (error) {
      console.warn('Failed to clear device data from localStorage:', error);
    }
    router.push('/device-selection');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center">
      <div className="text-center text-white p-8 max-w-md">
        {/* Large warning icon */}
        <div className="text-red-500 text-8xl mb-6 animate-pulse">
          🔧
        </div>
        
        {/* Main message */}
        <h1 className="text-3xl font-bold mb-4 text-red-400">
          DEVICE COMPROMISED
        </h1>
        
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Your device is under maintenance</h2>
          
          {reason === 'maintenance' && (
            <div className="text-left space-y-2">
              <p>💥 <strong>SysTrojan Pro</strong> has compromised your device</p>
              <p>🔧 System is being restored automatically</p>
              <p>⏱️ Estimated recovery: 2-3 minutes</p>
              <p>🚫 All functions are temporarily disabled</p>
            </div>
          )}
          
          {deviceId && (
            <div className="mt-4 p-3 bg-black/30 rounded border">
              <p className="text-sm text-gray-300">Device: {deviceId}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={handlePlayAgain}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🎮 Play Again with New Device
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🏠 Return to Home
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Check if Device is Restored
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-sm text-gray-400">
          <p>⚠️ Your device will automatically recover</p>
          <p>💡 Use security settings to prevent future attacks</p>
        </div>
      </div>
    </div>
  );
};

const DeviceMaintenancePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DeviceMaintenanceContent />
    </Suspense>
  );
};

export default DeviceMaintenancePage;
