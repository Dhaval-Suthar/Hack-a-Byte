import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HackaByte 2024 | The Ultimate Cyber Challenge",
  description: "Join the elite cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge.",
  keywords: ["hackathon", "cybersecurity", "hacking", "coding challenge", "security"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
};

// This ensures our server components can use server-side auth while client components use client-side auth
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
