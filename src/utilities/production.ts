import { BALANCE } from "@/game-data/balance";
import { AUTOMATION_NODES } from "@/game-data/automation";
import { PRESTIGE_UPGRADES, getStarClass } from "@/game-data/prestige";
import { PLANET_TYPES } from "@/game-data/planet-types";
import { RESEARCH_NODES } from "@/game-data/research";
import { SPECIALIZATIONS } from "@/game-data/specializations";
import { STAGES } from "@/game-data/evolution-stages";
import { UPGRADES } from "@/game-data/upgrades";
import type { GameStateData, Modifier } from "@/types/game";

function getCount(map: Record<string, number>, id: string) {
  return map[id] ?? 0;
}

function activeModifierFactor(modifiers: Modifier[], kind: Modifier["kind"]) {
  return 1 + modifiers.filter((modifier) => modifier.kind === kind).reduce((sum, modifier) => sum + modifier.amount, 0);
}

export function computeProduction(state: GameStateData) {
  const starClass = getStarClass(state.starClassId);
  const persistent = (kind: "energy" | "click" | "energyPerSecond" | "biomass" | "research" | "minerals" | "population" | "influence") => 1 + state.persistentEffects.filter((effect) => effect.kind === kind).reduce((sum, effect) => sum + effect.amount, 0);
  const clickFromUpgrades = UPGRADES.reduce((sum, upgrade) => sum + (upgrade.clickPower ?? 0) * getCount(state.upgrades, upgrade.id), 0);
  const energyFromUpgrades = UPGRADES.reduce((sum, upgrade) => sum + (upgrade.energyPerSecond ?? 0) * getCount(state.upgrades, upgrade.id), 0);
  const biomassFromUpgrades = UPGRADES.reduce((sum, upgrade) => sum + (upgrade.biomassPerSecond ?? 0) * getCount(state.upgrades, upgrade.id), 0);
  const researchFromUpgrades = UPGRADES.reduce((sum, upgrade) => sum + (upgrade.researchPerSecond ?? 0) * getCount(state.upgrades, upgrade.id), 0);

  const researchClickMultiplier = RESEARCH_NODES.filter((node) => state.research[node.id]).reduce((sum, node) => sum * (node.clickMultiplier ?? 1), 1);
  const researchEnergyMultiplier = RESEARCH_NODES.filter((node) => state.research[node.id]).reduce((sum, node) => sum * (node.energyMultiplier ?? 1), 1);
  const researchBiomassMultiplier = RESEARCH_NODES.filter((node) => state.research[node.id]).reduce((sum, node) => sum * (node.biomassMultiplier ?? 1), 1);
  const researchResearchMultiplier = RESEARCH_NODES.filter((node) => state.research[node.id]).reduce((sum, node) => sum * (node.researchMultiplier ?? 1), 1);
  const automationMultiplier = RESEARCH_NODES.filter((node) => state.research[node.id]).reduce((sum, node) => sum * (node.automationMultiplier ?? 1), 1);

  const prestigeClickMultiplier = Object.entries(state.prestigeUpgrades).reduce((sum, [id, level]) => {
    const upgrade = PRESTIGE_UPGRADES.find((entry) => entry.id === id);
    return sum * (upgrade?.clickMultiplier ? Math.pow(upgrade.clickMultiplier, level) : 1);
  }, 1);
  const prestigeEnergyMultiplier = Object.entries(state.prestigeUpgrades).reduce((sum, [id, level]) => {
    const upgrade = PRESTIGE_UPGRADES.find((entry) => entry.id === id);
    return sum * (upgrade?.energyMultiplier ? Math.pow(upgrade.energyMultiplier, level) : 1);
  }, 1);
  const prestigeBiomassMultiplier = Object.entries(state.prestigeUpgrades).reduce((sum, [id, level]) => {
    const upgrade = PRESTIGE_UPGRADES.find((entry) => entry.id === id);
    return sum * (upgrade?.biomassMultiplier ? Math.pow(upgrade.biomassMultiplier, level) : 1);
  }, 1);
  const prestigeResearchMultiplier = Object.entries(state.prestigeUpgrades).reduce((sum, [id, level]) => {
    const upgrade = PRESTIGE_UPGRADES.find((entry) => entry.id === id);
    return sum * (upgrade?.researchMultiplier ? Math.pow(upgrade.researchMultiplier, level) : 1);
  }, 1);
  const prestigeAutomationMultiplier = Object.entries(state.prestigeUpgrades).reduce((sum, [id, level]) => {
    const upgrade = PRESTIGE_UPGRADES.find((entry) => entry.id === id);
    return sum * (upgrade?.automationMultiplier ? Math.pow(upgrade.automationMultiplier, level) : 1);
  }, 1);

  const clickPower = (BALANCE.baseClickPower + clickFromUpgrades) * starClass.clickMultiplier * researchClickMultiplier * prestigeClickMultiplier * persistent("click");

  const planetTotals = state.planets.reduce(
    (sum, planet) => {
      const type = PLANET_TYPES.find((entry) => entry.id === planet.typeId) ?? PLANET_TYPES[0];
      const stage = STAGES[Math.min(planet.stage, STAGES.length - 1)] ?? STAGES[0];
      const specialization = SPECIALIZATIONS.find((entry) => entry.id === planet.specializationId) ?? SPECIALIZATIONS[0];
      return {
        energy: sum.energy + (1 + stage.passiveBonus) * type.productionMultiplier * specialization.energyMultiplier,
        biomass: sum.biomass + (planet.stage >= 4 ? 0.08 : 0) * type.productionMultiplier * specialization.biomassMultiplier,
        research: sum.research + (planet.stage >= 6 ? 0.06 : 0) * type.productionMultiplier * specialization.researchMultiplier,
        minerals: sum.minerals + (planet.specializationId === "mining" ? 0.35 : 0.02) * type.productionMultiplier * specialization.mineralsMultiplier,
        population: sum.population + (planet.stage >= 5 ? 0.05 : 0) * type.productionMultiplier * specialization.populationMultiplier,
      };
    },
    { energy: 0, biomass: 0, research: 0, minerals: 0, population: 0 },
  );

  const automationEnergy = AUTOMATION_NODES.reduce((sum, node) => sum + (node.energyPerLevel ?? 0) * getCount(state.automation, node.id), 0) * automationMultiplier;
  const automationClick = AUTOMATION_NODES.reduce((sum, node) => sum + (node.clickPerLevel ?? 0) * getCount(state.automation, node.id), 0) * automationMultiplier;
  const automationBiomass = AUTOMATION_NODES.reduce((sum, node) => sum + (node.biomassPerLevel ?? 0) * getCount(state.automation, node.id), 0) * automationMultiplier;
  const automationResearch = AUTOMATION_NODES.reduce((sum, node) => sum + (node.researchPerLevel ?? 0) * getCount(state.automation, node.id), 0) * automationMultiplier;
  const automationMinerals = AUTOMATION_NODES.reduce((sum, node) => sum + (node.mineralsPerLevel ?? 0) * getCount(state.automation, node.id), 0) * automationMultiplier;
  const automationPopulation = AUTOMATION_NODES.reduce((sum, node) => sum + (node.populationPerLevel ?? 0) * getCount(state.automation, node.id), 0) * automationMultiplier;

  return {
    clickPower: clickPower * activeModifierFactor(state.modifiers, "click"),
    energyPerSecond: (energyFromUpgrades + planetTotals.energy + automationEnergy) * researchEnergyMultiplier * prestigeEnergyMultiplier * starClass.energyMultiplier * persistent("energyPerSecond") * activeModifierFactor(state.modifiers, "energy"),
    biomassPerSecond: (biomassFromUpgrades + planetTotals.biomass + automationBiomass) * researchBiomassMultiplier * prestigeBiomassMultiplier * persistent("biomass") * activeModifierFactor(state.modifiers, "biomass"),
    researchPerSecond: (researchFromUpgrades + planetTotals.research + automationResearch) * researchResearchMultiplier * prestigeResearchMultiplier * persistent("research") * activeModifierFactor(state.modifiers, "research"),
    mineralsPerSecond: (planetTotals.minerals + automationMinerals) * persistent("minerals") * activeModifierFactor(state.modifiers, "minerals"),
    populationPerSecond: (planetTotals.population + automationPopulation) * persistent("population") * activeModifierFactor(state.modifiers, "population"),
  };
}
