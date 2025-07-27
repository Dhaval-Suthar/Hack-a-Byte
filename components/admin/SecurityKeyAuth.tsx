"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SecurityKeyAuth, SecurityKeyAuthResult } from '@/lib/security-key-auth';

interface SecurityKeyAuthComponentProps {
  onAuthSuccess: () => void;
  onAuthFailed: (error: string) => void;
}

export default function SecurityKeyAuthComponent({ onAuthSuccess, onAuthFailed }: SecurityKeyAuthComponentProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string>('');
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Check WebAuthn support and registered keys
    const supported = SecurityKeyAuth.isSupported();
    const hasKeys = SecurityKeyAuth.hasRegisteredKeys();
    
    setIsSupported(supported);
    
    if (!supported) {
      onAuthFailed('WebAuthn is not supported in this browser. Please use a modern browser with security key support.');
    } else if (!hasKeys) {
      setShowSetup(true);
    }
  }, [onAuthFailed]);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    setError('');

    try {
      const result: SecurityKeyAuthResult = await SecurityKeyAuth.authenticateKey();
      
      if (result.success) {
        onAuthSuccess();
      } else {
        setError(result.error || 'Authentication failed');
        onAuthFailed(result.error || 'Authentication failed');
      }
    } catch {
      const errorMessage = 'Unexpected error during authentication';
      setError(errorMessage);
      onAuthFailed(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    setError('');

    try {
      const result: SecurityKeyAuthResult = await SecurityKeyAuth.registerKey();
      
      if (result.success) {
        setShowSetup(false);
        setError('');
        // Auto-authenticate after successful registration
        setTimeout(() => handleAuthenticate(), 1000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('Unexpected error during registration');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClearKeys = () => {
    SecurityKeyAuth.clearRegisteredKeys();
    setShowSetup(true);
    setError('');
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-center p-8 bg-black/50 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-4">
            Security Key Not Supported
          </h2>
          <p className="text-gray-300 mb-6">
            Your browser doesn&apos;t support WebAuthn security keys. Please use a modern browser like Chrome, Firefox, Safari, or Edge.
          </p>
          <div className="text-left text-sm text-gray-400 space-y-1">
            <p>• Chrome 67+</p>
            <p>• Firefox 60+</p>
            <p>• Safari 14+</p>
            <p>• Edge 18+</p>
          </div>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-8 bg-black/50 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg max-w-md"
        >
          <div className="w-16 h-16 mx-auto mb-4 text-cyber-primary">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2L3 7v3c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-7-5z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary mb-4">
            Security Key Setup Required
          </h2>
          <p className="text-gray-300 mb-6">
            To access the admin panel, you need to register a security key. This provides hardware-based authentication for maximum security.
          </p>
          
          <div className="text-left text-sm text-gray-400 mb-6 space-y-2">
            <p className="font-semibold text-gray-300">Compatible devices:</p>
            <p>• YubiKey (any model)</p>
            <p>• Google Titan Security Key</p>
            <p>• Any FIDO2/WebAuthn device</p>
            <p>• Built-in biometric sensors</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleRegister}
            disabled={isRegistering}
            className="w-full px-6 py-3 bg-cyber-primary hover:bg-cyber-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-black font-bold transition-colors mb-4"
          >
            {isRegistering ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
                Setting up security key...
              </div>
            ) : (
              'Setup Security Key'
            )}
          </button>

          <p className="text-xs text-gray-500">
            Insert your security key and follow your browser&apos;s prompts
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-8 bg-black/50 backdrop-blur-md border border-gray-800 rounded-lg shadow-lg max-w-md"
      >
        <div className="w-16 h-16 mx-auto mb-4 text-cyber-primary">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary mb-4">
          Admin Authentication
        </h2>
        
        <p className="text-gray-300 mb-6">
          Insert your security key and click authenticate to access the admin panel.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleAuthenticate}
          disabled={isAuthenticating}
          className="w-full px-6 py-3 bg-cyber-primary hover:bg-cyber-primary/90 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-black font-bold transition-colors mb-4"
        >
          {isAuthenticating ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2"></div>
              Authenticating...
            </div>
          ) : (
            'Authenticate with Security Key'
          )}
        </button>

        <div className="flex justify-between text-sm">
          <button
            onClick={() => setShowSetup(true)}
            className="text-gray-400 hover:text-gray-300 underline"
          >
            Register New Key
          </button>
          <button
            onClick={handleClearKeys}
            className="text-red-400 hover:text-red-300 underline"
          >
            Clear All Keys
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p>Security keys registered: {SecurityKeyAuth.getRegisteredKeys().length}</p>
        </div>
      </motion.div>
    </div>
  );
}
