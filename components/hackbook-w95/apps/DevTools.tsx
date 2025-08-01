"use client";

import React from "react";
import { useDevToolsContext } from "../hooks/useDevToolsContext";

interface DevToolsProps {
  onClose: () => void;
}

const DevTools: React.FC<DevToolsProps> = ({ onClose }) => {
  const { setDevToolsVisible } = useDevToolsContext();

  // Main 6 games with correct handling
  const games = [
    { name: "Secure Vault", fileName: "Secure Vault", description: "Biometric access control" },
    { name: "Network Probe", fileName: "Network Neighborhood", description: "IP address discovery tool" },
    { name: "Firewall Bypass", fileName: "Firewall Bypass", description: "Sequence bypass game" },
    { name: "Password Cracker", fileName: "Password Cracker", description: "Brute force attack simulation" },
    { name: "Emergency Protocol", fileName: "Emergency Protocol", description: "Remote wipe prevention - FINAL MISSION" },
    { name: "Neural Untangler", fileName: "Neural Network Analyzer", description: "AI network debugging" }
  ];

  // Launch game function
  const launchGame = (gameName: string, fileName: string) => {
    try {
      // Special handling for Emergency Protocol
      if (fileName === "Emergency Protocol") {
        const emergencyApp = {
          name: "Emergency Protocol",
          icon: "/hackbook-W95/app-icon/settings.png",
          fullscreen: true,
          metadata: {
            type: "quick-event"
          }
        };
        
        window.dispatchEvent(new CustomEvent('devLaunchApp', { 
          detail: { app: emergencyApp } 
        }));
        return;
      }
      
      // Special handling for games that need to be created dynamically
      if (fileName === "Firewall Bypass") {
        const firewallApp = {
          name: "Firewall Bypass",
          icon: "/hackbook-W95/app-icon/key.png",
          fullscreen: true,
          metadata: {}
        };
        
        window.dispatchEvent(new CustomEvent('devLaunchApp', { 
          detail: { app: firewallApp } 
        }));
        return;
      }
      
      if (fileName === "Password Cracker") {
        const passwordApp = {
          name: "Password Cracker",
          icon: "/hackbook-W95/app-icon/lock.svg",
          fullscreen: true,
          metadata: {}
        };
        
        window.dispatchEvent(new CustomEvent('devLaunchApp', { 
          detail: { app: passwordApp } 
        }));
        return;
      }
      
      // For apps that exist in the main APPS array, add fullscreen metadata
      window.dispatchEvent(new CustomEvent('devLaunchApp', { 
        detail: { 
          appName: fileName,
          forceFullscreen: true
        }
      }));
      
    } catch (error) {
      console.error(`Error launching game ${gameName}:`, error);
    }
  };

  // Close function
  const handleClose = () => {
    setDevToolsVisible(false);
    onClose();
  };

  return (
    <div className="w-full h-full bg-[#c0c0c0] flex flex-col">
      {/* Header */}
      <div className="bg-[#000080] text-white p-2 flex justify-between items-center">
        <span className="font-bold">Game Launcher</span>
        <button 
          onClick={handleClose}
          className="bg-[#c0c0c0] text-black px-2 py-1 text-sm border-2 border-outset hover:border-inset"
        >
          ×
        </button>
      </div>

      {/* Games Grid */}
      <div className="flex-1 p-4 bg-[#dcdcdc]">
        <h3 className="font-bold mb-4 text-lg">🎮 Available Games</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map(game => (
            <button
              key={game.fileName}
              className="p-4 text-left border-2 border-outset bg-white hover:border-inset hover:bg-gray-100 transition-colors"
              onClick={() => launchGame(game.name, game.fileName)}
              title={game.description}
            >
              <div className="font-bold text-blue-700 mb-1">{game.name}</div>
              <div className="text-sm text-gray-600">{game.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-[#808080] p-2 bg-[#c0c0c0] text-xs text-center text-gray-600">
        Click any game above to launch it directly
      </div>
    </div>
  );
};

export default DevTools;
