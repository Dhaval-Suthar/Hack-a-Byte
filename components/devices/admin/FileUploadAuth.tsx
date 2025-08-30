"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const EXPECTED_AUTH_KEY = process.env.NEXT_PUBLIC_ADMIN_AUTH_KEY || 'hackabyte-admin-key-2024';

  const validateFile = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const trimmedContent = content.trim();
          
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
      
      if (isValid) {
        setUploadStatus('success');
        // Add a brief delay to show success state
        setTimeout(() => {
          onAuthSuccess(EXPECTED_AUTH_KEY);
        }, 1000);
      } else {
        setUploadStatus('error');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-cyber-primary to-cyber-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Admin Access
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            Upload your authentication key to access the admin panel
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl"
        >
          <motion.div
            animate={isDragOver ? { scale: 1.02 } : { scale: 1 }}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer
              ${isDragOver
                ? 'border-cyber-primary bg-cyber-primary/10'
                : uploadStatus === 'success'
                ? 'border-green-500 bg-green-500/10'
                : uploadStatus === 'error'
                ? 'border-red-500 bg-red-500/10'
                : 'border-gray-600 hover:border-gray-500'
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
              <AnimatePresence mode="wait">
                {isUploading && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-16 h-16 border-4 border-cyber-primary/30 border-t-cyber-primary rounded-full"
                    transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" } }}
                  />
                )}

                {uploadStatus === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}

                {uploadStatus === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.div>
                )}

                {!isUploading && uploadStatus === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.p
                  key={uploadStatus + isUploading}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-sm font-medium ${
                    isUploading
                      ? 'text-cyber-primary'
                      : uploadStatus === 'success'
                      ? 'text-green-400'
                      : uploadStatus === 'error'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {getStatusText()}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30"
          >
            <h3 className="text-sm font-medium text-white mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-cyber-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Instructions
            </h3>
            <ul className="text-xs text-gray-400 space-y-2">
              <li className="flex items-start">
                <span className="text-cyber-primary mr-2">•</span>
                Upload a text file (.txt or .key) containing your authentication key
              </li>
              <li className="flex items-start">
                <span className="text-cyber-primary mr-2">•</span>
                File should contain only the authentication key string
              </li>
              <li className="flex items-start">
                <span className="text-cyber-primary mr-2">•</span>
                Maximum file size: 1KB
              </li>
              <li className="flex items-start">
                <span className="text-cyber-primary mr-2">•</span>
                Contact administrator if you don&apos;t have the key file
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 text-center"
          >
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
