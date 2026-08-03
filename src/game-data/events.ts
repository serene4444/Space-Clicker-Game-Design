import type { EventDef } from "@/types/game";

export const EVENTS: EventDef[] = [
  {
    id: "solar-flare",
    name: "Solar Flare",
    description: "The star surges with unstable power.",
    cooldownMs: [180000, 360000],
    choices: [
      { id: "harness", label: "Harness it", modifier: { kind: "energy", amount: 0.35, durationMs: 60000 } },
      { id: "study", label: "Study it", researchDelta: 120 },
    ],
  },
  {
    id: "meteor-shower",
    name: "Meteor Shower",
    description: "A cloud of debris moves through the system.",
    cooldownMs: [240000, 420000],
    choices: [
      { id: "mine", label: "Mine it", mineralsDelta: 180 },
      { id: "shield", label: "Shield the planets", energyDelta: -60, populationDelta: 40 },
    ],
  },
  {
    id: "scientific-breakthrough",
    name: "Scientific Breakthrough",
    description: "A new optimization emerges from the research labs.",
    cooldownMs: [200000, 420000],
    choices: [
      { id: "publish", label: "Publish findings", researchDelta: 240 },
      { id: "apply", label: "Apply immediately", modifier: { kind: "research", amount: 0.4, durationMs: 90000 } },
    ],
  },
  {
    id: "alien-signal",
    name: "Alien Signal",
    description: "A faint signal echoes from deep space.",
    cooldownMs: [240000, 420000],
    choices: [
      { id: "respond", label: "Respond", influenceDelta: 90, energyDelta: -40 },
      { id: "archive", label: "Archive", researchDelta: 80, biomassDelta: 30 },
    ],
  },
  {
    id: "resource-discovery",
    name: "Resource Discovery",
    description: "New reserves are discovered near the outer system.",
    cooldownMs: [180000, 360000],
    choices: [
      { id: "extract", label: "Extract now", mineralsDelta: 220 },
      { id: "stabilize", label: "Stabilize long term", modifier: { kind: "minerals", amount: 0.45, durationMs: 120000 } },
    ],
  },
];

export function getEvent(id: string) {
  return EVENTS.find((event) => event.id === id) ?? EVENTS[0];
}
