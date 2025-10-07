"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

interface TimerExpirationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TimerExpirationModal: React.FC<TimerExpirationModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const handleOkClick = () => {
    onClose();
    // Redirect to device selection page
    router.push('/device-selection');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={handleOkClick}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-md mx-4 p-6 text-center">
        {/* Icon */}
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">⏰</span>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Time&apos;s Up!
        </h2>
        
        {/* Message */}
        <p className="text-gray-600 mb-6">
          Your team&apos;s session has expired. Your device will now go offline.
        </p>
        
        {/* Button */}
        <button
          onClick={handleOkClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          OK
        </button>
      </div>
    </div>
  );
};

export default TimerExpirationModal;