"use client";

import React, { useEffect, useState } from "react";
import BootAnimation from "@/components/hackbook-w95/boot-animation";

// Import the modified desktop for E95
import HackBookE95DesktopCore from "./desktop-core";

export default function HackBookE95Desktop() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate boot time and check auth
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <BootAnimation />;
  }

  return <HackBookE95DesktopCore />;
}
