"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

export default function QuickActions({ onAction }: QuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: "generate-code",
      label: "Generate Access Code",
      icon: "🔑",
      description: "Create new access code",
      color: "from-blue-500 to-blue-600"
    },
    {
      id: "create-user",
      label: "Add User",
      icon: "👤",
      description: "Register new user",
      color: "from-green-500 to-green-600"
    },
    {
      id: "create-team",
      label: "Create Team",
      icon: "👥",
      description: "Form new team",
      color: "from-purple-500 to-purple-600"
    },
    {
      id: "add-device",
      label: "Register Device",
      icon: "💻",
      description: "Add new device",
      color: "from-orange-500 to-orange-600"
    },
    {
      id: "create-event",
      label: "New Event",
      icon: "📅",
      description: "Schedule event",
      color: "from-pink-500 to-pink-600"
    },
    {
      id: "system-health",
      label: "System Health",
      icon: "⚡",
      description: "Check system status",
      color: "from-red-500 to-red-600"
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.div
        initial={false}
        animate={isExpanded ? "expanded" : "collapsed"}
        className="relative"
      >
        {/* Action Buttons */}
        <motion.div
          variants={{
            expanded: { opacity: 1, scale: 1 },
            collapsed: { opacity: 0, scale: 0.8 }
          }}
          className="absolute bottom-16 right-0 space-y-3"
        >
          {actions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onAction(action.id);
                setIsExpanded(false);
              }}
              className={`flex items-center space-x-3 px-4 py-3 bg-gradient-to-r ${action.color} text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 min-w-[200px]`}
            >
              <span className="text-lg">{action.icon}</span>
              <div className="text-left">
                <div className="font-medium text-sm">{action.label}</div>
                <div className="text-xs opacity-90">{action.description}</div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Main Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-14 h-14 bg-gradient-to-r from-cyber-primary to-cyber-secondary rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-white text-xl`}
        >
          <motion.span
            animate={{ rotate: isExpanded ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            +
          </motion.span>
        </motion.button>
      </motion.div>
    </div>
  );
}
