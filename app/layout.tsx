import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/app/ui/global.css";
import type { Metadata } from "next";
import { Noto_Sans_Tamil_Supplement } from "next/font/google";

const inter = Noto_Sans_Tamil_Supplement({ weight: "400", subsets: ["latin"] });

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
        {children} <Analytics /> <SpeedInsights />
      </body>
    </html>
  );
}
