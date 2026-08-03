export const C = {
  navy: "#071326",
  midnight: "#0C1C36",
  cloudBlue: "#122747",
  panel: "#14233D",
  indigo: "#2D3F70",
  violet: "#736AAE",
  cream: "#FFF1C7",
  orange: "#F28A5B",
  planetBlue: "#A9C7DF",
  green: "#6EA98B",
  text: "#F4F3EF",
  textSec: "#9EACC1",
  textDis: "#59677D",
} as const;

export const SAVE_KEY = "stellar-genesis-save-v1";
export const SAVE_VERSION = 1;

export const PLANET_NAMES = [
  "Kepler-IV",
  "Vega Prime",
  "Aurora-7",
  "Nexus Beta",
  "Helios Minor",
];

export const ORBIT_RADII = [110, 170, 230, 290];

export const NAV_ITEMS = [
  { id: "system" as const, label: "Solar System", icon: "◎", unlockAt: 0 },
  { id: "planets" as const, label: "Planets", icon: "◉", unlockAt: 0 },
  { id: "upgrades" as const, label: "Upgrades", icon: "⬡", unlockAt: 0 },
  { id: "research" as const, label: "Research", icon: "🔬", unlockAt: 500 },
  { id: "automation" as const, label: "Automation", icon: "⚙", unlockAt: 5000 },
  { id: "achievements" as const, label: "Achievements", icon: "✦", unlockAt: 0 },
  { id: "prestige" as const, label: "Prestige", icon: "⬢", unlockAt: 100_000 },
  { id: "statistics" as const, label: "Statistics", icon: "◈", unlockAt: 0 },
];
