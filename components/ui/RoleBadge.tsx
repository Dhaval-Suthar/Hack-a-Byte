"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface RoleBadgeProps {
  role: 'professor' | 'attacker' | 'defender' | 'extractor' | 'bot';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

const roleConfig = {
  professor: {
    label: 'Professor',
    color: 'bg-purple-600',
    textColor: 'text-purple-100',
    icon: '🎓',
    description: 'Strategic Commander'
  },
  attacker: {
    label: 'Attacker',
    color: 'bg-red-600',
    textColor: 'text-red-100',
    icon: '⚔️',
    description: 'Cyber Warfare Operative'
  },
  defender: {
    label: 'Defender',
    color: 'bg-blue-600',
    textColor: 'text-blue-100',
    icon: '🛡️',
    description: 'System Security Specialist'
  },
  extractor: {
    label: 'Extractor',
    color: 'bg-green-600',
    textColor: 'text-green-100',
    icon: '💰',
    description: 'Resource Acquisition Specialist'
  },
  bot: {
    label: 'AI Bot',
    color: 'bg-gray-600',
    textColor: 'text-gray-100',
    icon: '🤖',
    description: 'Artificial Intelligence'
  }
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base'
};

export default function RoleBadge({
  role,
  size = 'md',
  animated = true,
  className = ""
}: RoleBadgeProps) {
  const config = roleConfig[role];

  const badge = (
    <div className={`inline-flex items-center gap-2 ${config.color} ${config.textColor} rounded-full font-medium ${sizeClasses[size]} ${className}`}>
      <motion.span
        animate={animated ? { rotate: [0, 10, -10, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
        className="text-lg"
      >
        {config.icon}
      </motion.span>
      <span>{config.label}</span>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {badge}
      </motion.div>
    );
  }

  return badge;
}

// Role selection card component
export function RoleCard({
  role,
  isSelected = false,
  onClick,
  disabled = false
}: {
  role: RoleBadgeProps['role'];
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const config = roleConfig[role];

  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? `${config.color} border-white shadow-lg`
          : disabled
            ? 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed'
            : 'bg-gray-900 border-gray-700 hover:border-gray-500'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <motion.span
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          className="text-2xl"
        >
          {config.icon}
        </motion.span>
        <div>
          <h3 className="font-bold text-white">{config.label}</h3>
          <p className="text-sm text-gray-400">{config.description}</p>
        </div>
      </div>

      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center"
        >
          <span className="text-black text-sm font-bold">✓</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// Team composition display
export function TeamComposition({
  members,
  className = ""
}: {
  members: Array<{ role: RoleBadgeProps['role']; name?: string }>;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {members.map((member, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full"
        >
          <RoleBadge role={member.role} size="sm" animated={false} />
          {member.name && (
            <span className="text-gray-300 text-sm">{member.name}</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
