import { GameDefinition } from "@/lib/games/types";

// In-memory registry. In the future, this can be loaded from JSON or DB.
// Keep this tiny and refer to existing component paths without importing here (server-safe).

const games: GameDefinition[] = [
  {
    id: "minesweeper",
    title: "Minesweeper",
    slug: "minesweeper",
    deviceType: "hackbook-w95",
    tags: ["classic", "puzzle"],
    defaultDifficulty: "normal",
    difficulties: ["easy", "normal", "hard"],
    componentPath: "@/components/devices/hackbook-w95/apps/Minesweeper",
    window: { width: 350, height: 450 },
  },
  {
    id: "number-jump",
    title: "Number Jumping",
    slug: "number-jumping",
    deviceType: "hackbook-w95",
    tags: ["math", "puzzle"],
    defaultDifficulty: "normal",
    difficulties: ["easy", "normal", "hard", "nightmare"],
    componentPath: "@/components/devices/hackbook-w95/apps/NumberJumpingGame",
    window: { width: 600, height: 500 },
  },
  {
    id: "untangle-net",
    title: "Untangle Neural Network",
    slug: "untangle-neural-network",
    deviceType: "hackbook-w95",
    tags: ["logic"],
    defaultDifficulty: "normal",
    difficulties: ["easy", "normal", "hard"],
    componentPath: "@/components/devices/hackbook-w95/apps/UntangleNeuralNetwork",
    window: { width: "80vw", height: "80vh" },
  },
  {
    id: "quick-event",
    title: "Quick Event Presser",
    slug: "quick-event",
    deviceType: "hackbook-w95",
    tags: ["reflex"],
    defaultDifficulty: "normal",
    difficulties: ["easy", "normal", "hard"],
    componentPath: "@/components/devices/hackbook-w95/apps/QuickEventPresser",
    window: { width: 600, height: 500 },
  },
];

export function listGames(deviceType?: GameDefinition["deviceType"]) {
  return deviceType ? games.filter(g => g.deviceType === deviceType) : games;
}

export function getGameById(id: string) {
  return games.find(g => g.id === id);
}

export function getGameBySlug(slug: string) {
  return games.find(g => g.slug === slug);
}

export function registerGame(def: GameDefinition) {
  const existing = getGameById(def.id);
  if (existing) {
    Object.assign(existing, def);
  } else {
    games.push(def);
  }
}
