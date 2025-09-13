"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { getAvailableRoles, validateAndUseAccessCode } from "@/app/actions/userProgress";
import { CHARACTER_INFO, ROLE_LIMITS } from "@/lib/constants/app-constants";

function RoleSelectionClient() {
  const router = useRouter();
  const params = useSearchParams();
  const [accessCode, setAccessCode] = useState("");
  const [username, setUsername] = useState("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = params?.get("code") || "";
    setAccessCode(code);
    if (!code) {
      setError("Missing access code");
      setLoading(false);
      return;
    }
    (async () => {
    const res = await getAvailableRoles(code);
      if (res.success) {
        const available = (res.availableRoles || []).map(r => r.toLowerCase());
        setAvailableRoles(available);
        // derive all roles for this team size using ROLE_LIMITS
        if (res.totalSlots) {
          const limits = ROLE_LIMITS[res.totalSlots as keyof typeof ROLE_LIMITS];
          if (limits) setAllRoles(Object.keys(limits));
      // Persist team size for later client-side role gating (hackphone apps)
      try { localStorage.setItem('teamSize', String(res.totalSlots)); } catch (error) {
        console.warn('Failed to save team size to localStorage:', error);
      }
        }
      } else {
        setError(res.error || "Failed to load roles");
      }
      setLoading(false);
    })();
  }, [params]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) return setError("Enter a username");
    if (!selectedRole) return setError("Select a role");
    const res = await validateAndUseAccessCode({ accessCode, username: username.trim(), role: selectedRole });
    if (!res.success) {
      setError(res.error || "Failed to join team");
      // Refresh roles in case of duplicate role
      const refresh = await getAvailableRoles(accessCode);
      if (refresh.success) setAvailableRoles(refresh.availableRoles || []);
      return;
    }
    // Store the selected role in localStorage
    localStorage.setItem('selectedRole', selectedRole);
    if (res.playspaceId) {
      try {
        document.cookie = `playspaceId=${res.playspaceId}; path=/; SameSite=Lax`;
        localStorage.setItem('playspaceId', res.playspaceId);
      } catch (error) {
        console.warn('Failed to save playspace data to localStorage/cookies:', error);
      }
    }
    // When all joined or not, continue to device selection (device will be online only after all joined)
    router.push("/device-selection");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900/20 text-green-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/3 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.02]" 
           style={{ 
             backgroundImage: `
               linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
               linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
             `,
             backgroundSize: '50px 50px'
           }}>
      </div>

      <div className="w-full max-w-7xl relative z-10">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -50 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative inline-block"
          >
            <h1 className="text-7xl md:text-8xl font-mono font-black mb-6 relative">
              <span className="bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-2xl">
                Choose Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent">
                Character
              </span>
              {/* Glowing effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 opacity-20 blur-2xl"
                animate={{ 
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.05, 1] 
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl text-gray-300 font-mono mb-4 max-w-2xl mx-auto leading-relaxed"
          >
            Select your digital identity for the ultimate cyber heist
          </motion.p>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "12rem" }}
            transition={{ duration: 1, delay: 0.6 }}
            className="h-1 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 mx-auto rounded-full shadow-lg shadow-green-400/30"
          />
        </motion.div>

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full animate-spin mb-6"></div>
              <motion.div
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin"
                style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}
              />
            </div>
            <p className="font-mono text-green-400 text-lg">Initializing character database...</p>
          </motion.div>
        ) : (
          <motion.form 
            onSubmit={onSubmit} 
            className="space-y-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* User Info Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto"
            >
              <div className="space-y-3">
                <label className="block text-sm font-mono text-gray-300 mb-3 tracking-wider">ACCESS CODE</label>
                <div className="relative group">
                  <input 
                    value={accessCode} 
                    readOnly 
                    className="w-full bg-gray-800/30 border-2 border-gray-600/50 rounded-xl px-6 py-4 font-mono text-green-400 backdrop-blur-md transition-all duration-300 group-hover:border-green-500/50 group-hover:shadow-lg group-hover:shadow-green-500/10" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-mono text-gray-300 mb-3 tracking-wider">HACKER ALIAS</label>
                <div className="relative group">
                  <input 
                    value={username} 
                    onChange={(e)=>setUsername(e.target.value)} 
                    placeholder="Enter your digital identity..."
                    className="w-full bg-gray-800/30 border-2 border-gray-600/50 rounded-xl px-6 py-4 font-mono text-green-400 placeholder-gray-500/70 backdrop-blur-md focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 group-hover:border-green-500/50" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </div>
            </motion.div>
            
            {/* Character Selection */}
            <div className="space-y-8">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-3xl font-mono font-bold text-center text-gray-200 tracking-wider"
              >
                AVAILABLE OPERATIVES
              </motion.h2>
              
              {(allRoles.length === 0 && availableRoles.length === 0) ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="text-center py-16 relative"
                >
                  <div className="relative inline-block">
                    <div className="w-32 h-32 border-4 border-yellow-500/30 rounded-xl flex items-center justify-center mb-6 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-md">
                      <div className="text-6xl">⚠️</div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl blur-xl" />
                  </div>
                  <p className="text-yellow-400 text-2xl font-mono mb-3 font-bold">RECRUITMENT CLOSED</p>
                  <p className="text-gray-400 font-mono text-lg">All operative positions have been filled</p>
                </motion.div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.15,
                        delayChildren: 0.8
                      }
                    }
                  }}
                >
                  {(allRoles.length ? allRoles : availableRoles).map((characterName) => {
                    const character = CHARACTER_INFO[characterName as keyof typeof CHARACTER_INFO];
                    if (!character) return null;
                    
                    const isAvailable = availableRoles.includes(characterName);
                    const isSelected = selectedRole === characterName;
                    
                    return (
                      <motion.div
                        key={characterName}
                        variants={{
                          hidden: { opacity: 0, y: 50, rotateX: -15 },
                          visible: { 
                            opacity: 1, 
                            y: 0, 
                            rotateX: 0,
                            transition: {
                              duration: 0.8,
                              ease: [0.6, 0.01, 0.05, 0.95]
                            }
                          }
                        }}
                        whileHover={isAvailable ? { 
                          scale: 1.03,
                          y: -8,
                          rotateY: 2,
                          transition: { duration: 0.3, ease: "easeOut" }
                        } : {}}
                        whileTap={isAvailable ? { scale: 0.97 } : {}}
                        onClick={() => {
                          if (!isAvailable) {
                            setError(`Role already taken: ${character.name}`);
                            return;
                          }
                          setSelectedRole(characterName);
                        }}
                        className={`
                          relative rounded-2xl p-8 transition-all duration-500 overflow-hidden group
                          ${isAvailable 
                            ? (isSelected 
                                ? `${character.borderColor} border-3 shadow-2xl` 
                                : 'border-3 border-gray-700/50 hover:border-gray-600/70 shadow-xl shadow-black/20')
                            : 'border-3 border-gray-800/70 opacity-50 grayscale cursor-not-allowed'}
                          backdrop-blur-xl min-h-[420px] transform-gpu perspective-1000
                        `}
                        style={{
                          backgroundImage: `
                            linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.5) 100%), 
                            url(${character.image})
                          `,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat'
                        }}
                      >
                        {/* Taken Ribbon */}
                        {!isAvailable && (
                          <div className="absolute top-3 left-0">
                            <div className="bg-red-600/80 text-xs font-mono font-bold tracking-wider px-3 py-1 rounded-r-lg shadow-md">
                              TAKEN
                            </div>
                          </div>
                        )}
                        {/* Animated background overlay */}
                        <motion.div 
                          className={`absolute inset-0 bg-gradient-to-br ${
                            isSelected && isAvailable
                              ? `${character.bgGradient} opacity-50` 
                              : 'from-gray-900/40 via-gray-800/30 to-gray-900/60 opacity-70'
                          } transition-all duration-500`}
                          animate={isSelected && isAvailable ? {
                            background: [
                              `linear-gradient(135deg, ${character.color}15, ${character.color}05, ${character.color}20)`,
                              `linear-gradient(135deg, ${character.color}20, ${character.color}10, ${character.color}25)`,
                              `linear-gradient(135deg, ${character.color}15, ${character.color}05, ${character.color}20)`
                            ]
                          } : {}}
                          transition={{ duration: 2, repeat: isSelected ? Infinity : 0 }}
                        />
                        
                        {/* Floating particles effect */}
                        {isSelected && (
                          <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                              <motion.div
                                key={i}
                                className={`absolute w-1 h-1 bg-${character.color} rounded-full opacity-60`}
                                style={{
                                  left: `${Math.random() * 100}%`,
                                  top: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                  y: [-20, -60, -20],
                                  opacity: [0, 1, 0],
                                  scale: [0, 1, 0]
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  delay: i * 0.5,
                                  ease: "easeInOut"
                                }}
                              />
                            ))}
                          </div>
                        )}
                        
                        {/* Selection Indicator */}
                        {isSelected && isAvailable && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ 
                              type: "spring", 
                              stiffness: 200, 
                              damping: 15,
                              delay: 0.1 
                            }}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 border-2 border-white z-20"
                          >
                            <motion.svg 
                              className="w-5 h-5 text-white" 
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                            >
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </motion.svg>
                          </motion.div>
                        )}

                        <div className="relative z-10 flex flex-col h-full justify-between">
                          {/* Character Icon/Symbol */}
                          <motion.div 
                            className={`w-20 h-20 mb-6 rounded-2xl flex items-center justify-center ${
                              isSelected && isAvailable ? character.borderColor : 'border-gray-500/70'
                            } border-3 bg-black/80 backdrop-blur-xl shadow-2xl group-hover:shadow-xl transition-all duration-300`}
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <span className={`text-3xl font-black ${isSelected ? character.textColor : 'text-gray-200'} drop-shadow-lg`}>
                              {characterName.charAt(0)}
                            </span>
                          </motion.div>

                          <div className="flex-1 flex flex-col justify-center space-y-4">
                            {/* Character Name */}
                            <motion.h3 
                              className={`text-2xl font-mono font-black mb-2 ${isSelected && isAvailable ? character.textColor : 'text-gray-100'} drop-shadow-lg tracking-wider`}
                              animate={isSelected && isAvailable ? { scale: [1, 1.05, 1] } : {}}
                              transition={{ duration: 2, repeat: isSelected && isAvailable ? Infinity : 0 }}
                            >
                              {character.name}
                            </motion.h3>

                            {/* Role Badge */}
                            <div className={`px-4 py-2 rounded-xl text-sm font-mono font-bold inline-block transition-all duration-300
                              ${isSelected && isAvailable ? `${character.textColor} bg-black/70 border-2 ${character.borderColor} backdrop-blur-xl shadow-lg` 
                                : 'text-gray-200 bg-black/80 border-2 border-gray-500/70 backdrop-blur-xl'}
                              ${!isAvailable ? 'opacity-70 line-through decoration-red-500/70 decoration-2' : ''}
                            `}>
                              {character.role}{!isAvailable && ' (Taken)'}
                            </div>

                            {/* Description */}
                            <motion.p 
                              className="text-sm text-gray-100 leading-relaxed bg-black/70 rounded-xl p-4 backdrop-blur-xl border border-white/10 shadow-inner"
                              initial={{ opacity: 0.8 }}
                              whileHover={{ opacity: 1 }}
                            >
                              {character.description}
                            </motion.p>
                          </div>

                          <div className="space-y-4">
                            {/* Skills */}
                            <div className="flex flex-wrap justify-center gap-2">
                              {character.skills.map((skill, skillIndex) => (
                                <motion.span 
                                  key={skillIndex}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: skillIndex * 0.1 }}
                                  whileHover={{ scale: 1.05 }}
                                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-black/70 backdrop-blur-xl border transition-all duration-200 ${
                                      isSelected && isAvailable
                                        ? `${character.textColor} ${character.borderColor} shadow-lg` 
                                        : 'text-gray-300 border-gray-500/70 hover:border-gray-400'
                                    } ${!isAvailable ? 'opacity-50' : ''}`}
                                >
                                  {skill}
                                </motion.span>
                              ))}
                            </div>

                            {/* Specialty */}
                            <motion.div 
                              className={`text-xs italic bg-black/70 backdrop-blur-xl rounded-xl p-3 border border-white/10 text-center ${
                                isSelected && isAvailable ? character.textColor : 'text-gray-300'
                              } transition-colors duration-300 ${!isAvailable ? 'opacity-60' : ''}`}
                              whileHover={{ scale: 1.02 }}
                            >
                              &ldquo;{character.specialty}&rdquo;
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
              
              {/* Selected Character Confirmation */}
              {selectedRole && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                  className="max-w-lg mx-auto p-6 bg-gradient-to-r from-green-900/40 to-blue-900/40 border-2 border-green-500/60 rounded-2xl backdrop-blur-xl shadow-2xl shadow-green-500/20"
                >
                  <div className="flex items-center justify-center space-x-4">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-green-500/30 flex items-center justify-center border border-green-400"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    >
                      <svg className="w-7 h-7 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                    <div className="text-center">
                      <p className="text-green-300 font-mono text-lg font-bold">
                        OPERATIVE SELECTED
                      </p>
                      <p className="text-white font-mono">
                        <strong>{CHARACTER_INFO[selectedRole as keyof typeof CHARACTER_INFO]?.name}</strong> 
                        <span className="text-gray-300"> - {CHARACTER_INFO[selectedRole as keyof typeof CHARACTER_INFO]?.role}</span>
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="max-w-lg mx-auto p-6 bg-gradient-to-r from-red-900/40 to-red-800/30 border-2 border-red-500/60 rounded-2xl backdrop-blur-xl shadow-2xl shadow-red-500/20"
              >
                <div className="flex items-center space-x-4">
                  <div className="text-red-400 text-2xl animate-pulse">⚠️</div>
                  <div>
                    <p className="text-red-300 font-mono font-bold text-sm">SYSTEM ERROR</p>
                    <p className="text-red-400 font-mono text-sm">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.div 
              className="flex justify-center pt-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <motion.button 
                type="submit" 
                disabled={!selectedRole || !username.trim()}
                whileHover={!selectedRole || !username.trim() ? {} : { 
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(16, 185, 129, 0.3)"
                }}
                whileTap={!selectedRole || !username.trim() ? {} : { scale: 0.95 }}
                className={`
                  relative px-12 py-6 rounded-2xl font-mono font-bold text-xl transition-all duration-500 backdrop-blur-xl overflow-hidden group
                  ${(!selectedRole || !username.trim()) 
                    ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed border-2 border-gray-600/50' 
                    : 'bg-gradient-to-r from-green-600 to-blue-600 text-white border-2 border-green-500/60 shadow-2xl shadow-green-500/30 hover:shadow-green-500/50'
                  }
                `}
              >
                {/* Button background animation */}
                {selectedRole && username.trim() && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    animate={{
                      background: [
                        "linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))",
                        "linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))",
                        "linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                <span className="relative z-10 tracking-wider">
                  {(!selectedRole || !username.trim()) ? 'SELECT OPERATIVE & ENTER ALIAS' : 'INITIATE HEIST PROTOCOL →'}
                </span>
              </motion.button>
            </motion.div>
          </motion.form>
        )}
      </div>
    </main>
  );
}

export default function RoleSelectionPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-black text-green-400 flex items-center justify-center p-4"><p className="font-mono">Loading...</p></main>}>
      <RoleSelectionClient />
    </Suspense>
  );
}
