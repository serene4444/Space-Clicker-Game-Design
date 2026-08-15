import { BALANCE } from "@/game-data/balance";
import { getPlanetCost } from "@/utilities/costs";
import { formatCompact } from "@/utilities/format";
import { getPlanetType } from "@/game-data/planet-types";
import type { GameStateData } from "@/types/game";

export interface PlanetPurchaseState {
  cost: number;
  isAvailable: boolean;
  isAffordably: boolean;
  isAtCap: boolean;
  requirementLabel: string;
  reason: string;
}

export function getPlanetPurchaseState(state: GameStateData, typeId: string): PlanetPurchaseState {
  const planetType = getPlanetType(typeId);
  const cost = getPlanetCost(state.planets.length, typeId);
  const requirements: string[] = [];

  if (planetType.unlockTotalEarned && state.totalEarned < planetType.unlockTotalEarned) {
    requirements.push(`reach ${formatCompact(planetType.unlockTotalEarned)} lifetime energy`);
  }
  if (typeof planetType.unlockPlanetCount === "number" && state.planets.length < planetType.unlockPlanetCount) {
    requirements.push(`own ${planetType.unlockPlanetCount} worlds`);
  }
  if (typeof planetType.unlockStage === "number" && !state.planets.some((planet) => planet.stage >= planetType.unlockStage!)) {
    requirements.push(`evolve a world to stage ${planetType.unlockStage}`);
  }

  const isAtCap = state.planets.length >= BALANCE.maxPlanets;
  const isAffordably = state.energy >= cost;
  const isAvailable = !isAtCap && isAffordably && requirements.length === 0;

  return {
    cost,
    isAvailable,
    isAffordably,
    isAtCap,
    requirementLabel: requirements.length ? requirements.join(" • ") : "Available immediately",
    reason: isAtCap ? "Planet capacity reached" : isAvailable ? "Ready to purchase" : requirements[0] ?? "Not yet available",
  };
}
