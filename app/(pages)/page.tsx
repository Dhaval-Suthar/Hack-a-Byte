"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useEffect, useRef, useMemo } from "react";
import { handleAccessCode } from "@/lib/access-code";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Page() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [accessCode, setAccessCode] = useState<string[]>(Array(6).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const terminalLines = useMemo(() => [
    { text: "> INITIALIZING SYSTEM...", delay: 500 },
    { text: "> CHECKING SECURITY PROTOCOLS...", delay: 1200 },
    { text: "> LOADING MAIN DATABASE...", delay: 2000 },
    { text: "> CONNECTING TO SECURE SERVER...", delay: 2800 },
    { text: "> ACCESS GRANTED. WELCOME TO HACKABYTE.", delay: 3500 },
  ], []);
  const [displayedLines, setDisplayedLines] = useState<number>(0);

  // Matrix rain effect for canvas background
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      let width = window.innerWidth;
      let height = window.innerHeight;

      canvas.width = width;
      canvas.height = height;

      // Matrix rain characters
      const characters =
        "アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const fontSize = 14;
      const columns = Math.floor(width / fontSize);

      // Array to track the y position of each character
      const drops: number[] = Array(columns).fill(1);

      // Draw the Matrix Rain
      const drawMatrix = () => {
        // Semi-transparent black background to create trail effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = "#00ff41";
        ctx.font = `${fontSize}px monospace`;

        for (let i = 0; i < drops.length; i++) {
          // Random character
          const char = characters.charAt(Math.floor(Math.random() * characters.length));
          // Draw the character
          ctx.fillText(char, i * fontSize, drops[i] * fontSize);

          // Randomly reset some drops to top with varying opacity
          if (drops[i] * fontSize > height && Math.random() > 0.975) {
            drops[i] = 0;
          }

          // Increment y coordinate
          drops[i]++;
        }
      };

      const matrixInterval = setInterval(drawMatrix, 50);

      const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
      };

      window.addEventListener("resize", handleResize);

      // Handle loading animation
      const loadingTimer = setTimeout(() => {
        setIsLoaded(true);
      }, 4000);

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

  // Handle access code input
  const handleCodeChange = (index: number, value: string) => {
    // Only accept numeric input
    if (value === "" || /^\d$/.test(value)) {
      const newCode = [...accessCode];
      newCode[index] = value;
      setAccessCode(newCode);

      // Clear error when user starts typing again
      if (error) {
        setError(null);
      }

      // Auto-focus next input
      if (value && index < accessCode.length - 1) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  // Handle backspace to navigate to previous input
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !accessCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle form submission
  const handleSubmit = async (formData: FormData) => {
    // Validate that all inputs are filled
    if (accessCode.some((digit) => digit === "")) {
      setError("Please enter a complete 6-digit access code");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Add user agent info to the form data
      formData.append("userAgent", navigator.userAgent);

      // We can't directly get IP on client, but server can determine it
      formData.append("ipAddress", "client-submission");

      const result = await handleAccessCode(formData);

      if (result.success) {
        // If there's a playspaceId in the result, store it in localStorage
        if (result.playspaceId) {
          localStorage.setItem("playspaceId", result.playspaceId);
          console.log("Stored playspaceId in localStorage:", result.playspaceId);
        }
        router.push(result.redirect || "/device-selection");
        try {
          await document.documentElement.requestFullscreen();
        } catch (error) {
          console.error("Failed to enter fullscreen mode:", error);
        }
      } else {
        setError(result.error || "Invalid access code. Please try again.");
        // Clear the input fields on error
        setAccessCode(Array(6).fill(""));
        // Focus on the first input
        const firstInput = document.getElementById("code-0");
        if (firstInput) firstInput.focus();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Paste handler for the access code
  const handlePaste = (e: React.ClipboardEvent, startIndex: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted content is numeric and of appropriate length
    if (/^\d+$/.test(pastedData)) {
      const digits = pastedData.split("").slice(0, 6 - startIndex);

      const newCode = [...accessCode];
      digits.forEach((digit, i) => {
        const index = startIndex + i;
        if (index < 6) {
          newCode[index] = digit;
        }
      });

      setAccessCode(newCode);

      // Focus on the next empty input or the last one
      const nextIndex = Math.min(startIndex + digits.length, 5);
      if (nextIndex < 6) {
        const nextInput = document.getElementById(`code-${nextIndex}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  return (
    <>
      {/* Matrix Rain Background */}
      <div className="fixed inset-0 z-0">
        <motion.canvas
          ref={canvasRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1 }}
          className="w-full h-full bg-black"
        />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="max-w-5xl w-full mx-auto grid md:grid-cols-2 gap-8 items-center"
        >
          {/* Terminal Block */}
          <div className="cyber-border p-4 bg-black/60 rounded-lg backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-r from-cyber-primary/20 to-cyber-secondary/20 flex items-center px-2">
              <div className="w-3 h-3 rounded-full bg-cyber-danger mr-2"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
              <div className="w-3 h-3 rounded-full bg-cyber-primary mr-2"></div>
              <span className="text-xs font-terminal text-cyber-primary/70 ml-2">terminal@hackabyte:~</span>
            </div>

            <div className="mt-6 font-terminal text-sm text-cyber-primary space-y-2 min-h-[200px]">
              {terminalLines.slice(0, displayedLines).map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={index === 4 ? "cyber-text font-bold" : ""}
                >
                  {line.text}
                </motion.div>
              ))}

              {isLoaded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center mt-4"
                >
                  <span className="text-cyber-primary mr-2">{">"}</span>
                  <span className="animate-pulse">_</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ delay: 4, duration: 0.5 }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl md:text-5xl font-terminal font-bold mb-4">
              <span className="cyber-text">HACK</span>
              <span className="text-white">ABYTE</span>
              <span className="cyber-text-danger">2025</span>
            </h1>

            <p className="text-gray-300 mb-6 font-terminal">
              The ultimate cybersecurity challenge awaits. Are you ready to hack the system?
            </p>

            {/* Access Code Input */}
            <form action={handleSubmit} className="mb-6">
              <label className="block text-cyber-primary text-sm font-terminal mb-2">ENTER ACCESS CODE:</label>
              <div className="flex space-x-2 justify-center md:justify-start">
                {accessCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`code-${index}`}
                    name={`code-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={(e) => handlePaste(e, index)}
                    className="w-10 h-12 text-center bg-black/60 border cyber-border text-cyber-primary font-terminal text-lg rounded focus:ring-1 focus:ring-cyber-primary focus:cyber-border focus:outline-none"
                    disabled={isSubmitting}
                  />
                ))}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-cyber-danger text-xs font-terminal mt-2 bg-cyber-danger/10 border border-cyber-danger/30 px-2 py-1 rounded"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-4">
                <button
                  type="submit"
                  className={`cyber-button rounded-md py-3 px-6 font-terminal relative ${
                    isSubmitting ? "opacity-70" : ""
                  }`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="opacity-0">ENTER_SYSTEM</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-5 w-5 border-2 border-transparent border-t-cyber-primary border-r-cyber-primary rounded-full animate-spin"></div>
                      </div>
                    </>
                  ) : (
                    "ENTER_SYSTEM"
                  )}
                </button>
                <Link href="learn_more" className="w-full sm:w-auto">
                  <button
                    type="button"
                    className="border border-gray-500 text-gray-300 hover:text-cyber-primary hover:cyber-border transition-all rounded-md py-3 px-6 font-terminal"
                  >
                    LEARN_MORE
                  </button>
                </Link>
              </div>
            </form>
          </motion.div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 30 }}
          transition={{ delay: 4.5, duration: 0.5 }}
          className="mt-20 w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: "PARTICIPANTS", value: "500+" },
            { label: "CHALLENGES", value: "20+" },
            { label: "PRIZE POOL", value: "$10K" },
            { label: "DAYS", value: "48:00:00" },
          ].map((stat, index) => (
            <div key={index} className="cyber-border p-4 bg-black/30 rounded-lg backdrop-blur-sm text-center">
              <div className="text-2xl font-bold cyber-text mb-1">{stat.value}</div>
              <div className="text-xs font-terminal text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </main>
    </>
  );
}
