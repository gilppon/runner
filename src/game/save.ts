import { EGG_COST, PETS, RARITY_STYLE, TOWER_FLOORS, UPGRADES, petById } from './content';
import type { Perk, UpgradeKey } from './content';
import type { RunConfig } from './types';

const KEY = 'dimension-shift-runner-save-v1';

export interface SaveData {
  shards: number;
  gauge: number;
  efficiency: number;
  orbYield: number;
  tower: number; // floors built above the lobby
  pets: string[];
  equipped: string | null;
  best: number;
  bestDist: number;
  runs: number;
  totalOrbs: number;
  totalGates: number;
  hints: Record<string, number>;
  muted: boolean;
  lastDaily: number;
  dailyStreak: number;
  claimedMilestones: number[];
  tutorialSeen: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  shards: 0,
  gauge: 0,
  efficiency: 0,
  orbYield: 0,
  tower: 0,
  pets: [],
  equipped: null,
  best: 0,
  bestDist: 0,
  runs: 0,
  totalOrbs: 0,
  totalGates: 0,
  hints: {},
  muted: false,
  lastDaily: 0,
  dailyStreak: 0,
  claimedMilestones: [],
  tutorialSeen: false,
};

/** 7-day daily reward cycle */
export const DAILY_SHARDS = [30, 45, 60, 85, 120, 170, 260];

/** Achievements: lifetime orbs / gates / best distance */
export interface Milestone {
  key: 'orbs' | 'gates' | 'dist';
  at: number;
  shards: number;
  label: string;
  icon: string;
}

export const MILESTONES: Milestone[] = [
  { key: 'dist', at: 100, shards: 25, icon: '\u{1f3c1}', label: '100 m reached' },
  { key: 'orbs', at: 300, shards: 40, icon: '⬡', label: '300 orbs' },
  { key: 'orbs', at: 1200, shards: 120, icon: '⬡', label: '1,200 orbs' },
  { key: 'gates', at: 10, shards: 80, icon: '✦', label: '10 gates' },
  { key: 'gates', at: 40, shards: 250, icon: '✦', label: '40 gates' },
  { key: 'dist', at: 500, shards: 60, icon: '📏', label: '500 m cleared' },
  { key: 'dist', at: 1500, shards: 220, icon: '📏', label: '1,500 m cleared' },
];

export function dailyStatus(s: SaveData): { available: boolean; day: number; shards: number } {
  const now = Date.now();
  const today = new Date(now).toDateString();
  if (s.lastDaily > 0 && new Date(s.lastDaily).toDateString() === today) {
    const day = Math.min(Math.max(s.dailyStreak, 1), 7);
    return { available: false, day, shards: DAILY_SHARDS[day - 1] ?? 30 };
  }
  const yesterday = new Date(now - 86400000).toDateString();
  const continued = s.lastDaily > 0 && new Date(s.lastDaily).toDateString() === yesterday;
  const next = continued ? (s.dailyStreak % 7) + 1 : 1;
  return { available: true, day: next, shards: DAILY_SHARDS[next - 1] ?? 30 };
}

export function milestoneAchieved(s: SaveData, m: Milestone): boolean {
  if (m.key === 'orbs') return s.totalOrbs >= m.at;
  if (m.key === 'gates') return s.totalGates >= m.at;
  return s.bestDist >= m.at;
}

export function nextMilestone(s: SaveData): Milestone | null {
  for (const m of MILESTONES) {
    if (milestoneAchieved(s, m) && !s.claimedMilestones.includes(m.at)) return m;
  }
  return null;
}

export function upcomingMilestone(s: SaveData): Milestone | null {
  for (const m of MILESTONES) if (!s.claimedMilestones.includes(m.at)) return m;
  return null;
}

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SAVE, hints: {}, claimedMilestones: [] };
    const p = JSON.parse(raw) as Partial<SaveData>;
    // Corruption/NaN guard: every numeric field is clamped before merging
    const merged: SaveData = {
      ...DEFAULT_SAVE,
      ...p,
      shards: Math.max(0, Math.round(num(p.shards, 0))),
      gauge: Math.max(0, Math.round(num(p.gauge, 0))),
      efficiency: Math.max(0, Math.round(num(p.efficiency, 0))),
      orbYield: Math.max(0, Math.round(num(p.orbYield, 0))),
      tower: Math.max(0, Math.round(num(p.tower, 0))),
      best: Math.max(0, Math.round(num(p.best, 0))),
      bestDist: Math.max(0, Math.round(num(p.bestDist, 0))),
      runs: Math.max(0, Math.round(num(p.runs, 0))),
      totalOrbs: Math.max(0, Math.round(num(p.totalOrbs, 0))),
      totalGates: Math.max(0, Math.round(num(p.totalGates, 0))),
      lastDaily: Math.max(0, num(p.lastDaily, 0)),
      dailyStreak: Math.max(0, Math.min(7, Math.round(num(p.dailyStreak, 0)))),
      pets: Array.isArray(p.pets) ? p.pets.filter((x): x is string => typeof x === 'string') : [],
      hints: { ...(p.hints ?? {}) },
      claimedMilestones: Array.isArray(p.claimedMilestones)
        ? p.claimedMilestones.filter((x): x is number => typeof x === 'number')
        : [],
    };
    return merged;
  } catch {
    return { ...DEFAULT_SAVE, hints: {}, claimedMilestones: [] };
  }
}

export function writeSave(s: SaveData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable (private mode etc.) */
  }
}

export function upgradeCost(key: UpgradeKey, level: number): number {
  const def = UPGRADES.find((u) => u.key === key)!;
  return Math.round(def.baseCost * Math.pow(def.growth, level));
}

export function towerCost(index: number): number {
  return Math.round(55 * Math.pow(1.55, index));
}

/** Weighted random pet that the player doesn't own yet (null when complete). */
export function rollPet(owned: string[]): string | null {
  const pool = PETS.filter((p) => !owned.includes(p.id));
  if (!pool.length) return null;
  const total = pool.reduce((a, p) => a + RARITY_STYLE[p.rarity].weight, 0);
  let r = Math.random() * total;
  for (const p of pool) {
    r -= RARITY_STYLE[p.rarity].weight;
    if (r <= 0) return p.id;
  }
  return pool[pool.length - 1].id;
}

export { EGG_COST };

/** Combine upgrades + equipped pet + tower floors into a concrete run config. */
export function buildRunConfig(save: SaveData): RunConfig {
  const pet = petById(save.equipped);
  const perks: Perk[] = [];
  if (pet) perks.push(pet.perk);
  for (let i = 0; i < save.tower; i++) perks.push(TOWER_FLOORS[i].perk);

  const sum = (k: keyof Perk) => perks.reduce((a, p) => a + (p[k] ?? 0), 0);

  const maxEnergy = 100 + 14 * save.gauge + sum('maxEnergy');
  const startEnergy = Math.min(maxEnergy, maxEnergy * 0.6 + sum('startEnergy'));

  return {
    maxEnergy,
    startEnergy,
    drainMul: (1 - 0.05 * save.efficiency) * (1 - Math.min(0.8, sum('drainPct'))),
    shiftCostMul: (1 - 0.04 * save.efficiency) * (1 - Math.min(0.8, sum('shiftCostPct'))),
    orbEnergy: 8 + save.orbYield * 1.2 + sum('orbEnergy'),
    magnet: 1.6 + sum('magnet'),
    regen2D: sum('regen2D'),
    lives: 3 + sum('lives'),
    shardMul: 1 + sum('shardsPct'),
    scoreMul: 1 + sum('scorePct'),
    petId: pet?.id ?? null,
    ownedPets: [...save.pets],
    hintCounts: { ...save.hints },
  };
}
