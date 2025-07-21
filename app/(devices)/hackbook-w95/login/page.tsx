"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createDeviceUser, getDeviceUser } from "@/app/actions/deviceUser";
import BootAnimation from "@/components/hackbook-w95/boot-animation";
import { getPlayspaceId } from "@/lib/playspace-utils";

const Page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayspaceUser, setIsPlayspaceUser] = useState(false);
  const [playspaceId, setPlayspaceId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showBootScreen, setShowBootScreen] = useState(true);
  
  // Show boot animation on initial load
  useEffect(() => {
    // Show boot screen for 9 seconds (matches the boot animation timing)
    const bootTimer = setTimeout(() => {
      setShowBootScreen(false);
    }, 9000);
    
    return () => clearTimeout(bootTimer);
  }, []);
  
  useEffect(() => {
    // Get playspace ID and device ID using our utility (checks cookies and localStorage)
    let id = getPlayspaceId();
    let devId = null;
    
    // If not found in cookie or localStorage, check URL params as fallback
    if (!id && typeof window !== 'undefined') {
      id = searchParams.get('playspaceId');
      // If found in URL, save to localStorage for future use
      if (id) {
        localStorage.setItem('playspaceId', id);
      }
    }
    
    // Get device ID from URL params
    if (typeof window !== 'undefined') {
      devId = searchParams.get('deviceId');
      if (devId) {
        setDeviceId(devId);
        // Save to localStorage for this session
        localStorage.setItem('selectedDeviceId', devId);
      } else {
        // Try to get from localStorage if not in URL
        devId = localStorage.getItem('selectedDeviceId');
        if (devId) {
          setDeviceId(devId);
        }
      }
    }
    
    if (id) {
      setPlayspaceId(id);
      setIsPlayspaceUser(true);
    }
  }, [searchParams]);
  
  useEffect(() => {
    // Check if user is already logged in to this specific device type
    const checkDeviceLogin = async () => {
      if (playspaceId && deviceId) {
        const result = await getDeviceUser(deviceId, "hackbook-w95");
        if (result.isLoggedIn && result.user) {
          // Import dynamically to avoid SSR issues
          import('@/components/hackbook-w95/hooks/useUserLogs').then(({ UserLogManager }) => {
            // Log the auto-login attempt
            UserLogManager.addLoginLog({
              username: result.user.username,
              success: true,
              device: "hackbook-w95",
              ip: "127.0.0.1" // Default for auto-login
            });
            
            // Also add system log with device ID info
            UserLogManager.addSystemLog(
              'system',
              `User ${result.user.username} logged in automatically${deviceId ? ` to device ${deviceId}` : ''}`,
              'Auto-login from saved session'
            );
          });
          
          // Auto-login with saved playspace user, pass deviceId as query param if available
          const targetUrl = deviceId ? `/hackbook-w95?deviceId=${deviceId}` : "/hackbook-w95";
          router.push(targetUrl);
        }
      }
    };
    
    checkDeviceLogin();
  }, [playspaceId, deviceId, router]);

  const handleToggleMode = () => {
    setIsSigningUp(!isSigningUp);
    setError(null);
  };

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    
    if (!username || !password) {
      setError("Please enter both username and password");
      setIsLoading(false);
      return;
    }
    
    try {
      if (!playspaceId) {
      setError("Playspace ID is required for login");
      setIsLoading(false);
      return;
      }

      // Playspace-specific login using API
      const response = await fetch("/api/playspace/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        playspaceId,
        deviceType: "hackbook-w95",
        deviceId: deviceId // Include specific device ID if available
      }),
      });
      
      const data = await response.json();

      if (!response.ok) {
      setError(data.error || "Login failed");
      setIsLoading(false);
      return;
      }
      
      // Success - redirect to device with deviceId if available
      const targetUrl = deviceId ? `/hackbook-w95?deviceId=${deviceId}` : "/hackbook-w95";
      router.push(targetUrl);
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
      setIsLoading(false);
    }
  };

  const handleSignup = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    
    if (!username || !password || !confirmPassword) {
      setError("Please fill all required fields");
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    try {
      if (!isPlayspaceUser || !playspaceId || !deviceId) {
        return setError("Playspace ID and Device ID are required for device-specific accounts");
      }

      // Create device-specific user
      const result = await createDeviceUser(username, password, deviceId, "hackbook-w95");


      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Success - redirect to device with deviceId if available
      const targetUrl = deviceId ? `/hackbook-w95?deviceId=${deviceId}` : "/hackbook-w95";
      router.push(targetUrl);
      return;
    } catch (err) {
      console.error("Signup error:", err);
      setError("An error occurred during sign up");
      setIsLoading(false);
    }
  };

  const handleInfo = () => {
    if (isPlayspaceUser) {
      alert("Create a device-specific account that will be remembered just for this playspace. This account doesn't require email and is separate from your main site account.");
    } else {
      alert("Welcome to HackBook W95! Log in with existing credentials or create a new account to start your hacking journey.");
    }
  };

  if (showBootScreen) {
    return <BootAnimation />;
  }

  return (
    <main className="bg-[#008080] text-black h-screen w-screen flex items-center justify-center">
      {showBootScreen ? (
        <div className="fixed inset-0 z-50">
          <BootAnimation />
        </div>
      ) : (
        <div className="bg-[#BBC2C2] h-auto max-h-[90vh] w-[600px] border-2 shadow shadow-black border-black border-t-white border-l-white">
        <div className="w-auto h-8 bg-blue-900 m-1 flex justify-between">
          <h1 className="text-xl text-white font-semibold justify-self-start mx-2">
            {isSigningUp 
              ? "Create Account - hackbook-W95" 
              : "Welcome to hackbook-W95"}
          </h1>
          <div className="flex text-center font-extrabold text-xl">
            <div
              onClick={handleInfo}
              className="bg-[#BBC2C2] h-7 w-7 m-0.5 hover:border-b-white hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white"
            >
              ?
            </div>
            <Link href="/dashboard">
              <div className="bg-[#BBC2C2] h-7 w-7 m-0.5 hover:border-b-white hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white">
                X
              </div>
            </Link>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-200 border border-red-500 text-red-900 p-2 m-1 text-sm">
            {error}
          </div>
        )}
        
        {isPlayspaceUser && (
          <div className="bg-purple-200 border border-purple-500 text-purple-900 p-2 m-1 text-sm">
            {isSigningUp 
              ? `Creating a device-specific account for this playspace${deviceId ? ` (Device: ${deviceId})` : ''}` 
              : `Logging in with a device-specific account for this playspace${deviceId ? ` (Device: ${deviceId})` : ''}`}
          </div>
        )}
        
        <form action={isSigningUp ? handleSignup : handleLogin}>
          <div className="w-auto h-auto flex m-1 p-4">
            <div className="w-1/5 h-full flex justify-center items-start pt-4">
              <Image 
                src="/hackbook-W95/app-icon/key.png" 
                alt="Key icon" 
                width={86} 
                height={86}
                style={{ width: '86px', height: '86px' }}
                priority
              />
            </div>
            <div className={`w-3/5 ${isSigningUp ? 'min-h-[260px]' : 'min-h-[220px]'} flex flex-col justify-around space-y-4`}>
              <h1 className="mb-3">
                {isSigningUp
                  ? "Create a user account for hackbook-W95"
                  : "Type a user name and password to log on to hackbook-W95"}
              </h1>
              
              <div className="flex items-center mb-4">
                <div className="flex p-1 w-24">
                  <h1 className="underline">U</h1>
                  <h1>sername: </h1>
                </div>
                <input
                  className="bg-white h-8 w-40 border-2 shadow shadow-black border-black border-b-white border-r-white"
                  name="username"
                  autoComplete="username"
                />
              </div>
              
              <div className="flex items-center mb-4">
                <div className="flex p-1 w-24">
                  <h1 className="underline">P</h1>
                  <h1>assword: </h1>
                </div>
                <input
                  type="password"
                  name="password"
                  className="bg-white h-8 w-40 border-2 shadow shadow-black border-black border-b-white border-r-white"
                  autoComplete={isSigningUp ? "new-password" : "current-password"}
                />
              </div>
              
              {isSigningUp && (
                <div className="flex items-center mb-4">
                  <div className="flex p-1 w-24">
                    <h1 className="underline">C</h1>
                    <h1>onfirm: </h1>
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    className="bg-white h-8 w-40 border-2 shadow shadow-black border-black border-b-white border-r-white"
                    autoComplete="new-password"
                  />
                </div>
              )}
              
              <div className="flex justify-center mt-4 pt-2 border-t border-gray-400">
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="bg-[#BBC2C2] px-4 py-1 text-center underline text-blue-800 hover:text-blue-600"
                >
                  {isSigningUp ? "Already have an account? Log in" : "Create new account"}
                </button>
              </div>
            </div>
            
            <div className="w-1/5 h-full flex flex-col justify-start pt-6 space-y-6">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#BBC2C2] h-9 w-32 mx-auto text-center hover:border-b-white hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? "Processing..." : isSigningUp ? "Create" : "OK"}
              </button>
              
              <Link href={`/device-selection${playspaceId ? `?playspaceId=${playspaceId}` : ''}`}>
                <div className="bg-[#BBC2C2] h-9 w-32 mx-auto text-center hover:border-b-white hover:border-r-white hover:border-l-black hover:border-t-black border-2 shadow shadow-black border-black border-t-white border-l-white flex items-center justify-center">
                  Cancel
                </div>
              </Link>
            </div>
          </div>
        </form>
      </div>
      )}
    </main>
  );
};

export default Page;
