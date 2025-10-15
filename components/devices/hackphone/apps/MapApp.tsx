"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import { logger } from '@/lib/logger';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface MapAppProps {
  time?: Date;
}

const MapApp: React.FC<MapAppProps> = ({}) => {
  const [userLocation, setUserLocation] = useState({ lat: 19.2307, lng: 72.8567 }); // Borivali West, Mumbai
  const [mapCenter, setMapCenter] = useState({ lat: 19.2307, lng: 72.8567 });
  const [zoomLevel, setZoomLevel] = useState(13);
  const [isLocating, setIsLocating] = useState(false);
  const [mapType, setMapType] = useState<"standard" | "satellite">("standard");
  const [currentLocationName, setCurrentLocationName] = useState("Borivali West, Mumbai");
  const mapRef = useRef<LeafletMap | null>(null);

  

  // Fix Leaflet default marker icons
  useEffect(() => {
    // Dynamically import leaflet only on the client to avoid SSR issues
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled) return;
      // Safely remove private _getIconUrl if present without using any
      const iconProto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
      if ("_getIconUrl" in iconProto) {
        delete iconProto._getIconUrl;
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Function to get location name from coordinates (reverse geocoding)
  const getLocationName = async (lat: number, lng: number) => {
    try {
      // Using OpenStreetMap Nominatim for reverse geocoding (free service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.address) {
        const { suburb, city, state, country } = data.address as {
          suburb?: string;
          city?: string;
          state?: string;
          country?: string;
        };
        const locationParts = [];
        
        if (suburb) locationParts.push(suburb);
        if (city) locationParts.push(city);
        if (state && !city) locationParts.push(state);
        if (!suburb && !city && !state && country) locationParts.push(country);
        
        return locationParts.length > 0 ? locationParts.join(", ") : "Unknown Location";
      }
      return "Unknown Location";
    } catch (error) {
      logger.error('Reverse geocoding error:', { error: error instanceof Error ? error.message : 'Unknown error' }, error as Error);
      return "Unknown Location";
    }
  };

  // Simulate getting user location
  const getCurrentLocation = useCallback(() => {
    setIsLocating(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          setMapCenter(newLocation);
          
          // Get location name
          const locationName = await getLocationName(newLocation.lat, newLocation.lng);
          setCurrentLocationName(locationName);
          
          setIsLocating(false);
          
          // Fly to the new location if map is available
          mapRef.current?.flyTo([newLocation.lat, newLocation.lng]);
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async (error) => {
          // Fallback to Borivali West, Mumbai
          const fallbackLocation = { lat: 19.2307, lng: 72.8567 };
          setUserLocation(fallbackLocation);
          setMapCenter(fallbackLocation);
          
          // Get location name for fallback location
          const locationName = await getLocationName(fallbackLocation.lat, fallbackLocation.lng);
          setCurrentLocationName(locationName);
          
          setIsLocating(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      // Simulate location request delay for browsers without geolocation
      setTimeout(async () => {
        const fallbackLocation = { lat: 19.2307, lng: 72.8567 };
        setUserLocation(fallbackLocation);
        setMapCenter(fallbackLocation);
        
        // Get location name for fallback location
        const locationName = await getLocationName(fallbackLocation.lat, fallbackLocation.lng);
        setCurrentLocationName(locationName);
        
        setIsLocating(false);
      }, 1500);
    }
  }, []);

  useEffect(() => {
    // Auto-locate on app open
    getCurrentLocation();
  }, [getCurrentLocation]);

  // Initialize location name on mount
  useEffect(() => {
    const initializeLocationName = async () => {
      const locationName = await getLocationName(userLocation.lat, userLocation.lng);
      setCurrentLocationName(locationName);
    };
    initializeLocationName();
  }, [userLocation]);

  // Handle zoom changes
  const handleZoomIn = () => {
    const newZoom = Math.min(18, zoomLevel + 1);
    setZoomLevel(newZoom);
    if (mapRef.current) {
      mapRef.current.setZoom(newZoom);
    }
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(1, zoomLevel - 1);
    setZoomLevel(newZoom);
    if (mapRef.current) {
      mapRef.current.setZoom(newZoom);
    }
  };

  // Get tile layer URL based on map type
  const getTileLayerUrl = () => {
    if (mapType === "satellite") {
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }
    // Standard map (similar to old iOS Maps)
    return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  };

  // Sample landmarks for Mumbai area
  const landmarks = [
    { id: 1, name: "Borivali National Park", lat: 19.2183, lng: 72.8659 },
    { id: 2, name: "Mandapeshwar Caves", lat: 19.2051, lng: 72.8489 },
    { id: 3, name: "Shantivan Temple", lat: 19.2297, lng: 72.8567 },
    { id: 4, name: "Borivali Station", lat: 19.2307, lng: 72.8567 },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col relative overflow-hidden">
  {/* status bar removed */}

      {/* Header - Silver iOS Maps Style */}
      <div className="bg-gradient-to-b from-[#e6e6e6] via-[#d1d1d1] to-[#b8b8b8] border-b border-[#a0a0a0] px-4 py-3 relative z-20">
        <div className="flex items-center justify-center">
          <button 
            onClick={getCurrentLocation}
            className="bg-gradient-to-b from-[#f8f8f8] to-[#d8d8d8] border border-[#a8a8a8] rounded-md px-3 py-1 shadow-sm active:bg-gradient-to-b active:from-[#d8d8d8] active:to-[#c8c8c8]"
          >
            <span className="text-gray-700 text-[14px] font-medium drop-shadow-sm">{isLocating ? "Locating..." : "Reset Location"}</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        {typeof window !== "undefined" && (
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={zoomLevel}
            style={{ height: "100%", width: "100%" }}
            ref={mapRef}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url={getTileLayerUrl()}
              attribution={mapType === "satellite" 
                ? '&copy; <a href="https://www.esri.com/">Esri</a>' 
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              }
            />
            
            {/* User Location Marker */}
            <Marker position={[userLocation.lat, userLocation.lng]}>
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                  <br />
                  <small>Lat: {userLocation.lat.toFixed(4)}, Lng: {userLocation.lng.toFixed(4)}</small>
                </div>
              </Popup>
            </Marker>

            {/* Landmark Markers */}
            {landmarks.map((landmark) => (
              <Marker key={landmark.id} position={[landmark.lat, landmark.lng]}>
                <Popup>
                  <div className="text-center">
                    <strong>{landmark.name}</strong>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Location Banner - Silver iOS Style */}
        {!isLocating && (
          <div className="absolute top-4 left-4 right-4 bg-gradient-to-b from-[#f8f8f8] to-[#d8d8d8] border border-[#a8a8a8] rounded-lg shadow-lg z-[1000]">
            <div className="flex items-center p-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 text-sm drop-shadow-sm">Current Location</div>
                <div className="text-gray-600 text-xs drop-shadow-sm">{currentLocationName}</div>
              </div>
              <button className="bg-gradient-to-b from-[#5890d0] to-[#3c7dc4] border border-[#2a6bb8] rounded-md px-2 py-1 shadow-sm active:bg-gradient-to-b active:from-[#4680c4] active:to-[#2a6bb8]">
                <span className="text-white text-sm font-medium drop-shadow-sm">Directions</span>
              </button>
            </div>
          </div>
        )}

        {/* Locating indicator */}
        {isLocating && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-3 rounded-xl z-[1000]">
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Locating...</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar - Compact iOS Maps Style */}
      <div className="absolute bottom-4 left-4 z-[1001]">
        <div className="flex items-center space-x-2 bg-gradient-to-b from-[#e6e6e6] via-[#d1d1d1] to-[#b8b8b8] border border-[#a0a0a0] rounded-lg shadow-lg px-2 py-1">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0] border border-[#a0a0a0] rounded-md flex items-center justify-center text-sm font-bold text-gray-700 shadow-sm active:bg-gradient-to-b active:from-[#d0d0d0] active:to-[#b8b8b8]"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 bg-gradient-to-b from-[#f0f0f0] to-[#d0d0d0] border border-[#a0a0a0] rounded-md flex items-center justify-center text-sm font-bold text-gray-700 shadow-sm active:bg-gradient-to-b active:from-[#d0d0d0] active:to-[#b8b8b8]"
          >
            −
          </button>
          
          {/* Separator */}
          <div className="w-px h-6 bg-[#a0a0a0]"></div>
          
          {/* Map Type Buttons */}
          <button 
            onClick={() => setMapType("standard")}
            className={`px-2 py-1 text-[11px] font-medium rounded-sm ${
              mapType === "standard" 
                ? 'bg-gradient-to-b from-[#5890d0] to-[#3c7dc4] text-white drop-shadow-sm' 
                : 'text-gray-700 hover:bg-gradient-to-b hover:from-[#e0e0e0] hover:to-[#c8c8c8] active:bg-gradient-to-b active:from-[#d0d0d0] active:to-[#b8b8b8]'
            }`}
          >
            Standard
          </button>
          <button 
            onClick={() => setMapType("satellite")}
            className={`px-2 py-1 text-[11px] font-medium rounded-sm ${
              mapType === "satellite" 
                ? 'bg-gradient-to-b from-[#5890d0] to-[#3c7dc4] text-white drop-shadow-sm' 
                : 'text-gray-700 hover:bg-gradient-to-b hover:from-[#e0e0e0] hover:to-[#c8c8c8] active:bg-gradient-to-b active:from-[#d0d0d0] active:to-[#b8b8b8]'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapApp;
