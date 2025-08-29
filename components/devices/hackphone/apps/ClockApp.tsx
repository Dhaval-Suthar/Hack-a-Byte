"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ClockAppProps {
  onClose: () => void;
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

const ClockApp: React.FC<ClockAppProps> = () => {
  const [now, setNow] = useState<Date>(new Date());
  const [tab, setTab] = useState<string>("world");
  const stopwatchStart = useRef<Date | null>(null);
  const [stopwatchElapsed, setStopwatchElapsed] = useState<number>(0); // ms
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Stopwatch laps
  const [laps, setLaps] = useState<number[]>([]);
  const lastLapElapsedRef = useRef<number>(0);

  // Alarms
  type Alarm = { id: string; time: string; label: string; enabled: boolean; lastTriggered?: string };
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showAddAlarm, setShowAddAlarm] = useState(false);
  const [newAlarmTime, setNewAlarmTime] = useState<string>("07:00");
  const [newAlarmLabel, setNewAlarmLabel] = useState<string>("");
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timer (iOS 4 style)
  const [timerHours, setTimerHours] = useState<number>(0);
  const [timerMinutes, setTimerMinutes] = useState<number>(1);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerEndAt, setTimerEndAt] = useState<number | null>(null);
  const [timerRemainingMs, setTimerRemainingMs] = useState<number>(0);
  const hoursColRef = useRef<HTMLDivElement | null>(null);
  const minutesColRef = useRef<HTMLDivElement | null>(null);

  // Ticker (1s) only when World Clock tab is active, to avoid needless rerenders elsewhere
  useEffect(() => {
    if (tab !== "world") return;
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [tab]);

  // Alarm: load/save
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hackphone.clock.alarms");
      if (raw) setAlarms(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("hackphone.clock.alarms", JSON.stringify(alarms));
    } catch {}
  }, [alarms]);

  // Alarm: trigger check every second without forcing rerenders of the whole app
  useEffect(() => {
    const id = window.setInterval(() => {
      const n = new Date();
      const hh = two(n.getHours());
      const mm = two(n.getMinutes());
      const minuteKey = `${n.getFullYear()}-${two(n.getMonth()+1)}-${two(n.getDate())} ${hh}:${mm}`;
      let shouldPlay = false;
      setAlarms(prev => {
        let changed = false;
        const next = prev.map(a => {
          if (!a.enabled) return a;
          if (a.time === `${hh}:${mm}` && a.lastTriggered !== minuteKey) {
            shouldPlay = true;
            changed = true;
            return { ...a, lastTriggered: minuteKey };
          }
          return a;
        });
        return changed ? next : prev;
      });
      if (shouldPlay && alarmAudioRef.current) {
        alarmAudioRef.current.currentTime = 0;
        void alarmAudioRef.current.play();
      }
    }, 1000);
    return () => window.clearInterval(id);
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
    setLaps([]);
    lastLapElapsedRef.current = 0;
  };
  const addLap = () => {
    if (!stopwatchRunning) return;
    const lapDuration = stopwatchElapsed - lastLapElapsedRef.current;
    lastLapElapsedRef.current = stopwatchElapsed;
    setLaps(prev => [lapDuration, ...prev]);
  };

  // Formatting helpers (not used by the new timer/stopwatch UIs)

  // Kept for potential future use; analog mode removed from Stopwatch
  // const formatStopwatch = (ms: number) => {
  //   const totalSeconds = Math.floor(ms / 1000);
  //   const hours = Math.floor(totalSeconds / 3600);
  //   const minutes = Math.floor((totalSeconds % 3600) / 60);
  //   const seconds = totalSeconds % 60;
  //   const hundredths = Math.floor((ms % 1000) / 10);
  //   return `${hours > 0 ? hours + ":" : ""}${two(minutes)}:${two(seconds)}.${two(hundredths)}`;
  // };

  // Analog clock angles
  // Analog variables removed in digital stopwatch UI

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
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1e1e1e] via-[#2c2c2c] to-[#1a1a1a]">
      {WORLD_CLOCKS.map((w, index) => {
        const { hour12, minute, dayPeriod } = getTZParts(w.timezone);
        const { hourAngleTz, minuteAngleTz, secondAngleTz } = tzAnalogAngles(w.timezone);
        return (
          <div key={w.id} className={`relative mx-4 my-2 rounded-lg h-20 overflow-hidden shadow-lg select-none flex items-center px-4 ${
            index % 2 === 0 
              ? 'bg-gradient-to-r from-[#3a3a3a] via-[#4a4a4a] to-[#3a3a3a] border border-[#5a5a5a]/30' 
              : 'bg-gradient-to-r from-[#353535] via-[#454545] to-[#353535] border border-[#555555]/30'
          }`}>
            {/* iOS 4 style glossy overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            {/* Left: city info */}
            <div className="relative z-10 flex-1">
              <div className="text-white font-semibold text-base tracking-wide drop-shadow-sm">{w.city}</div>
              <div className="text-xs text-gray-300 mt-0.5 font-medium">Today</div>
            </div>
            
            {/* Center: iOS 4 style analog clock */}
            <div className="relative z-10 mx-4">
              <div className="relative w-12 h-12">
                {/* Clock face with iOS 4 styling */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white via-gray-200 to-gray-300 border border-gray-400 shadow-inner" />
                <div className="absolute inset-0.5 rounded-full bg-gradient-to-b from-white to-gray-100 shadow-inner" />
                
                {/* Hour markers */}
                {Array.from({ length: 12 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute left-1/2 top-1/2 w-0.5 h-2 bg-black/80 origin-top" 
                    style={{ transform: `rotate(${i * 30}deg) translateY(-22px)` }} 
                  />
                ))}
                
                {/* Clock hands with iOS 4 styling */}
                <div 
                  className="absolute left-1/2 top-1/2 origin-top w-1 h-4 bg-black rounded-full shadow-sm" 
                  style={{ transform: `rotate(${hourAngleTz}deg) translate(-50%,0)` }} 
                />
                <div 
                  className="absolute left-1/2 top-1/2 origin-top w-0.5 h-5 bg-black rounded-full shadow-sm" 
                  style={{ transform: `rotate(${minuteAngleTz}deg) translate(-50%,0)` }} 
                />
                <div 
                  className="absolute left-1/2 top-1/2 origin-top w-[1px] h-5 bg-red-600 rounded-full" 
                  style={{ transform: `rotate(${secondAngleTz}deg) translate(-50%,0)` }} 
                />
                
                {/* Center dot */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black rounded-full shadow-sm" />
              </div>
            </div>
            
            {/* Right: digital time with iOS 4 styling */}
            <div className="relative z-10 text-right">
              <div className="flex items-baseline font-mono text-white drop-shadow-sm">
                <span className="text-xl font-bold tabular-nums tracking-tight">{two(hour12)}:{two(minute)}</span>
                <span className="ml-1 text-sm font-semibold">{dayPeriod}</span>
              </div>
              <div className="text-xs text-gray-300 font-medium mt-0.5">{w.timezone.split('/')[1]?.replace('_', ' ')}</div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Stopwatch / Timer Views — iOS 4 digital stopwatch with Start/Stop, Lap, Reset and lap list
  const StopwatchView = () => (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      {/* Digital time */}
      <div className="pt-6 pb-4 text-center">
        <div className="text-6xl sm:text-7xl font-mono text-white tracking-widest drop-shadow">{(() => {
          const ms = stopwatchElapsed;
          const totalSeconds = Math.floor(ms / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          const tenths = Math.floor((ms % 1000) / 100);
          return `${two(minutes)}:${two(seconds)}.${tenths}`;
        })()}</div>
      </div>

      {/* Control buttons like iOS 4 */}
      <div className="flex items-center justify-center gap-6 px-4 pb-4">
        <button
          onClick={startStopwatch}
          className={`${stopwatchRunning ? 'bg-gradient-to-b from-red-500 to-red-700' : 'bg-gradient-to-b from-green-500 to-green-700'} text-white px-6 py-2 rounded-md font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.6)] border border-black/40 min-w-[96px]`}
        >
          {stopwatchRunning ? 'Stop' : 'Start'}
        </button>

        <button
          onClick={stopwatchRunning ? addLap : resetStopwatch}
          disabled={!stopwatchRunning && stopwatchElapsed === 0}
          className={`bg-gradient-to-b from-[#eee] to-[#bbb] text-black px-6 py-2 rounded-md font-semibold border border-black/40 min-w-[96px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.5)] ${!stopwatchRunning && stopwatchElapsed === 0 ? 'opacity-50' : ''}`}
        >
          {stopwatchRunning ? 'Lap' : 'Reset'}
        </button>
      </div>

      {/* Laps list like iOS 4 */}
      <div className="flex-1 overflow-y-auto px-4">
        {laps.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">No laps</div>
        ) : (
          <div className="divide-y divide-black/40 border-t border-b border-black/40 rounded-md overflow-hidden bg-gradient-to-b from-[#4a4a4a] to-[#3a3a3a]">
            {laps.map((lap, idx) => (
              <div key={idx} className="flex justify-between items-center px-4 py-3 text-white/90">
                <span className="uppercase text-xs tracking-wide">lap {laps.length - idx}</span>
                <span className="font-mono">{(() => {
                  const s = Math.floor(lap / 1000);
                  const m = Math.floor(s / 60);
                  const sec = s % 60;
                  const tenths = Math.floor((lap % 1000) / 100);
                  return `${two(m)}:${two(sec)}.${tenths}`;
                })()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const TimerView = () => {
  // Picker constants (match container h-40 => 160px and item h-8 => 32px)
  const ITEM_H = 32; // px
  const VIEW_H = 160; // px
  const PAD = (VIEW_H / 2) - (ITEM_H / 2); // 64px

  // Debounce refs for snapping
  const hoursScrollTORef = useRef<number | null>(null);
  const minutesScrollTORef = useRef<number | null>(null);

  // Countdown ticker: single interval + refs to avoid re-renders when not running
  const timerRunningRef = useRef(timerRunning);
  const timerEndAtRef = useRef<number | null>(timerEndAt);
  // Keep refs in sync with state without triggering renders
  timerRunningRef.current = timerRunning;
  timerEndAtRef.current = timerEndAt;

  useEffect(() => {
    const id = window.setInterval(() => {
      const running = timerRunningRef.current;
      const endAt = timerEndAtRef.current;
      if (!running || !endAt) return;
      const rem = Math.max(0, endAt - Date.now());
      setTimerRemainingMs(rem);
      if (rem <= 0) {
        setTimerRunning(false);
        if (alarmAudioRef.current) {
          alarmAudioRef.current.currentTime = 0;
          void alarmAudioRef.current.play();
        }
      }
    }, 100);
    return () => window.clearInterval(id);
  }, []);

    const totalPickMs = (timerHours * 60 + timerMinutes) * 60 * 1000;
    const displayMs = timerRunning ? timerRemainingMs : totalPickMs;
    const dispSec = Math.floor(displayMs / 1000);
    const dispH = Math.floor(dispSec / 3600);
    const dispM = Math.floor((dispSec % 3600) / 60);
    const dispS = dispSec % 60;

    const startTimer = () => {
      const ms = totalPickMs;
      if (ms <= 0) return;
      setTimerEndAt(Date.now() + ms);
      setTimerRemainingMs(ms);
      setTimerRunning(true);
    };
    const cancelTimer = () => {
      setTimerRunning(false);
      setTimerEndAt(null);
      setTimerRemainingMs(0);
    };

    // Simple wheel columns (no inertia) for hours/minutes
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    // Scroll helpers: snap to nearest and update value
  const snapScroll = (ref: React.RefObject<HTMLDivElement | null>, setVal: (n: number) => void, max: number) => {
      const el = ref.current;
      if (!el) return;
      const raw = el.scrollTop - PAD;
      let idx = Math.round(raw / ITEM_H);
      if (Number.isNaN(idx)) idx = 0;
      idx = Math.min(Math.max(idx, 0), max);
      const target = PAD + idx * ITEM_H;
      if (Math.abs(el.scrollTop - target) > 1) {
        el.scrollTo({ top: target, behavior: "smooth" });
      }
      setVal(idx);
    };

    const onHoursScroll = () => {
      if (timerRunning) return;
      const el = hoursColRef.current;
      if (el) {
        const raw = el.scrollTop - PAD;
        let idx = Math.round(raw / ITEM_H);
        if (Number.isNaN(idx)) idx = 0;
        idx = Math.min(Math.max(idx, 0), hours.length - 1);
        if (idx !== timerHours) setTimerHours(idx);
      }
      if (hoursScrollTORef.current) window.clearTimeout(hoursScrollTORef.current);
      hoursScrollTORef.current = window.setTimeout(() => snapScroll(hoursColRef, setTimerHours, hours.length - 1), 120);
    };
    const onMinutesScroll = () => {
      if (timerRunning) return;
      const el = minutesColRef.current;
      if (el) {
        const raw = el.scrollTop - PAD;
        let idx = Math.round(raw / ITEM_H);
        if (Number.isNaN(idx)) idx = 0;
        idx = Math.min(Math.max(idx, 0), minutes.length - 1);
        if (idx !== timerMinutes) setTimerMinutes(idx);
      }
      if (minutesScrollTORef.current) window.clearTimeout(minutesScrollTORef.current);
      minutesScrollTORef.current = window.setTimeout(() => snapScroll(minutesColRef, setTimerMinutes, minutes.length - 1), 120);
    };

  // Removed auto-align effects that fought with user scrolling; we only align on init and on click
    // Initialize scroll positions on first render
    useEffect(() => {
      const hEl = hoursColRef.current; const mEl = minutesColRef.current;
      if (hEl) hEl.scrollTo({ top: PAD + timerHours * ITEM_H });
      if (mEl) mEl.scrollTo({ top: PAD + timerMinutes * ITEM_H });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-black">
        {/* Countdown display */}
        <div className="pt-4 pb-2 text-center">
          <div className="text-5xl font-mono text-white tracking-widest drop-shadow">
            {two(dispH)}:{two(dispM)}:{two(dispS)}
          </div>
        </div>

        {/* Wheel pickers */}
        <div className="mx-6 rounded-xl overflow-hidden border border-black/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_8px_rgba(0,0,0,0.6)] bg-gradient-to-b from-[#dcdcdc] to-[#c8c8c8]">
          <div className="grid grid-cols-2">
            {/* Hours column */}
            <div className="relative h-40">
              <div className="absolute inset-y-1/2 -translate-y-1/2 left-0 right-0 h-8 bg-white/60 pointer-events-none" />
              <div
                ref={hoursColRef}
                className={`h-40 overflow-y-auto snap-y snap-mandatory text-center scrollbar-none ${timerRunning ? 'pointer-events-none' : ''}`}
                onScroll={onHoursScroll}
              >
                <div style={{ height: PAD }} />
                {hours.map(h => (
                  <div
                    key={h}
                    className={`snap-center h-8 flex items-center justify-center text-black ${h===timerHours?'font-bold text-lg':'text-gray-700'}`}
                    onClick={() => {
                      if (timerRunning) return;
                      setTimerHours(h);
                      const el = hoursColRef.current; if (el) el.scrollTo({ top: PAD + h * ITEM_H, behavior: 'smooth' });
                    }}
                  >
                    {h} {h===1? 'hour':'hours'}
                  </div>
                ))}
                <div style={{ height: PAD }} />
              </div>
            </div>
            {/* Minutes column */}
            <div className="relative h-40 border-l border-[#9aa]">
              <div className="absolute inset-y-1/2 -translate-y-1/2 left-0 right-0 h-8 bg-white/60 pointer-events-none" />
              <div
                ref={minutesColRef}
                className={`h-40 overflow-y-auto snap-y snap-mandatory text-center scrollbar-none ${timerRunning ? 'pointer-events-none' : ''}`}
                onScroll={onMinutesScroll}
              >
                <div style={{ height: PAD }} />
                {minutes.map(m => (
                  <div
                    key={m}
                    className={`snap-center h-8 flex items-center justify-center text-black ${m===timerMinutes?'font-bold text-lg':'text-gray-700'}`}
                    onClick={() => {
                      if (timerRunning) return;
                      setTimerMinutes(m);
                      const el = minutesColRef.current; if (el) el.scrollTo({ top: PAD + m * ITEM_H, behavior: 'smooth' });
                    }}
                  >
                    {m} {m===1? 'min':'mins'}
                  </div>
                ))}
                <div style={{ height: PAD }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tone selector row (static label for now) */}
        <div className="mx-6 mt-4 px-4 py-3 rounded-md bg-[#efefef] border border-black/30 flex items-center justify-between text-black">
          <span>When Timer Ends</span>
          <span className="text-gray-700">Doorbell</span>
        </div>

        {/* Start/Cancel button */}
        <div className="mx-6 mt-4 mb-[110px]">
          {timerRunning ? (
            <button onClick={cancelTimer} className="w-full py-3 rounded-md text-white bg-gradient-to-b from-red-500 to-red-700 border border-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_6px_rgba(0,0,0,0.6)] text-lg font-semibold">Cancel</button>
          ) : (
            <button onClick={startTimer} className="w-full py-3 rounded-md text-white bg-gradient-to-b from-green-500 to-green-700 border border-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_6px_rgba(0,0,0,0.6)] text-lg font-semibold">Start</button>
          )}
        </div>

        <audio ref={alarmAudioRef} src="/sounds/ding.mp3" preload="auto" />
      </div>
    );
  };

  const AlarmView = () => (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-black">
      {/* Add bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/50 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a]">
        <div className="text-white font-semibold">Alarms</div>
        <button onClick={() => setShowAddAlarm(v => !v)} className="bg-gradient-to-b from-blue-500 to-blue-700 text-white px-3 py-1 rounded-md border border-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_3px_rgba(0,0,0,0.5)]">
          {showAddAlarm ? 'Cancel' : 'Add'}
        </button>
      </div>

      {showAddAlarm && (
        <div className="px-4 py-3 flex items-center gap-3 border-b border-black/40 bg-[#202020]">
          <input type="time" value={newAlarmTime} onChange={e => setNewAlarmTime(e.target.value)} className="bg-[#2a2a2a] text-white px-3 py-2 rounded border border-black/50" />
          <input type="text" value={newAlarmLabel} onChange={e => setNewAlarmLabel(e.target.value)} placeholder="Label" className="flex-1 bg-[#2a2a2a] text-white px-3 py-2 rounded border border-black/50 placeholder:text-gray-400" />
          <button onClick={() => {
            const id = Math.random().toString(36).slice(2);
            setAlarms(prev => [{ id, time: newAlarmTime, label: newAlarmLabel || 'Alarm', enabled: true }, ...prev]);
            setShowAddAlarm(false);
            setNewAlarmLabel('');
          }} className="bg-gradient-to-b from-green-500 to-green-700 text-white px-3 py-2 rounded-md border border-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_2px_3px_rgba(0,0,0,0.5)]">Save</button>
        </div>
      )}

      {/* Alarms list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {alarms.length === 0 ? (
          <div className="text-center text-gray-400 mt-12">No Alarms</div>
        ) : (
          alarms.map(a => (
            <div key={a.id} className="mx-2 my-2 p-3 rounded-md bg-gradient-to-b from-[#3b3b3b] to-[#2a2a2a] border border-black/50 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-white text-2xl font-light font-mono">{a.time}</div>
                <div className="text-gray-300 text-xs">{a.label}</div>
              </div>
              <label className="inline-flex items-center cursor-pointer select-none">
                <input type="checkbox" className="sr-only" checked={a.enabled} onChange={e => setAlarms(prev => prev.map(x => x.id === a.id ? { ...x, enabled: e.target.checked } : x))} />
                <div className={`w-12 h-7 rounded-full p-1 ${a.enabled ? 'bg-green-600' : 'bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${a.enabled ? 'translate-x-5' : ''}`} />
                </div>
              </label>
              <button onClick={() => setAlarms(prev => prev.filter(x => x.id !== a.id))} className="text-red-400 text-sm px-2 py-1">Delete</button>
            </div>
          ))
        )}
      </div>

      <audio ref={alarmAudioRef} src="/sounds/ding.mp3" preload="auto" />
    </div>
  );

  const TabBar = () => {
    // Use external, open-licensed icons (Ionicons via Iconify CDN)
    const tabs = [
      { id: "world", label: "World Clock", img: "https://api.iconify.design/ion/globe-outline.svg?color=white" },
      { id: "alarm", label: "Alarm", img: "https://api.iconify.design/ion/alarm-outline.svg?color=white" },
      { id: "stopwatch", label: "Stopwatch", img: "https://api.iconify.design/ion/stopwatch-outline.svg?color=white" },
      { id: "timer", label: "Timer", img: "https://api.iconify.design/ion/timer-outline.svg?color=white" }
    ];
    return (
      <div className="flex bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border-t border-gray-600 h-20 fixed left-0 right-0 bottom-[clamp(74px,12vw,92px)] z-40 shadow-2xl">
        {/* iOS 4 style glossy overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        
        {tabs.map((t, index) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 flex flex-col items-center justify-center text-xs font-medium tracking-tight select-none transition-all duration-200 ${
              tab === t.id ? "text-white" : "text-gray-400"
            }`}
          >
            {/* iOS 4 style selection indicator */}
            {tab === t.id && (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-blue-600/30 via-blue-700/20 to-blue-800/30 rounded-lg mx-2 my-2" />
                <div className="absolute top-2 left-2 right-2 h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
              </>
            )}
            
            {/* Tab icon with iOS 4 styling */}
            <div className={`relative z-10 mb-1 ${tab === t.id ? 'transform scale-110' : ''} transition-transform duration-200`}>
              <Image
                src={t.img}
                alt={t.label}
                width={32}
                height={32}
                className={`h-8 w-8 object-contain drop-shadow-lg ${
                  tab === t.id ? "opacity-100" : "opacity-70"
                }`}
              />
            </div>
            
            {/* Tab label */}
            <span className={`relative z-10 leading-none text-[10px] font-medium ${
              tab === t.id ? "text-white drop-shadow-sm" : "text-gray-400"
            }`}>
              {t.label}
            </span>
            
            {/* iOS 4 style tab separator */}
            {index < tabs.length - 1 && (
              <div className="absolute right-0 top-4 bottom-4 w-[1px] bg-gradient-to-b from-transparent via-gray-600/50 to-transparent" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const headerTitle = tab === "world" ? "World Clock" : tab === "alarm" ? "Alarm" : tab === "stopwatch" ? "Stopwatch" : "Timer";

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-black font-sans">
      {/* iOS 4 styled header (no status bar, no back button) */}
      <div className="px-5 pb-3 pt-3 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] border-b border-gray-600 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none" />
        <div className="relative text-center text-white text-xl font-semibold tracking-wide drop-shadow-lg">{headerTitle}</div>
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
      
      {tab === "world" && <WorldClockList />}
  {tab === "alarm" && <AlarmView />}
      {tab === "stopwatch" && <StopwatchView />}
      {tab === "timer" && <TimerView />}
      <TabBar />
    </div>
  );
};

export default ClockApp;
