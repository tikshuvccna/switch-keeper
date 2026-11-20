/**
 * Area 1, "Shouting Market" (noise, collisions, copies): the Collision Twin crate, the Echo Imp, the Duplicate Frame and the Hub Hog boss.
 * Original designs for this game. Also holds small drawing and pose helpers shared with area2.ts.
 * Angles: 0 = a limb hangs down; negative swings it forward (+x). For a part that stands UP from its joint, positive tips it forward.
 */
import { add, ease, eye, INK, paper, rr, ell, shade, shine, type Img, type PartDef, type Pose } from '../puppet';
import type { EnemyCtx, EnemyRig } from '../types';

// ------------------------------------------------------------------ shared palette and helpers (area2.ts imports these)
export const CREAM = '#f6e9cf', RED = '#e4572e', TEAL = '#1fa89a', MUSTARD = '#f2b134', PLUM = '#6b3fa0', NAVY = '#2f3b78', PINK = '#f29aa3';
type D = (c: CanvasRenderingContext2D) => void;
export type T5 = [number?, number?, number?, number?, number?];
export const img = (w: number, h: number, ax: number, ay: number, draw: D): Img => ({ w, h, ax, ay, draw });
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** 0 before a, 1 after b, linear in between. */
export const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const fract = (v: number) => v - Math.floor(v);
export const OFF: T5 = [0, 0, 0, 0.001, 0.001];
/** Hide every effect part the pose does not mention (effect parts only show when a pose names them). */
export function fx(p: Pose, names: string[]): Pose { for (const n of names) if (!p[n]) p[n] = OFF; return p; }
/** Show exactly one of a set of swappable pictures (faces, eyes). */
export function only(active: string, all: string[]): Pose { const p: Pose = {}; for (const n of all) p[n] = n === active ? [0, 0, 0, 1, 1] : OFF; return p; }
/** Dizzy stars circling on an ellipse (offsets from the stars' shared rest point). */
export function orbit(names: string[], time: number, rx: number, ry: number, speed = 5): Pose {
  const p: Pose = {};
  names.forEach((n, i) => { const a = time * speed + (i * Math.PI * 2) / names.length, s = Math.sin(a); p[n] = [time * 3 + i, Math.cos(a) * rx, s * ry, 0.8 + 0.25 * s, 0.8 + 0.25 * s]; });
  return p;
}
/** A puff that rises and grows over one loop (u = 0..1), then vanishes. */
export function puff(u: number, dx: number, dy: number, size = 1): T5 { const s = size * (0.4 + 0.8 * Math.sin(Math.min(1, u) * Math.PI * 0.85)); return [u * 0.6, dx * u, dy * u, s, s]; }
/** A filled union of shapes with ONE outer outline (stroke first, then fill on top). */
export function blob(c: CanvasRenderingContext2D, path: () => void, color: string, o: { lw?: number; y0?: number; y1?: number; top?: number; bot?: number } = {}): void {
  c.beginPath(); path(); c.lineWidth = (o.lw ?? 3) * 2; c.strokeStyle = INK; c.stroke();
  const g = c.createLinearGradient(0, o.y0 ?? 0, 0, o.y1 ?? 60);
  g.addColorStop(0, shade(color, o.top ?? 0.18)); g.addColorStop(0.55, color); g.addColorStop(1, shade(color, o.bot ?? -0.22));
  c.fillStyle = g; c.fill();
}
export function starImg(col = MUSTARD, r = 5): Img {
  const s = r * 2 + 4;
  return img(s, s, s / 2, s / 2, (c) => paper(c, () => {
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? r * 0.45 : r; const x = s / 2 + Math.cos(a) * k, y = s / 2 + Math.sin(a) * k; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.closePath();
  }, col, { lw: 1.6, y0: 2, y1: s - 2 }));
}
export function puffImg(r = 6, col = '#ffffff'): Img {
  const w = r * 3.2, h = r * 2.4;
  return img(w, h, w / 2, h / 2, (c) => blob(c, () => { ell(c, w * 0.3, h * 0.6, r * 0.72, r * 0.66); ell(c, w * 0.52, h * 0.44, r * 0.95, r * 0.88); ell(c, w * 0.72, h * 0.6, r * 0.7, r * 0.6); }, col, { lw: 1.1, y0: 0, y1: h, top: 0.1, bot: -0.12 }));
}
export function sparkImg(r = 8, col = '#fff07a'): Img {
  const s = r * 2 + 4;
  return img(s, s, s / 2, s / 2, (c) => paper(c, () => {
    const n = 8;
    for (let i = 0; i < n * 2; i++) { const a = (i * Math.PI) / n, k = i % 2 ? r * 0.3 : r * (i % 4 ? 0.7 : 1); const x = s / 2 + Math.cos(a) * k, y = s / 2 + Math.sin(a) * k; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.closePath();
  }, col, { lw: 1.4, y0: 2, y1: s - 2 }));
}
/** A sound ring: a thick ")" arc drawn in two colours. */
export function ringImg(h: number, col = CREAM): Img {
  const w = h * 0.3 + 6;
  return img(w, h, 3, h / 2, (c) => {
    const path = () => { c.beginPath(); c.moveTo(3, 4); c.quadraticCurveTo(w * 1.55 - 3, h / 2, 3, h - 4); };
    path(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
    path(); c.lineWidth = 2.8; c.strokeStyle = col; c.stroke();
  });
}
export function dropImg(r = 4, col = '#7fd3f0'): Img {
  return img(r * 2 + 4, r * 3 + 4, r + 2, r * 2 + 2, (c) => paper(c, () => { c.moveTo(r + 2, 2); c.bezierCurveTo(r + 2 + r * 0.6, r, r * 2 + 2, r * 1.4, r * 2 + 2, r * 2 + 1); c.arc(r + 2, r * 2 + 1, r, 0, Math.PI); c.bezierCurveTo(2, r * 1.4, r + 2 - r * 0.6, r, r + 2, 2); c.closePath(); }, col, { lw: 1.5, y0: 2, y1: r * 3 + 2 }));
}
/** An eye with an angry lid: the lid line slopes down by `slant` (+ = toward +x). */
export function madEye(c: CanvasRenderingContext2D, x: number, y: number, r: number, lid: string, slant: number, look = 0.3, lidH = 0.15): void {
  eye(c, x, y, r, look);
  const y0 = y - r * lidH - slant * r, y1 = y - r * lidH + slant * r;
  c.save(); c.beginPath(); ell(c, x, y, r + 1.6, r * 1.12 + 1.6); c.clip();
  c.beginPath(); c.moveTo(x - r * 1.5, y0 - slant * r * 0.2); c.lineTo(x + r * 1.5, y1 + slant * r * 0.2); c.lineTo(x + r * 1.5, y - r * 3); c.lineTo(x - r * 1.5, y - r * 3); c.closePath();
  c.fillStyle = lid; c.fill(); c.restore();
  c.beginPath(); c.moveTo(x - r * 1.25, y0 - slant * r * 0.15); c.lineTo(x + r * 1.25, y1 + slant * r * 0.15); c.lineWidth = Math.max(2.2, r * 0.42); c.strokeStyle = INK; c.stroke();
}
export function spiralEye(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  c.beginPath(); ell(c, x, y, r, r * 1.1); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  c.beginPath();
  for (let a = 0; a < Math.PI * 5; a += 0.2) { const k = (a / (Math.PI * 5)) * r * 0.85; const px = x + Math.cos(a) * k, py = y + Math.sin(a) * k * 1.05; if (a) c.lineTo(px, py); else c.moveTo(px, py); }
  c.lineWidth = Math.max(1.3, r * 0.22); c.stroke();
}
/** A squeezed-shut eye ">" (dir 1) or "<" (dir -1). */
export function squint(c: CanvasRenderingContext2D, x: number, y: number, r: number, dir: number): void {
  c.beginPath(); c.moveTo(x - r * 0.7 * dir, y - r * 0.75); c.lineTo(x + r * 0.7 * dir, y); c.lineTo(x - r * 0.7 * dir, y + r * 0.75);
  c.lineWidth = Math.max(2.2, r * 0.45); c.strokeStyle = INK; c.stroke();
}
export function xEye(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  c.beginPath(); c.moveTo(x - r * 0.7, y - r * 0.7); c.lineTo(x + r * 0.7, y + r * 0.7); c.moveTo(x + r * 0.7, y - r * 0.7); c.lineTo(x - r * 0.7, y + r * 0.7);
  c.lineWidth = Math.max(2.2, r * 0.4); c.strokeStyle = INK; c.stroke();
}
/** A closed sleepy eye (a smile-shaped arc). */
export function sleepEye(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  c.beginPath(); c.moveTo(x - r, y - r * 0.1); c.quadraticCurveTo(x, y + r * 0.8, x + r, y - r * 0.1); c.lineWidth = Math.max(2, r * 0.4); c.strokeStyle = INK; c.stroke();
}
/** A tiny anger mark (four bent strokes). */
export function vein(c: CanvasRenderingContext2D, x: number, y: number, s: number, col = RED): void {
  c.save(); c.strokeStyle = col; c.lineWidth = s * 0.32;
  for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + Math.PI / 4; const ux = Math.cos(a), uy = Math.sin(a); c.beginPath(); c.moveTo(x + ux * s * 0.35 - uy * s * 0.35, y + uy * s * 0.35 + ux * s * 0.35); c.quadraticCurveTo(x + ux * s * 0.5, y + uy * s * 0.5, x + ux * s * 0.35 + uy * s * 0.35, y + uy * s * 0.35 - ux * s * 0.35); c.stroke(); }
  c.restore();
}
/** A blush or flush overlay. */
export function blush(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, a = 0.45, col = '255,90,90'): void {
  c.fillStyle = `rgba(${col},${a})`; c.beginPath(); ell(c, x, y, rx, ry); c.fill();
}

// ================================================================== CRATE (Collision Twin): an angry cardboard parcel
const CARD = '#c98f55', TAPE = '#efd99a';
const CRATE_FACES = ['face', 'faceMad', 'faceDizzy', 'faceOuch'];
const CRATE_FX = ['puff1', 'puff2', 'star1', 'star2', 'star3', 'tapeEnd', ...CRATE_FACES];
function crateLeg(dark: number): Img {
  return img(18, 16, 7, 2, (c) => {
    paper(c, () => rr(c, 3, 0, 8, 10, 3), shade('#8a5a35', dark), { y0: 0, y1: 10, lw: 2.4 });
    paper(c, () => { c.moveTo(2, 9); c.lineTo(10, 9); c.bezierCurveTo(15, 9, 17, 11, 17, 13); c.lineTo(17, 14.5); c.lineTo(2, 14.5); c.closePath(); }, shade(NAVY, dark), { y0: 9, y1: 15, lw: 2.4 });
    c.fillStyle = shade(CREAM, dark); c.fillRect(3, 12.3, 13.5, 1.4);
  });
}
function crateArm(dark: number): Img {
  return img(14, 20, 7, 3, (c) => {
    paper(c, () => rr(c, 3.5, 1, 7, 11, 3), shade(CARD, dark - 0.08), { y0: 1, y1: 12, lw: 2.4 });
    paper(c, () => ell(c, 7, 14, 5, 4.4), shade(CREAM, dark), { y0: 9, y1: 19, lw: 2.4 });
  });
}
function crateFace(kind: 'calm' | 'mad' | 'dizzy' | 'ouch'): Img {
  return img(38, 26, 19, 11, (c) => {
    if (kind === 'calm' || kind === 'mad') {
      const m = kind === 'mad';
      madEye(c, 11, 10, m ? 5.4 : 5, CARD, m ? 0.55 : 0.38, 0.35, m ? 0.05 : 0.18);
      madEye(c, 27, 10, m ? 5.8 : 5.4, CARD, m ? -0.55 : -0.38, 0.35, m ? 0.05 : 0.18);
      if (m) {
        paper(c, () => { c.moveTo(11, 17); c.quadraticCurveTo(19, 14, 28, 17); c.lineTo(27, 24); c.quadraticCurveTo(19, 21, 12, 24); c.closePath(); }, '#7a2233', { lw: 2.2, y0: 15, y1: 24 });
        c.fillStyle = '#fff'; c.fillRect(13, 17, 13, 2.2); c.fillRect(14, 21.3, 11, 1.6);
        vein(c, 33, 3, 6); blush(c, 6, 18, 3.5, 2.2, 0.5); blush(c, 32, 18, 3.5, 2.2, 0.5);
      } else {
        paper(c, () => { c.moveTo(12, 21); c.lineTo(14, 17); c.lineTo(25, 17); c.lineTo(27, 21); c.closePath(); }, '#ffffff', { lw: 2.2, y0: 16, y1: 21, top: 0, bot: -0.08 });
        c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath();
        for (const x of [16.5, 19.5, 22.5]) { c.moveTo(x, 17); c.lineTo(x, 20.5); }
        c.moveTo(13, 19); c.lineTo(26, 19); c.stroke();
      }
    } else if (kind === 'dizzy') {
      spiralEye(c, 11, 10, 5.2); spiralEye(c, 27, 10, 5.6);
      c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(11, 19); c.bezierCurveTo(15, 16, 17, 22, 20, 19); c.bezierCurveTo(23, 16, 25, 22, 28, 19); c.stroke();
      paper(c, () => { c.moveTo(21, 19.5); c.quadraticCurveTo(21, 25, 24.5, 24.5); c.quadraticCurveTo(26.5, 23, 25, 18.5); }, PINK, { lw: 1.6, y0: 19, y1: 25 });
    } else {
      squint(c, 11, 10, 5, 1); squint(c, 27, 10, 5, -1);
      paper(c, () => ell(c, 19, 19, 4, 3.6), '#7a2233', { lw: 2, y0: 15, y1: 23 });
    }
  });
}
const CRATE: PartDef[] = [
  { name: 'c', at: [0, -24] },
  { name: 'legB', parent: 'c', at: [-8, 14], img: crateLeg(-0.2) },
  { name: 'legF', parent: 'c', at: [8, 14], img: crateLeg(0) },
  { name: 'box', parent: 'c', at: [0, 15], img: img(50, 48, 25, 44, (c) => {
    paper(c, () => { c.moveTo(5, 12); c.lineTo(10, 4); c.lineTo(42, 4); c.lineTo(46, 12); c.closePath(); }, shade(CARD, 0.2), { y0: 4, y1: 12, lw: 2.6 });
    c.strokeStyle = shade(CARD, -0.25); c.lineWidth = 1.2; c.beginPath(); c.moveTo(8, 8); c.lineTo(44, 8); c.stroke();
    paper(c, () => rr(c, 4, 11, 43, 33, 3), CARD, { y0: 11, y1: 44 });
    c.save(); c.beginPath(); rr(c, 4, 11, 43, 33, 3); c.clip();
    c.fillStyle = 'rgba(80,40,10,0.13)'; for (let x = 8; x < 46; x += 4.5) c.fillRect(x, 11, 1.2, 33);   // corrugation
    c.fillStyle = shade(CARD, -0.18); c.fillRect(4, 38, 43, 6);
    c.restore();
    c.fillStyle = TAPE; c.beginPath(); c.moveTo(23, 4); c.lineTo(29, 4); c.lineTo(30, 12); c.lineTo(23.5, 12); c.closePath(); c.fill();     // tape over the lid
    c.fillRect(23.5, 11, 6.5, 6);
    c.strokeStyle = shade(TAPE, -0.35); c.lineWidth = 1; c.beginPath(); c.moveTo(23, 4); c.lineTo(23.5, 17); c.moveTo(29, 4); c.lineTo(30, 17); c.stroke();
    c.beginPath(); c.moveTo(23.5, 17); c.lineTo(25, 16); c.lineTo(26.5, 17.3); c.lineTo(28.2, 16); c.lineTo(30, 17); c.stroke();
    paper(c, () => rr(c, 29, 29, 14, 11, 1.5), '#fffaf0', { lw: 1.6, y0: 29, y1: 40, top: 0, bot: -0.05 });       // shipping label
    c.fillStyle = RED; c.fillRect(29.8, 29.8, 12.4, 2.6);
    c.fillStyle = INK; for (let i = 0; i < 9; i++) c.fillRect(31 + i * 1.2, 34, i % 3 ? 0.6 : 0.9, 4.2);
    c.fillStyle = RED;                                                                                            // "this way up" arrows
    for (const x of [9, 15]) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x + 2.6, 33.5); c.lineTo(x + 1, 33.5); c.lineTo(x + 1, 38); c.lineTo(x - 1, 38); c.lineTo(x - 1, 33.5); c.lineTo(x - 2.6, 33.5); c.closePath(); c.fill(); }
    shine(c, 7, 15, 7, 32, 0.35);
  }) },
  { name: 'flapB', parent: 'box', at: [-15, -37], behind: true, img: img(20, 16, 17, 13, (c) => paper(c, () => { c.moveTo(18, 13); c.lineTo(3, 9); c.lineTo(5, 2); c.lineTo(17, 5); c.closePath(); }, shade(CARD, -0.1), { y0: 2, y1: 13, lw: 2.4 })) },
  { name: 'flapF', parent: 'box', at: [15, -37], behind: true, img: img(20, 16, 3, 13, (c) => paper(c, () => { c.moveTo(2, 13); c.lineTo(17, 9); c.lineTo(15, 2); c.lineTo(3, 5); c.closePath(); }, shade(CARD, 0.05), { y0: 2, y1: 13, lw: 2.4 })) },
  { name: 'armB', parent: 'box', at: [-19, -20], behind: true, img: crateArm(-0.2) },
  { name: 'tapeEnd', parent: 'box', at: [3, -27], img: img(12, 16, 3, 14, (c) => paper(c, () => { c.moveTo(1, 14); c.lineTo(7, 14); c.quadraticCurveTo(11, 6, 8, 2); c.quadraticCurveTo(3, 4, 1, 14); c.closePath(); }, TAPE, { lw: 1.4, y0: 2, y1: 14 })) },
  { name: 'face', parent: 'box', at: [0, -22], img: crateFace('calm') },
  { name: 'faceMad', parent: 'box', at: [0, -22], img: crateFace('mad') },
  { name: 'faceDizzy', parent: 'box', at: [0, -22], img: crateFace('dizzy') },
  { name: 'faceOuch', parent: 'box', at: [0, -22], img: crateFace('ouch') },
  { name: 'armF', parent: 'box', at: [20, -20], img: crateArm(0) },
  { name: 'puff1', parent: 'box', at: [-14, -42], img: puffImg(5) },
  { name: 'puff2', parent: 'box', at: [12, -42], img: puffImg(4.5) },
  { name: 'star1', parent: 'box', at: [0, -50], img: starImg() },
  { name: 'star2', parent: 'box', at: [0, -50], img: starImg('#fff3b0') },
  { name: 'star3', parent: 'box', at: [0, -50], img: starImg() },
];
function cratePose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  const idle = (): Pose => { const b = Math.sin(T * 3); return { box: [0.02 * b, 0, 0, 1 + 0.02 * b, 1 - 0.03 * b], flapB: [-0.1 * Math.sin(T * 3 + 0.6)], flapF: [0.1 * Math.sin(T * 3 + 0.6)], armF: [0.08 * b], armB: [-0.08 * b] }; };
  switch (x.state) {
    case 'move': {
      const ph = T * 11, s = Math.sin(ph);
      p = { c: [0.13 * s, 0, -Math.abs(Math.cos(ph)) * 3.5], legF: [-0.6 * s, 0, Math.min(0, Math.cos(ph)) * 2], legB: [0.6 * s, 0, Math.min(0, -Math.cos(ph)) * 2], armF: [0.6 * s], armB: [-0.6 * s],
        box: [-0.05 * s, 0, 0, 1 - 0.03 * Math.cos(2 * ph), 1 + 0.03 * Math.cos(2 * ph)], flapB: [-0.25 * Math.sin(ph * 2 - 1)], flapF: [0.25 * Math.sin(ph * 2 - 1)], face: [0, 0, 0, 1, 1] };
      break;
    }
    case 'windup': {
      const k = ease.out(ramp(t, 0, 0.32)), tr = Math.sin(T * 70) * 0.9 * ramp(t, 0.15, 0.4), u = fract(t * 3.2);
      p = add(idle(), { c: [0, tr, 3 * k], box: [-0.3 * k, -2 * k, 0, 1 + 0.08 * k, 1 - 0.1 * k], armF: [1.3 * k], armB: [1.1 * k], legF: [-0.25 * k], legB: [0.35 * k], flapB: [-0.5 * k], flapF: [0.5 * k] },
        Math.floor(t * 9) % 2 ? only('faceMad', CRATE_FACES) : only('face', CRATE_FACES),
        { puff1: puff(u, -10, -14), puff2: puff(fract(u + 0.5), 8, -16, 0.9) });
      break;
    }
    case 'attack': {
      const k = ease.out(ramp(t, 0, 0.06)), r = ease.io(ramp(t, 0.24, 0.4));
      const m = k * (1 - r);
      p = add({ c: [0, 9 * m, -3 * m], box: [0.4 * m, 0, 0, 1 + 0.2 * m, 1 - 0.12 * m], armF: [-1.7 * m], armB: [-1.3 * m], legF: [-0.7 * m], legB: [0.7 * m], flapB: [0.5 * m], flapF: [-0.6 * m] }, only('faceMad', CRATE_FACES));
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [0, -4 * k, 0], box: [-0.18 * k, 0, 0, 1 + 0.2 * k, 1 - 0.22 * k], armF: [1.2 * k], armB: [1.4 * k], flapB: [-0.6 * k], flapF: [0.7 * k], legF: [-0.3 * k] }, only('faceOuch', CRATE_FACES));
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 4);
      p = add({ c: [0.2 + 0.06 * w, 0, 1], box: [0.04 * Math.sin(T * 7), 0, 0, 1.03, 0.97], armF: [0.4 + 0.2 * w], armB: [0.6 - 0.2 * w], flapB: [-0.9 + 0.1 * w], flapF: [0.3 + 0.15 * w], legF: [-0.2], legB: [0.25],
        tapeEnd: [0.2 + 0.25 * Math.sin(T * 5), 0, 0, 1, 1] }, only('faceDizzy', CRATE_FACES), orbit(['star1', 'star2', 'star3'], T, 16, 5));
      break;
    }
    case 'dead': {
      const k = ease.in(ramp(t, 0, 0.32));
      p = add({ c: [k * 7.5, 0, 8 * k, 1 + 0.35 * k, 1 - 0.75 * k], armF: [1.2 * k], armB: [1.2 * k], flapB: [-1 * k], flapF: [1 * k], tapeEnd: [0.8 * k, 0, 0, 1, 1] }, only('faceDizzy', CRATE_FACES));
      break;
    }
    default: p = add(idle(), only('face', CRATE_FACES));                                                    // idle, sleep, wake
  }
  return fx(p, CRATE_FX);
}

// ================================================================== IMP (Echo Imp): a flying loudspeaker bat
const IMP_C = '#7b4fb8', WING = '#b79be6';
const IMP_EYES = ['eyes', 'eyesShut', 'eyesMad', 'eyesDizzy', 'eyesOuch'];
const IMP_FX = ['ring1', 'ring2', 'ring3', 'zz1', 'zz2', 'star1', 'star2', 'star3', ...IMP_EYES];
function impWing(dark: number): Img {
  return img(42, 30, 36, 25, (c) => {
    const path = () => { c.moveTo(36, 25); c.quadraticCurveTo(28, 6, 16, 2); c.lineTo(3, 9); c.quadraticCurveTo(9, 13, 9, 18); c.quadraticCurveTo(14, 14, 19, 19); c.quadraticCurveTo(23, 16, 27, 23); c.quadraticCurveTo(31, 21, 36, 25); c.closePath(); };
    paper(c, path, shade(WING, dark), { y0: 2, y1: 26, lw: 2.4 });
    c.strokeStyle = shade(IMP_C, dark - 0.15); c.lineWidth = 1.6; c.beginPath(); c.moveTo(34, 23); c.lineTo(16, 3); c.moveTo(16, 3); c.lineTo(10, 16); c.moveTo(16, 3); c.lineTo(19, 18); c.moveTo(22, 9); c.lineTo(27, 22); c.stroke();
    paper(c, () => ell(c, 16, 2.5, 2.2, 2.2), shade(IMP_C, dark - 0.1), { lw: 1.4, y0: 0, y1: 5 });
  });
}
function impEyes(kind: 'open' | 'shut' | 'mad' | 'dizzy' | 'ouch'): Img {
  return img(24, 16, 12, 8, (c) => {
    if (kind === 'open') { eye(c, 7, 8, 4.2, 0.35); eye(c, 17, 7.5, 4.8, 0.35); c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(13, 1.5); c.lineTo(21, 2.5); c.stroke(); }
    else if (kind === 'mad') { madEye(c, 7, 8, 4.4, IMP_C, 0.5, 0.4, 0.05); madEye(c, 17, 7.5, 5, IMP_C, -0.5, 0.4, 0.05); }
    else if (kind === 'shut') { sleepEye(c, 7, 8, 3.4); sleepEye(c, 17, 7.5, 3.8); }
    else if (kind === 'dizzy') { spiralEye(c, 7, 8, 4.2); spiralEye(c, 17, 7.5, 4.8); }
    else { squint(c, 7, 8, 4, 1); squint(c, 17, 7.5, 4.4, -1); }
  });
}
function impEar(dark: number): Img {
  return img(16, 18, 8, 16, (c) => {
    paper(c, () => { c.moveTo(5.5, 16); c.lineTo(2, 5); c.lineTo(14, 5); c.lineTo(10.5, 16); c.closePath(); }, shade(IMP_C, dark - 0.1), { y0: 4, y1: 16, lw: 2.2 });
    paper(c, () => ell(c, 8, 5, 6.2, 3.4), shade(CREAM, dark), { lw: 2, y0: 1, y1: 9 });
    c.fillStyle = INK; c.beginPath(); ell(c, 8, 5, 2.3, 1.3); c.fill();
  });
}
function zzImg(s: number): Img {
  return img(s + 4, s + 4, s / 2 + 2, s / 2 + 2, (c) => {
    const z = () => { c.beginPath(); c.moveTo(2, 2); c.lineTo(s + 2, 2); c.lineTo(2, s + 2); c.lineTo(s + 2, s + 2); };
    z(); c.lineWidth = 4.4; c.strokeStyle = INK; c.stroke(); z(); c.lineWidth = 2; c.strokeStyle = '#d9ccff'; c.stroke();
  });
}
const IMP: PartDef[] = [
  { name: 'c', at: [0, 0] },
  { name: 'zz1', at: [10, -20], img: zzImg(7) },
  { name: 'zz2', at: [10, -20], img: zzImg(5) },
  { name: 'wingB', parent: 'c', at: [-3, -5], img: impWing(-0.22) },
  { name: 'tail', parent: 'c', at: [-11, 4], img: img(26, 16, 23, 4, (c) => {
    c.beginPath(); c.moveTo(23, 4); c.bezierCurveTo(16, 2, 14, 12, 8, 10); c.lineWidth = 4.6; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(23, 4); c.bezierCurveTo(16, 2, 14, 12, 8, 10); c.lineWidth = 2; c.strokeStyle = shade(IMP_C, -0.2); c.stroke();
    paper(c, () => { c.moveTo(9, 10); c.lineTo(2, 6); c.lineTo(4, 13); c.closePath(); }, RED, { lw: 1.6, y0: 5, y1: 13 });
  }) },
  { name: 'earB', parent: 'c', at: [-7, -9], img: impEar(-0.2) },
  { name: 'body', parent: 'c', at: [0, 0], img: img(34, 32, 17, 16, (c) => {
    paper(c, () => { c.moveTo(17, 3); c.bezierCurveTo(29, 3, 31, 14, 30, 19); c.bezierCurveTo(28, 28, 22, 30, 15, 30); c.bezierCurveTo(6, 30, 3, 24, 3, 17); c.bezierCurveTo(3, 8, 9, 3, 17, 3); c.closePath(); }, IMP_C, { y0: 3, y1: 30 });
    paper(c, () => ell(c, 15, 23, 8, 5.5), shade(WING, 0.25), { lw: 1.8, y0: 18, y1: 28 });
    c.strokeStyle = shade(IMP_C, -0.3); c.lineWidth = 1.2; for (const y of [21, 24]) { c.beginPath(); c.moveTo(10, y); c.lineTo(20, y); c.stroke(); }
    paper(c, () => { c.moveTo(13, 4); c.lineTo(15, -1); c.lineTo(18, 4); }, shade(IMP_C, 0.1), { lw: 1.6, y0: -1, y1: 5 });
    shine(c, 7, 10, 9, 6, 0.4);
  }) },
  { name: 'feet', parent: 'c', at: [1, 13], behind: true, img: img(16, 8, 8, 1, (c) => {
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(4, 1); c.quadraticCurveTo(4, 6, 1.5, 6); c.moveTo(11, 1); c.quadraticCurveTo(11, 6, 8.5, 6); c.stroke();
  }) },
  { name: 'eyes', parent: 'c', at: [4, -5], img: impEyes('open') },
  { name: 'eyesShut', parent: 'c', at: [4, -5], img: impEyes('shut') },
  { name: 'eyesMad', parent: 'c', at: [4, -5], img: impEyes('mad') },
  { name: 'eyesDizzy', parent: 'c', at: [4, -5], img: impEyes('dizzy') },
  { name: 'eyesOuch', parent: 'c', at: [4, -5], img: impEyes('ouch') },
  { name: 'earF', parent: 'c', at: [0, -11], img: impEar(0) },
  { name: 'bell', parent: 'c', at: [11, 4], img: img(26, 28, 3, 14, (c) => {
    paper(c, () => { c.moveTo(2, 9.5); c.lineTo(17, 3); c.lineTo(17, 25); c.lineTo(2, 18.5); c.closePath(); }, RED, { y0: 3, y1: 25, lw: 2.4 });
    c.strokeStyle = shade(RED, -0.3); c.lineWidth = 1.2; c.beginPath(); c.moveTo(9, 7); c.lineTo(9, 21); c.stroke();
    paper(c, () => ell(c, 18, 14, 6.5, 11.5), CREAM, { lw: 2.4, y0: 2, y1: 26 });
    paper(c, () => ell(c, 19, 14, 4, 8.5), '#4a1e3a', { lw: 1.4, y0: 5, y1: 23, top: 0.1, bot: -0.3 });
    paper(c, () => ell(c, 19.5, 19, 2.6, 2.6), PINK, { lw: 1.2, y0: 16, y1: 22 });
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(16.5, 7); c.lineTo(18.5, 9.5); c.lineTo(19.5, 6.5); c.closePath(); c.fill();
  }) },
  { name: 'ring1', parent: 'bell', at: [22, 0], img: ringImg(22) },
  { name: 'ring2', parent: 'bell', at: [22, 0], img: ringImg(30, MUSTARD) },
  { name: 'ring3', parent: 'bell', at: [22, 0], img: ringImg(38) },
  { name: 'wingF', parent: 'c', at: [-1, -3], img: impWing(0) },
  { name: 'star1', parent: 'c', at: [0, -20], img: starImg('#fff3b0', 4) },
  { name: 'star2', parent: 'c', at: [0, -20], img: starImg(MUSTARD, 4) },
  { name: 'star3', parent: 'c', at: [0, -20], img: starImg('#fff3b0', 4) },
];
function rings(t: number, speed: number, reach: number, grow = 1): Pose {
  const p: Pose = {};
  ['ring1', 'ring2', 'ring3'].forEach((n, i) => { const u = fract(t * speed + i / 3), s = (0.45 + u * 0.8) * grow; p[n] = [0, u * reach, 0, s * (1 - u * 0.5), s]; });
  return p;
}
function impFlap(T: number, f: number, amp = 1): Pose {
  const s = Math.sin(T * f);
  return { wingF: [-0.3 - 0.8 * s * amp], wingB: [-0.15 - 0.7 * Math.sin(T * f - 0.4) * amp], c: [0, 0, 2.5 * Math.sin(T * f + 1.2) * amp], tail: [0.3 * Math.sin(T * 5)], earF: [0.12 * Math.sin(T * f - 1)], earB: [0.12 * Math.sin(T * f - 1.3)], feet: [0.2 * Math.sin(T * f - 1.5)] };
}
function impPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  switch (x.state) {
    case 'sleep': {
      const b = Math.sin(T * 1.6), u = fract(T * 0.55);
      p = add({ c: [Math.PI + 0.05 * Math.sin(T * 1.1), 0, 0], body: [0, 0, 0, 1 + 0.04 * b, 1 + 0.04 * b], wingF: [-1.8], wingB: [-1.65], earF: [0.15], earB: [-0.1], tail: [-0.6], feet: [0, 0, -1], bell: [0, -1, 0, 0.85, 0.85] }, only('eyesShut', IMP_EYES),
        { zz1: [0.2 * Math.sin(T * 2), 6 * u, -10 * u, 0.6 + 0.6 * u, 0.6 + 0.6 * u], zz2: [0, 2 + 6 * fract(u + 0.5), -8 - 10 * fract(u + 0.5), 0.4 + 0.5 * fract(u + 0.5), 0.4 + 0.5 * fract(u + 0.5)] });
      break;
    }
    case 'wake': {
      const k = ease.back(ramp(t, 0, 0.32));
      p = add(impFlap(T, 16, k), { c: [Math.PI * (1 - k), -2 * k, 0], bell: [0, 1 * k, 0, 1 + 0.25 * k, 1 + 0.4 * k], body: [0, 0, 0, 1 + 0.08 * k, 1 + 0.08 * k], earF: [0.4 * k], earB: [0.3 * k] },
        t < 0.12 ? only('eyesShut', IMP_EYES) : only('eyes', IMP_EYES), t > 0.12 ? rings(t, 2.6, 26) : {});
      if (t > 0.12) p.eyes = [0, 0, -1, 1.25, 1.25];
      break;
    }
    case 'windup': {
      const k = ease.out(ramp(t, 0, 0.35)), tr = Math.sin(T * 60) * ramp(t, 0.2, 0.45);
      p = add(impFlap(T, 18, 0.6), { c: [-0.4 * k, -6 * k + tr, -3 * k], body: [0, 0, 0, 1 + 0.28 * k, 1 + 0.24 * k], bell: [0.2 * k, -1 * k, 0, 0.8, 0.8], wingF: [0.9 * k], wingB: [0.8 * k], earF: [-0.4 * k], earB: [-0.4 * k] }, only('eyesMad', IMP_EYES));
      break;
    }
    case 'attack': {
      const k = ease.out(ramp(t, 0, 0.07));
      p = add({ c: [0.6 * k, 6 * k, 2 * k, 1 + 0.12 * k, 1 - 0.08 * k], wingF: [1.35 * k + Math.sin(T * 40) * 0.08], wingB: [1.2 * k], earF: [-0.7 * k], earB: [-0.7 * k], tail: [-0.5 * k], bell: [0, 1.5 * k, 0, 1.1, 1.3] }, only('eyesMad', IMP_EYES), rings(t, 3.5, 30, 0.9));
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [-0.5 * k, -4 * k, 0, 1 + 0.15 * k, 1 - 0.15 * k], wingF: [0.9 * k], wingB: [0.9 * k], earF: [-0.5 * k], earB: [-0.5 * k], bell: [-0.3 * k] }, only('eyesOuch', IMP_EYES));
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 3);
      p = add(impFlap(T, 6, 0.35), { c: [0.25 * w, 0, 4 + 2 * Math.sin(T * 2.2)], wingF: [0.4], wingB: [0.5], earF: [0.6 + 0.2 * w], earB: [0.5 - 0.2 * w], bell: [0.4, 0, 1, 0.9, 0.9] }, only('eyesDizzy', IMP_EYES), orbit(['star1', 'star2', 'star3'], T, 13, 4));
      break;
    }
    case 'dead': {
      const k = ease.in(ramp(t, 0, 0.32));
      p = add({ c: [k * 9, 0, 6 * k, 1 - 0.7 * k, 1 - 0.7 * k], wingF: [1.2 * k], wingB: [1.2 * k], earF: [0.8 * k], earB: [0.8 * k] }, only('eyesDizzy', IMP_EYES));
      break;
    }
    case 'move': p = add(impFlap(T, 15), only('eyes', IMP_EYES)); break;
    default: p = add(impFlap(T, 11, 0.8), only('eyes', IMP_EYES));
  }
  return fx(p, IMP_FX);
}

// ================================================================== DUP (Duplicate Frame): a nervous photocopied, stamped letter
const SHEET = '#fbf4e4', GHOST = '#bfe0ee';
const DUP_FACES = ['face', 'faceScared', 'faceDizzy', 'faceOuch'];
const DUP_FX = ['sweat', 'star1', 'star2', 'star3', ...DUP_FACES];
function sheetPath(c: CanvasRenderingContext2D): void { c.moveTo(10, 3); c.lineTo(33, 3); c.quadraticCurveTo(35, 21, 33, 39); c.lineTo(4, 39); c.quadraticCurveTo(2, 21, 4, 9); c.closePath(); }
function dupFace(kind: 'calm' | 'scared' | 'dizzy' | 'ouch'): Img {
  return img(30, 24, 15, 10, (c) => {
    if (kind === 'calm' || kind === 'scared') {
      const s = kind === 'scared';
      const r1 = s ? 6.4 : 5.6, r2 = s ? 7 : 6.2;
      c.beginPath(); ell(c, 8, 10, r1, r1 * 1.12); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      c.beginPath(); ell(c, 22, 9.5, r2, r2 * 1.12); c.fillStyle = '#fff'; c.fill(); c.stroke();
      const pr = s ? 1.7 : 2.4;
      c.fillStyle = INK; c.beginPath(); ell(c, 9.5, 11, pr, pr * 1.15); c.fill(); c.beginPath(); ell(c, 23.5, 10.5, pr, pr * 1.15); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); ell(c, 10.1, 10.2, 0.7, 0.7); c.fill(); c.beginPath(); ell(c, 24.1, 9.7, 0.7, 0.7); c.fill();
      c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(3, s ? 1.5 : 2.5); c.quadraticCurveTo(7, s ? 0 : 1.5, 11, 3); c.moveTo(19, 2.5); c.quadraticCurveTo(23, s ? -0.5 : 1, 27, s ? 1 : 2); c.stroke();
      c.lineWidth = 1.8; c.beginPath();
      if (s) { c.moveTo(10, 20); for (let i = 1; i <= 6; i++) c.lineTo(10 + i * 1.7, 20 + (i % 2 ? -1.6 : 0)); }
      else { c.moveTo(11, 20); c.bezierCurveTo(13, 18.5, 15, 21.5, 17, 20); c.bezierCurveTo(18.5, 19, 19.5, 20, 20.5, 19.5); }
      c.stroke();
    } else if (kind === 'dizzy') {
      spiralEye(c, 8, 10, 5.6); spiralEye(c, 22, 9.5, 6.2);
      c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(10, 20); c.bezierCurveTo(13, 17, 15, 23, 18, 20); c.bezierCurveTo(19.5, 18.5, 20.5, 20, 21.5, 19.5); c.stroke();
    } else {
      squint(c, 8, 10, 4.8, 1); squint(c, 22, 9.5, 5.2, -1);
      paper(c, () => ell(c, 15.5, 19.5, 3, 2.8), '#7a2233', { lw: 1.8, y0: 16, y1: 23 });
    }
  });
}
function accordion(len: number, w: number, foot: boolean, dark: number): Img {
  return img(w + 10, len + 8, (w + 10) / 2, 1, (c) => {
    const cx = (w + 10) / 2, n = 4, step = len / n;
    c.beginPath(); c.moveTo(cx, 0);
    for (let i = 1; i <= n; i++) c.lineTo(cx + (i % 2 ? w / 2 : -w / 2), i * step - step / 2), c.lineTo(cx, i * step);
    c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.lineWidth = 2.2; c.strokeStyle = shade(SHEET, dark - 0.05); c.stroke();
    if (foot) paper(c, () => { c.moveTo(cx - 3.5, len + 1); c.lineTo(cx + 3, len + 1); c.quadraticCurveTo(cx + 8, len + 1, cx + 8, len + 5.5); c.lineTo(cx - 3.5, len + 5.5); c.closePath(); }, shade(RED, dark), { lw: 2, y0: len, y1: len + 6 });
    else paper(c, () => ell(c, cx, len + 2.5, 3.2, 3.2), shade(SHEET, dark), { lw: 1.8, y0: len - 1, y1: len + 6 });
  });
}
const DUP: PartDef[] = [
  { name: 'c', at: [0, -22] },
  { name: 'ghost', parent: 'c', at: [0, 14], img: img(38, 42, 18, 39, (c) => {
    c.beginPath(); sheetPath(c); c.fillStyle = GHOST; c.fill();
    c.setLineDash([3.5, 2.5]); c.lineWidth = 2.2; c.strokeStyle = shade(GHOST, -0.45); c.stroke(); c.setLineDash([]);
    c.fillStyle = shade(GHOST, -0.3); c.beginPath(); ell(c, 15, 18, 4.5, 5); ell(c, 27, 17.5, 5, 5.5); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); ell(c, 16, 18.5, 1.6, 1.6); ell(c, 28, 18, 1.8, 1.8); c.fill();
  }) },
  { name: 'legB', parent: 'c', at: [-5, 13], img: accordion(9, 6, true, -0.2) },
  { name: 'legF', parent: 'c', at: [7, 13], img: accordion(9, 6, true, 0) },
  { name: 'sheet', parent: 'c', at: [0, 15], img: img(38, 42, 18, 39, (c) => {
    paper(c, sheetPath.bind(null, c), SHEET, { y0: 3, y1: 39, top: 0.1, bot: -0.1 });
    paper(c, () => { c.moveTo(10, 3); c.lineTo(4, 9); c.lineTo(11, 10); c.closePath(); }, shade(SHEET, -0.12), { lw: 2, y0: 3, y1: 10 });   // dog-ear
    c.strokeStyle = 'rgba(29,26,51,0.22)'; c.lineWidth = 1.6;                                                                          // copied text
    for (const [y, w] of [[31, 20], [34.5, 23], [37, 12]] as const) { c.beginPath(); c.moveTo(7, y); c.lineTo(7 + w, y); c.stroke(); }
    c.fillStyle = 'rgba(29,26,51,0.08)'; c.fillRect(5, 4, 3, 33);                                                                     // copier streak
    // the stamp (perforated edge) and a wavy postmark
    c.save(); c.translate(27, 9); c.rotate(0.08);
    c.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24, side = Math.floor(a * 4), f = a * 4 - side; const pts = [[-5, -5.5], [5, -5.5], [5, 5.5], [-5, 5.5], [-5, -5.5]]; const A = pts[side], B = pts[side + 1] ?? pts[0]; const px = A[0] + (B[0] - A[0]) * f, py = A[1] + (B[1] - A[1]) * f; const k = i % 2 ? 0.8 : 1.1; if (i) c.lineTo(px * k, py * k); else c.moveTo(px * k, py * k); }
    c.closePath(); c.fillStyle = RED; c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = CREAM; c.beginPath(); rr(c, -3, -3.5, 6, 7, 1); c.fill();
    c.fillStyle = RED; c.beginPath(); c.moveTo(-1.8, 2); c.lineTo(0, -2); c.lineTo(1.8, 2); c.closePath(); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(47,59,120,0.75)'; c.lineWidth = 1.2; c.beginPath(); ell(c, 21, 12, 5, 5); c.stroke();
    c.beginPath(); for (const y of [9.5, 12, 14.5]) { c.moveTo(24, y); c.bezierCurveTo(27, y - 1.5, 29, y + 1.5, 33, y); } c.stroke();
    shine(c, 6, 14, 6, 26, 0.6);
  }) },
  { name: 'armB', parent: 'sheet', at: [-14, -17], behind: true, img: accordion(8, 5, false, -0.2) },
  { name: 'face', parent: 'sheet', at: [0, -19], img: dupFace('calm') },
  { name: 'faceScared', parent: 'sheet', at: [0, -19], img: dupFace('scared') },
  { name: 'faceDizzy', parent: 'sheet', at: [0, -19], img: dupFace('dizzy') },
  { name: 'faceOuch', parent: 'sheet', at: [0, -19], img: dupFace('ouch') },
  { name: 'armF', parent: 'sheet', at: [15, -17], img: accordion(8, 5, false, 0) },
  { name: 'sweat', parent: 'sheet', at: [-13, -30], img: dropImg(2.6, '#bfe9ff') },
  { name: 'star1', parent: 'sheet', at: [0, -46], img: starImg('#fff3b0', 4) },
  { name: 'star2', parent: 'sheet', at: [0, -46], img: starImg(MUSTARD, 4) },
  { name: 'star3', parent: 'sheet', at: [0, -46], img: starImg('#fff3b0', 4) },
];
function dupPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  const jit = Math.sin(T * 37) * 0.5 + Math.sin(T * 23) * 0.3;
  const ghostDrift: T5 = [0.05 * Math.sin(T * 5), -5 + Math.sin(T * 7) * 1.5, -2 + Math.sin(T * 9) * 0.8];
  switch (x.state) {
    case 'move': {
      const ph = T * 12, s = Math.sin(ph);
      p = { c: [0.09 * s, jit * 0.4, -Math.abs(Math.cos(ph)) * 3], legF: [-0.6 * s, 0, 0, 1, 1 - 0.18 * Math.max(0, Math.cos(ph))], legB: [0.6 * s, 0, 0, 1, 1 - 0.18 * Math.max(0, -Math.cos(ph))],
        sheet: [-0.05 * s, 0, 0, 1 + 0.05 * Math.sin(2 * ph), 1 - 0.04 * Math.sin(2 * ph)], armF: [-0.5 * s - 0.2], armB: [0.5 * s + 0.2], ghost: [0.1 * Math.sin(ph - 1), -6 - 3 * Math.sin(ph - 1.2), -2 + 1.5 * Math.cos(ph)], face: [0, 0, 0, 1, 1] };
      break;
    }
    case 'windup': {
      const k = ease.out(ramp(t, 0, 0.3)), sh = Math.sin(T * 75) * 1.4 * (0.4 + 0.6 * k);
      p = add({ c: [0, sh, 3 * k], sheet: [-0.12 * k, 0, 0, 1 + 0.07 * k, 1 - 0.09 * k], armF: [-2.4 * k + Math.sin(T * 40) * 0.2], armB: [-2.2 * k - Math.sin(T * 40) * 0.2], legF: [-0.2 * k], legB: [0.25 * k],
        ghost: [-0.25 * k, -15 * k + Math.sin(T * 30) * 1.5, -9 * k], sweat: [0, -2 * fract(t * 2.5), 7 * fract(t * 2.5), 1, 1] }, only('faceScared', DUP_FACES));
      break;
    }
    case 'attack': {
      const u = ramp(t, 0, 0.22), arc = Math.sin(Math.PI * u), land = ramp(t, 0.2, 0.32);
      p = add({ c: [0.35 * arc, 7 * u, -12 * arc + 2 * Math.sin(Math.PI * land)], sheet: [0, 0, 0, 1 - 0.1 * arc + 0.15 * Math.sin(Math.PI * land), 1 + 0.12 * arc - 0.15 * Math.sin(Math.PI * land)],
        legF: [0.6 * arc], legB: [0.8 * arc], armF: [-1.6 * arc], armB: [-1.2 * arc], ghost: [0.2 * arc, -10 * arc - 4, 4 * arc] }, only('faceScared', DUP_FACES));
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [-0.15 * k, -3 * k], sheet: [0, 0, 0, 1 + 0.18 * k, 1 - 0.2 * k], armF: [-2 * k], armB: [-2.2 * k], ghost: [0, -14 * k, -4 * k] }, only('faceOuch', DUP_FACES));
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 3.5);
      p = add({ c: [0.22 + 0.05 * w, 0, 1], sheet: [0.05 * Math.sin(T * 6), 0, 0, 1, 0.96], armF: [0.5 + 0.2 * w], armB: [0.6 - 0.2 * w], legF: [-0.25], legB: [0.2], ghost: [-0.3 + 0.1 * w, -12 + 2 * w, -6] },
        only('faceDizzy', DUP_FACES), orbit(['star1', 'star2', 'star3'], T, 14, 4));
      break;
    }
    case 'dead': {
      const k = ease.in(ramp(t, 0, 0.32));
      p = add({ c: [k * 2.5, 0, 10 * k, Math.cos(k * 12) * (1 - 0.5 * k), 1 - 0.7 * k], ghost: [-0.6 * k, -20 * k, -10 * k], armF: [-1.5 * k], armB: [-1.5 * k] }, only('faceDizzy', DUP_FACES));
      break;
    }
    default: {
      const b = Math.sin(T * 3.2);
      p = add({ c: [0, jit * 0.5, 0], sheet: [0.04 * b, 0, 0, 1 - 0.015 * b, 1 + 0.025 * b], armF: [-0.25 + 0.15 * Math.sin(T * 5)], armB: [0.2 - 0.15 * Math.sin(T * 5)], ghost: ghostDrift }, only('face', DUP_FACES));
    }
  }
  return fx(p, DUP_FX);
}

// ================================================================== HUB HOG (area 1 boss): a shouting hub with eight ports
const HOG = '#5f8fc0', HOG_D = '#3f5f94', SNOUT = '#f2a0ae';
const HOG_EYES = ['eyesX', 'eyesSpin', 'eyesShut'];
const LEDS = ['led0', 'led1', 'led2', 'led3', 'led4', 'led5', 'led6', 'led7'];
const PORTS: [number, number][] = [];
for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) PORTS.push([60 + i * 23, 70 + r * 22]);
const HOG_FX = [...HOG_EYES, 'cheek', 'cracks', 'steamB', 'steamF', 'ring1', 'ring2', 'ring3', 'spark0', 'spark1', 'spark2', 'star1', 'star2', 'star3', 'dustB', 'dustF', 'dustB2', 'dustF2'];
function hogLeg(dark: number): Img {
  return img(36, 46, 18, 8, (c) => {
    paper(c, () => rr(c, 6, 1, 24, 32, 11), shade(HOG, dark), { y0: 1, y1: 33 });
    paper(c, () => { c.moveTo(5, 28); c.lineTo(31, 28); c.lineTo(32, 42); c.lineTo(4, 42); c.closePath(); }, shade(NAVY, dark), { y0: 28, y1: 42 });
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(19, 33); c.lineTo(19, 42); c.stroke();
    c.fillStyle = shade(MUSTARD, dark); c.fillRect(5.5, 28.5, 25, 3);
  });
}
function hogEar(dark: number): Img {
  return img(60, 62, 26, 58, (c) => {
    paper(c, () => { c.moveTo(8, 58); c.bezierCurveTo(2, 34, 18, 10, 46, 3); c.bezierCurveTo(52, 24, 50, 46, 44, 58); c.closePath(); }, shade(HOG, dark), { y0: 3, y1: 58 });
    const x = 28, y = 38;
    paper(c, () => ell(c, x, y, 15, 15), shade(NAVY, dark), { lw: 2.6, y0: 23, y1: 53 });
    paper(c, () => ell(c, x, y, 11.5, 11.5), shade('#e9dcc0', dark), { lw: 2, y0: 27, y1: 50, top: 0.15, bot: -0.25 });
    c.strokeStyle = shade('#b8a882', dark); c.lineWidth = 1.2; c.beginPath(); ell(c, x, y, 8, 8); c.stroke();
    paper(c, () => ell(c, x, y, 4.5, 4.5), shade(NAVY, dark + 0.1), { lw: 1.8, y0: 33, y1: 43 });
    shine(c, x - 6, y - 5, x - 2, y - 8, 0.6, 2);
    for (const a of [0.5, 2.1, 3.7, 5.2]) { c.fillStyle = shade(MUSTARD, dark); c.beginPath(); ell(c, x + Math.cos(a) * 13.3, y + Math.sin(a) * 13.3, 1.3, 1.3); c.fill(); }
  });
}
function hogEyes(kind: 'x' | 'spin' | 'shut'): Img {
  return img(52, 30, 26, 15, (c) => {
    paper(c, () => { ell(c, 15, 15, 12, 12); }, HOG, { lw: 0.01, y0: 0, y1: 30, top: 0.05, bot: 0 });
    paper(c, () => { ell(c, 37, 14, 11, 11); }, HOG, { lw: 0.01, y0: 0, y1: 30, top: 0.05, bot: 0 });
    if (kind === 'x') { xEye(c, 15, 15, 8); xEye(c, 37, 14, 7.4); }
    else if (kind === 'shut') { squint(c, 15, 15, 8, 1); squint(c, 37, 14, 7.4, -1); }
    else { spiralEye(c, 15, 15, 9.4); spiralEye(c, 37, 14, 8.6); }
  });
}
const HOG_PARTS: PartDef[] = [
  { name: 'c', at: [0, -80] },
  { name: 'legBB', parent: 'c', at: [-62, 44], img: hogLeg(-0.25) },
  { name: 'legFB', parent: 'c', at: [38, 44], img: hogLeg(-0.25) },
  { name: 'body', parent: 'c', at: [-10, 0], img: img(184, 136, 92, 68, (c) => {
    // a ridge of bristles along the spine
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.12 + i * 0.085), x = 92 + Math.cos(a) * 84, y = 72 + Math.sin(a) * 60;
      const nx = Math.cos(a), ny = Math.sin(a) * 1.3;
      paper(c, () => { c.moveTo(x - ny * 8 - nx * 4, y + nx * 8 - ny * 4); c.lineTo(x + nx * 14 + 2, y + ny * 12 - 3); c.lineTo(x + ny * 8 - nx * 4, y - nx * 8 - ny * 4); c.closePath(); }, HOG_D, { lw: 2.4, y0: 0, y1: 40 });
    }
    paper(c, () => ell(c, 92, 72, 86, 60), HOG, { y0: 12, y1: 132 });
    c.save(); c.beginPath(); ell(c, 92, 72, 86, 60); c.clip();
    c.fillStyle = shade(HOG, 0.28); c.beginPath(); ell(c, 96, 128, 70, 22); c.fill();                       // pale belly
    c.restore();
    paper(c, () => rr(c, 44, 54, 106, 50, 12), '#f3e6c8', { y0: 54, y1: 104, top: 0.1, bot: -0.15 });         // the port panel
    for (const [x, y] of PORTS) {
      paper(c, () => ell(c, x, y, 8, 8), NAVY, { lw: 2.2, y0: y - 8, y1: y + 8 });
      c.fillStyle = INK; c.beginPath(); ell(c, x, y + 0.5, 4.3, 4.3); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); ell(c, x - 3, y - 3.5, 1.6, 1.2); c.fill();
      c.fillStyle = '#2b3a33'; c.beginPath(); ell(c, x + 9.5, y - 7, 2.6, 2.6); c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
    }
    c.fillStyle = INK; for (const [x, y] of [[50, 60], [144, 60], [50, 98], [144, 98]]) { c.beginPath(); ell(c, x, y, 1.6, 1.6); c.fill(); }
    // a postal label stuck on the rump
    c.save(); c.translate(30, 52); c.rotate(-0.25);
    paper(c, () => rr(c, -11, -8, 22, 16, 2), '#fffaf0', { lw: 1.8, y0: -8, y1: 8, top: 0, bot: -0.06 });
    c.fillStyle = RED; c.fillRect(-10.2, -7.2, 20.4, 3.4); c.fillStyle = INK; c.fillRect(-8, -1, 13, 1.2); c.fillRect(-8, 2.5, 9, 1.2);
    c.restore();
    shine(c, 30, 40, 60, 22, 0.35, 3.5);
  }) },
  { name: 'cracks', parent: 'body', at: [0, 0], img: img(184, 136, 92, 68, (c) => {
    c.strokeStyle = INK; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(120, 18); c.lineTo(114, 30); c.lineTo(122, 36); c.lineTo(116, 50); c.moveTo(114, 30); c.lineTo(106, 33); c.stroke();
    c.beginPath(); c.moveTo(20, 86); c.lineTo(32, 90); c.lineTo(30, 100); c.lineTo(40, 106); c.stroke();
    c.save(); c.translate(70, 34); c.rotate(0.5); paper(c, () => rr(c, -12, -4, 24, 8, 1), '#efd99a', { lw: 1.5, y0: -4, y1: 4 }); c.restore();
    c.save(); c.translate(70, 34); c.rotate(-0.5); paper(c, () => rr(c, -12, -4, 24, 8, 1), '#efd99a', { lw: 1.5, y0: -4, y1: 4 }); c.restore();
  }) },
  ...LEDS.map((n, i): PartDef => ({ name: n, parent: 'body', at: [PORTS[i][0] + 9.5 - 92, PORTS[i][1] - 7 - 68], img: img(10, 10, 5, 5, (c) => {
    c.fillStyle = 'rgba(140,255,170,0.45)'; c.beginPath(); ell(c, 5, 5, 4.8, 4.8); c.fill();
    c.fillStyle = i % 3 === 2 ? '#ffd23f' : '#5dff8a'; c.beginPath(); ell(c, 5, 5, 2.6, 2.6); c.fill(); c.lineWidth = 1.1; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); ell(c, 4.2, 4.2, 0.8, 0.8); c.fill();
  }) })),
  { name: 'spark0', parent: 'body', at: [PORTS[1][0] - 92, PORTS[1][1] - 68], img: sparkImg(10) },
  { name: 'spark1', parent: 'body', at: [PORTS[6][0] - 92, PORTS[6][1] - 68], img: sparkImg(9, '#bff4ff') },
  { name: 'spark2', parent: 'body', at: [PORTS[3][0] - 92, PORTS[3][1] - 68], img: sparkImg(8) },
  { name: 'tail', parent: 'body', at: [-84, -6], behind: true, img: img(50, 44, 44, 16, (c) => {
    const path = () => { c.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60, a = u * Math.PI * 5; const x = 44 - u * 30 - Math.sin(a) * 7, y = 16 + u * 6 - Math.cos(a) * 7 + 7; if (i) c.lineTo(x, y); else c.moveTo(x, y); } };
    path(); c.lineWidth = 7.5; c.strokeStyle = INK; c.stroke(); path(); c.lineWidth = 3.6; c.strokeStyle = MUSTARD; c.stroke();
    paper(c, () => ell(c, 13, 26, 4.5, 4.5), RED, { lw: 2, y0: 21, y1: 31 });
  }) },
  { name: 'legBF', parent: 'c', at: [-46, 46], img: hogLeg(0) },
  { name: 'legFF', parent: 'c', at: [54, 46], img: hogLeg(0) },
  { name: 'head', parent: 'body', at: [64, -14], img: img(128, 112, 30, 80, (c) => {
    blob(c, () => { ell(c, 58, 54, 46, 42); ell(c, 72, 78, 36, 20); }, HOG, { y0: 12, y1: 98, lw: 3 });
    c.save(); c.beginPath(); ell(c, 58, 54, 46, 42); ell(c, 72, 78, 36, 20); c.clip();
    c.fillStyle = shade(HOG, 0.25); c.beginPath(); ell(c, 76, 98, 40, 14); c.fill(); c.restore();
    // snout: a short pink cylinder with a round front and two round nostrils
    paper(c, () => { c.moveTo(94, 50); c.lineTo(108, 46); c.lineTo(108, 82); c.lineTo(94, 78); c.closePath(); }, shade(SNOUT, -0.1), { y0: 46, y1: 82 });
    paper(c, () => ell(c, 109, 64, 12, 18), SNOUT, { y0: 46, y1: 82 });
    c.fillStyle = '#5a1d2e'; c.beginPath(); ell(c, 106, 57, 3.2, 5); ell(c, 113, 70, 3, 4.6); c.fill();
    shine(c, 104, 50, 110, 48, 0.6, 2);
    madEye(c, 66, 44, 10, HOG, 0.32, 0.45, 0.2);
    madEye(c, 88, 41, 9, HOG, -0.32, 0.45, 0.2);
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(50, 82); c.quadraticCurveTo(76, 90, 100, 80); c.stroke();     // upper lip
    shine(c, 22, 50, 28, 30, 0.35, 3);
  }) },
  { name: 'jaw', parent: 'head', at: [22, 2], behind: true, img: img(90, 52, 8, 10, (c) => {
    paper(c, () => { c.moveTo(4, 8); c.lineTo(78, -2); c.lineTo(82, 22); c.lineTo(8, 22); c.closePath(); }, '#5a1d2e', { lw: 2.4, y0: 0, y1: 22, top: 0.05, bot: -0.2 });
    paper(c, () => { c.moveTo(3, 10); c.quadraticCurveTo(8, 36, 40, 42); c.quadraticCurveTo(70, 44, 80, 22); c.lineTo(78, 18); c.quadraticCurveTo(44, 22, 6, 10); c.closePath(); }, HOG, { y0: 10, y1: 44 });
    paper(c, () => ell(c, 44, 21, 18, 5), '#e86f86', { lw: 2, y0: 16, y1: 26 });
    for (const x of [26, 36, 50, 60]) paper(c, () => { c.moveTo(x - 3, 20.5); c.lineTo(x, 15.5); c.lineTo(x + 3, 20.5); c.closePath(); }, '#fffaf0', { lw: 1.4, y0: 15, y1: 21 });
    paper(c, () => { c.moveTo(66, 21); c.quadraticCurveTo(66, 6, 74, 2); c.quadraticCurveTo(73, 12, 74, 20); c.closePath(); }, '#fff6df', { lw: 2, y0: 2, y1: 21 });   // tusk
  }) },
  { name: 'eyesX', parent: 'head', at: [47, -37], img: hogEyes('x') },
  { name: 'eyesSpin', parent: 'head', at: [47, -37], img: hogEyes('spin') },
  { name: 'eyesShut', parent: 'head', at: [47, -37], img: hogEyes('shut') },
  { name: 'brows', parent: 'head', at: [48, -52], img: img(56, 18, 28, 9, (c) => {
    paper(c, () => { c.moveTo(3, 4); c.quadraticCurveTo(14, 2, 24, 13); c.lineTo(22, 16); c.quadraticCurveTo(12, 9, 3, 9); c.closePath(); }, HOG_D, { lw: 2.2, y0: 2, y1: 16 });
    paper(c, () => { c.moveTo(53, 4); c.quadraticCurveTo(42, 2, 33, 12); c.lineTo(35, 15); c.quadraticCurveTo(44, 9, 53, 9); c.closePath(); }, HOG_D, { lw: 2.2, y0: 2, y1: 16 });
  }) },
  { name: 'cheek', parent: 'head', at: [50, -14], img: img(60, 20, 30, 10, (c) => {
    blush(c, 14, 10, 10, 6, 0.55); blush(c, 46, 9, 7, 5, 0.5);
    c.strokeStyle = 'rgba(200,40,60,0.6)'; c.lineWidth = 1.4; c.beginPath(); for (const x of [9, 13, 17]) { c.moveTo(x, 7); c.lineTo(x - 2, 13); } c.stroke();
  }) },
  { name: 'earB', parent: 'head', at: [8, -58], behind: true, img: hogEar(-0.2) },
  { name: 'crown', parent: 'head', at: [30, -76], img: img(36, 26, 18, 22, (c) => {
    paper(c, () => { c.moveTo(4, 22); c.lineTo(3, 6); c.lineTo(10, 13); c.lineTo(17, 2); c.lineTo(23, 12); c.lineTo(31, 9); c.lineTo(33, 22); c.closePath(); }, MUSTARD, { y0: 2, y1: 22, lw: 2.4 });
    c.strokeStyle = shade(MUSTARD, -0.35); c.lineWidth = 1.2; c.beginPath(); c.moveTo(22, 13); c.lineTo(24, 18); c.stroke();
    paper(c, () => ell(c, 17, 16, 2.6, 2.6), RED, { lw: 1.4, y0: 13, y1: 19 });
    paper(c, () => ell(c, 8.5, 17, 1.8, 1.8), TEAL, { lw: 1.2, y0: 15, y1: 19 });
    paper(c, () => ell(c, 26.5, 17, 1.8, 1.8), TEAL, { lw: 1.2, y0: 15, y1: 19 });
  }) },
  { name: 'earF', parent: 'head', at: [36, -62], img: hogEar(0) },
  { name: 'steamB', parent: 'head', at: [10, -70], img: puffImg(9) },
  { name: 'steamF', parent: 'head', at: [62, -72], img: puffImg(8) },
  { name: 'ring1', parent: 'head', at: [94, 6], img: ringImg(44) },
  { name: 'ring2', parent: 'head', at: [94, 6], img: ringImg(60, MUSTARD) },
  { name: 'ring3', parent: 'head', at: [94, 6], img: ringImg(76) },
  { name: 'star1', parent: 'head', at: [26, -96], img: starImg('#fff3b0', 7) },
  { name: 'star2', parent: 'head', at: [26, -96], img: starImg(MUSTARD, 7) },
  { name: 'star3', parent: 'head', at: [26, -96], img: starImg('#fff3b0', 7) },
  { name: 'dustB', at: [-90, -10], img: puffImg(12, '#efe2c6') },
  { name: 'dustB2', at: [-60, -8], img: puffImg(10, '#efe2c6') },
  { name: 'dustF', at: [80, -10], img: puffImg(12, '#efe2c6') },
  { name: 'dustF2', at: [110, -8], img: puffImg(10, '#efe2c6') },
];
/** Legs in diagonal pairs (trot) at phase ph. */
function hogLegs(ph: number, amp: number, lift: number): Pose {
  const L = (n: string, o: number): T5 => { const s = Math.sin(ph + o); return [-amp * s, 0, -lift * Math.max(0, Math.cos(ph + o))]; };
  return { legFF: L('legFF', 0), legBB: L('legBB', 0.15), legFB: L('legFB', Math.PI), legBF: L('legBF', Math.PI + 0.15) };
}
function hogLeds(T: number, mode: 'on' | 'blink' | 'off' | 'wild'): Pose {
  const p: Pose = {};
  LEDS.forEach((n, i) => {
    const on = mode === 'on' ? true : mode === 'off' ? false : mode === 'wild' ? Math.sin(T * 31 + i * 7.3) > 0.2 : Math.floor(T * 5 + i * 1.7 + (i * i) % 3) % 3 !== 0;
    p[n] = on ? [0, 0, 0, 1, 1] : OFF;
  });
  return p;
}
function hogPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  const anger = clamp01(Math.max(x.phase / 2, (1 - x.hp) * 1.2));
  const mood: Pose = { brows: [0, 0, 2.2 * anger] };
  if (anger > 0.3) { mood.cheek = [0, 0, 0, 1, 1]; const u = fract(T * 1.3); mood.steamB = puff(u, -10, -30, 0.9); mood.steamF = puff(fract(u + 0.5), 8, -32, 0.9); }
  if (x.phase >= 2 || x.hp < 0.34) mood.cracks = [0, 0, 0, 1, 1];
  const br = Math.sin(T * (2.2 + anger * 1.6));
  const idle: Pose = { body: [0, 0, 0, 1 + 0.025 * br, 1 + 0.035 * br], c: [0, 0, -1.5 * br], head: [0.03 * Math.sin(T * 2.2 - 0.6)], jaw: [0.06 + 0.06 * Math.max(0, br)],
    earF: [0.06 * Math.sin(T * 2.2 - 1.2)], earB: [-0.06 * Math.sin(T * 2.2 - 1.4)], tail: [0.15 * Math.sin(T * 3)], crown: [0.04 * Math.sin(T * 2.2 - 1)] };
  let p: Pose;
  const v = x.variant;
  switch (x.state) {
    case 'move': {
      const ph = T * 6.5, s = Math.sin(2 * ph);
      p = add(hogLegs(ph, 0.4, 6), mood, hogLeds(T, 'blink'), { c: [0.025 * Math.sin(ph), 0, -3.5 * Math.abs(Math.sin(ph))], body: [0, 0, 0, 1 - 0.02 * s, 1 + 0.025 * s], head: [0.05 * Math.sin(2 * ph - 0.8)], jaw: [0.1],
        earF: [-0.15 * Math.sin(2 * ph - 1.5)], earB: [-0.15 * Math.sin(2 * ph - 1.8)], tail: [0.25 * Math.sin(ph * 2)], crown: [0.06 * Math.sin(2 * ph - 1.2)] });
      break;
    }
    case 'windup': {
      if (v === 1) {            // belly-shout: inflate, head back, cheeks puffed
        const k = ease.io(ramp(t, 0, 0.55)), tr = Math.sin(T * 55) * 1.2 * ramp(t, 0.35, 0.7);
        p = add(mood, hogLeds(T, 'on'), { c: [0, tr, -4 * k], body: [0, 0, 0, 1 + 0.13 * k, 1 + 0.15 * k], head: [-0.28 * k, -2 * k, 0, 1 + 0.06 * k, 1 + 0.06 * k], jaw: [-0.02], earF: [0.25 * k + 0.05 * Math.sin(T * 30) * k], earB: [0.2 * k],
          legFF: [-0.1 * k], legBF: [0.1 * k], legFB: [-0.1 * k], legBB: [0.1 * k], cheek: [0, 0, 0, 1 + 0.15 * k, 1 + 0.15 * k], tail: [0.5 * k] });
      } else if (v === 2) {     // jump slam: crouch deep
        const k = ease.io(ramp(t, 0, 0.5)), tr = Math.sin(T * 50) * ramp(t, 0.4, 0.7);
        p = add(mood, idle, hogLeds(T, 'blink'), { c: [0.04 * k, tr, 13 * k], body: [0, 0, 0, 1 + 0.1 * k, 1 - 0.1 * k], head: [-0.2 * k], legFF: [-0.25 * k, 0, -2 * k, 1, 1 - 0.32 * k], legFB: [-0.2 * k, 0, -2 * k, 1, 1 - 0.32 * k],
          legBF: [0.25 * k, 0, -2 * k, 1, 1 - 0.32 * k], legBB: [0.2 * k, 0, -2 * k, 1, 1 - 0.32 * k], earF: [-0.45 * k], earB: [-0.4 * k], tail: [0.6 * k] });
      } else {                  // charge: head down, paw scrape, snort
        const k = ease.io(ramp(t, 0, 0.4)), sc = ramp(t, 0.15, 0.3), sw = Math.sin(t * 16);
        const u = fract(t * 2.7);
        p = add(mood, idle, hogLeds(T, 'blink'), { c: [0.07 * k, -3 * k, 4 * k], head: [0.28 * k, 0, 2 * k], earF: [-0.55 * k], earB: [-0.5 * k], legBF: [0.3 * k], legBB: [0.28 * k], legFB: [-0.15 * k],
          legFF: [(0.15 + 0.55 * sw) * sc, 0, -5 * sc * Math.max(0, Math.cos(t * 16))], dustF: sc > 0 ? puff(fract(t * 16 / (Math.PI * 2)), -20, -6, 0.8) : OFF,
          steamB: puff(u, 26, -4, 0.9), steamF: [0, 0, 0, 0.001, 0.001] });
        p.steamB = [0, 74 + 30 * u, 66 - 4 * u, 0.5 + 0.5 * u, 0.5 + 0.5 * u];        // snorts from the nostrils
      }
      break;
    }
    case 'attack': {
      if (v === 1) {            // belly-shout: mouth wide, sound rings
        const k = ease.back(ramp(t, 0, 0.08)), vib = Math.sin(T * 70) * 1.2;
        p = add(mood, hogLeds(T, 'wild'), rings(t, 2.4, 110, 1), { c: [0, vib, 0], body: [0, 0, 0, 1 + 0.02 * k, 1 - 0.04 * k], head: [0.1 * k, 4 * k, 0], jaw: [0.85 * k + 0.05 * Math.sin(T * 40)], earF: [-0.7 * k + 0.08 * Math.sin(T * 45)], earB: [-0.65 * k], crown: [-0.3 * k, -3 * k, -2 * k],
          legFF: [-0.2], legBF: [0.15], dustF: puff(fract(t * 2), 30, -10, 1.1), dustB: puff(fract(t * 2 + 0.5), -30, -10, 1.1), eyesShut: [0, 0, 0, 1, 1], cheek: [0, 0, 0, 1, 1] });
      } else if (v === 2) {     // jump slam: airborne tuck, then the landing
        if (!x.grounded) {
          p = add(mood, hogLeds(T, 'on'), { c: [-0.08, 0, -6], body: [0, 0, 0, 0.95, 1.07], head: [-0.15], jaw: [0.4], legFF: [-0.7, 0, -4, 1, 0.85], legFB: [-0.6, 0, -4, 1, 0.85], legBF: [0.7, 0, -4, 1, 0.85], legBB: [0.6, 0, -4, 1, 0.85],
            earF: [-0.75], earB: [-0.7], tail: [0.8], crown: [-0.2, 0, -4] });
        } else {
          const k = ramp(t, 0, 0.06), r = ease.out(ramp(t, 0.06, 0.4)), sq = k * (1 - r), wob = Math.sin(t * 30) * (1 - r);
          const d = ramp(t, 0, 0.45);
          p = add(mood, hogLeds(T, 'wild'), { c: [0, 0, 16 * sq], body: [0, 0, 0, 1 + 0.18 * sq, 1 - 0.18 * sq], head: [0.2 * sq], jaw: [0.5 * sq], legFF: [-0.45 * sq, 0, 0, 1, 1 - 0.3 * sq], legFB: [-0.4 * sq, 0, 0, 1, 1 - 0.3 * sq], legBF: [0.45 * sq, 0, 0, 1, 1 - 0.3 * sq], legBB: [0.4 * sq, 0, 0, 1, 1 - 0.3 * sq],
            earF: [0.5 * wob], earB: [0.45 * wob], crown: [0.3 * wob, 0, -4 * wob], tail: [0.6 * wob],
            dustF: [0, 30 * d, -8 * d, 0.6 + 1.2 * d, 0.6 + 1.0 * d], dustF2: [0, 40 * d, -4 * d, 0.5 + 0.9 * d, 0.5 + 0.8 * d], dustB: [0, -30 * d, -8 * d, 0.6 + 1.2 * d, 0.6 + 1.0 * d], dustB2: [0, -40 * d, -4 * d, 0.5 + 0.9 * d, 0.5 + 0.8 * d] });
        }
      } else {                  // charge: a head-down gallop
        const ph = T * 15, u = fract(t * 3);
        p = add(mood, hogLeds(T, 'wild'), hogLegs(ph, 0.75, 10), { c: [0.12, 4, -4 * Math.abs(Math.sin(ph))], body: [0, 0, 0, 1.06, 0.95], head: [0.32, 4, 3], jaw: [0.2], earF: [-0.9 + 0.1 * Math.sin(ph * 2)], earB: [-0.85], tail: [-0.6 + 0.2 * Math.sin(ph * 2)], crown: [-0.25, -2, 0],
          dustB: puff(u, -50, -14, 1.2), dustB2: puff(fract(u + 0.5), -40, -18, 1.1) });
      }
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.35));
      p = add(mood, hogLeds(T, 'wild'), { c: [-0.07 * k, -8 * k, 0], body: [0, 0, 0, 1 - 0.05 * k, 1 + 0.05 * k], head: [-0.2 * k], jaw: [0.45 * k], earF: [-0.6 * k], earB: [-0.5 * k], crown: [-0.3 * k, 0, -3 * k], eyesShut: [0, 0, 0, 1, 1], legFF: [-0.3 * k], legBF: [0.2 * k] });
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 2.6), fl = (o: number) => (Math.sin(T * 37 + o) > 0.3 ? [0.6 * Math.sin(T * 20 + o), 0, 0, 0.6 + 0.4 * Math.sin(T * 50 + o), 0.6 + 0.4 * Math.sin(T * 50 + o)] as T5 : OFF);
      p = add(mood, hogLeds(T, 'wild'), orbit(['star1', 'star2', 'star3'], T, 34, 9, 4), { c: [0.05 * w, 0, 6], body: [0.02 * w, 0, 0, 1.03, 0.96], head: [0.3 + 0.08 * w], jaw: [0.5 + 0.05 * w], earF: [0.9 + 0.1 * w], earB: [0.7 - 0.1 * w], crown: [0.5, 4, 2],
        tail: [0.4 * w], legFF: [-0.15, 0, 0, 1, 0.9], legFB: [-0.1, 0, 0, 1, 0.9], legBF: [0.12, 0, 0, 1, 0.9], legBB: [0.1, 0, 0, 1, 0.9], eyesSpin: [0, 0, 0, 1, 1], spark0: fl(0), spark1: fl(2), spark2: fl(4) });
      delete p.steamB; delete p.steamF; delete p.cheek;
      break;
    }
    case 'dead': {
      const k = ease.out(ramp(t, 0, 0.33));
      p = add(hogLeds(T, 'off'), { c: [0.05 * k, 0, 22 * k], body: [0, 0, 0, 1 + 0.12 * k, 1 - 0.3 * k], head: [0.6 * k, 0, 6 * k], jaw: [0.5 * k], earF: [1.3 * k], earB: [1.0 * k], crown: [1.2 * k, 14 * k, 6 * k], tail: [0.9 * k],
        legFF: [-0.7 * k, 0, 0, 1, 1 - 0.35 * k], legFB: [-0.6 * k, 0, 0, 1, 1 - 0.35 * k], legBF: [0.7 * k, 0, 0, 1, 1 - 0.35 * k], legBB: [0.6 * k, 0, 0, 1, 1 - 0.35 * k], eyesX: [0, 0, 0, 1, 1], cracks: [0, 0, 0, 1, 1],
        dustF: [0, 20 * k, 0, 0.5 + k, 0.5 + 0.8 * k], dustB: [0, -20 * k, 0, 0.5 + k, 0.5 + 0.8 * k] });
      break;
    }
    default: p = add(mood, idle, hogLeds(T, 'blink'));
  }
  return fx(p, HOG_FX);
}

// ------------------------------------------------------------------ registry
const SMALL_DEMO: [string, Partial<EnemyCtx>][] = [
  ['idle', {}], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.25 }], ['windup', { state: 'windup', t: 0.12 }], ['windup end', { state: 'windup', t: 0.45, time: 0.47 }],
  ['attack', { state: 'attack', t: 0.08 }], ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam' }], ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }],
];
export const RIGS: EnemyRig[] = [
  { kind: 'enemy', id: 'crate', name: 'תאום ההתנגשות', parts: CRATE, scale: 1, pose: cratePose, body: { w: 38, h: 40, origin: 'feet' }, demo: SMALL_DEMO },
  { kind: 'enemy', id: 'imp', name: 'שד ההד', parts: IMP, scale: 1, pose: impPose, body: { w: 30, h: 30, origin: 'center' },
    demo: [['sleep', { state: 'sleep' }], ['wake .05', { state: 'wake', t: 0.05 }], ['wake .3', { state: 'wake', t: 0.3 }], ...SMALL_DEMO] },
  { kind: 'enemy', id: 'dup', name: 'מסגרת משוכפלת', parts: DUP, scale: 1, pose: dupPose, body: { w: 34, h: 36, origin: 'feet' }, demo: SMALL_DEMO },
  { kind: 'enemy', id: 'hubhog', name: 'חזיר הרכזת', parts: HOG_PARTS, scale: 1, pose: hogPose, body: { w: 170, h: 140, origin: 'feet' }, demo: bossDemo() },
];
/** Demo list for a boss: every variant's windup and attack, and the mood at each phase. */
export function bossDemo(): [string, Partial<EnemyCtx>][] {
  return [
    ['idle', {}], ['idle phase2', { phase: 2, hp: 0.2 }], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.3 }],
    ['wind0 .2', { state: 'windup', variant: 0, t: 0.2 }], ['wind0 .6', { state: 'windup', variant: 0, t: 0.6, time: 0.62 }], ['atk0', { state: 'attack', variant: 0, t: 0.15 }],
    ['wind1 .6', { state: 'windup', variant: 1, t: 0.6 }], ['atk1', { state: 'attack', variant: 1, t: 0.15 }],
    ['wind2 .6', { state: 'windup', variant: 2, t: 0.6 }], ['atk2 air', { state: 'attack', variant: 2, t: 0.2, grounded: false }], ['atk2 land', { state: 'attack', variant: 2, t: 0.08 }],
    ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam', phase: 1, hp: 0.5 }], ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }],
  ];
}
