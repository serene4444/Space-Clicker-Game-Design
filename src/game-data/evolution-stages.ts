import type { StageDef } from "@/types/game";

export const STAGES: StageDef[] = [
  { id: 0, name: "Barren World", description: "A silent rock waiting for growth.", cost: 0, passiveBonus: 0, visual: { ocean: false, life: false, cities: false } },
  { id: 1, name: "Geologically Active", description: "Magma and tectonics wake the planet.", cost: 80, passiveBonus: 0.08, visual: { ocean: false, life: false, cities: false } },
  { id: 2, name: "Atmospheric", description: "A thin atmosphere begins to hold.", cost: 150, passiveBonus: 0.15, visual: { ocean: false, life: false, cities: false } },
  { id: 3, name: "Ocean", description: "Liquid seas cover the surface.", cost: 260, passiveBonus: 0.24, requiresResearch: ["atmospheric-engineering"], visual: { ocean: true, life: false, cities: false } },
  { id: 4, name: "Microbial Life", description: "The first life emerges.", cost: 420, passiveBonus: 0.35, requiresResearch: ["xenobiology"], visual: { ocean: true, life: true, cities: false } },
  { id: 5, name: "Complex Life", description: "Ecosystems become dense and active.", cost: 700, passiveBonus: 0.48, visual: { ocean: true, life: true, cities: false } },
  { id: 6, name: "Intelligent Life", description: "Civilizations begin to think and organize.", cost: 1200, passiveBonus: 0.68, requiresResearch: ["spaceflight"], visual: { ocean: true, life: true, cities: true } },
  { id: 7, name: "Industrial", description: "A world of industry and infrastructure.", cost: 2000, passiveBonus: 0.95, visual: { ocean: true, life: true, cities: true } },
  { id: 8, name: "Spacefaring", description: "The world reaches beyond orbit.", cost: 3200, passiveBonus: 1.3, visual: { ocean: true, life: true, cities: true } },
  { id: 9, name: "Advanced Society", description: "A highly efficient interstellar civilization.", cost: 5000, passiveBonus: 1.75, visual: { ocean: true, life: true, cities: true } },
  { id: 10, name: "Post-Scarcity", description: "A mature world with abundant automation.", cost: 8000, passiveBonus: 2.4, visual: { ocean: true, life: true, cities: true } },
];

export function getStage(stageId: number) {
  return STAGES[Math.min(stageId, STAGES.length - 1)] ?? STAGES[0];
}
import type { EvolutionStageDef } from "@/types/game";

export const EVOLUTION_STAGES: EvolutionStageDef[] = [
  {
    id: 0,
    name: "Barren World",
    description: "A lifeless rock orbiting the young star.",
    costMultiplier: 1,
    passiveBonus: 0,
    biomassBonus: 0,
    researchBonus: 0,
    populationBonus: 0,
  },
  {
    id: 1,
    name: "Geologically Active World",
    description: "Volcanism and tectonics reshape the surface.",
    costMultiplier: 1.5,
    passiveBonus: 0.05,
    biomassBonus: 0,
    researchBonus: 0,
    populationBonus: 0,
  },
  {
    id: 2,
    name: "Atmospheric World",
    description: "A thin atmosphere begins to retain heat.",
    costMultiplier: 2,
    passiveBonus: 0.1,
    biomassBonus: 0,
    researchBonus: 0,
    populationBonus: 0,
    requiredUpgrade: "atmos",
  },
  {
    id: 3,
    name: "Ocean World",
    description: "Liquid water pools across the planetary surface.",
    costMultiplier: 2.5,
    passiveBonus: 0.2,
    biomassBonus: 0,
    researchBonus: 0,
    populationBonus: 0,
  },
  {
    id: 4,
    name: "Microbial Life",
    description: "Simple organisms emerge in primordial seas.",
    costMultiplier: 3,
    passiveBonus: 0.3,
    biomassBonus: 0.05,
    researchBonus: 0,
    populationBonus: 0,
    requiredUpgrade: "organic",
  },
  {
    id: 5,
    name: "Complex Life",
    description: "Multicellular ecosystems spread across continents.",
    costMultiplier: 4,
    passiveBonus: 0.5,
    biomassBonus: 0.1,
    researchBonus: 0,
    populationBonus: 0,
    requiredUpgrade: "cellular",
  },
  {
    id: 6,
    name: "Intelligent Life",
    description: "A species develops tool use and abstract thought.",
    costMultiplier: 5,
    passiveBonus: 0.8,
    biomassBonus: 0.15,
    researchBonus: 0.02,
    populationBonus: 0.05,
  },
  {
    id: 7,
    name: "Industrial Civilization",
    description: "Cities and industry transform the planet.",
    costMultiplier: 6,
    passiveBonus: 1.2,
    biomassBonus: 0.2,
    researchBonus: 0.05,
    populationBonus: 0.1,
    requiredUpgrade: "agriculture",
  },
  {
    id: 8,
    name: "Spacefaring Civilization",
    description: "The civilization reaches beyond its world.",
    costMultiplier: 8,
    passiveBonus: 2,
    biomassBonus: 0.25,
    researchBonus: 0.1,
    populationBonus: 0.2,
    requiredUpgrade: "spaceflight",
  },
  {
    id: 9,
    name: "Advanced Planetary Society",
    description: "Planetary systems operate in harmony.",
    costMultiplier: 10,
    passiveBonus: 3,
    biomassBonus: 0.3,
    researchBonus: 0.15,
    populationBonus: 0.35,
  },
  {
    id: 10,
    name: "Post-Scarcity World",
    description: "Energy and resources flow without limit.",
    costMultiplier: 12,
    passiveBonus: 5,
    biomassBonus: 0.5,
    researchBonus: 0.25,
    populationBonus: 0.5,
  },
];

export function getStageDef(stage: number): EvolutionStageDef {
  return EVOLUTION_STAGES[Math.min(stage, EVOLUTION_STAGES.length - 1)];
}

export function getMaxStage(): number {
  return EVOLUTION_STAGES.length - 1;
}
