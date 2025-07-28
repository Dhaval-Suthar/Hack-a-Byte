"use client";

import React, { useState, useEffect } from "react";
import IPFinder from "./IPFinder";

interface NetworkNeighborhoodProps {
  onClose: () => void;
}

const NetworkNeighborhood: React.FC<NetworkNeighborhoodProps> = ({ onClose }) => {
  const [showIPFinder, setShowIPFinder] = useState(false);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [targetIP, setTargetIP] = useState("");
  const [showBriefing, setShowBriefing] = useState(true);

  // Check if this is the first time opening the app in this session
  useEffect(() => {
    const sessionKey = 'networkNeighborhoodOpened';
    const wasOpened = sessionStorage.getItem(sessionKey);
    
    if (!wasOpened) {
      // First time opening in this session - show briefing
      setShowBriefing(true);
      setMissionCompleted(false);
      sessionStorage.setItem(sessionKey, 'true');
    } else {
      // Check actual mission status for subsequent opens
      const checkMissionStatus = async () => {
        try {
          const { MissionTracker } = await import('../hooks/useMissionTracker');
          const completed = MissionTracker.isMissionCompleted('mission2');
          setMissionCompleted(completed);
          if (completed) {
            setShowBriefing(false);
          }
        } catch (error) {
          console.error('Error checking mission status:', error);
        }
      };
      
      checkMissionStatus();
    }
  }, []);

  const handleStartMission = () => {
    setShowBriefing(false);
    setShowIPFinder(true);
  };

  const handleIPFinderSuccess = async (foundIP: string) => {
    setTargetIP(foundIP);
    setShowIPFinder(false);
    setMissionCompleted(true);

    // Mark mission as completed
    try {
      const { MissionTracker } = await import('../hooks/useMissionTracker');
      MissionTracker.completeMission('mission2');
    } catch (error) {
      console.error('Error completing mission:', error);
    }
  };

  if (showIPFinder) {
    return (
      <IPFinder
        onSuccess={handleIPFinderSuccess}
        onClose={() => setShowIPFinder(false)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-[#c0c0c0] flex flex-col">
      {/* Title bar */}
      <div className="bg-[#000080] text-white p-2 flex justify-between items-center">
        <h1 className="font-bold">Network Neighborhood</h1>
        <button
          className="bg-red-600 hover:bg-red-700 px-2 py-1 text-xs"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {showBriefing && !missionCompleted ? (
          // Mission briefing
          <div className="bg-white border-2 border-inset p-4 h-full">
            <div className="bg-red-600 text-white p-2 mb-4 text-center">
              <h2 className="font-bold">URGENT: Security Breach Detected</h2>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3">
                <h3 className="font-bold mb-2">Mission Brief: Locate Rival Hacker</h3>
                <p>
                  Our anonymous employer has made contact through the instant messenger.
                  A rival hacker known as &quot;ShadowByte&quot; has stolen sensitive data from our network.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">Objective:</h4>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Analyze network activity logs for suspicious behavior</li>
                  <li>Identify ShadowByte&apos;s IP address from fragmented clues</li>
                  <li>Locate their virtual machine on the network map</li>
                  <li>Establish connection to confirm target</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">Intelligence Report:</h4>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Recent suspicious outbound connections detected</li>
                  <li>Unusual port activity on network segments</li>
                  <li>Encrypted communications to external hosts</li>
                  <li>Data exfiltration attempts recorded</li>
                </ul>
              </div>

              <div className="bg-red-100 border-l-4 border-red-500 p-3">
                <h4 className="font-bold mb-2">Warning:</h4>
                <p>
                  ShadowByte is cunning and uses multiple decoy connections.
                  Analyze logs carefully - wrong attempts may trigger their security systems.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 font-bold border-2 border-outset"
                onClick={handleStartMission}
              >
                Begin Network Reconnaissance
              </button>
            </div>
          </div>
        ) : missionCompleted ? (
          // Mission completed
          <div className="bg-white border-2 border-inset p-4 h-full">
            <div className="bg-green-600 text-white p-2 mb-4 text-center">
              <h2 className="font-bold">Mission Complete: Target Located</h2>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="bg-green-100 border-l-4 border-green-500 p-3">
                <h3 className="font-bold mb-2">Target Acquired</h3>
                <p>
                  ShadowByte&apos;s virtual lair has been successfully located at IP address:
                  <span className="font-mono font-bold text-green-700"> {targetIP}</span>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">Mission Results:</h4>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Network reconnaissance completed successfully</li>
                  <li>Suspicious activity patterns identified</li>
                  <li>Target machine located and verified</li>
                  <li>Connection established to hostile system</li>
                </ul>
              </div>

              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3">
                <h4 className="font-bold mb-2">Next Phase:</h4>
                <p>
                  Now that we&apos;ve located ShadowByte&apos;s machine, the real challenge begins.
                  Our employer warns of sophisticated firewall defenses protecting the target.
                  Prepare for the next mission: bypassing their security systems.
                </p>
              </div>

              <div className="text-center text-lg font-mono text-green-600">
                MISSION 2: COMPLETE
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-bold border-2 border-outset mr-4"
                onClick={() => setShowIPFinder(true)}
              >
                Replay Mission
              </button>
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 font-bold border-2 border-outset"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          // Default network view (if somehow we get here)
          <div className="bg-white border-2 border-inset p-4 h-full">
            <div className="text-center">
              <h2 className="text-lg font-bold mb-4">Network Neighborhood</h2>
              <p className="mb-4">Network resources and connections</p>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-bold border-2 border-outset"
                onClick={() => setShowIPFinder(true)}
              >
                Start Network Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkNeighborhood;
