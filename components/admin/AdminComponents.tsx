// Reusable components for admin dashboard

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { TabType } from "@/components/admin/types";
import { TAB_LABELS } from "@/lib/admin-utils";

interface AdminHeaderProps {
  onLogout: () => void;
}

export const AdminHeader = ({ onLogout }: AdminHeaderProps) => (
  <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-10">
    <div className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyber-primary to-cyber-secondary">
          HackaByte Admin
        </h1>

        <div className="flex items-center space-x-4">
          <span className="text-gray-400">
            <span className="inline-flex items-center">
              <svg className="w-4 h-4 mr-1 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              File Authenticated
            </span>
          </span>
          <button
            onClick={onLogout}
            className="px-3 py-1 bg-red-800 hover:bg-red-700 text-white rounded text-sm"
          >
            Logout
          </button>
          <Link
            href="/"
            className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 transition text-gray-300"
          >
            Back to Site
          </Link>
        </div>
      </div>
    </div>
  </header>
);

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const tabs: TabType[] = ["users", "teams", "accessCodes", "playspaces", "devices", "events"];

  return (
    <div className="mb-6 border-b border-gray-700">
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`py-3 px-6 ${
              activeTab === tab
                ? "border-b-2 border-cyber-primary text-cyber-primary"
                : "text-gray-400 hover:text-gray-200"
            } transition-colors focus:outline-none capitalize`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>
    </div>
  );
};

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) =>
  error ? (
    <div className="mb-6 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
      {error}
    </div>
  ) : null;

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Loading dashboard data..." }: LoadingSpinnerProps) => (
  <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-t-4 border-b-4 border-cyber-primary rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-300">{message}</p>
    </div>
  </div>
);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ y: "-100px", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100px", opacity: 0 }}
          className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4"
        >
          <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
          {children}
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

interface TabContentWrapperProps {
  children: React.ReactNode;
}

export const TabContentWrapper = ({ children }: TabContentWrapperProps) => (
  <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg border border-gray-800">
    {children}
  </div>
);
