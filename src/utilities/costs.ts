import { BALANCE } from "@/game-data/balance";
import { getPlanetType } from "@/game-data/planet-types";
import { PRESTIGE_UPGRADES } from "@/game-data/prestige";
import { getUpgrade } from "@/game-data/upgrades";

export function getUpgradeCost(upgradeId: string, owned: number) {
  const upgrade = getUpgrade(upgradeId);
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
}

export function getPlanetCost(planetCount: number, typeId = "rocky") {
  const type = getPlanetType(typeId);
  return Math.floor(BALANCE.planetCostBase * Math.pow(BALANCE.planetCostMultiplier * type.costMultiplier, planetCount));
}

export function getEvolveCost(stage: number, orbitIndex: number) {
  return Math.floor(BALANCE.evolveBaseCost * Math.pow(BALANCE.evolveCostMultiplier, stage) * (1 + orbitIndex * 0.35));
}

export function getSpecializationCost(currentSpecialization: string | undefined) {
  return Math.floor(BALANCE.specializationBaseCost * (currentSpecialization ? 1.2 : 1));
}

export function getResearchCost(researchId: string, owned: number) {
  void researchId;
  return Math.floor(BALANCE.researchBaseCost * Math.pow(1.35, owned));
}

export function getAutomationCost(automationId: string, level: number) {
  void automationId;
  return Math.floor(BALANCE.automationBaseCost * Math.pow(1.35, level));
}

export function getPrestigeEssenceGain(totalEarned: number) {
  return Math.floor(Math.sqrt(Math.max(totalEarned, 0) / BALANCE.prestigeThreshold));
}

export function getPrestigeUpgradeCost(upgradeId: string, level: number) {
  const upgrade = PRESTIGE_UPGRADES.find((item) => item.id === upgradeId) ?? PRESTIGE_UPGRADES[0];
  return Math.floor(upgrade.baseCost * Math.pow(1.75, level));
}
import { BALANCE } from "@/game-data/balance";
import { getPlanetType } from "@/game-data/planet-types";
import type { UpgradeDef } from "@/types/game";

export function upgradeCost(def: UpgradeDef, owned: number, costReduction = 0): number {
  const mult = Math.pow(def.costMultiplier, owned);
  const reduction = 1 - Math.min(0.5, costReduction);
  return Math.floor(def.baseCost * mult * reduction);
}

export function evolveCost(stage: number, planetIndex: number, evolutionSpeed = 0): number {
  const speedMult = 1 - Math.min(0.4, evolutionSpeed);
  return Math.floor(
    BALANCE.evolveCostBase * Math.pow(BALANCE.evolveCostExponent, stage) * (planetIndex + 1) * speedMult
  );
}

export function planetPurchaseCost(planetCount: number, typeId: string, costReduction = 0): number {
  const type = getPlanetType(typeId);
  const reduction = 1 - Math.min(0.5, costReduction);
  return Math.floor(
    BALANCE.planetCostBase * Math.pow(BALANCE.planetCostExponent, planetCount) * type.costMultiplier * reduction
  );
}

export function automationCost(baseCost: number, costMultiplier: number, level: number, costReduction = 0): number {
  const reduction = 1 - Math.min(0.5, costReduction);
  return Math.floor(baseCost * Math.pow(costMultiplier, level) * reduction);
}

export function prestigeUpgradeCost(baseCost: number, costMultiplier: number, level: number): number {
  return Math.floor(baseCost * Math.pow(costMultiplier, level));
}

export function specializationChangeCost(costReduction = 0): number {
  const reduction = 1 - Math.min(0.5, costReduction);
  return Math.floor(BALANCE.specializationChangeCost * reduction);
}
