"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createDeviceUser, getDeviceUser, loginDeviceUser } from "@/app/actions/deviceUser";
import HackPhoneBootScreen from "../../../../components/hackphone/HackPhoneBootScreen";
import HackPhoneLoginScreen from "../../../../components/hackphone/HackPhoneLoginScreen";
import { getPlayspaceId } from "@/lib/playspace-utils";

interface User {
  _id: string;
  username: string;
  sessionId?: string;
  progress: {
    unlockedApplications: string[];
    skills: Record<string, unknown>;
  };
  gameState: Record<string, unknown>;
}

const LoginPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayspaceUser, setIsPlayspaceUser] = useState(false);
  const [playspaceId, setPlayspaceId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showBootScreen, setShowBootScreen] = useState(true);
  const [showLoginAnimation, setShowLoginAnimation] = useState(false);
  const [loggedInUsername, setLoggedInUsername] = useState<string>("");
  const [showSlideToUnlock, setShowSlideToUnlock] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isCheckingLogin = useRef(false);
  
  // Show boot animation on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBootScreen(false);
    }, 3000); // Show boot screen for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      if (isCheckingLogin.current || !searchParams) return;
      isCheckingLogin.current = true;

      try {
        // Check if device has password set
        const savedPassword = typeof window !== 'undefined' ? localStorage.getItem('hackphone_password') : null;
        const hasDevicePassword = !!savedPassword;

        const urlPlayspaceId = searchParams.get("playspaceId");
        const urlDeviceId = searchParams.get("deviceId");
        
        if (urlPlayspaceId && urlDeviceId) {
          setPlayspaceId(urlPlayspaceId);
          setDeviceId(urlDeviceId);
          setIsPlayspaceUser(true);

          const result = await getDeviceUser(urlPlayspaceId, urlDeviceId);
      if (result.isLoggedIn && result.user) {
            setCurrentUser(result.user);
            setLoggedInUsername(result.user.username);
            setShowLoginAnimation(true);
            
            setTimeout(() => {
              router.push(`/hackphone?playspaceId=${urlPlayspaceId}&deviceId=${urlDeviceId}`);
            }, 2000);
          } else {
            if (!hasDevicePassword) {
              // Auto-login without password for first-time users
              setTimeout(() => {
        // Strip deviceId to avoid Desktop device auth loop
        router.push(`/hackphone?playspaceId=${urlPlayspaceId}`);
              }, 1000);
            } else {
              setShowSlideToUnlock(true);
            }
          }
        } else {
          const localPlayspaceId = getPlayspaceId();
          if (localPlayspaceId) {
            setPlayspaceId(localPlayspaceId);
            setIsPlayspaceUser(false);
            if (!hasDevicePassword) {
              // Auto-proceed to desktop
              setTimeout(() => {
                router.push(`/hackphone?playspaceId=${localPlayspaceId}`);
              }, 1000);
            } else {
              setShowSlideToUnlock(true);
            }
          } else {
            if (!hasDevicePassword) {
              // Auto-proceed to desktop with no playspace
              setTimeout(() => {
                router.push("/hackphone");
              }, 1000);
            } else {
              setShowSlideToUnlock(true);
            }
          }
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        // On error, check if password is set before proceeding
        const savedPassword = typeof window !== 'undefined' ? localStorage.getItem('hackphone_password') : null;
        if (!savedPassword) {
          setTimeout(() => {
            router.push("/hackphone");
          }, 1000);
        } else {
          setShowSlideToUnlock(true);
        }
      } finally {
        isCheckingLogin.current = false;
      }
    };

    if (!showBootScreen) {
      checkLoginStatus();
    }
  }, [searchParams, router, showBootScreen]);

  const handleLogin = async (username: string, password: string) => {
    const savedPassword = typeof window !== 'undefined' ? localStorage.getItem('hackphone_password') : null;
    
    if (savedPassword) {
      // Verify device password first
      if (password !== savedPassword) {
        setError("Incorrect passcode");
        return;
      }
      
      // Device password verified, proceed to desktop
      setLoggedInUsername("HackPhone User");
      setShowLoginAnimation(true);
      
      setTimeout(() => {
        // After passcode unlock, strip deviceId to prevent Desktop device auth redirect loop
        if (playspaceId) {
          router.push(`/hackphone?playspaceId=${playspaceId}`);
        } else {
          router.push("/hackphone");
        }
      }, 2000);
      return;
    }

    // Original login logic for playspace authentication
    if (!playspaceId) {
      setError("Playspace ID is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (isPlayspaceUser && deviceId) {
        result = await loginDeviceUser(playspaceId, deviceId, username, password);
      } else {
        result = await createDeviceUser(playspaceId, username, password, "hackphone");
      }

      if (result.success) {
        setLoggedInUsername(username);
        setShowLoginAnimation(true);
        
        setTimeout(() => {
          if (isPlayspaceUser && deviceId) {
            // Logged-in device user can keep deviceId
            router.push(`/hackphone?playspaceId=${playspaceId}&deviceId=${deviceId}`);
          } else {
            router.push(`/hackphone?playspaceId=${playspaceId}`);
          }
        }, 2000);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupToggle = () => {
    setIsSigningUp(!isSigningUp);
    setError(null);
  };

  const handleSlideToUnlock = () => {
    const savedPassword = typeof window !== 'undefined' ? localStorage.getItem('hackphone_password') : null;
    
    if (savedPassword) {
      // Show login form to enter password
      setShowSlideToUnlock(false);
    } else {
      // No password set, proceed directly
      if (currentUser) {
        setLoggedInUsername(currentUser.username);
        setShowLoginAnimation(true);
        setTimeout(() => {
          if (isPlayspaceUser && deviceId) {
            router.push(`/hackphone?playspaceId=${playspaceId}&deviceId=${deviceId}`);
          } else {
            router.push(`/hackphone?playspaceId=${playspaceId}`);
          }
        }, 2000);
      } else {
        // Proceed to desktop without authentication
        setTimeout(() => {
          // No passcode, do not include deviceId to avoid Desktop auth loop
          if (playspaceId) {
            router.push(`/hackphone?playspaceId=${playspaceId}`);
          } else {
            router.push("/hackphone");
          }
        }, 1000);
      }
    }
  };

  if (showBootScreen) {
    return <HackPhoneBootScreen />;
  }

  if (showLoginAnimation) {
    return <HackPhoneLoginScreen username={loggedInUsername} />;
  }

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto">
        <HackPhoneLoginScreen 
          onLogin={showSlideToUnlock ? undefined : handleLogin}
          error={error}
          isLoading={isLoading}
          isSigningUp={isSigningUp}
          onSignupToggle={handleSignupToggle}
          isPlayspaceUser={isPlayspaceUser}
          onSlideToUnlock={showSlideToUnlock ? handleSlideToUnlock : undefined}
        />
      </div>
    </div>
  );
};

const WrappedLoginPage = () => (
  <Suspense fallback={<HackPhoneBootScreen />}>
    <LoginPage />
  </Suspense>
);

export default WrappedLoginPage;
