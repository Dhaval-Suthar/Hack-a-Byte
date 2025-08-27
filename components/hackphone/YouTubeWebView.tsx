"use client";

import React, { useEffect, useRef, useState } from "react";

interface YouTubeWebViewProps {
  onClose: () => void;
  time: Date;
}

const YouTubeWebView: React.FC<YouTubeWebViewProps> = ({ onClose, time }) => {
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // If the page refuses to load in an iframe (X-Frame-Options), show a fallback
    timerRef.current = window.setTimeout(() => {
      if (!loaded) {
        setBlocked(true);
      }
    }, 1500);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [loaded]);

  useEffect(() => {
    if (blocked && !autoOpened) {
      // Navigate in the same tab to avoid popup blockers
      setAutoOpened(true);
      window.location.href = "https://m.youtube.com/";
    }
  }, [blocked, autoOpened]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="w-screen h-screen bg-black flex flex-col">
      {/* Status bar */}
      <div className="flex justify-between items-center px-4 pt-4 pb-1 text-white text-xs relative z-10">
        <button onClick={onClose} className="text-blue-400 text-sm">← Back</button>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium">{formatTime(time)}</span>
          <div className="w-6 h-3 border border-white/60 rounded-sm relative">
            <div className="w-3 h-1.5 bg-green-500 rounded-sm m-0.5" />
            <div className="w-0.5 h-1 bg-white/60 rounded-full absolute -right-0.5 top-0.5" />
          </div>
        </div>
      </div>

      {/* Minimal header */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/hackphone/apps/youtube/app_icon.png" alt="YouTube" className="h-6 w-6 mr-2" />
          <span className="font-medium text-gray-900">YouTube</span>
        </div>
        <div className="text-xs text-gray-500">m.youtube.com</div>
      </div>

      {/* WebView area */}
      <div className="flex-1 relative bg-white">
        {!blocked && (
          <iframe
            src="https://m.youtube.com/"
            className="absolute inset-0 w-full h-full"
            title="YouTube Mobile"
            referrerPolicy="no-referrer-when-downgrade"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
        )}
        {/* Fallback if embedding is blocked */}
  {blocked && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center bg-white">
            <div>
              <div className="text-base font-semibold text-gray-900 mb-2">YouTube can’t be embedded here</div>
              <div className="text-sm text-gray-600 mb-4">
    For security, YouTube blocks loading the full site inside apps. We’ve opened it in a new tab for you.
              </div>
              <div className="flex items-center justify-center gap-3">
                <a
                  href="https://m.youtube.com/"
                  target="_blank"
      rel="noopener noreferrer"
                  className="px-4 py-2 bg-black text-white rounded-full text-sm"
                >
                  Open YouTube
                </a>
                <button onClick={() => window.location.href = "https://m.youtube.com/"} className="px-4 py-2 border border-gray-300 rounded-full text-sm">
                  Open in this tab
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeWebView;
