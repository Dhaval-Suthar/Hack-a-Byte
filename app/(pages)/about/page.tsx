'use client'

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link"; 

// TypeScript interfaces for component props
interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

interface TerminalSectionProps {
  command: string;
  content: string;
  initiallyOpen?: boolean;
}

interface SkillBarProps {
  name: string;
  level: number;
  delay?: number;
}

interface TeamMemberProps {
  name: string;
  role: string;
  delay?: number;
  imageNumber: number;
}

interface AchievementBadgeProps {
  number: number;
  label: string;
  delay?: number;
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

// Interactive terminal section component
const TerminalSection = ({ command, content, initiallyOpen = false }: TerminalSectionProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [isTyping, setIsTyping] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);

  const handleClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsTyping(true);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div className="mb-8">
      <div 
        className="font-mono bg-black/50 border border-cyber-primary rounded-md overflow-hidden"
        style={{ boxShadow: "0 0 10px rgba(0, 255, 65, 0.3)" }}
      >
        <div 
          className="flex items-center px-4 py-2 bg-cyber-primary/10 border-b border-cyber-primary cursor-pointer"
          onClick={handleClick}
        >
          <span className="text-cyber-primary mr-2">{isOpen ? ">" : "+"}</span>
          <span className="text-cyber-primary">$ {command}</span>
        </div>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="p-4"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isTyping && !hasTyped ? (
                <TypingText
                  text={content}
                  className="text-gray-300"
                  onComplete={() => {
                    setIsTyping(false);
                    setHasTyped(true);
                  }}
                />
              ) : (
                <div className="text-gray-300">{content}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Interactive skill bar component
const SkillBar = ({ name, level, delay = 0 }: SkillBarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = barRef.current;
    
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div className="mb-4" ref={barRef}>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-cyber-primary font-mono">{name}</span>
        <span className="text-xs text-cyber-secondary">{level}%</span>
      </div>
      <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-cyber-primary/30">
        <motion.div
          className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary"
          initial={{ width: 0 }}
          animate={isVisible ? { width: `${level}%` } : { width: 0 }}
          transition={{ duration: 1, delay }}
        />
      </div>
    </div>
  );
};

// Interactive team member card
const TeamMember = ({ name, role, delay = 0, imageNumber }: TeamMemberProps) => {
  const [hover, setHover] = useState(false);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, Math.random() * 5000 + 3000);

    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <motion.div
      className="relative rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.03 }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-b from-transparent to-cyber-primary/50 z-10 ${
          hover ? "opacity-70" : "opacity-40"
        } transition-opacity duration-300`}
      />
      <div className={`absolute inset-0 z-0 ${glitch ? "glitch" : ""}`}>
        <Image
          src={`https://images.unsplash.com/flagged/photo-1570612861542-284f4c12e75f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHBlcnNvbnxlbnwwfHwwfHx8MA%3D%3D&ixid=unique-${imageNumber}`}
          alt={name}
          fill
          className="object-cover"
          style={{
            filter: "brightness(0.7) contrast(1.2)",
            transition: "filter 0.3s ease",
          }}
        />
      </div>
      <div className="absolute inset-0 bg-cyber-primary/10 z-0" />

      <div className="relative z-20 p-5 h-full flex flex-col justify-end">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay }}
          className="border-l-2 border-cyber-primary pl-3"
        >
          <h3 className="text-cyber-primary text-xl font-bold">{name}</h3>
          <p className="text-cyber-secondary text-sm">{role}</p>
        </motion.div>

        <AnimatePresence>
          {hover && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 text-xs text-white/80"
            >
              <p>TAP TO VIEW PROFILE</p>
              <div className="mt-2 flex space-x-2">
                <div className="w-8 h-1 bg-cyber-primary/70"></div>
                <div className="w-4 h-1 bg-cyber-secondary/70"></div>
                <div className="w-2 h-1 bg-white/70"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Achievement badge component
const AchievementBadge = ({ number, label, delay = 0 }: AchievementBadgeProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const badgeRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = badgeRef.current;
    
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      let start = 0;
      const increment = number / 40; // Adjust for animation speed
      const timer = setInterval(() => {
        start += increment;
        if (start > number) {
          setCount(number);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [isVisible, number]);

  return (
    <motion.div
      className="relative"
      ref={badgeRef}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="absolute inset-0 bg-cyber-primary/20 rounded-lg blur-md animate-pulse"></div>
      <div className="relative border border-cyber-primary/50 bg-black/70 p-4 rounded-lg text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyber-primary to-transparent" />
        <h3 className="text-3xl md:text-4xl font-bold text-cyber-primary">{count}+</h3>
        <p className="text-sm text-gray-300 mt-1">{label}</p>
      </div>
    </motion.div>
  );
};

export default function Page() {
  const [activeSection, setActiveSection] = useState(0);
  const [bootSequenceComplete, setBootSequenceComplete] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [windowWidth, setWindowWidth] = useState(1200); // Default width for SSR
  const sections = ["Welcome", "Mission", "Team", "Stats"];

  // Boot sequence effect
  useEffect(() => {
    // Set initial window width on client side
    setWindowWidth(window.innerWidth);
    
    // Handle window resize
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    setTimeout(() => {
      setBootSequenceComplete(true);
    }, 2500);

    // Toggle scanlines periodically for effect
    const scanlinesInterval = setInterval(() => {
      setScanlines(prev => !prev);
      setTimeout(() => setScanlines(true), 100);
    }, 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(scanlinesInterval);
    };
  }, []);

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

      {/* Boot sequence */}
      <AnimatePresence>
        {!bootSequenceComplete && (
          <motion.div 
            className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-md w-full px-8">
              <TypingText 
                text="> INITIALIZING ABOUT MODULE..." 
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
                text="> LOADING HACKABYTE INTELLIGENCE DATA..." 
                className="text-cyber-primary/80 font-mono"
                speed={15}
              />
              <TypingText 
                text="> ACCESS GRANTED. WELCOME AGENT." 
                className="text-cyber-primary font-mono mt-2"
                speed={20}
                onComplete={() => setTimeout(() => setBootSequenceComplete(true), 300)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative z-10 container mx-auto px-4">
        {/* Navigation tabs */}
        <div className="flex justify-center mb-10">
          <div className="bg-black/70 border border-cyber-primary/30 rounded-lg p-1 backdrop-blur-sm">
            <div className="flex space-x-1">
              {sections.map((section, index) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(index)}
                  className={`px-4 py-2 rounded-md transition-all ${
                    activeSection === index 
                      ? "bg-cyber-primary/20 text-cyber-primary" 
                      : "text-gray-400 hover:text-cyber-primary hover:bg-cyber-primary/10"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="text-xs mr-1 opacity-70">{index + 1}.</span> {section}
                    {activeSection === index && (
                      <span className="ml-2 w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {activeSection === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-4 rounded-sm">
                      [SYSTEM:OVERVIEW]
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-secondary">
                        HACKABYTE
                      </span>
                    </h1>
                    <h2 className="text-xl md:text-2xl text-gray-300 mb-6">The Ultimate Cyber Challenge</h2>
                    
                    <p className="text-gray-300 mb-6">
                      Welcome to HackaByte, where elite hackers gather to test their skills in the ultimate digital battleground.
                      Navigate through complex security systems, decrypt encrypted messages, and compete against the best minds in cybersecurity.
                    </p>

                    <div className="flex items-center mt-6">
                      <div className="w-12 h-12 rounded-full bg-cyber-primary/20 flex items-center justify-center border border-cyber-primary">
                        <span className="text-cyber-primary font-mono">01</span>
                      </div>
                      <div className="flex-1 h-[1px] mx-4 bg-gradient-to-r from-cyber-primary/80 to-transparent"></div>
                      <Link href="/"><button className="cyber-button rounded-md text-sm">ACCESS_SYSTEM</button></Link>
                    </div>
                  </div>
                  <div>
                    <div className="relative rounded-lg overflow-hidden cyber-border h-[300px] md:h-[400px]">
                      <div className="absolute top-0 left-0 w-full h-full">
                        <div className="absolute top-0 left-0 w-full p-2 bg-black/50 flex justify-between items-center font-mono text-xs">
                          <div className="text-cyber-primary">TERMINAL_VIEW</div>
                          <div className="flex space-x-2">
                            <span className="w-2 h-2 rounded-full bg-[#ff003c]"></span>
                            <span className="w-2 h-2 rounded-full bg-[#ffb800]"></span>
                            <span className="w-2 h-2 rounded-full bg-cyber-primary"></span>
                          </div>
                        </div>
                        
                        <div className="p-4 mt-6">
                          <TerminalSection 
                            command="whoami"
                            content="[HackaByte Agent] - A participant in the most challenging cybersecurity competition ever created."
                            initiallyOpen={true}
                          />
                          <TerminalSection 
                            command="cat hackabyte.txt"
                            content="HackaByte was founded in 2022 to provide a platform for talented hackers, security specialists, and tech enthusiasts to showcase their skills and push the boundaries of cybersecurity. What began as a small underground event has now grown into the premier hacking competition worldwide."
                          />
                          <TerminalSection 
                            command="ls -la ./mission"
                            content="drwxr-xr-x  innovation\ndrwxr-xr-x  education\ndrwxr-xr-x  competition\n-rw-r--r--  manifesto.md"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 1 && (
              <motion.div
                key="mission"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-4xl mx-auto">
                  <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-4 rounded-sm">
                    [SYSTEM:MISSION]
                  </div>
                  <h2 className="text-3xl font-bold text-gray-200 mb-6">Our <span className="text-cyber-primary">Mission</span></h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                      <p className="text-gray-300 mb-6">
                        HackaByte exists to challenge the world&apos;s top cybersecurity talent through immersive, 
                        game-like competitions that simulate real-world threats. We believe in learning by doing, 
                        and our platform provides a safe environment to practice ethical hacking skills.
                      </p>
                      
                      <p className="text-gray-300 mb-8">
                        Through our events, we aim to identify and nurture the next generation of cybersecurity 
                        experts while raising awareness about the importance of digital security in our increasingly 
                        connected world.
                      </p>

                      <h3 className="text-xl text-cyber-primary mb-4">Our Core Values</h3>
                      
                      <div className="space-y-8 mt-6">
                        <SkillBar name="INNOVATION" level={95} delay={0.1} />
                        <SkillBar name="COLLABORATION" level={85} delay={0.2} />
                        <SkillBar name="ETHICAL CONDUCT" level={100} delay={0.3} />
                        <SkillBar name="CONTINUOUS LEARNING" level={90} delay={0.4} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="bg-black/60 border border-cyber-primary/50 rounded-lg p-6 h-full">
                        <h3 className="text-cyber-primary text-xl mb-4">Security Protocols</h3>
                        
                        <div className="space-y-4">
                          {[
                            { title: "ETHICAL BOUNDARIES", desc: "All challenges adhere to responsible disclosure principles" },
                            { title: "KNOWLEDGE SHARING", desc: "Solutions are analyzed and shared post-event" },
                            { title: "SKILL DEVELOPMENT", desc: "Focused on building practical, real-world abilities" },
                            { title: "COMMUNITY SUPPORT", desc: "Creating networks of security professionals" }
                          ].map((item, index) => (
                            <motion.div 
                              key={index}
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 + 0.3 }}
                              className="flex"
                            >
                              <div className="mr-3 mt-1">
                                <motion.div 
                                  className="w-4 h-4 border border-cyber-primary flex items-center justify-center rounded-sm"
                                  whileHover={{ scale: 1.2, backgroundColor: "rgba(0, 255, 65, 0.2)" }}
                                >
                                  <div className="w-2 h-2 bg-cyber-primary" />
                                </motion.div>
                              </div>
                              <div>
                                <h4 className="text-cyber-secondary font-bold">{item.title}</h4>
                                <p className="text-sm text-gray-400">{item.desc}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-cyber-primary/30">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-400">Encryption Status</div>
                            <div className="text-xs text-cyber-primary">SECURE</div>
                          </div>
                          <div className="h-1 w-full bg-black rounded-full mt-2">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 1.5, delay: 0.5 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSection === 2 && (
              <motion.div
                key="team"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-5xl mx-auto"
              >
                <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-4 rounded-sm">
                  [SYSTEM:TEAM]
                </div>
                <h2 className="text-3xl font-bold text-gray-200 mb-2">The <span className="text-cyber-primary">Team</span></h2>
                <p className="text-gray-400 mb-8">Meet the elite operators behind HackaByte</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <TeamMember 
                    name="%^$DSSD# RW%#BDSS$#" 
                    role="Founder & Lead Developer" 
                    delay={0.1}
                    imageNumber={2}
                  />
                  {/* <TeamMember 
                    name="-" 
                    role="Security Architect" 
                    delay={0.2}
                    imageNumber={3}
                  />
                  <TeamMember 
                    name="-" 
                    role="Challenge Designer" 
                    delay={0.3}
                    imageNumber={4}
                  />
                  <TeamMember 
                    name="-" 
                    role="Cryptography Expert" 
                    delay={0.4}
                    imageNumber={2}
                  />
                  <TeamMember 
                    name="-" 
                    role="Infrastructure Lead" 
                    delay={0.5}
                    imageNumber={3}
                  />
                  <TeamMember 
                    name="-" 
                    role="Community Manager" 
                    delay={0.6}
                    imageNumber={4}
                  /> */}
                </div>
                
                <div className="mt-12 bg-black/50 border border-cyber-primary/30 rounded-lg p-6">
                  <h3 className="text-cyber-primary text-lg mb-4">Join Our Team</h3>
                  <p className="text-gray-300 mb-4">
                    We&apos;re always looking for talented individuals to join our ranks. If you&apos;re passionate about
                    cybersecurity, game development, or event management, we want to hear from you.
                  </p>
                  <button className="cyber-button rounded-md text-sm">APPLY_NOW</button>
                </div>
              </motion.div>
            )}

            {activeSection === 3 && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-5xl mx-auto"
              >
                <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-4 rounded-sm">
                  [SYSTEM:STATISTICS]
                </div>
                <h2 className="text-3xl font-bold text-gray-200 mb-2">Global <span className="text-cyber-primary">Impact</span></h2>
                <p className="text-gray-400 mb-8">HackaByte by the numbers</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  <AchievementBadge number={15} label="EVENTS HOSTED" delay={0.1} />
                  <AchievementBadge number={5000} label="PARTICIPANTS" delay={0.2} />
                  <AchievementBadge number={300} label="CHALLENGES CREATED" delay={0.3} />
                  <AchievementBadge number={48} label="COUNTRIES REPRESENTED" delay={0.4} />
                </div>
                
                <div className="bg-black/50 border border-cyber-primary/30 rounded-lg p-6">
                  <h3 className="text-cyber-primary text-xl mb-6">Global Reach</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-cyber-secondary text-lg mb-4">Event Timeline</h4>
                      
                      <div className="space-y-6">
                        {[
                          { year: "2022", event: "HackaByte Genesis - First event with 150 participants" },
                          { year: "2023", event: "HackaByte Expansion - 4 events across 3 continents" },
                          { year: "2024", event: "HackaByte Global - Events in 12 major cities" },
                          { year: "2025", event: "HackaByte Nexus - Current season with record participation" }
                        ].map((item, index) => (
                          <motion.div 
                            key={index} 
                            className="flex"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 + 0.2 }}
                          >
                            <div className="mr-4 font-mono">
                              <div className="text-cyber-primary font-bold">{item.year}</div>
                              <div className="w-[1px] h-full bg-cyber-primary/30 mx-auto mt-1"></div>
                            </div>
                            <div>
                              <p className="text-gray-300">{item.event}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-cyber-secondary text-lg mb-4">Challenge Categories</h4>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Web Exploitation</span>
                          <span className="text-cyber-primary">28%</span>
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-cyber-primary"
                            initial={{ width: 0 }}
                            animate={{ width: "28%" }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-300">Cryptography</span>
                          <span className="text-cyber-primary">22%</span>
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-cyber-primary"
                            initial={{ width: 0 }}
                            animate={{ width: "22%" }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-300">Binary Exploitation</span>
                          <span className="text-cyber-primary">20%</span>
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-cyber-primary"
                            initial={{ width: 0 }}
                            animate={{ width: "20%" }}
                            transition={{ duration: 1, delay: 0.4 }}
                          />
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-300">Forensics</span>
                          <span className="text-cyber-primary">18%</span>
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-cyber-primary"
                            initial={{ width: 0 }}
                            animate={{ width: "18%" }}
                            transition={{ duration: 1, delay: 0.6 }}
                          />
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-gray-300">Miscellaneous</span>
                          <span className="text-cyber-primary">12%</span>
                        </div>
                        <div className="h-2 bg-black rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-cyber-primary"
                            initial={{ width: 0 }}
                            animate={{ width: "12%" }}
                            transition={{ duration: 1, delay: 0.8 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-12 text-center">
                  <h3 className="text-2xl text-cyber-primary mb-4">Ready to test your skills?</h3>
                  <p className="text-gray-300 mb-6">Join the next HackaByte challenge and prove your hacking prowess</p>
                  
                  <div className="inline-flex">
                    <motion.div 
                      className="relative group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="absolute inset-0 bg-cyber-primary/20 rounded-lg blur-md group-hover:blur-lg transition-all duration-300" />
                      <a 
                        href="/event" 
                        className="cyber-button relative py-3 px-8 rounded-lg font-medium text-lg"
                      >
                        ENTER_CHALLENGE
                        <div className="absolute top-0 right-0 w-2 h-2 bg-cyber-primary animate-pulse rounded-full m-1"></div>
                      </a>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Moving code lines effect */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <motion.div 
            key={i}
            className="absolute text-cyber-primary/10 whitespace-nowrap font-mono text-xs"
            initial={{ 
              y: Math.random() * 2000 - 1000, 
              x: Math.random() * windowWidth,
              opacity: 0.3
            }}
            animate={{ 
              y: i % 2 === 0 ? 2000 : -2000,
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ 
              duration: Math.random() * 40 + 20,
              repeat: Infinity,
              ease: "linear",
              repeatType: "loop"
            }}
          >
            {"#include<iostream> int main() { std::cout << \"HACKABYTE\"; return 0; }"}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
