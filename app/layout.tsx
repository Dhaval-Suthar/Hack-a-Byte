import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "@/app/ui/global.css";
import type { Metadata } from "next";
import { robotoMono } from "@/app/ui/fonts";

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
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${robotoMono.className} bg-zinc-900`}>
        {children} <Analytics /> <SpeedInsights />
      </body>
    </html>
  );
}
