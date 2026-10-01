import { useEffect, useRef, useState } from 'react';
import { EGG_COST, PETS, RARITY_STYLE, TOWER_FLOORS, UPGRADES, perkLines, petById } from '../game/content';
import type { PetDef, PetDim, TowerFloor } from '../game/content';
import { rollPet, towerCost, upgradeCost } from '../game/save';
import type { SaveData } from '../game/save';
import { audio } from '../game/audio';

type Tab = 'upgrades' | 'pets' | 'tower';
type Updater = (fn: (s: SaveData) => SaveData) => void;

const dimStyle: Record<PetDim, { label: string; cls: string }> = {
  '2D': { label: '2D', cls: 'bg-cyan-400/20 text-cyan-200 border-cyan-300/50' },
  '3D': { label: '3D', cls: 'bg-fuchsia-400/20 text-fuchsia-200 border-fuchsia-300/50' },
  HYBRID: { label: '2D+3D', cls: 'bg-amber-300/20 text-amber-100 border-amber-200/50' },
};

export function Hub({ save, update, onClose }: { save: SaveData; update: Updater; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('upgrades');

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-2 sm:p-6">
      <div className="glass flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
          <div>
            <div className="font-display text-lg font-black tracking-[0.2em] text-white sm:text-xl">DIMENSION HUB</div>
            <div className="text-xs tracking-widest text-white/60">Spend shards earned from runs on permanent power.</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-amber-300/40 bg-black/30 px-4 py-1.5 font-display text-sm font-bold text-amber-200">
              ◆ {save.shards.toLocaleString('en-US')}
            </div>
            <button onClick={onClose} className="btn btn-ghost px-4 py-2 text-xs">
              ✕ Close
            </button>
          </div>
        </div>

        <div className="flex gap-1 px-3 pt-3 sm:px-6">
          {(
            [
              ['upgrades', '🔋 UPGRADES'],
              ['pets', '🐾 PETS'],
              ['tower', '🗼 HYBRID TOWER'],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => {
                audio.ui();
                setTab(k);
              }}
              className={`rounded-t-lg px-3 py-2 font-display text-[0.65rem] font-bold tracking-[0.15em] transition sm:px-5 sm:text-xs ${
                tab === k ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto bg-white/[0.06] p-3 sm:p-6">
          {tab === 'upgrades' && <Upgrades save={save} update={update} />}
          {tab === 'pets' && <Pets save={save} update={update} />}
          {tab === 'tower' && <Tower save={save} update={update} />}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- upgrades

function Upgrades({ save, update }: { save: SaveData; update: Updater }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {UPGRADES.map((u) => {
        const level = save[u.key];
        const maxed = level >= u.max;
        const cost = upgradeCost(u.key, level);
        const can = !maxed && save.shards >= cost;
        return (
          <div key={u.key} className="glass flex flex-col rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{u.icon}</div>
              <div>
                <div className="font-display text-sm font-black tracking-wider text-white">{u.name}</div>
                <div className="text-xs tracking-widest text-white/60">
                  LV {level} / {u.max}
                </div>
              </div>
            </div>
            <p className="mt-2 flex-1 text-sm leading-snug text-white/80">{u.blurb}</p>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: u.max }).map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm ${i < level ? 'bg-gradient-to-r from-cyan-300 to-fuchsia-400' : 'bg-white/15'}`}
                />
              ))}
            </div>
            <div className="mt-2 text-xs font-bold tracking-wide text-cyan-100">
              {u.stat(level)}
              {!maxed && <span className="text-white/50"> → </span>}
              {!maxed && <span className="text-emerald-300">{u.stat(level + 1)}</span>}
            </div>
            <button
              disabled={!can}
              onClick={() => {
                audio.buy();
                update((s) => {
                  const c = upgradeCost(u.key, s[u.key]);
                  if (s[u.key] >= u.max || s.shards < c) return s;
                  return { ...s, shards: s.shards - c, [u.key]: s[u.key] + 1 };
                });
              }}
              className="btn btn-gold mt-3 py-2.5 text-xs"
            >
              {maxed ? 'MAXED' : `Upgrade · ◆ ${cost.toLocaleString('en-US')}`}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------- pets

function PetCard({
  pet,
  owned,
  equipped,
  onEquip,
}: {
  pet: PetDef;
  owned: boolean;
  equipped: boolean;
  onEquip: () => void;
}) {
  const r = RARITY_STYLE[pet.rarity];
  const d = dimStyle[pet.dim];
  return (
    <div
      className="glass relative flex flex-col rounded-xl p-3"
      style={{ borderColor: owned ? `${r.color}88` : undefined, boxShadow: equipped ? `0 0 22px ${r.color}55` : undefined }}
    >
      <div className="flex items-start justify-between">
        <div className={`text-4xl ${owned ? '' : 'opacity-25 brightness-0 invert'}`}>{pet.emoji}</div>
        <div className="flex flex-col items-end gap-1">
          <span className="font-display text-[0.55rem] font-black tracking-widest" style={{ color: r.color }}>
            {r.label}
          </span>
          <span className={`rounded border px-1.5 py-0.5 font-display text-[0.55rem] font-bold tracking-widest ${d.cls}`}>
            {d.label}
          </span>
        </div>
      </div>
      <div className="mt-2 font-display text-xs font-black tracking-wider text-white">{owned ? pet.name : '???'}</div>
      {owned ? (
        <>
          <div className="mt-1 text-xs leading-snug text-white/70">{pet.blurb}</div>
          <div className="mt-1.5 flex-1 text-xs font-bold text-emerald-300">{perkLines(pet.perk).join(' · ')}</div>
          <button
            onClick={onEquip}
            disabled={equipped}
            className={`btn mt-2 py-2 text-[0.65rem] ${equipped ? 'btn-ghost' : 'btn-primary'}`}
          >
            {equipped ? '✓ Equipped' : 'Equip'}
          </button>
        </>
      ) : (
        <div className="mt-1 flex-1 text-xs text-white/40">Hatch a Rift Egg or find one behind a hidden Dimension Gate.</div>
      )}
    </div>
  );
}

function Pets({ save, update }: { save: SaveData; update: Updater }) {
  const [phase, setPhase] = useState<'idle' | 'wobble'>('idle');
  const [reveal, setReveal] = useState<PetDef | null>(null);
  const timer = useRef<number | null>(null);
  const complete = save.pets.length >= PETS.length;
  const can = !complete && save.shards >= EGG_COST && phase === 'idle';

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const hatch = () => {
    const id = rollPet(save.pets);
    if (!id || save.shards < EGG_COST) return;
    audio.buy();
    update((s) =>
      s.shards < EGG_COST || s.pets.includes(id)
        ? s
        : { ...s, shards: s.shards - EGG_COST, pets: [...s.pets, id], equipped: s.equipped ?? id },
    );
    setPhase('wobble');
    timer.current = window.setTimeout(() => {
      setPhase('idle');
      setReveal(petById(id));
      audio.gate();
    }, 1000);
  };

  return (
    <div>
      <div className="glass mb-4 flex flex-wrap items-center gap-4 rounded-xl p-4">
        <div className={`text-5xl ${phase === 'wobble' ? 'anim-egg' : 'anim-floaty'}`}>🥚</div>
        <div className="min-w-[12rem] flex-1">
          <div className="font-display text-sm font-black tracking-widest text-white">RIFT EGG</div>
          <div className="text-sm text-white/70">
            Hatches a dimension-native companion. It follows you through every shift and grants a passive perk.
          </div>
          <div className="mt-1 text-xs font-bold tracking-widest text-white/50">
            COLLECTED {save.pets.length} / {PETS.length}
          </div>
        </div>
        <button disabled={!can} onClick={hatch} className="btn btn-gold px-6 py-3 text-xs">
          {complete ? 'Collection complete' : `Hatch · ◆ ${EGG_COST.toLocaleString('en-US')}`}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {PETS.map((p) => (
          <PetCard
            key={p.id}
            pet={p}
            owned={save.pets.includes(p.id)}
            equipped={save.equipped === p.id}
            onEquip={() => {
              audio.ui();
              update((s) => ({ ...s, equipped: p.id }));
            }}
          />
        ))}
      </div>

      {reveal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setReveal(null)}
        >
          <div className="glass anim-reveal flex max-w-sm flex-col items-center rounded-2xl p-8 text-center">
            <div className="font-display text-xs font-black tracking-[0.3em]" style={{ color: RARITY_STYLE[reveal.rarity].color }}>
              {RARITY_STYLE[reveal.rarity].label} · NEW COMPANION
            </div>
            <div className="my-4 text-8xl">{reveal.emoji}</div>
            <div className="font-display text-xl font-black tracking-widest text-white">{reveal.name}</div>
            <div className="mt-1 text-sm text-white/75">{reveal.blurb}</div>
            <div className="mt-2 text-sm font-bold text-emerald-300">{perkLines(reveal.perk).join(' · ')}</div>
            <button className="btn btn-primary mt-5 px-8 py-2.5 text-xs">Nice!</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------- tower

const floorColors: Record<PetDim, { a: string; b: string }> = {
  '2D': { a: '#19f0ff', b: '#0d8a99' },
  '3D': { a: '#ff5cf2', b: '#9a1c90' },
  HYBRID: { a: '#19f0ff', b: '#ff5cf2' },
};

function FloorBlock({
  name,
  style,
  ghost,
  fresh,
  width,
}: {
  name: string;
  style: PetDim;
  ghost?: boolean;
  fresh?: boolean;
  width: number;
}) {
  const c = floorColors[style];
  const front =
    style === 'HYBRID'
      ? `linear-gradient(90deg, ${c.a}dd 0 50%, ${c.b}dd 50% 100%)`
      : `linear-gradient(180deg, ${c.a}cc, ${c.b}cc)`;
  return (
    <div className={`relative flex h-9 items-stretch ${fresh ? 'anim-floor' : ''}`} style={{ width, opacity: ghost ? 0.35 : 1 }}>
      <div
        className="relative flex flex-1 items-center overflow-hidden px-2 font-display text-[0.55rem] font-black tracking-widest text-slate-950"
        style={{
          background: ghost ? 'transparent' : front,
          border: ghost ? '2px dashed rgba(255,255,255,0.6)' : '2px solid rgba(255,255,255,0.65)',
          borderRadius: style === '2D' ? 0 : style === '3D' ? 6 : 3,
        }}
      >
        <span className={ghost ? 'text-white' : ''}>{name.toUpperCase()}</span>
        <div className="absolute bottom-1 right-1.5 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-1.5 w-1.5 bg-white/70" />
          ))}
        </div>
      </div>
      <div
        style={{
          width: 14,
          background: ghost ? 'rgba(255,255,255,0.15)' : `linear-gradient(180deg, ${c.b}, #0a0a1a)`,
          transform: 'skewY(-38deg)',
          transformOrigin: '0 0',
          border: '1px solid rgba(255,255,255,0.3)',
        }}
      />
    </div>
  );
}

function TowerView({ built, justBuilt }: { built: number; justBuilt: number }) {
  const floors: { name: string; style: PetDim; ghost?: boolean; idx: number }[] = [];
  floors.push({ name: 'Lobby', style: 'HYBRID', idx: 0 });
  for (let i = 0; i < built; i++) floors.push({ name: TOWER_FLOORS[i].name, style: TOWER_FLOORS[i].style, idx: i + 1 });
  if (built < TOWER_FLOORS.length) {
    floors.push({ name: TOWER_FLOORS[built].name, style: TOWER_FLOORS[built].style, ghost: true, idx: built + 1 });
  }
  const list = [...floors].reverse();
  return (
    <div className="flex flex-col items-center justify-end gap-[3px] pb-2 pr-3">
      {list.map((f) => (
        <FloorBlock
          key={`${f.idx}-${f.ghost ? 'g' : 'b'}`}
          name={f.name}
          style={f.style}
          ghost={f.ghost}
          fresh={f.idx === justBuilt}
          width={210 - Math.min(f.idx, 9) * 4}
        />
      ))}
      <div className="mt-1 h-2 w-64 rounded-full bg-gradient-to-r from-cyan-400/50 via-white/30 to-fuchsia-400/50 blur-[2px]" />
    </div>
  );
}

function FloorRow({ floor, index, built, next }: { floor: TowerFloor; index: number; built: boolean; next: boolean }) {
  const d = dimStyle[floor.style];
  return (
    <div
      className={`glass flex items-center gap-3 rounded-lg px-3 py-2 ${built ? '' : next ? 'ring-1 ring-amber-300/60' : 'opacity-50'}`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded bg-white/10 font-display text-xs font-black">
        {built ? '✓' : index + 2}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-display text-xs font-black tracking-wider text-white">{floor.name}</span>
          <span className={`rounded border px-1 py-px font-display text-[0.5rem] font-bold tracking-widest ${d.cls}`}>
            {d.label}
          </span>
        </div>
        <div className="truncate text-xs text-white/60">{floor.blurb}</div>
      </div>
      <div className="text-right text-xs font-bold text-emerald-300">{perkLines(floor.perk).join(' · ')}</div>
    </div>
  );
}

function Tower({ save, update }: { save: SaveData; update: Updater }) {
  const built = save.tower;
  const [justBuilt, setJustBuilt] = useState(-1);
  const done = built >= TOWER_FLOORS.length;
  const cost = towerCost(built);
  const can = !done && save.shards >= cost;

  return (
    <div className="grid gap-4 md:grid-cols-[260px_1fr]">
      <div className="glass flex min-h-[260px] flex-col items-center justify-end rounded-xl p-4">
        <div className="mb-3 self-start text-xs font-bold tracking-widest text-white/60">
          HEIGHT · {built + 1} {built === 0 ? 'FLOOR' : 'FLOORS'}
        </div>
        <TowerView built={built} justBuilt={justBuilt} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="glass rounded-xl p-4">
          <div className="font-display text-sm font-black tracking-widest text-white">HYBRID TOWER</div>
          <p className="mt-1 text-sm text-white/75">
            A skyscraper that is flat on one side and solid on the other. Every floor you add gives a permanent bonus to
            every run.
          </p>
          <button
            disabled={!can}
            onClick={() => {
              audio.buy();
              setJustBuilt(built + 1);
              update((s) => {
                const c = towerCost(s.tower);
                if (s.tower >= TOWER_FLOORS.length || s.shards < c) return s;
                return { ...s, shards: s.shards - c, tower: s.tower + 1 };
              });
            }}
            className="btn btn-gold mt-3 px-6 py-3 text-xs"
          >
            {done ? 'Tower complete' : `Build floor ${built + 2} · ◆ ${cost.toLocaleString('en-US')}`}
          </button>
        </div>
        {TOWER_FLOORS.map((f, i) => (
          <FloorRow key={f.id} floor={f} index={i} built={i < built} next={i === built} />
        ))}
      </div>
    </div>
  );
}
