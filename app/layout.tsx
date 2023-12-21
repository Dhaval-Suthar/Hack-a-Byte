// For Site Analytics
import { Analytics } from "@vercel/analytics/react";
// For Site Analytics

import "@/app/ui/global.css";
import type { Metadata } from "next";
import { PT_Mono } from "next/font/google";

const inter = PT_Mono({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hack a Byte",
  description: "Created by Virexela",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-zinc-900`}>
        {children} <Analytics />
      </body>
    </html>
  );
}
