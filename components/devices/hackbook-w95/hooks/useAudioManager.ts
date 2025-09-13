"use client";

/**
 * Audio Manager for handling browser autoplay policies
 * Ensures audio can only play after user interaction
 */

class AudioManager {
  private audioContext: AudioContext | null = null;
  private userHasInteracted = false;
  private pendingSounds: Array<{ src: string; volume?: number }> = [];
  private soundCache = new Map<string, HTMLAudioElement>();

  constructor() {
    if (typeof window !== 'undefined') {
      // Listen for first user interaction
      this.setupUserInteractionListeners();
    }
  }

  private setupUserInteractionListeners(): void {
    const handleFirstInteraction = () => {
      this.userHasInteracted = true;
      
      // Create audio context on first interaction
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioContext = new AudioContextClass();
      } catch {
        // Ignore audio context creation errors
      }
      
      // Play any pending sounds
      this.playPendingSounds();
      
      // Remove listeners after first interaction
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
  }

  private playPendingSounds(): void {
    this.pendingSounds.forEach(sound => {
      this.playSound(sound.src, sound.volume);
    });
    this.pendingSounds = [];
  }

  /**
   * Play a sound with proper error handling
   */
  playSound(src: string, volume: number = 0.7): void {
    if (!this.userHasInteracted) {
      // Queue the sound to play after user interaction
      this.pendingSounds.push({ src, volume });
      return;
    }

    try {
      // Check if we have this sound cached
      let audio = this.soundCache.get(src);
      
      if (!audio) {
        audio = new Audio(src);
        audio.preload = 'auto';
        this.soundCache.set(src, audio);
      }

      // Reset audio to start if it's already playing
      audio.currentTime = 0;
      audio.volume = Math.max(0, Math.min(1, volume));
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Ignore play promise rejection
        });
      }
    } catch {
      // Ignore audio play errors
    }
  }

  /**
   * Preload commonly used sounds
   */
  preloadSounds(soundPaths: string[]): void {
    if (!this.userHasInteracted) return;

    soundPaths.forEach(path => {
      if (!this.soundCache.has(path)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        this.soundCache.set(path, audio);
      }
    });
  }

  /**
   * Check if user has interacted and audio can play
   */
  canPlayAudio(): boolean {
    return this.userHasInteracted;
  }

  /**
   * Get the count of pending sounds
   */
  getPendingSoundCount(): number {
    return this.pendingSounds.length;
  }

  /**
   * Clear all cached audio
   */
  clearCache(): void {
    this.soundCache.clear();
  }
}

// Create singleton instance
const audioManager = new AudioManager();

// Expose globally for fallback access
if (typeof globalThis !== 'undefined') {
  (globalThis as typeof globalThis & { audioManagerInstance: AudioManager }).audioManagerInstance = audioManager;
}

export default audioManager;
