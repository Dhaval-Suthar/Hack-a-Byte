"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';

interface EnhancedCameraAppProps {
  onClose: () => void;
  onOpenGallery?: () => void;
  time?: Date;
}

const EnhancedCameraApp: React.FC<EnhancedCameraAppProps> = ({ onClose, onOpenGallery }) => {
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
  
  // Flash animation state
  const [showFlashAnimation, setShowFlashAnimation] = useState(false);

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

  // Initialize camera on mount
  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        // Check if camera access is available
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          setIsStreaming(true);
        }
        
      } catch (err) {
        logger.error('Error accessing camera:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
        setHasPermission(false);
      }
    };

    setupCamera();
    updateLatestPhotoThumbnail();

    // Handle window visibility change to refresh the latest photo
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLatestPhotoThumbnail();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleCustomEvent = () => {
      updateLatestPhotoThumbnail();
    };

    window.addEventListener('hackphone_photos_updated', handleCustomEvent);

    return () => {
      // Clean up camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('hackphone_photos_updated', handleCustomEvent);
      
      // Clear recording timer if active
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [facingMode, updateLatestPhotoThumbnail]);

  // Handle photo capture
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isStreaming || isCapturing) {
      return;
    }
    
    setIsCapturing(true);
    setShowFlashAnimation(true);
    
    setTimeout(() => {
      if (!videoRef.current || !canvasRef.current) {
        setIsCapturing(false);
        setShowFlashAnimation(false);
        return;
      }
      
      try {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video aspect ratio
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Draw the current video frame to the canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          // Save photo to localStorage
          const photo = {
            id: `photo_${Date.now()}`,
            url: dataUrl,
            name: `Photo ${new Date().toLocaleDateString()}`,
            date: new Date().toISOString(),
            type: 'photo'
          };
          
          const savedPhotos = localStorage.getItem('hackphone_photos');
          const existingPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
          
          const updatedPhotos = [photo, ...existingPhotos];
          localStorage.setItem('hackphone_photos', JSON.stringify(updatedPhotos));
          
          // Update the latest media state
          setLatestMedia({ url: dataUrl, type: 'photo' });
          
          // Notify that photos have been updated
          try {
            window.dispatchEvent(new Event('hackphone_photos_updated'));
          } catch (e) {
            logger.warn("Event dispatch failed", { error: e instanceof Error ? e.message : "Unknown error", errorObject: e });
          }
        }
      } catch (err) {
        logger.error('Error capturing photo:', { error: err instanceof Error ? err.message : 'Unknown error' }, err as Error);
      }
      
      // Reset capturing state after small delay
      setTimeout(() => {
        setIsCapturing(false);
        setShowFlashAnimation(false);
      }, 300);
    }, 100);
  }, [isStreaming, isCapturing]);

  // Start video recording
  const startVideoRecording = useCallback(() => {
    if (!videoRef.current || !isStreaming || isRecording) {
      return;
    }
    
    const stream = videoRef.current.srcObject as MediaStream;
    if (!stream) return;
    
    try {
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
      
    } catch (error) {
      logger.error('Error starting recording:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
    }
  }, [isRecording, updateLatestPhotoThumbnail, isStreaming]);

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

  // Handle capture button press based on mode
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
  }, [cameraMode, isRecording, capturePhoto, stopVideoRecording, startVideoRecording]);

  // Switch between front and back camera
  const switchCamera = useCallback(() => {
    if (!isStreaming || isRecording) return;
    
    // Stop current stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Toggle facing mode
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [isStreaming, isRecording]);

  // Show permission denied screen
  if (hasPermission === false) {
    return (
      <div className="w-full h-full bg-black flex flex-col items-center justify-center px-6 py-12">
        <div className="w-20 h-20 rounded-full bg-gradient-to-b from-gray-700 to-gray-800 flex items-center justify-center mb-6">
          <span className="text-4xl">📷</span>
        </div>
        <h2 className="text-white text-2xl font-bold mb-4 text-center">Camera Access Denied</h2>
        <p className="text-gray-400 text-center mb-8">
          Please allow camera access in your browser settings to use this feature.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 bg-gray-700 text-white rounded-full font-medium"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      {/* iOS 4 inspired status bar */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-gray-800 to-gray-900 text-white py-1 px-3 flex justify-between items-center shadow-md border-b border-gray-700/50 h-7">
        <div className="text-xs font-medium flex items-center">
          <span className="mr-2">AT&T</span>
          <div className="w-12 h-3 relative">
            <div className="absolute inset-0 bg-gray-700 rounded-sm"></div>
            <div className="absolute inset-y-0 left-0 bg-white rounded-sm" style={{ width: '70%' }}></div>
          </div>
        </div>
        <div className="text-xs font-medium">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-xs font-medium">
          <div className="h-3 w-4 relative">
            <div className="absolute bottom-0 left-0 w-1 h-1 bg-white rounded-sm"></div>
            <div className="absolute bottom-0 left-1.5 w-1 h-1.5 bg-white rounded-sm"></div>
            <div className="absolute bottom-0 left-3 w-1 h-2 bg-white rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* Video preview */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        onCanPlay={() => setIsStreaming(true)}
        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />
      
      {/* iOS 4 style camera interface overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Flash animation */}
        <AnimatePresence>
          {showFlashAnimation && (
            <motion.div 
              className="absolute inset-0 bg-white z-50"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          )}
        </AnimatePresence>
        
        {/* Top controls */}
        <div className="absolute top-8 left-0 right-0 flex justify-between items-center p-3">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={onClose}
            className="bg-black/50 backdrop-blur-[2px] rounded-md px-3 py-1.5 border border-white/20"
          >
            <span className="text-white text-sm font-medium">Cancel</span>
          </motion.button>
          
          {/* Recording indicator */}
          <AnimatePresence>
            {cameraMode === 'video' && isRecording && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center space-x-2 bg-red-600/90 backdrop-blur-[2px] rounded-md px-3 py-1.5 border border-red-400/50"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium tabular-nums">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center space-x-3">
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setIsFlashOn(!isFlashOn)}
              className={`w-9 h-9 rounded-md backdrop-blur-[2px] flex items-center justify-center border ${
                isFlashOn 
                  ? 'bg-yellow-500/90 border-yellow-400/50' 
                  : 'bg-black/50 border-white/20'
              }`}
            >
              <span className="text-white text-base">⚡</span>
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              onClick={switchCamera}
              className="w-9 h-9 rounded-md bg-black/50 backdrop-blur-[2px] flex items-center justify-center border border-white/20"
              disabled={!isStreaming || isRecording}
            >
              <span className="text-white text-base">🔄</span>
            </motion.button>
          </div>
        </div>

        {/* iOS 4 style camera grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-l border-b border-white/20"></div>
            <div className="border-l border-b border-white/20"></div>
            <div className="border-r border-t border-b border-white/20"></div>
            <div className="border-r border-l border-t border-b border-white/20"></div>
            <div className="border-l border-t border-b border-white/20"></div>
            <div className="border-r border-t border-white/20"></div>
            <div className="border-r border-l border-t border-white/20"></div>
            <div className="border-l border-t border-white/20"></div>
          </div>
        </div>

        {/* Bottom controls - iOS 4 style */}
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-black/70"
        >
          {/* Mode selector */}
          <div className="flex justify-center pt-3 pb-5">
            <div className="flex bg-gray-800/60 backdrop-blur-[2px] rounded-md border border-gray-700/50 p-0.5">
              <button
                onClick={() => setCameraMode('photo')}
                className={`px-5 py-2 rounded text-xs font-bold transition-all duration-200 ${
                  cameraMode === 'photo' 
                    ? 'bg-gradient-to-b from-gray-600 to-gray-700 border border-gray-500/60 text-white shadow' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Photo
              </button>
              <button
                onClick={() => setCameraMode('video')}
                className={`px-5 py-2 rounded text-xs font-bold transition-all duration-200 ${
                  cameraMode === 'video' 
                    ? 'bg-gradient-to-b from-gray-600 to-gray-700 border border-gray-500/60 text-white shadow' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Video
              </button>
            </div>
          </div>

          {/* Capture controls */}
          <div className="flex items-center justify-between px-6 pb-6">
            {/* Gallery thumbnail - iOS 4 style with inset shadow and border */}
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              onClick={() => onOpenGallery?.()}
              className="w-12 h-12 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_inset_0_-1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-transform"
            >
              {latestMedia ? (
                latestMedia.type === 'video' ? (
                  <div className="relative w-full h-full bg-black/10 rounded-md overflow-hidden">
                    {latestMedia.thumbUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={latestMedia.thumbUrl} alt="Latest video thumbnail" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/70">🎥</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white text-lg drop-shadow-lg">▶️</span>
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latestMedia.url}
                    alt="Latest photo"
                    className="w-full h-full object-cover rounded-md"
                  />
                )
              ) : (
                <span className="text-white text-xl">🖼️</span>
              )}
            </motion.button>
            
            {/* Capture button - iOS 4 style with inset shadow and glossy effect */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 20 }}
              onClick={handleCaptureButton}
              disabled={!isStreaming || isCapturing}
              className="relative w-18 h-18 active:scale-95 transition-transform disabled:opacity-50"
            >
              {/* iOS 4 style glossy capture button */}
              <div className={`w-16 h-16 rounded-full relative overflow-hidden ${
                cameraMode === 'video' && isRecording 
                  ? 'bg-red-600' 
                  : cameraMode === 'video'
                  ? 'bg-red-500'
                  : 'bg-white'
              }`}>
                {/* Glossy highlight overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-black/30"></div>
                
                {/* Border effect */}
                <div className="absolute inset-0 rounded-full border border-gray-400/30"></div>
                
                {/* Inner shadow */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_2px_3px_rgba(0,0,0,0.3)]"></div>
                
                {/* Recording indicator square */}
                {cameraMode === 'video' && isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 bg-white rounded"></div>
                  </div>
                )}
              </div>
            </motion.button>
            
            {/* Options */}
            <motion.button 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="w-12 h-12 rounded-md bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),_inset_0_-1px_2px_rgba(0,0,0,0.2)] active:scale-95 transition-transform"
            >
              <span className="text-white text-xl">⚙️</span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Hidden canvas for photo capture */}
      <canvas
        ref={canvasRef}
        className="hidden"
      />
    </div>
  );
};

export default EnhancedCameraApp;