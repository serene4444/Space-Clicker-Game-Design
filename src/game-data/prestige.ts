import type { PrestigeUpgradeDef, StarClassDef } from "@/types/game";

export const PRESTIGE_UPGRADES: PrestigeUpgradeDef[] = [
  { id: "efficiency", branch: "Output", name: "Efficiency Protocols", description: "Boost energy output after each rebirth.", baseCost: 1, energyMultiplier: 1.1 },
  { id: "celerity", branch: "Evolution", name: "Celerity Engines", description: "Speed up planetary evolution.", baseCost: 2, costMultiplier: 0.95 },
  { id: "fertility", branch: "Planets", name: "Planetary Fertility", description: "Increase planetary and biomass growth.", baseCost: 2, biomassMultiplier: 1.15, startingPlanetBonus: 1 },
  { id: "analysis", branch: "Research", name: "Deep Analysis", description: "Improve research output.", baseCost: 3, researchMultiplier: 1.2 },
  { id: "network", branch: "Automation", name: "Universal Network", description: "Strengthen automation systems.", baseCost: 4, automationMultiplier: 1.18 },
];

export const STAR_CLASSES: StarClassDef[] = [
  { id: "red-dwarf", branch: "Class", name: "Red Dwarf", description: "Cheap and steady with great endurance.", unlockRebirths: 1, clickMultiplier: 1.05, energyMultiplier: 1.08, costMultiplier: 0.95 },
  { id: "yellow-dwarf", branch: "Class", name: "Yellow Dwarf", description: "Balanced baseline star class.", unlockRebirths: 0, clickMultiplier: 1, energyMultiplier: 1, costMultiplier: 1 },
  { id: "blue-giant", branch: "Class", name: "Blue Giant", description: "High output, high cost, high growth.", unlockRebirths: 3, clickMultiplier: 1.2, energyMultiplier: 1.25, costMultiplier: 1.08 },
];

export function getStarClass(id: string) {
  return STAR_CLASSES.find((starClass) => starClass.id === id) ?? STAR_CLASSES[1];
}
