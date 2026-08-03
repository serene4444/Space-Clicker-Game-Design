import type { SpecializationDef } from "@/types/game";

export const SPECIALIZATIONS: SpecializationDef[] = [
  { id: "mining", name: "Mining", description: "Improves mineral extraction.", costMultiplier: 1, energyMultiplier: 1, researchMultiplier: 1, biomassMultiplier: 1, mineralsMultiplier: 1.45, populationMultiplier: 1 },
  { id: "agricultural", name: "Agricultural", description: "Boosts biomass and population.", costMultiplier: 1.05, energyMultiplier: 1, researchMultiplier: 1, biomassMultiplier: 1.35, mineralsMultiplier: 1, populationMultiplier: 1.2 },
  { id: "research", name: "Research", description: "Optimizes scientific progress.", costMultiplier: 1.1, energyMultiplier: 1, researchMultiplier: 1.4, biomassMultiplier: 1, mineralsMultiplier: 1, populationMultiplier: 1 },
  { id: "industrial", name: "Industrial", description: "Strengthens energy production.", costMultiplier: 1.08, energyMultiplier: 1.3, researchMultiplier: 1, biomassMultiplier: 1, mineralsMultiplier: 1.1, populationMultiplier: 1 },
  { id: "energy", name: "Energy", description: "Prioritizes raw power generation.", costMultiplier: 1.08, energyMultiplier: 1.5, researchMultiplier: 1, biomassMultiplier: 1, mineralsMultiplier: 1, populationMultiplier: 1 },
  { id: "trade", name: "Trade", description: "Generates influence through commerce.", costMultiplier: 1.12, energyMultiplier: 1.05, researchMultiplier: 1.1, biomassMultiplier: 1, mineralsMultiplier: 1.05, populationMultiplier: 1.1 },
];

export function getSpecialization(id: string) {
  return SPECIALIZATIONS.find((specialization) => specialization.id === id) ?? SPECIALIZATIONS[0];
}
