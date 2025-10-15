"use client";
import React from "react";

interface CommunityChannelsProps {
  onChannelClick: (channel: string) => void;
  onCommandLineClick: () => void;
}

export const CommunityChannels = ({ onChannelClick, onCommandLineClick }: CommunityChannelsProps) => {
  return (
    <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
      <div className="bg-cyber-primary/10 px-4 py-2 flex justify-between items-center">
        <h3 className="text-cyber-primary font-bold">COMMUNITY CHANNELS</h3>
        <span className="text-xs text-cyber-secondary">{/* SELECT ACCESS POINT */}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
        <button
          onClick={() => onChannelClick("chat")}
          className="cyber-button rounded-md p-4 flex items-center justify-between hover:scale-105 transform transition-all duration-300"
        >
          <div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-cyber-primary animate-pulse mr-2"></div>
              <span className="tracking-wider">LIVE_CHAT</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-left">Connect with online members</p>
          </div>
          <div className="text-sm opacity-50">→</div>
        </button>

        <button
          onClick={() => onChannelClick("forums")}
          className="cyber-button rounded-md p-4 flex items-center justify-between hover:scale-105 transform transition-all duration-300"
        >
          <div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-cyber-secondary mr-2"></div>
              <span className="tracking-wider">FORUMS</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-left">Discussion boards and topics</p>
          </div>
          <div className="text-sm opacity-50">→</div>
        </button>

        <button
          onClick={() => onChannelClick("events")}
          className="cyber-button rounded-md p-4 flex items-center justify-between hover:scale-105 transform transition-all duration-300"
        >
          <div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-cyber-secondary mr-2"></div>
              <span className="tracking-wider">EVENTS</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-left">Upcoming hackathons and meetups</p>
          </div>
          <div className="text-sm opacity-50">→</div>
        </button>

        <button
          onClick={onCommandLineClick}
          className="cyber-button rounded-md p-4 flex items-center justify-between hover:scale-105 transform transition-all duration-300"
        >
          <div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-danger mr-2"></div>
              <span className="tracking-wider">COMMAND_LINE</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 text-left">Direct system access</p>
          </div>
          <div className="text-sm opacity-50">→</div>
        </button>
      </div>
    </div>
  );
};
