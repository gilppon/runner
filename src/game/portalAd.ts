// Web Portal Ad Service for Dimension Runner
// CrazyGames SDK v3 native + Poki fallback + local development mock.
// Force-mutes game audio during ad breaks.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { audio } from './audio';

const CRAZY_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
const POKI_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

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
  adError?: (err?: any) => void;
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
    CrazyGames?: { SDK?: CrazySDKType };
    PokiSDK?: PokiSDKType;
  }
}

export type PortalStatus = 'idle' | 'loading' | 'live' | 'mock';
export type MockAdHandler = (kind: 'commercial' | 'rewarded') => Promise<boolean>;
export type PortalType = 'crazy' | 'poki';

function detectPortal(): PortalType | null {
  try {
    if (typeof window !== 'undefined') {
      if ((window as any).CrazyGames) return 'crazy';
      if ((window as any).PokiSDK) return 'poki';
    }
    const host = window.location.hostname || '';
    const href = window.location.href || '';
    if (/crazygames/.test(host) || href.includes('crazy')) return 'crazy';
    if (/poki(-gdn)?\.com/.test(host) || href.includes('poki')) return 'poki';
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

class PortalAdService {
  status: PortalStatus = 'idle';
  portal: PortalType | null = null;
  private mockHandler: MockAdHandler | null = null;
  private listeners = new Set<(s: PortalStatus) => void>();
  private gameplayActive = false;
  private loadingDone = false;

  get isLive(): boolean {
    return this.status === 'live';
  }

  private setStatus(s: PortalStatus) {
    this.status = s;
    for (const l of this.listeners) l(s);
  }

  onStatus(cb: (s: PortalStatus) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  registerMockAd(handler: MockAdHandler | null) {
    this.mockHandler = handler;
  }

  async init(): Promise<void> {
    if (this.status !== 'idle') return;
    this.setStatus('loading');

    const portal = detectPortal() ?? 'crazy'; // CrazyGames as primary portal

    try {
      if (portal === 'crazy') {
        if (!window.CrazyGames?.SDK) await loadScript(CRAZY_URL, 4000, 'crazy');
        const sdk = window.CrazyGames?.SDK;
        if (!sdk) throw new Error('CrazyGames SDK missing');
        await withTimeout(sdk.init(), 4000, undefined);
        this.portal = 'crazy';
        sdk.game.loadingStart();
        this.setStatus('live');
        return;
      }

      if (portal === 'poki') {
        if (!window.PokiSDK) await loadScript(POKI_URL, 4000, 'poki');
        if (!window.PokiSDK) throw new Error('PokiSDK missing');
        await withTimeout(window.PokiSDK.init(), 4000, undefined);
        this.portal = 'poki';
        this.setStatus('live');
        return;
      }
    } catch {
      // Fallback to local arcade mode
    }

    this.setStatus('mock');
  }

  gameLoadingFinished() {
    if (this.loadingDone) return;
    this.loadingDone = true;
    try {
      if (this.portal === 'crazy') window.CrazyGames?.SDK?.game.loadingStop();
      else if (this.portal === 'poki') window.PokiSDK?.gameLoadingFinished();
    } catch {
      /* ignore */
    }
  }

  gameplayStart() {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    try {
      if (this.portal === 'crazy') window.CrazyGames?.SDK?.game.gameplayStart();
      else if (this.portal === 'poki') window.PokiSDK?.gameplayStart();
    } catch {
      /* ignore */
    }
  }

  gameplayStop() {
    if (!this.gameplayActive) return;
    this.gameplayActive = false;
    try {
      if (this.portal === 'crazy') window.CrazyGames?.SDK?.game.gameplayStop();
      else if (this.portal === 'poki') window.PokiSDK?.gameplayStop();
    } catch {
      /* ignore */
    }
  }

  async commercialBreak(): Promise<void> {
    if (this.portal === 'crazy') {
      const sdk = window.CrazyGames?.SDK;
      if (sdk) {
        audio.setAdMuted(true);
        try {
          await new Promise<void>((resolve) => {
            sdk.ad.requestAd('midgame', {
              adStarted: () => audio.setAdMuted(true),
              adFinished: () => resolve(),
              adError: () => resolve(),
            });
          });
        } finally {
          audio.setAdMuted(false);
        }
        return;
      }
    }

    if (this.portal === 'poki' && window.PokiSDK) {
      audio.setAdMuted(true);
      try {
        await withTimeout(window.PokiSDK.commercialBreak(() => audio.setAdMuted(true)), 10000, undefined);
      } finally {
        audio.setAdMuted(false);
      }
      return;
    }

    // Local simulated break
    if (this.mockHandler) {
      audio.setAdMuted(true);
      try {
        await this.mockHandler('commercial');
      } finally {
        audio.setAdMuted(false);
      }
    }
  }

  async rewardedBreak(): Promise<boolean> {
    if (this.portal === 'crazy') {
      const sdk = window.CrazyGames?.SDK;
      if (sdk) {
        audio.setAdMuted(true);
        try {
          return await new Promise<boolean>((resolve) => {
            sdk.ad.requestAd('rewarded', {
              adStarted: () => audio.setAdMuted(true),
              adFinished: () => resolve(true),
              adError: () => resolve(false),
            });
          });
        } finally {
          audio.setAdMuted(false);
        }
      }
    }

    if (this.portal === 'poki' && window.PokiSDK) {
      audio.setAdMuted(true);
      try {
        return Boolean(await window.PokiSDK.rewardedBreak({ onStart: () => audio.setAdMuted(true) }));
      } catch {
        return false;
      } finally {
        audio.setAdMuted(false);
      }
    }

    // Local simulated break
    if (this.mockHandler) {
      audio.setAdMuted(true);
      try {
        return await this.mockHandler('rewarded');
      } finally {
        audio.setAdMuted(false);
      }
    }

    return true;
  }
}

export const portalAd = new PortalAdService();
// Backward compatibility
export const poki = portalAd;
export type PokiStatus = PortalStatus;
