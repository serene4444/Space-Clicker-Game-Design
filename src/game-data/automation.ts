import type { AutomationNode } from "@/types/game";

export const AUTOMATION_NODES: AutomationNode[] = [
  { id: "auto-collectors", branch: "Collectors", name: "Auto-Collectors", description: "Simulates passive clicking.", baseCost: 420, costMultiplier: 1.22, prerequisiteResearch: ["astronomy"], clickPerLevel: 0.6 },
  { id: "solar-drones", branch: "Energy", name: "Solar Drones", description: "Adds clean energy per second.", baseCost: 720, costMultiplier: 1.24, prerequisiteResearch: ["engineering"], energyPerLevel: 1.8 },
  { id: "planetary-admins", branch: "Planets", name: "Planetary Administrators", description: "Helps worlds evolve faster.", baseCost: 980, costMultiplier: 1.25, prerequisiteResearch: ["spaceflight"], researchPerLevel: 0.3, populationPerLevel: 0.5 },
  { id: "research-ai", branch: "Research", name: "Research AI", description: "Generates passive research data.", baseCost: 1400, costMultiplier: 1.26, prerequisiteResearch: ["ai-control"], researchPerLevel: 0.85 },
  { id: "mining-fleets", branch: "Resources", name: "Mining Fleets", description: "Extracts minerals from debris and asteroids.", baseCost: 1800, costMultiplier: 1.27, prerequisiteResearch: ["spaceflight"], mineralsPerLevel: 0.65 },
];
import type { AutomationDef } from "@/types/game";

export const AUTOMATIONS: AutomationDef[] = [
  {
    id: "auto-collectors",
    name: "Auto-Collectors",
    description: "Simulate star clicks automatically.",
    baseCost: 500,
    costMultiplier: 1.2,
    unlockAt: 5_000,
    effectPerLevel: { clicksPerSec: 0.5 },
  },
  {
    id: "solar-drones",
    name: "Solar Drones",
    description: "Autonomous drones harvest stellar radiation.",
    baseCost: 2_000,
    costMultiplier: 1.25,
    unlockAt: 10_000,
    effectPerLevel: { energyPerSec: 1 },
  },
  {
    id: "planetary-admins",
    name: "Planetary Administrators",
    description: "AI overseers manage planetary evolution.",
    baseCost: 10_000,
    costMultiplier: 1.3,
    unlockAt: 50_000,
    effectPerLevel: { energyPerSec: 3 },
  },
  {
    id: "research-ai",
    name: "Research AI",
    description: "Automated laboratories generate research data.",
    baseCost: 15_000,
    costMultiplier: 1.3,
    unlockAt: 30_000,
    effectPerLevel: { researchPerSec: 0.5 },
  },
  {
    id: "mining-fleets",
    name: "Autonomous Mining Fleets",
    description: "Robotic fleets extract minerals from asteroids.",
    baseCost: 25_000,
    costMultiplier: 1.35,
    unlockAt: 20_000,
    effectPerLevel: { mineralsPerSec: 0.3 },
  },
  {
    id: "trade-networks",
    name: "Interplanetary Trade Networks",
    description: "Commerce routes generate passive energy.",
    baseCost: 50_000,
    costMultiplier: 1.4,
    unlockAt: 100_000,
    effectPerLevel: { energyPerSec: 10 },
  },
];

export function getAutomationById(id: string): AutomationDef | undefined {
  return AUTOMATIONS.find((a) => a.id === id);
}
