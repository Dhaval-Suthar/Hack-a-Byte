"use client";

import React from "react";
import Image from "next/image";

interface WelcomeDialogProps {
  onClose: () => void;
  username?: string;
}

const WelcomeDialog: React.FC<WelcomeDialogProps> = ({ onClose, username = "User" }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      {/* Main startup screen container */}
      <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] w-[480px] h-[320px] flex flex-col shadow-lg">
        
        {/* Top section with Windows 95 branding */}
        <div className="bg-gradient-to-r from-[#000080] to-[#0000ff] h-16 flex items-center px-4 relative">
          <div className="flex items-center">
            <Image
              src="/hackbook-W95/app-icon/windows-logo.png"
              alt="Windows Logo"
              width={32}
              height={32}
              className="mr-3"
            />
            <div>
              <h1 className="text-white text-xl font-bold tracking-wide">Windows 95</h1>
              <p className="text-white text-xs opacity-90">Microsoft Corporation</p>
            </div>
          </div>
          
          {/* Windows flag design element */}
          <div className="absolute right-4 top-2 flex space-x-1">
            <div className="w-3 h-3 bg-red-500"></div>
            <div className="w-3 h-3 bg-green-500"></div>
            <div className="w-3 h-3 bg-blue-500"></div>
            <div className="w-3 h-3 bg-yellow-500"></div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 bg-[#c0c0c0] p-6 flex">
          {/* Left side with large Windows logo */}
          <div className="w-24 flex flex-col items-center justify-center mr-6">
            <Image
              src="/hackbook-W95/app-icon/windows-logo.png"
              alt="Windows Logo"
              width={48}
              height={48}
              className="mb-2"
            />
            <div className="text-xs text-center text-[#000080] font-bold">
              Windows<br/>95
            </div>
          </div>

          {/* Right side with welcome message */}
          <div className="flex-1">
            <h2 className="text-lg font-bold mb-3 text-black">
              Welcome to Windows 95
            </h2>
            
            <div className="text-sm text-black space-y-2">
              <p>
                Welcome <strong>{username}</strong>!
              </p>
              
              <p>
                Windows 95 brings you a powerful, easy-to-use 32-bit operating system 
                with an innovative new interface.
              </p>
              
              <p className="text-xs mt-4">
                <strong>Getting started:</strong>
              </p>
              
              <ul className="text-xs space-y-1 ml-3">
                <li>• Click the Start button to see your programs</li>
                <li>• Double-click icons to open programs</li>
                <li>• Right-click for quick menus</li>
                <li>• Use the taskbar to switch between programs</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section with checkbox, tip and close */}
        <div className="bg-[#c0c0c0] border-t border-[#808080] p-3 space-y-2">
          {/* Checkbox row */}
          <div className="flex items-center">
            <label className="flex items-center text-xs text-black cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) => {
                  if (e.target.checked) {
                    localStorage.setItem("hideWelcomeDialog", "true");
                  } else {
                    localStorage.removeItem("hideWelcomeDialog");
                  }
                }}
              />
              Don&apos;t show this welcome screen again
            </label>
          </div>
          
          {/* Tip and button row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-xs text-black">
              <div className="w-4 h-4 bg-yellow-400 border border-black mr-2 flex items-center justify-center text-black font-bold text-xs">
                ?
              </div>
              <span>Tip: Press F1 for Help at any time</span>
            </div>
            
            <button
              onClick={onClose}
              className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-r-[#808080] border-b-[#808080] px-4 py-1 text-sm text-black hover:bg-[#d0d0d0] active:border-t-[#808080] active:border-l-[#808080] active:border-r-white active:border-b-white"
            >
              OK
            </button>
          </div>
        </div>

        {/* Bottom progress bar (cosmetic) */}
        <div className="h-6 bg-[#c0c0c0] border-t border-[#808080] flex items-center px-3">
          <div className="flex-1 bg-white border border-[#808080] h-3 mr-3">
            <div className="bg-[#000080] h-full w-full animate-pulse"></div>
          </div>
          <span className="text-xs text-black">Loading...</span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeDialog;