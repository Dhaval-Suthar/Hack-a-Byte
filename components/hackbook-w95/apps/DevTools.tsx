"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDevToolsContext } from "../hooks/useDevToolsContext";

interface DevToolsProps {
  onClose: () => void;
}

interface AppInfo {
  name: string;
  fileName: string;
  category: string;
  description: string;
}

interface SystemInfo {
  userAgent: string;
  platform: string;
  language: string;
  cookieEnabled: boolean;
  onLine: boolean;
  screenResolution: string;
  windowSize: string;
  timestamp: string;
  url: string;
  storageItems: number;
}

const DevTools: React.FC<DevToolsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("missions");
  const [storageFilter, setStorageFilter] = useState("");
  const [customEvent, setCustomEvent] = useState({ name: "", detail: "" });
  const [audioVolume, setAudioVolume] = useState(50);
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({} as SystemInfo);
  const [storageData, setStorageData] = useState<Record<string, unknown>>({});
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [lastEventStatus, setLastEventStatus] = useState<string>("");
  const logRef = useRef<HTMLDivElement>(null);
  const { setDevToolsVisible } = useDevToolsContext();

  // Available apps with metadata
  const availableApps: AppInfo[] = [
    { name: "Secure Vault", fileName: "FingerprintHack", category: "Security", description: "Biometric access control" },
    { name: "Network Probe", fileName: "IPFinder", category: "Network", description: "IP address discovery tool" },
    { name: "Firewall Bypass", fileName: "NumberJumpingGame", category: "Security", description: "Sequence bypass game" },
    { name: "Password Cracker", fileName: "BruteForceGame", category: "Security", description: "Brute force attack simulation" },
    { name: "Emergency Protocol", fileName: "Emergency Protocol", category: "Critical", description: "Remote wipe prevention - FINAL MISSION" },
    { name: "Neural Untangler", fileName: "UntangleNeuralNetwork", category: "AI", description: "AI network debugging" },
    { name: "Notepad", fileName: "Notepad", category: "Utilities", description: "Text editor" },
    { name: "Calculator", fileName: "Calculator", category: "Utilities", description: "Mathematical operations" },
    { name: "Paint", fileName: "Paint", category: "Graphics", description: "Image editing tool" },
    { name: "My Computer", fileName: "MyComputer", category: "System", description: "File system explorer" },
    { name: "Internet Explorer", fileName: "InternetExplorer", category: "Network", description: "Web browser" },
    { name: "CD Player", fileName: "CDPlayer", category: "Media", description: "Audio playback" },
    { name: "Minesweeper", fileName: "Minesweeper", category: "Games", description: "Classic puzzle game" },
    { name: "Solitaire", fileName: "Solitaire", category: "Games", description: "Card game" },
    { name: "Inbox", fileName: "Inbox", category: "Communication", description: "Email client" },
    { name: "WinTalk95", fileName: "WinTalk95", category: "Communication", description: "Chat application" }
  ];

  // Refresh system information and storage data
  const refreshSystemData = () => {
    // Get localStorage data
    const storage: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          storage[key] = JSON.parse(localStorage.getItem(key) || '""');
        } catch {
          storage[key] = localStorage.getItem(key);
        }
      }
    }
    setStorageData(storage);

    // Get system info
    setSystemInfo({
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toLocaleString(),
      url: window.location.href,
      storageItems: Object.keys(storage).length
    });
  };

  // Initialize data on mount
  useEffect(() => {
    refreshSystemData();
  }, []);

  // Function to trigger mission events
  const triggerMissionEvent = (eventName: string, detail?: Record<string, unknown>) => {
    try {
      // Dispatch the event
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
      
      // Log to console
      logToConsole(`Event triggered: ${eventName}`, detail);
      
      // Visual feedback
      console.log(`[DevTools] Event dispatched:`, { eventName, detail, timestamp: new Date().toISOString() });
      
      // Show alert for immediate feedback (temporary)
      setTimeout(() => {
        logToConsole(`Event "${eventName}" has been dispatched to the window object`);
      }, 100);
      
    } catch (error) {
      console.error('Error triggering event:', error);
      logToConsole(`Error triggering event ${eventName}:`, error);
    }
  };

  // Function to complete missions directly
  const completeMission = async (missionId: string) => {
    try {
      const { MissionTracker } = await import('../hooks/useMissionTracker');
      MissionTracker.completeMission(missionId);
      logToConsole(`Mission ${missionId} completed`);
    } catch (error) {
      console.error('Error completing mission:', error);
      logToConsole(`Error completing mission ${missionId}:`, error);
    }
  };

  // Function to reset missions
  const resetMissions = async () => {
    try {
      const { userStorage } = await import('../hooks/useUserStorage');
      userStorage.removeItem('win95Missions');
      logToConsole('All missions reset - page reload required');
      window.location.reload();
    } catch (error) {
      console.error('Error resetting missions:', error);
      logToConsole('Error resetting missions:', error);
    }
  };

  // Launch app function
  const launchApp = (appName: string, fileName: string) => {
    try {
      // Special handling for Emergency Protocol - create the app exactly like desktop.tsx does
      if (fileName === "Emergency Protocol") {
        // Create Emergency Protocol app using the same pattern as desktop.tsx
        const emergencyApp = {
          name: "Emergency Protocol",
          icon: "/hackbook-w95/app-icon/settings.png",
          metadata: {
            type: "quick-event"
          }
        };
        
        const emergencyEvent = new CustomEvent('devLaunchApp', { 
          detail: { 
            app: emergencyApp
          } 
        });
        window.dispatchEvent(emergencyEvent);
        
        logToConsole("🚨 CRITICAL: Emergency Protocol app launched!");
        logToConsole("Opening Quick Event Presser - Final Mission!");
        return;
      }
      
      // For regular apps, use the appName
      const eventDetail = { appName };
      
      window.dispatchEvent(new CustomEvent('devLaunchApp', { 
        detail: eventDetail
      }));
      
      logToConsole(`Launched app: ${appName} (${fileName})`);
      
    } catch (error) {
      logToConsole(`Error launching app ${appName}:`, error);
    }
  };

  // Storage management functions
  const clearStorageItem = (key: string) => {
    localStorage.removeItem(key);
    refreshSystemData();
    logToConsole(`Removed storage item: ${key}`);
  };

  const updateStorageItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      refreshSystemData();
      logToConsole(`Updated storage item: ${key}`);
    } catch (error) {
      logToConsole(`Error updating storage item ${key}:`, error);
    }
  };

  // Custom event dispatcher
  const dispatchCustomEvent = () => {
    if (customEvent.name) {
      try {
        let detail;
        try {
          detail = customEvent.detail ? JSON.parse(customEvent.detail) : {};
        } catch {
          detail = { data: customEvent.detail };
        }
        
        const event = new CustomEvent(customEvent.name, { detail });
        window.dispatchEvent(event);
        logToConsole(`Custom event dispatched: ${customEvent.name}`, detail);
        
        // Clear the form after dispatch
        setCustomEvent({ name: "", detail: "" });
        
        // Show success feedback
        console.log(`[DevTools] Custom event dispatched successfully:`, { 
          name: customEvent.name, 
          detail, 
          timestamp: new Date().toISOString() 
        });
        
      } catch (error) {
        console.error('Error dispatching custom event:', error);
        logToConsole(`Error dispatching custom event:`, error);
      }
    } else {
      logToConsole('Error: Event name is required');
    }
  };

  // Audio testing
  const testAudio = (soundFile: string) => {
    try {
      const audio = new Audio(soundFile);
      audio.volume = audioVolume / 100;
      audio.play().catch(console.log);
      logToConsole(`Playing audio: ${soundFile} at ${audioVolume}% volume`);
    } catch (error) {
      logToConsole(`Error playing audio ${soundFile}:`, error);
    }
  };

  // Console logging with timestamp
  const logToConsole = (message: string, data?: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(`[DevTools ${timestamp}] ${message}`, data || '');
    
    // Add to event log
    setEventLog(prev => [...prev.slice(-19), logEntry]); // Keep last 20 entries
    
    // Update last event status
    setLastEventStatus(logEntry);
    
    // Scroll log to bottom if ref exists
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  };

  // Close function that also resets visibility
  const handleClose = () => {
    setDevToolsVisible(false);
    onClose();
  };

  // Initialize as visible when component mounts
  useEffect(() => {
    setDevToolsVisible(true);
  }, [setDevToolsVisible]);

  return (
    <div className="w-full h-full bg-[#c0c0c0] flex flex-col">
      {/* Header */}
      <div className="bg-[#000080] text-white p-2 flex justify-between items-center">
        <div>
          <span className="font-bold">Advanced Development Tools v2.0</span>
          {lastEventStatus && (
            <div className="text-xs text-yellow-200 mt-1">
              Status: {lastEventStatus.slice(0, 60)}...
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={refreshSystemData}
            className="bg-[#c0c0c0] text-black px-2 py-1 text-xs border border-outset hover:border-inset"
            title="Refresh Data"
          >
            🔄
          </button>
          <button 
            onClick={handleClose}
            className="bg-[#c0c0c0] text-black px-2 py-1 text-sm border-2 border-outset hover:border-inset"
          >
            ×
          </button>
        </div>
      </div>

      {/* Enhanced Tab Bar */}
      <div className="flex border-b-2 border-[#808080] overflow-x-auto">
        {[
          { id: "missions", label: "🎯 Missions", title: "Mission Control" },
          { id: "apps", label: "📱 Apps", title: "Application Launcher" },
          { id: "storage", label: "💾 Storage", title: "Local Storage Inspector" },
          { id: "events", label: "⚡ Events", title: "Custom Event System" },
          { id: "audio", label: "🔊 Audio", title: "Sound Testing" },
          { id: "system", label: "🖥️ System", title: "System Information" }
        ].map(tab => (
          <button
            key={tab.id}
            className={`px-3 py-2 border-2 text-sm whitespace-nowrap ${
              activeTab === tab.id 
                ? "border-inset bg-[#dcdcdc]" 
                : "border-outset bg-[#c0c0c0] hover:bg-[#dcdcdc]"
            }`}
            onClick={() => setActiveTab(tab.id)}
            title={tab.title}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area with Enhanced Tabs */}
      <div className="flex-1 p-4 overflow-auto bg-[#dcdcdc]">
        
        {/* Missions Tab */}
        {activeTab === "missions" && (
          <div>
            <h3 className="font-bold mb-4 text-lg border-b border-gray-400 pb-2">🎯 Mission Control Center</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Mission Actions */}
              <div className="bg-white p-4 border-2 border-inset">
                <h4 className="font-bold mb-3 text-green-700">✅ Complete Missions:</h4>
                <div className="space-y-2">
                  {[
                    { id: 'mission1', name: 'Mission 1: Initial Access' },
                    { id: 'mission2', name: 'Mission 2: System Exploration' },
                    { id: 'biometric_bypass', name: 'Biometric Bypass Challenge' },
                    { id: 'network_infiltration', name: 'Network Infiltration' },
                    { id: 'data_extraction', name: 'Data Extraction Protocol' }
                  ].map(mission => (
                    <button
                      key={mission.id}
                      className="w-full p-2 text-left border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm"
                      onClick={() => completeMission(mission.id)}
                    >
                      {mission.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mission Events */}
              <div className="bg-white p-4 border-2 border-inset">
                <h4 className="font-bold mb-3 text-blue-700">⚡ Trigger Events:</h4>
                <div className="space-y-2">
                  {[
                    { event: 'networkToolInstalled', name: '🔧 Network Tool Installation' },
                    { event: 'securityBypass', name: '🔓 Security Bypass Success' },
                    { event: 'systemAlert', name: '🚨 System Alert Triggered' },
                    { event: 'dataCorruption', name: '💥 Data Corruption Event' },
                    { event: 'emergencyProtocol', name: '🆘 Emergency Protocol Event' },
                    { event: 'remoteWipeDetected', name: '☢️ Remote Wipe Detection' }
                  ].map(item => (
                    <button
                      key={item.event}
                      className="w-full p-2 text-left border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm hover:bg-[#e0e0e0] active:bg-[#a0a0a0] transition-colors"
                      onClick={() => {
                        triggerMissionEvent(item.event);
                        // Visual feedback by temporarily changing button style
                        const button = document.activeElement as HTMLButtonElement;
                        if (button) {
                          button.style.backgroundColor = '#90EE90';
                          setTimeout(() => {
                            button.style.backgroundColor = '';
                          }, 200);
                        }
                      }}
                      title={`Trigger ${item.event} event`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reset Section */}
            <div className="mt-4 bg-red-100 p-4 border-2 border-inset">
              <h4 className="font-bold mb-2 text-red-700">⚠️ Emergency Actions:</h4>
              <div className="space-y-2">
                <button
                  className="w-full p-3 border-2 border-outset bg-orange-200 hover:border-inset font-bold"
                  onClick={() => launchApp("Emergency Protocol", "Emergency Protocol")}
                >
                  🚨 LAUNCH EMERGENCY PROTOCOL (Alternative)
                </button>
                <button
                  className="p-3 border-2 border-outset bg-red-200 hover:border-inset font-bold"
                  onClick={resetMissions}
                >
                  🔥 Reset All Missions (Page Reload Required)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Apps Tab */}
        {activeTab === "apps" && (
          <div>
            <h3 className="font-bold mb-4 text-lg border-b border-gray-400 pb-2">📱 Application Launcher</h3>
            
            <div className="mb-4 p-3 bg-yellow-100 border-2 border-inset text-sm">
              <strong>Note:</strong> These launch apps directly. Use desktop icons for the intended game experience.
            </div>

            {/* Emergency Protocol Quick Launch */}
            <div className="mb-6 p-4 bg-red-100 border-4 border-red-500">
              <h4 className="font-bold mb-3 text-red-700 text-lg">🚨 CRITICAL - Emergency Protocol</h4>
              <p className="text-sm mb-3 text-red-600">
                <strong>Final Mission:</strong> Stop ShadowByte&apos;s remote wipe sequence! This is the ultimate challenge.
              </p>
              <button
                className="w-full p-4 text-center border-4 border-outset bg-red-200 hover:border-inset font-bold text-lg text-red-800 hover:bg-red-300 animate-pulse"
                onClick={() => launchApp("Emergency Protocol", "Emergency Protocol")}
                title="Launch the final mission - Remote Wipe Prevention"
              >
                🚨 LAUNCH EMERGENCY PROTOCOL 🚨
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(
                availableApps
                  .filter(app => app.name !== "Emergency Protocol") // Exclude from regular grid since it's featured above
                  .reduce((acc, app) => {
                    if (!acc[app.category]) acc[app.category] = [];
                    acc[app.category].push(app);
                    return acc;
                  }, {} as Record<string, AppInfo[]>)
              ).map(([category, apps]) => (
                <div key={category} className="bg-white p-3 border-2 border-inset">
                  <h4 className="font-bold mb-2 text-purple-700">{category}</h4>
                  <div className="space-y-1">
                    {apps.map(app => (
                      <button
                        key={app.fileName}
                        className="w-full p-2 text-left border border-outset bg-[#c0c0c0] hover:border-inset text-xs"
                        onClick={() => launchApp(app.name, app.fileName)}
                        title={app.description}
                      >
                        {app.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === "storage" && (
          <div>
            <h3 className="font-bold mb-4 text-lg border-b border-gray-400 pb-2">💾 Local Storage Inspector</h3>
            
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Filter storage keys..."
                value={storageFilter}
                onChange={(e) => setStorageFilter(e.target.value)}
                className="flex-1 p-2 border-2 border-inset bg-white"
              />
              <button
                onClick={refreshSystemData}
                className="px-4 py-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {Object.entries(storageData)
                .filter(([key]) => key.toLowerCase().includes(storageFilter.toLowerCase()))
                .map(([key, value]) => (
                <div key={key} className="bg-white p-3 border-2 border-inset">
                  <div className="flex justify-between items-start mb-2">
                    <strong className="text-blue-700 text-sm break-all">{key}</strong>
                    <button
                      onClick={() => clearStorageItem(key)}
                      className="px-2 py-1 text-xs border border-outset bg-red-200 hover:border-inset"
                      title="Delete this item"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="bg-gray-100 p-2 border border-inset text-xs font-mono break-all">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="New value (JSON or string)"
                      className="flex-1 p-1 text-xs border border-inset"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updateStorageItem(key, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <span className="text-xs text-gray-500 self-center">Press Enter to update</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div>
            <h3 className="font-bold mb-4 text-lg border-b border-gray-400 pb-2">⚡ Custom Event System</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Custom Event Dispatcher */}
              <div className="bg-white p-4 border-2 border-inset">
                <h4 className="font-bold mb-3 text-green-700">🎮 Custom Event Dispatcher</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Event name (e.g., 'gameWin')"
                    value={customEvent.name}
                    onChange={(e) => setCustomEvent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border-2 border-inset bg-white"
                  />
                  <textarea
                    placeholder="Event detail (JSON format, optional)"
                    value={customEvent.detail}
                    onChange={(e) => setCustomEvent(prev => ({ ...prev, detail: e.target.value }))}
                    className="w-full p-2 border-2 border-inset bg-white h-20"
                  />
                  <button
                    onClick={dispatchCustomEvent}
                    className="w-full p-2 border-2 border-outset bg-green-200 hover:border-inset font-bold"
                    disabled={!customEvent.name}
                  >
                    🚀 Dispatch Event
                  </button>
                </div>
              </div>

              {/* Pre-built Events */}
              <div className="bg-white p-4 border-2 border-inset">
                <h4 className="font-bold mb-3 text-blue-700">📋 Pre-built Events</h4>
                <div className="space-y-2">
                  {[
                    { name: 'gameStart', detail: '{}', desc: 'Start game sequence' },
                    { name: 'playerWin', detail: '{"score": 1000}', desc: 'Player victory' },
                    { name: 'systemError', detail: '{"type": "critical"}', desc: 'System error' },
                    { name: 'achievementUnlocked', detail: '{"achievement": "hacker"}', desc: 'Achievement' },
                    { name: 'dataCorrupted', detail: '{"severity": "high"}', desc: 'Data corruption' }
                  ].map(event => (
                    <button
                      key={event.name}
                      className="w-full p-2 text-left border border-outset bg-[#c0c0c0] hover:border-inset text-sm hover:bg-[#e0e0e0] active:bg-[#a0a0a0] transition-colors"
                      onClick={() => {
                        setCustomEvent({ name: event.name, detail: event.detail });
                        triggerMissionEvent(event.name, JSON.parse(event.detail));
                        // Visual feedback
                        const button = document.activeElement as HTMLButtonElement;
                        if (button) {
                          button.style.backgroundColor = '#ADD8E6';
                          setTimeout(() => {
                            button.style.backgroundColor = '';
                          }, 200);
                        }
                      }}
                      title={`${event.desc} - ${event.detail}`}
                    >
                      {event.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Tab */}
        {activeTab === "audio" && (
          <div>
            <h3 className="font-bold mb-4 text-lg border-b border-gray-400 pb-2">🔊 Audio Testing Suite</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Volume Control */}
              <div className="bg-white p-4 border-2 border-inset">
                <h4 className="font-bold mb-3 text-purple-700">🎚️ Volume Control</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold mb-2">Master Volume: {audioVolume}%</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={audioVolume}
                      onChange={(e) => setAudioVolume(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={() => testAudio('/hackbook-w95/sounds/ding.mp3')}
                    className="w-full p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset"
                  >
                    🔔 Test Volume with Ding
                  </button>
                </div>
              </div>

              {/* Sound Library */}
              <div className="bg-white p-4 border-2 border-inset">
                <h4 className="font-bold mb-3 text-orange-700">🎵 Sound Library</h4>
                <div className="space-y-2">
                  {[
                    { file: '/hackbook-w95/sounds/ding.mp3', name: '🔔 Ding (Success)' },
                    { file: '/hackbook-w95/sounds/error.mp3', name: '❌ Error Sound' },
                    { file: '/hackbook-w95/sounds/click.mp3', name: '👆 Click Sound' },
                    { file: '/hackbook-w95/sounds/startup.mp3', name: '🚀 System Startup' },
                    { file: '/sounds/ding.mp3', name: '🔊 Alternative Ding' }
                  ].map(sound => (
                    <button
                      key={sound.file}
                      className="w-full p-2 text-left border border-outset bg-[#c0c0c0] hover:border-inset text-sm"
                      onClick={() => testAudio(sound.file)}
                    >
                      {sound.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === "system" && (
          <div>
            <h3 className="font-bold mb-4 text-lg border-b border-gray-400 pb-2">🖥️ System Information</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* System Info */}
              <div className="bg-white p-4 border-2 border-inset">
                <h4 className="font-bold mb-3 text-indigo-700">💻 System Details</h4>
                <div className="space-y-2 text-sm font-mono">
                  {Object.entries(systemInfo).map(([key, value]) => (
                    <div key={key} className="border-b border-gray-200 pb-1">
                      <strong className="text-blue-600">{key}:</strong>
                      <span className="ml-2 break-all">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debug Console */}
              <div className="bg-white p-4 border-2 border-inset">
                <h4 className="font-bold mb-3 text-red-700">🐛 Debug Console</h4>
                <div 
                  ref={logRef}
                  className="bg-black text-green-400 p-3 h-64 overflow-y-auto text-xs font-mono border border-inset"
                >
                  <div className="text-cyan-400">DevTools Console - Ready</div>
                  <div className="text-cyan-400">Last Event: {lastEventStatus || 'None'}</div>
                  <div className="text-yellow-400">--- Event Log ---</div>
                  {eventLog.map((entry, index) => (
                    <div key={index} className="text-green-400">
                      {entry}
                    </div>
                  ))}
                  {eventLog.length === 0 && (
                    <div className="text-gray-500">No events logged yet. Trigger events to see logs here.</div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setEventLog([]);
                      setLastEventStatus("");
                      console.clear();
                    }}
                    className="px-3 py-1 text-xs border border-outset bg-[#c0c0c0] hover:border-inset"
                  >
                    Clear Console
                  </button>
                  <button
                    onClick={() => logToConsole('Manual log entry', { timestamp: Date.now() })}
                    className="px-3 py-1 text-xs border border-outset bg-[#c0c0c0] hover:border-inset"
                  >
                    Test Log
                  </button>
                  <button
                    onClick={() => triggerMissionEvent('testEvent', { source: 'devtools', test: true })}
                    className="px-3 py-1 text-xs border border-outset bg-blue-200 hover:border-inset"
                  >
                    Test Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Enhanced Footer */}
      <div className="border-t-2 border-[#808080] p-3 bg-[#c0c0c0] text-xs">
        <div className="flex justify-between items-center">
          <div>
            <strong>Advanced DevTools v2.0</strong> - Storage Items: {Object.keys(storageData).length} | 
            Active Tab: {activeTab} | Events Logged: {eventLog.length}
          </div>
          <div className="text-gray-600">
            Type &ldquo;zebra&rdquo; in terminal to show/hide | Use responsibly
          </div>
        </div>
        {lastEventStatus && (
          <div className="mt-1 text-blue-600 text-xs">
            Last: {lastEventStatus}
          </div>
        )}
      </div>
    </div>
  );
};

export default DevTools;
