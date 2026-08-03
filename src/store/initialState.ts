import { ORBIT_RADII, PLANET_NAMES } from "@/game-data/constants";
import { getPlanetType } from "@/game-data/planet-types";
import type { GameSettings, GameState, GameStats, Planet } from "@/types/game";

export function createDefaultSettings(): GameSettings {
  return {
    masterMuted: true,
    sfxVolume: 0.5,
    musicVolume: 0.3,
    reducedMotion: false,
    numberFormat: "short",
  };
}

export function createDefaultStats(): GameStats {
  return {
    totalClicks: 0,
    totalUpgradesPurchased: 0,
    totalPlanetsFormed: 0,
    totalEvolutions: 0,
    playtimeSeconds: 0,
    highestEnergy: 0,
  };
}

export function createStartingPlanet(): Planet {
  const type = getPlanetType("rocky");
  return {
    id: "planet-start",
    name: "Primus",
    typeId: "rocky",
    stage: 0,
    color: type.color,
    ringColor: type.ringColor,
    size: 26,
    angle: 45,
    orbitRadius: ORBIT_RADII[0],
    specialization: null,
  };
}

export function createPlanet(typeId: string, index: number): Planet {
  const type = getPlanetType(typeId);
  return {
    id: `planet-${Date.now()}-${index}`,
    name: PLANET_NAMES[index] || `World-${index + 1}`,
    typeId: type.id,
    stage: 0,
    color: type.color,
    ringColor: type.ringColor,
    size: 22 + index * 4,
    angle: index * 72 + 30,
    orbitRadius: ORBIT_RADII[index] ?? ORBIT_RADII[ORBIT_RADII.length - 1],
    specialization: null,
  };
}

export function createInitialState(): GameState {
  const now = Date.now();
  return {
    stellarEnergy: 0,
    totalEarned: 0,
    minerals: 0,
    biomass: 0,
    researchData: 0,
    population: 0,
    influence: 0,
    exoticMatter: 0,
    cosmicEssence: 0,

    upgrades: {},
    research: {},
    automation: {},
    prestigeUpgrades: {},
    achievements: {},

    starClass: "yellow_dwarf",
    planets: [createStartingPlanet()],
    selectedTarget: "star",

    settings: createDefaultSettings(),
    lastSaveTime: now,
    lastTickTime: now,
    rebirthCount: 0,
    stats: createDefaultStats(),

    activeModifiers: [],
    lastEventTime: now,
    autoEvolveEnabled: false,
  };
}

export function createRebirthState(
  prev: GameState,
  essenceGain: number,
  startingPlanets: number
): GameState {
  const now = Date.now();
  const planets: Planet[] = [createStartingPlanet()];
  for (let i = 1; i < startingPlanets; i++) {
    planets.push(createPlanet("rocky", i));
  }

  return {
    ...createInitialState(),
    cosmicEssence: prev.cosmicEssence + essenceGain,
    prestigeUpgrades: { ...prev.prestigeUpgrades },
    achievements: { ...prev.achievements },
    starClass: prev.starClass,
    settings: { ...prev.settings },
    rebirthCount: prev.rebirthCount + 1,
    stats: {
      ...prev.stats,
      playtimeSeconds: prev.stats.playtimeSeconds,
    },
    planets,
    lastSaveTime: now,
    lastTickTime: now,
  };
}
