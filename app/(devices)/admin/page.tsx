"use client";

import FileUploadAuth from "@/components/devices/admin/FileUploadAuth";
import AdminDashboard from "@/components/devices/admin/AdminDashboard";
import { LoadingSpinner } from "@/components/devices/admin/AdminComponents";
import ErrorBoundary from "@/components/devices/admin/ErrorBoundary";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function AdminPage() {
  const {
    isAuthenticated,
    authKey,
    isLoading,
    authError,
    handleAuthSuccess,
    handleAuthFailed,
    handleLogout,
    clearError,
  } = useAdminAuth();

  // Show loading state during initialization
  if (isLoading) {
    return <LoadingSpinner message="Initializing admin panel..." />;
  }

  // Show error state if there's an authentication error
  if (authError) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-red-900/20 border border-red-500 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-bold text-red-400">
              {authError.type === 'session' ? 'Session Expired' : 'Authentication Error'}
            </h2>
          </div>
          <p className="text-gray-300 mb-4">{authError.message}</p>
          <button
            onClick={clearError}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show file upload authentication if not authenticated
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <FileUploadAuth onAuthSuccess={handleAuthSuccess} onAuthFailed={handleAuthFailed} />
      </ErrorBoundary>
    );
  }

  // Show admin dashboard
  return (
    <ErrorBoundary>
      <AdminDashboard authKey={authKey} onLogout={handleLogout} />
    </ErrorBoundary>
  );
}
