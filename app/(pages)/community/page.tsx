"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Dot {
  top: number;
  left: number;
  id: number;
  size: number;
  speed: number;
  direction: number;
}

interface Message {
  id: number;
  text: string;
  sender: string;
  time: string;
}

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
}

// Terminal typing effect component
const TypingText = ({ text, speed = 30, className = "", onComplete = () => {} }: TypingTextProps) => {
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
  const [dots, setDots] = useState<Dot[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeCommunity, setActiveCommunity] = useState("main");
  const [showIntro, setShowIntro] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { id: 1, text: "Welcome to the HackaByte community channel", sender: "SYSTEM", time: "12:00" },
    { id: 2, text: "Type a message to join the conversation", sender: "SYSTEM", time: "12:01" }
  ]);
  const [showCommandLine, setShowCommandLine] = useState(false);
  const [terminalCommand, setTerminalCommand] = useState("");
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [scanlines, setScanlines] = useState(true);
  const [activeMembers] = useState([
    { id: 1, name: "CyberNinja", status: "online", avatar: 1 },
    { id: 2, name: "QuantumHacker", status: "online", avatar: 2 },
    { id: 3, name: "NeonPhantom", status: "away", avatar: 3 },
    { id: 4, name: "ByteRebel", status: "offline", avatar: 4 },
    { id: 5, name: "DataSpectre", status: "online", avatar: 2 }
  ]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const initializeDots = useCallback(() => {
    const heightWindow = window.innerHeight;
    const widthWindow = window.innerWidth;
    return Array.from({ length: 40 }, (_, i) => ({
      top: Math.floor(Math.random() * heightWindow),
      left: Math.floor(Math.random() * widthWindow),
      id: i,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 0.5,
      direction: Math.random() > 0.5 ? 1 : -1
    }));
  }, []);

  useEffect(() => {
    setDots(initializeDots());

    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.pageX, y: event.pageY });
    };

    const handleMouseOut = () => {
      setMousePosition({ x: 0, y: 0 });
    };

    const handleResize = () => {
      setDots(initializeDots());
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseout", handleMouseOut);
    window.addEventListener("resize", handleResize);
    
    // Toggle scanlines periodically for effect
    const scanlinesInterval = setInterval(() => {
      setScanlines(prev => !prev);
      setTimeout(() => setScanlines(true), 100);
    }, 5000);

    const interval = setInterval(() => {
      setDots((prevDots) =>
        prevDots.map((dot) => {
          let newTop = dot.top + (dot.speed * dot.direction);
          let newLeft = dot.left + (Math.random() - 0.5) * 2;
          
          // Boundary checks
          if (newTop > window.innerHeight) newTop = 0;
          if (newTop < 0) newTop = window.innerHeight;
          if (newLeft > window.innerWidth) newLeft = 0;
          if (newLeft < 0) newLeft = window.innerWidth;
          
          return {
            ...dot,
            top: newTop,
            left: newLeft
          };
        })
      );
    }, 50);

    // Hide intro after 4 seconds
    const introTimer = setTimeout(() => {
      setShowIntro(false);
    }, 4000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseout", handleMouseOut);
      window.removeEventListener("resize", handleResize);
      clearInterval(interval);
      clearInterval(scanlinesInterval);
      clearTimeout(introTimer);
    };
  }, [initializeDots]);
  
  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === "") return;
    
    // Add user message
    const newUserMessage = {
      id: chatMessages.length + 1,
      text: chatInput,
      sender: "YOU",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatMessages(prev => [...prev, newUserMessage]);
    setChatInput("");
    
    // Simulate bot response after a delay
    setTimeout(() => {
      const responses = [
        "Interesting approach to solving that problem.",
        "Have you tried using a different algorithm?",
        "The next hackathon starts in 3 days. Are you ready?",
        "Check out the resources section for more information.",
        "That's a clever solution!",
        "Remember to register for the upcoming event."
      ];
      
      const botMessage = {
        id: chatMessages.length + 2,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: activeMembers[Math.floor(Math.random() * activeMembers.length)].name,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatMessages(prev => [...prev, botMessage]);
    }, 1000);
  };
  
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalCommand.trim() === "") return;
    
    // Add command to output
    setTerminalOutput(prev => [...prev, `> ${terminalCommand}`]);
    
    // Process command
    const command = terminalCommand.toLowerCase().trim();
    let response = "";
    
    if (command === "help") {
      response = "Available commands: help, about, events, members, clear";
    } else if (command === "about") {
      response = "HackaByte is an elite cyber challenge platform for hackers and security enthusiasts.";
    } else if (command === "events") {
      response = "Upcoming events:\n- Crypto Challenge (May 15, 2025)\n- Network Security Hackathon (June 2, 2025)\n- AI Defense Workshop (June 12, 2025)";
    } else if (command === "members") {
      response = `Active members: ${activeMembers.filter(m => m.status === "online").length}\nTotal members: ${activeMembers.length}`;
    } else if (command === "clear") {
      setTerminalOutput([]);
      setTerminalCommand("");
      return;
    } else {
      response = `Command not recognized: "${terminalCommand}". Type &quot;help&quot; for available commands.`;
    }
    
    // Add response after a short delay
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, response]);
    }, 300);
    
    setTerminalCommand("");
  };

  const renderCommunitySection = () => {
    if (activeCommunity === "main") {
      return (
        <div className="space-y-6">
          <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
            <div className="bg-cyber-primary/10 px-4 py-2 flex justify-between items-center">
              <h3 className="text-cyber-primary font-bold">COMMUNITY CHANNELS</h3>
              <span className="text-xs text-cyber-secondary">{/* SELECT ACCESS POINT */}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
              <button 
                onClick={() => setActiveCommunity("chat")}
                className="cyber-button rounded-md p-4 flex items-center justify-between hover:scale-105 transform transition-all duration-300"
              >
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-cyber-primary animate-pulse mr-2"></div>
                    <span className="tracking-wider">LIVE_CHAT</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-left">Connect with online members</p>
                </div>
                <div className="text-sm opacity-50">→</div>
              </button>
              
              <button 
                onClick={() => setActiveCommunity("forums")}
                className="cyber-button rounded-md p-4 flex items-center justify-between hover:scale-105 transform transition-all duration-300"
              >
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-cyber-secondary mr-2"></div>
                    <span className="tracking-wider">FORUMS</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-left">Discussion boards and topics</p>
                </div>
                <div className="text-sm opacity-50">→</div>
              </button>
              
              <button 
                onClick={() => setActiveCommunity("events")}
                className="cyber-button rounded-md p-4 flex items-center justify-between hover:scale-105 transform transition-all duration-300"
              >
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-cyber-secondary mr-2"></div>
                    <span className="tracking-wider">EVENTS</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-left">Upcoming hackathons and meetups</p>
                </div>
                <div className="text-sm opacity-50">→</div>
              </button>
              
              <button 
                onClick={() => setShowCommandLine(true)}
                className="cyber-button rounded-md p-4 flex items-center justify-between hover:scale-105 transform transition-all duration-300"
              >
                <div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-danger mr-2"></div>
                    <span className="tracking-wider">COMMAND_LINE</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-left">Direct system access</p>
                </div>
                <div className="text-sm opacity-50">→</div>
              </button>
            </div>
          </div>
          
          <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
            <div className="bg-cyber-primary/10 px-4 py-2">
              <h3 className="text-cyber-primary font-bold">LATEST ACTIVITY</h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { time: "09:42", user: "QuantumHacker", action: "solved the encryption challenge" },
                { time: "11:15", user: "ByteRebel", action: "posted in Network Security forum" },
                { time: "12:30", user: "CyberNinja", action: "registered for the next hackathon" }
              ].map((activity, i) => (
                <motion.div 
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex items-start group hover:bg-cyber-primary/5 p-2 rounded transition-colors"
                >
                  <div className="text-xs text-cyber-secondary mr-3">{activity.time}</div>
                  <div>
                    <span className="text-cyber-primary font-medium">{activity.user}</span>
                    <span className="text-gray-400 ml-2">{activity.action}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
            <div className="bg-cyber-primary/10 px-4 py-2 flex justify-between items-center">
              <h3 className="text-cyber-primary font-bold">ONLINE MEMBERS</h3>
              <span className="text-xs text-cyber-secondary">{activeMembers.filter(m => m.status === "online").length} ACTIVE</span>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeMembers.map((member, i) => (
                <motion.div 
                  key={member.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 bg-black/30 p-2 rounded-lg border border-cyber-primary/20 hover:border-cyber-primary/50 transition-colors"
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-cyber-primary/20">
                    <div className="w-full h-full flex items-center justify-center text-cyber-primary text-xs">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border border-black ${
                      member.status === "online" ? "bg-cyber-primary" : 
                      member.status === "away" ? "bg-yellow-400" : "bg-gray-500"
                    }`}></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">{member.name}</div>
                    <div className="text-xs text-gray-400">{member.status}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      );
    } else if (activeCommunity === "chat") {
      return (
        <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden h-[600px] flex flex-col">
          <div className="bg-cyber-primary/10 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center">
              <button 
                onClick={() => setActiveCommunity("main")}
                className="mr-3 text-cyber-primary hover:text-cyber-secondary"
              >
                ←
              </button>
              <h3 className="text-cyber-primary font-bold">GLOBAL CHAT</h3>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse mr-1"></div>
              <span className="text-xs text-cyber-secondary">LIVE</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === "YOU" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.sender === "YOU" 
                      ? "bg-cyber-primary/20 border border-cyber-primary/40" 
                      : "bg-black/40 border border-cyber-secondary/30"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold ${
                      msg.sender === "YOU" ? "text-cyber-primary" : "text-cyber-secondary"
                    }`}>
                      {msg.sender}
                    </span>
                    <span className="text-xs text-gray-500 ml-3">{msg.time}</span>
                  </div>
                  <p className="text-gray-200">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <form onSubmit={handleChatSubmit} className="p-3 border-t border-cyber-primary/20 bg-black/20">
            <div className="flex">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-black/60 border border-cyber-primary/30 rounded-l-md px-4 py-2 text-gray-200 focus:outline-none focus:border-cyber-primary/70"
              />
              <button 
                type="submit"
                className="bg-cyber-primary/20 border border-cyber-primary px-4 rounded-r-md text-cyber-primary hover:bg-cyber-primary/30"
              >
                SEND
              </button>
            </div>
          </form>
        </div>
      );
    } else if (activeCommunity === "forums") {
      return (
        <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
          <div className="bg-cyber-primary/10 px-4 py-2 flex items-center">
            <button 
              onClick={() => setActiveCommunity("main")}
              className="mr-3 text-cyber-primary hover:text-cyber-secondary"
            >
              ←
            </button>
            <h3 className="text-cyber-primary font-bold">DISCUSSION FORUMS</h3>
          </div>
          
          <div className="p-4 space-y-4">
            {[
              { 
                title: "Cryptography Techniques",
                description: "Discuss encryption algorithms and implementation strategies",
                posts: 34,
                lastActive: "2 hours ago" 
              },
              { 
                title: "Network Security",
                description: "Share strategies for securing networks and detecting intrusions",
                posts: 27,
                lastActive: "5 hours ago" 
              },
              { 
                title: "CTF Strategies",
                description: "Capture The Flag competition techniques and walkthroughs",
                posts: 56,
                lastActive: "1 day ago" 
              },
              { 
                title: "Social Engineering",
                description: "Understanding human aspects of security and defense mechanisms",
                posts: 19,
                lastActive: "3 days ago" 
              }
            ].map((forum, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="border border-cyber-primary/30 rounded-lg hover:border-cyber-primary/60 transition-colors p-4 group bg-black/30"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-cyber-secondary font-bold group-hover:text-cyber-primary transition-colors">
                      {forum.title}
                    </h4>
                    <p className="text-sm text-gray-400 mt-1">{forum.description}</p>
                  </div>
                  <div className="bg-cyber-primary/10 rounded-lg px-3 py-1">
                    <div className="text-xs text-cyber-primary">{forum.posts} posts</div>
                  </div>
                </div>
                <div className="flex justify-between mt-4 text-xs">
                  <button className="cyber-button text-xs py-1 rounded">VIEW FORUM</button>
                  <div className="text-gray-500">Last active: {forum.lastActive}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    } else if (activeCommunity === "events") {
      return (
        <div className="bg-black/50 border border-cyber-primary/40 rounded-lg overflow-hidden">
          <div className="bg-cyber-primary/10 px-4 py-2 flex items-center">
            <button 
              onClick={() => setActiveCommunity("main")}
              className="mr-3 text-cyber-primary hover:text-cyber-secondary"
            >
              ←
            </button>
            <h3 className="text-cyber-primary font-bold">UPCOMING EVENTS</h3>
          </div>
          
          <div className="p-4 space-y-6">
            {[
              {
                name: "Crypto Challenge",
                date: "May 15, 2025",
                description: "Test your encryption and decryption skills in this timed contest",
                type: "online",
                participants: 120
              },
              {
                name: "Network Security Hackathon",
                date: "June 2, 2025",
                description: "Build secure network infrastructures while defending against live attacks",
                type: "hybrid",
                participants: 85
              },
              {
                name: "AI Defense Workshop",
                date: "June 12, 2025",
                description: "Learn how to protect systems against AI-powered attacks",
                type: "in-person",
                participants: 40
              }
            ].map((event, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 }}
                className="relative overflow-hidden"
              >
                <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-cyber-primary to-cyber-secondary"></div>
                <div className="border border-cyber-primary/30 rounded-lg p-4 ml-2 bg-black/30">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-bold text-cyber-primary">{event.name}</h4>
                      <div className="flex items-center mt-1">
                        <div className="text-cyber-secondary mr-3">{event.date}</div>
                        <div className="bg-cyber-primary/10 rounded-full px-2 py-0.5 text-xs text-cyber-primary uppercase">
                          {event.type}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">{event.description}</p>
                    </div>
                    <div className="sm:text-right">
                      <div className="bg-black/50 rounded-lg p-2 text-center inline-block">
                        <div className="text-2xl font-bold text-cyber-primary">{event.participants}</div>
                        <div className="text-xs text-cyber-secondary">Participants</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-xs text-gray-500">Registration open</div>
                    <button className="cyber-button py-1 text-sm rounded">REGISTER</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen w-full pt-20 relative">
      {/* Background elements */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black opacity-95" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at center, rgba(0, 255, 65, 0.1) 0%, transparent 70%)",
          }}
        />
        {scanlines && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(transparent, transparent 2px, rgba(0, 0, 0, 0.5) 2px, rgba(0, 0, 0, 0.5) 4px)",
              backgroundSize: "100% 4px",
              opacity: 0.2,
            }}
          />
        )}
      </div>

      {/* Network visualization */}
      <div className="absolute w-screen h-screen pointer-events-none">
        <svg width="100%" height="100%" id="svg">
          <filter id="cyber-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="arithmetic" k1="0" k2="1" k3="0" k4="0" />
          </filter>

          <g filter="url(#cyber-glow)">
            {dots.map((dot) => (
              <circle
                key={dot.id}
                className="dot"
                cx={dot.left}
                cy={dot.top}
                r={dot.size}
                fill="rgba(0, 255, 65, 0.4)"
              />
            ))}
          </g>

          {mousePosition.x !== 0 &&
            dots
              .filter(
                (dot) => Math.abs(dot.top - mousePosition.y) <= 200 && Math.abs(dot.left - mousePosition.x) <= 200
              )
              .map((dot) => (
                <line
                  key={`line_${dot.id}`}
                  className="line"
                  x1={dot.left}
                  y1={dot.top}
                  x2={mousePosition.x}
                  y2={mousePosition.y}
                  stroke="rgba(0, 255, 65, 0.2)"
                  strokeWidth={0.5}
                />
              ))}
        </svg>
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
                text="> INITIALIZING COMMUNITY NETWORK..."
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
                text="> ESTABLISHING SECURE CONNECTION..."
                className="text-cyber-primary/80 font-mono"
                speed={15}
              />
              <TypingText
                text="> CONNECTION ESTABLISHED. WELCOME."
                className="text-cyber-primary font-mono mt-2"
                speed={20}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Line Modal */}
      <AnimatePresence>
        {showCommandLine && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-2xl bg-black border border-cyber-primary/60 rounded-lg overflow-hidden"
              initial={{ y: 20, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.9 }}
            >
              <div className="bg-cyber-primary/20 px-4 py-2 flex justify-between items-center">
                <h3 className="text-cyber-primary font-bold">HACKABYTE_TERMINAL</h3>
                <button
                  onClick={() => setShowCommandLine(false)}
                  className="text-cyber-primary hover:text-cyber-secondary"
                >
                  ✕
                </button>
              </div>

              <div className="h-80 bg-black p-4 font-mono text-sm overflow-y-auto">
                <div className="text-cyber-primary mb-2">Type &apos;help&apos; for available commands</div>

                {terminalOutput.map((line, i) => (
                  <div key={i} className={`mb-1 ${line.startsWith(">") ? "text-cyber-primary" : "text-gray-300"}`}>
                    {line}
                  </div>
                ))}

                <form onSubmit={handleTerminalSubmit} className="flex mt-2">
                  <span className="text-cyber-primary mr-2">&gt;</span>
                  <input
                    type="text"
                    value={terminalCommand}
                    onChange={(e) => setTerminalCommand(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-cyber-primary"
                    autoFocus
                  />
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="inline-block px-3 py-1 border border-cyber-primary/50 text-cyber-primary text-xs mb-2 rounded-sm">
              [SYSTEM:NETWORK]
            </div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary">
              HACKABYTE COMMUNITY
            </h1>
          </div>

          <div className="hidden md:block">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>STATUS:</span>
              <span className="text-cyber-primary">ONLINE</span>
              <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse"></div>
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {renderCommunitySection()}
      </div>
    </div>
  );
}
