import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Toaster, toast } from "sonner";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
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
import type { GameStateData, Planet, TabId } from "@/types/game";
import stationBg from "@/imports/download__78_.jpg";
import spaceFieldBg from "@/imports/OwO.jpg";

type Screen = "start" | "game";

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

function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(null);
  const saveSystem = useSaveSystem(screen === "game");
  useGameLoop(screen === "game");
  const preview = useMemo(() => readPreviewSave(), [screen]);

  const beginNewGame = () => {
    if (hasStoredSave() && !window.confirm("Start a new system and overwrite the current save?")) return;
    useGameStore.getState().newGame();
    saveSystem.saveNow();
    setOfflineSummary(null);
    setScreen("game");
  };

  const continueGame = () => {
    const summary = saveSystem.loadSave();
    if (!summary) return;
    setOfflineSummary(summary);
    setScreen("game");
  };

  return (
    <>
      <Toaster position="top-right" richColors />
      {screen === "start" ? (
        <StartScreen
          continueAvailable={hasStoredSave()}
          preview={preview}
          onNewGame={beginNewGame}
          onContinue={continueGame}
        />
      ) : (
        <GameScreen
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
  onNewGame,
  onContinue,
  continueAvailable,
  preview,
}: {
  onNewGame: () => void;
  onContinue: () => void;
  continueAvailable: boolean;
  preview: GameStateData | null;
}) {
  return (
    <div style={styles.startRoot}>
      <ImageWithFallback
        src={stationBg}
        alt="Futuristic space observation room with a large window looking out at a planet"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "saturate(0.95) brightness(0.62) contrast(1.03)",
          transform: "scale(1.04)",
          transformOrigin: "center center",
          objectPosition: "center center",
        }}
      />
      <div style={styles.startBackdrop} />
      <div style={styles.startGlow} />
      <div style={styles.startStatusLeft}>OBSERVATION SYSTEM ONLINE</div>
      <div style={styles.startStatusRight}>
        <div style={styles.statusTitle}>SYSTEM STATUS</div>
        <div style={styles.statusGrid}>
          <span>LAST SAVE</span><span>{preview ? formatDuration(preview.lastSaveTime ? Date.now() - preview.lastSaveTime : 0) : "—"}</span>
          <span>SYSTEM NAME</span><span>Sol Prime</span>
          <span>PLAYTIME</span><span>{preview ? formatDuration(preview.stats.playTimeMs) : "00:00:00"}</span>
          <span>EVOLUTION</span><span>{preview ? `${Math.min(100, Math.round((preview.rebirthCount / 3) * 100))}%` : "0%"}</span>
        </div>
      </div>
      <div style={styles.startPanel}>
        <div style={styles.kicker}>Observation system online</div>
        <h1 style={styles.title}>Stellar Genesis</h1>
        <p style={styles.subtitle}>Shape a star system, grow civilizations, and rebirth into stronger star classes.</p>
        <div style={styles.startButtons}>
          <button style={styles.primaryButton} onClick={onNewGame}>Begin New System</button>
          <button style={{ ...styles.secondaryButton, opacity: continueAvailable ? 1 : 0.45 }} disabled={!continueAvailable} onClick={onContinue}>
            Continue Evolution
          </button>
        </div>
        <div style={styles.previewGrid}>
          <PreviewStat label="Playtime" value={preview ? formatDuration(preview.stats.playTimeMs) : "00:00:00"} />
          <PreviewStat label="Rebirths" value={preview ? String(preview.rebirthCount) : "0"} />
          <PreviewStat label="Total Earned" value={preview ? formatCompact(preview.totalEarned) : "0"} />
          <PreviewStat label="Planets" value={preview ? String(preview.planets.length) : "1"} />
        </div>
      </div>
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
  saveSystem,
  offlineSummary,
  onClearOfflineSummary,
  onBackToStart,
}: {
  saveSystem: ReturnType<typeof useSaveSystem>;
  offlineSummary: OfflineSummary | null;
  onClearOfflineSummary: () => void;
  onBackToStart: () => void;
}) {
  const state = useGameStore();
  const production = useMemo(() => computeProduction(state), [state]);
  const selectedPlanet = state.planets.find((planet) => planet.id === state.selectedTarget) ?? null;
  const activeTabLabel = NAV_TABS.find((tab) => tab.id === state.activeTab)?.label ?? "System";
  const [showSettings, setShowSettings] = useState(false);
  const [showPlanetPicker, setShowPlanetPicker] = useState(false);
  const [showPrestigeConfirm, setShowPrestigeConfirm] = useState(false);
  const [saveText, setSaveText] = useState("");

  useEffect(() => {
    if (offlineSummary) {
      toast.success(`Welcome back. Gained ${formatCompact(offlineSummary.energyGained)} energy while away.`);
    }
  }, [offlineSummary]);

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
    <div style={styles.gameRoot}>
      <TopBar state={state} production={production} onBackToStart={onBackToStart} onOpenSettings={() => setShowSettings(true)} />
      <div style={styles.mainGrid}>
        <nav style={styles.navRail}>
          {NAV_TABS.map((tab) => (
            <button key={tab.id} onClick={() => useGameStore.getState().setActiveTab(tab.id)} style={tab.id === state.activeTab ? styles.navActive : styles.navButton}>
              {tab.label}
            </button>
          ))}
        </nav>

        <section style={styles.centerPanel}>
          <SolarSystem
            state={state}
            selectedPlanet={selectedPlanet}
            onClickStar={() => {
              useGameStore.getState().selectTarget("star");
              useGameStore.getState().clickStar();
            }}
            onSelectPlanet={(id) => useGameStore.getState().selectTarget(id)}
          />
          {state.currentEvent ? <EventCard eventId={state.currentEvent.eventId} onChoose={(choiceId) => {
            const result = useGameStore.getState().resolveEventChoice(choiceId);
            if (!result.ok) toast.error(result.reason);
          }} /> : null}
          {offlineSummary ? (
            <Overlay title="Welcome back" onClose={onClearOfflineSummary}>
              <div style={styles.sectionCopy}>Offline progress has been applied.</div>
              <div style={styles.previewGrid}>
                <PreviewStat label="Energy gained" value={formatCompact(offlineSummary.energyGained)} />
              </div>
            </Overlay>
          ) : null}
        </section>

        <aside style={styles.sidePanel}>
          <div style={styles.sideHeader}>{activeTabLabel}</div>
          {state.activeTab === "system" ? (
            <PanelScroll>
              <div style={styles.sectionCopy}>
                {selectedPlanet ? `Selected planet: ${selectedPlanet.name}` : `Selected star: ${getStarClass(state.starClassId).name}`}
              </div>
              {selectedPlanet ? (
                <PlanetDetailCard planet={selectedPlanet} state={state} onEvolve={evolvePlanet} onSpecialize={specializePlanet} />
              ) : (
                <div style={styles.sectionCopy}>The star is the core of the system. Click it for energy and use upgrades to increase its output.</div>
              )}
              {UPGRADES.map((upgrade) => {
                const owned = state.upgrades[upgrade.id] ?? 0;
                const cost = getUpgradeCost(upgrade.id, owned);
                const unlocked = state.totalEarned >= (upgrade.unlockTotalEarned ?? 0);
                return unlocked ? <ActionCard key={upgrade.id} title={upgrade.name} desc={upgrade.description} meta={upgrade.category} enabled={state.energy >= cost} onClick={() => buyUpgrade(upgrade.id)} right={`${formatCompact(cost)} energy`} /> : null;
              })}
            </PanelScroll>
          ) : null}

          {state.activeTab === "planets" ? (
            <PanelScroll>
              <ActionCard title="Create planet" desc={`Choose a world type. Cost ${formatCompact(getPlanetCost(state.planets.length))} energy.`} meta={`${state.planets.length}/${BALANCE.maxPlanets} planets`} enabled={state.energy >= getPlanetCost(state.planets.length) && state.planets.length < BALANCE.maxPlanets} onClick={() => setShowPlanetPicker(true)} />
              {state.planets.map((planet) => (
                <PlanetListCard
                  key={planet.id}
                  planet={planet}
                  state={state}
                  onSelect={() => useGameStore.getState().selectTarget(planet.id)}
                  onEvolve={evolvePlanet}
                  onSpecialize={specializePlanet}
                />
              ))}
            </PanelScroll>
          ) : null}

          {state.activeTab === "upgrades" ? (
            <PanelScroll>
              <div style={styles.sectionCopy}>Upgrade categories improve click power, passive energy, and planetary growth.</div>
              {UPGRADES.map((upgrade) => {
                const owned = state.upgrades[upgrade.id] ?? 0;
                const cost = getUpgradeCost(upgrade.id, owned);
                const unlocked = state.totalEarned >= (upgrade.unlockTotalEarned ?? 0);
                return unlocked ? <ActionCard key={upgrade.id} title={upgrade.name} desc={upgrade.description} meta={upgrade.category} enabled={state.energy >= cost} onClick={() => buyUpgrade(upgrade.id)} right={`${formatCompact(cost)} energy`} /> : null;
              })}
            </PanelScroll>
          ) : null}

          {state.activeTab === "research" ? (
            <PanelScroll>
              {RESEARCH_NODES.map((node) => {
                const cost = getResearchCost(node.id, state.research[node.id] ? 1 : 0);
                const available = node.prerequisites.every((prerequisite) => state.research[prerequisite]);
                return <ActionCard key={node.id} title={node.name} desc={node.description} meta={`${node.branch} | ${available ? "Available" : "Locked"}`} enabled={available && state.researchData >= cost && !state.research[node.id]} onClick={() => buyResearch(node.id)} right={`${formatCompact(cost)} research`} />;
              })}
            </PanelScroll>
          ) : null}

          {state.activeTab === "automation" ? (
            <PanelScroll>
              {AUTOMATION_NODES.map((node) => {
                const level = state.automation[node.id] ?? 0;
                const cost = getAutomationCost(node.id, level);
                return <ActionCard key={node.id} title={`${node.name}${level ? ` Lv.${level}` : ""}`} desc={node.description} meta={node.branch} enabled={state.researchData >= cost} onClick={() => buyAutomation(node.id)} right={`${formatCompact(cost)} research`} />;
              })}
            </PanelScroll>
          ) : null}

          {state.activeTab === "achievements" ? (
            <PanelScroll>
              {ACHIEVEMENTS.map((achievement) => (
                <div key={achievement.id} style={state.achievements[achievement.id] ? styles.achievementUnlocked : styles.achievementCard}>
                  <div style={styles.cardTitle}>{achievement.name}</div>
                  <div style={styles.cardMeta}>{achievement.description}</div>
                </div>
              ))}
            </PanelScroll>
          ) : null}

          {state.activeTab === "prestige" ? (
            <PanelScroll>
              <div style={styles.sectionCopy}>Prestige converts total earned energy into cosmic essence and resets the active run.</div>
              <ActionCard title="Stellar Rebirth" desc={`Gain ${getPrestigeEssenceGain(state.totalEarned)} cosmic essence.`} meta={state.totalEarned >= BALANCE.prestigeThreshold ? "Available" : `Need ${formatCompact(BALANCE.prestigeThreshold)} total earned`} enabled={state.totalEarned >= BALANCE.prestigeThreshold} onClick={() => setShowPrestigeConfirm(true)} />
              {PRESTIGE_UPGRADES.map((upgrade) => {
                const level = state.prestigeUpgrades[upgrade.id] ?? 0;
                const cost = getPrestigeUpgradeCost(upgrade.id, level);
                return <ActionCard key={upgrade.id} title={`${upgrade.name}${level ? ` Lv.${level}` : ""}`} desc={upgrade.description} meta={upgrade.branch} enabled={state.cosmicEssence >= cost} onClick={() => useGameStore.getState().buyPrestigeUpgrade(upgrade.id)} right={`${cost} essence`} />;
              })}
              <div style={{ ...styles.sectionCopy, marginTop: 8 }}>Star class: {getStarClass(state.starClassId).name}</div>
              {STAR_CLASSES.map((starClass) => (
                <ActionCard key={starClass.id} title={starClass.name} desc={starClass.description} meta={starClass.branch} enabled={state.rebirthCount >= starClass.unlockRebirths} onClick={() => useGameStore.getState().setStarClass(starClass.id)} right={state.starClassId === starClass.id ? "Selected" : undefined} />
              ))}
            </PanelScroll>
          ) : null}

          {state.activeTab === "stats" ? (
            <PanelScroll>
              <StatRow label="Energy" value={formatNumber(state.energy, state.settings.numberFormat)} />
              <StatRow label="Total Earned" value={formatNumber(state.totalEarned, state.settings.numberFormat)} />
              <StatRow label="Biomass" value={formatNumber(state.biomass, state.settings.numberFormat)} />
              <StatRow label="Research" value={formatNumber(state.researchData, state.settings.numberFormat)} />
              <StatRow label="Population" value={formatNumber(state.population, state.settings.numberFormat)} />
              <StatRow label="Cosmic Essence" value={formatNumber(state.cosmicEssence, state.settings.numberFormat)} />
              <StatRow label="Playtime" value={formatDuration(state.stats.playTimeMs)} />
              <StatRow label="Rebirths" value={String(state.rebirthCount)} />
            </PanelScroll>
          ) : null}
        </aside>
      </div>

      {showPlanetPicker ? (
        <Overlay title="Choose planet type" onClose={() => setShowPlanetPicker(false)}>
          <div style={styles.optionGrid}>
            {PLANET_TYPES.map((planetType) => {
              const cost = getPlanetCost(state.planets.length, planetType.id);
              return <ActionCard key={planetType.id} title={planetType.name} desc={planetType.description} meta={`${formatCompact(cost)} energy`} enabled={state.energy >= cost && state.planets.length < BALANCE.maxPlanets} onClick={() => buyPlanet(planetType.id)} />;
            })}
          </div>
        </Overlay>
      ) : null}

      {showSettings ? (
        <Overlay title="Settings and save management" onClose={() => setShowSettings(false)}>
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
        <Overlay title="Confirm Stellar Rebirth" onClose={() => setShowPrestigeConfirm(false)}>
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
}: {
  planet: Planet;
  state: GameStateData;
  onEvolve: (planetId: string) => void;
  onSpecialize: (planetId: string, specializationId: string) => void;
}) {
  const type = getPlanetType(planet.typeId);
  const stage = getStage(planet.stage);
  const evolveCost = getEvolveCost(planet.stage, planet.orbitIndex);
  const specialization = planet.specializationId ? getSpecialization(planet.specializationId) : null;
  return (
    <div style={styles.planetDetailCard}>
      <div style={styles.planetHeader}>
        <div>
          <div style={styles.cardTitle}>{planet.name}</div>
          <div style={styles.cardMeta}>{type.name} | {stage.name}</div>
        </div>
        <button style={styles.smallButton} onClick={() => onEvolve(planet.id)}>Evolve</button>
      </div>
      <div style={styles.cardMeta}>{stage.description}</div>
      <div style={styles.cardMeta}>Evolve cost: {formatCompact(evolveCost)} energy</div>
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
      <div style={styles.cardMeta}>Current specialization: {specialization?.name ?? "None"}</div>
      <div style={styles.cardMeta}>Production bonus: {formatNumber(stage.passiveBonus, state.settings.numberFormat)}</div>
    </div>
  );
}

function PlanetListCard({
  planet,
  state,
  onSelect,
  onEvolve,
  onSpecialize,
}: {
  planet: Planet;
  state: GameStateData;
  onSelect: () => void;
  onEvolve: (planetId: string) => void;
  onSpecialize: (planetId: string, specializationId: string) => void;
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
      <div style={styles.cardMeta}>{stage.description}</div>
      <div style={styles.specializationRow}>
        {SPECIALIZATIONS.map((specialization) => (
          <button key={specialization.id} style={planet.specializationId === specialization.id ? styles.specializationActive : styles.specializationButton} onClick={(event) => { event.stopPropagation(); onSpecialize(planet.id, specialization.id); }}>
            {specialization.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function EventCard({ eventId, onChoose }: { eventId: string; onChoose: (choiceId: string) => void }) {
  const event = getEvent(eventId);
  return (
    <div style={styles.eventCard}>
      <div style={styles.cardTitle}>{event.name}</div>
      <div style={styles.cardMeta}>{event.description}</div>
      <div style={styles.actionRow}>
        {event.choices.map((choice) => (
          <button key={choice.id} style={styles.smallButton} onClick={() => onChoose(choice.id)}>{choice.label}</button>
        ))}
      </div>
    </div>
  );
}

function Overlay({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.overlayPanel}>
        <div style={styles.overlayHeader}>
          <div style={styles.cardTitle}>{title}</div>
          <button style={styles.smallButton} onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SolarSystem({
  state,
  selectedPlanet,
  onClickStar,
  onSelectPlanet,
}: {
  state: GameStateData;
  selectedPlanet: Planet | null;
  onClickStar: () => void;
  onSelectPlanet: (id: string) => void;
}) {
  const starClass = getStarClass(state.starClassId);
  return (
    <div style={styles.systemStage}>
      <ImageWithFallback
        src={spaceFieldBg}
        alt="Deep space star field"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "saturate(0.9) brightness(0.82) contrast(1.02)",
          opacity: 0.8,
          transform: "scale(1.08)",
          transformOrigin: "center center",
          objectPosition: "center center",
        }}
      />
      <div style={styles.systemBackdrop} />
      <div style={styles.starAnchor}>
        <button style={styles.starButton} onClick={onClickStar} aria-label="Click the star to generate energy">
          <div style={styles.starCore} />
          <div style={styles.starLabel}>{starClass.name}</div>
          <div style={styles.starMeta}>{formatCompact(state.energy)} energy</div>
        </button>
      </div>
      {state.planets.map((planet, index) => {
        const type = getPlanetType(planet.typeId);
        const orbitRadius = 16 + planet.orbitIndex * 10;
        const angle = planet.angle + index * 27;
        const x = 50 + Math.cos((angle * Math.PI) / 180) * orbitRadius;
        const y = 50 + Math.sin((angle * Math.PI) / 180) * orbitRadius * 0.62;
        return (
          <button
            key={planet.id}
            style={{ ...styles.planetDot, left: `${x}%`, top: `${y}%`, background: type.color, boxShadow: selectedPlanet?.id === planet.id ? `0 0 24px ${type.color}` : `0 0 12px ${type.color}66` }}
            onClick={() => onSelectPlanet(planet.id)}
          >
            <div style={styles.planetName}>{planet.name}</div>
            <div style={styles.planetSub}>{getStage(planet.stage).name}</div>
          </button>
        );
      })}
      <div style={styles.systemHud}>
        <div>Selected: {selectedPlanet ? selectedPlanet.name : "Star"}</div>
        <div>Click power: {formatCompact(computeProduction(state).clickPower)}</div>
      </div>
    </div>
  );
}

function TopBar({
  state,
  production,
  onOpenSettings,
  onBackToStart,
}: {
  state: GameStateData;
  production: ReturnType<typeof computeProduction>;
  onOpenSettings: () => void;
  onBackToStart: () => void;
}) {
  return (
    <header style={styles.topBar}>
      <div>
        <div style={styles.kicker}>Stellar Genesis</div>
        <div style={styles.topBarTitle}>Energy {formatNumber(state.energy, state.settings.numberFormat)}</div>
      </div>
      <div style={styles.resourceStrip}>
        <span>EPS {formatNumber(production.energyPerSecond, state.settings.numberFormat)}</span>
        <span>Biomass {formatNumber(state.biomass, state.settings.numberFormat)}</span>
        <span>Research {formatNumber(state.researchData, state.settings.numberFormat)}</span>
        <span>Population {formatNumber(state.population, state.settings.numberFormat)}</span>
        <span>Essence {formatNumber(state.cosmicEssence, state.settings.numberFormat)}</span>
      </div>
      <div style={styles.actionRow}>
        <button style={styles.secondaryButton} onClick={onBackToStart}>Start</button>
        <button style={styles.secondaryButton} onClick={onOpenSettings}>Settings</button>
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

const styles: Record<string, CSSProperties> = {
  startRoot: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    position: "relative",
    overflow: "hidden",
    background: "radial-gradient(circle at 50% 30%, rgba(24,45,85,0.15) 0%, rgba(9,19,37,0.68) 40%, rgba(4,7,13,0.92) 100%)",
    color: "#f6f2e8",
    fontFamily: "Inter, sans-serif",
  },
  startBackdrop: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(160deg, rgba(7,19,38,0.55) 0%, rgba(19,39,71,0.45) 50%, rgba(7,19,38,0.7) 100%)",
  },
  startGlow: {
    position: "absolute",
    width: 700,
    height: 700,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(115,106,174,0.25) 0%, rgba(242,138,91,0.12) 25%, transparent 70%)",
    filter: "blur(20px)",
  },
  startPanel: {
    position: "relative",
    zIndex: 1,
    width: "min(720px, calc(100vw - 32px))",
    padding: 32,
    borderRadius: 24,
    border: "1px solid rgba(169,199,223,0.12)",
    background: "rgba(8,16,31,0.18)",
    backdropFilter: "blur(2px)",
    boxShadow: "none",
  },
  kicker: { letterSpacing: "0.28em", fontSize: 11, color: "#9eacc1", textTransform: "uppercase", fontFamily: "JetBrains Mono, monospace" },
  title: { margin: "14px 0 10px", fontSize: "clamp(3rem, 7vw, 5rem)", lineHeight: 0.95, letterSpacing: "0.08em", fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, textShadow: "0 2px 40px rgba(242,138,91,0.3), 0 0 80px rgba(115,106,174,0.25)" },
  subtitle: { maxWidth: 560, color: "#d4deee", lineHeight: 1.7, marginBottom: 28, fontFamily: "Inter, sans-serif", fontWeight: 300 },
  startButtons: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 },
  primaryButton: { border: "1px solid #f28a5b", background: "rgba(242,138,91,0.12)", color: "#f28a5b", padding: "12px 18px", borderRadius: 4, cursor: "pointer", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "Space Grotesk, sans-serif" },
  secondaryButton: { border: "1px solid rgba(169,199,223,0.2)", background: "transparent", color: "#9eacc1", padding: "12px 18px", borderRadius: 4, cursor: "pointer", fontFamily: "Inter, sans-serif" },
  dangerButton: { border: "1px solid rgba(255,116,116,0.28)", background: "rgba(110,34,34,0.35)", color: "#ffd7d7", padding: "12px 18px", borderRadius: 14, cursor: "pointer" },
  previewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 },
  previewStat: { padding: 14, borderRadius: 16, background: "rgba(12,28,54,0.66)", border: "1px solid rgba(169,199,223,0.1)" },
  previewLabel: { fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "#9eacc1", marginBottom: 6 },
  previewValue: { fontSize: 16, color: "#f6f2e8" },
  gameRoot: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "#071326", color: "#f6f2e8", fontFamily: "Inter, sans-serif" },
  topBar: { display: "flex", gap: 18, alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderBottom: "1px solid rgba(169,199,223,0.1)", background: "rgba(7,19,38,0.82)", backdropFilter: "blur(12px)", fontFamily: "JetBrains Mono, monospace" },
  topBarTitle: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  resourceStrip: { display: "flex", gap: 14, flexWrap: "wrap", color: "#d4deee", fontSize: 13 },
  actionRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  mainGrid: { display: "grid", gridTemplateColumns: "56px minmax(0, 1fr) 280px", minHeight: 0, flex: 1 },
  navRail: { display: "flex", flexDirection: "column", gap: 4, paddingTop: 16, alignItems: "center", borderRight: "1px solid rgba(169,199,223,0.08)", background: "rgba(7,19,38,0.58)" },
  navButton: { border: "1px solid transparent", background: "transparent", color: "#59677d", padding: "8px 4px", borderRadius: 4, cursor: "pointer", textAlign: "center", width: 40, fontSize: 10, fontFamily: "JetBrains Mono, monospace", opacity: 0.35 },
  navActive: { border: "1px solid rgba(242,138,91,0.35)", background: "rgba(242,138,91,0.12)", color: "#f28a5b", padding: "8px 4px", borderRadius: 4, cursor: "pointer", textAlign: "center", width: 40, fontSize: 10, fontFamily: "JetBrains Mono, monospace", boxShadow: "0 0 10px rgba(242,138,91,0.25)" },
  centerPanel: { position: "relative", minHeight: 0, overflow: "hidden" },
  sidePanel: { display: "flex", flexDirection: "column", minHeight: 0, borderLeft: "1px solid rgba(169,199,223,0.08)", background: "rgba(7,19,38,0.74)" },
  sideHeader: { padding: 16, borderBottom: "1px solid rgba(169,199,223,0.08)", letterSpacing: "0.16em", textTransform: "uppercase", color: "#f28a5b", fontSize: 11, fontFamily: "Space Grotesk, sans-serif" },
  panelScroll: { padding: 14, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", minHeight: 0 },
  actionCard: { textAlign: "left", padding: 14, borderRadius: 18, border: "1px solid rgba(242,138,91,0.22)", background: "rgba(18,39,71,0.56)", color: "#f6f2e8", cursor: "pointer" },
  actionCardDisabled: { textAlign: "left", padding: 14, borderRadius: 18, border: "1px solid rgba(169,199,223,0.1)", background: "rgba(12,28,54,0.4)", color: "#9eacc1", opacity: 0.55, cursor: "not-allowed" },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 6 },
  cardMeta: { fontSize: 12, color: "#9eacc1", lineHeight: 1.5 },
  sectionCopy: { color: "#d4deee", fontSize: 13, lineHeight: 1.7, padding: "0 2px" },
  planetCard: { border: "1px solid rgba(169,199,223,0.1)", borderRadius: 18, background: "rgba(12,28,54,0.48)", padding: 14, cursor: "pointer" },
  planetCardActive: { border: "1px solid rgba(242,138,91,0.3)", borderRadius: 18, background: "rgba(242,138,91,0.08)", padding: 14, cursor: "pointer" },
  planetDetailCard: { border: "1px solid rgba(169,199,223,0.1)", borderRadius: 18, background: "rgba(12,28,54,0.48)", padding: 14 },
  planetHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" },
  specializationRow: { display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" },
  specializationButton: { border: "1px solid rgba(169,199,223,0.12)", background: "rgba(7,19,38,0.34)", color: "#d4deee", padding: "6px 10px", borderRadius: 999, cursor: "pointer", fontSize: 12 },
  specializationActive: { border: "1px solid rgba(242,138,91,0.35)", background: "rgba(242,138,91,0.16)", color: "#fff1c7", padding: "6px 10px", borderRadius: 999, cursor: "pointer", fontSize: 12 },
  smallButton: { border: "1px solid rgba(169,199,223,0.16)", background: "rgba(18,39,71,0.6)", color: "#f6f2e8", padding: "7px 11px", borderRadius: 12, cursor: "pointer" },
  achievementCard: { border: "1px solid rgba(169,199,223,0.1)", borderRadius: 18, background: "rgba(12,28,54,0.42)", padding: 14 },
  achievementUnlocked: { border: "1px solid rgba(110,169,139,0.3)", borderRadius: 18, background: "rgba(110,169,139,0.08)", padding: 14 },
  statRow: { display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(169,199,223,0.08)", padding: "10px 2px", color: "#d4deee" },
  optionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 },
  settingsGrid: { display: "grid", gap: 10, marginBottom: 14 },
  settingRow: { display: "flex", justifyContent: "space-between", gap: 14, alignItems: "center", border: "1px solid rgba(169,199,223,0.1)", background: "rgba(12,28,54,0.4)", borderRadius: 14, padding: 12 },
  textArea: { width: "100%", borderRadius: 16, border: "1px solid rgba(169,199,223,0.15)", background: "rgba(7,19,38,0.5)", color: "#f6f2e8", padding: 12, fontFamily: "JetBrains Mono, monospace", marginBottom: 12 },
  systemStage: { position: "relative", height: "100%", minHeight: 0, background: "radial-gradient(circle at center, rgba(18,39,71,0.35) 0%, rgba(7,19,38,0.92) 55%, rgba(2,5,12,1) 100%)", overflow: "hidden" },
  systemBackdrop: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.45) 0 1px, transparent 1.5px), radial-gradient(circle at 70% 18%, rgba(255,255,255,0.28) 0 1px, transparent 1.5px), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.25) 0 1px, transparent 1.5px)", backgroundSize: "220px 220px", opacity: 0.55 },
  starAnchor: { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 2 },
  starButton: { width: 180, height: 180, borderRadius: "50%", border: "none", background: "transparent", color: "#fff", display: "grid", placeItems: "center", cursor: "pointer", boxShadow: "none" },
  starCore: { width: 86, height: 86, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,241,199,1) 35%, rgba(242,138,91,0.9) 60%, transparent 85%)", boxShadow: "0 0 28px rgba(255,241,199,0.8)" },
  starLabel: { marginTop: 8, fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" },
  starMeta: { fontSize: 12, color: "#d4deee", marginTop: 4 },
  planetDot: { position: "absolute", width: 86, height: 86, borderRadius: "50%", border: "none", display: "grid", placeItems: "center", cursor: "pointer", transform: "translate(-50%, -50%)", color: "#f6f2e8", background: "transparent" },
  planetName: { fontSize: 10, fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.5)" },
  planetSub: { fontSize: 9, color: "rgba(255,255,255,0.86)", textShadow: "0 1px 2px rgba(0,0,0,0.5)" },
  systemHud: { position: "absolute", left: 18, bottom: 18, zIndex: 2, padding: "10px 12px", borderRadius: 16, background: "rgba(7,19,38,0.7)", border: "1px solid rgba(169,199,223,0.12)", color: "#d4deee", fontSize: 12, lineHeight: 1.6 },
  eventCard: { position: "absolute", right: 18, top: 18, zIndex: 3, maxWidth: 320, padding: 14, borderRadius: 18, background: "rgba(18,39,71,0.82)", border: "1px solid rgba(242,138,91,0.25)", boxShadow: "0 20px 80px rgba(0,0,0,0.35)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.58)", display: "grid", placeItems: "center", zIndex: 10, padding: 16 },
  overlayPanel: { width: "min(960px, calc(100vw - 24px))", maxHeight: "min(90vh, 900px)", overflow: "auto", borderRadius: 24, background: "rgba(8,16,31,0.94)", border: "1px solid rgba(169,199,223,0.12)", boxShadow: "0 40px 120px rgba(0,0,0,0.45)", padding: 18 },
  overlayHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 },
};

export default App;
