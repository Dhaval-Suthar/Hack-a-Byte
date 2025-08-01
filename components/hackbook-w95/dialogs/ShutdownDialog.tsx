"use client";

import React, { useState } from "react";
import Image from "next/image";

interface ShutdownDialogProps {
  onCancel: () => void;
  onShutDown: () => void;
  onRestart: () => void;
  onLogout?: () => void;
  showLogout?: boolean;
}

const ShutdownDialog: React.FC<ShutdownDialogProps> = ({ 
  onCancel, 
  onShutDown, 
  onRestart, 
  onLogout, 
  showLogout = false 
}) => {
  const [option, setOption] = useState<"shutdown" | "restart" | "logout">("shutdown");
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0" onClick={onCancel}></div>
      <div className="relative z-10 bg-[#c0c0c0] w-80 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] shadow-md">
        <div className="bg-[#000080] px-2 py-1 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/hackbook-W95/app-icon/shut-down.png" 
              alt="Shut Down Windows"
              width={16} 
              height={16} 
              className="mr-1"
              priority
            />
            <span className="text-white font-bold text-sm">Shut Down Windows</span>
          </div>
          <button 
            onClick={onCancel}
            className="bg-[#c0c0c0] w-5 h-5 flex items-center justify-center border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] text-sm font-bold"
          >
            ✕
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex mb-4">
            <div className="mr-4">
              <Image 
                src="/hackbook-W95/app-icon/question.png" 
                alt="Question"
                width={32} 
                height={32}
                priority
              />
            </div>
            <div>
              <p className="text-sm mb-2">
                What do you want the computer to do?
              </p>
            </div>
          </div>
          
          <div className="pl-4 space-y-2 mb-6">
            <label className="flex items-center">
              <input 
                type="radio" 
                name="shutdown" 
                checked={option === "shutdown"} 
                onChange={() => setOption("shutdown")}
                className="mr-2"
              />
              <span className="text-sm">Shut down the computer</span>
            </label>
            
            <label className="flex items-center">
              <input 
                type="radio" 
                name="shutdown" 
                checked={option === "restart"} 
                onChange={() => setOption("restart")}
                className="mr-2"
              />
              <span className="text-sm">Restart the computer</span>
            </label>
            
            {showLogout && onLogout && (
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="shutdown" 
                  checked={option === "logout"} 
                  onChange={() => setOption("logout")}
                  className="mr-2"
                />
                <span className="text-sm">Log off the current user</span>
              </label>
            )}
          </div>
          
          <div className="flex justify-end space-x-2">
            <button 
              onClick={() => {
                if (option === "shutdown") {
                  onShutDown();
                } else if (option === "restart") {
                  onRestart();
                } else if (option === "logout" && onLogout) {
                  onLogout();
                }
              }}
              className="bg-[#c0c0c0] px-4 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            >
              OK
            </button>
            
            <button 
              onClick={onCancel}
              className="bg-[#c0c0c0] px-4 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShutdownDialog;
