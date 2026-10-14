import { useEffect, useState } from 'react';
import { petById } from '../game/content';
import type { RunResult } from '../game/types';
import { createRunnerShareUrl, dailyGateTrialSeed, type RunnerChallenge } from '../game/share';
import { milestoneAchieved, upcomingMilestone, type SaveData } from '../game/save';

export function PauseMenu({ onResume, onQuit, busy = false }: { onResume: () => void; onQuit: () => void; busy?: boolean }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-sm rounded-2xl p-6 text-center">
        <div className="font-display text-2xl font-black tracking-[0.3em] text-white">PAUSED</div>
        <p className="mt-2 text-sm text-white/70">
          <span className="keycap">SPACE</span> shift · <span className="keycap">▲▼ / WS</span> move · <span className="keycap">P</span> pause
        </p>
        <div className="mt-5 flex flex-col gap-3">
          <button disabled={busy} onClick={onResume} className="btn btn-primary py-3 text-sm disabled:opacity-50">
            ▶ Resume
          </button>
          <button disabled={busy} onClick={onQuit} className="btn btn-ghost py-3 text-xs disabled:opacity-50">
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
  adsAvailable,
  rewardedAdsNotice,
  rewardedCooldownActive,
  challenge,
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
  adsAvailable: boolean;
  rewardedAdsNotice: 'blocked' | 'unavailable' | null;
  rewardedCooldownActive: boolean;
  challenge: RunnerChallenge | null;
  onAgain: () => void;
  onHub: () => void;
  onRevive: () => void;
  onDouble: () => void;
}) {
  const [shareUrl, setShareUrl] = useState('');
  const [shareStatus, setShareStatus] = useState<null | { message: string; tone: 'success' | 'neutral' | 'error' }>(null);
  const objective = upcomingMilestone(save);
  const objectiveProgress = objective
    ? Math.min(
        objective.at,
        objective.key === 'orbs' ? save.totalOrbs : objective.key === 'gates' ? save.totalGates : save.bestDist,
      )
      : 0;
  const matchingChallenge =
    challenge &&
    challenge.mode === result.mode &&
    (challenge.seed === undefined || challenge.seed === result.routeSeed)
      ? challenge
      : null;
  const challengeDelta = matchingChallenge ? result.score - matchingChallenge.score : null;
  const isCurrentGateTrial = result.mode === 'gateTrial' && result.routeSeed === dailyGateTrialSeed();

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
      <div className="game-over-card mx-auto my-auto grid w-full max-w-md rounded-3xl border border-cyan-300/45 bg-gradient-to-br from-slate-950/95 via-[#172343]/95 to-[#311c4c]/95 p-6 text-center shadow-[0_0_38px_rgba(34,211,238,0.24),0_22px_60px_rgba(0,0,0,0.6)] [@media(max-height:520px)]:my-auto [@media(max-height:520px)]:max-w-5xl [@media(max-height:520px)]:grid-cols-2 [@media(max-height:520px)]:items-center [@media(max-height:520px)]:gap-x-5 [@media(max-height:520px)]:p-3">
        <div className="[@media(max-height:520px)]:col-start-1 [@media(max-height:520px)]:row-start-1">
          <div className="game-over-mark text-3xl [@media(max-height:520px)]:text-2xl">🐰💧</div>
          <div className="mt-1 font-display text-sm font-black tracking-widest text-cyan-200">
            {result.mode === 'gateTrial'
              ? result.trialCleared ? 'GATE TRIAL CLEARED!' : 'GATE TRIAL INCOMPLETE'
              : 'OOPS! GAME OVER'}
          </div>
          {result.mode === 'gateTrial' && (
            <div className="mt-1 text-[0.62rem] font-bold leading-snug text-cyan-100/80">
              {result.trialCleared
                ? `${isCurrentGateTrial ? 'TODAY’S FIXED ROUTE' : 'PAST GATE TRIAL ROUTE'} · 1 GATE · 250m`
                : `${isCurrentGateTrial ? 'TODAY’S GATE TRIAL GOAL' : 'PAST GATE TRIAL GOAL'}: enter a gate and reach 250m · ${result.distance}m · ${result.gates} gates`}
            </div>
          )}
          <div className="game-over-score mt-1 font-display text-4xl font-black text-white sm:text-5xl [@media(max-height:520px)]:text-3xl drop-shadow-[0_0_14px_rgba(34,211,238,0.55)]">
            {result.score.toLocaleString('en-US')}
          </div>
          {newBest ? (
            <div className="mt-1 font-display text-xs font-black tracking-[0.3em] text-yellow-400 animate-bounce">
              ★ NEW BEST RECORD ★
            </div>
          ) : (
            <div className="mt-1 text-xs font-bold tracking-widest text-cyan-100/65">
              BEST {save.best.toLocaleString('en-US')}
            </div>
          )}
          {matchingChallenge && challengeDelta !== null && (
            <div role="status" className="challenge-comparison mt-2 rounded-xl border border-amber-300/45 bg-amber-400/10 px-3 py-2 text-xs font-black text-amber-100">
              <div>
                {challengeDelta > 0
                  ? `CHALLENGE BEATEN · +${challengeDelta.toLocaleString('en-US')}`
                  : challengeDelta === 0
                    ? 'CHALLENGE TIED'
                    : `${Math.abs(challengeDelta).toLocaleString('en-US')} POINTS TO BEAT`}
              </div>
              <div className="challenge-comparison-note mt-1 text-[0.62rem] font-bold text-amber-100/70">
                {matchingChallenge.seed === undefined
                  ? 'Score target only · this older link has no saved course.'
                  : 'Same course · your current perks and upgrades apply.'}
              </div>
            </div>
          )}
        </div>

        <div className="[@media(max-height:520px)]:col-start-1 [@media(max-height:520px)]:row-start-2">
        <div className="game-over-stats mt-4 grid grid-cols-3 gap-2.5 text-center [@media(max-height:520px)]:mt-2 [@media(max-height:520px)]:gap-1.5">
          {[
            ['🏃 DISTANCE', `${result.distance.toLocaleString('en-US')} m`],
            ['🥕 CARROTS', `${result.orbs}`],
            ['🌀 GATES', `${result.gates}`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-cyan-300/25 bg-slate-950/55 px-2 py-2.5 shadow-inner [@media(max-height:520px)]:py-1.5">
              <div className="text-[0.65rem] font-black tracking-wider text-cyan-100/70">{k}</div>
              <div className="mt-0.5 font-display text-base font-black text-white">{v}</div>
            </div>
          ))}
        </div>

        <div className="game-over-rewards mt-3.5 flex items-center justify-center gap-2 rounded-2xl border border-amber-300/55 bg-amber-400/15 px-4 py-2 font-display text-sm font-black text-amber-200 shadow-sm [@media(max-height:520px)]:mt-2 [@media(max-height:520px)]:py-1">
          ✨ +{(result.shards * (doubled ? 2 : 1)).toLocaleString('en-US')} SHARDS {doubled && <span className="text-xs text-emerald-400 font-black">(2X!)</span>}
        </div>
        {result.contractShards > 0 && (
          <div className="mt-1 text-[0.62rem] font-bold tracking-wide text-emerald-200/85 [@media(max-height:520px)]:mt-0">
            🏁 STAGE CONTRACTS +{(result.contractShards * (doubled ? 2 : 1)).toLocaleString('en-US')} INCLUDED
          </div>
        )}

        {objective && (
          <div className="game-over-objective mt-2 rounded-xl border border-cyan-200/30 bg-cyan-950/50 px-3 py-2 text-xs font-bold text-cyan-100 [@media(max-height:520px)]:mt-1 [@media(max-height:520px)]:py-1">
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
            setShareStatus(null);
            const routeLabel = result.mode === 'gateTrial'
              ? result.routeSeed === dailyGateTrialSeed() ? 'Today’s Gate Trial' : 'Shared Gate Trial'
              : 'Dimension Shift Run';
            const challengePrompt = result.mode === 'gateTrial'
              ? 'Can you reach 250m and enter a gate?'
              : 'Can you beat my score on the same course?';
            const text = [
              `Dimension Shift Runner · ${routeLabel}`,
              `${result.score.toLocaleString('en-US')} points · ${result.distance}m · 🥕 ${result.orbs} · 🌀 ${result.gates}`,
              `${challengePrompt} Your current perks and upgrades apply.`,
            ].join('\n');
            const url = shareUrl || window.location.href;
            try {
              if (navigator.share) {
                await navigator.share({ title: 'Dimension Shift Runner challenge', text, url });
                setShareStatus({ message: 'Challenge shared! 🥕', tone: 'success' });
                return;
              }
              await navigator.clipboard.writeText(`${text} ${url}`);
              setShareStatus({ message: 'Challenge link copied! Send it to a friend 🥕', tone: 'success' });
            } catch (error) {
              if (error instanceof DOMException && error.name === 'AbortError') {
                setShareStatus({ message: 'Sharing cancelled. Your challenge is ready whenever you are.', tone: 'neutral' });
                return;
              }
              try {
                await navigator.clipboard.writeText(`${text} ${url}`);
                setShareStatus({ message: 'Challenge link copied! Send it to a friend 🥕', tone: 'success' });
              } catch {
                setShareStatus({ message: 'Could not copy the link. Copy the game address from your browser to challenge a friend.', tone: 'error' });
              }
            }
          }}
          className="game-over-share mt-2 flex min-h-11 w-full items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-300/10 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/20"
        >
          🥕 Challenge a friend to beat this run
        </button>
        {shareStatus && (
          <p
            aria-live="polite"
            className={`mt-1 text-xs font-bold ${shareStatus.tone === 'error' ? 'text-rose-200' : shareStatus.tone === 'neutral' ? 'text-amber-100/80' : 'text-emerald-200'}`}
          >
            {shareStatus.message}
          </p>
        )}

        </div>

        {(rewardedAdsNotice || rewardedCooldownActive) && (
          <p role="status" className="mt-3 text-center text-[0.62rem] font-bold leading-relaxed text-white/60 [@media(max-height:520px)]:mt-1">
            {rewardedAdsNotice === 'blocked'
              ? 'Rewarded extras are unavailable while an ad blocker is active. You can still play normally.'
              : rewardedAdsNotice === 'unavailable'
                ? 'Rewarded videos are temporarily unavailable. You can still play.'
                : 'Rewarded offers are resting for a few minutes. Keep playing and they will return.'}
          </p>
        )}
        <div className="game-over-actions mt-5 flex flex-col gap-2.5 [@media(max-height:520px)]:col-start-2 [@media(max-height:520px)]:row-span-2 [@media(max-height:520px)]:row-start-1 [@media(max-height:520px)]:mt-0 [@media(max-height:520px)]:gap-1">
          <button
            disabled={busy}
            onClick={onAgain}
            className="rounded-full border border-cyan-200/80 bg-gradient-to-r from-cyan-400 to-fuchsia-500 py-3.5 text-base font-black text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.25)] transition active:scale-95 hover:brightness-110 [@media(max-height:520px)]:py-2"
          >
            🥕 Play Again!
          </button>
          {adsAvailable && result.canRevive && (
            <button
              disabled={busy}
              onClick={onRevive}
              className="rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-300 to-orange-400 py-3 text-xs font-black text-slate-950 shadow-lg transition active:scale-95 hover:brightness-110 [@media(max-height:520px)]:py-2"
            >
              🎬 <span className="[@media(max-height:520px)]:hidden">Watch Ad · Revive with 1 Life</span>
              <span className="hidden [@media(max-height:520px)]:inline">Watch Ad · +1 Life</span>
            </button>
          )}
          {adsAvailable && !doubled && result.shards > 0 && (
            <button
              disabled={busy}
              onClick={onDouble}
              className="rounded-full border border-amber-300/45 bg-amber-400/15 py-2.5 text-xs font-black text-amber-100 shadow transition active:scale-95 hover:bg-amber-400/25 [@media(max-height:520px)]:py-1.5"
            >
              🎬 <span className="[@media(max-height:520px)]:hidden">Watch Ad · Double Shards</span>
              <span className="hidden [@media(max-height:520px)]:inline">Watch Ad · Double Shards</span>
            </button>
          )}
          <button
            disabled={busy}
            onClick={onHub}
            className="flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 py-2.5 text-xs font-bold text-cyan-100/80 transition active:scale-95 hover:bg-white/15 [@media(max-height:520px)]:py-1.5"
          >
            🏠 Return to Carrot Village
          </button>
        </div>
      </div>
    </div>
  );
}

/** In-game break screen for environments where portal ad is preparing */
export function AdOverlay({ kind, onDone }: { kind: 'commercial' | 'rewarded'; onDone: (rewarded: boolean) => void }) {
  const [t, setT] = useState(0);
  const DURATION = 2.5;

  useEffect(() => {
    const id = window.setInterval(() => setT((v) => v + 0.1), 100);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (t >= DURATION) onDone(true);
  }, [t, onDone]);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 text-center">
      <div className="rounded-full border border-white/20 px-4 py-1 font-display text-[0.65rem] font-bold tracking-[0.3em] text-white/60">
        LOCAL PREVIEW · SIMULATED AD
      </div>
      <div className="anim-floaty my-5 text-6xl">{kind === 'rewarded' ? '🎁' : '📺'}</div>
      <div className="font-display text-xl font-black text-white">
        {kind === 'rewarded' ? 'Rewarded Ad' : 'Commercial Break'}
      </div>
      <div className="mt-2 max-w-sm text-xs text-white/60">
        {kind === 'rewarded' ? 'Finish to claim your in-game reward.' : 'The run will resume automatically shortly.'}
      </div>
      <div className="mt-5 h-2 w-64 overflow-hidden rounded-full bg-white/15">
        <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-100" style={{ width: `${Math.min(100, (t / DURATION) * 100)}%` }} />
      </div>
      <div className="mt-2 font-display text-xs tabular-nums tracking-widest text-yellow-300">
        {Math.max(0, Math.ceil(DURATION - t))}s
      </div>
      {t > 1 && kind === 'rewarded' && (
        <button onClick={() => onDone(false)} className="btn btn-ghost mt-4 px-5 py-2 text-[0.65rem] text-white/40 hover:text-white">
          Skip (forfeit reward)
        </button>
      )}
    </div>
  );
}
