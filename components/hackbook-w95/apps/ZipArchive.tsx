"use client";

import React, { useState, useCallback } from "react";
import Win95Alert from "../Win95Alert";
import clsx from "clsx";
import Image from "next/image";
import { getSessionCreds } from "@/lib/creds";

interface ZipFile {
  name: string;
  size: number;
  type: 'file' | 'directory';
  compressed: boolean;
  lastModified: Date;
  content?: string;
}

interface ZipArchiveProps {
  onClose: () => void;
  filePath?: string;
  isLocked?: boolean;
  password?: string;
}

const ZipArchive: React.FC<ZipArchiveProps> = ({
  onClose,
  filePath = "C:\\Documents\\Old_Files\\Archive.zip",
  isLocked = true,
  password = "GHOST"
}) => {
  const [isUnlocked, setIsUnlocked] = useState(!isLocked);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<ZipFile | null>(null);
  const [showWinAlert, setShowWinAlert] = useState(false);

  // Use shared credentials for the session
  const creds = getSessionCreds();

  // Contents of the ZIP file (revealed after unlocking)
  const zipContents: ZipFile[] = [
    {
      name: "client_data.txt",
      size: 2048,
      type: 'file',
      compressed: true,
      lastModified: new Date('1995-10-15'),
      content: `CLIENT DATA RECOVERY
      
File recovered from damaged hard drive.
Client: GHOST NETWORK
Date: October 15, 1995

IMPORTANT: This data contains encrypted access credentials for the secure messaging system.

Username: ${creds.username}
Password: ${creds.password}
Server: secure.ghostnet.corp
Port: 2847

INSTRUCTIONS:
1. Launch the WinTalk 95 instant messenger
2. Use the above credentials to connect
3. Contact user "Cipher_Master" for your next assignment

WARNING: This information is highly classified. 
Do not share with unauthorized personnel.

-- Archive created by recovery tool v2.1
-- Original file location: C:\\Users\\Agent\\AppData\\secure_backup.dat`
    },
    {
      name: "recovery_log.txt",
      size: 512,
      type: 'file',
      compressed: true,
      lastModified: new Date('1995-10-16'),
      content: `DATA RECOVERY LOG
      
Recovery Date: October 16, 1995
Recovery Tool: HDD_Salvage v3.2
Source Drive: WD Caviar 1.2GB

Files Recovered: 1
Files Corrupted: 3
Recovery Success Rate: 25%

Notes:
- Most files were corrupted beyond repair
- Client data file shows signs of intentional encryption
- Recommend immediate backup and secure transmission

Recovery completed successfully.

-- System Administrator`
    },
    {
      name: "readme.txt",
      size: 256,
      type: 'file',
      compressed: false,
      lastModified: new Date('1995-11-28'),
      content: `RECOVERED FILES ARCHIVE

This archive contains files recovered from a damaged hard drive.
Most files were corrupted, but some critical data was salvaged.

Password protected for security.

If you are reading this, the password has been successfully cracked.
Proceed with caution - the contents may be sensitive.

Good luck with your assignment.

-- Anonymous`
    }
  ];

  // Play sound effect
  const playSound = useCallback((soundType: 'click' | 'error' | 'success' | 'open') => {
    try {
      let audio: HTMLAudioElement;
      switch (soundType) {
        case 'click':
          audio = new Audio("/hackbook-w95/sounds/click.mp3");
          break;
        case 'error':
          audio = new Audio("/hackbook-w95/sounds/error.mp3");
          break;
        case 'success':
          audio = new Audio("/hackbook-w95/sounds/ding.mp3");
          break;
        case 'open':
          audio = new Audio("/hackbook-w95/sounds/open.mp3");
          break;
        default:
          return;
      }
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play failed:", e));
    } catch (error) {
      console.error("Sound error:", error);
    }
  }, []);

  // Handle password input
  const handlePasswordSubmit = useCallback(() => {
    if (passwordInput === password) {
      setIsUnlocked(true);
      setShowPasswordDialog(false);
      playSound('success');
      // Save mission progress using database-enhanced tracker
      const deviceId = localStorage.getItem('selectedDeviceId');
      import('../hooks/useDatabaseMissionTracker').then(({ DatabaseMissionTracker }) => {
        DatabaseMissionTracker.completeMission('zip_unlocked', deviceId || undefined, 'hackbook-w95');
      }).catch(() => {
        // Fallback to original tracker
        import('../hooks/useMissionTracker').then(({ MissionTracker }) => {
          MissionTracker.completeMission('zip_unlocked');
        });
      });
    } else {
      playSound('error');
      setPasswordInput("");
      // Shake effect could be added here
    }
  }, [passwordInput, password, playSound]);

  // Handle brute force success
  const handleBruteForceSuccess = useCallback((crackedPassword: string) => {
    console.log('Password cracked:', crackedPassword);
    setIsUnlocked(true);
    playSound('success');
    // Save mission progress - Mark Mission 1 as complete using database-enhanced tracker
    const deviceId = localStorage.getItem('selectedDeviceId');
    import('../hooks/useDatabaseMissionTracker').then(({ DatabaseMissionTracker }) => {
      DatabaseMissionTracker.completeMission('mission1', deviceId || undefined, 'hackbook-w95');
    }).catch(() => {
      // Fallback to original tracker
      import('../hooks/useMissionTracker').then(({ MissionTracker }) => {
        MissionTracker.completeMission('mission1');
      });
    });
    // Show Win95Alert dialog with instructions to check client_data.txt
    setTimeout(() => {
      setShowWinAlert(true);
    }, 500);
  }, [playSound]);

  // Handle file selection
  const handleFileSelect = useCallback((file: ZipFile) => {
    setSelectedFile(file);
    playSound('click');
  }, [playSound]);

  // Handle file double-click (open)
  const handleFileOpen = useCallback((file: ZipFile) => {
    if (file.type === 'file') {
      setSelectedFile(file);
      // Instead of showing internal content viewer, dispatch event to open in separate Notepad window
      const event = new CustomEvent('win95openfile', {
        detail: {
          path: file.name,
          content: file.content || '',
          extension: 'txt'
        }
      });
      window.dispatchEvent(event);
      playSound('open');
    }
  }, [playSound]);

  // Format file size
  const formatSize = (bytes: number): string => {
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="w-full h-full bg-[#c0c0c0] flex flex-col">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center">
          <Image
            src="/hackbook-W95/file-icons/archive.png"
            alt="ZIP icon"
            width={16}
            height={16}
            className="mr-2"
          />
          <span className="text-sm font-bold">
            {filePath.split('\\').pop()} - WinZip
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-red-600 px-2 py-1 text-xs font-bold"
        >
          ×
        </button>
      </div>

      {/* Menu Bar */}
      <div className="bg-[#c0c0c0] border-b border-[#808080] px-2 py-1">
        <div className="flex space-x-4 text-sm">
          <span className="hover:bg-[#e0e0e0] px-2 py-1 cursor-pointer">File</span>
          <span className="hover:bg-[#e0e0e0] px-2 py-1 cursor-pointer">Edit</span>
          <span className="hover:bg-[#e0e0e0] px-2 py-1 cursor-pointer">View</span>
          <span className="hover:bg-[#e0e0e0] px-2 py-1 cursor-pointer">Options</span>
          <span className="hover:bg-[#e0e0e0] px-2 py-1 cursor-pointer">Help</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-[#c0c0c0] border-b border-[#808080] px-2 py-1 flex items-center space-x-2">
        <button className="border border-[#808080] px-2 py-1 text-xs bg-[#e0e0e0] hover:bg-[#d0d0d0]">
          Extract
        </button>
        <button className="border border-[#808080] px-2 py-1 text-xs bg-[#e0e0e0] hover:bg-[#d0d0d0]">
          Add
        </button>
        <button className="border border-[#808080] px-2 py-1 text-xs bg-[#e0e0e0] hover:bg-[#d0d0d0]">
          Delete
        </button>
        <div className="border-l border-[#808080] h-4 mx-2"></div>
        <button className="border border-[#808080] px-2 py-1 text-xs bg-[#e0e0e0] hover:bg-[#d0d0d0]">
          View
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-white">
        {!isUnlocked ? (
          // Password Protection Screen
          <div className="h-full flex items-center justify-center">
            <div className="bg-[#c0c0c0] border-2 border-[#808080] p-6 text-center max-w-md">
              <div className="mb-4">
                <Image
                  src="/hackbook-W95/app-icon/lock.png"
                  alt="Lock icon"
                  width={48}
                  height={48}
                  className="mx-auto mb-2"
                />
                <h3 className="font-bold mb-2">Password Protected Archive</h3>
                <p className="text-sm text-gray-700 mb-4">
                  This archive is password protected. Enter the password to continue, or use the brute force tool to crack it.
                </p>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => setShowPasswordDialog(true)}
                  className="w-full bg-[#000080] text-white px-4 py-2 border-2 border-[#000080] hover:bg-[#0000aa]"
                >
                  Enter Password
                </button>
                
                <button
                  onClick={() => {
                    // Launch BruteForceGame as a separate fullscreen app
                    const bruteForceApp = {
                      name: "Password Cracker",
                      icon: "/hackbook-W95/app-icon/lock.svg",
                      fullscreen: true,
                      metadata: {
                        type: "brute-force",
                        targetFileName: "Archive.zip",
                        parentCallback: handleBruteForceSuccess
                      }
                    };
                    
                    window.dispatchEvent(new CustomEvent('devLaunchApp', { 
                      detail: { app: bruteForceApp } 
                    }));
                    playSound('click');
                  }}
                  className="w-full bg-[#800000] text-white px-4 py-2 border-2 border-[#800000] hover:bg-[#a00000]"
                >
                  Launch Brute Force Attack
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Archive Contents
          <div className="h-full">
            {/* File List Header */}
            <div className="bg-[#c0c0c0] border-b border-[#808080] px-2 py-1 text-sm font-bold flex">
              <div className="w-1/2">Name</div>
              <div className="w-1/6">Size</div>
              <div className="w-1/6">Packed</div>
              <div className="w-1/6">Modified</div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-auto">
              {zipContents.map((file, index) => (
                <div
                  key={index}
                  className={clsx(
                    "flex items-center px-2 py-1 text-sm border-b border-[#e0e0e0] cursor-pointer",
                    {
                      "bg-[#000080] text-white": selectedFile === file,
                      "hover:bg-[#e0e0e0]": selectedFile !== file
                    }
                  )}
                  onClick={() => handleFileSelect(file)}
                  onDoubleClick={() => handleFileOpen(file)}
                >
                  <div className="w-1/2 flex items-center">
                    <Image
                      src={file.type === 'directory' 
                        ? "/hackbook-W95/file-icons/archive.png"
                        : "/hackbook-W95/file-icons/txt-file-symbol.png"
                      }
                      alt={file.type}
                      width={16}
                      height={16}
                      className="mr-2"
                    />
                    {file.name}
                  </div>
                  <div className="w-1/6">{formatSize(file.size)}</div>
                  <div className="w-1/6">{file.compressed ? 'Yes' : 'No'}</div>
                  <div className="w-1/6">{formatDate(file.lastModified)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#c0c0c0] border-t border-[#808080] px-2 py-1 text-xs flex justify-between">
        <span>
          {isUnlocked 
            ? `${zipContents.length} items | ${zipContents.reduce((sum, file) => sum + file.size, 0)} bytes`
            : "Archive locked"
          }
        </span>
        <span>Ready</span>
      </div>

      {/* Win95Alert for brute force success */}
      {showWinAlert && (
        <Win95Alert
          message={"Access Granted! The ZIP file has been unlocked successfully.\n\nIMPORTANT: Open 'client_data.txt' to find your next mission credentials!"}
          onClose={() => setShowWinAlert(false)}
        />
      )}

      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-[#c0c0c0] border-2 border-[#808080] p-4 min-w-[300px]">
            <div className="mb-4">
              <h3 className="font-bold mb-2">Enter Archive Password</h3>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit();
                  }
                }}
                className="w-full border border-[#808080] px-2 py-1"
                placeholder="Password"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPasswordDialog(false)}
                className="bg-[#c0c0c0] border-2 border-[#808080] px-4 py-1 hover:bg-[#d0d0d0]"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordSubmit}
                className="bg-[#000080] text-white border-2 border-[#000080] px-4 py-1 hover:bg-[#0000aa]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note: File content viewer removed - files now open in separate Notepad windows */}
    </div>
  );
};

export default ZipArchive;
