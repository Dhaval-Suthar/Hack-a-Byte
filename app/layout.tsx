import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { SocketProvider } from '@/components/SocketProvider';
import GameTerminationListener from '@/components/GameTerminationListener';
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://hackabyte.games"),
  title: "CryptoHeist: Digital Warfare | Ultimate Cyber Competition",
  description: "Join the elite digital warfare tournament where teams battle to accumulate the highest bitcoin balance. Experience intense PvP combat with AI opponents, strategic roles, and high-stakes bank heists!",
  keywords: ["cryptoheist", "cybersecurity", "digital warfare", "bitcoin", "hacking", "pvp", "tournament", "ai bots", "cyber competition", "ethical hacking", "blockchain"],
  authors: [{ name: "CryptoHeist Team" }],
  creator: "CryptoHeist",
  publisher: "CryptoHeist",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "Technology",
  applicationName: "CryptoHeist: Digital Warfare",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hackabyte.games",
    title: "CryptoHeist: Digital Warfare | Ultimate Cyber Competition",
    description: "Join the elite digital warfare tournament where teams battle to accumulate the highest bitcoin balance. Experience intense PvP combat with AI opponents!",
    siteName: "CryptoHeist",
    images: [{
      url: "https://hackabyte.games/banner.png",
      width: 1200,
      height: 630,
      alt: "CryptoHeist: Digital Warfare - Ultimate Cyber Competition"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoHeist: Digital Warfare | Ultimate Cyber Competition",
    description: "Join the elite digital warfare tournament where teams battle to accumulate the highest bitcoin balance. Experience intense PvP combat with AI opponents!",
    images: ["https://hackabyte.games/banner.png"],
    creator: "@hackabyte",
    site: "@hackabyte",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: "https://hackabyte.games",
    languages: {
      'en-US': "https://hackabyte.games",
    },
  },
  verification: {
    google: "google-site-verification-code", // Replace with your verification code
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://hackabyte.games" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: `{
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "HackaByte",
              "url": "https://hackabyte.games",
              "logo": "https://hackabyte.games/logo1.png",
              "description": "The Ultimate Cyber Challenge - Test your hacking skills, problem-solving abilities, and security knowledge",
              "event": {
                "@type": "Event",
                "name": "HackaByte 2025",
                "startDate": "2025-08-01",
                "endDate": "2025-08-03",
                "location": {
                  "@type": "Place",
                  "name": "Virtual Event"
                },
                "description": "Join the elite cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "USD",
                  "availability": "https://schema.org/InStock"
                }
              }
            }`
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SocketProvider>
          <GameTerminationListener />
          <div className="min-h-screen flex flex-col">
            <div className="flex-grow">
              {children}
            </div>
          </div>
        </SocketProvider>
        <Script
          src="https://sdk.cashfree.com/js/v3/cashfree.js"
          strategy="lazyOnload"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
