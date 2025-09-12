'use client';

import React, { useState, useCallback } from 'react';

interface SystemLockProAttackProps {
  teamId: string;
  onClose: () => void;
  initialTargetMAC?: string;
}

const SystemLockProAttack: React.FC<SystemLockProAttackProps> = ({ teamId, onClose, initialTargetMAC }) => {
  console.log('🚫 SystemLock Pro Attack component rendered:', {
    teamId,
    initialTargetMAC,
    hasTeamId: !!teamId
  });
  const [targetMAC, setTargetMAC] = useState(initialTargetMAC || '');
  const [pinGuess, setPinGuess] = useState('');
  const [isAttacking, setIsAttacking] = useState(false);
  const [attempts, setAttempts] = useState<{ pinGuess: string; timestamp: number }[]>([]);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleAttack = useCallback(async () => {
    if (!targetMAC || !pinGuess || isAttacking) return;
    
    if (pinGuess.length !== 4 || !/^\d{4}$/.test(pinGuess)) {
      setLastResult({ success: false, message: 'PIN must be exactly 4 digits' });
      return;
    }

    setIsAttacking(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/attack/systemlock-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attackerTeamId: teamId,
          targetMAC,
          pinGuess,
        }),
      });

      const result = await response.json();
      
      // Add attempt to history
      setAttempts(prev => [...prev, { pinGuess, timestamp: Date.now() }]);
      
      if (response.ok && result.success) {
        if (result.pinCracked) {
          setLastResult({
            success: true,
            message: result.message || `SUCCESS! Stolen ₿${result.stolenAmount} from ${targetMAC}`
          });
          // Clear the form after success
          setTargetMAC('');
          setPinGuess('');
          setAttempts([]);
        } else {
          setLastResult({
            success: false,
            message: result.message || `Failed! Wrong PIN: ${pinGuess}. Try again.`
          });
        }
      } else {
        setLastResult({
          success: false,
          message: result.error || 'Attack failed'
        });
      }
    } catch (error) {
      console.error('SystemLock Pro attack error:', error);
      setLastResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    } finally {
      setIsAttacking(false);
      setPinGuess('');
    }
  }, [teamId, targetMAC, pinGuess, isAttacking]);

  const handlePinInput = (digit: string) => {
    if (pinGuess.length < 4) {
      setPinGuess(prev => prev + digit);
    }
  };

  const handlePinClear = () => {
    setPinGuess('');
  };

  const handlePinDelete = () => {
    setPinGuess(prev => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50" style={{ zIndex: 9999 }}>
      <div className="bg-gray-900 border-2 border-red-500 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        {/* Debug indicator */}
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
          VISIBLE
        </div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-red-400 text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">🚫</span>
            SystemLock Pro
          </h2>
          <button
            onClick={() => {
              console.log('🚫 SystemLock Pro close button clicked');
              onClose();
            }}
            className="text-gray-400 hover:text-white text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Target MAC Address Input */}
          <div>
            <label className="block text-red-300 text-sm font-medium mb-2">
              Target MAC Address
            </label>
            <input
              type="text"
              value={targetMAC}
              onChange={(e) => setTargetMAC(e.target.value)}
              placeholder="aa:bb:cc:dd:ee:ff"
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* PIN Display */}
          <div>
            <label className="block text-red-300 text-sm font-medium mb-2">
              PIN Guess
            </label>
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="w-12 h-12 border-2 border-gray-600 rounded flex items-center justify-center text-white text-xl font-mono bg-gray-800"
                >
                  {pinGuess[index] || ''}
                </div>
              ))}
            </div>
          </div>

          {/* PIN Keypad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                onClick={() => handlePinInput(digit.toString())}
                disabled={pinGuess.length >= 4 || isAttacking}
                className="h-12 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 border border-gray-600 rounded text-white font-mono text-lg transition-colors"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={handlePinClear}
              disabled={isAttacking}
              className="h-12 bg-red-700 hover:bg-red-600 disabled:bg-gray-800 border border-gray-600 rounded text-white text-sm transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => handlePinInput('0')}
              disabled={pinGuess.length >= 4 || isAttacking}
              className="h-12 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 border border-gray-600 rounded text-white font-mono text-lg transition-colors"
            >
              0
            </button>
            <button
              onClick={handlePinDelete}
              disabled={pinGuess.length === 0 || isAttacking}
              className="h-12 bg-yellow-700 hover:bg-yellow-600 disabled:bg-gray-800 border border-gray-600 rounded text-white text-sm transition-colors"
            >
              ←
            </button>
          </div>

          {/* Attack Button */}
          <button
            onClick={handleAttack}
            disabled={!targetMAC || pinGuess.length !== 4 || isAttacking}
            className={`w-full py-3 rounded font-medium transition-colors ${
              !targetMAC || pinGuess.length !== 4 || isAttacking
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {isAttacking ? 'Cracking PIN...' : 'Crack PIN'}
          </button>

          {/* Result Display */}
          {lastResult && (
            <div className={`p-3 rounded ${
              lastResult.success 
                ? 'bg-green-900 border border-green-500 text-green-300' 
                : 'bg-red-900 border border-red-500 text-red-300'
            }`}>
              {lastResult.message}
            </div>
          )}

          {/* Attempt History */}
          {attempts.length > 0 && (
            <div className="bg-gray-800 border border-gray-600 rounded p-3">
              <h4 className="text-gray-300 text-sm font-medium mb-2">
                Recent Attempts ({attempts.length})
              </h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {attempts.slice(-5).map((attempt, index) => (
                  <div key={index} className="text-gray-400 text-xs font-mono">
                    {attempt.pinGuess} - {new Date(attempt.timestamp).toLocaleTimeString()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemLockProAttack;
