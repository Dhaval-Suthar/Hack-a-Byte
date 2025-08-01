"use client";

import React from "react";
import { motion } from "framer-motion";

const Page = () => {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black px-6 py-24 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl w-full"
      >
        {/* Header */}
        <div className="mb-10">
          <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs rounded-sm mb-4">
            [SYSTEM:ACCESS_CODES_DOCS]
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary mb-4">
            Understanding Access Codes
          </h1>
          <p className="text-gray-300 text-lg">
            Access Codes are secure digital keys that control access to specific zones, simulations, or restricted environments within HackaByte.
            They ensure a progressive, permission-based structure for each participant.
          </p>
        </div>

        {/* Access Code Section - Moved to top for visibility */}
        <section className="mb-12">
          <h2 className="text-cyber-primary text-2xl font-semibold mb-4">Ready to Join?</h2>
          <div className="bg-black/50 border border-cyber-primary/30 rounded-lg p-6">
            <h3 className="text-cyber-secondary font-semibold text-lg mb-3">Your Access Code</h3>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-cyber-primary/20 to-cyber-secondary/20 border border-cyber-primary/50 rounded-lg px-8 py-4">
                <div className="text-3xl font-mono font-bold text-cyber-primary tracking-widest">
                  111111
                </div>
              </div>
            </div>
            <p className="text-gray-300 text-center mb-4">
              Use this access code to join the HackaByte platform and start your cybersecurity journey.
            </p>
            <div className="flex justify-center gap-4 mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/device-selection'}
                className="bg-gradient-to-r from-cyber-primary to-cyber-secondary text-black font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-cyber-primary/20 transition-all duration-300"
              >
                Access System
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/'}
                className="bg-transparent border border-cyber-primary text-cyber-primary font-semibold px-6 py-3 rounded-lg hover:bg-cyber-primary/10 hover:shadow-lg hover:shadow-cyber-primary/20 transition-all duration-300"
              >
                Go to Main Page
              </motion.button>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-cyber-secondary font-semibold">Type</div>
                <div className="text-gray-300">Permanent</div>
              </div>
              <div className="text-center">
                <div className="text-cyber-secondary font-semibold">Usage</div>
                <div className="text-gray-300">Unlimited</div>
              </div>
            </div>
          </div>
        </section>

        {/* Types of Codes */}
        <section className="mb-12">
          <h2 className="text-cyber-primary text-2xl font-semibold mb-4">Types of Access Codes</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-3">
            <li>
              <span className="font-semibold text-cyber-secondary">Permanent:</span> Unlimited use; grants core access to standard challenges and tools.
            </li>
            <li>
              <span className="font-semibold text-cyber-secondary">Time-Limited:</span> Valid only during specific hours or events; ideal for timed tests.
            </li>
            <li>
              <span className="font-semibold text-cyber-secondary">Usage-Limited:</span> Allows a limited number of attempts to access a resource or simulation.
            </li>
          </ul>
        </section>

        {/* Why They Matter */}
        <section className="mb-12">
          <h2 className="text-cyber-primary text-2xl font-semibold mb-4">Why Are Access Codes Important?</h2>
          <p className="text-gray-300">
            Access codes maintain integrity, security, and progression throughout the HackaByte platform. Without them, users would be able
            to jump ahead or enter areas without proving their readiness. They&rsquo;re essential for:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
            <li>Enforcing permission boundaries</li>
            <li>Regulating timed or limited-access challenges</li>
            <li>Unlocking premium or hidden features</li>
          </ul>
        </section>

        {/* Process to Use Codes */}
        <section className="mb-12">
          <h2 className="text-cyber-primary text-2xl font-semibold mb-4">How to Use an Access Code</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Step 1: Obtain Code",
                desc: "Codes may be given via email, event dashboards, or earned through challenges. Keep it secure.",
              },
              {
                title: "Step 2: Navigate to Entry",
                desc: "Visit the simulation or restricted tool you want to access. The code prompt will appear.",
              },
              {
                title: "Step 3: Input & Validate",
                desc: "Enter your 6-digit access code. If valid, your permissions are updated instantly.",
              },
              {
                title: "Step 4: Start Mission",
                desc: "Once validated, the environment will unlock. Prepare your tools and begin your mission.",
              },
              {
                title: "Step 5: Code Tracking",
                desc: "Each use is logged to your profile. Usage-limited codes will decrement with each attempt.",
              },
            ].map((card, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="bg-black/50 border border-cyber-primary/30 rounded-lg p-5"
              >
                <h3 className="text-cyber-secondary font-semibold text-lg mb-2">{card.title}</h3>
                <p className="text-gray-300 text-sm">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>


        {/* Outro */}
        <section>
          <p className="text-gray-400 italic text-sm">
            Refer to the <span className="text-cyber-secondary underline">HackaByte documentation</span> or contact system admins for code-specific issues.
          </p>
        </section>
      </motion.div>
    </main>

  );
};

export default Page;
