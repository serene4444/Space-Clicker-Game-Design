import { STAGES } from "@/game-data/evolution-stages";
import type { Planet } from "@/types/game";

export interface PopulationMilestone {
  stage: number;
  population: number;
}

export const POPULATION_MILESTONES: PopulationMilestone[] = [
  { stage: 0, population: 0 },
  { stage: 1, population: 0 },
  { stage: 2, population: 0 },
  { stage: 3, population: 10_000 },
  { stage: 4, population: 1_000_000 },
  { stage: 5, population: 25_000_000 },
  { stage: 6, population: 250_000_000 },
  { stage: 7, population: 1_000_000_000 },
  { stage: 8, population: 8_000_000_000 },
  { stage: 9, population: 20_000_000_000 },
  { stage: 10, population: 100_000_000_000 },
];

export function getPopulationMilestone(stage: number) {
  return POPULATION_MILESTONES[Math.min(stage, POPULATION_MILESTONES.length - 1)] ?? POPULATION_MILESTONES[0];
}

export function getPlanetPopulationCap(stage: number) {
  return getPopulationMilestone(stage).population;
}

export function getPlanetPopulationGrowthRate(planet: Planet) {
  if (planet.stage < 6) return 0;
  const stage = STAGES[Math.min(planet.stage, STAGES.length - 1)] ?? STAGES[0];
  const milestone = getPopulationMilestone(planet.stage).population;
  const baseGrowth = Math.max(0.02, milestone / 20_000_000_000);
  const habitabilityBonus = 1 + Math.min(planet.stage - 5, 4) * 0.12;
  return baseGrowth * habitabilityBonus * (1 + stage.passiveBonus * 0.12);
}

export function getPopulationGrowthBonuses(stage: number) {
  if (stage < 3) return { atmosphere: 0, water: 0, biodiversity: 0, climate: 0, habitability: 0 };
  const atmosphere = stage >= 3 ? 0.15 : 0;
  const water = stage >= 4 ? 0.2 : 0;
  const biodiversity = stage >= 5 ? 0.2 : 0;
  const climate = stage >= 6 ? 0.3 : stage >= 5 ? 0.18 : 0;
  const habitability = atmosphere + water + biodiversity + climate;
  return { atmosphere, water, biodiversity, climate, habitability };
}

export function getTotalPopulation(planets: Planet[]) {
  return planets.reduce((sum, planet) => sum + (planet.population ?? 0), 0);
}