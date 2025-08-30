"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";

interface YouTubeAppProps {
  onClose?: () => void;
  time?: Date;
}

interface Video {
  id: string;
  title: string;
  channel: string;
  views: string;
  uploadTime: string;
  thumbnail: string;
  duration: string;
  verified?: boolean;
  videoUrl?: string;
}

const YouTubeApp: React.FC<YouTubeAppProps> = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'shorts' | 'subscriptions' | 'library'>('home');
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Mock video data with hack-a-byte channel
  const homeVideos: Video[] = [
    {
      id: "1",
      title: "Hack-A-Byte 2024 - Official Trailer",
      channel: "hack-a-byte",
      views: "25.3K views",
      uploadTime: "1 week ago",
      thumbnail: "https://img.youtube.com/vi/5q4iG-AL0Qo/hqdefault.jpg",
      duration: "2:15",
      verified: true,
      videoUrl: "https://www.youtube.com/embed/5q4iG-AL0Qo"
    },
    {
      id: "2", 
      title: "Hack-A-Byte Event Highlights",
      channel: "hack-a-byte",
      views: "18.7K views",
      uploadTime: "2 weeks ago",
      thumbnail: "https://img.youtube.com/vi/dlG3Q_cxv94/hqdefault.jpg",
      duration: "8:45",
      verified: true,
      videoUrl: "https://www.youtube.com/embed/dlG3Q_cxv94"
    },
    {
      id: "3",
      title: "Top 10 Hacking Challenges at Hack-A-Byte",
      channel: "hack-a-byte",
      views: "31.5K views",
      uploadTime: "1 week ago",
      thumbnail: "https://img.youtube.com/vi/8IiXpl1o630/hqdefault.jpg",
      duration: "12:18",
      verified: true,
      videoUrl: "https://www.youtube.com/embed/8IiXpl1o630"
    },
    {
      id: "4",
      title: "Cybersecurity Workshop Highlights - Day 1",
      channel: "DevLearn Academy",
      views: "18.7K views",
      uploadTime: "1 week ago",
      thumbnail: "/hackphone/gallery/wallpaper1.jpg",
      duration: "24:53",
      verified: true,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
    },
    {
      id: "5",
      title: "Meet the Hack-A-Byte Mentors - Expert Panel",
      channel: "hack-a-byte",
      views: "12.3K views",
      uploadTime: "2 weeks ago",
      thumbnail: "/hackphone/gallery/wallpaper2.jpg",
      duration: "19:27",
      verified: true,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"
    },
    {
      id: "6",
      title: "HackDroid Device Showcase - New Features Demo",
      channel: "hack-a-byte",
      views: "28.9K views",
      uploadTime: "2 weeks ago",
      thumbnail: "/hackphone/gallery/wallpaper3.jpg",
      duration: "14:36",
      verified: true,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
    },
    {
      id: "7",
      title: "Hack-A-Byte 2024 Trailer - Are You Ready?",
      channel: "hack-a-byte",
      views: "42.1K views",
      uploadTime: "3 weeks ago",
      thumbnail: "/hackphone/gallery/wallpaper1.jpg",
      duration: "2:15",
      verified: true,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4"
    },
    {
      id: "8",
      title: "Setting Up Your Development Environment",
      channel: "Programming Tips",
      views: "35.6K views",
      uploadTime: "3 weeks ago",
      thumbnail: "/hackphone/gallery/wallpaper2.jpg",
      duration: "21:44",
      verified: true,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    }
  ];

  const shortsVideos: Video[] = [
    {
      id: "s1",
      title: "Hack-A-Byte Quick Update #shorts",
      channel: "hack-a-byte",
      views: "15.2K views",
      uploadTime: "2 days ago",
      thumbnail: "https://img.youtube.com/vi/p3kgvyO5r2A/hqdefault.jpg",
      duration: "0:45",
      verified: true,
      videoUrl: "https://www.youtube.com/embed/p3kgvyO5r2A"
    },
    {
      id: "s2",
      title: "Tech News Today #shorts",
      channel: "TechDaily",
      views: "12.5K views",
      uploadTime: "1 day ago",
      thumbnail: "/hackphone/gallery/wallpaper2.jpg",
      duration: "0:58",
      verified: true,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
    },
    {
      id: "s3",
      title: "Mobile App Demo #shorts",
      channel: "AppShowcase",
      views: "6.7K views",
      uploadTime: "2 days ago",
      thumbnail: "/hackphone/gallery/wallpaper3.jpg",
      duration: "0:32",
      verified: true,
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    }
  ];

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    // Simulate search delay
    setTimeout(() => {
      const filtered = homeVideos.filter(video => 
        video.title.toLowerCase().includes(query.toLowerCase()) ||
        video.channel.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 500);
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
  };

  const renderVideoCard = (video: Video, isShort = false) => (
    <div 
      key={video.id} 
      className={`bg-white rounded-lg overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors border border-gray-200 ${
        isShort ? 'w-32' : 'mb-3'
      }`}
      onClick={() => handleVideoClick(video)}
    >
      <div className={`relative ${isShort ? 'h-48' : 'h-48'} bg-gray-200`}>
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="text-white text-2xl">▶</div>
        </div>
        <div className="absolute bottom-1 right-1 bg-white bg-opacity-90 text-gray-900 text-xs px-1 rounded border border-gray-300">
          {video.duration}
        </div>
      </div>
      <div className={`p-3 ${isShort ? 'p-2' : ''}`}>
        <h3 className={`text-gray-900 font-medium leading-tight mb-1 ${
          isShort ? 'text-xs line-clamp-2' : 'text-sm line-clamp-2'
        }`}>
          {video.title}
        </h3>
        <div className={`flex items-center text-gray-600 ${isShort ? 'text-xs' : 'text-xs'}`}>
          <span className="truncate">{video.channel}</span>
          {video.verified && <span className="ml-1 text-blue-500">✓</span>}
        </div>
        <div className={`text-gray-500 ${isShort ? 'text-xs' : 'text-xs'}`}>
          {video.views} • {video.uploadTime}
        </div>
      </div>
    </div>
  );

  const renderVideoPlayer = () => (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Video Player Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <button 
          onClick={() => setSelectedVideo(null)}
          className="text-gray-700 text-lg"
        >
          ←
        </button>
        <div className="flex space-x-4">
          <button className="text-gray-700">⋮</button>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="w-full max-w-md aspect-video bg-white relative">
          {selectedVideo?.videoUrl ? (
            selectedVideo.videoUrl.includes('youtube.com/embed') ? (
              <iframe
                src={selectedVideo.videoUrl}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={selectedVideo.title}
              />
            ) : (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                poster="/hackphone/gallery/wallpaper1.jpg"
                controls
                playsInline
              >
                <source src={selectedVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">▶</div>
                <div>Video not available</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-white p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{selectedVideo?.title}</h2>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-500 rounded-full mr-3 flex items-center justify-center">
              <span className="text-white text-xs font-bold">H</span>
            </div>
            <div>
              <div className="flex items-center">
                <span className="font-medium text-gray-900">{selectedVideo?.channel}</span>
                {selectedVideo?.verified && <span className="ml-1 text-blue-500">✓</span>}
              </div>
              <div className="text-sm text-gray-500">45.2K subscribers</div>
            </div>
          </div>
          <button className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            Subscribe
          </button>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
          <span>{selectedVideo?.views}</span>
          <span>{selectedVideo?.uploadTime}</span>
        </div>

        <div className="flex items-center space-x-6 py-2 border-t border-gray-200">
          <button className="flex items-center space-x-2 text-gray-700">
            <span>👍</span>
            <span className="text-sm">234K</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-700">
            <span>👎</span>
            <span className="text-sm">2.1K</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-700">
            <span>↗</span>
            <span className="text-sm">Share</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-700">
            <span>💾</span>
            <span className="text-sm">Save</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderHomeTab = () => (
    <div className="flex-1 overflow-y-auto bg-gray-100">
      {/* Channel Header */}
      <div className="bg-white p-4 mb-2 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">H</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <h2 className="text-gray-900 font-semibold text-lg">hack-a-byte</h2>
              <span className="ml-2 text-blue-500">✓</span>
            </div>
            <p className="text-gray-500 text-sm">45.2K subscribers</p>
          </div>
          <button className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium">
            Subscribe
          </button>
        </div>
      </div>

      <div className="p-4">
        {isSearching ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-600">Searching...</div>
          </div>
        ) : searchResults.length > 0 ? (
          searchResults.map(video => renderVideoCard(video))
        ) : searchQuery ? (
          <div className="text-center text-gray-500 mt-8">
            No results found for &quot;{searchQuery}&quot;
          </div>
        ) : (
          homeVideos.map(video => renderVideoCard(video))
        )}
      </div>
    </div>
  );

  const renderShortsTab = () => (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
      <div className="grid grid-cols-2 gap-4">
        {shortsVideos.map(video => renderVideoCard(video, true))}
      </div>
    </div>
  );

  const renderSubscriptionsTab = () => (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
      <div className="space-y-4">
        {/* Subscribed Channel */}
        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">H</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center">
              <span className="text-gray-900 font-medium">hack-a-byte</span>
              <span className="ml-2 text-blue-500">✓</span>
            </div>
            <div className="text-gray-500 text-sm">45.2K subscribers</div>
          </div>
          <button className="text-gray-400">🔔</button>
        </div>

        {/* Recent Videos from Subscriptions */}
        <div className="mt-6">
          <h3 className="text-gray-900 font-medium mb-3">Latest Videos</h3>
          {homeVideos.slice(0, 3).map(video => renderVideoCard(video))}
        </div>
      </div>
    </div>
  );

  const renderLibraryTab = () => (
    <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
      <div className="space-y-4">
        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="text-2xl">🕒</div>
          <div>
            <div className="text-gray-900 font-medium">Watch Later</div>
            <div className="text-gray-500 text-sm">0 videos</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="text-2xl">👍</div>
          <div>
            <div className="text-gray-900 font-medium">Liked Videos</div>
            <div className="text-gray-500 text-sm">0 videos</div>
          </div>
        </div>

        <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="text-2xl">📁</div>
          <div>
            <div className="text-gray-900 font-medium">Downloads</div>
            <div className="text-gray-500 text-sm">0 videos</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col">
      {selectedVideo && renderVideoPlayer()}
      
      {/* YouTube Header - iOS 4 Style */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/hackphone/apps/youtube/app-icon.png"
              alt="YouTube"
              width={24}
              height={24}
            />
            <span className="text-gray-900 text-lg font-semibold">YouTube</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-gray-600">🔍</button>
            <button className="text-gray-600">⋯</button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="mt-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search YouTube"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full bg-gray-100 text-gray-900 px-4 py-2 rounded-full border border-gray-300 focus:border-red-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsSearching(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'home' && renderHomeTab()}
      {activeTab === 'shorts' && renderShortsTab()}
      {activeTab === 'subscriptions' && renderSubscriptionsTab()}
      {activeTab === 'library' && renderLibraryTab()}

      {/* Bottom Navigation - iOS 4 Style */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center space-y-1 py-2 ${
              activeTab === 'home' ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            <div className="text-lg">🏠</div>
            <span className="text-xs">Home</span>
          </button>
          
          <button
            onClick={() => setActiveTab('shorts')}
            className={`flex flex-col items-center space-y-1 py-2 ${
              activeTab === 'shorts' ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            <div className="text-lg">⚡</div>
            <span className="text-xs">Shorts</span>
          </button>
          
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex flex-col items-center space-y-1 py-2 ${
              activeTab === 'subscriptions' ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            <div className="text-lg">📺</div>
            <span className="text-xs">Subscriptions</span>
          </button>
          
          <button
            onClick={() => setActiveTab('library')}
            className={`flex flex-col items-center space-y-1 py-2 ${
              activeTab === 'library' ? 'text-red-500' : 'text-gray-600'
            }`}
          >
            <div className="text-lg">📚</div>
            <span className="text-xs">Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeApp;
