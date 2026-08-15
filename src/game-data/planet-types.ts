import type { PlanetTypeDef } from "@/types/game";

export const PLANET_TYPES: PlanetTypeDef[] = [
  { id: "rocky", name: "Rocky", description: "Stable early planet with balanced output.", color: "#8b6355", costMultiplier: 1, productionMultiplier: 1, unlockPlanetCount: 1 },
  { id: "ocean", name: "Ocean", description: "Strong biomass and research growth.", color: "#5f9bd1", costMultiplier: 1.15, productionMultiplier: 1.12, unlockStage: 2, unlockPlanetCount: 2 },
  { id: "desert", name: "Desert", description: "Efficient energy generation under harsh suns.", color: "#d29a5f", costMultiplier: 1.1, productionMultiplier: 1.08, unlockTotalEarned: 1800, unlockPlanetCount: 2 },
  { id: "ice", name: "Ice", description: "Research-heavy world with cool efficiency.", color: "#a7d7ff", costMultiplier: 1.18, productionMultiplier: 1.1, unlockTotalEarned: 9000, unlockPlanetCount: 3, unlockStage: 4 },
  { id: "volcanic", name: "Volcanic", description: "Mineral rich world with aggressive growth.", color: "#f28a5b", costMultiplier: 1.22, productionMultiplier: 1.14, unlockTotalEarned: 22000, unlockPlanetCount: 4, unlockStage: 6 },
  { id: "forest", name: "Forest", description: "Biological and population expansion world.", color: "#6ea98b", costMultiplier: 1.2, productionMultiplier: 1.12, unlockTotalEarned: 42000, unlockPlanetCount: 4, unlockStage: 8 },
];

export function getPlanetType(typeId: string) {
  return PLANET_TYPES.find((planetType) => planetType.id === typeId) ?? PLANET_TYPES[0];
}
