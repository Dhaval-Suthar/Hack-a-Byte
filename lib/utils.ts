// Common utility functions for handling various application needs

import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

// Type for authentication check response
type AuthCheckResult = {
  isAuthenticated: boolean;
  user: any | null;
  error?: string;
};

/**
 * Check if user is authenticated and redirect if not
 * Use this in server components or server actions that require authentication
 */
export async function requireAuth(redirectTo = "/login"): Promise<AuthCheckResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(redirectTo);
  }
  
  return {
    isAuthenticated: true,
    user: session.user
  };
}

/**
 * Check if user is an admin and redirect if not
 * Use this in server components or server actions that require admin authentication
 */
export async function requireAdmin(redirectTo = "/login"): Promise<AuthCheckResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect(redirectTo);
  }
  
  if (!session.user.isAdmin) {
    redirect("/"); // Redirect non-admin users to home page
  }
  
  return {
    isAuthenticated: true,
    user: session.user
  };
}

/**
 * Check authentication status without redirecting
 * Use this when you want to conditionally render based on auth status
 */
export async function checkAuth(): Promise<AuthCheckResult> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { 
      isAuthenticated: false, 
      user: null,
      error: "Not authenticated"
    };
  }
  
  return {
    isAuthenticated: true,
    user: session.user
  };
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return `${formatDate(d)} at ${formatTime(d)}`;
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}
