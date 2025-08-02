import { Metadata } from 'next';

// Event page metadata
export const metadata: Metadata = {
  title: 'HackaByte 2025 Events | Cyber Security Competitions',
  description: 'Browse and register for HackaByte 2025 cyber security competitions, workshops, and challenges. Join the elite hacking competition!',
  keywords: ['cybersecurity events', 'hacking competitions', 'security workshops', 'CTF events', 'HackaByte competitions'],
  openGraph: {
    title: 'HackaByte 2025 Events | Cyber Security Competitions',
    description: 'Browse and register for HackaByte 2025 cyber security competitions, workshops, and challenges. Join the elite hacking competition!',
    url: 'https://hackabyte.games/event',
    images: [{
      url: 'https://hackabyte.games/banner.png',
      width: 1200,
      height: 630,
      alt: 'HackaByte 2025 Events'
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HackaByte 2025 Events',
    description: 'Browse and register for HackaByte 2025 cyber security competitions, workshops, and challenges.',
    images: ['https://hackabyte.games/banner.png'],
  },
};

// This is needed for RSC (React Server Components)
export default function EventsPageMetadata() {
  return null;
}
