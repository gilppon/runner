import * as THREE from 'three';
import { THEMES } from './themes';
import type { Theme } from './themes';
import { ease, lerp } from './tween';

// ---------------------------------------------------------------------------
// Coordinate system:  +X = running direction, +Y = up, +Z = towards the 2D camera
// (screen-down in the 3D top-down view). In 2D all collisions ignore Z, which is
// exactly what makes giant walls impassable in 2D but walk-aroundable in 3D.
// ---------------------------------------------------------------------------

export const TILE = 2;
export const TRACK_Z = 4.8; // half depth of the walkable track (obstacle extents)
export const Z_LIMIT = 4.2; // player clamp in 3D
export const SPAWN_AHEAD = 100;
const FLOOR_HALF = 6;
const FLOOR_MIN = -24;
const POOL = 72;
const PLAYER_H_REF = 1.7; // standing player height (0.45x while ducking)
const HILL_N = 18;
const HILL_SPAN = 260;
const CLOUD_N = 14;
const CLOUD_SPAN = 280;
const TREE_N = 24;
const TREE_SPAN = 220;

export type ObstacleKind = 'wall' | 'cap' | 'panel' | 'block' | 'spike' | 'platform' | 'roller' | 'beam';
type PatternName = 'pit' | 'wallGap' | 'hurdles' | 'spikes' | 'slalom' | 'rollers' | 'hop' | 'vault' | 'lowBeams';

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
  deadly: boolean; // cannot be stood on
  obj: THREE.Group;
  zScale: number;
  spin?: THREE.Object3D;
  motion?: { baseZ: number; amp: number; speed: number; phase: number; half: number };
}

export interface Orb {
  obj: THREE.Group;
  core: THREE.Mesh;
  x: number;
  y: number;
  z: number;
  alive: boolean;
  phase: number;
  /** In 2D, "front" orbs are drawn on the foreground layer so nothing hides them. */
  front: boolean;
}

export interface Portal {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  exitX: number;
  used: boolean;
  group: THREE.Group;
  swirl: THREE.Object3D;
  glow: THREE.Mesh;
  beamMat: THREE.MeshBasicMaterial;
}

export interface HintMark {
  x: number;
  until: number;
  key: string;
  text: string;
  icon: string;
  shown: boolean;
}

// ---- palette ---------------------------------------------------------------

const KEYS = [
  'floorA', 'floorB', 'floorSide', 'wall', 'wallEmis', 'panel', 'block', 'spike', 'platform',
  'accent', 'accent2', 'orb', 'building', 'grid', 'cube', 'sky1', 'sky2', 'void1', 'void2',
] as const;
type PKey = (typeof KEYS)[number];
export type Palette = Record<PKey, THREE.Color>;

const WHITE = new THREE.Color('#ffffff');

function makePalette(t: Theme): Palette {
  const c = (h: string) => new THREE.Color(h);
  const floor = c(t.floor);
  const wall = c(t.wall);
  const accent = c(t.accent);
  const accent2 = c(t.accent2);
  const danger = c(t.danger);
  return {
    floorA: floor.clone(),
    floorB: floor.clone().lerp(WHITE, 0.14),
    // 흙 단면 (따뜻하고 진한 초콜릿 흙색)
    floorSide: c('#54331a'),
    wall: wall.clone(),
    wallEmis: wall.clone().multiplyScalar(0.45),
    panel: wall.clone().lerp(accent2, 0.3),
    block: danger.clone(),
    spike: danger.clone().lerp(c('#ff2a4d'), 0.4),
    platform: accent.clone().multiplyScalar(0.8),
    accent,
    accent2,
    orb: c(t.orb),
    building: wall.clone().multiplyScalar(0.5),
    grid: accent2.clone().multiplyScalar(0.55),
    cube: accent.clone().multiplyScalar(0.6),
    sky1: c(t.sky1),
    sky2: c(t.sky2),
    void1: c(t.void1),
    void2: c(t.void2),
  };
}

function clonePalette(p: Palette): Palette {
  const o = {} as Palette;
  for (const k of KEYS) o[k] = p[k].clone();
  return o;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

export class World {
  readonly root = new THREE.Group();
  obstacles: Obstacle[] = [];
  orbs: Orb[] = [];
  portals: Portal[] = [];
  hints: HintMark[] = [];
  readonly pitTiles = new Set<number>();
  nextX = 46;

  private patternCount = 0;
  private sinceVault = 0;
  private lastPattern: PatternName | '' = '';
  private idc = 0;

  // shared geometry
  private boxGeo = new THREE.BoxGeometry(1, 1, 1);
  private edgeGeo = new THREE.EdgesGeometry(this.boxGeo);
  private ridgeGeo: THREE.ExtrudeGeometry;

  // 🥕 엽기토끼 맞춤 지오메트리 & 머티리얼 (당근, 두루마리 휴지, 미니 뚫어뻥)
  private carrotBodyGeo = new THREE.ConeGeometry(0.24, 0.72, 14);
  private carrotLeafGeo = new THREE.CapsuleGeometry(0.045, 0.22, 6, 8);
  private tissueOuterGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.88, 20);
  private tissueInnerGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.9, 16);
  private plungerCupGeo = new THREE.CylinderGeometry(0.24, 0.08, 0.2, 14);
  private plungerStickGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.65, 10);

  // materials
  /** Floor tile: single material + vertex colours (was 6-material boxes + 2 strips = 8 drawcalls -> 1) */
  private matTile = new THREE.MeshStandardMaterial({ roughness: 0.85, vertexColors: true });
  private tileGeoA!: THREE.BufferGeometry;
  private tileGeoB!: THREE.BufferGeometry;
  private matWall = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.15 });
  private matPanel = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 });
  private matBlock = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  private matSpike = new THREE.MeshStandardMaterial({ roughness: 0.4, flatShading: true });
  private matPlatform = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 });
  private matStrip = new THREE.MeshBasicMaterial();
  private matStripA = new THREE.MeshBasicMaterial();
  private matBuilding = new THREE.MeshStandardMaterial({ roughness: 1 });
  private matOrb = new THREE.MeshBasicMaterial();
  private matOrbGlow = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  private matLeaf = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    roughness: 0.4,
    emissive: 0x15803d,
    emissiveIntensity: 0.25,
  });
  private matTissueOuter = new THREE.MeshStandardMaterial({
    color: 0xfafafa,
    roughness: 0.85,
  });
  private matTissueCore = new THREE.MeshStandardMaterial({
    color: 0x8d5b4c,
    roughness: 0.9,
  });
  private matPlungerStick = new THREE.MeshStandardMaterial({
    color: 0xd4a373,
    roughness: 0.6,
  });
  private lineWall = new THREE.LineBasicMaterial();
  private lineBlock = new THREE.LineBasicMaterial();
  private linePlat = new THREE.LineBasicMaterial();
  private lineBuilding = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.4 });
  private lineCube = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
  // ☀️ 카툰 배경용 머티리얼
  private matSun = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  private matCloud = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, transparent: true, opacity: 0.95 });
  private matHillFar = new THREE.MeshStandardMaterial({ color: 0x82b88c, roughness: 0.9 });
  private matHillNear = new THREE.MeshStandardMaterial({ color: 0x4aa55c, roughness: 0.85 });
  private matTrunk = new THREE.MeshStandardMaterial({ color: 0x825432, roughness: 0.8 });
  private matCanopy = new THREE.MeshStandardMaterial({ color: 0x2e8b44, roughness: 0.6 });

  private tiles: THREE.Group[] = [];
  private sun!: THREE.Group;
  private clouds: { obj: THREE.Group; base: number; speed: number }[] = [];
  private hills: { obj: THREE.Group; base: number }[] = [];
  private trees: { obj: THREE.Group; base: number }[] = [];
  private orbFree: Orb[] = [];

  // palette state
  cur: Palette;
  private from: Palette;
  private to: Palette;
  private themeT = 1;
  private tmp = new THREE.Color();
  paletteDirty = true;

  constructor() {
    const shape = new THREE.Shape();
    shape.moveTo(-0.5, 0);
    shape.lineTo(0.5, 0);
    shape.lineTo(0, 1);
    shape.closePath();
    this.ridgeGeo = new THREE.ExtrudeGeometry(shape, { depth: 1, bevelEnabled: false });
    this.ridgeGeo.translate(0, 0, -0.5);

    this.cur = makePalette(THEMES[0]);
    this.from = clonePalette(this.cur);
    this.to = clonePalette(this.cur);

    this.buildTiles();
    this.buildBackdrop();
    this.applyPalette(this.cur); // tile vertex colours are finally tinted here
  }

  // ---- theme ---------------------------------------------------------------

  setTheme(theme: Theme, instant = false) {
    this.from = clonePalette(this.cur);
    this.to = makePalette(theme);
    this.themeT = instant ? 1 : 0;
    if (instant) {
      this.cur = clonePalette(this.to);
      this.applyPalette(this.cur);
    }
  }

  private applyPalette(p: Palette) {
    const t = this.tmp;
    this.retintTiles(p.floorA, p.floorB, p.floorSide, p.accent);
    this.matWall.color.copy(p.wall);
    this.matWall.emissive.copy(p.wallEmis);
    this.matPanel.color.copy(p.panel);
    this.matPanel.emissive.copy(p.panel).multiplyScalar(0.45);
    this.matBlock.color.copy(p.block);
    this.matBlock.emissive.copy(p.block).multiplyScalar(0.45);
    this.matSpike.color.copy(p.spike);
    this.matSpike.emissive.copy(p.spike).multiplyScalar(0.5);
    this.matPlatform.color.copy(p.platform);
    this.matPlatform.emissive.copy(p.platform).multiplyScalar(0.45);
    this.matStrip.color.copy(p.accent2);
    this.matStripA.color.copy(p.accent);
    this.matBuilding.color.copy(p.building);
    this.matBuilding.emissive.copy(p.building).multiplyScalar(0.5);
    this.matOrb.color.copy(p.orb);
    this.matOrbGlow.color.copy(p.orb);
    this.lineWall.color.copy(p.accent2);
    this.lineBlock.color.copy(t.copy(p.block).lerp(WHITE, 0.6));
    this.linePlat.color.copy(p.accent);
    this.lineBuilding.color.copy(p.accent2);
    this.lineCube.color.copy(p.cube);
    this.paletteDirty = true;
  }

  // ---- static scenery ------------------------------------------------------

  /**
   * 🏃‍♂️ 상용급 러닝 트랙 지오메트리:
   * - 중앙: 플레이어가 질주하는 황금 흙길/모래 런웨이 패스
   * - 양옆: 싱그러운 잔디 갓길
   * - 경계: 또렷한 화이트/골드 레인 마커선
   * - 옆면: 깊고 단단한 초콜릿 흙 단면
   */
  private makeTileGeo(checker: 0 | 1) {
    const parts: THREE.BufferGeometry[] = [];
    
    // 1. 메인 베이스 블록 (흙 단면)
    const baseBox = new THREE.BoxGeometry(TILE, 6, FLOOR_HALF * 2);
    baseBox.translate(0, -3, 0);
    parts.push(baseBox);

    // 2. 중앙 질주 런웨이 (따뜻한 흙길 패스, 폭 5.8)
    const road = new THREE.BoxGeometry(TILE, 0.06, 5.8);
    road.translate(0, 0.03, 0);
    parts.push(road);

    // 3. 양옆 레인 마커선 (또렷한 스트립, Z: -2.9, 2.9)
    for (const zs of [-1, 1]) {
      const s = new THREE.BoxGeometry(TILE, 0.08, 0.22);
      s.translate(0, 0.04, zs * 2.9);
      parts.push(s);
    }

    // 4. 양옆 싱그러운 잔디 갓길 (Z: -4.5, 4.5)
    for (const zs of [-1, 1]) {
      const grass = new THREE.BoxGeometry(TILE, 0.07, 2.6);
      grass.translate(0, 0.035, zs * 4.4);
      parts.push(grass);
    }

    let vTotal = 0;
    let iTotal = 0;
    for (const g of parts) {
      vTotal += g.attributes.position.count;
      iTotal += g.index ? g.index.count : 0;
    }

    const pos = new Float32Array(vTotal * 3);
    const nor = new Float32Array(vTotal * 3);
    const col = new Float32Array(vTotal * 3);
    const idx = new Uint32Array(iTotal);

    let vo = 0;
    let io = 0;
    for (let partIdx = 0; partIdx < parts.length; partIdx++) {
      const g = parts[partIdx];
      const p = g.attributes.position;
      const n = g.attributes.normal;
      const gi = g.index!;
      for (let i = 0; i < p.count; i++) {
        pos[(vo + i) * 3] = p.getX(i);
        pos[(vo + i) * 3 + 1] = p.getY(i);
        pos[(vo + i) * 3 + 2] = p.getZ(i);
        nor[(vo + i) * 3] = n.getX(i);
        nor[(vo + i) * 3 + 1] = n.getY(i);
        nor[(vo + i) * 3 + 2] = n.getZ(i);
      }
      for (let i = 0; i < gi.count; i++) idx[io + i] = gi.getX(i) + vo;

      // Role 인코딩:
      // role 0 = 흙 단면 (side)
      // role 1 = 차선 마커선 (accent / yellow stripe)
      // role 2 = 싱그러운 초록 잔디 (floorA / floorB)
      // role 3 = 중앙 달리는 흙길 런웨이 도로 (road / sandy path)
      for (let i = 0; i < p.count; i++) {
        let role = 0;
        if (partIdx === 0) {
          // 베이스 블록의 윗면은 잔디, 옆면은 흙
          const isTop = n.getY(i) > 0.5;
          role = isTop ? 2 : 0;
        } else if (partIdx === 1) {
          // 중앙 런웨이 도로
          role = 3;
        } else if (partIdx === 2 || partIdx === 3) {
          // 레인 마커선
          role = 1;
        } else {
          // 양옆 잔디 갓길
          role = 2;
        }
        col[(vo + i) * 3] = role;
        col[(vo + i) * 3 + 1] = role;
        col[(vo + i) * 3 + 2] = role;
      }
      void checker;
      vo += p.count;
      io += gi.count;
      g.dispose();
    }

    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    out.computeBoundingSphere();
    return out;
  }

  /** Recompute vertex colours from the palette on theme change */
  private retintTiles(floorA: THREE.Color, floorB: THREE.Color, side: THREE.Color, accent: THREE.Color) {
    const pairs: [THREE.BufferGeometry, THREE.Color][] = [
      [this.tileGeoA, floorA],
      [this.tileGeoB, floorB],
    ];
    // 도로 런웨이 전용 따뜻한 황금 흙길 색상
    const roadColor = new THREE.Color('#e0a96d');
    const roadColorB = new THREE.Color('#d49b5c');

    for (let pIdx = 0; pIdx < pairs.length; pIdx++) {
      const [geo, grassColor] = pairs[pIdx];
      const activeRoad = pIdx === 0 ? roadColor : roadColorB;
      const attr = geo.getAttribute('color') as THREE.BufferAttribute;
      for (let i = 0; i < attr.count; i++) {
        const role = Math.round(attr.getX(i));
        let c = side;
        if (role === 1) c = accent; // 선명한 차선 마커
        else if (role === 2) c = grassColor; // 싱그러운 잔디
        else if (role === 3) c = activeRoad; // 흙길 런웨이
        attr.setXYZ(i, c.r, c.g, c.b);
      }
      attr.needsUpdate = true;
    }
  }

  private buildTiles() {
    this.tileGeoA = this.makeTileGeo(0);
    this.tileGeoB = this.makeTileGeo(1);
    for (let i = 0; i < POOL; i++) {
      const g = new THREE.Group();
      const m = new THREE.Mesh(i % 2 ? this.tileGeoB : this.tileGeoA, this.matTile);
      g.add(m);
      g.visible = false;
      this.root.add(g);
      this.tiles.push(g);
    }
  }

  private buildBackdrop() {
    const sphereGeo = new THREE.SphereGeometry(1, 14, 10);

    // 1. ☀️ 방긋 웃는 해님 (Smiling Sun)
    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32), this.matSun);
    sunGroup.add(sunMesh);

    // 12가닥의 햇살
    for (let i = 0; i < 12; i++) {
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 8), this.matSun);
      const ang = (i * Math.PI * 2) / 12;
      ray.position.set(Math.cos(ang) * 4.4, Math.sin(ang) * 4.4, 0);
      ray.rotation.z = ang - Math.PI / 2;
      sunGroup.add(ray);
    }

    // 깜찍한 카툰 눈 & 핑크 볼터치
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x332211 });
    const eyeL = new THREE.Mesh(this.boxGeo, eyeMat);
    eyeL.scale.set(0.18, 0.45, 0.1);
    eyeL.position.set(-1.1, 0.4, 0.1);
    const eyeR = eyeL.clone();
    eyeR.position.x = 1.1;

    const pinkMat = new THREE.MeshBasicMaterial({ color: 0xff8fa3 });
    const cheekL = new THREE.Mesh(new THREE.CircleGeometry(0.55, 16), pinkMat);
    cheekL.position.set(-1.6, -0.4, 0.1);
    const cheekR = cheekL.clone();
    cheekR.position.x = 1.6;
    sunGroup.add(eyeL, eyeR, cheekL, cheekR);

    sunGroup.position.set(0, 24, -65);
    this.root.add(sunGroup);
    this.sun = sunGroup;

    // 2. ☁️ 둥실둥실 솜사탕 구름 (Fluffy Clouds)
    for (let i = 0; i < CLOUD_N; i++) {
      const cg = new THREE.Group();
      const parts = 3 + Math.floor(Math.random() * 2);
      for (let p = 0; p < parts; p++) {
        const m = new THREE.Mesh(sphereGeo, this.matCloud);
        const r = rnd(1.4, 2.8);
        m.scale.set(r, r * 0.75, r * 0.6);
        m.position.set((p - parts / 2) * 1.8, rnd(-0.3, 0.4), rnd(-0.2, 0.2));
        cg.add(m);
      }
      cg.position.set(0, rnd(14, 26), -rnd(45, 75));
      this.root.add(cg);
      this.clouds.push({ obj: cg, base: (i / CLOUD_N) * CLOUD_SPAN, speed: rnd(0.8, 1.6) });
    }

    // 3. 🏔️ 겹겹이 중첩된 완만한 카툰 산맥 (Rolling Hills)
    for (let i = 0; i < HILL_N; i++) {
      const hg = new THREE.Group();
      const isFar = i % 2 === 0;
      const mat = isFar ? this.matHillFar : this.matHillNear;
      const radius = isFar ? rnd(16, 26) : rnd(9, 16);
      const height = isFar ? rnd(18, 34) : rnd(10, 19);
      const hill = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 18), mat);
      hill.position.y = height / 2 - 8;
      hill.scale.set(1.2, 1, 0.75);
      hg.add(hill);
      hg.position.set(0, 0, isFar ? -rnd(55, 80) : -rnd(32, 48));
      this.root.add(hg);
      this.hills.push({ obj: hg, base: (i / HILL_N) * HILL_SPAN });
    }

    // 4. 🌳 아기자기한 카툰 브로콜리 나무 (Trees)
    for (let i = 0; i < TREE_N; i++) {
      const tg = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 2.6, 10), this.matTrunk);
      trunk.position.y = 1.3;
      tg.add(trunk);

      const foliage1 = new THREE.Mesh(sphereGeo, this.matCanopy);
      foliage1.scale.set(1.4, 1.4, 1.4);
      foliage1.position.y = 2.9;
      const foliage2 = new THREE.Mesh(sphereGeo, this.matCanopy);
      foliage2.scale.set(1.1, 1.1, 1.1);
      foliage2.position.set(0.5, 3.4, 0.2);
      const foliage3 = new THREE.Mesh(sphereGeo, this.matCanopy);
      foliage3.scale.set(1.0, 1.0, 1.0);
      foliage3.position.set(-0.4, 3.3, -0.2);
      tg.add(foliage1, foliage2, foliage3);

      const zSide = (Math.random() < 0.5 ? -1 : 1) * rnd(10, 24);
      tg.position.set(0, 0, zSide);
      const sc = rnd(0.85, 1.35);
      tg.scale.set(sc, sc, sc);
      this.root.add(tg);
      this.trees.push({ obj: tg, base: (i / TREE_N) * TREE_SPAN });
    }
  }

  // ---- queries -------------------------------------------------------------

  hasFloor(x: number): boolean {
    const j = Math.floor(x / TILE);
    return j >= FLOOR_MIN && !this.pitTiles.has(j);
  }

  // ---- lifecycle -----------------------------------------------------------

  reset() {
    for (const o of this.obstacles) this.root.remove(o.obj);
    this.obstacles.length = 0;
    for (const o of [...this.orbs]) this.removeOrb(o);
    for (const p of this.portals) this.disposePortal(p);
    this.portals.length = 0;
    this.hints.length = 0;
    this.pitTiles.clear();
    this.nextX = 46;
    this.patternCount = 0;
    this.sinceVault = 0;
    this.lastPattern = '';
  }

  private disposePortal(p: Portal) {
    this.root.remove(p.group);
    p.group.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        if (o.geometry !== this.boxGeo) o.geometry.dispose();
        const m = o.material as THREE.Material;
        if (m !== this.matStrip) m.dispose();
      }
    });
  }

  removeOrb(o: Orb) {
    o.alive = false;
    o.obj.visible = false;
    const i = this.orbs.indexOf(o);
    if (i >= 0) this.orbs.splice(i, 1);
    this.orbFree.push(o);
  }

  // ---- per-frame update ----------------------------------------------------

  update(playerX: number, camX: number, dt: number, t: number, e: number) {
    // palette blending
    if (this.themeT < 1) {
      this.themeT = Math.min(1, this.themeT + dt / 1.3);
      const k = ease.inOutSine(this.themeT);
      for (const key of KEYS) this.cur[key].copy(this.from[key]).lerp(this.to[key], k);
      this.applyPalette(this.cur);
    }

    // tiles
    const j0 = Math.floor(playerX / TILE) - 14;
    for (let j = j0; j < j0 + POOL; j++) {
      const tile = this.tiles[mod(j, POOL)];
      const vis = j >= FLOOR_MIN && !this.pitTiles.has(j);
      tile.visible = vis;
      if (vis) tile.position.x = j * TILE + TILE / 2;
    }

    // obstacles (paper-flat in 2D, extruded in 3D)
    const k = lerp(0.06, 1, e);
    for (const o of this.obstacles) {
      if (o.motion) {
        const m = o.motion;
        const z = m.baseZ + Math.sin(t * m.speed + m.phase) * m.amp;
        o.z0 = z - m.half;
        o.z1 = z + m.half;
        o.obj.position.z = z;
      }
      o.obj.scale.z = o.zScale * k;
      if (o.spin) {
        o.spin.rotation.z -= dt * 3;
        o.spin.rotation.y += dt * 1.3;
      }
    }

    // orbs
    const ok = lerp(0.3, 1, e);
    for (const o of this.orbs) {
      const zr = o.front ? lerp(5.2, o.z, e) : o.z;
      o.obj.position.set(o.x, o.y + Math.sin(t * 3 + o.phase) * 0.1, zr);
      o.obj.scale.z = ok;
      o.core.rotation.y += dt * 2.2;
      o.core.rotation.x += dt * 1.1;
    }

    // portals
    for (const p of this.portals) {
      p.swirl.rotation.z += dt * 2.4;
      p.glow.scale.setScalar(1 + Math.sin(t * 4) * 0.05);
      p.beamMat.opacity = lerp(0.2, 0.07, e) * (p.used ? 0.2 : 1);
      p.group.visible = !p.used;
    }

    // ☀️ 카툰 패럴랙스 애니메이션 (해님, 뭉게구름, 겹겹이 산맥, 숲)
    if (this.sun) {
      this.sun.position.x = camX + 18;
      this.sun.rotation.z = t * 0.12;
      const pulse = 1 + Math.sin(t * 2.2) * 0.035;
      this.sun.scale.set(pulse, pulse, 1);
    }
    for (const c of this.clouds) {
      c.obj.position.x = camX + mod(c.base - camX * 0.22 - t * c.speed * 2, CLOUD_SPAN) - CLOUD_SPAN / 2;
    }
    for (const h of this.hills) {
      h.obj.position.x = camX + mod(h.base - camX * 0.42, HILL_SPAN) - HILL_SPAN / 2;
    }
    for (const tr of this.trees) {
      tr.obj.position.x = camX + mod(tr.base - camX * 0.95, TREE_SPAN) - TREE_SPAN / 2;
    }

    // pruning
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (this.obstacles[i].x1 < playerX - 28) {
        this.root.remove(this.obstacles[i].obj);
        this.obstacles.splice(i, 1);
      }
    }
    for (let i = this.orbs.length - 1; i >= 0; i--) {
      if (this.orbs[i].x < playerX - 22) this.removeOrb(this.orbs[i]);
    }
    for (let i = this.portals.length - 1; i >= 0; i--) {
      if (this.portals[i].x1 < playerX - 28) {
        this.disposePortal(this.portals[i]);
        this.portals.splice(i, 1);
      }
    }
    for (let i = this.hints.length - 1; i >= 0; i--) {
      if (this.hints[i].until < playerX - 6) this.hints.splice(i, 1);
    }
  }

  // ---- procedural generation -------------------------------------------------

  generate(playerX: number, speed: number, dist: number) {
    while (this.nextX < playerX + SPAWN_AHEAD) {
      const x0 = this.nextX;
      const end = this.spawn(x0, speed, dist);
      const gap = 17 + speed * 0.85 + Math.random() * 6;
      this.nextX = Math.ceil((end + gap) / TILE) * TILE;
    }
    const jMin = Math.floor(playerX / TILE) - 30;
    for (const j of this.pitTiles) if (j < jMin) this.pitTiles.delete(j);
  }

  private pick(dist: number): PatternName {
    const n = this.patternCount++;
    if (n === 0) return 'pit';
    if (n === 1) return 'wallGap';
    if (n === 2) return 'hurdles';
    if (n === 3) {
      this.sinceVault = 0;
      return 'vault';
    }
    this.sinceVault++;
    if (this.sinceVault >= 5 && (Math.random() < 0.4 || this.sinceVault >= 8)) {
      this.sinceVault = 0;
      return 'vault';
    }
    const table: [PatternName, number][] = [
      ['pit', 3],
      ['wallGap', 3],
      ['hurdles', 2.5],
      ['spikes', dist > 120 ? 2 : 0],
      ['slalom', dist > 300 ? 2.5 : 0],
      ['rollers', dist > 220 ? 2.2 : 0],
      ['hop', dist > 160 ? 2.2 : 0],
      ['lowBeams', dist > 90 ? 2.4 : 0],
    ];
    const pool = table.filter(([name, w]) => w > 0 && name !== this.lastPattern);
    const total = pool.reduce((a, [, w]) => a + w, 0);
    let r = Math.random() * total;
    for (const [name, w] of pool) {
      r -= w;
      if (r <= 0) return name;
    }
    return pool[0][0];
  }

  private spawn(x0: number, speed: number, dist: number): number {
    const name = this.pick(dist);
    this.lastPattern = name;
    switch (name) {
      case 'pit':
        return this.pPit(x0, speed);
      case 'wallGap':
        return this.pWallGap(x0);
      case 'hurdles':
        return this.pHurdles(x0, speed);
      case 'spikes':
        return this.pSpikes(x0);
      case 'slalom':
        return this.pSlalom(x0);
      case 'rollers':
        return this.pRollers(x0);
      case 'hop':
        return this.pHop(x0);
      case 'vault':
        return this.pVault(x0);
      case 'lowBeams':
        return this.pLowBeams(x0, speed);
    }
  }

  /** Low beam run: standing collides, you must duck (v) to skim under. */
  private pLowBeams(x0: number, speed: number): number {
    const count = 2 + Math.floor(Math.random() * 2);
    const gap = Math.max(7.5, speed * 0.85);
    const beamH = PLAYER_H_REF * 0.78; // lower than a standing head (1.62)
    for (let i = 0; i < count; i++) {
      const bx = x0 + i * gap;
      const w = 3.4 + Math.random() * 1.6;
      this.addObstacle('beam', bx, bx + w, beamH, 9.5, -TRACK_Z, TRACK_Z);
      this.addDecorOrbs(bx + w / 2);
      // Only the first beam shows the duck hint (once per run, engine caps it at 3)
      if (i === 0) this.addHint(bx - 9, bx + 4, 'duck', 'Press DOWN to slide under!', '⬇');
    }
    return x0 + (count - 1) * gap + 4.5;
  }

  // ---- pattern builders --------------------------------------------------------

  /** Giant wall with a walkable gap on one side. 2D: blocked. 3D: walk around. */
  private pWallGap(x0: number): number {
    const side = Math.random() < 0.5 ? -1 : 1;
    const edge = 0.6 + Math.random() * 0.8;
    const len = 2.4;
    if (side > 0) this.addObstacle('wall', x0, x0 + len, 0, 9.5, -TRACK_Z, edge);
    else this.addObstacle('wall', x0, x0 + len, 0, 9.5, -edge, TRACK_Z);
    const gc = (side * (edge + TRACK_Z)) / 2;
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      this.addOrb(x0 - 13 + t * 10, 1, gc * ease.inOutSine(t));
    }
    this.addOrb(x0 + len / 2, 1, gc);
    this.addOrb(x0 + len + 2.5, 1, gc);
    this.addHint(x0 - 30, x0, 'wall', 'Giant wall! Impassable in 2D — press SPACE and walk around it in 3D.', '🧱');
    return x0 + len;
  }

  /** Three staggered giant walls. Stay in 3D and weave. */
  private pSlalom(x0: number): number {
    let s = Math.random() < 0.5 ? -1 : 1;
    const spacing = 13;
    const len = 1.8;
    const edge = 0.9;
    let prevZ = 0;
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * spacing;
      if (s > 0) this.addObstacle('wall', x, x + len, 0, 8, -TRACK_Z, edge);
      else this.addObstacle('wall', x, x + len, 0, 8, -edge, TRACK_Z);
      const gc = (s * (edge + TRACK_Z)) / 2;
      this.addOrb(x - 4.5, 1, (prevZ + gc) / 2);
      this.addOrb(x + len / 2, 1, gc);
      prevZ = gc;
      s = -s;
    }
    this.addHint(x0 - 30, x0, 'slalom', 'Slalom! Stay in 3D and weave through the gaps — watch your energy.', '🌀');
    return x0 + 2 * spacing + len;
  }

  /** A pit spanning every depth. 2D only: jump. */
  private pPit(x0: number, speed: number): number {
    const w = speed < 12.5 ? 4 : speed < 15 ? 6 : Math.random() < 0.5 ? 6 : 8;
    this.addPit(x0, x0 + w);
    // 점프를 유도하는 환상적인 포물선 당근 트레일 7개!
    this.addCarrotTrail(x0 - 2, w + 4, 1, 3.2, 0, 7);
    this.addHint(x0 - 30, x0, 'pit', 'Bottomless pit! Stay in 2D and jump with ▲ / W.', '🕳️');
    return x0 + w;
  }

  /** Low blocks: jump in 2D or sidestep in 3D. */
  private pHurdles(x0: number, speed: number): number {
    const spacing = 8 + speed * 0.2;
    let side = Math.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * spacing;
      if (side > 0) this.addObstacle('block', x, x + 1.4, 0, 1.3, -TRACK_Z, 0.9);
      else this.addObstacle('block', x, x + 1.4, 0, 1.3, -0.9, TRACK_Z);
      // 블록 위를 뛰어넘는 아치형 당근 4개 + 우회 레인 당근 4개
      this.addCarrotTrail(x - 1, 3.4, 1.3, 3.0, side > 0 ? -2 : 2, 4);
      this.addCarrotTrail(x - 0.5, 2.5, 0.9, 0.9, side * 2.9, 3);
      side = -side;
    }
    this.addHint(x0 - 30, x0, 'hurdle', 'Low blocks: jump ▲ in 2D — or sidestep in 3D.', '🟧');
    return x0 + 2 * spacing + 1.4;
  }

  /** Full-depth spike strips. 2D only: jump. */
  private pSpikes(x0: number): number {
    const len = 3.2;
    for (let i = 0; i < 2; i++) {
      const x = x0 + i * 10;
      this.addObstacle('spike', x, x + len, 0, 0.95, -TRACK_Z, TRACK_Z, true);
      // 가시밭 위를 넘는 탐스러운 아치형 당근 5개
      this.addCarrotTrail(x - 0.5, len + 1, 1.2, 3.3, 0, 5);
    }
    this.addHint(x0 - 30, x0, 'spike', 'Spikes cover every depth — flatten to 2D and jump.', '⚠️');
    return x0 + 10 + len;
  }

  /** Spike balls sweeping through the depth. 2D: jump. 3D: time the sweep. */
  private pRollers(x0: number): number {
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * 10;
      const o = this.addObstacle('roller', x - 0.6, x + 0.6, 0.05, 1.3, -0.6, 0.6, true);
      o.motion = { baseZ: 0, amp: 3.3, speed: rnd(1.6, 2.4), phase: rnd(0, 6.28), half: 0.6 };
      // 데굴데굴 휴지 롤 사이로 이어지는 당근 라인 4개
      this.addCarrotTrail(x + 1.5, 5, 1, 2.5, 0, 4);
    }
    this.addHint(x0 - 30, x0, 'roller', 'Spike balls sweep the depth — jump in 2D, or time the sweep in 3D.', '🔴');
    return x0 + 20 + 0.6;
  }

  /** Broken bridge with two pillars. 2D only: hop across. */
  private pHop(x0: number): number {
    this.addPit(x0, x0 + 14);
    this.addObstacle('platform', x0 + 3.5, x0 + 8, -6, 1.5, -TRACK_Z - 0.6, TRACK_Z + 0.6);
    this.addObstacle('platform', x0 + 10, x0 + 14, -6, 1.5, -TRACK_Z - 0.6, TRACK_Z + 0.6);
    // 공중 플랫폼을 딛고 뛰는 대형 점프 당근 아치 8개
    this.addCarrotTrail(x0 + 1, 12, 1.5, 4.3, 0, 8);
    this.addHint(x0 - 30, x0, 'hop', 'Broken bridge! Hop from pillar to pillar in 2D.', '🌉');
    return x0 + 14;
  }

  /**
   * The secret vault: a tall panel hides a lane (and a Dimension Gate) behind it.
   * In 2D the panel is a solid wall and the gate is invisible — except for the light beam.
   */
  private pVault(x0: number): number {
    const L = 14;
    this.addObstacle('panel', x0, x0 + L, 0, 5.2, -1.5, -0.7);
    this.addObstacle('cap', x0 + L, x0 + L + 1.2, 0, 6.5, -TRACK_Z - 0.4, -0.7);
    this.addPortal(x0 + L - 0.5, -3.05, x0 + L + 1.2 + 4);
    for (let i = 0; i < 5; i++) {
      const t = i / 4;
      this.addOrb(x0 - 11 + t * 9, 1, -3.05 * ease.inOutSine(t));
    }
    // alcove orbs stay on their true depth, so the panel hides them in 2D
    for (let i = 0; i < 4; i++) this.addOrb(x0 + 2.2 + i * 2.6, 1, -3.05, false);
    for (let i = 0; i < 4; i++) this.addOrb(x0 + 2 + i * 3.5, 1, 2.6);
    this.addHint(
      x0 - 32,
      x0 + 2,
      'vault',
      'A light beam leaks from behind that wall… go 3D and slip into the hidden lane to reach the Dimension Gate!',
      '✨',
    );
    return x0 + L + 1.2;
  }

  /** Decorative orb trail used by the title-screen attract mode. */
  addDecorOrbs(x: number) {
    const zc = rnd(-2.5, 2.5);
    for (let i = 0; i < 7; i++) {
      const t = i / 6;
      this.addOrb(x + i * 1.6, 1 + Math.sin(t * Math.PI) * 1.4, zc + Math.sin(t * Math.PI * 2) * 1.5);
    }
  }

  /** 🥕 줄줄이 당근 궤적 스폰 (Talking Tom 골드바 쾌감 연출) */
  addCarrotTrail(xStart: number, len: number, yBase: number, yPeak: number, z: number, count = 6, front = true) {
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const arc = Math.sin(t * Math.PI);
      const x = xStart + t * len;
      const y = yBase + arc * (yPeak - yBase);
      this.addOrb(x, y, z, front);
    }
  }

  // ---- builders ---------------------------------------------------------------

  private addPit(xa: number, xb: number) {
    for (let j = Math.round(xa / TILE); j < Math.round(xb / TILE); j++) this.pitTiles.add(j);
  }

  private addHint(x: number, until: number, key: string, text: string, icon: string) {
    this.hints.push({ x, until, key, text, icon, shown: false });
  }

  private addOrb(x: number, y: number, z: number, front = true) {
    let o = this.orbFree.pop();
    if (!o) {
      const g = new THREE.Group();

      // 🥕 탐스러운 주황색 당근 (Carrot) 조립
      const carrot = new THREE.Mesh(this.carrotBodyGeo, this.matOrb);
      carrot.rotation.x = Math.PI; // 아래로 뾰족하게
      carrot.position.y = -0.04;

      // 싱그러운 초록 잎사귀 3가닥
      for (let i = 0; i < 3; i++) {
        const ang = (i * Math.PI * 2) / 3;
        const leaf = new THREE.Mesh(this.carrotLeafGeo, this.matLeaf);
        leaf.position.set(Math.sin(ang) * 0.06, -0.36, Math.cos(ang) * 0.06);
        leaf.rotation.x = Math.cos(ang) * 0.45;
        leaf.rotation.z = Math.sin(ang) * 0.45;
        carrot.add(leaf);
      }

      // 살짝 비스듬히 기울여서 공전할 때 깜찍한 실루엣 연출
      carrot.rotation.z = 0.28;

      g.add(carrot);
      this.root.add(g);
      o = { obj: g, core: carrot, x, y, z, alive: true, phase: 0, front };
    }
    o.x = x;
    o.y = y;
    o.z = z;
    o.front = front;
    o.alive = true;
    o.phase = Math.random() * 6.28;
    o.obj.visible = true;
    o.obj.position.set(x, y, z);
    this.orbs.push(o);
  }

  private addObstacle(
    kind: ObstacleKind,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
    z0: number,
    z1: number,
    deadly = false,
  ): Obstacle {
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const cz = (z0 + z1) / 2;
    const sx = x1 - x0;
    const sy = y1 - y0;
    const sz = z1 - z0;
    const g = new THREE.Group();
    let zScale = sz;
    let spin: THREE.Object3D | undefined;

    if (kind === 'beam') {
      // 🚧 귀여운 줄무늬 허들 바리케이드
      g.add(new THREE.Mesh(this.boxGeo, this.matPanel));
      for (const yy of [-0.42, 0.42]) {
        const s = new THREE.Mesh(this.boxGeo, this.matStrip);
        s.scale.set(1.02, 0.08, 1.02);
        s.position.y = yy;
        g.add(s);
      }
      g.position.set(cx, cy, cz);
      g.scale.set(sx, sy, sz);
    } else if (kind === 'wall' || kind === 'cap' || kind === 'panel') {
      // 🎁 거대한 알록달록 장난감 선물 상자 탑 (Toy Gift Box Wall)
      const boxMat = new THREE.MeshStandardMaterial({
        color: kind === 'panel' ? 0x38bdf8 : 0xf472b6,
        roughness: 0.4,
      });
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        roughness: 0.3,
      });
      g.add(new THREE.Mesh(this.boxGeo, boxMat));

      // 세로 리본 띠
      const ribbonV = new THREE.Mesh(this.boxGeo, ribbonMat);
      ribbonV.scale.set(0.18, 1.01, 1.01);
      g.add(ribbonV);

      // 가로 리본 띠
      const ribbonH = new THREE.Mesh(this.boxGeo, ribbonMat);
      ribbonH.scale.set(1.01, 0.16, 1.01);
      g.add(ribbonH);

      g.position.set(cx, cy, cz);
      g.scale.set(sx, sy, sz);
    } else if (kind === 'block') {
      // 🧱 앙증맞은 장난감 레고 블록 (Toy Lego Cube with studs)
      const legoMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // 산뜻한 레고 옐로우/오렌지
        roughness: 0.35,
      });
      const cube = new THREE.Mesh(this.boxGeo, legoMat);
      g.add(cube);

      // 상단 원형 스터드(단추) 2개
      const studGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 12);
      const stud1 = new THREE.Mesh(studGeo, legoMat);
      stud1.position.set(-0.25, 0.55, 0);
      const stud2 = new THREE.Mesh(studGeo, legoMat);
      stud2.position.set(0.25, 0.55, 0);
      g.add(stud1, stud2);

      g.position.set(cx, cy, cz);
      g.scale.set(sx, sy, sz);
    } else if (kind === 'platform') {
      g.add(new THREE.Mesh(this.boxGeo, this.matPlatform));
      g.add(new THREE.LineSegments(this.edgeGeo, this.linePlat));
      const top = new THREE.Mesh(this.boxGeo, this.matStripA);
      top.scale.set(1.004, 0.02, 1.004);
      top.position.y = 0.5;
      g.add(top);
      g.position.set(cx, cy, cz);
      g.scale.set(sx, sy, sz);
    } else if (kind === 'spike') {
      // 🪠 엽기토끼의 미니 뚫어뻥 트랩 밭!
      const n = Math.max(1, Math.round(sx / 0.9));
      for (let i = 0; i < n; i++) {
        const plunger = new THREE.Group();
        // 빨간 고무 컵
        const cup = new THREE.Mesh(this.plungerCupGeo, this.matSpike);
        cup.position.y = 0.1;
        plunger.add(cup);
        // 나무 막대 손잡이
        const stick = new THREE.Mesh(this.plungerStickGeo, this.matPlungerStick);
        stick.position.y = 0.45;
        plunger.add(stick);

        plunger.scale.set(sx / n * 1.1, sy * 0.9, sz);
        plunger.position.x = (i + 0.5) * (sx / n) - sx / 2;
        g.add(plunger);
      }
      g.position.set(cx, y0, cz);
      zScale = 1;
    } else {
      // 🧻 데굴데굴 굴러오는 거대한 두루마리 휴지 롤 (Toilet Paper Roll)!
      const roll = new THREE.Group();
      const outer = new THREE.Mesh(this.tissueOuterGeo, this.matTissueOuter);
      outer.rotation.z = Math.PI / 2;
      const innerCore = new THREE.Mesh(this.tissueInnerGeo, this.matTissueCore);
      innerCore.rotation.z = Math.PI / 2;
      roll.add(outer, innerCore);

      // 휴지 엠보싱 느낌의 외곽 와이어
      const wire = new THREE.LineSegments(new THREE.WireframeGeometry(this.tissueOuterGeo), this.lineBlock);
      wire.rotation.z = Math.PI / 2;
      roll.add(wire);

      g.add(roll);
      spin = roll;
      g.position.set(cx, cy, cz);
      zScale = 1;
    }

    this.root.add(g);
    const o: Obstacle = { id: this.idc++, kind, x0, x1, y0, y1, z0, z1, deadly, obj: g, zScale, spin };
    this.obstacles.push(o);
    return o;
  }

  private addPortal(x: number, z: number, exitX: number) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);

    const frame = (sx: number, sy: number, sz: number, px: number, py: number, pz: number) => {
      const m = new THREE.Mesh(this.boxGeo, this.matStrip);
      m.scale.set(sx, sy, sz);
      m.position.set(px, py, pz);
      g.add(m);
    };
    frame(0.35, 3.6, 0.3, 0, 1.8, -1.2);
    frame(0.35, 3.6, 0.3, 0, 1.8, 1.2);
    frame(0.35, 0.3, 2.7, 0, 3.7, 0);

    const glowMat = new THREE.MeshBasicMaterial({
      color: '#b388ff',
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.4), glowMat);
    glow.rotation.y = -Math.PI / 2;
    glow.position.set(-0.1, 1.75, 0);
    g.add(glow);

    const swirlHolder = new THREE.Group();
    swirlHolder.rotation.y = Math.PI / 2;
    swirlHolder.position.set(-0.15, 1.75, 0);
    const swirl = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.05, 6, 24, Math.PI * 1.5),
      new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    );
    swirlHolder.add(swirl);
    g.add(swirlHolder);

    const beamMat = new THREE.MeshBasicMaterial({
      color: '#c99bff',
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 46, 18, 1, true), beamMat);
    beam.position.set(0.0, 23, 0);
    g.add(beam);
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 46, 10, 1, true),
      new THREE.MeshBasicMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    inner.position.set(0, 23, 0);
    g.add(inner);

    this.root.add(g);
    this.portals.push({
      x0: x - 0.9,
      x1: x + 0.2,
      z0: z - 1.05,
      z1: z + 1.05,
      exitX,
      used: false,
      group: g,
      swirl,
      glow,
      beamMat,
    });
  }
}
