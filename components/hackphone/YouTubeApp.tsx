import React, { useEffect, useRef, useState } from "react";

interface VideoItem {
  id: string;
  title: string;
  channel: string;
  views: string;
  time: string;
  duration: string;
  videoId?: string; // For playable videos via YouTube embed
  channelId?: string;
  avatarUrl?: string;
}

interface YouTubeAppProps {
  onClose: () => void;
  time: Date;
}

const YouTubeApp: React.FC<YouTubeAppProps> = ({ onClose, time }) => {
  // Tabs reflect the bottom taskbar in the provided mock
  const [tab, setTab] = useState<"home" | "shorts" | "subscriptions" | "you">("home");
  const [activeChip, setActiveChip] = useState<string>("All");
  const [playing, setPlaying] = useState<VideoItem | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [openChannelId, setOpenChannelId] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);
  const [likes, setLikes] = useState<Record<string, number>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [disliked, setDisliked] = useState<Record<string, boolean>>({});
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({});
  const [showComments, setShowComments] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");
  const [startMuted, setStartMuted] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  // keeps track only for UI pill; video autoplays muted by default

  // Lock background scroll while player is open to avoid scroll bouncing
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevObs = (body.style as any).overscrollBehavior || "";
    if (playing) {
      body.style.overflow = 'hidden';
      (body.style as any).overscrollBehavior = 'contain';
    } else {
      body.style.overflow = prevOverflow || '';
      (body.style as any).overscrollBehavior = prevObs || '';
    }
    return () => {
      body.style.overflow = '';
      (body.style as any).overscrollBehavior = '';
    };
  }, [playing]);

  // Reset iframe loading state whenever a new video starts
  useEffect(() => {
    setIframeLoaded(false);
  }, [playing?.id]);

  const openPlayer = (v: VideoItem) => {
    setIframeLoaded(false);
    setPlaying(v);
  setStartMuted(true);
    // Seed like count lazily if not present
    if (v.videoId && likes[v.videoId] === undefined) {
      const seed = 5000 + Math.floor(Math.random() * 25000);
      setLikes((prev) => ({ ...prev, [v.videoId!]: seed }));
    }
  };

  const toggleSubscribe = (channelId?: string) => {
    if (!channelId) return;
    setSubscribed((prev) => ({ ...prev, [channelId]: !prev[channelId] }));
  };

  const handleLike = (videoId?: string) => {
    if (!videoId) return;
    setLiked((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
    setDisliked((prev) => ({ ...prev, [videoId]: false }));
    setLikes((prev) => {
      const current = prev[videoId] ?? 0;
      const isNowLiked = !liked[videoId];
      const delta = isNowLiked ? 1 : -1;
      return { ...prev, [videoId]: current + delta };
    });
  };

  const handleDislike = (videoId?: string) => {
    if (!videoId) return;
    const wasLiked = liked[videoId];
    setDisliked((prev) => ({ ...prev, [videoId]: !prev[videoId] }));
    setLiked((prev) => ({ ...prev, [videoId]: false }));
    if (wasLiked) {
      // remove previously added like
      setLikes((prev) => ({ ...prev, [videoId]: (prev[videoId] ?? 0) - 1 }));
    }
  };

  const handleShare = async (videoId?: string, title?: string) => {
    if (!videoId) return;
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: title || "YouTube", url });
        setToast("Shared");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setToast("Link copied");
      } else {
        setToast(url);
      }
    } catch {
      /* ignore */
    }
    setTimeout(() => setToast(""), 1500);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

  // Minimal mocked feed to match UI structure (image thumbnails are placeholders, UI-focused)
  const baseFeed: VideoItem[] = [
    {
      id: "1",
      title: "Relive iOS 4 on a modern phone",
      channel: "RetroTech",
      views: "2.3M views",
      time: "2 days ago",
      duration: "12:45",
      videoId: "dQw4w9WgXcQ",
      channelId: "retro",
      avatarUrl: "https://ui-avatars.com/api/?name=RetroTech&background=ddd&color=555&bold=true&size=64",
    },
    {
      id: "2",
      title: "iPhone 4 design story | From idea to icon",
      channel: "DesignStory",
      views: "1.1M views",
      time: "1 week ago",
      duration: "9:07",
      videoId: "9bZkp7q19f0",
      channelId: "design",
      avatarUrl: "https://ui-avatars.com/api/?name=Design+Story&background=ddd&color=555&bold=true&size=64",
    },
    {
      id: "3",
      title: "WWDC 2010 highlights in 10 minutes",
      channel: "AppleEvents",
      views: "835K views",
      time: "5 days ago",
      duration: "10:00",
      videoId: "3GwjfUFyY6M",
      channelId: "apple",
      avatarUrl: "https://ui-avatars.com/api/?name=Apple+Events&background=ddd&color=555&bold=true&size=64",
    },
    {
      id: "4",
      title: "iOS 4 Multitasking Explained",
      channel: "RetroiOS",
      views: "560K views",
      time: "3 days ago",
      duration: "8:21",
      videoId: "eY52Zsg-KVI",
      channelId: "retroiOS",
      avatarUrl: "https://ui-avatars.com/api/?name=RetroiOS&background=ddd&color=555&bold=true&size=64",
    },
    {
      id: "5",
      title: "iPhone 4 Camera Test in 2025",
      channel: "RetroTech",
      views: "290K views",
      time: "1 day ago",
      duration: "6:12",
      videoId: "C0DPdy98e4c",
      channelId: "retro",
      avatarUrl: "https://ui-avatars.com/api/?name=RetroTech&background=ddd&color=555&bold=true&size=64",
    },
    {
      id: "6",
      title: "Top 10 iOS 4 Apps You Forgot",
      channel: "RetroDaily",
      views: "742K views",
      time: "2 weeks ago",
      duration: "14:03",
      videoId: "FTQbiNvZqaY",
      channelId: "retrodaily",
      avatarUrl: "https://ui-avatars.com/api/?name=Retro+Daily&background=ddd&color=555&bold=true&size=64",
    },
    {
      id: "7",
      title: "The iPhone that changed everything: 4",
      channel: "DesignStory",
      views: "1.9M views",
      time: "4 days ago",
      duration: "11:40",
      videoId: "tVj0ZTS4WF4",
      channelId: "design",
      avatarUrl: "https://ui-avatars.com/api/?name=Design+Story&background=ddd&color=555&bold=true&size=64",
    },
    {
      id: "8",
      title: "iOS 4 Easter Eggs You Didn’t Know",
      channel: "DevTutorials",
      views: "402K views",
      time: "6 days ago",
      duration: "7:58",
      videoId: "J---aiyznGQ",
      channelId: "dev",
      avatarUrl: "https://ui-avatars.com/api/?name=Dev+Tutorials&background=ddd&color=555&bold=true&size=64",
    },
    {
      id: "9",
      title: "Retro Games on iPhone 4",
      channel: "GameHistory",
      views: "615K views",
      time: "1 month ago",
      duration: "16:32",
      videoId: "oHg5SJYRHA0",
      channelId: "game",
      avatarUrl: "https://ui-avatars.com/api/?name=Game+History&background=ddd&color=555&bold=true&size=64",
    },
  ];

  // Expand to 100 videos for Home
  const feed: VideoItem[] = Array.from({ length: 100 }).map((_, idx) => {
    const base = baseFeed[idx % baseFeed.length];
    return {
      ...base,
      id: String(idx + 1),
      title: `${base.title} #${idx + 1}`,
    };
  });

  // Shorts data (100 items)
  const shortsIds = [
    "nCkpzqqog4k","aqz-KE-bpKQ","M7FIvfx5J10","V-_O7nl0Ii0","ScMzIvxBSi4","VbfpW0pbvaU",
    "oHg5SJYRHA0","FTQbiNvZqaY","dQw4w9WgXcQ","9bZkp7q19f0","3GwjfUFyY6M","J---aiyznGQ",
  ];
  const shorts: VideoItem[] = Array.from({ length: 100 }).map((_, idx) => {
    const vid = shortsIds[idx % shortsIds.length];
    return {
      id: `s${idx + 1}`,
      title: `Shorts clip ${idx + 1}`,
      channel: "ShortsChannel",
      views: `${(Math.floor(Math.random() * 900) + 100)}K views`,
      time: "1d ago",
      duration: "0:30",
      videoId: vid,
      channelId: "shorts",
      avatarUrl: "https://ui-avatars.com/api/?name=Shorts&background=ddd&color=555&bold=true&size=64",
    };
  });

  const chips = [
    "All",
    "iOS 4",
    "Music",
    "Gaming",
    "Apple",
    "Tech",
    "Live",
    "News",
  ];

  const channelSubs: Record<string, string> = {
    retro: "842K subscribers",
    design: "1.2M subscribers",
    apple: "3.8M subscribers",
    retroiOS: "214K subscribers",
    retrodaily: "531K subscribers",
    dev: "96.3K subscribers",
    game: "402K subscribers",
  };

  const StatusBar = () => (
    <div className="flex justify-between items-center px-4 pt-4 pb-1 text-white text-xs relative z-10">
      <button onClick={onClose} className="text-white text-sm">← Back</button>
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium">{formatTime(time)}</span>
        <div className="w-6 h-3 border border-white/60 rounded-sm relative">
          <div className="w-3 h-1.5 bg-green-500 rounded-sm m-0.5" />
          <div className="w-0.5 h-1 bg-white/60 rounded-full absolute -right-0.5 top-0.5" />
        </div>
      </div>
    </div>
  );

  const Header = () => {
  if (searchOpen) {
      return (
        <div className="bg-white border-b border-gray-200 px-3 py-1 flex items-center">
          <div className="flex items-center bg-gray-100 rounded-lg px-2 py-1 flex-1">
            <img src="/hackphone/apps/youtube/search.png" alt="Search" className="h-5 w-5 mr-2 opacity-60" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search YouTube"
        className="flex-1 bg-transparent outline-none text-sm text-black placeholder-gray-500 caret-black"
            />
          </div>
          <button className="ml-3 text-sm text-blue-600" onClick={() => { setSearchOpen(false); setSearchQuery(""); }}>
            Cancel
          </button>
        </div>
      );
    }
    return (
      <div className="bg-white border-b border-gray-200 px-3 py-1 flex items-center justify-between">
        <div className="flex items-center">
          <img src="/hackphone/apps/youtube/app_icon.png" alt="YouTube" className="h-7 w-7 mr-2" />
          <span className="font-semibold text-gray-900">YouTube</span>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setSearchOpen(true)}>
            <img src="/hackphone/apps/youtube/search.png" alt="Search" className="h-5 w-5" />
          </button>
          <img src="/hackphone/apps/youtube/bell.png" alt="Notifications" className="h-5 w-5" />
          <img src="/hackphone/apps/youtube/3-dots.png" alt="Menu" className="h-5 w-5" />
        </div>
      </div>
    );
  };

  const Chips = () => (
    <div className="bg-white border-b border-gray-200">
      <div className="flex overflow-x-auto no-scrollbar px-2 py-1.5 space-x-2">
        {chips.map((c) => (
          <button
            key={c}
            onClick={() => setActiveChip(c)}
            className={
              "px-3 py-1.5 rounded-full text-sm whitespace-nowrap " +
              (activeChip === c
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-800")
            }
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );

  const VideoCard: React.FC<{ v: VideoItem }> = ({ v }) => (
    <button className="pb-4 w-full text-left" onClick={() => openPlayer(v)}>
      <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden">
        <img
          src={v.videoId ? `https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg` : 
            "/hackphone/apps/youtube/app_icon.png"}
          alt={v.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/hackphone/apps/youtube/app_icon.png";
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-black/50 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl">
            ▶
          </div>
        </div>
        <div className="absolute right-2 bottom-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
          {v.duration}
        </div>
      </div>
      <div className="mt-2 px-2">
        <div className="flex items-start">
          <button
            onClick={(e) => { e.stopPropagation(); setOpenChannelId(v.channelId || null); }}
            className="mr-2"
            aria-label="Open channel"
          >
            {v.avatarUrl ? (
              <img
                src={v.avatarUrl}
                alt={v.channel}
                className="h-9 w-9 rounded-full border border-gray-200"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center text-xs font-semibold">
                {v.channel.slice(0, 1)}
              </div>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
              {v.title}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setOpenChannelId(v.channelId || null); }}
              className="text-left w-fit"
            >
              <div className="text-xs text-gray-600 mt-0.5 truncate">
                {v.channel} • {v.views} • {v.time}
              </div>
            </button>
          </div>
          <img
            src="/hackphone/apps/youtube/3-dots.png"
            alt="options"
            className="h-4 w-4 ml-2 mt-1 flex-shrink-0"
          />
        </div>
      </div>
    </button>
  );

  const HomeFeed = () => (
    <div className="flex-1 overflow-y-auto pb-20 bg-white overscroll-contain" style={{ touchAction: 'pan-y' }}>
      {(searchQuery
        ? feed.filter((v) =>
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.channel.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : feed
      ).map((v) => (
        <VideoCard key={v.id} v={v} />
      ))}
    </div>
  );

  const Shorts = () => (
    <div className="flex-1 overflow-y-auto pb-20 bg-white overscroll-contain" style={{ touchAction: 'pan-y' }}>
      {shorts.map((s) => (
        <button key={s.id} className="block w-full text-left mb-4" onClick={() => openPlayer(s)}>
          <div className="relative w-full" style={{ paddingTop: "177.78%" }}>
            <img
              src={`https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`}
              alt={s.title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/hackphone/apps/youtube/app_icon.png";
              }}
            />
            <div className="absolute right-2 bottom-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">{s.duration}</div>
          </div>
          <div className="mt-2 px-2">
            <div className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">{s.title}</div>
            <div className="text-xs text-gray-600 mt-0.5 truncate">{s.channel} • {s.views}</div>
          </div>
        </button>
      ))}
    </div>
  );

  const Subscriptions = () => (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
      Subscriptions coming soon
    </div>
  );

  const YouTab = () => (
    <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
      Profile coming soon
    </div>
  );

  const BottomBar = () => (
    <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-around">
        <button
          className={`flex flex-col items-center text-[12px] ${tab === "home" ? "text-black" : "text-gray-500"}`}
          onClick={() => setTab("home")}
        >
          <img src="/hackphone/apps/youtube/home.png" alt="Home" className="h-6 w-6 mb-0.5" />
          <span>Home</span>
        </button>

        <button
          className={`flex flex-col items-center text-[12px] ${tab === "shorts" ? "text-black" : "text-gray-500"}`}
          onClick={() => setTab("shorts")}
        >
          <img src="/hackphone/apps/youtube/shorts_taskbar.png" alt="Shorts" className="h-6 w-6 mb-0.5" />
          <span>Shorts</span>
        </button>

        {/* Create button (center, emphasized) */}
        <button className="-mt-7 bg-white rounded-full p-2.5 shadow-md">
          <img src="/hackphone/apps/youtube/create_video_taskbar.png" alt="Create" className="h-9 w-9" />
        </button>

        <button
          className={`flex flex-col items-center text-[12px] ${tab === "subscriptions" ? "text-black" : "text-gray-500"}`}
          onClick={() => setTab("subscriptions")}
        >
          <img src="/hackphone/apps/youtube/subscriptions_taskbar.png" alt="Subscriptions" className="h-6 w-6 mb-0.5" />
          <span>Subscriptions</span>
        </button>

        <button
          className={`flex flex-col items-center text-[12px] ${tab === "you" ? "text-black" : "text-gray-500"}`}
          onClick={() => setTab("you")}
        >
          <img src="/hackphone/apps/youtube/taksbar_profile.png" alt="You" className="h-6 w-6 mb-0.5" />
          <span>You</span>
        </button>
      </div>
    </div>
  );

  const PlayerOverlay = () => {
    if (!playing) return null;
    return (
  <div className="fixed inset-0 z-50 flex flex-col bg-white">

        {/* Video */}
        <div className="w-full aspect-video bg-black relative">
          {/* Iframe first */}
      {playing.videoId ? (
            <iframe
              ref={iframeRef}
              className="absolute inset-0 w-full h-full"
        src={`https://www.youtube.com/embed/${playing.videoId}?rel=0&autoplay=1&modestbranding=1&mute=1&playsinline=1&enablejsapi=1${typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : ''}`}
              title={playing.title}
              loading="eager"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => {
                setIframeLoaded(true);
                try {
                  const win = iframeRef.current?.contentWindow;
                  if (win) {
        win.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
        win.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [0] }), '*');
        win.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
                  }
                } catch {}
              }}
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center text-white">No video source</div>
          )}
      {/* Placeholder on top until iframe reports loaded to avoid black frame */}
      {playing.videoId && (
            <img
              src={`https://img.youtube.com/vi/${playing.videoId}/hqdefault.jpg`}
              alt={playing.title}
        className={`absolute inset-0 z-10 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${iframeLoaded ? 'opacity-0' : 'opacity-100'}`}
            />
          )}
          {/* Removed the red overlay image per request; show only real video */}
          {/* Tap to unmute pill */}
          {startMuted && (
            <button
              onClick={() => {
                try {
                  const win = iframeRef.current?.contentWindow;
                  if (win) {
                    win.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
                    win.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
                    win.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
                  }
                } catch {}
                setStartMuted(false);
              }}
              className="absolute bottom-3 left-3 z-20 bg-white/90 text-gray-900 text-xs px-3 py-1.5 rounded-full shadow"
            >
              Tap to unmute
            </button>
          )}
        </div>

        {/* Details section */}
  <div className="flex-1 bg-white overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
          <div className="px-4 pt-3">
            <div className="flex items-start justify-between">
              <h1 className="text-[17px] font-semibold leading-snug text-gray-900 pr-2">
                {playing.title}
              </h1>
              <button aria-label="More" className="text-2xl text-gray-500 leading-none">⋯</button>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {playing.views} • {playing.time}
            </div>
          </div>

          {/* Channel row */}
          <div className="px-4 mt-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setOpenChannelId(playing.channelId || null)}
                className="flex items-center text-left"
                aria-label="Open channel"
              >
                {playing.avatarUrl ? (
                  <img src={playing.avatarUrl} alt={playing.channel} className="h-10 w-10 rounded-full border border-gray-200 mr-3" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-300 mr-3" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">{playing.channel}</div>
                  <div className="text-xs text-gray-600">{channelSubs[playing.channelId || ""] || "Subscribe"}</div>
                </div>
              </button>
              <button
                onClick={() => toggleSubscribe(playing.channelId)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${subscribed[playing.channelId || ""] ? 'bg-gray-200 text-gray-900' : 'bg-black text-white'}`}
              >
                {subscribed[playing.channelId || ""] ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
          </div>

          {/* Action chips */}
          <div className="px-3 mt-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => handleLike(playing.videoId)}
                className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-2 ${liked[playing.videoId || ""] ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              >
                👍 <span>{likes[playing.videoId || ""] ?? 0}</span>
              </button>
              <button
                onClick={() => handleDislike(playing.videoId)}
                className={`px-4 py-2 rounded-full border text-sm flex items-center gap-2 ${disliked[playing.videoId || ""] ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              >
                👎
              </button>
              <button
                onClick={() => handleShare(playing.videoId, playing.title)}
                className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm"
              >
                Share
              </button>
              <button onClick={() => setToast('Remix coming soon')} className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm">Remix</button>
              <button onClick={() => setToast('Thanks coming soon')} className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm">Thanks</button>
            </div>
          </div>

          {/* Comments preview */}
          <div className="px-4 mt-4">
            <button onClick={() => setShowComments(true)} className="w-full text-left bg-gray-100 rounded-2xl p-3">
              <div className="text-sm font-semibold text-gray-900">Comments <span className="text-gray-500 font-normal">1.4K</span></div>
              <div className="flex items-start mt-2">
                <img src="https://i.pravatar.cc/40?img=12" alt="commenter" className="h-8 w-8 rounded-full mr-2" />
                <div className="text-sm text-gray-700 line-clamp-2">
                  Whoever reads this message, I request just spare 2 minutes in prayer. My brother is diagnosed...
                </div>
              </div>
            </button>
          </div>

          {/* Up next */}
          <div className="mt-4">
            <div className="px-4 text-sm font-semibold text-gray-900 mb-2">Up next</div>
            {(feed.filter((v) => v.id !== playing.id)).map((v) => (
              <VideoCard key={v.id} v={v} />
            ))}
          </div>
          <div className="h-6" />
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-3 py-2 rounded-full shadow">
            {toast}
          </div>
        )}
      </div>
    );
  };

  const CommentsOverlay = () => {
    if (!showComments) return null;
    const sample = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      user: `User ${i + 1}`,
      avatar: `https://i.pravatar.cc/40?img=${(i % 70) + 1}`,
      text: "Great video! Loving this retro vibe.",
    }));
    return (
      <div className="fixed inset-0 z-[60] bg-white flex flex-col">
        <div className="flex items-center justify-between px-3 pt-4 pb-2 border-b">
          <button className="text-sm" onClick={() => setShowComments(false)}>← Back</button>
          <div className="text-sm font-medium">Comments</div>
          <div className="w-8" />
        </div>
  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 overscroll-contain" style={{ touchAction: 'pan-y' }}>
          {sample.map((c) => (
            <div key={c.id} className="flex items-start">
              <img src={c.avatar} className="h-8 w-8 rounded-full mr-2" />
              <div>
                <div className="text-sm font-medium">{c.user}</div>
                <div className="text-sm text-gray-700">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ChannelOverlay = () => {
    if (!openChannelId) return null;
    const channelVideos = feed.filter((v) => v.channelId === openChannelId);
    const channelName = channelVideos[0]?.channel || "Channel";
    const avatar = channelVideos[0]?.avatarUrl;
    return (
      <div className="absolute inset-0 bg-white z-20 flex flex-col">
        <div className="flex items-center justify-between px-3 pt-4 pb-1">
          <button className="text-sm" onClick={() => setOpenChannelId(null)}>← Back</button>
          <span className="text-xs text-gray-500">{formatTime(time)}</span>
        </div>
        <div className="px-4 pb-3 border-b border-gray-200">
          <div className="flex items-center">
            {avatar ? (
              <img src={avatar} alt={channelName} className="h-14 w-14 rounded-full border border-gray-200 mr-3" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gray-300 mr-3" />
            )}
            <div className="flex-1">
              <div className="text-base font-semibold text-gray-900">{channelName}</div>
              <div className="text-xs text-gray-600">{channelVideos.length} videos</div>
            </div>
            <button className="bg-black text-white px-3 py-1.5 rounded-full text-sm">Subscribe</button>
          </div>
        </div>

  <div className="flex-1 overflow-y-auto overscroll-contain" style={{ touchAction: 'pan-y' }}>
          {channelVideos.map((v) => (
            <VideoCard key={v.id} v={v} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`w-screen h-screen bg-white flex flex-col relative ${playing ? 'overflow-hidden' : ''}`}>
      <StatusBar />
      <Header />
      <Chips />

      {tab === "home" && <HomeFeed />}
      {tab === "shorts" && <Shorts />}
      {tab === "subscriptions" && <Subscriptions />}
      {tab === "you" && <YouTab />}

  <BottomBar />
  <PlayerOverlay />
  <CommentsOverlay />
  <ChannelOverlay />
    </div>
  );
};

export default YouTubeApp;
