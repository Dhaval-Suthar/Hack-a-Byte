"use client";

import React, { useState } from "react";

interface App {
  id: string;
  name: string;
  icon: string;
  color: string;
  isLocked?: boolean;
}

interface User {
  _id: string;
  username: string;
  sessionId?: string;
  progress: {
    unlockedApplications: string[];
    skills: Record<string, unknown>;
  };
  gameState: Record<string, unknown>;
}

interface HackPhoneHomeScreenProps {
  onAppOpen: (appId: string) => void;
  user: User | null;
  time: Date;
}

const HackPhoneHomeScreen: React.FC<HackPhoneHomeScreenProps> = ({
  onAppOpen,
  time,
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  const apps: App[] = [
    { id: "clock", name: "Clock", icon: "🕐", color: "bg-black" },
    { id: "terminal", name: "Terminal", icon: "⌨️", color: "bg-black" },
    { id: "files", name: "Files", icon: "📁", color: "bg-blue-500" },
    { id: "network", name: "Network", icon: "🌐", color: "bg-green-500" },
    { id: "crypto", name: "Crypto", icon: "🔐", color: "bg-purple-500" },
    { id: "calendar", name: "Calendar", icon: "📅", color: "bg-red-400" },
    { id: "scanner", name: "Scanner", icon: "📡", color: "bg-red-500" },
    { id: "code", name: "Code", icon: "💻", color: "bg-orange-500" },
    { id: "logs", name: "Logs", icon: "📊", color: "bg-yellow-500" },
    { id: "settings", name: "Settings", icon: "⚙️", color: "bg-gray-500" },
    { id: "games", name: "Games", icon: "🎮", color: "bg-indigo-500" },
    { id: "mail", name: "Mail", icon: "📧", color: "bg-blue-600" },
    { id: "notes", name: "Notes", icon: "📝", color: "bg-yellow-400" },
    { id: "calculator", name: "Calculator", icon: "🧮", color: "bg-gray-700" },
    { id: "camera", name: "Camera", icon: "📷", color: "bg-gray-600" },
    { id: "photos", name: "Photos", icon: "🖼️", color: "bg-pink-500" },
    { id: "maps", name: "Maps", icon: "🗺️", color: "bg-green-600" },
    { id: "stocks", name: "Stocks", icon: "📈", color: "bg-emerald-600" },
    { id: "weather", name: "Weather", icon: "☀️", color: "bg-blue-400" },
    { id: "music", name: "Music", icon: "🎵", color: "bg-pink-500" },
    { id: "snakee", name: "Snakee", icon: "🐍", color: "bg-green-500" },
    { id: "safari", name: "Safari", icon: "🧭", color: "bg-blue-500" },
  ];

  const appsPerPage = 20; // 4x5 grid
  const totalPages = Math.ceil(apps.length / appsPerPage);
  const currentApps = apps.slice(currentPage * appsPerPage, (currentPage + 1) * appsPerPage);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleAppClick = (app: App) => {
    if (app.isLocked) {
      // Show locked app notification
      return;
    }
    onAppOpen(app.id);
  };

  return (
    <div className="w-screen h-screen flex flex-col relative overflow-hidden font-[Helvetica,Arial,ui-sans-serif]">
      {/* iPhone 4 inspired wallpaper */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a2342] via-[#0f2e5e] to-[#091a2e]" />
      <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:"radial-gradient(circle at 20% 10%, rgba(255,255,255,0.25) 0, rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0, rgba(255,255,255,0) 35%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.12) 0, rgba(255,255,255,0) 45%)"}} />

      {/* Status bar */}
      <div className="flex justify-between items-center px-4 pt-8 pb-3 text-white text-[11px] tracking-wide relative z-10">
        <div className="flex items-center space-x-2">
          {/* Signal bars */}
          <div className="flex items-end space-x-[2px]">
            <div className="w-[3px] h-[6px] bg-white rounded-[1px]" />
            <div className="w-[3px] h-[8px] bg-white rounded-[1px]" />
            <div className="w-[3px] h-[10px] bg-white rounded-[1px]" />
            <div className="w-[3px] h-[8px] bg-white/60 rounded-[1px]" />
            <div className="w-[3px] h-[6px] bg-white/40 rounded-[1px]" />
          </div>
          <span className="opacity-90">AT&T</span>
          <span className="opacity-90">3G</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="opacity-90">{formatTime(time)}</span>
          {/* Battery */}
          <div className="w-7 h-[14px] border border-white/70 rounded-[2px] relative">
            <div className="absolute inset-[2px] w-[16px] bg-green-500 rounded-[1px]" />
            <div className="w-[3px] h-[6px] bg-white/70 rounded-sm absolute -right-[5px] top-[4px]" />
          </div>
        </div>
      </div>

      {/* Time and date */}
      <div className="text-center text-white mb-8 relative z-10">
        <div className="text-5xl font-thin mb-1">{formatTime(time)}</div>
        <div className="text-base text-white/80">{formatDate(time)}</div>
      </div>

      {/* App grid */}
      <div className="flex-1 px-6 py-4 relative z-10">
        <div className="grid grid-cols-4 gap-6 h-full content-start">
          {currentApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app)}
              className="flex flex-col items-center group"
            >
              {/* App icon */}
              <div className={`w-[60px] h-[60px] ${app.color} rounded-[14px] flex items-center justify-center mb-2 shadow-[0_6px_14px_rgba(0,0,0,0.4)] group-active:scale-95 transition-transform duration-100 relative overflow-hidden`}>
                {/* App icon gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
                
                <span className="text-2xl relative z-10">{app.icon}</span>
                
                {app.isLocked && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-black/50 rounded-full flex items-center justify-center">
                    <span className="text-xs">🔒</span>
                  </div>
                )}

                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </div>
              
              {/* App name */}
              <span className="text-white text-[11px] font-medium text-center leading-tight max-w-full truncate drop-shadow">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Page indicator dots */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 pb-4 relative z-10">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentPage ? "bg-white" : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}

      {/* Dock */}
      <div className="px-6 pt-2 pb-4 relative z-10">
        {/* Glossy dock */}
        <div className="mx-auto max-w-[360px] h-[70px] rounded-[18px] bg-white/10 backdrop-blur-md border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/40" />
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black/40" />
          <div className="flex justify-center items-center h-full space-x-8 relative z-10">
          {/* Dock apps */}
          <button onClick={() => onAppOpen("phone")} className="w-[56px] h-[56px] bg-green-500 rounded-[14px] flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.4)] active:scale-95 transition-transform duration-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <span className="text-2xl relative z-10">📞</span>
          </button>
          
          <button onClick={() => onAppOpen("messages")} className="w-[56px] h-[56px] bg-blue-500 rounded-[14px] flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.4)] active:scale-95 transition-transform duration-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <span className="text-2xl relative z-10">💬</span>
          </button>
          
          <button onClick={() => onAppOpen("safari")} className="w-[56px] h-[56px] bg-blue-500 rounded-[14px] flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.4)] active:scale-95 transition-transform duration-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <span className="text-2xl relative z-10">🧭</span>
          </button>
          
          <button onClick={() => onAppOpen("ipod")} className="w-[56px] h-[56px] bg-gradient-to-b from-gray-300 to-gray-600 rounded-[14px] flex items-center justify-center shadow-[0_6px_14px_rgba(0,0,0,0.4)] active:scale-95 transition-transform duration-100 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
            <span className="text-2xl relative z-10">🎵</span>
          </button>
          </div>
        </div>
      </div>

      {/* Home indicator */}
      <div className="flex justify-center pb-2 relative z-10">
        <div className="w-32 h-1 bg-white/30 rounded-full" />
      </div>
    </div>
  );
};

export default HackPhoneHomeScreen;
