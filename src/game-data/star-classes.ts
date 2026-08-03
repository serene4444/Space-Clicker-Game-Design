import type { StarClassDef } from "@/types/game";

export const STAR_CLASSES: StarClassDef[] = [
  {
    id: "yellow_dwarf",
    name: "Yellow Dwarf",
    description: "A stable main-sequence star. Balanced production.",
    unlockEssence: 0,
    modifiers: { clickMultiplier: 1, epsMultiplier: 1, costMultiplier: 1 },
  },
  {
    id: "red_dwarf",
    name: "Red Dwarf",
    description: "Long-lived and efficient. Lower costs, moderate output.",
    unlockEssence: 1,
    modifiers: { clickMultiplier: 0.8, epsMultiplier: 0.9, costMultiplier: 0.85 },
  },
  {
    id: "blue_giant",
    name: "Blue Giant",
    description: "Massive and luminous. High output, higher costs.",
    unlockEssence: 5,
    modifiers: { clickMultiplier: 1.5, epsMultiplier: 1.8, costMultiplier: 1.2 },
  },
  {
    id: "binary",
    name: "Binary Star",
    description: "Twin stars double passive generation.",
    unlockEssence: 10,
    modifiers: { clickMultiplier: 1.2, epsMultiplier: 2, costMultiplier: 1.1 },
  },
  {
    id: "neutron",
    name: "Neutron Star",
    description: "Extreme density yields massive click power.",
    unlockEssence: 25,
    modifiers: { clickMultiplier: 3, epsMultiplier: 1.5, costMultiplier: 1.3 },
  },
  {
    id: "artificial",
    name: "Artificial Star",
    description: "Engineered perfection. All stats boosted.",
    unlockEssence: 50,
    modifiers: { clickMultiplier: 2, epsMultiplier: 2, costMultiplier: 0.9 },
  },
];

export function getStarClass(id: string): StarClassDef {
  return STAR_CLASSES.find((s) => s.id === id) ?? STAR_CLASSES[0];
}
