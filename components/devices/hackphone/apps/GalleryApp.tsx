"use client";

import React, { useState, useEffect, useCallback } from "react";
import { logger } from '@/lib/logger';

interface Photo {
  id: string;
  url: string;
  name: string;
  date: Date;
  location?: string;
  type?: 'photo' | 'video';
}
interface GalleryAppProps {
  onOpenCamera?: () => void;
  time?: Date;
}

const GalleryApp: React.FC<GalleryAppProps> = ({ onOpenCamera }) => {

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

  const loadPhotos = useCallback(() => {
    const savedPhotos = localStorage.getItem('hackphone_photos');
    const userPhotos = savedPhotos ? JSON.parse(savedPhotos) : [];
    const savedDeletedDemo = localStorage.getItem('hackphone_deleted_demo_ids');
    const parsedDeletedDemo: string[] = savedDeletedDemo ? JSON.parse(savedDeletedDemo) : [];
    setDeletedDemoIds(parsedDeletedDemo);

    const processedUserPhotos = userPhotos.map((item: Partial<Photo>) => ({
      id: item.id || `item_${Date.now()}`,
      url: item.url || '',
      name: item.name || 'Untitled',
      date: new Date(item.date || Date.now()),
      location: item.location,
      type: item.type || 'photo'
    }));

    const visibleDemos = DEMO_PHOTOS.filter(d => !parsedDeletedDemo.includes(d.id));
    const allPhotos = [...visibleDemos, ...processedUserPhotos].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    setPhotos(allPhotos);
  }, [DEMO_PHOTOS]);

  // Load photos from localStorage and combine with demo photos
  useEffect(() => { loadPhotos(); }, [loadPhotos]);

  // status bar removed

  const handleDeletePhoto = (photoId: string) => {
    // Allow deleting both user photos and demo photos.
    if (photoId.startsWith('demo')) {
      // mark demo as deleted so it's filtered out on future loads
      const updatedDeleted = Array.from(new Set([...deletedDemoIds, photoId]));
      setDeletedDemoIds(updatedDeleted);
      localStorage.setItem('hackphone_deleted_demo_ids', JSON.stringify(updatedDeleted));

      const updatedPhotos = photos.filter(photo => photo.id !== photoId);
      setPhotos(updatedPhotos);
      try { window.dispatchEvent(new Event('hackphone_photos_updated')); } catch (e) { logger.warn("Event dispatch failed", { error: e instanceof Error ? e.message : "Unknown error", errorObject: e }); }
      setSelectedPhoto(null);
      setIsDeleting(false);
      return;
    }

    // user photo deletion
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(updatedPhotos);

    // Save to localStorage only user photos
    const userPhotos = updatedPhotos.filter(photo => !photo.id.startsWith('demo'));
    localStorage.setItem('hackphone_photos', JSON.stringify(userPhotos));

    // Notify other components (e.g. Camera) to refresh thumbnails
    try { window.dispatchEvent(new Event('hackphone_photos_updated')); } catch (e) { logger.warn("Event dispatch failed", { error: e instanceof Error ? e.message : "Unknown error", errorObject: e }); }

    setSelectedPhoto(null);
    setIsDeleting(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (selectedPhoto && viewMode === 'fullscreen') {
    return (
      <div className="w-full h-full bg-black flex flex-col font-[Helvetica]">
        
        {/* Photo viewer header - iPhone 4 style */}
        <div className="bg-gradient-to-b from-black/90 via-black/80 to-transparent backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            {/* back to grid - handled internally, does not close app */}
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {/* Share functionality */}}
                className="w-10 h-10 bg-gray-600/80 hover:bg-gray-500/80 active:bg-gray-700/80 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-gray-500/30 transition-all"
              >
                <span className="text-white text-lg">📤</span>
              </button>
              <button 
                onClick={() => setIsDeleting(true)}
                className="w-10 h-10 bg-red-600/80 hover:bg-red-500/80 active:bg-red-700/80 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-red-500/30 transition-all"
              >
                <span className="text-white text-lg">🗑️</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full screen photo/video */}
        <div className="flex-1 flex items-center justify-center relative">
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
        </div>

        {/* Photo info */}
        <div className="p-4 bg-black/50 backdrop-blur-sm">
          <div className="text-white">
            <p className="font-medium">{selectedPhoto.name}</p>
            <p className="text-sm opacity-75">
              {formatDate(selectedPhoto.date)} at {formatTime(selectedPhoto.date)}
            </p>
            {selectedPhoto.location && (
              <p className="text-sm opacity-75">📍 {selectedPhoto.location}</p>
            )}
          </div>
        </div>

        {/* Delete confirmation - iPhone 4 style */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl shadow-2xl m-4 max-w-xs w-full border border-gray-300/50">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">🗑️</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Photo</h3>
                <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                  This photo will be permanently deleted from your device.
                </p>
              </div>
              <div className="border-t border-gray-300/70">
                <div className="flex">
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 py-3 text-blue-600 font-semibold text-center border-r border-gray-300/70 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(selectedPhoto.id)}
                    className="flex-1 py-3 text-red-600 font-semibold text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black flex flex-col font-[Helvetica]">
      
      {/* Header - iPhone 4 style */}
      <div className="bg-gradient-to-b from-gray-800 via-gray-900 to-black border-b border-gray-600/50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Done removed per UX: keep user inside Photos */}
          <h1 className="text-white text-xl font-semibold tracking-tight">Photos</h1>
          <div className="flex items-center space-x-2">
            {/* Select / Refresh / Camera controls */}
            {!selectionMode ? (
              <>
                <button
                  onClick={() => setSelectionMode(true)}
                  className="w-9 h-9 bg-gray-600 hover:bg-gray-500 active:bg-gray-700 rounded-lg flex items-center justify-center shadow-md border border-gray-500/30 transition-all"
                  title="Select"
                >
                  <span className="text-white text-lg">✅</span>
                </button>
                <button 
                  onClick={() => { loadPhotos(); window.dispatchEvent(new Event('hackphone_photos_updated')); }}
                  className="w-9 h-9 bg-gray-600 hover:bg-gray-500 active:bg-gray-700 rounded-lg flex items-center justify-center shadow-md border border-gray-500/30 transition-all"
                >
                  <span className="text-white text-lg">🔄</span>
                </button>
                <button 
                 onClick={onOpenCamera}
                 className="w-9 h-9 bg-gray-600 hover:bg-gray-500 active:bg-gray-700 rounded-lg flex items-center justify-center shadow-md border border-gray-500/30 transition-all"
               >
                 <span className="text-white text-lg">📷</span>
               </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => clearSelection()}
                  className="w-9 h-9 bg-gray-600 hover:bg-gray-500 active:bg-gray-700 rounded-lg flex items-center justify-center shadow-md border border-gray-500/30 transition-all"
                  title="Cancel selection"
                >
                  <span className="text-white text-lg">✖️</span>
                </button>
                <button
                  onClick={() => setIsBulkDeleting(true)}
                  className="w-9 h-9 bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg flex items-center justify-center shadow-md border border-red-500/30 transition-all"
                  title="Delete selected"
                >
                  <span className="text-white text-sm font-semibold">🗑️</span>
                </button>
                <div className="text-white text-sm pl-2">{selectedIds.length} selected</div>
              </>
            )}
           </div>
         </div>
       </div>

       {/* Photos count - iPhone 4 style */}
       <div className="px-4 py-3 bg-gradient-to-b from-gray-900 to-black border-b border-gray-700/30">
         <p className="text-gray-300 text-sm font-medium">
           {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
         </p>
       </div>

       {/* Photo grid - iPhone 4 style */}
       <div className="flex-1 overflow-y-auto bg-black">
         {photos.length === 0 ? (
           <div className="flex-1 flex items-center justify-center p-8">
             <div className="text-center text-white">
               <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-b from-gray-600 to-gray-800 rounded-2xl flex items-center justify-center shadow-xl border border-gray-500/30">
                 <span className="text-4xl">📷</span>
               </div>
               <h2 className="text-xl font-semibold mb-3 tracking-tight">No Photos or Videos</h2>
               <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                 You can take photos and videos using the Camera, or sync photos from your computer.
               </p>
               <button
                 onClick={onOpenCamera}
                 className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 px-8 py-3 rounded-xl text-white font-semibold shadow-lg border border-blue-400/30 transition-all"
               >
                 Take Photo or Video
               </button>
             </div>
           </div>
         ) : (
           <div className="grid grid-cols-4 gap-1 p-2 bg-black">
             {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => {
                  if (selectionMode) { toggleSelect(photo.id); return; }
                  setSelectedPhoto(photo);
                  setViewMode('fullscreen');
                }}
                className={`aspect-square relative group bg-gray-900 rounded-lg overflow-hidden shadow-md border border-gray-700/50 active:scale-95 transition-transform ${selectionMode && selectedIds.includes(photo.id) ? 'ring-4 ring-blue-500/40' : ''}`}
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
                         <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                         <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                           <span className="text-white text-xs">▶️</span>
                         </div>
                         <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                           <span className="text-white text-xs font-medium">VIDEO</span>
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
                {/* Selection badge */}
                {selectionMode && (
                  <div className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white text-sm shadow-md">
                    {selectedIds.includes(photo.id) ? '✓' : ''}
                  </div>
                )}
                 <div className="absolute inset-0 group-active:bg-white/10 transition-colors duration-150" />
               </button>
             ))}
           </div>
         )}
       </div>
      
      {/* Bulk delete confirmation */}
      {isBulkDeleting && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-2xl shadow-2xl m-4 max-w-xs w-full border border-gray-300/50">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">🗑️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Selected Photos</h3>
              <p className="text-gray-700 text-sm mb-6 leading-relaxed">
                This will permanently delete the selected photos from your device.</p>
            </div>
            <div className="border-t border-gray-300/70">
              <div className="flex">
                <button
                  onClick={() => setIsBulkDeleting(false)}
                  className="flex-1 py-3 text-blue-600 font-semibold text-center border-r border-gray-300/70 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSelected()}
                  className="flex-1 py-3 text-red-600 font-semibold text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  Delete ({selectedIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 };

 export default GalleryApp;
