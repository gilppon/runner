import { petById } from '../game/content';
import { dailyStatus, nextMilestone, upcomingMilestone, type Milestone, type SaveData } from '../game/save';

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
  muted,
  onPlay,
  onHub,
  onMute,
  onClaimDaily,
  onClaimMilestone,
}: {
  save: SaveData;
  busy: boolean;
  muted: boolean;
  onPlay: () => void;
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
      <div className="flex min-h-full flex-col items-center justify-start px-4 pb-4 pt-6 text-center sm:pt-5">
      <div className="absolute right-3 top-3 flex flex-wrap items-center justify-end gap-2 sm:right-5 sm:top-5">
        <button
          onClick={onClaimDaily}
          disabled={!daily.available}
          title="Daily check-in reward"
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
          onClick={(e) => {
            e.currentTarget.blur();
            onMute();
          }}
          aria-label="Toggle sound"
          className="glass flex h-9 w-9 items-center justify-center rounded-full text-lg"
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

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
        Shift between 2D runner & 3D obstacle city! Press <Key>SPACE</Key> to walk around giant walls.
      </p>

      <div className="mt-4 flex flex-col items-center gap-3 sm:mt-6 sm:flex-row">
        <button
          disabled={busy}
          onClick={onPlay}
          className="btn btn-primary anim-pulse-ring px-12 py-4 text-xl sm:text-2xl shadow-2xl"
        >
          🥕 PLAY RUN!
        </button>
        <button onClick={onHub} className="btn btn-ghost px-6 py-3.5 text-sm sm:text-base">
          🏠 Carrot Village · Pets & Upgrades
        </button>
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

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs font-bold tracking-[0.2em] text-white/70 sm:mt-6">
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
