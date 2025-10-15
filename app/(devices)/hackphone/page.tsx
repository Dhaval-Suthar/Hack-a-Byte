import HackPhoneDesktop from "@/components/devices/hackphone/core/HackPhoneDesktop";
import { Metadata } from "next";
import { Suspense } from "react";
import HackPhoneBootScreen from "@/components/devices/hackphone/core/HackPhoneBootScreen";

export const metadata: Metadata = {
  title: "HackPhone",
  description: "iOS-inspired retro mobile hacking interface",
};

export default async function Page() {
  return (
    <>
      <div className="w-screen h-screen fixed overflow-hidden bg-black">
        <Suspense fallback={<HackPhoneBootScreen />}>
          <HackPhoneDesktop />
        </Suspense>
      </div>
    </>
  );
}
