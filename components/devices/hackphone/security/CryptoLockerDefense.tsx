'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

interface CryptoLockerDefenseProps {
  teamId: string;
  active: boolean;
}

const DEFENSE_PHRASES = [
  'AES256',
  'RSA4096',
  'ECDH256',
  'SHA3512',
  'PBKDF2',
  'CHACHA',
  'X25519',
  'SCRYPT',
  'ARGON2',
  'CURVE25519'
];

const CryptoLockerDefense: React.FC<CryptoLockerDefenseProps> = ({ teamId, active }) => {
  const { cryptoLockerSpawns } = useSocket();
  
  // Current mini-game state
  const [isActive, setIsActive] = useState(false);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionKey, setSessionKey] = useState('');
  const [targetIP, setTargetIP] = useState('');
  const [attackerTeamId, setAttackerTeamId] = useState('');
  const [demand, setDemand] = useState(0);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Multi-phrase progress tracking
  const [phrasesCompleted, setPhrasesCompleted] = useState(0);
  const [phrasesRequired] = useState(5);
  const [completedPhrases, setCompletedPhrases] = useState<string[]>([]);
  
  // Generate a new random phrase that hasn't been used yet
  const generateNewPhrase = useCallback(() => {
    const availablePhrases = DEFENSE_PHRASES.filter(phrase => !completedPhrases.includes(phrase));
    if (availablePhrases.length === 0) return DEFENSE_PHRASES[0]; // Fallback
    
    const randomIndex = Math.floor(Math.random() * availablePhrases.length);
    return availablePhrases[randomIndex];
  }, [completedPhrases]);
  
  // Check localStorage for persistent attack state on mount
  useEffect(() => {
    if (!teamId) return;
    
    const persistentAttack = localStorage.getItem(`cryptolocker-defense-${teamId}`);
    if (persistentAttack) {
      const data = JSON.parse(persistentAttack);
      // If failure modal was showing, restore it regardless of the defense timer expiry
      if (data.showFailureModal) {
        console.log('💀 Restoring CryptoLocker failure modal from localStorage');
        setIsActive(false);
        setShowFailureModal(true);
        setSessionKey(data.sessionKey);
        setTargetIP(data.targetIP);
        setAttackerTeamId(data.attackerTeamId || '');
        setDemand(data.demand);
        setPhrasesCompleted(data.phrasesCompleted ?? 0);
        setCompletedPhrases(data.completedPhrases ?? []);
      } else if (Date.now() < data.expires) {
        console.log('🔒 Restoring CryptoLocker defense from localStorage:', data);
        setIsActive(true);
        setCurrentPhrase(data.currentPhrase);
        setUserInput(data.userInput);
        setTimeLeft(data.expires - Date.now());
        setSessionKey(data.sessionKey);
        setTargetIP(data.targetIP);
        setAttackerTeamId(data.attackerTeamId || '');
        setDemand(data.demand);
        setPhrasesCompleted(data.phrasesCompleted);
        setCompletedPhrases(data.completedPhrases);
        setShowFailureModal(false);
      } else {
        // Expired, clean up
        localStorage.removeItem(`cryptolocker-defense-${teamId}`);
      }
    }
  }, [teamId]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!teamId || (!isActive && !showFailureModal)) return;
    
    const stateData = {
      currentPhrase,
      userInput,
      expires: Date.now() + timeLeft,
      sessionKey,
      targetIP,
      attackerTeamId,
      demand,
      phrasesCompleted,
      completedPhrases,
      showFailureModal,
      ts: Date.now()
    };
    
    localStorage.setItem(`cryptolocker-defense-${teamId}`, JSON.stringify(stateData));
  }, [teamId, isActive, currentPhrase, userInput, timeLeft, sessionKey, targetIP, attackerTeamId, demand, phrasesCompleted, completedPhrases, showFailureModal]);

  const handleTimeUp = useCallback(async () => {
    console.log('⏰ CryptoLocker defense failed - time up');
    setIsActive(false);
    setShowFailureModal(true);
  }, []);

  const handleQuitGame = useCallback(async () => {
    console.log('💀 Player chose to quit game');
    setIsActive(false);
    setShowFailureModal(false);
    
    // Clear localStorage
    if (teamId) {
      localStorage.removeItem(`cryptolocker-defense-${teamId}`);
    }
    
    // Set device offline
    try {
      const deviceMac = localStorage.getItem('device_mac_address');
      if (deviceMac) {
        await fetch('/api/device/online-sync', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Admin-Key': 'hack-a-byte-admin' // Using placeholder admin key
          },
          body: JSON.stringify({
            deviceId: deviceMac,
            status: 'offline'
          })
        });
        console.log('📱 Device set to offline');
      }
    } catch (error) {
      console.error('Error setting device offline:', error);
    }
    
    // Notify server about game over
    try {
      const response = await fetch('/api/attack/cryptolocker-defense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionKey,
          targetIP,
          success: false,
          completedPhrases: phrasesCompleted,
          requiredPhrases: phrasesRequired,
          action: 'quit'
        })
      });

      if (response.ok) {
        console.log('💀 Game over notification sent');
      }
    } catch (error) {
      console.error('Error sending game over notification:', error);
    }

    // Redirect to game over page
    window.location.href = '/device-selection?reason=cryptolocker-quit';
  }, [sessionKey, targetIP, phrasesCompleted, phrasesRequired, teamId]);

  const handlePayRansom = useCallback(async () => {
    console.log('💰 Player chose to pay ransom');
    console.log('💰 Payment data:', { attackerTeamId, targetTeamId: teamId, amount: demand });
    
    // Validate required data before making API call
    if (!attackerTeamId || !teamId || !demand) {
      console.error('Missing required payment data:', { attackerTeamId, teamId, demand });
      setIsProcessingPayment(false);
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      const response = await fetch('/api/attack/cryptolocker-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attackerTeamId,
          targetTeamId: teamId,
          amount: demand
        })
      });

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse API response as JSON:', parseError);
        throw new Error(`API returned non-JSON response: ${response.status} ${response.statusText}`);
      }

      if (response.ok && result.success) {
        // Clear persisted failure state so it doesn't reappear on reload
        if (teamId) {
          localStorage.removeItem(`cryptolocker-defense-${teamId}`);
        }
        setShowFailureModal(false);
        setIsProcessingPayment(false);
        console.log('💰 Ransom payment successful');
        // The payment component will handle the rest
      } else {
        console.error('Payment failed:', result);
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing ransom payment:', error);
      setIsProcessingPayment(false);
      // Could show error message here
    }
  }, [attackerTeamId, teamId, demand]);

  const handleSuccess = useCallback(async () => {
    console.log('✅ CryptoLocker defense successful!');
    setIsActive(false);
    setShowFailureModal(false);
    
    // Clear localStorage
    if (teamId) {
      localStorage.removeItem(`cryptolocker-defense-${teamId}`);
    }
    
    // Notify server of successful defense
    try {
      const response = await fetch('/api/attack/cryptolocker-defense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionKey,
          targetIP,
          success: true,
          completedPhrases: phrasesCompleted,
          requiredPhrases: phrasesRequired
        })
      });

      if (response.ok) {
        console.log('🛡️ CryptoLocker successfully defended');
      }
    } catch (error) {
      console.error('Error reporting successful defense:', error);
    }
  }, [sessionKey, targetIP, phrasesCompleted, phrasesRequired, teamId]);

  // Listen for CryptoLocker spawn events
  useEffect(() => {
    if (!active || !teamId) return;

    const latestSpawn = cryptoLockerSpawns[cryptoLockerSpawns.length - 1];
    if (latestSpawn && Date.now() - latestSpawn.ts < 10000) { // Recent spawn
      console.log('🔒 CryptoLocker spawn detected:', latestSpawn);
      console.log('🔒 Spawn data validation:', {
        hasAttackerTeamId: !!latestSpawn.attackerTeamId,
        attackerTeamId: latestSpawn.attackerTeamId,
        hasSessionKey: !!latestSpawn.sessionKey,
        hasTargetIP: !!latestSpawn.targetIP,
        demand: latestSpawn.demand
      });
      
      setIsActive(true);
      setCurrentPhrase(generateNewPhrase());
      setUserInput('');
      setTimeLeft(latestSpawn.timeLimit || 45000);
      setSessionKey(latestSpawn.sessionKey);
      setTargetIP(latestSpawn.targetIP);
      setAttackerTeamId(latestSpawn.attackerTeamId);
      setDemand(latestSpawn.demand);
      setPhrasesCompleted(0);
      setCompletedPhrases([]);
    }
  }, [cryptoLockerSpawns, teamId, active, generateNewPhrase]);

  // Countdown timer
  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          // Time's up! Trigger payment demand
          handleTimeUp();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, handleTimeUp]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);

    // Check if phrase is completed
    if (value === currentPhrase) {
      const newCompletedPhrases = [...completedPhrases, currentPhrase];
      const newPhrasesCompleted = phrasesCompleted + 1;
      
      setCompletedPhrases(newCompletedPhrases);
      setPhrasesCompleted(newPhrasesCompleted);
      setUserInput('');

      // Check if all phrases completed
      if (newPhrasesCompleted >= phrasesRequired) {
        handleSuccess();
      } else {
        // Generate next phrase
        setCurrentPhrase(generateNewPhrase());
      }
    }
  }, [currentPhrase, completedPhrases, phrasesCompleted, phrasesRequired, generateNewPhrase, handleSuccess]);

  // Don't show anything if not active
  if (!active) return null;

  // Show failure modal if defense failed
  if (showFailureModal) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-red-900 border-4 border-yellow-500 rounded-lg p-8 max-w-lg w-full mx-4 text-center">
          {/* Skull and warning */}
          <div className="text-6xl mb-4 animate-pulse">💀🔒</div>
          
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">
            DEFENSE FAILED!
          </h1>
          
          <div className="bg-black/70 border border-red-500 rounded p-6 mb-6">
            <p className="text-white text-lg font-semibold mb-4">
              Your files have been encrypted by CryptoLocker Elite!
            </p>
            
            <div className="text-left space-y-2 text-white">
              <p>💰 <strong>Ransom Demand:</strong> ₿{demand}</p>
              <p>🎯 <strong>Target:</strong> {targetIP}</p>
              <p>📊 <strong>Completed Sequences:</strong> {phrasesCompleted}/{phrasesRequired}</p>
            </div>
            
            <div className="mt-4 p-3 bg-red-800/50 border border-red-400 rounded">
              <p className="text-red-200 text-sm">
                ⚠️ <strong>CRITICAL:</strong> Choose your response carefully. 
                Quitting will end your game permanently!
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={handlePayRansom}
                disabled={isProcessingPayment}
                className={`flex-1 text-lg font-bold py-4 rounded-lg border-2 transition-colors ${
                  isProcessingPayment 
                    ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-500 border-green-400 text-white'
                }`}
              >
                {isProcessingPayment ? 'Processing...' : `💳 PAY ₿${demand}`}
              </button>
              
              <button
                onClick={handleQuitGame}
                disabled={isProcessingPayment}
                className={`flex-1 text-lg font-bold py-4 rounded-lg border-2 transition-colors ${
                  isProcessingPayment 
                    ? 'bg-gray-600 border-gray-500 text-gray-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-500 border-red-400 text-white'
                }`}
              >
                💀 QUIT GAME
              </button>
            </div>
            
            <p className="text-gray-300 text-sm">
              Payment will be deducted from your team&apos;s Bitcoin wallet
            </p>
            <p className="text-red-300 text-xs">
              ⚠️ Warning: Quitting will redirect to game over page and make your device offline
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show mini-game if active
  if (!isActive) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    return `${seconds}s`;
  };

  const progressPercentage = (phrasesCompleted / phrasesRequired) * 100;
  const timePercentage = Math.max(0, (timeLeft / 45000) * 100);

  return (
    <div className="fixed inset-0 z-[100] bg-red-900/95 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-black border-4 border-red-500 rounded-lg p-8 max-w-2xl w-full mx-4 text-center">
        {/* Alert header */}
        <div className="text-6xl mb-4 animate-pulse">🚨⚔️</div>
        
        <h1 className="text-4xl font-bold text-red-400 mb-2">
          CRYPTOLOCKER ATTACK DETECTED!
        </h1>
        
        <p className="text-yellow-300 text-lg mb-6">
          Emergency Protocol Activated - Complete {phrasesRequired} defense sequences to neutralize threat!
        </p>

        {/* Progress indicators */}
        <div className="mb-6 space-y-4">
          {/* Phrase completion progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>Defense Sequences: {phrasesCompleted}/{phrasesRequired}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <div className="bg-gray-700 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Time remaining progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-300 mb-1">
              <span>Time Remaining: {formatTime(timeLeft)}</span>
              <span>Ransom Demand: ₿{demand}</span>
            </div>
            <div className="bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-1000 ${
                  timePercentage > 50 ? 'bg-green-500' : 
                  timePercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${timePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current phrase challenge */}
        <div className="bg-red-800/50 border border-red-400 rounded p-6 mb-6">
          <p className="text-white text-sm mb-2">Type the following phrase to continue defense:</p>
          <div className="text-3xl font-bold text-yellow-400 mb-4 font-mono tracking-wider">
            {currentPhrase}
          </div>
          
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Type the phrase above..."
            className="w-full px-4 py-3 text-xl font-mono bg-black border border-gray-500 rounded text-white text-center tracking-wider uppercase"
            style={{ letterSpacing: '0.1em' }}
            autoFocus
          />
          
          <div className="mt-3 text-sm text-gray-300">
            Progress: {userInput.length}/{currentPhrase.length} characters
          </div>
        </div>

        {/* Completed phrases indicator */}
        {phrasesCompleted > 0 && (
          <div className="mb-4">
            <p className="text-green-400 text-sm mb-2">✅ Completed Sequences:</p>
            <div className="text-xs text-gray-300 space-y-1">
              {completedPhrases.map((phrase, index) => (
                <div key={index} className="bg-green-900/30 border border-green-500 rounded px-2 py-1 inline-block mr-2">
                  {phrase}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning footer */}
        <div className="mt-6 p-3 bg-black/70 border border-yellow-500 rounded">
          <p className="text-yellow-300 text-sm">
            ⚠️ <strong>WARNING:</strong> Failure to complete all sequences will result in file encryption and ransom demand!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CryptoLockerDefense;
