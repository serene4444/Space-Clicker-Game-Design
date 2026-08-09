import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, type RefObject } from "react";

type FadeMode = "in" | "out";

export interface IntroMusicHandle {
  begin: () => void;
  fadeOut: (durationMs?: number) => void;
}

export interface IntroMusicProps {
  src?: string;
  muted: boolean;
  volume: number;
  fadeInMs?: number;
}

function clampVolume(value: number) {
  return Math.min(1, Math.max(0, value));
}

function useFadeController(audioRef: RefObject<HTMLAudioElement | null>) {
  const fadeTimerRef = useRef<number | null>(null);

  const clearFadeTimer = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const fade = useCallback((mode: FadeMode, targetVolume: number, durationMs: number, onComplete?: () => void) => {
    const audio = audioRef.current;
    if (!audio) return;

    clearFadeTimer();

    const startVolume = audio.volume;
    const safeTarget = clampVolume(targetVolume);
    const startTime = performance.now();

    fadeTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / Math.max(1, durationMs));
      const nextVolume = mode === "in"
        ? startVolume + (safeTarget - startVolume) * progress
        : startVolume * (1 - progress);

      audio.volume = clampVolume(nextVolume);

      if (progress >= 1) {
        clearFadeTimer();
        onComplete?.();
      }
    }, 32);
  }, [audioRef, clearFadeTimer]);

  return { clearFadeTimer, fade };
}

const IntroMusic = forwardRef<IntroMusicHandle, IntroMusicProps>(function IntroMusic({ src, muted, volume, fadeInMs = 1800 }, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [shouldStart, setShouldStart] = useState(false);
  const { clearFadeTimer, fade } = useFadeController(audioRef);

  useEffect(() => {
    let cancelled = false;

    if (!src) {
      setIsAvailable(false);
      return () => {
        cancelled = true;
        clearFadeTimer();
      };
    }

    fetch(src, { method: "HEAD" })
      .then((response) => {
        if (!cancelled) setIsAvailable(response.ok);
      })
      .catch(() => {
        if (!cancelled) setIsAvailable(false);
      });

    return () => {
      cancelled = true;
      clearFadeTimer();
    };
  }, [clearFadeTimer, src]);

  useEffect(() => {
    if (!shouldStart || !isAvailable || muted || volume <= 0) return;

    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.volume = 0;
    void audio.play().then(() => {
      fade("in", clampVolume(volume), fadeInMs);
    }).catch(() => {
      setShouldStart(false);
    });
  }, [fade, fadeInMs, isAvailable, muted, shouldStart, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isAvailable) return;

    if (muted || volume <= 0) {
      clearFadeTimer();
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
      return;
    }

    if (!shouldStart) return;
    audio.volume = clampVolume(volume);
  }, [clearFadeTimer, isAvailable, muted, shouldStart, volume]);

  useImperativeHandle(ref, () => ({
    begin: () => {
      setShouldStart(true);
    },
    fadeOut: (durationMs = 1200) => {
      const audio = audioRef.current;
      if (!audio) return;

      clearFadeTimer();
      if (audio.paused) return;

      fade("out", 0, durationMs, () => {
        audio.pause();
        audio.currentTime = 0;
      });
    },
  }), [clearFadeTimer, fade]);

  if (!src || !isAvailable) {
    return null;
  }

  return <audio ref={audioRef} src={src} preload="auto" loop aria-hidden="true" />;
});

export { IntroMusic };