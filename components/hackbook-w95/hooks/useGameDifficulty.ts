"use client";

// Utility for managing game difficulty settings across all games
class GameDifficultyManager {
  private static readonly STORAGE_KEY = "globalGameDifficulty";
  
  // Set the global difficulty level for all games
  static setGlobalDifficulty(difficulty: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(this.STORAGE_KEY, difficulty);
      
      // Dispatch an event to notify any listening components
      window.dispatchEvent(new CustomEvent('difficultyChanged', { 
        detail: { difficulty } 
      }));
    }
  }
  
  // Get the current global difficulty level (defaults to "normal")
  static getGlobalDifficulty(): string {
    if (typeof window !== "undefined") {
      const storedDifficulty = localStorage.getItem(this.STORAGE_KEY);
      return storedDifficulty || "normal";
    }
    return "normal";
  }
  
  // Listen for difficulty changes
  static onDifficultyChange(callback: (difficulty: string) => void): () => void {
    if (typeof window !== "undefined") {
      const handler = (event: Event) => {
        const customEvent = event as CustomEvent;
        callback(customEvent.detail.difficulty);
      };
      
      window.addEventListener('difficultyChanged', handler);
      
      // Return a cleanup function
      return () => window.removeEventListener('difficultyChanged', handler);
    }
    return () => {}; // Empty cleanup function for SSR
  }
}

export default GameDifficultyManager;
