/**
 * Puppets: characters built from jointed parts. Every part is a small picture drawn once with canvas paths (so it is sharp at
 * any screen size), hung from a joint of its parent, and animated by turning and moving the joints. No sprite sheets.
 *
 * Coordinates are design units, y down, +x is the way the creature faces. The root sits at the creature's feet.
 */
import * as Phaser from 'phaser';

export const INK = '#1d1a33';
export const RES = 2;                                   // textures are drawn at twice the size and shown at half

export interface Img {
  w: number; h: number;                                 // size of the picture in design units
  ax: number; ay: number;                               // where the joint is inside the picture
  draw(c: CanvasRenderingContext2D): void;              // draws inside (0,0)-(w,h)
}
export interface PartDef {
  name: string;
  parent?: string;                                      // joint this part hangs from (default: the root)
  at: [number, number];                                 // joint position in the parent's space
  img?: Img;
  /** Draw behind the parent's picture (far arm, far leg, tail). */
  behind?: boolean;
  /** Draw order among siblings: lower first. */
  z?: number;
}
/** A pose changes parts from their rest position: [rotation (rad), dx, dy, scaleX, scaleY]. */
export type Pose = Record<string, [number?, number?, number?, number?, number?]>;

let uid = 0;

export class Puppet {
  readonly root: Phaser.GameObjects.Container;
  readonly nodes: Record<string, Phaser.GameObjects.Container> = {};
  private rest: Record<string, [number, number]> = {};
  private tint: Record<string, Phaser.GameObjects.Image> = {};

  constructor(readonly scene: Phaser.Scene, defs: PartDef[], readonly key = 'pup' + uid++) {
    this.root = scene.add.container(0, 0);
    this.nodes.root = this.root;
    for (const d of defs) {                                   // parents come before their children; siblings draw in this order
      const node = scene.add.container(d.at[0], d.at[1]);
      this.nodes[d.name] = node;
      this.rest[d.name] = [d.at[0], d.at[1]];
      if (d.img) {
        const tk = this.key + '_' + d.name;
        if (!scene.textures.exists(tk)) {
          const cv = document.createElement('canvas');
          cv.width = Math.ceil(d.img.w * RES); cv.height = Math.ceil(d.img.h * RES);
          const c = cv.getContext('2d') as CanvasRenderingContext2D;
          c.scale(RES, RES);
          c.lineJoin = 'round'; c.lineCap = 'round';
          d.img.draw(c);
          scene.textures.addCanvas(tk, cv);
        }
        const im = scene.add.image(0, 0, tk).setOrigin(d.img.ax / d.img.w, d.img.ay / d.img.h).setScale(1 / RES);
        node.add(im);
        this.tint[d.name] = im;
      }
      const parent = this.nodes[d.parent ?? 'root'];
      if (d.behind) parent.addAt(node, 0); else parent.add(node);
    }
  }

  /** Put every part back at rest. */
  reset(): void {
    for (const k of Object.keys(this.nodes)) {
      if (k === 'root') continue;
      const n = this.nodes[k], r = this.rest[k];
      n.setPosition(r[0], r[1]).setRotation(0).setScale(1, 1);
    }
  }
  /** Apply a pose on top of the rest position. */
  apply(p: Pose): void {
    this.reset();
    for (const k of Object.keys(p)) {
      const n = this.nodes[k], v = p[k];
      if (!n) continue;
      const r = this.rest[k] ?? [0, 0];
      n.setRotation(v[0] ?? 0).setPosition(r[0] + (v[1] ?? 0), r[1] + (v[2] ?? 0)).setScale(v[3] ?? 1, v[4] ?? 1);
    }
  }
  private base: number | null = null;
  /** A permanent colour wash (for variants of a creature). */
  setBaseTint(c: number | null): void { this.base = c; for (const im of Object.values(this.tint)) { if (c === null) im.clearTint(); else im.setTint(c); } }
  /** Flash the whole puppet white (a hit), or clear it. */
  flash(on: boolean): void {
    for (const im of Object.values(this.tint)) { if (on) im.setTintFill(0xffffff); else if (this.base === null) im.clearTint(); else im.setTint(this.base); }
  }
  setAlpha(a: number): void { this.root.setAlpha(a); }
  setDepth(d: number): void { this.root.setDepth(d); }
  destroy(): void { this.root.destroy(); }
}

// ------------------------------------------------------------------ poses: blending and keyframes
export const ease = {
  lin: (t: number) => t,
  out: (t: number) => 1 - (1 - t) * (1 - t),
  in: (t: number) => t * t,
  io: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  back: (t: number) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
export function blend(a: Pose, b: Pose, t: number): Pose {
  const out: Pose = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const p = a[k] ?? [], q = b[k] ?? [];
    const m = (i: number, d: number) => (p[i] ?? d) + ((q[i] ?? d) - (p[i] ?? d)) * t;
    out[k] = [m(0, 0), m(1, 0), m(2, 0), m(3, 1), m(4, 1)];
  }
  return out;
}
export interface Key { t: number; pose: Pose; ease?: (t: number) => number }
/** Pose at time t of a list of keyframes (times in seconds, ascending). Holds the last pose after the end. */
export function sample(keys: Key[], t: number): Pose {
  if (t <= keys[0].t) return keys[0].pose;
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i].t) {
      const a = keys[i - 1], b = keys[i], u = (t - a.t) / Math.max(1e-6, b.t - a.t);
      return blend(a.pose, b.pose, (b.ease ?? ease.out)(u));
    }
  }
  return keys[keys.length - 1].pose;
}
/** Add several poses together (rotations and offsets add, scales multiply). */
export function add(...ps: Pose[]): Pose {
  const out: Pose = {};
  for (const p of ps) for (const k of Object.keys(p)) {
    const v = p[k], o = out[k] ?? [0, 0, 0, 1, 1];
    out[k] = [(o[0] ?? 0) + (v[0] ?? 0), (o[1] ?? 0) + (v[1] ?? 0), (o[2] ?? 0) + (v[2] ?? 0), (o[3] ?? 1) * (v[3] ?? 1), (o[4] ?? 1) * (v[4] ?? 1)];
  }
  return out;
}

// ------------------------------------------------------------------ drawing helpers (the paper-cut look)
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
/** A filled shape with an ink outline, a lighter top and a darker bottom. `path` builds the outline. */
export function paper(c: CanvasRenderingContext2D, path: () => void, color: string, o: { lw?: number; top?: number; bot?: number; y0?: number; y1?: number } = {}): void {
  const lw = o.lw ?? 3;
  c.beginPath(); path();
  const g = c.createLinearGradient(0, o.y0 ?? 0, 0, o.y1 ?? 60);
  g.addColorStop(0, shade(color, o.top ?? 0.18)); g.addColorStop(0.55, color); g.addColorStop(1, shade(color, o.bot ?? -0.22));
  c.fillStyle = g; c.fill();
  c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
}
export function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const k = Math.min(r, w / 2, h / 2);
  c.moveTo(x + k, y); c.arcTo(x + w, y, x + w, y + h, k); c.arcTo(x + w, y + h, x, y + h, k); c.arcTo(x, y + h, x, y, k); c.arcTo(x, y, x + w, y, k); c.closePath();
}
export function ell(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot = 0): void { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }
/** A soft white shine stroke on top of a shape. */
export function shine(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, a = 0.5, lw = 2.5): void {
  c.save(); c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = lw; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
}
/** A glossy eye: white, pupil looking toward +x, a spark. */
export function eye(c: CanvasRenderingContext2D, x: number, y: number, r: number, look = 0.25): void {
  c.beginPath(); ell(c, x, y, r, r * 1.12); c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
  c.beginPath(); ell(c, x + r * look, y + r * 0.1, r * 0.58, r * 0.68); c.fillStyle = INK; c.fill();
  c.beginPath(); ell(c, x + r * (look + 0.18), y - r * 0.22, r * 0.2, r * 0.22); c.fillStyle = '#fff'; c.fill();
}
