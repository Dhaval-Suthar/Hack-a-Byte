"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  const sections = [
    {
      title: "About",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Event Details", href: "/event" },
        { name: "Sponsors", href: "/sponsors" },
        { name: "FAQ", href: "/faq" },
      ],
    },
    {
      title: "Community",
      links: [
        { name: "Join Discord", href: "https://discord.gg/hackabyte" },
        { name: "Twitter", href: "https://twitter.com/hackabyte" },
        { name: "GitHub", href: "https://github.com/hackabyte" },
        { name: "Contact Us", href: "/contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Code of Conduct", href: "/code-of-conduct" },
      ],
    },
  ];

  return (
    <footer className="bg-black border-t border-cyber-primary/20">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link href="/">
              <div className="flex items-center gap-2">
                <motion.h2
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-secondary text-lg font-black font-terminal tracking-wider"
                  whileHover={{ scale: 1.05 }}
                >
                  HACKABYTE
                </motion.h2>
              </div>
            </Link>
            <p className="mt-2 text-sm text-gray-400">
              The ultimate cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge.
            </p>
            <div className="mt-4 flex space-x-4">
              {/* Social icons */}
              {["discord", "twitter", "github"].map((social) => (
                <motion.a
                  key={social}
                  href={`https://${social}.com/hackabyte`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.1 }}
                  className="text-cyber-primary hover:text-cyber-secondary transition-colors"
                >
                  <span className="sr-only">{social}</span>
                  <div className="h-6 w-6 border border-cyber-primary/50 rounded flex items-center justify-center hover:border-cyber-primary">
                    <span className="text-xs uppercase font-terminal">{social.charAt(0)}</span>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>

          {/* Navigation sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm uppercase font-terminal tracking-wider text-cyber-primary mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} passHref>
                      <motion.span
                        className="text-gray-400 hover:text-cyber-primary text-sm cursor-pointer"
                        whileHover={{ x: 3 }}
                      >
                        {link.name}
                      </motion.span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-cyber-primary/20 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-500 mb-4 md:mb-0">
            &copy; {currentYear} HackaByte. All rights reserved.
          </p>
          <div className="text-xs text-gray-500 font-terminal">
            <span className="text-cyber-primary">{">"}</span> SECURE · COMPETE · CONQUER
          </div>
        </div>
      </div>
    </footer>
  );
}
