"use client";

import React, { useEffect } from "react";

interface Props {
  onClose: () => void;
  time: Date;
}

const YouTubeExternal: React.FC<Props> = ({ onClose }) => {
  useEffect(() => {
    // Navigate immediately in the same tab to avoid iframe/XFO issues & popup blockers
    window.location.href = "https://m.youtube.com/";
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <img src="/hackphone/apps/youtube/app_icon.png" alt="YouTube" className="h-10 w-10 mx-auto mb-3" />
        <div className="text-sm text-gray-700">Opening YouTube…</div>
        <a href="https://m.youtube.com/" className="text-blue-600 text-sm mt-2 inline-block">Open manually</a>
      </div>
    </div>
  );
};

export default YouTubeExternal;
