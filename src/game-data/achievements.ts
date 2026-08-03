import type { AchievementDef } from "@/types/game";

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-energy", name: "First Light", description: "Generate your first energy.", check: (state) => state.totalEarned >= 1 },
  { id: "first-planet", name: "First Planet", description: "Create your first planet.", check: (state) => state.planets.length >= 1 },
  { id: "mature-world", name: "Mature World", description: "Advance any planet beyond stage 5.", check: (state) => state.planets.some((planet) => planet.stage >= 5) },
  { id: "first-life", name: "First Life", description: "Reach microbial life.", check: (state) => state.planets.some((planet) => planet.stage >= 4) },
  { id: "civilization", name: "Civilization", description: "Reach intelligent life.", check: (state) => state.planets.some((planet) => planet.stage >= 6) },
  { id: "max-planets", name: "Four Worlds", description: "Own the full starting system.", check: (state) => state.planets.length >= 4 },
  { id: "first-rebirth", name: "First Rebirth", description: "Perform a stellar rebirth.", check: (state) => state.rebirthCount >= 1 },
  { id: "one-million", name: "One Million", description: "Earn one million total energy.", check: (state) => state.totalEarned >= 1_000_000 },
];
