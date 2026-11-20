/**
 * "Beacon" (משואה): a small, plump owl lighthouse keeper in a striped woolly scarf and a knitted bobble cap, who carries a staff
 * topped with a glowing lighthouse lamp. Original design for this game. It hovers a little: the feet barely touch the ground.
 * Rig: two little feet, a round body with a tail fan, two stubby wings (the front one holds the staff), the big head with eyelids,
 * the cap and its bobble, the scarf (wrap + a tail), and the staff with its lamp, a soft glow behind the lamp and a spark in front.
 * Angles: 0 = limb hangs down; negative swings it forward (toward +x), positive backward. Upright parts (body, staff): positive leans forward.
 * The staff is posed in a WORLD angle (see `finish`): 0 = upright, +pi/2 = the lamp points straight ahead.
 * Weapon tip: the lamp is at (0, -31) in the 'staff' part (the 'glow' and 'spark' parts sit there; their scale is the flare size).
 */
import { add, ease, INK, paper, rr, ell, sample, shade, shine, type Key, type PartDef, type Pose } from '../puppet';
import type { HeroRig, RigCtx } from '../types';

const PLUME = '#8a6cb6', PLUME_D = '#5f4790', FACE = '#fbeed2', BELLY = '#f3dcb4', RED = '#e4572e', CREAM = '#fff4dc', BEAK = '#f2a33a',
  FEET = '#f2a33a', WOOD = '#b77b45', AMBER = '#ffc93c';

/** A big glowing owl eye: a warm halo, an amber iris, a dark pupil looking toward +x and a spark. */
function owlEye(c: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const h = c.createRadialGradient(x, y, r * 0.6, x, y, r * 1.75);
  h.addColorStop(0, 'rgba(255,214,90,0.55)'); h.addColorStop(1, 'rgba(255,214,90,0)');
  c.fillStyle = h; c.beginPath(); ell(c, x, y, r * 1.75, r * 1.75); c.fill();
  const g = c.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.1, x, y, r);
  g.addColorStop(0, '#fff6c2'); g.addColorStop(0.55, AMBER); g.addColorStop(1, '#ee8f1c');
  c.beginPath(); ell(c, x, y, r, r * 1.05); c.fillStyle = g; c.fill(); c.lineWidth = 2.3; c.strokeStyle = INK; c.stroke();
  c.beginPath(); ell(c, x + r * 0.22, y + r * 0.08, r * 0.5, r * 0.56); c.fillStyle = INK; c.fill();
  c.fillStyle = '#fff'; c.beginPath(); ell(c, x + r * 0.42, y - r * 0.2, r * 0.2, r * 0.22); c.fill();
  c.beginPath(); ell(c, x - r * 0.05, y + r * 0.35, r * 0.09, r * 0.09); c.fill();
}

const BODY = (c: CanvasRenderingContext2D) => ell(c, 30, 31, 27, 25.5);

export const BEACON: PartDef[] = [
  { name: 'footB', at: [-7, -7], img: foot(-0.2) },
  { name: 'footF', at: [7, -7], img: foot(0) },
  { name: 'body', at: [0, -6], z: 1, img: { w: 60, h: 60, ax: 30, ay: 54, draw: (c) => {
    paper(c, () => BODY(c), PLUME, { y0: 6, y1: 56 });
    c.save(); c.beginPath(); BODY(c); c.clip();
    paper(c, () => ell(c, 38, 38, 16, 19), BELLY, { lw: 2.2, y0: 20, y1: 56 });                          // the belly
    c.strokeStyle = shade(BELLY, -0.25); c.lineWidth = 1.3;                                                 // scalloped feathers
    for (const [x, y] of [[32, 30], [40, 30], [28, 37], [36, 37], [44, 37], [32, 44], [40, 44], [36, 50]]) { c.beginPath(); c.arc(x, y, 3, 0.2, Math.PI - 0.2); c.stroke(); }
    c.strokeStyle = shade(PLUME, -0.3); c.lineWidth = 1.4;
    for (const [x, y] of [[10, 26], [8, 34], [14, 40], [12, 47]]) { c.beginPath(); c.arc(x, y, 3.2, 0.3, Math.PI - 0.3); c.stroke(); }
    c.restore();
    shine(c, 9, 22, 7, 36, 0.3);
  } } },
  { name: 'tail', parent: 'body', at: [-23, -8], behind: true, img: { w: 22, h: 18, ax: 18, ay: 5, draw: (c) => {
    paper(c, () => { c.moveTo(20, 3); c.quadraticCurveTo(8, 2, 2, 12); c.lineTo(6, 12); c.lineTo(5, 16); c.quadraticCurveTo(13, 13, 20, 9); c.closePath(); }, PLUME_D, { lw: 2.2, y0: 2, y1: 16 });
  } } },
  { name: 'scarfTail', parent: 'body', at: [-16, -38], behind: true, img: { w: 14, h: 30, ax: 7, ay: 3, draw: (c) => {
    for (const x of [4, 7, 10]) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, 23); c.lineTo(x, 28); c.stroke(); c.strokeStyle = CREAM; c.lineWidth = 1.2; c.stroke(); }
    paper(c, () => rr(c, 2, 1, 10, 23, 4), RED, { y0: 1, y1: 24 });
    c.save(); c.beginPath(); rr(c, 2, 1, 10, 23, 4); c.clip(); c.fillStyle = CREAM; c.fillRect(0, 8, 14, 4); c.fillRect(0, 16, 14, 4); c.restore();
  } } },
  { name: 'wingB', parent: 'body', at: [-10, -34], behind: true, img: wing(-0.25) },
  // the head
  { name: 'head', parent: 'body', at: [2, -36], img: { w: 58, h: 48, ax: 29, ay: 38, draw: (c) => {
    for (const [x0, x1] of [[6, 13], [44, 51]]) {                                                         // ear tufts
      paper(c, () => { c.moveTo(x0, 14); c.lineTo(x0 + (x0 < 20 ? -3 : 4), 1); c.lineTo(x1, 11); c.closePath(); }, PLUME_D, { lw: 2.2, y0: 1, y1: 14 });
    }
    paper(c, () => ell(c, 29, 26, 23.5, 19.5), PLUME, { y0: 6, y1: 46 });
    const disc = () => { ell(c, 24, 27, 11.5, 12); ell(c, 40, 27, 10.5, 11.5); };                         // the heart-shaped face
    c.beginPath(); disc(); c.lineWidth = 4.4; c.strokeStyle = INK; c.stroke();
    const g = c.createLinearGradient(0, 15, 0, 39); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, shade(FACE, -0.1));
    c.beginPath(); disc(); c.fillStyle = g; c.fill();
    c.strokeStyle = shade(PLUME, -0.35); c.lineWidth = 2.2; c.beginPath(); c.moveTo(15, 16.5); c.quadraticCurveTo(22, 12.5, 29, 16.5); c.moveTo(33, 17); c.quadraticCurveTo(40, 13, 47, 17.5); c.stroke();   // brows
    owlEye(c, 24, 27, 7.6);
    owlEye(c, 40, 27, 6.8);
    paper(c, () => { c.moveTo(29.5, 32); c.quadraticCurveTo(33, 29.5, 36.5, 32); c.quadraticCurveTo(35.5, 37.5, 32.2, 40); c.quadraticCurveTo(29.6, 36, 29.5, 32); c.closePath(); }, BEAK, { lw: 2, y0: 30, y1: 40 });
    c.fillStyle = 'rgba(255,111,111,0.38)'; c.beginPath(); ell(c, 15, 35, 3.6, 2.4); c.fill(); c.beginPath(); ell(c, 48, 35, 3, 2.2); c.fill();
    shine(c, 11, 18, 14, 11, 0.4);
  } } },
  { name: 'lids', parent: 'head', at: [3, -20], img: { w: 36, h: 22, ax: 18, ay: 1, draw: (c) => {
    for (const [x, rx, ry] of [[13, 8.4, 17], [29, 7.6, 15.6]]) {
      c.beginPath(); c.moveTo(x - rx, 1); c.ellipse(x, 1, rx, ry, 0, 0, Math.PI); c.closePath(); c.fillStyle = FACE; c.fill();
      c.beginPath(); c.ellipse(x, 1, rx, ry, 0, 0.2, Math.PI - 0.2); c.strokeStyle = INK; c.lineWidth = 2.2; c.stroke();
    }
  } } },
  { name: 'cap', parent: 'head', at: [0, -25], img: { w: 44, h: 24, ax: 22, ay: 19, draw: (c) => {
    const dome = () => { c.moveTo(5, 19); c.bezierCurveTo(5, 6, 14, 2, 22, 2); c.bezierCurveTo(30, 2, 39, 6, 39, 19); c.closePath(); };
    paper(c, dome, RED, { y0: 2, y1: 19 });
    c.save(); c.beginPath(); dome(); c.clip(); c.fillStyle = CREAM; c.fillRect(0, 8, 44, 3.4); c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(5, 8); c.lineTo(39, 8); c.moveTo(5, 11.4); c.lineTo(39, 11.4); c.stroke();
    paper(c, () => rr(c, 3, 15, 38, 7.5, 3.6), CREAM, { lw: 2.4, y0: 15, y1: 22 });                      // ribbed brim
    c.strokeStyle = shade(CREAM, -0.3); c.lineWidth = 1; for (let x = 7; x < 40; x += 3.2) { c.beginPath(); c.moveTo(x, 16.6); c.lineTo(x, 21); c.stroke(); }
    shine(c, 11, 12, 16, 6, 0.4);
  } } },
  { name: 'bobble', parent: 'cap', at: [-1, -16], img: { w: 18, h: 18, ax: 9, ay: 13, draw: (c) => {
    paper(c, () => { for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = i % 2 ? 6 : 7.4; const x = 9 + Math.cos(a) * r, y = 8.5 + Math.sin(a) * r; if (i) c.lineTo(x, y); else c.moveTo(x, y); } c.closePath(); }, CREAM, { lw: 2.2, y0: 1, y1: 16 });
    c.fillStyle = shade(CREAM, -0.15); c.beginPath(); ell(c, 10.5, 10.5, 2.6, 2); c.fill();
  } } },
  { name: 'scarf', parent: 'body', at: [3, -37], img: { w: 52, h: 18, ax: 26, ay: 9, draw: (c) => {
    const p = () => rr(c, 3, 3, 46, 12.5, 6);
    paper(c, p, RED, { y0: 3, y1: 16 });
    c.save(); c.beginPath(); p(); c.clip();
    c.fillStyle = CREAM; for (let x = 6; x < 50; x += 10) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 5, 0); c.lineTo(x + 3, 18); c.lineTo(x - 2, 18); c.closePath(); c.fill(); }   // lighthouse stripes
    c.restore();
    c.beginPath(); p(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
    shine(c, 9, 6, 22, 6, 0.45, 1.6);
  } } },
  // the front wing and the lamp staff
  { name: 'wingF', parent: 'body', at: [8, -31], img: wing(0) },
  { name: 'staff', parent: 'wingF', at: [1, 24], behind: true, img: { w: 26, h: 66, ax: 13, ay: 46, draw: (c) => {
    paper(c, () => rr(c, 10.8, 30, 4.4, 32, 2.2), WOOD, { lw: 2.2, y0: 30, y1: 62 });                     // the pole
    paper(c, () => rr(c, 9.6, 57, 6.8, 6, 2), shade(WOOD, -0.35), { lw: 2 });
    paper(c, () => { c.moveTo(8.5, 23); c.lineTo(17.5, 23); c.lineTo(16, 33); c.lineTo(10, 33); c.closePath(); }, CREAM, { lw: 2.2, y0: 23, y1: 33 });   // the little tower
    c.save(); c.beginPath(); c.moveTo(8.5, 23); c.lineTo(17.5, 23); c.lineTo(16, 33); c.lineTo(10, 33); c.closePath(); c.clip(); c.fillStyle = RED; c.fillRect(0, 26.5, 26, 3.2); c.restore();
    const g = c.createRadialGradient(13, 15, 0.5, 13, 15, 8);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#fff0a0'); g.addColorStop(1, '#ffb52e');
    c.beginPath(); rr(c, 7, 9.5, 12, 11, 2); c.fillStyle = g; c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();   // the lantern glass
    c.strokeStyle = 'rgba(29,26,51,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(11, 10); c.lineTo(11, 20); c.moveTo(15, 10); c.lineTo(15, 20); c.stroke();
    paper(c, () => rr(c, 5, 19.5, 16, 4, 2), RED, { lw: 2, y0: 19, y1: 24 });                               // gallery
    paper(c, () => { c.moveTo(5.5, 10.5); c.quadraticCurveTo(13, -0.5, 20.5, 10.5); c.closePath(); }, RED, { lw: 2.2, y0: 2, y1: 11 });   // the roof
    paper(c, () => ell(c, 13, 3, 2, 2), shade(RED, -0.2), { lw: 1.6 });
  } } },
  { name: 'glow', parent: 'staff', at: [0, -31], behind: true, img: { w: 56, h: 56, ax: 28, ay: 28, draw: (c) => {
    const g = c.createRadialGradient(28, 28, 1, 28, 28, 28);
    g.addColorStop(0, 'rgba(255,248,200,0.9)'); g.addColorStop(0.22, 'rgba(255,222,110,0.5)'); g.addColorStop(0.55, 'rgba(255,200,80,0.12)'); g.addColorStop(1, 'rgba(255,190,64,0)');
    c.fillStyle = g; c.fillRect(0, 0, 56, 56);
  } } },
  { name: 'spark', parent: 'staff', at: [0, -31], img: { w: 44, h: 44, ax: 22, ay: 22, draw: (c) => {
    const g = c.createRadialGradient(22, 22, 0, 22, 22, 21);
    g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.35, 'rgba(255,240,160,0.7)'); g.addColorStop(1, 'rgba(255,214,90,0)');
    c.fillStyle = g; c.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 4 : 21; const x = 22 + Math.cos(a) * r, y = 22 + Math.sin(a) * r; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
    c.closePath(); c.fill();
  } } },
];

function foot(dark: number) {
  return { w: 18, h: 12, ax: 6, ay: 3.5, draw: (c: CanvasRenderingContext2D) => {
    const toes = () => { c.moveTo(6, 4); c.lineTo(14.5, 8.2); c.moveTo(6, 4); c.lineTo(10, 9); c.moveTo(6, 4); c.lineTo(2.5, 8.6); };
    c.beginPath(); toes(); c.strokeStyle = INK; c.lineWidth = 5.2; c.stroke();
    c.beginPath(); toes(); c.strokeStyle = shade(FEET, dark); c.lineWidth = 2.8; c.stroke();
    paper(c, () => ell(c, 6, 3, 4, 3.4), shade(PLUME, dark + 0.15), { lw: 2, y0: 0, y1: 6 });
  } };
}
function wing(dark: number) {
  return { w: 22, h: 34, ax: 10, ay: 4, draw: (c: CanvasRenderingContext2D) => {
    const p = () => { c.moveTo(4, 4); c.bezierCurveTo(11, -1, 19, 3, 18.5, 13); c.bezierCurveTo(18.5, 21, 16, 27, 12.5, 31); c.lineTo(11, 27); c.lineTo(8.5, 30); c.lineTo(7, 25.5); c.lineTo(4.2, 27); c.bezierCurveTo(1.5, 19, 1, 10, 4, 4); c.closePath(); };
    paper(c, p, shade(PLUME, dark), { y0: 1, y1: 31 });
    c.strokeStyle = shade(PLUME_D, dark); c.lineWidth = 1.2; c.beginPath(); c.moveTo(7, 15); c.quadraticCurveTo(11, 18, 16, 15); c.moveTo(7, 20); c.quadraticCurveTo(11, 23, 15, 20); c.stroke();
    shine(c, 6, 7, 6, 14, 0.35, 2);
  } };
}

// ------------------------------------------------------------------ animation
function finish(p: Pose, lid = 0): Pose {
  const out: Pose = { ...p };
  const v = out.staff ?? [];
  out.staff = [(v[0] ?? 0) - (out.body?.[0] ?? 0) - (out.wingF?.[0] ?? 0), v[1], v[2], v[3], v[4]];
  out.lids = [0, 0, 0, 1, Math.max(0.02, Math.min(1, lid))];
  return out;
}
function blink(t: number): number { const u = (t + 1.1) % 3.1; return u < 0.15 ? Math.sin((u / 0.15) * Math.PI) : 0; }
const S = (k: number, r = 0): [number, number, number, number, number] => [r, 0, 0, k, k];

const IDLE: Pose = { wingF: [-0.4], wingB: [0.15], staff: [0.08], cap: [-0.1] };

const ATTACK: Key[][] = [
  [ // 1: a quick forward jab, the lamp flares
    { t: 0, pose: IDLE },
    { t: 0.06, pose: { body: [-0.12, -2, -1, 0.94, 1.05], head: [-0.06], wingF: [0.7], wingB: [-0.3], staff: [-0.25, -2, 0], cap: [-0.18], bobble: [-0.3], glow: S(0.85), spark: S(0.4), footF: [0, -1, -2], footB: [0, 0, -2] }, ease: ease.out },
    { t: 0.12, pose: { body: [0.2, 4, -2, 1.1, 0.93], head: [0.06], wingF: [-1.5], wingB: [0.7], staff: [1.5, 3, 0], cap: [-0.05], bobble: [0.7], glow: S(2.1), spark: S(1.7, 0.6), footF: [-0.3, 3, -3], footB: [0.3, -1, -2], scarfTail: [0.7] }, ease: ease.in },
    { t: 0.24, pose: { body: [0.12, 3, -2, 1.03, 0.98], head: [0.03], wingF: [-1.3], wingB: [0.5], staff: [1.38, 1, 0], cap: [-0.08], bobble: [0.4], glow: S(1.45), spark: S(1.0, 1.0), footF: [-0.2, 2, -2], footB: [0.2, 0, -2], scarfTail: [0.5] }, ease: ease.out },
  ],
  [ // 2: a low wind-up and a rising jab
    { t: 0, pose: IDLE },
    { t: 0.07, pose: { body: [-0.06, -2, 2, 1.08, 0.9], head: [0.05], wingF: [0.9], wingB: [-0.2], staff: [-0.6, -2, 2], cap: [-0.15], bobble: [-0.2], glow: S(0.8), spark: S(0.4), footF: [0.2], footB: [-0.1] }, ease: ease.out },
    { t: 0.15, pose: { body: [0.12, 4, -5, 0.93, 1.1], head: [-0.1], wingF: [-2.05], wingB: [0.8], staff: [1.1, 2, -2], cap: [-0.2, 0, -1], bobble: [-0.6], glow: S(2.1), spark: S(1.7, 0.6), footF: [-0.3, 1, -2], footB: [0.3, 0, -2], scarfTail: [0.6] }, ease: ease.in },
    { t: 0.24, pose: { body: [0.08, 3, -3, 0.97, 1.04], head: [-0.05], wingF: [-1.85], wingB: [0.6], staff: [1.05, 1, -1], cap: [-0.15], bobble: [-0.2], glow: S(1.45), spark: S(1.0, 1.0), footF: [-0.2, 1, -1], footB: [0.2, 0, -1], scarfTail: [0.4] }, ease: ease.out },
  ],
  [ // 3: both wings raised (the lamp charges), then a big beam burst forward
    { t: 0, pose: IDLE },
    { t: 0.16, pose: { body: [-0.16, -2, -4, 0.92, 1.12], head: [-0.15], wingF: [-2.75], wingB: [2.6], staff: [0.05, 0, -3], cap: [-0.25], bobble: [-0.5], glow: S(1.7), spark: S(1.2, 0.8), footF: [0.25, 0, -3], footB: [0.2, 0, -3], scarfTail: [0.3] }, ease: ease.out },
    { t: 0.22, pose: { body: [0.36, 6, -1, 1.13, 0.9], head: [0.12], wingF: [-1.55], wingB: [0.9], staff: [1.55, 4, 0], cap: [0.05], bobble: [0.9], glow: S(3.3), spark: S(2.7, 1.2), footF: [-0.4, 2, -2], footB: [0.5, -2, -3], scarfTail: [1.3] }, ease: ease.in },
    { t: 0.36, pose: { body: [0.27, 5, -1, 1.06, 0.95], head: [0.08], wingF: [-1.42], wingB: [0.7], staff: [1.5, 2, 0], cap: [0], bobble: [0.5], glow: S(2.4), spark: S(1.8, 1.8), footF: [-0.3, 2, -1], footB: [0.4, -1, -2], scarfTail: [0.9] }, ease: ease.out },
  ],
];

function raw(x: RigCtx): [Pose, number] {
  const t = x.time;
  if (x.state === 'asleep') {
    const br = Math.sin(t * 1.6);
    return [{ body: [0.08, 0, 3, 1.08 + 0.02 * br, 0.9 + 0.02 * br], head: [0.2, 1, 2], cap: [0.28, 1, 1], bobble: [0.7], wingF: [-0.25], wingB: [0.1], staff: [0.5], glow: S(0.55), spark: S(0.15), scarfTail: [0.05] }, 1];
  }
  if (x.state === 'hurt') return [{ body: [-0.32, -3, -2, 0.92, 1.08], head: [-0.25], cap: [-0.45, -2, -3], bobble: [0.9], wingF: [-2.0], wingB: [2.2], staff: [-0.6], glow: S(0.6), spark: S(0.25),
    footF: [-0.5, 2, -3], footB: [0.4, 0, -2], scarfTail: [-0.5], tail: [-0.3] }, 0.55];
  if (x.state === 'dash') return [{ body: [0.5, 6, -2, 1.15, 0.88], head: [-0.25], cap: [0.05], bobble: [1.2], wingF: [-1.1], wingB: [1.7], staff: [1.55], glow: S(1.6), spark: S(1.1),
    footF: [0.7, -5, -3], footB: [0.8, -7, -3], scarfTail: [1.6], tail: [-0.3] }, 0];
  if (x.state === 'magic') {
    const k = Math.min(1, x.attackT * 5), w = Math.sin(x.attackT * 20);
    return [{ body: [0, 0, -5 * k, 1 + 0.12 * k, 1 + 0.1 * k], head: [-0.15 * k, 0, -2 * k], cap: [-0.1, 0, -1.5 * k], bobble: [0.5 * Math.sin(x.attackT * 12)], wingF: [-0.4 - 1.65 * k], wingB: [0.15 + 2.0 * k],
      staff: [0.05], glow: S(1 + 2.6 * k + 0.2 * w), spark: S(1 + 1.8 * k + 0.15 * w, x.attackT * 4), footF: [-0.2 * k, 0, -5 * k], footB: [0.2 * k, 0, -5 * k], scarfTail: [0.6 + 0.3 * w], tail: [0.2 * k] }, 0];
  }
  if (x.state === 'attack') return [sample(ATTACK[Math.max(0, Math.min(2, x.stage))], x.attackT), 0];
  if (!x.grounded) {
    const fl = Math.sin(t * 18);
    if (x.vy < 0) return [add(IDLE, { body: [0, 0, -2, 0.92, 1.1], head: [-0.08], wingF: [-1.9 + 0.2 * fl], wingB: [2.4 - 0.3 * fl], staff: [0.15], bobble: [-0.5], cap: [-0.1, 0, 1],
      footF: [-0.3, 0, -4], footB: [0.3, 0, -4], scarfTail: [0.25], tail: [0.2] }), blink(t)];
    return [add(IDLE, { body: [0, 0, 0, 1.06, 0.95], wingF: [-1.2 + 0.25 * fl], wingB: [1.6 - 0.3 * fl], staff: [0.1], bobble: [0.9], cap: [0, 0, -1.5],
      footF: [0.15, 0, 1], footB: [-0.1, 0, 1], scarfTail: [2.3], tail: [-0.4] }), blink(t)];
  }
  const sp = Math.min(1, Math.abs(x.vx) / 230);
  if (sp > 0.08) {                                                                                         // quick waddle-hops
    const p = t * 14, s = Math.sin(p), hop = Math.abs(s), f2 = Math.sin(2 * p);
    return [add(IDLE, {
      body: [0.12 * sp + 0.08 * Math.cos(p) * sp, 0, (-2 - 6 * hop) * sp, 1 + 0.05 * (1 - hop) * sp, 1 - 0.06 * (1 - hop) * sp + 0.03 * hop * sp],
      head: [-0.06 * Math.cos(p) * sp], cap: [-0.08 * sp], bobble: [0.6 * sp + 0.3 * f2],
      wingF: [-0.15 * sp + 0.15 * f2], wingB: [0.25 * sp + 0.4 * Math.max(0, f2)], staff: [0.22 * sp + 0.04 * f2],
      footF: [-0.4 * Math.sin(p) * sp, 2 * Math.cos(p) * sp, (-1 - 4 * Math.max(0, Math.cos(p))) * sp], footB: [0.4 * Math.sin(p) * sp, -2 * Math.cos(p) * sp, (-1 - 4 * Math.max(0, -Math.cos(p))) * sp],
      scarfTail: [0.9 * sp + 0.15 * f2], tail: [-0.2 * f2 * sp], glow: S(1 + 0.05 * f2),
    }), blink(t)];
  }
  const h = Math.sin(t * 3.2), fy = -2.5 - 1.8 * h;                                                          // hovering idle
  return [add(IDLE, { body: [0.02 * Math.sin(t * 1.6), 0, fy, 1 + 0.02 * h, 1 - 0.02 * h], head: [0.04 * Math.sin(t * 1.7)], cap: [0.03 * Math.sin(t * 1.7 - 0.5)], bobble: [0.25 * Math.sin(t * 3.2 - 1)],
    wingF: [0.06 * Math.sin(t * 6.4)], wingB: [0.14 * Math.sin(t * 6.4 + 0.6)], staff: [0.03 * Math.sin(t * 3.2 - 0.8)],
    footF: [0.08 * Math.sin(t * 3.2 + 0.4), 0, fy * 0.55], footB: [-0.08 * Math.sin(t * 3.2 + 0.9), 0, fy * 0.55], scarfTail: [0.1 + 0.1 * Math.sin(t * 2)], tail: [0.08 * Math.sin(t * 2.4)],
    glow: S(1 + 0.08 * Math.sin(t * 4)), spark: S(0.55 + 0.06 * Math.sin(t * 4), t * 0.6) }), blink(t)];
}

/** The pose of Beacon for what the hero is doing now. */
export function beaconPose(x: RigCtx): Pose { const [p, lid] = raw(x); return finish(p, lid); }

export const RIGS: HeroRig[] = [{
  kind: 'hero', id: 'beacon', name: 'משואה', parts: BEACON, scale: 0.9, pose: beaconPose,
  demo: [
    ['idle', {}], ['run a', { vx: 230, time: 0.12 }], ['run b', { vx: 230, time: 0.3 }], ['jump', { grounded: false, vy: -300 }], ['fall', { grounded: false, vy: 300 }],
    ['hit1 wind', { state: 'attack', stage: 0, attackT: 0.07 }], ['hit1 strike', { state: 'attack', stage: 0, attackT: 0.13 }], ['hit1 end', { state: 'attack', stage: 0, attackT: 0.24 }],
    ['hit2 wind', { state: 'attack', stage: 1, attackT: 0.07 }], ['hit2 strike', { state: 'attack', stage: 1, attackT: 0.16 }],
    ['hit3 wind', { state: 'attack', stage: 2, attackT: 0.1 }], ['hit3 slam', { state: 'attack', stage: 2, attackT: 0.3 }],
    ['dash', { state: 'dash' }], ['hurt', { state: 'hurt' }], ['magic', { state: 'magic', attackT: 0.3 }], ['asleep', { state: 'asleep' }],
  ],
}];
