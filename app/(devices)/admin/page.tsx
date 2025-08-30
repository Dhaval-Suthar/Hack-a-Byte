"use client";

import FileUploadAuth from "@/components/devices/admin/FileUploadAuth";
import EnhancedAdminDashboard from "@/components/devices/admin/EnhancedAdminDashboard";
import { LoadingSpinner } from "@/components/devices/admin/AdminComponents";
import ErrorBoundary from "@/components/devices/admin/ErrorBoundary";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPage() {
  const {
    isAuthenticated,
    isLoading,
    authError,
    handleAuthSuccess,
    handleAuthFailed,
    clearError,
  } = useAdminAuth();

  // Show loading state during initialization
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
      >
        <LoadingSpinner message="Initializing admin panel..." />
      </motion.div>
    );
  }

  // Show error state if there's an authentication error
  if (authError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4"
      >
        <div className="max-w-md mx-auto p-8 bg-red-900/20 border border-red-500/50 rounded-xl backdrop-blur-sm shadow-2xl">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex items-center space-x-3 mb-6"
          >
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-400">
                {authError.type === 'session' ? 'Session Expired' : 'Authentication Error'}
              </h2>
              <p className="text-sm text-gray-400 mt-1">Access Denied</p>
            </div>
          </motion.div>
          <p className="text-gray-300 mb-6 leading-relaxed">{authError.message}</p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearError}
            className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all duration-200 shadow-lg"
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Show file upload authentication if not authenticated
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
        >
          <ErrorBoundary>
            <FileUploadAuth onAuthSuccess={handleAuthSuccess} onAuthFailed={handleAuthFailed} />
          </ErrorBoundary>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Show admin dashboard
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="dashboard"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900"
      >
        <ErrorBoundary>
          <EnhancedAdminDashboard />
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}
