// High-Quality Procedural WebAudio Engine for Mashimaro Runner
// Features: Full-band In-Game BGM, Cute Lobby BGM, Punchy SFX, Volume Mixers

type Wave = OscillatorType;

interface ToneOpts {
  slide?: number;
  delay?: number;
  dest?: AudioNode;
  detune?: number;
}

export type MusicTrack = 'none' | 'lobby' | 'game';

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;

  private timer: number | null = null;
  private nextNoteTime = 0;
  private schedulingAt: number | null = null;
  private currentTrack: MusicTrack = 'none';
  private step = 0;
  private is3D = false;
  private isPaused = false;
  private muted = false;
  private adMuted = false;
  private orbCombo = 0;
  private lastOrb = 0;

  unlock() {
    try {
      if (!this.ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();

        // Master Gain
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);

        // Music Bus & Filter
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.7;

        this.musicFilter = this.ctx.createBiquadFilter();
        this.musicFilter.type = 'lowpass';
        this.musicFilter.frequency.value = 7500; // Bright and crisp
        this.musicFilter.Q.value = 1.0;
        this.musicFilter.connect(this.musicBus);
        this.musicBus.connect(this.master);

        // SFX Bus
        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.85;
        this.sfxBus.connect(this.master);

        this.applyGain();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    } catch {
      /* AudioContext unavailable */
    }
  }

  private applyGain() {
    if (this.master) {
      this.master.gain.value = this.muted || this.adMuted ? 0 : 0.8;
    }
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

  getTrack(): MusicTrack {
    return this.currentTrack;
  }

  private tone(freq: number, dur: number, type: Wave, vol: number, o: ToneOpts = {}) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const baseTime = this.schedulingAt ?? ctx.currentTime;
    const t0 = Math.max(ctx.currentTime, baseTime + (o.delay ?? 0));
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.detune) osc.detune.setValueAtTime(o.detune, t0);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t0 + dur);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(o.dest ?? this.sfxBus ?? this.master);

    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, hp: number, delay = 0, dest?: AudioNode) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const baseTime = this.schedulingAt ?? ctx.currentTime;
    const t0 = Math.max(ctx.currentTime, baseTime + delay);
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
    g.connect(dest ?? this.sfxBus ?? this.master);

    src.start(t0);
  }

  // ==========================================
  // SFX Section
  // ==========================================

  /** 🐰 통통 튀는 엽기토끼 점프 (스프링 보잉 사운드) */
  jump() {
    this.tone(260, 0.2, 'sine', 0.28, { slide: 720 });
    this.tone(520, 0.16, 'triangle', 0.18, { slide: 1240, delay: 0.02 });
  }

  /** 🥕 당근 획득 시 맑고 영롱한 징글 사운드 */
  orb() {
    const now = performance.now();
    this.orbCombo = now - this.lastOrb < 850 ? Math.min(this.orbCombo + 1, 14) : 0;
    this.lastOrb = now;
    const majorScale = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 24];
    const semitone = majorScale[this.orbCombo % majorScale.length];
    const f = 523.25 * Math.pow(1.059463, semitone);

    this.tone(f, 0.22, 'triangle', 0.3);
    this.tone(f * 2, 0.2, 'sine', 0.22, { delay: 0.015 });
  }

  /** 차원 전환 (2D <-> 3D) */
  shift(to3D: boolean) {
    if (to3D) {
      this.tone(180, 0.45, 'sawtooth', 0.18, { slide: 880 });
      this.tone(360, 0.45, 'sine', 0.16, { slide: 1760, delay: 0.03 });
    } else {
      this.tone(880, 0.4, 'sawtooth', 0.18, { slide: 160 });
      this.tone(1760, 0.35, 'sine', 0.14, { slide: 320, delay: 0.02 });
    }
    this.noise(0.3, 0.1, 2400);
  }

  deny() {
    this.tone(180, 0.14, 'square', 0.15);
    this.tone(130, 0.18, 'square', 0.15, { delay: 0.09 });
  }

  crash() {
    this.noise(0.55, 0.35, 280);
    this.tone(160, 0.45, 'sawtooth', 0.25, { slide: 40 });
  }

  gate() {
    [523, 659, 784, 1046, 1318].forEach((f, i) =>
      this.tone(f, 0.35, 'triangle', 0.2, { delay: i * 0.06 })
    );
    this.noise(0.5, 0.1, 2000);
  }

  /** 슬라이딩 슉~ */
  slide() {
    this.noise(0.25, 0.16, 650);
    this.tone(220, 0.2, 'sawtooth', 0.12, { slide: 90 });
  }

  /** 500m 돌파 스테이지 클리어 팡파르! */
  stageClearFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    notes.forEach((f, i) => {
      this.tone(f, 0.28, 'triangle', 0.25, { delay: i * 0.08 });
      this.tone(f * 0.5, 0.28, 'sawtooth', 0.15, { delay: i * 0.08 });
    });
    // 마지막 콰광 코드
    window.setTimeout(() => {
      [523.25, 659.25, 783.99, 1046.5].forEach((f) => {
        this.tone(f, 0.6, 'triangle', 0.22);
        this.tone(f, 0.6, 'sine', 0.18);
      });
      this.noise(0.4, 0.12, 1200);
    }, 550);
  }

  gameover() {
    [392, 330, 262, 196].forEach((f, i) =>
      this.tone(f, 0.45, 'sawtooth', 0.2, { delay: i * 0.15 })
    );
  }

  revive() {
    [262, 330, 392, 523, 659].forEach((f, i) =>
      this.tone(f, 0.22, 'square', 0.18, { delay: i * 0.07 })
    );
  }

  ui() {
    this.tone(600, 0.08, 'triangle', 0.18);
    this.tone(1200, 0.06, 'sine', 0.12, { delay: 0.02 });
  }

  buy() {
    this.tone(660, 0.12, 'triangle', 0.22);
    this.tone(990, 0.2, 'triangle', 0.22, { delay: 0.06 });
  }

  // ==========================================
  // Music Section
  // ==========================================

  playTrack(track: MusicTrack) {
    if (this.currentTrack === track && this.timer !== null) return;
    this.stopMusic();
    this.currentTrack = track;
    this.step = 0;
    this.isPaused = false;
    this.schedulingAt = null;
    this.nextNoteTime = (this.ctx?.currentTime ?? 0) + 0.04;
    if (track !== 'none') {
      this.timer = window.setInterval(() => this.scheduleMusic(), 25);
      this.scheduleMusic();
    }
  }

  /** Schedule notes against AudioContext time so render stalls do not shift the beat. */
  private scheduleMusic() {
    const ctx = this.ctx;
    const track = this.currentTrack;
    if (!ctx || track === 'none' || ctx.state !== 'running') return;

    const stepDuration = track === 'lobby' ? 60 / 104 / 4 : 60 / 136 / 4;
    if (this.nextNoteTime < ctx.currentTime - stepDuration * 0.5) {
      const missedSteps = Math.ceil((ctx.currentTime + 0.015 - this.nextNoteTime) / stepDuration);
      this.step += missedSteps;
      this.nextNoteTime += missedSteps * stepDuration;
    }

    const horizon = ctx.currentTime + 0.12;
    while (this.nextNoteTime <= horizon) {
      this.schedulingAt = this.nextNoteTime;
      if (track === 'lobby') this.tickLobby();
      else this.tickGame();
      this.schedulingAt = null;
      this.nextNoteTime += stepDuration;
    }
  }

  startMusic() {
    this.playTrack('game');
  }

  startLobbyMusic() {
    this.playTrack('lobby');
  }

  stopMusic() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.schedulingAt = null;
    this.currentTrack = 'none';
  }

  setPaused(paused: boolean) {
    this.isPaused = paused;
    if (this.ctx && this.musicFilter) {
      const targetFreq = paused ? 600 : this.is3D ? 4500 : 7500;
      this.musicFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.1);
    }
  }

  setDimension(is3D: boolean) {
    this.is3D = is3D;
    if (this.ctx && this.musicFilter && !this.isPaused) {
      this.musicFilter.frequency.setTargetAtTime(is3D ? 4500 : 7500, this.ctx.currentTime, 0.15);
    }
  }

  // ----------------------------------------------------
  // 🎵 Track 1: 귀엽고 평화로운 로비 BGM (Mashimaro's Daydream)
  // ----------------------------------------------------
  private tickLobby() {
    const ctx = this.ctx;
    if (!ctx || !this.musicFilter || this.muted || this.adMuted) return;
    const dest = this.musicFilter;
    const s = this.step++ % 32;

    // Fmaj7 - G7 - Em7 - Am7 코드 진행 (1마디당 8스텝)
    const chords = [
      [349.23, 440.0, 523.25, 659.25], // Fmaj7
      [392.0, 493.88, 587.33, 698.46], // G7
      [329.63, 392.0, 493.88, 587.33], // Em7
      [440.0, 523.25, 659.25, 783.99], // Am7
    ];
    const currentChord = chords[Math.floor(s / 8)];

    // 1. 따뜻한 마림바 아르페지오 (매 짝수 스텝)
    if (s % 2 === 0) {
      const noteIdx = (s / 2) % currentChord.length;
      const f = currentChord[noteIdx];
      this.tone(f, 0.22, 'triangle', 0.2, { dest });
      this.tone(f * 2, 0.18, 'sine', 0.12, { delay: 0.01, dest });
    }

    // 2. 부드러운 통통 어쿠스틱 베이스
    if (s % 4 === 0) {
      const rootF = currentChord[0] * 0.25;
      this.tone(rootF, 0.28, 'sine', 0.28, { dest });
    }

    // 3. 살랑살랑 브러시 리듬 (스텝 2, 6, 10, 14...)
    if (s % 4 === 2) {
      this.noise(0.04, 0.05, 5500, 0, dest);
    }

    // 4. 로비 귀여운 멜로디 (8스텝마다 한 음씩 힐링 테마)
    const lobbyLead: Record<number, number> = {
      0: 659.25,  // E5
      4: 587.33,  // D5
      8: 783.99,  // G5
      12: 698.46, // F5
      16: 659.25, // E5
      20: 523.25, // C5
      24: 587.33, // D5
      28: 659.25, // E5
    };
    if (lobbyLead[s]) {
      const lf = lobbyLead[s];
      this.tone(lf, 0.35, 'sine', 0.18, { dest });
      this.tone(lf * 1.5, 0.3, 'triangle', 0.08, { dest });
    }
  }

  // ----------------------------------------------------
  // ⚡ Track 2: 신나고 에너지 넘치는 인게임 러닝 BGM (Mashimaro Super Dash!)
  // ----------------------------------------------------
  private tickGame() {
    const ctx = this.ctx;
    if (!ctx || !this.musicFilter || this.muted || this.adMuted) return;
    const dest = this.musicFilter;
    const s = this.step++ % 128;
    const phraseStep = s % 32;
    const phraseIndex = Math.floor(s / 32);
    const answerPhrase = phraseIndex % 2 === 1;

    // 1. 🥁 파워풀 펀치 드럼 세트
    // 쿵! 킥 드럼 (스텝 0, 8, 16, 24)
    if (s % 8 === 0) {
      this.tone(160, 0.16, 'sine', 0.38, { slide: 42, dest });
    }
    // 딱! 찰진 스네어 (스텝 4, 12, 20, 28)
    if (s % 8 === 4) {
      this.noise(0.14, 0.22, 1600, 0, dest);
      this.tone(220, 0.09, 'triangle', 0.18, { slide: 90, dest });
    }
    // 칫-칫- 16비트 경쾌한 하이햇 (모든 홀수 스텝)
    if (s % 2 === 1 && !(answerPhrase && s % 8 === 7)) {
      this.noise(0.04, 0.08, 7000, 0, dest);
    }
    // 통! 카툰 우드블록 퍼커션 (스텝 6, 14, 22, 30)
    if (s % 8 === 6) {
      this.tone(880, 0.05, 'sine', 0.16, { slide: 440, dest });
    }

    // 2. 🎸 펑키 슬랩 베이스라인 (C - G - Am - F)
    const bassRoots = [
      65.41, 65.41, 130.81, 65.41, 65.41, 130.81, 98.0, 116.54, // C (0-7)
      49.0, 49.0, 98.0, 49.0, 49.0, 98.0, 73.42, 87.31,         // G (8-15)
      55.0, 55.0, 110.0, 55.0, 55.0, 110.0, 82.41, 98.0,       // Am (16-23)
      43.65, 43.65, 87.31, 43.65, 65.41, 87.31, 98.0, 116.54,   // F (24-31)
    ];
    this.tone(bassRoots[phraseStep], 0.14, this.is3D ? 'sawtooth' : 'triangle', 0.32, { dest });

    // 3. 🎹 풍성한 3성부 화음 스타카토 브라스 (스텝 2, 4, 10, 12, 18, 20, 26, 28)
    const chordVoicings = [
      [261.63, 329.63, 392.0], // C maj
      [246.94, 293.66, 392.0], // G maj
      [220.0, 261.63, 329.63], // A min
      [220.0, 261.63, 349.23], // F maj
    ];
    const curChord = chordVoicings[Math.floor(phraseStep / 8)];
    if (s % 4 === 2 || s % 8 === 4) {
      curChord.forEach((f) => {
        this.tone(f, 0.12, 'triangle', 0.1, { dest });
        this.tone(f * 2, 0.1, 'sine', 0.06, { dest });
      });
    }

    // 4. 🎺 엽기토끼의 신나는 카툰 리드 멜로디 (도-미-솔-도 팡파르)
    const leadNotes: Record<number, number> = {
      0: 523.25,  // C5
      2: 659.25,  // E5
      4: 783.99,  // G5
      6: 1046.5,  // C6 (하이 점프!)
      8: 783.99,  // G5
      10: 659.25, // E5
      12: 587.33, // D5
      14: 659.25, // E5
      16: 880.0,  // A5
      18: 783.99, // G5
      20: 659.25, // E5
      22: 523.25, // C5
      24: 587.33, // D5
      26: 659.25, // E5
      28: 783.99, // G5
      30: 1046.5, // C6
    };

    // Second two-bar phrase answers the first instead of replaying the same lead.
    const answerNotes: Record<number, number> = {
      0: 783.99,  // G5
      2: 659.25,  // E5
      4: 523.25,  // C5
      6: 587.33,  // D5
      8: 783.99,  // G5
      10: 880.0,  // A5
      12: 783.99, // G5
      14: 659.25, // E5
      16: 880.0,  // A5
      18: 1046.5, // C6
      20: 880.0,  // A5
      22: 783.99, // G5
      24: 698.46, // F5
      26: 880.0,  // A5
      28: 783.99, // G5
      30: 1046.5, // C6
    };

    // Third and fourth phrases revisit the theme with new chord tones and a
    // brighter resolution, doubling the loop before it returns to the start.
    const repriseNotes: Record<number, number> = {
      0: 659.25,  // E5
      2: 783.99,  // G5
      4: 1046.5,  // C6
      6: 783.99,  // G5
      8: 783.99,  // G5
      10: 587.33, // D5
      12: 493.88, // B4
      14: 587.33, // D5
      16: 1046.5, // C6
      18: 880.0,  // A5
      20: 659.25, // E5
      22: 880.0,  // A5
      24: 698.46, // F5
      26: 587.33, // D5
      28: 523.25, // C5
      30: 698.46, // F5
    };
    const closingNotes: Record<number, number> = {
      0: 523.25,  // C5
      2: 698.46,  // F5
      4: 880.0,   // A5
      6: 1046.5,  // C6
      8: 587.33,  // D5
      10: 783.99, // G5
      12: 987.77, // B5
      14: 783.99, // G5
      16: 880.0,  // A5
      18: 1046.5, // C6
      20: 1318.5, // E6
      22: 1046.5, // C6
      24: 698.46, // F5
      26: 880.0,  // A5
      28: 1046.5, // C6
      30: 1046.5, // C6 resolution
    };

    const leadMap = phraseIndex === 0
      ? leadNotes
      : phraseIndex === 1
        ? answerNotes
        : phraseIndex === 2
          ? repriseNotes
          : closingNotes;
    const lead = leadMap[phraseStep];
    if (lead) {
      const lf = lead;
      // Softer triangle lead and restrained harmonics keep the bright melody
      // clear over the drums without the old square/sawtooth glare.
      this.tone(lf, 0.17, 'triangle', 0.22, { dest });
      this.tone(lf * 0.5, 0.16, 'sine', 0.11, { dest });
      this.tone(lf * 2, 0.12, 'sine', 0.08, { dest, delay: 0.01 });
    }
  }
}

export const audio = new AudioManager();
