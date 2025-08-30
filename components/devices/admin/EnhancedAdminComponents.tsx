"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "./AdminComponents";

interface BulkOperationItem {
  _id: string;
  name?: string;
  username?: string;
  code?: string;
}

interface BulkOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operation: 'delete' | 'activate' | 'deactivate' | 'export';
  items: BulkOperationItem[];
  onConfirm: () => void;
}

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date';
  options?: FilterOption[];
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: Record<string, string>) => void;
  placeholder: string;
  filters?: Filter[];
}

function BulkOperationModal({ isOpen, onClose, operation, items, onConfirm }: BulkOperationModalProps) {
  const getOperationDetails = () => {
    switch (operation) {
      case 'delete':
        return { title: 'Delete Items', color: 'red', icon: '🗑️' };
      case 'activate':
        return { title: 'Activate Items', color: 'green', icon: '✅' };
      case 'deactivate':
        return { title: 'Deactivate Items', color: 'yellow', icon: '⏸️' };
      case 'export':
        return { title: 'Export Data', color: 'blue', icon: '📊' };
      default:
        return { title: 'Bulk Operation', color: 'gray', icon: '⚙️' };
    }
  };

  const { title, color, icon } = getOperationDetails();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-white font-medium">
              {operation === 'export' ? 'Export' : 'Apply'} {operation} to {items.length} items?
            </p>
            <p className="text-gray-400 text-sm mt-1">
              This action {operation === 'export' ? 'will download' : 'cannot be undone'}.
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="max-h-40 overflow-y-auto bg-gray-800/50 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-2">Selected items:</p>
            {items.slice(0, 5).map((item, index) => (
              <div key={index} className="text-sm text-white py-1">
                • {item.name || item.username || item.code || `Item ${index + 1}`}
              </div>
            ))}
            {items.length > 5 && (
              <p className="text-sm text-gray-400 mt-2">
                ... and {items.length - 5} more items
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 bg-${color}-600 hover:bg-${color}-700 text-white rounded-lg transition-colors`}
          >
            {operation === 'export' ? 'Export' : 'Confirm'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

function Notification({ message, type, onClose }: NotificationProps) {
  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500'
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${colors[type]} text-white`}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white/80 hover:text-white"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: Record<string, string>) => void;
  placeholder: string;
  filters?: Filter[];
}

function AdvancedSearch({ onSearch, placeholder, filters }: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleSearch = () => {
    onSearch(query, activeFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={placeholder}
            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyber-primary"
          />
          <button
            onClick={handleSearch}
            className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white"
          >
            🔍
          </button>
        </div>
        {filters && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white hover:bg-gray-700/50 transition-colors"
          >
            Filters {Object.keys(activeFilters).length > 0 && `(${Object.keys(activeFilters).length})`}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showFilters && filters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/30"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {filter.label}
                  </label>
                  {filter.type === 'select' ? (
                    <select
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => setActiveFilters({
                        ...activeFilters,
                        [filter.key]: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
                    >
                      <option value="">All</option>
                      {filter.options?.map((option: FilterOption) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={filter.type || 'text'}
                      value={activeFilters[filter.key] || ''}
                      onChange={(e) => setActiveFilters({
                        ...activeFilters,
                        [filter.key]: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyber-primary"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => setActiveFilters({})}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/80 text-white rounded transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { BulkOperationModal, Notification, AdvancedSearch };
