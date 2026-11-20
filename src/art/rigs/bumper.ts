/**
 * "Bumper" (בומפר): a stocky otter in a postal jacket who swings a giant rubber stamp. Original design for this game.
 * Rig: body (jacket) with head, cap, two arms (upper + fore) and the stamp, a tail, a satchel and two legs (thigh + shin with a boot).
 * Angles: 0 = limb hangs down; negative swings it forward (toward +x), positive backward.
 */
import { add, ease, eye, INK, paper, rr, ell, sample, shade, shine, type Key, type PartDef, type Pose } from '../puppet';
import type { HeroRig, RigCtx } from '../types';

export const FUR = '#a8693f', FUR_D = '#7a4829', BELLY = '#f4dcb6', JACKET = '#2f3b78', RED = '#e4572e', MUSTARD = '#f2b134', BOOT = '#5a3a7a', CREAM = '#fff1d6';

export const BUMPER: PartDef[] = [
  // legs (far one first)
  { name: 'thighB', at: [-6, -27], behind: true, img: { w: 18, h: 22, ax: 9, ay: 6, draw: (c) => paper(c, () => rr(c, 3, 3, 12, 17, 6), shade(FUR, -0.18), { y0: 3, y1: 20 }) } },
  { name: 'shinB', parent: 'thighB', at: [0, 14], img: shin(-0.18) },
  { name: 'tail', at: [-14, -22], behind: true, img: { w: 40, h: 22, ax: 5, ay: 11, draw: (c) => {
    paper(c, () => { c.moveTo(4, 4); c.bezierCurveTo(18, 0, 30, 4, 37, 12); c.bezierCurveTo(30, 16, 20, 20, 4, 18); c.closePath(); }, FUR, { y0: 2, y1: 20 });
    c.save(); c.strokeStyle = FUR_D; c.lineWidth = 2; for (const x of [14, 22, 29]) { c.beginPath(); c.moveTo(x, 6); c.lineTo(x - 1, 16); c.stroke(); } c.restore();
  } } },
  { name: 'thighF', at: [5, -27], img: { w: 18, h: 22, ax: 9, ay: 6, draw: (c) => paper(c, () => rr(c, 3, 3, 12, 17, 6), FUR, { y0: 3, y1: 20 }) } },
  { name: 'shinF', parent: 'thighF', at: [0, 14], img: shin(0) },
  // the body, head and arms
  { name: 'body', at: [0, -26], z: 1, img: { w: 46, h: 44, ax: 23, ay: 40, draw: (c) => {
    paper(c, () => { c.moveTo(8, 38); c.bezierCurveTo(1, 24, 4, 8, 14, 4); c.lineTo(32, 4); c.bezierCurveTo(42, 8, 45, 24, 38, 38); c.closePath(); }, JACKET, { y0: 4, y1: 40 });
    c.save(); c.beginPath(); c.moveTo(8, 38); c.bezierCurveTo(1, 24, 4, 8, 14, 4); c.lineTo(32, 4); c.bezierCurveTo(42, 8, 45, 24, 38, 38); c.closePath(); c.clip();
    c.fillStyle = RED; c.fillRect(0, 31, 46, 4);                                                      // a red belt stripe
    c.fillStyle = MUSTARD; c.beginPath(); c.moveTo(4, 2); c.lineTo(14, 2); c.lineTo(41, 38); c.lineTo(31, 38); c.closePath(); c.fill();   // the satchel strap
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(14, 2); c.lineTo(41, 38); c.moveTo(4, 2); c.lineTo(31, 38); c.stroke();
    c.restore();
    c.fillStyle = CREAM; c.beginPath(); ell(c, 28, 11, 6, 4.5); c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();         // collar
    for (const y of [17, 24]) { c.beginPath(); ell(c, 34, y, 2.1, 2.1); c.fillStyle = RED; c.fill(); c.lineWidth = 1.4; c.stroke(); }
    shine(c, 11, 10, 9, 26, 0.32);
  } } },
  { name: 'bag', parent: 'body', at: [-17, -12], behind: true, img: { w: 22, h: 24, ax: 11, ay: 3, draw: (c) => {
    paper(c, () => rr(c, 3, 3, 16, 17, 4), MUSTARD, { y0: 3, y1: 20 });
    paper(c, () => { c.moveTo(3, 3); c.lineTo(19, 3); c.lineTo(19, 10); c.lineTo(11, 14); c.lineTo(3, 10); c.closePath(); }, shade(MUSTARD, -0.08), { lw: 2.4 });
    c.beginPath(); ell(c, 11, 13, 2, 2); c.fillStyle = RED; c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
  } } },
  { name: 'armB', parent: 'body', at: [-6, -31], behind: true, img: upper(-0.2) },
  { name: 'foreB', parent: 'armB', at: [0, 13], img: fore(-0.2) },
  { name: 'head', parent: 'body', at: [3, -35], img: { w: 56, h: 46, ax: 22, ay: 38, draw: (c) => {
    paper(c, () => ell(c, 12, 12, 5.5, 5.5), shade(FUR, -0.15), { lw: 2.6, y0: 6, y1: 18 });             // far ear
    paper(c, () => ell(c, 30, 8, 5, 5), shade(FUR, -0.1), { lw: 2.6, y0: 3, y1: 13 });
    paper(c, () => ell(c, 21, 21, 19, 16), FUR, { y0: 5, y1: 37 });                                         // skull
    paper(c, () => ell(c, 38, 26, 12, 8.5), BELLY, { y0: 18, y1: 34, lw: 2.8 });                          // muzzle
    c.beginPath(); ell(c, 48, 23, 4.8, 3.6); c.fillStyle = INK; c.fill();                                // nose
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); ell(c, 47, 22, 1.4, 1); c.fill();
    c.fillStyle = INK; for (const [x, y] of [[41, 27], [44, 28], [38, 28]]) { c.beginPath(); ell(c, x, y, 0.9, 0.9); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(35, 31); c.quadraticCurveTo(41, 35, 47, 30); c.stroke();     // a smile
    eye(c, 31, 17, 4.6, 0.3);
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(26, 10.5); c.quadraticCurveTo(31, 8, 36, 11); c.stroke();   // brow
    c.fillStyle = 'rgba(255,111,111,0.35)'; c.beginPath(); ell(c, 24, 27, 4.5, 3); c.fill();             // cheek
    paper(c, () => ell(c, 12, 12, 3.2, 3.2), '#e98a8a', { lw: 0.01 });
    shine(c, 11, 18, 14, 28, 0.35);
  } } },
  { name: 'cap', parent: 'head', at: [-1, -31], img: { w: 54, h: 26, ax: 21, ay: 20, draw: (c) => {
    paper(c, () => { c.moveTo(3, 19); c.bezierCurveTo(3, 4, 14, 1, 24, 1); c.bezierCurveTo(34, 1, 41, 6, 41, 19); c.closePath(); }, JACKET, { y0: 1, y1: 19 });
    paper(c, () => rr(c, 2, 14, 41, 6, 3), RED, { lw: 2.4, y0: 14, y1: 20 });                              // band
    paper(c, () => { c.moveTo(38, 15); c.bezierCurveTo(46, 15, 52, 17, 52, 21); c.lineTo(38, 20); c.closePath(); }, shade(JACKET, -0.1), { lw: 2.4 });   // visor
    c.fillStyle = CREAM; c.beginPath(); ell(c, 21, 8, 6.5, 4.5); c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();            // the envelope badge
    c.beginPath(); c.moveTo(15.5, 6); c.lineTo(21, 9.5); c.lineTo(26.5, 6); c.stroke();
    shine(c, 9, 7, 13, 4, 0.4);
  } } },
  { name: 'armF', parent: 'body', at: [8, -31], img: upper(0) },
  { name: 'foreF', parent: 'armF', at: [0, 13], img: fore(0) },
  // the stamp: a long handle that continues the forearm, with the rubber stamp at the far end
  { name: 'stamp', parent: 'foreF', at: [0, 17], img: { w: 38, h: 66, ax: 14, ay: 6, draw: (c) => {
    paper(c, () => rr(c, 10, 2, 8, 44, 3), '#c98f55', { lw: 2.6, y0: 2, y1: 46 });
    paper(c, () => rr(c, 0, 42, 32, 14, 5), RED, { y0: 42, y1: 56 });
    paper(c, () => rr(c, 2, 55, 28, 7, 3), '#2a2a3a', { lw: 2.4, y0: 55, y1: 62 });
    c.strokeStyle = CREAM; c.lineWidth = 1.8; c.beginPath(); c.moveTo(6, 47); c.lineTo(26, 47); c.moveTo(6, 51); c.lineTo(20, 51); c.stroke();
    shine(c, 13, 6, 13, 38, 0.4);
  } } },
];

function shin(dark: number) {
  return { w: 30, h: 26, ax: 9, ay: 4, draw: (c: CanvasRenderingContext2D) => {
    paper(c, () => rr(c, 3, 2, 12, 17, 6), shade(FUR, dark), { y0: 2, y1: 19 });
    paper(c, () => { c.moveTo(2, 14); c.lineTo(15, 14); c.bezierCurveTo(24, 14, 29, 17, 29, 21); c.bezierCurveTo(29, 24, 27, 24, 25, 24); c.lineTo(3, 24); c.closePath(); }, shade(BOOT, dark), { y0: 14, y1: 24 });
    c.fillStyle = shade(CREAM, dark); c.fillRect(3, 15, 12, 2.5);
  } };
}
function upper(dark: number) {
  return { w: 18, h: 22, ax: 9, ay: 5, draw: (c: CanvasRenderingContext2D) => {
    paper(c, () => rr(c, 3, 2, 12, 18, 6), shade(FUR, dark), { y0: 2, y1: 20 });
    paper(c, () => rr(c, 2, 1, 14, 9, 4), shade(JACKET, dark), { y0: 1, y1: 10, lw: 2.6 });                // the jacket sleeve
  } };
}
function fore(dark: number) {
  return { w: 18, h: 24, ax: 9, ay: 4, draw: (c: CanvasRenderingContext2D) => {
    paper(c, () => rr(c, 3, 1, 12, 14, 5), shade(FUR, dark), { y0: 1, y1: 15 });
    paper(c, () => ell(c, 9, 18, 6.5, 5.5), shade(CREAM, dark), { y0: 12, y1: 24 });                    // a glove
  } };
}

// ------------------------------------------------------------------ animation
/** Split a stamp angle S (0 = down, -pi/2 = forward) between shoulder, elbow and wrist. */
function reach(S: number, bend = 0): Pose {
  return { armF: [S * 0.55], foreF: [S * 0.28 + bend], stamp: [S * 0.17] };
}
const IDLE_ARM: Pose = { armF: [-0.5], foreF: [-0.75], stamp: [-1.3], armB: [0.15], foreB: [-0.2] };

const ATTACK: Key[][] = [
  [ // 1: an overhead slam
    { t: 0, pose: add(IDLE_ARM, { body: [0, 0, 0] }) },
    { t: 0.07, pose: add(reach(2.7, 0.3), { body: [-0.14, -1, 1], armB: [1.4], head: [-0.05], thighF: [0.2], thighB: [-0.35] }), ease: ease.out },
    { t: 0.13, pose: add(reach(4.85), { body: [0.26, 4, 2], armB: [-1.0], head: [0.1], thighF: [-0.6], shinF: [0.5], thighB: [0.5] }), ease: ease.in },
    { t: 0.24, pose: add(reach(6.1), { body: [0.3, 5, 3], armB: [-0.8], thighF: [-0.6], shinF: [0.5], thighB: [0.5] }), ease: ease.out },
  ],
  [ // 2: a low-to-high sweep
    { t: 0, pose: add(IDLE_ARM) },
    { t: 0.07, pose: add(reach(1.3), { body: [-0.2, -3, 2], armB: [0.9], thighF: [-0.2], shinF: [0.6], thighB: [0.6] }), ease: ease.out },
    { t: 0.15, pose: add(reach(-1.9), { body: [0.3, 5, 1], armB: [-1.1], thighF: [-0.7], shinF: [0.4], thighB: [0.5] }), ease: ease.in },
    { t: 0.24, pose: add(reach(-2.6), { body: [0.28, 6, 1], armB: [-1.0], thighF: [-0.7], shinF: [0.4], thighB: [0.5] }), ease: ease.out },
  ],
  [ // 3: a leaping ground-pound
    { t: 0, pose: add(IDLE_ARM) },
    { t: 0.1, pose: add(reach(3.2, 0.2), { body: [-0.18, 0, -10], armB: [2.4], thighF: [-0.5], shinF: [0.9], thighB: [-0.2], shinB: [0.9], head: [-0.1] }), ease: ease.out },
    { t: 0.19, pose: add(reach(6.4), { body: [0.4, 6, -2], armB: [-1.2], thighF: [-0.8], shinF: [0.3], thighB: [0.7], head: [0.2] }), ease: ease.in },
    { t: 0.36, pose: add(reach(6.3), { body: [0.35, 6, 6], armB: [-1.0], thighF: [-1.1], shinF: [1.2], thighB: [0.8], shinB: [0.6] }), ease: ease.out },
  ],
];

/** The pose of Bumper for what the hero is doing now. */
export function bumperPose(x: RigCtx): Pose {
  const t = x.time;
  if (x.state === 'asleep') return { body: [0, 0, 0], armF: [0.3], armB: [0.3], head: [0.3], cap: [0.2], stamp: [0.4], thighF: [0.2], thighB: [0.1] };
  if (x.state === 'hurt') return add(IDLE_ARM, { body: [-0.3, -3, 0], head: [-0.4], armF: [1.1], armB: [1.3], foreF: [0.4], thighF: [0.5], shinF: [0.4], thighB: [-0.4], tail: [-0.3] });
  if (x.state === 'dash') return add(IDLE_ARM, { body: [0.55, 6, 4], head: [0.1], armF: [1.9], foreF: [0.3], stamp: [0.9], armB: [1.7], thighF: [-1.15], shinF: [0.6], thighB: [0.95], shinB: [0.3], tail: [0.4] });
  if (x.state === 'magic') {
    const k = Math.min(1, x.attackT * 6);
    return add(IDLE_ARM, { body: [-0.1, 0, -4 * k], armF: [-0.5 - 2.2 * k], foreF: [-0.4], stamp: [-0.8 - 0.5 * k], armB: [-2.6 * k], foreB: [-0.3], head: [-0.15], thighF: [-0.2], thighB: [0.2], cap: [0, 0, -2 * k] });
  }
  if (x.state === 'attack') return sample(ATTACK[x.stage], x.attackT);
  if (!x.grounded) {
    if (x.vy < 0) return add(IDLE_ARM, { body: [0.12, 0, -2], armF: [-2.2], foreF: [-0.3], stamp: [-0.4], armB: [-1.5], thighF: [-0.7], shinF: [1.1], thighB: [0.4], shinB: [1.0], tail: [0.5], head: [-0.1] });
    return add(IDLE_ARM, { body: [0.05, 0, 0], armF: [-1.4], foreF: [-0.2], armB: [-0.9], thighF: [-0.25], shinF: [0.35], thighB: [0.3], shinB: [0.5], tail: [-0.5], cap: [0, 0, -1.5] });
  }
  const sp = Math.min(1, Math.abs(x.vx) / 230);
  if (sp > 0.08) {
    const p = t * (8 + 6 * sp), s = Math.sin(p), c2 = Math.cos(p);
    const legs = (ph: number, dark: number): Pose => {
      const sn = Math.sin(ph);
      return { [dark ? 'thighB' : 'thighF']: [-0.95 * sn * sp - 0.1], [dark ? 'shinB' : 'shinF']: [0.2 + 1.25 * Math.max(0, Math.sin(ph + 1.5)) * sp] };
    };
    return add(IDLE_ARM, legs(p, 0), legs(p + Math.PI, 1), {
      body: [0.14 * sp, 0, -Math.abs(c2) * 3 * sp], armB: [-0.9 * s * sp], armF: [-0.5 + 0.35 * s * sp], foreF: [-0.1 * sp], tail: [-0.2 * s * sp - 0.3 * sp, 0, 0], head: [-0.05 * sp + 0.05 * s * sp],
      cap: [0, 0, Math.abs(s) * 0.8 * sp],
    });
  }
  const b = Math.sin(t * 2.6);
  return add(IDLE_ARM, { body: [0.02 * b, 0, 0, 1, 1 + 0.025 * b], head: [0.04 * Math.sin(t * 2.6 - 0.8)], armF: [0.04 * b], armB: [-0.05 * b], tail: [0.18 * Math.sin(t * 2.2)], cap: [0, 0, 0.5 * b], thighF: [-0.05], thighB: [0.05] });
}

export const RIGS: HeroRig[] = [{
  kind: 'hero', id: 'bumper', name: 'בומפר', parts: BUMPER, scale: 0.85, pose: bumperPose,
  demo: [
    ['idle', {}], ['run a', { vx: 230, time: 0.12 }], ['run b', { vx: 230, time: 0.3 }], ['jump', { grounded: false, vy: -300 }], ['fall', { grounded: false, vy: 300 }],
    ['hit1 wind', { state: 'attack', stage: 0, attackT: 0.07 }], ['hit1 strike', { state: 'attack', stage: 0, attackT: 0.13 }], ['hit1 end', { state: 'attack', stage: 0, attackT: 0.24 }],
    ['hit2 wind', { state: 'attack', stage: 1, attackT: 0.07 }], ['hit2 strike', { state: 'attack', stage: 1, attackT: 0.16 }],
    ['hit3 wind', { state: 'attack', stage: 2, attackT: 0.1 }], ['hit3 slam', { state: 'attack', stage: 2, attackT: 0.3 }],
    ['dash', { state: 'dash' }], ['hurt', { state: 'hurt' }], ['magic', { state: 'magic', attackT: 0.3 }], ['asleep', { state: 'asleep' }],
  ],
}];
