import HackBookE95Desktop from "@/components/hackbook-e95/desktop";
import { Metadata } from "next";
import { Suspense } from "react";
import BootAnimation from "@/components/hackbook-w95/boot-animation";

export const metadata: Metadata = {
  title: "Hackbook E95",
  description: "Windows 95-style essential interface for Hackbook",
};

export default async function Page() {
  return (
    <>
      <div className="w-screen h-screen fixed overflow-auto">
        <Suspense fallback={<BootAnimation />}>
          <HackBookE95Desktop />
        </Suspense>
      </div>
    </>
  );
}
