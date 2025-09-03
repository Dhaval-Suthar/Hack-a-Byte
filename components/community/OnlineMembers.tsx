"use client";
import React from "react";
import { motion } from "framer-motion";

interface Member {
  id: number;
  name: string;
  status: "online" | "away" | "offline";
  avatar: number;
}

interface OnlineMembersProps {
  members: Member[];
}

export const OnlineMembers = ({ members }: OnlineMembersProps) => {
  return (
    <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
      <div className="bg-cyber-primary/10 px-4 py-2 flex justify-between items-center">
        <h3 className="text-cyber-primary font-bold">ONLINE MEMBERS</h3>
        <span className="text-xs text-cyber-secondary">
          {members.filter((m) => m.status === "online").length} ACTIVE
        </span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {members.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-cyber-primary/20 hover:border-cyber-primary/50 transition-colors"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cyber-primary/20">
              <div className="w-full h-full flex items-center justify-center text-cyber-primary text-xs">
                {member.name.substring(0, 2).toUpperCase()}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-black ${
                  member.status === "online"
                    ? "bg-cyber-primary"
                    : member.status === "away"
                    ? "bg-yellow-400"
                    : "bg-gray-500"
                }`}
              ></div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-200">{member.name}</div>
              <div className="text-xs text-gray-400">{member.status}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
