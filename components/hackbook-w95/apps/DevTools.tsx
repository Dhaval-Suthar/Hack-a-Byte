"use client";

import React, { useState, useEffect } from "react";
import { useDevToolsContext } from "../hooks/useDevToolsContext";

interface DevToolsProps {
  onClose: () => void;
}

const DevTools: React.FC<DevToolsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("missions");
  const { devToolsVisible, setDevToolsVisible } = useDevToolsContext();

  // Function to trigger mission events
  const triggerMissionEvent = (eventName: string, detail?: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  };

  // Function to complete missions directly
  const completeMission = async (missionId: string) => {
    try {
      const { MissionTracker } = await import('../hooks/useMissionTracker');
      MissionTracker.completeMission(missionId);
      console.log(`Mission ${missionId} completed`);
    } catch (error) {
      console.error('Error completing mission:', error);
    }
  };

  // Function to reset missions
  const resetMissions = async () => {
    try {
      const { userStorage } = await import('../hooks/useUserStorage');
      userStorage.removeItem('win95Missions');
      window.location.reload(); // Reload to reset state
    } catch (error) {
      console.error('Error resetting missions:', error);
    }
  };

  // Close function that also resets visibility
  const handleClose = () => {
    setDevToolsVisible(false);
    onClose();
  };

  // If not visible, don't render anything
  if (!devToolsVisible) return null;

  return (
    <div className="w-full h-full bg-[#c0c0c0] flex flex-col">
      {/* Header */}
      <div className="bg-[#000080] text-white p-2 flex justify-between items-center">
        <span className="font-bold">Development Tools</span>
        <button 
          onClick={handleClose}
          className="bg-[#c0c0c0] text-black px-2 py-1 text-sm border-2 border-outset hover:border-inset"
        >
          ×
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b-2 border-[#808080]">
        <button
          className={`px-4 py-2 border-2 ${
            activeTab === "missions" 
              ? "border-inset bg-[#dcdcdc]" 
              : "border-outset bg-[#c0c0c0] hover:bg-[#dcdcdc]"
          }`}
          onClick={() => setActiveTab("missions")}
        >
          Missions
        </button>
        <button
          className={`px-4 py-2 border-2 ${
            activeTab === "events" 
              ? "border-inset bg-[#dcdcdc]" 
              : "border-outset bg-[#c0c0c0] hover:bg-[#dcdcdc]"
          }`}
          onClick={() => setActiveTab("events")}
        >
          Events
        </button>
        <button
          className={`px-4 py-2 border-2 ${
            activeTab === "apps" 
              ? "border-inset bg-[#dcdcdc]" 
              : "border-outset bg-[#c0c0c0] hover:bg-[#dcdcdc]"
          }`}
          onClick={() => setActiveTab("apps")}
        >
          Apps
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-auto">
        {activeTab === "missions" && (
          <div>
            <h3 className="font-bold mb-4 text-lg">Mission Control</h3>
            
            <div className="mb-6">
              <h4 className="font-bold mb-2">Complete Missions:</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm"
                  onClick={() => completeMission('mission1')}
                >
                  Complete Mission 1
                </button>
                <button
                  className="p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm"
                  onClick={() => completeMission('mission2')}
                >
                  Complete Mission 2
                </button>
                <button
                  className="p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm"
                  onClick={() => completeMission('biometric_bypass')}
                >
                  Complete Biometric Bypass
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-bold mb-2">Reset:</h4>
              <button
                className="p-2 border-2 border-outset bg-red-200 hover:border-inset text-sm"
                onClick={resetMissions}
              >
                Reset All Missions (Reload Required)
              </button>
            </div>
          </div>
        )}

        {activeTab === "events" && (
          <div>
            <h3 className="font-bold mb-4 text-lg">Event Triggers</h3>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                className="p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm text-left"
                onClick={() => triggerMissionEvent('networkToolInstalled')}
              >
                🔧 Trigger Network Tool Installation
              </button>
              <button
                className="p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm text-left"
                onClick={() => triggerMissionEvent('missionComplete', { missionId: 'mission2' })}
              >
                🎯 Trigger Mission 2 Complete
              </button>
              <button
                className="p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm text-left"
                onClick={() => triggerMissionEvent('missionComplete', { missionId: 'biometric_bypass' })}
              >
                🔐 Trigger Biometric Bypass Complete
              </button>
            </div>
          </div>
        )}

        {activeTab === "apps" && (
          <div>
            <h3 className="font-bold mb-4 text-lg">Launch Apps Directly</h3>
            
            <p className="text-sm mb-4 text-gray-600">
              Note: These will create app instances. Use the desktop icons for the intended experience.
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                className="p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm text-left"
                onClick={() => {
                  // Dispatch a custom event to open the fingerprint hack directly
                  window.dispatchEvent(new CustomEvent('devLaunchApp', { 
                    detail: { appName: 'Secure Vault' } 
                  }));
                }}
              >
                🔐 Launch Fingerprint Hack (Secure Vault)
              </button>
              <button
                className="p-2 border-2 border-outset bg-[#c0c0c0] hover:border-inset text-sm text-left"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('devLaunchApp', { 
                    detail: { appName: 'Firewall Bypass' } 
                  }));
                }}
              >
                🔥 Launch Number Jumping Game
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-[#808080] p-2 bg-[#c0c0c0] text-xs text-gray-600">
        Development Tools - For testing and debugging purposes only
        <div className="mt-1">
          <small>Activated by typing &ldquo;zebra&rdquo; - Close to hide</small>
        </div>
      </div>
    </div>
  );
};

export default DevTools;
