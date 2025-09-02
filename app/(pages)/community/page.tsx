"use client";
import React, { useEffect, useState } from "react";
import {
  BackgroundAnimation,
  IntroAnimation,
  CommandLineModal,
  LatestActivity,
  OnlineMembers,
  CommunityChannels,
  ChatSection,
  ForumsSection,
  EventsSection,
} from "@/components/community";

interface Message {
  id: number;
  text: string;
  sender: string;
  time: string;
}

interface Member {
  id: number;
  name: string;
  status: "online" | "away" | "offline";
  avatar: number;
}

export default function Page() {
  const [activeCommunity, setActiveCommunity] = useState("main");
  const [showIntro, setShowIntro] = useState(true);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to the HackaByte community channel", sender: "SYSTEM", time: "12:00" },
    { id: 2, text: "Type a message to join the conversation", sender: "SYSTEM", time: "12:01" },
  ]);
  const [showCommandLine, setShowCommandLine] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [activeMembers] = useState<Member[]>([
    { id: 1, name: "CyberNinja", status: "online", avatar: 1 },
    { id: 2, name: "QuantumHacker", status: "online", avatar: 2 },
    { id: 3, name: "NeonPhantom", status: "away", avatar: 3 },
    { id: 4, name: "ByteRebel", status: "offline", avatar: 4 },
    { id: 5, name: "DataSpectre", status: "online", avatar: 2 },
  ]);

  useEffect(() => {
    // Toggle scanlines periodically for effect
    const scanlinesInterval = setInterval(() => {
      setScanlines((prev) => !prev);
      setTimeout(() => setScanlines(true), 100);
    }, 5000);

    // Hide intro after 4 seconds
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 4000);

    return () => {
      clearInterval(scanlinesInterval);
      clearTimeout(introTimer);
    };
  }, []);

  const handleChatSubmit = (message: string) => {
    // Add user message
    const newUserMessage = {
      id: chatMessages.length + 1,
      text: message,
      sender: "YOU",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newUserMessage]);

    // Simulate bot response after a delay
    setTimeout(() => {
      const responses = [
        "Interesting approach to solving that problem.",
        "Have you tried using a different algorithm?",
        "The next hackathon starts in 3 days. Are you ready?",
        "Check out the resources section for more information.",
        "That's a clever solution!",
        "Remember to register for the upcoming event.",
      ];

      const botMessage = {
        id: chatMessages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: activeMembers[Math.floor(Math.random() * activeMembers.length)].name,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setChatMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const renderCommunitySection = () => {
    if (activeCommunity === "main") {
      return (
        <div className="space-y-6">
          <CommunityChannels
            onChannelClick={setActiveCommunity}
            onCommandLineClick={() => setShowCommandLine(true)}
          />
          <LatestActivity />
          <OnlineMembers members={activeMembers} />
        </div>
      );
    } else if (activeCommunity === "chat") {
      return (
        <ChatSection
          onBack={() => setActiveCommunity("main")}
          messages={chatMessages}
          onSendMessage={handleChatSubmit}
        />
      );
    } else if (activeCommunity === "forums") {
      return <ForumsSection onBack={() => setActiveCommunity("main")} />;
    } else if (activeCommunity === "events") {
      return <EventsSection onBack={() => setActiveCommunity("main")} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full pt-20 relative">
      <BackgroundAnimation scanlines={scanlines} />
      <IntroAnimation showIntro={showIntro} />
      <CommandLineModal showCommandLine={showCommandLine} onClose={() => setShowCommandLine(false)} />

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-2 rounded-sm">
              [SYSTEM:NETWORK]
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary">
              HACKABYTE COMMUNITY
            </h1>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>STATUS:</span>
              <span className="text-cyber-primary">ONLINE</span>
              <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></div>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {renderCommunitySection()}
      </div>
    </div>
  );
}
