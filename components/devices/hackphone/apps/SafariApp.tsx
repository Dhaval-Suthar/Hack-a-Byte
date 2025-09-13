"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { io as rawIo, Socket } from 'socket.io-client';
import Image from "next/image";
import { getPlayspaceId } from "@/lib/playspace-utils";
import { InputSanitizer } from "@/lib/client-security";
import { logger } from '@/lib/logger';

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

interface ExtractorEvent { 
  id: string; 
  type: string; 
  outcome: 'gain'|'loss'|'neutral'; 
  amount: number; 
  detail?: string; 
  ts: number; 
}

interface DeviceMeta { 
  teamId?: string; 
  isBank?: boolean; 
}

interface Site {
  _id: string;
  url: string;
  title: string;
  description: string;
  category: 'news' | 'social' | 'ecommerce' | 'search' | 'entertainment' | 'crypto' | 'reward' | 'other' | 'fake';
  content: string;
  isRewardSite: boolean;
  rewardAmount?: number;
  rewardClaimed?: boolean;
  rewardClaimedBy?: string;
  rewardClaimedAt?: string;
  rewardCooldownMinutes?: number;
  isFakeSite?: boolean;
  fakeTargetAmount?: number;
  deployedBy?: string;
  favicon?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  dateAdded: number;
}

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  duration?: number;
}

// Memoized HomePage component outside main component to prevent re-creation and maintain scroll position
const MemoizedHomePage = React.memo<{
  sites: Site[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  sitesPerPage: number;
  navigateTo: (url: string) => void;
  setShowBookmarks: (show: boolean) => void;
  showBookmarks: boolean;
  bookmarks: Bookmark[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  events: ExtractorEvent[];
}>(({ 
  sites, 
  currentPage, 
  setCurrentPage, 
  sitesPerPage, 
  navigateTo, 
  setShowBookmarks, 
  showBookmarks, 
  bookmarks, 
  addNotification, 
  events 
}) => {
  const totalPages = Math.ceil(sites.length / sitesPerPage);
  const startIndex = (currentPage - 1) * sitesPerPage;
  const endIndex = startIndex + sitesPerPage;
  const currentSites = sites.slice(startIndex, endIndex);

  const getCategoryIcon = useCallback((category: string) => {
    const icons = {
      news: '📰',
      social: '👥',
      ecommerce: '🛒',
      search: '🔍',
      entertainment: '🎬',
      crypto: '₿',
      reward: '🎁',
      other: '🌐'
    };
    return icons[category as keyof typeof icons] || '🌐';
  }, []);

  return (
    <div className="h-full bg-gradient-to-b from-white to-gray-50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🌐 Safari Home</h1>
          <p className="text-gray-600">Discover available websites in the simulation</p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-700">
              📊 Total Sites: {sites.length} | 🎁 Reward Sites: {sites.filter(s => s.isRewardSite).length}
            </p>
          </div>
        </div>

        {/* Sites Grid */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {currentSites.map((site) => {
            // Calculate cooldown status for reward sites
            let rewardStatus = null;
            if (site.isRewardSite) {
              if (site.rewardClaimed && site.rewardClaimedAt) {
                const cooldownMinutes = site.rewardCooldownMinutes || 60;
                const claimedTime = new Date(site.rewardClaimedAt).getTime();
                const timeSinceLastClaim = Date.now() - claimedTime;
                const cooldownPeriod = cooldownMinutes * 60 * 1000;
                
                if (timeSinceLastClaim < cooldownPeriod) {
                  const remainingTime = cooldownPeriod - timeSinceLastClaim;
                  const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
                  rewardStatus = (
                    <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      ⏰ Cooldown: {remainingMinutes}m
                    </span>
                  );
                } else {
                  rewardStatus = (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      🎁 Available: {site.rewardAmount}₿
                    </span>
                  );
                }
              } else {
                // Show reward badge for both real and fake sites (no visual distinction)
                rewardStatus = (
                  <span className="bg-yellow-400 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    🎁 Reward: {site.rewardAmount}₿
                  </span>
                );
              }
            }

            return (
              <div
                key={site._id}
                className={` border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]`}
                onClick={() => navigateTo(site.url)}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getCategoryIcon(site.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-800 truncate">{site.title}</h3>
                      {rewardStatus}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">{site.description}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{site.url}</p>
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              ← Previous
            </button>
            
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-full ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } transition-colors`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              Next →
            </button>
          </div>
        )}

        {/* Categories Filter */}
        <div className="mt-8 p-4 bg-white rounded-xl shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-3">Browse by Category</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {['news', 'social', 'ecommerce', 'search', 'entertainment', 'crypto', 'reward', 'other'].map(category => {
              const count = sites.filter(s => s.category === category).length;
              return count > 0 ? (
                <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="flex items-center space-x-2">
                    <span>{getCategoryIcon(category)}</span>
                    <span className="capitalize">{category}</span>
                  </span>
                  <span className="text-gray-500">{count}</span>
                </div>
              ) : null;
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border">
          <h3 className="font-semibold text-gray-800 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
            >
              <div className="text-lg mb-1">📚</div>
              <div className="text-sm font-medium text-gray-800">View Bookmarks</div>
              <div className="text-xs text-gray-500">{bookmarks.length} saved</div>
            </button>
            <button
              onClick={() => addNotification({ type: 'info', message: 'Activity log shows recent browser events' })}
              className="p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow text-left"
            >
              <div className="text-lg mb-1">📊</div>
              <div className="text-sm font-medium text-gray-800">Activity Log</div>
              <div className="text-xs text-gray-500">{events.length} events</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

MemoizedHomePage.displayName = 'MemoizedHomePage';

const SafariApp: React.FC<SafariAppProps> = () => {
  const [tabTitle, setTabTitle] = useState("Untitled");
  const [address, setAddress] = useState("https://www.redmondpie.com/");
  const [addressInput, setAddressInput] = useState(address);
  const [loading, setLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [history, setHistory] = useState<string[]>([address]);
  const [histIndex, setHistIndex] = useState(0);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  
  // Extraction additions
  const teamId = '';
  const [events, setEvents] = useState<ExtractorEvent[]>([]);
  const [socket, setSocket] = useState<Socket|null>(null);
  const [phishWarning, setPhishWarning] = useState<string|null>(null);
  
  // New state for improvements
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [securityLevel, setSecurityLevel] = useState<'safe' | 'warning' | 'danger'>('safe');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showHomePage, setShowHomePage] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sitesPerPage] = useState(6);

  // Notification system
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto-remove after duration
    const duration = notification.duration || 3000;
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  // Bookmark management
  const addBookmark = useCallback((url: string, title: string, favicon?: string) => {
    const bookmark: Bookmark = {
      id: Math.random().toString(36).slice(2),
      url,
      title,
      favicon,
      dateAdded: Date.now()
    };
    setBookmarks(prev => [bookmark, ...prev]);
    addNotification({ type: 'success', message: `Bookmarked "${title}"` });
  }, [addNotification]);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  }, []);

  // Security assessment
  const assessSecurity = useCallback((url: string) => {
    try {
      const u = new URL(url);
      const hostPath = `${u.hostname}${u.pathname}`;
      
      // Check for HTTPS
      const isHttps = u.protocol === 'https:';
      
      // Check for suspicious patterns
      const suspiciousPatterns = [/login/i, /bank/i, /wallet/i, /secure-update/i, /verify/i, /phishing/i];
      const hasSuspiciousPattern = suspiciousPatterns.some(rx => rx.test(hostPath));
      
      // Check for known dangerous domains
      const dangerousDomains = ['malware.com', 'phishing-site.net', 'fake-bank.org'];
      const isDangerous = dangerousDomains.some(domain => u.hostname.includes(domain));
      
      if (isDangerous || (!isHttps && hasSuspiciousPattern)) {
        setSecurityLevel('danger');
        setPhishWarning(`Security Risk: ${u.hostname} may be unsafe`);
        addNotification({ 
          type: 'error', 
          message: `⚠️ Security Warning: This site may be dangerous`, 
          duration: 5000 
        });
      } else if (hasSuspiciousPattern || !isHttps) {
        setSecurityLevel('warning');
        setPhishWarning(`Caution: ${u.hostname} requires attention`);
      } else {
        setSecurityLevel('safe');
        setPhishWarning(null);
      }
      
      // Add security event
      if (hasSuspiciousPattern || isDangerous) {
        const evt: ExtractorEvent = { 
          id: Math.random().toString(36).slice(2), 
          type: 'security-check', 
          outcome: 'neutral', 
          amount: 0, 
          ts: Date.now(), 
          detail: `Security assessment: ${u.hostname}` 
        };
        setEvents(ev => [evt, ...ev].slice(0, 50));
      }
    } catch {
      setSecurityLevel('warning');
      setPhishWarning('Invalid URL format');
    }
  }, [addNotification]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addNotification({ type: 'success', message: 'Connection restored' });
    };
    const handleOffline = () => {
      setIsOffline(true);
      addNotification({ type: 'warning', message: 'No internet connection' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);

  // Load sites from API
  useEffect(() => {
    const loadSites = async () => {
      try {
        const response = await fetch('/api/sites');
        const data = await response.json();
        if (data.success) {
          setSites(data.sites);
        }
      } catch (error) {
        logger.error('Failed to load sites:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    };
    loadSites();
  }, []);

  // Check reward site and claim if available
  const checkRewardSite = useCallback(async (url: string) => {
    if (!teamId) return;
    
    const rewardSite = sites.find(site => site.url === url && site.isRewardSite);
    if (!rewardSite) return;


    try {
      const response = await fetch('/api/safari/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, url })
      });

      const result = await response.json();
      
      if (result.success && result.claimed) {
        // Add event
        const evt: ExtractorEvent = {
          id: Math.random().toString(36).slice(2),
          type: 'reward-site',
          outcome: result.fake ? 'loss' : 'gain',
          amount: result.fake ? (rewardSite.fakeTargetAmount || result.stolen || 0) : (rewardSite.rewardAmount || result.reward || 0),
          ts: Date.now(),
          detail: rewardSite.title
        };
        setEvents(ev => [evt, ...ev].slice(0, 50));

        if (!result.fake) {
          addNotification({
            type: 'success',
            message: `🎉 Reward claimed: ${rewardSite.rewardAmount ?? result.reward} BTC from "${rewardSite.title}" (Balance: ${result.newBalance})`,
            duration: 5000
          });
        } else {
          addNotification({
            type: 'warning',
            message: `⚠️ Suspicious activity detected on site "${rewardSite.title}" (${result.stolen} BTC stolen)`,
            duration: 4000
          });
        }

        // Reload sites list to update after potential site deletion
        try {
          const sitesResponse = await fetch('/api/sites');
          const sitesData = await sitesResponse.json();
          if (sitesData.success) {
            setSites(sitesData.sites);
            
            // If current site was deleted (fake site), redirect to home
            if (result.fake && !sitesData.sites.find((s: Site) => s.url === url)) {
              setTimeout(() => {
                setShowHomePage(true);
                addNotification({
                  type: 'info',
                  message: 'The website has been taken offline.',
                  duration: 3000
                });
              }, 2000); // Give user time to see the "success" message first
            }
          }
        } catch (error) {
          logger.error('Failed to reload sites:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
        }
      } else if (result.onCooldown) {
        addNotification({
          type: 'warning',
          message: `⏰ This site is on cooldown. Try again in ${result.remainingMinutes} minute(s).`,
          duration: 4000
        });
      } else if (result.alreadyClaimed) {
        addNotification({
          type: 'warning',
          message: `💰 This reward site has already been claimed by team ${result.claimedBy}`,
          duration: 4000
        });
      } else {
        // Handle any other unsuccessful responses
        addNotification({
          type: 'warning',
          message: result.message || 'Unable to claim reward at this time',
          duration: 4000
        });
      }
    } catch (error) {
      logger.error('Failed to claim reward site:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      addNotification({
        type: 'error',
        message: 'Failed to claim reward site'
      });
    }
  }, [teamId, sites, addNotification]);

  // Load current site when address changes
  useEffect(() => {
    const loadCurrentSite = async () => {
      if (!address || showHomePage) return;
      
      setLoading(true);
      try {
        const encodedUrl = encodeURIComponent(address);
        const response = await fetch(`/api/sites/${encodedUrl}`);
        const data = await response.json();
        
        if (data.success) {
          setCurrentSite(data.site);
          setTabTitle(data.site.title);
          
          // Check if this is a reward site - always attempt to claim
          if (data.site.isRewardSite && teamId) {
            // Inline the reward check to avoid dependency loop
            const rewardSite = sites.find(site => site.url === address && site.isRewardSite);
            if (rewardSite) {
              checkRewardSite(address);
            }
          }
        } else {
          // Site not found, create a default one
          const defaultSite: Site = {
            _id: 'temp-' + Date.now(),
            url: address,
            title: extractTitleFromUrl(address),
            description: 'Website content',
            category: 'other',
            content: `<div class="p-8"><h1>${extractTitleFromUrl(address)}</h1><p>This website is not available in the current simulation.</p></div>`,
            isRewardSite: false,
            backgroundColor: '#ffffff',
            textColor: '#000000'
          };
          setCurrentSite(defaultSite);
          setTabTitle(defaultSite.title);
        }
      } catch (error) {
        logger.error('Failed to load site:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      } finally {
        setLoading(false);
      }
    };

    loadCurrentSite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, showHomePage, teamId]);

  const extractTitleFromUrl = (url: string) => {
    try {
      const u = new URL(url);
      return u.hostname.replace(/^www\./, "");
    } catch {
      return "Untitled";
    }
  };

  useEffect(() => {
    if (!showHomePage) {
      setAddressInput(address);
    }
  }, [address, showHomePage]);

  useEffect(() => {
    setCanGoBack(histIndex > 0);
    setCanGoForward(histIndex < history.length - 1);
  }, [histIndex, history.length]);

  const navigateTo = useCallback((input: string) => {
    const url = toUrl(input);
    if (!url) return;
    
    const newHist = history.slice(0, histIndex + 1).concat(url);
    setHistory(newHist);
    setHistIndex(newHist.length - 1);
    setAddress(url);
    setShowHomePage(false);
    assessSecurity(url);
  }, [history, histIndex, assessSecurity]);

  const goBack = () => {
    if (histIndex <= 0) return;
    const i = histIndex - 1;
    setHistIndex(i);
    setAddress(history[i]);
    setShowHomePage(false);
  };
  
  const goForward = () => {
    if (histIndex >= history.length - 1) return;
    const i = histIndex + 1;
    setHistIndex(i);
    setAddress(history[i]);
    setShowHomePage(false);
  };

  const goHome = () => {
    setShowHomePage(true);
    setAddress("https://www.redmondpie.com/");
    setAddressInput("Home");
    setCurrentPage(1);
  };

  // Memoized HomePage component to avoid unnecessary re-renders and maintain scroll position
  const homePageProps = useMemo(() => ({
    sites,
    currentPage,
    setCurrentPage,
    sitesPerPage,
    navigateTo,
    setShowBookmarks,
    showBookmarks,
    bookmarks,
    addNotification,
    events
  }), [sites, currentPage, setCurrentPage, sitesPerPage, navigateTo, setShowBookmarks, showBookmarks, bookmarks, addNotification, events]);

  const HomePage = useCallback(() => {
    return <MemoizedHomePage {...homePageProps} />;
  }, [homePageProps]);

  const SecurityIndicator = () => {
    const securityColors = {
      safe: 'text-green-400',
      warning: 'text-yellow-400',
      danger: 'text-red-400'
    };

    const securityIcons = {
      safe: '🔒',
      warning: '⚠️',
      danger: '🚨'
    };

    return (
      <div className={`flex items-center space-x-1 ${securityColors[securityLevel]}`}>
        <span className="text-xs">{securityIcons[securityLevel]}</span>
        {phishWarning && (
          <span className="text-xs font-medium truncate max-w-32">
            {phishWarning}
          </span>
        )}
      </div>
    );
  };

  const BookmarksPanel = () => (
    showBookmarks && (
      <div className="absolute top-full left-0 right-0 bg-gray-800 border-t border-gray-600 max-h-64 overflow-y-auto z-30">
        <div className="p-3">
          <h3 className="text-white text-sm font-semibold mb-2">Bookmarks</h3>
          {bookmarks.length === 0 ? (
            <p className="text-gray-400 text-xs">No bookmarks yet</p>
          ) : (
            <div className="space-y-2">
              {bookmarks.map(bookmark => (
                <div
                  key={bookmark.id}
                  className="flex items-center justify-between p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                  onClick={() => {
                    navigateTo(bookmark.url);
                    setShowBookmarks(false);
                  }}
                >
                  <div className="flex items-center space-x-2 flex-1">
                    {bookmark.favicon && (
                      <Image src={bookmark.favicon} alt="" width={16} height={16} className="w-4 h-4" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{bookmark.title}</p>
                      <p className="text-gray-400 text-xs truncate">{bookmark.url}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBookmark(bookmark.id);
                    }}
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  );

  const iOSBar = (
    <div className="px-4 pb-2 pt-2 bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] border-b border-gray-600 shadow-lg relative select-none">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/10 pointer-events-none" />
      
      {/* Tab title with security indicator */}
      <div className="flex items-center justify-between text-center text-white text-base font-semibold tracking-wide drop-shadow">
        <div className="flex-1 text-center">{showHomePage ? "🏠 Home" : tabTitle}</div>
        <div className="flex items-center space-x-2">
          {!showHomePage && <SecurityIndicator />}
          {events.length > 0 && (
            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
              {events.length}
            </span>
          )}
          {isOffline && (
            <span className="text-red-400 text-xs">Offline</span>
          )}
        </div>
      </div>
      
      <div className="mt-2 grid grid-cols-[1fr_90px] gap-2">
        {/* Address bar */}
        <form
          className="relative"
          onSubmit={(e) => { 
            e.preventDefault(); 
            if (addressInput.toLowerCase() === 'home' || addressInput === '') {
              goHome();
            } else {
              navigateTo(addressInput); 
            }
          }}
        >
          <input
            value={showHomePage ? "Home" : addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            onFocus={() => {
              if (showHomePage) {
                setAddressInput("");
              }
            }}
            placeholder="Enter URL or type 'Home'"
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
      
      <BookmarksPanel />
    </div>
  );

  // Auto team discovery
  useEffect(()=>{
    let cancelled = false;
    async function load() {
      try {
        // Get current playspace ID using the proper utility
        const playspaceId = getPlayspaceId();

        if (playspaceId && !teamId) {
          // Use /api/team with proper x-playspace-id header like other apps
          const teamResponse = await fetch('/api/team', {
            headers: {
              'x-playspace-id': playspaceId
            }
          });
          if (teamResponse.ok) {
            const teamData = await teamResponse.json();
            if (teamData.success && teamData.teamId) {
              return;
            }
          }
        }

        // Fallback to devices API if team API fails
        const resp = await fetch('/api/devices');
        if (!resp.ok) return;
        const js = await resp.json();
        if (cancelled) return;
        if (Array.isArray(js.devices)) {
          const devices: DeviceMeta[] = js.devices;
          const pick = devices.find(d=> d.teamId && !d.isBank) || devices.find(d=>d.teamId);
          if (pick?.teamId && !teamId) {
          }
        }
      } catch (error) {
        logger.error('🎯 Safari team detection error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    }
    load();
    const id = setInterval(load, 20000);
    return ()=>{ cancelled = true; clearInterval(id); };
  }, []);

  // Socket connect for extractor events
  useEffect(()=>{
    if (!teamId || socket) return;
    const s = rawIo('/', { path: '/api/socketio', transports:['websocket'], timeout: 20000 });
    s.on('connect', ()=>{/* noop */});
    s.on('connect_error', (error) => {
      logger.warn('SafariApp socket connection error:', { error: error.message });
    });
    s.on('connect_timeout', () => {
      logger.warn('SafariApp socket connection timeout');
    });
    // Listen for faucet + generic extractor events
    s.on('extractor-faucet', (p: { teamId:string; reward:number; attempts:number; windowExpires:number; balance:number; ts:number })=>{
      if (p.teamId !== teamId) return;
      const evt: ExtractorEvent = { id: Math.random().toString(36).slice(2), type:'faucet', outcome:'gain', amount:p.reward, ts:p.ts, detail:`Attempt ${p.attempts}` };
      setEvents(ev=> [evt, ...ev].slice(0,50));
      addNotification({ type: 'success', message: `Faucet reward: ${p.reward} bitcoins!` });
    });
    s.on('extractor-event', (p: { teamId:string; event: ExtractorEvent })=>{
      if (p.teamId !== teamId) return;
      const e = p.event;
      setEvents(ev=> [ { id: e.id || Math.random().toString(36).slice(2), type:e.type, outcome:e.outcome, amount:e.amount, ts:e.ts, detail:e.detail }, ...ev].slice(0,50));
    });
    setSocket(s);
    return ()=>{ s.disconnect(); };
  }, [teamId, socket, addNotification]);

  // UI Components
  const NotificationContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`
            px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm max-w-sm
            ${notification.type === 'success' ? 'bg-green-500/90 text-white' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-500/90 text-black' : ''}
            ${notification.type === 'error' ? 'bg-red-500/90 text-white' : ''}
            ${notification.type === 'info' ? 'bg-blue-500/90 text-white' : ''}
            animate-in slide-in-from-right duration-300
          `}
        >
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      ))}
    </div>
  );

  const BottomBar = () => {
    const buttons = [
      { id: "back", icon: "https://api.iconify.design/ion/chevron-back.svg?color=white", onClick: goBack, disabled: !canGoBack },
      { id: "forward", icon: "https://api.iconify.design/ion/chevron-forward.svg?color=white", onClick: goForward, disabled: !canGoForward },
      { id: "home", icon: "https://api.iconify.design/ion/home-outline.svg?color=white", onClick: goHome },
      { id: "share", icon: "https://api.iconify.design/ion/share-outline.svg?color=white", onClick: async () => { 
        try { 
          await navigator.clipboard.writeText(address); 
          addNotification({ type: 'success', message: 'URL copied to clipboard!' });
        } catch { 
          addNotification({ type: 'error', message: 'Failed to copy URL' });
        } 
      }},
      { 
        id: "bookmarks", 
        icon: "https://api.iconify.design/ion/bookmark-outline.svg?color=white", 
        onClick: () => {
          if (currentSite && !showHomePage) {
            addBookmark(address, currentSite.title, currentSite.favicon);
          } else {
            setShowBookmarks(!showBookmarks);
          }
        }
      },
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
            className={`relative flex-1 flex items-center justify-center ${b.disabled ? 'opacity-40' : 'hover:bg-white/10'}`}
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

      {/* Web content area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bg-white">
          {showHomePage ? (
            <HomePage />
          ) : currentSite ? (
            <div 
              className="min-h-full p-4" 
              style={{ 
                backgroundColor: currentSite.backgroundColor || '#ffffff',
                color: currentSite.textColor || '#000000'
              }}
              dangerouslySetInnerHTML={{ __html: InputSanitizer.sanitizeHtml(currentSite.content) }}
              onClick={(e) => {
                // Handle clicks on claim buttons within the site content
                const target = e.target as HTMLElement;
                if (target.tagName === 'BUTTON' && 
                    target.textContent?.includes('CLAIM') && 
                    currentSite.isRewardSite) {
                  e.preventDefault();
                  
                  // Add visual feedback
                  target.style.opacity = '0.6';
                  target.style.cursor = 'wait';
                  target.textContent = 'Processing...';
                  
                  // Trigger reward claim
                  checkRewardSite(currentSite.url).finally(() => {
                    // Reset button state after a delay
                    setTimeout(() => {
                      if (target.textContent === 'Processing...') {
                        target.style.opacity = '1';
                        target.style.cursor = 'pointer';
                        target.textContent = target.textContent.replace('Processing...', 'CLAIM');
                      }
                    }, 1000);
                  });
                }
              }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <p>No website loaded</p>
                  <button 
                    onClick={goHome}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Go to Home Page
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomBar />
      <NotificationContainer />
    </div>
  );
};

export default SafariApp;
