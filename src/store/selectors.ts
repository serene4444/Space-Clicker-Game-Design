import { computeProduction } from "@/utilities/production";
import type { GameStateData } from "@/types/game";

export function selectProduction(state: GameStateData) {
  return computeProduction(state);
}

export function selectCanAfford(state: GameStateData, cost: number) {
  return state.energy >= cost;
}
