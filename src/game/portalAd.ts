// Web Portal Ad Service for Dimension Runner
// CrazyGames SDK v3 native + Poki fallback + local development mock.
// Force-mutes game audio during ad breaks.

import { audio } from './audio';

const CRAZY_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
const POKI_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';

interface PokiSDKType {
  init(): Promise<void>;
  gameLoadingFinished(): void;
  gameplayStart(): void;
  gameplayStop(): void;
  commercialBreak(onStart?: () => void): Promise<void>;
  rewardedBreak(onStart?: () => void): Promise<boolean>;
}

interface CrazyAdCallbacks {
  adStarted?: () => void;
  adFinished?: () => void;
  adError?: (err?: unknown) => void;
}

interface CrazySDKType {
  init(): Promise<void>;
  game: {
    loadingStart(): void;
    loadingStop(): void;
    gameplayStart(): void;
    gameplayStop(): void;
    settings?: { muteAudio?: boolean };
    addSettingsChangeListener?(listener: (settings: { muteAudio?: boolean }) => void): void;
    removeSettingsChangeListener?(listener: (settings: { muteAudio?: boolean }) => void): void;
  };
  ad: {
    hasAdblock?(): Promise<boolean>;
    requestAd(type: 'midgame' | 'rewarded', callbacks: CrazyAdCallbacks): void | Promise<void>;
  };
  data?: {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
  };
}

declare global {
  interface Window {
    CrazyGames?: { SDK?: CrazySDKType };
    PokiSDK?: PokiSDKType;
  }
}

export type PortalStatus = 'idle' | 'loading' | 'live' | 'mock' | 'unavailable';
export type MockAdHandler = (kind: 'commercial' | 'rewarded') => Promise<boolean>;
export type PortalType = 'crazy' | 'poki';
export type CrazyAdblockStatus = 'unknown' | 'checking' | 'clear' | 'blocked' | 'unavailable';

function detectPortal(): PortalType | null {
  try {
    if (typeof window !== 'undefined') {
      if ((import.meta as ImportMeta & { env: { DEV: boolean } }).env.DEV) {
        const previewPortal = new URLSearchParams(window.location.search).get('portalPreview');
        if (previewPortal === 'crazy' || previewPortal === 'poki') return previewPortal;
      }
      const host = window.location.hostname || '';
      if (host === 'poki.com' || host.endsWith('.poki.com') || host === 'poki-gdn.com' || host.endsWith('.poki-gdn.com')) return 'poki';
      if (host === 'crazygames.com' || host.endsWith('.crazygames.com')) return 'crazy';
      if (window.PokiSDK) return 'poki';
      if (window.CrazyGames) return 'crazy';
    }
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

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} initialization timed out`)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

class PortalAdService {
  status: PortalStatus = 'idle';
  portal: PortalType | null = null;
  private mockHandler: MockAdHandler | null = null;
  private listeners = new Set<(s: PortalStatus) => void>();
  private gameplayActive = false;
  private loadingDone = false;
  private platformMuted = false;
  private muteListeners = new Set<(muted: boolean) => void>();
  private adblockStatus: CrazyAdblockStatus = 'unknown';
  private adblockListeners = new Set<(status: CrazyAdblockStatus) => void>();
  private settingsListener: ((settings: { muteAudio?: boolean }) => void) | null = null;
  private initPromise: Promise<void> | null = null;

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

  onPlatformMuteChange(cb: (muted: boolean) => void) {
    this.muteListeners.add(cb);
    cb(this.platformMuted);
    return () => {
      this.muteListeners.delete(cb);
    };
  }

  get crazyAdblockStatus(): CrazyAdblockStatus {
    return this.adblockStatus;
  }

  onCrazyAdblockStatus(cb: (status: CrazyAdblockStatus) => void) {
    this.adblockListeners.add(cb);
    cb(this.adblockStatus);
    return () => {
      this.adblockListeners.delete(cb);
    };
  }

  private setAdblockStatus(status: CrazyAdblockStatus) {
    if (this.adblockStatus === status) return;
    this.adblockStatus = status;
    for (const listener of this.adblockListeners) listener(status);
  }

  private async detectCrazyAdblock(sdk: CrazySDKType) {
    if (!sdk.ad.hasAdblock) {
      this.setAdblockStatus('unavailable');
      return;
    }

    this.setAdblockStatus('checking');
    try {
      const detected = await withTimeout(Promise.resolve(sdk.ad.hasAdblock()), 4000, 'CrazyGames adblock detection');
      this.setAdblockStatus(detected ? 'blocked' : 'clear');
    } catch {
      // Keep the game playable; hide rewarded offers if platform detection is unavailable.
      this.setAdblockStatus('unavailable');
    }
  }

  private recordCrazyAdError(error: unknown) {
    const code =
      typeof error === 'string'
        ? error
        : typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : undefined;
    if (String(code).toLowerCase() === 'adblock') this.setAdblockStatus('blocked');
  }

  get isPlatformMuted(): boolean {
    return this.platformMuted;
  }

  getCrazyDataStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
    const data = window.CrazyGames?.SDK?.data;
    if (!data) return null;
    return {
      getItem: (key) => data.getItem(key),
      setItem: (key, value) => data.setItem(key, value),
    };
  }

  private setPlatformMuted(muted: boolean) {
    this.platformMuted = muted;
    audio.setPortalMuted(muted);
    for (const listener of this.muteListeners) listener(muted);
  }

  private bindCrazySettings(sdk: CrazySDKType) {
    if (this.settingsListener) sdk.game.removeSettingsChangeListener?.(this.settingsListener);
    const listener = (settings: { muteAudio?: boolean }) => this.setPlatformMuted(Boolean(settings.muteAudio));
    this.settingsListener = listener;
    listener(sdk.game.settings ?? {});
    sdk.game.addSettingsChangeListener?.(listener);
  }

  registerMockAd(handler: MockAdHandler | null) {
    this.mockHandler = handler;
  }

  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.initialize();
    return this.initPromise;
  }

  private async initialize(): Promise<void> {
    if (this.status !== 'idle') return;
    this.setStatus('loading');

    const detectedPortal = detectPortal();
    if (!detectedPortal && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
      this.setStatus('mock');
      return;
    }
    if (!detectedPortal) {
      this.setStatus('unavailable');
      return;
    }
    const portal = detectedPortal;

    let crazyLoadingStarted = false;
    try {
      if (portal === 'crazy') {
        if (!window.CrazyGames?.SDK) await loadScript(CRAZY_URL, 4000, 'crazy');
        const sdk = window.CrazyGames?.SDK;
        if (!sdk) throw new Error('CrazyGames SDK missing');
        await withTimeout(sdk.init(), 10000, 'CrazyGames SDK');
        this.portal = 'crazy';
        this.bindCrazySettings(sdk);
        void this.detectCrazyAdblock(sdk);
        sdk.game.loadingStart();
        crazyLoadingStarted = true;
        this.setStatus('live');
        return;
      }

      if (portal === 'poki') {
        if (!window.PokiSDK) await loadScript(POKI_URL, 4000, 'poki');
        if (!window.PokiSDK) throw new Error('PokiSDK missing');
        await withTimeout(window.PokiSDK.init(), 10000, 'Poki SDK');
        this.portal = 'poki';
        this.setStatus('live');
        return;
      }
    } catch {
      if (crazyLoadingStarted) {
        try {
          window.CrazyGames?.SDK?.game.loadingStop();
        } catch {
          /* ignore SDK cleanup errors */
        }
      }
      this.portal = null;
      this.setPlatformMuted(false);
    }

    this.setStatus(/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ? 'mock' : 'unavailable');
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

  private requestCrazyAd(type: 'midgame' | 'rewarded'): Promise<boolean> {
    const sdk = window.CrazyGames?.SDK;
    if (!sdk) return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (completed: boolean) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        audio.setAdMuted(false);
        resolve(completed);
      };
      const timeout = window.setTimeout(() => settle(false), 90000);

      try {
        const request = sdk.ad.requestAd(type, {
          adStarted: () => audio.setAdMuted(true),
          adFinished: () => settle(true),
          adError: (error) => {
            this.recordCrazyAdError(error);
            settle(false);
          },
        });
        // HTML5 SDKs signal completion through callbacks. Only use a returned
        // thenable to catch request failures; its resolution is not a reward.
        if (request && typeof request.then === 'function') {
          void Promise.resolve(request).catch((error) => {
            this.recordCrazyAdError(error);
            settle(false);
          });
        }
      } catch (error) {
        this.recordCrazyAdError(error);
        settle(false);
      }
    });
  }

  async commercialBreak(): Promise<void> {
    if (this.portal === 'crazy') {
      await this.requestCrazyAd('midgame');
      return;
    }

    if (this.portal === 'poki' && window.PokiSDK) {
      audio.setAdMuted(true);
      try {
        await withTimeout(window.PokiSDK.commercialBreak(() => audio.setAdMuted(true)), 90000, 'Poki commercial break');
      } catch {
        /* ad errors should never prevent returning to gameplay */
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
      return this.requestCrazyAd('rewarded');
    }

    if (this.portal === 'poki' && window.PokiSDK) {
      audio.setAdMuted(true);
      try {
        return Boolean(await window.PokiSDK.rewardedBreak(() => audio.setAdMuted(true)));
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

    return false;
  }
}

export const portalAd = new PortalAdService();
// Backward compatibility
export const poki = portalAd;
export type PokiStatus = PortalStatus;
