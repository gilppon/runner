import type { RunResult } from './types';

export interface RunnerChallenge {
  seed?: number;
  score: number;
  distance: number;
  orbs: number;
  gates: number;
}

export function readRunnerChallenge(): RunnerChallenge | null {
  const params = new URLSearchParams(window.location.search);
  const sdk = window.PokiSDK as unknown as { getURLParam?: (key: string) => string | null } | undefined;
  const get = (key: string) => sdk?.getURLParam?.(key) || params.get(key) || params.get(`gd${key}`);
  if (get('type') !== 'runner_challenge') return null;
  const number = (key: string) => {
    const value = Number(get(key));
    return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  };
  const seedValue = get('seed');
  const seed = seedValue !== null && /^\d+$/.test(seedValue) ? Number(seedValue) >>> 0 : undefined;
  return { seed, score: number('score'), distance: number('distance'), orbs: number('carrots'), gates: number('gates') };
}

export async function createRunnerShareUrl(result: RunResult): Promise<string> {
  const params = {
    type: 'runner_challenge',
    seed: String(result.routeSeed),
    score: String(result.score),
    distance: String(result.distance),
    carrots: String(result.orbs),
    gates: String(result.gates),
  };
  try {
    const sdk = window.PokiSDK as unknown as { shareableURL?: (values: Record<string, string>) => Promise<string> } | undefined;
    const url = await sdk?.shareableURL?.(params);
    if (url) return url;
  } catch {
    // Fall back to a regular game URL outside Poki.
  }
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return url.toString();
}
