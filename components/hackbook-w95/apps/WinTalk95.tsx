"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import clsx from "clsx";
import Image from "next/image";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface Contact {
  username: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
}

interface WinTalk95Props {
  onClose: () => void;
}

const WinTalk95: React.FC<WinTalk95Props> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("secure.ghostnet.corp");
  const [port, setPort] = useState("2847");
  const [connectionError, setConnectionError] = useState("");
  const [showLogin, setShowLogin] = useState(true);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts] = useState<Contact[]>([
    { username: "Cipher_Master", status: 'online' },
    { username: "Shadow_Ops", status: 'away' },
    { username: "Digital_Ghost", status: 'offline', lastSeen: new Date('1995-11-27') },
    { username: "Phantom_Net", status: 'busy' }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  // Play sound effect
  const playSound = useCallback((soundType: 'connect' | 'message' | 'error' | 'click') => {
    try {
      let audio: HTMLAudioElement;
      switch (soundType) {
        case 'connect':
          audio = new Audio("/hackbook-w95/sounds/ding.mp3");
          break;
        case 'message':
          audio = new Audio("/hackbook-w95/sounds/click.mp3");
          break;
        case 'error':
          audio = new Audio("/hackbook-w95/sounds/error.mp3");
          break;
        case 'click':
          audio = new Audio("/hackbook-w95/sounds/click.mp3");
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

  // Handle login attempt
  const handleLogin = useCallback(async () => {
    setIsConnecting(true);
    setConnectionError("");

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check credentials (from the ZIP file)
    if (username === "ghost_agent_001" && password === "PHANTOM95" && server === "secure.ghostnet.corp") {
      setIsConnected(true);
      setShowLogin(false);
      playSound('connect');
      
      // Add system connection message
      const systemMessage: Message = {
        id: 'system_connect',
        sender: 'System',
        content: `Connected to ${server}:${port}`,
        timestamp: new Date(),
        isSystem: true
      };
      setMessages([systemMessage]);

      // Save mission progress
      import('../hooks/useMissionTracker').then(({ MissionTracker }) => {
        MissionTracker.completeMission('wintalk_connected');
      });

    } else {
      setConnectionError("Invalid username, password, or server address.");
      playSound('error');
    }

    setIsConnecting(false);
  }, [username, password, server, port, playSound]);

  // Handle contact selection
  const handleContactSelect = useCallback((contactUsername: string) => {
    setSelectedContact(contactUsername);
    playSound('click');

    // If selecting Cipher_Master, show their messages
    if (contactUsername === 'Cipher_Master') {
      // Generate dynamic mission briefing
      const threats = [
        {
          name: "ShadowByte",
          description: "A rival hacker codenamed 'ShadowByte' has infiltrated our network",
          specialty: "SSH attacks and encrypted communications on ports 1337 and 31337",
          expectedIP: "192.168.1.142"
        },
        {
          name: "CyberPhantom",
          description: "The elusive 'CyberPhantom' has breached our secure channels",
          specialty: "FTP exploitation and SSL tunneling through proxy servers",
          expectedIP: "192.168.1.187"
        },
        {
          name: "DarkNet Operative",
          description: "A DarkNet infiltrator has compromised our communications",
          specialty: "Tor traffic and IRC command channels with steganographic data",
          expectedIP: "192.168.1.221"
        },
        {
          name: "Ghost Protocol Agent",
          description: "A rogue Ghost Protocol agent has turned against the network",
          specialty: "DNS tunneling and email protocol exploitation",
          expectedIP: "192.168.1.156"
        },
        {
          name: "Binary Assassin",
          description: "The notorious 'Binary Assassin' has launched buffer overflow attacks",
          specialty: "RPC exploits, SMB vulnerabilities, and SQL injection techniques",
          expectedIP: "192.168.1.199"
        }
      ];

      // Randomly select a threat scenario
      const threat = threats[Math.floor(Math.random() * threats.length)];

      const cipherMasterMessages: Message[] = [
        {
          id: 'welcome_back',
          sender: 'Cipher_Master',
          content: 'Excellent work on the archive recovery, agent. Your skills impressed the network.',
          timestamp: new Date('1995-11-29T09:15:00'),
        },
        {
          id: 'urgent_mission',
          sender: 'Cipher_Master',
          content: `🚨 URGENT: We have a critical security breach. ${threat.description}.`,
          timestamp: new Date('1995-11-29T09:15:15'),
        },
        {
          id: 'threat_assessment',
          sender: 'Cipher_Master',
          content: 'THREAT LEVEL: HIGH - They\'ve stolen sensitive data and compromised our communication channels.',
          timestamp: new Date('1995-11-29T09:15:30'),
        },
        {
          id: 'mission_briefing',
          sender: 'Cipher_Master',
          content: `Your mission: Use network analysis to locate ${threat.name}'s virtual machine and establish contact.`,
          timestamp: new Date('1995-11-29T09:15:45'),
        },
        {
          id: 'tool_preparation',
          sender: 'Cipher_Master',
          content: 'I\'ll upload specialized tools to your system. These are restricted GHOST network assets.',
          timestamp: new Date('1995-11-29T09:16:15'),
        },
        {
          id: 'tool_download',
          sender: 'Cipher_Master',
          content: '📥 DOWNLOAD: I\'m sending you our Network Neighborhood tool for advanced network analysis.',
          timestamp: new Date('1995-11-29T09:16:30'),
        },
        {
          id: 'tool_install',
          sender: 'Cipher_Master',
          content: '💾 Installing Network Neighborhood on your desktop... Installation complete! Double-click the icon to launch.',
          timestamp: new Date('1995-11-29T09:16:45'),
        },
        {
          id: 'intelligence',
          sender: 'Cipher_Master',
          content: `INTEL: Look for IP ${threat.expectedIP} in the logs. ${threat.name} specializes in ${threat.specialty}. Time is critical!`,
          timestamp: new Date('1995-11-29T09:17:00'),
        },
        {
          id: 'warning',
          sender: 'Cipher_Master',
          content: `⚠️ WARNING: ${threat.name} is extremely cunning. Wrong connection attempts may trigger their security systems.`,
          timestamp: new Date('1995-11-29T09:17:20'),
        },
        {
          id: 'closing_mission2',
          sender: 'Cipher_Master',
          content: 'Find their location and establish contact. The network\'s security depends on you. Ghost out.',
          timestamp: new Date('1995-11-29T09:17:40'),
        }
      ];

      // Add messages with slight delays to simulate real-time conversation
      const delay = 1000;
      cipherMasterMessages.forEach((msg, index) => {
        setTimeout(() => {
          setMessages(prev => [...prev, msg]);
          playSound('message');
          
          // Special action for tool installation message
          if (msg.id === 'tool_install') {
            setTimeout(() => {
              // Trigger desktop icon addition notification
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('networkToolInstalled'));
              }
            }, 2000);
          }
        }, delay + (index * 3000));
      });
    }
  }, [playSound]);

  // Handle sending message
  const handleSendMessage = useCallback(() => {
    if (currentMessage.trim() && selectedContact) {
      const newMessage: Message = {
        id: `msg_${Date.now()}`,
        sender: username,
        content: currentMessage.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newMessage]);
      setCurrentMessage("");
      playSound('message');

      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [currentMessage, selectedContact, username, playSound]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus message input when contact is selected
  useEffect(() => {
    if (selectedContact && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [selectedContact]);

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'online': return 'text-green-600';
      case 'away': return 'text-yellow-600';
      case 'busy': return 'text-red-600';
      case 'offline': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'online': return '●';
      case 'away': return '◐';
      case 'busy': return '◆';
      case 'offline': return '○';
      default: return '○';
    }
  };

  return (
    <div className="w-full h-full bg-[#c0c0c0] flex flex-col">
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <div className="flex items-center">
          <Image
            src="/hackbook-w95/app-icon/wintalk.png"
            alt="WinTalk icon"
            width={16}
            height={16}
            className="mr-2"
          />
          <span className="text-sm font-bold">
            WinTalk 95 {isConnected ? `- Connected to ${server}` : '- Disconnected'}
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
          <span className="hover:bg-[#e0e0e0] px-2 py-1 cursor-pointer">Tools</span>
          <span className="hover:bg-[#e0e0e0] px-2 py-1 cursor-pointer">Help</span>
        </div>
      </div>

      {showLogin ? (
        /* Login Screen */
        <div className="flex-1 bg-white flex items-center justify-center">
          <div className="bg-[#c0c0c0] border-2 border-[#808080] p-6 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <Image
                src="/hackbook-w95/app-icon/wintalk.png"
                alt="WinTalk logo"
                width={48}
                height={48}
                className="mx-auto mb-2"
              />
              <h2 className="font-bold text-lg">Connect to Secure Network</h2>
              <p className="text-sm text-gray-600 mt-1">Enter your credentials to access the GHOST network</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Username:</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full border border-[#808080] px-2 py-1"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Password:</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-[#808080] px-2 py-1"
                  placeholder="Enter password"
                />
              </div>

              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1">Server:</label>
                  <input
                    type="text"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    className="w-full border border-[#808080] px-2 py-1"
                  />
                </div>
                <div className="w-20">
                  <label className="block text-sm font-bold mb-1">Port:</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full border border-[#808080] px-2 py-1"
                  />
                </div>
              </div>

              {connectionError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded text-sm">
                  {connectionError}
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleLogin}
                  disabled={isConnecting}
                  className={clsx(
                    "px-6 py-2 border-2 font-bold",
                    {
                      "bg-[#000080] text-white border-[#000080] hover:bg-[#0000aa]": !isConnecting,
                      "bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed": isConnecting
                    }
                  )}
                >
                  {isConnecting ? "Connecting..." : "Connect"}
                </button>
              </div>
            </div>

            <div className="mt-4 text-xs text-gray-600 text-center">
              <p>Hint: Check the recovered files from the ZIP archive for login credentials.</p>
            </div>
          </div>
        </div>
      ) : (
        /* Main Chat Interface */
        <div className="flex-1 flex">
          {/* Contact List */}
          <div className="w-1/3 bg-[#c0c0c0] border-r border-[#808080] flex flex-col">
            <div className="bg-[#000080] text-white px-2 py-1 text-sm font-bold">
              Contacts
            </div>
            <div className="flex-1 overflow-auto">
              {contacts.map((contact) => (
                <div
                  key={contact.username}
                  className={clsx(
                    "px-2 py-2 border-b border-[#e0e0e0] cursor-pointer flex items-center",
                    {
                      "bg-[#000080] text-white": selectedContact === contact.username,
                      "hover:bg-[#e0e0e0]": selectedContact !== contact.username
                    }
                  )}
                  onClick={() => handleContactSelect(contact.username)}
                >
                  <span className={clsx("mr-2", getStatusColor(contact.status))}>
                    {getStatusIcon(contact.status)}
                  </span>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{contact.username}</div>
                    <div className="text-xs opacity-75">
                      {contact.status === 'offline' && contact.lastSeen 
                        ? `Last seen ${contact.lastSeen.toLocaleDateString()}`
                        : contact.status
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="bg-[#000080] text-white px-3 py-2 text-sm font-bold">
                  Conversation with {selectedContact}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto bg-white p-2 space-y-2">
                  {messages
                    .filter(msg => msg.isSystem || msg.sender === selectedContact || msg.sender === username)
                    .map((message) => (
                    <div
                      key={message.id}
                      className={clsx("flex", {
                        "justify-end": message.sender === username,
                        "justify-start": message.sender !== username,
                        "justify-center": message.isSystem
                      })}
                    >
                      <div
                        className={clsx("max-w-xs px-3 py-2 rounded text-sm", {
                          "bg-[#000080] text-white": message.sender === username,
                          "bg-[#e0e0e0] text-black": message.sender !== username && !message.isSystem,
                          "bg-gray-100 text-gray-600 italic text-xs": message.isSystem
                        })}
                      >
                        <div className="break-words">{message.content}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="bg-[#c0c0c0] border-t border-[#808080] p-2 flex">
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 border border-[#808080] px-2 py-1 mr-2"
                    placeholder="Type your message..."
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-[#000080] text-white px-4 py-1 border-2 border-[#000080] hover:bg-[#0000aa]"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              /* No Contact Selected */
              <div className="flex-1 bg-white flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Image
                    src="/hackbook-w95/app-icon/wintalk.png"
                    alt="WinTalk"
                    width={64}
                    height={64}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <p>Select a contact to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="bg-[#c0c0c0] border-t border-[#808080] px-2 py-1 text-xs flex justify-between">
        <span>
          {isConnected 
            ? `Connected | ${contacts.filter(c => c.status === 'online').length} online`
            : "Disconnected"
          }
        </span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default WinTalk95;
