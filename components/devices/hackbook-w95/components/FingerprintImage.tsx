"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface FingerprintImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Enhanced fingerprint image component with better error handling for Vercel deployment
 */
const FingerprintImage: React.FC<FingerprintImageProps> = ({
  src,
  alt,
  fill = true,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  className = "",
  onError,
  onLoad
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error(`Failed to load fingerprint image: ${src}`);
    setImageError(true);
    onError?.(e);
  };

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log(`Successfully loaded fingerprint image: ${src}`);
    setImageLoaded(true);
    onLoad?.(e);
  };

  // If there's an error loading the image, show a placeholder
  if (imageError) {
    return (
      <div className={`absolute inset-0 flex items-center justify-center bg-gray-900 border border-gray-700`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-xs">Image unavailable</div>
          <div className="text-xs text-gray-600 mt-1">{src.split('/').pop()}</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        priority={false}
        quality={85}
        style={{ objectFit: 'contain' }}
      />
      
      {/* Loading indicator */}
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-10">
          <div className="text-green-500 text-xs animate-pulse">Loading...</div>
        </div>
      )}
    </>
  );
};

export default FingerprintImage;
