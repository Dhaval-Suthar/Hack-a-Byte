"use client";

// Import React
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import the SentinelApp with no SSR
const SentinelApp = dynamic(
  () => import("@/components/devices/hackphone/apps/SentinelApp"),
  { ssr: false }
);

export default function SentinelAppPage() {
  const router = useRouter();
  
  // Get the time parameter from URL
  const time = typeof window !== 'undefined' ? 
    new URLSearchParams(window.location.search).get('time') || 
    new Date().toLocaleTimeString() : "";
  
  const handleClose = () => {
    // Navigate back to the hackphone
    router.push('/device-selection');
  };
  
  return (
    <SentinelApp onClose={handleClose} time={time} />
  );
}