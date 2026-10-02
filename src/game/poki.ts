// Portal ad bridge (Poki / CrazyGames / mock auto-detect).
//
// The bridge loads the official SDK for whichever portal the build is running
// on (host name or `?poki` / `?crazy` query param). If that SDK cannot be loaded
// or initialised (offline, ad-blocker, hosted elsewhere) it falls back to a
// harmless mock, so every hook can be exercised locally:
//   - commercialBreak()  -> resolves immediately in mock mode
//   - rewardedBreak()    -> shows a simulated ad overlay (registered by the UI)
//
// Audio is force-muted for the duration of every ad: both portals require it.
//
// Event order used by the game (see https://developers.poki.com/guide/sdk-overview):
//   startup:  gameLoadingFinished() -> gameplayStart()
//   death:    gameplayStop() -> commercialBreak() -> gameplayStart()
//   revive:   gameplayStop() -> rewardedBreak() -> gameplayStart()

import { audio } from './audio';

const POKI_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
const CRAZY_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';

interface PokiSDKType {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(opts?: { size?: string; onStart?: () => void }): Promise<boolean>;
}

interface CrazyAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: () => void;
}

interface CrazySDKType {
  init(): Promise<void>;
  game: {
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
  };
  ad: {
    requestAd(type: 'midgame' | 'rewarded', callbacks: CrazyAdCallbacks): Promise<void>;
  };
}

declare global {
  interface Window {
    PokiSDK?: PokiSDKType;
    CrazyGames?: { SDK?: CrazySDKType };
  }
}

export type PokiStatus = 'idle' | 'loading' | 'live' | 'mock';
export type MockAdHandler = (kind: 'commercial' | 'rewarded') => Promise<boolean>;
export type Portal = 'poki' | 'crazy';

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function env(): Portal | null {
  try {
    const host = window.location.hostname;
    const q = window.location.search;
    if (/poki(-gdn)?\.com$/.test(host) || q.includes('poki')) return 'poki';
    if (/(^|\.)crazygames\.com$/.test(host) || q.includes('crazy')) return 'crazy';
  } catch {
    /* ignore */
  }
  return null;
}

function loadScript(src: string, timeout: number, label: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    const timer = window.setTimeout(() => reject(new Error(`${label} sdk timeout`)), timeout);
    s.src = src;
    s.async = true;
    s.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    s.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error(`${label} sdk failed to load`));
    };
    document.head.appendChild(s);
  });
}

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>((resolve) => window.setTimeout(() => resolve(fallback), ms))]);
}

function crazySdk(): CrazySDKType | undefined {
  return window.CrazyGames?.SDK;
}

class PokiBridge {
  status: PokiStatus = 'idle';
  private portal: Portal | null = null;
  private gameplayActive = false;
  private mockAd: MockAdHandler | null = null;
  private listeners = new Set<(s: PokiStatus) => void>();

  /** Which portal SDK is live, or null while running on mock hooks. */
  get activePortal(): Portal | null {
    return this.portal;
  }

  private get tag(): string {
    return this.portal === 'crazy' ? 'CrazyGames' : this.portal === 'poki' ? 'Poki' : 'Ads';
  }

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
    const portal = env();
    try {
      if (portal === 'poki') {
        await loadScript(POKI_URL, 4000, 'poki');
        if (!window.PokiSDK) throw new Error('PokiSDK missing');
        await Promise.race([
          window.PokiSDK.init(),
          sleep(4000).then(() => {
            throw new Error('poki init timeout');
          }),
        ]);
        this.portal = 'poki';
        this.setStatus('live');
        console.info('[Poki] SDK initialised');
      } else if (portal === 'crazy') {
        await loadScript(CRAZY_URL, 4000, 'crazygames');
        const sdk = crazySdk();
        if (!sdk) throw new Error('CrazyGames SDK missing');
        await Promise.race([
          sdk.init(),
          sleep(4000).then(() => {
            throw new Error('crazygames init timeout');
          }),
        ]);
        this.portal = 'crazy';
        this.setStatus('live');
        try {
          sdk.game.loadingStart();
        } catch {
          /* ignore */
        }
        console.info('[CrazyGames] SDK initialised');
      } else {
        throw new Error('no portal detected');
      }
    } catch (err) {
      this.portal = null;
      console.info('[Ads] SDK unavailable, using mock hooks:', (err as Error).message);
      this.setStatus('mock');
    }
  }

  private get live() {
    return this.status === 'live' && this.portal !== null;
  }

  gameLoadingFinished() {
    console.info(`[${this.tag}] gameLoadingFinished`);
    if (!this.live) return;
    try {
      if (this.portal === 'poki') window.PokiSDK!.gameLoadingFinished();
      else crazySdk()?.game.loadingStop();
    } catch {
      /* ignore */
    }
  }

  gameplayStart() {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    console.info(`[${this.tag}] gameplayStart`);
    if (!this.live) return;
    try {
      if (this.portal === 'poki') window.PokiSDK!.gameplayStart();
      else crazySdk()?.game.gameplayStart();
    } catch {
      /* ignore */
    }
  }

  gameplayStop() {
    if (!this.gameplayActive) return;
    this.gameplayActive = false;
    console.info(`[${this.tag}] gameplayStop`);
    if (!this.live) return;
    try {
      if (this.portal === 'poki') window.PokiSDK!.gameplayStop();
      else crazySdk()?.game.gameplayStop();
    } catch {
      /* ignore */
    }
  }

  /** Natural break between runs. Not every call shows an ad. */
  async commercialBreak(): Promise<void> {
    console.info(`[${this.tag}] commercialBreak`);
    if (!this.live) return;
    if (this.portal === 'poki') {
      try {
        await withTimeout(window.PokiSDK!.commercialBreak(() => audio.setAdMuted(true)), 10000, undefined);
      } catch {
        /* ignore */
      } finally {
        audio.setAdMuted(false);
      }
      return;
    }
    try {
      await withTimeout(
        crazySdk()!.ad.requestAd('midgame', {
          adStarted: () => audio.setAdMuted(true),
          adFinished: () => audio.setAdMuted(false),
          adError: () => audio.setAdMuted(false),
        }),
        10000,
        undefined,
      );
    } catch {
      /* ignore */
    } finally {
      audio.setAdMuted(false);
    }
  }

  /** Player explicitly chose to watch an ad. Resolves true when the reward should be granted. */
  async rewardedBreak(): Promise<boolean> {
    console.info(`[${this.tag}] rewardedBreak`);
    if (this.live) {
      const started = performance.now();
      if (this.portal === 'poki') {
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
      // CrazyGames: `adError` means no ad inventory, so never fall back to the mock overlay.
      try {
        let ok = false;
        await withTimeout(
          crazySdk()!.ad.requestAd('rewarded', {
            adStarted: () => audio.setAdMuted(true),
            adFinished: () => {
              audio.setAdMuted(false);
              ok = true;
            },
            adError: () => {
              audio.setAdMuted(false);
              ok = false;
            },
          }),
          20000,
          undefined,
        );
        return ok;
      } catch {
        return false;
      } finally {
        audio.setAdMuted(false);
      }
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