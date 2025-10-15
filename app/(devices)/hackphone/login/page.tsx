"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import HackPhoneBootScreen from "@/components/devices/hackphone/core/HackPhoneBootScreen";
import HackPhoneLoginScreen from "@/components/devices/hackphone/core/HackPhoneLoginScreen";

const LoginPage = () => {
  const router = useRouter(); // Keep one declaration of router
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [showSlideToUnlock, setShowSlideToUnlock] = useState(false);
  
  // Show boot animation on initial load, then show the simple lockscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBootScreen(false);
      setShowSlideToUnlock(true);
    }, 3000); // Show boot screen for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleSlideToUnlock = () => {
    // Immediately navigate to desktop when sliding.
    setTimeout(() => {
      router.push("/hackphone");
    }, 200);
  };
  if (showBootScreen) return <HackPhoneBootScreen />;

  return (
    <div className="w-screen h-screen">
      <HackPhoneLoginScreen onSlideToUnlock={showSlideToUnlock ? handleSlideToUnlock : undefined} />
    </div>
  );
};

const WrappedLoginPage = () => (
  <Suspense fallback={<HackPhoneBootScreen />}>
    <LoginPage />
  </Suspense>
);

export default WrappedLoginPage;
