import type { RunMode, RunResult } from './types';

export interface RunnerChallenge {
  mode: RunMode;
  seed?: number;
  score: number;
  distance: number;
  orbs: number;
  gates: number;
}

export function dailyGateTrialSeed(now = new Date()): number {
  const utcDay = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86_400_000);
  return (Math.imul(utcDay, 1664525) + 1013904223) >>> 0;
}

export function readRunnerChallenge(): RunnerChallenge | null {
  const params = new URLSearchParams(window.location.search);
  const get = (key: string) => params.get(key) || params.get(`gd${key}`);
  if (get('type') !== 'runner_challenge') return null;
  const number = (key: string) => {
    const value = Number(get(key));
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  };
  const seedValue = get('seed');
  const seed = seedValue !== null && /^\d+$/.test(seedValue) ? Number(seedValue) >>> 0 : undefined;
  const mode: RunMode = get('mode') === 'gateTrial' ? 'gateTrial' : 'runner';
  return { mode, seed, score: number('score'), distance: number('distance'), orbs: number('carrots'), gates: number('gates') };
}

export async function createRunnerShareUrl(result: RunResult): Promise<string> {
  const params = {
    type: 'runner_challenge',
    mode: result.mode,
    seed: String(result.routeSeed),
    score: String(result.score),
    distance: String(result.distance),
    carrots: String(result.orbs),
    gates: String(result.gates),
  };
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}
