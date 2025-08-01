"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { handleGameFailure, getHackbookLoginUrl } from "@/app/actions/gameFailure";

/**
 * Custom hook to handle game failures
 * Provides functionality to delete user account and redirect to login on game failure
 */
export const useGameFailureHandler = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessingFailure, setIsProcessingFailure] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  /**
   * Handle game failure - delete account and redirect to login
   */
  const handleFailure = useCallback(async () => {
    if (isProcessingFailure) return; // Prevent multiple calls
    
    setIsProcessingFailure(true);
    
    try {
      // Get device and playspace info from URL or local storage
      const deviceId = searchParams?.get('device') || 
                      searchParams?.get('devId') || 
                      (typeof window !== 'undefined' ? localStorage.getItem('selectedDeviceId') : null) || 
                      'unknown';
      
      const playspaceId = searchParams?.get('playspace') || 
                         searchParams?.get('id') || 
                         (typeof window !== 'undefined' ? localStorage.getItem('selectedPlayspaceId') : null);

      // Call server action to delete account
      const result = await handleGameFailure(deviceId, 'hackbook-w95');

      if (result.success) {
        // Clear client-side storage but preserve device and playspace info for re-login
        if (typeof window !== 'undefined') {
          // Preserve device and playspace IDs for re-login
          const preservedDeviceId = localStorage.getItem('selectedDeviceId');
          const preservedPlayspaceId = localStorage.getItem('selectedPlayspaceId');
          
          // Clear game-related storage but not device/playspace info
          localStorage.removeItem('gameProgress');
          localStorage.removeItem('missionBriefingSeen');
          // Clear any other game-related storage
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('game_') || key.startsWith('mission_') || key.startsWith('user_')) {
              localStorage.removeItem(key);
            }
          });
          
          // Restore device and playspace IDs so user can log back into same device
          if (preservedDeviceId) {
            localStorage.setItem('selectedDeviceId', preservedDeviceId);
          }
          if (preservedPlayspaceId) {
            localStorage.setItem('selectedPlayspaceId', preservedPlayspaceId);
          }
        }

        // Show a brief message before redirecting
        setAlertMessage(`Mission Failed!\n\n${result.message}`);
        setShowAlert(true);

        // Redirect to login page
        const loginUrl = await getHackbookLoginUrl(deviceId, playspaceId || undefined);
        router.push(loginUrl);
      } else {
        console.error('Failed to handle game failure:', result.error);
        // Still redirect to login as fallback
        const loginUrl = await getHackbookLoginUrl(deviceId, playspaceId || undefined);
        router.push(loginUrl);
      }
    } catch (error) {
      console.error('Error processing game failure:', error);
      // Fallback - still redirect to login
      const deviceId = searchParams?.get('device') || 'unknown';
      const playspaceId = searchParams?.get('playspace');
      const loginUrl = await getHackbookLoginUrl(deviceId, playspaceId || undefined);
      router.push(loginUrl);
    } finally {
      setIsProcessingFailure(false);
    }
  }, [router, searchParams, isProcessingFailure]);

  const closeAlert = useCallback(() => {
    setShowAlert(false);
    setAlertMessage(null);
  }, []);

  return {
    handleFailure,
    isProcessingFailure,
    alertMessage,
    showAlert,
    closeAlert
  };
};
