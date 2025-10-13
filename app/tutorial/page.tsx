'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function TutorialPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000);
    }
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    };
  }, [showControls, isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !duration || duration === 0) return;
    
    const percentage = parseFloat(e.target.value);
    const newTime = Math.min((percentage / 100) * duration, duration - 0.1);
    
    if (!isNaN(newTime) && newTime >= 0) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value) / 100;
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const skipTutorial = () => {
    router.push('/device-selection');
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    
    // Add a small buffer (0.1 seconds) before the end to prevent triggering the ended event
    const maxTime = Math.max(video.duration - 0.1, 0);
    const newTime = Math.min(video.currentTime + 10, maxTime);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = Math.max(video.currentTime - 10, 0);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Fallback timeout to ensure loading state doesn't stay forever
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000); // 5 second timeout

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => {
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
        setIsLoading(false);
      }
    };
    const handleLoadedData = () => {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handleCanPlay = () => {
      clearTimeout(loadingTimeout);
      setIsLoading(false);
      if (video.duration && !isNaN(video.duration)) {
        setDuration(video.duration);
      }
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-redirect to device selection when video ends
      router.push('/device-selection');
    };
    const handleError = (e: Event) => {
      console.error('Video error:', e);
    };

    // Keyboard shortcuts
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'Escape':
          e.preventDefault();
          skipTutorial();
          break;
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      clearTimeout(loadingTimeout);
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [router, togglePlay, skipBackward, skipForward, toggleFullscreen, toggleMute, skipTutorial]);

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover cursor-pointer"
        src="/videos/sample-3.mp4"
        preload="auto"
        playsInline
        controls={false}
        onClick={togglePlay}
        onLoadStart={() => console.log('Video load started')}
        onLoadedData={() => console.log('Video data loaded')}
        onCanPlay={() => console.log('Video can play')}
      />

      {/* Skip Button - Always visible in top right */}
      <motion.button
        onClick={skipTutorial}
        className="absolute top-6 right-6 z-50 px-6 py-3 bg-black/80 border-2 border-green-400 text-green-400 font-mono font-bold text-sm rounded-lg hover:bg-green-400/20 hover:shadow-lg hover:shadow-green-400/30 transition-all duration-300 backdrop-blur-md pointer-events-auto"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        SKIP TUTORIAL →
      </motion.button>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-green-400 font-mono text-xl flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            <span>Loading Tutorial...</span>
          </div>
        </div>
      )}

      {/* Video Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 pointer-events-none"
          >
            {/* Bottom Controls Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pointer-events-auto">
              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={duration && duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-green"
                  style={{
                    background: `linear-gradient(to right, #00ff88 0%, #00ff88 ${duration && duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0}%, #374151 ${duration && duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0}%, #374151 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-green-400 font-mono mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rewind 10s Button */}
                  <motion.button
                    onClick={skipBackward}
                    className="relative w-12 h-12 flex items-center justify-center bg-green-400/10 border border-green-400/50 text-green-400 rounded-full hover:bg-green-400/20 hover:border-green-400 hover:shadow-lg hover:shadow-green-400/30 transition-all duration-300 group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Rewind 10 seconds"
                  >
                    {/* Double left arrow icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="absolute">
                      <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor"/>
                      <path d="M11.41 7.41L10 6L4 12L10 18L11.41 16.59L6.83 12L11.41 7.41Z" fill="currentColor" opacity="0.7"/>
                    </svg>
                    {/* 10 second indicator */}
                    <span className="absolute -bottom-1 -right-1 bg-green-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center group-hover:bg-green-300 transition-colors duration-300">
                      10
                    </span>
                  </motion.button>

                  {/* Play/Pause Button */}
                  <motion.button
                    onClick={togglePlay}
                    className="w-14 h-14 flex items-center justify-center bg-green-400/20 border-2 border-green-400 text-green-400 rounded-full hover:bg-green-400/30 hover:shadow-lg hover:shadow-green-400/40 transition-all duration-300"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </motion.button>

                  {/* Fast Forward 10s Button */}
                  <motion.button
                    onClick={skipForward}
                    className="relative w-12 h-12 flex items-center justify-center bg-green-400/10 border border-green-400/50 text-green-400 rounded-full hover:bg-green-400/20 hover:border-green-400 hover:shadow-lg hover:shadow-green-400/30 transition-all duration-300 group"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    title="Fast forward 10 seconds"
                  >
                    {/* Double right arrow icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="absolute">
                      <path d="M8.59 16.59L10 18L16 12L10 6L8.59 7.41L13.17 12L8.59 16.59Z" fill="currentColor"/>
                      <path d="M12.59 16.59L14 18L20 12L14 6L12.59 7.41L17.17 12L12.59 16.59Z" fill="currentColor" opacity="0.7"/>
                    </svg>
                    {/* 10 second indicator */}
                    <span className="absolute -bottom-1 -right-1 bg-green-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center group-hover:bg-green-300 transition-colors duration-300">
                      10
                    </span>
                  </motion.button>

                  {/* Time Display */}
                  <div className="text-green-400 font-mono text-sm">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Volume Control */}
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={toggleMute}
                      className="text-green-400 hover:text-green-300 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isMuted ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                      )}
                    </motion.button>
                    
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume * 100}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-green"
                      style={{
                        background: `linear-gradient(to right, #00ff88 0%, #00ff88 ${isMuted ? 0 : volume * 100}%, #374151 ${isMuted ? 0 : volume * 100}%, #374151 100%)`
                      }}
                    />
                  </div>

                  {/* Fullscreen Button */}
                  <motion.button
                    onClick={toggleFullscreen}
                    className="text-green-400 hover:text-green-300 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isFullscreen ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                      </svg>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Center Play Button (when paused) */}
            {!isPlaying && (
              <motion.button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-24 h-24 flex items-center justify-center bg-black/90 border-2 border-green-400 text-green-400 rounded-full hover:bg-green-400/20 hover:scale-110 hover:shadow-xl hover:shadow-green-400/50 transition-all duration-300 backdrop-blur-md">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>



      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider-green::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00ff88;
          border: 2px solid #000;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        .slider-green::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00ff88;
          border: 2px solid #000;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        .slider-green::-webkit-slider-track {
          background: transparent;
        }

        .slider-green::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}