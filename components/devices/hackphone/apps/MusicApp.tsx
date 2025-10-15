import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";


// --- Types ---
interface Track {
 id: string;
 title: string;
 artist: string;
album?: string;
 duration: number; // seconds
 src: string; // audio file URL
 cover?: string; // image URL / data URI
}


type Tab = "Playlists" | "Artists" | "Songs" | "Now Playing";


type RepeatMode = "off" | "one" | "all";


// --- Helper utilities ---
const fmtTime = (s: number) => {
 if (!isFinite(s) || s < 0) s = 0;
 const m = Math.floor(s / 60);
 const sec = Math.floor(s % 60);
 return `${m}:${sec.toString().padStart(2, "0")}`;
};


const glossy = (top: string, bottom: string) => `linear-gradient(to bottom, ${top}, ${bottom})`;


// Simple retro placeholder cover (base64 SVG) with album initials
const coverDataURI = (label: string, hue = 30) => {
 const bg1 = `hsl(${hue}, 60%, 55%)`;
 const bg2 = `hsl(${hue}, 70%, 35%)`;
 const svg = encodeURIComponent(`
   <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'>
     <defs>
       <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
         <stop offset='0%' stop-color='${bg1}'/>
         <stop offset='100%' stop-color='${bg2}'/>
       </linearGradient>
     </defs>
     <rect width='512' height='512' rx='36' fill='url(#g)'/>
     <circle cx='256' cy='256' r='160' fill='rgba(255,255,255,0.15)'/>
     <text x='50%' y='58%' font-family='Helvetica, Arial' font-size='160' text-anchor='middle' fill='rgba(255,255,255,0.9)'>${label}</text>
   </svg>`);
 return `data:image/svg+xml;charset=utf-8,${svg}`;
};


// --- Demo library (10 tracks) ---
const demoTracks: Track[] = [
 {
   id: "allsfair",
   title: "Alls Fair in Love",
   artist: "BryanTeoh",
   //album: "Please",
   duration: 239,
   src: "/hackphone/music/musicphone/Alls Fair In LoveBryanTeoh.mp3",
   cover: coverDataURI("BT", 28),
 },
 {
   id: "amazing",
   title: "Amazing Grace",
   artist: "Kevin McLeoh",
   //album: "Speak & Spell",
   duration: 114,
   src: "/hackphone/music/musicphone/Amazing GraceKevinMcleod.mp3",
   cover: coverDataURI("AG", 12),
 },
 {
   id: "brother",
   title: "Brothers Unite",
   artist: "Alexander Nakarda",
   //album: "Blue Monday",
   duration: 234,
   src: "/hackphone/music/musicphone/BrotherUniteAlexanderNakarada.mp3",
   cover: coverDataURI("BR", 200),
 },
 {
   id: "Celeb",
   title: "Celebration",
   artist: "Alexander Nakarda",
   //album: "Blue",
   duration: 143, 
   src: "/hackphone/music/musicphone/CelebrationAlexndarNakarda.mp3",
   cover: coverDataURI("CB", 194),
 },
 {
   id: "Horizon",
   title: "Horizon Flare",
   artist: "Alexander Nakarda",
   //album: "Lukas Graham (Blue Album)",
   duration: 102, 
   src: "/hackphone/music/musicphone/HorizonFlareAlexanderNakarada.mp3",
   cover: coverDataURI("HZ", 237),
 },
 {
  id: "Tryingtosay",
   title: "I Guess What I'm Trying to Say",
   artist: "BryanTeoh",
   //album: "Up All Night",
   duration: 153, // 3:18
   src: "/hackphone/music/musicphone/I Guess What I'm Trying to SayBryanTeoh.mp3",
   cover: coverDataURI("IG", 198),
 },
 {
   id: "Champdetournesol",
   title: "Champ de tournesol",
   artist: "Komiku",
  // album: "Ghost Stories",
   duration: 118, 
   src: "/hackphone/music/musicphone/ChampdetournesolKomiku.mp3",
   cover: coverDataURI("CT", 268),
 },
 {
   id: "La Citadelle",
   title: "La Citadelle",
   artist: "Komiku",
   //album: "Different World",
   duration: 162, 
   src: "/hackphone/music/musicphone/La CitadellekOMIKU.mp3",
   cover: coverDataURI("LC", 212),
     },
 {
   id: "Page to Practice",
   title: "From Page to Practice",
   artist: "BryanTeoh",
  // album: "Jordi",
   duration: 137, // 3:09
   src: "/hackphone/music/musicphone/From Page to PracticeBryanTeoh.mp3",
   cover: coverDataURI("PP", 189),
 },
 {
   id: "Isolation",
   title: "IsolationWaltz",
   artist: "BryanTeoh",
   //album: "Made in the A.M.",
   duration: 205, 
   src: "/hackphone/music/musicphone/IsolationWaltxBryanTeoh.mp3",
   cover: coverDataURI("IW", 187),
 },
];


// --- Main Component ---
function MusicApp() {
 const [tab, setTab] = useState<Tab>("Songs");
 const [queue, setQueue] = useState<Track[]>(demoTracks);
 const [currentIndex, setCurrentIndex] = useState<number>(0);
 const [isPlaying, setIsPlaying] = useState<boolean>(false);
 const [shuffle, setShuffle] = useState<boolean>(false);
 const [repeat, setRepeat] = useState<RepeatMode>("off");
 const [volume, setVolume] = useState<number>(0.8); // 0..1


 const audioRef = useRef<HTMLAudioElement | null>(null);
 const [progress, setProgress] = useState<number>(0);
 const [duration, setDuration] = useState<number>(queue[0]?.duration || 0);


 // Load preferences
 useEffect(() => {
   try {
     const raw = localStorage.getItem("hackphone.music.prefs");
     if (raw) {
       const pref = JSON.parse(raw);
       if (typeof pref.volume === "number") setVolume(pref.volume);
       if (typeof pref.shuffle === "boolean") setShuffle(pref.shuffle);
       if (pref.repeat === "off" || pref.repeat === "one" || pref.repeat === "all") setRepeat(pref.repeat);
       if (typeof pref.currentId === "string") {
         const idx = queue.findIndex(t => t.id === pref.currentId);
         if (idx >= 0) setCurrentIndex(idx);
       }
     }
   } catch {}
 }, [queue]);


 // Persist preferences
 useEffect(() => {
   const cur = queue[currentIndex]?.id;
   localStorage.setItem(
     "hackphone.music.prefs",
     JSON.stringify({ volume, shuffle, repeat, currentId: cur })
   );
 }, [volume, shuffle, repeat, currentIndex, queue]);


 // Handle audio events
 useEffect(() => {
   const audio = audioRef.current;
   if (!audio) return;
   audio.volume = volume;
 }, [volume]);

 const playRandomNext = useCallback(() => {
   if (queue.length <= 1) return;
   let idx = currentIndex;
   while (idx === currentIndex) {
     idx = Math.floor(Math.random() * queue.length);
   }
   setCurrentIndex(idx);
   setIsPlaying(true);
 }, [queue.length, currentIndex]);

 useEffect(() => {
   const audio = audioRef.current;
   if (!audio) return;


   const onTime = () => setProgress(audio.currentTime);
   const onLoaded = () => {
     setDuration(audio.duration || queue[currentIndex]?.duration || 0);
   };
   const onEnd = () => {
     if (repeat === "one") {
       audio.currentTime = 0;
       audio.play().catch(() => setIsPlaying(false));
       return;
     }
     if (shuffle) {
       playRandomNext();
       return;
     }
     const next = currentIndex + 1;
     if (next < queue.length) {
       setCurrentIndex(next);
       setTimeout(() => setIsPlaying(true), 0);
     } else if (repeat === "all") {
       setCurrentIndex(0);
       setTimeout(() => setIsPlaying(true), 0);
     } else {
       setIsPlaying(false);
     }
   };


   audio.addEventListener("timeupdate", onTime);
   audio.addEventListener("loadedmetadata", onLoaded);
   audio.addEventListener("ended", onEnd);
   return () => {
     audio.removeEventListener("timeupdate", onTime);
     audio.removeEventListener("loadedmetadata", onLoaded);
     audio.removeEventListener("ended", onEnd);
   };
 }, [currentIndex, shuffle, repeat, queue, playRandomNext]);


 useEffect(() => {
   const audio = audioRef.current;
   if (!audio) return;
   audio.src = queue[currentIndex]?.src || "";
   audio.load();
   setProgress(0);
   if (isPlaying) {
     audio.play().catch(() => setIsPlaying(false));
   }
 }, [currentIndex, queue, isPlaying]);


 useEffect(() => {
   const audio = audioRef.current;
   if (!audio) return;
   if (isPlaying) {
     audio.play().catch(() => setIsPlaying(false));
   } else {
     audio.pause();
   }
 }, [isPlaying]);


 const current = queue[currentIndex];


 const artists = useMemo(() => {
   const map = new Map<string, Track[]>();
   for (const t of demoTracks) {
     const list = map.get(t.artist) || [];
     list.push(t);
     map.set(t.artist, list);
   }
   return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
 }, []);


 const [selectedArtist, setSelectedArtist] = useState<string | null>(null);


 const playFromCollection = (tracks: Track[], start: number) => {
   setQueue(tracks);
   setCurrentIndex(start);
   setIsPlaying(true);
   setTab("Now Playing");
 };


 const playPrev = () => {
   const audio = audioRef.current;
   if (audio && audio.currentTime > 3) {
     audio.currentTime = 0;
     return;
   }
   if (shuffle) {
     playRandomNext();
     return;
   }
   const prev = currentIndex - 1;
   if (prev >= 0) {
     setCurrentIndex(prev);
     setIsPlaying(true);
   } else if (repeat === "all") {
     setCurrentIndex(queue.length - 1);
     setIsPlaying(true);
   }
 };


 const playNext = () => {
   if (shuffle) {
     playRandomNext();
     return;
   }
   const next = currentIndex + 1;
   if (next < queue.length) {
     setCurrentIndex(next);
     setIsPlaying(true);
   } else if (repeat === "all") {
     setCurrentIndex(0);
     setIsPlaying(true);
   } else {
     setIsPlaying(false);
   }
 };


 const onSeek = (val: number) => {
   const audio = audioRef.current;
   if (!audio || !isFinite(duration) || duration <= 0) return;
   const t = Math.max(0, Math.min(duration, val));
   audio.currentTime = t;
   setProgress(t);
 };


 // --- UI ---
 return (
   <div className="w-full h-full max-w-full mx-auto select-none" style={{ fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", background: "#000" }}>
     {/* Hidden audio element */}
     <audio ref={audioRef} preload="auto" />


     {/* iPhone 4 style status bar + nav bar */}
     <div className="sticky top-0 z-20" style={{ background: glossy("#3a3a3a", "#1f1f1f"), color: "#fff", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25), 0 1px 3px rgba(0,0,0,0.6)" }}>
       <div className="h-6 flex items-center justify-between px-2 text-[11px] tracking-wide" style={{ background: glossy("rgba(255,255,255,0.25)", "rgba(255,255,255,0)") }}>
         <span>Hackphone</span>
         <span>{isPlaying ? "▶︎" : "❚❚"} {fmtTime(progress)} / {fmtTime(duration || current?.duration || 0)}</span>
       </div>
        <div className="h-10 flex items-center justify-between px-2">
         {/* Back removed per UX: shouldn't return to home from Music */}

         <button className="px-2 py-1 text-sm rounded" style={{ color: "#ff9500" }} onClick={() => setTab("Songs")}>Music</button>
         
         <div className="text-base font-semibold">{tab}</div>
         
         <div className="w-10" />
       </div>
     </div>


     {/* Content */}
     <div className="h-[75vh] overflow-y-auto bg-[#efefef]" style={{ backgroundImage: glossy("#f8f8f8", "#dcdcdc") }}>
       {tab === "Songs" && (
         <SongsView
           tracks={demoTracks}
           onPlay={(idx) => playFromCollection(demoTracks, idx)}
         />
       )}
       {tab === "Artists" && (
         <ArtistsView
           artists={artists}
           selectedArtist={selectedArtist}
           onSelectArtist={(name) => setSelectedArtist(prev => (prev === name ? null : name))}
           onPlayArtist={(name, startIdx) => {
             const list = artists.find(a => a[0] === name)?.[1] || [];
             playFromCollection(list, startIdx);
           }}
         />
       )}
       {tab === "Playlists" && (
         <PlaylistsView
           onPlayAll={() => playFromCollection(demoTracks, 0)}
           totalTracks={demoTracks.length}
         />
       )}
       {tab === "Now Playing" && (
         <NowPlayingView
           track={current}
           isPlaying={isPlaying}
           progress={progress}
           duration={duration || current?.duration || 0}
           onPrev={playPrev}
           onPlayPause={() => setIsPlaying(p => !p)}
           onNext={playNext}
           onSeek={onSeek}
           volume={volume}
           onVolume={setVolume}
           shuffle={shuffle}
           onShuffle={() => setShuffle(s => !s)}
           repeat={repeat}
           onRepeat={() => setRepeat(r => (r === "off" ? "all" : r === "all" ? "one" : "off"))}
         />
       )}
     </div>


     {/* Tab bar */}
     <div className="sticky bottom-0 h-14 flex text-xs" style={{ background: glossy("#2b2b2b", "#000"), color: "#bbb", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), 0 -1px 2px rgba(0,0,0,0.7)" }}>
       {(["Playlists", "Artists", "Songs", "Now Playing"] as Tab[]).map(t => (
         <button
           key={t}
           onClick={() => setTab(t)}
           className="flex-1 flex flex-col items-center justify-center gap-0.5"
           style={{ color: tab === t ? "#ff9500" : "#bbb" }}
         >
           <TabIcon name={t} active={tab === t} />
           <span className="mt-0.5">{t}</span>
         </button>
       ))}
     </div>


     {/* Inline CSS to nail the skeuomorphic bits */}
     <style>{`
       .ios-row { display:flex; align-items:center; padding:12px 14px; background:#fff; border-bottom:1px solid #cfcfcf; }
       .ios-row:active { background:#d9d9d9; }
       .ios-title { font-size:15px; color:#000; }
       .ios-sub { font-size:12px; color:#6d6d72; margin-top:2px; }
       .ios-disclosure { margin-left:auto; color:#c7c7cc; }
       .ios-section { padding:6px 14px; font-size:12px; color:#6d6d72; text-transform:uppercase; letter-spacing:0.4px; }
       .ios-list { background:#fff; box-shadow: inset 0 1px 0 #fff, inset 0 -1px 0 #bdbdbd; }
       .ios-btn { background: linear-gradient(#ffffff, #dcdcdc); border:1px solid #8f8f8f; border-radius:6px; padding:6px 10px; box-shadow: inset 0 1px 0 #fff, 0 1px 1px rgba(0,0,0,0.25); }
       .now-art { width: 260px; height: 260px; border-radius: 8px; box-shadow: 0 8px 18px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.4); }
       .knob { appearance: none; width: 100%; height: 2px; background: #b6b6b6; border-radius: 2px; position: relative; }
       .knob::-webkit-slider-thumb { appearance:none; width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(#fff,#dcdcdc); border:1px solid #8f8f8f; box-shadow: 0 2px 2px rgba(0,0,0,.35), inset 0 1px 0 #fff; margin-top: -10px; }
       .knob::-moz-range-thumb { width:22px; height:22px; border-radius:50%; background: linear-gradient(#fff,#dcdcdc); border:1px solid #8f8f8f; box-shadow: 0 2px 2px rgba(0,0,0,.35), inset 0 1px 0 #fff; }
     `}</style>
   </div>
 );
}


// --- Subviews ---
function SongsView({ tracks, onPlay }: { tracks: Track[]; onPlay: (index: number) => void }) {
 return (
   <div>
     <div className="ios-section">Songs</div>
     <div className="ios-list">
       {tracks.map((t, i) => (
         <button key={t.id} className="ios-row w-full text-left" onClick={() => onPlay(i)}>
           <Image src={t.cover || ""} alt="cover" width={40} height={40} className="rounded mr-3"/>
            <div>
              <div className="ios-title">{t.title}</div>
              <div className="ios-sub">{t.artist}{t.album ? ` — ${t.album}` : ""}</div>
            </div>
           <div className="ml-auto text-[12px] text-[#6d6d72]">{fmtTime(t.duration)}</div>
         </button>
       ))}
     </div>
   </div>
 );
}


function ArtistsView({ artists, selectedArtist, onSelectArtist, onPlayArtist }: {
 artists: [string, Track[]][];
 selectedArtist: string | null;
 onSelectArtist: (name: string) => void;
 onPlayArtist: (name: string, startIdx: number) => void;
}) {
 return (
   <div>
     <div className="ios-section">Artists</div>
     <div className="ios-list">
       {artists.map(([name, tracks]) => (
         <div key={name}>
           <button className="ios-row w-full text-left" onClick={() => onSelectArtist(name)}>
             <div className="w-10 h-10 rounded bg-[#cfcfcf] mr-3 flex items-center justify-center text-sm">{name.split(" ").map(w=>w[0]).join("")}</div>
             <div>
               <div className="ios-title">{name}</div>
               <div className="ios-sub">{tracks.length} song{tracks.length>1?"s":""}</div>
             </div>
             <span className="ios-disclosure">›</span>
           </button>
           {selectedArtist === name && (
             <div>
               {tracks.map((t, idx) => (
                 <button key={t.id} className="ios-row w-full text-left pl-14" onClick={() => onPlayArtist(name, idx)}>
                   <div className="ios-title">{t.title}</div>
                   <div className="ml-auto text-[12px] text-[#6d6d72]">{fmtTime(t.duration)}</div>
                 </button>
               ))}
             </div>
           )}
         </div>
       ))}
     </div>
   </div>
 );
}


function PlaylistsView({ onPlayAll, totalTracks }: { onPlayAll: () => void; totalTracks: number }) {
 return (
   <div>
     <div className="ios-section">Playlists</div>
     <div className="ios-list">
       <button className="ios-row w-full text-left" onClick={onPlayAll}>
         <div className="w-10 h-10 mr-3 rounded bg-[#ff9500] text-white font-semibold flex items-center justify-center">▶︎</div>
         <div>
           <div className="ios-title">All Songs</div>
           <div className="ios-sub">{totalTracks} tracks</div>
         </div>
         <span className="ios-disclosure">›</span>
       </button>
     </div>
   </div>
 );
}


function NowPlayingView({
 track,
 isPlaying,
 progress,
 duration,
 onPrev,
 onPlayPause,
 onNext,
 onSeek,
 volume,
 onVolume,
 shuffle,
 onShuffle,
 repeat,
 onRepeat,
}: {
 track?: Track;
 isPlaying: boolean;
 progress: number;
 duration: number;
 onPrev: () => void;
 onPlayPause: () => void;
 onNext: () => void;
 onSeek: (time: number) => void;
 volume: number;
 onVolume: (v: number) => void;
 shuffle: boolean;
 onShuffle: () => void;
 repeat: RepeatMode;
 onRepeat: () => void;
}) {
 return (
   <div className="px-4 py-5 flex flex-col items-center gap-4">
     <Image src={track?.cover || ""} alt="cover" width={260} height={260} className="now-art"/>
     <div className="text-center">
       <div className="text-[18px] font-semibold text-black">{track?.title || "—"}</div>
  <div className="text-[13px] text-[#6d6d72] mt-0.5">{track ? `${track.artist}${track.album ? ' — ' + track.album : ''}` : ""}</div>
     </div>


     {/* Scrubber */}
     <div className="w-full mt-2">
       <input
         className="knob"
         type="range"
         min={0}
         max={Math.max(1, duration)}
         step={1}
         value={Math.min(progress, duration)}
         onChange={(e) => onSeek(parseFloat(e.target.value))}
       />
       <div className="flex justify-between text-[11px] text-[#6d6d72] mt-1">
         <span>{fmtTime(progress)}</span>
         <span>-{fmtTime(Math.max(0, duration - progress))}</span>
       </div>
     </div>


     {/* Controls */}
     <div className="flex items-center justify-center gap-6 mt-2">
       <IconButton label="Shuffle" active={shuffle} onClick={onShuffle} icon={ShuffleIcon} />
       <Transport onPrev={onPrev} onPlayPause={onPlayPause} onNext={onNext} playing={isPlaying} />
       <IconButton label="Repeat" active={repeat !== "off"} onClick={onRepeat} icon={() => <RepeatIcon mode={repeat} />} />
     </div>


     {/* Volume */}
     <div className="w-full mt-3">
       <div className="flex items-center gap-2 text-[#6d6d72] text-[12px]">
         <span>🔈</span>
         <input className="knob" type="range" min={0} max={1} step={0.01} value={volume} onChange={(e)=>onVolume(parseFloat(e.target.value))} />
         <span>🔊</span>
       </div>
     </div>
   </div>
 );
}


function Transport({ onPrev, onPlayPause, onNext, playing }: { onPrev: () => void; onPlayPause: () => void; onNext: () => void; playing: boolean }) {
 const btn = "w-12 h-12 rounded-full flex items-center justify-center";
 const gloss = { background: "linear-gradient(#ffffff, #dcdcdc)", border: "1px solid #8f8f8f", boxShadow: "inset 0 1px 0 #fff, 0 2px 2px rgba(0,0,0,.25)" } as React.CSSProperties;
 return (
   <div className="flex items-center gap-10">
     <button className={btn} style={gloss} aria-label="Previous" onClick={onPrev}>
       <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M6 5h2v14H6zM20 5v14L8 12z"/></svg>
     </button>
     <button className={btn} style={{ ...gloss, width: 64, height: 64 }} aria-label="Play/Pause" onClick={onPlayPause}>
       {playing ? (
         <svg width="26" height="26" viewBox="0 0 24 24" fill="#000"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
       ) : (
         <svg width="26" height="26" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z"/></svg>
       )}
     </button>
     <button className={btn} style={gloss} aria-label="Next" onClick={onNext}>
       <svg width="20" height="20" viewBox="0 0 24 24" fill="#000"><path d="M16 5h2v14h-2zM4 5v14l12-7z"/></svg>
     </button>
   </div>
 );
}


function IconButton({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: React.FC }) {
 return (
   <button onClick={onClick} className="flex flex-col items-center text-[11px]" style={{ color: active ? "#ff9500" : "#6d6d72" }}>
     <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(#ffffff,#dcdcdc)", border: "1px solid #8f8f8f", boxShadow: "inset 0 1px 0 #fff, 0 1px 1px rgba(0,0,0,.25)" }}>
       <Icon />
     </div>
     <span className="mt-1">{label}</span>
   </button>
 );
}


function ShuffleIcon() {
 return (
   <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M17 3h4v4h-2V5h-2V3zM3 7h3.59l4 4-4 4H3v-2h2.59L9.17 11 5.59 7H3zm14 6h2v2h2v4h-4v-2h2v-2h-2v-2zM14.41 7L13 8.41 15.59 11 13 13.59 14.41 15 18 11.41 14.41 7z"/></svg>
 );
}


function RepeatIcon({ mode }: { mode: RepeatMode }) {
 return (
   <svg width="18" height="18" viewBox="0 0 24 24" fill="#000">
     <path d="M7 7h7v2H7a3 3 0 0 0 0 6h3v2H7a5 5 0 0 1 0-10zm10 4h-3V9h3a5 5 0 1 1 0 10H10v-2h7a3 3 0 1 0 0-6z"/>
     {mode === 'one' && <text x="12" y="14" textAnchor="middle" fontSize="8" fill="#000">1</text>}
   </svg>
 );
}


function TabIcon({ name, active }: { name: Tab; active: boolean }) {
 const color = active ? "#ff9500" : "#bbb";
 switch (name) {
   case "Playlists":
     return (
       <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M3 4h18v2H3zM3 9h12v2H3zM3 14h12v2H3zM17 9h2v9h-2zM20 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
     );
   case "Artists":
     return (
       <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.33 0-8 2.17-8 6v2h16v-2c0-3.83-3.67-6-8-6z"/></svg>
     );
   case "Songs":
     return (
       <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>
     );
   case "Now Playing":
     return (
       <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9zm-2 13V8l6 4z"/></svg>
     );
 }
}

export default MusicApp;

