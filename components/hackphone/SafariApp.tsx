"use client";

import React, { useState, useRef } from "react";

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
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com");
  const [inputUrl, setInputUrl] = useState("https://www.google.com");
  const [isLoading, setIsLoading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: "1", title: "Google", url: "https://www.google.com", isLoading: false }
  ]);
  const [activeTabId, setActiveTabId] = useState("1");
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const bookmarks: Bookmark[] = [
    { name: "Apple", url: "https://www.apple.com", icon: "🍎" },
    { name: "GitHub", url: "https://github.com", icon: "🐙" },
    { name: "Stack Overflow", url: "https://stackoverflow.com", icon: "📚" },
    { name: "Reddit", url: "https://www.reddit.com", icon: "🤖" },
    { name: "YouTube", url: "https://www.youtube.com", icon: "📺" },
    { name: "Twitter", url: "https://twitter.com", icon: "🐦" },
    { name: "Facebook", url: "https://www.facebook.com", icon: "📘" },
    { name: "Wikipedia", url: "https://www.wikipedia.org", icon: "📖" },
    { name: "Mozilla", url: "https://www.mozilla.org", icon: "🦊" },
    { name: "W3Schools", url: "https://www.w3schools.com", icon: "🎓" },
  ];

  const history: HistoryItem[] = [
    { title: "Google", url: "https://www.google.com", timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { title: "Apple", url: "https://www.apple.com", timestamp: new Date(Date.now() - 1000 * 60 * 15) },
    { title: "GitHub", url: "https://github.com", timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    { title: "Stack Overflow", url: "https://stackoverflow.com", timestamp: new Date(Date.now() - 1000 * 60 * 45) },
    { title: "YouTube", url: "https://www.youtube.com", timestamp: new Date(Date.now() - 1000 * 60 * 60) },
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
    
    // Update current tab
    setTabs(prev => prev.map(tab => 
      tab.id === activeTabId 
        ? { ...tab, url, title: getDisplayUrl(url), isLoading: true }
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
    handleUrlSubmit();
  };

  const handleHistoryClick = (item: HistoryItem) => {
    setInputUrl(item.url);
    setCurrentUrl(item.url);
    setShowHistory(false);
    handleUrlSubmit();
  };

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: "New Tab",
      url: "https://www.google.com",
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
      {/* Navigation Bar */}
      <div className="bg-gradient-to-b from-gray-200 to-gray-300 border-b border-gray-400 px-3 py-2">
        <div className="flex items-center space-x-3">
          {/* Back/Forward buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => setCanGoBack(false)}
              disabled={!canGoBack}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-blue-500 ${
                canGoBack ? 'bg-white border border-gray-300 active:bg-gray-100' : 'text-gray-400'
              }`}
            >
              ←
            </button>
            <button
              onClick={() => setCanGoForward(false)}
              disabled={!canGoForward}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-blue-500 ${
                canGoForward ? 'bg-white border border-gray-300 active:bg-gray-100' : 'text-gray-400'
              }`}
            >
              →
            </button>
          </div>

          {/* URL Bar */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
              className="w-full h-8 px-3 pr-10 rounded-md border border-gray-300 bg-white text-sm text-gray-800 placeholder-gray-500"
              placeholder="Search or enter website name"
            />
            {isLoading ? (
              <div className="absolute right-3 top-2 w-4 h-4">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <button
                onClick={handleUrlSubmit}
                className="absolute right-2 top-1 w-6 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center"
              >
                →
              </button>
            )}
          </div>

          {/* Bookmarks button */}
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className="w-8 h-8 rounded-md bg-white border border-gray-300 flex items-center justify-center text-blue-500 active:bg-gray-100"
          >
            📚
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative">
        {showBookmarks ? (
          <div className="absolute inset-0 bg-white z-10">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Bookmarks</h2>
              <div className="space-y-2">
                {bookmarks.map((bookmark, index) => (
                  <button
                    key={index}
                    onClick={() => handleBookmarkClick(bookmark)}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-lg active:bg-gray-100"
                  >
                    <span className="text-2xl mr-3">{bookmark.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800">{bookmark.name}</div>
                      <div className="text-sm text-gray-500">{getDisplayUrl(bookmark.url)}</div>
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
              <div className="space-y-2">
                {history.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleHistoryClick(item)}
                    className="w-full flex items-center p-3 border border-gray-200 rounded-lg active:bg-gray-100"
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-800">{item.title}</div>
                      <div className="text-sm text-gray-500">{getDisplayUrl(item.url)}</div>
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
                <h2 className="text-lg font-semibold text-gray-800">Tabs ({tabs.length})</h2>
                <button
                  onClick={addNewTab}
                  className="w-8 h-8 bg-blue-500 rounded text-white text-lg flex items-center justify-center"
                >
                  +
                </button>
              </div>
              <div className="space-y-3">
                {tabs.map((tab) => (
                  <div
                    key={tab.id}
                    className={`relative bg-white rounded-lg border-2 ${
                      tab.id === activeTabId ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <button
                      onClick={() => switchTab(tab.id)}
                      className="w-full p-4 text-left"
                    >
                      <div className="font-medium text-gray-800 truncate">{tab.title}</div>
                      <div className="text-sm text-gray-500 truncate">{getDisplayUrl(tab.url)}</div>
                    </button>
                    {tabs.length > 1 && (
                      <button
                        onClick={() => closeTab(tab.id)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
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
          <div className="p-4 text-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-gray-600">Loading...</p>
              </div>
            ) : (
              <div className="space-y-6 py-8">
                <div className="text-4xl mb-4">🌐</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                  {activeTab?.title || "Safari"}
                </h1>
                <p className="text-gray-600 mb-6">
                  Currently viewing: {getDisplayUrl(currentUrl)}
                </p>
                <div className="space-y-4 text-sm text-gray-500">
                  <p>This is a simulated Safari browser for iOS 4.</p>
                  <p>Use the address bar to &quot;navigate&quot; to different sites.</p>
                  <p>Access bookmarks and history using the buttons above.</p>
                </div>
                
                {/* Simulated content based on URL */}
                {currentUrl.includes('google.com') && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">Google Search</h3>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-white rounded border">
                        <div className="text-blue-600 font-medium">Apple - Official Site</div>
                        <div className="text-green-600">www.apple.com</div>
                        <div className="text-gray-600">Discover the innovative world of Apple...</div>
                      </div>
                      <div className="p-2 bg-white rounded border">
                        <div className="text-blue-600 font-medium">GitHub</div>
                        <div className="text-green-600">github.com</div>
                        <div className="text-gray-600">Build software better, together.</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentUrl.includes('apple.com') && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-2">🍎 Apple</h3>
                    <p className="text-sm text-gray-600">Think Different.</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-white rounded">iPhone</div>
                      <div className="p-2 bg-white rounded">iPad</div>
                      <div className="p-2 bg-white rounded">Mac</div>
                      <div className="p-2 bg-white rounded">Watch</div>
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
    <div className="w-screen h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col">
      {renderStatusBar()}
      
      {/* Safari Header */}
      <div className="bg-gradient-to-b from-gray-300 to-gray-400 border-b border-gray-500 px-4 py-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-blue-600 font-medium text-sm px-2 py-1"
          >
            Done
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Safari</h1>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowHistory(!showHistory);
                setShowBookmarks(false);
                setShowTabs(false);
              }}
              className="text-blue-600 text-sm px-2 py-1"
            >
              History
            </button>
            <button
              onClick={() => {
                setShowTabs(!showTabs);
                setShowBookmarks(false);
                setShowHistory(false);
              }}
              className="text-blue-600 text-sm px-2 py-1"
            >
              Tabs
            </button>
          </div>
        </div>
      </div>

      {renderMainView()}

      {/* Bottom Toolbar */}
      <div className="bg-gradient-to-b from-gray-300 to-gray-400 border-t border-gray-500 px-4 py-2">
        <div className="flex items-center justify-around">
          <button
            onClick={() => {
              setShowBookmarks(!showBookmarks);
              setShowHistory(false);
              setShowTabs(false);
            }}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-blue-600 text-lg">📚</span>
            <span className="text-xs text-gray-700">Bookmarks</span>
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-blue-600 text-lg">🔄</span>
            <span className="text-xs text-gray-700">Refresh</span>
          </button>
          <button
            onClick={addNewTab}
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-blue-600 text-lg">+</span>
            <span className="text-xs text-gray-700">New Tab</span>
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
            className="flex flex-col items-center space-y-1"
          >
            <span className="text-blue-600 text-lg">📤</span>
            <span className="text-xs text-gray-700">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SafariApp;
