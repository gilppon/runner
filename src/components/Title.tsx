import { petById } from '../game/content';
import { dailyStatus, nextMilestone, upcomingMilestone, type Milestone, type SaveData } from '../game/save';
import type { RunnerChallenge } from '../game/share';

function Key({ children }: { children: React.ReactNode }) {
  return <span className="keycap mx-0.5 align-middle">{children}</span>;
}

function msProgress(s: SaveData, milestone: Milestone): number {
  const progress = milestone.key === 'orbs' ? s.totalOrbs : milestone.key === 'gates' ? s.totalGates : s.bestDist;
  return Math.min(milestone.at, progress);
}

export function Title({
  save,
  busy,
  challenge,
  challengeIsTodayGateTrial,
  muted,
  platformMuted,
  onPlay,
  onGateTrial,
  onHub,
  onMute,
  onClaimDaily,
  onClaimMilestone,
}: {
  save: SaveData;
  busy: boolean;
  challenge: RunnerChallenge | null;
  challengeIsTodayGateTrial: boolean;
  muted: boolean;
  platformMuted: boolean;
  onPlay: () => void;
  onGateTrial: () => void;
  onHub: () => void;
  onMute: () => void;
  onClaimDaily: () => void;
  onClaimMilestone: (at: number) => void;
}) {
  const pet = petById(save.equipped);
  const daily = dailyStatus(save);
  const ms = nextMilestone(save);
  const nextMs = upcomingMilestone(save);
  return (
    <div className="scroll-thin absolute inset-0 z-10 overflow-y-auto">
      <div className="title-screen-layout flex min-h-full flex-col items-center justify-start px-4 pb-5 pt-16 text-center sm:pt-14">
      <div className="absolute right-3 top-3 flex flex-wrap items-center justify-end gap-2 sm:right-5 sm:top-5">
        <button
          onClick={onClaimDaily}
          disabled={!daily.available}
          title={
            daily.available
              ? 'Claim once per local calendar day; resets at your local midnight.'
              : 'Claimed for today; available again after your local midnight.'
          }
          className={`glass flex items-center gap-1 rounded-full px-3 py-1.5 font-display text-xs font-bold transition ${
            daily.available ? 'anim-pulse-ring text-cyan-200' : 'cursor-default text-white/40'
          }`}
        >
          {daily.available ? `+${daily.shards} Shards · Day ${daily.day}` : `Day ${daily.day} claimed`}
        </button>
        {ms ? (
          <button
            onClick={() => onClaimMilestone(ms.at)}
            title={ms.label}
            className="glass flex items-center gap-1 rounded-full px-3 py-1.5 font-display text-xs font-bold text-fuchsia-200 anim-pulse-ring"
          >
            {ms.icon} {ms.label} · CLAIM +{ms.shards}
          </button>
        ) : nextMs ? (
          <span className="glass flex items-center gap-1 rounded-full px-3 py-1.5 font-display text-xs font-bold text-white/50">
            {nextMs.icon} NEXT {nextMs.label} · {msProgress(save, nextMs)}/{nextMs.at}
          </span>
        ) : null}
        <div className="glass flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-sm font-bold text-amber-200">
          ◆ {save.shards.toLocaleString('en-US')}
        </div>
        <button
          disabled={platformMuted}
          onClick={(e) => {
            e.currentTarget.blur();
            onMute();
          }}
          aria-label={platformMuted ? 'Sound muted by platform settings' : 'Toggle sound'}
          className="glass flex h-9 w-9 items-center justify-center rounded-full text-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {challenge && (
        <section className="mb-3 w-full max-w-[37rem] rounded-2xl border border-amber-300/70 bg-slate-950/90 px-3 py-2 text-center text-amber-100 shadow-xl">
          <div className="text-[10px] font-black tracking-widest text-amber-300 sm:text-xs">
            {challenge.mode === 'gateTrial'
              ? challengeIsTodayGateTrial ? 'TODAY’S GATE TRIAL' : 'PAST GATE TRIAL ROUTE'
              : 'FRIEND’S DIMENSION SHIFT RUN'}
          </div>
          <div className="mt-0.5 text-xs font-bold sm:text-sm">
            {challenge.score.toLocaleString('en-US')} points · {challenge.distance}m · 🥕 {challenge.orbs} · 🌀 {challenge.gates}
          </div>
          <p className="mt-0.5 text-[10px] leading-snug text-amber-100/80 sm:text-[11px]">
            {challenge.mode === 'gateTrial'
              ? `${challengeIsTodayGateTrial ? 'Today’s fixed course' : 'Earlier daily course'} · enter one gate and reach 250m. Current perks apply.`
              : challenge.seed === undefined
                ? 'Score target only · this older link has no saved course.'
                : 'Same course and score target. Your current perks and upgrades apply.'}
          </p>
        </section>
      )}

      <div className="title-hero relative w-full max-w-[37rem] rounded-[1.7rem] px-5 pb-5 pt-5 sm:px-8 sm:pb-6 sm:pt-6">
      <div className="mb-2 font-display text-[0.65rem] tracking-[0.5em] text-cyan-200/85 sm:mb-3 sm:text-xs">
        MULTI-DIMENSIONAL RUNNER
      </div>
      <h1 className="font-display text-6xl font-black leading-none sm:text-8xl">
        <span className="logo-2d">2D</span>
        <span className="mx-2 text-white/70 sm:mx-4">/</span>
        <span className="logo-3d">3D</span>
      </h1>
      <div className="mt-3 font-display text-lg font-bold tracking-[0.22em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:mt-4 sm:text-3xl">
        DIMENSION SHIFT RUNNER
      </div>

      <p className="mt-2 max-w-lg text-sm font-bold leading-snug text-white/90 drop-shadow sm:mt-3 sm:text-base">
        Jump and slide in 2D, then shift into 3D to steer around walls.
        <span className="mt-1 block text-xs font-semibold text-cyan-100/90 sm:text-sm">
          Keyboard: ▲ / ▼ + <Key>SPACE</Key> · Touch: use the on-screen ▲ / ▼ / SHIFT controls.
        </span>
      </p>

      <div className="mt-4 flex flex-col items-center gap-3 sm:mt-6 sm:flex-row">
        <button
          disabled={busy}
          onClick={onPlay}
          className="btn btn-primary anim-pulse-ring px-12 py-4 text-xl sm:text-2xl shadow-2xl"
        >
          {challenge
            ? challenge.mode === 'gateTrial'
              ? challengeIsTodayGateTrial ? '🌀 RUN TODAY’S TRIAL' : '🌀 RUN PAST TRIAL'
              : '🥕 RACE THIS SCORE'
            : '🥕 PLAY RUN!'}
        </button>
        <button onClick={onHub} className="btn btn-ghost px-6 py-3.5 text-sm sm:text-base">
          🏠 Carrot Village · Pets & Upgrades
        </button>
      </div>

      {!(challenge?.mode === 'gateTrial' && challengeIsTodayGateTrial) && (
        <button
          disabled={busy}
          onClick={onGateTrial}
          className="mt-3 rounded-full border border-cyan-200/40 bg-slate-950/65 px-5 py-2 text-xs font-black tracking-wide text-cyan-100 shadow-lg backdrop-blur transition hover:bg-slate-900/85 disabled:opacity-50"
          title="All players share today’s UTC route; your current pet and upgrade bonuses still apply."
        >
          🌀 TODAY'S GATE TRIAL · 1 GATE + 250m
        </button>
      )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-2xl sm:mt-5">
        <div className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-cyan-200">
          <span>🌀</span> 2D: Jump & Slide (<Key>▲</Key> / <Key>▼</Key>)
        </div>
        <div className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-fuchsia-200">
          <span>🎮</span> 3D: Steer (<Key>▲</Key> <Key>▼</Key>) around walls
        </div>
        <div className="glass flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-amber-200">
          <span>🥕</span> Orbs & Gates: Refill energy & leap stages
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 rounded-full border border-white/20 bg-slate-950/75 px-4 py-2 text-xs font-bold tracking-[0.15em] text-white shadow-lg backdrop-blur sm:mt-5">
        <span>BEST SCORE {save.best.toLocaleString('en-US')}</span>
        <span>FARTHEST {save.bestDist.toLocaleString('en-US')} m</span>
        <span>RUNS {save.runs}</span>
        {pet && (
          <span className="text-white">
            COMPANION {pet.emoji} {pet.name.toUpperCase()}
          </span>
        )}
      </div>
      </div>
    </div>
  );
}
