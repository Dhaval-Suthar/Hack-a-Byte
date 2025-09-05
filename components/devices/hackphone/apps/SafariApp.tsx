"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { io as rawIo, Socket } from 'socket.io-client';
import AlertHub from './AlertHub';
import Image from "next/image";

interface SafariAppProps {
  onClose?: () => void;
}

const toUrl = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  // treat as search
  const q = encodeURIComponent(trimmed);
  return `https://www.google.com/search?q=${q}`;
};

interface ExtractorEvent { id: string; type: string; outcome: 'gain'|'loss'|'neutral'; amount: number; detail?: string; ts: number }
interface DeviceMeta { teamId?: string; isBank?: boolean }

const SafariApp: React.FC<SafariAppProps> = () => {
  const [tabTitle, setTabTitle] = useState("Untitled");
  const [address, setAddress] = useState("https://www.redmondpie.com/");
  const [addressInput, setAddressInput] = useState(address);
  const [loading, setLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [history, setHistory] = useState<string[]>([address]);
  const [histIndex, setHistIndex] = useState(0);
  const [cannotOpen, setCannotOpen] = useState<string | null>(null);
  // Extraction additions
  const [teamId, setTeamId] = useState<string>('');
  const [faucetState, setFaucetState] = useState<{ attempts: number; windowExpires: number; lastReward: number; balance?: number }|null>(null);
  const [events, setEvents] = useState<ExtractorEvent[]>([]);
  const [socket, setSocket] = useState<Socket|null>(null);
  const [claiming, setClaiming] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [phishWarning, setPhishWarning] = useState<string|null>(null);
  const [showAlertHub, setShowAlertHub] = useState(false);
  const [customPatternInput, setCustomPatternInput] = useState('');
  const [useCustomPatterns, setUseCustomPatterns] = useState(false);

  // Derived risk metrics
  const riskSummary = useMemo(()=>{
    const gains = events.filter(e=>e.outcome==='gain').reduce((a,b)=>a+b.amount,0);
    const losses = events.filter(e=>e.outcome==='loss').reduce((a,b)=>a+Math.abs(b.amount),0);
    const net = gains - losses;
    return { gains, losses, net };
  }, [events]);

  // Restore persisted state (events, faucet meta, custom patterns)
  useEffect(()=>{
    try {
      const evRaw = localStorage.getItem('safari_events');
      if (evRaw) {
        const parsed: ExtractorEvent[] = JSON.parse(evRaw);
        if (Array.isArray(parsed)) setEvents(parsed.slice(0,50));
      }
    } catch {/* ignore */}
    try {
      const fsRaw = localStorage.getItem('safari_faucet_state');
      if (fsRaw) {
        const parsed = JSON.parse(fsRaw);
        if (parsed && typeof parsed === 'object' && 'attempts' in parsed) setFaucetState(parsed);
      }
    } catch {/* ignore */}
    try {
      const pat = localStorage.getItem('safari_custom_patterns');
      if (pat) setCustomPatternInput(pat);
      const flag = localStorage.getItem('safari_use_custom_patterns');
      if (flag === '1') setUseCustomPatterns(true);
    } catch {/* ignore */}
  }, []);

  // Persist events & faucet state & patterns
  useEffect(()=>{ try { localStorage.setItem('safari_events', JSON.stringify(events)); } catch {} }, [events]);
  useEffect(()=>{ if (faucetState) { try { localStorage.setItem('safari_faucet_state', JSON.stringify(faucetState)); } catch {} } }, [faucetState]);
  useEffect(()=>{ try { localStorage.setItem('safari_custom_patterns', customPatternInput); } catch {} }, [customPatternInput]);
  useEffect(()=>{ try { localStorage.setItem('safari_use_custom_patterns', useCustomPatterns? '1':'0'); } catch {} }, [useCustomPatterns]);

  // Pull-to-refresh state
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [pull, setPull] = useState(0); // px
  const startYRef = useRef<number | null>(null);
  const PULL_THRESHOLD = 70;

  const iframeKey = useMemo(() => `${address}-${Date.now()}`, [address]);

  useEffect(() => {
    setAddressInput(address);
  }, [address]);

  useEffect(() => {
    setCanGoBack(histIndex > 0);
    setCanGoForward(histIndex < history.length - 1);
  }, [histIndex, history.length]);

  const navigateTo = (input: string) => {
    const url = toUrl(input);
    if (!url) return;
    setCannotOpen(null);
    setLoading(true);
    const newHist = history.slice(0, histIndex + 1).concat(url);
    setHistory(newHist);
    setHistIndex(newHist.length - 1);
    setAddress(url);
  classifyAndWarn(url);
  };

  const goBack = () => {
    if (histIndex <= 0) return;
    const i = histIndex - 1;
    setHistIndex(i);
    setAddress(history[i]);
    setCannotOpen(null);
    setLoading(true);
  };
  const goForward = () => {
    if (histIndex >= history.length - 1) return;
    const i = histIndex + 1;
    setHistIndex(i);
    setAddress(history[i]);
    setCannotOpen(null);
    setLoading(true);
  };

  const onIFrameLoad = () => {
    setLoading(false);
    // We can't read title cross-origin; approximate from hostname
    try {
      const u = new URL(address);
      setTabTitle(u.hostname.replace(/^www\./, ""));
    } catch {
      setTabTitle("Untitled");
    }
  };

  const onIFrameError = () => {
    setLoading(false);
    setCannotOpen("Safari cannot open the page because it could not establish a secure connection to the server.");
  };

  // Pull-to-refresh handlers on outer scroller
  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    startYRef.current = e.touches[0].clientY;
    setPull(0);
  };
  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const el = scrollRef.current;
    if (!el || startYRef.current == null) return;
    const atTop = el.scrollTop <= 0;
    if (!atTop) return;
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy > 0) {
      e.preventDefault();
      setPull(Math.min(dy, 120));
    }
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    if (pull >= PULL_THRESHOLD) {
      // refresh
      setLoading(true);
      setCannotOpen(null);
      setAddress((u) => u); // trigger iframeKey change through useMemo Date.now()
    }
    setPull(0);
  };

  const iOSBar = (
    <div className="px-4 pb-2 pt-2 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] border-b border-gray-600 shadow-lg relative select-none">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none" />
      <div className="text-center text-white text-base font-semibold tracking-wide drop-shadow">{tabTitle}</div>
      <div className="mt-2 grid grid-cols-[1fr_90px] gap-2">
        {/* Address bar */}
        <form
          className="relative"
          onSubmit={(e) => { e.preventDefault(); navigateTo(addressInput); }}
        >
          <input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            placeholder="www.example.com"
            className="w-full rounded-full bg-gradient-to-b from-[#efefef] to-[#d9d9d9] text-black placeholder:text-gray-500 px-4 py-1.5 border border-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_0_rgba(255,255,255,0.1)] focus:outline-none"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
          )}
        </form>
        {/* Google search box */}
        <form onSubmit={(e) => { e.preventDefault(); navigateTo((e.target as HTMLFormElement).querySelector("input")!.value); }}>
          <input
            placeholder="Google"
            className="w-full rounded-full bg-gradient-to-b from-[#efefef] to-[#d9d9d9] text-black placeholder:text-gray-500 px-3 py-1.5 border border-black/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_1px_0_rgba(255,255,255,0.1)] focus:outline-none"
          />
        </form>
      </div>
    </div>
  );

  const claimFaucet = useCallback(async ()=>{
    if (!teamId) return;
    setClaiming(true);
    try {
      const resp = await fetch('/api/extract/faucet', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ teamId }) });
      const js = await resp.json();
      if (resp.ok && js.success) {
        setFaucetState({ attempts: js.attempts, windowExpires: js.windowExpires, lastReward: js.reward, balance: js.balance });
      }
    } catch {/* ignore */} finally { setClaiming(false); }
  }, [teamId]);

  const runEmailSms = useCallback(async ()=>{
    if (!teamId) return;
    setEmailLoading(true);
    try {
      const resp = await fetch('/api/extract/email-sms', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ teamId }) });
      const js = await resp.json();
      if (resp.ok && js.success) {
        const evt: ExtractorEvent = { id: Math.random().toString(36).slice(2), type:'email-sms', outcome: js.outcome, amount: js.amount, ts: Date.now(), detail: js.detail };
        setEvents(ev=> [evt, ...ev].slice(0,50));
      }
    } catch {/* ignore */} finally { setEmailLoading(false); }
  }, [teamId]);

  // Auto team discovery (reuse /api/devices logic similar to BlackMartPhone but lighter)
  useEffect(()=>{
    let cancelled = false;
    async function load() {
      try {
        const resp = await fetch('/api/devices');
        if (!resp.ok) return;
        const js = await resp.json();
        if (cancelled) return;
        if (Array.isArray(js.devices)) {
          const devices: DeviceMeta[] = js.devices;
          // pick first device with teamId (non-bank) or fallback first
          const pick = devices.find(d=> d.teamId && !d.isBank) || devices.find(d=>d.teamId);
          if (pick?.teamId && !teamId) setTeamId(pick.teamId);
        }
      } catch {}
    }
    load();
    const id = setInterval(load, 20000);
    return ()=>{ cancelled = true; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket connect for extractor events
  useEffect(()=>{
    if (!teamId || socket) return;
    const s = rawIo('/', { path: '/api/socketio', transports:['websocket'], timeout: 20000 });
    s.on('connect', ()=>{/* noop */});
    s.on('connect_error', (error) => {
      console.warn('SafariApp socket connection error:', error.message);
    });
    s.on('connect_timeout', () => {
      console.warn('SafariApp socket connection timeout');
    });
    // Listen for faucet + generic extractor events
    s.on('extractor-faucet', (p: { teamId:string; reward:number; attempts:number; windowExpires:number; balance:number; ts:number })=>{
      if (p.teamId !== teamId) return;
      setFaucetState({ attempts: p.attempts, windowExpires: p.windowExpires, lastReward: p.reward, balance: p.balance });
      const evt: ExtractorEvent = { id: Math.random().toString(36).slice(2), type:'faucet', outcome:'gain', amount:p.reward, ts:p.ts, detail:`Attempt ${p.attempts}` };
      setEvents(ev=> [evt, ...ev].slice(0,50));
    });
    s.on('extractor-event', (p: { teamId:string; event: ExtractorEvent })=>{
      if (p.teamId !== teamId) return;
      const e = p.event;
      setEvents(ev=> [ { id: e.id || Math.random().toString(36).slice(2), type:e.type, outcome:e.outcome, amount:e.amount, ts:e.ts, detail:e.detail }, ...ev].slice(0,50));
    });
    setSocket(s);
    return ()=>{ s.disconnect(); };
  }, [teamId, socket]);

  const formatTimeLeft = () => {
    if (!faucetState) return '';
    const ms = faucetState.windowExpires - Date.now();
    if (ms <= 0) return 'window reset';
    const sec = Math.floor(ms/1000);
    return `${Math.floor(sec/60)}m ${(sec%60)}s`; 
  };

  // Cooldown bar re-render
  const pctWindow = (()=>{
    if (!faucetState) return 0;
    const total = faucetState.windowExpires - (faucetState.windowExpires - 5*60*1000); // window length known 5m
    const rem = faucetState.windowExpires - Date.now();
    return Math.max(0, Math.min(100, 100 - (rem/ total)*100));
  })();
  useEffect(()=>{ const id = setInterval(()=>{ if (faucetState) setFaucetState(s=> s? {...s}: s); }, 1000); return ()=> clearInterval(id); }, [faucetState]);

  // Phishing detection
  const defaultSuspiciousPatterns = useMemo(()=>[/login/i,/bank/i,/wallet/i,/secure-update/i,/verify/i,/\.ru\b/i,/\.cn\b/i], []);
  const customPatterns = useMemo(()=>{
    if (!useCustomPatterns || !customPatternInput.trim()) return [] as RegExp[];
    return customPatternInput.split(/[,\n]/).map(s=>s.trim()).filter(Boolean).map(p=>{
      try { return new RegExp(p, 'i'); } catch { return null; }
    }).filter((r): r is RegExp => !!r);
  }, [customPatternInput, useCustomPatterns]);
  const suspiciousPatterns = useMemo(()=> useCustomPatterns ? customPatterns : defaultSuspiciousPatterns, [useCustomPatterns, customPatterns, defaultSuspiciousPatterns]);
  const classifyAndWarn = (url:string) => {
    try {
      const u = new URL(url);
      const hostPath = `${u.hostname}${u.pathname}`;
      const hit = suspiciousPatterns.some(rx=> rx.test(hostPath));
      if (hit) {
        const evt: ExtractorEvent = { id: Math.random().toString(36).slice(2), type:'phish-detect', outcome:'neutral', amount:0, ts: Date.now(), detail: u.hostname };
        setEvents(ev=> [evt, ...ev].slice(0,50));
        setPhishWarning(`Potential phishing risk: ${u.hostname}`);
        setTimeout(()=> setPhishWarning(null), 6000);
      }
    } catch {/* ignore */}
  };

  const BottomBar = () => {
    const buttons = [
      { id: "back", icon: "https://api.iconify.design/ion/chevron-back.svg?color=white", onClick: goBack, disabled: !canGoBack },
      { id: "forward", icon: "https://api.iconify.design/ion/chevron-forward.svg?color=white", onClick: goForward, disabled: !canGoForward },
      { id: "share", icon: "https://api.iconify.design/ion/share-outline.svg?color=white", onClick: async () => { try { await navigator.clipboard.writeText(address); } catch {} } },
      { id: "bookmarks", icon: "https://api.iconify.design/ion/bookmark-outline.svg?color=white", onClick: () => alert("Bookmarks UI coming soon") },
      { id: "tabs", icon: "https://api.iconify.design/ion/square-outline.svg?color=white", onClick: () => alert("1 Tab") },
    ];
    return (
      <div className="flex bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border-t border-gray-600 h-16 fixed left-0 right-0 bottom-[clamp(74px,12vw,92px)] z-40 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        {buttons.map((b, i) => (
          <button
            key={b.id}
            onClick={b.onClick}
            disabled={b.disabled}
            className={`relative flex-1 flex items-center justify-center ${b.disabled ? 'opacity-40' : ''}`}
          >
            <Image src={b.icon} alt={b.id} width={28} height={28} className="w-7 h-7 drop-shadow" />
            {i < buttons.length - 1 && (
              <div className="absolute right-0 top-3 bottom-3 w-[1px] bg-gradient-to-b from-transparent via-gray-600/50 to-transparent" />
            )}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-black">
      {iOSBar}

      {/* Pull to refresh overlay */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto bg-[#e5e5e5]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* PTRefresh header space */}
          <div style={{ height: Math.max(pull, 0) }} />
          {pull > 5 && (
            <div className="sticky top-0 z-10 flex flex-col items-center justify-end h-20 text-gray-700 select-none">
              <div className={`transition-transform ${pull >= PULL_THRESHOLD ? 'rotate-180' : ''}`}>
                <Image src="https://api.iconify.design/ion/arrow-down.svg?color=%23888" alt="arrow" width={24} height={24} />
              </div>
              <div className="text-sm mt-1 font-semibold">
                {pull >= PULL_THRESHOLD ? 'Release to refresh…' : 'Pull down to refresh…'}
              </div>
            </div>
          )}

          {/* Web content */}
          <div className="bg-white min-h-[1200px]">
            <iframe
              key={iframeKey}
              src={address}
              onLoad={onIFrameLoad}
              onError={onIFrameError}
              className="w-full h-[calc(100vh-200px)] bg-white"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            />
          </div>
        </div>

        {/* Cannot open page modal */}
        {cannotOpen && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-6">
            <div className="max-w-sm w-full rounded-lg bg-gradient-to-b from-[#e6eef8] to-[#c8d7eb] border border-[#8aa2c1] shadow-xl p-4 text-center">
              <div className="text-[#123] text-base font-semibold mb-2">Cannot Open Page</div>
              <div className="text-[#234] text-sm mb-4">{cannotOpen}</div>
              <button onClick={() => setCannotOpen(null)} className="mx-auto px-6 py-1.5 rounded bg-gradient-to-b from:white to-[#e0e0e0] border border-black/20 shadow text-[#123] font-semibold">OK</button>
            </div>
          </div>
        )}
      </div>

      {/* Extractor panel */}
      <div className="px-3 py-2 bg-black/40 text-[11px] text-gray-200 space-y-2 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input value={teamId} onChange={e=>setTeamId(e.target.value)} placeholder="Team ID" className="bg-white/10 px-2 py-1 rounded w-40 focus:outline-none" />
          <button onClick={claimFaucet} disabled={!teamId||claiming} className="px-3 py-1 rounded bg-indigo-600 disabled:bg-gray-600 text-white text-xs font-semibold">{claiming? 'Claiming...': 'Claim Faucet'}</button>
          <button onClick={runEmailSms} disabled={!teamId||emailLoading} className="px-3 py-1 rounded bg-emerald-600 disabled:bg-gray-600 text-white text-xs font-semibold">{emailLoading? 'Running...':'Email/SMS Batch'}</button>
          {faucetState && <div className="text-xs text-gray-300">Attempt {faucetState.attempts} · Last +{faucetState.lastReward} · {formatTimeLeft()}</div>}
          <button onClick={()=>setShowAlertHub(s=>!s)} className="ml-auto px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-[10px]">{showAlertHub? 'Hide Alerts':'Show Alerts'}</button>
        </div>
        {faucetState && (
          <div className="w-full h-2 bg-white/10 rounded overflow-hidden">
            <div style={{ width: pctWindow+'%' }} className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all" />
          </div>
        )}
        <div className="flex gap-4 text-[10px] font-mono">
          <div className="text-green-400">G+{riskSummary.gains}</div>
          <div className="text-red-400">L-{riskSummary.losses}</div>
          <div className={riskSummary.net>=0? 'text-green-300':'text-red-300'}>Net {riskSummary.net>=0?'+':''}{riskSummary.net}</div>
        </div>
        {/* Custom phishing patterns */}
        <div className="space-y-1">
          <label className="flex items-center gap-2 text-[10px]">
            <input type="checkbox" checked={useCustomPatterns} onChange={e=>setUseCustomPatterns(e.target.checked)} />
            <span>Use custom phishing patterns</span>
          </label>
          {useCustomPatterns && (
            <textarea
              value={customPatternInput}
              onChange={e=>setCustomPatternInput(e.target.value)}
              placeholder="Enter regex fragments separated by comma or newline (e.g. login, bank, verify)"
              className="w-full bg-white/5 border border-white/10 rounded p-1 text-[10px] h-16 resize-none focus:outline-none"
            />
          )}
        </div>
        <div className="max-h-28 overflow-auto space-y-0.5 font-mono">
          {events.map(e=> (
            <div key={e.id} className={`text-[10px] flex justify-between ${e.outcome==='gain'?'text-green-400': e.outcome==='loss'?'text-red-400':'text-gray-400'}`}> 
              <span>{e.type}{e.detail?`: ${e.detail}`:''}</span>
              <span>{e.amount>0?`+${e.amount}`: e.amount<0? e.amount: ''}</span>
            </div>
          ))}
          {events.length===0 && <div className="text-gray-500 text-[10px]">No extractor events</div>}
        </div>
        {phishWarning && (
          <div className="text-amber-400 text-[10px] font-semibold animate-pulse">{phishWarning}</div>
        )}
        {showAlertHub && (
          <div className="mt-2 border border-white/10 rounded bg-black/30 max-h-52 overflow-auto">
            <AlertHub />
          </div>
        )}
      </div>

      <BottomBar />
    </div>
  );
};

export default SafariApp;
