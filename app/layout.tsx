import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
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
  title: "HackaByte 2025 | The Ultimate Cyber Challenge",
  description: "Join the elite cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge. Register now for HackaByte 2025!",
  keywords: ["hackathon", "cybersecurity", "hacking", "coding challenge", "security", "CTF", "cyber competition", "hacking competition", "ethical hacking", "security challenges"],
  authors: [{ name: "HackaByte Team" }],
  creator: "HackaByte",
  publisher: "HackaByte",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "Technology",
  applicationName: "HackaByte 2025",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hackabyte.games",
    title: "HackaByte 2025 | The Ultimate Cyber Challenge",
    description: "Join the elite cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge.",
    siteName: "HackaByte",
    images: [{
      url: "https://hackabyte.games/banner.png",
      width: 1200,
      height: 630,
      alt: "HackaByte 2025 - The Ultimate Cyber Challenge"
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HackaByte 2025 | The Ultimate Cyber Challenge",
    description: "Join the elite cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge.",
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
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">
            {children}
          </div>
        </div>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
