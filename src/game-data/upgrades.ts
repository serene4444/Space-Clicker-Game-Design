import type { UpgradeDef } from "@/types/game";

export const UPGRADES: UpgradeDef[] = [
  { id: "stellar-probe", name: "Stellar Probe", category: "Stellar", description: "Automated probes skim power from the star.", baseCost: 12, costMultiplier: 1.15, energyPerSecond: 0.2 },
  { id: "solar-array", name: "Solar Array", category: "Stellar", description: "Large collectors convert light into energy.", baseCost: 60, costMultiplier: 1.15, energyPerSecond: 0.8 },
  { id: "fusion-core", name: "Fusion Core", category: "Stellar", description: "Core reactors multiply raw energy output.", baseCost: 180, costMultiplier: 1.16, energyPerSecond: 2.4 },
  { id: "pulse-amplifier", name: "Pulse Amplifier", category: "Stellar", description: "Every click releases a deeper burst.", baseCost: 300, costMultiplier: 1.16, clickPower: 2 },
  { id: "atmospheric-engineering", name: "Atmospheric Engineering", category: "Planetary", description: "Lets planets hold a useful atmosphere.", baseCost: 520, costMultiplier: 1.18, planetMultiplier: 1.05 },
  { id: "terraforming", name: "Terraforming", category: "Planetary", description: "Improves planetary growth and evolution.", baseCost: 980, costMultiplier: 1.18, planetMultiplier: 1.08, unlockTotalEarned: 500 },
  { id: "xenobiology", name: "Xenobiology", category: "Biological", description: "Biological systems begin to flourish.", baseCost: 650, costMultiplier: 1.17, biomassPerSecond: 0.28 },
  { id: "cellular-life", name: "Cellular Life", category: "Biological", description: "Life spreads and stabilizes.", baseCost: 1250, costMultiplier: 1.17, biomassPerSecond: 0.7 },
  { id: "agriculture", name: "Agriculture", category: "Civilization", description: "Civilizations sustain larger populations.", baseCost: 1500, costMultiplier: 1.18, researchPerSecond: 0.25 },
  { id: "spaceflight", name: "Spaceflight", category: "Civilization", description: "A direct step toward interplanetary society.", baseCost: 2200, costMultiplier: 1.18, researchPerSecond: 0.6 },
  { id: "orbital-stations", name: "Orbital Stations", category: "Infrastructure", description: "Orbiting infrastructure increases stability.", baseCost: 2800, costMultiplier: 1.19, energyPerSecond: 5 },
  { id: "asteroid-mining", name: "Asteroid Mining", category: "Infrastructure", description: "Minerals are extracted from nearby bodies.", baseCost: 3600, costMultiplier: 1.19, energyPerSecond: 1.2, biomassPerSecond: 0.1 },
];

export function getUpgrade(id: string) {
  return UPGRADES.find((upgrade) => upgrade.id === id) ?? UPGRADES[0];
}
