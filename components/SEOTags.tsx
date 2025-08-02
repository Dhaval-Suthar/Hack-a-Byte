"use client";

import Head from 'next/head';
import React from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noIndex?: boolean;
}

export default function SEOTags({
  title = "HackaByte 2025 | The Ultimate Cyber Challenge",
  description = "Join the elite cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge.",
  canonical = "https://hackabyte.games",
  ogImage = "https://hackabyte.games/banner.png",
  ogType = "website",
  twitterCard = "summary_large_image",
  noIndex = false,
}: SEOProps) {
  return (
    <Head>
      {/* Standard meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Robot control */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Preload key resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      
      {/* PWA tags */}
      <meta name="application-name" content="HackaByte" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      <meta name="apple-mobile-web-app-title" content="HackaByte" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
    </Head>
  );
}
