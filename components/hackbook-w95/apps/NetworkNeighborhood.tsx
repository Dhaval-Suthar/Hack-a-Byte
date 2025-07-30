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

  // Auto-start the game when the app opens
  useEffect(() => {
    // Start the game immediately after a brief delay
    const timer = setTimeout(() => {
      setShowBriefing(false);
      setShowIPFinder(true);
    }, 500);
    
    return () => clearTimeout(timer);
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

    // Remove the Network Neighborhood app from desktop after completion
    setTimeout(() => {
      // Dispatch event to remove network tool from desktop
      window.dispatchEvent(new CustomEvent('networkToolRemoved'));
      onClose();
    }, 2000); // 2 second delay to show completion briefly
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
                  <li>Click on log entries with red borders (these are clues!)</li>
                  <li>Selected clues will highlight devices on the network map</li>
                  <li>Click the correct target device to establish connection</li>
                  <li><strong>⚠️ WARNING: Only 3 attempts allowed!</strong></li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold">How to Play:</h4>
                <ol className="list-decimal ml-6 space-y-1 text-sm">
                  <li>Look for log entries with <span className="text-red-600">red borders</span> - these contain clues</li>
                  <li>Click suspicious entries to highlight potential target devices</li>
                  <li>Cross-reference log IPs with devices on the network map</li>
                  <li>When confident, click the target device to attempt connection</li>
                  <li>Success locates the target, failure uses up an attempt</li>
                </ol>
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
              <div className="mb-4 p-4 bg-green-100 border-2 border-green-400 rounded">
                <p className="text-sm text-green-800">
                  🎉 Excellent work, agent! Target successfully infiltrated.
                  <br />
                  Your skills are becoming legendary in the underground.
                  <br />
                  <span className="font-bold">Mission complete - removing traces...</span>
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Self-destructing in 2 seconds...</p>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
              </div>
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
