"use client";

import React, { useState, useEffect, useRef } from "react";

interface HackPhoneLoginScreenProps {
  username?: string;
  onLogin?: (username: string, password: string) => void;
  error?: string | null;
  isLoading?: boolean;
  isSigningUp?: boolean;
  onSignupToggle?: () => void;
  isPlayspaceUser?: boolean;
  onSlideToUnlock?: () => void;
}

const HackPhoneLoginScreen: React.FC<HackPhoneLoginScreenProps> = ({
  username,
  onLogin,
  error,
  isLoading = false,
  isSigningUp = false,
  onSignupToggle,
  isPlayspaceUser = false,
  onSlideToUnlock,
}) => {
  const [inputUsername, setInputUsername] = useState("");
  const [password, setPassword] = useState("");
  // time state removed for status bar
  const [showLockAnimation, setShowLockAnimation] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [slidePosition, setSlidePosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [hasPasscode, setHasPasscode] = useState(false);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);

  // status bar time removed

  // Show lock screen animation when logging in with username
  useEffect(() => {
    if (username) {
      setShowLockAnimation(true);
    }
  }, [username]);

  // Determine if device has a passcode without reading localStorage during render
  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("hackphone_password") : null;
      setHasPasscode(!!saved);
    } catch {}
  }, []);

  // Handle slide to unlock
  const getMaxPosition = () => {
    const sliderEl = sliderRef.current;
    const knobEl = knobRef.current;
    if (!sliderEl || !knobEl) return 0;
    const sliderWidth = sliderEl.clientWidth;
    const knobWidth = knobEl.clientWidth;
    return Math.max(0, sliderWidth - knobWidth - 8); // padding compensation
  };

  const handleSlideStart = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX - slidePosition);
  };

  const handleSlideMove = (clientX: number) => {
    if (!isDragging) return;
    const maxPosition = getMaxPosition();
    const newPos = Math.max(0, Math.min(maxPosition, clientX - dragStartX));
    setSlidePosition(newPos);
  };

  const handleSlideEnd = () => {
    const maxPosition = getMaxPosition();
    if (slidePosition > maxPosition * 0.75) {
      setSlidePosition(maxPosition);
      setTimeout(() => {
        if (onSlideToUnlock) onSlideToUnlock();
        else setShowLoginForm(true);
      }, 150);
    } else {
      setSlidePosition(0);
    }
    setIsDragging(false);
  };

  // Pointer events (unified mouse/touch)
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSlideStart(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => handleSlideMove(e.clientX);
  const onPointerUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    handleSlideEnd();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin) {
      // Check if it's device password mode
      if (hasPasscode) {
        // For device password, use password field for passcode and dummy username
        onLogin("device", password.trim());
      } else {
        // For playspace login, use both username and password
        if (inputUsername.trim() && password.trim()) {
          onLogin(inputUsername.trim(), password.trim());
        }
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (showLockAnimation && username) {
    return (
      <div className="w-screen h-screen bg-gradient-to-b from-blue-600 via-purple-600 to-pink-600 flex flex-col">
  {/* status bar removed */}

        {/* Welcome message */}
        <div className="flex-1 flex flex-col items-center justify-center text-white text-center px-8">
          <div className="mb-8">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-md border border-white/30">
              <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
            <h2 className="text-2xl font-light mb-2">Welcome back</h2>
            <p className="text-lg text-white/80">{username}</p>
          </div>

          {/* Unlock animation */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-white/60 border-t-white rounded-full animate-spin mb-4" />
            <p className="text-sm text-white/70">Unlocking HackPhone...</p>
          </div>
        </div>

        {/* Bottom indicator */}
        <div className="pb-8 flex justify-center">
          <div className="w-32 h-1 bg-white/30 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col font-[Helvetica,Arial,ui-sans-serif]">
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      {/* Lock screen background */}
      <div className="flex-1 relative overflow-hidden">
        {/* iPhone 4-ish wallpaper feel (cool blue aurora with subtle noise) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2342] via-[#0f2e5e] to-[#091a2e]" />
        <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:"radial-gradient(circle at 20% 10%, rgba(255,255,255,0.25) 0, rgba(255,255,255,0) 40%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.18) 0, rgba(255,255,255,0) 35%), radial-gradient(circle at 50% 80%, rgba(255,255,255,0.12) 0, rgba(255,255,255,0) 45%)"}} />
        <div className="absolute inset-0" style={{backgroundImage:"url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\" viewBox=\"0 0 160 160\"><filter id=\"n\"><feTurbulence baseFrequency=\"0.8\" numOctaves=\"2\" seed=\"2\"/></filter><rect width=\"100%\" height=\"100%\" filter=\"url(%23n)\" opacity=\"0.04\"/></svg>')"}} />

  {/* status bar removed */}

        {/* Time display */}
        <div className="text-center text-white mb-8 relative z-10">
          <div className="text-6xl font-thin mb-2">{/* time removed */}</div>
          <div className="text-lg text-white/70">{formatDate(new Date())}</div>
        </div>

        {/* Lock screen content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
          {onSlideToUnlock && !showLoginForm ? (
            // Slide to unlock interface
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 mx-auto backdrop-blur-md border border-white/20">
                <span className="text-4xl">🔒</span>
              </div>
              
              {/* Slide to unlock */}
              <div className="w-72 mx-auto mb-8">
                <div
                  ref={sliderRef}
                  className="relative w-72 h-12 bg-black/40 rounded-full border border-white/25 overflow-hidden"
                  style={{boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.4)"}}
                >
                  {/* shimmer text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative text-[13px] tracking-wide uppercase">
                      <span className="text-white/60" style={{background: "linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.3) 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", backgroundSize: "200% 100%", animation: "shimmer 2s infinite"}}>slide to unlock</span>
                    </div>
                  </div>

                  {/* knob */}
                  <div
                    ref={knobRef}
                    className="absolute top-1 left-1 w-10 h-10 bg-white rounded-full flex items-center justify-center cursor-pointer select-none"
                    style={{transform: `translateX(${slidePosition}px)`, boxShadow: "0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.9)"}}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 4l8 8-8 8" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-white/50 mb-6">
                Swipe to access HackPhone
              </p>
            </div>
          ) : onLogin || showLoginForm ? (
            // Passcode entry for device password
            hasPasscode ? (
              <div className="w-full max-w-sm">
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <span className="text-2xl">🔓</span>
                    </div>
                    <h2 className="text-xl font-light text-white mb-2">Enter Passcode</h2>
                    <p className="text-sm text-white/70">Enter your device passcode to unlock</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="password"
                        placeholder="Device Passcode"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all text-center text-lg tracking-widest"
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm text-center">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !password.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Unlocking...
                        </div>
                      ) : (
                        "Unlock"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // Original login form for playspace authentication
              <div className="w-full max-w-sm">
                <div className="bg-black/30 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <span className="text-2xl">🔓</span>
                    </div>
                    <h2 className="text-xl font-light text-white mb-2">
                      {isSigningUp ? "Create Account" : isPlayspaceUser ? "Device Login" : "Join HackPhone"}
                    </h2>
                    <p className="text-sm text-white/70">
                      {isSigningUp ? "Set up your HackPhone profile" : isPlayspaceUser ? "Enter your device credentials" : "Enter your hacker credentials"}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Username"
                        value={inputUsername}
                        onChange={(e) => setInputUsername(e.target.value)}
                        className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/10 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all"
                        disabled={isLoading}
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm text-center">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !inputUsername.trim() || !password.trim()}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Connecting...
                        </div>
                      ) : (
                        isSigningUp ? "Create Account" : "Unlock"
                      )}
                    </button>

                    {onSignupToggle && !isPlayspaceUser && (
                      <button
                        type="button"
                        onClick={onSignupToggle}
                        className="w-full text-blue-400 hover:text-blue-300 text-sm py-2 transition-colors"
                      >
                        {isSigningUp ? "Already have an account? Sign in" : "New to HackPhone? Create account"}
                      </button>
                    )}
                  </form>
                </div>
              </div>
            )
          ) : (
            // Just display mode (when no onLogin and no onSlideToUnlock)
            <div className="text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 mx-auto backdrop-blur-md border border-white/30">
                <span className="text-3xl">🔒</span>
              </div>
              <p className="text-lg text-white/80">HackPhone is locked</p>
            </div>
          )}
        </div>

        {/* Bottom indicators */}
        <div className="pb-8 flex justify-center relative z-10">
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-white/60 rounded-full" />
            <div className="w-2 h-2 bg-white/30 rounded-full" />
            <div className="w-2 h-2 bg-white/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackPhoneLoginScreen;
