// Static game content: pets, upgrades and hybrid-tower floors.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type PetDim = '2D' | '3D' | 'HYBRID';

export interface Perk {
  magnet?: number; // orb magnet radius bonus
  regen2D?: number; // energy / sec in 2D
  drainPct?: number; // reduce 3D drain (0..1)
  shiftCostPct?: number; // reduce shift cost (0..1)
  shardsPct?: number; // +% shards
  scorePct?: number; // +% score
  lives?: number;
  startEnergy?: number;
  orbEnergy?: number;
  maxEnergy?: number;
}

export interface PetDef {
  id: string;
  name: string;
  emoji: string;
  dim: PetDim;
  rarity: Rarity;
  color: string;
  perk: Perk;
  blurb: string;
}

export const PETS: PetDef[] = [
  {
    id: 'flat-fox',
    name: 'Flat Fox',
    emoji: '🦊',
    dim: '2D',
    rarity: 'common',
    color: '#ff9d4d',
    perk: { magnet: 2.2 },
    blurb: 'A paper-thin fox that sniffs out orbs.',
  },
  {
    id: 'cube-cat',
    name: 'Cube Cat',
    emoji: '🐱',
    dim: '3D',
    rarity: 'common',
    color: '#ffd35e',
    perk: { drainPct: 0.18 },
    blurb: 'Always lands on the right face. Calms the 3D drain.',
  },
  {
    id: 'sprite-bat',
    name: 'Sprite Bat',
    emoji: '🦇',
    dim: '2D',
    rarity: 'rare',
    color: '#b18cff',
    perk: { regen2D: 1.6 },
    blurb: 'Sips energy from flat light while you run in 2D.',
  },
  {
    id: 'voxel-pup',
    name: 'Voxel Pup',
    emoji: '🐶',
    dim: '3D',
    rarity: 'rare',
    color: '#7dd3fc',
    perk: { shiftCostPct: 0.35 },
    blurb: 'Loves fetching dimensions. Shift cost drops sharply.',
  },
  {
    id: 'moire-moth',
    name: 'Moiré Moth',
    emoji: '🦋',
    dim: 'HYBRID',
    rarity: 'epic',
    color: '#f472b6',
    perk: { shardsPct: 0.25 },
    blurb: 'Wings interfere between planes and shed extra shards.',
  },
  {
    id: 'tesseract-owl',
    name: 'Tesseract Owl',
    emoji: '🦉',
    dim: 'HYBRID',
    rarity: 'epic',
    color: '#5eead4',
    perk: { scorePct: 0.3, magnet: 1 },
    blurb: 'Sees in four dimensions. Boosts score and magnet.',
  },
  {
    id: 'klein-whale',
    name: 'Klein Whale',
    emoji: '🐋',
    dim: 'HYBRID',
    rarity: 'legendary',
    color: '#60a5fa',
    perk: { lives: 1, regen2D: 0.8 },
    blurb: 'Swims through the inside-out. An extra life follows it.',
  },
  {
    id: 'penrose-dragon',
    name: 'Penrose Dragon',
    emoji: '🐉',
    dim: 'HYBRID',
    rarity: 'legendary',
    color: '#fb7185',
    perk: { drainPct: 0.3, shiftCostPct: 0.2, magnet: 1.8, shardsPct: 0.1 },
    blurb: 'An impossible loop of scales. Bends every rule a bit.',
  },
];

export const RARITY_STYLE: Record<Rarity, { label: string; color: string; weight: number }> = {
  common: { label: 'COMMON', color: '#9fb3c8', weight: 50 },
  rare: { label: 'RARE', color: '#5cc8ff', weight: 30 },
  epic: { label: 'EPIC', color: '#c084fc', weight: 15 },
  legendary: { label: 'LEGENDARY', color: '#ffc233', weight: 5 },
};

export const EGG_COST = 60;

export type UpgradeKey = 'gauge' | 'efficiency' | 'orbYield';

export interface UpgradeDef {
  key: UpgradeKey;
  name: string;
  icon: string;
  max: number;
  baseCost: number;
  growth: number;
  blurb: string;
  stat: (level: number) => string;
}

export const UPGRADES: UpgradeDef[] = [
  {
    key: 'gauge',
    name: 'Energy Capacity',
    icon: '🔋',
    max: 12,
    baseCost: 30,
    growth: 1.45,
    blurb: 'A bigger Dimension Energy tank means longer 3D detours.',
    stat: (l) => `Max energy ${100 + 14 * l}`,
  },
  {
    key: 'efficiency',
    name: 'Shift Efficiency',
    icon: '⚙️',
    max: 8,
    baseCost: 40,
    growth: 1.5,
    blurb: 'Cheaper shifts and a slower 3D energy drain.',
    stat: (l) => `Drain −${l * 5}% · Shift cost −${l * 4}%`,
  },
  {
    key: 'orbYield',
    name: 'Orb Yield',
    icon: '💠',
    max: 8,
    baseCost: 35,
    growth: 1.5,
    blurb: 'Every orb you collect refills more energy.',
    stat: (l) => `+${(8 + l * 1.2).toFixed(1)} energy per orb`,
  },
];

export interface TowerFloor {
  id: string;
  name: string;
  style: PetDim;
  blurb: string;
  perk: Perk;
}

export const TOWER_FLOORS: TowerFloor[] = [
  { id: 'archive', name: 'Flatland Archive', style: '2D', blurb: 'Pressed pages of forgotten levels.', perk: { shardsPct: 0.08 } },
  { id: 'garage', name: 'Cube Garage', style: '3D', blurb: 'Warm-up rigs for the dimension drive.', perk: { startEnergy: 12 } },
  { id: 'workshop', name: 'Hybrid Workshop', style: 'HYBRID', blurb: 'Half blueprint, half prototype.', perk: { regen2D: 0.6 } },
  { id: 'lounge', name: 'Paradox Lounge', style: '2D', blurb: 'Where scores are inflated on purpose.', perk: { scorePct: 0.1 } },
  { id: 'observatory', name: 'Rift Observatory', style: '3D', blurb: 'Watches orbs before they spawn.', perk: { orbEnergy: 1.5 } },
  { id: 'cafe', name: 'Klein Bottle Café', style: 'HYBRID', blurb: 'The inside is also the outside.', perk: { shardsPct: 0.12 } },
  { id: 'lab', name: 'Tesseract Lab', style: '3D', blurb: 'Expands your energy in a fourth direction.', perk: { maxEnergy: 20 } },
  { id: 'stairwell', name: 'Escher Stairwell', style: 'HYBRID', blurb: 'Always up. Also always down.', perk: { scorePct: 0.12 } },
  { id: 'apex', name: 'Apex Singularity', style: 'HYBRID', blurb: 'One point holding every plane.', perk: { lives: 1, magnet: 0.8 } },
];

export function perkLines(p: Perk): string[] {
  const out: string[] = [];
  if (p.magnet) out.push(`Orb magnet +${p.magnet}`);
  if (p.regen2D) out.push(`+${p.regen2D} energy/s in 2D`);
  if (p.drainPct) out.push(`3D drain −${Math.round(p.drainPct * 100)}%`);
  if (p.shiftCostPct) out.push(`Shift cost −${Math.round(p.shiftCostPct * 100)}%`);
  if (p.shardsPct) out.push(`+${Math.round(p.shardsPct * 100)}% shards`);
  if (p.scorePct) out.push(`+${Math.round(p.scorePct * 100)}% score`);
  if (p.lives) out.push(`+${p.lives} ${p.lives === 1 ? 'life' : 'lives'}`);
  if (p.startEnergy) out.push(`+${p.startEnergy} start energy`);
  if (p.orbEnergy) out.push(`+${p.orbEnergy} orb energy`);
  if (p.maxEnergy) out.push(`+${p.maxEnergy} energy capacity`);
  return out;
}

export const petById = (id: string | null | undefined) => PETS.find((p) => p.id === id) ?? null;
