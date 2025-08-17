"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface HackPhoneLoginScreenProps {
  onSlideToUnlock?: () => void;
}

const HackPhoneLoginScreen: React.FC<HackPhoneLoginScreenProps> = ({ onSlideToUnlock }) => {
  const [slidePosition, setSlidePosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [now, setNow] = useState(new Date());
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const latestClientX = useRef<number | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const getMaxPosition = () => {
    const sliderEl = sliderRef.current;
    const knobEl = knobRef.current;
    if (!sliderEl || !knobEl) return 0;
    const sliderWidth = sliderEl.clientWidth;
    const knobWidth = knobEl.clientWidth;
    return Math.max(0, sliderWidth - knobWidth - 8);
  };

  const handleSlideStart = (clientX: number) => {
    setIsDragging(true);
    setDragStartX(clientX - slidePosition);
  };

  const handleSlideMove = (clientX: number) => {
    if (!isDragging) return;
    // Throttle updates with requestAnimationFrame for smoother motion
    latestClientX.current = clientX;
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const maxPosition = getMaxPosition();
      const client = latestClientX.current ?? clientX;
      const newPos = Math.max(0, Math.min(maxPosition, client - dragStartX));
      setSlidePosition(newPos);
    });
  };

  const handleSlideEnd = () => {
    // cancel any pending rAF
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const maxPosition = getMaxPosition();
    if (slidePosition > maxPosition * 0.7) {
      setSlidePosition(maxPosition);
      setTimeout(() => {
        if (onSlideToUnlock) onSlideToUnlock();
      }, 200);
    } else {
      setSlidePosition(0);
    }
    setIsDragging(false);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
    handleSlideStart(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => handleSlideMove(e.clientX);
  const onPointerUp = (e: React.PointerEvent) => {
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch {}
    handleSlideEnd();
  };

  const formatDate = (date: Date) => date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Compute progress percent for the fill bar (safe if refs not ready)
  const maxPosForRender = getMaxPosition();
  const progressPercent = maxPosForRender > 0 ? Math.max(0, Math.min(100, (slidePosition / maxPosForRender) * 100)) : 0;

  return (
    <div className="w-screen h-screen bg-black flex flex-col font-[Helvetica,Arial,ui-sans-serif] overflow-hidden">
      <style jsx>{`
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>

      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute left-0 right-0 top-0"
          style={{ bottom: 'calc(clamp(58px,10.5vw,76px) + 0.75rem)' }}
        >
          <Image src="/hackphone/lock-screen.png" alt="lock screen" fill className="object-cover" />
        </div>

        <div className="text-center text-white mb-8 relative z-10 pt-20">
          <div className="text-6xl font-thin mb-2 drop-shadow-lg">{formatTime(now)}</div>
          <div className="text-lg text-white/90 drop-shadow-lg">{formatDate(now)}</div>
        </div>

  <div className="flex-1"></div>

  {/* Bottom bezel overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 right-0 w-full h-[clamp(74px,12vw,92px)] bg-black/80 border-t border-white/10 ring-1 ring-black/60 shadow-[0_18px_40px_rgba(0,0,0,0.7)] overflow-hidden z-[40]"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/40" />
          <div className="absolute top-0 left-0 right-0 h-px bg-white/20" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-black/70" />
        </div>

        {/* Slider positioned just above the Home button (above bezel, below home) */}
        <div className="absolute left-0 right-0 bottom-20 z-[45] pointer-events-auto">
          <div className="w-full max-w-[22rem] mx-auto px-6">
            <div
              ref={sliderRef}
              className="relative w-full h-12 rounded-[22px] border border-white/20 overflow-hidden supports-[backdrop-filter]:backdrop-blur-sm bg-gradient-to-b from-black/70 via-black/50 to-black/60 shadow-[inset_0_2px_0_rgba(255,255,255,0.06),inset_0_-2px_0_rgba(0,0,0,0.6),0_8px_20px_rgba(0,0,0,0.6)]"
            >
              {/* Track subtle hairlines */}
              <div className="absolute top-0 left-0 right-0 h-px bg-white/25 opacity-60" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-black/70" />

              {/* Progress fill */}
              <div
                aria-hidden
                className="absolute left-1 top-1 bottom-1 rounded-full bg-gradient-to-r from-cyan-400/45 via-sky-400/25 to-transparent pointer-events-none"
                style={{ width: `${progressPercent}%`, transition: isDragging ? 'none' : 'width 220ms ease' }}
              />

              {/* Instruction label with shimmer, padded to clear the knob */}
              <div className="absolute inset-0 flex items-center justify-center pl-16 pr-4 pointer-events-none">
                <div className="relative text-[13px] tracking-wide">
                  <span
                    className="text-white/85 drop-shadow-md"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.45) 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      backgroundSize: "180% 100%",
                      animation: "shimmer 1.6s infinite",
                    }}
                  >
                    slide to unlock
                  </span>
                </div>
              </div>

              {/* Circular knob */}
              <div
                ref={knobRef}
                className={`absolute top-1 left-1 h-10 w-10 rounded-full border border-black/10 bg-white/95 flex items-center justify-center ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'} select-none shadow-[0_8px_20px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(0,0,0,0.12)]`}
                style={{ transform: `translateX(${slidePosition}px)`, transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(.2,.9,.3,1)' }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {/* Inner ring and icon */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white to-neutral-200" />
                <div className="relative z-10 w-3.5 h-3.5 rounded-full bg-black/12" />
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute z-20">
                  <path d="M8 5l8 7-8 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Home button */}
        <button
          aria-label="Home"
          className="group absolute bottom-2.5 left-1/2 -translate-x-1/2 w-[clamp(58px,10.5vw,76px)] h-[clamp(58px,10.5vw,76px)] rounded-full bg-neutral-900/70 border border-white/10 ring-1 ring-white/20 shadow-[0_14px_30px_rgba(0,0,0,0.65)] active:translate-y-[1px] transition-transform duration-100 supports-[backdrop-filter]:backdrop-blur-md overflow-hidden z-[50]"
        >
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/18 via-transparent to-transparent" />
          <div className="absolute inset-[10%] rounded-full bg-gradient-to-b from-neutral-900 to-black shadow-[inset_0_8px_12px_rgba(255,255,255,0.06),inset_0_-10px_16px_rgba(0,0,0,0.55)] group-active:shadow-[inset_0_4px_8px_rgba(255,255,255,0.04),inset_0_-6px_10px_rgba(0,0,0,0.55)]" />
          <div
            className="pointer-events-none absolute -top-1 left-0 w-[65%] h-[65%] opacity-45"
            style={{
              background:
                "radial-gradient(120px 80px at 30% 20%, rgba(255,255,255,0.35), rgba(255,255,255,0.05) 55%, transparent 60%)",
              borderTopLeftRadius: 9999,
            }}
          />
          <div className="relative z-10 w-[26%] h-[26%] mx-auto my-auto border-2 border-white/85 rounded-[6px] shadow-[0_0_1px_1px_rgba(255,255,255,0.4)]" />
        </button>
      </div>
    </div>
  );
};

export default HackPhoneLoginScreen;
