"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import extracted components
import TypingText from '../../../components/event/TypingText';
import CountdownTimer from '../../../components/event/CountdownTimer';
import DifficultyMeter from '../../../components/event/DifficultyMeter';
import RegistrationModal from '../../../components/event/RegistrationModal';

// Import custom hooks
import { useEventData } from '../../../hooks/useEventData';

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
  objectId?: string; // real Mongo ObjectId
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
  pricing?: {
    normal: number;
    extended?: number;
  };
  deviceRequirements?: {
    types: {
      mobile: boolean;
      desktop: boolean;
    };
    devices: {
      mobile: string[];
      desktop: string[];
    };
  };
  minTeamMembers?: number;
  maxTeamMembers?: number;
}

export default function Page() {
  // Use custom hooks for data management
  const { events: eventsWithCounts, loading, refetch } = useEventData();

  const [showIntro, setShowIntro] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedTab, setSelectedTab] = useState("info");
  const [activeView, setActiveView] = useState("upcoming");
  const [scanlines, setScanlines] = useState(true);
  const [eventQuery, setEventQuery] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentTime, setCurrentTime] = useState("--:--:--");
  const [registrationModal, setRegistrationModal] = useState<{
    isOpen: boolean;
    event: Event | null;
  }>({ isOpen: false, event: null });

  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  // Update current date on client side to avoid hydration mismatch
  useEffect(() => {
    const updateDate = () => {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      setCurrentDate(dateStr);
    };
    
    // Update date at midnight
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeout = setTimeout(() => {
      updateDate();
      // Set up daily updates
      setInterval(updateDate, 24 * 60 * 60 * 1000);
    }, timeUntilMidnight);
    
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  // Update current time on client side to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    // Set initial time
    updateTime();
    
    // Update time every second
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
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

  const handleRegister = (event: Event) => {
    // Always allow registration (multiple registrations per email allowed)
    setRegistrationModal({ isOpen: true, event });
  };

  const handleRegistrationSuccess = () => {
    // Refetch events data to get updated registration counts
    refetch();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
          
          {/* Event Requirements */}
          <div className="mt-4 space-y-2">
            {/* Team Size */}
            {event.minTeamMembers && event.maxTeamMembers && (
              <div className="flex items-center text-xs text-gray-400">
                <span className="mr-1">👥</span>
                <span>Team: {event.minTeamMembers}-{event.maxTeamMembers} members</span>
              </div>
            )}
            
            {/* Device Requirements */}
            {event.deviceRequirements && (
              <div className="flex items-center text-xs text-gray-400">
                <span className="mr-1">📱</span>
                <span>
                  {event.deviceRequirements.types.mobile && event.deviceRequirements.types.desktop 
                    ? "Mobile & Desktop" 
                    : event.deviceRequirements.types.mobile 
                      ? "Mobile Only" 
                      : event.deviceRequirements.types.desktop 
                        ? "Desktop Only" 
                        : "No Device Required"}
                </span>
              </div>
            )}
            
            {/* Pricing */}
            {event.pricing && (
              <div className="flex items-center text-xs text-gray-400">
                <span className="mr-1">💰</span>
                <span>
                  ₹{event.pricing.normal}
                  {event.pricing.extended && ` (Extended: ₹${event.pricing.extended})`}
                </span>
              </div>
            )}
          </div>
          
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
                        
                        {/* Team Size */}
                        {selectedEvent.minTeamMembers && selectedEvent.maxTeamMembers && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Team Size</span>
                            <span className="text-white">{selectedEvent.minTeamMembers}-{selectedEvent.maxTeamMembers} members</span>
                          </div>
                        )}
                        
                        {/* Device Requirements */}
                        {selectedEvent.deviceRequirements && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Devices</span>
                            <span className="text-white">
                              {selectedEvent.deviceRequirements.types.mobile && selectedEvent.deviceRequirements.types.desktop 
                                ? "Mobile & Desktop" 
                                : selectedEvent.deviceRequirements.types.mobile 
                                  ? "Mobile Only" 
                                  : selectedEvent.deviceRequirements.types.desktop 
                                    ? "Desktop Only" 
                                    : "No Device Required"}
                            </span>
                          </div>
                        )}
                        
                        {/* Pricing */}
                        {selectedEvent.pricing && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Pricing</span>
                            <span className="text-cyber-secondary">
                              ₹{selectedEvent.pricing.normal}
                              {selectedEvent.pricing.extended && ` (Extended: ₹${selectedEvent.pricing.extended})`}
                            </span>
                          </div>
                        )}
                        
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
                          {selectedEvent.deviceRequirements ? (
                            <>
                              {selectedEvent.deviceRequirements.types.mobile && (
                                <li>Mobile device required</li>
                              )}
                              {selectedEvent.deviceRequirements.types.desktop && (
                                <li>Desktop/Laptop required</li>
                              )}
                              {selectedEvent.deviceRequirements.devices.mobile.length > 0 && (
                                <li>Mobile: {selectedEvent.deviceRequirements.devices.mobile.join(", ")}</li>
                              )}
                              {selectedEvent.deviceRequirements.devices.desktop.length > 0 && (
                                <li>Desktop: {selectedEvent.deviceRequirements.devices.desktop.join(", ")}</li>
                              )}
                              <li>Secure internet connection</li>
                              <li>Required software (provided upon registration)</li>
                            </>
                          ) : (
                            <>
                              <li>Personal computer with secure internet connection</li>
                              <li>Required software (provided upon registration)</li>
                              {selectedEvent.type.includes("Hackathon") && (
                                <li>Team collaboration tools</li>
                              )}
                            </>
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
      {/* Loading state */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-primary mx-auto mb-4"></div>
            <p className="text-cyber-primary text-lg">Loading events...</p>
          </div>
        </div>
      )}

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
              System time: {currentTime}
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
