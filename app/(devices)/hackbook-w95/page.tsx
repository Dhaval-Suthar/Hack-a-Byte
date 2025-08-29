import DesktopWithDevTools from "@/components/devices/hackbook-w95/DesktopWithDevTools";
import { Metadata } from "next";
import { Suspense } from "react";
import BootAnimation from "@/components/devices/hackbook-w95/boot-animation";

export const metadata: Metadata = {
  title: "Hackbook W95",
  description: "Windows 95-style interface for Hackbook",
};

export default async function Page() {
  return (
    <>
      <div className="w-screen h-screen fixed overflow-auto">
        <Suspense fallback={<BootAnimation />}>
          <DesktopWithDevTools />
        </Suspense>
      </div>
    </>
  );
}
