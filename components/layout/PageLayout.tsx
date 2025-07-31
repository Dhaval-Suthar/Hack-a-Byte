"use client";

import React from "react";
import Header from "@/components/layout/Header";
import { motion } from "framer-motion";

interface PageLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  className?: string;
  animateContent?: boolean;
}

export default function PageLayout({
  children,
  showHeader = true,
  className = "",
  animateContent = true,
}: PageLayoutProps) {
  return (
    <>
      {showHeader && <Header />}
      <main className={` min-h-screen ${className}`}>
        {animateContent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        ) : (
          children
        )}
      </main>
    </>
  );
}
