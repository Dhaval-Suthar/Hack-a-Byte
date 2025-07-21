"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "danger" | "success" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}

export default function Button({
  children,
  onClick,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  isLoading = false,
  className = "",
  type = "button",
  ariaLabel,
}: ButtonProps) {
  // Base styles
  const baseStyles = "relative rounded font-medium transition-all duration-200 flex items-center justify-center";

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  // Variant styles
  const variantStyles = {
    primary:
      "bg-gradient-to-r from-cyber-primary to-cyber-secondary text-black hover:opacity-90 active:opacity-100 active:scale-95",
    secondary: "bg-gray-800 text-white hover:bg-gray-700 active:bg-gray-900 active:scale-95",
    outline:
      "bg-transparent border border-cyber-primary/60 text-cyber-primary hover:border-cyber-primary hover:bg-cyber-primary/10 active:scale-95",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 active:scale-95",
    success: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 active:scale-95",
    ghost: "bg-transparent text-cyber-primary hover:bg-cyber-primary/10 active:bg-cyber-primary/20 active:scale-95",
  };

  // Combined styles
  const combinedStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
    fullWidth ? "w-full" : ""
  } ${className}`;

  // Disabled styles
  const disabledStyles = "opacity-50 cursor-not-allowed";

  // Loading spinner
  const loadingSpinner = (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  );

  // Handle button or link rendering
  if (href) {
    return (
      <Link 
        href={href} 
        className={`${combinedStyles} ${disabled ? disabledStyles : ""}`}
        aria-disabled={disabled}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            return;
          }
          onClick?.();
        }}
      >
        <motion.span 
          className="flex items-center justify-center w-full h-full"
          whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
          {isLoading && loadingSpinner}
          <span className={isLoading ? "invisible" : ""}>{children}</span>
        </motion.span>
      </Link>
    );
  }

  return (
    <motion.button
      type={type}
      className={`${combinedStyles} ${disabled ? disabledStyles : ""}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      aria-label={ariaLabel}
    >
      {isLoading && loadingSpinner}
      <span className={isLoading ? "invisible" : ""}>{children}</span>
    </motion.button>
  );
}
