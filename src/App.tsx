import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import {
  MILESTONES,
  buildRunConfig,
  connectCrazyDataStorage,
  dailyStatus,
  loadSave,
  milestoneAchieved,
  writeSave,
} from './game/save';
import type { SaveData } from './game/save';
import { audio } from './game/audio';
import { portalAd } from './game/portalAd';
import { petById } from './game/content';
import { dailyGateTrialSeed, readRunnerChallenge } from './game/share';
import type { EngineEvent, HudState, RunMode, RunResult, ToastTone } from './game/types';
import { Hud, Toasts } from './components/Hud';
import type { ToastItem } from './components/Hud';
import { Title } from './components/Title';
import { Hub } from './components/Hub';
import { AdOverlay, GameOver, PauseMenu } from './components/Overlays';

type Screen = 'title' | 'hub' | 'playing' | 'paused' | 'over';

interface PendingAd {
  kind: 'commercial' | 'rewarded';
  resolve: (ok: boolean) => void;
}

let loadingFinishedSent = false;
const isDevBuild = (import.meta as ImportMeta & { env: { DEV: boolean } }).env.DEV;
const CRAZY_REWARDED_COOLDOWN_KEY = 'dimension-shift-runner-crazy-rewarded-until';
const CRAZY_REWARDED_COOLDOWN_MS = 5 * 60 * 1000;

function readCrazyRewardedCooldownUntil() {
  try {
    const stored = Number(window.sessionStorage.getItem(CRAZY_REWARDED_COOLDOWN_KEY));
    return Number.isFinite(stored) ? stored : 0;
  } catch {
    return 0;
  }
}

function writeCrazyRewardedCooldownUntil(until: number) {
  try {
    if (until > Date.now()) window.sessionStorage.setItem(CRAZY_REWARDED_COOLDOWN_KEY, String(until));
    else window.sessionStorage.removeItem(CRAZY_REWARDED_COOLDOWN_KEY);
  } catch {
    /* A cooldown is helpful but must not block gameplay when storage is unavailable. */
  }
}

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const supported = useMemo(() => GameEngine.supported(), []);

  const [save, setSave] = useState<SaveData>(loadSave);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const [screen, setScreen] = useState<Screen>('title');
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const [hud, setHud] = useState<HudState | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [challenge] = useState(readRunnerChallenge);
  const [newBest, setNewBest] = useState(false);
  const [doubled, setDoubled] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const focusPauseRef = useRef(false);
  const [ad, setAd] = useState<PendingAd | null>(null);
  const [muted, setMuted] = useState(save.muted);
  const [sdkMuted, setSdkMuted] = useState(portalAd.isPlatformMuted);
  const [crazyAdblockStatus, setCrazyAdblockStatus] = useState(portalAd.crazyAdblockStatus);
  const [crazyRewardedCooldownUntil, setCrazyRewardedCooldownUntil] = useState(readCrazyRewardedCooldownUntil);
  const [portalReady, setPortalReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const crazyAutoStarted = useRef(false);
  const toastId = useRef(0);

  const update = useCallback((fn: (s: SaveData) => SaveData) => {
    setSave((prev) => {
      const next = fn(prev);
      if (next !== prev) writeSave(next);
      return next;
    });
  }, []);

  const pushToast = useCallback((text: string, tone: ToastTone) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  const startCrazyRewardedCooldown = useCallback(() => {
    if (portalAd.portal !== 'crazy') return;
    const until = Date.now() + CRAZY_REWARDED_COOLDOWN_MS;
    writeCrazyRewardedCooldownUntil(until);
    setCrazyRewardedCooldownUntil(until);
  }, []);

  // ------------------------------------------------------------ engine events

  const handleGameOver = useCallback(
    (r: RunResult) => {
      portalAd.gameplayStop();
      setNewBest(r.score > saveRef.current.best);
      setResult(r);
      setDoubled(false);
      update((s) => ({
        ...s,
        shards: s.shards + r.shards,
        best: Math.max(s.best, r.score),
        bestDist: Math.max(s.bestDist, r.distance),
        runs: s.runs + 1,
        totalOrbs: s.totalOrbs + r.orbs,
        totalGates: s.totalGates + r.gates,
      }));
      setScreen('over');
    },
    [update],
  );

  const onEvent = useCallback(
    (e: EngineEvent) => {
      switch (e.type) {
        case 'toast':
          pushToast(e.text, e.tone);
          break;
        case 'petFound': {
          const p = petById(e.petId);
          update((s) =>
            s.pets.includes(e.petId) ? s : { ...s, pets: [...s.pets, e.petId], equipped: s.equipped ?? e.petId },
          );
          if (p) pushToast(`NEW PET FOUND ${p.emoji} ${p.name}!`, 'gate');
          break;
        }
        case 'hintShown':
          update((s) => ({ ...s, hints: { ...s.hints, [e.key]: (s.hints[e.key] ?? 0) + 1 } }));
          break;
        case 'pause':
          focusPauseRef.current = e.reason === 'focus';
          // CrazyGames tracks focus loss on its side; Poki still needs explicit lifecycle events.
          if (!focusPauseRef.current || portalAd.portal === 'poki') portalAd.gameplayStop();
          setScreen('paused');
          break;
        case 'error':
          pushToast(e.message, 'bad');
          break;
        case 'gameover':
          handleGameOver(e.result);
          break;
      }
    },
    [handleGameOver, pushToast, update],
  );
  const eventRef = useRef(onEvent);
  useEffect(() => {
    eventRef.current = onEvent;
  }, [onEvent]);

  // ------------------------------------------------------------ mount effects

  useEffect(() => {
    if (!portalReady) return;
    let eng: GameEngine | null = null;
    if (supported) {
      const mount = mountRef.current;
      if (!mount) return;
      eng = new GameEngine(
        mount,
        (e) => eventRef.current(e),
        (h) => setHud(h),
      );
      engineRef.current = eng;
      eng.setPet(saveRef.current.equipped);
    }
    if (!loadingFinishedSent) {
      loadingFinishedSent = true;
      portalAd.gameLoadingFinished();
    }
    setEngineReady(true);
    return () => {
      eng?.dispose();
      if (engineRef.current === eng) engineRef.current = null;
    };
  }, [portalReady, supported]);

  useEffect(() => portalAd.onPlatformMuteChange(setSdkMuted), []);
  useEffect(() => portalAd.onCrazyAdblockStatus(setCrazyAdblockStatus), []);

  useEffect(() => {
    if (!portalReady || portalAd.portal !== 'crazy') return;
    const remaining = crazyRewardedCooldownUntil - Date.now();
    if (remaining <= 0) {
      if (crazyRewardedCooldownUntil > 0) {
        writeCrazyRewardedCooldownUntil(0);
        setCrazyRewardedCooldownUntil(0);
      }
      return;
    }
    const timer = window.setTimeout(() => {
      writeCrazyRewardedCooldownUntil(0);
      setCrazyRewardedCooldownUntil(0);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [portalReady, crazyRewardedCooldownUntil]);

  useEffect(() => {
    const unlockAudioOnFirstInput = () => {
      audio.unlock();
      window.removeEventListener('pointerdown', unlockAudioOnFirstInput, true);
      window.removeEventListener('keydown', unlockAudioOnFirstInput, true);
    };
    window.addEventListener('pointerdown', unlockAudioOnFirstInput, { once: true, passive: true, capture: true });
    window.addEventListener('keydown', unlockAudioOnFirstInput, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudioOnFirstInput, true);
      window.removeEventListener('keydown', unlockAudioOnFirstInput, true);
    };
  }, []);

  useEffect(() => {
    if (isDevBuild) {
      portalAd.registerMockAd((kind) => new Promise<boolean>((resolve) => setAd({ kind, resolve })));
    }
    let active = true;
    void portalAd.init().then(() => {
      if (!active) return;
      if (portalAd.portal === 'crazy') {
        setCrazyRewardedCooldownUntil(readCrazyRewardedCooldownUntil());
        const storage = portalAd.getCrazyDataStorage();
        if (storage) {
          const restored = connectCrazyDataStorage(storage);
          saveRef.current = restored;
          setSave(restored);
          setMuted(restored.muted);
        }
      }
      setPortalReady(true);
    });
    return () => {
      active = false;
      if (isDevBuild) portalAd.registerMockAd(null);
    };
  }, []);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  // Screen-based BGM synchronization
  useEffect(() => {
    if (muted || sdkMuted) return;
    if (screen === 'title' || screen === 'hub') {
      audio.startLobbyMusic();
    } else if (screen === 'over') {
      const t = window.setTimeout(() => {
        if (!saveRef.current.muted) audio.startLobbyMusic();
      }, 900);
      return () => window.clearTimeout(t);
    }
  }, [screen, muted, sdkMuted]);

  // companion follows you in the menu backdrop
  useEffect(() => {
    if (screen === 'title' || screen === 'hub') engineRef.current?.setPet(save.equipped);
  }, [save.equipped, screen]);

  // ------------------------------------------------------------------ actions

  const toggleMute = useCallback(() => {
    audio.unlock(); // First audio context creation must follow a user gesture.
    setMuted((m) => {
      const next = !m;
      audio.setMuted(next);
      update((s) => ({ ...s, muted: next }));
      return next;
    });
  }, [update]);

  const startRun = useCallback(async (mode: RunMode = 'runner', routeSeed?: number, commercialBreakBeforeStart = false) => {
    if (!engineRef.current || busyRef.current) return;
    focusPauseRef.current = false;
    if (portalAd.portal === 'crazy') crazyAutoStarted.current = true;
    busyRef.current = true;
    setBusy(true);
    audio.unlock();
    audio.ui();
    (document.activeElement as HTMLElement | null)?.blur?.();
    try {
      if (commercialBreakBeforeStart && portalAd.isLive) await portalAd.commercialBreak();
      const selectedSeed = routeSeed ?? (mode === 'gateTrial' ? dailyGateTrialSeed() : challenge?.seed);
      engineRef.current?.startRun({ ...buildRunConfig(saveRef.current), mode, routeSeed: selectedSeed });
      setResult(null);
      setScreen('playing');
      portalAd.gameplayStart();
      if (mode === 'gateTrial') {
        pushToast(
          selectedSeed === dailyGateTrialSeed()
            ? 'DAILY GATE TRIAL · enter one gate and reach 250m!'
            : 'SHARED GATE TRIAL · enter one gate and reach 250m!',
          'gate',
        );
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [challenge, pushToast]);

  const resume = useCallback(async () => {
    if (busyRef.current) return;
    const afterFocusPause = focusPauseRef.current;
    focusPauseRef.current = false;
    busyRef.current = true;
    setBusy(true);
    try {
      if (!afterFocusPause) await portalAd.commercialBreak();
      engineRef.current?.resume();
      setScreen('playing');
      if (!afterFocusPause || portalAd.portal === 'poki') portalAd.gameplayStart();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!portalReady || !engineReady || portalAd.portal !== 'crazy' || crazyAutoStarted.current) return;
    crazyAutoStarted.current = true;
    void startRun('runner');
  }, [portalReady, engineReady, startRun]);

  const quitToMenu = useCallback(() => {
    focusPauseRef.current = false;
    portalAd.gameplayStop();
    engineRef.current?.toMenu();
    setScreen('title');
  }, []);

  const openHub = useCallback(() => {
    audio.unlock();
    audio.ui();
    engineRef.current?.toMenu();
    setScreen('hub');
  }, []);

  const revive = useCallback(async () => {
    if (!result || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const ok = await portalAd.rewardedBreak();
      if (ok) {
        const r = result;
        // the run continues, so take back what was credited at game over
        update((s) => ({
          ...s,
          shards: Math.max(0, s.shards - r.shards),
          runs: Math.max(0, s.runs - 1),
          totalOrbs: Math.max(0, s.totalOrbs - r.orbs),
          totalGates: Math.max(0, s.totalGates - r.gates),
        }));
        setResult(null);
        engineRef.current?.revive();
        setScreen('playing');
        portalAd.gameplayStart();
      }
    } finally {
      startCrazyRewardedCooldown();
      busyRef.current = false;
      setBusy(false);
    }
  }, [result, startCrazyRewardedCooldown, update]);

  const doubleShards = useCallback(async () => {
    if (!result || doubled || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const ok = await portalAd.rewardedBreak();
      if (ok) {
        update((s) => ({ ...s, shards: s.shards + result.shards }));
        setDoubled(true);
        audio.buy();
      }
    } finally {
      startCrazyRewardedCooldown();
      busyRef.current = false;
      setBusy(false);
    }
  }, [result, doubled, startCrazyRewardedCooldown, update]);

  // global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || busyRef.current) return;
      if (e.code === 'KeyM') toggleMute();
      const s = screenRef.current;
      if (e.code === 'Enter' && s === 'title') void startRun('runner');
      else if (e.code === 'Enter' && s === 'over' && result) void startRun(result.mode, result.routeSeed);
      else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (s === 'paused') resume();
        else if (s === 'playing') engineRef.current?.pause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startRun, resume, toggleMute, result]);

  const isCrazyPortal = portalAd.portal === 'crazy';
  const challengeIsTodayGateTrial =
    challenge?.mode === 'gateTrial' && (challenge.seed === undefined || challenge.seed === dailyGateTrialSeed());
  const crazyRewardedCooldownActive = isCrazyPortal && crazyRewardedCooldownUntil > Date.now();
  const rewardedAdsAvailable =
    portalReady &&
    (portalAd.isLive || (isDevBuild && portalAd.status === 'mock')) &&
    (!isCrazyPortal || (crazyAdblockStatus === 'clear' && !crazyRewardedCooldownActive));
  const rewardedAdsNotice = isCrazyPortal
    ? crazyAdblockStatus === 'blocked'
      ? 'blocked'
      : crazyAdblockStatus !== 'clear'
        ? 'unavailable'
        : null
    : null;

  // ------------------------------------------------------------------ render

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05050f]">
      {supported ? (
        <div ref={mountRef} className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <div className="glass max-w-md rounded-2xl p-8">
            <div className="font-display text-xl font-black tracking-widest text-white">3D VIEW UNAVAILABLE</div>
            <p className="mt-3 text-white/75">
              This browser could not start the 3D view. Please enable hardware acceleration, or try another browser.
            </p>
          </div>
        </div>
      )}

      {(!portalReady || !engineReady) && (
        <div aria-live="polite" className="absolute inset-0 z-[60] flex items-center justify-center bg-[#07142d]/95 p-6 text-center backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-cyan-300/30 bg-slate-950/70 p-8 shadow-[0_0_48px_rgba(34,211,238,0.18)]">
            <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-cyan-200/20 border-t-fuchsia-300" />
            <div className="font-display text-lg font-black tracking-[0.18em] text-white">DIMENSION SHIFT</div>
            <p className="mt-2 text-xs font-bold tracking-widest text-cyan-100/65">CONNECTING TO ARCADE</p>
          </div>
        </div>
      )}

      {screen === 'title' && (
        <Title
          save={save}
          busy={busy}
          challenge={challenge}
          challengeIsTodayGateTrial={challengeIsTodayGateTrial}
          muted={muted || sdkMuted}
          platformMuted={sdkMuted}
          onPlay={() => void startRun(challenge?.mode ?? 'runner', challenge?.seed)}
          onGateTrial={() => void startRun('gateTrial', dailyGateTrialSeed())}
          onHub={openHub}
          onMute={toggleMute}
          onClaimDaily={() =>
            update((s) => {
              const d = dailyStatus(s);
              if (!d.available) return s;
              pushToast(`Day ${d.day} check-in! +${d.shards} shards`, 'good');
              return { ...s, shards: s.shards + d.shards, lastDaily: Date.now(), dailyStreak: d.day };
            })
          }
          onClaimMilestone={(at) =>
            update((s) => {
              const m = MILESTONES.find((x) => x.at === at);
              if (!m || s.claimedMilestones.includes(at) || !milestoneAchieved(s, m)) return s;
              pushToast(`${m.label} unlocked! +${m.shards} shards`, 'gate');
              return { ...s, shards: s.shards + m.shards, claimedMilestones: [...s.claimedMilestones, at] };
            })
          }
        />
      )}
      {screen === 'hub' && (
        <Hub
          save={save}
          update={update}
          onClose={() => {
            audio.ui();
            setScreen('title');
          }}
        />
      )}

      {(screen === 'playing' || screen === 'paused') && hud && (
        <Hud
          hud={hud}
          muted={muted || sdkMuted}
          platformMuted={sdkMuted}
          onPause={() => engineRef.current?.pause()}
          onMute={toggleMute}
          engineRef={engineRef}
        />
      )}

      <Toasts toasts={toasts} />

      {screen === 'paused' && <PauseMenu busy={busy} onResume={() => void resume()} onQuit={quitToMenu} />}

      {screen === 'over' && result && (
        <GameOver
          result={result}
          save={save}
          newBest={newBest}
          doubled={doubled}
          busy={busy}
          adsAvailable={rewardedAdsAvailable}
          rewardedAdsNotice={rewardedAdsNotice}
          rewardedCooldownActive={crazyRewardedCooldownActive}
          challenge={challenge}
          onAgain={() => void startRun(result.mode, result.routeSeed, true)}
          onHub={openHub}
          onRevive={() => void revive()}
          onDouble={() => void doubleShards()}
        />
      )}

      {ad && (
        <AdOverlay
          kind={ad.kind}
          onDone={(ok) => {
            ad.resolve(ok);
            setAd(null);
          }}
        />
      )}
    </div>
  );
}
