"use client";
import React from "react";
import { motion } from "framer-motion";

export const LatestActivity = () => {
  return (
    <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
      <div className="bg-cyber-primary/10 px-4 py-2">
        <h3 className="text-cyber-primary font-bold">LATEST ACTIVITY</h3>
      </div>
      <div className="p-4 space-y-3">
        {[
          { time: "09:42", user: "QuantumHacker", action: "solved the encryption challenge" },
          { time: "11:15", user: "ByteRebel", action: "posted in Network Security forum" },
          { time: "12:30", user: "CyberNinja", action: "registered for the next hackathon" },
        ].map((activity, i) => (
          <motion.div
            key={i}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-start group hover:bg-cyber-primary/5 p-2 rounded transition-colors"
          >
            <div className="text-xs text-cyber-secondary mr-3">{activity.time}</div>
            <div>
              <span className="text-cyber-primary font-medium">{activity.user}</span>
              <span className="text-gray-400 ml-2">{activity.action}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
