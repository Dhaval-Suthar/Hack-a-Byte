"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEventRegistration } from "../../hooks/useEventRegistration";
import { RegistrationModalProps } from "../../types/event";

const RegistrationModal = ({ event, isOpen, onClose, onSuccess }: RegistrationModalProps) => {
  const { registerForEvent, loading } = useEventRegistration();
  const [email, setEmail] = useState("");
  const [playingDevice, setPlayingDevice] = useState<"smartphone" | "pc_laptop">("pc_laptop");
  const [numberOfPlayers, setNumberOfPlayers] = useState(1);
  const [selectedPricing, setSelectedPricing] = useState<"normal" | "extended">("normal");
  const [formError, setFormError] = useState("");

  // Reset form when event changes
  useEffect(() => {
    if (event) {
      // Set numberOfPlayers to minimum valid value for the event
      const minPlayers = event.minTeamMembers || 1;
      setNumberOfPlayers(minPlayers);

      setSelectedPricing("normal");
      setPlayingDevice("pc_laptop");
      setEmail("");
      setFormError("");
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) return;

    // Validate number of players
    const minPlayers = event.minTeamMembers || 1;
    const maxPlayers = event.maxTeamMembers || 4;

    if (numberOfPlayers < minPlayers || numberOfPlayers > maxPlayers) {
      setFormError(`Number of players must be between ${minPlayers} and ${maxPlayers}`);
      return;
    }

    // Use loading from hook instead of local state
    setFormError("");

    try {
      // Use the registration hook
      const result = await registerForEvent({
        eventId: event.id,
        eventObjectId: event.objectId,
        email: email.trim(),
        playingDevice,
        numberOfPlayers,
        pricingType: selectedPricing
      }, event.pricing && event.pricing.normal > 0 ? 'razorpay' : 'wallet');

      if (result.success) {
        onSuccess();
        onClose();
        // Reset form
        setEmail("");
        setPlayingDevice("pc_laptop");
        setNumberOfPlayers(1);
        // Redirect user to home page to enter access code
        window.location.href = "/";
      } else {
        setFormError(result.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setFormError("An unexpected error occurred");
    } finally {
      // Loading state is managed by the hook
    }
  };

  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-md bg-black/90 border border-cyber-primary/60 rounded-lg overflow-hidden"
          initial={{ y: 20, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 20, scale: 0.9 }}
        >
          {/* Header */}
          <div className="bg-cyber-primary/20 px-6 py-4">
            <h3 className="text-white font-bold mb-1 flex items-center">
              <svg className="w-5 h-5 mr-2 text-cyber-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {event.title}
            </h3>
            <div className="text-sm text-gray-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {event.date}
              <span className="mx-2">•</span>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {event.time}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="mb-4">
              <label className="flex items-center text-cyber-secondary text-sm font-bold mb-2">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/70 border border-cyber-primary/40 rounded-md px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label className="flex items-center text-cyber-secondary text-sm font-bold mb-2">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5l1.5 2H14a1 1 0 110 2H6a1 1 0 110-2h1.5L9 13H4a1 1 0 01-1-1V4zm1 1v6h12V5H4z" clipRule="evenodd" />
                </svg>
                Playing Device
              </label>
              <div className="flex space-x-4">
                {event.deviceRequirements?.types.mobile && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="smartphone"
                      checked={playingDevice === "smartphone"}
                      onChange={(e) => setPlayingDevice(e.target.value as "smartphone" | "pc_laptop")}
                      className="w-4 h-4 text-cyber-primary bg-black/70 border-cyber-primary/40 focus:ring-cyber-primary/50 focus:ring-2"
                      disabled={loading}
                    />
                    <span className="text-white text-sm">
                      <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM6 4a1 1 0 011-1h6a1 1 0 011 1v10H6V4z" clipRule="evenodd" />
                      </svg>
                      Mobile Device
                    </span>
                  </label>
                )}
                {event.deviceRequirements?.types.desktop && (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      value="pc_laptop"
                      checked={playingDevice === "pc_laptop"}
                      onChange={(e) => setPlayingDevice(e.target.value as "smartphone" | "pc_laptop")}
                      className="w-4 h-4 text-cyber-primary bg-black/70 border-cyber-primary/40 focus:ring-cyber-primary/50 focus:ring-2"
                      disabled={loading}
                    />
                    <span className="text-white text-sm">
                      <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5l1.5 2H14a1 1 0 110 2H6a1 1 0 110-2h1.5L9 13H4a1 1 0 01-1-1V4zm1 1v6h12V5H4z" clipRule="evenodd" />
                      </svg>
                      PC/Laptop
                    </span>
                  </label>
                )}
                {!event.deviceRequirements?.types.mobile && !event.deviceRequirements?.types.desktop && (
                  <div className="text-gray-400 text-sm">No specific device requirements</div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center text-cyber-secondary text-sm font-bold mb-2">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
                Number of Players ({event.minTeamMembers || 1}-{event.maxTeamMembers || 4})
              </label>
              <select
                value={numberOfPlayers}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  const minPlayers = event.minTeamMembers || 1;
                  const maxPlayers = event.maxTeamMembers || 4;

                  // Ensure value is within valid range
                  if (value >= minPlayers && value <= maxPlayers) {
                    setNumberOfPlayers(value);
                  }
                }}
                className="w-full bg-black/70 border border-cyber-primary/40 rounded-md px-3 py-2 text-white focus:border-cyber-primary/90 focus:outline-none transition-colors"
                required
                disabled={loading}
              >
                {Array.from({ length: (event.maxTeamMembers || 4) - (event.minTeamMembers || 1) + 1 }, (_, i) => (event.minTeamMembers || 1) + i).map(num => (
                  <option key={num} value={num}>{num} Player{num > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Fee Display */}
            {event.pricing && (
              <div className="mb-6 p-4 bg-cyber-primary/10 border border-cyber-primary/40 rounded-md">
                <h4 className="text-cyber-primary font-bold mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M15 7a1 1 0 011 1v5a1 1 0 01-1 1H6a1 1 0 01-1-1V8a1 1 0 011-1h9zM6 8v5h9V8H6z" clipRule="evenodd" />
                  </svg>
                  Registration Fee
                </h4>

                {/* Pricing Type Selection */}
                {event.pricing.extended ? (
                  <div className="mb-4">
                    <label className="flex items-center text-cyber-secondary text-sm font-bold mb-2">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      Gameplay Duration
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="normal"
                          checked={selectedPricing === "normal"}
                          onChange={(e) => setSelectedPricing(e.target.value as "normal" | "extended")}
                          className="w-4 h-4 text-cyber-primary bg-black/70 border-cyber-primary/40 focus:ring-cyber-primary/50 focus:ring-2"
                          disabled={loading}
                        />
                        <span className="text-white text-sm">
                          Normal Gameplay - ₹{event.pricing.normal} per person
                        </span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          value="extended"
                          checked={selectedPricing === "extended"}
                          onChange={(e) => setSelectedPricing(e.target.value as "normal" | "extended")}
                          className="w-4 h-4 text-cyber-primary bg-black/70 border-cyber-primary/40 focus:ring-cyber-primary/50 focus:ring-2"
                          disabled={loading}
                        />
                        <span className="text-white text-sm">
                          Extended Gameplay - ₹{event.pricing.extended} per person
                        </span>
                      </label>
                    </div>
                  </div>
                ) : ""}

                <div className="text-white text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-cyber-secondary">Per Person: </span>
                    <span className="text-cyber-primary font-bold">
                      ₹{selectedPricing === "extended" && event.pricing.extended ? event.pricing.extended : event.pricing.normal}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-cyber-secondary">Total ({numberOfPlayers} player{numberOfPlayers > 1 ? 's' : ''}): </span>
                    <span className="text-cyber-primary font-bold text-lg">
                      ₹{numberOfPlayers * (selectedPricing === "extended" && event.pricing.extended ? event.pricing.extended : event.pricing.normal)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Secure payment via Razorpay
                  </p>
                </div>
              </div>
            )}

            {formError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-md">
                <p className="text-red-400 text-sm">{formError}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-cyber-primary hover:bg-cyber-primary/80 text-black text-sm font-bold rounded transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Processing..." : event.pricing ? "Pay & Register" : "Register"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationModal;
