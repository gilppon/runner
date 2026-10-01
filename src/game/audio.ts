// Small procedural WebAudio engine: SFX + a dimension-aware chiptune loop.

type Wave = OscillatorType;

interface ToneOpts {
  slide?: number;
  delay?: number;
  dest?: AudioNode;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private musicBus: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private is3D = false;
  private muted = false;
  private adMuted = false;
  private orbCombo = 0;
  private lastOrb = 0;

  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.55;
        this.musicFilter = this.ctx.createBiquadFilter();
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.value = 2400;
        this.musicFilter.connect(this.musicBus);
        this.musicBus.connect(this.master);
        this.applyGain();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      /* audio not available */
    }
  }

  private applyGain() {
    if (this.master) this.master.gain.value = this.muted || this.adMuted ? 0 : 0.5;
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.applyGain();
  }
  isMuted() {
    return this.muted;
  }
  setAdMuted(m: boolean) {
    this.adMuted = m;
    this.applyGain();
  }

  private tone(freq: number, dur: number, type: Wave, vol: number, o: ToneOpts = {}) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(o.dest ?? this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, hp: number, delay = 0, dest?: AudioNode) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(filt);
    filt.connect(g);
    g.connect(dest ?? this.master);
    src.start(t0);
  }

  // ---- SFX ----
  jump() {
    this.tone(330, 0.16, 'square', 0.1, { slide: 760 });
  }
  orb() {
    const now = performance.now();
    this.orbCombo = now - this.lastOrb < 700 ? Math.min(this.orbCombo + 1, 9) : 0;
    this.lastOrb = now;
    const f = 660 * Math.pow(1.0595, this.orbCombo * 2);
    this.tone(f, 0.12, 'triangle', 0.12);
    this.tone(f * 1.5, 0.14, 'sine', 0.06, { delay: 0.05 });
  }
  shift(to3D: boolean) {
    if (to3D) {
      this.tone(180, 0.5, 'sawtooth', 0.09, { slide: 720 });
      this.tone(360, 0.5, 'sine', 0.08, { slide: 1440, delay: 0.04 });
    } else {
      this.tone(720, 0.45, 'sawtooth', 0.09, { slide: 160 });
      this.tone(1440, 0.4, 'sine', 0.07, { slide: 320, delay: 0.03 });
    }
    this.noise(0.35, 0.05, 2500);
  }
  deny() {
    this.tone(160, 0.14, 'square', 0.09);
    this.tone(120, 0.16, 'square', 0.09, { delay: 0.1 });
  }
  crash() {
    this.noise(0.5, 0.22, 300);
    this.tone(150, 0.4, 'sawtooth', 0.14, { slide: 40 });
  }
  gate() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.11, { delay: i * 0.07 }));
    this.noise(0.6, 0.06, 1800);
  }
  /** 덕/슬라이드 시작: 낮고 짧은 마찰음 */
  slide() {
    this.noise(0.22, 0.1, 700);
    this.tone(190, 0.18, 'sawtooth', 0.06, { slide: 110 });
  }
  gameover() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.1, { delay: i * 0.16 }));
  }
  revive() {
    [262, 330, 392, 523].forEach((f, i) => this.tone(f, 0.2, 'square', 0.09, { delay: i * 0.08 }));
  }
  ui() {
    this.tone(520, 0.07, 'square', 0.06);
  }
  buy() {
    this.tone(660, 0.1, 'triangle', 0.1);
    this.tone(990, 0.16, 'triangle', 0.1, { delay: 0.07 });
  }

  // ---- Music ----
  startMusic() {
    this.unlock();
    if (this.timer !== null || !this.ctx) return;
    this.step = 0;
    this.timer = window.setInterval(() => this.tick(), 165);
  }
  stopMusic() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
  setDimension(is3D: boolean) {
    this.is3D = is3D;
    if (this.ctx && this.musicFilter) {
      this.musicFilter.frequency.setTargetAtTime(is3D ? 620 : 2600, this.ctx.currentTime, 0.25);
    }
  }

  private tick() {
    const ctx = this.ctx;
    if (!ctx || !this.musicFilter || this.muted || this.adMuted) return;
    const dest = this.musicFilter;
    const s = this.step++ % 16;
    const bass = [55, 55, 55, 82.41, 55, 55, 65.41, 73.42, 49, 49, 49, 73.42, 55, 55, 82.41, 98];
    this.tone(bass[s], 0.15, this.is3D ? 'sawtooth' : 'square', 0.07, { dest });
    if (s % 4 === 0) this.tone(130, 0.16, 'sine', 0.16, { slide: 42, dest: this.master ?? dest });
    if (s % 2 === 1) this.noise(0.05, 0.05, 7000, 0, this.master ?? dest);
    if (!this.is3D) {
      const arp = [440, 523.25, 659.25, 783.99];
      if (s % 2 === 0) this.tone(arp[(s / 2) % 4] * (s >= 8 ? 1.125 : 1), 0.12, 'square', 0.035, { dest });
    } else if (s % 8 === 0) {
      [220, 277.18, 329.63].forEach((f) => this.tone(f, 1.2, 'sine', 0.05, { dest }));
    }
  }
}

export const audio = new AudioManager();
