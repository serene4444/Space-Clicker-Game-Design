import type { ResearchNode } from "@/types/game";

export const RESEARCH_NODES: ResearchNode[] = [
  { id: "astronomy", branch: "Astronomy", name: "Astronomy", description: "Improves click efficiency and unlocks deeper star understanding.", cost: 300, prerequisites: [], clickMultiplier: 1.25 },
  { id: "atmospheric-engineering", branch: "Terraforming", name: "Atmospheric Engineering", description: "Unlocks atmospheric planetary stages.", cost: 700, prerequisites: ["astronomy"], energyMultiplier: 1.08, unlockPlanetTypes: ["ocean", "ice"] },
  { id: "xenobiology", branch: "Biology", name: "Xenobiology", description: "Biological growth becomes more efficient.", cost: 1100, prerequisites: ["astronomy"], biomassMultiplier: 1.35 },
  { id: "engineering", branch: "Engineering", name: "Engineering", description: "Reduces costs across key systems.", cost: 1500, prerequisites: ["atmospheric-engineering"], energyMultiplier: 1.1, automationMultiplier: 1.1 },
  { id: "spaceflight", branch: "Interplanetary Travel", name: "Spaceflight", description: "Unlocks advanced planetary progression.", cost: 2200, prerequisites: ["engineering"], researchMultiplier: 1.2, unlockSpecializations: ["research", "trade"] },
  { id: "ai-control", branch: "AI", name: "AI Control", description: "Automation systems become more efficient.", cost: 3400, prerequisites: ["spaceflight"], automationMultiplier: 1.3, clickMultiplier: 1.1 },
];
