"use client";

import Image from "next/image";
import React, { Dispatch, SetStateAction, useState, useEffect, useCallback } from "react";
import { logger } from '@/lib/logger';

interface Bookmark {
  title: string;
  url: string;
}

interface HistoryItem {
  url: string;
  title: string;
  visitedAt: Date;
}

interface InternetExplorerProps {
  link: string;
  setLink?: Dispatch<SetStateAction<string>>;
  onClose: () => void;
}

const InternetExplorer: React.FC<InternetExplorerProps> = ({ link, setLink, onClose }) => {
  const [currentURL, setCurrentURL] = useState(link);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showAddBookmark, setShowAddBookmark] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [loadingStatus, setLoadingStatus] = useState("Done");
  const [browserHistory, setBrowserHistory] = useState<HistoryItem[]>([]);
  const [historyStack, setHistoryStack] = useState<string[]>([link]); // History stack for back/forward
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showEditMenu, setShowEditMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  
  // Load user-specific bookmarks and history from storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { UserPreferences } = await import('../hooks/useUserPreferences');
        const savedBookmarks = UserPreferences.getAppData('ie_bookmarks', []) as Bookmark[];
        const savedHistory = UserPreferences.getAppData('ie_history', []) as HistoryItem[];
        setBookmarks(savedBookmarks);
        setBrowserHistory(savedHistory);
      } catch (error) {
        logger.error('Error loading Internet Explorer data:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    };
    
    loadUserData();
  }, []);
  
  // Save bookmarks to user-specific storage
  const saveBookmarks = (updatedBookmarks: Bookmark[]) => {
    import('../hooks/useUserPreferences').then(({ UserPreferences }) => {
      UserPreferences.setAppData('ie_bookmarks', updatedBookmarks);
    });
  };
  
  // Save history to user-specific storage
  const saveHistory = (updatedHistory: HistoryItem[]) => {
    import('../hooks/useUserPreferences').then(({ UserPreferences }) => {
      UserPreferences.setAppData('ie_history', updatedHistory);
    });
  };
  
  // Add a new history entry
  const addHistoryEntry = useCallback((url: string) => {
    const newEntry: HistoryItem = {
      url,
      title: pageTitle || url,
      visitedAt: new Date()
    };
    
    const updatedHistory = [newEntry, ...browserHistory].slice(0, 100); // Limit to 100 entries
    setBrowserHistory(updatedHistory);
    saveHistory(updatedHistory);
  }, [browserHistory, pageTitle]);
  
  // Add a new bookmark
  const addBookmark = () => {
    if (currentURL) {
      const title = newBookmarkTitle.trim() || pageTitle || `Page ${bookmarks.length + 1}`;
      const newBookmark: Bookmark = {
        title,
        url: currentURL
      };
      
      const updatedBookmarks = [...bookmarks, newBookmark];
      setBookmarks(updatedBookmarks);
      saveBookmarks(updatedBookmarks);
      
      // Reset form
      setShowAddBookmark(false);
      setNewBookmarkTitle("");
    }
  };
  
  // Navigate to a bookmark URL
  const goToBookmark = (url: string) => {
    navigateTo(url);
    setShowBookmarks(false);
  };
  
  // Navigate to a history item
  const goToHistory = (url: string) => {
    navigateTo(url);
    setShowHistory(false);
  };
  
  // Go back in history
  const goBack = () => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      const prevUrl = historyStack[newIndex];
      setCurrentURL(prevUrl);
      if (setLink) setLink(prevUrl);
      setLoadingStatus("Navigating to " + prevUrl);
      setTimeout(() => setLoadingStatus("Done"), 1000);
    }
  };
  
  // Go forward in history
  const goForward = () => {
    if (currentHistoryIndex < historyStack.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      const nextUrl = historyStack[newIndex];
      setCurrentURL(nextUrl);
      if (setLink) setLink(nextUrl);
      setLoadingStatus("Navigating to " + nextUrl);
      setTimeout(() => setLoadingStatus("Done"), 1000);
    }
  };
  
  // Navigate to URL and update history
  const navigateTo = (url: string) => {
    // Add to browser history
    addHistoryEntry(url);
    
    // Update history stack - remove any forward history
    const newStack = [
      ...historyStack.slice(0, currentHistoryIndex + 1),
      url
    ];
    setHistoryStack(newStack);
    setCurrentHistoryIndex(newStack.length - 1);
    
    // Update current URL
    setCurrentURL(url);
    if (setLink) setLink(url);
    
    // Show loading status
    setLoadingStatus("Connecting to " + url);
    setTimeout(() => setLoadingStatus("Loading " + url), 500);
    setTimeout(() => setLoadingStatus("Done"), 1000);
  };
  
  // Handle URL input change
  const handleURLChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentURL(e.target.value);
  };
  
  // Handle URL form submission
  const navigateToURL = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentURL) {
      navigateTo(currentURL);
    }
  };
  
  // Stop loading
  const stopLoading = () => {
    setLoadingStatus("Stopped");
  };
  
  // Refresh current page
  const refreshPage = () => {
    setLoadingStatus("Refreshing " + currentURL);
    setTimeout(() => {
      if (setLink) {
        // Force refresh by setting to empty and then back
        setLink("");
        setTimeout(() => {
          setLink(currentURL);
          setLoadingStatus("Done");
        }, 100);
      } else {
        setLoadingStatus("Done");
      }
    }, 500);
  };
  
  // Close all menus
  const closeAllMenus = () => {
    setShowFileMenu(false);
    setShowEditMenu(false);
    setShowViewMenu(false);
    setShowToolsMenu(false);
    setShowBookmarks(false);
    setShowHistory(false);
  };
  
  // Format date for history display
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#c0c0c0]">
      {/* Menu Bar */}
      <div className="w-full flex text-sm items-center bg-[#c0c0c0] border-b border-b-[#808080] p-0.5">
        <div 
          className={`px-2 py-0.5 cursor-pointer ${showFileMenu ? 'bg-[#000080] text-white' : ''}`}
          onClick={() => {
            setShowFileMenu(!showFileMenu);
            setShowEditMenu(false);
            setShowViewMenu(false);
            setShowToolsMenu(false);
          }}
        >
          File
        </div>
        <div 
          className={`px-2 py-0.5 cursor-pointer ${showEditMenu ? 'bg-[#000080] text-white' : ''}`}
          onClick={() => {
            setShowEditMenu(!showEditMenu);
            setShowFileMenu(false);
            setShowViewMenu(false);
            setShowToolsMenu(false);
          }}
        >
          Edit
        </div>
        <div 
          className={`px-2 py-0.5 cursor-pointer ${showViewMenu ? 'bg-[#000080] text-white' : ''}`}
          onClick={() => {
            setShowViewMenu(!showViewMenu);
            setShowFileMenu(false);
            setShowEditMenu(false);
            setShowToolsMenu(false);
          }}
        >
          View
        </div>
        <div 
          className={`px-2 py-0.5 cursor-pointer ${showToolsMenu ? 'bg-[#000080] text-white' : ''}`}
          onClick={() => {
            setShowToolsMenu(!showToolsMenu);
            setShowFileMenu(false);
            setShowEditMenu(false);
            setShowViewMenu(false);
          }}
        >
          Tools
        </div>
      </div>
      
      {/* File Menu Dropdown */}
      {showFileMenu && (
        <div className="absolute mt-6 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-50 shadow-md">
          <div className="px-4 py-1 hover:bg-[#000080] hover:text-white" onClick={() => {
            setShowAddBookmark(true);
            closeAllMenus();
          }}>
            Add to Favorites...
          </div>
          <div className="h-px bg-gray-500 my-1"></div>
          <div className="px-4 py-1 hover:bg-[#000080] hover:text-white" onClick={() => {
            onClose();
            closeAllMenus();
          }}>
            Close
          </div>
        </div>
      )}

      {/* View Menu Dropdown */}
      {showViewMenu && (
        <div className="absolute mt-6 ml-16 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] z-50 shadow-md">
          <div className="px-4 py-1 hover:bg-[#000080] hover:text-white" onClick={() => {
            refreshPage();
            closeAllMenus();
          }}>
            Refresh
          </div>
          <div className="px-4 py-1 hover:bg-[#000080] hover:text-white" onClick={() => {
            stopLoading();
            closeAllMenus();
          }}>
            Stop
          </div>
          <div className="h-px bg-gray-500 my-1"></div>
          <div className="px-4 py-1 hover:bg-[#000080] hover:text-white" onClick={() => {
            setShowHistory(!showHistory);
            setShowFileMenu(false);
            setShowEditMenu(false);
            setShowViewMenu(false);
            setShowToolsMenu(false);
          }}>
            History
          </div>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="w-full flex items-center bg-[#c0c0c0] border-b border-b-[#808080] p-1">
        <button 
          className={`flex items-center mx-1 px-2 py-1 border-2 ${
            currentHistoryIndex > 0 
              ? 'border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]' 
              : 'border-[#c0c0c0] opacity-50'
          }`}
          onClick={goBack}
          disabled={currentHistoryIndex === 0}
        >
          <Image 
            src="/hackbook-W95/app-icon/back.png" 
            alt="Back" 
            width={16} 
            height={16} 
            className="mr-1" 
          />
          <span className="text-xs">Back</span>
        </button>
        
        <button 
          className={`flex items-center mx-1 px-2 py-1 border-2 ${
            currentHistoryIndex < historyStack.length - 1 
              ? 'border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]' 
              : 'border-[#c0c0c0] opacity-50'
          }`}
          onClick={goForward}
          disabled={currentHistoryIndex >= historyStack.length - 1}
        >
          <Image 
            src="/hackbook-W95/app-icon/forward.png" 
            alt="Forward" 
            width={16} 
            height={16} 
            className="mr-1" 
          />
          <span className="text-xs">Forward</span>
        </button>
        
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={stopLoading}
        >
          <Image 
            src="/hackbook-W95/app-icon/stop.png" 
            alt="Stop" 
            width={16} 
            height={16} 
            className="mr-1" 
          />
          <span className="text-xs">Stop</span>
        </button>
        
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={refreshPage}
        >
          <Image 
            src="/hackbook-W95/app-icon/refresh.png" 
            alt="Refresh" 
            width={16} 
            height={16} 
            className="mr-1" 
          />
          <span className="text-xs">Refresh</span>
        </button>
        
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={() => {
            navigateTo('https://en.m.wikipedia.org/wiki/Main_Page');
          }}
        >
          <Image 
            src="/hackbook-W95/app-icon/home.png" 
            alt="Home" 
            width={16} 
            height={16} 
            className="mr-1" 
          />
          <span className="text-xs">Home</span>
        </button>
        
        <div className="w-px h-6 bg-[#808080] mx-2"></div>
        
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={() => {
            navigateTo('https://en.wikipedia.org/wiki/Special:Search?search=YOUR_QUERY' + encodeURIComponent(currentURL));
          }}
        >
          <Image 
            src="/hackbook-W95/app-icon/search.png" 
            alt="Search" 
            width={16} 
            height={16} 
            className="mr-1" 
          />
          <span className="text-xs">Search</span>
        </button>
        
        <div className="relative">
          <button 
            className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            onClick={() => {
              setShowBookmarks(!showBookmarks);
              setShowHistory(false);
            }}
          >
            <Image 
              src="/hackbook-W95/app-icon/favorites.png" 
              alt="Favorites" 
              width={16} 
              height={16} 
              className="mr-1" 
            />
            <span className="text-xs">Favorites</span>
          </button>
          
          {/* Dropdown menu for bookmarks */}
          {showBookmarks && (
            <div className="absolute left-0 top-full mt-1 w-48 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
              {bookmarks.map((bookmark, index) => (
                <div 
                  key={index} 
                  className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
                  onClick={() => goToBookmark(bookmark.url)}
                >
                  {bookmark.title}
                </div>
              ))}
              <div className="border-t border-t-[#808080] my-1"></div>
              <div 
                className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm flex items-center"
                onClick={() => {
                  setShowAddBookmark(true);
                  setShowBookmarks(false);
                }}
              >
                <span>Add Current Page</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            onClick={() => {
              setShowHistory(!showHistory);
              setShowBookmarks(false);
            }}
          >
            <Image 
              src="/hackbook-W95/app-icon/history.png" 
              alt="History" 
              width={16} 
              height={16} 
              className="mr-1" 
            />
            <span className="text-xs">History</span>
          </button>
          
          {/* Dropdown menu for history */}
          {showHistory && (
            <div className="absolute left-0 top-full mt-1 w-64 max-h-64 overflow-y-auto border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] bg-[#c0c0c0] z-50">
              {browserHistory.length > 0 ? (
                browserHistory.map((item, index) => (
                  <div 
                    key={index} 
                    className="px-3 py-1 hover:bg-[#000080] hover:text-white cursor-pointer text-sm"
                    onClick={() => goToHistory(item.url)}
                  >
                    <div className="truncate">{item.title}</div>
                    <div className="text-xs text-gray-600 truncate">{item.url}</div>
                    <div className="text-xs text-gray-600">{formatDate(new Date(item.visitedAt))}</div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-600">No history items</div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex-1"></div>
        
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={onClose}
        >
          <span className="text-xs">Close</span>
        </button>
      </div>
      
      {/* Address bar */}
      <div className="bg-[#c0c0c0] px-2 py-1 flex items-center">
        <div className="text-sm mr-2">Address:</div>
        <form className="flex-1" onSubmit={navigateToURL}>
          <input 
            type="text"
            className="w-full border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-2 py-1"
            value={currentURL}
            onChange={handleURLChange}
          />
        </form>
        <button 
          className="ml-2 px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={navigateToURL}
        >
          <span className="text-xs">Go</span>
        </button>
      </div>
      
      {/* Main content */}
      <div className="flex-1 bg-white">
        <iframe 
          id="webFrame" 
          src={currentURL || link} 
          className="w-full h-full m-auto overscroll-none"
          title="Internet Explorer"
          frameBorder="0" 
          onLoad={() => {
            // Try to get page title from iframe
            try {
              const iframe = document.getElementById('webFrame') as HTMLIFrameElement;
              if (iframe && iframe.contentDocument) {
                const title = iframe.contentDocument.title;
                if (title) {
                  setPageTitle(title);
                }
              }
            } catch (e) {
              logger.error('Error getting page title:', { error: e instanceof Error ? e.message : 'Unknown error' }, e as Error);
            }
            setLoadingStatus("Done");
          }}
        />
      </div>
      
      {/* Add bookmark dialog */}
      {showAddBookmark && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040] p-2 z-50">
          <div className="text-center font-bold border-b border-b-[#808080] pb-1 mb-2">Add Bookmark</div>
          <div className="mb-3">
            <div className="text-sm mb-1">Title:</div>
            <input 
              type="text" 
              className="w-full border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-2 py-1"
              value={newBookmarkTitle}
              onChange={(e) => setNewBookmarkTitle(e.target.value)}
              placeholder={pageTitle || "Bookmark Title"}
            />
          </div>
          <div className="mb-3">
            <div className="text-sm mb-1">URL:</div>
            <div className="w-full border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-2 py-1 text-gray-600 text-sm truncate">
              {currentURL}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button 
              className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
              onClick={() => setShowAddBookmark(false)}
            >
              <span className="text-xs">Cancel</span>
            </button>
            <button 
              className="px-3 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
              onClick={addBookmark}
            >
              <span className="text-xs">Save</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Status bar */}
      <div className="w-full flex items-center justify-between bg-[#c0c0c0] border-t border-t-[#808080] p-1 text-xs">
        <div>{loadingStatus}</div>
        <div className="flex items-center">
          <Image 
            src="/hackbook-W95/app-icon/ie.png" 
            alt="Internet Explorer" 
            width={16} 
            height={16} 
            className="mx-1" 
          />
          <span>Internet zone</span>
        </div>
      </div>
    </div>
  );
};

export default InternetExplorer;
