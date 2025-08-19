"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

interface CalculatorAppProps {
  onClose: () => void;
  time: string;
}

function CalculatorApp({}: CalculatorAppProps) {
  return (
    <div className="h-full w-full bg-neutral-900 text-white relative">
      <div
        className="absolute inset-0 px-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)", paddingTop: "12px" }}
      >
        <IPhone4Calculator />
      </div>
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
      // If user just pressed an operator and is changing it, don't compute again
      if (s.overwrite) {
        return { ...s, op, lastKey: op };
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

  const backspace = useCallback(() => {
    setState((s) => {
      if (s.overwrite) return s;
      const clean = s.display;
      if (clean.length <= 1) return { ...s, display: "0", overwrite: true };
      const next = clean.slice(0, -1);
      return { ...s, display: next === "-" ? "0" : next };
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
    else if (key === "Backspace") backspace();
      else if (key.toLowerCase() === "c" || key === "Escape") clear();
      else if (key === "%") percent();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clear, equals, inputDigit, inputDot, percent, setOperator, backspace, playClick]);

  const opIs = useCallback((op: Op) => state.op === op, [state.op]);

  const acOrC = useMemo(() => {
    const isZero = parseDisplay(state.display) === 0 && state.operand === null && !state.op;
    return isZero ? "AC" : "C";
  }, [state.display, state.operand, state.op]);

  const handleClear = useCallback(() => {
    if (acOrC === "AC") clear();
    else setState((s) => ({ ...s, display: "0", overwrite: true }));
  }, [acOrC, clear]);

  // Copy-to-clipboard for display value
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard?.writeText(state.display.replace(/,/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }, [state.display]);

  return (
    <div className="h-full w-full select-none flex flex-col">
      {/* Display and history */}
      <div className="mb-3">
        <div className="relative">
          <div className="text-right text-5xl font-light tracking-widest tabular-nums drop-shadow-[0_1px_0_rgba(0,0,0,0.9)]">
            <LCD value={state.display} onClick={handleCopy} />
          </div>
          {copied && (
            <div className="absolute right-2 -bottom-5 text-xs text-emerald-300/90">Copied</div>
          )}
        </div>
  {/* no history */}
      </div>

      {/* Keypad fills remaining space */}
      <div className="flex-1">
        <div className="grid grid-cols-4 grid-rows-5 gap-3 h-full">
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
  );
}

// Removed TopSpeakerNotch for full-screen app layout

function LCD({ value, onClick }: { value: string; onClick?: () => void | Promise<void> }) {
  return (
    <div
      className="relative px-3 py-2 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(40,65,40,0.7),rgba(7,18,7,0.95))] shadow-[inset_0_2px_8px_rgba(255,255,255,0.06),inset_0_-8px_18px_rgba(0,0,0,0.7)]"
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={onClick ? "Click to copy" : undefined}
    >
      {/* Top gloss */}
      <div className="pointer-events-none absolute inset-x-2 top-1 h-5 rounded-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0))]" />
      <div className="text-emerald-200/95 font-[100] tracking-[0.08em] select-text cursor-[inherit]">
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
  const common = "h-full min-h-14 rounded-2xl text-2xl font-medium active:scale-[0.98] transition-all duration-100 focus:outline-none select-none";

  const variants: Record<string, string> = {
    // iOS4: Dark glossy keys
    digit:
      "bg-[linear-gradient(180deg,#61656b,#31343a)] text-white border border-black/40 " +
      "shadow-[inset_0_2px_0_rgba(255,255,255,0.18),inset_0_-2px_0_rgba(0,0,0,0.45),0_8px_16px_rgba(0,0,0,0.7)]",
    // iOS4: Orange operator keys with strong gloss
    operator:
      (active
        ? "bg-[linear-gradient(180deg,#ffbd64,#ff9727)]"
        : "bg-[linear-gradient(180deg,#ffa340,#e18100)]") +
      " text-black border border-black/30 " +
      "shadow-[inset_0_2px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(0,0,0,0.35),0_8px_16px_rgba(0,0,0,0.65)]",
    // iOS4: Silver function keys
    function:
      "bg-[linear-gradient(180deg,#e0e0e0,#9a9a9a)] text-black border border-black/25 " +
      "shadow-[inset_0_2px_0_rgba(255,255,255,0.75),inset_0_-2px_0_rgba(0,0,0,0.28),0_8px_16px_rgba(0,0,0,0.6)]",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={[common, variants[variant], wide ? "col-span-2 text-left pl-6" : "", "relative overflow-hidden"].join(" ")}
      onClick={onClick}
      aria-label={label}
      data-variant={variant}
    >
      {/* Gloss highlights */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl" aria-hidden>
        <div className="absolute inset-x-1 -top-5 h-10 bg-white/25 blur-[8px] opacity-70" />
        <div className="absolute inset-x-2 top-1 h-px bg-white/50" />
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