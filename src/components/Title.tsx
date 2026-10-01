import { petById } from '../game/content';
import { dailyStatus, nextMilestone, upcomingMilestone, type SaveData } from '../game/save';

function Key({ children }: { children: React.ReactNode }) {
  return <span className="keycap mx-0.5 align-middle">{children}</span>;
}

function msProgress(s: SaveData, at: number): number {
  const best = Math.max(s.totalOrbs, s.totalGates, s.bestDist);
  return Math.min(at, best);
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
      <div className="flex min-h-full flex-col items-center justify-center px-4 pb-6 pt-16 text-center sm:pt-6">
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
            {ms.icon} +{ms.shards}
          </button>
        ) : nextMs ? (
          <span className="glass flex items-center gap-1 rounded-full px-3 py-1.5 font-display text-xs font-bold text-white/50">
            {nextMs.icon} {msProgress(save, nextMs.at)}/{nextMs.at}
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

      <div className="mb-3 font-display text-[0.65rem] tracking-[0.5em] text-cyan-200/85 sm:text-xs">
        MULTI-DIMENSIONAL RUNNER
      </div>
      <h1 className="font-display text-6xl font-black leading-none sm:text-8xl">
        <span className="logo-2d">2D</span>
        <span className="mx-2 text-white/70 sm:mx-4">/</span>
        <span className="logo-3d">3D</span>
      </h1>
      <div className="mt-4 font-display text-lg font-bold tracking-[0.22em] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-3xl">
        DIMENSION SHIFT RUNNER
      </div>

      <p className="mt-4 max-w-xl text-base font-semibold leading-snug text-indigo-50/95 drop-shadow sm:text-xl">
        Run the flat world. Hit a giant wall? Press <Key>SPACE</Key> — the map rotates 90° into a top-down 3D city and you
        can simply <b className="text-fuchsia-300">walk around it</b>. Something is hiding behind those walls…
      </p>

      <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row">
        <button
          disabled={busy}
          onClick={onPlay}
          className="btn btn-primary anim-pulse-ring px-10 py-4 text-lg sm:text-xl"
        >
          ▶ Run
        </button>
        <button onClick={onHub} className="btn btn-ghost px-6 py-4 text-sm sm:text-base">
          🗼 Hub · Upgrades · Pets · Tower
        </button>
      </div>

      <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            t: '2D SIDE-SCROLL',
            c: 'text-cyan-200',
            d: 'Jump pits, spikes and spike balls with ▲ / W. Everything here is flat — depth is a lie.',
          },
          {
            t: '3D TOP-DOWN',
            c: 'text-fuchsia-300',
            d: 'Steer with ▲ ▼ to slip around giant walls. No jumping — and your energy drains.',
          },
          {
            t: 'ORBS & GATES',
            c: 'text-amber-200',
            d: 'Orbs refill your Dimension Energy. A light beam behind a wall marks a hidden Dimension Gate.',
          },
        ].map((c) => (
          <div key={c.t} className="glass rounded-xl p-3 text-left">
            <div className={`font-display text-[0.7rem] font-black tracking-[0.2em] ${c.c}`}>{c.t}</div>
            <div className="mt-1 text-sm leading-snug text-white/85">{c.d}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs font-bold tracking-[0.2em] text-white/70">
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
