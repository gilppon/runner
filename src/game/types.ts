// Shared types for the 2D/3D Dimension Shift Runner

export type DimensionMode = '2D_Side' | '3D_TopDown';

/** Core dimension state described in the design spec. */
export interface DimensionState {
  mode: DimensionMode;
  cameraAngle: number; // degrees. 0 = side view, ~78 = top-down
  dimensionEnergy: number;
}

export interface RunConfig {
  maxEnergy: number;
  startEnergy: number;
  drainMul: number; // multiplier on 3D energy drain
  shiftCostMul: number; // multiplier on 2D -> 3D shift cost
  orbEnergy: number; // energy per orb
  magnet: number; // orb magnet radius
  regen2D: number; // passive energy regen per second while in 2D
  lives: number;
  shardMul: number; // 1 = normal
  scoreMul: number; // 1 = normal
  petId: string | null;
  ownedPets: string[];
  hintCounts: Record<string, number>;
}

export interface HintInfo {
  key: string;
  text: string;
  icon: string;
}

export interface HudState {
  score: number;
  distance: number;
  orbs: number;
  lives: number;
  maxLives: number;
  energy: number;
  maxEnergy: number;
  shiftCost: number;
  canShift: boolean;
  mode: DimensionMode;
  cameraAngle: number;
  transitioning: boolean;
  zone: number;
  zoneName: string;
  speed: number;
  invuln: boolean;
  gates: number;
  hint: HintInfo | null;
}

export interface RunResult {
  score: number;
  distance: number;
  orbs: number;
  gates: number;
  shards: number;
  petsFound: string[];
  canRevive: boolean;
}

export type ToastTone = 'info' | 'good' | 'bad' | 'gate';

export type EngineEvent =
  | { type: 'toast'; text: string; tone: ToastTone }
  | { type: 'petFound'; petId: string }
  | { type: 'hintShown'; key: string }
  | { type: 'gameover'; result: RunResult }
  | { type: 'pause' }
  | { type: 'error'; message: string };
