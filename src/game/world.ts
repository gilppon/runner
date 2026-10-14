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
const HILL_N = 12;
const HILL_SPAN = 260;
const CLOUD_N = 10;
const CLOUD_SPAN = 280;
const TREE_N = 10;
const TREE_SPAN = 220;
const TOY_CITY_N = 6;
const TOY_CITY_SPAN = 260;
const BATHROOM_PROP_N = 8;
const BATHROOM_PROP_SPAN = 84;
const BIOME_PROP_SPAN = 84;
const TOY_COLORS = [0x62bdd0, 0xe9a46d, 0xd98ab0, 0xd9bb6b, 0x7dbd97, 0xa693c7];

export type ObstacleKind = 'wall' | 'cap' | 'panel' | 'block' | 'spike' | 'platform' | 'roller' | 'beam';
type PatternName = 'pit' | 'wallGap' | 'hurdles' | 'spikes' | 'slalom' | 'rollers' | 'hop' | 'vault' | 'lowBeams';

// Biome flavor comes from existing patterns; global unlock distances stay unchanged.
const THEME_PATTERN_BIAS: Record<string, Partial<Record<PatternName, number>>> = {
  'CARROT MEADOW': { pit: 1.1, wallGap: 1.1 },
  'COTTON CANDY': { hop: 1.65, spikes: 1.25 },
  'BATHROOM ESCAPE': { rollers: 1.6, lowBeams: 1.45 },
  'SUNNY PARK': { slalom: 1.55, hurdles: 1.25 },
  'MOONLIGHT PICNIC': { lowBeams: 1.4, rollers: 1.3, spikes: 1.15 },
};

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

interface BiomeProp {
  obj: THREE.Group;
  base: number;
  theme: string;
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
  'floorA', 'floorB', 'floorSide', 'roadA', 'roadB', 'wall', 'wallEmis', 'panel', 'block', 'spike', 'platform',
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
    floorSide: c(t.side),
    roadA: c(t.road),
    roadB: c(t.road).multiplyScalar(0.91),
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
  private seedState: number | null = null;

  // shared geometry
  private boxGeo = new THREE.BoxGeometry(1, 1, 1);
  private edgeGeo = new THREE.EdgesGeometry(this.boxGeo);
  private blockStudGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.16, 12);
  private rollerCoreGeo = new THREE.SphereGeometry(0.34, 16, 12);
  private rollerSpikeGeo = new THREE.ConeGeometry(0.15, 0.25, 7);
  private stripSpikeGeo = new THREE.ConeGeometry(0.22, 0.72, 6);
  private ridgeGeo: THREE.ExtrudeGeometry;

  // 🥕 엽기토끼 맞춤 지오메트리 & 머티리얼 (당근, 두루마리 휴지, 미니 뚫어뻥)
  private carrotBodyGeo = new THREE.ConeGeometry(0.24, 0.72, 14);
  private carrotLeafGeo = new THREE.CapsuleGeometry(0.045, 0.22, 6, 8);

  // materials
  /** Floor tile: single material + vertex colours (was 6-material boxes + 2 strips = 8 drawcalls -> 1) */
  private matTile = new THREE.MeshStandardMaterial({ roughness: 0.85, vertexColors: true });
  private tileGeoA!: THREE.BufferGeometry;
  private tileGeoB!: THREE.BufferGeometry;
  private matWall = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.15 });
  private matPanel = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 });
  private matBlock = new THREE.MeshStandardMaterial({ roughness: 0.5 });
  private matSpike = new THREE.MeshStandardMaterial({ roughness: 0.4, flatShading: true });
  private matSpikeBase = new THREE.MeshStandardMaterial({ roughness: 0.72 });
  private matPlatform = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.2 });
  private matStrip = new THREE.MeshBasicMaterial();
  private matStripA = new THREE.MeshBasicMaterial();
  private matDepthGrid = new THREE.LineBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
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
  private lineWall = new THREE.LineBasicMaterial();
  private lineBlock = new THREE.LineBasicMaterial();
  private linePlat = new THREE.LineBasicMaterial();
  private lineBuilding = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.4 });
  private lineCube = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
  // ☀️ 카툰 배경용 머티리얼
  private matSun = new THREE.MeshBasicMaterial({ color: 0xffd166 });
  private matCloud = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, transparent: true, opacity: 0.95 });
  private matHillFar = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 1, flatShading: true });
  private matHillNear = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.9, flatShading: true });
  private matTrunk = new THREE.MeshStandardMaterial({ color: 0x825432, roughness: 0.9, flatShading: true });
  private matCanopy = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.82, flatShading: true });
  private matRoof = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.7, flatShading: true });
  private matPorcelain = new THREE.MeshStandardMaterial({ color: 0xf5fbff, roughness: 0.28 });
  private matBathroomWall = new THREE.MeshStandardMaterial({ color: 0xa8e4f1, roughness: 0.72 });
  private matMirrorFrame = new THREE.MeshStandardMaterial({ color: 0x0096c7, roughness: 0.36 });
  private matMirror = new THREE.MeshStandardMaterial({ color: 0xc9f3f5, metalness: 0.4, roughness: 0.24 });
  private matSoapBubble = new THREE.MeshBasicMaterial({ color: 0xb8f7ff, transparent: true, opacity: 0.42, depthWrite: false });
  private lineBathroom = new THREE.LineBasicMaterial({ color: 0x377993 });
  private toyBaseMats: THREE.MeshStandardMaterial[] = [];
  private toyTrimMats: THREE.MeshStandardMaterial[] = [];

  private tiles: THREE.Group[] = [];
  private tileWorldIndices = new Int32Array(POOL).fill(-2147483648);
  private depthGrid!: THREE.LineSegments;
  private gridStart = Number.NaN;
  private gridPitCount = 0;
  private sun!: THREE.Group;
  private clouds: { obj: THREE.Group; base: number; speed: number }[] = [];
  private hills: { obj: THREE.Group; base: number }[] = [];
  private trees: { obj: THREE.Group; base: number }[] = [];
  private toyBuildings: { obj: THREE.Group; base: number }[] = [];
  private bathroomProps: { obj: THREE.Group; base: number }[] = [];
  private biomeProps: BiomeProp[] = [];
  private moon!: THREE.Group;
  private warpRings: { mesh: THREE.Mesh; material: THREE.MeshBasicMaterial; rotSpeed: number; pulseSpeed: number; baseScale: number }[] = [];
  private starField!: THREE.Points;
  private orbFree: Orb[] = [];

  // palette state
  cur: Palette;
  private from: Palette;
  private to: Palette;
  private themeT = 1;
  private activeThemeName = 'CARROT MEADOW';
  private tmp = new THREE.Color();
  private readonly tileTintScratch = {
    stone: new THREE.Color('#d8cfc4'),
    clayDark: new THREE.Color(),
    clayLight: new THREE.Color(),
    whiteFlower: new THREE.Color('#ffffff'),
    yellowCenter: new THREE.Color('#facc15'),
    pinkFlower: new THREE.Color('#fb7185'),
    orangeFlower: new THREE.Color('#fb923c'),
  };
  paletteDirty = true;

  get themeName() {
    return this.activeThemeName;
  }

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

  setSeed(seed?: number) {
    this.seedState = seed !== undefined && Number.isFinite(seed) ? (Math.floor(seed) >>> 0) : null;
  }

  private random(): number {
    if (this.seedState === null) return Math.random();
    this.seedState = (1664525 * this.seedState + 1013904223) >>> 0;
    return this.seedState / 0x100000000;
  }

  private rnd(a: number, b: number) {
    return a + this.random() * (b - a);
  }

  // ---- theme ---------------------------------------------------------------

  setTheme(theme: Theme, instant = false) {
    this.activeThemeName = theme.name;
    // The authored scene art owns the horizon; hide the old one-size-fits-all skyline.
    this.sun.visible = false;
    this.moon.visible = false;
    this.starField.visible = false;
    for (const cloud of this.clouds) cloud.obj.visible = false;
    for (const hill of this.hills) hill.obj.visible = false;
    for (const tree of this.trees) tree.obj.visible = false;
    for (const building of this.toyBuildings) building.obj.visible = false;
    for (const prop of this.bathroomProps) prop.obj.visible = false;
    for (const prop of this.biomeProps) prop.obj.visible = prop.theme === theme.name;
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
    this.retintTiles(p.floorA, p.floorB, p.floorSide, p.roadA, p.roadB, p.accent);
    this.matWall.color.copy(p.wall);
    this.matWall.emissive.copy(p.wallEmis);
    this.matPanel.color.copy(p.panel);
    this.matPanel.emissive.copy(p.panel).multiplyScalar(0.45);
    this.matBlock.color.copy(p.block);
    this.matBlock.emissive.copy(p.block).multiplyScalar(0.45);
    this.matSpike.color.copy(p.spike);
    this.matSpike.emissive.copy(p.spike).multiplyScalar(0.5);
    this.matSpikeBase.color.copy(p.spike).multiplyScalar(0.55);
    this.matPlatform.color.copy(p.platform);
    this.matPlatform.emissive.copy(p.platform).multiplyScalar(0.45);
    this.matStrip.color.copy(p.accent2);
    this.matStripA.color.copy(p.accent);
    this.matBuilding.color.copy(p.building);
    this.matBuilding.emissive.copy(p.building).multiplyScalar(0.5);
    this.matOrb.color.copy(p.orb);
    this.matOrbGlow.color.copy(p.orb);
    this.lineWall.color.copy(p.wall).multiplyScalar(0.34);
    this.lineBlock.color.copy(t.copy(p.block).multiplyScalar(0.32));
    this.linePlat.color.copy(p.accent);
    this.lineBuilding.color.copy(p.accent2);
    this.lineCube.color.copy(p.cube);
    this.matDepthGrid.color.copy(p.accent2);
    this.matSun.color.copy(p.accent);
    this.matHillFar.color.copy(p.floorA).lerp(p.sky2, 0.52);
    this.matHillNear.color.copy(p.floorA).lerp(p.sky2, 0.15);
    this.matCanopy.color.copy(p.floorA).multiplyScalar(0.78);
    this.matTrunk.color.copy(p.floorSide).multiplyScalar(0.72);
    this.matCloud.color.copy(p.sky2).lerp(WHITE, 0.76);
    this.matRoof.color.copy(p.accent2).lerp(p.accent, 0.22);
    this.matMirrorFrame.color.copy(p.wall);
    this.matMirror.color.copy(p.sky2).lerp(WHITE, 0.35);
    this.matPorcelain.color.copy(p.sky2).lerp(p.wall, 0.2);
    this.matBathroomWall.color.copy(p.sky2).lerp(p.wall, 0.58);
    this.lineBathroom.color.copy(p.wall).multiplyScalar(0.55);
    for (let i = 0; i < this.warpRings.length; i++) {
      const ring = this.warpRings[i];
      ring.material.color.copy(p.accent).lerp(p.accent2, i * 0.18);
      ring.material.opacity = 0.2 - i * 0.025;
    }
    const night = this.activeThemeName === 'MOONLIGHT PICNIC';
    for (let i = 0; i < this.toyBaseMats.length; i++) {
      const base = this.toyBaseMats[i].color.setHex(TOY_COLORS[i]).lerp(p.wall, night ? 0.58 : 0.24);
      if (night) base.multiplyScalar(0.7);
      this.toyTrimMats[i].color.copy(base).multiplyScalar(0.68);
    }
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
    const parts: { geo: THREE.BufferGeometry; role: number; isTopGrass?: boolean }[] = [];
    
    // 1. 메인 베이스 블록 (흙 단면)
    const baseBox = new THREE.BoxGeometry(TILE, 6, FLOOR_HALF * 2);
    baseBox.translate(0, -3, 0);
    parts.push({ geo: baseBox, role: 0, isTopGrass: true });

    // 2. 중앙 질주 런웨이 (따뜻한 흙길 패스, 폭 5.8)
    const road = new THREE.BoxGeometry(TILE, 0.06, 5.8);
    road.translate(0, 0.03, 0);
    parts.push({ geo: road, role: 3 });

    // 3. 양옆 레인 마커선 (또렷한 스트립, Z: -2.9, 2.9)
    for (const zs of [-1, 1]) {
      const s = new THREE.BoxGeometry(TILE, 0.08, 0.22);
      s.translate(0, 0.04, zs * 2.9);
      parts.push({ geo: s, role: 1 });
    }

    // 4. 양옆 싱그러운 잔디 갓길 (Z: -4.5, 4.5)
    for (const zs of [-1, 1]) {
      const grass = new THREE.BoxGeometry(TILE, 0.07, 2.6);
      grass.translate(0, 0.035, zs * 4.4);
      parts.push({ geo: grass, role: 2 });
    }

    // 5. [제거됨] 절벽 잔디 드리움 톱니 (시인성 확보 및 가시 오인 방지)

    // 6. 절벽 흙 속 돌멩이 (Cliff Pebbles)
    const pebble1 = new THREE.BoxGeometry(0.28, 0.20, 0.14);
    pebble1.translate(-0.35, -1.2, FLOOR_HALF - 0.02);
    const pebble2 = new THREE.BoxGeometry(0.35, 0.24, 0.14);
    pebble2.translate(0.42, -2.1, FLOOR_HALF - 0.02);
    parts.push({ geo: pebble1, role: 4 }, { geo: pebble2, role: 4 });

    // Thin clay layers break up the large exposed face without adding draw calls.
    for (const [depth, thickness, role] of [
      [-0.72, 0.11, 9],
      [-1.75, 0.17, 10],
      [-3.18, 0.10, 9],
      [-4.65, 0.2, 10],
    ] as const) {
      const seam = new THREE.BoxGeometry(TILE, thickness, 0.035);
      seam.translate(0, depth, FLOOR_HALF + 0.022);
      parts.push({ geo: seam, role });
    }

    // 7. 트랙 양옆 잔디 갓길의 풍성한 들꽃 군락 (썸네일과 동일한 야생 데이지 & 튤립 화단)
    const flowerPatterns = [
      { x: -0.6, z: 3.9, rPetal: 5, rCenter: 6, size: 0.26 }, // 대형 흰색 데이지
      { x: 0.5, z: 4.6, rPetal: 7, rCenter: 6, size: 0.28 },  // 핑크 튤립
      { x: -0.2, z: 5.2, rPetal: 8, rCenter: 6, size: 0.24 },  // 오렌지 꽃
      { x: -0.5, z: -4.0, rPetal: 7, rCenter: 6, size: 0.27 }, // 핑크 튤립
      { x: 0.4, z: -4.7, rPetal: 5, rCenter: 6, size: 0.26 },  // 흰색 데이지
      { x: -0.1, z: -5.3, rPetal: 8, rCenter: 6, size: 0.25 }, // 오렌지 꽃
    ];
    for (const fp of flowerPatterns) {
      // 넓고 큼직한 꽃잎
      const petal = new THREE.CylinderGeometry(fp.size, fp.size * 0.85, 0.05, 6);
      petal.translate(fp.x, 0.08, fp.z);
      parts.push({ geo: petal, role: fp.rPetal });
      // 중앙 앙증맞은 수술
      const center = new THREE.SphereGeometry(fp.size * 0.38, 8, 6);
      center.translate(fp.x, 0.11, fp.z);
      parts.push({ geo: center, role: fp.rCenter });
    }

    let vTotal = 0;
    let iTotal = 0;
    for (const item of parts) {
      vTotal += item.geo.attributes.position.count;
      iTotal += item.geo.index ? item.geo.index.count : 0;
    }

    const pos = new Float32Array(vTotal * 3);
    const nor = new Float32Array(vTotal * 3);
    const col = new Float32Array(vTotal * 3);
    const roles = new Uint8Array(vTotal);
    const idx = new Uint32Array(iTotal);

    let vo = 0;
    let io = 0;
    for (let partIdx = 0; partIdx < parts.length; partIdx++) {
      const item = parts[partIdx];
      const g = item.geo;
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

      for (let i = 0; i < p.count; i++) {
        let role = item.role;
        if (item.isTopGrass) {
          role = n.getY(i) > 0.5 ? 2 : 0;
        }
        roles[vo + i] = role;
        col[(vo + i) * 3] = role;
        col[(vo + i) * 3 + 1] = role;
        col[(vo + i) * 3 + 2] = role;
      }
      vo += p.count;
      io += gi.count;
      g.dispose();
    }
    void checker;

    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    out.setAttribute('color', new THREE.BufferAttribute(col, 3));
    out.setIndex(new THREE.BufferAttribute(idx, 1));
    out.userData.roles = roles;
    out.computeBoundingSphere();
    return out;
  }

  /** Recompute vertex colours from the palette on theme change */
  private retintTiles(floorA: THREE.Color, floorB: THREE.Color, side: THREE.Color, roadA: THREE.Color, roadB: THREE.Color, accent: THREE.Color) {
    const { stone, clayDark, clayLight, whiteFlower, yellowCenter, pinkFlower, orangeFlower } = this.tileTintScratch;
    clayDark.copy(side).multiplyScalar(0.62);
    clayLight.copy(side).lerp(accent, 0.22);

    for (let pIdx = 0; pIdx < 2; pIdx++) {
      const geo = pIdx === 0 ? this.tileGeoA : this.tileGeoB;
      const grassColor = pIdx === 0 ? floorA : floorB;
      const activeRoad = pIdx === 0 ? roadA : roadB;
      const attr = geo.getAttribute('color') as THREE.BufferAttribute;
      const roles = geo.userData.roles as Uint8Array;
      for (let i = 0; i < attr.count; i++) {
        const role = roles[i];
        let c = side;
        if (role === 1) c = accent; // 선명한 차선 마커
        else if (role === 2) c = grassColor; // 싱그러운 잔디
        else if (role === 3) c = activeRoad; // 흙길 런웨이
        else if (role === 4) c = stone; // 절벽 돌멩이
        else if (role === 5) c = whiteFlower; // 하얀 데이지
        else if (role === 6) c = yellowCenter; // 노란 꽃술
        else if (role === 7) c = pinkFlower; // 핑크 튤립
        else if (role === 8) c = orangeFlower; // 주황 야생화
        else if (role === 9) c = clayDark;
        else if (role === 10) c = clayLight;
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

    // One shared draw call; floor-only segments leave real pits visually open.
    const gridGeo = new THREE.BufferGeometry();
    const gridPositions = new THREE.BufferAttribute(new Float32Array(POOL * 5 * 2 * 3), 3);
    gridPositions.setUsage(THREE.DynamicDrawUsage);
    gridGeo.setAttribute('position', gridPositions);
    gridGeo.setDrawRange(0, 0);
    this.depthGrid = new THREE.LineSegments(gridGeo, this.matDepthGrid);
    this.depthGrid.visible = false;
    this.root.add(this.depthGrid);
  }

  private buildBackdrop() {
    const sphereGeo = new THREE.IcosahedronGeometry(1, 1);

    // A clean, layered sun mark keeps the sky playful without competing with the runner.
    const sunGroup = new THREE.Group();
    const sunMesh = new THREE.Mesh(new THREE.CircleGeometry(3.6, 32), this.matSun);
    sunGroup.add(sunMesh);
    const sunHalo = new THREE.Mesh(
      new THREE.TorusGeometry(4.15, 0.12, 7, 48),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.58 }),
    );
    sunHalo.position.z = -0.02;
    sunGroup.add(sunHalo);
    for (let i = 0; i < 8; i++) {
      const ray = new THREE.Mesh(this.boxGeo, this.matSun);
      const angle = (i * Math.PI * 2) / 8;
      ray.scale.set(0.11, 0.64, 0.08);
      ray.position.set(Math.cos(angle) * 4.95, Math.sin(angle) * 4.95, -0.04);
      ray.rotation.z = angle;
      sunGroup.add(ray);
    }

    sunGroup.position.set(0, 24, -65);
    this.root.add(sunGroup);
    this.sun = sunGroup;

    // Cut-out crescent geometry lets the active sky colour show through the moon.
    const crescentShape = new THREE.Shape();
    crescentShape.absarc(0, 0, 3.55, 0, Math.PI * 2, false);
    const crescentCutout = new THREE.Path();
    crescentCutout.absarc(1.3, 0.2, 3.22, 0, Math.PI * 2, true);
    crescentShape.holes.push(crescentCutout);
    const moonGroup = new THREE.Group();
    const moon = new THREE.Mesh(new THREE.ShapeGeometry(crescentShape, 28), this.matSun);
    moon.material = new THREE.MeshBasicMaterial({ color: 0xdce8ff, side: THREE.DoubleSide });
    moonGroup.add(moon);
    moonGroup.position.set(0, 24, -65);
    moonGroup.visible = false;
    this.root.add(moonGroup);
    this.moon = moonGroup;

    // 2. ☁️ 둥실둥실 솜사탕 구름 (Fluffy Clouds)
    for (let i = 0; i < CLOUD_N; i++) {
      const cg = new THREE.Group();
      const parts = 2 + Math.floor(this.random() * 2);
      for (let p = 0; p < parts; p++) {
        const m = new THREE.Mesh(sphereGeo, this.matCloud);
        const r = this.rnd(1.4, 2.8);
        m.scale.set(r, r * 0.75, r * 0.6);
        m.position.set((p - parts / 2) * 1.8, this.rnd(-0.3, 0.4), this.rnd(-0.2, 0.2));
        cg.add(m);
      }
      cg.position.set(0, this.rnd(14, 26), -this.rnd(45, 75));
      this.root.add(cg);
      this.clouds.push({ obj: cg, base: (i / CLOUD_N) * CLOUD_SPAN, speed: this.rnd(0.8, 1.6) });
    }

    // 3. 🏔️ 겹겹이 중첩된 완만한 카툰 산맥 (Rolling Hills)
    for (let i = 0; i < HILL_N; i++) {
      const hg = new THREE.Group();
      const isFar = i % 2 === 0;
      const mat = isFar ? this.matHillFar : this.matHillNear;
      const radius = isFar ? this.rnd(16, 26) : this.rnd(9, 16);
      const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 1.2, 1), mat);
      hill.position.y = -radius * 0.45;
      hill.scale.set(1.6, 0.75, 1.2);
      hg.add(hill);
      hg.position.set(0, 0, isFar ? -this.rnd(55, 80) : -this.rnd(32, 48));
      this.root.add(hg);
      this.hills.push({ obj: hg, base: (i / HILL_N) * HILL_SPAN });
    }

    // 4. Faceted canopy trees for the garden and park biomes.
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

      // 트랙 뒤쪽(음수 Z)에 배치하여 플레이어 토끼를 절대 가리지 않는 아름다운 배경 나무
      const zSide = -this.rnd(8, 22);
      tg.position.set(0, 0, zSide);
      const sc = this.rnd(0.85, 1.35);
      tg.scale.set(sc, sc, sc);
      this.root.add(tg);
            this.trees.push({ obj: tg, base: (i / TREE_N) * TREE_SPAN });
    }

    // 5. 🏙️ 썸네일 싱크로율 100% 알록달록 토이 시티 블록 타워들 (Toy City Towers)
    const blockMats = TOY_COLORS.map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.62 }));
    const trimMats = TOY_COLORS.map((color) => new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.68), roughness: 0.58,
    }));
    this.toyBaseMats = blockMats;
    this.toyTrimMats = trimMats;
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });

    for (let i = 0; i < TOY_CITY_N; i++) {
      const tg = new THREE.Group();
      // A consistent body colour gives each toy tower a readable silhouette.
      const stories = 2 + Math.floor(this.random() * 2);
      const bWidth = this.rnd(3.2, 5.2);
      const bDepth = this.rnd(3.2, 4.8);
      const colourIndex = i % TOY_COLORS.length;
      let curY = 0;

      for (let s = 0; s < stories; s++) {
        const floorH = this.rnd(1.8, 2.5);
        const block = new THREE.Mesh(this.boxGeo, s === 1 ? trimMats[colourIndex] : blockMats[colourIndex]);
        block.scale.set(bWidth * (1 - s * 0.06), floorH, bDepth * (1 - s * 0.06));
        block.position.y = curY + floorH / 2;
        tg.add(block);

        // 노란빛 따뜻한 창문들
        for (const wx of [-0.26, 0.26]) {
          const win = new THREE.Mesh(this.boxGeo, windowMat);
          win.scale.set(0.55, 0.65, 0.12);
          win.position.set(wx * bWidth, curY + floorH * 0.52, (bDepth * (1 - s * 0.06)) / 2 + 0.08);
          tg.add(win);
        }

        curY += floorH;
      }

      // 꼭대기 뾰족한 레드 피라미드 지붕
      if (this.random() < 0.8) {
        const roof = new THREE.Mesh(new THREE.ConeGeometry(bWidth * 0.52, 2.8, 4), this.matRoof);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = curY + 1.4;
        tg.add(roof);
      }

      // 썸네일처럼 Z: -16 ~ -36(구릉 앞쪽/중간)에 배치하여 2D에서도 언덕 위로 선명하게 돌출
      const zPos = -this.rnd(14, 28);
      tg.position.set(0, -0.5, zPos);
      this.root.add(tg);
      this.toyBuildings.push({ obj: tg, base: (i / TOY_CITY_N) * TOY_CITY_SPAN });
    }

    // Bathroom Escape replaces the outdoor props with toy sinks and mirrors.
    const faucetGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.75, 10);
    const bubbleGeo = new THREE.SphereGeometry(1, 12, 8);
    const tileLinePositions: number[] = [];
    for (let x = -1.36; x <= 1.37; x += 0.68) {
      tileLinePositions.push(x, 0, -0.62, x, 8.2, -0.62);
    }
    for (let y = 0; y <= 8.21; y += 1.36) {
      tileLinePositions.push(-2.05, y, -0.62, 2.05, y, -0.62);
    }
    const tileLineGeo = new THREE.BufferGeometry();
    tileLineGeo.setAttribute('position', new THREE.Float32BufferAttribute(tileLinePositions, 3));
    for (let i = 0; i < BATHROOM_PROP_N; i++) {
      const prop = new THREE.Group();
      const wall = new THREE.Mesh(this.boxGeo, this.matBathroomWall);
      wall.scale.set(4.1, 8.2, 0.32);
      wall.position.set(0, 4.1, -0.8);
      prop.add(wall);
      const wallEdge = new THREE.LineSegments(this.edgeGeo, this.lineBathroom);
      wallEdge.scale.copy(wall.scale);
      wallEdge.position.copy(wall.position);
      prop.add(wallEdge);
      prop.add(new THREE.LineSegments(tileLineGeo, this.lineBathroom));
      for (const seamY of [2.6, 5.3]) {
        const seam = new THREE.Mesh(this.boxGeo, this.matMirrorFrame);
        seam.scale.set(4.12, 0.07, 0.34);
        seam.position.set(0, seamY, -0.61);
        prop.add(seam);
      }
      const frame = new THREE.Mesh(this.boxGeo, this.matMirrorFrame);
      frame.scale.set(2.7, 3.4, 0.3);
      frame.position.set(0, 6.1, -0.45);
      const glass = new THREE.Mesh(this.boxGeo, this.matMirror);
      glass.scale.set(2.3, 3, 0.09);
      glass.position.set(0, 6.1, -0.25);
      const basin = new THREE.Mesh(this.boxGeo, this.matPorcelain);
      basin.scale.set(3.2, 0.55, 1.65);
      basin.position.y = 2.6;
      const pedestal = new THREE.Mesh(this.boxGeo, this.matPorcelain);
      pedestal.scale.set(0.7, 2.3, 0.72);
      pedestal.position.y = 1.15;
      const basinEdge = new THREE.LineSegments(this.edgeGeo, this.lineBathroom);
      basinEdge.scale.copy(basin.scale);
      basinEdge.position.copy(basin.position);
      const pedestalEdge = new THREE.LineSegments(this.edgeGeo, this.lineBathroom);
      pedestalEdge.scale.copy(pedestal.scale);
      pedestalEdge.position.copy(pedestal.position);
      const faucet = new THREE.Mesh(faucetGeo, this.matMirrorFrame);
      faucet.position.set(0, 3.22, -0.3);
      const spout = new THREE.Mesh(faucetGeo, this.matMirrorFrame);
      spout.rotation.z = Math.PI / 2;
      spout.position.set(0.27, 3.55, -0.3);
      prop.add(frame, glass, basin, basinEdge, pedestal, pedestalEdge, faucet, spout);
      for (let b = 0; b < 2; b++) {
        const bubble = new THREE.Mesh(bubbleGeo, this.matSoapBubble);
        const s = 0.35 + b * 0.19;
        bubble.scale.setScalar(s);
        bubble.position.set((b === 0 ? -1 : 1) * 1.8, 5.6 + b * 1.8, 0.4);
        prop.add(bubble);
      }
      prop.position.set(0, -0.5, -this.rnd(15, 24));
      prop.visible = false;
      this.root.add(prop);
      this.bathroomProps.push({ obj: prop, base: (i / BATHROOM_PROP_N) * BATHROOM_PROP_SPAN });
    }

    // 6. Subtle, theme-tinted rift arcs sit behind the playable lane.
    const ringGeo = new THREE.TorusGeometry(10.5, 0.34, 8, 36);
    for (let i = 0; i < 3; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set((i - 1) * 35, 25 + i * 4, -100 - i * 15);
      ringMesh.rotation.x = Math.PI * 0.15;
      ringMesh.rotation.y = (i * Math.PI) / 3;
      this.root.add(ringMesh);
      this.warpRings.push({
        mesh: ringMesh,
        material: ringMat,
        rotSpeed: 0.18 + i * 0.08,
        pulseSpeed: 1.5 + i * 0.4,
        baseScale: 0.72 + i * 0.18,
      });
    }

    // 7. ✨ 반짝이는 차원 성운 별무리 (Star / Sparkle Field)
    const starCount = 140;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (this.random() - 0.5) * 320;
      starPos[i * 3 + 1] = 8 + this.random() * 55;
      starPos[i * 3 + 2] = -50 - this.random() * 85;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
    this.starField = new THREE.Points(starGeo, starMat);
    this.root.add(this.starField);
    this.buildBiomeProps();
  }

  private buildBiomeProps() {
    const sphere = new THREE.IcosahedronGeometry(1, 1);
    const cone = new THREE.ConeGeometry(1, 1, 7, 1);
    const post = new THREE.CylinderGeometry(0.11, 0.16, 1, 7);
    const candyDisc = new THREE.CylinderGeometry(0.78, 0.78, 0.3, 10);
    const candyRing = new THREE.TorusGeometry(0.62, 0.075, 6, 18);
    const archGeo = new THREE.TorusGeometry(1.8, 0.24, 7, 20, Math.PI);
    const lanternGlow = new THREE.IcosahedronGeometry(0.3, 1);

    const add = (
      group: THREE.Group,
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      x: number,
      y: number,
      z: number,
      sx = 1,
      sy = 1,
      sz = 1,
      rotationZ = 0,
    ) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.rotation.z = rotationZ;
      group.add(mesh);
      return mesh;
    };

    const prop = (
      theme: string,
      index: number,
      count: number,
      z: number,
      build: (group: THREE.Group) => void,
      baseOffset = 0,
    ) => {
      const group = new THREE.Group();
      group.position.set(0, -0.32, z);
      group.visible = theme === this.activeThemeName;
      build(group);
      this.root.add(group);
      this.biomeProps.push({ obj: group, base: (index / count) * BIOME_PROP_SPAN + baseOffset, theme });
    };

    // Carrot Meadow: crop beds and small farm landmarks replace the generic skyline.
    for (let i = 0; i < 3; i++) {
      prop('CARROT MEADOW', i, 3, -17, (group) => {
        add(group, this.boxGeo, this.matTrunk, 0, 0, 0, 5.4, 0.34, 1.9);
        add(group, this.boxGeo, this.matCanopy, 0, 0.2, 0, 5.2, 0.11, 1.7);
        for (const x of [-1.45, 0, 1.45]) {
          add(group, this.carrotBodyGeo, this.matOrb, x, 0.68, 0, 0.72, 0.82, 0.72, Math.PI);
          add(group, this.carrotLeafGeo, this.matLeaf, x - 0.1, 1.15, 0, 1, 1.5, 1, -0.32);
          add(group, this.carrotLeafGeo, this.matLeaf, x + 0.12, 1.15, 0, 1, 1.25, 1, 0.3);
        }
      });
    }
    for (let i = 0; i < 2; i++) {
      prop('CARROT MEADOW', i, 2, -18, (group) => {
        add(group, post, this.matTrunk, 0, 2.35, 0, 1, 5.1, 1);
        add(group, sphere, this.matRoof, 0, 4.9, 0, 0.28, 0.28, 0.28);
        for (let blade = 0; blade < 4; blade++) {
          const angle = blade * Math.PI / 2;
          add(group, this.boxGeo, this.matRoof, Math.cos(angle) * 0.92, 4.9 + Math.sin(angle) * 0.92, 0, 0.28, 1.9, 0.12, angle);
        }
      });
    }
    prop('CARROT MEADOW', 0, 1, -18, (group) => {
      add(group, this.boxGeo, this.matCanopy, 0, 1.05, 0, 6.2, 2.1, 2.6);
      add(group, cone, this.matRoof, 0, 2.9, 0, 3.7, 2.0, 1.8);
      for (const x of [-1.55, 0, 1.55]) add(group, this.boxGeo, this.matMirror, x, 1.25, 1.34, 1.1, 1.15, 0.07);
    });

    // Cotton Candy: faceted sweets, floating gumdrops, and open candy arches.
    for (let i = 0; i < 6; i++) {
      prop('COTTON CANDY', i, 6, -17, (group) => {
        add(group, post, this.matTrunk, 0, 1.35, 0, 0.62, 3.0, 0.62);
        add(group, candyDisc, this.matRoof, 0, 3.15, 0, 1.0, 0.8, 1.0);
        add(group, candyRing, this.matPanel, 0, 3.18, 0.16, 1, 1, 1);
      }, BIOME_PROP_SPAN / 12);
    }
    for (let i = 0; i < 4; i++) {
      prop('COTTON CANDY', i, 4, -18, (group) => {
        for (let puff = 0; puff < 3; puff++) {
          add(group, sphere, this.matCloud, (puff - 1) * 1.2, 1.6 + (puff === 1 ? 0.45 : 0), 0, 1.15, 1.35, 1.05);
        }
        add(group, cone, this.matRoof, 0, 3.05, 0, 1.1, 1.45, 1.1);
      }, BIOME_PROP_SPAN * 0.125);
    }
    for (let i = 0; i < 2; i++) {
      prop('COTTON CANDY', i, 2, -18, (group) => {
        const arch = add(group, archGeo, this.matPanel, 0, 3.3, 0, 1, 1, 1);
        arch.rotation.x = Math.PI / 2;
        add(group, post, this.matRoof, -1.8, 1.7, 0, 1, 3.2, 1);
        add(group, post, this.matRoof, 1.8, 1.7, 0, 1, 3.2, 1);
      });
    }

    // Sunny Park: furniture and lamps give the zone a human-scale park silhouette.
    for (let i = 0; i < 4; i++) {
      prop('SUNNY PARK', i, 4, -17, (group) => {
        add(group, this.boxGeo, this.matTrunk, 0, 0.82, 0, 2.5, 0.2, 0.72);
        add(group, this.boxGeo, this.matTrunk, 0, 1.55, -0.26, 2.5, 0.2, 0.18);
        for (const x of [-0.95, 0.95]) add(group, post, this.matBuilding, x, 0.38, 0, 0.7, 0.9, 0.7);
      });
    }
    for (let i = 0; i < 3; i++) {
      prop('SUNNY PARK', i, 3, -17, (group) => {
        add(group, post, this.matBuilding, 0, 2.25, 0, 0.58, 4.8, 0.58);
        add(group, this.boxGeo, this.matTrunk, 0, 4.7, 0, 1.2, 0.16, 0.62);
        add(group, sphere, this.matOrbGlow, 0, 4.35, 0, 0.36, 0.4, 0.36);
      });
    }
    for (let i = 0; i < 4; i++) {
      prop('SUNNY PARK', i, 4, -17, (group) => {
        add(group, this.boxGeo, this.matTrunk, 0, 0.12, 0, 3.8, 0.28, 1.35);
        for (const x of [-1.25, 0, 1.25]) add(group, sphere, this.matRoof, x, 0.55, 0, 0.22, 0.3, 0.22);
      });
    }

    // Moonlight Picnic: layered pines, warm lanterns, and quiet campsite silhouettes.
    for (let i = 0; i < 6; i++) {
      prop('MOONLIGHT PICNIC', i, 6, -17, (group) => {
        add(group, post, this.matTrunk, 0, 0.75, 0, 0.8, 1.6, 0.8);
        add(group, cone, this.matCanopy, 0, 1.45, 0, 1.7, 2.5, 1.7);
        add(group, cone, this.matHillFar, 0, 2.55, 0, 1.25, 2.1, 1.25);
        add(group, cone, this.matCanopy, 0, 3.45, 0, 0.8, 1.7, 0.8);
      });
    }
    for (let i = 0; i < 4; i++) {
      prop('MOONLIGHT PICNIC', i, 4, -17, (group) => {
        add(group, post, this.matBuilding, 0, 1.3, 0, 0.38, 2.8, 0.38);
        add(group, this.boxGeo, this.matRoof, 0, 2.65, 0, 0.95, 0.15, 0.75);
        add(group, lanternGlow, this.matOrbGlow, 0, 2.25, 0, 1.1, 1.1, 1.1);
      });
    }
    for (let i = 0; i < 2; i++) {
      prop('MOONLIGHT PICNIC', i, 2, -17, (group) => {
        add(group, this.boxGeo, this.matPanel, 0, 0.16, 0, 3.8, 0.12, 2.4);
        add(group, this.boxGeo, this.matTrunk, 0, 1.0, 0, 1.5, 0.18, 0.75);
        for (const x of [-0.55, 0.55]) add(group, post, this.matBuilding, x, 0.55, 0, 0.5, 0.9, 0.5);
      });
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
    this.addHint(
      0,
      32,
      'dimensionPrimer',
      'Try a dimension shift: press SPACE to enter 3D, steer with ▲ / W or ▼ / S, then press SPACE to return.',
      '🌀',
    );
    this.pitTiles.clear();
    this.gridStart = Number.NaN;
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
      const tileSlot = mod(j, POOL);
      const tile = this.tiles[tileSlot];
      if (this.tileWorldIndices[tileSlot] !== j) {
        tile.position.x = j * TILE + TILE / 2;
        this.tileWorldIndices[tileSlot] = j;
      }
      const vis = j >= FLOOR_MIN && !this.pitTiles.has(j);
      if (tile.visible !== vis) tile.visible = vis;
    }
    if (this.gridStart !== j0 || this.gridPitCount !== this.pitTiles.size) {
      const gridAttr = this.depthGrid.geometry.getAttribute('position') as THREE.BufferAttribute;
      let vertex = 0;
      for (let j = j0; j < j0 + POOL; j++) {
        if (j < FLOOR_MIN || this.pitTiles.has(j)) continue;
        const x = j * TILE;
        gridAttr.setXYZ(vertex++, x + TILE / 2, 0.095, -4.8);
        gridAttr.setXYZ(vertex++, x + TILE / 2, 0.095, 4.8);
        for (const z of [-4, -2, 2, 4]) {
          gridAttr.setXYZ(vertex++, x, 0.095, z);
          gridAttr.setXYZ(vertex++, x + TILE, 0.095, z);
        }
      }
      this.depthGrid.geometry.setDrawRange(0, vertex);
      this.depthGrid.geometry.computeBoundingSphere();
      gridAttr.needsUpdate = true;
      this.gridStart = j0;
      this.gridPitCount = this.pitTiles.size;
    }
    this.depthGrid.visible = e > 0.03;
    this.matDepthGrid.opacity = e * 0.28;

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
    if (this.sun?.visible) {
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
    if (this.activeThemeName === 'BATHROOM ESCAPE') {
      for (const prop of this.bathroomProps) {
        prop.obj.position.x = camX + mod(prop.base - camX * 0.64, BATHROOM_PROP_SPAN) - BATHROOM_PROP_SPAN / 2;
      }
    } else {
      for (const tr of this.trees) {
        tr.obj.position.x = camX + mod(tr.base - camX * 0.95, TREE_SPAN) - TREE_SPAN / 2;
      }
      for (const b of this.toyBuildings) {
        b.obj.position.x = camX + mod(b.base - camX * 0.58, TOY_CITY_SPAN) - TOY_CITY_SPAN / 2;
      }
    }

    for (const prop of this.biomeProps) {
      prop.obj.position.x = camX + mod(prop.base - camX * 0.68, BIOME_PROP_SPAN) - BIOME_PROP_SPAN / 2;
    }

    // 🌀 차원 관문 링 & 성운 별무리 회전/패럴랙스
    for (let i = 0; i < this.warpRings.length; i++) {
      const r = this.warpRings[i];
      r.mesh.rotation.z += dt * r.rotSpeed;
      r.mesh.position.x = camX * 0.92 + (i - 1) * 38;
      const s = r.baseScale * (1 + Math.sin(t * r.pulseSpeed) * 0.04);
      r.mesh.scale.set(s, s, s);
      r.material.opacity = (0.02 + e * 0.105) * (1 - i * 0.08);
    }
    if (this.starField) {
      this.starField.position.x = camX * 0.96;
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
      const gap = 17 + speed * 0.85 + this.random() * 6;
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
    if (this.sinceVault >= 5 && (this.random() < 0.4 || this.sinceVault >= 8)) {
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
    const bias = THEME_PATTERN_BIAS[this.activeThemeName] ?? {};
    const pool = table
      .map(([name, weight]) => [name, weight * (bias[name] ?? 1)] as [PatternName, number])
      .filter(([name, weight]) => weight > 0 && name !== this.lastPattern);
    const total = pool.reduce((a, [, w]) => a + w, 0);
    let r = this.random() * total;
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
    const count = 2 + Math.floor(this.random() * 2);
    const gap = Math.max(7.5, speed * 0.85);
    const beamH = PLAYER_H_REF * 0.78; // lower than a standing head (1.62)
    for (let i = 0; i < count; i++) {
      const bx = x0 + i * gap;
      const w = 3.4 + this.random() * 1.6;
      this.addObstacle('beam', bx, bx + w, beamH, 9.5, -TRACK_Z, TRACK_Z);
      this.addDecorOrbs(bx + w / 2);
      const beamKey = `duck${i + 1}`;
      this.addHint(bx - 14, bx, beamKey, 'Beam ahead: press DOWN to slide under.', '⬇');
      this.addHint(bx, bx + w + 0.5, `${beamKey}Hold`, 'Keep holding DOWN until the beam is behind you.', '⬇');
    }
    return x0 + (count - 1) * gap + 4.5;
  }

  // ---- pattern builders --------------------------------------------------------

  /** Giant wall with a walkable gap on one side. 2D: blocked. 3D: walk around. */
  private pWallGap(x0: number): number {
    const side = this.random() < 0.5 ? -1 : 1;
    const edge = 0.6 + this.random() * 0.8;
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
    const direction = side > 0 ? 'Down' : 'Up';
    this.addHint(
      x0 - 30,
      x0,
      `wall${direction}`,
      `Giant wall ahead: shift to 3D, then steer ${direction.toUpperCase()} through the open side.`,
      String.fromCodePoint(0x1f9f1),
    );
    return x0 + len;
  }

  /** Three staggered giant walls. Stay in 3D and weave. */
  private pSlalom(x0: number): number {
    let s = this.random() < 0.5 ? -1 : 1;
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
      const direction = s > 0 ? 'Down' : 'Up';
      const key = `slalom${direction}${i + 1}`;
      const action = s > 0 ? 'DOWN' : 'UP';
      this.addHint(
        x - 30,
        x,
        key,
        `${i === 0 ? 'Slalom!' : 'Next gap:'} stay in 3D and move ${action}.`,
        '🌀',
      );
      prevZ = gc;
      s = -s;
    }
    return x0 + 2 * spacing + len;
  }

  /** A pit spanning every depth. 2D only: jump. */
  private pPit(x0: number, speed: number): number {
    const w = speed < 12.5 ? 4 : speed < 15 ? 6 : this.random() < 0.5 ? 6 : 8;
    this.addPit(x0, x0 + w);
    // 점프를 유도하는 환상적인 포물선 당근 트레일 7개!
    this.addCarrotTrail(x0 - 2, w + 4, 1, 3.2, 0, 7);
    this.addHint(x0 - 30, x0, 'pit', 'Bottomless pit! Stay in 2D and jump with ▲ / W.', '🕳️');
    return x0 + w;
  }

  /** Low blocks: jump in 2D or sidestep in 3D. */
  private pHurdles(x0: number, speed: number): number {
    const spacing = 8 + speed * 0.2;
    let side = this.random() < 0.5 ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * spacing;
      const direction = side > 0 ? 'Down' : 'Up';
      if (side > 0) this.addObstacle('block', x, x + 1.4, 0, 1.3, -TRACK_Z, 0.9);
      else this.addObstacle('block', x, x + 1.4, 0, 1.3, -0.9, TRACK_Z);
      // 블록 위를 뛰어넘는 아치형 당근 4개 + 우회 레인 당근 4개
      this.addCarrotTrail(x - 1, 3.4, 1.3, 3.0, side > 0 ? -2 : 2, 4);
      this.addCarrotTrail(x - 0.5, 2.5, 0.9, 0.9, side * 2.9, 3);
      this.addHint(
        x - 30,
        x,
        `hurdle${direction}${i + 1}`,
        `${i === 0 ? 'Low block ahead' : 'Next low block'}: jump in 2D or move ${direction.toUpperCase()} in 3D.`,
        '🟧',
      );
      side = -side;
    }
    return x0 + 2 * spacing + 1.4;
  }

  /** Full-depth spike strips. 2D only: jump. */
  private pSpikes(x0: number): number {
    const len = 3.2;
    for (let i = 0; i < 2; i++) {
      const x = x0 + i * 10;
      this.addObstacle('spike', x, x + len, 0, 0.95, -TRACK_Z, TRACK_Z, true);
      this.addCarrotTrail(x - 0.5, len + 1, 1.2, 3.3, 0, 5);
      this.addHint(x - 30, x, `spike${i + 1}`, i === 0 ? 'Full-width spikes ahead: stay in 2D and prepare to jump.' : 'Second spike strip: stay in 2D and jump again.', '⚠️');
    }
    return x0 + 10 + len;
  }

  /** Spike balls sweep through the depth. 2D: jump. 3D: time the sweep. */
  private pRollers(x0: number): number {
    for (let i = 0; i < 3; i++) {
      const x = x0 + i * 10;
      const o = this.addObstacle('roller', x - 0.6, x + 0.6, 0.05, 1.3, -0.6, 0.6, true);
      o.motion = { baseZ: 0, amp: 3.3, speed: this.rnd(1.6, 2.4), phase: this.rnd(0, 6.28), half: 0.6 };
      this.addCarrotTrail(x + 1.5, 5, 1, 2.5, 0, 4);
      this.addHint(x - 30, x, `roller${i + 1}`, i === 0 ? 'Moving spike balls: jump in 2D or steer around them in 3D.' : 'Next spike ball: jump in 2D or steer around its sweep in 3D.', '🔴');
    }
    return x0 + 20 + 0.6;
  }

  /** Broken bridge with two pillars. 2D only: hop across. */
  private pHop(x0: number): number {
    this.addPit(x0, x0 + 14);
    this.addObstacle('platform', x0 + 3.5, x0 + 8, -6, 1.5, -TRACK_Z - 0.6, TRACK_Z + 0.6);
    this.addObstacle('platform', x0 + 10, x0 + 14, -6, 1.5, -TRACK_Z - 0.6, TRACK_Z + 0.6);
    // 공중 플랫폼을 딛고 뛰는 대형 점프 당근 아치 8개
    this.addCarrotTrail(x0 + 1, 12, 1.5, 4.3, 0, 8);
    this.addHint(x0 - 30, x0, 'hop1', 'Broken bridge! Jump to the first pillar, then jump again.', '🌉');
    this.addHint(x0 + 3.5, x0 + 8, 'hop2', 'Land on the first pillar and prepare the next jump.', '↗️');
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
      x0,
      'vault',
      'A light beam leaks from behind that wall. Shift to 3D and steer UP before you reach it to enter the hidden lane.',
      '✨',
    );
    this.addHint(
      x0 + 1,
      x0 + L - 0.3,
      'vaultGate',
      'Stay in 3D and keep steering UP to reach the hidden Dimension Gate.',
      '↖️',
    );
    return x0 + L + 1.2;
  }

  /** Decorative orb trail used by the title-screen attract mode. */
  addDecorOrbs(x: number) {
    const zc = this.rnd(-2.5, 2.5);
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
    o.phase = this.random() * 6.28;
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
      // Shared palette materials keep the gift-wall silhouette distinct in every biome.
      g.add(new THREE.Mesh(this.boxGeo, kind === 'panel' ? this.matPanel : this.matWall));
      g.add(new THREE.LineSegments(this.edgeGeo, this.lineWall));

      // 세로 리본 띠
      const ribbonV = new THREE.Mesh(this.boxGeo, this.matStripA);
      ribbonV.scale.set(0.18, 1.01, 1.01);
      g.add(ribbonV);

      // 가로 리본 띠
      const ribbonH = new THREE.Mesh(this.boxGeo, this.matStripA);
      ribbonH.scale.set(1.01, 0.16, 1.01);
      g.add(ribbonH);

      g.position.set(cx, cy, cz);
      g.scale.set(sx, sy, sz);
    } else if (kind === 'block') {
      // 🧱 앙증맞은 장난감 레고 블록 (Toy Lego Cube with studs)
      const cube = new THREE.Mesh(this.boxGeo, this.matBlock);
      g.add(cube);
      g.add(new THREE.LineSegments(this.edgeGeo, this.lineBlock));

      // 상단 원형 스터드(단추) 2개
      const stud1 = new THREE.Mesh(this.blockStudGeo, this.matBlock);
      stud1.position.set(-0.25, 0.55, 0);
      const stud2 = new THREE.Mesh(this.blockStudGeo, this.matBlock);
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
      const warningPlate = new THREE.Mesh(this.boxGeo, this.matSpikeBase);
      warningPlate.scale.set(sx, 0.24, sz);
      warningPlate.position.y = 0.12;
      g.add(warningPlate);
      for (let stripe = 0; stripe < 4; stripe++) {
        const mark = new THREE.Mesh(this.boxGeo, this.matStripA);
        mark.scale.set(0.14, 0.025, sz * 1.01);
        mark.position.set(-sx / 2 + (stripe + 0.5) * sx / 4, 0.25, 0);
        g.add(mark);
      }
      const n = Math.max(1, Math.round(sx / 0.9));
      for (let i = 0; i < n; i++) {
        const spike = new THREE.Mesh(this.stripSpikeGeo, this.matSpike);
        spike.position.set((i + 0.5) * (sx / n) - sx / 2, 0.59, 0);
        g.add(spike);
      }
      g.position.set(cx, y0, cz);
      zScale = 1;
    } else if (kind === 'roller') {
      // The hint calls these moving spike balls, so keep the silhouette readable in 2D.
      const roller = new THREE.Group();
      roller.add(new THREE.Mesh(this.rollerCoreGeo, this.matSpike));
      const directions: THREE.Vector3[] = [];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        directions.push(new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0));
      }
      directions.push(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1));
      const up = new THREE.Vector3(0, 1, 0);
      for (const direction of directions) {
        const spike = new THREE.Mesh(this.rollerSpikeGeo, this.matSpike);
        spike.position.copy(direction).multiplyScalar(0.3);
        spike.quaternion.setFromUnitVectors(up, direction);
        roller.add(spike);
      }

      g.add(roller);
      spin = roller;
      g.position.set(cx, cy, cz);
      zScale = 1;
    } else {
      throw new Error("Unsupported obstacle kind");
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
      new THREE.CylinderGeometry(1.4, 1.4, 0.08, 6, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending }),
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
