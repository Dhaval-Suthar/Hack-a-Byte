"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [timeString, setTimeString] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    // Update time string every second for a cyber look
    const timeInterval = setInterval(() => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString());
    }, 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(timeInterval);
    };
  }, []);

  // Define menu items and their paths
  const menuItems = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Event", path: "/event" },
    { name: "Sponsors", path: "/sponsors" },
    { name: "Community", path: "/community" }
  ];

  return (
    <motion.header
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/90 backdrop-blur-md border-b border-cyber-primary/30" : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/">
            <div className="flex items-center gap-4 flex-shrink-0 group">
              <div className="relative w-10 h-10">
                <Image src="/logo7.png" alt="HackaByte Logo" fill className="object-contain" priority />
              </div>
              <div className="flex flex-col">
                <motion.h1
                  className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-secondary text-xl font-black font-terminal tracking-wider"
                  whileHover={{ scale: 1.05 }}
                >
                  HACKABYTE
                </motion.h1>
                <div className="text-xs text-cyber-primary/70 font-terminal">{`>_ ${timeString}`}</div>
              </div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Main navigation items */}
            <nav className="flex items-center space-x-4">
              {menuItems.map((item) => (
                <Link href={item.path} key={item.name}>
                  <motion.div className="relative group" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <motion.div
                      className={`${
                        pathname === item.path ? "text-cyber-primary shadow-cyber" : "text-gray-300"
                      } group-hover:text-cyber-primary px-4 py-2 text-sm font-terminal font-semibold cursor-pointer tracking-wider uppercase`}
                    >
                      {pathname === item.path ? `[ ${item.name} ]` : item.name}
                    </motion.div>
                    <motion.div
                      className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-cyber-primary to-cyber-secondary group-hover:w-full transition-all duration-300"
                      initial={false}
                      animate={pathname === item.path ? { width: "100%" } : { width: "0%" }}
                    />
                  </motion.div>
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <motion.div className="md:hidden" whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)}>
            <div className="space-y-2 cursor-pointer">
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0, y: isOpen ? 8 : 0 }}
                className="block w-8 h-0.5 bg-gradient-to-r from-cyber-primary to-cyber-secondary"
              />
              <motion.span
                animate={{ opacity: isOpen ? 0 : 1 }}
                className="block w-8 h-0.5 bg-gradient-to-r from-cyber-primary to-cyber-secondary"
              />
              <motion.span
                animate={{ rotate: isOpen ? -45 : 0, y: isOpen ? -8 : 0 }}
                className="block w-8 h-0.5 bg-gradient-to-r from-cyber-primary to-cyber-secondary"
              />
            </div>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-black/90 backdrop-blur-lg border-y border-cyber-primary/30"
            >
              <nav className="px-2 pt-2 pb-3 space-y-3">
                {menuItems.map((item) => (
                  <Link href={item.path} key={item.name} onClick={() => setIsOpen(false)}>
                    <motion.div
                      whileHover={{ x: 10 }}
                      className={`${
                        pathname === item.path ? "text-cyber-primary shadow-cyber" : "text-gray-300"
                      } hover:text-cyber-primary px-3 py-2 text-base font-terminal flex items-center`}
                    >
                      <span className="text-cyber-primary opacity-60 mr-2">{">"}</span>
                      {item.name}
                    </motion.div>
                  </Link>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
