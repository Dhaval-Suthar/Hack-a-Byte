"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { logger } from '@/lib/logger';

const ImageDebugger: React.FC = () => {
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  
  const testImages = [
    '/hackbook-W95/Fingerprints/main1.png',
    '/hackbook-W95/Fingerprints/main2.png',
    '/hackbook-W95/Fingerprints/right1_1.png',
    '/hackbook-W95/Fingerprints/right2_1.png',
    '/hackbook-W95/Fingerprints/wrong1_1.png',
  ];

  const testImage = (src: string) => {
    const img = document.createElement('img');
    img.onload = () => {
      setTestResults(prev => ({ ...prev, [src]: true }));
    };
    img.onerror = () => {
      setTestResults(prev => ({ ...prev, [src]: false }));
      logger.error(`❌ Failed to load: ${src}`);
    };
    img.src = src;
  };

  const testAllImages = () => {
    testImages.forEach(testImage);
  };

  return (
    <div className="p-4 bg-gray-900 text-white">
      <h2 className="text-xl mb-4">Fingerprint Image Debug Test</h2>
      
      <button 
        onClick={testAllImages}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Test All Images
      </button>
      
      <div className="grid grid-cols-3 gap-4">
        {testImages.map((src) => (
          <div key={src} className="border border-gray-600 p-2">
            <div className="text-xs mb-2">{src}</div>
            <div className="w-24 h-24 bg-black relative border">
              <Image
                src={src}
                alt="Test image"
                fill
                className="object-contain"
                onLoad={() => {
                  setTestResults(prev => ({ ...prev, [src]: true }));
                }}
                onError={() => {
                  setTestResults(prev => ({ ...prev, [src]: false }));
                  logger.error(`❌ Next.js Image failed: ${src}`);
                }}
              />
            </div>
            <div className="text-xs mt-1">
              Status: {testResults[src] === true ? '✅ Loaded' : testResults[src] === false ? '❌ Failed' : '⏳ Pending'}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs">
        <p>Check browser console for detailed loading information.</p>
        <p>If images don&apos;t load, check Network tab in DevTools.</p>
      </div>
    </div>
  );
};

export default ImageDebugger;
