"use client";
import React, { useState, useRef } from "react";

interface Message {
  id: number;
  text: string;
  sender: string;
  time: string;
}

interface ChatSectionProps {
  onBack: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
}

export const ChatSection = ({ onBack, messages, onSendMessage }: ChatSectionProps) => {
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;
    onSendMessage(chatInput);
    setChatInput("");
  };

  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden h-[600px] flex flex-col">
      <div className="bg-cyber-primary/10 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-3 text-cyber-primary hover:text-cyber-secondary"
          >
            ←
          </button>
          <h3 className="text-cyber-primary font-bold">GLOBAL CHAT</h3>
        </div>
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse mr-1"></div>
          <span className="text-xs text-cyber-secondary">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "YOU" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.sender === "YOU"
                  ? "bg-cyber-primary/20 border border-cyber-primary/40"
                  : "bg-black/40 border border-cyber-secondary/30"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-xs font-bold ${
                    msg.sender === "YOU" ? "text-cyber-primary" : "text-cyber-secondary"
                  }`}
                >
                  {msg.sender}
                </span>
                <span className="text-xs text-gray-500 ml-3">{msg.time}</span>
              </div>
              <p className="text-gray-200">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-cyber-primary/20 bg-black/20">
        <div className="flex">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/60 border border-cyber-primary/30 rounded-l-md px-4 py-2 text-gray-200 focus:outline-none focus:border-cyber-primary/70"
          />
          <button
            type="submit"
            className="bg-cyber-primary/20 border border-cyber-primary px-4 rounded-r-md text-cyber-primary hover:bg-cyber-primary/30"
          >
            SEND
          </button>
        </div>
      </form>
    </div>
  );
};
