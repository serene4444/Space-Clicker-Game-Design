import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import { Button } from "@/app/components/ui/button";
import { IntroMusic, type IntroMusicHandle } from "@/app/components/IntroMusic";
import { BALANCE } from "@/game-data/balance";
import { ACHIEVEMENTS } from "@/game-data/achievements";
import { AUTOMATION_NODES } from "@/game-data/automation";
import { EVENTS, getEvent } from "@/game-data/events";
import { PLANET_TYPES, getPlanetType } from "@/game-data/planet-types";
import { PRESTIGE_UPGRADES, STAR_CLASSES, getStarClass } from "@/game-data/prestige";
import { RESEARCH_NODES } from "@/game-data/research";
import { SPECIALIZATIONS, getSpecialization } from "@/game-data/specializations";
import { STAGES, getStage } from "@/game-data/evolution-stages";
import { UPGRADES } from "@/game-data/upgrades";
import { hasStoredSave, useSaveSystem, type OfflineSummary } from "@/hooks/useSaveSystem";
import { useGameLoop } from "@/hooks/useGameLoop";
import { useGameStore } from "@/store/gameStore";
import { computeProduction } from "@/utilities/production";
import { formatCompact, formatNumber } from "@/utilities/format";
import { getAutomationCost, getEvolveCost, getPlanetCost, getPrestigeEssenceGain, getPrestigeUpgradeCost, getResearchCost, getSpecializationCost, getUpgradeCost } from "@/utilities/costs";
import { getPopulationGrowthBonuses, getPlanetPopulationGrowthRate, getPlanetPopulationCap, getTotalPopulation } from "@/utilities/population";
import { getPlanetPurchaseState } from "@/utilities/planetProgression";
import type { GameStateData, Planet, TabId } from "@/types/game";
import stationBg from "@/imports/download__78_.jpg";

const SPACE_FIELD_URL = "https://images.unsplash.com/photo-1614580378008-5c4d5f0cf4b5?w=3840&h=2160&q=95";

type Screen = "start" | "game";
type IntroPhase = "idle" | "launch";
type LayoutMode = "mobile" | "tablet" | "desktop";
const MAX_GAMEPLAY_ACCESSIBILITY_MODE = true;

const NAV_TABS: { id: TabId; label: string }[] = [
  { id: "system", label: "System" },
  { id: "planets", label: "Planets" },
  { id: "upgrades", label: "Upgrades" },
  { id: "research", label: "Research" },
  { id: "automation", label: "Automation" },
  { id: "achievements", label: "Achievements" },
  { id: "prestige", label: "Prestige" },
  { id: "stats", label: "Stats" },
];

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function readPreviewSave() {
  const raw = localStorage.getItem(BALANCE.saveKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeBase64(raw)) as { state?: GameStateData };
    return parsed.state ?? null;
  } catch {
    return null;
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function useLayoutMode() {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("desktop");

  useEffect(() => {
    const updateLayoutMode = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setLayoutMode("mobile");
      } else if (width < 1024) {
        setLayoutMode("tablet");
      } else {
        setLayoutMode("desktop");
      }
    };

    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    return () => window.removeEventListener("resize", updateLayoutMode);
  }, []);

  return layoutMode;
}

function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [introPhase, setIntroPhase] = useState<IntroPhase>("idle");
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const layoutMode = useLayoutMode();
  const gameSettings = useGameStore((state) => state.settings);
  const currentEventId = useGameStore((state) => state.currentEvent?.eventId);
  const saveSystem = useSaveSystem(screen === "game");
  useGameLoop(screen === "game");
  const preview = useMemo(() => readPreviewSave(), [screen]);
  const introMusicRef = useRef<IntroMusicHandle>(null);
  const launchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current !== null) {
        window.clearTimeout(launchTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setShowEventDetails(false);
  }, [currentEventId]);

  const beginSimulation = () => {
    if (introPhase === "launch") return;

    if (launchTimerRef.current !== null) {
      window.clearTimeout(launchTimerRef.current);
    }

    setOfflineSummary(null);
    setIntroPhase("launch");
    introMusicRef.current?.begin();
    window.setTimeout(() => introMusicRef.current?.fadeOut(1400), 700);
    launchTimerRef.current = window.setTimeout(() => {
      setScreen("game");
      setIntroPhase("idle");
      launchTimerRef.current = null;
    }, 2100);
  };

  const continueGame = () => {
    const summary = saveSystem.loadSave();
    if (!summary) return;
    if (launchTimerRef.current !== null) {
      window.clearTimeout(launchTimerRef.current);
      launchTimerRef.current = null;
    }
    introMusicRef.current?.fadeOut(500);
    setOfflineSummary(summary);
    setIntroPhase("idle");
    setScreen("game");
  };

  return (
    <>
      <Toaster position={layoutMode === "mobile" ? "top-center" : "top-right"} richColors />
      {screen !== "game" ? <IntroMusic ref={introMusicRef} muted={gameSettings.muted} volume={gameSettings.musicVolume} /> : null}
      {screen === "start" ? (
        <StartScreen
          continueAvailable={hasStoredSave()}
          preview={preview}
          transitioning={introPhase === "launch"}
          onBeginSimulation={beginSimulation}
          onContinue={continueGame}
        />
      ) : (
        <GameScreen
          layoutMode={layoutMode}
          saveSystem={saveSystem}
          offlineSummary={offlineSummary}
          onClearOfflineSummary={() => setOfflineSummary(null)}
          onBackToStart={() => setScreen("start")}
        />
      )}
    </>
  );
}

function StartScreen({
  onBeginSimulation,
  onContinue,
  continueAvailable,
  preview,
  transitioning,
}: {
  onBeginSimulation: () => void;
  onContinue: () => void;
  continueAvailable: boolean;
  preview: GameStateData | null;
  transitioning: boolean;
}) {
  const previewAge = preview ? Date.now() - preview.lastSaveTime : 0;
  const introStars = [
    { left: "16%", top: "18%", size: 2.4, delay: "0s" },
    { left: "26%", top: "22%", size: 3.2, delay: "1.4s" },
    { left: "71%", top: "18%", size: 2.8, delay: "0.8s" },
    { left: "79%", top: "28%", size: 2.2, delay: "2.1s" },
    { left: "60%", top: "60%", size: 3.4, delay: "1.9s" },
    { left: "20%", top: "66%", size: 2.1, delay: "2.7s" },
  ];

  return (
    <div style={{ ...styles.startRoot, ...(transitioning ? styles.startRootLaunching : {}) }}>
      <ImageWithFallback
        src={stationBg}
        alt="Futuristic space observation room with a large window looking out at a planet"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: transitioning ? "saturate(1.04) brightness(0.9) contrast(1.08)" : "saturate(0.96) brightness(0.66) contrast(1.04)",
          transform: transitioning ? "scale(1.18) translate3d(0, -2.2%, 0)" : "scale(1.05)",
          transformOrigin: "center center",
          objectPosition: "center center",
          transition: "transform 2200ms cubic-bezier(0.18, 0.9, 0.2, 1), filter 1400ms ease",
        }}
      />
      <div style={styles.startBackdrop} />
      <div style={styles.startAtmosphere} />
      <div style={{ ...styles.startGlow, ...(transitioning ? styles.startGlowLaunch : {}) }} />
      <div style={{ ...styles.startWindowGlow, ...(transitioning ? styles.startWindowGlowLaunch : {}) }} />
      <div style={{ ...styles.startCloudBand, ...(transitioning ? styles.startCloudBandLaunch : {}) }} />
      <div style={styles.startInterfaceSpark} />
      {introStars.map((star, index) => (
        <span key={`${star.left}-${star.top}-${index}`} style={{ ...styles.startStar, left: star.left, top: star.top, width: star.size, height: star.size, animationDelay: star.delay }} />
      ))}
      <div style={{ ...styles.startStatusLeft, ...(transitioning ? { opacity: 0.28, transform: "translateY(-8px)" } : {}) }}>OBSERVATION SYSTEM ONLINE</div>
      <div style={{ ...styles.startStatusRight, ...(transitioning ? { opacity: 0.2, transform: "translateY(-10px)" } : {}) }}>
        <div style={styles.statusTitle}>SYSTEM STATUS</div>
        <div style={styles.statusGrid}>
          <span>LAST SAVE</span><span>{preview ? formatDuration(previewAge) : "—"}</span>
          <span>SYSTEM NAME</span><span>Sol Prime</span>
          <span>PLAYTIME</span><span>{preview ? formatDuration(preview.stats.playTimeMs) : "00:00:00"}</span>
          <span>EVOLUTION</span><span>{preview ? `${Math.min(100, Math.round((preview.rebirthCount / 3) * 100))}%` : "0%"}</span>
        </div>
      </div>
      <div style={{ ...styles.startPanel, ...(transitioning ? { opacity: 0.3, transform: "translateY(16px) scale(0.98)" } : {}) }}>
        <div style={styles.kicker}>Observation deck</div>
        <h1 style={styles.title}>Stellar Genesis</h1>
        <p style={styles.subtitle}>Shape worlds. Create life. Build a system among the stars.</p>
        <div style={styles.startButtons}>
          <Button variant="outline" style={styles.primaryButton} disabled={transitioning} onClick={onBeginSimulation}>BEGIN SIMULATION</Button>
          <Button variant="outline" style={{ ...styles.secondaryButton, opacity: continueAvailable ? 1 : 0.45 }} disabled={!continueAvailable || transitioning} onClick={onContinue}>
            Continue Evolution
          </Button>
        </div>
        <div style={styles.previewGrid}>
          <PreviewStat label="Playtime" value={preview ? formatDuration(preview.stats.playTimeMs) : "00:00:00"} />
          <PreviewStat label="Rebirths" value={preview ? String(preview.rebirthCount) : "0"} />
          <PreviewStat label="Total Earned" value={preview ? formatCompact(preview.totalEarned) : "0"} />
          <PreviewStat label="Planets" value={preview ? String(preview.planets.length) : "1"} />
        </div>
      </div>
      <div style={{ ...styles.startFooterHint, ...(transitioning ? { opacity: 0.16, transform: "translateY(10px)" } : {}) }}>Window feed locked to external observation orbit.</div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.previewStat}>
      <div style={styles.previewLabel}>{label}</div>
      <div style={styles.previewValue}>{value}</div>
    </div>
  );
}

function GameScreen({
  layoutMode,
  saveSystem,
  offlineSummary,
  onClearOfflineSummary,
  onBackToStart,
}: {
  layoutMode: LayoutMode;
  saveSystem: ReturnType<typeof useSaveSystem>;
  offlineSummary: OfflineSummary | null;
  onClearOfflineSummary: () => void;
  onBackToStart: () => void;
}) {
  const state = useGameStore();
  const production = useMemo(() => computeProduction(state), [state]);
  const selectedPlanet = state.planets.find((planet) => planet.id === state.selectedTarget) ?? null;
  const totalPopulation = getTotalPopulation(state.planets);
  const activeTabLabel = NAV_TABS.find((tab) => tab.id === state.activeTab)?.label ?? "System";
  const [showSettings, setShowSettings] = useState(false);
  const [showPlanetPicker, setShowPlanetPicker] = useState(false);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [colonizeAmount, setColonizeAmount] = useState(2_000_000_000);
  const [saveText, setSaveText] = useState("");
  const isMobile = layoutMode === "mobile";

  useEffect(() => {
    if (offlineSummary) {
      toast.success(`Welcome back. Gained ${formatCompact(offlineSummary.energyGained)} energy while away.`);
    }
  }, [offlineSummary]);

  useEffect(() => {
    setShowEventDetails(false);
  }, [state.currentEvent?.eventId]);

  const buyUpgrade = (id: string) => {
    const result = useGameStore.getState().buyUpgrade(id);
    if (!result.ok) toast.error(result.reason);
  };

  const buyResearch = (id: string) => {
    const result = useGameStore.getState().buyResearch(id);
    if (!result.ok) toast.error(result.reason);
  };

  const buyAutomation = (id: string) => {
    const result = useGameStore.getState().buyAutomation(id);
    if (!result.ok) toast.error(result.reason);
  };

  const buyPlanet = (typeId: string) => {
    const result = useGameStore.getState().buyPlanet(typeId);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    setShowPlanetPicker(false);
  };

  const evolvePlanet = (planetId: string) => {
    const result = useGameStore.getState().evolvePlanet(planetId);
    if (!result.ok) toast.error(result.reason);
  };

  const specializePlanet = (planetId: string, specializationId: string) => {
    const result = useGameStore.getState().specializePlanet(planetId, specializationId);
    if (!result.ok) toast.error(result.reason);
  };
  const colonizePlanet = (planetId: string) => {
    const target = state.planets.find((planet) => planet.id !== planetId);
    if (!target) {
      toast.error("No target planet available");
      return;
    }
    const result = useGameStore.getState().colonizePlanet(planetId, target.id, colonizeAmount);
    if (!result.ok) toast.error(result.reason);
  };

  const performPrestige = () => {
    const result = useGameStore.getState().prestige();
    if (!result.ok) toast.error(result.reason);
    else setShowPrestigeConfirm(false);
  };

  const applyImport = () => {
    const ok = saveSystem.importSave(saveText.trim());
    toast[ok ? "success" : "error"](ok ? "Save imported" : "Import failed");
  };

  const exportSave = async () => {
    const encoded = saveSystem.exportSave();
    setSaveText(encoded);
    try {
      await navigator.clipboard.writeText(encoded);
    } catch {
      // Clipboard access is optional.
    }
    toast.success("Save copied to clipboard");
  };

  return (
    <div className={isMobile ? "sg-app reduced-motion" : "sg-app"} style={styles.gameRoot}>
      <Starfield />
      <TopBar layoutMode={layoutMode} state={state} production={production} onBackToStart={onBackToStart} onOpenSettings={() => setShowSettings(true)} />
      <div className="body-wrap">
        <Sidebar tab={state.activeTab} setTab={(value) => useGameStore.getState().setActiveTab(value as TabId)} canPrestige={state.totalEarned >= BALANCE.prestigeThreshold} />
        <div className="center-panel">
          <SolarSystem
            state={state}
            selectedPlanet={selectedPlanet}
            onClickStar={() => {
              useGameStore.getState().selectTarget("star");
              useGameStore.getState().clickStar();
            }}
            onSelectPlanet={(id) => useGameStore.getState().selectTarget(id)}
            onOpenPlanetPicker={() => setShowPlanetPicker(true)}
          />
          {state.currentEvent || showEventDetails ? (
            showEventDetails && state.currentEvent ? (
              <EventCard eventId={state.currentEvent.eventId} onChoose={(choiceId) => {
                const result = useGameStore.getState().resolveEventChoice(choiceId);
                if (!result.ok) toast.error(result.reason);
              }} />
            ) : (
              <CosmicActivityPanel state={state} onOpenDetails={() => setShowEventDetails(true)} onOpenPlanetPicker={() => setShowPlanetPicker(true)} />
            )
          ) : (
            <CosmicActivityPanel state={state} onOpenDetails={() => setShowEventDetails(true)} onOpenPlanetPicker={() => setShowPlanetPicker(true)} />
          )}
          <div style={styles.systemPopulationHud}>
            <div style={styles.systemPopulationTitle}>Total Solar System Population</div>
            <div style={styles.systemPopulationValue}>{formatNumber(totalPopulation, state.settings.numberFormat)}</div>
            <div style={styles.systemPopulationRate}>+{formatCompact(state.planets.reduce((sum, planet) => sum + getPlanetPopulationGrowthRate(planet) * getPlanetPopulationCap(planet.stage), 0))} / sec</div>
          </div>
          {offlineSummary ? (
            <Overlay layoutMode={layoutMode} title="Welcome back" onClose={onClearOfflineSummary}>
              <div style={styles.sectionCopy}>Offline progress has been applied.</div>
              <div style={styles.previewGrid}>
                <PreviewStat label="Energy gained" value={formatCompact(offlineSummary.energyGained)} />
              </div>
            </Overlay>
          ) : null}
        </div>
        <div className="right-panel hidden md:block">
          <div className="section-title">{activeTabLabel}</div>
          <PanelContents
            state={state}
            selectedPlanet={selectedPlanet}
            onBuyUpgrade={buyUpgrade}
            onBuyResearch={buyResearch}
            onBuyAutomation={buyAutomation}
            onBuyPlanet={buyPlanet}
            onEvolvePlanet={evolvePlanet}
            onSpecializePlanet={specializePlanet}
            onColonize={colonizePlanet}
            onOpenPlanetPicker={() => setShowPlanetPicker(true)}
            onOpenPrestigeConfirm={() => setShowPrestigeConfirm(true)}
          />
        </div>
      </div>

      <BottomNavigation layoutMode={layoutMode} activeTab={state.activeTab} onSelectTab={(tab) => useGameStore.getState().setActiveTab(tab)} />

      {isMobile && state.activeTab !== "system" ? <Overlay layoutMode={layoutMode} title={activeTabLabel} onClose={() => useGameStore.getState().setActiveTab("system")}>
        <PanelContents
          state={state}
          selectedPlanet={selectedPlanet}
          onBuyUpgrade={buyUpgrade}
          onBuyResearch={buyResearch}
          onBuyAutomation={buyAutomation}
          onBuyPlanet={buyPlanet}
          onEvolvePlanet={evolvePlanet}
          onSpecializePlanet={specializePlanet}
          onColonize={colonizePlanet}
          onOpenPlanetPicker={() => setShowPlanetPicker(true)}
          onOpenPrestigeConfirm={() => setShowPrestigeConfirm(true)}
        />
      </Overlay> : null}

      {showPlanetPicker ? (
        <Overlay layoutMode={layoutMode} title="Choose planet type" onClose={() => setShowPlanetPicker(false)}>
          <div style={styles.sectionCopy}>Each new world costs Stellar Energy and unlocks by milestone. Purchase planets from the solar system view to expand your empire.</div>
          <div style={styles.optionGrid}>
            {PLANET_TYPES.map((planetType) => {
              const purchaseState = getPlanetPurchaseState(state, planetType.id);
              return (
                <button key={planetType.id} onClick={() => buyPlanet(planetType.id)} disabled={!purchaseState.isAvailable} style={purchaseState.isAvailable ? styles.planetTypeCard : styles.planetTypeCardDisabled}>
                  <div style={styles.planetHeader}>
                    <div>
                      <div style={styles.cardTitle}>{planetType.name}</div>
                      <div style={styles.cardMeta}>{planetType.description}</div>
                    </div>
                    <div style={styles.cardMeta}>{formatCompact(purchaseState.cost)} energy</div>
                  </div>
                  <div style={styles.cardMeta}>{purchaseState.requirementLabel}</div>
                  <div style={styles.cardMeta}>{purchaseState.reason}</div>
                </button>
              );
            })}
          </div>
        </Overlay>
      ) : null}

      {showSettings ? (
        <Overlay layoutMode={layoutMode} title="Settings and save management" onClose={() => setShowSettings(false)}>
          <div style={styles.settingsGrid}>
            <label style={styles.settingRow}><span>Muted</span><input type="checkbox" checked={state.settings.muted} onChange={(event) => useGameStore.getState().updateSettings({ muted: event.target.checked })} /></label>
            <label style={styles.settingRow}><span>Reduced motion</span><input type="checkbox" checked={state.settings.reducedMotion} onChange={(event) => useGameStore.getState().updateSettings({ reducedMotion: event.target.checked })} /></label>
            <label style={styles.settingRow}><span>Short format</span><input type="checkbox" checked={state.settings.numberFormat === "short"} onChange={(event) => useGameStore.getState().updateSettings({ numberFormat: event.target.checked ? "short" : "scientific" })} /></label>
            <label style={styles.settingRow}><span>Sound volume</span><input type="range" min={0} max={1} step={0.01} value={state.settings.soundVolume} onChange={(event) => useGameStore.getState().updateSettings({ soundVolume: Number(event.target.value) })} /></label>
            <label style={styles.settingRow}><span>Music volume</span><input type="range" min={0} max={1} step={0.01} value={state.settings.musicVolume} onChange={(event) => useGameStore.getState().updateSettings({ musicVolume: Number(event.target.value) })} /></label>
          </div>
          <textarea value={saveText} onChange={(event) => setSaveText(event.target.value)} style={styles.textArea} rows={8} placeholder="Exported save string appears here" />
          <div style={styles.actionRow}>
            <button style={styles.primaryButton} onClick={exportSave}>Export Save</button>
            <button style={styles.secondaryButton} onClick={applyImport}>Import Save</button>
            <button style={styles.secondaryButton} onClick={saveSystem.saveNow}>Manual Save</button>
            <button style={styles.dangerButton} onClick={() => { if (window.confirm("Reset all progress?")) { saveSystem.resetSave(); onBackToStart(); } }}>Reset</button>
          </div>
        </Overlay>
      ) : null}

      {showPrestigeConfirm ? (
        <Overlay layoutMode={layoutMode} title="Confirm Stellar Rebirth" onClose={() => setShowPrestigeConfirm(false)}>
          <div style={styles.sectionCopy}>You will keep cosmic essence, achievements, settings, and unlocked star classes. Everything else resets to a new starter system.</div>
          <div style={styles.previewGrid}>
            <PreviewStat label="Essence gain" value={String(getPrestigeEssenceGain(state.totalEarned))} />
            <PreviewStat label="Reset" value="Energy, upgrades, planets, research" />
            <PreviewStat label="Retain" value="Essence, achievements, settings" />
          </div>
          <div style={styles.actionRow}>
            <button style={styles.primaryButton} onClick={performPrestige}>Rebirth</button>
            <button style={styles.secondaryButton} onClick={() => setShowPrestigeConfirm(false)}>Cancel</button>
          </div>
        </Overlay>
      ) : null}
    </div>
  );
}

function PlanetDetailCard({
  planet,
  state,
  onEvolve,
  onSpecialize,
  onColonize,
}: {
  planet: Planet;
  state: GameStateData;
  onEvolve: (planetId: string) => void;
  onSpecialize: (planetId: string, specializationId: string) => void;
  onColonize: (planetId: string) => void;
}) {
  const type = getPlanetType(planet.typeId);
  const stage = getStage(planet.stage);
  const evolveCost = getEvolveCost(planet.stage, planet.orbitIndex);
  const specialization = planet.specializationId ? getSpecialization(planet.specializationId) : null;
  const growth = getPlanetPopulationGrowthRate(planet);
  const bonuses = getPopulationGrowthBonuses(planet.stage);
  return (
    <div style={styles.planetDetailCard}>
      <div style={styles.planetHeader}>
        <div>
          <div style={styles.cardTitle}>{planet.name}</div>
          <div style={styles.cardMeta}>{type.name} | {stage.name}</div>
        </div>
        <button style={styles.smallButton} onClick={() => onEvolve(planet.id)}>Evolve</button>
      </div>
      <PlanetStagePreview planet={planet} numberFormat={state.settings.numberFormat} compact={false} />
      <PlanetProgressionNotice planet={planet} state={state} compact={false} onEvolve={onEvolve} />
      <div style={styles.cardMeta}>{stage.description}</div>
      <div style={styles.planetFactsGrid}>
        <div style={styles.planetFactCard}>
          <div style={styles.planetFactLabel}>Population</div>
          <div style={styles.planetFactValue}>{formatNumber(planet.population, state.settings.numberFormat)}</div>
        </div>
        <div style={styles.planetFactCard}>
          <div style={styles.planetFactLabel}>Growth</div>
          <div style={styles.planetFactValue}>+{formatCompact(growth * getPlanetPopulationCap(planet.stage))}/sec</div>
        </div>
        <div style={styles.planetFactCard}>
          <div style={styles.planetFactLabel}>Habitability</div>
          <div style={styles.planetFactValue}>{Math.round(bonuses.habitability * 100)}%</div>
        </div>
        <div style={styles.planetFactCard}>
          <div style={styles.planetFactLabel}>Evolve Cost</div>
          <div style={styles.planetFactValue}>{formatCompact(evolveCost)} energy</div>
        </div>
      </div>
      <div style={styles.planetSectionLabel}>Specialization</div>
      <div style={styles.specializationRow}>
        {SPECIALIZATIONS.map((specializationOption) => (
          <button
            key={specializationOption.id}
            style={planet.specializationId === specializationOption.id ? styles.specializationActive : styles.specializationButton}
            onClick={() => onSpecialize(planet.id, specializationOption.id)}
          >
            {specializationOption.name}
          </button>
        ))}
      </div>
      {planet.stage >= 8 ? <button style={styles.smallButton} onClick={() => onColonize(planet.id)}>Colonize Planet</button> : null}
      <div style={styles.planetFootnoteRow}>
        <div style={styles.cardMeta}>Specialization: {specialization?.name ?? "None"}</div>
        <div style={styles.cardMeta}>Bonus: {formatNumber(stage.passiveBonus, state.settings.numberFormat)}</div>
      </div>
    </div>
  );
}

function PlanetListCard({
  planet,
  state,
  onSelect,
  onEvolve,
  onSpecialize,
  onColonize,
}: {
  planet: Planet;
  state: GameStateData;
  onSelect: () => void;
  onEvolve: (planetId: string) => void;
  onSpecialize: (planetId: string, specializationId: string) => void;
  onColonize: (planetId: string) => void;
}) {
  const type = getPlanetType(planet.typeId);
  const stage = getStage(planet.stage);
  return (
    <div style={planet.id === state.selectedTarget ? styles.planetCardActive : styles.planetCard} onClick={onSelect}>
      <div style={styles.planetHeader}>
        <div>
          <div style={styles.cardTitle}>{planet.name}</div>
          <div style={styles.cardMeta}>{type.name} | {stage.name}</div>
        </div>
        <button style={styles.smallButton} onClick={(event) => { event.stopPropagation(); onEvolve(planet.id); }}>Evolve</button>
      </div>
      <PlanetStagePreview planet={planet} numberFormat={state.settings.numberFormat} compact />
      <div style={styles.cardMeta}>{stage.description}</div>
      <div style={styles.planetFactsGridCompact}>
        <div style={styles.planetFactCardCompact}>
          <div style={styles.planetFactLabel}>Population</div>
          <div style={styles.planetFactValue}>{formatNumber(planet.population, state.settings.numberFormat)}</div>
        </div>
        <div style={styles.planetFactCardCompact}>
          <div style={styles.planetFactLabel}>Growth</div>
          <div style={styles.planetFactValue}>+{formatCompact(getPlanetPopulationGrowthRate(planet) * getPlanetPopulationCap(planet.stage))}/sec</div>
        </div>
      </div>
      <div style={styles.specializationRow}>
        {SPECIALIZATIONS.map((specialization) => (
          <button key={specialization.id} style={planet.specializationId === specialization.id ? styles.specializationActive : styles.specializationButton} onClick={(event) => { event.stopPropagation(); onSpecialize(planet.id, specialization.id); }}>
            {specialization.name}
          </button>
        ))}
      </div>
      {planet.stage >= 8 ? <button style={styles.smallButton} onClick={(event) => { event.stopPropagation(); onColonize(planet.id); }}>Colonize Planet</button> : null}
    </div>
  );
}

function PlanetStagePreview({
  planet,
  numberFormat,
  compact = false,
}: {
  planet: Planet;
  numberFormat: GameStateData["settings"]["numberFormat"];
  compact?: boolean;
}) {
  const type = getPlanetType(planet.typeId);
  const stage = getStage(planet.stage);
  const growth = getPlanetPopulationGrowthRate(planet) * getPlanetPopulationCap(planet.stage);
  const cap = getPlanetPopulationCap(planet.stage);
  const bonuses = getPopulationGrowthBonuses(planet.stage);
  const planetVisual = getPlanetVisual(planet, type.color);
  const capabilityTags = [
    stage.visual.ocean ? "Hydrosphere" : null,
    stage.visual.life ? "Biosphere" : null,
    stage.visual.cities ? "Cities" : null,
  ].filter(Boolean) as string[];

  return (
    <div style={compact ? styles.planetStagePreviewCompact : styles.planetStagePreview}>
      <div style={styles.planetStagePreviewHeader}>
        <div key={`${planet.id}-${planet.stage}`} style={compact ? styles.planetPreviewOrbCompact : styles.planetPreviewOrb}>
          <div style={{ ...planetVisual.atmosphere, inset: compact ? -5 : -6 }} />
          <div style={planetVisual.body}>
            <div style={planetVisual.shadow} />
            <div style={planetVisual.highlights} />
            <div style={planetVisual.features} />
            <div style={planetVisual.lifeBand} />
            <div style={planetVisual.cityLights} />
            <div style={planetVisual.clouds} />
            <div style={planetVisual.specularArc} />
          </div>
          <div style={planetVisual.limbLight} />
        </div>
        <div style={styles.planetStagePreviewCopy}>
          <div style={styles.planetStageBadge}>Stage {planet.stage}</div>
          <div style={styles.planetStageTitle}>{stage.name}</div>
          <div style={styles.planetStageMeta}>{capabilityTags.length ? capabilityTags.join(" • ") : "Barren world"}</div>
        </div>
      </div>
      <div style={compact ? styles.planetPreviewStatGridCompact : styles.planetPreviewStatGrid}>
        <div style={styles.planetPreviewStatCard}>
          <div style={styles.planetPreviewStatLabel}>Cap</div>
          <div style={styles.planetPreviewStatValue}>{formatNumber(cap, numberFormat)}</div>
        </div>
        <div style={styles.planetPreviewStatCard}>
          <div style={styles.planetPreviewStatLabel}>Growth</div>
          <div style={styles.planetPreviewStatValue}>+{formatCompact(growth)}</div>
        </div>
        <div style={styles.planetPreviewStatCard}>
          <div style={styles.planetPreviewStatLabel}>Habitability</div>
          <div style={styles.planetPreviewStatValue}>{Math.round(bonuses.habitability * 100)}%</div>
        </div>
        <div style={styles.planetPreviewStatCard}>
          <div style={styles.planetPreviewStatLabel}>Bonus</div>
          <div style={styles.planetPreviewStatValue}>{formatNumber(stage.passiveBonus, numberFormat)}</div>
        </div>
      </div>
    </div>
  );
}

function PlanetProgressionNotice({
  planet,
  state,
  compact = false,
  onEvolve,
}: {
  planet: Planet;
  state: GameStateData;
  compact?: boolean;
  onEvolve: (planetId: string) => void;
}) {
  const nextStage = STAGES[Math.min(planet.stage + 1, STAGES.length - 1)];
  if (!nextStage || nextStage.id === planet.stage) {
    return <div style={styles.planetUnlockNoticeMax}>This world has reached its final evolutionary stage.</div>;
  }

  const evolveCost = getEvolveCost(planet.stage, planet.orbitIndex);
  const missingResearch = (nextStage.requiresResearch ?? [])
    .filter((researchId) => !state.research[researchId])
    .map((researchId) => RESEARCH_NODES.find((node) => node.id === researchId)?.name ?? researchId);
  const unlockedCapabilities = getStageCapabilityDelta(getStage(planet.stage).visual, nextStage.visual);
  const isBlocked = missingResearch.length > 0;
  const energyShortfall = Math.max(0, evolveCost - state.energy);
  const isReady = !isBlocked && energyShortfall === 0;
  const shortStatus = isReady ? "Ready to evolve" : isBlocked ? `Needs ${missingResearch.join(" • ")}` : `Need ${formatCompact(energyShortfall)} more energy`;

  return (
    <div style={compact ? styles.planetUnlockNoticeCompact : styles.planetUnlockNoticeSimple}>
      <div style={styles.planetUnlockInlineRow}>
        <div>
          <div style={styles.planetUnlockEyebrow}>Next Stage</div>
          <div style={styles.planetUnlockTitle}>Stage {nextStage.id}: {nextStage.name}</div>
        </div>
        <div
          style={{
            ...styles.planetUnlockStatus,
            ...(isReady ? styles.planetUnlockStatusReady : {}),
            ...(isBlocked ? styles.planetUnlockStatusBlocked : {}),
            ...(!isReady && !isBlocked ? styles.planetUnlockStatusWaiting : {}),
          }}
        >
          {shortStatus}
        </div>
      </div>
      <div style={styles.planetUnlockCopy}>{nextStage.description}</div>
      <div style={styles.planetUnlockMetaRow}>
        <span style={styles.planetUnlockMeta}>Cost {formatCompact(evolveCost)} energy</span>
        {unlockedCapabilities.length ? <span style={styles.planetUnlockMeta}>Unlocks {unlockedCapabilities.join(" • ")}</span> : null}
      </div>
      {isReady ? <button style={styles.planetUnlockPrimaryAction} onClick={() => onEvolve(planet.id)}>Evolve to {nextStage.name}</button> : null}
    </div>
  );
}

function getStageCapabilityDelta(current: { ocean: boolean; life: boolean; cities: boolean }, next: { ocean: boolean; life: boolean; cities: boolean }) {
  const deltas: string[] = [];
  if (!current.ocean && next.ocean) deltas.push("Oceans");
  if (!current.life && next.life) deltas.push("Life");
  if (!current.cities && next.cities) deltas.push("Cities");
  return deltas;
}

function EventCard({ eventId, onChoose }: { eventId: string; onChoose: (choiceId: string) => void }) {
  const event = getEvent(eventId);
  const [hoveredChoiceId, setHoveredChoiceId] = useState<string | null>(null);
  const [pressedChoiceId, setPressedChoiceId] = useState<string | null>(null);

  return (
    <div style={styles.eventCard}>
      <div style={styles.cardTitle}>{event.name}</div>
      <div style={styles.cardMeta}>{event.description}</div>
      <div style={styles.actionRow}>
        {event.choices.map((choice) => {
          const isPrimaryAction = choice.id === "add-planet" || `${choice.label}`.toLowerCase().includes("add planet");
          const isHovered = hoveredChoiceId === choice.id;
          const isPressed = pressedChoiceId === choice.id;
          const buttonStyle = isPrimaryAction
            ? {
                ...styles.eventChoiceButtonPrimary,
                ...(isHovered ? styles.eventChoiceButtonPrimaryHover : {}),
                ...(isPressed ? styles.eventChoiceButtonPrimaryPressed : {}),
              }
            : styles.eventChoiceButton;
          const titleStyle = isPrimaryAction ? styles.eventChoiceTitlePrimary : styles.eventChoiceTitle;
          const metaStyle = isPrimaryAction ? styles.eventChoiceMetaPrimary : styles.eventChoiceMeta;

          return (
            <button
              key={choice.id}
              style={buttonStyle}
              onMouseEnter={() => setHoveredChoiceId(choice.id)}
              onMouseLeave={() => {
                setHoveredChoiceId(null);
                setPressedChoiceId(null);
              }}
              onMouseDown={() => setPressedChoiceId(choice.id)}
              onMouseUp={() => setPressedChoiceId(null)}
              onClick={() => onChoose(choice.id)}
            >
              <div style={titleStyle}>{choice.label}</div>
              <div style={metaStyle}>{getEventChoiceSummary(choice)}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getEventChoiceSummary(choice: { energyDelta?: number; researchDelta?: number; mineralsDelta?: number; biomassDelta?: number; populationDelta?: number; influenceDelta?: number; persistentEffect?: { kind: string; amount: number }; modifier?: { kind: string; amount: number; durationMs: number } }) {
  const parts: string[] = [];
  if (choice.energyDelta) parts.push(`${choice.energyDelta > 0 ? "+" : ""}${formatCompact(choice.energyDelta)} energy`);
  if (choice.researchDelta) parts.push(`${choice.researchDelta > 0 ? "+" : ""}${formatCompact(choice.researchDelta)} research`);
  if (choice.mineralsDelta) parts.push(`${choice.mineralsDelta > 0 ? "+" : ""}${formatCompact(choice.mineralsDelta)} minerals`);
  if (choice.biomassDelta) parts.push(`${choice.biomassDelta > 0 ? "+" : ""}${formatCompact(choice.biomassDelta)} biomass`);
  if (choice.populationDelta) parts.push(`${choice.populationDelta > 0 ? "+" : ""}${formatCompact(choice.populationDelta)} population`);
  if (choice.influenceDelta) parts.push(`${choice.influenceDelta > 0 ? "+" : ""}${formatCompact(choice.influenceDelta)} influence`);
  if (choice.persistentEffect) parts.push(`Permanent ${choice.persistentEffect.kind} ${choice.persistentEffect.amount > 0 ? "+" : ""}${Math.round(choice.persistentEffect.amount * 100)}%`);
  if (choice.modifier) parts.push(`Temporary ${choice.modifier.kind} ${choice.modifier.amount > 0 ? "+" : ""}${Math.round(choice.modifier.amount * 100)}%`);
  return parts.length ? parts.join(" • ") : "No immediate effect";
}

function getAchievementIcon(achievementId: string) {
  const iconMap: Record<string, string> = {
    "first-energy": "✦",
    "first-planet": "◉",
    "mature-world": "✧",
    "first-life": "✿",
    "civilization": "◍",
    "max-planets": "✦",
    "first-rebirth": "◎",
    "one-million": "✹",
  };

  return iconMap[achievementId] ?? "✦";
}

function CosmicActivityPanel({ state, onOpenDetails, onOpenPlanetPicker }: { state: GameStateData; onOpenDetails: () => void; onOpenPlanetPicker: () => void }) {
  const activeEvent = state.currentEvent ? getEvent(state.currentEvent.eventId) : null;

  return (
    <div style={styles.cosmicStatusHUD}>
      <div onClick={onOpenDetails}>
        <div style={styles.cosmicStatusLabel}>{activeEvent ? "COSMIC EVENT" : "SYSTEM STATUS"}</div>
        <div style={styles.cosmicStatusRow}>
          <span style={activeEvent ? styles.cosmicStatusGlyphEvent : styles.cosmicStatusGlyphNeutral}>{activeEvent ? "✦" : "●"}</span>
          <span style={activeEvent ? styles.cosmicStatusTextEvent : styles.cosmicStatusTextNeutral}>{activeEvent ? activeEvent.name.toUpperCase() : "STABLE"}</span>
        </div>
      </div>
      <button style={styles.cosmicAddPlanetButton} onClick={onOpenPlanetPicker}>✦ Add Planet</button>
    </div>
  );
}

function PanelContents({
  state,
  selectedPlanet,
  onBuyUpgrade,
  onBuyResearch,
  onBuyAutomation,
  onBuyPlanet,
  onEvolvePlanet,
  onSpecializePlanet,
  onColonize,
  onOpenPlanetPicker,
  onOpenPrestigeConfirm,
}: {
  state: GameStateData;
  selectedPlanet: Planet | null;
  onBuyUpgrade: (id: string) => void;
  onBuyResearch: (id: string) => void;
  onBuyAutomation: (id: string) => void;
  onBuyPlanet: (typeId: string) => void;
  onEvolvePlanet: (planetId: string) => void;
  onSpecializePlanet: (planetId: string, specializationId: string) => void;
  onColonize: (planetId: string) => void;
  onOpenPlanetPicker: () => void;
  onOpenPrestigeConfirm: () => void;
}) {
  const activeTab = state.activeTab;
  const [upgradeCategory, setUpgradeCategory] = useState<"all" | "stellar" | "planetary" | "biological" | "civilization" | "infrastructure">("all");
  const upgradeCategories = [
    { id: "all", label: "All" },
    { id: "stellar", label: "Stellar" },
    { id: "planetary", label: "Planetary" },
    { id: "biological", label: "Life & Civilization" },
    { id: "civilization", label: "Research & Tech" },
    { id: "infrastructure", label: "Space Infra" },
  ] as const;
  const filteredUpgrades = upgradeCategory === "all" ? UPGRADES : UPGRADES.filter((upgrade) => upgrade.category.toLowerCase() === upgradeCategory);
  return (
    <PanelScroll>
      {activeTab === "system" ? (
        <>
          <div style={styles.sectionCopy}>
            {selectedPlanet ? `Selected planet: ${selectedPlanet.name}` : `Selected star: ${getStarClass(state.starClassId).name}`}
          </div>
          <div style={styles.subnavRow}>
            {upgradeCategories.map((category) => (
              <button
                key={category.id}
                style={upgradeCategory === category.id ? styles.subnavButtonActive : styles.subnavButton}
                onClick={() => setUpgradeCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
          {selectedPlanet ? (
            <PlanetDetailCard planet={selectedPlanet} state={state} onEvolve={onEvolvePlanet} onSpecialize={onSpecializePlanet} onColonize={onColonize} />
          ) : (
            <div style={styles.sectionCopy}>The star is the core of the system. Click it for energy and use upgrades to increase its output.</div>
          )}
          {filteredUpgrades.map((upgrade) => {
            const owned = state.upgrades[upgrade.id] ?? 0;
            const cost = getUpgradeCost(upgrade.id, owned);
            const unlocked = state.totalEarned >= (upgrade.unlockTotalEarned ?? 0);
            return unlocked ? <ActionCard key={upgrade.id} title={upgrade.name} desc={upgrade.description} meta={upgrade.category} enabled={state.energy >= cost} onClick={() => onBuyUpgrade(upgrade.id)} right={`${owned ? `Lv.${owned}` : "New"} · ${formatCompact(cost)} energy`} /> : null;
          })}
        </>
      ) : null}

      {activeTab === "planets" ? (
        <>
          <ActionCard title="Create planet" desc={`Unlock the next orbital slot and choose a world type. Cost ${formatCompact(getPlanetCost(state.planets.length))} energy.`} meta={`${state.planets.length}/${BALANCE.maxPlanets} planets`} enabled={state.energy >= getPlanetCost(state.planets.length) && state.planets.length < BALANCE.maxPlanets} onClick={onOpenPlanetPicker} />
          {state.planets.map((planet) => (
            <PlanetListCard
              key={planet.id}
              planet={planet}
              state={state}
              onSelect={() => useGameStore.getState().selectTarget(planet.id)}
              onEvolve={onEvolvePlanet}
              onSpecialize={onSpecializePlanet}
              onColonize={onColonize}
            />
          ))}
        </>
      ) : null}

      {activeTab === "upgrades" ? (
        <>
          <div style={styles.sectionCopy}>Upgrade categories improve click power, passive energy, planetary growth, and long-term expansion.</div>
          <div style={styles.subnavRow}>
            {upgradeCategories.map((category) => (
              <button
                key={category.id}
                style={upgradeCategory === category.id ? styles.subnavButtonActive : styles.subnavButton}
                onClick={() => setUpgradeCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>
          {filteredUpgrades.map((upgrade) => {
            const owned = state.upgrades[upgrade.id] ?? 0;
            const cost = getUpgradeCost(upgrade.id, owned);
            const unlocked = state.totalEarned >= (upgrade.unlockTotalEarned ?? 0);
            return unlocked ? <ActionCard key={upgrade.id} title={upgrade.name} desc={upgrade.description} meta={upgrade.category} enabled={state.energy >= cost} onClick={() => onBuyUpgrade(upgrade.id)} right={`${owned ? `Lv.${owned}` : "New"} · ${formatCompact(cost)} energy`} /> : null;
          })}
        </>
      ) : null}

      {activeTab === "research" ? (
        <>
          {RESEARCH_NODES.map((node) => {
            const cost = getResearchCost(node.id, state.research[node.id] ? 1 : 0);
            const available = node.prerequisites.every((prerequisite) => state.research[prerequisite]);
            return <ActionCard key={node.id} title={node.name} desc={node.description} meta={`${node.branch} | ${available ? "Available" : "Locked"}`} enabled={available && state.researchData >= cost && !state.research[node.id]} onClick={() => onBuyResearch(node.id)} right={`${formatCompact(cost)} research`} />;
          })}
        </>
      ) : null}

      {activeTab === "automation" ? (
        <>
          {AUTOMATION_NODES.map((node) => {
            const level = state.automation[node.id] ?? 0;
            const cost = getAutomationCost(node.id, level);
            return <ActionCard key={node.id} title={`${node.name}${level ? ` Lv.${level}` : ""}`} desc={node.description} meta={node.branch} enabled={state.researchData >= cost} onClick={() => onBuyAutomation(node.id)} right={`${formatCompact(cost)} research`} />;
          })}
        </>
      ) : null}

      {activeTab === "achievements" ? (
        <>
          <div style={styles.achievementHeader}>ACHIEVEMENTS</div>
          <div style={styles.achievementList}>
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = Boolean(state.achievements[achievement.id]);
              const icon = getAchievementIcon(achievement.id);
              return (
                <div
                  key={achievement.id}
                  style={unlocked ? styles.achievementUnlocked : styles.achievementCard}
                >
                  <div style={styles.achievementRow}>
                    <div style={unlocked ? styles.achievementIconUnlocked : styles.achievementIconLocked} aria-hidden="true">
                      {icon}
                    </div>
                    <div style={styles.achievementTextWrap}>
                      <div style={unlocked ? styles.achievementTitleUnlocked : styles.achievementTitle}>{achievement.name}</div>
                      <div style={unlocked ? styles.achievementDescriptionUnlocked : styles.achievementDescription}>{achievement.description}</div>
                    </div>
                    <div style={unlocked ? styles.achievementStatusSuccess : styles.achievementStatusMuted} aria-label={unlocked ? "completed" : "locked"}>
                      {unlocked ? "✓" : ""}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {activeTab === "prestige" ? (
        <>
          <div style={styles.sectionCopy}>Prestige converts total earned energy into cosmic essence and resets the active run.</div>
          <ActionCard title="Stellar Rebirth" desc={`Gain ${getPrestigeEssenceGain(state.totalEarned)} cosmic essence.`} meta={state.totalEarned >= BALANCE.prestigeThreshold ? "Available" : `Need ${formatCompact(BALANCE.prestigeThreshold)} total earned`} enabled={state.totalEarned >= BALANCE.prestigeThreshold} onClick={onOpenPrestigeConfirm} />
          {PRESTIGE_UPGRADES.map((upgrade) => {
            const level = state.prestigeUpgrades[upgrade.id] ?? 0;
            const cost = getPrestigeUpgradeCost(upgrade.id, level);
            return <ActionCard key={upgrade.id} title={`${upgrade.name}${level ? ` Lv.${level}` : ""}`} desc={upgrade.description} meta={upgrade.branch} enabled={state.cosmicEssence >= cost} onClick={() => useGameStore.getState().buyPrestigeUpgrade(upgrade.id)} right={`${cost} essence`} />;
          })}
          <div style={{ ...styles.sectionCopy, marginTop: 8 }}>Star class: {getStarClass(state.starClassId).name}</div>
          {STAR_CLASSES.map((starClass) => (
            <ActionCard key={starClass.id} title={starClass.name} desc={starClass.description} meta={starClass.branch} enabled={state.rebirthCount >= starClass.unlockRebirths} onClick={() => useGameStore.getState().setStarClass(starClass.id)} right={state.starClassId === starClass.id ? "Selected" : undefined} />
          ))}
        </>
      ) : null}

      {activeTab === "stats" ? (
        <>
          <StatRow label="Energy" value={formatNumber(state.energy, state.settings.numberFormat)} />
          <StatRow label="Total Earned" value={formatNumber(state.totalEarned, state.settings.numberFormat)} />
          <StatRow label="Biomass" value={formatNumber(state.biomass, state.settings.numberFormat)} />
          <StatRow label="Research" value={formatNumber(state.researchData, state.settings.numberFormat)} />
          <StatRow label="Population" value={formatNumber(state.population, state.settings.numberFormat)} />
            <StatRow label="Population Growth" value={`+${formatCompact(state.planets.reduce((sum, planet) => sum + getPlanetPopulationGrowthRate(planet) * getPlanetPopulationCap(planet.stage), 0))}/sec`} />
          <StatRow label="Cosmic Essence" value={formatNumber(state.cosmicEssence, state.settings.numberFormat)} />
          <StatRow label="Playtime" value={formatDuration(state.stats.playTimeMs)} />
          <StatRow label="Rebirths" value={String(state.rebirthCount)} />
        </>
      ) : null}
    </PanelScroll>
  );
}

function Overlay({ layoutMode, title, children, onClose }: { layoutMode: LayoutMode; title: string; children: ReactNode; onClose: () => void }) {
  const sheetMode = layoutMode === "mobile";
  return (
    <div className={sheetMode ? "fixed inset-x-0 bottom-0 z-50 grid place-items-end bg-black/55 p-2 sm:p-4" : "fixed inset-0 z-50 grid place-items-center bg-black/55 p-3 sm:p-4"}>
      <div className={sheetMode ? "w-full max-h-[82dvh] overflow-auto rounded-t-3xl border border-white/10 bg-[#08101f]/98 p-4 shadow-[0_-24px_90px_rgba(0,0,0,0.5)]" : "w-full max-w-5xl max-h-[90dvh] overflow-auto rounded-3xl border border-white/10 bg-[#08101f]/98 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:p-5"}>
        <div className="mb-3 flex items-center justify-between gap-3" style={styles.overlayHeader}>
          <div style={styles.cardTitle}>{title}</div>
          <button style={styles.smallButton} onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SpaceBackground() {
  const brightStars = [
    { left: "18%", top: "12%", size: 5.2, delay: "0s", sharp: true },
    { left: "34%", top: "18%", size: 3.3, delay: "1.8s", sharp: false },
    { left: "61%", top: "14%", size: 4.8, delay: "0.9s", sharp: true },
    { left: "78%", top: "24%", size: 5.8, delay: "2.4s", sharp: true },
    { left: "14%", top: "52%", size: 4.4, delay: "1.2s", sharp: true },
    { left: "42%", top: "68%", size: 5.0, delay: "2.1s", sharp: true },
    { left: "69%", top: "58%", size: 4.2, delay: "0.4s", sharp: true },
    { left: "86%", top: "74%", size: 3.4, delay: "1.6s", sharp: false },
  ];

  const anchorStars = [
    { left: "27%", top: "31%", size: 7.2, delay: "0.6s", glow: "rgba(255,247,214,0.55)" },
    { left: "73%", top: "47%", size: 8.1, delay: "1.4s", glow: "rgba(168,140,255,0.45)" },
  ];

  const faintStars = [
    { left: "3%", top: "6%", size: 0.9, opacity: 0.18 },
    { left: "4.2%", top: "5.2%", size: 1.0, opacity: 0.2 },
    { left: "5.6%", top: "7.1%", size: 0.8, opacity: 0.16 },
    { left: "7%", top: "14%", size: 0.9, opacity: 0.2 },
    { left: "8.2%", top: "13.1%", size: 1.0, opacity: 0.22 },
    { left: "9.4%", top: "15.2%", size: 0.8, opacity: 0.17 },
    { left: "12%", top: "7%", size: 0.9, opacity: 0.2 },
    { left: "13.3%", top: "8.1%", size: 1.0, opacity: 0.21 },
    { left: "14.8%", top: "6.4%", size: 0.8, opacity: 0.16 },
    { left: "15%", top: "20%", size: 1.0, opacity: 0.21 },
    { left: "16.4%", top: "18.7%", size: 0.9, opacity: 0.19 },
    { left: "17.7%", top: "21.3%", size: 0.8, opacity: 0.16 },
    { left: "6%", top: "10%", size: 1.0, opacity: 0.22 },
    { left: "7.1%", top: "9.1%", size: 0.9, opacity: 0.19 },
    { left: "8.4%", top: "11.2%", size: 1.1, opacity: 0.23 },
    { left: "11%", top: "18%", size: 1.1, opacity: 0.24 },
    { left: "12.1%", top: "17.1%", size: 0.9, opacity: 0.2 },
    { left: "13.5%", top: "19.2%", size: 0.8, opacity: 0.17 },
    { left: "16%", top: "28%", size: 1.1, opacity: 0.24 },
    { left: "22%", top: "9%", size: 1.0, opacity: 0.26 },
    { left: "29%", top: "14%", size: 1.3, opacity: 0.3 },
    { left: "37%", top: "11%", size: 1.2, opacity: 0.25 },
    { left: "45%", top: "24%", size: 1.0, opacity: 0.22 },
    { left: "53%", top: "9%", size: 1.1, opacity: 0.27 },
    { left: "60%", top: "28%", size: 1.4, opacity: 0.33 },
    { left: "66%", top: "13%", size: 1.0, opacity: 0.23 },
    { left: "71%", top: "22%", size: 1.2, opacity: 0.29 },
    { left: "79%", top: "11%", size: 1.1, opacity: 0.25 },
    { left: "87%", top: "18%", size: 1.3, opacity: 0.31 },
    { left: "94%", top: "27%", size: 1.0, opacity: 0.22 },
    { left: "8%", top: "44%", size: 1.1, opacity: 0.24 },
    { left: "16%", top: "61%", size: 1.3, opacity: 0.3 },
    { left: "24%", top: "47%", size: 1.0, opacity: 0.22 },
    { left: "33%", top: "58%", size: 1.2, opacity: 0.28 },
    { left: "41%", top: "49%", size: 1.1, opacity: 0.26 },
    { left: "48%", top: "61%", size: 1.4, opacity: 0.31 },
    { left: "57%", top: "47%", size: 1.0, opacity: 0.23 },
    { left: "63%", top: "59%", size: 1.2, opacity: 0.29 },
    { left: "72%", top: "45%", size: 1.1, opacity: 0.25 },
    { left: "81%", top: "61%", size: 1.3, opacity: 0.3 },
    { left: "90%", top: "49%", size: 1.0, opacity: 0.22 },
    { left: "24%", top: "44%", size: 0.9, opacity: 0.18 },
    { left: "25.4%", top: "42.8%", size: 1.0, opacity: 0.2 },
    { left: "26.7%", top: "45.2%", size: 0.8, opacity: 0.16 },
    { left: "28.1%", top: "43.6%", size: 0.9, opacity: 0.17 },
    { left: "31%", top: "46%", size: 1.0, opacity: 0.19 },
    { left: "32.4%", top: "44.7%", size: 0.8, opacity: 0.15 },
    { left: "34.1%", top: "46.4%", size: 0.9, opacity: 0.17 },
    { left: "56%", top: "43%", size: 0.9, opacity: 0.18 },
    { left: "57.3%", top: "41.8%", size: 1.0, opacity: 0.2 },
    { left: "58.7%", top: "44.1%", size: 0.8, opacity: 0.16 },
    { left: "60.2%", top: "42.5%", size: 0.9, opacity: 0.17 },
    { left: "62.1%", top: "45.3%", size: 1.0, opacity: 0.19 },
    { left: "64%", top: "43.8%", size: 0.8, opacity: 0.15 },
    { left: "65.5%", top: "46.1%", size: 0.9, opacity: 0.17 },
    { left: "10%", top: "82%", size: 1.1, opacity: 0.24 },
    { left: "18%", top: "88%", size: 1.2, opacity: 0.27 },
    { left: "26%", top: "80%", size: 1.0, opacity: 0.22 },
    { left: "35%", top: "86%", size: 1.3, opacity: 0.3 },
    { left: "43%", top: "79%", size: 1.1, opacity: 0.25 },
    { left: "51%", top: "87%", size: 1.4, opacity: 0.31 },
    { left: "59%", top: "80%", size: 1.0, opacity: 0.22 },
    { left: "67%", top: "88%", size: 1.2, opacity: 0.28 },
    { left: "76%", top: "81%", size: 1.1, opacity: 0.24 },
    { left: "84%", top: "87%", size: 1.3, opacity: 0.3 },
    { left: "93%", top: "79%", size: 1.0, opacity: 0.22 },
    { left: "88%", top: "90%", size: 1.0, opacity: 0.2 },
    { left: "89.2%", top: "88.8%", size: 1.1, opacity: 0.22 },
    { left: "90.7%", top: "91.3%", size: 0.9, opacity: 0.16 },
    { left: "94%", top: "92%", size: 1.0, opacity: 0.18 },
    { left: "95.4%", top: "90.7%", size: 0.9, opacity: 0.16 },
    { left: "96.1%", top: "93.3%", size: 0.8, opacity: 0.14 },
    { left: "80%", top: "94%", size: 1.0, opacity: 0.2 },
    { left: "81.4%", top: "92.7%", size: 0.9, opacity: 0.17 },
    { left: "82.8%", top: "95.1%", size: 0.8, opacity: 0.14 },
    { left: "72%", top: "91%", size: 0.9, opacity: 0.18 },
    { left: "73.6%", top: "89.8%", size: 0.8, opacity: 0.15 },
    { left: "74.9%", top: "92.4%", size: 0.9, opacity: 0.16 },
  ];

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{
        backgroundColor: "#0d1b36",
        backgroundImage:
          "radial-gradient(circle at 14% 16%, rgba(255,255,255,0.36) 0 1px, transparent 1.4px), radial-gradient(circle at 20% 22%, rgba(255,255,255,0.22) 0 1px, transparent 1.4px), radial-gradient(circle at 24% 18%, rgba(255,255,255,0.28) 0 1px, transparent 1.4px), radial-gradient(circle at 32% 26%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 38% 20%, rgba(255,255,255,0.2) 0 1px, transparent 1.4px), radial-gradient(circle at 46% 16%, rgba(255,255,255,0.24) 0 1px, transparent 1.4px), radial-gradient(circle at 52% 22%, rgba(255,255,255,0.16) 0 1px, transparent 1.4px), radial-gradient(circle at 58% 18%, rgba(255,255,255,0.22) 0 1px, transparent 1.4px), radial-gradient(circle at 66% 24%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 74% 20%, rgba(255,255,255,0.26) 0 1px, transparent 1.4px), radial-gradient(circle at 82% 16%, rgba(255,255,255,0.2) 0 1px, transparent 1.4px), radial-gradient(circle at 88% 22%, rgba(255,255,255,0.22) 0 1px, transparent 1.4px), radial-gradient(circle at 10% 48%, rgba(255,255,255,0.2) 0 1px, transparent 1.4px), radial-gradient(circle at 18% 56%, rgba(255,255,255,0.16) 0 1px, transparent 1.4px), radial-gradient(circle at 24% 50%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 34% 62%, rgba(255,255,255,0.14) 0 1px, transparent 1.4px), radial-gradient(circle at 42% 56%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 48% 50%, rgba(255,255,255,0.24) 0 1px, transparent 1.4px), radial-gradient(circle at 56% 60%, rgba(255,255,255,0.14) 0 1px, transparent 1.4px), radial-gradient(circle at 64% 54%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 72% 48%, rgba(255,255,255,0.16) 0 1px, transparent 1.4px), radial-gradient(circle at 80% 58%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 90% 50%, rgba(255,255,255,0.14) 0 1px, transparent 1.4px), radial-gradient(circle at 12% 78%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 20% 84%, rgba(255,255,255,0.14) 0 1px, transparent 1.4px), radial-gradient(circle at 28% 76%, rgba(255,255,255,0.2) 0 1px, transparent 1.4px), radial-gradient(circle at 36% 82%, rgba(255,255,255,0.16) 0 1px, transparent 1.4px), radial-gradient(circle at 44% 76%, rgba(255,255,255,0.14) 0 1px, transparent 1.4px), radial-gradient(circle at 52% 82%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 60% 76%, rgba(255,255,255,0.14) 0 1px, transparent 1.4px), radial-gradient(circle at 68% 84%, rgba(255,255,255,0.16) 0 1px, transparent 1.4px), radial-gradient(circle at 76% 78%, rgba(255,255,255,0.2) 0 1px, transparent 1.4px), radial-gradient(circle at 84% 82%, rgba(255,255,255,0.14) 0 1px, transparent 1.4px), radial-gradient(circle at 92% 76%, rgba(255,255,255,0.18) 0 1px, transparent 1.4px), radial-gradient(circle at 12% 35%, rgba(115,106,174,0.16) 0 1px, transparent 1.4px), radial-gradient(circle at 22% 42%, rgba(242,138,91,0.12) 0 1px, transparent 1.4px), radial-gradient(circle at 36% 38%, rgba(115,106,174,0.12) 0 1px, transparent 1.4px), radial-gradient(circle at 52% 36%, rgba(242,138,91,0.1) 0 1px, transparent 1.4px), radial-gradient(circle at 68% 40%, rgba(115,106,174,0.14) 0 1px, transparent 1.4px), radial-gradient(circle at 82% 36%, rgba(242,138,91,0.1) 0 1px, transparent 1.4px), radial-gradient(ellipse at 52% 48%, rgba(117,98,212,0.22) 0%, rgba(93,106,214,0.16) 18%, rgba(53,68,155,0.1) 34%, transparent 66%), radial-gradient(ellipse at 56% 56%, rgba(118,88,196,0.16) 0%, rgba(94,110,224,0.1) 22%, transparent 60%), radial-gradient(ellipse at 52% 52%, rgba(255,255,255,0.08) 0%, rgba(164,130,255,0.14) 18%, rgba(108,86,214,0.16) 32%, transparent 60%), linear-gradient(165deg, rgba(5,8,16,0.94) 0%, rgba(11,16,34,0.72) 32%, rgba(7,19,38,0.32) 54%, rgba(5,8,16,0.94) 100%)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, transparent 0%, rgba(90,72,180,0.08) 32%, rgba(124,102,214,0.14) 46%, rgba(80,98,198,0.09) 56%, transparent 76%), radial-gradient(ellipse at 58% 48%, rgba(132,116,232,0.14) 0%, rgba(78,92,204,0.08) 24%, transparent 52%), radial-gradient(ellipse at 34% 66%, rgba(90,115,220,0.08) 0%, rgba(90,115,220,0.04) 20%, transparent 48%), radial-gradient(ellipse at 66% 22%, rgba(255,255,255,0.12) 0%, transparent 24%), radial-gradient(ellipse at 44% 78%, rgba(255,255,255,0.1) 0%, transparent 22%)",
          filter: "blur(6px)",
          opacity: 0.7,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 22% 26%, rgba(119,104,214,0.16) 0%, rgba(119,104,214,0.09) 16%, transparent 38%), radial-gradient(ellipse at 70% 34%, rgba(92,111,218,0.14) 0%, rgba(92,111,218,0.08) 18%, transparent 40%), radial-gradient(ellipse at 54% 62%, rgba(132,116,232,0.1) 0%, rgba(132,116,232,0.06) 16%, transparent 34%)",
          opacity: 0.56,
          filter: "blur(9px)",
          animation: "sg-cloud-drift 120s linear infinite",
        }}
      />
      {brightStars.map((star, index) => (
        <div
          key={`bright-star-${index}`}
          className="absolute rounded-full"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: star.sharp
              ? "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,247,214,0.98) 28%, rgba(255,241,199,0.7) 44%, transparent 100%)"
              : "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,241,199,0.9) 42%, rgba(168,140,255,0.35) 72%, transparent 100%)",
            boxShadow: star.sharp
              ? "0 0 12px rgba(255,255,255,0.8), 0 0 22px rgba(255,241,199,0.38)"
              : "0 0 10px rgba(255,255,255,0.65), 0 0 18px rgba(168,140,255,0.25)",
            animation: `sg-bright-twinkle ${star.sharp ? "4.2s" : "5.5s"} ease-in-out infinite`,
            animationDelay: star.delay,
            filter: star.sharp ? "saturate(1.02)" : "saturate(0.92)",
          }}
        />
      ))}
      {anchorStars.map((star, index) => (
        <div
          key={`anchor-star-${index}`}
          className="absolute"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            transform: "translate(-50%, -50%)",
            borderRadius: "9999px",
            background:
              "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,251,235,0.98) 20%, rgba(255,241,199,0.72) 36%, transparent 100%)",
            boxShadow: `0 0 16px ${star.glow}, 0 0 32px ${star.glow.replace("0.55", "0.26").replace("0.45", "0.22")}`,
            animation: `sg-bright-twinkle 3.8s ease-in-out infinite`,
            animationDelay: star.delay,
            filter: "saturate(1.05)",
          }}
        >
          <span
            style={{
              position: "absolute",
              inset: "50% auto auto 50%",
              width: "18px",
              height: "18px",
              transform: "translate(-50%, -50%) rotate(45deg)",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                width: "1px",
                height: "18px",
                background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.95), transparent)",
                transform: "translateX(-50%)",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                width: "18px",
                height: "1px",
                background: "linear-gradient(to right, transparent, rgba(255,255,255,0.95), transparent)",
                transform: "translateY(-50%)",
              }}
            />
          </span>
        </div>
      ))}
      {faintStars.map((star, index) => (
        <div
          key={`faint-star-${index}`}
          className="absolute rounded-full"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: "rgba(255,255,255,0.9)",
            boxShadow: "0 0 4px rgba(255,255,255,0.18)",
            opacity: star.opacity,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 34%, rgba(7,19,38,0.56) 66%, rgba(5,8,16,0.92) 100%)",
        }}
      />
    </div>
  );
}

function SolarSystem({
  state,
  selectedPlanet,
  onClickStar,
  onSelectPlanet,
  onOpenPlanetPicker,
}: {
  state: GameStateData;
  selectedPlanet: Planet | null;
  onClickStar: () => void;
  onSelectPlanet: (id: string) => void;
  onOpenPlanetPicker: () => void;
}) {
  const starClass = getStarClass(state.starClassId);
  const [starPulse, setStarPulse] = useState(false);
  const [burstSeed, setBurstSeed] = useState(0);
  const [floatingPoints, setFloatingPoints] = useState<Array<{ id: string; left: number; top: number; value: string }>>([]);
  const [arrivalPulse, setArrivalPulse] = useState<string | null>(null);
  const [evolutionPulse, setEvolutionPulse] = useState<string | null>(null);
  const [evolutionBursts, setEvolutionBursts] = useState<Array<{ id: string; planetId: string; label: string }>>([]);
  const previousStagesRef = useRef<Record<string, number>>({});

  const handleStarClick = () => {
    onClickStar();
    const points = formatCompact(computeProduction(state).clickPower);
    const pointId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    setStarPulse(true);
    setBurstSeed((value) => value + 1);
    setFloatingPoints((current) => [...current, { id: pointId, left: 50 + Math.random() * 10 - 5, top: 50 + Math.random() * 8 - 4, value: `+${points}` }]);

    window.setTimeout(() => setStarPulse(false), 240);
    window.setTimeout(() => setFloatingPoints((current) => current.filter((point) => point.id !== pointId)), 900);
  };

  useEffect(() => {
    const newPlanetIds = state.planets.filter((planet) => planet.isNew).map((planet) => planet.id);
    if (!newPlanetIds.length) return;
    const latest = newPlanetIds[newPlanetIds.length - 1];
    setArrivalPulse(latest);
    const timer = window.setTimeout(() => setArrivalPulse(null), 1400);
    return () => window.clearTimeout(timer);
  }, [state.planets]);

  useEffect(() => {
    const previousStages = previousStagesRef.current;
    const nextStages = Object.fromEntries(state.planets.map((planet) => [planet.id, planet.stage]));
    const stageChanges = state.planets
      .filter((planet) => typeof previousStages[planet.id] === "number" && planet.stage > previousStages[planet.id])
      .map((planet) => ({
        id: `${planet.id}-${planet.stage}-${Date.now()}`,
        planetId: planet.id,
        label: `Stage ${planet.stage} - ${getStage(planet.stage).name}`,
      }));

    previousStagesRef.current = nextStages;
    if (!stageChanges.length) return;

    const latest = stageChanges[stageChanges.length - 1];
    setEvolutionPulse(latest.planetId);
    setEvolutionBursts((current) => [...current, ...stageChanges]);

    const pulseTimer = window.setTimeout(() => {
      setEvolutionPulse((current) => (current === latest.planetId ? null : current));
    }, 1500);
    const burstTimers = stageChanges.map((burst) => window.setTimeout(() => {
      setEvolutionBursts((current) => current.filter((item) => item.id !== burst.id));
    }, 1900));

    return () => {
      window.clearTimeout(pulseTimer);
      burstTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [state.planets]);

  return (
    <div className="relative min-h-0 overflow-hidden" style={styles.systemStage}>
      <SpaceBackground />
      <div style={styles.systemBackdrop} />
      <div style={styles.systemVignette} />
      <div style={styles.starAmbientGlow} />
      <div style={styles.systemOverlayGlow} />
      <div style={styles.starAnchor}>
        <button style={{ ...styles.starButton, ...(starPulse ? styles.starButtonPulse : {}) }} onClick={handleStarClick} aria-label="Click the star to generate energy">
          <div key={burstSeed} style={styles.starBloom} />
          <div style={styles.starCore} />
          <div style={styles.starLabel}>{starClass.name}</div>
        </button>
      </div>
      <div style={styles.starParticlesLayer} aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <span key={`${burstSeed}-${index}`} style={{ ...styles.starParticle, ...getParticleStyle(index, burstSeed) }} />
        ))}
      </div>
      {floatingPoints.map((point) => (
        <div key={point.id} style={{ ...styles.floatingPoints, left: `${point.left}%`, top: `${point.top}%` }}>{point.value}</div>
      ))}
      {state.planets.map((planet, index) => {
        const type = getPlanetType(planet.typeId);
        const orbitRadius = Math.min(280, 162 + planet.orbitIndex * 34 + index * 22);
        const arriving = arrivalPulse === planet.id;
        const evolving = evolutionPulse === planet.id;
        const orbitDuration = 20 + planet.orbitIndex * 5 + index * 2;
        const initialDelay = -(planet.angle / 360) * orbitDuration;
        const orbitPlaneScaleY = Math.max(0.82, 0.9 - planet.orbitIndex * 0.015);
        const planetVisual = getPlanetVisual(planet, type.color);
        const planetSizePx = Number.parseFloat(planetVisual.size) || 56;
        const evolutionBurst = evolutionBursts.find((burst) => burst.planetId === planet.id);
        return (
          <div
            key={planet.id}
            className="orbit-track"
            style={{
              width: orbitRadius * 2,
              height: orbitRadius * 2,
              marginLeft: -orbitRadius,
              marginTop: -orbitRadius,
              animationDuration: `${orbitDuration}s`,
              animationDelay: `${initialDelay}s`,
              animationDirection: index % 2 === 0 ? "normal" : "reverse",
              zIndex: selectedPlanet?.id === planet.id ? 6 : 4,
            }}
          >
            <div style={{ ...styles.orbitPlane, transform: `scaleY(${orbitPlaneScaleY})` }}>
              <div
                className="orbit-ring"
                style={{
                  ...styles.orbitRing,
                  ...(evolving ? styles.orbitRingActive : {}),
                  width: orbitRadius * 2,
                  height: orbitRadius * 2,
                  opacity: evolving ? 0.88 : selectedPlanet?.id === planet.id ? 0.7 : 0.5,
                }}
              />
              <div style={{ position: "absolute", left: orbitRadius, top: 0, width: 0, height: 0, zIndex: 3 }}>
                <div style={planetVisual.orbitShadow} />
                {evolutionBurst ? (
                  <div
                    style={{
                      ...styles.planetEvolutionLabelAnchor,
                      left: 0,
                      top: `${-Math.round(planetSizePx / 2 + 18)}px`,
                      transform: "translateX(-50%)",
                    }}
                  >
                    <div style={styles.planetEvolutionLabel}>{evolutionBurst.label}</div>
                  </div>
                ) : null}
                <button
                  style={{
                    ...styles.planetDot,
                    width: planetVisual.size,
                    height: planetVisual.size,
                    boxShadow: selectedPlanet?.id === planet.id ? planetVisual.selectedGlow : planetVisual.glow,
                    transform: arriving
                      ? `translate(-50%, -50%) scaleY(${1 / orbitPlaneScaleY}) scale(1.08)`
                      : evolving
                        ? `translate(-50%, -50%) scaleY(${1 / orbitPlaneScaleY}) scale(1.12)`
                        : `translate(-50%, -50%) scaleY(${1 / orbitPlaneScaleY})`,
                    animation: arriving ? "planet-arrival 1.2s ease-out" : evolving ? "planet-evolve 1.5s ease-out" : undefined,
                    zIndex: selectedPlanet?.id === planet.id ? 7 : 5,
                  }}
                  onClick={() => onSelectPlanet(planet.id)}
                >
                  {evolving ? <div style={styles.planetEvolutionWave} /> : null}
                  <div style={planetVisual.atmosphere} />
                  <div style={planetVisual.body}>
                    <div style={planetVisual.shadow} />
                    <div style={planetVisual.highlights} />
                    <div style={planetVisual.features} />
                    <div style={planetVisual.lifeBand} />
                    <div style={planetVisual.cityLights} />
                    <div style={planetVisual.clouds} />
                    <div style={planetVisual.specularArc} />
                  </div>
                  <div style={planetVisual.limbLight} />
                </button>
                <div
                  style={{
                    ...styles.planetNameAnchor,
                    left: 0,
                    top: `${Math.round(planetSizePx / 2 + 10)}px`,
                    transform: `translateX(-50%) scaleY(${1 / orbitPlaneScaleY})`,
                    zIndex: selectedPlanet?.id === planet.id ? 8 : 6,
                  }}
                >
                  <div
                    style={{
                      ...styles.planetName,
                      animation: `counter-spin ${orbitDuration}s linear infinite`,
                      animationDirection: index % 2 === 0 ? "reverse" : "normal",
                      animationDelay: `${initialDelay}s`,
                    }}
                  >
                    {planet.name}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div style={styles.systemHud}>
        <div>Selected: {selectedPlanet ? selectedPlanet.name : "Star"}</div>
        <div>Click power: {formatCompact(computeProduction(state).clickPower)}</div>
        <div>Worlds: {state.planets.length}/{BALANCE.maxPlanets}</div>
      </div>
      <button style={styles.systemAddPlanetButton} onClick={onOpenPlanetPicker}>+ Add Planet</button>
    </div>
  );
}

function getParticleStyle(index: number, burstSeed: number): CSSProperties {
  const angle = (index / 8) * Math.PI * 2;
  const distance = 28 + (index % 3) * 10;
  return {
    left: `calc(50% + ${Math.cos(angle) * distance}px)`,
    top: `calc(50% + ${Math.sin(angle) * distance}px)`,
    animationDelay: `${burstSeed * 8 + index * 20}ms`,
    transform: `translate(-50%, -50%) rotate(${burstSeed * 18 + index * 24}deg)`,
  };
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandomFactory(seedValue: string) {
  let seed = hashString(seedValue) || 1;
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 1000000) / 1000000;
  };
}

function getPlanetPalette(stage: number, baseColor: string, isCitiesUnlocked: boolean) {
  if (stage <= 1) {
    return {
      base: "#6f6258",
      highlight: "#b59b7f",
      shadow: "#27201b",
      atmosphere: "rgba(255, 160, 80, 0.12)",
      glow: "rgba(255, 139, 61, 0.18)",
      ocean: "#4a5b63",
      land: "#72655a",
      ice: "rgba(255, 235, 214, 0.12)",
      cloud: "rgba(255, 239, 220, 0.08)",
      city: "rgba(255, 220, 144, 0.08)",
      specular: "rgba(255, 238, 209, 0.12)",
      surface: baseColor,
      ring: "rgba(255, 198, 126, 0.18)",
      limb: "rgba(255, 184, 108, 0.18)",
    };
  }

  if (stage === 2) {
    return {
      base: "#8c8a84",
      highlight: "#dfd8cd",
      shadow: "#2b2d31",
      atmosphere: "rgba(166, 186, 211, 0.12)",
      glow: "rgba(167, 187, 214, 0.16)",
      ocean: "#4b5861",
      land: "#7d776f",
      ice: "rgba(247, 248, 250, 0.06)",
      cloud: "rgba(236, 242, 247, 0.04)",
      city: "rgba(255, 255, 230, 0.05)",
      specular: "rgba(255, 255, 255, 0.06)",
      surface: baseColor,
      ring: "rgba(214, 222, 236, 0.15)",
      limb: "rgba(192, 203, 217, 0.16)",
    };
  }

  if (stage === 3) {
    return {
      base: "#4f6578",
      highlight: "#d7e7f8",
      shadow: "#1c2430",
      atmosphere: "rgba(110, 171, 214, 0.24)",
      glow: "rgba(117, 186, 232, 0.22)",
      ocean: "#415e7f",
      land: "#6d7a71",
      ice: "rgba(242, 246, 252, 0.22)",
      cloud: "rgba(246, 250, 255, 0.42)",
      city: "rgba(255, 248, 214, 0.05)",
      specular: "rgba(255, 255, 255, 0.18)",
      surface: baseColor,
      ring: "rgba(169, 208, 236, 0.22)",
      limb: "rgba(152, 203, 238, 0.2)",
    };
  }

  if (stage === 4) {
    return {
      base: "#416d9f",
      highlight: "#ebf7ff",
      shadow: "#132336",
      atmosphere: "rgba(117, 185, 255, 0.34)",
      glow: "rgba(126, 190, 255, 0.32)",
      ocean: "#285f9d",
      land: "#5b7f5f",
      ice: "rgba(246, 251, 255, 0.86)",
      cloud: "rgba(250, 252, 255, 0.62)",
      city: "rgba(255, 242, 194, 0.05)",
      specular: "rgba(255, 255, 255, 0.42)",
      surface: baseColor,
      ring: "rgba(182, 225, 255, 0.26)",
      limb: "rgba(159, 224, 255, 0.3)",
    };
  }

  if (stage === 5) {
    return {
      base: "#2f683d",
      highlight: "#effbf0",
      shadow: "#13261a",
      atmosphere: "rgba(144, 218, 255, 0.34)",
      glow: "rgba(131, 214, 174, 0.24)",
      ocean: "#2d5f91",
      land: "#6c9f52",
      ice: "rgba(240, 249, 255, 0.7)",
      cloud: "rgba(248, 252, 255, 0.58)",
      city: "rgba(255, 237, 172, 0.06)",
      specular: "rgba(255, 255, 255, 0.34)",
      surface: baseColor,
      ring: "rgba(168, 236, 213, 0.2)",
      limb: "rgba(157, 233, 233, 0.25)",
    };
  }

  return {
    base: "#275643",
    highlight: "#edfdf1",
    shadow: "#0f1d16",
    atmosphere: "rgba(114, 215, 181, 0.34)",
    glow: "rgba(114, 215, 181, 0.28)",
    ocean: "#214b7a",
    land: "#3e7a47",
    ice: "rgba(240, 250, 255, 0.68)",
    cloud: "rgba(248, 252, 255, 0.54)",
    city: isCitiesUnlocked ? "rgba(255, 228, 154, 0.62)" : "rgba(255, 228, 154, 0.06)",
    specular: "rgba(255, 255, 255, 0.3)",
    surface: baseColor,
    ring: "rgba(159, 233, 182, 0.18)",
    limb: "rgba(159, 233, 182, 0.22)",
  };
}

function getPlanetVisual(planet: Planet, baseColor: string) {
  const stage = planet.stage;
  const planetSeed = seededRandomFactory(`${planet.id}:${planet.orbitIndex}:${planet.stage}`);
  const palette = getPlanetPalette(stage, baseColor, stage >= 6);
  const isBarrenWorld = stage <= 2;
  const isWaterWorld = stage === 3 || stage === 4;
  const isLifeWorld = stage === 5;
  const isAdvancedWorld = stage >= 6;
  const baseSize = Math.max(44, 40 + Math.min(planet.size * 5.5, 16) + stage * 0.8);
  const accessibilityBoost = MAX_GAMEPLAY_ACCESSIBILITY_MODE && stage <= 3 ? 1.2 : 1;
  const size = Math.round(baseSize * accessibilityBoost);
  const shiftX = Math.round((planetSeed() * 14) - 7);
  const shiftY = Math.round((planetSeed() * 10) - 5);
  const textureScale = 96 + Math.round(planetSeed() * 22);
  const atmosphereInset = isAdvancedWorld ? -10 : isLifeWorld ? -8 : stage >= 3 ? -7 : -4;
  const atmosphereOpacity = isAdvancedWorld ? 1 : stage >= 4 ? 0.95 : stage === 3 ? 0.82 : 0.42;
  const cloudLayerCount = isAdvancedWorld ? 7 : isLifeWorld ? 6 : stage === 4 ? 4 : stage === 3 ? 3 : 0;
  const craterCount = stage <= 2 ? 8 : stage === 3 ? 4 : 2;
  const craterLayers = Array.from({ length: craterCount }).map((_, index) => {
    const x = Math.round(18 + planetSeed() * 64);
    const y = Math.round(18 + planetSeed() * 64);
    const radius = Math.round(2 + planetSeed() * 5 + index * 0.3);
    return `radial-gradient(circle at ${x}% ${y}%, rgba(0,0,0,0.32) 0 ${radius}px, transparent ${radius + 1}px)`;
  });
  const ridgeBands = Array.from({ length: 4 }).map((_, index) => {
    const y = Math.round(18 + index * 18 + planetSeed() * 8);
    const alpha = 0.1 + planetSeed() * 0.08;
    return `linear-gradient(${8 + index * 18}deg, transparent 0 42%, rgba(255,255,255,${alpha}) 48%, transparent 54%)`;
  });
  const continentBands = Array.from({ length: 4 }).map((_, index) => {
    const x = Math.round(18 + planetSeed() * 62);
    const y = Math.round(18 + planetSeed() * 62);
    const width = 16 + Math.round(planetSeed() * 18 + index * 3);
    const height = 10 + Math.round(planetSeed() * 12 + index * 2);
    const rotate = Math.round(planetSeed() * 140 - 70);
    return `radial-gradient(ellipse ${width}% ${height}% at ${x}% ${y}%, rgba(0,0,0,0.05) 0 32%, rgba(0,0,0,0.14) 46%, transparent 72%)`;
  });
  const oceanBands = Array.from({ length: 3 }).map((_, index) => {
    const x = Math.round(22 + planetSeed() * 55);
    const y = Math.round(22 + planetSeed() * 55);
    const width = 34 + Math.round(planetSeed() * 18);
    const height = 16 + Math.round(planetSeed() * 8);
    return `radial-gradient(ellipse ${width}% ${height}% at ${x}% ${y}%, rgba(255,255,255,${0.05 + index * 0.02}) 0 18%, transparent 54%)`;
  });
  const cloudLayers = Array.from({ length: cloudLayerCount }).map((_, index) => {
    const x = Math.round(20 + planetSeed() * 54 + index * 6 - 10);
    const y = Math.round(18 + planetSeed() * 40 + index * 7 - 6);
    const width = (isAdvancedWorld ? 22 : isLifeWorld ? 20 : 18) + Math.round(planetSeed() * 12);
    const height = (isAdvancedWorld ? 10 : 8) + Math.round(planetSeed() * 6);
    const density = isAdvancedWorld ? 42 : isLifeWorld ? 40 : 38;
    return `radial-gradient(ellipse ${width}% ${height}% at ${x}% ${y}%, ${palette.cloud} 0 ${density}%, transparent 72%)`;
  });
  const vegetationBands = stage >= 5 ? Array.from({ length: 4 }).map((_, index) => {
    const x = Math.round(20 + planetSeed() * 54 + index * 6 - 8);
    const y = Math.round(30 + planetSeed() * 28 + index * 8 - 5);
    const width = 20 + Math.round(planetSeed() * 10);
    const height = 9 + Math.round(planetSeed() * 5);
    return `radial-gradient(ellipse ${width}% ${height}% at ${x}% ${y}%, rgba(106, 193, 92, ${0.16 + planetSeed() * 0.1}) 0 28%, transparent 72%)`;
  }) : [];
  const cityBands = stage >= 6 ? Array.from({ length: 3 }).map(() => {
    const x = Math.round(24 + planetSeed() * 48);
    const y = Math.round(24 + planetSeed() * 44);
    const width = 8 + Math.round(planetSeed() * 7);
    const height = 4 + Math.round(planetSeed() * 4);
    return `radial-gradient(ellipse ${width}% ${height}% at ${x}% ${y}%, ${palette.city} 0 40%, transparent 70%)`;
  }) : [];
  const twilightBands = isAdvancedWorld ? Array.from({ length: 4 }).map((_, index) => {
    const x = Math.round(34 + planetSeed() * 36 + index * 4 - 6);
    const y = Math.round(42 + planetSeed() * 18 + index * 3 - 4);
    const width = 12 + Math.round(planetSeed() * 8);
    const height = 4 + Math.round(planetSeed() * 3);
    return `radial-gradient(ellipse ${width}% ${height}% at ${x}% ${y}%, rgba(255,214,136,${0.16 + planetSeed() * 0.08}) 0 44%, transparent 74%)`;
  }) : [];

  const baseGradientByStage = [
    `radial-gradient(circle at ${45 + shiftX * 0.15}% ${34 + shiftY * 0.12}%, rgba(255,238,208,0.99) 0%, rgba(230,156,92,0.97) 16%, rgba(144,98,74,0.99) 42%, rgba(88,63,55,1) 72%, rgba(50,44,47,1) 100%)`,
    `radial-gradient(circle at ${42 + shiftX * 0.2}% ${35 + shiftY * 0.12}%, rgba(255,252,244,0.98) 0%, rgba(224,207,192,0.99) 18%, rgba(148,147,147,1) 46%, rgba(92,92,96,1) 76%, rgba(48,52,62,1) 100%)`,
    `radial-gradient(circle at ${40 + shiftX * 0.2}% ${34 + shiftY * 0.14}%, rgba(255,255,252,0.97) 0%, rgba(202,221,240,0.95) 15%, rgba(112,146,173,0.97) 40%, rgba(60,80,106,1) 74%, rgba(32,44,62,1) 100%)`,
    `radial-gradient(circle at ${40 + shiftX * 0.2}% ${33 + shiftY * 0.14}%, rgba(255,255,255,1) 0%, rgba(194,234,255,0.97) 14%, rgba(84,144,205,0.98) 38%, rgba(45,82,128,1) 72%, rgba(28,38,54,1) 100%)`,
    `radial-gradient(circle at ${40 + shiftX * 0.2}% ${33 + shiftY * 0.14}%, rgba(255,255,255,0.98) 0%, rgba(176,224,208,0.94) 14%, rgba(57,123,108,0.97) 38%, rgba(18,57,76,1) 72%, rgba(6,11,18,1) 100%)`,
    `radial-gradient(circle at ${40 + shiftX * 0.2}% ${33 + shiftY * 0.14}%, rgba(255,255,255,0.98) 0%, rgba(188,234,179,0.94) 14%, rgba(54,126,73,0.97) 38%, rgba(18,54,44,1) 72%, rgba(5,11,16,1) 100%)`,
    `radial-gradient(circle at ${40 + shiftX * 0.2}% ${33 + shiftY * 0.14}%, rgba(255,255,255,0.98) 0%, rgba(200,240,205,0.94) 13%, rgba(41,108,84,0.97) 38%, rgba(16,44,50,1) 72%, rgba(5,10,15,1) 100%)`,
  ];

  const surfaceLayers = [
    ...craterLayers,
    ...ridgeBands,
    ...(stage >= 3 ? oceanBands : []),
    ...continentBands,
    ...vegetationBands,
    ...cityBands,
    ...cloudLayers,
  ].join(", ");
  const hasAtmosphere = stage >= 3;
  const atmosphereBackground = isAdvancedWorld
    ? `radial-gradient(circle at 40% 34%, ${palette.atmosphere} 0%, rgba(188,244,228,0.24) 26%, transparent 70%), radial-gradient(circle at 74% 56%, rgba(94,186,156,0.18) 0%, transparent 36%)`
    : isLifeWorld
      ? `radial-gradient(circle at 40% 34%, ${palette.atmosphere} 0%, rgba(164,235,221,0.14) 24%, transparent 68%), radial-gradient(circle at 70% 60%, rgba(99,166,255,0.12) 0%, transparent 30%)`
      : isWaterWorld
        ? `radial-gradient(circle at 40% 34%, ${palette.atmosphere} 0%, rgba(190,229,255,0.12) 20%, transparent 64%)`
        : `radial-gradient(circle at 40% 34%, ${palette.atmosphere} 0%, transparent 60%)`;
  const cloudBackground = isAdvancedWorld
    ? `${cloudLayers.join(", ")}, radial-gradient(circle at ${34 + shiftX * 0.14}% ${30 + shiftY * 0.1}%, rgba(255,255,255,0.24) 0 9%, transparent 15%), radial-gradient(circle at ${60 + shiftX * 0.14}% ${56 + shiftY * 0.1}%, rgba(255,255,255,0.18) 0 11%, transparent 18%)`
    : isLifeWorld
      ? `${cloudLayers.join(", ")}, radial-gradient(circle at ${42 + shiftX * 0.16}% ${62 + shiftY * 0.1}%, rgba(255,255,255,0.15) 0 8%, transparent 13%)`
      : isWaterWorld
        ? `${cloudLayers.join(", ")}`
        : "transparent";
  const lifeBandBackground = isAdvancedWorld
    ? `radial-gradient(circle at 42% 50%, transparent 0 36%, rgba(116, 222, 132, 0.26) 44%, rgba(52, 154, 94, 0.18) 57%, transparent 74%), radial-gradient(circle at 62% 42%, rgba(106, 238, 184, 0.12) 0 10%, transparent 20%)`
    : isLifeWorld
      ? `radial-gradient(circle at 38% 48%, transparent 0 38%, rgba(126, 214, 89, 0.28) 45%, rgba(69, 149, 68, 0.24) 58%, transparent 74%)`
      : "transparent";
  const cityLightsBackground = isAdvancedWorld
    ? `${twilightBands.join(", ")}, radial-gradient(circle at ${63 + shiftX * 0.2}% ${56 + shiftY * 0.2}%, ${palette.city} 0 2.5%, transparent 4.1%), radial-gradient(circle at ${52 + shiftX * 0.16}% ${61 + shiftY * 0.16}%, ${palette.city} 0 1.9%, transparent 3.5%), radial-gradient(circle at ${36 + shiftX * 0.18}% ${50 + shiftY * 0.14}%, ${palette.city} 0 1.5%, transparent 3.1%), radial-gradient(circle at ${44 + shiftX * 0.12}% ${68 + shiftY * 0.14}%, rgba(255,235,178,0.42) 0 1.1%, transparent 2.6%)`
    : "transparent";

  return {
    size: `${size}px`,
    glow: `0 0 12px ${palette.glow}, 0 0 24px rgba(0,0,0,0.2)`,
    selectedGlow: `0 0 24px ${palette.glow}, 0 0 42px rgba(0,0,0,0.28)`,
    orbitShadow: {
      position: "absolute",
      width: `${Math.round(size * 0.86)}px`,
      height: `${Math.round(size * 0.3)}px`,
      left: "50%",
      top: "50%",
      borderRadius: "50%",
      transform: `translate(-50%, ${Math.round(size * 0.32)}px)`,
      background: "radial-gradient(ellipse at center, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.2) 46%, rgba(0,0,0,0) 78%)",
      filter: `blur(${Math.max(3, Math.round(size * 0.08))}px)`,
      opacity: 0.88,
      pointerEvents: "none",
      zIndex: 1,
    } as CSSProperties,
    atmosphere: {
      position: "absolute",
      inset: atmosphereInset,
      borderRadius: "50%",
      background: atmosphereBackground,
      opacity: atmosphereOpacity,
      filter: `blur(${isAdvancedWorld ? 2 : 1}px)`,
      pointerEvents: "none",
    } as CSSProperties,
    halo: {
      position: "absolute",
      inset: -12,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${palette.ring} 0%, transparent 65%)`,
      opacity: hasAtmosphere ? 0.7 : 0.35,
      filter: "blur(3px)",
      pointerEvents: "none",
    } as CSSProperties,
    body: {
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      overflow: "hidden",
      backgroundImage: `${surfaceLayers}, ${baseGradientByStage[Math.min(stage, baseGradientByStage.length - 1)]}`,
      backgroundSize: `${textureScale}% ${textureScale}%`,
      backgroundPosition: `${46 + shiftX * 0.2}% ${42 + shiftY * 0.2}%`,
      backgroundBlendMode: "screen, multiply, multiply, multiply, screen, screen, screen, screen, screen, screen, screen",
      boxShadow: `inset -${Math.max(10, size * 0.14)}px -${Math.max(12, size * 0.16)}px ${Math.max(16, size * 0.2)}px rgba(0,0,0,0.44), inset ${Math.max(8, size * 0.1)}px ${Math.max(6, size * 0.08)}px ${Math.max(10, size * 0.14)}px rgba(255,255,255,0.2), inset 0 0 0 1px rgba(255,255,255,0.16)`,
      transform: "rotate(-12deg)",
      animation: `planet-spin ${20 + planet.stage * 3 + (planet.orbitIndex % 4) * 2}s linear infinite`,
      willChange: "transform",
    } as CSSProperties,
    shadow: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: "linear-gradient(100deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.065) 24%, rgba(0,0,0,0.08) 54%, rgba(0,0,0,0.44) 100%)",
      mixBlendMode: "multiply",
      pointerEvents: "none",
    } as CSSProperties,
    highlights: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: `radial-gradient(circle at 28% 28%, rgba(255,255,255,0.56) 0%, rgba(255,255,255,0.2) 12%, transparent 30%), radial-gradient(circle at 64% 28%, ${palette.specular} 0%, transparent 18%)`,
      opacity: stage >= 3 ? 0.96 : 0.85,
      pointerEvents: "none",
    } as CSSProperties,
    specularArc: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: "conic-gradient(from 210deg at 30% 36%, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.26) 42deg, rgba(255,255,255,0.06) 74deg, rgba(255,255,255,0) 126deg, rgba(255,255,255,0) 360deg)",
      mixBlendMode: "screen",
      opacity: stage >= 3 ? 0.8 : 0.52,
      pointerEvents: "none",
    } as CSSProperties,
    features: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: `radial-gradient(circle at ${48 + shiftX * 0.4}% ${58 + shiftY * 0.22}%, rgba(0,0,0,0.14) 0 5%, transparent 6%), radial-gradient(circle at ${28 + shiftX * 0.36}% ${66 + shiftY * 0.18}%, rgba(0,0,0,0.1) 0 3.8%, transparent 5%)`,
      opacity: isBarrenWorld ? 0.3 : isWaterWorld ? 0.16 : 0.11,
      pointerEvents: "none",
      mixBlendMode: "multiply",
    } as CSSProperties,
    lifeBand: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: lifeBandBackground,
      mixBlendMode: "screen",
      pointerEvents: "none",
      opacity: stage >= 5 ? 1 : 0,
    } as CSSProperties,
    cityLights: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: cityLightsBackground,
      opacity: isAdvancedWorld ? 0.98 : 0,
      mixBlendMode: "screen",
      pointerEvents: "none",
      animation: isAdvancedWorld ? "city-lights 16s ease-in-out infinite" : undefined,
    } as CSSProperties,
    clouds: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      background: cloudBackground,
      opacity: isAdvancedWorld ? 0.94 : isLifeWorld ? 0.9 : isWaterWorld ? 0.82 : 0,
      mixBlendMode: "screen",
      pointerEvents: "none",
      animation: stage >= 3 ? "planet-cloud-drift 14s linear infinite" : undefined,
    } as CSSProperties,
    limbLight: {
      position: "absolute",
      inset: -3,
      borderRadius: "50%",
      boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.2), inset -${Math.max(6, size * 0.08)}px 0 ${Math.max(10, size * 0.12)}px rgba(0,0,0,0.2), inset ${Math.max(5, size * 0.06)}px 0 ${Math.max(8, size * 0.08)}px ${palette.limb}`,
      pointerEvents: "none",
    } as CSSProperties,
  };
}

function BottomNavigation({
  layoutMode,
  activeTab,
  onSelectTab,
}: {
  layoutMode: LayoutMode;
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}) {
  if (layoutMode !== "mobile") {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#071326]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-2">
        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={tab.id === activeTab ? "min-h-11 rounded-2xl border border-[#f28a5b]/40 bg-[#f28a5b]/15 px-2 py-2 text-[11px] font-semibold text-[#fff1c7]" : "min-h-11 rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-[#d4deee]"}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Sidebar({
  tab,
  setTab,
  canPrestige,
}: {
  tab: TabId;
  setTab: (tab: TabId) => void;
  canPrestige: boolean;
}) {
  const items: { key: TabId; label: string }[] = [
    { key: "system", label: "Solar System" },
    { key: "upgrades", label: "Upgrades" },
    { key: "achievements", label: "Achievements" },
    { key: "prestige", label: `Prestige${canPrestige ? " •" : ""}` },
    { key: "stats", label: "Statistics" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="sidebar">
      {items.map((item) => (
        <button key={item.key} className={`nav-btn${tab === item.key ? " active" : ""}`} onClick={() => setTab(item.key)}>
          <span className="label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function TopBar({
  layoutMode,
  state,
  production,
  onOpenSettings,
  onBackToStart,
}: {
  layoutMode: LayoutMode;
  state: GameStateData;
  production: ReturnType<typeof computeProduction>;
  onOpenSettings: () => void;
  onBackToStart: () => void;
}) {
  return (
    <header className="topbar">
      <div className="brand">STELLAR GENESIS</div>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <div style={styles.kicker}>Observation system</div>
          <div style={styles.topBarSubtitle}>Manage the star and expand the system.</div>
        </div>
        <div style={styles.energyCapsule}>
          <div style={styles.energyIcon} aria-hidden="true">
            ✦
          </div>
          <div>
            <div style={styles.energyLabel}>Stellar Energy</div>
            <div style={styles.energyValue}>{formatNumber(state.energy, state.settings.numberFormat)}</div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3" style={styles.resourceStrip}>
        <span style={styles.resourcePill}>EPS {formatNumber(production.energyPerSecond, state.settings.numberFormat)}</span>
        <span style={styles.resourcePill}>Biomass {formatNumber(state.biomass, state.settings.numberFormat)}</span>
        <span style={styles.resourcePill}>Research {formatNumber(state.researchData, state.settings.numberFormat)}</span>
        <span style={styles.resourcePill}>Population {formatNumber(state.population, state.settings.numberFormat)}</span>
        <span style={styles.resourcePill}>Essence {formatNumber(state.cosmicEssence, state.settings.numberFormat)}</span>
      </div>
      <div className="flex items-center gap-2" style={styles.actionRow}>
        <button style={styles.topbarStartButton} onClick={onBackToStart}>Start</button>
        <button style={styles.topbarSettingsButton} onClick={onOpenSettings}>Settings</button>
      </div>
    </header>
  );
}

function ActionCard({
  title,
  desc,
  meta,
  enabled,
  onClick,
  right,
}: {
  title: string;
  desc: string;
  meta?: string;
  enabled: boolean;
  onClick: () => void;
  right?: string;
}) {
  return (
    <button onClick={onClick} disabled={!enabled} style={enabled ? styles.actionCard : styles.actionCardDisabled}>
      <div style={styles.planetHeader}>
        <div>
          <div style={styles.cardTitle}>{title}</div>
          <div style={styles.cardMeta}>{desc}</div>
        </div>
        {right ? <div style={styles.cardMeta}>{right}</div> : null}
      </div>
      {meta ? <div style={styles.cardMeta}>{meta}</div> : null}
    </button>
  );
}

function PanelScroll({ children }: { children: ReactNode }) {
  return <div style={styles.panelScroll}>{children}</div>;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Starfield() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, index) => ({
        id: index,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        size: `${Math.random() * 1.6 + 0.6}px`,
        delay: `${Math.random() * 4}s`,
        glow: `${Math.random() * 8 + 4}px`,
        tone: Math.random() > 0.8 ? "rgba(255,232,184,0.95)" : Math.random() > 0.55 ? "rgba(182,210,255,0.95)" : "rgba(255,255,255,0.96)",
        alpha: 0.42 + Math.random() * 0.5,
      })),
    [],
  );

  return (
    <div className="starfield" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            background: star.tone,
            opacity: star.alpha,
            boxShadow: `0 0 ${star.glow} ${star.tone}`,
          }}
        />
      ))}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  startRoot: {
    minHeight: "100vh",
    display: "block",
    position: "relative",
    overflow: "hidden",
    background: "radial-gradient(circle at 50% 28%, rgba(24,45,85,0.16) 0%, rgba(9,19,37,0.68) 40%, rgba(4,7,13,0.92) 100%)",
    color: "#f6f2e8",
    fontFamily: "Inter, sans-serif",
  },
  startRootLaunching: {
    cursor: "none",
  },
  startBackdrop: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(160deg, rgba(7,19,38,0.5) 0%, rgba(19,39,71,0.36) 50%, rgba(7,19,38,0.72) 100%)",
  },
  startAtmosphere: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(circle at 52% 40%, rgba(115,106,174,0.14) 0%, rgba(115,106,174,0.06) 18%, transparent 46%), radial-gradient(circle at 50% 54%, rgba(242,138,91,0.06) 0%, transparent 28%)",
    mixBlendMode: "screen",
    pointerEvents: "none",
    animation: "sg-intro-ambient-pulse 14s ease-in-out infinite",
  },
  startWindowGlow: {
    position: "absolute",
    left: "50%",
    top: "48%",
    width: 760,
    height: 460,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "radial-gradient(ellipse at center, rgba(255,241,199,0.18) 0%, rgba(242,138,91,0.14) 22%, rgba(242,138,91,0.05) 42%, transparent 72%)",
    filter: "blur(16px)",
    opacity: 0.86,
    pointerEvents: "none",
    animation: "sg-intro-window-breathe 8s ease-in-out infinite",
  },
  startGlow: {
    position: "absolute",
    left: "50%",
    top: "46%",
    width: 880,
    height: 880,
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(115,106,174,0.25) 0%, rgba(242,138,91,0.12) 25%, transparent 70%)",
    filter: "blur(24px)",
    opacity: 0.6,
    pointerEvents: "none",
    animation: "sg-intro-nebula-drift 22s ease-in-out infinite",
  },
  startGlowLaunch: {
    opacity: 0.95,
    transform: "translate(-50%, -50%) scale(1.08)",
  },
  startCloudBand: {
    position: "absolute",
    inset: 0,
    background: "radial-gradient(ellipse at 46% 48%, rgba(169,199,223,0.2) 0%, rgba(169,199,223,0.08) 18%, transparent 42%), radial-gradient(ellipse at 59% 51%, rgba(115,106,174,0.16) 0%, rgba(115,106,174,0.07) 20%, transparent 44%), radial-gradient(ellipse at 62% 64%, rgba(242,138,91,0.08) 0%, transparent 30%)",
    filter: "blur(18px)",
    opacity: 0.78,
    mixBlendMode: "screen",
    pointerEvents: "none",
    animation: "sg-intro-cloud-drift 38s linear infinite",
  },
  startCloudBandLaunch: {
    opacity: 0.98,
    transform: "translate3d(0, 0, 0) scale(1.02)",
  },
  startInterfaceSpark: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, transparent 0%, rgba(242,138,91,0.12) 16%, transparent 20%, transparent 80%, rgba(169,199,223,0.08) 86%, transparent 90%), linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.03) 33%, transparent 34%, transparent 66%, rgba(255,255,255,0.03) 67%, transparent 68%)",
    mixBlendMode: "screen",
    opacity: 0.35,
    pointerEvents: "none",
    animation: "sg-intro-interface-scan 16s linear infinite",
  },
  startStar: {
    position: "absolute",
    borderRadius: "9999px",
    background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,241,199,0.92) 38%, transparent 100%)",
    boxShadow: "0 0 10px rgba(255,255,255,0.45)",
    opacity: 0.42,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    animation: "sg-intro-star-twinkle 6s ease-in-out infinite",
  },
  startWindowGlowLaunch: {
    opacity: 1,
    transform: "translate(-50%, -50%) scale(1.08)",
  },
  startPanel: {
    position: "absolute",
    left: 28,
    bottom: 28,
    zIndex: 1,
    width: "min(540px, calc(100vw - 56px))",
    padding: 26,
    borderRadius: 28,
    border: "1px solid rgba(169,199,223,0.14)",
    background: "linear-gradient(180deg, rgba(8,16,31,0.58) 0%, rgba(8,16,31,0.28) 100%)",
    backdropFilter: "blur(8px)",
    boxShadow: "0 24px 70px rgba(0,0,0,0.16)",
  },
  kicker: { letterSpacing: "0.22em", fontSize: 10, color: "#f28a5b", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace", marginBottom: 8 },
  title: { fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(42px, 5vw, 68px)", lineHeight: 0.94, letterSpacing: "0.05em", textTransform: "uppercase", color: "#f6f2e8", textShadow: "0 0 24px rgba(242,138,91,0.12), 0 0 40px rgba(169,199,223,0.08)", margin: 0 },
  subtitle: { maxWidth: 430, marginTop: 14, marginBottom: 0, color: "#d4deee", fontSize: 15, lineHeight: 1.7 },
  statusTitle: { fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "#f28a5b", marginBottom: 10, fontFamily: "JetBrains Mono, monospace" },
  statusGrid: { display: "grid", gridTemplateColumns: "1fr auto", gap: 6, color: "#d4deee", fontSize: 11, lineHeight: 1.45 },
  startStatusLeft: { position: "absolute", left: 28, top: 24, zIndex: 2, letterSpacing: "0.24em", fontSize: 10, color: "#9eacc1", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" },
  startStatusRight: { position: "absolute", right: 28, top: 24, zIndex: 2, width: "min(280px, calc(100vw - 56px))", padding: 16, borderRadius: 20, border: "1px solid rgba(169,199,223,0.12)", background: "rgba(8,16,31,0.52)", backdropFilter: "blur(10px)", boxShadow: "0 18px 60px rgba(0,0,0,0.14)" },
  startButtons: { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22, marginBottom: 16 },
  primaryButton: { border: "1px solid rgba(242,138,91,0.7)", background: "linear-gradient(180deg, rgba(242,138,91,0.24) 0%, rgba(242,138,91,0.12) 100%)", color: "#fff1c7", padding: "13px 18px", borderRadius: 999, cursor: "pointer", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif", boxShadow: "0 0 0 1px rgba(255,241,199,0.04) inset, 0 0 26px rgba(242,138,91,0.14)", minHeight: 48 },
  secondaryButton: { border: "1px solid rgba(169,199,223,0.24)", background: "rgba(7,19,38,0.34)", color: "#d4deee", padding: "13px 18px", borderRadius: 999, cursor: "pointer", fontFamily: "Inter, sans-serif", minHeight: 48 },
  dangerButton: { border: "1px solid rgba(255,116,116,0.28)", background: "rgba(110,34,34,0.35)", color: "#ffd7d7", padding: "12px 18px", borderRadius: 14, cursor: "pointer" },
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 10, marginTop: 6 },
  previewStat: { padding: 14, borderRadius: 16, background: "rgba(12,28,54,0.56)", border: "1px solid rgba(169,199,223,0.1)" },
  previewLabel: { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9eacc1", marginBottom: 6 },
  previewValue: { fontSize: 16, color: "#f6f2e8" },
  startFooterHint: { position: "absolute", right: 28, bottom: 18, zIndex: 2, fontSize: 11, color: "#9eacc1", letterSpacing: "0.06em", opacity: 0.85 },
  gameRoot: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "#071326", color: "#f6f2e8", fontFamily: "Space Grotesk, sans-serif" },
  topBar: { display: "flex", gap: 16, alignItems: "center", justifyContent: "space-between", padding: "8px 20px", borderBottom: "1px solid rgba(169,199,223,0.1)", background: "rgba(7,19,38,0.82)", backdropFilter: "blur(12px)", fontFamily: "JetBrains Mono, monospace" },
  topBarSubtitle: { marginTop: 2, fontSize: 11, lineHeight: 1.25, color: "#deebff", opacity: 0.94 },
  topBarTitle: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  energyCapsule: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 999, background: "linear-gradient(180deg, rgba(242,138,91,0.15), rgba(7,19,38,0.72))", border: "1px solid rgba(242,138,91,0.26)", boxShadow: "0 0 0 1px rgba(255,241,199,0.03) inset, 0 0 24px rgba(242,138,91,0.12)" },
  energyIcon: { width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff1c7", background: "radial-gradient(circle, rgba(255,248,214,1) 0%, rgba(255,217,122,0.95) 38%, rgba(242,138,91,0.9) 72%, rgba(139,58,26,0.18) 100%)", boxShadow: "0 0 12px rgba(255,217,122,0.45), 0 0 20px rgba(242,138,91,0.22)", fontSize: 12 },
  energyLabel: { fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9eacc1", fontFamily: "JetBrains Mono, monospace" },
  energyValue: { fontSize: 16, fontWeight: 700, lineHeight: 1.1, color: "#f6f2e8", fontFamily: "Space Grotesk, sans-serif" },
  resourceStrip: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", color: "#e3edff", fontSize: 11 },
  resourcePill: { padding: "6px 9px", borderRadius: 999, border: "1px solid rgba(169,199,223,0.12)", background: "rgba(7,19,38,0.42)", backdropFilter: "blur(8px)" },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  topbarStartButton: {
    border: "1px solid rgba(255,232,172,0.92)",
    background: "linear-gradient(180deg, rgba(255,226,136,1) 0%, rgba(246,170,98,0.98) 44%, rgba(229,120,78,0.96) 100%)",
    color: "#1a2130",
    padding: "13px 20px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "Space Grotesk, sans-serif",
    fontWeight: 700,
    letterSpacing: "0.03em",
    minHeight: 48,
    textShadow: "0 1px 0 rgba(255,245,220,0.45)",
    boxShadow: "0 0 0 1px rgba(255,248,214,0.34) inset, 0 0 20px rgba(246,218,150,0.48), 0 14px 34px rgba(242,138,91,0.48)",
  },
  topbarSettingsButton: {
    border: "1px solid rgba(200,220,246,0.68)",
    background: "linear-gradient(180deg, rgba(26,50,84,0.9) 0%, rgba(12,29,52,0.92) 100%)",
    color: "#f3f8ff",
    padding: "13px 18px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "Space Grotesk, sans-serif",
    fontWeight: 600,
    minHeight: 48,
    textShadow: "0 0 8px rgba(208,226,255,0.16)",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.12) inset, 0 0 18px rgba(124,166,232,0.22), 0 10px 24px rgba(0,0,0,0.34)",
  },
  mainGrid: { display: "grid", gridTemplateColumns: "56px minmax(0, 1fr) 280px", minHeight: 0, flex: 1 },
  navRail: { display: "flex", flexDirection: "column", gap: 4, paddingTop: 16, alignItems: "center", borderRight: "1px solid rgba(169,199,223,0.08)", background: "rgba(7,19,38,0.58)" },
  navButton: { border: "1px solid transparent", background: "transparent", color: "#c2d3ea", padding: "8px 4px", borderRadius: 4, cursor: "pointer", textAlign: "center", width: 40, fontSize: 10, fontFamily: "JetBrains Mono, monospace", opacity: 0.78 },
  navActive: { border: "1px solid rgba(242,138,91,0.52)", background: "rgba(242,138,91,0.2)", color: "#fff6da", padding: "8px 4px", borderRadius: 4, cursor: "pointer", textAlign: "center", width: 40, fontSize: 10, fontFamily: "JetBrains Mono, monospace", boxShadow: "0 0 12px rgba(242,138,91,0.34)" },
  centerPanel: { position: "relative", minHeight: 0, overflow: "hidden" },
  sidePanel: { display: "flex", flexDirection: "column", minHeight: 0, borderLeft: "1px solid rgba(169,199,223,0.12)", background: "linear-gradient(180deg, rgba(8,18,34,0.82) 0%, rgba(4,11,24,0.9) 100%)", backdropFilter: "blur(16px) saturate(1.2)", boxShadow: "inset 18px 0 36px rgba(0,0,0,0.18)" },
  sideHeader: { padding: "14px 16px", borderBottom: "1px solid rgba(169,199,223,0.14)", letterSpacing: "0.18em", textTransform: "uppercase", color: "#ffe1b6", fontSize: 10, fontWeight: 700, fontFamily: "JetBrains Mono, monospace" },
  panelScroll: { padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto", minHeight: 0 },
  actionCard: { textAlign: "left", padding: 14, borderRadius: 16, border: "1px solid rgba(242,138,91,0.24)", background: "linear-gradient(180deg, rgba(21,44,78,0.78) 0%, rgba(12,28,52,0.72) 100%)", color: "#f6f2e8", cursor: "pointer", boxShadow: "0 10px 24px rgba(0,0,0,0.22)" },
  actionCardDisabled: { textAlign: "left", padding: 14, borderRadius: 16, border: "1px solid rgba(169,199,223,0.12)", background: "linear-gradient(180deg, rgba(14,29,52,0.62) 0%, rgba(10,22,40,0.56) 100%)", color: "#9eacc1", opacity: 0.62, cursor: "not-allowed" },
  planetTypeCard: { textAlign: "left", padding: 14, borderRadius: 16, border: "1px solid rgba(242,138,91,0.3)", background: "linear-gradient(180deg, rgba(23,46,80,0.84) 0%, rgba(12,27,50,0.76) 100%)", color: "#f6f2e8", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 14px 34px rgba(0,0,0,0.22)" },
  planetTypeCardDisabled: { textAlign: "left", padding: 14, borderRadius: 16, border: "1px solid rgba(169,199,223,0.14)", background: "rgba(12,28,54,0.42)", color: "#9eacc1", cursor: "not-allowed", display: "flex", flexDirection: "column", gap: 8, opacity: 0.72 },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 6, lineHeight: 1.3, color: "#f8fbff" },
  cardMeta: { fontSize: 12, color: "#d6e4f8", lineHeight: 1.62 },
  sectionCopy: { color: "#e8f0ff", fontSize: 13, lineHeight: 1.72, padding: "0 2px" },
  subnavRow: { display: "flex", gap: 8, flexWrap: "wrap", margin: "6px 0 12px" },
  subnavButton: { border: "1px solid rgba(169,199,223,0.26)", background: "rgba(7,19,38,0.58)", color: "#e9f1ff", padding: "7px 11px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 600 },
  subnavButtonActive: { border: "1px solid rgba(242,138,91,0.54)", background: "rgba(242,138,91,0.26)", color: "#fff8df", padding: "7px 11px", borderRadius: 999, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  planetCard: { border: "1px solid rgba(169,199,223,0.12)", borderRadius: 16, background: "linear-gradient(180deg, rgba(14,30,56,0.72) 0%, rgba(9,20,38,0.72) 100%)", padding: 14, cursor: "pointer" },
  planetCardActive: { border: "1px solid rgba(242,138,91,0.42)", borderRadius: 16, background: "linear-gradient(180deg, rgba(242,138,91,0.16) 0%, rgba(16,33,60,0.78) 100%)", padding: 14, cursor: "pointer", boxShadow: "0 12px 28px rgba(0,0,0,0.22)" },
  planetDetailCard: { border: "1px solid rgba(169,199,223,0.12)", borderRadius: 16, background: "linear-gradient(180deg, rgba(14,30,56,0.74) 0%, rgba(8,19,36,0.78) 100%)", padding: 14 },
  planetHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  planetStagePreview: { margin: "12px 0 14px", padding: 12, borderRadius: 16, border: "1px solid rgba(169,199,223,0.14)", background: "linear-gradient(180deg, rgba(9,21,40,0.82) 0%, rgba(11,26,48,0.62) 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.02)" },
  planetStagePreviewCompact: { margin: "10px 0 12px", padding: 10, borderRadius: 14, border: "1px solid rgba(169,199,223,0.12)", background: "linear-gradient(180deg, rgba(9,21,40,0.72) 0%, rgba(11,26,48,0.56) 100%)" },
  planetStagePreviewHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  planetStagePreviewCopy: { display: "flex", flexDirection: "column", gap: 3, minWidth: 0 },
  planetStageBadge: { alignSelf: "flex-start", padding: "3px 8px", borderRadius: 999, border: "1px solid rgba(255,225,164,0.42)", background: "rgba(242,138,91,0.14)", color: "#ffe9bd", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" },
  planetStageTitle: { fontSize: 15, fontWeight: 700, lineHeight: 1.2, color: "#f8fbff" },
  planetStageMeta: { fontSize: 11, color: "#c8d8ef", lineHeight: 1.45 },
  planetPreviewOrb: { position: "relative", width: 62, height: 62, minWidth: 62, borderRadius: "50%", overflow: "visible", animation: "planet-preview-pop 0.55s ease-out" },
  planetPreviewOrbCompact: { position: "relative", width: 48, height: 48, minWidth: 48, borderRadius: "50%", overflow: "visible", animation: "planet-preview-pop 0.55s ease-out" },
  planetPreviewStatGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 },
  planetPreviewStatGridCompact: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 },
  planetPreviewStatCard: { padding: "8px 9px", borderRadius: 12, background: "rgba(4,12,26,0.42)", border: "1px solid rgba(169,199,223,0.1)" },
  planetPreviewStatLabel: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9fb3cf", marginBottom: 4, fontFamily: "JetBrains Mono, monospace" },
  planetPreviewStatValue: { fontSize: 12, fontWeight: 700, color: "#f6f2e8", lineHeight: 1.2 },
  planetUnlockNoticeSimple: { margin: "0 0 12px", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(169,199,223,0.14)", background: "linear-gradient(180deg, rgba(9,21,40,0.74) 0%, rgba(8,18,34,0.54) 100%)" },
  planetUnlockNoticeCompact: { margin: "0 0 10px", padding: "9px 10px", borderRadius: 12, border: "1px solid rgba(169,199,223,0.12)", background: "rgba(8,18,34,0.52)" },
  planetUnlockNoticeMax: { margin: "0 0 12px", padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(169,199,223,0.14)", background: "rgba(8,18,34,0.54)", color: "#d5e0f1", fontSize: 12, lineHeight: 1.55 },
  planetUnlockEyebrow: { fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#ffd9a6", fontFamily: "JetBrains Mono, monospace", marginBottom: 4 },
  planetUnlockInlineRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 },
  planetUnlockStatusRow: { display: "flex", justifyContent: "flex-start", margin: "2px 0 8px" },
  planetUnlockStatus: { padding: "4px 9px", borderRadius: 999, border: "1px solid rgba(169,199,223,0.18)", background: "rgba(7,19,38,0.5)", color: "#deebff", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" },
  planetUnlockStatusReady: { border: "1px solid rgba(117,198,153,0.36)", background: "rgba(22,64,46,0.42)", color: "#d5ffe2" },
  planetUnlockStatusBlocked: { border: "1px solid rgba(242,138,91,0.4)", background: "rgba(72,34,24,0.44)", color: "#ffd2bb" },
  planetUnlockStatusWaiting: { border: "1px solid rgba(255,225,164,0.28)", background: "rgba(59,47,18,0.34)", color: "#ffe7b7" },
  planetUnlockTitle: { fontSize: 13, fontWeight: 700, color: "#f8fbff", marginBottom: 4, lineHeight: 1.3 },
  planetUnlockCopy: { fontSize: 12, color: "#d7e5f8", lineHeight: 1.55, marginBottom: 6 },
  planetUnlockMetaRow: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  planetUnlockMeta: { fontSize: 11, color: "#b9cae3", lineHeight: 1.5 },
  planetUnlockWarning: { marginTop: 6, fontSize: 11, color: "#ffd0b7", lineHeight: 1.5, fontWeight: 600 },
  planetUnlockReady: { marginTop: 6, fontSize: 11, color: "#c8f1d8", lineHeight: 1.5, fontWeight: 600 },
  planetUnlockPrimaryAction: { border: "1px solid rgba(255,228,164,0.72)", background: "linear-gradient(180deg, rgba(255,214,118,0.22) 0%, rgba(242,138,91,0.24) 100%)", color: "#fff7de", padding: "8px 12px", borderRadius: 999, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", boxShadow: "0 10px 24px rgba(0,0,0,0.22)" },
  planetFactsGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, margin: "12px 0 14px" },
  planetFactsGridCompact: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, margin: "10px 0 12px" },
  planetFactCard: { padding: "10px 11px", borderRadius: 12, background: "rgba(6,15,30,0.44)", border: "1px solid rgba(169,199,223,0.12)" },
  planetFactCardCompact: { padding: "9px 10px", borderRadius: 12, background: "rgba(6,15,30,0.38)", border: "1px solid rgba(169,199,223,0.1)" },
  planetFactLabel: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9fb3cf", marginBottom: 4, fontFamily: "JetBrains Mono, monospace" },
  planetFactValue: { fontSize: 12, lineHeight: 1.3, color: "#f7fbff", fontWeight: 700 },
  planetSectionLabel: { marginTop: 2, marginBottom: 8, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b7c9df", fontFamily: "JetBrains Mono, monospace" },
  planetFootnoteRow: { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginTop: 10 },
  specializationRow: { display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" },
  specializationButton: { border: "1px solid rgba(169,199,223,0.2)", background: "rgba(7,19,38,0.46)", color: "#deebff", padding: "6px 10px", borderRadius: 999, cursor: "pointer", fontSize: 12 },
  specializationActive: { border: "1px solid rgba(242,138,91,0.44)", background: "rgba(242,138,91,0.22)", color: "#fff6da", padding: "6px 10px", borderRadius: 999, cursor: "pointer", fontSize: 12 },
  smallButton: { border: "1px solid rgba(169,199,223,0.24)", background: "rgba(18,39,71,0.74)", color: "#f6f2e8", padding: "7px 11px", borderRadius: 12, cursor: "pointer", fontWeight: 600 },
  achievementHeader: { margin: "0 0 12px", fontSize: 12, fontWeight: 800, letterSpacing: "0.24em", textTransform: "uppercase", color: "#f28a5b", fontFamily: "JetBrains Mono, monospace", padding: "2px 2px 0" },
  achievementList: { display: "flex", flexDirection: "column", gap: 10, maxHeight: "calc(100vh - 280px)", overflowY: "auto", paddingRight: 4 },
  achievementCard: { border: "1px solid rgba(169,199,223,0.14)", borderRadius: 18, background: "linear-gradient(180deg, rgba(17,31,52,0.86) 0%, rgba(10,21,39,0.86) 100%)", padding: 16, opacity: 0.78, transition: "border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease" },
  achievementUnlocked: { border: "1px solid rgba(108,181,144,0.42)", borderRadius: 18, background: "linear-gradient(180deg, rgba(19,51,43,0.78) 0%, rgba(10,27,39,0.9) 100%)", padding: 16, boxShadow: "0 18px 34px rgba(15,31,27,0.18), inset 0 0 0 1px rgba(150,229,186,0.08)", transition: "border-color 0.2s ease, background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease" },
  achievementRow: { display: "flex", alignItems: "center", gap: 14, minHeight: 52 },
  achievementTextWrap: { flex: 1, minWidth: 0 },
  achievementTitle: { marginBottom: 4, fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: "#edf4ff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  achievementTitleUnlocked: { marginBottom: 4, fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: "#f4fbff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  achievementDescription: { fontSize: 12, lineHeight: 1.5, color: "#9fb4cf" },
  achievementDescriptionUnlocked: { fontSize: 12, lineHeight: 1.5, color: "#cfe0f8" },
  achievementIconLocked: { width: 34, height: 34, minWidth: 34, borderRadius: "50%", border: "1px solid rgba(169,199,223,0.18)", background: "rgba(9,18,33,0.8)", color: "#a5b8d2", display: "grid", placeItems: "center", fontSize: 16, lineHeight: 1, opacity: 0.72 },
  achievementIconUnlocked: { width: 34, height: 34, minWidth: 34, borderRadius: "50%", border: "1px solid rgba(156,227,180,0.42)", background: "radial-gradient(circle at 35% 30%, rgba(198,255,214,0.28) 0%, rgba(88,166,118,0.22) 34%, rgba(14,31,39,0.88) 100%)", color: "#d8ffe1", display: "grid", placeItems: "center", fontSize: 16, lineHeight: 1, boxShadow: "0 0 18px rgba(55,155,95,0.18)" },
  achievementStatusMuted: { width: 22, height: 22, borderRadius: "50%", border: "1px solid rgba(169,199,223,0.12)", background: "rgba(11,21,39,0.66)", color: "transparent" },
  achievementStatusSuccess: { width: 22, height: 22, borderRadius: "50%", border: "1px solid rgba(118,201,155,0.42)", background: "linear-gradient(180deg, rgba(60,124,92,0.46) 0%, rgba(18,39,29,0.8) 100%)", color: "#d9ffe9", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800, boxShadow: "0 0 16px rgba(70,164,109,0.18)" },
  statRow: { display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(169,199,223,0.12)", padding: "10px 2px", color: "#dce7f8", fontSize: 12, lineHeight: 1.45 },
  optionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 },
  settingsGrid: { display: "grid", gap: 10, marginBottom: 14 },
  settingRow: { display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", border: "1px solid rgba(169,199,223,0.14)", background: "rgba(12,28,54,0.52)", borderRadius: 14, padding: 12 },
  textArea: { width: "100%", borderRadius: 16, border: "1px solid rgba(169,199,223,0.2)", background: "rgba(7,19,38,0.62)", color: "#f6f2e8", padding: 12, fontFamily: "JetBrains Mono, monospace", lineHeight: 1.5, fontSize: 12, marginBottom: 12 },
  systemStage: { position: "relative", height: "100%", minHeight: 0, background: "radial-gradient(circle at 48% 52%, rgba(22,47,84,0.62) 0%, rgba(9,20,40,0.72) 54%, rgba(3,7,16,0.96) 100%)", overflow: "hidden" },
  systemBackdrop: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.14) 0 1px, transparent 1.6px), radial-gradient(circle at 70% 18%, rgba(194,218,255,0.12) 0 1px, transparent 1.5px), radial-gradient(circle at 80% 70%, rgba(255,237,200,0.09) 0 1px, transparent 1.6px), radial-gradient(circle at 35% 78%, rgba(242,138,91,0.08) 0 1px, transparent 1.5px), radial-gradient(circle at 62% 56%, rgba(115,106,174,0.09) 0 1px, transparent 1.5px)", backgroundSize: "260px 260px", opacity: 0.34 },
  systemVignette: { position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 34%, rgba(2,8,18,0.58) 72%, rgba(0,0,0,0.9) 100%)", pointerEvents: "none", zIndex: 1 },
  systemOverlayGlow: { position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%, rgba(255,214,137,0.07) 0%, rgba(255,214,137,0.03) 22%, rgba(123,146,228,0.04) 44%, transparent 66%)", pointerEvents: "none", zIndex: 1 },
  starAmbientGlow: { position: "absolute", left: "50%", top: "50%", width: 760, height: 760, transform: "translate(-50%, -50%)", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,227,142,0.34) 0%, rgba(252,177,92,0.2) 22%, rgba(220,114,71,0.12) 40%, rgba(45,58,122,0.09) 56%, transparent 76%)", filter: "blur(20px)", pointerEvents: "none", zIndex: 1 },
  starAnchor: { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 20 },
  starButton: { position: "relative", zIndex: 2, width: 110, height: 110, borderRadius: "50%", border: "1px solid rgba(255,240,194,0.22)", background: "transparent", boxShadow: "0 0 34px rgba(246,218,150,0.42), 0 0 74px rgba(242,138,91,0.3), 0 0 132px rgba(246,218,150,0.2)", display: "block", cursor: "pointer", color: "#fff", padding: 0, overflow: "visible", transition: "transform 0.14s ease, box-shadow 0.14s ease, filter 0.14s ease" },
  starButtonPulse: { transform: "scale(0.93)", boxShadow: "0 0 28px rgba(246,218,150,0.8), 0 0 60px rgba(242,138,91,0.52), 0 0 104px rgba(246,218,150,0.37)", filter: "brightness(1.16)" },
  starCore: { position: "absolute", inset: "50% auto auto 50%", transform: "translate(-50%, -50%)", width: 110, height: 110, borderRadius: "50%", background: "radial-gradient(circle at 38% 34%, #fffef0 0%, #ffe8a9 28%, #f9b874 56%, #de7d4c 74%, #8e472b 100%)", boxShadow: "0 0 38px rgba(246,218,150,0.84), 0 0 84px rgba(242,138,91,0.56), 0 0 144px rgba(246,218,150,0.36)" },
  starBloom: { position: "absolute", inset: "50% auto auto 50%", transform: "translate(-50%, -50%)", width: 110, height: 110, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,238,188,0.34) 0%, rgba(255,196,102,0.18) 42%, rgba(242,138,91,0.08) 64%, transparent 78%)", filter: "blur(8px)", animation: "sun-bloom 3.4s ease-in-out infinite", pointerEvents: "none" },
  starParticlesLayer: { position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" },
  starParticle: { position: "absolute", width: 9, height: 9, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(255,221,154,0.9) 52%, rgba(242,138,91,0.32) 100%)", boxShadow: "0 0 10px rgba(255,232,184,0.6)", opacity: 0.9, animation: "sun-pulse 0.7s ease-out forwards" },
  floatingPoints: { position: "absolute", zIndex: 32, color: "#fff3c2", fontSize: 14, fontWeight: 800, letterSpacing: "0.08em", textShadow: "0 0 10px rgba(255,232,184,0.72)", animation: "float-up 0.9s ease-out forwards", pointerEvents: "none" },
  starLabel: { position: "absolute", left: "50%", top: "calc(100% + 10px)", transform: "translateX(-50%)", fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fff8df", textShadow: "0 1px 2px rgba(0,0,0,0.8)", background: "rgba(3,10,24,0.86)", border: "1px solid rgba(255,248,214,0.55)", borderRadius: 999, minWidth: 138, textAlign: "center", padding: "3px 10px", zIndex: 3 },
  orbitPlane: { position: "absolute", inset: 0, transformOrigin: "50% 50%" },
  orbitRing: { border: "1px solid rgba(173,205,255,0.34)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), 0 0 14px rgba(95,146,228,0.12)" },
  orbitRingActive: { border: "1px solid rgba(255,226,162,0.58)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08), 0 0 20px rgba(255,206,132,0.22), 0 0 36px rgba(95,146,228,0.14)" },
  planetDot: { position: "absolute", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.28)", display: "grid", placeItems: "center", cursor: "pointer", transform: "translate(-50%, -50%)", color: "#f6f2e8", background: "transparent", transition: "transform 0.18s ease, box-shadow 0.18s ease" },
  planetNameAnchor: { position: "absolute", transform: "translateX(-50%)", transformOrigin: "center center" },
  planetName: { fontSize: 11, fontWeight: 800, letterSpacing: "0.012em", color: "#fbfdff", textShadow: "0 1px 2px rgba(0,0,0,0.85)", textAlign: "center", whiteSpace: "nowrap", background: "rgba(3,10,24,0.88)", border: "1px solid rgba(169,199,223,0.42)", borderRadius: 999, minWidth: 78, padding: "2px 7px", transformOrigin: "center center" },
  planetEvolutionWave: { position: "absolute", inset: -10, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,239,191,0.36) 0%, rgba(118,190,255,0.2) 32%, rgba(77,150,255,0.08) 58%, transparent 76%)", animation: "planet-evolution-wave 1.45s ease-out forwards", pointerEvents: "none" },
  planetEvolutionLabelAnchor: { position: "absolute", zIndex: 9, pointerEvents: "none" },
  planetEvolutionLabel: { padding: "4px 10px", borderRadius: 999, border: "1px solid rgba(255,229,173,0.62)", background: "linear-gradient(180deg, rgba(9,20,40,0.94) 0%, rgba(6,14,29,0.86) 100%)", color: "#fff4cf", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap", textShadow: "0 1px 2px rgba(0,0,0,0.8)", boxShadow: "0 10px 26px rgba(0,0,0,0.28), 0 0 18px rgba(255,214,136,0.18)", animation: "stage-rise 1.8s ease-out forwards" },
  planetSub: { fontSize: 12, fontWeight: 700, color: "rgba(250,253,255,1)", textShadow: "0 1px 2px rgba(0,0,0,0.82)", background: "rgba(3,10,24,0.88)", border: "1px solid rgba(169,199,223,0.34)", borderRadius: 999, minWidth: 120, textAlign: "center", padding: "2px 9px" },
  systemHud: { position: "absolute", left: 18, bottom: 18, zIndex: 2, padding: "10px 12px", borderRadius: 16, background: "rgba(7,19,38,0.72)", border: "1px solid rgba(169,199,223,0.16)", color: "#d4deee", fontSize: 12, lineHeight: 1.6, pointerEvents: "none", boxShadow: "0 16px 48px rgba(0,0,0,0.28)" },
  systemAddPlanetButton: { position: "absolute", right: 18, top: 18, zIndex: 4, border: "1px solid rgba(255,232,172,0.7)", background: "linear-gradient(180deg, rgba(255,201,115,0.24), rgba(242,138,91,0.18))", color: "#fff8e0", padding: "10px 14px", borderRadius: 999, cursor: "pointer", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11, boxShadow: "0 12px 32px rgba(0,0,0,0.24)" },
  eventCard: { position: "absolute", right: 18, top: 18, zIndex: 3, maxWidth: 320, padding: 14, borderRadius: 18, background: "rgba(18,39,71,0.82)", border: "1px solid rgba(242,138,91,0.25)", boxShadow: "0 20px 80px rgba(0,0,0,0.35)" },
      systemPopulationHud: { position: "absolute", left: 18, top: 18, zIndex: 3, minWidth: 180, padding: 12, borderRadius: 16, background: "rgba(7,19,38,0.7)", border: "1px solid rgba(169,199,223,0.12)", boxShadow: "0 16px 60px rgba(0,0,0,0.32)", pointerEvents: "none" },
    systemPopulationTitle: { fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c2d3ea", marginBottom: 4, fontFamily: "JetBrains Mono, monospace" },
    systemPopulationValue: { fontSize: 18, fontWeight: 700, color: "#f6f2e8", lineHeight: 1.1 },
    systemPopulationRate: { fontSize: 11, color: "#d4deee", marginTop: 4 },
  cosmicStatusHUD: { position: "absolute", right: 18, top: 18, zIndex: 4, width: 180, maxWidth: "calc(100% - 36px)", padding: "9px 12px 10px", borderRadius: 14, border: "1px solid rgba(155,177,214,0.18)", background: "rgba(8,17,31,0.38)", backdropFilter: "blur(10px)", boxShadow: "0 10px 24px rgba(0,0,0,0.18)", transition: "border-color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease" },
  cosmicStatusLabel: { fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#98a5bb", fontFamily: "JetBrains Mono, monospace", marginBottom: 5 },
  cosmicStatusRow: { display: "flex", alignItems: "center", gap: 8, minHeight: 18 },
  cosmicStatusGlyphNeutral: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 8, height: 8, borderRadius: "50%", background: "#62d89d", boxShadow: "0 0 10px rgba(98,216,157,0.38)", fontSize: 8, color: "#62d89d", lineHeight: 1 },
  cosmicStatusGlyphEvent: { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 8, height: 8, borderRadius: "50%", background: "transparent", color: "#f3b070", fontSize: 10, lineHeight: 1, boxShadow: "0 0 10px rgba(243,176,112,0.2)" },
  cosmicStatusTextNeutral: { fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#edf3ff", fontWeight: 700, fontFamily: "JetBrains Mono, monospace" },
  cosmicStatusTextEvent: { fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f6f3eb", fontWeight: 700, fontFamily: "JetBrains Mono, monospace" },
  cosmicAddPlanetButton: { marginTop: 8, width: "100%", border: "1px solid rgba(255,214,145,0.48)", background: "linear-gradient(180deg, rgba(255,194,102,0.96) 0%, rgba(242,138,91,0.9) 100%)", color: "#fffdf8", borderRadius: 999, padding: "7px 10px", fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 0 0 1px rgba(255,229,182,0.14), 0 8px 20px rgba(242,138,91,0.18), 0 0 16px rgba(255,187,96,0.2)", transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease", display: "block", textAlign: "center" },
  eventChoiceButton: { textAlign: "left", padding: 12, borderRadius: 14, border: "1px solid rgba(169,199,223,0.12)", background: "rgba(7,19,38,0.46)", color: "#f6f2e8", cursor: "pointer", flex: "1 1 135px", transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, filter 0.18s ease", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.01)" },
  eventChoiceButtonPrimary: { textAlign: "left", padding: 12, borderRadius: 16, border: "1px solid rgba(255,214,145,0.58)", background: "linear-gradient(180deg, rgba(255,194,102,0.96) 0%, rgba(242,138,91,0.9) 100%)", color: "#fffdf8", cursor: "pointer", flex: "1 1 135px", boxShadow: "0 0 0 1px rgba(255,229,182,0.18), 0 12px 28px rgba(242,138,91,0.2), 0 0 18px rgba(255,187,96,0.24)", transform: "translateY(-1px)", transition: "transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease, opacity 0.18s ease", animation: "event-button-glow 2.8s ease-in-out 0.2s 1" },
  eventChoiceButtonPrimaryHover: { transform: "translateY(-2px) scale(1.02)", boxShadow: "0 0 0 1px rgba(255,229,182,0.22), 0 14px 30px rgba(242,138,91,0.24), 0 0 22px rgba(255,187,96,0.28)", filter: "brightness(1.04)" },
  eventChoiceButtonPrimaryPressed: { transform: "translateY(0) scale(0.99)", boxShadow: "0 0 0 1px rgba(255,229,182,0.18), 0 8px 20px rgba(242,138,91,0.18), 0 0 16px rgba(255,187,96,0.16)", filter: "brightness(0.96)" },
  eventChoiceTitle: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  eventChoiceTitlePrimary: { fontSize: 13, fontWeight: 800, marginBottom: 4, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fffaf0" },
  eventChoiceMeta: { fontSize: 10, lineHeight: 1.45, color: "#9eacc1" },
  eventChoiceMetaPrimary: { fontSize: 10, lineHeight: 1.45, color: "rgba(255,248,234,0.86)", fontWeight: 600 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.58)", display: "grid", placeItems: "center", zIndex: 10, padding: 16 },
  overlayPanel: { width: "min(960px, calc(100vw - 24px))", maxHeight: "min(90vh, 900px)", overflow: "auto", borderRadius: 24, background: "rgba(8,16,31,0.94)", border: "1px solid rgba(169,199,223,0.12)", boxShadow: "0 40px 120px rgba(0,0,0,0.45)", padding: 18 },
  overlayHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 },
};

export default App;
