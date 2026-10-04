import * as THREE from 'three';
import { CameraRig } from './cameraRig';
import { World, Z_LIMIT } from './world';
import type { Obstacle, Portal } from './world';
import { Particles } from './effects';
import { createPetMesh, createPlayer } from './player';
import type { PlayerRig } from './player';
import { THEMES } from './themes';
import { audio } from './audio';
import { petById } from './content';
import { DEFAULT_SAVE, buildRunConfig, rollPet } from './save';
import { Tweener, clamp, damp, ease, lerp } from './tween';
import type {
  DimensionMode,
  DimensionState,
  EngineEvent,
  HintInfo,
  HudState,
  RunConfig,
  RunResult,
} from './types';

const GRAVITY = 36;
const JUMP_V = 12.8;
const STEER = 9.5;
const PLAYER_H = 1.7;
export const BASE_DRAIN = 7.5; // energy / sec while in 3D (before upgrades)
const BASE_SHIFT_COST = 12;

type State = 'menu' | 'playing' | 'paused' | 'dead';

interface RunState {
  lives: number;
  energy: number;
  orbs: number;
  gates: number;
  zone: number;
  invuln: number;
  shiftCd: number;
  petsFound: string[];
  revived: boolean;
}

const freshRun = (cfg: RunConfig): RunState => ({
  lives: cfg.lives,
  energy: cfg.startEnergy,
  orbs: 0,
  gates: 0,
  zone: 0,
  invuln: 0,
  shiftCd: 0,
  petsFound: [],
  revived: false,
});

const layer = (cls: string) => {
  const d = document.createElement('div');
  d.className = `dim-layer ${cls}`;
  return d;
};

export class GameEngine {
  static supported(): boolean {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private rig = new CameraRig();
  private world = new World();
  private particles: Particles;
  private player: PlayerRig = createPlayer();
  private shadow: THREE.Mesh;
  private pet: THREE.Group | null = null;
  private petPos = new THREE.Vector3();
  private tweener = new Tweener();
  private ro: ResizeObserver;

  private bg3d = layer('dim-bg-3d');
  private scan = layer('dim-scan');
  private vignette = layer('dim-vignette');
  private flashEl = layer('dim-flash');
  private popupLayer = layer('dim-popups');

  private comboCount = 0;
  private comboTimer = 0;
  private lastClearedStage = 0;

  private raf = 0;
  private last = 0;
  private time = 0;
  private disposed = false;

  private state: State = 'menu';
  private mode: DimensionMode = '2D_Side';
  private dim: DimensionState = { mode: '2D_Side', cameraAngle: 0, dimensionEnergy: 0 };
  private cfg: RunConfig = buildRunConfig(DEFAULT_SAVE);
  private run: RunState = freshRun(this.cfg);
  private p = { x: 0, y: 0, z: 0, vy: 0, vz: 0, grounded: true, coyote: 0, jumpBuf: 0 };
  private speed = 9;
  private floorY = 0;
  private input = { upKey: false, upTouch: false, downKey: false, downTouch: false };
  private hudAcc = 0;
  private dustT = 0;
  private menuFlip = 3;
  private menuOrbT = 0.5;
  private activeHint: HintInfo | null = null;
  private grace = new Set<number>();
  private graceUntil = 0;

  constructor(
    private container: HTMLElement,
    private emit: (e: EngineEvent) => void,
    private onHud: (h: HudState) => void,
  ) {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    const cv = renderer.domElement;
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    this.renderer = renderer;

    const bg2d = layer('dim-bg-2d');
    container.append(bg2d, this.bg3d, cv, this.scan, this.vignette, this.flashEl, this.popupLayer);

    // 따뜻하고 화사한 카툰 햇살 조명
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x88ccaa, 2.0));
    const sun = new THREE.DirectionalLight(0xfff7d6, 2.6);
    sun.position.set(-6, 22, 16);
    this.scene.add(sun);

    this.scene.add(this.world.root);
    this.particles = new Particles(this.scene);
    this.scene.add(this.player.group);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.55, 20),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('visibilitychange', this.onVisibility);

    // WebGL context-loss handling (prevents the worst case: permanent black screen)
    cv.addEventListener('webglcontextlost', this.onContextLost, false);
    cv.addEventListener('webglcontextrestored', this.onContextRestored, false);

    this.world.setTheme(THEMES[0], true);
    this.applySkyVars();
    this.toMenu();
    this.raf = requestAnimationFrame(this.loop);
  }

  // ---------------------------------------------------------------- public API

  getDimensionState(): DimensionState {
    return this.dim;
  }

  setPet(id: string | null) {
    if (this.pet) {
      this.scene.remove(this.pet);
      this.pet = null;
    }
    const def = petById(id);
    if (def) {
      this.pet = createPetMesh(def);
      this.petPos.set(this.p.x - 2, 2, this.p.z + 0.9);
      this.scene.add(this.pet);
    }
  }

  toMenu() {
    this.state = 'menu';
    this.mode = '2D_Side';
    this.dim.mode = this.mode;
    this.rig.setTarget(false);
    this.world.reset();
    this.world.setTheme(THEMES[0]);
    this.particles.clear();
    this.run = freshRun(this.cfg);
    this.run.invuln = 0;
    this.p.y = 0;
    this.p.vy = 0;
    this.p.grounded = true;
    this.menuFlip = 2.2;
    this.activeHint = null;
    audio.stopMusic();
  }

  startRun(cfg: RunConfig) {
    this.cfg = { ...cfg, hintCounts: { ...cfg.hintCounts } };
    this.world.reset();
    this.world.setTheme(THEMES[0]);
    this.particles.clear();
    this.run = freshRun(this.cfg);
    this.lastClearedStage = 0;
    this.p = { x: 0, y: 0, z: 0, vy: 0, vz: 0, grounded: true, coyote: 0, jumpBuf: 0 };
    this.mode = '2D_Side';
    this.dim.mode = this.mode;
    this.rig.setTarget(false);
    this.input = { upKey: false, upTouch: false, downKey: false, downTouch: false };
    this.grace.clear();
    this.activeHint = null;
    this.speed = 10.5;
    this.setPet(cfg.petId);
    this.state = 'playing';
    this.world.generate(0, this.speed, 0);
    audio.unlock();
    audio.setDimension(false);
    audio.startMusic();
    this.pushHud();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    audio.setPaused(true);
    this.emit({ type: 'pause' });
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.last = performance.now();
    audio.setPaused(false);
  }

  revive() {
    if (this.state !== 'dead') return;
    const r = this.run;
    r.revived = true;
    r.lives = 1;
    r.invuln = 2.4;
    r.energy = Math.max(r.energy, this.cfg.maxEnergy * 0.5);
    this.p.x = this.findSafeX(this.p.x + 1);
    this.p.y = 0;
    this.p.vy = 0;
    this.p.grounded = true;
    this.state = 'playing';
    audio.revive();
    audio.startMusic();
    this.flash('#ffffff', 0.6, 0.6);
    this.pushHud();
  }

  toggleDimension() {
    if (this.state !== 'playing') return;
    const r = this.run;
    if (r.shiftCd > 0) return;
    if (this.mode === '2D_Side') {
      const cost = this.shiftCost;
      if (r.energy < cost) {
        audio.deny();
        this.emit({ type: 'toast', text: 'NOT ENOUGH ENERGY — grab orbs!', tone: 'bad' });
        r.shiftCd = 0.4;
        return;
      }
      r.energy -= cost;
      this.setMode('3D_TopDown');
    } else {
      this.setMode('2D_Side');
    }
    r.shiftCd = 0.35;
    this.pushHud();
  }

  touchUp(down: boolean) {
    this.setUp('touch', down);
  }
  touchDown(down: boolean) {
    this.input.downTouch = down;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.ro.disconnect();
    audio.stopMusic();
    this.renderer.dispose();
    this.container.replaceChildren();
  }

  // ------------------------------------------------------------------ input

  private get up() {
    return this.input.upKey || this.input.upTouch;
  }
  private get down() {
    return this.input.downKey || this.input.downTouch;
  }

  private setUp(src: 'key' | 'touch', down: boolean) {
    if (src === 'key') this.input.upKey = down;
    else this.input.upTouch = down;
    if (down && this.state === 'playing' && this.mode === '2D_Side') this.p.jumpBuf = 0.13;
  }

  private onKeyDown = (ev: KeyboardEvent) => {
    const playing = this.state === 'playing';
    switch (ev.code) {
      case 'Space':
        if (playing) {
          ev.preventDefault();
          if (!ev.repeat) this.toggleDimension();
        }
        break;
      case 'ArrowUp':
      case 'KeyW':
        if (playing) ev.preventDefault();
        if (!ev.repeat) this.setUp('key', true);
        break;
      case 'ArrowDown':
      case 'KeyS':
        if (playing) ev.preventDefault();
        this.input.downKey = true;
        break;
      case 'KeyP':
      case 'Escape':
        if (playing && !ev.repeat) this.pause();
        break;
    }
  };

  private onKeyUp = (ev: KeyboardEvent) => {
    switch (ev.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.input.upKey = false;
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.input.downKey = false;
        break;
    }
  };

  private onBlur = () => {
    this.input = { upKey: false, upTouch: false, downKey: false, downTouch: false };
    // Stop gameplay accounting when the tab or window changes inside a portal iframe
    if (this.state === 'playing') this.pause();
  };

  private onVisibility = () => {
    if (document.hidden) this.pause();
  };

  private ctxLost = false;
  private duck = 0; // duck/slide progress 0-1
  private duckPrev = 0;
  private quality = 0;
  private qCooldown = 0;
  private frameAvg = 16;

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.pause();
    this.ctxLost = true;
    this.emit({ type: 'error', message: 'Graphics context lost. Recovering...' });
  };

  private onContextRestored = () => {
    this.ctxLost = false;
    this.applySkyVars();
    this.world.paletteDirty = true;
  };

  /** Frame-time driven auto quality downgrade (0=best, 1=normal, 2=low) */
  private autoQuality() {
    if (this.qCooldown > 0) {
      this.qCooldown -= 1;
      return;
    }
    if (this.frameAvg > 26 && this.quality < 2) {
      this.quality++;
      this.qCooldown = 240;
    } else if (this.frameAvg < 17 && this.quality > 0) {
      this.quality--;
      this.qCooldown = 600;
    } else {
      return;
    }
    const dprCap = this.quality === 0 ? 2 : this.quality === 1 ? 1.25 : 1;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    if (this.particles) this.particles.setBudget(this.quality === 2 ? 0.35 : this.quality === 1 ? 0.65 : 1);
    this.resize();
  }

  private resize() {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    this.rig.setAspect(w / h);
  }

  // -------------------------------------------------------------- game rules

  private get shiftCost() {
    return BASE_SHIFT_COST * this.cfg.shiftCostMul;
  }

  private get score() {
    const r = this.run;
    return Math.floor((Math.max(0, this.p.x) + r.orbs * 10 + r.gates * 300) * this.cfg.scoreMul);
  }

  /**
   * Render depth of the player. In 2D everything is flattened, so the runner is drawn on a foreground
   * layer (nothing can hide it); the layer slides into the true depth as the camera rotates to 3D.
   */
  private rz() {
    return lerp(5.6, this.p.z, this.rig.e);
  }

  private setMode(m: DimensionMode) {
    const was = this.mode;
    this.mode = m;
    this.dim.mode = m;
    const is3D = m === '3D_TopDown';
    this.rig.setTarget(is3D);
    audio.shift(is3D);
    audio.setDimension(is3D);
    this.rig.shake(0.3);
    this.rig.kickFov(is3D ? 10 : 5);
    const pal = this.world.cur;
    this.particles.burst(this.p.x, this.p.y + 0.9, this.rz(), is3D ? pal.accent2 : pal.accent, 34, 8, 0.7, 2);
    this.flash(is3D ? `#${pal.accent2.getHexString()}` : `#${pal.accent.getHexString()}`, 0.28, 0.55);
    if (!is3D) this.p.vz = 0;
    if (was === '3D_TopDown' && !is3D) {
      // forgive obstacles the player is already overlapping in X at the moment of flattening
      this.grace.clear();
      for (const o of this.world.obstacles) {
        if (o.x1 > this.p.x - 0.9 && o.x0 < this.p.x + 0.9) this.grace.add(o.id);
      }
      this.graceUntil = this.time + 0.6;
    }
  }

  private flash(color: string, strength: number, dur: number) {
    this.flashEl.style.background = color;
    this.tweener.to(strength, 0, dur, ease.outCubic, (v) => (this.flashEl.style.opacity = String(v)));
  }

  private supportY(prevY: number): number {
    const p = this.p;
    const is3D = this.mode === '3D_TopDown';
    let f = -Infinity;
    if (prevY >= -0.15 && (this.world.hasFloor(p.x - 0.18) || this.world.hasFloor(p.x + 0.18))) f = 0;
    const x0 = p.x - 0.28;
    const x1 = p.x + 0.28;
    const z0 = p.z - 0.25;
    const z1 = p.z + 0.25;
    for (const o of this.world.obstacles) {
      if (o.deadly) continue;
      if (o.x1 < x0 || o.x0 > x1) continue;
      if (is3D && (o.z1 < z0 || o.z0 > z1)) continue;
      if (prevY >= o.y1 - 0.14 && o.y1 > f) f = o.y1;
    }
    return f;
  }

  /** 2D collisions are projected onto the XY plane (depth ignored); 3D collisions include Z. */
  private findHit(): Obstacle | null {
    if (this.grace.size && this.time > this.graceUntil) this.grace.clear();
    const p = this.p;
    const is3D = this.mode === '3D_TopDown';
    const x0 = p.x - 0.28;
    const x1 = p.x + 0.28;
    const z0 = p.z - 0.26;
    const z1 = p.z + 0.26;
    const feet = p.y;
    // While ducking, shrink the hitbox height so low beams can be cleared
    const head = p.y + (this.duck > 0.05 ? PLAYER_H * 0.45 : PLAYER_H);
    for (const o of this.world.obstacles) {
      if (o.x1 <= x0 + 0.05 || o.x0 >= x1 - 0.05) continue;
      if (is3D && (o.z1 <= z0 + 0.05 || o.z0 >= z1 - 0.05)) continue;
      if (head <= o.y0 + 0.05) continue;
      if (feet >= o.y1 - (o.deadly ? 0.06 : 0.14)) continue;
      if (this.grace.has(o.id)) continue;
      return o;
    }
    return null;
  }

  private findSafeX(start: number): number {
    const w = this.world;
    for (let x = Math.ceil(start * 2) / 2; x < start + 60; x += 0.5) {
      if (!w.hasFloor(x - 0.6) || !w.hasFloor(x + 0.6)) continue;
      let ok = true;
      for (const o of w.obstacles) {
        if (o.x1 > x - 0.8 && o.x0 < x + 0.8 && o.y1 > 0.05 && o.y0 < PLAYER_H) {
          ok = false;
          break;
        }
      }
      if (ok) return x;
    }
    return start;
  }

  private crash(o: Obstacle | null) {
    const { p, run } = this;
    run.lives -= 1;
    audio.crash();
    this.rig.shake(0.9);
    this.flash('#ff2a4d', 0.4, 0.45);
    this.particles.burst(p.x, p.y + 0.9, this.rz(), '#ff4d6d', 30, 9, 0.8, 14);
    if (run.lives <= 0) {
      this.die();
      return;
    }
    p.x = this.findSafeX(o ? o.x1 + 0.5 : p.x + 1.5);
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    run.invuln = 1.6;
    this.emit({
      type: 'toast',
      text: o ? 'CRASH! Phase shield engaged.' : 'LOST IN THE VOID! Back on your feet…',
      tone: 'bad',
    });
    this.pushHud();
  }

  private die() {
    this.state = 'dead';
    this.activeHint = null;
    audio.gameover();
    audio.stopMusic();
    this.rig.shake(1.3);
    const { run, p, cfg } = this;
    const shards = Math.floor((p.x / 45 + run.orbs * 0.6 + run.gates * 12) * cfg.shardMul);
    const result: RunResult = {
      score: this.score,
      distance: Math.max(0, Math.floor(p.x)),
      orbs: run.orbs,
      gates: run.gates,
      shards,
      petsFound: [...run.petsFound],
      canRevive: !run.revived,
    };
    this.pushHud();
    this.emit({ type: 'gameover', result });
  }

  private enterGate(pt: Portal) {
    const { p, run, cfg } = this;
    pt.used = true;
    run.gates += 1;
    run.zone += 1;
    run.energy = cfg.maxEnergy;
    run.invuln = 1.4;
    const theme = THEMES[run.zone % THEMES.length];
    this.world.setTheme(theme);
    this.particles.burst(pt.x1, 1.8, pt.z0 + 1, '#c99bff', 60, 12, 1.1, 2);
    p.x = pt.exitX;
    p.z = 0;
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    this.rig.shake(0.5);
    this.rig.kickFov(18);
    this.flash('#ffffff', 0.95, 0.9);
    audio.gate();
    this.particles.burst(p.x, 1, this.rz(), '#ffffff', 50, 10, 1, 2);
    this.emit({ type: 'toast', text: `DIMENSION GATE! Zone ${run.zone + 1} · ${theme.name}`, tone: 'gate' });
    if (Math.random() < 0.4) {
      const id = rollPet([...cfg.ownedPets, ...run.petsFound]);
      if (id) {
        run.petsFound.push(id);
        this.emit({ type: 'petFound', petId: id });
      }
    }
    this.pushHud();
  }

  private collectOrbs(dt: number, silent = false) {
    const { p, run, cfg } = this;
    const is3D = this.mode === '3D_TopDown';
    const cy = p.y + 0.9;
    const mag = cfg.magnet;
    const orbs = this.world.orbs;
    for (let i = orbs.length - 1; i >= 0; i--) {
      const o = orbs[i];
      if (!o.alive) continue;
      let dx = o.x - p.x;
      let dy = o.y - cy;
      let dz = is3D ? o.z - p.z : 0;
      let d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < mag * mag) {
        const d = Math.sqrt(d2) || 0.001;
        const step = Math.min(d, (8 + (1 - d / mag) * 26) * dt);
        o.x -= (dx / d) * step;
        o.y -= (dy / d) * step;
        if (is3D) o.z -= (dz / d) * step;
        dx = o.x - p.x;
        dy = o.y - cy;
        dz = is3D ? o.z - p.z : 0;
        d2 = dx * dx + dy * dy + dz * dz;
      }
      if (d2 < 0.95 * 0.95) {
        this.world.removeOrb(o);
        run.orbs += 1;
        run.energy = Math.min(cfg.maxEnergy, run.energy + cfg.orbEnergy);

        // 🥕 3색 당근 팡팡 파티클 (주황 당근 + 초록 잎사귀 + 골드 스파클)
        this.particles.burst(o.x, o.y, o.obj.position.z, '#ff7a00', 12, 5.5, 0.5, 5);
        this.particles.burst(o.x, o.y + 0.2, o.obj.position.z, '#22c55e', 4, 3.8, 0.4, 4);
        this.particles.burst(o.x, o.y, o.obj.position.z, '#ffea75', 6, 6.2, 0.6, 2);

        // 콤보 계산 & 팝업 텍스트
        if (this.comboTimer > 0) {
          this.comboCount++;
        } else {
          this.comboCount = 1;
        }
        this.comboTimer = 1.4;

        if (this.comboCount >= 3) {
          this.showComboPopup(`COMBO x${this.comboCount}! 🥕`, o.x, o.y);
        } else if (this.comboCount === 2) {
          this.showComboPopup(`+100!`, o.x, o.y);
        }

        if (!silent) audio.orb();
      }
    }
  }

  // ----------------------------------------------------------- state updates

  private updatePlaying(dt: number) {
    const { p, run, cfg } = this;
    const is3D = this.mode === '3D_TopDown';

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    // 🏁 [옵션 1] 500m마다 스테이지 클리어 팡파르 & 다음 테마 자동 워프!
    const currentStage = Math.floor(p.x / 500);
    if (currentStage > this.lastClearedStage && currentStage > 0) {
      this.lastClearedStage = currentStage;
      this.advanceStage(currentStage);
    }

    this.speed = 10.5 + Math.min(6.5, p.x / 260);
    run.invuln = Math.max(0, run.invuln - dt);
    run.shiftCd = Math.max(0, run.shiftCd - dt);

    // horizontal movement: auto-run + depth steering in 3D
    p.x += this.speed * dt;
    if (is3D) {
      const steer = (this.down ? 1 : 0) - (this.up ? 1 : 0);
      p.vz = damp(p.vz, steer * STEER, 16, dt);
      p.z = clamp(p.z + p.vz * dt, -Z_LIMIT, Z_LIMIT);
    } else {
      p.vz = damp(p.vz, 0, 20, dt);
    }

    // jump (2D only)
    p.jumpBuf -= dt;
    p.coyote = p.grounded ? 0.1 : p.coyote - dt;
    if (!is3D && p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = JUMP_V;
      p.grounded = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      this.duck = 0;
      audio.jump();
      this.particles.burst(p.x, p.y + 0.05, this.rz(), '#ffffff', 8, 3.5, 0.4, 6);
    }

    // duck / slide (2D only): ignored in the air, ground only
    const wantDuck = !is3D && this.down && p.grounded;
    this.duck = damp(this.duck, wantDuck ? 1 : 0, wantDuck ? 26 : 16, dt);
    if (wantDuck && this.duckPrev < 0.5 && this.duck >= 0.5) {
      audio.slide();
      this.particles.burst(p.x, p.y + 0.04, this.rz(), '#e8f4ff', 6, 2.6, 0.32, 7);
    }
    this.duckPrev = this.duck;

    // vertical physics + support
    const prevY = p.y;
    p.vy = Math.max(-45, p.vy - GRAVITY * dt);
    p.y += p.vy * dt;
    const floor = this.supportY(prevY);
    this.floorY = floor;
    if (floor > -Infinity && p.y <= floor) {
      p.y = floor;
      if (p.vy < 0) p.vy = 0;
      p.grounded = true;
    } else {
      p.grounded = false;
    }

    // collisions
    if (run.invuln <= 0) {
      const hit = this.findHit();
      if (hit) {
        this.crash(hit);
        return;
      }
    }
    if (p.y < -4.5) {
      this.crash(null);
      return;
    }

    this.collectOrbs(dt);

    // hidden dimension gate (only reachable in 3D)
    if (is3D && p.y < 2) {
      for (const pt of this.world.portals) {
        if (!pt.used && p.x + 0.3 > pt.x0 && p.x - 0.3 < pt.x1 && p.z + 0.25 > pt.z0 && p.z - 0.25 < pt.z1) {
          this.enterGate(pt);
          break;
        }
      }
    }

    // dimension energy
    if (this.mode === '3D_TopDown') {
      run.energy -= BASE_DRAIN * cfg.drainMul * dt;
      if (run.energy <= 0) {
        run.energy = 0;
        this.setMode('2D_Side');
        run.shiftCd = 0.4;
        this.emit({ type: 'toast', text: 'ENERGY EMPTY — snapped back to 2D!', tone: 'bad' });
      }
    } else if (cfg.regen2D > 0) {
      run.energy = Math.min(cfg.maxEnergy, run.energy + cfg.regen2D * dt);
    }

    this.world.generate(p.x, this.speed, p.x);
    this.updateHints();

    // dust trail
    this.dustT -= dt;
    if (p.grounded && this.dustT <= 0) {
      this.dustT = 0.055;
      this.particles.burst(p.x - 0.3, p.y + 0.05, this.rz(), '#ffffff', 1, 2.2, 0.35, -1);
    }

    this.hudAcc += dt;
    if (this.hudAcc >= 0.066) {
      this.hudAcc = 0;
      this.pushHud();
    }
  }

  private updateHints() {
    const p = this.p;
    let hint: HintInfo | null = null;
    for (const h of this.world.hints) {
      if (p.x < h.x || p.x > h.until) continue;
      const seen = this.cfg.hintCounts[h.key] ?? 0;
      if (seen >= 3 && !h.shown) continue;
      hint = { key: h.key, text: h.text, icon: h.icon };
      if (!h.shown) {
        h.shown = true;
        this.cfg.hintCounts[h.key] = seen + 1;
        this.emit({ type: 'hintShown', key: h.key });
      }
      break;
    }
    this.activeHint = hint;
  }

  private updateMenu(dt: number) {
    const p = this.p;
    this.speed = 8.5;
    p.x += this.speed * dt;
    p.y = 0;
    p.z = Math.sin(this.time * 0.8) * 1.8;
    p.grounded = true;
    this.floorY = 0;
    this.menuFlip -= dt;
    if (this.menuFlip <= 0) {
      this.menuFlip = 4.2;
      const to3D = this.rig.target === 0;
      this.rig.setTarget(to3D);
      this.rig.kickFov(to3D ? 8 : 4);
      const pal = this.world.cur;
      this.particles.burst(p.x, 1, this.rz(), to3D ? pal.accent2 : pal.accent, 26, 7, 0.7, 2);
    }
    // attract mode: a trail of orbs to scoop up while the camera flips dimensions
    this.menuOrbT -= dt;
    if (this.menuOrbT <= 0) {
      this.menuOrbT = 1.7;
      this.world.addDecorOrbs(p.x + 30);
    }
    this.collectOrbs(dt, true);
    this.dustT -= dt;
    if (this.dustT <= 0) {
      this.dustT = 0.07;
      this.particles.burst(p.x - 0.3, 0.05, this.rz(), '#ffffff', 1, 2.2, 0.35, -1);
    }
  }

  private pushHud() {
    this.onHud(this.getHud());
  }

  private getHud(): HudState {
    const r = this.run;
    return {
      score: this.score,
      distance: Math.max(0, Math.floor(this.p.x)),
      orbs: r.orbs,
      lives: r.lives,
      maxLives: this.cfg.lives,
      energy: r.energy,
      maxEnergy: this.cfg.maxEnergy,
      shiftCost: this.shiftCost,
      canShift: this.mode === '3D_TopDown' || r.energy >= this.shiftCost,
      mode: this.mode,
      cameraAngle: this.rig.angleDeg,
      transitioning: this.rig.transitioning,
      zone: r.zone + 1,
      zoneName: THEMES[r.zone % THEMES.length].name,
      speed: this.speed,
      invuln: r.invuln > 0,
      gates: r.gates,
      hint: this.activeHint,
    };
  }

  // ----------------------------------------------------------------- render

  private applySkyVars() {
    const c = this.world.cur;
    const s = this.container.style;
    s.setProperty('--sky1', `#${c.sky1.getHexString()}`);
    s.setProperty('--sky2', `#${c.sky2.getHexString()}`);
    s.setProperty('--void1', `#${c.void1.getHexString()}`);
    s.setProperty('--void2', `#${c.void2.getHexString()}`);
    s.setProperty('--accent', `#${c.accent.getHexString()}`);
    s.setProperty('--accent2', `#${c.accent2.getHexString()}`);
    this.world.paletteDirty = false;
  }

  private updateVisuals(dt: number, e: number) {
    const p = this.p;
    const pr = this.player;
    const pal = this.world.cur;
    const flat = lerp(0.35, 1, e);
    const dead = this.state === 'dead';

    const rz = lerp(5.6, p.z, e);
    pr.group.position.set(p.x, p.y, rz);
    pr.group.scale.z = flat;
    // duck: lower the body and stretch it slightly forward
    pr.group.scale.y = lerp(1, 0.52, this.duck);
    pr.group.scale.x = lerp(1, 1.12, this.duck);
    pr.animate(this.time, this.speed * (1 + this.duck * 0.15), p.grounded && !dead && this.duck < 0.5);
    pr.group.visible = !dead && (this.run.invuln <= 0 || Math.floor(this.time * 16) % 2 === 0);
    pr.ringMat.color.copy(pal.accent).lerp(pal.accent2, e);
    pr.visorMat.color.copy(pal.accent);
    pr.coreMat.color.copy(pal.accent2);

    const fy = this.floorY;
    if (Number.isFinite(fy) && !dead) {
      const h = Math.max(0, p.y - fy);
      this.shadow.visible = true;
      this.shadow.position.set(p.x, fy + 0.03, rz);
      this.shadow.scale.setScalar(clamp(1 - h * 0.18, 0.3, 1));
    } else {
      this.shadow.visible = false;
    }

    if (this.pet) {
      const t = this.time;
      this.petPos.x = damp(this.petPos.x, p.x - 1.5, 12, dt);
      this.petPos.y = damp(this.petPos.y, p.y + 1.9 + Math.sin(t * 4) * 0.14, 10, dt);
      this.petPos.z = damp(this.petPos.z, lerp(6.1, p.z + 0.9, e), 8, dt);
      this.pet.position.copy(this.petPos);
      this.pet.scale.z = flat;
      this.pet.rotation.y = Math.sin(t * 2) * 0.35;
      this.pet.visible = !dead;
    }

    // CSS layers follow the dimension blend
    if (this.world.paletteDirty) this.applySkyVars();
    this.bg3d.style.opacity = e.toFixed(3);
    this.scan.style.opacity = ((1 - e) * 0.55).toFixed(3);
    this.vignette.style.opacity = e.toFixed(3);
  }

  private loop = (now: number) => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const raw = now - this.last;
    const dt = Math.min(0.05, raw / 1000 || 0.016);
    this.last = now;
    if (raw > 0 && raw < 200) {
      this.frameAvg += (raw - this.frameAvg) * 0.05;
      this.autoQuality();
    }
    if (this.ctxLost) return; // skip rendering while the context is lost
    this.frame(dt);
  };

  private frame(dt: number) {
    if (this.state === 'paused') {
      this.renderer.render(this.scene, this.rig.active);
      return;
    }
    const sdt = this.state === 'dead' ? dt * 0.35 : dt;
    this.time += sdt;
    this.tweener.update(dt);

    if (this.state === 'playing') this.updatePlaying(dt);
    else if (this.state === 'menu') this.updateMenu(dt);

    const p = this.p;
    this.rig.update(sdt, p.x, p.z);
    const e = this.rig.e;
    this.dim.cameraAngle = this.rig.angleDeg;
    this.dim.dimensionEnergy = this.run.energy;
    this.world.update(p.x, this.rig.focusX, sdt, this.time, e);
    this.updateVisuals(sdt, e);
    this.particles.update(sdt);
    this.renderer.render(this.scene, this.rig.active);
  }

  private advanceStage(stageNum: number) {
    const { run, cfg } = this;
    run.zone = stageNum;
    run.energy = cfg.maxEnergy; // 에너지 보너스 완충!
    run.invuln = 2.4; // 안전 무적 2.4초

    const theme = THEMES[run.zone % THEMES.length];
    this.world.setTheme(theme);

    // 카메라 셰이크 & 팡파르
    this.rig.shake(0.5);
    this.rig.kickFov(14);
    this.flash('#ffffff', 0.85, 0.7);

    // 🎊 대형 축하 폭죽 파티클 폭발!
    this.particles.burst(this.p.x + 3, 3, this.rz(), '#ffd166', 70, 14, 1.2, 3);
    this.particles.burst(this.p.x + 3, 3, this.rz(), '#ff6b8b', 50, 12, 1.2, 3);
    this.particles.burst(this.p.x + 3, 3, this.rz(), '#48cae4', 50, 12, 1.2, 3);

    audio.stageClearFanfare();
    this.emit({
      type: 'toast',
      text: `🎉 STAGE ${stageNum} CLEAR! ➔ STAGE ${stageNum + 1}: ${theme.name}`,
      tone: 'gate',
    });

    // 화면 중앙에 대형 클리어 배너 팝업!
    this.showComboPopup(`🏆 STAGE ${stageNum} CLEAR! 🏆`, this.p.x + 2, this.p.y + 2.5);
  }

  private showComboPopup(msg: string, wx: number, wy: number) {
    if (!this.popupLayer) return;
    const v = new THREE.Vector3(wx, wy + 0.6, this.rz());
    v.project(this.rig.active);
    const sx = Math.max(10, Math.min(90, (v.x * 0.5 + 0.5) * 100));
    const sy = Math.max(10, Math.min(90, (-v.y * 0.5 + 0.5) * 100));

    const el = document.createElement('div');
    el.className = 'dim-combo-popup';
    el.textContent = msg;
    el.style.left = `${sx}%`;
    el.style.top = `${sy}%`;
    this.popupLayer.appendChild(el);
    setTimeout(() => {
      if (el.parentNode === this.popupLayer) this.popupLayer.removeChild(el);
    }, 750);
  }
}

