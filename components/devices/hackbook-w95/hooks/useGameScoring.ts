"use client";

/**
 * Comprehensive Game Scoring System
 * Tracks completion time, attempts, and calculates scores across all mini-games
 */

export interface GameMetrics {
  startTime: number;
  endTime?: number;
  completionTime?: number; // in milliseconds
  attempts: number;
  score: number;
  difficulty: string;
  gameSpecificData?: Record<string, unknown>;
}

export interface GameScoreData {
  gameName: string;
  metrics: GameMetrics;
  isCompleted: boolean;
}

export class GameScoringManager {
  private gameData: Map<string, GameScoreData> = new Map();
  private sessionStartTime: number = Date.now();

  // Game names constants
  static readonly QUICK_EVENT_PRESSER = "Emergency Protocol";
  static readonly UNTANGLE_NEURAL_NETWORK = "Neural Network Analyzer";
  static readonly FINGERPRINT_HACK = "Secure Vault";
  static readonly NUMBER_JUMPING_GAME = "Firewall Bypass";
  static readonly BRUTE_FORCE_GAME = "Password Cracker";

  /**
   * Start tracking a game
   */
  startGame(gameName: string, difficulty: string): void {
    const gameData: GameScoreData = {
      gameName,
      metrics: {
        startTime: Date.now(),
        attempts: 0,
        score: 0,
        difficulty,
      },
      isCompleted: false,
    };
    
    this.gameData.set(gameName, gameData);
    
    // Store in localStorage for persistence
    this.saveToStorage();
    
  }

  /**
   * Complete a game with final metrics
   */
  completeGame(
    gameName: string,
    score: number,
    attempts: number,
    gameSpecificData?: Record<string, unknown>
  ): void {
    const gameData = this.gameData.get(gameName);
    if (!gameData) {
      console.warn(`Game ${gameName} not found in tracking data`);
      return;
    }

    const endTime = Date.now();
    const completionTime = endTime - gameData.metrics.startTime;

    gameData.metrics.endTime = endTime;
    gameData.metrics.completionTime = completionTime;
    gameData.metrics.attempts = attempts;
    gameData.metrics.score = score;
    gameData.metrics.gameSpecificData = gameSpecificData;
    gameData.isCompleted = true;

    this.gameData.set(gameName, gameData);
    this.saveToStorage();
  }

  /**
   * Update game progress (for attempt tracking)
   */
  updateGameProgress(gameName: string, attempts: number): void {
    const gameData = this.gameData.get(gameName);
    if (gameData && !gameData.isCompleted) {
      gameData.metrics.attempts = attempts;
      this.gameData.set(gameName, gameData);
      this.saveToStorage();
    }
  }

  /**
   * Get completion data for a specific game
   */
  getGameData(gameName: string): GameScoreData | null {
    return this.gameData.get(gameName) || null;
  }

  /**
   * Get all completed games data
   */
  getAllCompletedGames(): GameScoreData[] {
    return Array.from(this.gameData.values()).filter(game => game.isCompleted);
  }

  /**
   * Calculate comprehensive score across all games
   */
  calculateOverallScore(): {
    totalScore: number;
    averageTime: number;
    totalAttempts: number;
    gamesCompleted: number;
    perfectionBonus: number;
    difficultyMultiplier: number;
    breakdown: Array<{
      game: string;
      score: number;
      time: number;
      attempts: number;
      difficulty: string;
    }>;
  } {
    const completedGames = this.getAllCompletedGames();
    
    if (completedGames.length === 0) {
      return {
        totalScore: 0,
        averageTime: 0,
        totalAttempts: 0,
        gamesCompleted: 0,
        perfectionBonus: 0,
        difficultyMultiplier: 1,
        breakdown: [],
      };
    }

    let totalScore = 0;
    let totalTime = 0;
    let totalAttempts = 0;
    const breakdown: Array<{
      game: string;
      score: number;
      time: number;
      attempts: number;
      difficulty: string;
    }> = [];

    // Calculate individual game scores with time and attempt bonuses
    completedGames.forEach(gameData => {
      const { metrics } = gameData;
      const completionTimeSeconds = (metrics.completionTime || 0) / 1000;
      
      // Base score from the game
      const gameScore = metrics.score;
      
      // Time bonus: faster completion gets bonus points
      const timeBonus = this.calculateTimeBonus(gameData.gameName, completionTimeSeconds);
      
      // Attempt penalty: more attempts reduce score
      const attemptPenalty = this.calculateAttemptPenalty(metrics.attempts);
      
      // Difficulty multiplier
      const difficultyMultiplier = this.getDifficultyMultiplier(metrics.difficulty);
      
      // Calculate final game score
      const finalGameScore = Math.max(0, (gameScore + timeBonus - attemptPenalty) * difficultyMultiplier);
      
      totalScore += finalGameScore;
      totalTime += completionTimeSeconds;
      totalAttempts += metrics.attempts;
      
      breakdown.push({
        game: gameData.gameName,
        score: Math.round(finalGameScore),
        time: completionTimeSeconds,
        attempts: metrics.attempts,
        difficulty: metrics.difficulty,
      });
    });

    const averageTime = totalTime / completedGames.length;
    
    // Perfection bonus for completing all games with minimal attempts
    const perfectionBonus = this.calculatePerfectionBonus(completedGames);
    
    // Overall difficulty multiplier based on most common difficulty
    const difficultyMultiplier = this.getOverallDifficultyMultiplier(completedGames);
    
    const finalTotalScore = Math.round((totalScore + perfectionBonus) * difficultyMultiplier);

    return {
      totalScore: finalTotalScore,
      averageTime: Math.round(averageTime * 10) / 10,
      totalAttempts,
      gamesCompleted: completedGames.length,
      perfectionBonus: Math.round(perfectionBonus),
      difficultyMultiplier: Math.round(difficultyMultiplier * 100) / 100,
      breakdown,
    };
  }

  /**
   * Calculate time bonus based on expected completion times per game
   */
  private calculateTimeBonus(gameName: string, completionTimeSeconds: number): number {
    const expectedTimes: Record<string, number> = {
      [GameScoringManager.QUICK_EVENT_PRESSER]: 30, // 30 seconds optimal
      [GameScoringManager.UNTANGLE_NEURAL_NETWORK]: 120, // 2 minutes optimal
      [GameScoringManager.FINGERPRINT_HACK]: 45, // 45 seconds optimal
      [GameScoringManager.NUMBER_JUMPING_GAME]: 90, // 1.5 minutes optimal
      [GameScoringManager.BRUTE_FORCE_GAME]: 60, // 1 minute optimal
    };

    const expectedTime = expectedTimes[gameName] || 60;
    const timeRatio = expectedTime / Math.max(completionTimeSeconds, 1);
    
    // Bonus for completing faster than expected (max 20 points)
    if (timeRatio > 1) {
      return Math.min(20, (timeRatio - 1) * 30);
    }
    
    return 0;
  }

  /**
   * Calculate attempt penalty
   */
  private calculateAttemptPenalty(attempts: number): number {
    // First attempt is free, then 2 points penalty per additional attempt
    return Math.max(0, (attempts - 1) * 2);
  }

  /**
   * Get difficulty multiplier
   */
  private getDifficultyMultiplier(difficulty: string): number {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 0.8;
      case 'normal': return 1.0;
      case 'hard': return 1.2;
      case 'nightmare': return 1.5;
      default: return 1.0;
    }
  }

  /**
   * Calculate perfection bonus for completing all games efficiently
   */
  private calculatePerfectionBonus(completedGames: GameScoreData[]): number {
    const totalGames = 5; // Expected number of games in sequence
    
    if (completedGames.length < totalGames) {
      return 0;
    }

    const averageAttempts = completedGames.reduce((sum, game) => sum + game.metrics.attempts, 0) / completedGames.length;
    
    // Bonus for low average attempts (max 50 points)
    if (averageAttempts <= 1.2) {
      return 50; // Perfect run bonus
    } else if (averageAttempts <= 2) {
      return 30; // Great run bonus
    } else if (averageAttempts <= 3) {
      return 15; // Good run bonus
    }
    
    return 0;
  }

  /**
   * Get overall difficulty multiplier based on most common difficulty
   */
  private getOverallDifficultyMultiplier(completedGames: GameScoreData[]): number {
    const difficulties = completedGames.map(game => game.metrics.difficulty);
    const difficultyCount: Record<string, number> = {};
    
    difficulties.forEach(diff => {
      difficultyCount[diff] = (difficultyCount[diff] || 0) + 1;
    });
    
    const mostCommonDifficulty = Object.keys(difficultyCount).reduce((a, b) => 
      difficultyCount[a] > difficultyCount[b] ? a : b
    );
    
    return this.getDifficultyMultiplier(mostCommonDifficulty);
  }

  /**
   * Reset all game data (for play again functionality)
   */
  reset(): void {
    this.gameData.clear();
    this.sessionStartTime = Date.now();
    this.clearStorage();
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      const dataToSave = {
        gameData: Array.from(this.gameData.entries()),
        sessionStartTime: this.sessionStartTime,
      };
      localStorage.setItem('gameScoringData', JSON.stringify(dataToSave));
    }
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gameScoringData');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          this.gameData = new Map(parsed.gameData);
          this.sessionStartTime = parsed.sessionStartTime || Date.now();
        } catch (error) {
          console.warn('Failed to load game scoring data from storage:', error);
        }
      }
    }
  }

  /**
   * Clear storage
   */
  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gameScoringData');
    }
  }

  /**
   * Initialize the manager
   */
  init(): void {
    this.loadFromStorage();
  }
}

// Create singleton instance
const gameScoring = new GameScoringManager();

// Initialize on first import
if (typeof window !== 'undefined') {
  gameScoring.init();
}

export default gameScoring;
