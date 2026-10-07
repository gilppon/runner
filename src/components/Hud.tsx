import type { RefObject } from 'react';
import type { GameEngine } from '../game/engine';
import type { HudState } from '../game/types';

export interface ToastItem {
  id: number;
  text: string;
  tone: 'info' | 'good' | 'bad' | 'gate';
}

const toneClass: Record<ToastItem['tone'], string> = {
  info: 'border-cyan-300/50 text-cyan-100',
  good: 'border-emerald-300/60 text-emerald-100',
  bad: 'border-rose-400/70 text-rose-100',
  gate: 'border-fuchsia-300/80 text-fuchsia-50',
};

export function Toasts({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[38%] z-20 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`anim-toast glass rounded-xl border px-4 py-2 text-center font-display text-[0.7rem] font-bold tracking-[0.14em] sm:text-sm ${toneClass[t.tone]}`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.currentTarget.blur();
        onClick();
      }}
      className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-black/40 text-base text-white backdrop-blur transition hover:bg-white/15 sm:h-10 sm:w-10"
    >
      {children}
    </button>
  );
}

export function Hud({
  hud,
  muted,
  onPause,
  onMute,
  engineRef,
}: {
  hud: HudState;
  muted: boolean;
  onPause: () => void;
  onMute: () => void;
  engineRef: RefObject<GameEngine | null>;
}) {
  const is3D = hud.mode === '3D_TopDown';
  const pct = Math.max(0, Math.min(100, (hud.energy / hud.maxEnergy) * 100));
  const costPct = Math.min(100, (hud.shiftCost / hud.maxEnergy) * 100);
  const low = is3D && pct < 22;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 select-none">
      {/* top bar */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 sm:p-5">
        <div className="min-w-0">
          <div className="font-display text-2xl font-black leading-none tracking-wider text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)] sm:text-4xl">
            {hud.score.toLocaleString('en-US')}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs font-bold tracking-widest text-white/80 sm:text-sm">
            <span>{hud.distance.toLocaleString('en-US')} m</span>
            <span className="text-cyan-200">⬡ {hud.orbs}</span>
            {hud.gates > 0 && <span className="text-fuchsia-300">✦ {hud.gates}</span>}
          </div>
          <div className="mt-1.5 w-36 rounded-md border border-white/15 bg-slate-950/55 px-1.5 py-1 shadow-sm backdrop-blur sm:w-44">
            <div className="mb-1 flex items-center justify-between font-display text-[0.48rem] font-bold tracking-[0.14em] text-white/80 sm:text-[0.55rem]">
              <span>STAGE {hud.stage}</span>
              <span>{hud.stageRemaining}m TO CLEAR</span>
            </div>
            <div
              role="progressbar"
              aria-label={`Stage ${hud.stage} progress`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.floor(hud.stageProgress * 100)}
              className="h-1 overflow-hidden rounded-full bg-white/15"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300 shadow-[0_0_8px_rgba(251,146,60,0.8)] transition-[width] duration-200"
                style={{ width: `${hud.stageProgress * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-1 font-display text-[0.45rem] font-bold tracking-[0.1em] text-white/85 sm:text-[0.5rem]">
              <span className="truncate">{hud.stageMission}</span>
              <span className={hud.stageMissionStatus === 'ready' ? 'shrink-0 text-emerald-300' : hud.stageMissionStatus === 'failed' ? 'shrink-0 text-rose-300' : 'shrink-0 text-amber-200'}>
                {hud.stageMissionStatus === 'ready'
                  ? 'READY'
                  : hud.stageMissionStatus === 'failed'
                    ? 'FAILED'
                    : `${Math.floor(hud.stageMissionProgress)}/${hud.stageMissionTarget}`}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`${hud.stageMission} contract`}
              aria-valuemin={0}
              aria-valuemax={hud.stageMissionTarget}
              aria-valuenow={Math.floor(hud.stageMissionProgress)}
              className="mt-1 h-1 overflow-hidden rounded-full bg-white/15"
            >
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${hud.stageMissionStatus === 'failed' ? 'bg-rose-400' : hud.stageMissionStatus === 'ready' ? 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]' : 'bg-gradient-to-r from-cyan-300 to-emerald-300'}`}
                style={{ width: `${(hud.stageMissionProgress / hud.stageMissionTarget) * 100}%` }}
              />
            </div>
            <div className="mt-0.5 text-right font-display text-[0.42rem] font-bold tracking-[0.1em] text-amber-200/80">
              +{hud.stageMissionReward} SHARDS
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="glass flex overflow-hidden rounded-full text-[0.5rem] font-black tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]">
            <span
              className={`px-2 py-1.5 font-display transition-colors sm:px-3 ${
                !is3D ? 'bg-cyan-300 text-slate-900' : 'text-white/40'
              }`}
            >
              2D SIDE-SCROLL
            </span>
            <span
              className={`px-2 py-1.5 font-display transition-colors sm:px-3 ${
                is3D ? 'bg-fuchsia-400 text-slate-900' : 'text-white/40'
              }`}
            >
              3D TOP-DOWN
            </span>
          </div>
          <div className="text-center font-display text-[0.5rem] tracking-[0.18em] text-white/60 sm:text-[0.6rem] sm:tracking-[0.25em]">
            ZONE {hud.zone} · {hud.zoneName}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1 text-lg drop-shadow sm:text-2xl">
            {Array.from({ length: hud.maxLives }).map((_, i) => (
              <span key={i} className={i < hud.lives ? '' : 'opacity-30 grayscale'}>
                {i < hud.lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <IconButton label={muted ? 'Unmute (M)' : 'Mute (M)'} onClick={onMute}>
              {muted ? '🔇' : '🔊'}
            </IconButton>
            <IconButton label="Pause (P)" onClick={onPause}>
              ⏸
            </IconButton>
          </div>
        </div>
      </div>

      {/* energy gauge */}
      <div className="absolute left-1/2 top-[9.6rem] w-[min(92vw,520px)] -translate-x-1/2 sm:top-[6.4rem]">
        <div className="mb-1 flex items-end justify-between px-1 font-display text-[0.62rem] font-bold tracking-[0.2em] text-white/85 sm:text-xs">
          <span>DIMENSION ENERGY</span>
          <span className={low ? 'text-rose-300' : ''}>
            {Math.round(hud.energy)} / {Math.round(hud.maxEnergy)}
          </span>
        </div>
        <div
          className={`relative h-4 overflow-hidden rounded-full border border-white/30 bg-black/55 sm:h-5 ${
            low ? 'anim-low-energy' : ''
          }`}
        >
          <div
            className={`h-full ${
              is3D ? 'bg-gradient-to-r from-fuchsia-500 via-pink-400 to-orange-300' : 'bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-500'
            }`}
            style={{ width: `${pct}%`, transition: 'width 90ms linear' }}
          />
          {is3D && <div className="stripes absolute inset-0 opacity-60" />}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, transparent 0, transparent calc(10% - 2px), rgba(0,0,0,0.55) calc(10% - 2px), rgba(0,0,0,0.55) 10%)',
            }}
          />
          {!is3D && (
            <div
              className="absolute bottom-0 top-0 w-[3px] bg-white shadow-[0_0_8px_#fff]"
              style={{ left: `calc(${costPct}% - 1px)` }}
              title="Shift cost"
            />
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-[0.68rem] font-bold tracking-[0.16em] sm:text-xs">
          <span className={`keycap ${hud.canShift && !is3D ? 'anim-pulse-ring' : ''}`}>SPACE</span>
          {is3D ? (
            <span className="text-fuchsia-200">RETURN TO 2D · FREE · 3D DRAINS ENERGY</span>
          ) : hud.canShift ? (
            <span className="text-cyan-100">SHIFT TO 3D · −{Math.round(hud.shiftCost)} ENERGY</span>
          ) : (
            <span className="text-rose-200">NEED {Math.ceil(hud.shiftCost - hud.energy)} MORE ENERGY · GRAB ⬡ ORBS</span>
          )}
        </div>
      </div>

      {/* hint banner */}
      {hud.hint && (
        <div
          key={hud.hint.key}
          className={`anim-hint glass absolute left-1/2 top-[14.8rem] w-[min(92vw,640px)] rounded-xl border px-3 py-2 text-center text-xs font-bold sm:top-[11.6rem] sm:px-4 sm:text-base ${
            hud.hint.urgent
              ? 'animate-pulse border-rose-300 bg-rose-950/80 text-rose-50'
              : 'border-amber-300/50 text-amber-50'
          }`}
        >
          <span className="mr-2 text-lg">{hud.hint.icon}</span>
          {hud.hint.text}
        </div>
      )}

      {/* desktop legend */}
      <div className="absolute bottom-3 left-1/2 hidden -translate-x-1/2 items-center gap-4 rounded-full bg-black/35 px-4 py-1.5 text-[0.7rem] tracking-widest text-white/80 backdrop-blur [@media(pointer:fine)]:flex">
        <span>
          <span className="keycap">SPACE</span> shift dimension
        </span>
        <span>
          <span className="keycap">▲ / W</span> jump (2D) · walk up (3D)
        </span>
        <span>
          <span className="keycap">▼ / S</span> slide (2D) · walk down (3D)
        </span>
        <span>
          <span className="keycap">P</span> pause
        </span>
      </div>

      {/* touch controls */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden items-end justify-between p-4 [@media(pointer:coarse)]:flex">
        <div className="flex flex-col gap-3">
          <HoldButton label="▲" sub={is3D ? 'UP' : 'JUMP'} onHold={(d) => engineRef.current?.touchUp(d)} />
          <HoldButton label="▼" sub={is3D ? 'DOWN' : 'SLIDE'} small onHold={(d) => engineRef.current?.touchDown(d)} />
        </div>
        <button
          className={`pointer-events-auto flex h-28 w-28 touch-none flex-col items-center justify-center rounded-full border-2 font-display text-xs font-black tracking-widest text-white shadow-lg active:scale-95 ${
            is3D ? 'border-fuchsia-300 bg-fuchsia-500/50' : 'border-cyan-200 bg-cyan-500/40'
          }`}
          onPointerDown={(e) => {
            e.preventDefault();
            engineRef.current?.toggleDimension();
          }}
        >
          <span className="text-2xl">{is3D ? '▭' : '◈'}</span>
          SHIFT
        </button>
      </div>
    </div>
  );
}

function HoldButton({
  label,
  sub,
  small,
  onHold,
}: {
  label: string;
  sub: string;
  small?: boolean;
  onHold: (down: boolean) => void;
}) {
  const size = small ? 'h-16 w-24' : 'h-24 w-24';
  return (
    <button
      className={`pointer-events-auto flex ${size} touch-none flex-col items-center justify-center rounded-2xl border-2 border-white/40 bg-white/10 font-display text-xl font-black text-white backdrop-blur active:bg-white/30`}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        onHold(true);
      }}
      onPointerUp={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onLostPointerCapture={() => onHold(false)}
    >
      {label}
      <span className="text-[0.55rem] tracking-widest opacity-80">{sub}</span>
    </button>
  );
}
