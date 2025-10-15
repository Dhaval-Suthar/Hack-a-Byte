"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logger } from '@/lib/logger';

export default function GameOverPage() {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  // Clear all storage and cookies on component mount
  useEffect(() => {
    const clearAllData = () => {
      try {
        // Clear localStorage
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.clear();
        }

        // Clear sessionStorage
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.clear();
        }

        // Clear all cookies
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(";");
          for (const cookie of cookies) {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            // Clear cookie by setting expiration to past date
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
          }
        }

      } catch (error) {
        logger.error('Error clearing user data:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    };

    clearAllData();
  }, []);

  const handlePlayAgain = async () => {
    setIsClearing(true);

    // Extra cleanup before redirect
    try {
      // Clear any remaining localStorage items
      if (typeof window !== 'undefined') {
        // Device and user session data
        localStorage.removeItem('device_mac_address');
        localStorage.removeItem('hackphone_password');
        localStorage.removeItem('device_user');
        localStorage.removeItem('selectedRole');
        localStorage.removeItem('sentinelLastScanTime');
        localStorage.removeItem('userRole');
        localStorage.removeItem('teamId');
        localStorage.removeItem('playspaceId');
        
        // Admin credentials and session data
        localStorage.removeItem('admin-authenticated');
        localStorage.removeItem('admin-auth-key');
        localStorage.removeItem('admin-session-timestamp');
        localStorage.removeItem('hackabyte-admin-credentials');
        
        // App-specific data
        localStorage.removeItem('hackphone_photos');
        localStorage.removeItem('hackphone_deleted_demo_ids');
        localStorage.removeItem('completedTutorials');
        
        // Clear any cryptolocker state data (pattern-based cleanup)
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('cryptolocker-')) {
            localStorage.removeItem(key);
          }
        });
      }

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect to event page
      router.push('/event');
    } catch (error) {
      logger.error('Error during cleanup:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      // Still redirect even if cleanup fails
      router.push('/event');
    }
  };

  const handleReturnHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900/20 to-orange-900/30 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-400 rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8 max-w-2xl mx-auto">
        {/* Game Over Title */}
        <div className="space-y-4">
          <div className="text-8xl md:text-9xl animate-pulse">🏁</div>
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 tracking-wider animate-pulse">
            GAME OVER
          </h1>
          <div className="h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
        </div>

        {/* Game completion message */}
        <div className="space-y-4 text-gray-300">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            Mission Complete!
          </h2>
          <p className="text-base md:text-lg leading-relaxed">
            The cyber warfare simulation has concluded. All devices have been secured 
            and the network has been restored to normal operations.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <span className="animate-pulse">🔒</span>
            <span>All data has been cleared for security</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-4">
          <button
            onClick={handlePlayAgain}
            disabled={isClearing}
            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform ${
              isClearing
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white shadow-xl shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105'
            }`}
          >
            {isClearing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Clearing Data...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>🚀</span>
                <span>PLAY AGAIN</span>
              </div>
            )}
          </button>

          <button
            onClick={handleReturnHome}
            className="w-full md:w-auto px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Return to Home
          </button>
        </div>

        {/* Additional info */}
        <div className="text-xs text-gray-500 space-y-2 border-t border-gray-700 pt-6">
          <p>🛡️ Your session data has been automatically cleared</p>
          <p>📊 Game statistics have been saved for analysis</p>
          <p>🔄 Ready for a new simulation when you are</p>
        </div>
      </div>

      {/* Floating elements for visual appeal */}
      <div className="absolute top-10 left-10 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '0s' }}>💻</div>
      <div className="absolute top-32 right-16 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '1s' }}>🔐</div>
      <div className="absolute bottom-20 left-20 text-3xl opacity-20 animate-bounce" style={{ animationDelay: '2s' }}>⚡</div>
      <div className="absolute bottom-32 right-10 text-4xl opacity-20 animate-bounce" style={{ animationDelay: '3s' }}>🎯</div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
