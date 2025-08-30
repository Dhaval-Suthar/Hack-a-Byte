"use client";

import React from "react";
import { AppContainer, AppHeader } from "../shared/AppContainer";

export const NetworkScannerApp: React.FC = () => {
  const devices = [
    { ip: "192.168.1.1", device: "Router", ports: "22,80,443", status: "Open" },
    { ip: "192.168.1.10", device: "Laptop", ports: "22,3389", status: "Filtered" },
    { ip: "192.168.1.15", device: "Phone", ports: "80", status: "Open" },
    { ip: "192.168.1.20", device: "IoT Device", ports: "80,8080", status: "Open" },
    { ip: "192.168.1.25", device: "Server", ports: "22,80,443,3306", status: "Open" },
  ];

  return (
    <AppContainer backgroundColor="bg-black">
      <AppHeader title="Network Scanner" />
      <div className="flex-1 p-4 font-mono text-green-400 text-sm overflow-y-auto">
        <div className="space-y-2">
          <div className="text-green-300">Scanning network 192.168.1.0/24...</div>
          <div className="border-b border-green-800 pb-2 mb-3"></div>

          {devices.map((device, index) => (
            <div key={index} className="grid grid-cols-4 gap-2 py-1">
              <div className="text-yellow-400">{device.ip}</div>
              <div className="text-blue-400">{device.device}</div>
              <div className="text-purple-400">{device.ports}</div>
              <div className={device.status === "Open" ? "text-green-400" : "text-red-400"}>
                {device.status}
              </div>
            </div>
          ))}

          <div className="mt-4 pt-2 border-t border-green-800">
            <div className="text-green-300">Scan complete. 5 devices found.</div>
            <div className="flex items-center mt-2">
              <span>hackphone:~ $ </span>
              <div className="w-2 h-4 bg-green-400 ml-1 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </AppContainer>
  );
};
