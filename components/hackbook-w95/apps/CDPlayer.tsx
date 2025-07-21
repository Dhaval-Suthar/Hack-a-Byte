"use client";

import React, { useState, useRef, useEffect } from "react";

interface Track {
  artist: string;
  title: string;
  duration: string;
}

interface CDPlayerProps {
  onClose: () => void;
}

const CDPlayer: React.FC<CDPlayerProps> = ({ onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState("00:00");
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [volume, setVolume] = useState(50);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Load user preferences from storage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { UserPreferences } = await import('../hooks/useUserPreferences');
        
        // Get CD player settings from user-specific storage
        const cdPlayerSettings = UserPreferences.getAppData('cdplayer', null);
        
        if (cdPlayerSettings) {
          if (cdPlayerSettings.volume !== undefined) setVolume(cdPlayerSettings.volume);
          if (cdPlayerSettings.lastTrack !== undefined) setSelectedTrack(cdPlayerSettings.lastTrack);
        }
      } catch (error) {
        console.error('Error loading CD Player preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);
  
  const tracks: Track[] = [
    { artist: "Pet Shop Boys", title: "Behaviour", duration: "03:45" },
    { artist: "Depeche Mode", title: "Enjoy The Silence", duration: "04:15" },
    { artist: "The Cure", title: "Lovesong", duration: "03:28" },
    { artist: "New Order", title: "Blue Monday", duration: "07:29" },
  ];
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.play().catch(err => {
        console.error("Failed to play audio:", err);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
    
    const updateTime = () => {
      if (!audio) return;
      
      const minutes = Math.floor(audio.currentTime / 60);
      const seconds = Math.floor(audio.currentTime % 60);
      setCurrentTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    
    audio.addEventListener("timeupdate", updateTime);
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
    };
  }, [isPlaying]);
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handlePrev = () => {
    const prevTrack = selectedTrack > 0 ? selectedTrack - 1 : tracks.length - 1;
    setSelectedTrack(prevTrack);
    
    // Save track selection to user-specific storage
    import('../hooks/useUserPreferences').then(({ UserPreferences }) => {
      UserPreferences.setAppData('cdplayer', {
        volume,
        lastTrack: prevTrack
      });
    });
    
    if (isPlaying) {
      // Restart playing with new track
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 10);
    }
  };
  
  // Update volume and save to user preferences
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    
    // Set audio volume
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    
    // Save to user-specific storage
    import('../hooks/useUserPreferences').then(({ UserPreferences }) => {
      UserPreferences.setAppData('cdplayer', {
        volume: newVolume,
        lastTrack: selectedTrack
      });
    });
  };
  
  const handleNext = () => {
    const nextTrack = selectedTrack < tracks.length - 1 ? selectedTrack + 1 : 0;
    setSelectedTrack(nextTrack);
    
    // Save track selection to user-specific storage
    import('../hooks/useUserPreferences').then(({ UserPreferences }) => {
      UserPreferences.setAppData('cdplayer', {
        volume,
        lastTrack: nextTrack
      });
    });
    
    if (isPlaying) {
      // Restart playing with new track
      setIsPlaying(false);
      setTimeout(() => setIsPlaying(true), 10);
    }
  };
  
  return (
    <div className="w-full h-full bg-[#c0c0c0] text-black flex flex-col">
      {/* Toolbar */}
      <div className="w-full flex items-center bg-[#c0c0c0] border-b border-b-[#808080] p-1">
        <div className="flex-1"></div>
        <button 
          className="flex items-center mx-1 px-2 py-1 border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          onClick={onClose}
        >
          <span className="text-xs">Close</span>
        </button>
      </div>
      
      {/* Audio element (hidden) */}
      <audio 
        ref={audioRef} 
        src={`/hackbook-w95/sounds/placeholder-music.mp3`} 
        loop 
      />
      
      {/* Display area */}
      <div className="p-4 flex justify-center">
        <div className="w-full max-w-sm bg-black text-yellow-500 border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] p-2">
          <div className="text-center font-mono font-bold">
            <span className="text-xl">[{(selectedTrack + 1).toString().padStart(2, '0')}] {currentTime}</span>
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="px-4 flex justify-center">
        <div className="w-full max-w-sm flex justify-between">
          <button 
            className="w-8 h-8 flex items-center justify-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            onClick={() => handlePrev()}
          >
            <span className="text-lg">⏮</span>
          </button>
          
          <button 
            className="w-8 h-8 flex items-center justify-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            onClick={() => setIsPlaying(false)}
          >
            <span className="text-lg">⏹</span>
          </button>
          
          <button 
            className="w-8 h-8 flex items-center justify-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            onClick={handlePlayPause}
          >
            <span className="text-lg">{isPlaying ? "⏸" : "▶️"}</span>
          </button>
          
          <button 
            className="w-8 h-8 flex items-center justify-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
            onClick={() => handleNext()}
          >
            <span className="text-lg">⏭</span>
          </button>
          
          <button 
            className="w-8 h-8 flex items-center justify-center bg-[#c0c0c0] border-2 border-t-[#ffffff] border-l-[#ffffff] border-r-[#404040] border-b-[#404040]"
          >
            <span className="text-lg">⏏</span>
          </button>
        </div>
      </div>
      
      {/* Track info */}
      <div className="p-4 flex-1">
        <div className="flex flex-col space-y-2">
          <div className="flex">
            <span className="w-16 text-sm">Artist:</span>
            <div className="flex-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-2">
              <span className="text-sm">{tracks[selectedTrack].artist}</span>
            </div>
          </div>
          
          <div className="flex">
            <span className="w-16 text-sm">Title:</span>
            <div className="flex-1 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-2">
              <span className="text-sm">{tracks[selectedTrack].title}</span>
            </div>
          </div>
          
          <div className="flex">
            <span className="w-16 text-sm">Track:</span>
            <div className="w-20 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-2">
              <span className="text-sm">{selectedTrack + 1}</span>
            </div>
            <span className="mx-1">of</span>
            <div className="w-20 bg-white border-2 border-t-[#808080] border-l-[#808080] border-r-[#ffffff] border-b-[#ffffff] px-2">
              <span className="text-sm">{tracks.length}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Volume control */}
      <div className="px-4 pb-2">
        <div className="flex items-center">
          <span className="text-xs mr-2">Volume:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-xs ml-2">{volume}%</span>
        </div>
      </div>
      
      {/* Status bar */}
      <div className="px-4 pb-2">
        <div className="text-xs flex justify-between">
          <span>Total Play: {isPlaying ? "Playing" : "Stopped"}</span>
          <span>Track: {tracks[selectedTrack].duration}</span>
        </div>
      </div>
    </div>
  );
};

export default CDPlayer;
