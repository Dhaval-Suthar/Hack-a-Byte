"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

interface CalculatorAppProps {
  onClose: () => void;
  time: string;
}

function CalculatorApp({ onClose, time }: CalculatorAppProps) {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-6 relative">
      {/* Top bar for Hackphone frame */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-4 py-2 text-sm">
        <span>{time}</span>
        <button onClick={onClose} className="text-red-400">
          ✕
        </button>
      </div>

      <IPhone4Calculator />
    </div>
  );
}

// ----- Calculator Logic ----------------------------------------------------

type Op = "+" | "-" | "×" | "÷" | null;

interface CalcState {
  display: string;
  operand: number | null;
  op: Op;
  overwrite: boolean;
  lastKey: string | null;
  lastOperand: number | null;
}

const MAX_DIGITS = 12;

function formatDisplay(n: number): string {
  if (!isFinite(n)) return "Error";
  const abs = Math.abs(n);
  if ((abs !== 0 && (abs >= 1e12 || abs < 1e-9))) {
    return n.toExponential(6).replace("+", "");
  }
  const s = n.toLocaleString(undefined, {
    maximumFractionDigits: 9,
  });
  return s.length > 16 ? n.toPrecision(10) : s;
}

function parseDisplay(s: string): number {
  const normalized = s.replace(/,/g, "");
  const n = Number(normalized);
  return isNaN(n) ? 0 : n;
}

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? Infinity : a / b;
    default:
      return b;
  }
}

function percentTransform(current: number, stored: number | null, op: Op): number {
  if (stored !== null && op) {
    return (stored * current) / 100;
  }
  return current / 100;
}

function IPhone4Calculator() {
  const [state, setState] = useState<CalcState>({
    display: "0",
    operand: null,
    op: null,
    overwrite: true,
    lastKey: null,
    lastOperand: null,
  });

  const playClick = useClickSound();

  const inputDigit = useCallback((d: string) => {
    setState((s) => {
      if (s.overwrite) {
        return { ...s, display: d === "0" ? "0" : d, overwrite: false, lastKey: d };
      }
      if (s.display.replace(/\D/g, "").length >= MAX_DIGITS) return s;
      const next = s.display === "0" ? d : s.display + d;
      return { ...s, display: next, lastKey: d };
    });
  }, []);

  const inputDot = useCallback(() => {
    setState((s) => {
      if (s.overwrite) return { ...s, display: "0.", overwrite: false, lastKey: "." };
      if (s.display.includes(".")) return s;
      return { ...s, display: s.display + ".", lastKey: "." };
    });
  }, []);

  const clear = useCallback(() => {
    setState({ display: "0", operand: null, op: null, overwrite: true, lastKey: null, lastOperand: null });
  }, []);

  const plusMinus = useCallback(() => {
    setState((s) => {
      const n = -parseDisplay(s.display);
      return { ...s, display: formatDisplay(n), overwrite: true, lastKey: "+/-" };
    });
  }, []);

  const percent = useCallback(() => {
    setState((s) => {
      const current = parseDisplay(s.display);
      const transformed = percentTransform(current, s.operand, s.op);
      return { ...s, display: formatDisplay(transformed), overwrite: true, lastKey: "%" };
    });
  }, []);

  const setOperator = useCallback((op: Op) => {
    setState((s) => {
      const current = parseDisplay(s.display);
      if (s.operand === null) {
        return { ...s, operand: current, op, overwrite: true, lastKey: op, lastOperand: null };
      }
      const result = compute(s.operand, current, s.op);
      return {
        ...s,
        display: formatDisplay(result),
        operand: result,
        op,
        overwrite: true,
        lastKey: op,
        lastOperand: null,
      };
    });
  }, []);

  const equals = useCallback(() => {
    setState((s) => {
      const current = parseDisplay(s.display);
      if (s.op && s.operand !== null) {
        const right = s.overwrite && s.lastOperand !== null ? s.lastOperand : current;
        const result = compute(s.operand, right, s.op);
        return { ...s, display: formatDisplay(result), operand: result, overwrite: true, lastKey: "=", lastOperand: right };
      }
      return s;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (/^[0-9]$/.test(key)) {
        playClick();
        inputDigit(key);
      } else if (key === ".") {
        playClick();
        inputDot();
      } else if (key === "+") setOperator("+");
      else if (key === "-") setOperator("-");
      else if (key === "*") setOperator("×");
      else if (key === "x" || key === "X") setOperator("×");
      else if (key === "/") setOperator("÷");
      else if (key === "Enter" || key === "=") equals();
      else if (key.toLowerCase() === "c" || key === "Escape") clear();
      else if (key === "%") percent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clear, equals, inputDigit, inputDot, percent, setOperator, playClick]);

  const opIs = useCallback((op: Op) => state.op === op, [state.op]);

  const acOrC = useMemo(() => {
    const isZero = parseDisplay(state.display) === 0 && state.operand === null && !state.op;
    return isZero ? "AC" : "C";
  }, [state.display, state.operand, state.op]);

  const handleClear = useCallback(() => {
    if (acOrC === "AC") clear();
    else setState((s) => ({ ...s, display: "0", overwrite: true }));
  }, [acOrC, clear]);

  return (
    <div className="w-[330px] select-none">
      <div className="rounded-[42px] bg-neutral-800 p-3 shadow-[inset_0_2px_10px_rgba(255,255,255,0.06),0_15px_40px_rgba(0,0,0,0.6)]">
        <div className="rounded-[34px] bg-[radial-gradient(120%_120%_at_50%_-20%,#1a1a1a,#000)] p-5 border border-black/40 shadow-inner">
          <TopSpeakerNotch />
          <div className="mt-4 mb-3">
            <div className="text-right text-5xl font-light tracking-widest tabular-nums drop-shadow-[0_1px_0_rgba(0,0,0,0.8)]">
              <LCD value={state.display} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <CalcButton label={acOrC} variant="function" onClick={() => { playClick(); handleClear(); }} />
            <CalcButton label="+/-" variant="function" onClick={() => { playClick(); plusMinus(); }} />
            <CalcButton label="%" variant="function" onClick={() => { playClick(); percent(); }} />
            <CalcButton label="÷" active={opIs("÷")} variant="operator" onClick={() => { playClick(); setOperator("÷"); }} />

            <CalcButton label="7" onClick={() => { playClick(); inputDigit("7"); }} />
            <CalcButton label="8" onClick={() => { playClick(); inputDigit("8"); }} />
            <CalcButton label="9" onClick={() => { playClick(); inputDigit("9"); }} />
            <CalcButton label="×" active={opIs("×")} variant="operator" onClick={() => { playClick(); setOperator("×"); }} />

            <CalcButton label="4" onClick={() => { playClick(); inputDigit("4"); }} />
            <CalcButton label="5" onClick={() => { playClick(); inputDigit("5"); }} />
            <CalcButton label="6" onClick={() => { playClick(); inputDigit("6"); }} />
            <CalcButton label="-" active={opIs("-")} variant="operator" onClick={() => { playClick(); setOperator("-"); }} />

            <CalcButton label="1" onClick={() => { playClick(); inputDigit("1"); }} />
            <CalcButton label="2" onClick={() => { playClick(); inputDigit("2"); }} />
            <CalcButton label="3" onClick={() => { playClick(); inputDigit("3"); }} />
            <CalcButton label="+" active={opIs("+")} variant="operator" onClick={() => { playClick(); setOperator("+"); }} />

            <CalcButton label="0" wide onClick={() => { playClick(); inputDigit("0"); }} />
            <CalcButton label="." onClick={() => { playClick(); inputDot(); }} />
            <CalcButton label="=" variant="operator" onClick={() => { playClick(); equals(); }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TopSpeakerNotch() {
  return (
    <div className="flex justify-center mt-1">
      <div className="h-1.5 w-20 rounded-full bg-black/70 shadow-[inset_0_-1px_2px_rgba(255,255,255,0.2)]" />
    </div>
  );
}

function LCD({ value }: { value: string }) {
  return (
    <div className="px-3 py-2 rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.2))] border border-white/5">
      <div className="text-emerald-200/95 font-[100] tracking-[0.08em]">
        {value}
      </div>
    </div>
  );
}

interface CalcButtonProps {
  label: string;
  onClick: () => void;
  variant?: "digit" | "operator" | "function";
  wide?: boolean;
  active?: boolean;
}

function CalcButton({ label, onClick, variant = "digit", wide, active }: CalcButtonProps) {
  const common = "h-16 rounded-2xl text-2xl font-medium active:scale-[0.98] transition-all duration-100 focus:outline-none select-none";

  const variants: Record<string, string> = {
    digit: "bg-[linear-gradient(180deg,#4f5257,#2e3136)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_14px_rgba(0,0,0,0.6)] border border-black/30",
    operator: (active ? "bg-[linear-gradient(180deg,#ffb44a,#ff931e)]" : "bg-[linear-gradient(180deg,#ff9a2f,#d97700)]") +
      " text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_6px_14px_rgba(0,0,0,0.6)] border border-black/20",
    function: "bg-[linear-gradient(180deg,#d7d7d7,#8d8d8d)] text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_6px_14px_rgba(0,0,0,0.6)] border border-black/20",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={[common, variants[variant], wide ? "col-span-2 text-left pl-6" : "", "relative overflow-hidden"].join(" ")}
      onClick={onClick}
      aria-label={label}
      data-variant={variant}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl" aria-hidden>
        <div className="absolute inset-x-0 -top-5 h-12 bg-white/20 blur-[6px] opacity-70" />
        <div className="absolute inset-x-0 top-1 h-px bg-white/40" />
      </div>
      <span className="drop-shadow-[0_1px_0_rgba(0,0,0,0.5)]">{label}</span>
    </motion.button>
  );
}

function useClickSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const lastRef = useRef<number>(0);

  return useCallback(() => {
    const now = performance.now();
    if (now - lastRef.current < 60) return;
    lastRef.current = now;

    try {
  type AudioCtorType = { new (): AudioContext };
  type Win = Window & { AudioContext?: AudioCtorType; webkitAudioContext?: AudioCtorType };
  const win = window as Win;
  const AudioCtor = win.AudioContext || win.webkitAudioContext;
      if (!AudioCtor) return;
      const ctx = (ctxRef.current ||= new AudioCtor());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = 520;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      const t = ctx.currentTime;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.03, t + 0.001);
      g.gain.exponentialRampToValueAtTime(0.00001, t + 0.06);
      o.stop(t + 0.08);
    } catch {
      // ignore audio errors
    }
  }, []);
}
export default CalculatorApp;