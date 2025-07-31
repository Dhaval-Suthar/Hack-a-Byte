"use client";
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Sponsor {
  id: number;
  name: string;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze';
  logo: string;
  description: string;
  benefits?: string[];
  websiteUrl: string;
}

interface Hexagon {
  x: number;
  y: number;
  size: number;
  opacity: number;
  pulse: boolean;
}

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

// Terminal typing effect component
const TypingText = ({ text, speed = 20, className = "", onComplete = () => {} }: TypingTextProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text.charAt(index));
        setIndex(index + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (!completed) {
      setCompleted(true);
      onComplete();
    }
  }, [index, text, speed, completed, onComplete]);

  return <span className={className}>{displayedText}</span>;
};

export default function Page() {
  const [activeTab, setActiveTab] = useState('sponsors');
  const [activeTier, setActiveTier] = useState('all');
  const [showIntro, setShowIntro] = useState(true);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [scanlines, setScanlines] = useState(true);
  const [sponsorHexagons, setSponsorHexagons] = useState<Hexagon[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sponsor data
  const sponsors: Sponsor[] = [
    {
      id: 1,
      name: "NexusTech",
      tier: 'platinum',
      logo: "/logo.png",
      description: "Leading innovator in cybersecurity solutions with advanced threat detection systems.",
      benefits: ["Premium booth at event", "Main stage presentation", "VIP networking access", "First choice for mentoring opportunities"],
      websiteUrl: "#"
    },
    {
      id: 2,
      name: "CyberShield",
      tier: 'gold',
      logo: "/logo.png", 
      description: "Enterprise-level security infrastructure provider specializing in zero-day vulnerability protection.",
      benefits: ["Featured booth", "Workshop session", "Talent recruitment access"],
      websiteUrl: "#"
    },
    {
      id: 3,
      name: "QuantumBit",
      tier: 'gold',
      logo: "/logo.png",
      description: "Quantum computing research organization focused on encryption technologies.",
      benefits: ["Featured booth", "Panel discussion", "Networking event"],
      websiteUrl: "#"
    },
    {
      id: 4,
      name: "SecureNode",
      tier: 'silver',
      logo: "/logo.png",
      description: "Network security solutions for mid-size businesses and educational institutions.",
      benefits: ["Standard booth", "Logo on materials", "Participant data access"],
      websiteUrl: "#"
    },
    {
      id: 5,
      name: "CryptoGuard",
      tier: 'silver',
      logo: "/logo.png",
      description: "Blockchain security auditing and cryptocurrency protection services.",
      benefits: ["Standard booth", "Logo on materials", "Participant data access"],
      websiteUrl: "#"
    },
    {
      id: 6,
      name: "DataFortress",
      tier: 'silver',
      logo: "/logo.png",
      description: "Cloud storage security and data encryption solutions.",
      benefits: ["Standard booth", "Logo on materials"],
      websiteUrl: "#"
    },
    {
      id: 7,
      name: "ByteDefender",
      tier: 'bronze',
      logo: "/logo.png",
      description: "Malware detection tools and anti-phishing solutions.",
      benefits: ["Logo on materials", "Digital presence"],
      websiteUrl: "#"
    },
    {
      id: 8,
      name: "CodeLock",
      tier: 'bronze',
      logo: "/logo.png",
      description: "Source code security analysis and protection services.",
      benefits: ["Logo on materials", "Digital presence"],
      websiteUrl: "#"
    }
  ];

  useEffect(() => {
    // Hide intro after 3 seconds
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);
    
    // Toggle scanlines periodically for effect
    const scanlinesInterval = setInterval(() => {
      setScanlines(prev => !prev);
      setTimeout(() => setScanlines(true), 100);
    }, 5000);

    // Generate hexagon pattern for sponsors
    if (containerRef.current) {
      const generateHexagons = () => {
        const width = containerRef.current?.clientWidth || window.innerWidth;
        const height = containerRef.current?.clientHeight || window.innerHeight;
        
        const hexSize = Math.min(width, height) * 0.1; // Size relative to container
        const hexagons = [];
        
        // Create a grid of hexagons
        for (let row = 0; row < 8; row++) {
          for (let col = 0; col < 12; col++) {
            // Offset every other row
            const xOffset = row % 2 === 0 ? 0 : hexSize * 0.866; // cos(60°) * size
            
            hexagons.push({
              x: col * hexSize * 1.732 + xOffset, // sin(60°) * 2 = ~1.732
              y: row * hexSize * 1.5,
              size: hexSize,
              opacity: Math.random() * 0.4 + 0.1, // Random opacity
              pulse: Math.random() > 0.7 // Some hexagons will pulse
            });
          }
        }
        
        setSponsorHexagons(hexagons);
      };
      
      generateHexagons();
      window.addEventListener('resize', generateHexagons);
    }

    return () => {
      clearTimeout(introTimer);
      clearInterval(scanlinesInterval);
      window.removeEventListener('resize', () => {});
    };
  }, []);

  // Filter sponsors based on tier
  const filteredSponsors = activeTier === 'all' 
    ? sponsors 
    : sponsors.filter(sponsor => sponsor.tier === activeTier);

  const renderSponsorTierInfo = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return {
          color: 'from-cyber-primary to-cyber-secondary',
          label: 'PLATINUM SPONSOR',
          border: 'border-cyber-primary'
        };
      case 'gold':
        return {
          color: 'from-yellow-400 to-yellow-600',
          label: 'GOLD SPONSOR',
          border: 'border-yellow-500'
        };
      case 'silver':
        return {
          color: 'from-gray-300 to-gray-500',
          label: 'SILVER SPONSOR',
          border: 'border-gray-400'
        };
      default:
        return {
          color: 'from-amber-700 to-amber-900',
          label: 'BRONZE SPONSOR',
          border: 'border-amber-800'
        };
    }
  };

  const renderTabs = () => {
    return (
      <div className="flex justify-center mb-8">
        <div className="bg-black/70 border border-cyber-primary/30 rounded-lg p-1 backdrop-blur-sm">
          <div className="flex space-x-1">
            {['sponsors', 'packages', 'contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md transition-all ${
                  activeTab === tab 
                    ? "bg-cyber-primary/20 text-cyber-primary" 
                    : "text-gray-400 hover:text-cyber-primary hover:bg-cyber-primary/10"
                }`}
              >
                <div className="flex items-center">
                  <span className="text-xs mr-1 opacity-70">/</span> 
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {activeTab === tab && (
                    <span className="ml-2 w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderContactTab = () => {
    return (
      <div className="max-w-3xl mx-auto bg-black/60 border border-cyber-primary/30 rounded-lg p-6">
        <h2 className="text-2xl text-cyber-primary font-bold mb-4">Get in Touch</h2>
        <p className="text-gray-300 mb-6">
          Interested in sponsoring HackaByte? Our team is ready to create a custom package that 
          aligns with your goals and maximizes your visibility in the cybersecurity community.
        </p>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cyber-primary mb-1">COMPANY NAME</label>
              <input 
                type="text" 
                className="w-full bg-black/70 border border-cyber-primary/40 rounded px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-cyber-primary mb-1">CONTACT NAME</label>
              <input 
                type="text" 
                className="w-full bg-black/70 border border-cyber-primary/40 rounded px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-cyber-primary mb-1">EMAIL</label>
              <input 
                type="email" 
                className="w-full bg-black/70 border border-cyber-primary/40 rounded px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-cyber-primary mb-1">PHONE</label>
              <input 
                type="tel" 
                className="w-full bg-black/70 border border-cyber-primary/40 rounded px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-cyber-primary mb-1">MESSAGE</label>
            <textarea 
              rows={5}
              className="w-full bg-black/70 border border-cyber-primary/40 rounded px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
            ></textarea>
          </div>
          <div>
            <button type="submit" className="cyber-button py-2 px-8 rounded-md">
              SUBMIT REQUEST
            </button>
          </div>
        </form>
        <div className="mt-8 pt-6 border-t border-cyber-primary/20">
          <div className="text-xs text-cyber-primary mb-1">ALTERNATIVE CONTACT</div>
          <div className="text-gray-300">virexela@icloud.com</div>
        </div>
      </div>
    );
  };

  const renderSponsorModal = () => {
    if (!selectedSponsor) return null;
    
    const tierInfo = renderSponsorTierInfo(selectedSponsor.tier);
    
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-full max-w-2xl bg-black/90 border border-cyber-primary/60 rounded-lg overflow-hidden"
            initial={{ y: 20, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.9 }}
          >
            <div className={`bg-gradient-to-r ${tierInfo.color} px-4 py-2 flex justify-between items-center`}>
              <h3 className="font-bold text-black">{selectedSponsor.name}</h3>
              <button 
                onClick={() => setSelectedSponsor(null)}
                className="text-black hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 bg-cyber-primary/20 flex items-center justify-center rounded-full">
                  <span className="text-cyber-primary text-2xl font-bold">{selectedSponsor.name.substring(0, 2)}</span>
                </div>
              </div>
              
              <h4 className="text-xl text-cyber-primary font-bold mb-4">About {selectedSponsor.name}</h4>
              <p className="text-gray-300 mb-6">{selectedSponsor.description}</p>
              
              {selectedSponsor.benefits && (
                <>
                  <h4 className="text-lg text-cyber-secondary font-bold mb-2">Sponsorship Benefits</h4>
                  <ul className="list-disc pl-6 mb-6 space-y-1">
                    {selectedSponsor.benefits.map((benefit, index) => (
                      <li key={index} className="text-gray-300">{benefit}</li>
                    ))}
                  </ul>
                </>
              )}
              
              <div className="flex justify-end">
                <a 
                  href={selectedSponsor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cyber-button py-2 rounded-md"
                >
                  VISIT WEBSITE
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen w-full pt-20 relative">
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black opacity-95" />
        <div className="absolute inset-0 overflow-hidden" ref={containerRef}>
          {/* Hexagon grid */}
          <svg width="100%" height="100%" className="absolute top-0 left-0">
            <filter id="sponsor-glow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k1="0" k2="1" k3="0" k4="0" />
            </filter>
            
            <g filter="url(#sponsor-glow)">
              {sponsorHexagons.map((hex, i) => (
                <polygon 
                  key={i} 
                  points={`
                    ${hex.x},${hex.y + hex.size}
                    ${hex.x + hex.size * 0.866},${hex.y + hex.size * 0.5}
                    ${hex.x + hex.size * 0.866},${hex.y - hex.size * 0.5}
                    ${hex.x},${hex.y - hex.size}
                    ${hex.x - hex.size * 0.866},${hex.y - hex.size * 0.5}
                    ${hex.x - hex.size * 0.866},${hex.y + hex.size * 0.5}
                  `}
                  fill="rgba(0, 255, 65, 0.03)"
                  stroke="rgba(0, 255, 65, 0.2)"
                  strokeWidth="1"
                  className={hex.pulse ? "animate-pulse" : ""}
                  style={{ opacity: hex.opacity }}
                />
              ))}
            </g>
          </svg>
        </div>
        {scanlines && (
          <div className="absolute inset-0" style={{ 
            backgroundImage: "repeating-linear-gradient(transparent, transparent 2px, rgba(0, 0, 0, 0.5) 2px, rgba(0, 0, 0, 0.5) 4px)",
            backgroundSize: "100% 4px",
            opacity: 0.2,
          }} />
        )}
      </div>
      
      {/* Intro animation */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-md w-full px-8">
              <TypingText 
                text="> LOADING SPONSORSHIP DATABASE..." 
                className="text-cyber-primary font-mono text-xl"
                speed={20}
              />
              <div className="h-1 w-full bg-cyber-primary/20 mt-2 mb-4 relative overflow-hidden">
                <motion.div
                  className="absolute h-full bg-cyber-primary"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2 }}
                />
              </div>
              <TypingText 
                text="> AUTHENTICATING CORPORATE ACCESS..." 
                className="text-cyber-primary/80 font-mono"
                speed={15}
              />
              <TypingText 
                text="> ACCESS GRANTED. WELCOME." 
                className="text-cyber-primary font-mono mt-2"
                speed={20}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-2 rounded-sm">
              [SYSTEM:ALLIANCE]
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary">
              HACKABYTE SPONSORS
            </h1>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>CONNECTION:</span>
              <span className="text-cyber-primary">SECURE</span>
              <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></div>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {renderTabs()}

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'sponsors' && (
              <div>
                {/* Tier filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {['all', 'platinum', 'gold', 'silver', 'bronze'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setActiveTier(tier)}
                      className={`px-3 py-1 text-xs rounded-md transition-all uppercase ${
                        activeTier === tier
                          ? "bg-cyber-primary text-black font-bold"
                          : "bg-black/50 text-gray-300 border border-cyber-primary/30 hover:border-cyber-primary/70"
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>

                {/* Sponsors grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSponsors.map((sponsor) => {
                    const tierInfo = renderSponsorTierInfo(sponsor.tier);
                    
                    return (
                      <motion.div
                        key={sponsor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative bg-black/60 border border-cyber-primary/30 rounded-lg overflow-hidden group"
                        onClick={() => setSelectedSponsor(sponsor)}
                      >
                        <div className="absolute top-0 right-0 z-10">
                          <div className={`text-xs px-2 py-1 bg-gradient-to-r ${tierInfo.color} text-black font-bold`}>
                            {tierInfo.label}
                          </div>
                        </div>
                        
                        <div className="p-4">
                          <div className="h-20 w-full flex items-center justify-center mb-4 bg-black/50 rounded">
                            <div className="text-2xl font-bold text-cyber-primary">{sponsor.name}</div>
                          </div>
                          
                          <p className="text-sm text-gray-300 mb-4 line-clamp-2">{sponsor.description}</p>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-cyber-secondary">VIEW DETAILS</span>
                            <div className="w-8 h-8 rounded-full bg-cyber-primary/20 flex items-center justify-center group-hover:bg-cyber-primary/40 transition-colors">
                              <span className="text-cyber-primary">→</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-cyber-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
            {activeTab === 'packages' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl text-cyber-primary font-bold mb-2">Sponsorship Tiers</h2>
                  <p className="text-gray-300">Support the hacker community and gain exposure for your brand</p>
                </div>
                
                {/*
                [
                  { 
                    tier: 'Platinum Partner', 
                    price: '$15,000', 
                    color: 'from-cyber-primary to-cyber-secondary',
                    borderColor: 'cyber-primary',
                    features: [
                      'Premium booth in hacking arena',
                      'Main stage keynote opportunity (30 min)',
                      'Logo on all event materials (premium placement)',
                      'Social media promotion package',
                      'Access to participant resume database',
                      '8 VIP passes for team members',
                      'First choice for workshop sessions',
                      'Exclusive recruitment opportunities'
                    ]
                  },
                  { 
                    tier: 'Gold Sponsor', 
                    price: '$10,000', 
                    color: 'from-yellow-400 to-yellow-600',
                    borderColor: 'yellow-500',
                    features: [
                      'Large booth in main exhibition area',
                      'Workshop session opportunity (45 min)',
                      'Logo on event website and materials',
                      'Social media mentions',
                      '5 VIP passes for team members',
                      'Access to participant resume database',
                      'Participation in panel discussions'
                    ]
                  },
                  { 
                    tier: 'Silver Sponsor', 
                    price: '$5,000', 
                    color: 'from-gray-300 to-gray-500',
                    borderColor: 'gray-400',
                    features: [
                      'Standard booth in exhibition area',
                      'Logo on event website',
                      'Social media announcement',
                      '3 VIP passes for team members',
                      'Company description in event program'
                    ]
                  },
                  { 
                    tier: 'Bronze Supporter', 
                    price: '$2,500', 
                    color: 'from-amber-700 to-amber-900',
                    borderColor: 'amber-800',
                    features: [
                      'Small table in community area',
                      'Logo on event website',
                      'Company name in event program',
                      '2 VIP passes for team members'
                    ]
                  }
                ].map((package_, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`bg-black/60 border border-${package_.borderColor}/40 rounded-lg overflow-hidden`}
                  >
                    <div className={`bg-gradient-to-r ${package_.color} px-4 py-2 text-black font-bold`}>
                      {package_.tier}
                    </div>
                    
                    <div className="p-5">
                      <div className="text-3xl font-bold text-cyber-primary mb-4">{package_.price}</div>
                      
                      <div className="space-y-2 mb-6">
                        {package_.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start">
                            <div className="text-cyber-primary mr-2 mt-1">✓</div>
                            <div className="text-gray-300 text-sm">{feature}</div>
                          </div>
                        ))}
                      </div>
                      
                      <button className="cyber-button w-full py-2 rounded-md">BECOME SPONSOR</button>
                    </div>
                  </motion.div>
                ))}
                */}
              </div>
            )}
            {activeTab === 'contact' && renderContactTab()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Sponsor detail modal */}
      {renderSponsorModal()}
    </div>
  );
}
