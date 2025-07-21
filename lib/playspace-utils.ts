'use client';

import { getCookie } from 'cookies-next';

/**
 * Gets the playspace ID from cookies or localStorage
 * 
 * @returns The playspace ID or null if not found
 */
export function getPlayspaceId(): string | null {
  // First try to get from cookies (server-set)
  const cookiePlayspaceId = getCookie('playspaceId')?.toString() || null;
  
  if (cookiePlayspaceId) {
    return cookiePlayspaceId;
  }
  
  // Fallback to localStorage (client-set)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('playspaceId');
  }
  
  return null;
}
