import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameEngine } from './game/engine';
import {
  MILESTONES,
  buildRunConfig,
  dailyStatus,
  loadSave,
  milestoneAchieved,
  writeSave,
} from './game/save';
import type { SaveData } from './game/save';
import { audio } from './game/audio';
import { poki } from './game/poki';
import type { PokiStatus } from './game/poki';
import { petById } from './game/content';
import type { EngineEvent, HudState, RunResult, ToastTone } from './game/types';
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
  const [newBest, setNewBest] = useState(false);
  const [doubled, setDoubled] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [ad, setAd] = useState<PendingAd | null>(null);
  const [pokiStatus, setPokiStatus] = useState<PokiStatus>(poki.status);
  const [muted, setMuted] = useState(save.muted);
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

  // ------------------------------------------------------------ engine events

  const handleGameOver = useCallback(
    (r: RunResult) => {
      poki.gameplayStop(); // Poki: gameplayStop on death
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
          poki.gameplayStop();
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
    if (!supported || !mountRef.current) return;
    const eng = new GameEngine(
      mountRef.current,
      (e) => eventRef.current(e),
      (h) => setHud(h),
    );
    engineRef.current = eng;
    eng.setPet(saveRef.current.equipped);
    return () => {
      eng.dispose();
      engineRef.current = null;
    };
  }, [supported]);

  useEffect(() => {
    const off = poki.onStatus(setPokiStatus);
    poki.registerMockAd((kind) => new Promise<boolean>((resolve) => setAd({ kind, resolve })));
    void poki.init().then(() => {
      if (!loadingFinishedSent) {
        loadingFinishedSent = true;
        poki.gameLoadingFinished(); // Poki: loading complete
      }
    });
    return () => {
      off();
      poki.registerMockAd(null);
    };
  }, []);

  useEffect(() => {
    audio.setMuted(muted);
  }, [muted]);

  // companion follows you in the menu backdrop
  useEffect(() => {
    if (screen === 'title' || screen === 'hub') engineRef.current?.setPet(save.equipped);
  }, [save.equipped, screen]);

  // ------------------------------------------------------------------ actions

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      audio.setMuted(next);
      update((s) => ({ ...s, muted: next }));
      return next;
    });
  }, [update]);

  const startRun = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    audio.unlock();
    audio.ui();
    (document.activeElement as HTMLElement | null)?.blur?.();
    try {
      await poki.commercialBreak(); // Poki: natural break before gameplay
      engineRef.current?.startRun(buildRunConfig(saveRef.current));
      setResult(null);
      setScreen('playing');
      poki.gameplayStart(); // Poki: gameplayStart
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  // Resume must not break run continuity, so no interstitial there (portal review violation)
  const resume = useCallback(() => {
    engineRef.current?.resume();
    setScreen('playing');
    poki.gameplayStart();
  }, []);

  const quitToMenu = useCallback(() => {
    poki.gameplayStop();
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
      const ok = await poki.rewardedBreak(); // Poki: rewardedBreak on player's choice
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
        poki.gameplayStart();
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [result, update]);

  const doubleShards = useCallback(async () => {
    if (!result || doubled || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const ok = await poki.rewardedBreak();
      if (ok) {
        update((s) => ({ ...s, shards: s.shards + result.shards }));
        setDoubled(true);
        audio.buy();
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, [result, doubled, update]);

  // global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyM') toggleMute();
      const s = screenRef.current;
      if (e.code === 'Enter' && (s === 'title' || s === 'over')) void startRun();
      else if ((e.code === 'KeyP' || e.code === 'Escape') && s === 'paused') resume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startRun, resume, toggleMute]);

  // ------------------------------------------------------------------ render

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05050f]">
      {supported ? (
        <div ref={mountRef} className="absolute inset-0" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
          <div className="glass max-w-md rounded-2xl p-8">
            <div className="font-display text-xl font-black tracking-widest text-white">WEBGL REQUIRED</div>
            <p className="mt-3 text-white/75">
              This runner renders a real 3D world with Three.js. Please enable hardware acceleration or try another
              browser.
            </p>
          </div>
        </div>
      )}

      {screen === 'title' && (
        <Title
          save={save}
          busy={busy}
          muted={muted}
          pokiStatus={pokiStatus}
          onPlay={() => void startRun()}
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
          muted={muted}
          onPause={() => engineRef.current?.pause()}
          onMute={toggleMute}
          engineRef={engineRef}
        />
      )}

      <Toasts toasts={toasts} />

      {screen === 'paused' && <PauseMenu onResume={resume} onQuit={quitToMenu} />}

      {screen === 'over' && result && (
        <GameOver
          result={result}
          save={save}
          newBest={newBest}
          doubled={doubled}
          busy={busy}
          onAgain={() => void startRun()}
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
