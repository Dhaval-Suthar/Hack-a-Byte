export const eventSchema = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "HackaByte 2025",
  startDate: "2025-08-01",
  endDate: "2025-08-03",
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
  location: {
    "@type": "VirtualLocation",
    url: "https://hackabyte.games/event",
  },
  image: ["https://hackabyte.games/banner.png"],
  description:
    "Join the elite cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge.",
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is HackaByte?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HackaByte is the ultimate cyber challenge that tests your hacking skills, problem-solving abilities, and security knowledge.",
      },
    },
    {
      "@type": "Question",
      name: "How can I register for HackaByte 2025?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can register for HackaByte 2025 by visiting our event page and submitting the registration form.",
      },
    },
    {
      "@type": "Question",
      name: "Is HackaByte free to participate?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, HackaByte is free to participate. We believe in making cybersecurity education accessible to everyone.",
      },
    },
  ],
};

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
