"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";

interface CameraAppProps {
  onClose: () => void;
  time: Date;
  onOpenGallery?: () => void;
}

const CameraApp: React.FC<CameraAppProps> = ({ onClose, time, onOpenGallery }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [latestMedia, setLatestMedia] = useState<{ url: string; type?: string; thumbUrl?: string | null } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to get the latest photo from localStorage
  const getLatestPhoto = useCallback(() => {
    const savedPhotos = localStorage.getItem('hackphone_photos');
    if (savedPhotos) {
      const photos = JSON.parse(savedPhotos);
      if (photos.length > 0) {
        // Return the most recent photo (first in array since they're stored newest first)
        return photos[0];
      }
    }
    return null;
  }, []);

  // Generate a thumbnail image for a video data URL
  const generateVideoThumbnail = useCallback(async (videoUrl: string) => {
    try {
      return await new Promise<string | null>((resolve) => {
        const video = document.createElement('video');
        video.src = videoUrl;
        video.crossOrigin = 'anonymous';
        video.muted = true;
        video.playsInline = true;

        const cleanup = () => {
          video.pause();
          video.src = '';
        };

        const onLoaded = () => {
          // Seek a tiny bit in to ensure frame is available
          try {
            video.currentTime = Math.min(0.1, Math.max(0, (video.duration || 0) * 0.01));
          } catch {
            // If seeking fails, proceed to draw on canplay
          }
        };

        const drawFrame = () => {
          try {
            const canvas = document.createElement('canvas');
            const w = 160;
            const h = Math.round((video.videoHeight / video.videoWidth) * w) || 120;
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            cleanup();
            resolve(dataUrl);
          } catch {
            cleanup();
            resolve(null);
          }
        };

        const onSeeked = () => drawFrame();
        const onCanPlay = () => {
          // If seeking isn't supported, draw on canplay
          setTimeout(() => {
            drawFrame();
          }, 50);
        };

        video.addEventListener('loadedmetadata', onLoaded);
        video.addEventListener('seeked', onSeeked);
        video.addEventListener('canplay', onCanPlay);
        video.addEventListener('error', () => resolve(null));

        // Start loading
        video.load();
      });
    } catch {
      return null;
    }
  }, []);

  // Update latest media (photo or video) for the thumbnail
  const updateLatestPhotoThumbnail = useCallback(() => {
    const latestPhoto = getLatestPhoto();
    if (!latestPhoto) {
      setLatestMedia(null);
      return;
    }

    if (latestPhoto.type === 'video') {
      // generate a small image thumbnail from the video
      generateVideoThumbnail(latestPhoto.url).then((thumb) => {
        setLatestMedia({ url: latestPhoto.url, type: latestPhoto.type, thumbUrl: thumb || null });
      });
    } else {
      setLatestMedia({ url: latestPhoto.url, type: latestPhoto.type, thumbUrl: null });
    }
  }, [getLatestPhoto, generateVideoThumbnail]);

  const initializeCamera = useCallback(async () => {
    console.log('Initializing camera with facing mode:', facingMode);
    
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // First try with specific constraints
      let stream;
      try {
        console.log('Requesting camera with constraints...');
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: true // Enable audio for video recording
        });
        console.log('Got stream with specific constraints');
      } catch (firstError) {
        console.warn('Failed with specific constraints, trying fallback:', firstError);
        // Fallback with basic video constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true // Enable audio for video recording
        });
        console.log('Got stream with fallback constraints');
      }
      
      const videoElement = videoRef.current;
      console.log('Video element:', videoElement);
      console.log('Stream:', stream);
      
      if (!videoElement) {
        console.error('Video element not found');
        setHasPermission(false);
        setIsStreaming(false);
        return;
      }
      
      if (!stream) {
        console.error('No stream available');
        setHasPermission(false);
        setIsStreaming(false);
        return;
      }
      
      console.log('Setting video source...');
      videoElement.srcObject = stream;
      
      // Wait for the video to be ready
      videoElement.onloadedmetadata = () => {
        console.log('Video metadata loaded');
        setIsStreaming(true);
        setHasPermission(true);
      };
      
      // Add more event listeners for debugging
      videoElement.oncanplay = () => {
        console.log('Video can play');
      };
      
      videoElement.onplaying = () => {
        console.log('Video is playing');
      };
      
      // Add error handler for video
      videoElement.onerror = (error) => {
        console.error('Video error:', error);
        setHasPermission(false);
        setIsStreaming(false);
      };
      
      // Handle video play
      try {
        console.log('Attempting to play video...');
        await videoElement.play();
        console.log('Video play successful');
      } catch (playError) {
        console.error('Play error:', playError);
        // Still set streaming as true if we got the stream
        setIsStreaming(true);
        setHasPermission(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasPermission(false);
      setIsStreaming(false);
    }
  }, [facingMode]);

  useEffect(() => {
    // Load initial thumbnail
    updateLatestPhotoThumbnail();
    
    // Small delay to ensure component is fully mounted
    const mountDelay = setTimeout(() => {
      console.log('Component mounted, checking video element...');
      console.log('Video element exists:', !!videoRef.current);
      if (videoRef.current) {
        console.log('Video element found, initializing camera...');
        initializeCamera();
      } else {
        console.error('Video element not found after mount delay');
        setHasPermission(false);
      }
    }, 200);
    
    const videoElement = videoRef.current;
    return () => {
      clearTimeout(mountDelay);
      
      // Cleanup: stop recording if active
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      
      // Cleanup: stop all tracks when component unmounts
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Separate effect for facingMode changes
  useEffect(() => {
    if (isStreaming) {
      console.log('Facing mode changed to:', facingMode);
      // Re-initialize camera when facing mode changes
      initializeCamera();
    }
  }, [facingMode, initializeCamera, isStreaming]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) return;
    
    setIsCapturing(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    
    // Save to localStorage directly
    const photo = {
      id: `photo_${Date.now()}`,
      url: dataUrl,
      name: `Photo ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
    };
    
    const savedPhotos = localStorage.getItem('hackphone_photos');
    const existingPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
    const updatedPhotos = [photo, ...existingPhotos];
    localStorage.setItem('hackphone_photos', JSON.stringify(updatedPhotos));
    
    console.log('Photo saved to gallery:', photo.name);
    
    // Update thumbnail with the new photo
    updateLatestPhotoThumbnail();
    
    // Camera shutter effect
    setTimeout(() => {
      setIsCapturing(false);
    }, 200);
  }, [isStreaming, updateLatestPhotoThumbnail]);

  const startVideoRecording = useCallback(() => {
    if (!videoRef.current?.srcObject || isRecording) return;
    
    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    
    const chunks: Blob[] = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        
        // Save video to localStorage
        const video = {
          id: `video_${Date.now()}`,
          url: dataUrl,
          name: `Video ${new Date().toLocaleDateString()}`,
          date: new Date().toISOString(),
          type: 'video'
        };
        
        const savedPhotos = localStorage.getItem('hackphone_photos');
        const existingPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
        const updatedPhotos = [video, ...existingPhotos];
        localStorage.setItem('hackphone_photos', JSON.stringify(updatedPhotos));
        
        console.log('Video saved to gallery:', video.name);
        
        // Update thumbnail with the new video
        updateLatestPhotoThumbnail();
      };
      reader.readAsDataURL(blob);
    };
    
    mediaRecorder.start();
    setIsRecording(true);
    setRecordingTime(0);
    
    // Start recording timer
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
  }, [isRecording, updateLatestPhotoThumbnail]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  }, [isRecording]);

  const handleCaptureButton = useCallback(() => {
    if (cameraMode === 'photo') {
      capturePhoto();
    } else {
      if (isRecording) {
        stopVideoRecording();
      } else {
        startVideoRecording();
      }
    }
  }, [cameraMode, isRecording, capturePhoto, startVideoRecording, stopVideoRecording]);

  const switchCamera = useCallback(async () => {
    // Stop current stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Switch facing mode and reinitialize
    setIsStreaming(false);
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Small delay to ensure cleanup
    setTimeout(() => {
      initializeCamera();
    }, 100);
  }, [facingMode, initializeCamera]);

  const renderStatusBar = () => (
    <div className="flex justify-between items-center px-4 pt-8 pb-2 text-white text-[11px] tracking-wide relative z-10">
      <div className="flex items-center space-x-2">
        <div className="flex items-end space-x-[2px]">
          <div className="w-[3px] h-[6px] bg-white rounded-[1px]" />
          <div className="w-[3px] h-[8px] bg-white rounded-[1px]" />
          <div className="w-[3px] h-[10px] bg-white rounded-[1px]" />
          <div className="w-[3px] h-[8px] bg-white/60 rounded-[1px]" />
          <div className="w-[3px] h-[6px] bg-white/40 rounded-[1px]" />
        </div>
        <span className="opacity-90">AT&T</span>
      </div>
      <div className="font-medium">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
      </div>
      <div className="flex items-center space-x-1">
        <span className="opacity-90">100%</span>
        <div className="w-6 h-3 border border-white/60 rounded-[1px] relative">
          <div className="absolute inset-[1px] bg-white rounded-[1px]" />
          <div className="absolute right-[-2px] top-[4px] w-[1px] h-[3px] bg-white rounded-[0.5px]" />
        </div>
      </div>
    </div>
  );


  if (hasPermission === false) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col">
        {renderStatusBar()}
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-xl font-medium mb-4">Camera Access Required</h2>
            <p className="text-gray-400 mb-6">
              Please allow camera access to take photos
            </p>
            <button
              onClick={initializeCamera}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black flex flex-col relative overflow-hidden font-[Helvetica]">
      {renderStatusBar()}
      
      {/* Camera viewfinder */}
      <div className="flex-1 relative bg-black">
        {/* Always render video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
        />
        
        {isStreaming ? (
          <>
            {/* Camera overlay effects - iPhone 4 style */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Rule of thirds grid lines */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-white shadow-sm" />
                <div className="absolute right-1/3 top-0 bottom-0 w-0.5 bg-white shadow-sm" />
                <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-white shadow-sm" />
                <div className="absolute bottom-1/3 left-0 right-0 h-0.5 bg-white shadow-sm" />
              </div>
              
              {/* Center focus square - iPhone 4 style */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-16 h-16 border border-white/70 shadow-lg">
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-white" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-white" />
                  <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-white" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-white" />
                </div>
              </div>
            </div>

            {/* Capture flash effect */}
            {isCapturing && (
              <div className="absolute inset-0 bg-white animate-pulse" />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
              <p className="mb-2">Starting camera...</p>
              {hasPermission === null && (
                <p className="text-sm text-gray-400">Requesting camera access...</p>
              )}
              <button
                onClick={() => {
                  console.log('Manual retry clicked');
                  console.log('Video ref current:', videoRef.current);
                  setHasPermission(null);
                  setIsStreaming(false);
                  initializeCamera();
                }}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded text-sm"
              >
                Retry
              </button>
              <button
                onClick={() => {
                  console.log('Debug info:');
                  console.log('videoRef.current:', videoRef.current);
                  console.log('hasPermission:', hasPermission);
                  console.log('isStreaming:', isStreaming);
                  console.log('facingMode:', facingMode);
                }}
                className="mt-2 px-4 py-2 bg-gray-500 text-white rounded text-sm"
              >
                Debug Info
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top controls - iPhone 4 style */}
      <div className="absolute top-6 left-0 right-0 flex justify-between items-start p-3">
        <button
          onClick={onClose}
          className="bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20"
        >
          <span className="text-white text-sm font-medium">Done</span>
        </button>
        
        {/* Recording indicator */}
        {cameraMode === 'video' && isRecording && (
          <div className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-red-400/50">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-sm font-medium tabular-nums">
              {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFlashOn(!isFlashOn)}
            className={`w-10 h-10 rounded-lg backdrop-blur-sm flex items-center justify-center border ${
              isFlashOn 
                ? 'bg-yellow-500/90 border-yellow-400/50' 
                : 'bg-black/40 border-white/20'
            }`}
          >
            <span className="text-white text-lg">⚡</span>
          </button>
          
          <button
            onClick={switchCamera}
            className="w-10 h-10 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20"
            disabled={!isStreaming || isRecording}
          >
            <span className="text-white text-lg">🔄</span>
          </button>
        </div>
      </div>

      {/* Bottom controls - iPhone 4 style */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/60 backdrop-blur-sm">
        {/* Mode selector */}
        <div className="flex justify-center pt-4 pb-6">
          <div className="flex bg-black/50 backdrop-blur-sm rounded-full p-1 border border-white/20 shadow-lg">
            <button
              onClick={() => setCameraMode('photo')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                cameraMode === 'photo' 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Photo
            </button>
            <button
              onClick={() => setCameraMode('video')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                cameraMode === 'video' 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-white/90 hover:text-white'
              }`}
            >
              Video
            </button>
          </div>
        </div>

        {/* Capture controls */}
        <div className="flex items-center justify-between px-8 pb-8">
          {/* Gallery thumbnail */}
          <button 
            onClick={() => {
              console.log('Opening gallery from camera');
              onOpenGallery?.();
            }}
            className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            {latestMedia ? (
              latestMedia.type === 'video' ? (
                <div className="relative w-full h-full bg-black/10 rounded-xl overflow-hidden">
                  {latestMedia.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={latestMedia.thumbUrl} alt="Latest video thumbnail" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/70">🎥</div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-xl drop-shadow-lg">▶️</span>
                  </div>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={latestMedia.url}
                  alt="Latest photo"
                  className="w-full h-full object-cover rounded-xl"
                />
              )
            ) : (
              <span className="text-white text-2xl">🖼️</span>
            )}
          </button>
          
          {/* Capture button - iPhone 4 style */}
          <button
            onClick={handleCaptureButton}
            disabled={!isStreaming || isCapturing}
            className="relative w-20 h-20 active:scale-95 transition-transform disabled:opacity-50"
          >
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-2xl" />
            
            {/* Inner button */}
            <div className={`absolute inset-2 rounded-full border-2 transition-all duration-200 ${
              cameraMode === 'video' && isRecording 
                ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/30' 
                : cameraMode === 'video'
                ? 'bg-red-500 border-red-300 shadow-lg shadow-red-500/20'
                : 'bg-white border-gray-300 shadow-lg'
            }`}>
              {cameraMode === 'video' && isRecording && (
                <div className="absolute inset-3 bg-white rounded-sm" />
              )}
            </div>
          </button>
          
          {/* Options */}
          <button className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition-transform">
            <span className="text-white text-2xl">⚙️</span>
          </button>
        </div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
};

export default CameraApp;
