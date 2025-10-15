"use client";

import { useEffect } from "react";

export default function App() {
  // Redirects to the new app
  useEffect(() => {
    // Get the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const time = urlParams.get('time') || new Date().toLocaleTimeString();
    
    // Redirect to the new app
    window.location.href = `/hackphone/apps/sentinel-new?time=${time}`;
  }, []);
  
  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <div className="text-green-500 font-mono animate-pulse">
        REDIRECTING...
      </div>
    </div>
  );
}