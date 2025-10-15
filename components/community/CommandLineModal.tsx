"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandLineModalProps {
  showCommandLine: boolean;
  onClose: () => void;
}

export const CommandLineModal = ({ showCommandLine, onClose }: CommandLineModalProps) => {
  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalCommand.trim() === "") return;

    // Add command to output
    setTerminalOutput((prev) => [...prev, `> ${terminalCommand}`]);

    // Process command
    const command = terminalCommand.toLowerCase().trim();
    let response = "";

    if (command === "help") {
      response = "Available commands: help, about, events, members, clear";
    } else if (command === "about") {
      response = "HackaByte is an elite cyber challenge platform for hackers and security enthusiasts.";
    } else if (command === "events") {
      response =
        "Upcoming events:\n- Crypto Challenge (May 15, 2025)\n- Network Security Hackathon (June 2, 2025)\n- AI Defense Workshop (June 12, 2025)";
    } else if (command === "members") {
      response = `Active members: 5\nTotal members: 5`;
    } else if (command === "clear") {
      setTerminalOutput([]);
      setTerminalCommand("");
      return;
    } else {
      response = `Command not recognized: "${terminalCommand}". Type "help" for available commands.`;
    }

    // Add response after a short delay
    setTimeout(() => {
      setTerminalOutput((prev) => [...prev, response]);
    }, 300);

    setTerminalCommand("");
  };

  return (
    <AnimatePresence>
      {showCommandLine && (
        <motion.div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-2xl bg-black border border-cyber-primary/60 rounded-lg overflow-hidden"
            initial={{ y: 20, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.9 }}
          >
            <div className="bg-cyber-primary/20 px-4 py-2 flex justify-between items-center">
              <h3 className="text-cyber-primary font-bold">HACKABYTE_TERMINAL</h3>
              <button
                onClick={onClose}
                className="text-cyber-primary hover:text-cyber-secondary"
              >
                ✕
              </button>
            </div>

            <div className="h-80 bg-black p-4 font-mono text-sm overflow-y-auto">
              <div className="text-cyber-primary mb-2">Type &apos;help&apos; for available commands</div>

              {terminalOutput.map((line, i) => (
                <div key={i} className={`mb-1 ${line.startsWith(">") ? "text-cyber-primary" : "text-gray-300"}`}>
                  {line}
                </div>
              ))}

              <form onSubmit={handleTerminalSubmit} className="flex mt-2">
                <span className="text-cyber-primary mr-2">&gt;</span>
                <input
                  type="text"
                  value={terminalCommand}
                  onChange={(e) => setTerminalCommand(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-cyber-primary"
                  autoFocus
                />
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
