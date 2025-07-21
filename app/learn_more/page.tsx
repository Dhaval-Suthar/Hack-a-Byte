"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const Page = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full text-center"
      >
        <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-4 rounded-sm">
          [SYSTEM:LEARN_MORE]
        </div>

        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary mb-6">
          Learn More About HackaByte
        </h1>

        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
          Discover the ultimate cybersecurity challenge that tests your hacking skills, problem-solving abilities, and
          security knowledge through immersive simulations.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-black/50 border border-cyber-primary/30 rounded-lg p-6"
          >
            <h3 className="text-cyber-primary text-xl font-bold mb-3">Realistic Simulations</h3>
            <p className="text-gray-400">
              Experience authentic operating systems and security scenarios in our virtual environments.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-black/50 border border-cyber-primary/30 rounded-lg p-6"
          >
            <h3 className="text-cyber-primary text-xl font-bold mb-3">Skill Development</h3>
            <p className="text-gray-400">
              Build expertise in penetration testing, digital forensics, and cybersecurity defense.
            </p>
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/about">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-cyber-primary text-black font-semibold rounded-md hover:bg-cyber-secondary transition-colors"
            >
              About HackaByte
            </motion.button>
          </Link>

          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 border border-cyber-primary text-cyber-primary font-semibold rounded-md hover:bg-cyber-primary hover:text-black transition-colors"
            >
              Get Started
            </motion.button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Page;
