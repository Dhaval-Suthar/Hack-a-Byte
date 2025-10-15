"use client";

import React, { useState, useRef, useEffect } from "react";
import { logger } from '@/lib/logger';

interface Track {
  artist: string;
  title: string;
  duration: string;
  audioFile: string;
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
        const cdPlayerSettings = UserPreferences.getAppData('cdplayer', null) as { volume?: number; lastTrack?: number } | null;
        
        if (cdPlayerSettings) {
          if (cdPlayerSettings.volume !== undefined) setVolume(cdPlayerSettings.volume);
          if (cdPlayerSettings.lastTrack !== undefined) setSelectedTrack(cdPlayerSettings.lastTrack);
        }
      } catch (error) {
        logger.error('Error loading CD Player preferences:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      }
    };
    
    loadPreferences();
  }, []);
  
  const tracks: Track[] = React.useMemo(() => [
    { 
      artist: "Pet Shop Boys", 
      title: "West End Girls", 
      duration: "03:55", 
      audioFile: "/hackbook-W95/sounds/music/west-end-girls.mp3" // Temporary for testing
    },
    { 
      artist: "Depeche Mode", 
      title: "Just Can't Get Enough", 
      duration: "03:45", 
      audioFile: "/hackbook-W95/sounds/music/just-cant-get-enough.mp3" // Temporary for testing
    },
    { 
      artist: "New Order", 
      title: "Blue Monday", 
      duration: "07:29", 
      audioFile: "/hackbook-W95/sounds/music/blue-monday.mp3" // Temporary for testing
    }
  ], []);
  
  // Handle audio element updates and playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Always update src and load when track changes
    audio.src = tracks[selectedTrack].audioFile;
    audio.load();
    // Always set volume
    audio.volume = volume / 100;

    const handleCanPlay = () => {
    };
    const handleError = () => {
    };
    const updateTime = () => {
      if (!audio) return;
      const minutes = Math.floor(audio.currentTime / 60);
      const seconds = Math.floor(audio.currentTime % 60);
      setCurrentTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('timeupdate', updateTime);

    if (isPlaying) {
      audio.play().catch(err => {
        logger.error('Failed to play audio:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
        setIsPlaying(false);
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('timeupdate', updateTime);
    };
  }, [isPlaying, selectedTrack, tracks, volume]);
  
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
        src={tracks[selectedTrack].audioFile} 
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
