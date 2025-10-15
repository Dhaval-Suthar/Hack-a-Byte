"use client";
import React from "react";
import { motion } from "framer-motion";

interface Event {
  name: string;
  date: string;
  description: string;
  type: string;
  participants: number;
}

interface EventsSectionProps {
  onBack: () => void;
}

export const EventsSection = ({ onBack }: EventsSectionProps) => {
  const events: Event[] = [
    {
      name: "Crypto Challenge",
      date: "May 15, 2025",
      description: "Test your encryption and decryption skills in this timed contest",
      type: "online",
      participants: 120,
    },
    {
      name: "Network Security Hackathon",
      date: "June 2, 2025",
      description: "Build secure network infrastructures while defending against live attacks",
      type: "hybrid",
      participants: 85,
    },
    {
      name: "AI Defense Workshop",
      date: "June 12, 2025",
      description: "Learn how to protect systems against AI-powered attacks",
      type: "in-person",
      participants: 40,
    },
  ];

  return (
    <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
      <div className="bg-cyber-primary/10 px-4 py-2 flex items-center">
        <button
          onClick={onBack}
          className="mr-3 text-cyber-primary hover:text-cyber-secondary"
        >
          ←
        </button>
        <h3 className="text-cyber-primary font-bold">UPCOMING EVENTS</h3>
      </div>

      <div className="p-4 space-y-6">
        {events.map((event, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.2 }}
            className="relative overflow-hidden"
          >
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-cyber-primary to-cyber-secondary"></div>
            <div className="border border-cyber-primary/30 rounded-lg p-4 ml-2 bg-black/30">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-cyber-primary">{event.name}</h4>
                  <div className="flex items-center mt-1">
                    <div className="text-cyber-secondary mr-3">{event.date}</div>
                    <div className="bg-cyber-primary/10 rounded-full px-2 py-0.5 text-xs text-cyber-primary uppercase">
                      {event.type}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">{event.description}</p>
                </div>
                <div className="sm:text-right">
                  <div className="bg-black/50 rounded-lg p-2 text-center inline-block">
                    <div className="text-2xl font-bold text-cyber-primary">{event.participants}</div>
                    <div className="text-xs text-cyber-secondary">Participants</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div className="text-xs text-gray-500">Registration open</div>
                <button className="cyber-button py-1 text-sm rounded">REGISTER</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
