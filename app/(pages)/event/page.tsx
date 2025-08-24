"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { registerForEvent, getAllEventsWithRegistrationCounts } from "@/app/actions/eventRegistration";
import { createEventPaymentOrder, verifyEventPayment } from "@/app/actions/payment";
import { useRouter } from "next/navigation";

// Razorpay type declarations
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    email: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open(): void;
    };
  }
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  type: string;
  capacity: number;
  registered: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  tags: string[];
  speakers?: {
    name: string;
    role: string;
    company: string;
    avatar: number;
  }[];
  prizes?: {
    position: string;
    reward: string;
  }[];
  schedule?: {
    time: string;
    activity: string;
  }[];
}

// Terminal typing effect component
interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, text, speed, completed]); // Removed onComplete to prevent potential infinite loop

  return <span className={className}>{displayedText}</span>;
};

// Countdown timer component
interface CountdownTimerProps {
  targetDate: string;
}

const CountdownTimer = ({ targetDate }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  useEffect(() => {
    const calcTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    
    calcTimeLeft();
    const timer = setInterval(calcTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);
  
  return (
    <div className="flex justify-center space-x-4">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-cyber-primary relative">
            <div className="absolute inset-0 animate-pulse opacity-50 blur-sm bg-cyber-primary rounded-lg"></div>
            <div className="relative z-10">
              {value.toString().padStart(2, '0')}
            </div>
          </div>
          <div className="text-xs uppercase text-gray-400 mt-1">{unit}</div>
        </div>
      ))}
    </div>
  );
};

// Interactive difficulty meter component
interface DifficultyMeterProps {
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

const DifficultyMeter = ({ level }: DifficultyMeterProps) => {
  const difficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];
  const levelIndex = difficultyLevels.indexOf(level);
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">Difficulty</span>
        <span className="text-cyber-primary">{level}</span>
      </div>
      <div className="flex space-x-1">
        {difficultyLevels.map((_, index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index <= levelIndex 
                ? "bg-gradient-to-r from-cyber-primary to-cyber-secondary" 
                : "bg-gray-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Registration Modal Component
interface RegistrationModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RegistrationModal = ({ event, isOpen, onClose, onSuccess }: RegistrationModalProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [playingDevice, setPlayingDevice] = useState<"smartphone" | "pc_laptop">("pc_laptop");
  const [numberOfPlayers, setNumberOfPlayers] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      // For Mosaic event (ID 100), use payment flow
      if (event.id === 100) {
        // Create payment order
        const orderResult = await createEventPaymentOrder({
          eventId: event.id,
          email: email.trim(),
          playingDevice,
          numberOfPlayers
        });

        if (!orderResult.success) {
          setError(orderResult.error || "Failed to create payment order");
          setIsLoading(false);
          return;
        }

        // Initialize Razorpay payment
        const options: RazorpayOptions = {
          key: orderResult.key || '',
          amount: orderResult.amount || 0,
          currency: orderResult.currency || 'INR',
          name: "Hack-a-Byte 2025",
          description: `Registration for ${event.title}`,
          order_id: orderResult.orderId || '',
          handler: async function (response: RazorpayResponse) {
            try {
              // Verify payment
              const verifyResult = await verifyEventPayment(
                orderResult.registrationId,
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                },
                {
                  eventId: event.id,
                  eventTitle: event.title,
                  eventDate: event.date,
                  eventTime: event.time,
                  eventLocation: event.location
                }
              );

              if (verifyResult.success) {
                onSuccess();
                onClose();
                // Reset form
                setEmail("");
                setPlayingDevice("pc_laptop");
                setNumberOfPlayers(1);
                // Redirect user to home page to enter access code
                router.push("/");
              } else {
                setError(verifyResult.error || "Payment verification failed");
              }
            } catch (error) {
              console.error("Payment verification error:", error);
              setError("Payment verification failed. Please contact support.");
            }
            setIsLoading(false);
          },
          prefill: {
            email: email.trim(),
          },
          theme: {
            color: "#00ff88"
          },
          modal: {
            ondismiss: function() {
              setIsLoading(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        // For other events, use the original flow
        const result = await registerForEvent({
          eventId: event.id,
          email: email.trim(),
          playingDevice,
          numberOfPlayers
        });
        
        if (result.success) {
          onSuccess();
          onClose();
          // Reset form
          setEmail("");
          setPlayingDevice("pc_laptop");
          setNumberOfPlayers(1);
          // Redirect user to home page to enter access code
          router.push("/");
        } else {
          setError(result.error || "Registration failed");
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPlayingDevice("pc_laptop");
    setNumberOfPlayers(1);
    setError("");
    onClose();
  };

  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div 
          className="w-full max-w-md bg-black/90 border border-cyber-primary/60 rounded-lg overflow-hidden"
          initial={{ y: 20, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 20, scale: 0.9 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-cyber-primary/20 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-cyber-primary">
              Register for Event
            </h2>
            <button 
              onClick={handleClose}
              className="text-cyber-primary hover:text-cyber-secondary transition-colors"
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
          
          {/* Event Info */}
          <div className="px-6 py-4 border-b border-cyber-primary/30">
            <h3 className="text-white font-bold mb-1 flex items-center">
              <svg className="w-5 h-5 mr-2 text-cyber-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {event.title}
            </h3>
            <div className="text-sm text-gray-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {event.date}
              <span className="mx-2">•</span>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {event.time}
            </div>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="flex items-center text-cyber-secondary text-sm font-bold mb-2">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/70 border border-cyber-primary/40 rounded-md px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
                placeholder="Enter your email address"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-6">
              <label className="flex items-center text-cyber-secondary text-sm font-bold mb-2">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5l1.5 2H14a1 1 0 110 2H6a1 1 0 110-2h1.5L9 13H4a1 1 0 01-1-1V4zm1 1v6h12V5H4z" clipRule="evenodd" />
                </svg>
                Playing Device
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="smartphone"
                    checked={playingDevice === "smartphone"}
                    onChange={(e) => setPlayingDevice(e.target.value as "smartphone" | "pc_laptop")}
                    className="w-4 h-4 text-cyber-primary bg-black/70 border-cyber-primary/40 focus:ring-cyber-primary/50 focus:ring-2"
                    disabled={isLoading}
                  />
                  <span className="text-white text-sm">
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 4a1 1 0 011-1h6a1 1 0 011 1v10H6V4z" clipRule="evenodd" />
                    </svg>
                    Smartphone
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    value="pc_laptop"
                    checked={playingDevice === "pc_laptop"}
                    onChange={(e) => setPlayingDevice(e.target.value as "smartphone" | "pc_laptop")}
                    className="w-4 h-4 text-cyber-primary bg-black/70 border-cyber-primary/40 focus:ring-cyber-primary/50 focus:ring-2"
                    disabled={isLoading}
                  />
                  <span className="text-white text-sm">
                    <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5l1.5 2H14a1 1 0 110 2H6a1 1 0 110-2h1.5L9 13H4a1 1 0 01-1-1V4zm1 1v6h12V5H4z" clipRule="evenodd" />
                    </svg>
                    PC/Laptop
                  </span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center text-cyber-secondary text-sm font-bold mb-2">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                Number of Players (1-4)
              </label>
              <select
                value={numberOfPlayers}
                onChange={(e) => setNumberOfPlayers(parseInt(e.target.value))}
                className="w-full bg-black/70 border border-cyber-primary/40 rounded-md px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
                required
                disabled={isLoading}
              >
                <option value={1}>1 Player</option>
                <option value={2}>2 Players</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
              </select>
            </div>

            {/* Fee Display for Mosaic Event */}
            {event.id === 100 && (
              <div className="mb-6 p-4 bg-cyber-primary/10 border border-cyber-primary/40 rounded-md">
                <h4 className="text-cyber-primary font-bold mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M15 7a1 1 0 011 1v5a1 1 0 01-1 1H6a1 1 0 01-1-1V8a1 1 0 011-1h9zM6 8v5h9V8H6z" clipRule="evenodd" />
                  </svg>
                  Registration Fee
                </h4>
                <div className="text-white text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-cyber-secondary">Per Person: </span>
                    <span className="text-cyber-primary font-bold">₹100</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-cyber-secondary">Total ({numberOfPlayers} player{numberOfPlayers > 1 ? 's' : ''}): </span>
                    <span className="text-cyber-primary font-bold text-lg">₹{numberOfPlayers * 100}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Secure payment via Razorpay
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-black/50 text-gray-300 border border-cyber-primary/30 hover:border-cyber-primary/70 py-2 px-4 rounded-md transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 cyber-button py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : (event.id === 100 ? "Pay & Register" : "Register")}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function Page() {
  const [showIntro, setShowIntro] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTab, setSelectedTab] = useState("info");
  const [activeView, setActiveView] = useState("upcoming");
  const [scanlines, setScanlines] = useState(true);
  const [eventQuery, setEventQuery] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [registrationCounts, setRegistrationCounts] = useState<Record<number, number>>({});
  const [registrationModal, setRegistrationModal] = useState<{
    isOpen: boolean;
    event: Event | null;
  }>({ isOpen: false, event: null });

  const today = new Date();
  const currentDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  // Sample event data
  // Note: Using future dates since the context mentioned the current date is May 10, 2025
  const events: Event[] = [
    {
      id: 100,
      title: "Mosaic 2025",
      date: "2025-09-19",
      time: "09:00 - 17:00 (19th & 20th September)",
      location: "Offline (ST. FRANCIS INSTITUTE OF TECHNOLOGY (ENGG. COLLEGE), Mount Poinsur, S.V.P. Road, Borivali (West), Mumbai 400 103)",
      description:
        "Mosaic is a two-day cybersecurity competition open to all online, with an exclusive offline experience for SFIT college students. Prize pool for top performers! Offline participants (SFIT only) need just their mobile; online participants need a computer.",
      type: "Competition",
      capacity: 500,
      registered: 0,
      difficulty: "Intermediate",
      tags: ["Cybersecurity", "Competition", "Hybrid", "SFIT", "Prize Pool"],
      prizes: [
        { position: "Prize Pool", reward: "Exciting rewards for top performers (details announced at event)" }
      ],
      schedule: [
        { time: "09:00", activity: "Opening Ceremony & Welcome (Day 1)" },
        { time: "09:30", activity: "Competition Kickoff (Online & Offline)" },
        { time: "13:00", activity: "Lunch Break (Offline)" },
        { time: "14:00", activity: "Competition Continues" },
        { time: "17:00", activity: "Day End & Announcements" },
        { time: "09:00 (20th)", activity: "Day 2 Kickoff & Competition" },
        { time: "13:00 (20th)", activity: "Lunch Break (Offline)" },
        { time: "14:00 (20th)", activity: "Final Rounds & Judging" },
        { time: "17:00 (20th)", activity: "Prize Distribution & Closing" }
      ],
      speakers: [
        { name: "Prof. A. Fernandes", role: "Event Chair", company: "SFIT", avatar: 1 },
        { name: "Industry Expert", role: "Guest Speaker", company: "TBA", avatar: 2 }
      ]
    },
    {
      id: 1,
      title: "Crypto Challenge 2025",
      date: "2025-05-25",
      time: "10:00 - 18:00",
      location: "Online | Global",
      description: "Test your cryptography skills in this intensive challenge covering classical and modern encryption techniques. Compete against the best code-breakers in the world in a series of timed challenges.",
      type: "Competition",
      capacity: 500,
      registered: 347,
      difficulty: "Advanced",
      tags: ["Cryptography", "Security", "Algorithms"],
      prizes: [
        { position: "1st Place", reward: "$5,000 + Job Interview with NexusTech" },
        { position: "2nd Place", reward: "$2,500 + Security Certification Voucher" },
        { position: "3rd Place", reward: "$1,000 + Premium Security Tools Bundle" }
      ],
      schedule: [
        { time: "10:00", activity: "Welcome & Introduction" },
        { time: "10:30", activity: "Challenge Release: Classical Ciphers" },
        { time: "12:30", activity: "Break" },
        { time: "13:30", activity: "Challenge Release: Modern Encryption" },
        { time: "16:30", activity: "Final Challenge: Quantum Resistant Algorithms" },
        { time: "17:45", activity: "Winners Announcement" }
      ],
      speakers: [
        { name: "Dr. Elena Rossi", role: "Lead Cryptographer", company: "QuantumBit", avatar: 2 },
        { name: "Marcus Chen", role: "Security Researcher", company: "NexusTech", avatar: 3 }
      ]
    },
    {
      id: 2,
      title: "Network Security Hackathon",
      date: "2025-06-02",
      time: "09:00 - 20:00",
      location: "Hybrid | San Francisco & Online",
      description: "Build and defend network infrastructure against real-time attacks. Teams will construct secure environments and then attempt to breach other teams' defenses while maintaining their own.",
      type: "Team Hackathon",
      capacity: 200,
      registered: 172,
      difficulty: "Expert",
      tags: ["Network", "Defense", "Penetration Testing"],
      prizes: [
        { position: "Winning Team", reward: "$10,000 + Security Conference VIP Passes" },
        { position: "Best Defense", reward: "$3,000 + Security Hardware Package" },
        { position: "Best Offense", reward: "$3,000 + Advanced Training Course Access" }
      ],
      schedule: [
        { time: "09:00", activity: "Team Check-in & Setup" },
        { time: "10:00", activity: "Network Building Phase" },
        { time: "13:00", activity: "Lunch Break" },
        { time: "14:00", activity: "Attack & Defense Phase Begins" },
        { time: "19:00", activity: "Attack & Defense Phase Ends" },
        { time: "19:30", activity: "Results & Awards Ceremony" }
      ],
      speakers: [
        { name: "Alexandra Kim", role: "Network Security Lead", company: "CyberShield", avatar: 4 },
        { name: "James Rodriguez", role: "Ethical Hacker", company: "ByteDefender", avatar: 3 }
      ]
    },
    {
      id: 3,
      title: "AI Defense Workshop",
      date: "2025-06-12",
      time: "13:00 - 17:00",
      location: "Online | Global",
      description: "Learn how to protect systems from AI-powered attacks and implement defensive AI algorithms. This hands-on workshop will cover the latest techniques in AI security.",
      type: "Workshop",
      capacity: 150,
      registered: 89,
      difficulty: "Intermediate",
      tags: ["Artificial Intelligence", "Machine Learning", "Defense"],
      schedule: [
        { time: "13:00", activity: "Introduction to AI Security Challenges" },
        { time: "13:45", activity: "Identifying AI-based Attacks" },
        { time: "14:30", activity: "Break" },
        { time: "15:00", activity: "Defensive AI Implementation Lab" },
        { time: "16:30", activity: "Q&A Session" }
      ],
      speakers: [
        { name: "Dr. Sarah Johnson", role: "AI Research Director", company: "SecureNode", avatar: 2 }
      ]
    },
    {
      id: 4,
      title: "Blockchain Security Summit",
      date: "2025-06-28",
      time: "10:00 - 18:00",
      location: "Tokyo & Online",
      description: "Explore blockchain vulnerabilities and security measures. From smart contract auditing to decentralized security architectures, this summit covers the latest in blockchain protection.",
      type: "Conference",
      capacity: 300,
      registered: 185,
      difficulty: "Intermediate",
      tags: ["Blockchain", "Smart Contracts", "DeFi"],
      schedule: [
        { time: "10:00", activity: "Keynote: The Future of Blockchain Security" },
        { time: "11:00", activity: "Smart Contract Vulnerability Panel" },
        { time: "12:30", activity: "Networking Lunch" },
        { time: "14:00", activity: "Workshop: Auditing Techniques" },
        { time: "16:00", activity: "Case Studies: Major Blockchain Breaches" },
        { time: "17:30", activity: "Closing Remarks & Networking" }
      ],
      speakers: [
        { name: "Hiroshi Tanaka", role: "Blockchain Security Expert", company: "CryptoGuard", avatar: 3 },
        { name: "Anika Patel", role: "Smart Contract Auditor", company: "DataFortress", avatar: 2 }
      ]
    },
    {
      id: 5,
      title: "IoT Security Challenge",
      date: "2025-07-15",
      time: "11:00 - 19:00",
      location: "Online | Global",
      description: "Identify and exploit vulnerabilities in simulated Internet of Things environments. This challenge tests your ability to secure interconnected devices and sensors.",
      type: "Competition",
      capacity: 250,
      registered: 98,
      difficulty: "Advanced",
      tags: ["IoT", "Embedded Systems", "Hardware"],
      prizes: [
        { position: "1st Place", reward: "$3,000 + IoT Security Kit" },
        { position: "2nd Place", reward: "$1,500 + Smart Home Security Package" },
        { position: "3rd Place", reward: "$750 + IoT Development Board Bundle" }
      ]
    },
    {
      id: 6,
      title: "Threat Intelligence Masterclass",
      date: "2025-04-05",
      time: "09:00 - 16:00",
      location: "Berlin & Online",
      description: "Enhance your ability to collect, analyze and utilize threat intelligence. This masterclass teaches advanced techniques for identifying and responding to emerging threats.",
      type: "Training",
      capacity: 100,
      registered: 100,
      difficulty: "Expert",
      tags: ["Threat Intel", "Analysis", "Response"],
      schedule: [
        { time: "09:00", activity: "Intelligence Collection Methodologies" },
        { time: "11:00", activity: "Data Analysis Techniques" },
        { time: "13:00", activity: "Lunch Break" },
        { time: "14:00", activity: "Practical Application Workshop" },
        { time: "15:30", activity: "Integration with Security Operations" }
      ]
    }
  ];
  
  // Create events with real registration counts
  const eventsWithCounts = events.map(event => ({
    ...event,
    registered: registrationCounts[event.id] || 0
  }));
  
  // Filter events based on the selected view
  const filteredEvents = eventsWithCounts.filter(event => {
    // Filter by date
    const isPast = new Date(event.date) < new Date(currentDate);
    if (activeView === "upcoming" && isPast) return false;
    if (activeView === "past" && !isPast) return false;
    
    // Filter by search query
    if (eventQuery) {
      const query = eventQuery.toLowerCase();
      return (
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query)) ||
        event.type.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Sort events: upcoming events by date (ascending), past events by date (descending)
  filteredEvents.sort((a, b) => {
    if (activeView === "upcoming") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

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

    return () => {
      clearTimeout(introTimer);
      clearInterval(scanlinesInterval);
    };
  }, []);

  // Fetch registration counts on component mount
  useEffect(() => {
    const fetchRegistrationCounts = async () => {
      try {
        const result = await getAllEventsWithRegistrationCounts();
        if (result.success) {
          const counts: Record<number, number> = {};
          Object.entries(result.registrationCounts).forEach(([eventId, data]) => {
            counts[parseInt(eventId)] = data.total;
          });
          setRegistrationCounts(counts);
        }
      } catch (error) {
        console.error("Failed to fetch registration counts:", error);
      }
    };

    fetchRegistrationCounts();
  }, []);

  const handleRegister = (event: Event) => {
    // Always allow registration (multiple registrations per email allowed)
    setRegistrationModal({ isOpen: true, event });
  };

  const handleRegistrationSuccess = () => {
    if (registrationModal.event) {
      // Increment the registration count for this event
      setRegistrationCounts(prev => ({
        ...prev,
        [registrationModal.event!.id]: (prev[registrationModal.event!.id] || 0) + 1
      }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const closeRegistrationModal = () => {
    setRegistrationModal({ isOpen: false, event: null });
  };

  const renderEventCard = (event: Event) => {
    const isPast = new Date(event.date) < new Date(currentDate);
    
    return (
      <motion.div 
        key={event.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-black/60 rounded-lg overflow-hidden border border-cyber-primary/30 hover:border-cyber-primary/60 transition-all duration-300 group"
      >
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-cyber-primary group-hover:text-cyber-secondary transition-colors">
              {event.title}
            </h3>
            <div className="bg-cyber-primary/10 rounded px-2 py-1 text-xs text-cyber-secondary">
              {event.type}
            </div>
          </div>
          
          <div className="flex items-center mb-4 text-xs text-gray-400 space-x-3">
            <div className="flex items-center">
              <span className="mr-1">📅</span> {event.date}
            </div>
            <div className="flex items-center">
              <span className="mr-1">🕒</span> {event.time}
            </div>
            <div className="flex items-center">
              <span className="mr-1">📍</span> {event.location}
            </div>
          </div>
          
          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-4">
            {event.tags.map((tag: string, index: number) => (
              <span
                key={index}
                className="bg-black/50 text-cyber-primary text-xs px-2 py-1 rounded border border-cyber-primary/40"
              >
                {tag}
              </span>
            ))}
          </div>
          
          <DifficultyMeter level={event.difficulty} />
          
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-400">
              <span className="text-cyber-secondary">{event.registered}</span>/{event.capacity} registered
            </div>
            
            <div className="flex space-x-2">
              {/*
              <button 
                className="cyber-button text-xs py-1 px-3 rounded-md"
                onClick={() => setSelectedEvent(event)}
              >
                DETAILS
              </button>
              */}
              {!isPast && (
                <button 
                  className="text-xs py-1 px-3 rounded-md transition-all duration-300 relative overflow-hidden group bg-black/50 text-gray-300 border border-cyber-primary/30 hover:border-cyber-primary hover:text-cyber-primary hover:bg-cyber-primary/10 hover:shadow-lg hover:shadow-cyber-primary/20 hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRegister(event);
                  }}
                >
                  <span className="relative z-10">REGISTER</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Progress bar for registration */}
        <div className="w-full h-1 bg-gray-800">
          <div 
            className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary"
            style={{ width: `${(event.registered / event.capacity) * 100}%` }}
          />
        </div>
      </motion.div>
    );
  };

  const renderEventDetailsModal = () => {
    if (!selectedEvent) return null;
    
    return (
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-full max-w-4xl bg-black/90 border border-cyber-primary/60 rounded-lg overflow-hidden my-8"
            initial={{ y: 20, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, scale: 0.9 }}
          >
            {/* Header */}
            <div className="bg-cyber-primary/20 px-6 py-4 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-cyber-primary">
                  {selectedEvent.title}
                </h2>
                <div className="flex flex-wrap items-center text-sm text-gray-400 mt-1 gap-x-4 gap-y-1">
                  <div className="flex items-center">
                    <span className="mr-1">📅</span> {selectedEvent.date}
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">🕒</span> {selectedEvent.time}
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">📍</span> {selectedEvent.location}
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">🏆</span> {selectedEvent.type}
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-cyber-primary hover:text-cyber-secondary"
              >
                ✕
              </button>
            </div>
            
            {/* Tabs */}
            <div className="bg-black/70 px-6 border-b border-cyber-primary/30">
              <div className="flex space-x-4 -mb-px">
                {["info", "schedule", "speakers", "prizes"].map((tab) => (
                  <button
                    key={tab}
                    className={`py-3 px-4 border-b-2 text-sm transition-colors ${
                      selectedTab === tab
                        ? "border-cyber-primary text-cyber-primary"
                        : "border-transparent text-gray-400 hover:text-gray-300 hover:border-cyber-primary/30"
                    }`}
                    onClick={() => setSelectedTab(tab)}
                    disabled={tab === "schedule" && !selectedEvent.schedule || 
                              tab === "speakers" && !selectedEvent.speakers || 
                              tab === "prizes" && !selectedEvent.prizes}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Tab content */}
            <div className="p-6">
              {selectedTab === "info" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-gray-300 mb-6">{selectedEvent.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/50 border border-cyber-primary/30 rounded-lg p-4">
                      <h3 className="text-cyber-secondary text-lg font-bold mb-3">Event Details</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Event Type</span>
                          <span className="text-white">{selectedEvent.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Difficulty</span>
                          <span className="text-cyber-primary">{selectedEvent.difficulty}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Capacity</span>
                          <span className="text-white">{selectedEvent.capacity} participants</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Registered</span>
                          <span className="text-cyber-secondary">{selectedEvent.registered} participants</span>
                        </div>
                        
                        <div className="pt-2">
                          <div className="text-xs text-gray-400 flex justify-between mb-1">
                            <span>Registration Status</span>
                            <span>{selectedEvent.registered}/{selectedEvent.capacity}</span>
                          </div>
                          <div className="w-full h-2 bg-black rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary"
                              style={{ width: `${(selectedEvent.registered / selectedEvent.capacity) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/50 border border-cyber-primary/30 rounded-lg p-4">
                      <h3 className="text-cyber-secondary text-lg font-bold mb-3">Skills & Requirements</h3>
                      
                      <div className="mb-4">
                        <DifficultyMeter level={selectedEvent.difficulty} />
                      </div>
                      
                      <h4 className="text-white text-sm font-bold mb-2">Required Knowledge</h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedEvent.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="bg-black/50 text-cyber-primary text-xs px-2 py-1 rounded border border-cyber-primary/40"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="border-t border-cyber-primary/20 pt-4 mt-4">
                        <h4 className="text-white text-sm font-bold mb-2">Equipment Needed</h4>
                        <ul className="text-gray-300 text-sm space-y-1 list-disc pl-5">
                          <li>Personal computer with secure internet connection</li>
                          <li>Required software (provided upon registration)</li>
                          {selectedEvent.type.includes("Hackathon") && (
                            <li>Team collaboration tools</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {new Date(selectedEvent.date) > new Date(currentDate) && (
                    <div className="mt-6 bg-black/50 border border-cyber-primary/30 rounded-lg p-4">
                      <h3 className="text-cyber-secondary text-lg font-bold mb-3 text-center">Time Remaining</h3>
                      <CountdownTimer targetDate={selectedEvent.date} />
                    </div>
                  )}
                </motion.div>
              )}
              
              {selectedTab === "schedule" && selectedEvent.schedule && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="text-cyber-secondary text-lg font-bold mb-4">Event Schedule</h3>
                  
                  <div className="space-y-4">
                    {selectedEvent.schedule.map((item, index) => (
                      <motion.div 
                        key={index}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-black/50 border border-cyber-primary/30 rounded-lg p-4 flex items-center"
                      >
                        <div className="w-20 font-mono text-cyber-primary border-r border-cyber-primary/30 pr-3">
                          {item.time}
                        </div>
                        <div className="ml-4 text-white">{item.activity}</div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {selectedTab === "speakers" && selectedEvent.speakers && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="text-cyber-secondary text-lg font-bold mb-4">Featured Speakers</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedEvent.speakers.map((speaker, index) => (
                      <motion.div 
                        key={index}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-black/50 border border-cyber-primary/30 rounded-lg p-4 flex items-center"
                      >
                        <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center text-cyber-primary text-xl font-bold">
                          {speaker.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-white font-bold">{speaker.name}</div>
                          <div className="text-cyber-secondary text-sm">{speaker.role}</div>
                          <div className="text-gray-400 text-xs">{speaker.company}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {selectedTab === "prizes" && selectedEvent.prizes && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <h3 className="text-cyber-secondary text-lg font-bold mb-4">Event Prizes</h3>
                  
                  <div className="space-y-4">
                    {selectedEvent.prizes.map((prize, index) => {
                      let borderColor, bgGradient, textColor;
                      
                      switch (index) {
                        case 0:
                          borderColor = "border-yellow-500";
                          bgGradient = "from-yellow-500/20 to-transparent";
                          textColor = "text-yellow-500";
                          break;
                        case 1:
                          borderColor = "border-gray-400";
                          bgGradient = "from-gray-400/20 to-transparent";
                          textColor = "text-gray-400";
                          break;
                        case 2:
                          borderColor = "border-amber-700";
                          bgGradient = "from-amber-700/20 to-transparent";
                          textColor = "text-amber-700";
                          break;
                        default:
                          borderColor = "border-cyber-primary/30";
                          bgGradient = "from-cyber-primary/20 to-transparent";
                          textColor = "text-cyber-primary";
                      }
                      
                      return (
                        <motion.div 
                          key={index}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`bg-gradient-to-r ${bgGradient} border ${borderColor} rounded-lg p-4`}
                        >
                          <div className={`${textColor} font-bold mb-1`}>{prize.position}</div>
                          <div className="text-white">{prize.reward}</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Footer */}
            <div className="bg-black/50 border-t border-cyber-primary/30 px-6 py-4 flex justify-between">
              {new Date(selectedEvent.date) > new Date(currentDate) && (
                <button 
                  className="cyber-button py-2 px-6 rounded-md transition-all duration-300 relative overflow-hidden group hover:shadow-lg hover:shadow-cyber-primary/20 hover:scale-105"
                  onClick={() => handleRegister(selectedEvent)}
                >
                  <span className="relative z-10">REGISTER NOW</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                </button>
              )}
              
              {new Date(selectedEvent.date) <= new Date(currentDate) && (
                <div className="text-gray-400">This event has already taken place</div>
              )}
              
              <button 
                className="text-gray-400 hover:text-white"
                onClick={() => setSelectedEvent(null)}
              >
                CLOSE
              </button>
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
        <div className="absolute inset-0" style={{ 
          backgroundImage: "radial-gradient(circle at center, rgba(0, 255, 65, 0.1) 0%, transparent 70%)",
        }} />
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
                text="> ESTABLISHING CONNECTION TO EVENT_SERVER..." 
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
                text="> DECRYPTING EVENT DATA..." 
                className="text-cyber-primary/80 font-mono"
                speed={15}
              />
              <TypingText 
                text="> CONNECTION SECURE. ACCESS GRANTED." 
                className="text-cyber-primary font-mono mt-2"
                speed={20}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            className="fixed top-24 right-4 z-40 bg-black/80 border border-cyber-primary rounded-md p-4 backdrop-blur-sm"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-cyber-primary mr-3 animate-pulse"></div>
              <div className="text-cyber-primary">Registration successful!</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-2 rounded-sm">
              [SYSTEM:EVENTS]
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary">
              HACKABYTE EVENTS
            </h1>
          </div>
          
          <div className="hidden md:block">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>DATE:</span>
              <span className="text-cyber-primary">{currentDate}</span>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              System time: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        {/* Event filters and search */}
        <div className="bg-black/60 border border-cyber-primary/30 rounded-lg mb-8 p-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView("upcoming")}
                className={`px-4 py-2 rounded-md transition-all ${
                  activeView === "upcoming" 
                    ? "bg-cyber-primary/20 text-cyber-primary border border-cyber-primary" 
                    : "bg-black/50 text-gray-300 border border-cyber-primary/30 hover:border-cyber-primary/70"
                }`}
              >
                UPCOMING
              </button>
              {/*
              <button
                onClick={() => setActiveView("past")}
                className={`px-4 py-2 rounded-md transition-all ${
                  activeView === "past" 
                    ? "bg-cyber-primary/20 text-cyber-primary border border-cyber-primary" 
                    : "bg-black/50 text-gray-300 border border-cyber-primary/30 hover:border-cyber-primary/70"
                }`}
              >
                PAST EVENTS
              </button>
              */}
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={eventQuery}
                onChange={(e) => setEventQuery(e.target.value)}
                placeholder="Search events..."
                className="w-full md:w-64 bg-black/70 border border-cyber-primary/40 rounded-md pl-10 pr-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
              />
              <div className="absolute left-3 top-2.5 text-cyber-primary/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Featured event */}
        {activeView === "upcoming" && filteredEvents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="h-px flex-grow bg-cyber-primary/30"></div>
              <h2 className="px-3 text-cyber-primary font-bold">FEATURED EVENT</h2>
              <div className="h-px flex-grow bg-cyber-primary/30"></div>
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-cyber-primary/50 bg-black/60 rounded-lg overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3">
                <div className="lg:col-span-1 border-r border-cyber-primary/30 p-5">
                  <div className="bg-black/40 p-4 rounded-lg border border-cyber-primary/40 h-full flex flex-col">
                    <h3 className="text-2xl font-bold text-cyber-primary mb-2">
                      {filteredEvents[0].title}
                    </h3>
                    
                    <div className="flex items-center mb-4 text-xs text-gray-400 space-x-3">
                      <div className="flex items-center">
                        <span className="mr-1">📅</span> {filteredEvents[0].date}
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1">🕒</span> {filteredEvents[0].time}
                      </div>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <div className="text-cyber-secondary font-bold mr-2">Type:</div>
                      <div className="text-white">{filteredEvents[0].type}</div>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <div className="text-cyber-secondary font-bold mr-2">Location:</div>
                      <div className="text-white">{filteredEvents[0].location}</div>
                    </div>
                    
                    <DifficultyMeter level={filteredEvents[0].difficulty} />
                    
                    <div className="mt-auto pt-4">
                      <div className="text-sm text-gray-400 mb-2">
                        <span className="text-cyber-secondary">{filteredEvents[0].registered}</span>/{filteredEvents[0].capacity} participants registered
                      </div>
                      
                      <div className="w-full h-2 bg-black rounded-full overflow-hidden mb-4">
                        <div 
                          className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary"
                          style={{ width: `${(filteredEvents[0].registered / filteredEvents[0].capacity) * 100}%` }}
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        {/*
                        <button 
                          className="cyber-button py-1 px-5 rounded-md text-sm flex-1"
                          onClick={() => setSelectedEvent(filteredEvents[0])}
                        >
                          VIEW DETAILS
                        </button>
                        */}
                        
                        <button 
                          className="py-1 px-5 rounded-md text-sm flex-1 transition-all duration-300 relative overflow-hidden group bg-black/50 text-gray-300 border border-cyber-primary/30 hover:border-cyber-primary hover:text-cyber-primary hover:bg-cyber-primary/10 hover:shadow-lg hover:shadow-cyber-primary/20 hover:scale-105"
                          onClick={() => handleRegister(filteredEvents[0])}
                        >
                          <span className="relative z-10">REGISTER</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-primary/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="lg:col-span-2 p-5">
                  <div className="mb-4">
                    <h3 className="text-cyber-secondary font-bold mb-2">EVENT DESCRIPTION</h3>
                    <p className="text-gray-300">
                      {filteredEvents[0].description}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="text-cyber-secondary font-bold mb-2">SKILLS & TECHNOLOGIES</h3>
                    <div className="flex flex-wrap gap-2">
                      {filteredEvents[0].tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-black/50 text-cyber-primary text-xs px-3 py-1 rounded-full border border-cyber-primary/40"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-cyber-secondary font-bold mb-2">TIME UNTIL EVENT</h3>
                    <CountdownTimer targetDate={filteredEvents[0].date} />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Event grid */}
        <div>
          <div className="flex items-center mb-4">
            <div className="h-px flex-grow bg-cyber-primary/30"></div>
            <h2 className="px-3 text-cyber-primary font-bold">
              {activeView === "upcoming" ? "ALL UPCOMING EVENTS" : /* "PAST EVENTS" */ ""}
            </h2>
            <div className="h-px flex-grow bg-cyber-primary/30"></div>
          </div>
          
          {activeView === "upcoming" ? (
            filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map(event => {
                  // Skip the first one in upcoming view as it's already the featured event
                  if (event.id === filteredEvents[0].id) {
                    return null;
                  }
                  return renderEventCard(event);
                })}
              </div>
            ) : (
              <div className="text-center py-8 border border-cyber-primary/30 rounded-lg bg-black/40">
                <div className="text-cyber-primary text-xl mb-2">No events found</div>
                <p className="text-gray-400">
                  {eventQuery 
                    ? "Try adjusting your search query"
                    : "No upcoming events scheduled at this time"
                  }
                </p>
              </div>
            )
          ) : null /* Past events section commented out */}
        </div>
      </div>
      
      {/* Event details modal */}
      {renderEventDetailsModal()}
      
      {/* Registration Modal */}
      <RegistrationModal
        event={registrationModal.event}
        isOpen={registrationModal.isOpen}
        onClose={closeRegistrationModal}
        onSuccess={handleRegistrationSuccess}
      />
      
      {/* Floating CTA removed as requested */}
    </div>
  );
}
