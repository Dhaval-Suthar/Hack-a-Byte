import React, { useState, useRef, useEffect } from "react";

interface Video {
  id: string;
  title: string;
  channel: string;
  views: string;
  duration: string;
  thumbnail: string;
  uploadTime: string;
  description: string;
  channelIcon: string;
}

interface YouTubeAppProps {
  onClose: () => void;
  time: Date;
}

const YouTubeApp: React.FC<YouTubeAppProps> = ({ onClose, time }) => {
  const [currentView, setCurrentView] = useState<'home' | 'featured' | 'subscriptions' | 'search' | 'video'>('featured');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(68); // 1:08 in seconds
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Mock video data with retro tech content and better thumbnails
  const videos: Video[] = [
    {
      id: "1",
      title: "iPhone 4 Review - Revolutionary Design",
      channel: "TechRewind",
      views: "2.3M views",
      duration: "4:32",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiMyMTIxMjEiLz48cmVjdCB4PSI2MCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI1MCIgcng9IjgiIGZpbGw9IiM0Qjc2ODgiLz48Y2lyY2xlIGN4PSI4MCIgY3k9IjMwIiByPSIzIiBmaWxsPSIjRkZGRkZGIi8+PHJlY3QgeD0iNzAiIHk9IjM1IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIyIiBmaWxsPSIjMzMzMzMzIi8+PC9zdmc+",
      uploadTime: "2 days ago",
      description: "A deep dive into the iPhone 4's groundbreaking design and features that changed smartphones forever.",
      channelIcon: "🔧"
    },
    {
      id: "2",
      title: "iOS 4 Features Walkthrough",
      channel: "RetroiOS",
      views: "1.8M views",
      duration: "8:45",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiMwMDcyRkYiLz48cmVjdCB4PSI1MCIgeT0iMTUiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcng9IjEyIiBmaWxsPSIjRkZGRkZGIi8+PHRleHQgeD0iODAiIHk9IjUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiMwMDcyRkYiPmlPUzwvdGV4dD48L3N2Zz4=",
      uploadTime: "1 week ago",
      description: "Exploring all the new features in iOS 4 including multitasking, folders, and more.",
      channelIcon: "🍎"
    },
    {
      id: "3",
      title: "Building Apps for iOS 4",
      channel: "DevTutorials",
      views: "892K views",
      duration: "12:15",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiMxRTI5M0IiLz48cmVjdCB4PSI0MCIgeT0iMjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI1MCIgcng9IjQiIGZpbGw9IiMzNzQxNTEiLz48dGV4dCB4PSI4MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNGRkZGRkYiPiZsdDsvJmd0OzwvdGV4dD48L3N2Zz4=",
      uploadTime: "3 days ago",
      description: "Learn how to develop apps for the new iOS 4 platform with Xcode.",
      channelIcon: "👨‍💻"
    },
    {
      id: "4",
      title: "Retro Gaming on iPhone",
      channel: "GameHistory",
      views: "445K views",
      duration: "6:23",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiM4QjUzOTYiLz48cmVjdCB4PSI0NSIgeT0iMjUiIHdpZHRoPSI3MCIgaGVpZ2h0PSI0MCIgcng9IjgiIGZpbGw9IiNGRkZGRkYiLz48Y2lyY2xlIGN4PSI2NSIgY3k9IjQ1IiByPSI2IiBmaWxsPSIjOEI1Mzk2Ii8+PGNpcmNsZSBjeD0iOTUiIGN5PSI0NSIgcj0iNiIgZmlsbD0iIzhCNTM5NiIvPjwvc3ZnPg==",
      uploadTime: "5 days ago",
      description: "Exploring the best retro games available on iPhone and iPod Touch.",
      channelIcon: "🎮"
    },
    {
      id: "5",
      title: "Apple's Design Philosophy",
      channel: "DesignStory",
      views: "1.2M views",
      duration: "10:07",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiNGRkZGRkYiLz48cGF0aCBkPSJNODAgMjBDOTAgMjAgOTUgMjUgOTUgMzVDOTUgNDUgODUgNTAgODAgNTBDNzUgNTAgNjUgNDUgNjUgMzVDNjUgMjUgNzAgMjAgODAgMjBaIiBmaWxsPSIjMDAwMDAwIi8+PHBhdGggZD0iTTY1IDQ1SDk1VjY1SDY1WiIgZmlsbD0iIzAwMDAwMCIvPjwvc3ZnPg==",
      uploadTime: "1 week ago",
      description: "Understanding the design principles that made Apple products so iconic.",
      channelIcon: "🎨"
    },
    {
      id: "6",
      title: "Steve Jobs WWDC 2010 Keynote",
      channel: "AppleEvents",
      views: "5.1M views",
      duration: "92:15",
      thumbnail: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB4PSI0MCIgeT0iMzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0ZGRkZGRiIvPjx0ZXh0IHg9IjgwIiB5PSI1MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMDAwMDAwIj5XV0RDPC90ZXh0Pjwvc3ZnPg==",
      uploadTime: "2 weeks ago",
      description: "The complete keynote where Steve Jobs introduced the iPhone 4 and iOS 4.",
      channelIcon: "🍎"
    }
  ];

  const renderStatusBar = () => (
    <div className="flex justify-between items-center px-4 pt-8 pb-2 text-white text-xs relative z-10">
      <div className="flex items-center space-x-2">
        <button onClick={onClose} className="text-white text-sm">
          ← Back
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs font-medium">{formatTime(time)}</span>
        <div className="w-6 h-3 border border-white/60 rounded-sm relative">
          <div className="w-3 h-1.5 bg-green-500 rounded-sm m-0.5" />
          <div className="w-0.5 h-1 bg-white/60 rounded-full absolute -right-0.5 top-0.5" />
        </div>
      </div>
    </div>
  );

  const renderVideoCard = (video: Video) => (
    <div 
      key={video.id}
      className="bg-white mb-2 cursor-pointer active:bg-gray-100"
      onClick={() => {
        setSelectedVideo(video);
        setCurrentView('video');
      }}
    >
      <div className="flex p-3">
        {/* Video thumbnail */}
        <div className="relative mr-3 flex-shrink-0">
          <img 
            src={video.thumbnail}
            alt={video.title}
            className="w-20 h-15 bg-gray-200 rounded object-cover"
            onError={(e) => {
              // Fallback to emoji if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="w-20 h-15 bg-gradient-to-br from-gray-700 to-gray-900 rounded flex items-center justify-center text-2xl hidden">
            📺
          </div>
          <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 rounded text-[10px]">
            {video.duration}
          </div>
        </div>
        
        {/* Video info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2 leading-tight">
            {video.title}
          </h3>
          <div className="flex items-start">
            <span className="text-lg mr-2 flex-shrink-0">{video.channelIcon}</span>
            <div className="text-xs text-gray-600 min-w-0">
              <div className="truncate">{video.channel}</div>
              <div className="text-gray-500">{video.views} • {video.uploadTime}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Separator line */}
      <div className="border-b border-gray-100 ml-3" />
    </div>
  );

  const renderVideoPlayer = () => {
    if (!selectedVideo) return null;
    
    const totalDuration = parseInt(selectedVideo.duration.split(':')[0]) * 60 + parseInt(selectedVideo.duration.split(':')[1]);
    const progress = (currentTime / totalDuration) * 100;
    
    return (
      <div className="flex flex-col h-full bg-black">
        {/* Video player area */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {/* Video background */}
          <img 
            src={selectedVideo.thumbnail}
            alt={selectedVideo.title}
            className="w-full h-full object-cover opacity-50"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          
          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center text-white text-2xl border-2 border-white/50"
            >
              {isPlaying ? '⏸' : '▶️'}
            </button>
          </div>
          
          {/* Video controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress bar */}
            <div className="mb-3">
              <div className="bg-white/30 h-1 rounded-full">
                <div 
                  className="bg-red-500 h-1 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-white text-xs mt-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{selectedVideo.duration}</span>
              </div>
            </div>
            
            {/* Control buttons */}
            <div className="flex justify-center space-x-8 mb-2">
              <button className="text-white text-xl">⏮</button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-white text-2xl"
              >
                {isPlaying ? '⏸' : '▶️'}
              </button>
              <button className="text-white text-xl">⏭</button>
            </div>
            
            {/* Video title */}
            <div className="text-white text-sm font-medium truncate">
              {selectedVideo.title}
            </div>
          </div>
          
          {/* Back button */}
          <button 
            onClick={() => setCurrentView('featured')}
            className="absolute top-4 left-4 text-white text-sm bg-black/50 px-2 py-1 rounded"
          >
            ← Done
          </button>
          
          {/* Fullscreen button */}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-4 right-4 text-white text-lg bg-black/50 p-1 rounded"
          >
            ⛶
          </button>
        </div>
        
        {!isFullscreen && (
          <div className="bg-white">
            {/* Video info header */}
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-base mb-2 text-gray-900">{selectedVideo.title}</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xl mr-2">{selectedVideo.channelIcon}</span>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{selectedVideo.channel}</div>
                    <div className="text-xs text-gray-600">{selectedVideo.views} • {selectedVideo.uploadTime}</div>
                  </div>
                </div>
                <button className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium">
                  Subscribe
                </button>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex border-b border-gray-200">
              <button className="flex-1 py-3 text-center text-sm text-gray-700 border-r border-gray-200">
                👍 Like
              </button>
              <button className="flex-1 py-3 text-center text-sm text-gray-700 border-r border-gray-200">
                👎 Dislike
              </button>
              <button className="flex-1 py-3 text-center text-sm text-gray-700 border-r border-gray-200">
                💬 Comment
              </button>
              <button className="flex-1 py-3 text-center text-sm text-gray-700">
                📤 Share
              </button>
            </div>
            
            {/* Description */}
            <div className="p-4 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-700 leading-relaxed">{selectedVideo.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderVideoList = () => (
    <div className="flex-1 overflow-y-auto px-4 pb-16">
      {videos.map(renderVideoCard)}
    </div>
  );

  const renderSearchView = () => (
    <div className="flex-1 flex flex-col">
      {/* Search bar */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
          <span className="text-gray-400 mr-2">🔍</span>
          <input
            type="text"
            placeholder="Search YouTube"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-gray-400 ml-2"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {/* Search results */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-16">
        {searchQuery ? (
          videos
            .filter(video => 
              video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              video.channel.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(renderVideoCard)
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-sm">Search for videos</div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBottomNavigation = () => (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-600">
      <div className="flex">
        <button
          onClick={() => setCurrentView('featured')}
          className={`flex-1 py-3 text-center text-xs ${
            currentView === 'featured' ? 'text-white bg-gray-700' : 'text-gray-400'
          }`}
        >
          <div className="text-lg mb-1">⭐</div>
          <div>Featured</div>
        </button>
        
        <button
          onClick={() => setCurrentView('subscriptions')}
          className={`flex-1 py-3 text-center text-xs ${
            currentView === 'subscriptions' ? 'text-white bg-gray-700' : 'text-gray-400'
          }`}
        >
          <div className="text-lg mb-1">📺</div>
          <div>Subscriptions</div>
        </button>
        
        <button
          onClick={() => setCurrentView('search')}
          className={`flex-1 py-3 text-center text-xs ${
            currentView === 'search' ? 'text-white bg-gray-700' : 'text-gray-400'
          }`}
        >
          <div className="text-lg mb-1">🔍</div>
          <div>Search</div>
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen bg-white flex flex-col relative">
      {renderStatusBar()}
      
      {/* YouTube header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">▶</span>
          </div>
          <span className="font-bold text-lg text-gray-900">YouTube</span>
        </div>
      </div>

      {/* Main content */}
      {currentView === 'video' && selectedVideo ? renderVideoPlayer() : 
       currentView === 'search' ? renderSearchView() : renderVideoList()}

      {/* Bottom navigation (only show when not in video view) */}
      {currentView !== 'video' && renderBottomNavigation()}
    </div>
  );
};

export default YouTubeApp;
