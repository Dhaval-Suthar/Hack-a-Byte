// Central game types to enable a pluggable games architecture
// Kept free of React/Next imports to be safely used on server and client

export type DeviceType =
  | "hackbook-w95"
  | "hackdroid"
  | "hackphone"
  | "hackbook-l";

export type Difficulty = "easy" | "normal" | "hard" | "nightmare";

export interface GameWindowSize {
  width: number | string;
  height: number | string;
}

export interface GameDefinition {
  id: string; // unique, kebab-case (e.g., minesweeper)
  title: string;
  slug: string; // URL-friendly path
  deviceType: DeviceType; // Which device UI the game belongs to
  tags?: string[];
  defaultDifficulty?: Difficulty;
  difficulties?: Difficulty[];
  shortDescription?: string;
  description?: string;
  // Path to the React component implementing the game. Loaded via dynamic import on client only.
  // Example: "@/components/hackbook-w95/apps/Minesweeper"
  componentPath?: string;
  // Optional preferred window sizing when launched in a windowed device shell
  window?: GameWindowSize;
  // Optional extra metadata
  meta?: Record<string, string | number | boolean>;
}

export interface ScoreSubmission {
  deviceId: string;
  deviceType: DeviceType;
  username?: string; // optional, resolved from DeviceUser when possible
  gameId: string;
  gameTitle?: string; // convenience; leaderboard stores game string
  score: number;
  difficulty: Difficulty;
  timeRemaining?: number; // seconds
  completedEvents?: number;
}

export interface LeaderboardEntryLite {
  _id: string;
  username: string;
  score: number;
  difficulty: Difficulty;
  timeRemaining: number;
  completedEvents: number;
  date: string; // ISO
}
