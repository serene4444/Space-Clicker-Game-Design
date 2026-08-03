import type { NumberFormat } from "@/types/game";

const UNITS = ["", "K", "M", "B", "T", "Qa", "Qi"];

export function formatCompact(value: number) {
  if (!Number.isFinite(value)) return "0";
  const absolute = Math.abs(value);
  if (absolute < 1000) return Math.floor(value).toLocaleString();
  const index = Math.min(Math.floor(Math.log10(absolute) / 3), UNITS.length - 1);
  const scaled = value / Math.pow(1000, index);
  return `${scaled.toFixed(scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2)}${UNITS[index]}`;
}

export function formatScientific(value: number) {
  if (value === 0) return "0";
  return value.toExponential(2).replace("e+", "e");
}

export function formatNumber(value: number, format: NumberFormat) {
  return format === "scientific" ? formatScientific(value) : formatCompact(value);
}
export function fmt(n: number, format: "short" | "scientific" = "short"): string {
  if (!Number.isFinite(n)) return "0";
  if (format === "scientific") {
    if (n < 1_000) return Math.floor(n).toLocaleString();
    return n.toExponential(2);
  }
  if (n < 0) return "-" + fmt(-n, format);
  if (n < 1_000) return Math.floor(n).toLocaleString();
  if (n < 1_000_000) return (n / 1_000).toFixed(1) + "K";
  if (n < 1_000_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n < 1_000_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n < 1_000_000_000_000_000) return (n / 1_000_000_000_000).toFixed(2) + "T";
  if (n < 1_000_000_000_000_000_000) return (n / 1_000_000_000_000_000).toFixed(2) + "Qa";
  return (n / 1_000_000_000_000_000_000).toFixed(2) + "Qi";
}

export function formatPlaytime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatPercent(value: number, max: number): string {
  if (max <= 0) return "0%";
  return Math.min(100, Math.floor((value / max) * 100)) + "%";
}
