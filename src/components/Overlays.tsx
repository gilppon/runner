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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border-4 border-amber-400/90 bg-gradient-to-b from-amber-950/95 to-stone-950/95 p-6 text-center shadow-2xl">
        <div className="text-3xl">🐰💧</div>
        <div className="mt-1 font-display text-sm font-black tracking-widest text-amber-300">OOPS! GAME OVER</div>
        <div className="mt-1 font-display text-4xl font-black text-amber-100 sm:text-5xl drop-shadow-md">
          {result.score.toLocaleString('en-US')}
        </div>
        {newBest ? (
          <div className="mt-1 font-display text-xs font-black tracking-[0.3em] text-yellow-400 animate-bounce">
            ★ NEW BEST RECORD ★
          </div>
        ) : (
          <div className="mt-1 text-xs font-bold tracking-widest text-amber-200/60">
            BEST {save.best.toLocaleString('en-US')}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
          {[
            ['🏃 DISTANCE', `${result.distance.toLocaleString('en-US')} m`],
            ['🥕 CARROTS', `${result.orbs}`],
            ['🏆 STAGE', `${result.gates + 1}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-amber-400/30 bg-black/40 px-2 py-2.5 shadow-inner">
              <div className="text-[0.65rem] font-black tracking-wider text-amber-200/70">{k}</div>
              <div className="mt-0.5 font-display text-base font-black text-white">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3.5 flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-400/40 bg-amber-500/20 px-4 py-2 font-display text-sm font-black text-amber-200 shadow-sm">
          ✨ +{(result.shards * (doubled ? 2 : 1)).toLocaleString('en-US')} CARROT COINS {doubled && <span className="text-xs text-emerald-400 font-black">(2X!)</span>}
        </div>

        {result.petsFound.length > 0 && (
          <div className="mt-2.5 text-sm font-bold text-fuchsia-200">
            Friends Found:{' '}
            {result.petsFound.map((id) => {
              const p = petById(id);
              return p ? (
                <span key={id} className="mr-1.5 inline-block rounded-full bg-fuchsia-500/20 px-2 py-0.5">
                  {p.emoji} {p.name}
                </span>
              ) : null;
            })}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {result.canRevive && (
            <button
              disabled={busy}
              onClick={onRevive}
              className="rounded-full border-2 border-yellow-300 bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-xs font-black text-stone-900 shadow-lg transition active:scale-95 hover:brightness-110"
            >
              📺 Watch Ad · Revive with 1 Life
            </button>
          )}
          {!doubled && result.shards > 0 && (
            <button
              disabled={busy}
              onClick={onDouble}
              className="rounded-full border border-yellow-400/60 bg-amber-500/30 py-2.5 text-xs font-black text-amber-200 shadow transition active:scale-95 hover:bg-amber-500/40"
            >
              📺 Watch Ad · Double Carrot Coins
            </button>
          )}
          <button
            disabled={busy}
            onClick={onAgain}
            className="rounded-full border-2 border-amber-300 bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-base font-black text-white shadow-xl transition active:scale-95 hover:brightness-110"
          >
            🥕 Play Again!
          </button>
          <button
            disabled={busy}
            onClick={onHub}
            className="rounded-full border border-white/20 bg-white/10 py-2.5 text-xs font-bold text-amber-200/80 transition active:scale-95 hover:bg-white/15"
          >
            🏠 Return to Carrot Village
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
        {kind === 'rewarded' ? 'REWARDED AD' : 'AD BREAK'}
      </div>
      <div className="anim-floaty my-6 text-7xl">📺</div>
      <div className="max-w-md text-base text-white/80">
        This is a stand-in for a real rewarded video. Game audio and input are muted while an ad plays.
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
