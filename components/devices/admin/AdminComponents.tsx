// Reusable components for admin dashboard

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner = ({ message = "Loading dashboard data..." }: LoadingSpinnerProps) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
    <div className="text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-cyber-primary/30 border-t-cyber-primary rounded-full mx-auto mb-6"
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-300 text-lg font-medium"
      >
        {message}
      </motion.p>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: 0.5, duration: 2 }}
        className="h-1 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-full mt-4 max-w-xs mx-auto"
      />
    </div>
  </div>
);
