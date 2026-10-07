import { useEffect, useState } from 'react';
import { petById } from '../game/content';
import type { RunResult } from '../game/types';
import { createRunnerShareUrl } from '../game/share';
import { milestoneAchieved, upcomingMilestone, type SaveData } from '../game/save';

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
  const [shareUrl, setShareUrl] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const objective = upcomingMilestone(save);
  const objectiveProgress = objective
    ? Math.min(
        objective.at,
        objective.key === 'orbs' ? save.totalOrbs : objective.key === 'gates' ? save.totalGates : save.bestDist,
      )
      : 0;

  useEffect(() => {
    let active = true;
    void createRunnerShareUrl(result).then((url) => {
      if (active) setShareUrl(url);
    });
    return () => {
      active = false;
    };
  }, [result]);
  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-y-auto bg-black/60 p-3 backdrop-blur-sm">
      <div className="mx-auto my-auto grid w-full max-w-md rounded-3xl border-4 border-amber-400/90 bg-gradient-to-b from-amber-950/95 to-stone-950/95 p-6 text-center shadow-2xl [@media(max-height:520px)]:my-auto [@media(max-height:520px)]:max-w-5xl [@media(max-height:520px)]:grid-cols-2 [@media(max-height:520px)]:items-center [@media(max-height:520px)]:gap-x-5 [@media(max-height:520px)]:p-3">
        <div className="[@media(max-height:520px)]:col-start-1 [@media(max-height:520px)]:row-start-1">
          <div className="text-3xl [@media(max-height:520px)]:text-2xl">🐰💧</div>
          <div className="mt-1 font-display text-sm font-black tracking-widest text-amber-300">OOPS! GAME OVER</div>
          <div className="mt-1 font-display text-4xl font-black text-amber-100 sm:text-5xl [@media(max-height:520px)]:text-3xl drop-shadow-md">
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
        </div>

        <div className="[@media(max-height:520px)]:col-start-1 [@media(max-height:520px)]:row-start-2">
        <div className="mt-4 grid grid-cols-3 gap-2.5 text-center [@media(max-height:520px)]:mt-2 [@media(max-height:520px)]:gap-1.5">
          {[
            ['🏃 DISTANCE', `${result.distance.toLocaleString('en-US')} m`],
            ['🥕 CARROTS', `${result.orbs}`],
            ['🌀 GATES', `${result.gates}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-amber-400/30 bg-black/40 px-2 py-2.5 shadow-inner [@media(max-height:520px)]:py-1.5">
              <div className="text-[0.65rem] font-black tracking-wider text-amber-200/70">{k}</div>
              <div className="mt-0.5 font-display text-base font-black text-white">{v}</div>
            </div>
          ))}
        </div>

        <div className="mt-3.5 flex items-center justify-center gap-2 rounded-2xl border-2 border-amber-400/40 bg-amber-500/20 px-4 py-2 font-display text-sm font-black text-amber-200 shadow-sm [@media(max-height:520px)]:mt-2 [@media(max-height:520px)]:py-1">
          ✨ +{(result.shards * (doubled ? 2 : 1)).toLocaleString('en-US')} CARROT COINS {doubled && <span className="text-xs text-emerald-400 font-black">(2X!)</span>}
        </div>
        {result.contractShards > 0 && (
          <div className="mt-1 text-[0.62rem] font-bold tracking-wide text-emerald-200/85 [@media(max-height:520px)]:mt-0">
            🏁 STAGE CONTRACTS +{(result.contractShards * (doubled ? 2 : 1)).toLocaleString('en-US')} INCLUDED
          </div>
        )}

        {objective && (
          <div className="mt-2 rounded-xl border border-cyan-200/30 bg-cyan-950/50 px-3 py-2 text-xs font-bold text-cyan-100 [@media(max-height:520px)]:mt-1 [@media(max-height:520px)]:py-1">
            {objective.icon}{' '}
            {milestoneAchieved(save, objective)
              ? `${objective.label.toUpperCase()}! CLAIM +${objective.shards} IN THE LOBBY.`
              : `NEXT GOAL: ${objective.label.toUpperCase()} · ${objectiveProgress}/${objective.at}`}
          </div>
        )}

        {result.petsFound.length > 0 && (
          <div className="mt-2.5 text-sm font-bold text-fuchsia-200 [@media(max-height:520px)]:mt-1">
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

        <button
          onClick={async () => {
            const text = `Can you beat my carrot run? ${result.score.toLocaleString('en-US')} points at ${result.distance}m with ${result.orbs} carrots and ${result.gates} gates.`;
            const url = shareUrl || window.location.href;
            try {
              if (navigator.share) {
                await navigator.share({ title: 'Carrot Run challenge', text, url });
                setShareStatus('Challenge shared! 🥕');
                return;
              }
              await navigator.clipboard.writeText(`${text} ${url}`);
              setShareStatus('Challenge link copied! Send it to a friend 🥕');
            } catch (error) {
              if (error instanceof DOMException && error.name === 'AbortError') return;
              try {
                await navigator.clipboard.writeText(`${text} ${url}`);
                setShareStatus('Challenge link copied! Send it to a friend 🥕');
              } catch {
                setShareStatus('Copy the game link from your browser to challenge a friend.');
              }
            }
          }}
          className="mt-2 w-full rounded-full border border-amber-300/50 bg-amber-300/10 py-2 text-xs font-black text-amber-100 hover:bg-amber-300/20"
        >
          🥕 Challenge a friend to beat this run
        </button>
        {shareStatus && <p aria-live="polite" className="mt-1 text-xs font-bold text-emerald-200">{shareStatus}</p>}

        </div>

        <div className="mt-5 flex flex-col gap-2.5 [@media(max-height:520px)]:col-start-2 [@media(max-height:520px)]:row-span-2 [@media(max-height:520px)]:row-start-1 [@media(max-height:520px)]:mt-0 [@media(max-height:520px)]:gap-1">
          {result.canRevive && (
            <button
              disabled={busy}
              onClick={onRevive}
              className="rounded-full border-2 border-yellow-300 bg-gradient-to-r from-amber-400 to-yellow-500 py-3 text-xs font-black text-stone-900 shadow-lg transition active:scale-95 hover:brightness-110 [@media(max-height:520px)]:py-2"
            >
              🎬 Watch Ad · Revive with 1 Life
            </button>
          )}
          {!doubled && result.shards > 0 && (
            <button
              disabled={busy}
              onClick={onDouble}
              className="rounded-full border border-yellow-400/60 bg-amber-500/30 py-2.5 text-xs font-black text-amber-200 shadow transition active:scale-95 hover:bg-amber-500/40 [@media(max-height:520px)]:py-1.5"
            >
              🎬 Watch Ad · Double Carrot Coins
            </button>
          )}
          <button
            disabled={busy}
            onClick={onAgain}
            className="rounded-full border-2 border-amber-300 bg-gradient-to-r from-orange-500 to-amber-500 py-3.5 text-base font-black text-white shadow-xl transition active:scale-95 hover:brightness-110 [@media(max-height:520px)]:py-2"
          >
            🥕 Play Again!
          </button>
          <button
            disabled={busy}
            onClick={onHub}
            className="rounded-full border border-white/20 bg-white/10 py-2.5 text-xs font-bold text-amber-200/80 transition active:scale-95 hover:bg-white/15 [@media(max-height:520px)]:py-1.5"
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
