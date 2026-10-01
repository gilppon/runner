import * as THREE from 'three';

/** Pooled additive particle system rendered as one THREE.Points object. */
export class Particles {
  readonly points: THREE.Points;
  private readonly max = 360;
  private pos = new Float32Array(this.max * 3);
  private col = new Float32Array(this.max * 3);
  private base = new Float32Array(this.max * 3);
  private vel = new Float32Array(this.max * 3);
  private life = new Float32Array(this.max);
  private maxLife = new Float32Array(this.max);
  private grav = new Float32Array(this.max);
  private cursor = 0;
  private alive = 0;
  private budget = 1;

  /** Auto quality-reduction particle spawn ratio (0.35-1) */
  setBudget(v: number) {
    this.budget = Math.max(0.2, Math.min(1, v));
  }
  private geo = new THREE.BufferGeometry();
  private tmp = new THREE.Color();

  constructor(parent: THREE.Object3D) {
    for (let i = 0; i < this.max; i++) this.pos[i * 3 + 1] = -9999;
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const mat = new THREE.PointsMaterial({
      size: 6,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    parent.add(this.points);
  }

  burst(
    x: number,
    y: number,
    z: number,
    color: THREE.ColorRepresentation,
    count: number,
    speed: number,
    life: number,
    gravity = 8,
  ) {
    this.tmp.set(color);
    const n = Math.max(1, Math.round(count * this.budget));
    for (let k = 0; k < n; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.max;
      if (this.life[i] <= 0) this.alive++;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const sp = speed * (0.35 + Math.random() * 0.65);
      this.vel[i * 3] = Math.sin(ph) * Math.cos(th) * sp;
      this.vel[i * 3 + 1] = Math.abs(Math.cos(ph)) * sp * 0.9 + speed * 0.1;
      this.vel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp;
      this.pos[i * 3] = x;
      this.pos[i * 3 + 1] = y;
      this.pos[i * 3 + 2] = z;
      this.base[i * 3] = this.tmp.r;
      this.base[i * 3 + 1] = this.tmp.g;
      this.base[i * 3 + 2] = this.tmp.b;
      this.life[i] = this.maxLife[i] = life * (0.6 + Math.random() * 0.4);
      this.grav[i] = gravity;
    }
  }

  update(dt: number) {
    if (this.alive <= 0) return;
    let alive = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      const j = i * 3;
      if (this.life[i] <= 0) {
        this.pos[j + 1] = -9999;
        this.col[j] = this.col[j + 1] = this.col[j + 2] = 0;
        continue;
      }
      alive++;
      this.vel[j + 1] -= this.grav[i] * dt;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      this.col[j] = this.base[j] * f;
      this.col[j + 1] = this.base[j + 1] * f;
      this.col[j + 2] = this.base[j + 2] * f;
    }
    this.alive = alive;
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }

  clear() {
    this.life.fill(0);
    this.pos.fill(0);
    for (let i = 0; i < this.max; i++) this.pos[i * 3 + 1] = -9999;
    this.col.fill(0);
    this.alive = 0;
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}
