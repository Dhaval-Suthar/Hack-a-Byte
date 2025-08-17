"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ClockAppProps {
  onClose: () => void;
  time: Date; // parent-provided device time (status bar reference)
}

// Simple utility
const two = (n: number) => n.toString().padStart(2, "0");

// World clock items
const WORLD_CLOCKS = [
  { id: "newyork", city: "New York", timezone: "America/New_York", img: "/hackphone/apps/clock/newyork_timezone_.png" },
  { id: "losangeles", city: "Los Angeles", timezone: "America/Los_Angeles", img: "/hackphone/apps/clock/los_angeles_timezone_.png" },
  { id: "bangkok", city: "Bangkok", timezone: "Asia/Bangkok", img: "/hackphone/apps/clock/Bankok_timezone_.png" },
  { id: "helsinki", city: "Helsinki", timezone: "Europe/Helsinki", img: "/hackphone/apps/clock/helsinki_timezone_.png" }
];

const ClockApp: React.FC<ClockAppProps> = ({ onClose, time }) => {
  const [now, setNow] = useState<Date>(new Date());
  const [tab, setTab] = useState<string>("world");
  const stopwatchStart = useRef<Date | null>(null);
  const [stopwatchElapsed, setStopwatchElapsed] = useState<number>(0); // ms
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ticker (1s) for normal time
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Stopwatch animation (60fps-ish when running)
  useEffect(() => {
    if (!stopwatchRunning) return;
    const frame = () => {
      if (stopwatchStart.current) {
        setStopwatchElapsed(Date.now() - stopwatchStart.current.getTime());
      }
      timerRef.current = setTimeout(frame, 1000 / 30);
    };
    frame();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stopwatchRunning]);

  const startStopwatch = () => {
    if (!stopwatchRunning) {
      stopwatchStart.current = new Date(Date.now() - stopwatchElapsed);
      setStopwatchRunning(true);
    } else {
      setStopwatchRunning(false);
    }
  };
  const resetStopwatch = () => {
    setStopwatchRunning(false);
    setStopwatchElapsed(0);
    stopwatchStart.current = null;
  };

  // Formatting helpers
  const statusTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const digitalMain = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  const digitalSeconds = (d: Date) => two(d.getSeconds());
  const dateLong = (d: Date) => d.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeIn = (tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: true }).format(now);

  const formatStopwatch = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${hours > 0 ? hours + ":" : ""}${two(minutes)}:${two(seconds)}.${two(hundredths)}`;
  };

  // Analog clock angles
  const hours = now.getHours() % 12;
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  const hourAngle = hours * 30 + minutes * 0.5 - 90;
  const minuteAngle = minutes * 6 - 90;
  const secondAngle = seconds * 6 - 90;

  // Reusable status bar (mimic design on image: assume dark overlay)
  const StatusBar = () => (
    <div className="flex justify-between items-center px-4 pt-8 pb-2 text-white text-xs select-none">
      <button onClick={onClose} className="text-blue-400 font-medium">← Back</button>
      <div className="flex items-center gap-2">
        <span>{statusTime(time)}</span>
        <div className="w-6 h-3 border border-white/70 rounded-sm relative">
          <div className="absolute left-0.5 top-0.5 h-2 w-3 bg-green-500 rounded-sm" />
          <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 h-2 w-0.5 bg-white/60 rounded-full" />
        </div>
      </div>
    </div>
  );

  // Get time parts for a timezone without constructing Date from string (for accuracy & perf)
  const getTZParts = (tz: string) => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    const parts = fmt.formatToParts(now).reduce<Record<string,string>>((acc, p) => { if (p.type !== 'literal') acc[p.type] = p.value; return acc; }, {});
    return {
      hour12: parts.hour ? parseInt(parts.hour, 10) : 0,
      minute: parts.minute ? parseInt(parts.minute, 10) : 0,
      second: parts.second ? parseInt(parts.second, 10) : 0,
      dayPeriod: parts.dayPeriod || "AM"
    };
  };

  const tzAnalogAngles = (tz: string) => {
    const { hour12, minute, second } = getTZParts(tz);
    const hourAngleTz = (hour12 % 12) * 30 + minute * 0.5 - 90;
    const minuteAngleTz = minute * 6 - 90;
    const secondAngleTz = second * 6 - 90;
    return { hourAngleTz, minuteAngleTz, secondAngleTz };
  };

  const WorldClockList = () => (
    <div className="flex-1 overflow-y-auto px-2 pb-52 pt-2 space-y-4 bg-black">
      {WORLD_CLOCKS.map((w) => {
        const { hour12, minute, second, dayPeriod } = getTZParts(w.timezone);
        const { hourAngleTz, minuteAngleTz, secondAngleTz } = tzAnalogAngles(w.timezone);
        return (
          <div key={w.id} className="relative rounded-2xl h-28 bg-[#d0d1d5]/80 dark:bg-white/10 overflow-hidden shadow-md select-none flex items-center px-3">
            {/* Removed watermark background image */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10" />
            {/* Left: city + date */}
            <div className="relative z-10 w-32 pr-2">
              <div className="text-white font-medium text-sm tracking-wide leading-tight">{w.city}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/70 mt-1 leading-snug">{dateLong(now).replace(/,(?=\s\d{4})/, ',')}</div>
            </div>
            {/* Center: analog clock */}
            <div className="relative z-10 flex-1 flex justify-center">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 rounded-full bg-gray-100/90 border border-black/20 shadow-inner" />
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="absolute left-1/2 top-1/2 w-1 h-4 bg-black/70 origin-top" style={{ transform: `rotate(${i * 30}deg) translateY(-42px)` }} />
                ))}
                {/* hands */}
                <div className="absolute left-1/2 top-1/2 origin-top w-1 h-10 bg-black rounded" style={{ transform: `rotate(${hourAngleTz}deg) translate(-50%,0)` }} />
                <div className="absolute left-1/2 top-1/2 origin-top w-0.5 h-12 bg-black rounded" style={{ transform: `rotate(${minuteAngleTz}deg) translate(-50%,0)` }} />
                <div className="absolute left-1/2 top-1/2 origin-top w-[2px] h-12 bg-red-500 rounded" style={{ transform: `rotate(${secondAngleTz}deg) translate(-50%,0)` }} />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full" />
              </div>
            </div>
            {/* Right: digital time */}
            <div className="relative z-10 w-28 pl-2 flex flex-col items-end justify-center">
              <div className="flex items-baseline font-mono text-white">
                <span className="text-2xl font-semibold tabular-nums tracking-wide">{two(hour12)}:{two(minute)}</span>
                <span className="ml-2 text-sm font-medium">{dayPeriod}</span>
              </div>
              <div className="text-[10px] text-white/50 font-mono mt-1">{two(second)} sec</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Stopwatch / Timer Views (reuse earlier logic)
  const StopwatchView = () => (
    <div className="flex-1 flex flex-col items-center bg-gradient-to-b from-black via-[#07080b] to-black">
      <div className="mt-6 relative w-64 h-64">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-900 to-black border border-white/10" />
        {Array.from({ length: 60 }).map((_, i) => {
          const isHour = i % 5 === 0;
          return (
            <div
              key={i}
              className={`${isHour ? "w-1 h-4 bg-white" : "w-0.5 h-2 bg-white/50"} absolute left-1/2 top-1/2 origin-top`}
              style={{ transform: `rotate(${i * 6}deg) translateY(-120px)` }}
            />
          );
        })}
        <div className="absolute left-1/2 top-1/2 origin-top w-1 h-20 bg-white rounded-full" style={{ transform: `rotate(${hourAngle}deg) translate(-50%,0)` }} />
        <div className="absolute left-1/2 top-1/2 origin-top w-0.5 h-28 bg-white rounded-full" style={{ transform: `rotate(${minuteAngle}deg) translate(-50%,0)` }} />
        <div className="absolute left-1/2 top-1/2 origin-top w-[2px] h-32 bg-red-500 rounded-full" style={{ transform: `rotate(${secondAngle}deg) translate(-50%,0)` }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full" />
      </div>
      <div className="mt-8 text-5xl font-mono font-light text-white tracking-wider select-none">
        {formatStopwatch(stopwatchElapsed)}
      </div>
      <div className="mt-10 flex gap-14">
        <button onClick={resetStopwatch} disabled={stopwatchElapsed === 0 && !stopwatchRunning} className={`w-20 h-20 rounded-full border-4 text-sm font-semibold transition-colors ${stopwatchElapsed === 0 && !stopwatchRunning ? "border-gray-600 text-gray-600" : "border-gray-400 text-white hover:bg-white/10"}`}>Reset</button>
        <button onClick={startStopwatch} className={`w-20 h-20 rounded-full border-4 text-sm font-semibold ${stopwatchRunning ? "border-red-400 bg-red-600/80 hover:bg-red-600 text-white" : "border-green-400 bg-green-600/80 hover:bg-green-600 text-white"}`}>{stopwatchRunning ? "Stop" : "Start"}</button>
      </div>
    </div>
  );

  const TimerView = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white font-mono">
      <div className="text-7xl font-light tracking-wider">{digitalMain(now)}</div>
      <div className="text-3xl text-white/60 mt-2">{digitalSeconds(now)}</div>
      <div className="mt-6 text-xs tracking-wide text-white/50 uppercase">{dateLong(now)}</div>
    </div>
  );

  const AlarmPlaceholder = () => (
    <div className="flex-1 flex flex-col items-center justify-center text-white/70 bg-gradient-to-b from-black to-[#0f1014]">
      <Image src="/hackphone/apps/clock/alarm_taskbar_.png" alt="Alarm" width={64} height={64} className="mb-6 opacity-80" />
      <h2 className="text-xl font-semibold mb-2">No Alarms</h2>
      <p className="text-xs">Tap + to add an alarm</p>
    </div>
  );

  const TabBar = () => {
    const tabs = [
      { id: "world", label: "World Clock", img: "/hackphone/apps/clock/taskbar_worldclock_.png" },
      { id: "alarm", label: "Alarm", img: "/hackphone/apps/clock/alarm_taskbar_.png" },
      { id: "stopwatch", label: "Stopwatch", img: "/hackphone/apps/clock/stopwatch_taskbar_.png" },
      { id: "timer", label: "Timer", img: "/hackphone/apps/clock/timer_taskbar_.png" }
    ];
    return (
      <div className="flex bg-gradient-to-b from-[#3a3a3c] via-[#1c1c1d] to-[#050505] border-t border-black/70 h-16 fixed left-0 right-0 bottom-28 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.9)] pb-[env(safe-area-inset-bottom)]">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center justify-center text-[11px] font-medium tracking-tight relative select-none ${tab === t.id ? "text-white" : "text-gray-400"}`}
          >
            {/* Active top bar */}
            {tab === t.id && <div className="absolute top-0 left-0 right-0 h-0.5 bg-sky-400" />}
            <Image
              src={t.img}
              alt={t.label}
              width={46}
              height={28}
              className={`h-6 w-auto object-contain mb-0.5 drop-shadow ${tab === t.id ? "opacity-100" : "opacity-70"}`}
            />
            <span className={`leading-none ${tab === t.id ? "text-white" : "text-gray-400"}`}>{t.label}</span>
          </button>
        ))}
      </div>
    );
  };

  const headerTitle = tab === "world" ? "World Clock" : tab === "alarm" ? "Alarm" : tab === "stopwatch" ? "Stopwatch" : "Timer";

  return (
    <div className="w-screen h-screen flex flex-col bg-black font-sans">
      <StatusBar />
      <div className="px-5 pb-2 pt-1 bg-black text-center text-white text-lg font-semibold tracking-wide">{headerTitle}</div>
      {tab === "world" && <WorldClockList />}
      {tab === "alarm" && <AlarmPlaceholder />}
      {tab === "stopwatch" && <StopwatchView />}
      {tab === "timer" && <TimerView />}
      <TabBar />
    </div>
  );
};

export default ClockApp;
