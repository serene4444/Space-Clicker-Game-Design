import { create } from "zustand";
import { toast } from "sonner";
import { ACHIEVEMENTS } from "@/game-data/achievements";
import { AUTOMATION_NODES } from "@/game-data/automation";
import { BALANCE } from "@/game-data/balance";
import { EVENTS, getEvent } from "@/game-data/events";
import { PLANET_TYPES, getPlanetType } from "@/game-data/planet-types";
import { PRESTIGE_UPGRADES } from "@/game-data/prestige";
import { RESEARCH_NODES } from "@/game-data/research";
import { SPECIALIZATIONS, getSpecialization } from "@/game-data/specializations";
import { STAGES } from "@/game-data/evolution-stages";
import { getAutomationCost, getEvolveCost, getPlanetCost, getPrestigeEssenceGain, getPrestigeUpgradeCost, getResearchCost, getSpecializationCost, getUpgradeCost } from "@/utilities/costs";
import { computeProduction } from "@/utilities/production";
import { getPlanetPopulationCap, getPlanetPopulationGrowthRate, getPopulationMilestone, getTotalPopulation } from "@/utilities/population";
import { getPlanetPurchaseState } from "@/utilities/planetProgression";
import type { ActiveEvent, ColonyRoute, GameSaveEnvelope, GameStateData, GameStats, Modifier, PersistentEffect, Planet } from "@/types/game";

function starterPlanet(): Planet {
  return { id: "planet-0", name: "Homeworld", typeId: "rocky", stage: 0, orbitIndex: 0, angle: 0, size: 84, population: 0 };
}

function starterStats(): GameStats {
  return { totalClicks: 0, totalUpgrades: 0, totalPlanetsPurchased: 0, totalPrestiges: 0, playTimeMs: 0 };
}

function randomEventDelay() {
  return BALANCE.eventCooldownMinMs + Math.random() * (BALANCE.eventCooldownMaxMs - BALANCE.eventCooldownMinMs);
}

function cleanModifiers(modifiers: Modifier[]) {
  const now = Date.now();
  return modifiers.filter((modifier) => modifier.expiresAt > now);
}

function snapshotState(state: GameStateData) {
  return {
    energy: state.energy,
    totalEarned: state.totalEarned,
    minerals: state.minerals,
    biomass: state.biomass,
    researchData: state.researchData,
    population: state.population,
    influence: state.influence,
    exoticMatter: state.exoticMatter,
    cosmicEssence: state.cosmicEssence,
    starClassId: state.starClassId,
    upgrades: { ...state.upgrades },
    research: { ...state.research },
    automation: { ...state.automation },
    prestigeUpgrades: { ...state.prestigeUpgrades },
    achievements: { ...state.achievements },
    planets: state.planets.map((planet) => ({ ...planet })),
    selectedTarget: state.selectedTarget,
    activeTab: state.activeTab,
    settings: { ...state.settings },
    lastSaveTime: state.lastSaveTime,
    lastTickTime: state.lastTickTime,
    rebirthCount: state.rebirthCount,
    stats: { ...state.stats },
    modifiers: state.modifiers.map((modifier) => ({ ...modifier })),
    persistentEffects: state.persistentEffects.map((effect) => ({ ...effect })),
    colonyRoutes: state.colonyRoutes.map((route) => ({ ...route })),
    currentEvent: state.currentEvent ? { ...state.currentEvent } : null,
    nextEventAt: state.nextEventAt,
  } satisfies GameStateData;
}

function createBaseState(): GameStateData {
  return {
    energy: 0,
    totalEarned: 0,
    minerals: 0,
    biomass: 0,
    researchData: 0,
    population: 0,
    influence: 0,
    exoticMatter: 0,
    cosmicEssence: 0,
    starClassId: BALANCE.startingStarClass,
    upgrades: {},
    research: {},
    automation: {},
    prestigeUpgrades: {},
    achievements: {},
    planets: [starterPlanet()],
    selectedTarget: "star",
    activeTab: "system",
    settings: { muted: false, reducedMotion: false, numberFormat: "short", soundVolume: 0.5, musicVolume: 0.5 },
    lastSaveTime: Date.now(),
    lastTickTime: Date.now(),
    rebirthCount: 0,
    stats: starterStats(),
    modifiers: [],
    persistentEffects: [],
    colonyRoutes: [],
    currentEvent: null,
    nextEventAt: Date.now() + randomEventDelay(),
  };
}

function syncAchievements(state: GameStateData) {
  ACHIEVEMENTS.forEach((achievement) => {
    if (!state.achievements[achievement.id] && achievement.check(state)) {
      state.achievements[achievement.id] = true;
      toast.success(`Achievement unlocked: ${achievement.name}`);
    }
  });
}

type Result = { ok: true } | { ok: false; reason: string };

type GameStore = GameStateData & {
  newGame: () => void;
  loadGameState: (state: GameStateData) => void;
  updateSettings: (settings: Partial<GameStateData["settings"]>) => void;
  selectTarget: (target: GameStateData["selectedTarget"]) => void;
  setActiveTab: (tab: GameStateData["activeTab"]) => void;
  clickStar: () => Result;
  buyUpgrade: (upgradeId: string) => Result;
  buyPlanet: (typeId: string) => Result;
  evolvePlanet: (planetId: string) => Result;
  specializePlanet: (planetId: string, specializationId: string) => Result;
  buyResearch: (researchId: string) => Result;
  buyAutomation: (automationId: string) => Result;
  buyPrestigeUpgrade: (upgradeId: string) => Result;
  colonizePlanet: (planetId: string, targetPlanetId: string, population: number) => Result;
  setStarClass: (starClassId: string) => void;
  resolveEventChoice: (choiceId: string) => Result;
  prestige: () => Result;
  tick: (deltaSeconds: number) => void;
  applyOfflineProgress: (elapsedMs: number) => { energyGained: number };
  serialize: () => GameSaveEnvelope;
  loadSaveEnvelope: (envelope: GameSaveEnvelope) => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...createBaseState(),
  newGame: () => set({ ...createBaseState() }),
  loadGameState: (state) => set({ ...snapshotState(state), lastTickTime: Date.now(), lastSaveTime: Date.now() }),
  loadSaveEnvelope: (envelope) => set({ ...snapshotState(envelope.state), lastTickTime: Date.now(), lastSaveTime: Date.now() }),
  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
  selectTarget: (target) => set({ selectedTarget: target }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setStarClass: (starClassId) => set({ starClassId }),
  serialize: () => ({ version: BALANCE.saveVersion, state: snapshotState(get()) }),

  clickStar: () => {
    const production = computeProduction(get());
    set((state) => ({ energy: state.energy + production.clickPower, totalEarned: state.totalEarned + production.clickPower, stats: { ...state.stats, totalClicks: state.stats.totalClicks + 1 } }));
    syncAchievements(get());
    return { ok: true };
  },

  buyUpgrade: (upgradeId) => {
    const state = get();
    const owned = state.upgrades[upgradeId] ?? 0;
    const cost = getUpgradeCost(upgradeId, owned);
    if (state.energy < cost) return { ok: false, reason: "Not enough energy" };
    set((draft) => ({
      energy: draft.energy - cost,
      upgrades: { ...draft.upgrades, [upgradeId]: owned + 1 },
      stats: { ...draft.stats, totalUpgrades: draft.stats.totalUpgrades + 1 },
    }));
    syncAchievements(get());
    return { ok: true };
  },

  buyPlanet: (typeId) => {
    const state = get();
    const purchaseState = getPlanetPurchaseState(state, typeId);
    if (!purchaseState.isAvailable) return { ok: false, reason: purchaseState.reason };
    const type = getPlanetType(typeId);
    const newPlanet: Planet = {
      id: `planet-${Date.now()}`,
      name: `${type.name} World`,
      typeId,
      stage: 0,
      orbitIndex: state.planets.length,
      angle: state.planets.length * 45,
      size: 72 + state.planets.length * 6,
      population: 0,
      isNew: true,
    };
    set((draft) => ({
      energy: draft.energy - purchaseState.cost,
      planets: [...draft.planets, newPlanet],
      selectedTarget: newPlanet.id,
      activeTab: "system",
      stats: { ...draft.stats, totalPlanetsPurchased: draft.stats.totalPlanetsPurchased + 1 },
    }));
    toast.success(`${newPlanet.name} has entered orbit.`);
    syncAchievements(get());
    return { ok: true };
  },

  colonizePlanet: (planetId, targetPlanetId, population) => {
    const state = get();
    const source = state.planets.find((planet) => planet.id === planetId);
    const target = state.planets.find((planet) => planet.id === targetPlanetId);
    if (!source || !target) return { ok: false, reason: "Planet not found" };
    if (source.stage < 8) return { ok: false, reason: "Colonization unlocks at spacefaring civilization" };
    if (population <= 0) return { ok: false, reason: "Invalid colony size" };
    const sendAmount = Math.min(population, Math.floor(source.population * 0.35));
    if (sendAmount <= 0) return { ok: false, reason: "Not enough population to colonize" };
    const route: ColonyRoute = {
      id: `colony-${Date.now()}`,
      fromPlanetId: planetId,
      toPlanetId: targetPlanetId,
      population: sendAmount,
      startedAt: Date.now(),
      arrivalAt: Date.now() + 45_000,
    };
    set((draft) => ({
      planets: draft.planets.map((planet) => (planet.id === planetId ? { ...planet, population: Math.max(0, planet.population - sendAmount) } : planet)),
      colonyRoutes: [...draft.colonyRoutes, route],
    }));
    toast.success(`Colony ships launched from ${source.name}.`);
    return { ok: true };
  },

  evolvePlanet: (planetId) => {
    const state = get();
    const planet = state.planets.find((item) => item.id === planetId);
    if (!planet) return { ok: false, reason: "Planet not found" };
    if (planet.stage >= STAGES.length - 1) return { ok: false, reason: "Planet is fully evolved" };
    const nextStage = STAGES[planet.stage + 1];
    if (nextStage.requiresResearch?.some((researchId) => !state.research[researchId])) return { ok: false, reason: "Research prerequisite missing" };
    const cost = getEvolveCost(planet.stage, planet.orbitIndex);
    if (state.energy < cost) return { ok: false, reason: "Not enough energy" };
    set((draft) => ({
      energy: draft.energy - cost,
      planets: draft.planets.map((item) => {
        if (item.id !== planetId) return item;
        const nextStageId = Math.min(item.stage + 1, STAGES.length - 1);
        const nextCap = getPlanetPopulationCap(nextStageId);
        const nextPopulation = Math.max(item.population, nextCap);
        return { ...item, stage: nextStageId, population: nextPopulation };
      }),
    }));
    const evolvedPlanet = get().planets.find((item) => item.id === planetId);
    if (evolvedPlanet) {
      toast.success(`${evolvedPlanet.name} reached ${getPopulationMilestone(evolvedPlanet.stage).population >= 1_000_000 ? "a new population era" : "a new stage"}.`);
    }
    syncAchievements(get());
    return { ok: true };
  },

  specializePlanet: (planetId, specializationId) => {
    const state = get();
    const planet = state.planets.find((item) => item.id === planetId);
    if (!planet) return { ok: false, reason: "Planet not found" };
    if (planet.stage < 6) return { ok: false, reason: "Specialization unlocks at intelligent life" };
    if (!SPECIALIZATIONS.find((specialization) => specialization.id === specializationId)) return { ok: false, reason: "Specialization unavailable" };
    const cost = getSpecializationCost(planet.specializationId);
    if (state.energy < cost) return { ok: false, reason: "Not enough energy" };
    set((draft) => ({
      energy: draft.energy - cost,
      planets: draft.planets.map((item) => (item.id === planetId ? { ...item, specializationId } : item)),
    }));
    syncAchievements(get());
    return { ok: true };
  },

  buyResearch: (researchId) => {
    const state = get();
    if (state.research[researchId]) return { ok: false, reason: "Already researched" };
    const node = RESEARCH_NODES.find((entry) => entry.id === researchId);
    if (!node) return { ok: false, reason: "Unknown research" };
    if (!node.prerequisites.every((prerequisite) => state.research[prerequisite])) return { ok: false, reason: "Prerequisite missing" };
    const cost = getResearchCost(researchId, 0);
    if (state.researchData < cost) return { ok: false, reason: "Not enough research" };
    set((draft) => ({ researchData: draft.researchData - cost, research: { ...draft.research, [researchId]: true } }));
    syncAchievements(get());
    return { ok: true };
  },

  buyAutomation: (automationId) => {
    const state = get();
    const node = AUTOMATION_NODES.find((entry) => entry.id === automationId);
    if (!node) return { ok: false, reason: "Unknown automation" };
    if (!node.prerequisiteResearch.every((researchId) => state.research[researchId])) return { ok: false, reason: "Research prerequisite missing" };
    const level = state.automation[automationId] ?? 0;
    const cost = getAutomationCost(automationId, level);
    if (state.researchData < cost) return { ok: false, reason: "Not enough research" };
    set((draft) => ({ researchData: draft.researchData - cost, automation: { ...draft.automation, [automationId]: level + 1 } }));
    syncAchievements(get());
    return { ok: true };
  },

  buyPrestigeUpgrade: (upgradeId) => {
    const state = get();
    const level = state.prestigeUpgrades[upgradeId] ?? 0;
    const cost = getPrestigeUpgradeCost(upgradeId, level);
    if (state.cosmicEssence < cost) return { ok: false, reason: "Not enough cosmic essence" };
    set((draft) => ({ cosmicEssence: draft.cosmicEssence - cost, prestigeUpgrades: { ...draft.prestigeUpgrades, [upgradeId]: level + 1 } }));
    return { ok: true };
  },

  resolveEventChoice: (choiceId) => {
    const state = get();
    if (!state.currentEvent) return { ok: false, reason: "No active event" };
    const event = getEvent(state.currentEvent.eventId);
    const choice = event.choices.find((entry) => entry.id === choiceId);
    if (!choice) return { ok: false, reason: "Unknown choice" };
    const nextModifiers = cleanModifiers(state.modifiers);
    const nextEventAt = Date.now() + randomEventDelay();
    const updatedModifiers = choice.modifier ? [...nextModifiers, { id: `${event.id}-${choice.id}-${Date.now()}`, kind: choice.modifier.kind, amount: choice.modifier.amount, expiresAt: Date.now() + choice.modifier.durationMs }] : nextModifiers;
      const nextPersistentEffects = choice.persistentEffect ? [...state.persistentEffects.filter((effect) => effect.id !== `${event.id}-${choice.id}`), { id: `${event.id}-${choice.id}`, kind: choice.persistentEffect.kind, amount: choice.persistentEffect.amount }] : state.persistentEffects;
    set({
      currentEvent: null,
      nextEventAt,
      modifiers: updatedModifiers,
        persistentEffects: nextPersistentEffects,
      energy: state.energy + (choice.energyDelta ?? 0),
      minerals: state.minerals + (choice.mineralsDelta ?? 0),
      biomass: state.biomass + (choice.biomassDelta ?? 0),
      researchData: state.researchData + (choice.researchDelta ?? 0),
      population: state.population + (choice.populationDelta ?? 0),
      influence: state.influence + (choice.influenceDelta ?? 0),
    });
    syncAchievements(get());
    return { ok: true };
  },

  prestige: () => {
    const state = get();
    if (state.totalEarned < BALANCE.prestigeThreshold) return { ok: false, reason: "Prestige threshold not reached" };
    const essenceGain = getPrestigeEssenceGain(state.totalEarned);
    const fresh = createBaseState();
    set({
      ...fresh,
      settings: state.settings,
      achievements: state.achievements,
      prestigeUpgrades: state.prestigeUpgrades,
      cosmicEssence: state.cosmicEssence + essenceGain,
      rebirthCount: state.rebirthCount + 1,
      starClassId: state.starClassId,
      stats: { ...fresh.stats, totalPrestiges: state.stats.totalPrestiges + 1, playTimeMs: state.stats.playTimeMs },
    });
    toast.success(`Stellar rebirth complete. Gained ${essenceGain} cosmic essence.`);
    syncAchievements(get());
    return { ok: true };
  },

  tick: (deltaSeconds) => {
    const state = get();
    const production = computeProduction(state);
    const modifiers = cleanModifiers(state.modifiers);
    const modifierFactor = (kind: Modifier["kind"]) => 1 + modifiers.filter((modifier) => modifier.kind === kind).reduce((sum, modifier) => sum + modifier.amount, 0);
    const energyGain = production.energyPerSecond * modifierFactor("energy") * deltaSeconds;
    const biomassGain = production.biomassPerSecond * modifierFactor("biomass") * deltaSeconds;
    const researchGain = production.researchPerSecond * modifierFactor("research") * deltaSeconds;
    const mineralsGain = production.mineralsPerSecond * modifierFactor("minerals") * deltaSeconds;
    const populationGain = production.populationPerSecond * modifierFactor("population") * deltaSeconds;
    const maturedPlanets = state.planets.map((planet) => {
      const growthRate = getPlanetPopulationGrowthRate(planet);
      if (growthRate <= 0) return planet;
      const cap = getPlanetPopulationCap(planet.stage);
      const nextPopulation = Math.min(cap, planet.population + cap * growthRate * deltaSeconds);
      return nextPopulation > planet.population ? { ...planet, population: nextPopulation } : planet;
    });
    const now = Date.now();
    const arrivedRoutes = state.colonyRoutes.filter((route) => route.arrivalAt <= now);
    const activeRoutes = state.colonyRoutes.filter((route) => route.arrivalAt > now);
    const planetsWithArrivals = maturedPlanets.map((planet) => {
      const arrivingPopulation = arrivedRoutes.filter((route) => route.toPlanetId === planet.id).reduce((sum, route) => sum + route.population, 0);
      return arrivingPopulation > 0 ? { ...planet, population: planet.population + arrivingPopulation } : planet;
    });
    const nextEvent: ActiveEvent | null = !state.currentEvent && Date.now() >= state.nextEventAt ? { eventId: EVENTS[Math.floor(Math.random() * EVENTS.length)]?.id ?? EVENTS[0].id, startedAt: Date.now() } : state.currentEvent;
    set((draft) => ({
      energy: draft.energy + energyGain,
      totalEarned: draft.totalEarned + energyGain,
      biomass: draft.biomass + biomassGain,
      researchData: draft.researchData + researchGain,
      minerals: draft.minerals + mineralsGain,
      population: getTotalPopulation(planetsWithArrivals) + populationGain,
      planets: planetsWithArrivals,
      colonyRoutes: activeRoutes,
      stats: { ...draft.stats, playTimeMs: draft.stats.playTimeMs + deltaSeconds * 1000 },
      modifiers,
      currentEvent: nextEvent,
      nextEventAt: nextEvent && nextEvent !== draft.currentEvent ? Date.now() + randomEventDelay() : draft.nextEventAt,
    }));
    syncAchievements(get());
  },

  applyOfflineProgress: (elapsedMs) => {
    const cappedMs = Math.min(elapsedMs, BALANCE.offlineCapHours * 3600 * 1000);
    if (cappedMs <= 0) return { energyGained: 0 };
    const production = computeProduction(get());
    const energyGained = production.energyPerSecond * (cappedMs / 1000) * BALANCE.offlineEfficiency;
    set((state) => ({
      energy: state.energy + energyGained,
      totalEarned: state.totalEarned + energyGained,
      lastTickTime: Date.now(),
      lastSaveTime: Date.now(),
    }));
    syncAchievements(get());
    return { energyGained };
  },
}));
