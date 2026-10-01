// Tiny easing + tween toolkit used for camera moves, shakes and UI-in-world effects.

export type EaseFn = (t: number) => number;

export const ease = {
  linear: ((t) => t) as EaseFn,
  inOutCubic: ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) as EaseFn,
  outCubic: ((t) => 1 - Math.pow(1 - t, 3)) as EaseFn,
  inCubic: ((t) => t * t * t) as EaseFn,
  outQuad: ((t) => 1 - (1 - t) * (1 - t)) as EaseFn,
  inOutSine: ((t) => -(Math.cos(Math.PI * t) - 1) / 2) as EaseFn,
  outBack: ((t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }) as EaseFn,
};

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Frame-rate independent exponential smoothing. */
export const damp = (cur: number, target: number, lambda: number, dt: number) =>
  lerp(cur, target, 1 - Math.exp(-lambda * dt));

export class Tween {
  t = 0;
  done = false;
  constructor(
    private from: number,
    private to: number,
    private dur: number,
    private easing: EaseFn,
    private onUpdate: (v: number) => void,
    private onDone?: () => void,
  ) {}

  update(dt: number) {
    if (this.done) return;
    this.t += dt;
    const k = clamp(this.t / this.dur, 0, 1);
    this.onUpdate(lerp(this.from, this.to, this.easing(k)));
    if (k >= 1) {
      this.done = true;
      this.onDone?.();
    }
  }
}

export class Tweener {
  private list: Tween[] = [];

  to(
    from: number,
    to: number,
    dur: number,
    easing: EaseFn,
    onUpdate: (v: number) => void,
    onDone?: () => void,
  ) {
    const tw = new Tween(from, to, dur, easing, onUpdate, onDone);
    this.list.push(tw);
    return tw;
  }

  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      this.list[i].update(dt);
      if (this.list[i].done) this.list.splice(i, 1);
    }
  }

  clear() {
    this.list.length = 0;
  }
}
