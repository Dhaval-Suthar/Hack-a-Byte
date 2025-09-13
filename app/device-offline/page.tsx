'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DeviceOfflineContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deviceId = searchParams?.get('deviceId');

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
    <div className="w-screen h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black flex items-center justify-center">
      <div className="text-center text-white p-8 max-w-md">
        {/* Large offline icon */}
        <div className="text-gray-500 text-8xl mb-6">
          📱💀
        </div>
        
        {/* Main message */}
        <h1 className="text-3xl font-bold mb-4 text-gray-400">
          DEVICE OFFLINE
        </h1>
        
        <div className="bg-gray-800/50 border border-gray-600/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">Connection Lost</h2>
          
          <div className="text-left space-y-2">
            <p>📵 Device is not connected to the network</p>
            <p>🔌 Check your internet connection</p>
            <p>🔄 Device may be restarting</p>
            <p>⚠️ Game session may have ended</p>
          </div>
          
          {deviceId && (
            <div className="mt-4 p-3 bg-black/30 rounded border">
              <p className="text-sm text-gray-300">Device: {deviceId}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🔄 Retry Connection
          </button>
          
          <button
            onClick={handlePlayAgain}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🎮 Play Again with New Device
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            🏠 Return to Home
          </button>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-sm text-gray-400">
          <p>💡 Try refreshing the page</p>
          <p>🌐 Check your internet connection</p>
        </div>
      </div>
    </div>
  );
};

const DeviceOfflinePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DeviceOfflineContent />
    </Suspense>
  );
};

export default DeviceOfflinePage;
