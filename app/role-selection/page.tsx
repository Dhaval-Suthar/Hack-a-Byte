"use client";

import React, { Suspense, useEffect, useState, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getAvailableRoles, validateAndUseAccessCode } from "@/app/actions/userProgress";
import { CHARACTER_INFO, ROLE_LIMITS, getCharacterDisplayName } from "@/lib/constants/app-constants";
import { logger } from "@/lib/logger";

// Custom CSS styles for enhanced cyberpunk look
const cyberpunkStyles = `
  .text-glow {
    text-shadow: 0 0 5px rgba(0, 255, 163, 0.5), 0 0 10px rgba(0, 255, 163, 0.3);
  }
  .card-hover {
    transition: all 0.3s ease;
  }
  .card-hover:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 255, 163, 0.2);
  }
  .matrix-bg {
    background-image: radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,40,20,0.2) 100%);
  }
  .pulse-border {
    animation: pulse-border 2s infinite;
  }
  @keyframes pulse-border {
    0% { box-shadow: 0 0 0 0 rgba(0, 255, 163, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(0, 255, 163, 0); }
    100% { box-shadow: 0 0 0 0 rgba(0, 255, 163, 0); }
  }
  @keyframes glitch {
    0% {
      clip-path: polygon(0 0, 100% 0, 100% 25%, 0 25%);
      transform: translate(0);
    }
    20% {
      clip-path: polygon(0 15%, 100% 15%, 100% 30%, 0 30%);
      transform: translate(-5px, 2px);
    }
    40% {
      clip-path: polygon(0 78%, 100% 78%, 100% 100%, 0 100%);
      transform: translate(5px, 0);
    }
    60% {
      clip-path: polygon(0 45%, 100% 45%, 100% 60%, 0 60%);
      transform: translate(5px, 10px);
    }
    80% {
      clip-path: polygon(0 50%, 100% 50%, 100% 70%, 0 70%);
      transform: translate(-5px, 0);
    }
    100% {
      clip-path: polygon(0 0, 100% 0, 100% 25%, 0 25%);
      transform: translate(0);
    }
  }
  .glitch-effect {
    position: relative;
  }
  .glitch-effect::before,
  .glitch-effect::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .glitch-effect::before {
    left: 2px;
    text-shadow: -2px 0 #00ff9d;
    animation: glitch 0.75s infinite linear alternate-reverse;
    background: transparent;
  }
  .glitch-effect::after {
    left: -2px;
    text-shadow: 2px 0 #ff003c;
    animation: glitch 0.375s infinite linear alternate-reverse;
    background: transparent;
  }
`;

function RoleSelectionClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [accessCode, setAccessCode] = useState("");
  const [username, setUsername] = useState("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // New state for enhanced user experience
  // const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  // const [showSelectionEffect, setShowSelectionEffect] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Terminal lines state similar to home page
  const terminalLines = useMemo(
    () => [
      { text: "> INITIALIZING ROLE DATABASE...", delay: 300 },
      { text: "> SCANNING AVAILABLE IDENTITIES...", delay: 800 },
      { text: "> ESTABLISHING SECURE CONNECTION...", delay: 1300 },
      { text: "> IDENTITY SELECTION PROTOCOL ACTIVATED", delay: 1800 },
    ],
    []
  );
  const [displayedLines, setDisplayedLines] = useState<number>(0);

  // Play sound effect function
  const playSound = () => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) return;

    // Uncomment and replace these with actual audio files when they're available
    // switch (type) {
    //   case 'select':
    //     audioRef.current.src = '/sounds/select.mp3';
    //     break;
    //   case 'error':
    //     audioRef.current.src = '/sounds/error.mp3';
    //     break;
    //   case 'submit':
    //     audioRef.current.src = '/sounds/submit.mp3';
    //     break;
    //   case 'hover':
    //     audioRef.current.src = '/sounds/hover.mp3';
    //     break;
    // }

    // audioRef.current.volume = 0.4;
    // audioRef.current.play().catch(err => {
    //   console.log("Audio play prevented:", err);
    // });
  };

  // Matrix rain effect for canvas background (adapted from home page with variations)
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      let width = window.innerWidth;
      let height = window.innerHeight;

      canvas.width = width;
      canvas.height = height;

      // Matrix rain characters with different set than homepage
      const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテト";
      const fontSize = 16;
      const columns = Math.floor(width / fontSize);

      // Array to track the y position of each character
      const drops: number[] = Array(columns).fill(1);

      // Draw the Matrix Rain with slightly different color from homepage
      const drawMatrix = () => {
        // Semi-transparent black background to create trail effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.07)"; // Slightly more transparent than home page
        ctx.fillRect(0, 0, width, height);

        // Slightly different shade of green than home page
        ctx.fillStyle = "rgba(0, 230, 100, 0.7)";
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          // Random character
          const char = characters.charAt(Math.floor(Math.random() * characters.length));
          // Draw the character
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);

          // Randomly reset some drops to top with varying opacity
          if (drops[i] * fontSize > height && Math.random() > 0.97) {
            drops[i] = 0;
          }

          // Increment y coordinate
          drops[i]++;
        }
      };

      const matrixInterval = setInterval(drawMatrix, 60); // Slightly slower than home page

      const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
      };

      window.addEventListener("resize", handleResize);

      // Handle loading animation - extend to allow terminal messages to fully display
      const loadingTimer = setTimeout(() => {
        setIsLoaded(true);
      }, 3500);

      // Display terminal lines sequentially
      terminalLines.forEach((line, index) => {
        setTimeout(() => {
          setDisplayedLines(index + 1);
        }, line.delay);
      });

      return () => {
        clearInterval(matrixInterval);
        clearTimeout(loadingTimer);
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [terminalLines]);

  // Effect for showing selection animation
  useEffect(() => {
    if (selectedRole) {
      playSound();
      // setShowSelectionEffect(true);
      const timer = setTimeout(() => {
        // setShowSelectionEffect(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [selectedRole]);

  // Effect for error sound
  useEffect(() => {
    if (error) {
      playSound();
    }
  }, [error]);

  useEffect(() => {
    const code = params?.get("code") || "";
    setAccessCode(code);
    if (!code) {
      setError("Missing access code");
      setLoading(false);
      return;
    }
    (async () => {
      const res = await getAvailableRoles(code);
      if (res.success) {
        const available = (res.availableRoles || []).map((r) => r.toLowerCase());
        setAvailableRoles(available);
        // derive all roles for this team size using ROLE_LIMITS
        if (res.totalSlots) {
          const limits = ROLE_LIMITS[res.totalSlots as keyof typeof ROLE_LIMITS];
          if (limits) setAllRoles(Object.keys(limits));
          // Persist team size for later client-side role gating (hackphone apps)
          try {
            localStorage.setItem("teamSize", String(res.totalSlots));
          } catch (error) {
            logger.warn("Failed to save team size to localStorage:", { error });
          }
        }
      } else {
        setError(res.error || "Failed to load roles");
      }
      setLoading(false);
    })();
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) return setError("Enter a username");
    if (!selectedRole) return setError("Select a role");

    // Play submit sound
    playSound();

    const res = await validateAndUseAccessCode({ accessCode, username: username.trim(), role: selectedRole });
    if (!res.success) {
      setError(res.error || "Failed to join team");
      // Refresh roles in case of duplicate role
      const refresh = await getAvailableRoles(accessCode);
      if (refresh.success) setAvailableRoles(refresh.availableRoles || []);
      return;
    }
    // Store the selected role in localStorage
    localStorage.setItem("selectedRole", selectedRole);
    if (res.playspaceId) {
      try {
        document.cookie = `playspaceId=${res.playspaceId}; path=/; SameSite=Lax`;
        localStorage.setItem("playspaceId", res.playspaceId);
      } catch (error) {
        logger.warn("Failed to save playspace data to localStorage/cookies:", { error });
      }
    }
    // When all joined or not, continue to tutorial first, then device selection
    router.push("/tutorial");
  };

  return (
    <main className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4 relative overflow-hidden">
      <style jsx global>
        {cyberpunkStyles}
      </style>
      {/* Canvas for Matrix Rain Effect with enhanced visibility */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 matrix-bg"
        style={{ opacity: 0.9 }} // Increased opacity for better visibility
      />

      {/* Audio element for sound effects */}
      <audio ref={audioRef} className="hidden" />

      {/* Terminal Messages Section with improved visibility */}
      <AnimatePresence>
        {!isLoaded && (
          <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
            <div className="font-mono text-green-400 text-xl space-y-8 p-8 max-w-2xl bg-black/80 border-2 border-green-500/30 rounded-xl shadow-lg shadow-green-500/20 backdrop-blur-sm">
              {terminalLines.slice(0, displayedLines).map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="flex"
                >
                  <span className="inline-block text-glow">{line.text}</span>
                  {index === displayedLines - 1 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      className="ml-1 text-green-300"
                    >
                      █
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Enhanced Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
               linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
               linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
             `,
          backgroundSize: "50px 50px",
        }}
      ></div>

      {/* Digital circuit patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <pattern id="circuit" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10,10 L50,10 L50,50 L90,50" stroke="#0f0" strokeWidth="1" fill="none" />
            <path d="M90,10 L60,10 L60,90 L10,90" stroke="#0f0" strokeWidth="1" fill="none" />
            <circle cx="10" cy="10" r="3" fill="#0f0" />
            <circle cx="50" cy="50" r="3" fill="#0f0" />
            <circle cx="90" cy="50" r="3" fill="#0f0" />
            <circle cx="10" cy="90" r="3" fill="#0f0" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#circuit)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        {" "}
        <div className="w-full max-w-7xl relative z-10">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
              className="relative inline-block"
            >
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-mono font-black mb-6 relative">
                <span className="bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent drop-shadow-2xl">
                  Choose
                </span>
                <br className="sm:hidden" />
                <span className="bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent drop-shadow-2xl sm:ml-2">
                  Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                  Character
                </span>
                {/* Glowing effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-green-400 opacity-20 blur-2xl"
                  animate={{
                    opacity: [0.2, 0.4, 0.2],
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </h1>
            </motion.div>

            {/* Terminal-style typing animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="text-xl text-green-400 font-mono mb-4 max-w-2xl mx-auto leading-relaxed flex items-center justify-center"
            >
              <span className="hidden sm:inline-block">{">"}</span>
              <motion.div className="overflow-hidden px-2">
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: "auto" }}
                  transition={{ delay: 1.8, duration: 1.2 }}
                  className="overflow-hidden block sm:inline-block text-center sm:text-left text-base sm:text-xl"
                >
                  SELECT YOUR DIGITAL IDENTITY FOR THE ULTIMATE CYBER HEIST
                </motion.span>
              </motion.div>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 3 }}
                className="ml-1 hidden sm:inline-block"
              >
                █
              </motion.span>
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "12rem" }}
              transition={{ duration: 1, delay: 0.6 }}
              className="h-1 bg-gradient-to-r from-green-400 via-blue-400 to-green-400 mx-auto rounded-full shadow-lg shadow-green-400/30"
            />
          </motion.div>

          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="relative inline-block">
                <div className="w-20 h-20 border-4 border-green-400/30 border-t-green-400 rounded-full animate-spin mb-6 shadow-lg shadow-green-400/20"></div>
                <motion.div
                  className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                />
                <motion.div
                  className="absolute inset-0 bg-green-400 rounded-full opacity-10 blur-xl"
                  animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.05, 0.2, 0.05] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="font-mono text-green-400 text-lg text-glow">
                Initializing character database
                <motion.span animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  ...
                </motion.span>
              </p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={onSubmit}
              className="space-y-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Enhanced User Info Section with better mobile support */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto px-4 sm:px-0"
              >
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-mono text-gray-300 mb-3 tracking-wider">
                    <motion.span
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="mr-2 text-green-400"
                    >
                      🔐
                    </motion.span>
                    ACCESS CODE
                  </label>
                  <div className="relative group">
                    <input
                      value={accessCode}
                      readOnly
                      className="w-full bg-black/50 border-2 border-green-600/50 rounded-xl px-6 py-4 font-mono text-green-400 backdrop-blur-md transition-all duration-300 group-hover:border-green-500/80 group-hover:shadow-lg group-hover:shadow-green-500/10 touch-manipulation"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center text-sm font-mono text-gray-300 mb-3 tracking-wider">
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="mr-2 text-green-400"
                    >
                      👤
                    </motion.span>
                    HACKER ALIAS
                  </label>
                  <div className="relative group">
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your digital identity..."
                      className="w-full bg-black/50 border-2 border-green-600/50 rounded-xl px-6 py-4 font-mono text-green-400 placeholder-gray-500/70 backdrop-blur-md focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 group-hover:border-green-500/80 text-base sm:text-lg touch-manipulation"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Typing indicator */}
                    {username && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-400"
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.form>
          )}
        </div>
        <div className="w-full max-w-7xl relative z-10">
          {loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full animate-spin mb-6"></div>
                <motion.div
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                />
              </div>
              <p className="font-mono text-green-400 text-lg">Initializing character database...</p>
            </motion.div>
          ) : (
            <motion.form
              onSubmit={onSubmit}
              className="space-y-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {/* Character Selection */}
              <div className="space-y-12">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  className="text-3xl font-mono font-bold text-center text-green-400 tracking-wider text-glow mb-8"
                  data-text="AVAILABLE OPERATIVES"
                >
                  <span className="glitch-effect" data-text="AVAILABLE OPERATIVES">
                    AVAILABLE OPERATIVES
                  </span>
                </motion.h2>

                {allRoles.length === 0 && availableRoles.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="text-center py-16 relative"
                  >
                    <div className="relative inline-block">
                      <div className="w-32 h-32 border-4 border-yellow-500/30 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-md">
                        <div className="text-6xl">⚠️</div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl blur-xl" />
                    </div>
                    <p className="text-yellow-400 text-2xl font-mono mb-3 font-bold">RECRUITMENT CLOSED</p>
                    <p className="text-gray-400 font-mono text-lg">All operative positions have been filled</p>
                  </motion.div>
                ) : (
                  <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.15,
                          delayChildren: 0.8,
                        },
                      },
                    }}
                  >
                    {(allRoles.length ? allRoles : availableRoles).map((characterName) => {
                      const character = CHARACTER_INFO[characterName as keyof typeof CHARACTER_INFO];
                      if (!character) return null;

                      const isAvailable = availableRoles.includes(characterName);
                      const isSelected = selectedRole === characterName;

                      return (
                        <motion.div
                          key={characterName}
                          variants={{
                            hidden: { opacity: 0, y: 50, rotateX: -15 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              rotateX: 0,
                              transition: {
                                duration: 0.8,
                                ease: [0.6, 0.01, 0.05, 0.95],
                              },
                            },
                          }}
                          whileHover={
                            isAvailable
                              ? {
                                  scale: 1.03,
                                  y: -8,
                                  rotateY: 5,
                                  transition: { duration: 0.3, ease: "easeOut" },
                                }
                              : {}
                          }
                          whileTap={isAvailable ? { scale: 0.97 } : {}}
                          onClick={() => {
                            if (!isAvailable) {
                              playSound();
                              setError(`Role already taken: ${character.name}`);
                              return;
                            }
                            setSelectedRole(characterName);
                          }}
                          onMouseEnter={() => {
                            if (isAvailable) {
                              // setHoveredCard(characterName);
                              playSound();
                            }
                          }}
                          onMouseLeave={() => {
                            if (isAvailable) {
                              // setHoveredCard(null);
                            }
                          }}
                          className={`
                          relative rounded-2xl p-10 transition-all duration-500 overflow-hidden group
                          ${
                            isAvailable
                              ? isSelected
                                ? `${character.borderColor} border-3 shadow-2xl pulse-border`
                                : "border-3 border-green-600/50 hover:border-green-400 shadow-xl shadow-green-500/30 card-hover"
                              : "border-3 border-gray-800/70 opacity-50 grayscale cursor-not-allowed"
                          }
                          backdrop-blur-xl min-h-[450px] transform-gpu perspective-1000
                        `}
                          style={{
                            backgroundImage: `
                            linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.5) 100%), 
                            url(${character.image})
                          `,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            transformStyle: "preserve-3d",
                          }}
                        >
                          {/* Taken Ribbon */}
                          {!isAvailable && (
                            <div className="absolute top-3 left-0">
                              <div className="bg-red-600/80 text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-r-lg shadow-md">
                                TAKEN
                              </div>
                            </div>
                          )}
                          {/* Character data lines (matrix-like element) */}
                          <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none hidden sm:block">
                            {[...Array(10)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute text-xs text-green-400 font-mono whitespace-nowrap"
                                style={{
                                  top: `${i * 10}%`,
                                  left: `-${Math.random() * 100}px`,
                                }}
                                animate={{
                                  left: ["100%", "-100%"],
                                }}
                                transition={{
                                  duration: 20 + i * 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              >
                                {[...Array(40)]
                                  .map(() => String.fromCharCode(48 + Math.floor(Math.random() * 74)))
                                  .join("")}
                              </motion.div>
                            ))}
                          </div>
                          {/* Simplified data lines for mobile */}
                          <div className="absolute inset-0 opacity-10 overflow-hidden pointer-events-none sm:hidden">
                            {[...Array(5)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute text-xs text-green-400 font-mono whitespace-nowrap"
                                style={{
                                  top: `${i * 20}%`,
                                  left: `-${Math.random() * 100}px`,
                                }}
                                animate={{
                                  left: ["100%", "-100%"],
                                }}
                                transition={{
                                  duration: 15 + i * 2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                              >
                                {[...Array(20)]
                                  .map(() => String.fromCharCode(48 + Math.floor(Math.random() * 74)))
                                  .join("")}
                              </motion.div>
                            ))}
                          </div>
                          {/* Animated background overlay */}
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-br ${
                              isSelected && isAvailable
                                ? `${character.bgGradient} opacity-50`
                                : "from-black/60 via-black/40 to-black/70 opacity-70"
                            } transition-all duration-500`}
                            animate={
                              isSelected && isAvailable
                                ? {
                                    background: [
                                      `linear-gradient(135deg, ${character.color}15, ${character.color}05, ${character.color}20)`,
                                      `linear-gradient(135deg, ${character.color}20, ${character.color}10, ${character.color}25)`,
                                      `linear-gradient(135deg, ${character.color}15, ${character.color}05, ${character.color}20)`,
                                    ],
                                  }
                                : {}
                            }
                            transition={{ duration: 2, repeat: isSelected ? Infinity : 0 }}
                          />{" "}
                          {/* Floating particles effect */}
                          {isSelected && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              {[...Array(6)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className={`absolute w-1 h-1 bg-${character.color} rounded-full opacity-60`}
                                  style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                  }}
                                  animate={{
                                    y: [-20, -60, -20],
                                    opacity: [0, 1, 0],
                                    scale: [0, 1, 0],
                                  }}
                                  transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    delay: i * 0.5,
                                    ease: "easeInOut",
                                  }}
                                />
                              ))}
                            </div>
                          )}
                          {/* Enhanced Selection Indicator */}
                          {isSelected && isAvailable && (
                            <>
                              {/* Glowing border effect */}
                              <motion.div
                                className={`absolute inset-0 rounded-2xl z-5`}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                  boxShadow: `0 0 20px ${character.color}90, inset 0 0 20px ${character.color}60`,
                                  border: `2px solid ${character.color}90`,
                                }}
                              />

                              {/* Check mark badge */}
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 200,
                                  damping: 15,
                                  delay: 0.1,
                                }}
                                className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/50 border-2 border-white z-20"
                              >
                                <motion.svg
                                  className="w-6 h-6 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </motion.svg>
                              </motion.div>

                              {/* Animated particles */}
                              <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                                {[...Array(8)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="absolute rounded-full"
                                    style={{
                                      left: `${Math.random() * 100}%`,
                                      top: `${Math.random() * 100}%`,
                                      width: `${Math.random() * 6 + 2}px`,
                                      height: `${Math.random() * 6 + 2}px`,
                                      backgroundColor: character.color,
                                      boxShadow: `0 0 8px ${character.color}80`,
                                    }}
                                    animate={{
                                      y: [-20, -60, -20],
                                      opacity: [0, 1, 0],
                                      scale: [0, 1, 0],
                                    }}
                                    transition={{
                                      duration: 3,
                                      repeat: Infinity,
                                      delay: i * 0.5,
                                      ease: "easeInOut",
                                    }}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                          <div className="relative z-10 flex flex-col h-full justify-between">
                            {/* Character Icon/Symbol */}
                            <motion.div
                              className={`w-20 h-20 mb-6 rounded-2xl flex items-center justify-center ${
                                isSelected && isAvailable ? character.borderColor : "border-gray-500/70"
                              } border-3 bg-black/80 backdrop-blur-xl shadow-2xl group-hover:shadow-xl transition-all duration-300`}
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              <span
                                className={`text-3xl font-black ${
                                  isSelected ? character.textColor : "text-green-400"
                                } drop-shadow-lg`}
                              >
                                {characterName.charAt(0)}
                              </span>
                            </motion.div>

                            <div className="flex-1 flex flex-col justify-center space-y-4">
                              {/* Character Name */}
                              <motion.h3
                                className={`text-2xl font-mono font-black mb-2 ${
                                  isSelected && isAvailable ? character.textColor : "text-green-400"
                                } drop-shadow-lg tracking-wider text-glow`}
                                animate={isSelected && isAvailable ? { scale: [1, 1.05, 1] } : {}}
                                transition={{ duration: 2, repeat: isSelected && isAvailable ? Infinity : 0 }}
                              >
                                {getCharacterDisplayName(characterName)}
                              </motion.h3>

                              {/* Role Badge */}
                              <div
                                className={`px-4 py-2 rounded-xl text-sm font-mono font-bold inline-block transition-all duration-300
                              ${
                                isSelected && isAvailable
                                  ? `${character.textColor} bg-black/70 border-2 ${character.borderColor} backdrop-blur-xl shadow-lg pulse-border`
                                  : "text-green-300 bg-black/80 border-2 border-green-500/70 backdrop-blur-xl"
                              }
                              ${!isAvailable ? "opacity-70 line-through decoration-red-500/70 decoration-2" : ""}
                            `}
                              >
                                {character.role}
                                {!isAvailable && " (Taken)"}
                              </div>

                              {/* Description */}
                              <motion.p
                                className="text-sm text-green-300 leading-relaxed bg-black/80 rounded-xl p-4 backdrop-blur-xl border border-green-500/20 shadow-inner matrix-bg"
                                initial={{ opacity: 0.8 }}
                                whileHover={{ opacity: 1, y: -2 }}
                              >
                                {character.description}
                              </motion.p>
                            </div>

                            <div className="space-y-4">
                              {/* Skills */}
                              <div className="flex flex-wrap justify-center gap-2">
                                {character.skills.map((skill, skillIndex) => (
                                  <motion.span
                                    key={skillIndex}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: skillIndex * 0.1 }}
                                    whileHover={{ scale: 1.05 }}
                                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-black/70 backdrop-blur-xl border transition-all duration-200 ${
                                      isSelected && isAvailable
                                        ? `${character.textColor} ${character.borderColor} shadow-lg`
                                        : "text-green-300 border-green-500/70 hover:border-green-400"
                                    } ${!isAvailable ? "opacity-50" : ""}`}
                                  >
                                    {skill}
                                  </motion.span>
                                ))}
                              </div>

                              {/* Specialty */}
                              <motion.div
                                className={`text-xs italic bg-black/70 backdrop-blur-xl rounded-xl p-3 border border-white/10 text-center ${
                                  isSelected && isAvailable ? character.textColor : "text-green-300"
                                } transition-colors duration-300 ${!isAvailable ? "opacity-60" : ""}`}
                                whileHover={{ scale: 1.02 }}
                              >
                                &ldquo;{character.specialty}&rdquo;
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Selected Character Confirmation */}
                {selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                    className="max-w-lg mx-auto p-6 bg-gradient-to-r from-green-900/40 to-blue-900/40 border-2 border-green-500/60 rounded-2xl backdrop-blur-xl shadow-2xl shadow-green-500/20"
                  >
                    <div className="flex items-center justify-center space-x-4">
                      <motion.div
                        className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center border border-green-400"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                      >
                        <svg className="w-7 h-7 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </motion.div>
                      <div className="text-center">
                        <p className="text-green-300 font-mono text-lg font-bold">OPERATIVE SELECTED</p>
                        <p className="text-white font-mono">
                          <strong>{CHARACTER_INFO[selectedRole as keyof typeof CHARACTER_INFO]?.name}</strong>
                          <span className="text-gray-300">
                            {" "}
                            - {CHARACTER_INFO[selectedRole as keyof typeof CHARACTER_INFO]?.role}
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="max-w-lg mx-auto p-6 bg-gradient-to-r from-red-900/40 to-red-800/30 border-2 border-red-500/60 rounded-2xl backdrop-blur-xl shadow-2xl shadow-red-500/20"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-red-400 text-2xl animate-pulse">⚠️</div>
                    <div>
                      <p className="text-red-300 font-mono font-bold text-sm">SYSTEM ERROR</p>
                      <p className="text-red-400 font-mono text-sm">{error}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.div
                className="flex justify-center pt-12"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
              >
                <motion.button
                  type="submit"
                  disabled={!selectedRole || !username.trim()}
                  whileHover={
                    !selectedRole || !username.trim()
                      ? {}
                      : {
                          scale: 1.05,
                          boxShadow: "0 0 30px rgba(0, 255, 163, 0.5), inset 0 0 15px rgba(0, 255, 163, 0.3)",
                        }
                  }
                  whileTap={!selectedRole || !username.trim() ? {} : { scale: 0.95 }}
                  className={`
                  relative px-14 py-7 rounded-2xl font-mono font-bold text-xl transition-all duration-500 backdrop-blur-xl overflow-hidden group
                  ${
                    !selectedRole || !username.trim()
                      ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border-2 border-gray-600/50"
                      : "bg-gradient-to-r from-green-900 via-green-600 to-black text-green-300 border-2 border-green-500/80 shadow-2xl shadow-green-500/40 hover:shadow-green-500/70 pulse-border"
                  }
                `}
                >
                  {/* Button background animation */}
                  {selectedRole && username.trim() && (
                    <>
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-green-900 to-black opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                        animate={{
                          background: [
                            "linear-gradient(45deg, rgba(5, 66, 33, 0.5), rgba(0, 0, 0, 0.8))",
                            "linear-gradient(45deg, rgba(0, 0, 0, 0.8), rgba(5, 66, 33, 0.5))",
                            "linear-gradient(45deg, rgba(5, 66, 33, 0.5), rgba(0, 0, 0, 0.8))",
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      />
                      
                      {/* Digital noise effect */}
                      <motion.div 
                        className="absolute inset-0 opacity-10"
                        style={{ 
                          backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPgogIDxmaWx0ZXIgaWQ9Im5vaXNlIj4KICAgIDxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIwLjY1IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiByZXN1bHQ9Im5vaXNlIj48L2ZlVHVyYnVsZW5jZT4KICAgIDxmZVNwZWN1bGFyTGlnaHRpbmcgc3VyZmFjZVNjYWxlPSIxMCIgc3BlY3VsYXJDb25zdGFudD0iMS4yIiBzcGVjdWxhckV4cG9uZW50PSIyMCIgbGlnaHRpbmctY29sb3I9IiM4MGZmODAiIGluPSJub2lzZSIgcmVzdWx0PSJzcGVjT3V0Ij4KICAgICAgPGZlRGlzdGFudExpZ2h0IGF6aW11dGg9IjMiIGVsZXZhdGlvbj0iMTAwIj48L2ZlRGlzdGFudExpZ2h0PgogICAgPC9mZVNwZWN1bGFyTGlnaHRpbmc+CiAgPC9maWx0ZXI+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI25vaXNlKSI+PC9yZWN0Pgo8L3N2Zz4=')",
                          backgroundSize: "cover",
                        }}
                        animate={{
                          opacity: [0.05, 0.1, 0.05]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                      />
                    </>
                  )}

                  <div className="relative z-10 flex flex-col items-center">
                    <span className="tracking-widest">
                      {!selectedRole || !username.trim() ? "SELECT OPERATIVE & ENTER ALIAS" : (
                        <>
                          <motion.span 
                            className="text-glow tracking-widest inline-block"
                            animate={{
                              textShadow: [
                                "0 0 5px rgba(0, 255, 163, 0.7), 0 0 10px rgba(0, 255, 163, 0.5)",
                                "0 0 8px rgba(0, 255, 163, 0.9), 0 0 15px rgba(0, 255, 163, 0.7)",
                                "0 0 5px rgba(0, 255, 163, 0.7), 0 0 10px rgba(0, 255, 163, 0.5)"
                              ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            INITIATE HEIST PROTOCOL
                          </motion.span>
                          <motion.span
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="ml-2 inline-block"
                          >
                            →
                          </motion.span>
                        </>
                      )}
                    </span>
                    {selectedRole && username.trim() && (
                      <motion.div 
                        className="w-full h-0.5 bg-green-500/50 mt-1.5"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
                      />
                    )}
                  </div>
                </motion.button>
              </motion.div>
            </motion.form>
          )}
        </div>
      </div>

      {/* Scan lines overlay - common in cyberpunk interfaces */}
      <div
        className="pointer-events-none fixed inset-0 z-20 overflow-hidden opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(transparent 50%, rgba(0, 255, 100, 0.2) 50%)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Corner decorative elements - adds cyberpunk feel */}
      <div className="fixed top-4 left-4 border-t-2 border-l-2 border-green-400/30 w-12 h-12 pointer-events-none" />
      <div className="fixed top-4 right-4 border-t-2 border-r-2 border-green-400/30 w-12 h-12 pointer-events-none" />
      <div className="fixed bottom-4 left-4 border-b-2 border-l-2 border-green-400/30 w-12 h-12 pointer-events-none" />
      <div className="fixed bottom-4 right-4 border-b-2 border-r-2 border-green-400/30 w-12 h-12 pointer-events-none" />
    </main>
  );
}

export default function RoleSelectionPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4">
          <p className="font-mono">Loading...</p>
        </main>
      }
    >
      <RoleSelectionClient />
    </Suspense>
  );
}
