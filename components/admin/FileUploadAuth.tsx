"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface FileUploadAuthProps {
  onAuthSuccess: (authKey: string) => void;
  onAuthFailed: (error: string) => void;
}

export default function FileUploadAuth({ onAuthSuccess, onAuthFailed }: FileUploadAuthProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string>('');

  // Expected authentication key - you can change this to any string
  const EXPECTED_AUTH_KEY = 'hackabyte-admin-key-2024';

  const validateFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const trimmedContent = content.trim();
          
          console.log('File content:', JSON.stringify(trimmedContent));
          console.log('Expected key:', JSON.stringify(EXPECTED_AUTH_KEY));
          console.log('Content matches:', trimmedContent === EXPECTED_AUTH_KEY);
          
          // Check if the file content matches the expected key
          if (trimmedContent === EXPECTED_AUTH_KEY) {
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      };
      
      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsUploading(true);
    setFileName(file.name);
    setUploadStatus('idle');

    try {
      // Enhanced file validation
      if (!file.type.startsWith('text/') && !file.name.endsWith('.txt') && !file.name.endsWith('.key')) {
        throw new Error('Please upload a text file (.txt or .key)');
      }

      // Validate file size (should be small for security keys)
      if (file.size > 1024) { // 1KB max
        throw new Error('File is too large. Authentication key file should be under 1KB.');
      }

      // Validate file is not empty
      if (file.size === 0) {
        throw new Error('File is empty. Please provide a valid authentication key file.');
      }

      const isValid = await validateFile(file);
      console.log('File validation result:', isValid);
      
      if (isValid) {
        setUploadStatus('success');
        console.log('Authentication successful, calling onAuthSuccess');
        // Add a brief delay to show success state
        setTimeout(() => {
          onAuthSuccess(EXPECTED_AUTH_KEY);
        }, 1000);
      } else {
        setUploadStatus('error');
        console.log('Authentication failed - invalid key');
        onAuthFailed('Invalid authentication key. Please verify your file contains the correct key.');
      }
    } catch (error) {
      setUploadStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      console.error('File upload error:', errorMessage);
      onAuthFailed(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    } else {
      onAuthFailed('No files were dropped. Please try again.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
    // Reset the input value to allow re-uploading the same file
    e.target.value = '';
  };

  const getStatusIcon = () => {
    if (isUploading) {
      return <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />;
    }
    
    switch (uploadStatus) {
      case 'success':
        return <div className="w-6 h-6 text-green-500 text-xl">✓</div>;
      case 'error':
        return <div className="w-6 h-6 text-red-500 text-xl">✗</div>;
      default:
        return <div className="w-6 h-6 text-gray-400 text-xl">⬆</div>;
    }
  };

  const getStatusText = () => {
    if (isUploading) return 'Validating authentication key...';
    
    switch (uploadStatus) {
      case 'success':
        return `Authentication successful! File: ${fileName}`;
      case 'error':
        return `Authentication failed! File: ${fileName}`;
      default:
        return 'Drop your authentication key file here or click to browse';
    }
  };

  const getStatusColor = () => {
    if (isUploading) return 'text-blue-600';
    
    switch (uploadStatus) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 text-blue-500 mx-auto mb-4 text-6xl">🛡️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Authentication</h1>
          <p className="text-gray-400">Upload your authentication key file to access the admin panel</p>
        </div>

        <motion.div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer
            ${isDragOver 
              ? 'border-blue-500 bg-blue-500/10' 
              : uploadStatus === 'success'
              ? 'border-green-500 bg-green-500/10'
              : uploadStatus === 'error'
              ? 'border-red-500 bg-red-500/10'
              : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
            }
          `}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <input
            id="fileInput"
            type="file"
            accept=".txt,.key,text/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            <p className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </p>
          </div>
        </motion.div>

        <div className="mt-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-sm font-medium text-white mb-2">Instructions:</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>&bull; Upload a text file (.txt or .key) containing your authentication key</li>
            <li>&bull; File should contain only the authentication key string</li>
            <li>&bull; Maximum file size: 1KB</li>
            <li>&bull; Contact administrator if you don&apos;t have the key file</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="https://hack-a-byte-git-development-dhaval-suthars-projects.vercel.app/device-selection" 
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
