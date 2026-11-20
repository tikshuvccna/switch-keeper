/**
 * "Lasso" (לאסו): a tall, slender heron courier in a hooded teal travel poncho and a mustard scarf, with a satchel of rolled twine.
 * She fights with a twine lasso: a coil in her front hand with a loop hanging from it. Original design for this game.
 * Rig: long legs (thigh, shin, foot), poncho body with tail feathers, satchel and scarf, a two-part neck, the head with crest and an eyelid,
 * two arms (sleeve + feathered forearm), and the lasso (coil, loop, a short trailing rope).
 * Angles: 0 = limb hangs down; negative swings it forward (toward +x), positive backward. Upright parts (body, neck): positive leans forward.
 * Some parts are posed in WORLD angles (see `finish`): the head stays level like a real heron's, the feet stay flat, the coil, loop, rope
 * and scarf tail hang with gravity unless a pose throws them.
 * Weapon tip: the centre of the loop ring is at (0, 22) in the 'loop' part.
 */
import { add, ease, eye, INK, paper, rr, ell, sample, shade, shine, type Key, type PartDef, type Pose } from '../puppet';
import type { HeroRig, RigCtx } from '../types';

const PLUME = '#b4c3d8', PLUME_D = '#8394ae', NECK = '#e3e9f1', FACE = '#fbf7ef', TEAL = '#1fa89a', MUSTARD = '#f2b134', RED = '#e4572e',
  BEAK = '#f39a3d', LEG = '#e9a23c', TWINE = '#ead09a', TWINE_D = '#a97f4a', CREST = '#2f3b78', LEATHER = '#9a5b36';

/** A twisted twine stroke: ink, straw, then a dashed darker twist. */
function twine(c: CanvasRenderingContext2D, path: () => void, lw = 2.6): void {
  c.save();
  c.beginPath(); path(); c.strokeStyle = INK; c.lineWidth = lw + 2.6; c.stroke();
  c.beginPath(); path(); c.strokeStyle = TWINE; c.lineWidth = lw; c.stroke();
  c.setLineDash([1.4, 2.4]); c.beginPath(); path(); c.strokeStyle = TWINE_D; c.lineWidth = lw * 0.55; c.stroke();
  c.restore();
}

const PONCHO = (c: CanvasRenderingContext2D) => {
  c.moveTo(18, 6); c.lineTo(30, 6); c.bezierCurveTo(38, 10, 43, 26, 45, 40); c.quadraticCurveTo(36, 44.5, 24, 45.5); c.quadraticCurveTo(10, 44.5, 1, 38);
  c.bezierCurveTo(4, 24, 9, 10, 18, 6); c.closePath();
};

export const LASSO: PartDef[] = [
  // legs (far one first)
  { name: 'thighB', at: [-3, -41], img: thigh(-0.2) },
  { name: 'shinB', parent: 'thighB', at: [0, 13], img: shin(-0.2) },
  { name: 'footB', parent: 'shinB', at: [0, 22], img: foot(-0.2) },
  { name: 'thighF', at: [4, -41], img: thigh(0) },
  { name: 'shinF', parent: 'thighF', at: [0, 13], img: shin(0) },
  { name: 'footF', parent: 'shinF', at: [0, 22], img: foot(0) },
  // the poncho body
  { name: 'body', at: [0, -40], z: 1, img: { w: 46, h: 50, ax: 23, ay: 40, draw: (c) => {
    for (let x = 4; x <= 43; x += 3.6) {                                                                  // fringe tassels under the hem
      const y = 44.6 - 0.0115 * (x - 24) * (x - 24);
      paper(c, () => rr(c, x - 1.2, y - 2, 2.4, 6, 1.2), MUSTARD, { lw: 1.4, y0: y, y1: y + 4 });
    }
    paper(c, () => PONCHO(c), TEAL, { y0: 6, y1: 46 });
    c.save(); c.beginPath(); PONCHO(c); c.clip();
    c.fillStyle = shade(TEAL, 0.35); c.fillRect(0, 27.5, 46, 1.6);
    c.fillStyle = MUSTARD; c.fillRect(0, 30, 46, 5.5);                                                   // a woven band
    c.fillStyle = RED; for (let x = 3; x < 46; x += 6) { c.beginPath(); c.moveTo(x, 32.75); c.lineTo(x + 2, 30.9); c.lineTo(x + 4, 32.75); c.lineTo(x + 2, 34.6); c.closePath(); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(0, 30); c.lineTo(46, 30); c.moveTo(0, 35.5); c.lineTo(46, 35.5); c.stroke();
    c.fillStyle = LEATHER; c.beginPath(); c.moveTo(25, 4); c.lineTo(31, 4); c.lineTo(9, 31); c.lineTo(3, 29); c.closePath(); c.fill();   // the satchel strap
    c.lineWidth = 1.5; c.beginPath(); c.moveTo(31, 4); c.lineTo(9, 31); c.moveTo(25, 4); c.lineTo(3, 29); c.stroke();
    c.fillStyle = shade(TEAL, -0.3); c.beginPath(); c.moveTo(30, 12); c.quadraticCurveTo(36, 26, 35, 42); c.lineTo(38, 42); c.quadraticCurveTo(38, 24, 30, 12); c.fill();  // a fold
    c.restore();
    paper(c, () => { c.moveTo(19, 7); c.bezierCurveTo(12, 4, 3, 9, 5, 18); c.bezierCurveTo(9, 21, 16, 18, 21, 13); c.closePath(); }, shade(TEAL, -0.08), { y0: 4, y1: 20, lw: 2.6 });  // the hood, down
    c.fillStyle = shade(TEAL, -0.45); c.beginPath(); c.moveTo(18, 8.5); c.bezierCurveTo(13, 7, 8, 10, 9, 14); c.bezierCurveTo(12, 14, 15, 12, 18, 10); c.fill();
    shine(c, 15, 22, 10, 34, 0.3);
  } } },
  { name: 'scarfTail', parent: 'body', at: [-5, -30], behind: true, img: { w: 14, h: 32, ax: 7, ay: 3, draw: (c) => {
    for (const x of [4, 6.5, 9]) { c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x, 25); c.lineTo(x, 30); c.stroke(); c.strokeStyle = MUSTARD; c.lineWidth = 1.2; c.stroke(); }
    paper(c, () => rr(c, 2, 1, 10, 25, 4), MUSTARD, { y0: 1, y1: 26 });
    c.fillStyle = RED; c.fillRect(3.4, 14, 7.2, 3); c.fillRect(3.4, 19, 7.2, 1.6);
  } } },
  { name: 'bag', parent: 'body', at: [-17, -15], behind: true, img: { w: 24, h: 24, ax: 12, ay: 6, draw: (c) => {
    for (const [x, y] of [[8, 6], [15, 5]]) {                                                                 // rolled twine sticking out
      paper(c, () => ell(c, x, y, 4, 4), TWINE, { lw: 2, y0: y - 4, y1: y + 4 });
      c.strokeStyle = TWINE_D; c.lineWidth = 1.1; c.beginPath(); c.arc(x, y, 2.2, 0.3, 5.5); c.stroke();
    }
    paper(c, () => rr(c, 2, 7, 20, 15, 4), LEATHER, { y0: 7, y1: 22 });
    paper(c, () => { c.moveTo(2, 7); c.lineTo(22, 7); c.lineTo(22, 13); c.lineTo(12, 16.5); c.lineTo(2, 13); c.closePath(); }, shade(LEATHER, 0.1), { lw: 2.2, y0: 7, y1: 16 });
    paper(c, () => ell(c, 12, 15.5, 2, 2), MUSTARD, { lw: 1.4 });
  } } },
  { name: 'tail', parent: 'body', at: [-15, -9], behind: true, img: { w: 28, h: 16, ax: 24, ay: 4, draw: (c) => {
    paper(c, () => { c.moveTo(25, 3); c.quadraticCurveTo(12, 3, 1, 13); c.quadraticCurveTo(13, 11, 25, 9); c.closePath(); }, PLUME_D, { lw: 2.2, y0: 2, y1: 14 });
    paper(c, () => { c.moveTo(25, 2); c.quadraticCurveTo(14, 0, 4, 6); c.quadraticCurveTo(15, 7, 25, 7); c.closePath(); }, PLUME, { lw: 2.2, y0: 1, y1: 8 });
  } } },
  { name: 'armB', parent: 'body', at: [-2, -26], behind: true, img: sleeve(-0.25) },
  { name: 'foreB', parent: 'armB', at: [0, 14], img: wing(-0.22) },
  // neck and head
  { name: 'neckLow', parent: 'body', at: [2, -30], img: { w: 16, h: 22, ax: 8, ay: 18, draw: (c) => {
    neckSeg(c, 3.5, 12.5, -2, 23);
  } } },
  { name: 'neckHigh', parent: 'neckLow', at: [0, -13], img: { w: 14, h: 20, ax: 7, ay: 16, draw: (c) => {
    neckSeg(c, 2.5, 11.5, -2, 21);
  } } },
  { name: 'head', parent: 'neckHigh', at: [1, -12], img: { w: 56, h: 32, ax: 15, ay: 18, draw: (c) => {
    paper(c, () => ell(c, 15, 15, 11.5, 10.5), FACE, { y0: 4, y1: 26 });
    paper(c, () => { c.moveTo(23, 8.5); c.quadraticCurveTo(14, 3.5, 4.5, 8); c.quadraticCurveTo(13, 7.5, 22, 11.5); c.closePath(); }, CREST, { lw: 1.4, y0: 4, y1: 12 });   // the dark brow stripe
    paper(c, () => { c.moveTo(24, 19); c.bezierCurveTo(34, 19.8, 44, 19.5, 53, 18.6); c.bezierCurveTo(44, 22, 33, 23.6, 24, 22.6); c.closePath(); }, shade(BEAK, -0.14), { lw: 2.2, y0: 18, y1: 24 });
    paper(c, () => { c.moveTo(24, 11); c.bezierCurveTo(34, 11, 46, 14, 54.5, 18.6); c.bezierCurveTo(44, 19.4, 34, 19.6, 24, 19.2); c.closePath(); }, BEAK, { lw: 2.4, y0: 11, y1: 20 });
    c.fillStyle = INK; c.beginPath(); ell(c, 31, 14.6, 1.6, 0.8); c.fill();                               // nostril
    shine(c, 28, 13, 40, 15, 0.45, 1.6);
    eye(c, 19, 13.5, 4.4, 0.3);
    c.fillStyle = 'rgba(255,111,111,0.35)'; c.beginPath(); ell(c, 13, 21, 3.8, 2.6); c.fill();             // cheek
    shine(c, 7, 13, 9, 20, 0.5);
  } } },
  { name: 'crest', parent: 'head', at: [-6, -7], behind: true, img: { w: 36, h: 20, ax: 32, ay: 13, draw: (c) => {
    for (const [tx, ty, col] of [[3, 15, shade(CREST, -0.15)], [1, 4, CREST], [8, 9, shade(CREST, 0.12)]] as [number, number, string][]) {
      paper(c, () => { c.moveTo(33, 10.5); c.quadraticCurveTo(18, ty - 2.5, tx, ty); c.quadraticCurveTo(18, ty + 2.5, 33, 15); c.closePath(); }, col, { lw: 2, y0: 3, y1: 16 });
    }
  } } },
  { name: 'lid', parent: 'head', at: [4, -10], img: { w: 12, h: 13, ax: 6, ay: 1, draw: (c) => {
    c.beginPath(); c.moveTo(0.6, 1); c.ellipse(6, 1, 5.4, 10.6, 0, 0, Math.PI); c.closePath(); c.fillStyle = FACE; c.fill();
    c.beginPath(); c.ellipse(6, 1, 5.4, 10.6, 0, 0.15, Math.PI - 0.15); c.strokeStyle = INK; c.lineWidth = 2.1; c.stroke();
  } } },
  { name: 'scarf', parent: 'body', at: [2, -30], img: { w: 28, h: 16, ax: 14, ay: 8, draw: (c) => {
    paper(c, () => rr(c, 2, 2.5, 24, 11.5, 5.5), MUSTARD, { y0: 2, y1: 14 });
    c.save(); c.beginPath(); rr(c, 2, 2.5, 24, 11.5, 5.5); c.clip();
    c.fillStyle = RED; c.fillRect(0, 7, 28, 2.6);
    c.strokeStyle = shade(MUSTARD, -0.3); c.lineWidth = 1.1; for (const x of [7, 12, 17, 22]) { c.beginPath(); c.moveTo(x, 3); c.quadraticCurveTo(x + 1.5, 8, x, 14); c.stroke(); }
    c.restore();
    shine(c, 6, 4.8, 15, 4.8, 0.45, 1.6);
  } } },
  // the front arm and the lasso
  { name: 'armF', parent: 'body', at: [5, -25], img: sleeve(0) },
  { name: 'foreF', parent: 'armF', at: [0, 14], img: wing(0) },
  { name: 'coil', parent: 'foreF', at: [0, 15], behind: true, img: { w: 28, h: 28, ax: 14, ay: 4, draw: (c) => {
    twine(c, () => ell(c, 11.5, 12, 5.5, 7.5));
    twine(c, () => ell(c, 14, 13, 5.5, 7.5));
    twine(c, () => ell(c, 16.5, 12, 5, 7));
  } } },
  { name: 'rope', parent: 'coil', at: [-3, 14], behind: true, img: { w: 16, h: 30, ax: 5, ay: 2, draw: (c) => {
    twine(c, () => { c.moveTo(5, 2); c.bezierCurveTo(11, 8, 1, 14, 6, 20); c.quadraticCurveTo(9, 23, 8, 26); }, 2.2);
    c.strokeStyle = TWINE_D; c.lineWidth = 1.1; c.beginPath(); c.moveTo(8, 26); c.lineTo(6, 29); c.moveTo(8, 26); c.lineTo(9.5, 29); c.moveTo(8, 26); c.lineTo(8, 29.5); c.stroke();
  } } },
  { name: 'loop', parent: 'coil', at: [1, 14], img: { w: 34, h: 48, ax: 17, ay: 2, draw: (c) => {
    twine(c, () => ell(c, 17, 24, 9.5, 11), 2.7);
    twine(c, () => { c.moveTo(17, 2); c.quadraticCurveTo(15.5, 7, 17, 12.5); }, 2.7);
    paper(c, () => ell(c, 17, 13, 2.8, 2.2), TWINE_D, { lw: 1.5 });                                      // the knot (honda)
  } } },
];

/** A neck segment: a soft tube with ink only along its sides, so the two segments join without a seam. */
function neckSeg(c: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number): void {
  const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, shade(NECK, -0.12)); g.addColorStop(0.45, NECK); g.addColorStop(1, '#ffffff');
  c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
  c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.moveTo(x1, y0); c.lineTo(x1, y1); c.stroke();
}
function thigh(dark: number) {
  return { w: 14, h: 20, ax: 7, ay: 4, draw: (c: CanvasRenderingContext2D) => {
    paper(c, () => { c.moveTo(3, 3); c.quadraticCurveTo(7, -1, 11, 3); c.lineTo(11, 12); c.lineTo(9, 16); c.lineTo(7, 13.5); c.lineTo(5, 16); c.lineTo(3, 12); c.closePath(); }, shade(PLUME, dark), { y0: 1, y1: 16 });
  } };
}
function shin(dark: number) {
  return { w: 10, h: 28, ax: 5, ay: 2, draw: (c: CanvasRenderingContext2D) => {
    paper(c, () => rr(c, 3, 0, 4, 25, 2), shade(LEG, dark), { lw: 2.2, y0: 0, y1: 25 });
    c.strokeStyle = shade(LEG, dark - 0.3); c.lineWidth = 0.9; for (const y of [10, 14, 18]) { c.beginPath(); c.moveTo(3.6, y); c.lineTo(6.4, y); c.stroke(); }
  } };
}
function foot(dark: number) {
  return { w: 26, h: 11, ax: 7, ay: 3.5, draw: (c: CanvasRenderingContext2D) => {
    const toes = () => { c.moveTo(7, 3.5); c.lineTo(23, 7.5); c.moveTo(7, 3.5); c.lineTo(17, 8.2); c.moveTo(7, 3.5); c.lineTo(1.5, 7); };
    c.beginPath(); toes(); c.strokeStyle = INK; c.lineWidth = 4.6; c.stroke();
    c.beginPath(); toes(); c.strokeStyle = shade(LEG, dark); c.lineWidth = 2.2; c.stroke();
    paper(c, () => ell(c, 7, 3.5, 3, 3), shade(LEG, dark), { lw: 1.8 });
  } };
}
function sleeve(dark: number) {
  return { w: 18, h: 22, ax: 9, ay: 4, draw: (c: CanvasRenderingContext2D) => {
    const p = () => { c.moveTo(5, 2); c.lineTo(13, 2); c.quadraticCurveTo(16, 10, 16.5, 18); c.quadraticCurveTo(9, 21, 1.5, 18); c.quadraticCurveTo(2, 10, 5, 2); c.closePath(); };
    paper(c, p, shade(TEAL, dark), { y0: 2, y1: 20 });
    c.save(); c.beginPath(); p(); c.clip(); c.fillStyle = shade(MUSTARD, dark); c.fillRect(0, 14.5, 18, 2.6); c.restore();
  } };
}
function wing(dark: number) {
  return { w: 18, h: 26, ax: 9, ay: 3, draw: (c: CanvasRenderingContext2D) => {
    paper(c, () => { c.moveTo(4.5, 1); c.lineTo(13.5, 1); c.lineTo(14.5, 12); c.quadraticCurveTo(16.5, 19, 13.5, 23); c.lineTo(11.5, 20); c.lineTo(9, 24.5); c.lineTo(6.6, 20); c.lineTo(4.4, 23); c.quadraticCurveTo(1.6, 18, 3.5, 12); c.closePath(); },
      shade(PLUME, dark), { y0: 1, y1: 24 });
    c.strokeStyle = shade(PLUME_D, dark); c.lineWidth = 1.1; c.beginPath(); c.moveTo(9, 13); c.lineTo(9, 19); c.moveTo(6, 13); c.lineTo(6.4, 17); c.moveTo(12, 13); c.lineTo(11.6, 17); c.stroke();
  } };
}

// ------------------------------------------------------------------ animation
/** Parts posed in world angles: [part, its ancestors]. Converted to local angles in order (later entries may use earlier ones). */
const WORLD: [string, string[]][] = [
  ['coil', ['body', 'armF', 'foreF']],
  ['loop', ['body', 'armF', 'foreF', 'coil']],
  ['rope', ['body', 'armF', 'foreF', 'coil']],
  ['head', ['body', 'neckLow', 'neckHigh']],
  ['footF', ['thighF', 'shinF']],
  ['footB', ['thighB', 'shinB']],
  ['scarfTail', ['body']],
];
function finish(p: Pose, lid = 0): Pose {
  const out: Pose = { ...p };
  for (const [k, chain] of WORLD) {
    const v = out[k] ?? [];
    let s = 0; for (const n of chain) s += out[n]?.[0] ?? 0;
    out[k] = [(v[0] ?? 0) - s, v[1], v[2], v[3], v[4]];
  }
  out.lid = [0, 0, 0, 1, Math.max(0.02, Math.min(1, lid))];
  return out;
}
function blink(t: number): number { const u = t % 3.4; return u < 0.14 ? Math.sin((u / 0.14) * Math.PI) : 0; }

const IDLE: Pose = { body: [0.05], neckLow: [0.1], neckHigh: [-0.22], armF: [-0.45], foreF: [-1.25], armB: [0.18], foreB: [-0.45], thighF: [-0.05], thighB: [0.08] };
const LUNGE: Pose = { thighF: [-0.62], shinF: [0.42], thighB: [0.5], shinB: [0.25], footB: [0.3] };

const ATTACK: Key[][] = [
  [ // 1: a quick forward flick
    { t: 0, pose: IDLE },
    { t: 0.06, pose: { body: [-0.1, -1, 0], neckLow: [-0.05], neckHigh: [-0.15], head: [-0.05], crest: [0.25], armF: [0.95], foreF: [-1.25], coil: [-0.4], loop: [0.85, 0, 0, 1, 1.05], armB: [-0.6], foreB: [-0.4], thighF: [0.1], thighB: [-0.15], scarfTail: [-0.1] }, ease: ease.out },
    { t: 0.12, pose: add(LUNGE, { body: [0.18, 3, 1], neckLow: [0.3], neckHigh: [0.05], crest: [-0.35], armF: [-1.75], foreF: [-0.15], coil: [-1.6], loop: [-1.62, 0, 0, 0.92, 1.35], armB: [0.9], foreB: [-0.2], scarfTail: [0.8] }), ease: ease.in },
    { t: 0.24, pose: add(LUNGE, { body: [0.13, 3, 1], neckLow: [0.25], neckHigh: [-0.05], crest: [-0.1], armF: [-1.45], foreF: [-0.3], coil: [-1.3], loop: [-1.35, 0, 0, 1, 1.15], armB: [0.7], foreB: [-0.3], scarfTail: [0.5] }), ease: ease.out },
  ],
  [ // 2: a backhand cross flick (the hand starts by the far shoulder)
    { t: 0, pose: IDLE },
    { t: 0.07, pose: { body: [-0.12, -2, 0, 0.93, 1], neckLow: [-0.12], neckHigh: [-0.1], head: [0.05], crest: [0.2], armF: [0.75], foreF: [-0.7], coil: [0.6], loop: [1.35, 0, 0, 1, 1.05], armB: [0.75], foreB: [-0.3], thighF: [-0.15], thighB: [0.1], scarfTail: [-0.2] }, ease: ease.out },
    { t: 0.15, pose: add(LUNGE, { body: [0.16, 3, 0, 1.04, 1], neckLow: [0.28], neckHigh: [0.05], crest: [-0.35], armF: [-2.15], foreF: [0.25], coil: [-2.0], loop: [-2.05, 0, 0, 0.92, 1.35], armB: [1.1], foreB: [-0.2], scarfTail: [0.9] }), ease: ease.in },
    { t: 0.24, pose: add(LUNGE, { body: [0.12, 3, 0], neckLow: [0.22], neckHigh: [-0.05], crest: [-0.1], armF: [-1.9], foreF: [0.1], coil: [-1.8], loop: [-1.75, 0, 0, 1, 1.15], armB: [0.9], foreB: [-0.3], scarfTail: [0.6] }), ease: ease.out },
  ],
  [ // 3: a big overhead spin of the loop, then a forward throw and a pull
    { t: 0, pose: IDLE },
    { t: 0.05, pose: { body: [-0.1, 0, -1, 0.97, 1.05], neckLow: [-0.7], neckHigh: [0.35], head: [-0.3], crest: [0.2], armF: [-2.25], foreF: [-0.25], coil: [-3.0], armB: [-0.5], foreB: [-0.6], thighF: [-0.2], thighB: [0.25], scarfTail: [0.2] }, ease: ease.out },
    { t: 0.22, pose: { body: [-0.13, -1, -2, 0.95, 1.07], neckLow: [-0.72], neckHigh: [0.35], head: [-0.32], crest: [0.35], armF: [-2.3], foreF: [-0.25], coil: [-3.0], loop: [-1.4, 0, 0, 1, 1.2], armB: [-0.6], foreB: [-0.6], thighF: [-0.25], thighB: [0.3], scarfTail: [0.6] }, ease: ease.io },
    { t: 0.28, pose: add(LUNGE, { body: [0.25, 4, 2, 1.05, 0.95], neckLow: [0.32], neckHigh: [0.05], head: [0.05], crest: [-0.4], armF: [-1.6], foreF: [-0.1], coil: [-1.6], loop: [-1.55, 0, 0, 0.9, 1.4], armB: [1.0], foreB: [-0.2], scarfTail: [1.0] }), ease: ease.in },
    { t: 0.36, pose: add(LUNGE, { body: [0.02, 1, 1], neckLow: [0.05], neckHigh: [-0.15], crest: [0.1], armF: [-0.7], foreF: [-1.3], coil: [-1.4], loop: [-1.5, 0, 0, 1, 1.3], armB: [0.6], foreB: [-0.3], scarfTail: [0.5] }), ease: ease.out },
  ],
];

/** The loop circling flat above her head, seen from the side: it swings out front, then behind, shrinking as it passes the head. */
function spinLoop(a: number, len: number): [number, number, number, number, number] {
  const cs = Math.cos(a), k = Math.max(0.16, Math.abs(cs)) * len;
  return cs >= 0 ? [-Math.PI / 2 + 0.18, 0, 0, 0.6, k] : [Math.PI / 2 - 0.18, 0, 0, 0.6, k];
}

function raw(x: RigCtx): [Pose, number] {
  const t = x.time;
  if (x.state === 'asleep') return [{ body: [0.12, 0, 2, 1.04, 0.96], neckLow: [-0.45], neckHigh: [1.9], head: [0.55], crest: [-0.4], armF: [-0.2], foreF: [-1.6], coil: [-0.3], armB: [0.2], foreB: [-0.3],
    thighF: [0], thighB: [-1.0], shinB: [2.3], footB: [1.2], scarfTail: [0.05], tail: [0.1] }, 1];
  if (x.state === 'hurt') return [{ body: [-0.3, -3, 0], neckLow: [-0.35], neckHigh: [-0.2], head: [-0.45], crest: [0.8], armF: [-2.2], foreF: [-0.3], coil: [-0.6], loop: [-0.5], armB: [2.0], foreB: [0.3],
    thighF: [0.5], shinF: [0.5], thighB: [-0.5], shinB: [0.9], scarfTail: [-0.6], tail: [-0.3] }, 0.55];
  if (x.state === 'dash') return [{ body: [0.55, 6, 3], neckLow: [0.6], neckHigh: [0.35], head: [0.1], crest: [-0.45], armF: [1.4], foreF: [0.3], coil: [1.6], loop: [1.7, 0, 0, 1, 1.15], rope: [1.8], armB: [1.6], foreB: [0.3],
    thighF: [-1.2], shinF: [0.5], footF: [-0.2], thighB: [1.0], shinB: [0.5], footB: [0.6], scarfTail: [1.6], tail: [-0.3] }, 0];
  if (x.state === 'magic') {
    const k = Math.min(1, x.attackT * 5), spin = x.attackT * 15;
    return [{ body: [0, 0, -3 * k, 1 - 0.05 * Math.sin(spin), 1 + 0.03 * k], neckLow: [-0.1 * k], neckHigh: [-0.1], head: [-0.2 * k], crest: [0.4 * k + 0.1 * Math.sin(t * 10)],
      armF: [-0.3 - 1.9 * k], foreF: [-0.2], coil: [-2.0 * k], loop: [-spin, 0, 0, 1, 1 + 0.5 * k], rope: [0.6 * k], armB: [0.2 + 1.9 * k], foreB: [0.3],
      thighF: [-0.1], thighB: [0.15], footF: [0.15 * k], footB: [0.15 * k], scarfTail: [1.2 + 0.3 * Math.sin(spin)] }, 0];
  }
  if (x.state === 'attack') {
    const st = Math.max(0, Math.min(2, x.stage)), p = sample(ATTACK[st], x.attackT);
    if (st === 2 && x.attackT > 0.03 && x.attackT < 0.23) p.loop = spinLoop((x.attackT - 0.03) / 0.2 * Math.PI * 3, 1.3);
    return [p, 0];
  }
  if (!x.grounded) {
    if (x.vy < 0) return [add(IDLE, { body: [0, 0, -2, 0.95, 1.06], neckLow: [-0.15], neckHigh: [0.15], head: [-0.15], crest: [-0.25], armF: [-2.1], foreF: [0.6], coil: [-0.2], loop: [0.1], armB: [1.5], foreB: [0.3],
      thighF: [-0.85], shinF: [1.6], footF: [0.6], thighB: [-0.5], shinB: [1.5], footB: [0.7], scarfTail: [0.15] }), blink(t)];
    return [add(IDLE, { body: [0, 0, 0, 1.03, 0.97], neckHigh: [0.1], head: [-0.05], crest: [0.5], armF: [-1.7], foreF: [0.7], coil: [-0.3], loop: [2.9, 0, 0, 1, 0.9], rope: [2.6], armB: [1.9], foreB: [0.3],
      thighF: [-0.3], shinF: [0.5], footF: [0.2], thighB: [0.25], shinB: [0.4], footB: [0.25], scarfTail: [2.1] }), blink(t)];
  }
  const sp = Math.min(1, Math.abs(x.vx) / 230);
  if (sp > 0.08) {
    const p = t * (9 + 5 * sp), s = Math.sin(p), c2 = Math.cos(2 * p);
    const legs = (ph: number, b: boolean): Pose => {
      const lift = Math.max(0, Math.sin(ph + 1.5));
      return { [b ? 'thighB' : 'thighF']: [-0.95 * Math.sin(ph) * sp - 0.12], [b ? 'shinB' : 'shinF']: [0.15 + 1.5 * lift * sp], [b ? 'footB' : 'footF']: [0.7 * lift * sp] };
    };
    return [add(IDLE, legs(p, false), legs(p + Math.PI, true), {
      body: [0.22 * sp, 0, -Math.abs(Math.cos(p)) * 3.5 * sp], neckLow: [0.3 * sp + 0.08 * c2 * sp], neckHigh: [0.2 * sp - 0.06 * c2 * sp], head: [0.02 * c2], crest: [-0.25 * sp + 0.12 * c2],
      armF: [0.35 * s * sp], foreF: [-0.1 * sp], coil: [0.25 * sp], loop: [0.6 * sp + 0.15 * s], rope: [0.8 * sp + 0.2 * s], armB: [-0.85 * s * sp], foreB: [-0.2],
      scarfTail: [1.0 * sp + 0.15 * c2], tail: [-0.15 * s * sp],
    }), blink(t)];
  }
  const b = Math.sin(t * 2.4);
  return [add(IDLE, { body: [0.015 * b, 0, 0, 1, 1 + 0.02 * b], neckLow: [0.05 * Math.sin(t * 2.4 - 0.6)], neckHigh: [-0.04 * Math.sin(t * 2.4 - 1.1)], head: [0.04 * Math.sin(t * 1.3)],
    crest: [0.12 * Math.sin(t * 2.2 - 1)], armF: [0.04 * b], armB: [-0.05 * b], coil: [0.05 * b], loop: [0.12 * Math.sin(t * 1.8)], rope: [0.12 + 0.1 * Math.sin(t * 1.8 - 0.6)],
    scarfTail: [0.12 + 0.08 * Math.sin(t * 2)], tail: [0.06 * Math.sin(t * 2.2)] }), blink(t)];
}

/** The pose of Lasso for what the hero is doing now. */
export function lassoPose(x: RigCtx): Pose { const [p, lid] = raw(x); return finish(p, lid); }

export const RIGS: HeroRig[] = [{
  kind: 'hero', id: 'lasso', name: 'לאסו', parts: LASSO, scale: 0.85, pose: lassoPose,
  demo: [
    ['idle', {}], ['run a', { vx: 230, time: 0.12 }], ['run b', { vx: 230, time: 0.3 }], ['jump', { grounded: false, vy: -300 }], ['fall', { grounded: false, vy: 300 }],
    ['hit1 wind', { state: 'attack', stage: 0, attackT: 0.07 }], ['hit1 strike', { state: 'attack', stage: 0, attackT: 0.13 }], ['hit1 end', { state: 'attack', stage: 0, attackT: 0.24 }],
    ['hit2 wind', { state: 'attack', stage: 1, attackT: 0.07 }], ['hit2 strike', { state: 'attack', stage: 1, attackT: 0.16 }],
    ['hit3 wind', { state: 'attack', stage: 2, attackT: 0.1 }], ['hit3 slam', { state: 'attack', stage: 2, attackT: 0.3 }],
    ['dash', { state: 'dash' }], ['hurt', { state: 'hurt' }], ['magic', { state: 'magic', attackT: 0.3 }], ['asleep', { state: 'asleep' }],
  ],
}];
