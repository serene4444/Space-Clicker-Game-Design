import type { EventDef } from "@/types/game";

export const EVENTS: EventDef[] = [
  {
    id: "alien-council",
    name: "Alien Civilization",
    description: "An advanced civilization requests first contact.",
    cooldownMs: [240000, 420000],
    choices: [
      { id: "trade", label: "Trade", influenceDelta: 120, persistentEffect: { kind: "energyPerSecond", amount: 0.08 } },
      { id: "ally", label: "Ally", populationDelta: 80, persistentEffect: { kind: "population", amount: 0.12 } },
      { id: "spy", label: "Spy", researchDelta: 120, persistentEffect: { kind: "research", amount: 0.1 } },
      { id: "ignore", label: "Ignore", persistentEffect: { kind: "energy", amount: -0.02 } },
      { id: "war", label: "Wage war", mineralsDelta: 120, energyDelta: -40, persistentEffect: { kind: "click", amount: 0.16 } },
    ],
  },
  {
    id: "rare-comet",
    name: "Rare Comet",
    description: "A luminous comet passes close to the system.",
    cooldownMs: [180000, 360000],
    choices: [
      { id: "observe", label: "Observe", researchDelta: 120 },
      { id: "harvest", label: "Harvest", mineralsDelta: 200, persistentEffect: { kind: "minerals", amount: 0.08 } },
    ],
  },
  {
    id: "ancient-probe",
    name: "Ancient Probe",
    description: "An old machine from a forgotten civilization wakes up.",
    cooldownMs: [210000, 390000],
    choices: [
      { id: "decode", label: "Decode", researchDelta: 180, persistentEffect: { kind: "research", amount: 0.12 } },
      { id: "salvage", label: "Salvage", energyDelta: 60, mineralsDelta: 120 },
    ],
  },
  {
    id: "double-solar-output",
    name: "Double Solar Output",
    description: "A rare resonance temporarily amplifies the star.",
    cooldownMs: [180000, 360000],
    choices: [
      { id: "channel", label: "Channel", modifier: { kind: "energy", amount: 0.6, durationMs: 90000 } },
      { id: "stabilize", label: "Stabilize", energyDelta: 30, researchDelta: 70 },
    ],
  },
  {
    id: "new-mineral-deposit",
    name: "New Mineral Deposit",
    description: "A rich vein opens in a nearby body.",
    cooldownMs: [180000, 360000],
    choices: [
      { id: "extract", label: "Extract", mineralsDelta: 240 },
      { id: "protect", label: "Protect it", modifier: { kind: "minerals", amount: 0.35, durationMs: 120000 } },
    ],
  },
  {
    id: "asteroid-impact",
    name: "Asteroid Impact",
    description: "A large body slams into a settled world.",
    cooldownMs: [240000, 420000],
    choices: [
      { id: "repair", label: "Repair", energyDelta: -80, populationDelta: -20, persistentEffect: { kind: "energyPerSecond", amount: 0.04 } },
      { id: "salvage-impact", label: "Salvage", mineralsDelta: 140, persistentEffect: { kind: "minerals", amount: 0.06 } },
    ],
  },
  {
    id: "solar-storm",
    name: "Solar Storm",
    description: "Radiation storms sweep through the system.",
    cooldownMs: [210000, 390000],
    choices: [
      { id: "shield", label: "Shield", energyDelta: -60, persistentEffect: { kind: "energy", amount: 0.06 } },
      { id: "ride-out", label: "Ride it out", researchDelta: 90, persistentEffect: { kind: "research", amount: 0.06 } },
    ],
  },
  {
    id: "pandemic",
    name: "Pandemic",
    description: "Disease spreads across inhabited worlds.",
    cooldownMs: [240000, 420000],
    choices: [
      { id: "quarantine", label: "Quarantine", populationDelta: -40, persistentEffect: { kind: "population", amount: 0.08 } },
      { id: "treat", label: "Treat", energyDelta: -50, researchDelta: 60, persistentEffect: { kind: "population", amount: 0.12 } },
    ],
  },
  {
    id: "resource-collapse",
    name: "Resource Collapse",
    description: "Supply chains and extraction falter.",
    cooldownMs: [240000, 420000],
    choices: [
      { id: "stabilize", label: "Stabilize", mineralsDelta: -80, persistentEffect: { kind: "minerals", amount: 0.1 } },
      { id: "rebuild", label: "Rebuild", energyDelta: -30, populationDelta: 30, persistentEffect: { kind: "energyPerSecond", amount: 0.05 } },
    ],
  },
  {
    id: "planet-revolt",
    name: "Planet Revolt",
    description: "A developed world resists central authority.",
    cooldownMs: [240000, 420000],
    choices: [
      { id: "appease", label: "Appease", influenceDelta: 60, persistentEffect: { kind: "population", amount: 0.08 } },
      { id: "suppress", label: "Suppress", energyDelta: -70, influenceDelta: -20, persistentEffect: { kind: "click", amount: 0.08 } },
    ],
  },
];

export function getEvent(id: string) {
  return EVENTS.find((event) => event.id === id) ?? EVENTS[0];
}
