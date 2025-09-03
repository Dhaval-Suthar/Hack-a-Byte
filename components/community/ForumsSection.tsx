"use client";
import React from "react";
import { motion } from "framer-motion";

interface Forum {
  title: string;
  description: string;
  posts: number;
  lastActive: string;
}

interface ForumsSectionProps {
  onBack: () => void;
}

export const ForumsSection = ({ onBack }: ForumsSectionProps) => {
  const forums: Forum[] = [
    {
      title: "Cryptography Techniques",
      description: "Discuss encryption algorithms and implementation strategies",
      posts: 34,
      lastActive: "2 hours ago",
    },
    {
      title: "Network Security",
      description: "Share strategies for securing networks and detecting intrusions",
      posts: 27,
      lastActive: "5 hours ago",
    },
    {
      title: "CTF Strategies",
      description: "Capture The Flag competition techniques and walkthroughs",
      posts: 56,
      lastActive: "1 day ago",
    },
    {
      title: "Social Engineering",
      description: "Understanding human aspects of security and defense mechanisms",
      posts: 19,
      lastActive: "3 days ago",
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
        <h3 className="text-cyber-primary font-bold">DISCUSSION FORUMS</h3>
      </div>

      <div className="p-4 space-y-4">
        {forums.map((forum, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border border-cyber-primary/30 rounded-lg hover:border-cyber-primary/60 transition-colors p-4 group bg-black/30"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-cyber-secondary font-bold group-hover:text-cyber-primary transition-colors">
                  {forum.title}
                </h4>
                <p className="text-sm text-gray-400 mt-1">{forum.description}</p>
              </div>
              <div className="bg-cyber-primary/10 rounded-lg px-3 py-1">
                <div className="text-xs text-cyber-primary">{forum.posts} posts</div>
              </div>
            </div>
            <div className="flex justify-between mt-4 text-xs">
              <button className="cyber-button text-xs py-1 rounded">VIEW FORUM</button>
              <div className="text-gray-500">Last active: {forum.lastActive}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
