import * as THREE from 'three';
import { Tweener, damp, ease, lerp } from './tween';

/**
 * Camera rig that blends a true orthographic side-scroller camera (2D)
 * into a perspective top-down camera (3D) using a "dolly zoom":
 *   - the visible height at the focus point is tweened,
 *   - the field-of-view is tweened geometrically (4° ≈ orthographic -> 50°),
 *   - the camera distance is derived so the framing never pops,
 *   - the pitch rotates 0° -> 78° around the focus point.
 * At rest in 2D the real OrthographicCamera renders; during/after a shift the
 * PerspectiveCamera takes over at the exact matching frame.
 */
export const CAM = {
  H2: 17, // visible height (world units) in 2D
  H3: 14.5, // visible height in 3D
  MIN_W: 27, // minimum visible width, keeps portrait screens playable
  FOV2: 4,
  FOV3: 56,
  PITCH3: (34 * Math.PI) / 180, // 34도 쾌적한 3인칭 체이스 런 앵글 (Talking Tom Gold Run 스타일!)
  DURATION: 0.75,
};

export class CameraRig {
  readonly ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  readonly persp = new THREE.PerspectiveCamera(CAM.FOV2, 1, 0.5, 1000);
  active: THREE.Camera = this.ortho;

  /** linear progress 0 (2D) .. 1 (3D) */
  p = 0;
  /** eased progress */
  e = 0;
  target = 0;
  aspect = 1;
  angleDeg = 0;
  focusX = 0;

  private tweener = new Tweener();
  private shakeAmt = 0;
  private fovKick = 0;
  private zFollow = 0;

  get transitioning() {
    return this.p !== this.target;
  }

  setAspect(a: number) {
    this.aspect = a;
    this.persp.aspect = a;
    this.persp.updateProjectionMatrix();
  }

  setTarget(is3D: boolean) {
    this.target = is3D ? 1 : 0;
  }

  snap(is3D: boolean) {
    this.target = is3D ? 1 : 0;
    this.p = this.target;
  }

  shake(amount: number) {
    this.shakeAmt = Math.max(this.shakeAmt, amount);
  }

  kickFov(deg: number) {
    this.tweener.to(deg, 0, 0.7, ease.outCubic, (v) => (this.fovKick = v));
  }

  update(dt: number, fx: number, fz: number) {
    this.tweener.update(dt);

    const step = dt / CAM.DURATION;
    if (this.p < this.target) this.p = Math.min(this.target, this.p + step);
    else if (this.p > this.target) this.p = Math.max(this.target, this.p - step);
    const e = (this.e = ease.inOutCubic(this.p));

    const minH = CAM.MIN_W / this.aspect;
    const h2 = Math.max(CAM.H2, minH);
    const h3 = Math.max(CAM.H3, minH);
    const h = lerp(h2, h3, e);
    const pitch = e * CAM.PITCH3;
    this.angleDeg = (pitch * 180) / Math.PI;

    const fov = Math.max(3, CAM.FOV2 * Math.pow(CAM.FOV3 / CAM.FOV2, e) + this.fovKick);
    const D = h / (2 * Math.tan((fov * Math.PI) / 360));

    const tx = fx + 0.22 * h * this.aspect;
    const ty = lerp(0.2 * h2, 0.4, e);
    this.zFollow = damp(this.zFollow, fz * 0.25, 6, dt);
    const tz = this.zFollow * e;
    this.focusX = tx;

    // camera shake in screen space
    this.shakeAmt = damp(this.shakeAmt, 0, 6, dt);
    if (this.shakeAmt < 0.002) this.shakeAmt = 0;
    const ox = (Math.random() - 0.5) * 2 * this.shakeAmt;
    const oy = (Math.random() - 0.5) * 2 * this.shakeAmt;

    if (this.p === 0 && Math.abs(this.fovKick) < 0.05) {
      const o = this.ortho;
      o.left = (-h * this.aspect) / 2;
      o.right = (h * this.aspect) / 2;
      o.top = h / 2;
      o.bottom = -h / 2;
      o.near = Math.max(0.1, D - 120);
      o.far = D + 400;
      o.position.set(tx + ox, ty + oy, tz + D);
      o.rotation.set(0, 0, 0);
      o.updateProjectionMatrix();
      this.active = o;
    } else {
      const c = this.persp;
      c.fov = fov;
      c.aspect = this.aspect;
      c.near = Math.max(0.5, D - 100);
      c.far = D + 400;
      c.position.set(tx + ox, ty + Math.sin(pitch) * D + oy, tz + Math.cos(pitch) * D);
      c.rotation.set(-pitch, 0, 0);
      c.updateProjectionMatrix();
      this.active = c;
    }
  }
}
