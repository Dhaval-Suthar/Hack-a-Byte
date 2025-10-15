"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logger } from '@/lib/logger';

interface Photo {
  id: string;
  url: string;
  name: string;
  date: Date;
  location?: string;
  type?: 'photo' | 'video';
}

interface EnhancedGalleryAppProps {
  onOpenCamera?: () => void;
  onClose?: () => void;
  time?: Date;
}

const EnhancedGalleryApp: React.FC<EnhancedGalleryAppProps> = ({ onOpenCamera, onClose }) => {
  // Demo photos
  const DEMO_PHOTOS = React.useMemo<Photo[]>(() => [
    {
      id: "demo1",
      url: "/hackphone/gallery/wallpaper1.jpg",
      name: "Wallpaper 1",
      date: new Date(2024, 7, 15, 18, 30),
      location: "Malibu Beach"
    },
    {
      id: "demo2",
      url: "/hackphone/gallery/wallpaper2.jpg",
      name: "Wallpaper 2",
      date: new Date(2024, 7, 14, 20, 45),
      location: "Downtown"
    },
    {
      id: "demo3",
      url: "/hackphone/gallery/wallpaper3.jpg",
      name: "Wallpaper 3",
      date: new Date(2024, 7, 13, 14, 20),
      location: "Rocky Mountains"
    },
    {
      id: "demo4",
      url: "/hackphone/gallery/wallpaper1.jpg",
      name: "Wallpaper 1",
      date: new Date(2024, 7, 12, 19, 15)
    },
    {
      id: "demo5",
      url: "/hackphone/gallery/wallpaper2.jpg",
      name: "Wallpaper 2",
      date: new Date(2024, 7, 11, 16, 30),
      location: "Central Park"
    },
    {
      id: "demo6",
      url: "/hackphone/gallery/wallpaper3.jpg",
      name: "Wallpaper 3",
      date: new Date(2024, 7, 10, 12, 0)
    }
  ], []);

  // States
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'fullscreen'>('grid');
  // Selection / bulk delete state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  // Keep track of demo photos the user removed so they stay removed across sessions
  const [deletedDemoIds, setDeletedDemoIds] = useState<string[]>([]);

  // Selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const clearSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  // Handle bulk photo deletion
  const handleDeleteSelected = () => {
    // Delete both user photos and demo photos selected
    const deletableUser = selectedIds.filter(id => !id.startsWith('demo'));
    const deletableDemo = selectedIds.filter(id => id.startsWith('demo'));

    // Update deleted demo list
    const updatedDeletedDemo = Array.from(new Set([...deletedDemoIds, ...deletableDemo]));
    if (deletableDemo.length > 0) {
      setDeletedDemoIds(updatedDeletedDemo);
      localStorage.setItem('hackphone_deleted_demo_ids', JSON.stringify(updatedDeletedDemo));
    }

    const updatedPhotos = photos.filter(photo => ![...deletableUser, ...deletableDemo].includes(photo.id));
    setPhotos(updatedPhotos);

    // Save remaining user photos
    const userPhotos = updatedPhotos.filter(photo => !photo.id.startsWith('demo'));
    localStorage.setItem('hackphone_photos', JSON.stringify(userPhotos));

    try { window.dispatchEvent(new Event('hackphone_photos_updated')); } catch (e) { logger.warn("Event dispatch failed", { error: e instanceof Error ? e.message : "Unknown error", errorObject: e }); }

    setSelectedIds([]);
    setSelectionMode(false);
    setIsBulkDeleting(false);
  };

  // Load photos from localStorage and merge with demo photos
  const loadPhotos = useCallback(() => {
    const savedPhotos = localStorage.getItem('hackphone_photos');
    const userPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
    const savedDeletedDemo = localStorage.getItem('hackphone_deleted_demo_ids');
    const parsedDeletedDemo: string[] = savedDeletedDemo ? JSON.parse(savedDeletedDemo) : [];
    setDeletedDemoIds(parsedDeletedDemo);

    const processedUserPhotos = userPhotos.map((item: Partial<Photo>) => ({
      id: item.id || `item_${Date.now()}`,
      url: item.url || '',
      name: item.name || 'Photo',
      date: new Date(item.date || Date.now()),
      location: item.location,
      type: item.type || 'photo'
    }));

    // Filter out deleted demo photos
    const filteredDemoPhotos = DEMO_PHOTOS.filter(dp => !parsedDeletedDemo.includes(dp.id));
    
    // Combine and sort by date, newest first
    const allPhotos = [...processedUserPhotos, ...filteredDemoPhotos].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    setPhotos(allPhotos);
  }, [DEMO_PHOTOS]);

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
    
    // Handle photo updates from other components
    const handlePhotoUpdate = () => {
      loadPhotos();
    };
    
    window.addEventListener('hackphone_photos_updated', handlePhotoUpdate);
    
    return () => {
      window.removeEventListener('hackphone_photos_updated', handlePhotoUpdate);
    };
  }, [loadPhotos]);

  // Format date helper functions
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  // Handle single photo deletion
  const handleDeletePhoto = (id: string) => {
    // Check if it's a demo photo
    if (id.startsWith('demo')) {
      const updatedDeletedDemo = [...deletedDemoIds, id];
      setDeletedDemoIds(updatedDeletedDemo);
      localStorage.setItem('hackphone_deleted_demo_ids', JSON.stringify(updatedDeletedDemo));
    } else {
      // It's a user photo, update localStorage
      const updatedPhotos = photos.filter(p => p.id !== id).filter(p => !p.id.startsWith('demo'));
      localStorage.setItem('hackphone_photos', JSON.stringify(updatedPhotos));
    }

    // Update UI
    setPhotos(prev => prev.filter(p => p.id !== id));
    setViewMode('grid');
    setSelectedPhoto(null);
    setIsDeleting(false);
    
    try { window.dispatchEvent(new Event('hackphone_photos_updated')); } catch (e) { logger.warn("Event dispatch failed", { error: e instanceof Error ? e.message : "Unknown error", errorObject: e }); }
  };

  // Render fullscreen view
  if (viewMode === 'fullscreen' && selectedPhoto) {
    return (
      <div className="w-full h-full bg-black flex flex-col">
        {/* iOS 4 style top bar */}
        <div className="bg-gradient-to-b from-gray-700 to-gray-900 border-b border-gray-600/50">
          <div className="flex items-center justify-between px-4 py-2.5">
            <button 
              onClick={() => {setViewMode('grid'); setSelectedPhoto(null);}}
              className="text-white flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-400 text-sm font-medium">Photos</span>
            </button>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {/* Share functionality */}}
                className="w-9 h-9 bg-gradient-to-b from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 active:from-gray-700 active:to-gray-900 rounded-md flex items-center justify-center shadow-md border border-gray-500/30 transition-all"
              >
                <span className="text-white text-sm">📤</span>
              </button>
              <button 
                onClick={() => setIsDeleting(true)}
                className="w-9 h-9 bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:from-red-700 active:to-red-900 rounded-md flex items-center justify-center shadow-md border border-red-500/30 transition-all"
              >
                <span className="text-white text-sm">🗑️</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full screen photo/video with iOS 4 style */}
        <div className="flex-1 flex items-center justify-center relative bg-black">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPhoto.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-full max-h-full"
            >
              { (selectedPhoto.url.startsWith('data:') || selectedPhoto.url.startsWith('/')) ? (
                selectedPhoto.type === 'video' ? (
                  <video 
                    src={selectedPhoto.url} 
                    controls
                    className="max-w-full max-h-full object-contain"
                    playsInline
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={selectedPhoto.url} 
                    alt={selectedPhoto.name}
                    className="max-w-full max-h-full object-contain"
                  />
                )
              ) : null }
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Photo info - iOS 4 style */}
        <div className="p-3 bg-gradient-to-b from-gray-900 to-black border-t border-gray-700/50">
          <div className="text-white">
            <p className="font-medium text-sm">{selectedPhoto.name}</p>
            <p className="text-xs text-gray-300 mt-0.5">
              {formatDate(selectedPhoto.date)} at {formatTime(selectedPhoto.date)}
              {selectedPhoto.location && ` • ${selectedPhoto.location}`}
            </p>
          </div>
        </div>

        {/* Delete confirmation - iOS 4 style alert */}
        <AnimatePresence>
          {isDeleting && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-md shadow-2xl m-4 max-w-xs w-full border border-gray-300/50"
              >
                <div className="p-4 text-center">
                  <h3 className="text-base font-bold text-gray-900 mb-2">Delete Photo?</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    This photo will be permanently deleted.
                  </p>
                </div>
                <div className="border-t border-gray-300/70">
                  <div className="flex">
                    <button
                      onClick={() => setIsDeleting(false)}
                      className="flex-1 py-2.5 text-blue-600 font-bold text-sm text-center border-r border-gray-300/70 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeletePhoto(selectedPhoto.id)}
                      className="flex-1 py-2.5 text-red-600 font-bold text-sm text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Main grid view
  return (
    <div className="w-full h-full bg-black flex flex-col font-[Helvetica]">
      {/* iOS 4 status bar */}
      <div className="bg-gradient-to-b from-black to-gray-900/90 h-5 border-b border-gray-700/30 px-2 flex justify-between items-center">
        <div className="text-white text-[10px] font-medium">
          {new Date().getHours()}:{String(new Date().getMinutes()).padStart(2, '0')}
        </div>
        <div className="text-white text-[10px] font-medium">100%</div>
      </div>
      
      {/* Header - iOS 4 style */}
      <div className="bg-gradient-to-b from-gray-800 via-gray-850 to-gray-900 border-b border-gray-600/50 shadow">
        <div className="flex items-center justify-between px-3 py-2">
          {onClose && (
            <button 
              onClick={onClose} 
              className="text-blue-400 text-sm font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Back</span>
            </button>
          )}
          <h1 className="text-white text-lg font-bold tracking-tight">Photos</h1>
          <div className="flex items-center space-x-2">
            {/* Select / Refresh / Camera controls */}
            {!selectionMode ? (
              <>
                <button
                  onClick={() => setSelectionMode(true)}
                  className="w-8 h-8 bg-gradient-to-b from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 active:from-gray-700 active:to-gray-900 rounded-md flex items-center justify-center shadow-md border border-gray-500/30"
                  title="Select"
                >
                  <span className="text-white text-sm">✓</span>
                </button>
                <button 
                  onClick={() => { loadPhotos(); window.dispatchEvent(new Event('hackphone_photos_updated')); }}
                  className="w-8 h-8 bg-gradient-to-b from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 active:from-gray-700 active:to-gray-900 rounded-md flex items-center justify-center shadow-md border border-gray-500/30"
                >
                  <span className="text-white text-sm">🔄</span>
                </button>
                <button 
                 onClick={onOpenCamera}
                 className="w-8 h-8 bg-gradient-to-b from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 active:from-gray-700 active:to-gray-900 rounded-md flex items-center justify-center shadow-md border border-gray-500/30"
               >
                 <span className="text-white text-sm">📷</span>
               </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => clearSelection()}
                  className="w-8 h-8 bg-gradient-to-b from-gray-600 to-gray-800 hover:from-gray-500 hover:to-gray-700 active:from-gray-700 active:to-gray-900 rounded-md flex items-center justify-center shadow-md border border-gray-500/30"
                  title="Cancel selection"
                >
                  <span className="text-white text-sm">✖️</span>
                </button>
                <button
                  onClick={() => setIsBulkDeleting(true)}
                  disabled={selectedIds.length === 0}
                  className={`w-8 h-8 ${selectedIds.length === 0 
                    ? 'bg-gradient-to-b from-gray-600 to-gray-700 opacity-60'
                    : 'bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:from-red-700 active:to-red-900'
                  } rounded-md flex items-center justify-center shadow-md border ${selectedIds.length === 0 ? 'border-gray-500/30' : 'border-red-500/30'} transition-all`}
                  title="Delete selected"
                >
                  <span className="text-white text-xs">🗑️</span>
                </button>
                {selectedIds.length > 0 && (
                  <div className="text-white text-xs pl-1">{selectedIds.length}</div>
                )}
              </>
            )}
           </div>
         </div>
       </div>

       {/* Photos count - iOS 4 style */}
       <div className="px-3 py-2 bg-gradient-to-b from-gray-850 to-black border-b border-gray-700/30">
         <p className="text-gray-300 text-xs font-medium">
           {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
         </p>
       </div>

       {/* Photo grid - iOS 4 style */}
       <div className="flex-1 overflow-y-auto bg-black">
         <AnimatePresence>
           {photos.length === 0 ? (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex-1 flex items-center justify-center p-8"
             >
               <div className="text-center text-white">
                 <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-b from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-xl border border-gray-500/30">
                   <span className="text-4xl">📷</span>
                 </div>
                 <h2 className="text-lg font-semibold mb-3 tracking-tight">No Photos</h2>
                 <p className="text-gray-400 mb-6 text-sm leading-relaxed">
                   Take photos using the Camera app.
                 </p>
                 <button
                   onClick={onOpenCamera}
                   className="bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 px-6 py-2 rounded-md text-white text-sm font-bold shadow-lg border border-blue-400/30 transition-all"
                 >
                   Take Photo
                 </button>
               </div>
             </motion.div>
           ) : (
             <div className="grid grid-cols-3 gap-px p-px bg-gray-900">
               {photos.map((photo, index) => (
                <motion.button
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  onClick={() => {
                    if (selectionMode) { toggleSelect(photo.id); return; }
                    setSelectedPhoto(photo);
                    setViewMode('fullscreen');
                  }}
                  className={`aspect-square relative bg-black active:opacity-70 transition-opacity ${
                    selectionMode && selectedIds.includes(photo.id) ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                   {(photo.url.startsWith('data:') || photo.url.startsWith('/')) ? (
                     <div className="relative w-full h-full">
                       {photo.type === 'video' ? (
                         <>
                           <video 
                             src={photo.url} 
                             className="w-full h-full object-cover"
                             muted
                           />
                           {/* iOS 4 style video indicator */}
                           <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-[1px] rounded px-1 py-0.5">
                             <span className="text-white text-[8px] font-medium">VIDEO</span>
                           </div>
                         </>
                       ) : (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img 
                           src={photo.url} 
                           alt={photo.name}
                           className="w-full h-full object-cover"
                         />
                       )}
                     </div>
                   ) : null }
                  
                  {/* iOS 4 style selection checkbox */}
                  {selectionMode && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-sm border border-white/80 bg-black/50 flex items-center justify-center shadow">
                      {selectedIds.includes(photo.id) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  )}
                 </motion.button>
               ))}
             </div>
           )}
         </AnimatePresence>
       </div>
      
      {/* Bulk delete confirmation - iOS 4 style alert */}
      <AnimatePresence>
        {isBulkDeleting && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-md shadow-2xl m-4 max-w-xs w-full border border-gray-300/50"
            >
              <div className="p-4 text-center">
                <h3 className="text-base font-bold text-gray-900 mb-2">Delete {selectedIds.length} Photos?</h3>
                <p className="text-gray-700 text-sm mb-3">
                  These photos will be permanently deleted.</p>
              </div>
              <div className="border-t border-gray-300/70">
                <div className="flex">
                  <button
                    onClick={() => setIsBulkDeleting(false)}
                    className="flex-1 py-2.5 text-blue-600 font-bold text-sm text-center border-r border-gray-300/70 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteSelected()}
                    className="flex-1 py-2.5 text-red-600 font-bold text-sm text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS 4 bottom toolbar */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 border-t border-gray-700/50 h-[44px] flex items-center justify-around px-2">
        <button className="w-full py-2 text-center opacity-50">
          <div className="flex flex-col items-center">
            <span className="text-white text-[10px]">Photos</span>
            <div className="w-2 h-2 bg-white rounded-full mt-1"></div>
          </div>
        </button>
        <button className="w-full py-2 text-center opacity-30">
          <div className="flex flex-col items-center">
            <span className="text-white text-[10px]">Places</span>
          </div>
        </button>
        <button className="w-full py-2 text-center opacity-30">
          <div className="flex flex-col items-center">
            <span className="text-white text-[10px]">Albums</span>
          </div>
        </button>
      </div>
     </div>
   );
 };

 export default EnhancedGalleryApp;