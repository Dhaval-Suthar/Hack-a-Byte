"use client";

import React, { useState, useRef, useEffect } from "react";

interface SafariAppProps {
  onClose: () => void;
  time: Date;
}

interface Bookmark {
  name: string;
  url: string;
  icon: string;
}

interface HistoryItem {
  title: string;
  url: string;
  timestamp: Date;
}

interface Tab {
  id: string;
  title: string;
  url: string;
  isLoading: boolean;
}

const SafariApp: React.FC<SafariAppProps> = ({ onClose, time }) => {
  const [currentUrl, setCurrentUrl] = useState("https://www.apple.com");
  const [inputUrl, setInputUrl] = useState("https://www.apple.com");
  const [isLoading, setIsLoading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Apple", url: "https://www.apple.com", isLoading: false }
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const bookmarks: Bookmark[] = [
    { name: "Apple", url: "https://www.apple.com", icon: "🍎" },
    { name: "iPhone", url: "https://www.apple.com/iphone", icon: "�" },
    { name: "GitHub", url: "https://github.com", icon: "�" },
    { name: "Google", url: "https://www.google.com", icon: "🔍" },
    { name: "YouTube", url: "https://www.youtube.com", icon: "📺" },
    { name: "Facebook", url: "https://www.facebook.com", icon: "�" },
    { name: "Twitter", url: "https://twitter.com", icon: "�" },
    { name: "Wikipedia", url: "https://www.wikipedia.org", icon: "📖" },
    { name: "ESPN", url: "https://www.espn.com", icon: "⚽" },
    { name: "CNN", url: "https://www.cnn.com", icon: "📰" },
  ];

  const history: HistoryItem[] = [
    { title: "Apple", url: "https://www.apple.com", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { title: "iPhone - Apple", url: "https://www.apple.com/iphone", timestamp: new Date(Date.now() - 1000 * 60 * 15) },
    { title: "Google", url: "https://www.google.com", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { title: "YouTube", url: "https://www.youtube.com", timestamp: new Date(Date.now() - 1000 * 60 * 45) },
    { title: "Facebook", url: "https://www.facebook.com", timestamp: new Date(Date.now() - 1000 * 60 * 60) },
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatHistoryTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const getDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const handleUrlSubmit = () => {
    let url = inputUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        url = 'https://' + url;
      } else {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
      }
    }
    
    setIsLoading(true);
    setCurrentUrl(url);
    
    // Get appropriate title for the URL
    let title = getDisplayUrl(url);
    if (url.includes('apple.com/iphone')) {
      title = "iPhone - Apple";
    } else if (url.includes('apple.com')) {
      title = "Apple";
    } else if (url.includes('google.com')) {
      title = "Google";
    } else if (url.includes('facebook.com')) {
      title = "Facebook";
    } else if (url.includes('youtube.com')) {
      title = "YouTube";
    }
    
    // Update current tab
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, url, title, isLoading: true }
        : tab
    ));
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, isLoading: false }
          : tab
      ));
      setCanGoBack(true);
    }, 1500);
  };

  const handleBookmarkClick = (bookmark: Bookmark) => {
    setInputUrl(bookmark.url);
    setCurrentUrl(bookmark.url);
    setShowBookmarks(false);
    
    // Update current tab with bookmark info
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, url: bookmark.url, title: bookmark.name, isLoading: true }
        : tab
    ));
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, isLoading: false }
          : tab
      ));
      setCanGoBack(true);
    }, 1200);
  };

  const handleHistoryClick = (item: HistoryItem) => {
    setInputUrl(item.url);
    setCurrentUrl(item.url);
    setShowHistory(false);
    
    // Update current tab with history info
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, url: item.url, title: item.title, isLoading: true }
        : tab
    ));
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, isLoading: false }
          : tab
      ));
      setCanGoBack(true);
    }, 1200);
  };

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "Apple",
      url: "https://www.apple.com",
      isLoading: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setCurrentUrl(newTab.url);
    setInputUrl(newTab.url);
    setShowTabs(false);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close the last tab
    
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId);
      if (tabId === activeTabId && newTabs.length > 0) {
        setActiveTabId(newTabs[0].id);
        setCurrentUrl(newTabs[0].url);
        setInputUrl(newTabs[0].url);
      }
      return newTabs;
    });
  };

  const switchTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabId(tabId);
      setCurrentUrl(tab.url);
      setInputUrl(tab.url);
      setShowTabs(false);
    }
  };

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  const renderStatusBar = () => (
    <div className="flex justify-between items-center px-4 pt-8 pb-2 text-white text-xs relative z-10">
      <div className="flex items-center space-x-2">
        <div className="flex items-end space-x-[2px]">
          <div className="w-[3px] h-[6px] bg-white rounded-[1px]" />
          <div className="w-[3px] h-[8px] bg-white rounded-[1px]" />
          <div className="w-[3px] h-[10px] bg-white rounded-[1px]" />
          <div className="w-[3px] h-[8px] bg-white/60 rounded-[1px]" />
          <div className="w-[3px] h-[6px] bg-white/40 rounded-[1px]" />
        </div>
        <span className="opacity-90">AT&T</span>
        <span className="opacity-90">3G</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="opacity-90">{formatTime(time)}</span>
        <div className="w-7 h-[14px] border border-white/70 rounded-[2px] relative">
          <div className="absolute inset-[2px] w-[16px] bg-green-500 rounded-[1px]" />
          <div className="w-[3px] h-[6px] bg-white/70 rounded-sm absolute -right-[5px] top-[4px]" />
        </div>
      </div>
    </div>
  );

  const renderMainView = () => (
    <div className="flex-1 bg-white flex flex-col">
      {/* Navigation Bar - More iPhone 4 accurate */}
      <div className="bg-gradient-to-b from-[#dcdcdc] via-[#d1d1d1] to-[#c7c7c7] border-b border-[#999] px-3 py-2 shadow-sm">
        <div className="flex items-center space-x-3">
          {/* Back/Forward buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => setCanGoBack(false)}
              disabled={!canGoBack}
              className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-lg ${
                canGoBack 
                  ? 'bg-gradient-to-b from-white via-[#f5f5f5] to-[#e8e8e8] border border-[#999] text-[#1a73e8] shadow-sm active:bg-gradient-to-b active:from-[#e8e8e8] active:to-[#d0d0d0]' 
                  : 'text-[#999] bg-transparent'
              }`}
            >
              ◀
            </button>
            <button
              onClick={() => setCanGoForward(false)}
              disabled={!canGoForward}
              className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-lg ${
                canGoForward 
                  ? 'bg-gradient-to-b from-white via-[#f5f5f5] to-[#e8e8e8] border border-[#999] text-[#1a73e8] shadow-sm active:bg-gradient-to-b active:from-[#e8e8e8] active:to-[#d0d0d0]' 
                  : 'text-[#999] bg-transparent'
              }`}
            >
              ▶
            </button>
          </div>

          {/* URL Bar */}
          <div className="flex-1 relative">
            <div className="relative bg-white rounded-lg border border-[#999] shadow-inner">
              <input
                ref={inputRef}
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                className="w-full h-8 px-3 pr-8 rounded-lg bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none"
                placeholder="Search or enter website name"
              />
              {isLoading ? (
                <div className="absolute right-3 top-2 w-4 h-4">
                  <div className="w-4 h-4 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <button
                  onClick={handleUrlSubmit}
                  className="absolute right-2 top-1 w-6 h-6 bg-gradient-to-b from-[#4d90fe] to-[#1a73e8] rounded text-white text-xs flex items-center justify-center shadow-sm"
                >
                  →
                </button>
              )}
            </div>
          </div>

          {/* Bookmarks button */}
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="w-8 h-8 rounded-md bg-gradient-to-b from-white via-[#f5f5f5] to-[#e8e8e8] border border-[#999] flex items-center justify-center text-[#1a73e8] shadow-sm active:bg-gradient-to-b active:from-[#e8e8e8] active:to-[#d0d0d0]"
          >
            �
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        {showBookmarks ? (
          <div className="absolute inset-0 bg-white z-10">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Bookmarks</h2>
              <div className="space-y-1">
                {bookmarks.map((bookmark, index) => (
                  <button
                    key={index}
                    onClick={() => handleBookmarkClick(bookmark)}
                    className="w-full flex items-center p-3 border-b border-gray-200 active:bg-blue-50"
                  >
                    <span className="text-xl mr-3">{bookmark.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800">{bookmark.name}</div>
                      <div className="text-sm text-blue-600">{getDisplayUrl(bookmark.url)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : showHistory ? (
          <div className="absolute inset-0 bg-white z-10">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">History</h2>
              <div className="space-y-1">
                {history.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full flex items-center p-3 border-b border-gray-200 active:bg-blue-50"
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800">{item.title}</div>
                      <div className="text-sm text-blue-600">{getDisplayUrl(item.url)}</div>
                      <div className="text-xs text-gray-400">{formatHistoryTime(item.timestamp)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : showTabs ? (
          <div className="absolute inset-0 bg-gray-100 z-10">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Pages ({tabs.length})</h2>
                <button
                  onClick={addNewTab}
                  className="w-8 h-8 bg-gradient-to-b from-[#4d90fe] to-[#1a73e8] rounded text-white text-lg flex items-center justify-center shadow-sm"
                >
                  +
                </button>
              </div>
              <div className="space-y-3">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`relative bg-white rounded-lg shadow-md border-2 ${
                      tab.id === activeTabId ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => switchTab(tab.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="font-medium text-gray-800 truncate">{tab.title}</div>
                      <div className="text-sm text-blue-600 truncate">{getDisplayUrl(tab.url)}</div>
                    </button>
                    {tabs.length > 1 && (
                      <button
                        onClick={() => closeTab(tab.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center shadow-sm"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Web content simulation
          <div className="p-4 text-center bg-white">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-[#1a73e8] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-6 py-8">
                
                {/* Simulated content based on URL */}
                {currentUrl.includes('apple.com') && !currentUrl.includes('iphone') && (
                  <div className="text-left">
                    {/* Apple homepage simulation */}
                    <div className="bg-black text-white text-center py-8 rounded-lg mb-6">
                      <div className="text-4xl mb-4">�</div>
                      <h1 className="text-2xl font-bold mb-2">Apple</h1>
                      <p className="text-lg">Think Different.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <button 
                        onClick={() => {
                          setInputUrl("https://www.apple.com/iphone");
                          setCurrentUrl("https://www.apple.com/iphone");
                        }}
                        className="bg-gray-100 p-4 rounded-lg text-center hover:bg-gray-200"
                      >
                        <div className="text-2xl mb-2">📱</div>
                        <div className="font-medium">iPhone</div>
                      </button>
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <div className="text-2xl mb-2">💻</div>
                        <div className="font-medium">Mac</div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <div className="text-2xl mb-2">📱</div>
                        <div className="font-medium">iPad</div>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg text-center">
                        <div className="text-2xl mb-2">⌚</div>
                        <div className="font-medium">Watch</div>
                      </div>
                    </div>
                  </div>
                )}

                {currentUrl.includes('apple.com/iphone') && (
                  <div className="text-left">
                    {/* iPhone page simulation */}
                    <div className="bg-gradient-to-b from-blue-500 to-blue-700 text-white text-center py-8 rounded-lg mb-6">
                      <div className="text-4xl mb-4">📱</div>
                      <h1 className="text-2xl font-bold mb-2">iPhone 4</h1>
                      <p className="text-lg">This changes everything. Again.</p>
                    </div>
                    
                    <div className="space-y-4 text-sm">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Features</h3>
                        <ul className="space-y-1 text-gray-600">
                          <li>• Retina Display</li>
                          <li>• FaceTime Video Calling</li>
                          <li>• 5MP Camera with LED Flash</li>
                          <li>• 1080p HD Video Recording</li>
                          <li>• iOS 4</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentUrl.includes('google.com') && (
                  <div className="text-left">
                    <div className="text-center mb-8">
                      <div className="text-6xl mb-4">G🔍🔴🟡🔵</div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search Google or type URL"
                          className="w-full px-4 py-3 border border-gray-300 rounded-full text-center focus:outline-none focus:border-blue-500"
                        />
                        <button className="absolute right-3 top-3 text-blue-500">🔍</button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                        <div className="text-blue-600 font-medium">Apple - Official Site</div>
                        <div className="text-green-600 text-xs">www.apple.com</div>
                        <div className="text-gray-600 text-xs">Discover the innovative world of Apple and shop everything iPhone, iPad, Apple Watch, Mac, and Apple TV...</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                        <div className="text-blue-600 font-medium">YouTube</div>
                        <div className="text-green-600 text-xs">www.youtube.com</div>
                        <div className="text-gray-600 text-xs">Enjoy the videos and music you love, upload original content, and share it all...</div>
                      </div>
                    </div>
                  </div>
                )}

                {currentUrl.includes('facebook.com') && (
                  <div className="text-left">
                    <div className="bg-blue-600 text-white text-center py-6 rounded-lg mb-6">
                      <div className="text-4xl mb-2">📘</div>
                      <h1 className="text-xl font-bold">facebook</h1>
                      <p className="text-sm">Connect with friends and the world around you on Facebook.</p>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="font-medium text-gray-800">John Doe</div>
                        <div className="text-gray-600 text-xs">2 hours ago</div>
                        <p className="text-gray-700 mt-2">Just got the new iPhone 4! The camera quality is amazing 📱📸</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                        <div className="font-medium text-gray-800">Jane Smith</div>
                        <div className="text-gray-600 text-xs">4 hours ago</div>
                        <p className="text-gray-700 mt-2">Beautiful sunset today! 🌅</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentUrl.includes('youtube.com') && (
                  <div className="text-left">
                    <div className="bg-red-600 text-white text-center py-6 rounded-lg mb-6">
                      <div className="text-4xl mb-2">📺</div>
                      <h1 className="text-xl font-bold">YouTube</h1>
                      <p className="text-sm">Broadcast Yourself</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="bg-gray-300 h-24 rounded mb-2 flex items-center justify-center">
                          <span className="text-2xl">▶️</span>
                        </div>
                        <div className="font-medium text-sm">iPhone 4 Official Commercial</div>
                        <div className="text-gray-600 text-xs">Apple • 2.1M views</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="bg-gray-300 h-24 rounded mb-2 flex items-center justify-center">
                          <span className="text-2xl">▶️</span>
                        </div>
                        <div className="font-medium text-sm">iOS 4 Features Overview</div>
                        <div className="text-gray-600 text-xs">TechReview • 856K views</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Default content for unrecognized URLs */}
                {!currentUrl.includes('apple.com') && !currentUrl.includes('google.com') && !currentUrl.includes('facebook.com') && !currentUrl.includes('youtube.com') && (
                  <div className="space-y-6 py-8">
                    <div className="text-4xl mb-4">🌐</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                      {activeTab?.title || "Safari"}
                    </h1>
                    <p className="text-gray-600 mb-6">
                      Currently viewing: {getDisplayUrl(currentUrl)}
                    </p>
                    <div className="space-y-4 text-sm text-gray-500">
                      <p>This is Safari for iPhone 4.</p>
                      <p>Use the address bar to navigate to different sites.</p>
                      <p>Access bookmarks and history using the navigation buttons.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen bg-white flex flex-col">
      {renderStatusBar()}
      
      {/* Safari Header - iPhone 4 Style */}
      <div className="bg-gradient-to-b from-[#dcdcdc] via-[#d1d1d1] to-[#c7c7c7] border-b border-[#999] px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-[#1a73e8] font-medium text-base px-2 py-1 active:opacity-50"
          >
            Done
          </button>
          <h1 className="text-lg font-bold text-gray-800 tracking-tight">Safari</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setShowBookmarks(false);
                setShowTabs(false);
              }}
              className="text-[#1a73e8] text-base px-2 py-1 active:opacity-50"
            >
              History
            </button>
            <button
              onClick={() => {
                setShowTabs(!showTabs);
                setShowBookmarks(false);
                setShowHistory(false);
              }}
              className="text-[#1a73e8] text-base px-2 py-1 active:opacity-50"
            >
              Pages
            </button>
          </div>
        </div>
      </div>

      {renderMainView()}

      {/* Bottom Toolbar - iPhone 4 Style */}
      <div className="bg-gradient-to-b from-[#dcdcdc] via-[#d1d1d1] to-[#c7c7c7] border-t border-[#999] px-4 py-3 shadow-sm">
        <div className="flex items-center justify-around">
          <button
            onClick={() => {
              setShowBookmarks(!showBookmarks);
              setShowHistory(false);
              setShowTabs(false);
            }}
            className="flex flex-col items-center space-y-1 active:opacity-50"
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <span className="text-[#1a73e8] text-lg">�</span>
            </div>
            <span className="text-xs text-gray-700 font-medium">Bookmarks</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex flex-col items-center space-y-1 active:opacity-50"
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <span className="text-[#1a73e8] text-lg">🔄</span>
            </div>
            <span className="text-xs text-gray-700 font-medium">Refresh</span>
          </button>
          <button
            onClick={addNewTab}
            className="flex flex-col items-center space-y-1 active:opacity-50"
          >
            <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-b from-white via-[#f5f5f5] to-[#e8e8e8] border border-[#999] rounded shadow-sm">
              <span className="text-[#1a73e8] text-base font-bold">+</span>
            </div>
            <span className="text-xs text-gray-700 font-medium">New Page</span>
          </button>
          <button
            onClick={() => {
              // Simulate share functionality
              if (navigator.share) {
                navigator.share({
                  title: activeTab?.title || 'Safari',
                  url: currentUrl
                });
              }
            }}
            className="flex flex-col items-center space-y-1 active:opacity-50"
          >
            <div className="w-7 h-7 flex items-center justify-center">
              <span className="text-[#1a73e8] text-lg">↗️</span>
            </div>
            <span className="text-xs text-gray-700 font-medium">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafariApp;
