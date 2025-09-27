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
  addNotification 
}) => {
  const totalPages = Math.ceil(sites.length / sitesPerPage);
  const startIndex = (currentPage - 1) * sitesPerPage;
  const endIndex = startIndex + sitesPerPage;
  const currentSites = sites.slice(startIndex, endIndex);

  // Simplified icon function that returns the same generic icon for all sites
  // to prevent users from identifying site types by their icons
  const getGenericIcon = useCallback(() => {
    // Generate a random icon from a set of confusingly similar options
    const icons = ['🌐', '🌍', '🌎', '🌏', '💫', '✨', '🔮'];
    // Use a stable random seed based on the current hour - changes every hour
    const hourSeed = new Date().getHours();
    const randomIndex = Math.floor((hourSeed * 7919) % icons.length);
    return icons[randomIndex];
  }, []);
  
  // Function to generate exciting random gradients for site icons
  const getRandomGradient = useCallback((id: string) => {
    // Use site ID as a seed to generate consistent gradient for same site
    const hash = id.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // More iOS 4 inspired gradients with glossy metallic feel
    const gradients = [
      'linear-gradient(135deg, #b3bfcb 0%, #8596a9 100%)', // Silver blue
      'linear-gradient(135deg, #c4d4e0 0%, #89a0b5 100%)', // Light steel blue
      'linear-gradient(135deg, #d7d7d7 0%, #a9a9a9 100%)', // Silver
      'linear-gradient(135deg, #ccd9e3 0%, #92a8c0 100%)', // Steel blue
      'linear-gradient(135deg, #e2e2e2 0%, #b5b5b5 100%)', // Light gray
      'linear-gradient(135deg, #e9f0f4 0%, #b6c8d6 100%)', // Light blue
      'linear-gradient(135deg, #d8d8d8 0%, #a0a0a0 100%)', // Gray
      'linear-gradient(135deg, #e5e9ed 0%, #a7b7c5 100%)', // Soft blue
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    ];
    
    return gradients[hash % gradients.length];
  }, []);

  return (
    <div className="h-full overflow-y-auto" style={{ 
      backgroundColor: '#e0e0e0',
      backgroundImage: 'linear-gradient(to bottom, #f8f8f8, #d1d1d1)',
    }}>
      {/* Enhanced iOS 4 Safari Style Navigation Bar with more visual interest */}
      <div className="sticky top-0 z-10" style={{ 
        backgroundImage: 'linear-gradient(to bottom, #5e87b0, #2d5b89)',
        borderBottom: '1px solid #1a3959',
        padding: '8px 0',
        boxShadow: '0 1px 5px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="flex justify-center items-center relative">
          {/* Apple-style shine effect overlay with animation */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none'
          }}></div>
          
          {/* Moving shine effect */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
            pointerEvents: 'none',
            animation: 'shine 3s infinite linear',
            animationDelay: '1s',
            backgroundSize: '50% 100%',
            zIndex: 5
          }}></div>
          
          {/* Nav buttons with animation effects */}
          <div className="absolute left-3">
            <div 
              style={{
                width: '18px',
                height: '18px',
                backgroundImage: 'linear-gradient(to bottom, #d2d2d2, #a0a0a0)',
                borderRadius: '9px',
                border: '1px solid #505050',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 1px rgba(0,0,0,0.2)',
                transition: 'all 0.15s ease',
                cursor: 'pointer',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.backgroundImage = 'linear-gradient(to bottom, #a0a0a0, #808080)';
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.3)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.backgroundImage = 'linear-gradient(to bottom, #d2d2d2, #a0a0a0)';
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 1px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundImage = 'linear-gradient(to bottom, #d2d2d2, #a0a0a0)';
                e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 1px rgba(0,0,0,0.2)';
              }}
            ></div>
          </div>
          
          {/* Safari text with metallic effect */}
          <div style={{ 
            color: '#fff',
            textShadow: '0 -1px 0 rgba(0,0,0,0.6), 0 1px 5px rgba(0,0,0,0.3)',
            fontWeight: 'bold',
            fontSize: '19px',
            letterSpacing: '0.5px',
            padding: '3px 0',
            position: 'relative'
          }}>
            <span>Safari</span>
          </div>
          
          {/* Refresh button */}
          <div className="absolute right-3">
            <div style={{
              width: '18px',
              height: '18px',
              backgroundImage: 'linear-gradient(to bottom, #d2d2d2, #a0a0a0)',
              borderRadius: '9px',
              border: '1px solid #505050',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 1px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
            }}>
              ↻
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {/* iOS 4 Style Header */}
        <div className="text-center mb-6" style={{
          textShadow: '0 1px 0 rgba(255,255,255,0.8)'
        }}>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Featured Sites</h1>
          <p className="text-gray-600 text-sm" style={{ fontStyle: 'italic' }}>
            Explore websites with exciting rewards
          </p>
          <div className="mt-3" style={{
            backgroundColor: 'rgba(255,255,255,0.7)',
            border: '1px solid #c0c0c0',
            borderRadius: '8px',
            padding: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1) inset'
          }}>
            <p className="text-xs text-gray-600">
              � {sites.length} Sites Available | {sites.filter(s => s.isRewardSite).length} Reward Sites
            </p>
          </div>
        </div>

        {/* iOS 4 Style List View */}
        <div className="flex flex-col gap-3 mb-6 px-3">
          <div className="mb-2" style={{
            background: 'linear-gradient(to bottom, #e0e6ed, #b5c3d2)',
            borderRadius: '8px 8px 0 0',
            padding: '6px 10px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
            borderBottom: '1px solid #8a98a8'
          }}>
            <h3 className="text-sm font-bold text-center" style={{
              color: '#2c3e50',
              textShadow: '0 1px 0 rgba(255,255,255,0.8)'
            }}>All Sites</h3>
          </div>
          {currentSites.map((site) => {
            // Calculate badge status for both normal and reward sites
            // Make all sites (including fake ones) look potentially rewarding with similar badges
            let rewardStatus = null;
            
            // Display a similar-looking reward badge for ALL sites, regardless of if they're actually reward sites
            // This creates confusion for users who won't know which sites are real rewards vs fake/scam
            
            // For real reward sites with cooldown logic
            if (site.isRewardSite) {
              if (site.rewardClaimed && site.rewardClaimedAt) {
                const cooldownMinutes = site.rewardCooldownMinutes || 60;
                const claimedTime = new Date(site.rewardClaimedAt).getTime();
                const timeSinceLastClaim = Date.now() - claimedTime;
                const cooldownPeriod = cooldownMinutes * 60 * 1000;
                
                if (timeSinceLastClaim < cooldownPeriod) {
                  // We don't need to calculate remaining time anymore since we're showing the same badge
                  rewardStatus = (
                    <div className="absolute top-0 right-0 h-6 w-6 -mt-2 -mr-2 flex items-center justify-center">
                      {/* Shiny badge with glow effect */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: 'linear-gradient(135deg, #ffd700, #ff9500)',
                        borderRadius: '50%',
                        boxShadow: '0 0 4px 1px rgba(255, 215, 0, 0.6), inset 0 1px 1px rgba(255,255,255,0.8)',
                        border: '1px solid rgba(150, 100, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className="text-[10px] font-bold" style={{ 
                          color: '#5d4300',
                          textShadow: '0 1px 0 rgba(255,255,255,0.5)'
                        }}>₿</span>
                      </div>
                    </div>
                  );
                } else {
                  rewardStatus = (
                    <div className="absolute top-0 right-0 h-6 w-6 -mt-2 -mr-2 flex items-center justify-center">
                      {/* Shiny badge with glow effect */}
                      <div style={{
                        width: '20px',
                        height: '20px',
                        background: 'linear-gradient(135deg, #ffd700, #ff9500)',
                        borderRadius: '50%',
                        boxShadow: '0 0 4px 1px rgba(255, 215, 0, 0.6), inset 0 1px 1px rgba(255,255,255,0.8)',
                        border: '1px solid rgba(150, 100, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <span className="text-[10px] font-bold" style={{ 
                          color: '#5d4300',
                          textShadow: '0 1px 0 rgba(255,255,255,0.5)'
                        }}>₿</span>
                      </div>
                    </div>
                  );
                }
              } else {
                // Standard reward badge - used for both real and fake sites
                rewardStatus = (
                  <div className="absolute right-3 flex items-center justify-center">
                    {/* Shiny badge with glow effect */}
                    <div style={{
                      width: '24px',
                      height: '24px',
                      background: 'linear-gradient(135deg, #ffd700, #ff9500)',
                      borderRadius: '50%',
                      boxShadow: '0 0 6px 1px rgba(255, 215, 0, 0.6), inset 0 1px 1px rgba(255,255,255,0.8)',
                      border: '1px solid rgba(150, 100, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span className="text-[10px] font-bold" style={{ 
                        color: '#5d4300',
                        textShadow: '0 1px 0 rgba(255,255,255,0.5)'
                      }}>₿</span>
                    </div>
                  </div>
                );
              }
            } 
            // For non-reward sites, randomly add a similar looking badge to create confusion
            else if (Math.random() > 0.6) { // Show reward-like badges on 40% of normal sites too
              rewardStatus = (
                <div className="absolute right-3 flex items-center justify-center">
                  {/* Shiny badge with glow effect */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #ffd700, #ff9500)',
                    borderRadius: '50%',
                    boxShadow: '0 0 6px 1px rgba(255, 215, 0, 0.6), inset 0 1px 1px rgba(255,255,255,0.8)',
                    border: '1px solid rgba(150, 100, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span className="text-[10px] font-bold" style={{ 
                      color: '#5d4300',
                      textShadow: '0 1px 0 rgba(255,255,255,0.5)'
                    }}>₿</span>
                  </div>
                </div>
              );
            }

            // Create a unified appearance for all sites regardless of type
            // iOS 4 style tile
            return (
              <div
                key={site._id}
                onClick={() => navigateTo(site.url)}
                className="relative flex items-center cursor-pointer w-full"
                style={{
                  height: '60px',
                  padding: '8px 10px',
                  animation: `fadeIn 0.${10 + (parseInt(site._id, 16) % 8)}s ease-in`,
                  transition: 'all 0.2s',
                  borderRadius: '8px',
                  background: 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 #fff',
                  border: '1px solid #ccc'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #e0e0e0, #d5d5d5)';
                  e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.1)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 #fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), inset 0 1px 0 #fff';
                }}
              >
                {/* Enhanced iOS 4 Style App Icon with exciting visual elements */}
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    minWidth: '42px',
                    borderRadius: '8px',
                    background: getRandomGradient(site._id),
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                    border: '1px solid rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    animation: `pulse ${3 + (parseInt(site._id, 16) % 7)}s infinite ease-in-out`,
                    animationDelay: `${(parseInt(site._id, 16) % 5) * 0.2}s`,
                    marginRight: '10px'
                  }}
                >
                  {/* Animated glossy overlay effect */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.1) 100%)',
                    borderTopLeftRadius: '7px',
                    borderTopRightRadius: '7px',
                    pointerEvents: 'none',
                    animation: 'shine 3s infinite linear',
                    backgroundSize: '200% 100%',
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)'
                  }} />
                  
                  {/* Icon with shadow */}
                  <div className="text-2xl" style={{ 
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))',
                    opacity: 0.9
                  }}>
                    {getGenericIcon()}
                  </div>
                  
                  {/* Decorative dot pattern in background */}
                  <div style={{
                    position: 'absolute',
                    bottom: '3px',
                    right: '3px',
                    width: '10px',
                    height: '10px',
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '4px 4px',
                    opacity: 0.6,
                    pointerEvents: 'none'
                  }} />
                  
                  {rewardStatus}
                </div>
                
                {/* Site Title and Description - iOS 4 style */}
                <div style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}>
                  <p className="font-bold text-sm text-gray-800" style={{ 
                    textShadow: '0 1px 0 rgba(255,255,255,0.8)',
                    marginBottom: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    color: '#2c3e50'
                  }}>
                    {site.title}
                  </p>
                  
                  <p className="text-xs text-gray-600" style={{ 
                    lineHeight: '1.2',
                    maxHeight: '30px',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: '2',
                    WebkitBoxOrient: 'vertical',
                    textShadow: '0 1px 0 rgba(255,255,255,0.5)',
                    opacity: 0.85
                  }}>
                    {site.description.length > 90 
                      ? site.description.substring(0, 90) + '...' 
                      : site.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* iOS 4 Style Pagination Dots */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 mb-2">
            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: page === currentPage ? '#007AFF' : '#c0c0c0',
                    boxShadow: page === currentPage ? 'none' : 'inset 0 1px 3px rgba(0,0,0,0.2)'
                  }}
                  aria-label={`Page ${page}`}
                >
                </button>
              ))}
            </div>
          </div>
        )}

        {/* iOS 4 Style Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 pt-1 pb-1 bg-black bg-opacity-85" style={{
          backgroundImage: 'linear-gradient(to bottom, #2c2c2c, #000000)',
          borderTop: '1px solid #333',
        }}>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="flex flex-col items-center justify-center"
            >
              <div className="text-lg text-white">📚</div>
              <div className="text-[10px] text-gray-300">Bookmarks</div>
            </button>
            <button
              onClick={() => addNotification({ type: 'info', message: 'History feature simulated' })}
              className="flex flex-col items-center justify-center"
            >
              <div className="text-lg text-white">📋</div>
              <div className="text-[10px] text-gray-300">History</div>
            </button>
            <button
              onClick={() => addNotification({ type: 'info', message: 'Activity log shows recent events' })}
              className="flex flex-col items-center justify-center"
            >
              <div className="text-lg text-white">📊</div>
              <div className="text-[10px] text-gray-300">Activity</div>
            </button>
            <button
              onClick={() => navigateTo("https://www.google.com")}
              className="flex flex-col items-center justify-center"
            >
              <div className="text-lg text-white">🏠</div>
              <div className="text-[10px] text-gray-300">Home</div>
            </button>
          </div>
        </div>
        
        {/* Add padding at the bottom to account for fixed bar */}
        <div className="h-16"></div>
      </div>
    </div>
  );
});

MemoizedHomePage.displayName = 'MemoizedHomePage';

// iOS 4 Safari animation styles
const safariAnimationStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shine {
  0% { background-position: -100px; }
  40% { background-position: 120%; }
  100% { background-position: 120%; }
}

@keyframes pulse {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.05); filter: brightness(1.1); }
  100% { transform: scale(1); filter: brightness(1); }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
}
`;

const SafariApp: React.FC<SafariAppProps> = () => {
  // Add animation styles to head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = safariAnimationStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  const [tabTitle, setTabTitle] = useState("Untitled");
  const [address, setAddress] = useState("https://www.redmondpie.com/");
  const [addressInput, setAddressInput] = useState(address);
  const [loading, setLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [history, setHistory] = useState<string[]>([address]);
  const [histIndex, setHistIndex] = useState(0);
  const [lastRewardAmount, setLastRewardAmount] = useState<number>(0);
  const [lastScamAmount, setLastScamAmount] = useState<number>(0);
  const [siteOutcome, setSiteOutcome] = useState<'gain' | 'loss' | null>(null);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  
  // Extraction additions
  const [teamId, setTeamId] = useState<string>('');
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


  // Security assessment - modified to be less accurate and create confusion
  const assessSecurity = useCallback((url: string) => {
    try {
      const u = new URL(url);
      
      // Randomly assign security levels to create confusion
      // This will make it hard for users to differentiate between safe and scam sites
      const randomValue = Math.random();
      
      // Randomly show security levels with a slight bias
      // 40% safe, 40% warning, 20% danger - regardless of actual site safety
      if (randomValue < 0.4) {
        setSecurityLevel('safe');
        setPhishWarning(null);
      } else if (randomValue < 0.8) {
        setSecurityLevel('warning');
        setPhishWarning(`This site may require verification: ${u.hostname}`);
      } else {
        setSecurityLevel('danger');
        setPhishWarning(`Connection not secure: ${u.hostname}`);
        // Only show notification for randomly selected sites
        if (Math.random() > 0.5) {
          addNotification({ 
            type: 'warning', 
            message: `⚠️ Connection issue with ${u.hostname}`, 
            duration: 3000 
          });
        }
      }
      
      // Randomly add security events to further confuse users
      if (Math.random() > 0.7) {
        const outcomes = ['neutral', 'gain', 'loss'];
        const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)] as 'gain'|'loss'|'neutral';
        
        const evt: ExtractorEvent = { 
          id: Math.random().toString(36).slice(2), 
          type: 'security-check', 
          outcome: randomOutcome, 
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
  const checkRewardSite = useCallback(async (url: string): Promise<boolean> => {
    if (!teamId) {
      addNotification({ type: 'warning', message: 'No team detected yet. Please wait and try again.' });
      return false;
    }
    
    const rewardSite = sites.find(site => site.url === url && site.isRewardSite);
    if (!rewardSite) {
      addNotification({ type: 'warning', message: 'This site has no active reward.' });
      return false;
    }


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

        // Update site outcome state
        setSiteOutcome(result.fake ? 'loss' : 'gain');
        if (result.fake) {
          setLastScamAmount(result.stolen || rewardSite.fakeTargetAmount || 0);
        } else {
          setLastRewardAmount(rewardSite.rewardAmount || result.reward || 0);
  }

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
        return false;
      } else if (result.alreadyClaimed) {
        addNotification({
          type: 'warning',
          message: `💰 This reward site has already been claimed by team ${result.claimedBy}`,
          duration: 4000
        });
        return false;
      } else {
        // Handle any other unsuccessful responses
        addNotification({
          type: 'warning',
          message: result.message || 'Unable to claim reward at this time',
          duration: 4000
        });
        return false;
      }
      return true;
    } catch (error) {
      logger.error('Failed to claim reward site:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      addNotification({
        type: 'error',
        message: 'Failed to claim reward site'
      });
      return false;
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
    setSiteOutcome(null); // Reset site outcome when navigating
    setLastRewardAmount(0);
    setLastScamAmount(0);
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
              setTeamId(teamData.teamId);
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
            setTeamId(pick.teamId);
          }
        }
      } catch (error) {
        logger.error('🎯 Safari team detection error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    }
    load();
    const id = setInterval(load, 20000);
    return ()=>{ cancelled = true; clearInterval(id); };
  }, [teamId]);

  // Socket connect for extractor events
  useEffect(()=>{
    if (!teamId || socket) return;
  const base = (process.env.NEXT_PUBLIC_SOCKET_URL || '').trim() || (typeof window !== 'undefined' ? window.location.origin : '/');
  const s = rawIo(base, { path: '/api/socketio', transports:['websocket'], timeout: 20000 });
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
      <div className="flex bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0a0a0a] border-t border-gray-600 h-16 fixed left-0 right-0 bottom-[clamp(74px,12vw,92px)] z-50 shadow-2xl" style={{ pointerEvents: 'auto' }}>
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

  // Top bar shown while viewing a site (address + security indicator + basic controls)
  const TopBar = () => {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#213141] to-[#12202a] border-b border-gray-700 px-3 py-2">
        <div className="max-w-screen-lg mx-auto flex items-center space-x-3">
          <button onClick={goBack} disabled={!canGoBack} className={`p-2 rounded ${!canGoBack ? 'opacity-40' : 'hover:bg-white/5'}`} aria-label="Back">◀</button>
          <button onClick={goForward} disabled={!canGoForward} className={`p-2 rounded ${!canGoForward ? 'opacity-40' : 'hover:bg-white/5'}`} aria-label="Forward">▶</button>
          <div className="flex-1 rounded bg-white/10 px-3 py-1 flex items-center space-x-2 text-sm">
            <div className="truncate text-white/90" title={address}>{address}</div>
            <div className="ml-2"><SecurityIndicator /></div>
          </div>
          <button onClick={() => { setShowHomePage(true); goHome(); }} className="p-2 rounded hover:bg-white/5 text-white" aria-label="Home">🏠</button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] via-[#0f0f0f] to-black">
      {!showHomePage && <TopBar />}
      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-black px-3 py-1 rounded shadow">You are offline</div>
      )}
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
                color: currentSite.textColor || '#000000',
                paddingTop: '64px',
                paddingBottom: '220px'
              }}
            >
              {/* Keep tabTitle and addressInput referenced to avoid unused variable warnings */}
              <span className="sr-only" aria-hidden>{tabTitle}</span>
              <span className="sr-only" aria-hidden>{addressInput}</span>
              {/* Custom content based on site type and outcome */}
              {currentSite.category === 'fake' && siteOutcome === 'loss' ? (
                <div className="min-h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-red-100 border-2 border-red-300 rounded-lg p-6 max-w-md w-full">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-red-800 mb-4">Suspicious Activity Detected!</h1>
                    <p className="text-red-700 mb-4">
                      This website has been flagged as potentially harmful. Your security system has detected and blocked suspicious activity.
                    </p>
                    <div className="bg-red-200 rounded p-3 mb-4">
                      <p className="text-red-800 font-semibold">
                        Amount Lost: <span className="text-xl font-bold">{lastScamAmount || 0.5} BTC</span>
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        Funds have been deducted from your wallet as a security measure.
                      </p>
                    </div>
                    <p className="text-sm text-red-600">
                      Please be cautious when visiting unknown websites.
                    </p>
                  </div>
                </div>
              ) : currentSite.isRewardSite && siteOutcome === 'gain' ? (
                <div className="min-h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-6 max-w-md w-full">
                    <div className="text-6xl mb-4">🎉</div>
                    <h1 className="text-2xl font-bold text-green-800 mb-4">Reward Claimed!</h1>
                    <p className="text-green-700 mb-4">
                      Congratulations! You&apos;ve successfully claimed a reward from this website.
                    </p>
                    <div className="bg-green-200 rounded p-3 mb-4">
                      <p className="text-green-800 font-semibold">
                        Amount Received: <span className="text-xl font-bold">{lastRewardAmount || currentSite.rewardAmount || 0.25} BTC</span>
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        The reward has been added to your wallet balance.
                      </p>
                    </div>
                    <p className="text-sm text-green-600">
                      Keep exploring to find more reward opportunities!
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Show original site content */}
                  <div
                    dangerouslySetInnerHTML={{ __html: InputSanitizer.sanitizeHtml(currentSite.content) }}
                  />

                  {/* Add clickable button for reward/scam sites */}
                  {(currentSite.isRewardSite || currentSite.category === 'fake') && (
                    <div className="fixed left-4 right-4" style={{ bottom: 'calc(clamp(74px,12vw,92px) + 86px)', zIndex: 60 }}>
                      <button
                        onClick={async () => {
                          if (currentSite.isRewardSite) {
                            const ok = await checkRewardSite(currentSite.url);
                            if (ok) {
                              setTimeout(() => {
                                setShowHomePage(true);
                                setAddress("https://www.redmondpie.com/");
                                setAddressInput("Home");
                                setCurrentPage(1);
                              }, 1500);
                            }
                          } else if (currentSite.category === 'fake') {
                            setSiteOutcome('loss');
                            setLastScamAmount(0.5);
                            addNotification({
                              type: 'warning',
                              message: `⚠️ Suspicious activity detected on site "${currentSite.title}" (0.5 BTC stolen)`,
                              duration: 4000
                            });
                          }
                        }}
                        className={`w-full py-3 px-6 rounded-lg font-bold text-white text-lg shadow-lg transition-all duration-200 ${
                          currentSite.isRewardSite
                            ? 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                            : 'bg-red-500 hover:bg-red-600 active:bg-red-700'
                        }`}
                        style={{
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          border: '2px solid rgba(255,255,255,0.3)'
                        }}
                      >
                        {currentSite.isRewardSite ? '🎁 CLAIM REWARD' : '⚠️ ACCESS SITE'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
