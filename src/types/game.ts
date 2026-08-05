export type TabId = "system" | "planets" | "upgrades" | "research" | "automation" | "achievements" | "prestige" | "stats";
export type NumberFormat = "short" | "scientific";
export type SelectedTarget = "star" | string;

export interface GameSettings {
  muted: boolean;
  reducedMotion: boolean;
  numberFormat: NumberFormat;
  soundVolume: number;
  musicVolume: number;
}

export interface GameStats {
  totalClicks: number;
  totalUpgrades: number;
  totalPlanetsPurchased: number;
  totalPrestiges: number;
  playTimeMs: number;
}

export interface Planet {
  id: string;
  name: string;
  typeId: string;
  stage: number;
  orbitIndex: number;
  angle: number;
  size: number;
  population: number;
  specializationId?: string;
}

export interface Modifier {
  id: string;
  kind: "energy" | "click" | "biomass" | "research" | "minerals" | "population";
  amount: number;
  expiresAt: number;
}

export interface ActiveEvent {
  eventId: string;
  startedAt: number;
}

export interface PersistentEffect {
  id: string;
  kind: "energy" | "click" | "energyPerSecond" | "biomass" | "research" | "minerals" | "population" | "influence";
  amount: number;
}

export interface ColonyRoute {
  id: string;
  fromPlanetId: string;
  toPlanetId: string;
  population: number;
  startedAt: number;
  arrivalAt: number;
}

export interface GameStateData {
  energy: number;
  totalEarned: number;
  minerals: number;
  biomass: number;
  researchData: number;
  population: number;
  influence: number;
  exoticMatter: number;
  cosmicEssence: number;
  starClassId: string;
  upgrades: Record<string, number>;
  research: Record<string, boolean>;
  automation: Record<string, number>;
  prestigeUpgrades: Record<string, number>;
  achievements: Record<string, boolean>;
  planets: Planet[];
  selectedTarget: SelectedTarget;
  activeTab: TabId;
  settings: GameSettings;
  lastSaveTime: number;
  lastTickTime: number;
  rebirthCount: number;
  stats: GameStats;
  modifiers: Modifier[];
  persistentEffects: PersistentEffect[];
  colonyRoutes: ColonyRoute[];
  currentEvent: ActiveEvent | null;
  nextEventAt: number;
}

export interface GameSaveEnvelope {
  version: number;
  state: GameStateData;
}

export interface UpgradeDef {
  id: string;
  name: string;
  category: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  unlockTotalEarned?: number;
  clickPower?: number;
  energyPerSecond?: number;
  biomassPerSecond?: number;
  researchPerSecond?: number;
  planetMultiplier?: number;
}

export interface StageDef {
  id: number;
  name: string;
  description: string;
  cost: number;
  passiveBonus: number;
  requiresResearch?: string[];
  visual: { ocean: boolean; life: boolean; cities: boolean };
}

export interface PlanetTypeDef {
  id: string;
  name: string;
  description: string;
  color: string;
  costMultiplier: number;
  productionMultiplier: number;
}

export interface SpecializationDef {
  id: string;
  name: string;
  description: string;
  costMultiplier: number;
  energyMultiplier: number;
  researchMultiplier: number;
  biomassMultiplier: number;
  mineralsMultiplier: number;
  populationMultiplier: number;
}

export interface ResearchNode {
  id: string;
  branch: string;
  name: string;
  description: string;
  cost: number;
  prerequisites: string[];
  clickMultiplier?: number;
  energyMultiplier?: number;
  biomassMultiplier?: number;
  researchMultiplier?: number;
  automationMultiplier?: number;
  unlockPlanetTypes?: string[];
  unlockSpecializations?: string[];
}

export interface AutomationNode {
  id: string;
  branch: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  prerequisiteResearch: string[];
  energyPerLevel?: number;
  clickPerLevel?: number;
  biomassPerLevel?: number;
  researchPerLevel?: number;
  mineralsPerLevel?: number;
  populationPerLevel?: number;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon?: string;
  check: (state: GameStateData) => boolean;
}

export interface PrestigeUpgradeDef {
  id: string;
  branch: string;
  name: string;
  description: string;
  baseCost: number;
  energyMultiplier?: number;
  clickMultiplier?: number;
  biomassMultiplier?: number;
  researchMultiplier?: number;
  automationMultiplier?: number;
  costMultiplier?: number;
  startingPlanetBonus?: number;
}

export interface StarClassDef {
  id: string;
  branch: string;
  name: string;
  description: string;
  unlockRebirths: number;
  clickMultiplier: number;
  energyMultiplier: number;
  costMultiplier: number;
}

export interface EventChoiceDef {
  id: string;
  label: string;
  energyDelta?: number;
  researchDelta?: number;
  mineralsDelta?: number;
  biomassDelta?: number;
  populationDelta?: number;
  influenceDelta?: number;
  persistentEffect?: { kind: PersistentEffect["kind"]; amount: number };
  modifier?: { kind: Modifier["kind"]; amount: number; durationMs: number };
}

export interface EventDef {
  id: string;
  name: string;
  description: string;
  cooldownMs: [number, number];
  choices: EventChoiceDef[];
}
export type NavSection =
  | "system"
  | "planets"
  | "upgrades"
  | "research"
  | "automation"
  | "achievements"
  | "prestige"
  | "statistics";

export type Screen = "start" | "game" | "prestige";

export type PlanetTypeId =
  | "rocky"
  | "ocean"
  | "desert"
  | "ice"
  | "gas_giant"
  | "volcanic"
  | "forest"
  | "artificial";

export type SpecializationId =
  | "mining"
  | "agricultural"
  | "research"
  | "industrial"
  | "energy"
  | "military"
  | "trade"
  | "ecological"
  | "population";

export type UpgradeCategory =
  | "stellar"
  | "planetary"
  | "biological"
  | "civilization"
  | "infrastructure";

export type ResearchBranch =
  | "astronomy"
  | "biology"
  | "engineering"
  | "ai"
  | "terraforming"
  | "travel"
  | "quantum"
  | "stellar";

export interface Planet {
  id: string;
  name: string;
  typeId: PlanetTypeId;
  stage: number;
  color: string;
  ringColor: string;
  size: number;
  angle: number;
  orbitRadius: number;
  specialization: SpecializationId | null;
}

export interface ClickParticle {
  id: number;
  x: number;
  y: number;
  val: number;
}

export interface ActiveModifier {
  id: string;
  label: string;
  epsMultiplier?: number;
  clickMultiplier?: number;
  expiresAt: number;
}

export interface GameSettings {
  masterMuted: boolean;
  sfxVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  numberFormat: "short" | "scientific";
}

export interface GameStats {
  totalClicks: number;
  totalUpgradesPurchased: number;
  totalPlanetsFormed: number;
  totalEvolutions: number;
  playtimeSeconds: number;
  highestEnergy: number;
}

export interface GameState {
  stellarEnergy: number;
  totalEarned: number;
  minerals: number;
  biomass: number;
  researchData: number;
  population: number;
  influence: number;
  exoticMatter: number;
  cosmicEssence: number;

  upgrades: Record<string, number>;
  research: Record<string, boolean>;
  automation: Record<string, number>;
  prestigeUpgrades: Record<string, number>;
  achievements: Record<string, boolean>;

  starClass: string;
  planets: Planet[];
  selectedTarget: "star" | string;

  settings: GameSettings;
  lastSaveTime: number;
  lastTickTime: number;
  rebirthCount: number;
  stats: GameStats;

  activeModifiers: ActiveModifier[];
  lastEventTime: number;
  autoEvolveEnabled: boolean;
}

export interface SaveData extends GameState {
  version: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  category: UpgradeCategory;
  baseCost: number;
  costMultiplier: number;
  energyPerSec: number;
  clickBonus: number;
  icon: string;
  unlockAt: number;
  requiredUpgrade?: string;
}

export interface EvolutionStageDef {
  id: number;
  name: string;
  description: string;
  costMultiplier: number;
  passiveBonus: number;
  biomassBonus: number;
  researchBonus: number;
  populationBonus: number;
  requiredUpgrade?: string;
  minStage?: number;
}

export interface PlanetTypeDef {
  id: PlanetTypeId;
  name: string;
  description: string;
  color: string;
  ringColor: string;
  costMultiplier: number;
  bonuses: {
    energy?: number;
    minerals?: number;
    biomass?: number;
    research?: number;
  };
  unlockAt: number;
}

export interface SpecializationDef {
  id: SpecializationId;
  name: string;
  description: string;
  tint: string;
  bonuses: {
    energy?: number;
    minerals?: number;
    biomass?: number;
    research?: number;
    population?: number;
  };
}

export interface ResearchDef {
  id: string;
  branch: ResearchBranch;
  name: string;
  description: string;
  cost: number;
  prerequisites: string[];
  milestoneRequirements?: { minStage?: number; totalEarned?: number };
  effects: ResearchEffect[];
}

export type ResearchEffect =
  | { type: "clickMultiplier"; value: number }
  | { type: "epsMultiplier"; value: number }
  | { type: "biomassMultiplier"; value: number }
  | { type: "researchMultiplier"; value: number }
  | { type: "automationEfficiency"; value: number }
  | { type: "unlockPlanetType"; planetType: PlanetTypeId };

export interface AutomationDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  unlockAt: number;
  effectPerLevel: {
    energyPerSec?: number;
    clicksPerSec?: number;
    researchPerSec?: number;
    mineralsPerSec?: number;
  };
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface PrestigeUpgradeDef {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  maxLevel: number;
  effectPerLevel: {
    epsMultiplier?: number;
    clickMultiplier?: number;
    costReduction?: number;
    researchMultiplier?: number;
    evolutionSpeed?: number;
    automationMultiplier?: number;
    startingPlanets?: number;
  };
}

export interface StarClassDef {
  id: string;
  name: string;
  description: string;
  unlockEssence: number;
  modifiers: {
    clickMultiplier?: number;
    epsMultiplier?: number;
    costMultiplier?: number;
  };
}

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effect: {
    energy?: number;
    minerals?: number;
    research?: number;
    modifier?: Omit<ActiveModifier, "expiresAt">;
  };
}

export interface EventDef {
  id: string;
  name: string;
  description: string;
  minTotalEarned: number;
  choices: EventChoice[];
}
