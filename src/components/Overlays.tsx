import { useEffect, useState } from 'react';
import { petById } from '../game/content';
import type { RunResult } from '../game/types';
import type { SaveData } from '../game/save';

export function PauseMenu({ onResume, onQuit }: { onResume: () => void; onQuit: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-sm rounded-2xl p-6 text-center">
        <div className="font-display text-2xl font-black tracking-[0.3em] text-white">PAUSED</div>
        <p className="mt-2 text-sm text-white/70">
          <span className="keycap">SPACE</span> shift · <span className="keycap">▲▼ / WS</span> move · <span className="keycap">P</span> pause
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <button onClick={onResume} className="btn btn-primary py-3 text-sm">
            ▶ Resume
          </button>
          <button onClick={onQuit} className="btn btn-ghost py-3 text-xs">
            Abandon run
          </button>
        </div>
      </div>
    </div>
  );
}

export function GameOver({
  result,
  save,
  newBest,
  doubled,
  busy,
  onAgain,
  onHub,
  onRevive,
  onDouble,
}: {
  result: RunResult;
  save: SaveData;
  newBest: boolean;
  doubled: boolean;
  busy: boolean;
  onAgain: () => void;
  onHub: () => void;
  onRevive: () => void;
  onDouble: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]">
      <div className="glass w-full max-w-md rounded-2xl p-6 text-center">
        <div className="font-display text-xs font-bold tracking-[0.4em] text-rose-300">SIGNAL LOST</div>
        <div className="mt-1 font-display text-4xl font-black text-white sm:text-5xl">{result.score.toLocaleString()}</div>
        {newBest ? (
          <div className="mt-1 font-display text-xs font-black tracking-[0.3em] text-amber-300">★ NEW BEST ★</div>
        ) : (
          <div className="mt-1 text-xs font-bold tracking-widest text-white/50">BEST {save.best.toLocaleString()}</div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[
            ['DISTANCE', `${result.distance.toLocaleString()} m`],
            ['ORBS', `⬡ ${result.orbs}`],
            ['GATES', `✦ ${result.gates}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg bg-white/8 px-2 py-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="text-[0.6rem] font-bold tracking-[0.2em] text-white/55">{k}</div>
              <div className="font-display text-sm font-black text-white">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 font-display text-sm font-black text-amber-200">
          ◆ +{result.shards * (doubled ? 2 : 1)} SHARDS {doubled && <span className="text-xs text-emerald-300">(DOUBLED)</span>}
        </div>

        {result.petsFound.length > 0 && (
          <div className="mt-2 text-sm font-bold text-fuchsia-200">
            Pets found:{' '}
            {result.petsFound.map((id) => {
              const p = petById(id);
              return p ? (
                <span key={id} className="mr-1">
                  {p.emoji} {p.name}
                </span>
              ) : null;
            })}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {result.canRevive && (
            <button disabled={busy} onClick={onRevive} className="btn btn-gold py-3 text-xs">
              📺 Watch ad · Revive with 1 life
            </button>
          )}
          {!doubled && result.shards > 0 && (
            <button disabled={busy} onClick={onDouble} className="btn btn-gold py-2.5 text-xs">
              📺 Watch ad · Double shards
            </button>
          )}
          <button disabled={busy} onClick={onAgain} className="btn btn-primary py-3.5 text-sm">
            ▶ Run again
          </button>
          <button disabled={busy} onClick={onHub} className="btn btn-ghost py-2.5 text-xs">
            🗼 Spend shards in the Hub
          </button>
        </div>
      </div>
    </div>
  );
}

/** Simulated rewarded ad, shown only when the Poki SDK is unavailable. */
export function AdOverlay({ kind, onDone }: { kind: 'commercial' | 'rewarded'; onDone: (rewarded: boolean) => void }) {
  const [t, setT] = useState(0);
  const DURATION = 3;

  useEffect(() => {
    const id = window.setInterval(() => setT((v) => v + 0.1), 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (t >= DURATION) onDone(true);
  }, [t, onDone]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
      <div className="font-display text-xs font-bold tracking-[0.4em] text-white/50">
        {kind === 'rewarded' ? 'REWARDED AD · SIMULATION' : 'AD BREAK · SIMULATION'}
      </div>
      <div className="anim-floaty my-6 text-7xl">📺</div>
      <div className="max-w-md text-base text-white/80">
        Poki SDK isn’t available in this environment, so this is a stand-in for the real rewarded video.
        Game audio and input are muted while an ad plays.
      </div>
      <div className="mt-6 h-2 w-64 overflow-hidden rounded-full bg-white/15">
        <div className="h-full bg-gradient-to-r from-cyan-300 to-fuchsia-400" style={{ width: `${Math.min(100, (t / DURATION) * 100)}%` }} />
      </div>
      <div className="mt-2 font-display text-xs tracking-widest text-white/60">
        REWARD IN {Math.max(0, Math.ceil(DURATION - t))}s
      </div>
      {t > 1 && (
        <button onClick={() => onDone(false)} className="btn btn-ghost mt-6 px-5 py-2 text-[0.65rem]">
          Skip (no reward)
        </button>
      )}
    </div>
  );
}
