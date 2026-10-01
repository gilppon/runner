// Poki SDK integration hooks.
//
// The bridge loads the official SDK dynamically. If the SDK cannot be loaded or
// initialised (offline, ad-blocker, not hosted on Poki) it falls back to a
// harmless mock, so every hook can be exercised locally:
//   - commercialBreak()  -> resolves immediately in mock mode
//   - rewardedBreak()    -> shows a simulated ad overlay (registered by the UI)
//
// Event order used by the game (see https://developers.poki.com/guide/sdk-overview):
//   startup:  gameLoadingFinished() -> gameplayStart()
//   death:    gameplayStop() -> commercialBreak() -> gameplayStart()
//   revive:   gameplayStop() -> rewardedBreak() -> gameplayStart()

import { audio } from './audio';

const SDK_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

interface PokiSDKType {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(opts?: { size?: string; onStart?: () => void }): Promise<boolean>;
}

declare global {
  interface Window {
    PokiSDK?: PokiSDKType;
  }
}

export type PokiStatus = 'idle' | 'loading' | 'live' | 'mock';
export type MockAdHandler = (kind: 'commercial' | 'rewarded') => Promise<boolean>;

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function loadScript(src: string, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    const timer = window.setTimeout(() => reject(new Error('poki sdk timeout')), timeout);
    s.src = src;
    s.async = true;
    s.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    s.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('poki sdk failed to load'));
    };
    document.head.appendChild(s);
  });
}

class PokiBridge {
  status: PokiStatus = 'idle';
  private gameplayActive = false;
  private mockAd: MockAdHandler | null = null;
  private listeners = new Set<(s: PokiStatus) => void>();

  private setStatus(s: PokiStatus) {
    this.status = s;
    this.listeners.forEach((l) => l(s));
  }

  onStatus(cb: (s: PokiStatus) => void) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  registerMockAd(handler: MockAdHandler | null) {
    this.mockAd = handler;
  }

  async init() {
    if (this.status !== 'idle') return;
    this.setStatus('loading');
    try {
      await loadScript(SDK_URL, 4000);
      if (!window.PokiSDK) throw new Error('PokiSDK missing');
      await Promise.race([
        window.PokiSDK.init(),
        sleep(4000).then(() => {
          throw new Error('poki init timeout');
        }),
      ]);
      this.setStatus('live');
      console.info('[Poki] SDK initialised');
    } catch (err) {
      console.info('[Poki] SDK unavailable, using mock hooks:', (err as Error).message);
      this.setStatus('mock');
    }
  }

  private get live() {
    return this.status === 'live' && !!window.PokiSDK;
  }

  gameLoadingFinished() {
    console.info('[Poki] gameLoadingFinished');
    if (this.live) {
      try {
        window.PokiSDK!.gameLoadingFinished();
      } catch {
        /* ignore */
      }
    }
  }

  gameplayStart() {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    console.info('[Poki] gameplayStart');
    if (this.live) {
      try {
        window.PokiSDK!.gameplayStart();
      } catch {
        /* ignore */
      }
    }
  }

  gameplayStop() {
    if (!this.gameplayActive) return;
    this.gameplayActive = false;
    console.info('[Poki] gameplayStop');
    if (this.live) {
      try {
        window.PokiSDK!.gameplayStop();
      } catch {
        /* ignore */
      }
    }
  }

  /** Natural break between runs. Not every call shows an ad. */
  async commercialBreak(): Promise<void> {
    console.info('[Poki] commercialBreak');
    if (!this.live) return;
    try {
      await window.PokiSDK!.commercialBreak(() => audio.setAdMuted(true));
    } catch {
      /* ignore */
    } finally {
      audio.setAdMuted(false);
    }
  }

  /** Player explicitly chose to watch an ad. Resolves true when the reward should be granted. */
  async rewardedBreak(): Promise<boolean> {
    console.info('[Poki] rewardedBreak');
    if (this.live) {
      const started = performance.now();
      try {
        const ok = await window.PokiSDK!.rewardedBreak({
          size: 'small',
          onStart: () => audio.setAdMuted(true),
        });
        audio.setAdMuted(false);
        // Returned instantly with `false` => no ad inventory off-platform: fall through to the mock.
        if (ok || performance.now() - started > 700) return ok;
      } catch {
        audio.setAdMuted(false);
      }
      // Real SDK but no ad inventory: do not show the mock overlay, do not grant the reward
      return false;
    }
    // Mock ads only off-platform (dev / itch etc.)
    if (this.mockAd) {
      audio.setAdMuted(true);
      try {
        return await this.mockAd('rewarded');
      } finally {
        audio.setAdMuted(false);
      }
    }
    // No handler registered means no free reward
    return false;
  }
}

export const poki = new PokiBridge();
