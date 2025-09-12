'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSocket, CryptoLockerPaymentDemand, CryptoLockerGameOver } from '@/hooks/useSocket';

interface CryptoLockerPaymentProps {
  teamId?: string;
  active?: boolean;
}

const CryptoLockerPayment: React.FC<CryptoLockerPaymentProps> = ({ 
  teamId, 
  active = true 
}) => {
  const { cryptoLockerPaymentDemands, cryptoLockerPaymentSents, cryptoLockerGameOvers } = useSocket();
  const [activeDemand, setActiveDemand] = useState<CryptoLockerPaymentDemand | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameOver, setGameOver] = useState<CryptoLockerGameOver | null>(null);
  const [showPersistentScreen, setShowPersistentScreen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [hasLocalStorageData, setHasLocalStorageData] = useState(() => {
    // Initialize with synchronous localStorage check to prevent modal from disappearing on reload
    if (typeof window !== 'undefined' && teamId) {
      return !!localStorage.getItem(`cryptolocker-payment-${teamId}`);
    }
    return false;
  });

  // Check localStorage for persistent payment screen on mount
  useEffect(() => {
    if (!teamId) return;
    
    setIsRestoring(true);
    const persistentPayment = localStorage.getItem(`cryptolocker-payment-${teamId}`);
    if (persistentPayment) {
      setHasLocalStorageData(true);
      const data = JSON.parse(persistentPayment);
      if (Date.now() < data.deadline) {
        setActiveDemand(data);
        setTimeLeft(data.deadline - Date.now());
        setShowPersistentScreen(true);
      } else {
        // Expired, trigger game over
        localStorage.removeItem(`cryptolocker-payment-${teamId}`);
        setHasLocalStorageData(false);
        setGameOver({
          reason: 'Payment deadline expired',
          demanded: data.demand,
          available: 0,
          message: 'GAME OVER: Payment deadline expired. All data lost.',
          ts: Date.now()
        });
      }
    } else {
      setHasLocalStorageData(false);
    }
    setIsRestoring(false);
  }, [teamId]);

  // Listen for payment demands
  useEffect(() => {
    if (!active || !teamId) return;

    const latestDemand = cryptoLockerPaymentDemands[cryptoLockerPaymentDemands.length - 1];
    if (latestDemand && Date.now() - latestDemand.ts < 30000) { // Recent demand
      const deadline = Date.now() + (5 * 60 * 1000); // 5 minutes to pay
      const demandWithDeadline = { ...latestDemand, deadline };
      
      setActiveDemand(demandWithDeadline);
      setTimeLeft(demandWithDeadline.deadline - Date.now());
      setShowPersistentScreen(true);
      
      // Store in localStorage for persistence
      localStorage.setItem(`cryptolocker-payment-${teamId}`, JSON.stringify(demandWithDeadline));
    }
  }, [cryptoLockerPaymentDemands, teamId, active]);

  // Listen for game over events
  useEffect(() => {
    if (!active || !teamId) return;

    const latestGameOver = cryptoLockerGameOvers[cryptoLockerGameOvers.length - 1];
    if (latestGameOver && Date.now() - latestGameOver.ts < 10000) {
      setGameOver(latestGameOver);
      setActiveDemand(null);
      setShowPersistentScreen(false);
      localStorage.removeItem(`cryptolocker-payment-${teamId}`);
      setHasLocalStorageData(false);
    }
  }, [cryptoLockerGameOvers, teamId, active]);

  // Listen for payment sent events (successful payment)
  useEffect(() => {
    if (!active || !teamId) return;

    const latestPaymentSent = cryptoLockerPaymentSents[cryptoLockerPaymentSents.length - 1];
    if (latestPaymentSent && Date.now() - latestPaymentSent.ts < 10000) {
      setActiveDemand(null);
      setShowPersistentScreen(false);
      setGameOver(null);
      localStorage.removeItem(`cryptolocker-payment-${teamId}`);
      setHasLocalStorageData(false);
      // Show success message briefly
      alert(`Payment successful! Files are being decrypted... New balance: ₿${latestPaymentSent.newBalance}`);
    }
  }, [cryptoLockerPaymentSents, teamId, active]);

  // Countdown timer
  useEffect(() => {
    if (!activeDemand || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          // Time's up - trigger game over
          setGameOver({
            reason: 'Payment deadline expired',
            demanded: activeDemand.demand,
            available: 0,
            message: 'GAME OVER: Payment deadline expired. All data lost.',
            ts: Date.now()
          });
          setActiveDemand(null);
          setShowPersistentScreen(false);
          if (teamId) {
            localStorage.removeItem(`cryptolocker-payment-${teamId}`);
            setHasLocalStorageData(false);
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeDemand, timeLeft, teamId]);

  const handlePayment = useCallback(async () => {
    if (!activeDemand || !teamId || isProcessing) return;

      activeDemand,
      teamId,
      attackerTeamId: activeDemand.attackerTeamId,
      targetTeamId: teamId,
      amount: activeDemand.demand
    });

    setIsProcessing(true);
    try {
      const requestBody = {
        attackerTeamId: activeDemand.attackerTeamId,
        targetTeamId: teamId,
        amount: activeDemand.demand
      };
      
      
      const response = await fetch('/api/attack/cryptolocker-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      
      const result = await response.json();
      
      if (result.success) {
        // Payment successful - clear persistent storage and close
        localStorage.removeItem(`cryptolocker-payment-${teamId}`);
        setActiveDemand(null);
        setShowPersistentScreen(false);
        setHasLocalStorageData(false);
        alert(`Payment of ${activeDemand.demand} BTC sent successfully! Files are being decrypted...`);
      } else if (result.outcome === 'insufficient_funds') {
        // Not enough funds - trigger game over
        setGameOver({
          reason: 'Insufficient funds to pay ransom',
          demanded: activeDemand.demand,
          available: result.availableBalance || 0,
          message: 'GAME OVER: Insufficient Bitcoin to pay ransom. All data lost.',
          ts: Date.now()
        });
        setActiveDemand(null);
        setShowPersistentScreen(false);
        setHasLocalStorageData(false);
        localStorage.removeItem(`cryptolocker-payment-${teamId}`);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [activeDemand, teamId, isProcessing]);

  const handleGameOver = useCallback(() => {
    // Redirect to device selection page
    window.location.href = '/device-selection';
  }, []);

  // Listen for payment sent events (successful payment)
  useEffect(() => {
    if (!active || !teamId) return;

    const latestPaymentSent = cryptoLockerPaymentSents[cryptoLockerPaymentSents.length - 1];
    if (latestPaymentSent && Date.now() - latestPaymentSent.ts < 10000) {
      setActiveDemand(null);
      setShowPersistentScreen(false);
      setGameOver(null);
      localStorage.removeItem(`cryptolocker-payment-${teamId}`);
      // Show success message briefly
      alert(`Payment successful! Files are being decrypted... New balance: ₿${latestPaymentSent.newBalance}`);
    }
  }, [cryptoLockerPaymentSents, teamId, active]);

  // Clear game over after showing
  useEffect(() => {
    if (gameOver) {
      const timer = setTimeout(() => {
        handleGameOverRedirect();
      }, 10000); // Auto-redirect after 10 seconds
      return () => clearTimeout(timer);
    }
  }, [gameOver]);

  // Don't show anything if not active or no events
  // Always show if we have localStorage data or are in the process of restoring
  if (!active || (!activeDemand && !gameOver && !showPersistentScreen && !hasLocalStorageData && !isRestoring)) return null;

  const handleGameOverRedirect = () => {
    // Clear localStorage and redirect to game selection
    try {
      localStorage.removeItem('device_mac_address');
      localStorage.removeItem('hackphone_password');
      localStorage.removeItem('device_user');
    } catch {}
    window.location.href = '/device-selection';
  };

  if (gameOver) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
        <div className="bg-red-900 border-4 border-red-500 rounded-lg p-8 max-w-md w-full mx-4 text-center">
          <div className="text-6xl mb-4">💀</div>
          <h1 className="text-2xl font-bold text-white mb-4">GAME OVER</h1>
          <div className="bg-black/50 border border-red-400 rounded p-4 mb-6">
            <p className="text-red-300 font-semibold">{gameOver.message}</p>
            {gameOver.demanded && (
              <p className="text-white mt-2">
                Demanded: {gameOver.demanded} BTC<br/>
                Available: {gameOver.available} BTC
              </p>
            )}
          </div>
          <button
            onClick={handleGameOverRedirect}
            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded font-semibold"
          >
            Play Again
          </button>
          <p className="text-gray-400 text-sm mt-4">Auto-redirecting in 10 seconds...</p>
        </div>
      </div>
    );
  }

  if (!activeDemand) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-red-900 border-4 border-yellow-500 rounded-lg p-8 max-w-lg w-full mx-4 text-center">
        {/* Skull and warning */}
        <div className="text-6xl mb-4 animate-pulse">💀🔒</div>
        
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          YOUR FILES ARE ENCRYPTED!
        </h1>
        
        {/* Demand details */}
        <div className="bg-black/70 border border-red-500 rounded p-6 mb-6">
          <p className="text-white text-lg font-semibold mb-4">
            {activeDemand.message}
          </p>
          
          <div className="text-left space-y-2 text-white">
            <p>💰 <strong>Ransom Amount:</strong> {activeDemand.demand} BTC</p>
            <p>🎯 <strong>Target:</strong> {activeDemand.targetIP}</p>
            <p>⏰ <strong>Time Remaining:</strong> {minutes}:{seconds.toString().padStart(2, '0')}</p>
          </div>
          
          <div className="mt-4 p-3 bg-red-800/50 border border-red-400 rounded">
            <p className="text-red-200 text-sm">
              ⚠️ <strong>WARNING:</strong> If payment is not made before the deadline, 
              your game will end and all progress will be lost!
            </p>
          </div>
        </div>

        {/* Payment buttons */}
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className={`flex-1 text-lg font-bold py-4 rounded-lg border-2 transition-colors ${
                isProcessing 
                  ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-500 border-green-400 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : `💳 PAY ₿${activeDemand.demand}`}
            </button>
            
            <button
              onClick={handleGameOver}
              className="flex-1 text-lg font-bold py-4 rounded-lg border-2 bg-red-600 hover:bg-red-500 border-red-400 text-white transition-colors"
            >
              💀 END GAME
            </button>
          </div>
          
          <p className="text-gray-300 text-sm">
            Payment will be deducted from your team&apos;s Bitcoin wallet
          </p>
          <p className="text-red-300 text-xs">
            ⚠️ Warning: Ending game will result in immediate elimination
          </p>
        </div>

        {/* Countdown progress */}
        <div className="mt-6">
          <div className="bg-gray-700 rounded-full h-3">
            <div 
              className="bg-red-500 h-3 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.max(0, 100 - ((activeDemand.deadline - Date.now()) / (2 * 60 * 1000)) * 100)}%` 
              }}
            />
          </div>
          <p className="text-red-300 text-sm mt-2">Time until game over</p>
        </div>
      </div>
    </div>
  );
};

export default CryptoLockerPayment;
