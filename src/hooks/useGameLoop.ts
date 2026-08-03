import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export function useGameLoop(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const deltaSeconds = Math.max((now - last) / 1000, 0.05);
      last = now;
      useGameStore.getState().tick(deltaSeconds);
    }, 50);
    return () => window.clearInterval(id);
  }, [enabled]);
}
