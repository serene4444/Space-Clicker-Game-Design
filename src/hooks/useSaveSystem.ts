import { useEffect } from "react";
import { BALANCE } from "@/game-data/balance";
import { useGameStore } from "@/store/gameStore";
import type { GameSaveEnvelope } from "@/types/game";

export interface OfflineSummary {
  energyGained: number;
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function getEnvelope(): GameSaveEnvelope {
  return useGameStore.getState().serialize();
}

export function useSaveSystem(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const envelope = getEnvelope();
      localStorage.setItem(BALANCE.saveKey, encodeBase64(JSON.stringify(envelope)));
      useGameStore.setState({ lastSaveTime: Date.now() });
    }, 5000);
    return () => window.clearInterval(id);
  }, [enabled]);

  const saveNow = () => {
    const envelope = getEnvelope();
    localStorage.setItem(BALANCE.saveKey, encodeBase64(JSON.stringify(envelope)));
    useGameStore.setState({ lastSaveTime: Date.now() });
  };

  const loadSave = (): OfflineSummary | null => {
    const raw = localStorage.getItem(BALANCE.saveKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeBase64(raw)) as GameSaveEnvelope;
      if (!parsed.state) return null;
      useGameStore.getState().loadSaveEnvelope(parsed);
      const elapsed = Date.now() - parsed.state.lastTickTime;
      return useGameStore.getState().applyOfflineProgress(elapsed);
    } catch {
      return null;
    }
  };

  const exportSave = () => {
    try {
      return encodeBase64(JSON.stringify(getEnvelope()));
    } catch {
      return "";
    }
  };

  const importSave = (value: string) => {
    try {
      const parsed = JSON.parse(decodeBase64(value)) as GameSaveEnvelope;
      if (!parsed.state) return false;
      useGameStore.getState().loadSaveEnvelope(parsed);
      localStorage.setItem(BALANCE.saveKey, value);
      return true;
    } catch {
      return false;
    }
  };

  const resetSave = () => {
    localStorage.removeItem(BALANCE.saveKey);
    useGameStore.getState().newGame();
  };

  return { saveNow, loadSave, exportSave, importSave, resetSave };
}

export function hasStoredSave() {
  return Boolean(localStorage.getItem(BALANCE.saveKey));
}
