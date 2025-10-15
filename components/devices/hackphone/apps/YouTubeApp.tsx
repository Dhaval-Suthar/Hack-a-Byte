"use client";

import React from "react";

interface YouTubeAppProps {
  onClose?: () => void;
  time?: Date;
}

const YouTubeApp: React.FC<YouTubeAppProps> = ({ onClose }) => {
  // Redirect to real YouTube immediately when app opens
  React.useEffect(() => {
    const openYouTube = () => {
      try {
        // Check if we're on mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // For mobile, try YouTube app URL scheme first
          const youtubeAppURL = 'youtube://';
          const youtubeWebURL = 'https://m.youtube.com';
          
          // Create a hidden iframe to test YouTube app launch
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = youtubeAppURL;
          document.body.appendChild(iframe);
          
          setTimeout(() => {
            document.body.removeChild(iframe);
            // If still here, open web version
            window.open(youtubeWebURL, '_blank', 'noopener,noreferrer');
          }, 2000);
          
        } else {
          // For desktop, open YouTube in new tab
          window.open('https://www.youtube.com', '_blank', 'noopener,noreferrer');
        }
        
        // Close this app
        if (onClose) {
          setTimeout(onClose, 1000);
        }
      } catch (error) {
        console.error('Failed to open YouTube:', error);
        // Final fallback
        window.open('https://www.youtube.com', '_blank', 'noopener,noreferrer');
        if (onClose) {
          setTimeout(onClose, 1000);
        }
      }
    };

    // Small delay to show the loading screen
    const timer = setTimeout(openYouTube, 800);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Show parental control screen instead of redirecting to YouTube
  return (
    <div className="w-full h-full bg-gradient-to-br from-red-900 via-red-700 to-red-800 flex flex-col items-center justify-center p-8 text-white">
      <div className="text-center max-w-md mx-auto bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-red-500/30">
        <div className="text-6xl mb-6">🔒</div>
        
        <h1 className="text-2xl font-bold mb-4 text-red-200">
          Parental Controls Active
        </h1>
        
        <p className="text-red-100 text-center mb-6 leading-relaxed">
          YouTube access is restricted on this device. Please contact your administrator 
          or parent/guardian to modify content restrictions.
        </p>
        
        <div className="text-sm text-red-200 mb-6">
          <p className="mb-2">🛡️ Content Filter: <strong>Strict</strong></p>
          <p className="mb-2">👤 User Level: <strong>Restricted</strong></p>
          <p>⏰ Time Restrictions: <strong>Active</strong></p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white underline text-sm"
          >
            ← Back to Phone
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeApp;