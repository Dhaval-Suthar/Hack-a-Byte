"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
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

      <BottomBar />
    </div>
  );
};

export default SafariApp;
