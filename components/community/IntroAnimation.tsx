"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TypingText } from "./TypingText";

interface IntroAnimationProps {
  showIntro: boolean;
}

export const IntroAnimation = ({ showIntro }: IntroAnimationProps) => {
  return (
    <AnimatePresence>
      {showIntro && (
        <motion.div
          className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-md w-full px-8">
            <TypingText
              text="> INITIALIZING COMMUNITY NETWORK..."
              className="text-cyber-primary font-mono text-xl"
              speed={20}
            />
            <div className="h-1 w-full bg-cyber-primary/20 mt-2 mb-4 relative overflow-hidden">
              <motion.div
                className="absolute h-full bg-cyber-primary"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2 }}
              />
            </div>
            <TypingText
              text="> ESTABLISHING SECURE CONNECTION..."
              className="text-cyber-primary/80 font-mono"
              speed={15}
            />
            <TypingText
              text="> CONNECTION ESTABLISHED. WELCOME."
              className="text-cyber-primary font-mono mt-2"
              speed={20}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
