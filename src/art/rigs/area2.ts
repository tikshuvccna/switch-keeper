/**
 * Area 2, "Switch Street" (doors, parcels, flooding, labels): the Floodling, the Tag Thief, the Door Warden and the Door Flooder boss.
 * Original designs for this game. Shared helpers come from area1.ts.
 * Angles: 0 = a limb hangs down; negative swings it forward (+x). For a part that stands UP from its joint, positive tips it forward.
 */
import { add, ease, eye, INK, paper, rr, ell, shade, shine, type Img, type PartDef, type Pose } from '../puppet';
import type { EnemyCtx, EnemyRig } from '../types';
import {
  CREAM, RED, TEAL, MUSTARD, NAVY, PINK, OFF, type T5, img, clamp01, ramp, fract, fx, only, orbit, puff, blob, starImg, puffImg, sparkImg, dropImg,
  madEye, spiralEye, squint, xEye, vein, blush,
} from './area1';

const WATER = '#5ec3ea', WATER_D = '#2f86c4';
const SMALL_DEMO: [string, Partial<EnemyCtx>][] = [
  ['idle', {}], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.3 }], ['windup', { state: 'windup', t: 0.12 }], ['windup end', { state: 'windup', t: 0.45, time: 0.47 }],
  ['attack', { state: 'attack', t: 0.08 }], ['attack .18', { state: 'attack', t: 0.18 }], ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam' }], ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }],
];
const STARS = ['star1', 'star2', 'star3'];
const starParts = (parent: string, at: [number, number], r = 4): PartDef[] => STARS.map((n, i) => ({ name: n, parent, at, img: starImg(i === 1 ? MUSTARD : '#fff3b0', r) }));

// ================================================================== FLOOD (Floodling): a water blob with a funnel mouth and a paper boat hat
const FLOOD_FACES = ['face', 'faceMad', 'faceDizzy', 'faceOuch'];
const DROPS = ['drop1', 'drop2', 'drop3', 'drop4', 'drop5'];
const FLOOD_FX = ['spit', ...DROPS, ...STARS, ...FLOOD_FACES];
function floodPath(c: CanvasRenderingContext2D): void {
  c.moveTo(5, 36); c.bezierCurveTo(1, 24, 6, 6, 22, 5); c.bezierCurveTo(36, 4, 44, 18, 42, 36);
  c.quadraticCurveTo(38, 39, 34, 36); c.quadraticCurveTo(30, 40, 24, 37); c.quadraticCurveTo(17, 40, 12, 37); c.quadraticCurveTo(8, 39, 5, 36); c.closePath();
}
function floodFace(kind: 'calm' | 'mad' | 'dizzy' | 'ouch'): Img {
  return img(28, 18, 14, 9, (c) => {
    if (kind === 'calm') { eye(c, 8, 8, 4.6, 0.35); eye(c, 19, 7.5, 5.2, 0.35); c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(4, 1.8); c.quadraticCurveTo(8, 0.5, 11, 2.5); c.moveTo(16, 1.5); c.quadraticCurveTo(20, 0, 24, 1.5); c.stroke(); }
    else if (kind === 'mad') { madEye(c, 8, 8.5, 4.8, WATER, 0.5, 0.4, 0.05); madEye(c, 19, 8, 5.4, WATER, -0.5, 0.4, 0.05); vein(c, 25, 2, 5); }
    else if (kind === 'dizzy') { spiralEye(c, 8, 8, 4.6); spiralEye(c, 19, 7.5, 5.2); }
    else { squint(c, 8, 8, 4.4, 1); squint(c, 19, 7.5, 4.8, -1); }
  });
}
const FLOOD: PartDef[] = [
  { name: 'c', at: [0, -16] },
  { name: 'body', parent: 'c', at: [0, 16], img: img(46, 42, 23, 37, (c) => {
    c.save(); c.globalAlpha = 0.25; c.fillStyle = WATER_D; c.beginPath(); ell(c, 23, 38, 21, 3.4); c.fill(); c.restore();
    paper(c, () => floodPath(c), WATER, { y0: 5, y1: 38, top: 0.3, bot: -0.25 });
    c.save(); c.beginPath(); floodPath(c); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.6; c.beginPath();                                  // ripples inside
    for (const y of [27, 32]) { c.moveTo(6, y); for (let x = 6; x <= 42; x += 6) c.quadraticCurveTo(x + 1.5, y - 2, x + 3, y), c.quadraticCurveTo(x + 4.5, y + 2, x + 6, y); }
    c.stroke();
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.75)'; for (const [x, y, r] of [[10, 20, 1.8], [13, 25, 1.1], [33, 28, 1.4]] as const) { c.beginPath(); ell(c, x, y, r, r); c.fill(); }
    shine(c, 9, 15, 14, 9, 0.75, 2.5);
  }) },
  { name: 'boat', parent: 'body', at: [-3, -31], img: img(30, 22, 15, 18, (c) => {
    paper(c, () => { c.moveTo(14, 15); c.lineTo(15, 2); c.lineTo(24, 15); c.closePath(); }, '#fffaf0', { lw: 1.8, y0: 2, y1: 15, top: 0, bot: -0.1 });
    paper(c, () => { c.moveTo(14.5, 15); c.lineTo(15, 2); c.lineTo(8, 15); c.closePath(); }, shade(CREAM, -0.08), { lw: 1.8, y0: 2, y1: 15 });
    paper(c, () => { c.moveTo(2, 14); c.lineTo(28, 14); c.lineTo(23, 20); c.lineTo(7, 20); c.closePath(); }, RED, { lw: 2, y0: 14, y1: 20 });
    c.strokeStyle = '#fffaf0'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(8, 16.5); c.lineTo(22, 16.5); c.stroke();
  }) },
  { name: 'face', parent: 'body', at: [1, -22], img: floodFace('calm') },
  { name: 'faceMad', parent: 'body', at: [1, -22], img: floodFace('mad') },
  { name: 'faceDizzy', parent: 'body', at: [1, -22], img: floodFace('dizzy') },
  { name: 'faceOuch', parent: 'body', at: [1, -22], img: floodFace('ouch') },
  { name: 'funnel', parent: 'body', at: [16, -11], img: img(20, 20, 3, 10, (c) => {
    paper(c, () => { c.moveTo(2, 8); c.lineTo(8, 8); c.lineTo(14, 3.5); c.lineTo(14, 16.5); c.lineTo(8, 12); c.lineTo(2, 12); c.closePath(); }, '#cfdde6', { lw: 2, y0: 3, y1: 17 });
    paper(c, () => ell(c, 14.5, 10, 3.4, 7.4), MUSTARD, { lw: 2, y0: 2, y1: 18 });
    paper(c, () => ell(c, 15.2, 10, 1.9, 5.2), '#1c3550', { lw: 1.2, y0: 5, y1: 15, top: 0.2, bot: -0.2 });
    shine(c, 8.5, 7.6, 12.5, 5, 0.8, 1.4);
  }) },
  { name: 'spit', parent: 'funnel', at: [16, 0], img: img(18, 16, 9, 8, (c) => {
    paper(c, () => { ell(c, 9, 8.5, 7.5, 6.5); }, WATER, { lw: 2, y0: 2, y1: 15, top: 0.3 });
    c.fillStyle = INK; c.beginPath(); ell(c, 8, 7.5, 1.3, 1.6); ell(c, 12, 7.3, 1.3, 1.6); c.fill();
    shine(c, 4.5, 6.5, 6, 4, 0.8, 1.5);
  }) },
  ...DROPS.map((n, i): PartDef => ({ name: n, parent: 'c', at: [0, -2], img: dropImg(i % 2 ? 3 : 4, i % 2 ? '#9fe0f6' : WATER) })),
  ...starParts('c', [0, -26]),
];
function floodPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  switch (x.state) {
    case 'move': {                  // squash-and-stretch hops
      const u = fract(T * 2.2);
      const crouch = u < 0.2 ? Math.sin((u / 0.2) * Math.PI) : 0, air = u >= 0.2 && u < 0.8 ? Math.sin(((u - 0.2) / 0.6) * Math.PI) : 0, land = u >= 0.8 ? Math.sin(((u - 0.8) / 0.2) * Math.PI) : 0;
      const st = u >= 0.2 && u < 0.5 ? Math.sin(((u - 0.2) / 0.3) * Math.PI) : 0;
      p = add({ c: [0.1 * air, 0, -12 * air], body: [-0.08 * st, 0, 0, 1 + 0.18 * (crouch + land) - 0.12 * st, 1 - 0.2 * (crouch + land) + 0.18 * st], boat: [0.2 * Math.sin(u * Math.PI * 2), 0, 3 * crouch - 2 * st], funnel: [0.1 * st] }, only('face', FLOOD_FACES));
      break;
    }
    case 'windup': {
      const k = ease.out(ramp(t, 0, 0.35)), tr = Math.sin(T * 55) * 0.8 * ramp(t, 0.2, 0.45);
      p = add({ c: [0, tr, 0], body: [-0.12 * k, -1 * k, 0, 1 + 0.22 * k, 1 + 0.18 * k], funnel: [-0.25 * k, 2 * k, -1 * k, 1 + 0.3 * k, 1 + 0.4 * k], boat: [-0.3 * k + 0.1 * Math.sin(T * 9), 0, -3 * k] }, only('faceMad', FLOOD_FACES),
        { drop1: [0, -14, -24 + 10 * fract(t * 3), 0.7, 0.7] });
      break;
    }
    case 'attack': {
      const k = ease.out(ramp(t, 0, 0.06)), r = ease.io(ramp(t, 0.12, 0.35)), m = k * (1 - r), sp = ramp(t, 0.02, 0.25);
      p = add({ c: [0, -3 * m, 0], body: [0.12 * m, 0, 0, 1 - 0.12 * m, 1 + 0.08 * m], funnel: [0.1 * m, 4 * m, 0, 1 + 0.25 * m, 1 + 0.35 * m], boat: [0.4 * m, -2 * m, -2 * m] }, only('faceMad', FLOOD_FACES),
        sp > 0 && sp < 1 ? { spit: [0.3 * sp, 4 + 14 * ease.out(sp), -4 * Math.sin(sp * Math.PI), 0.7 + 0.4 * Math.sin(sp * Math.PI), 0.7 + 0.3 * Math.sin(sp * Math.PI)] } : {});
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [0, -3 * k, 0], body: [-0.15 * k, 0, 0, 1 + 0.3 * k, 1 - 0.3 * k], boat: [-0.6 * k, -4 * k, -4 * k], funnel: [0.4 * k] }, only('faceOuch', FLOOD_FACES),
        { drop1: [0, -16 * (1 - k), -10 - 6 * (1 - k), 1, 1], drop2: [0, 14 * (1 - k), -12 - 4 * (1 - k), 1, 1] });
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 3);
      p = add({ body: [0.08 * w, 0, 0, 1.14 + 0.03 * Math.sin(T * 5), 0.82 - 0.03 * Math.sin(T * 5)], boat: [0.5 + 0.15 * w, 4, 4], funnel: [0.5, 0, 3] }, only('faceDizzy', FLOOD_FACES), orbit(STARS, T, 13, 4));
      break;
    }
    case 'dead': {                  // swells, then bursts into drops
      const k = ramp(t, 0, 0.12), b = ease.out(ramp(t, 0.1, 0.33)), s = b > 0 ? 0.001 : 1 + 0.35 * k;
      p = add({ body: [0, 0, 0, s, s], boat: b > 0 ? [2 * b, 0, -30 * b + 40 * b * b, 1, 1] : [0, 0, 0, 1, 1] }, only(b > 0 ? 'x' : 'faceOuch', FLOOD_FACES));
      if (b > 0) DROPS.forEach((n, i) => { const a = -Math.PI * (0.1 + 0.2 * i), d = 26 * b; p[n] = [a + Math.PI / 2, Math.cos(a) * d, Math.sin(a) * d + 18 * b * b, 1.2 - 0.6 * b, 1.2 - 0.6 * b]; });
      break;
    }
    default: {
      const w = Math.sin(T * 3.4);
      p = add({ body: [0.02 * w, 0, 0, 1 + 0.04 * w, 1 - 0.05 * w], boat: [0.12 * Math.sin(T * 2.2), 0, 1.5 * w], funnel: [0.06 * Math.sin(T * 3.4 - 1)] }, only('face', FLOOD_FACES));
    }
  }
  return fx(p, FLOOD_FX);
}

// ================================================================== TAG THIEF: a masked magpie with a sack of stolen address tags
const MAG = '#34407c', MAG_L = '#4f6fb2', BEAK = '#f2b134', MASK = '#c8324a';
const THIEF_FACES = ['face', 'faceMad', 'faceDizzy', 'faceOuch'];
const THIEF_FX = ['fan', 'glint', ...STARS, ...THIEF_FACES];
function tagPath(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  c.moveTo(x + 3, y); c.lineTo(x + w, y); c.lineTo(x + w, y + h); c.lineTo(x + 3, y + h); c.lineTo(x, y + h / 2); c.closePath();
}
function thiefLeg(dark: number): Img {
  return img(16, 22, 5, 1, (c) => {
    const L = () => { c.beginPath(); c.moveTo(5, 1); c.lineTo(5, 18); };
    L(); c.lineWidth = 4.6; c.strokeStyle = INK; c.stroke(); L(); c.lineWidth = 2; c.strokeStyle = shade(BEAK, dark - 0.15); c.stroke();
    c.beginPath(); c.moveTo(1, 20); c.lineTo(5, 18); c.lineTo(14, 20.5); c.moveTo(5, 18); c.lineTo(10, 21); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke();
  });
}
function thiefWing(dark: number): Img {
  return img(18, 28, 8, 3, (c) => {
    paper(c, () => { c.moveTo(3, 3); c.quadraticCurveTo(15, 1, 15, 12); c.lineTo(14, 24); c.lineTo(11, 20); c.lineTo(9, 25); c.lineTo(6.5, 20); c.lineTo(4, 23); c.quadraticCurveTo(1, 12, 3, 3); c.closePath(); }, shade(MAG, dark), { y0: 1, y1: 25 });
    paper(c, () => ell(c, 9, 8.5, 4.5, 3.6), shade('#f4f1e8', dark), { lw: 1.6, y0: 5, y1: 12 });
    c.strokeStyle = shade(MAG_L, dark); c.lineWidth = 1.2; c.beginPath(); c.moveTo(8, 14); c.lineTo(9, 20); c.moveTo(11.5, 14); c.lineTo(12, 19); c.stroke();
  });
}
function thiefFace(kind: 'calm' | 'mad' | 'dizzy' | 'ouch'): Img {
  return img(24, 14, 12, 7, (c) => {
    if (kind === 'calm') { madEye(c, 7, 7, 4.1, MASK, 0.08, 0.5, 0.25); madEye(c, 17, 6.5, 4.6, MASK, -0.08, 0.5, 0.25); }          // sly half-lids
    else if (kind === 'mad') { madEye(c, 7, 7, 4.2, MASK, 0.55, 0.5, -0.05); madEye(c, 17, 6.5, 4.7, MASK, -0.55, 0.5, -0.05); }
    else if (kind === 'dizzy') { spiralEye(c, 7, 7, 3.7); spiralEye(c, 16.5, 6.5, 4.1); }
    else { squint(c, 7, 7, 3.6, 1); squint(c, 16.5, 6.5, 4, -1); }
  });
}
const THIEF: PartDef[] = [
  { name: 'c', at: [0, -30] },
  { name: 'legB', parent: 'c', at: [-3, 12], img: thiefLeg(-0.2) },
  { name: 'tail', parent: 'c', at: [-9, 3], img: img(40, 18, 37, 7, (c) => {
    paper(c, () => { c.moveTo(37, 4); c.lineTo(6, 1.5); c.quadraticCurveTo(1, 4, 3, 8); c.lineTo(37, 11); c.closePath(); }, MAG, { y0: 1, y1: 11 });
    c.strokeStyle = shade(TEAL, 0.1); c.lineWidth = 1.6; c.beginPath(); c.moveTo(32, 6.5); c.lineTo(8, 4.5); c.stroke();
  }) },
  { name: 'sack', parent: 'c', at: [-9, -8], img: img(32, 36, 22, 6, (c) => {
    for (const [x, y, r, col] of [[10, 4, -0.5, MUSTARD], [16, 1, -0.1, '#fffaf0'], [22, 3, 0.4, '#bfe9d9']] as const) {               // tags poking out
      c.save(); c.translate(x, y + 6); c.rotate(r - Math.PI / 2); paper(c, () => tagPath(c, 0, -4, 13, 8), col, { lw: 1.6, y0: -4, y1: 4 }); c.fillStyle = INK; c.beginPath(); ell(c, 3, 0, 1.1, 1.1); c.fill(); c.restore();
    }
    paper(c, () => { c.moveTo(8, 8); c.bezierCurveTo(-2, 14, 0, 33, 14, 33); c.bezierCurveTo(30, 33, 32, 14, 22, 8); c.closePath(); }, '#b98a5a', { y0: 8, y1: 33 });
    c.strokeStyle = shade('#b98a5a', -0.35); c.lineWidth = 1.4; c.beginPath(); c.moveTo(8, 18); c.lineTo(11, 22); c.moveTo(19, 24); c.lineTo(23, 21); c.stroke();
    paper(c, () => rr(c, 7, 6, 17, 5, 2.5), RED, { lw: 1.8, y0: 6, y1: 11 });
    c.fillStyle = '#fffaf0'; c.beginPath(); rr(c, 9, 21, 9, 6, 1); c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
    c.fillStyle = RED; c.fillRect(9.5, 21.5, 8, 1.6);
  }) },
  { name: 'wingB', parent: 'c', at: [-2, -9], img: thiefWing(-0.25) },
  { name: 'body', parent: 'c', at: [0, 13], img: img(32, 34, 16, 32, (c) => {
    paper(c, () => { c.moveTo(16, 3); c.bezierCurveTo(28, 3, 31, 18, 27, 26); c.quadraticCurveTo(22, 33, 14, 32); c.bezierCurveTo(5, 31, 2, 22, 4, 14); c.bezierCurveTo(5, 7, 10, 3, 16, 3); c.closePath(); }, MAG, { y0: 3, y1: 32 });
    paper(c, () => { c.moveTo(20, 9); c.bezierCurveTo(29, 11, 30, 22, 25, 28); c.quadraticCurveTo(19, 32, 13, 30); c.bezierCurveTo(16, 24, 15, 14, 20, 9); c.closePath(); }, '#f4f1e8', { lw: 2.2, y0: 9, y1: 31, top: 0.05, bot: -0.12 });
    c.strokeStyle = shade('#b98a5a', -0.2); c.lineWidth = 2.4; c.beginPath(); c.moveTo(6, 6); c.lineTo(22, 30); c.stroke();          // the sack strap
    shine(c, 7, 12, 9, 8, 0.4);
  }) },
  { name: 'legF', parent: 'c', at: [4, 12], img: thiefLeg(0) },
  { name: 'head', parent: 'body', at: [3, -26], img: img(36, 28, 13, 23, (c) => {
    paper(c, () => { c.moveTo(6, 7); c.lineTo(2, 1); c.lineTo(10, 4); }, MAG, { lw: 1.8, y0: 0, y1: 7 });                                 // crest feather
    paper(c, () => { c.moveTo(22, 12); c.lineTo(35, 15.5); c.lineTo(22, 19); c.closePath(); }, BEAK, { lw: 2.2, y0: 12, y1: 19 });           // beak
    c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(23, 15.8); c.lineTo(32, 15.6); c.stroke();
    paper(c, () => ell(c, 13, 14, 11, 10), MAG, { y0: 4, y1: 24 });
    paper(c, () => { c.moveTo(1, 10); c.quadraticCurveTo(13, 6, 26, 9); c.lineTo(25, 17); c.quadraticCurveTo(13, 14, 1, 17); c.closePath(); }, MASK, { lw: 2, y0: 7, y1: 17 });   // the bandit mask
    paper(c, () => { c.moveTo(2, 12); c.lineTo(-1, 9); c.lineTo(0, 16); c.closePath(); }, MASK, { lw: 1.5, y0: 9, y1: 16 });
    shine(c, 6, 7, 10, 5, 0.4, 2);
  }) },
  { name: 'face', parent: 'head', at: [1, -10], img: thiefFace('calm') },
  { name: 'faceMad', parent: 'head', at: [1, -10], img: thiefFace('mad') },
  { name: 'faceDizzy', parent: 'head', at: [1, -10], img: thiefFace('dizzy') },
  { name: 'faceOuch', parent: 'head', at: [1, -10], img: thiefFace('ouch') },
  { name: 'wingF', parent: 'c', at: [3, -8], img: thiefWing(0) },
  { name: 'fan', parent: 'wingF', at: [2, 21], img: img(34, 30, 8, 26, (c) => {                                             // a fan of stolen tags
    for (const [r, col] of [[-1.0, MUSTARD], [-0.55, '#bfe9d9'], [-0.1, '#fffaf0']] as const) {
      c.save(); c.translate(8, 26); c.rotate(r); paper(c, () => tagPath(c, 2, -4.5, 22, 9), col, { lw: 1.7, y0: -4.5, y1: 4.5 });
      c.fillStyle = INK; c.beginPath(); ell(c, 5.5, 0, 1.2, 1.2); c.fill(); c.fillRect(10, -1.6, 9, 1.1); c.fillRect(10, 1, 6, 1.1); c.restore();
    }
  }) },
  { name: 'glint', parent: 'fan', at: [18, -20], img: sparkImg(7, '#fffbe0') },
  ...starParts('head', [0, -26]),
];
function thiefPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  switch (x.state) {
    case 'move': {                  // quick tiptoe hops
      const ph = T * 14, s = Math.sin(ph), h = Math.abs(Math.sin(ph));
      p = add({ c: [0.18, 0, -5 * h], legF: [-0.7 * s, 0, 0, 1, 1 - 0.2 * Math.max(0, Math.cos(ph))], legB: [0.7 * s, 0, 0, 1, 1 - 0.2 * Math.max(0, -Math.cos(ph))], body: [0.05 * s], head: [-0.15 + 0.06 * Math.sin(ph * 2)],
        tail: [-0.3 + 0.15 * Math.sin(ph * 2 - 1)], sack: [-0.2 + 0.15 * Math.sin(ph - 1), 0, 1.5 * h], wingF: [0.5 + 0.3 * s], wingB: [0.6 - 0.3 * s] }, only('face', THIEF_FACES));
      break;
    }
    case 'windup': {                // crouch and flash the tags
      const k = ease.out(ramp(t, 0, 0.3)), fl = Math.floor(t * 10) % 2;
      p = add({ c: [0.2 * k, -2 * k, 7 * k], body: [-0.1 * k, 0, 0, 1 + 0.06 * k, 1 - 0.08 * k], legF: [-0.5 * k, 0, 0, 1, 1 - 0.35 * k], legB: [0.4 * k, 0, 0, 1, 1 - 0.35 * k], head: [0.15 * k],
        wingF: [2.6 * k + 0.08 * Math.sin(T * 30), 0, 0], wingB: [0.7 * k], tail: [-0.5 * k], sack: [-0.2 * k], fan: [0.2 * k, 0, 0, k, k],
        glint: fl ? [T * 4, 0, 0, 1.2 * k, 1.2 * k] : OFF }, only(fl ? 'faceMad' : 'face', THIEF_FACES));
      break;
    }
    case 'attack': {                // a fast swipe
      const k = ease.out(ramp(t, 0, 0.08)), r = ease.io(ramp(t, 0.18, 0.34)), m = k * (1 - r);
      p = add({ c: [0.45 * m, 10 * m, 2 * m], body: [0, 0, 0, 1 + 0.08 * m, 1 - 0.05 * m], legF: [-0.9 * m], legB: [0.9 * m, 0, 0, 1, 1 + 0.1 * m], head: [-0.25 * m],
        wingF: [2.6 - 4.4 * k + 1.8 * r], wingB: [1.2 * m], tail: [-0.6 * m], sack: [0.3 * m], fan: [0, 0, 0, 1 - r, 1 - r] }, only('faceMad', THIEF_FACES));
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [-0.3 * k, -4 * k, -2 * k], body: [0, 0, 0, 1 + 0.12 * k, 1 - 0.12 * k], head: [-0.4 * k], wingF: [-2 * k], wingB: [-1.6 * k], legF: [-0.4 * k], tail: [0.7 * k], sack: [0.5 * k] }, only('faceOuch', THIEF_FACES));
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 3);
      p = add({ c: [-0.12 + 0.05 * w, 0, 2], head: [0.35 + 0.1 * w], wingF: [0.4 + 0.2 * w], wingB: [0.5 - 0.2 * w], tail: [0.4], sack: [0.4, 0, 2], legF: [-0.2, 0, 0, 1, 0.9], legB: [0.2, 0, 0, 1, 0.9] },
        only('faceDizzy', THIEF_FACES), orbit(STARS, T, 13, 4));
      break;
    }
    case 'dead': {
      const k = ease.in(ramp(t, 0, 0.32));
      p = add({ c: [-8 * k, 0, 6 * k, 1 - 0.6 * k, 1 - 0.6 * k], wingF: [-2 * k], wingB: [-2 * k], tail: [1 * k], sack: [1.4 * k, -6 * k, -4 * k] }, only('faceDizzy', THIEF_FACES));
      break;
    }
    default: {                       // sneaky bob, peeking around
      const b = Math.sin(T * 3), look = Math.sin(T * 0.9) > 0.6 ? -0.25 : 0.05;
      p = add({ c: [0.08, 0, -1 * Math.abs(b)], body: [0.03 * b, 0, 0, 1, 1 + 0.02 * b], head: [look + 0.04 * Math.sin(T * 6)], tail: [0.1 * Math.sin(T * 2.5)], wingF: [0.35 + 0.08 * b], wingB: [0.45 - 0.08 * b], sack: [-0.05 * b], legF: [-0.08], legB: [0.08] }, only('face', THIEF_FACES));
    }
  }
  return fx(p, THIEF_FX);
}

// ================================================================== WARDEN (Door Warden): a walking door in its frame, with a peephole eye and a mail-slot mouth
const WOOD = '#b7683c', FRAME = '#2f9a8e', BRASS = '#e2b24a';
const WARD_EYES = ['eye', 'eyeMad', 'eyeDizzy', 'eyeOuch'];
const WARD_FX = ['inEyes', 'dust', 'dust2', ...STARS, ...WARD_EYES];
function wardEye(kind: 'calm' | 'mad' | 'dizzy' | 'ouch'): Img {
  return img(24, 24, 12, 12, (c) => {
    paper(c, () => ell(c, 12, 12, 10.5, 10.5), BRASS, { lw: 2.4, y0: 1, y1: 23 });
    if (kind === 'calm') { madEye(c, 12, 12, 7, BRASS, 0, 0.35, 0.25); }
    else if (kind === 'mad') { madEye(c, 12, 12.5, 7.2, BRASS, 0.35, 0.35, 0.0); }
    else if (kind === 'dizzy') { spiralEye(c, 12, 12, 7); }
    else { c.fillStyle = shade(WOOD, -0.1); c.beginPath(); ell(c, 12, 12, 7.5, 7.5); c.fill(); squint(c, 12, 12, 6, 1); }
    shine(c, 5, 8, 7, 5, 0.6, 1.6);
  });
}
function wardLeg(dark: number): Img {
  return img(24, 18, 9, 2, (c) => {
    paper(c, () => rr(c, 5, 0, 9, 10, 2), shade('#7a4a2b', dark), { lw: 2.4, y0: 0, y1: 10 });
    paper(c, () => { c.moveTo(3, 9); c.lineTo(15, 9); c.bezierCurveTo(21, 9, 23, 12, 23, 15); c.lineTo(3, 15); c.closePath(); }, shade(NAVY, dark), { lw: 2.4, y0: 9, y1: 15 });
    c.fillStyle = shade(BRASS, dark); c.fillRect(4, 12.5, 18, 1.4);
  });
}
function wardArm(dark: number, fist: boolean): Img {
  return fist
    ? img(18, 24, 9, 3, (c) => { paper(c, () => rr(c, 4, 1, 10, 12, 2), shade(FRAME, dark), { lw: 2.4, y0: 1, y1: 13 }); paper(c, () => ell(c, 9, 16, 7.5, 6.5), shade(CREAM, dark), { lw: 2.4, y0: 9, y1: 23 }); c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(6, 13); c.lineTo(6, 17); c.moveTo(9.5, 12.5); c.lineTo(9.5, 16); c.stroke(); })
    : img(18, 20, 9, 4, (c) => { paper(c, () => rr(c, 4, 1, 10, 17, 2), shade(FRAME, dark), { lw: 2.4, y0: 1, y1: 18 }); paper(c, () => ell(c, 9, 4, 4, 3.4), shade(BRASS, dark), { lw: 1.8, y0: 1, y1: 8 }); });
}
const WARDEN: PartDef[] = [
  { name: 'c', at: [0, -50] },
  { name: 'legB', parent: 'c', at: [-11, 37], img: wardLeg(-0.2) },
  { name: 'legF', parent: 'c', at: [12, 37], img: wardLeg(0) },
  { name: 'armB', parent: 'c', at: [-25, -14], img: wardArm(-0.2, false) },
  { name: 'foreB', parent: 'armB', at: [0, 15], img: wardArm(-0.2, true) },
  { name: 'frame', parent: 'c', at: [0, 39], img: img(66, 92, 33, 89, (c) => {
    paper(c, () => rr(c, 5, 10, 56, 79, 3), FRAME, { y0: 10, y1: 89 });
    paper(c, () => rr(c, 11, 18, 44, 71, 1), '#241a35', { lw: 2.2, y0: 18, y1: 89, top: 0.1, bot: -0.2 });          // the dark doorway
    paper(c, () => { c.moveTo(1, 13); c.lineTo(33, 1); c.lineTo(65, 13); c.lineTo(62, 17); c.lineTo(4, 17); c.closePath(); }, RED, { y0: 1, y1: 17 });   // a little roof
    c.fillStyle = shade(RED, -0.3); for (let x = 12; x < 58; x += 8) c.fillRect(x, 13, 1.2, 4);
    paper(c, () => ell(c, 33, 10, 3.6, 3.6), BRASS, { lw: 1.6, y0: 6, y1: 14 });
    shine(c, 8, 22, 8, 80, 0.35);
  }) },
  { name: 'inEyes', parent: 'frame', at: [2, -56], img: img(26, 12, 13, 6, (c) => {
    for (const x of [7, 19]) { c.fillStyle = 'rgba(255,230,120,0.35)'; c.beginPath(); ell(c, x, 6, 5.5, 4.5); c.fill(); c.fillStyle = '#ffe680'; c.beginPath(); ell(c, x, 6, 3, 2.2); c.fill(); }
  }) },
  { name: 'door', parent: 'frame', at: [-22, 0], img: img(48, 74, 2, 72, (c) => {
    paper(c, () => rr(c, 1, 1, 44, 71, 2), WOOD, { y0: 1, y1: 72 });
    for (const [y, h] of [[34, 15], [52, 16]] as const) { paper(c, () => rr(c, 7, y, 32, h, 2), shade(WOOD, -0.08), { lw: 1.6, y0: y, y1: y + h, top: -0.12, bot: 0.12 }); }
    c.strokeStyle = shade(WOOD, -0.3); c.lineWidth = 1; c.beginPath(); for (const x of [13, 25, 35]) { c.moveTo(x, 4); c.lineTo(x, 31); } c.stroke();
    paper(c, () => rr(c, 14, 25, 18, 6, 1.5), BRASS, { lw: 1.8, y0: 25, y1: 31 });                                     // number plate
    c.fillStyle = INK; c.font = 'bold 6px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('12', 23, 28.3);
    paper(c, () => ell(c, 40, 46, 3.4, 3.4), BRASS, { lw: 1.8, y0: 42, y1: 50 });                                     // knob
    for (const y of [8, 64]) paper(c, () => rr(c, -0.5, y, 5, 6, 1), '#8d8d9e', { lw: 1.4, y0: y, y1: y + 6 });      // hinges
    shine(c, 5, 6, 5, 28, 0.35, 2);
  }) },
  { name: 'eye', parent: 'door', at: [23, -58], img: wardEye('calm') },
  { name: 'eyeMad', parent: 'door', at: [23, -58], img: wardEye('mad') },
  { name: 'eyeDizzy', parent: 'door', at: [23, -58], img: wardEye('dizzy') },
  { name: 'eyeOuch', parent: 'door', at: [23, -58], img: wardEye('ouch') },
  { name: 'brow', parent: 'door', at: [23, -71], img: img(26, 8, 13, 4, (c) => paper(c, () => { c.moveTo(2, 3); c.quadraticCurveTo(13, 0, 24, 3); c.lineTo(23, 6.5); c.quadraticCurveTo(13, 4, 3, 6.5); c.closePath(); }, '#5a3020', { lw: 1.8, y0: 0, y1: 7 })) },
  { name: 'slot', parent: 'door', at: [23, -44], img: img(24, 14, 12, 7, (c) => {
    paper(c, () => rr(c, 2, 2, 20, 10, 2.5), BRASS, { lw: 2, y0: 2, y1: 12 });
    paper(c, () => rr(c, 5, 4.5, 14, 5, 1.5), '#3a1424', { lw: 1.4, y0: 4, y1: 10 });
    c.fillStyle = '#fffaf0'; for (const x of [6.5, 10, 13.5]) { c.beginPath(); c.moveTo(x, 4.8); c.lineTo(x + 1.5, 7); c.lineTo(x + 3, 4.8); c.closePath(); c.fill(); }
  }) },
  { name: 'keys', parent: 'door', at: [40, -26], img: img(22, 26, 8, 3, (c) => {
    c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); ell(c, 8, 9, 6, 6); c.stroke(); c.strokeStyle = BRASS; c.lineWidth = 2; c.beginPath(); ell(c, 8, 9, 6, 6); c.stroke();
    for (const [x, r, col] of [[4, 0.3, BRASS], [10, -0.2, '#b9c0cc'], [14, -0.6, BRASS]] as const) {
      c.save(); c.translate(x, 14); c.rotate(r);
      paper(c, () => { ell(c, 0, 0, 2.6, 2.6); }, col, { lw: 1.4, y0: -3, y1: 3 });
      paper(c, () => { c.moveTo(-1, 2); c.lineTo(1, 2); c.lineTo(1, 10); c.lineTo(3, 10); c.lineTo(3, 12); c.lineTo(-1, 12); c.closePath(); }, col, { lw: 1.2, y0: 2, y1: 12 });
      c.restore();
    }
  }) },
  { name: 'armF', parent: 'c', at: [26, -14], img: wardArm(0, false) },
  { name: 'foreF', parent: 'armF', at: [0, 15], img: wardArm(0, true) },
  { name: 'dust', at: [34, -6], img: puffImg(7, '#efe2c6') },
  { name: 'dust2', at: [-28, -6], img: puffImg(6, '#efe2c6') },
  ...starParts('c', [0, -62], 5),
];
function wardPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t, v = x.variant;
  let p: Pose;
  const keysSwing = (a: number): T5 => [a];
  switch (x.state) {
    case 'move': {                  // a heavy rocking stomp
      const ph = T * 7, s = Math.sin(ph);
      p = add({ c: [0.07 * s, 0, -3 * Math.abs(Math.cos(ph))], legF: [-0.45 * s, 0, Math.min(0, -2.5 * Math.cos(ph))], legB: [0.45 * s, 0, Math.min(0, 2.5 * Math.cos(ph))], armF: [0.4 * s], foreF: [-0.3], armB: [-0.4 * s], foreB: [-0.3],
        keys: keysSwing(-0.5 * Math.sin(ph - 1.2)), door: [0, 0, 0, 1 - 0.03 * Math.abs(s), 1] }, only('eye', WARD_EYES));
      break;
    }
    case 'windup': {
      const k = ease.out(ramp(t, 0, 0.35)), tr = Math.sin(T * 50) * 0.7 * ramp(t, 0.25, 0.5);
      if (v === 1) {                // the door creaks open: something glows inside
        p = add({ c: [-0.12 * k, tr, -2 * k, 1, 1 + 0.03 * k], door: [0, 0, 0, 1 - 0.78 * k, 1], armF: [-0.4 * k], foreF: [-0.9 * k], armB: [0.6 * k], foreB: [-0.5 * k], legF: [-0.15 * k], legB: [0.2 * k],
          keys: keysSwing(0.5 * k * Math.sin(T * 9)), inEyes: [0, 0, 0, 1, k], brow: [0, 0, 2 * k] }, only('eyeMad', WARD_EYES));
      } else {                      // rears up for a shoulder bash
        p = add({ c: [-0.2 * k, tr - 3 * k, -5 * k, 1 - 0.03 * k, 1 + 0.06 * k], armF: [1.5 * k], foreF: [-0.6 * k], armB: [1.4 * k], foreB: [-0.4 * k], legF: [-0.35 * k], legB: [0.25 * k], keys: keysSwing(0.7 * k), brow: [0, 0, 2 * k] }, only('eyeMad', WARD_EYES));
      }
      break;
    }
    case 'attack': {
      const k = ease.out(ramp(t, 0, 0.07)), r = ease.io(ramp(t, 0.2, 0.36)), m = k * (1 - r), d = ramp(t, 0.03, 0.3);
      if (v === 1) {                // the door slams shut and the whole thing tips forward
        const shut = Math.min(1.08, 0.22 + 0.86 * ease.back(ramp(t, 0, 0.07)));
        p = add({ c: [0.42 * m, 6 * m, 3 * m], door: [0, 0, 0, t < 0.07 ? shut : 1 + 0.06 * Math.sin(t * 40) * (1 - r), 1], armF: [-1.2 * m], foreF: [-0.4 * m], armB: [-0.9 * m], legF: [-0.6 * m], legB: [0.7 * m],
          keys: keysSwing(-1.1 * m), brow: [0, 0, 2] }, only('eyeMad', WARD_EYES),
          { dust: [0, 18 * d, -6 * d, 0.6 + 0.8 * d, 0.6 + 0.6 * d], dust2: [0, -14 * d, -4 * d, 0.5 + 0.6 * d, 0.5 + 0.5 * d] });
      } else {                      // shoulder bash
        p = add({ c: [0.3 * m, 12 * m, 0, 1 + 0.06 * m, 1 - 0.05 * m], armF: [-0.4 * m], foreF: [-1.2 * m], armB: [1.4 * m], legF: [-0.7 * m], legB: [0.8 * m], keys: keysSwing(-0.9 * m), door: [0, 0, 0, 0.94 + 0.06 * (1 - m), 1], brow: [0, 0, 2] },
          only('eyeMad', WARD_EYES), { dust2: [0, -14 * d, -4 * d, 0.5 + 0.7 * d, 0.5 + 0.5 * d] });
      }
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [-0.15 * k, -4 * k, 0, 1 + 0.06 * k, 1 - 0.06 * k], door: [0, 0, 0, 1 - 0.25 * k, 1], armF: [1.2 * k], armB: [1.2 * k], keys: keysSwing(1 * k), inEyes: k > 0.3 ? [0, 0, 0, 1, 1] : OFF }, only('eyeOuch', WARD_EYES));
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 3);
      p = add({ c: [0.14 + 0.04 * w, 0, 1], door: [0, 0, 0, 0.6 + 0.12 * Math.sin(T * 2.3), 1], armF: [0.3 + 0.15 * w], foreF: [0.2], armB: [0.4 - 0.15 * w], keys: keysSwing(0.2 * w), legF: [-0.2], legB: [0.2] },
        only('eyeDizzy', WARD_EYES), orbit(STARS, T, 18, 5));
      break;
    }
    case 'dead': {                  // topples forward and flattens
      const k = ease.in(ramp(t, 0, 0.3));
      p = add({ c: [1.52 * k, 34 * k, 36 * k, 1, 1 - 0.25 * k], door: [0, 0, 0, 1, 1], armF: [-1.5 * k], armB: [-1.5 * k], legF: [-0.8 * k], legB: [-0.8 * k], keys: keysSwing(-1.5 * k) }, only('eyeDizzy', WARD_EYES),
        k > 0.7 ? { dust: [0, 20 * k, -6, 1.3, 1.1], dust2: [0, -6, -6, 1, 0.9] } : {});
      break;
    }
    default: {
      const b = Math.sin(T * 2.4);
      p = add({ c: [0.025 * b, 0, 0], frame: [0, 0, 0, 1, 1 + 0.012 * b], armF: [0.06 * b], foreF: [-0.25], armB: [-0.06 * b], foreB: [-0.25], keys: keysSwing(0.25 * Math.sin(T * 2.4 - 1)), door: [0, 0, 0, 1 - 0.04 * Math.max(0, Math.sin(T * 0.8)), 1] }, only('eye', WARD_EYES));
    }
  }
  return fx(p, WARD_FX);
}

// ================================================================== DOOR FLOODER (area 2 boss): a tangle of hoses bursting out of a huge door frame
const IRON = '#4d6c84', HOSE_G = '#58b55a', HOSE_R = '#e4572e', HOSE_B = '#3f7fd0';
const SEG = 30;                                                     // hose segment length (joint to joint)
function hoseSeg(col: string, w: number, dark = 0): Img {
  const W = w + 6;
  return img(W, SEG + w + 6, W / 2, w / 2 + 3, (c) => {
    paper(c, () => rr(c, 3, 3, w, SEG + w, w / 2), shade(col, dark), { y0: 3, y1: SEG + w + 3, top: 0.25, bot: -0.15 });
    c.save(); c.beginPath(); rr(c, 3, 3, w, SEG + w, w / 2); c.clip();
    c.strokeStyle = shade(col, dark - 0.3); c.lineWidth = 1.3;
    for (let y = w / 2 + 6; y < SEG + w / 2 + 2; y += 6) { c.beginPath(); c.moveTo(3, y); c.quadraticCurveTo(W / 2, y + 2.5, W - 3, y); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(3 + w * 0.2, 6, w * 0.16, SEG + w - 6);
    c.restore();
  });
}
function hoseEnd(col: string, w: number): Img {
  return img(w + 14, 30, (w + 14) / 2, 3, (c) => {
    const cx = (w + 14) / 2;
    paper(c, () => rr(c, cx - w / 2 - 2, 1, w + 4, 9, 2), BRASS, { lw: 2.2, y0: 1, y1: 10 });
    paper(c, () => { c.moveTo(cx - w / 2 + 1, 9); c.lineTo(cx + w / 2 - 1, 9); c.lineTo(cx + w / 2 + 4, 24); c.lineTo(cx - w / 2 - 4, 24); c.closePath(); }, shade(col, -0.05), { lw: 2.2, y0: 9, y1: 24 });
    paper(c, () => ell(c, cx, 24.5, w / 2 + 4, 3.5), '#1c3550', { lw: 2, y0: 21, y1: 28 });
    c.fillStyle = '#9fe0f6'; for (const dx of [-4, 0, 4]) { c.beginPath(); ell(c, cx + dx, 24.5, 1.1, 1.1); c.fill(); }
  });
}
const FL_EYES = ['eyesX', 'eyesSpin', 'eyesShut'];
const TENT_F = ['tf1', 'tf2', 'tf3', 'tf4'], TENT_U = ['tu1', 'tu2', 'tu3', 'tu4'], TENT_B = ['tb1', 'tb2', 'tb3'];
const FL_DROPS = ['fd1', 'fd2', 'fd3', 'fd4', 'fd5'], SCRAPS = ['sc1', 'sc2', 'sc3'];
const FL_FX = [...FL_EYES, 'rage', 'cracks', 'steam1', 'steam2', 'jet', 'splash', ...FL_DROPS, ...SCRAPS, 'spark0', 'spark1', ...STARS, 'dust', 'dust2'];
function chain(names: string[], parent: string, at: [number, number], col: string, w: number, end: Img, dark = 0, behind = false): PartDef[] {
  const out: PartDef[] = names.map((n, i) => ({ name: n, parent: i ? names[i - 1] : parent, at: i ? [0, SEG] : at, img: hoseSeg(col, w - i * 2, dark), behind: i === 0 && behind }));
  out.push({ name: names[names.length - 1] + 'End', parent: names[names.length - 1], at: [0, SEG + 2], img: end });
  return out;
}
function scrapImg(col: string): Img {
  return img(14, 12, 7, 6, (c) => { paper(c, () => { c.moveTo(2, 3); c.lineTo(11, 1); c.lineTo(12, 9); c.lineTo(4, 11); c.closePath(); }, col, { lw: 1.4, y0: 1, y1: 11 }); c.fillStyle = 'rgba(29,26,51,0.4)'; c.fillRect(4, 5, 6, 1); c.fillRect(4, 7.4, 4, 1); });
}
function flEyes(kind: 'x' | 'spin' | 'shut'): Img {
  return img(56, 30, 28, 15, (c) => {
    paper(c, () => { ell(c, 16, 15, 12, 12.5); ell(c, 40, 14, 11, 11.5); }, BRASS, { lw: 0.01, y0: 0, y1: 30, top: 0.1, bot: 0 });
    if (kind === 'x') { xEye(c, 16, 15, 8.5); xEye(c, 40, 14, 8); }
    else if (kind === 'shut') { squint(c, 16, 15, 8.5, 1); squint(c, 40, 14, 8, -1); }
    else { spiralEye(c, 16, 15, 10); spiralEye(c, 40, 14, 9.4); }
  });
}
const FLOODER: PartDef[] = [
  { name: 'puddle', at: [10, -6], img: img(300, 26, 150, 13, (c) => {
    paper(c, () => { c.moveTo(20, 13); c.bezierCurveTo(30, 2, 120, 3, 160, 4); c.bezierCurveTo(230, 2, 296, 6, 290, 14); c.bezierCurveTo(286, 23, 200, 22, 150, 22); c.bezierCurveTo(80, 24, 8, 22, 20, 13); c.closePath(); }, WATER, { lw: 2.4, y0: 3, y1: 23, top: 0.35 });
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(60, 10); c.lineTo(110, 9); c.moveTo(190, 11); c.lineTo(240, 10); c.stroke();
  }) },
  { name: 'c', at: [0, -110] },
  ...chain(TENT_B, 'c', [-56, -60], HOSE_B, 20, hoseEnd(HOSE_B, 14), -0.15),
  { name: 'brokenDoor', parent: 'c', at: [-72, -60], img: img(56, 120, 6, 6, (c) => {
    paper(c, () => { c.moveTo(4, 2); c.lineTo(50, 6); c.lineTo(52, 60); c.lineTo(44, 66); c.lineTo(48, 80); c.lineTo(40, 104); c.lineTo(28, 98); c.lineTo(20, 116); c.lineTo(3, 112); c.closePath(); }, shade(WOOD, -0.15), { y0: 2, y1: 116 });
    c.strokeStyle = shade(WOOD, -0.45); c.lineWidth = 1.3; c.beginPath(); for (const x of [16, 30, 42]) { c.moveTo(x, 8); c.lineTo(x - 1, 96); } c.stroke();
    paper(c, () => rr(c, 0, 2, 9, 10, 2), '#8d8d9e', { lw: 1.8, y0: 2, y1: 12 });
  }) },
  { name: 'frame', parent: 'c', at: [0, 110], img: img(176, 236, 88, 232, (c) => {
    paper(c, () => rr(c, 8, 22, 160, 210, 4), IRON, { y0: 22, y1: 232 });
    paper(c, () => rr(c, 30, 44, 116, 188, 2), '#211a36', { lw: 2.6, y0: 44, y1: 232, top: 0.12, bot: -0.2 });
    paper(c, () => { c.moveTo(2, 26); c.lineTo(10, 8); c.lineTo(166, 8); c.lineTo(174, 26); c.closePath(); }, shade(IRON, 0.12), { y0: 8, y1: 26 });     // lintel
    paper(c, () => rr(c, 66, 10, 44, 14, 2), BRASS, { lw: 2, y0: 10, y1: 24 });
    c.fillStyle = INK; for (const x of [76, 88, 100]) { c.beginPath(); c.moveTo(x - 4, 17); c.lineTo(x + 2, 17); c.moveTo(x, 14); c.lineTo(x + 3, 17); c.lineTo(x, 20); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); }
    for (const [x0, x1] of [[19, 19], [157, 157]]) for (let y = 40; y < 228; y += 22) { paper(c, () => ell(c, x0, y, 3, 3), shade(IRON, 0.35), { lw: 1.4, y0: y - 3, y1: y + 3 }); void x1; }
    for (let x = 22; x < 160; x += 22) paper(c, () => ell(c, x, 17, 2.4, 2.4), shade(IRON, 0.4), { lw: 1.2, y0: 14, y1: 20 });
    c.fillStyle = WATER; c.beginPath(); c.moveTo(30, 232); c.bezierCurveTo(50, 205, 120, 210, 146, 232); c.closePath(); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();     // water gushing out
    shine(c, 13, 34, 13, 220, 0.3, 3);
  }) },
  { name: 'cracks', parent: 'frame', at: [0, 0], img: img(176, 236, 88, 232, (c) => {
    c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath();
    c.moveTo(12, 70); c.lineTo(22, 80); c.lineTo(18, 92); c.lineTo(27, 104); c.moveTo(150, 140); c.lineTo(162, 150); c.lineTo(156, 160); c.moveTo(120, 8); c.lineTo(114, 18); c.lineTo(122, 24); c.stroke();
    c.fillStyle = 'rgba(94,195,234,0.9)'; for (const [x, y] of [[24, 106], [158, 162]]) { c.beginPath(); ell(c, x, y, 2.5, 3.5); c.fill(); }
  }) },
  { name: 'tangle', parent: 'frame', at: [0, -110], img: img(118, 150, 59, 75, (c) => {
    const hoseLine = (col: string, w: number, path: () => void) => {
      c.beginPath(); path(); c.lineWidth = w + 5; c.strokeStyle = INK; c.stroke();
      c.beginPath(); path(); c.lineWidth = w; c.strokeStyle = col; c.stroke();
      c.beginPath(); path(); c.lineWidth = 1.6; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]);
    };
    hoseLine(shade(HOSE_B, -0.15), 8, () => { c.moveTo(4, 140); c.bezierCurveTo(30, 90, 100, 130, 92, 80); c.bezierCurveTo(86, 40, 20, 70, 26, 20); });
    hoseLine(MUSTARD, 6, () => { c.moveTo(114, 120); c.bezierCurveTo(70, 132, 18, 110, 40, 74); c.bezierCurveTo(58, 46, 100, 60, 96, 24); });
    hoseLine(shade(HOSE_R, -0.1), 8, () => { c.moveTo(8, 60); c.bezierCurveTo(40, 30, 70, 110, 106, 92); c.bezierCurveTo(118, 86, 112, 50, 84, 44); });
    hoseLine(shade(HOSE_G, -0.1), 9, () => { c.moveTo(20, 146); c.bezierCurveTo(26, 116, 66, 100, 60, 64); c.bezierCurveTo(56, 36, 34, 40, 42, 6); });
    hoseLine('#8d8d9e', 5, () => { c.moveTo(100, 146); c.bezierCurveTo(96, 118, 60, 132, 46, 112); c.bezierCurveTo(34, 96, 6, 104, 8, 86); });
  }) },
  ...chain(TENT_U, 'c', [66, -12], HOSE_R, 22, hoseEnd(HOSE_R, 16)),
  { name: 'n1', parent: 'c', at: [6, -40], img: hoseSeg(HOSE_G, 28) },
  { name: 'n2', parent: 'n1', at: [0, SEG], img: hoseSeg(HOSE_G, 27) },
  { name: 'head', parent: 'n2', at: [0, SEG + 4], img: img(120, 100, 44, 62, (c) => {
    paper(c, () => rr(c, 26, 50, 36, 22, 6), '#8d8d9e', { y0: 50, y1: 72 });                                       // the coupling collar
    blob(c, () => { ell(c, 46, 46, 38, 34); }, BRASS, { y0: 10, y1: 80, lw: 3 });
    c.save(); c.beginPath(); ell(c, 46, 46, 38, 34); c.clip();
    c.strokeStyle = shade(BRASS, -0.3); c.lineWidth = 1.6; for (const x of [22, 30]) { c.beginPath(); c.moveTo(x, 10); c.quadraticCurveTo(x - 10, 46, x, 82); c.stroke(); }
    c.fillStyle = shade(BRASS, -0.18); c.beginPath(); ell(c, 50, 82, 40, 12); c.fill();
    c.restore();
    for (const [x, y] of [[18, 30], [14, 50], [22, 68], [46, 13], [64, 16]] as const) paper(c, () => ell(c, x, y, 2.6, 2.6), shade(BRASS, 0.4), { lw: 1.3, y0: y - 3, y1: y + 3 });
    madEye(c, 50, 36, 11, BRASS, 0.35, 0.45, 0.2);
    madEye(c, 74, 34, 10, BRASS, -0.35, 0.45, 0.2);
    shine(c, 20, 26, 30, 14, 0.55, 3);
  }) },
  { name: 'tip', parent: 'head', at: [34, 8], img: img(46, 50, 4, 25, (c) => {                                          // the nozzle mouth
    paper(c, () => { c.moveTo(3, 12); c.lineTo(32, 5); c.lineTo(32, 45); c.lineTo(3, 38); c.closePath(); }, shade(BRASS, -0.05), { y0: 5, y1: 45 });
    c.strokeStyle = shade(BRASS, -0.35); c.lineWidth = 1.4; c.beginPath(); c.moveTo(14, 10); c.lineTo(14, 40); c.moveTo(22, 8); c.lineTo(22, 42); c.stroke();
    paper(c, () => ell(c, 33, 25, 9, 20.5), '#8d8d9e', { lw: 2.4, y0: 4, y1: 46 });
    paper(c, () => ell(c, 34.5, 25, 6, 16), '#2a1430', { lw: 1.6, y0: 9, y1: 41, top: 0.1, bot: -0.3 });
    c.fillStyle = '#fffaf0'; for (const y of [12, 32]) { c.beginPath(); c.moveTo(31.5, y); c.lineTo(36, y + 3); c.lineTo(31.5, y + 6); c.closePath(); c.fill(); }
    paper(c, () => ell(c, 36, 30, 3.5, 6), PINK, { lw: 1.2, y0: 24, y1: 36 });
  }) },
  { name: 'jet', parent: 'tip', at: [36, 0], img: img(150, 44, 2, 22, (c) => {
    paper(c, () => { c.moveTo(2, 12); c.bezierCurveTo(50, 8, 100, 4, 140, 6); c.quadraticCurveTo(150, 22, 140, 38); c.bezierCurveTo(100, 40, 50, 36, 2, 32); c.closePath(); }, WATER, { lw: 2.6, y0: 4, y1: 40, top: 0.4, bot: -0.15 });
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.beginPath();
    for (const [y, a] of [[16, 0], [24, 1], [30, 2]] as const) { c.moveTo(10 + a * 8, y); for (let x = 10 + a * 8; x < 130; x += 16) c.quadraticCurveTo(x + 4, y - 2.5, x + 8, y), c.quadraticCurveTo(x + 12, y + 2.5, x + 16, y); }
    c.stroke();
  }) },
  { name: 'splash', parent: 'jet', at: [146, 0], img: puffImg(13, '#bfe9ff') },
  ...FL_DROPS.map((n, i): PartDef => ({ name: n, parent: 'jet', at: [140, 0], img: dropImg(i % 2 ? 4 : 5, i % 2 ? '#9fe0f6' : WATER) })),
  ...SCRAPS.map((n, i): PartDef => ({ name: n, parent: 'jet', at: [140, 0], img: scrapImg([CREAM, MUSTARD, '#bfe9d9'][i]) })),
  { name: 'eyesX', parent: 'head', at: [18, -27], img: flEyes('x') },
  { name: 'eyesSpin', parent: 'head', at: [18, -27], img: flEyes('spin') },
  { name: 'eyesShut', parent: 'head', at: [18, -27], img: flEyes('shut') },
  { name: 'brows', parent: 'head', at: [18, -44], img: img(60, 18, 30, 9, (c) => {
    paper(c, () => { c.moveTo(3, 4); c.quadraticCurveTo(16, 1, 27, 13); c.lineTo(25, 16); c.quadraticCurveTo(14, 9, 3, 9); c.closePath(); }, '#5a4020', { lw: 2.2, y0: 2, y1: 16 });
    paper(c, () => { c.moveTo(57, 4); c.quadraticCurveTo(45, 1, 35, 12); c.lineTo(37, 15); c.quadraticCurveTo(47, 9, 57, 9); c.closePath(); }, '#5a4020', { lw: 2.2, y0: 2, y1: 16 });
  }) },
  { name: 'rage', parent: 'head', at: [18, -12], img: img(62, 18, 31, 9, (c) => { blush(c, 14, 9, 11, 6, 0.55); blush(c, 46, 9, 9, 5.5, 0.5); vein(c, 54, 0, 8); }) },
  { name: 'steam1', parent: 'head', at: [-10, -52], img: puffImg(10) },
  { name: 'steam2', parent: 'head', at: [20, -60], img: puffImg(9) },
  { name: 'spark0', parent: 'frame', at: [-70, -150], img: sparkImg(11) },
  { name: 'spark1', parent: 'frame', at: [70, -90], img: sparkImg(10, '#bff4ff') },
  ...chain(TENT_F, 'c', [62, 90], HOSE_G, 22, hoseEnd(HOSE_G, 16), 0.05),
  ...starParts('head', [0, -72], 7),
  { name: 'dust', at: [110, -10], img: puffImg(14, '#bfe9ff') },
  { name: 'dust2', at: [160, -10], img: puffImg(12, '#bfe9ff') },
];
/** A hose whose segments add up to a curl: base angle a0, per-segment bend, plus a travelling wave. */
function hose(names: string[], a0: number, bend: number, amp: number, T: number, f: number, lag = 0.9): Pose {
  const p: Pose = {};
  names.forEach((n, i) => { p[n] = [(i ? bend : a0) + amp * Math.sin(T * f - i * lag) * (i ? 1 : 0.4)]; });
  return p;
}
function flooderPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t, v = x.variant;
  const anger = clamp01(Math.max(x.phase / 2, (1 - x.hp) * 1.2)), sp = 1 + anger * 0.8;
  const p: Pose = { brows: [0, 0, 2.5 * anger] };
  if (anger > 0.3) { p.rage = [0, 0, 0, 1, 1]; const u = fract(T * 1.4); p.steam1 = puff(u, -12, -30, 0.9); p.steam2 = puff(fract(u + 0.5), 10, -34, 0.8); }
  if (x.phase >= 2 || x.hp < 0.34) p.cracks = [0, 0, 0, 1, 1];
  /** The neck: two hose segments; the head is counter-rotated so it stays upright, `lean` tips it forward (+) or back (-). */
  const neck = (a1: number, a2: number, lean: number, hs = 1): void => { p.n1 = [a1]; p.n2 = [a2]; p.head = [-a1 - a2 + lean, 0, 0, hs, hs]; };
  const set = (q: Pose): void => { Object.assign(p, q); };
  const br = Math.sin(T * 2 * sp);
  const idle = (): void => {
    set(hose(TENT_F, -1.45, -0.04, 0.12, T, 2.6 * sp)); set(hose(TENT_U, 3.9, 0.25, 0.2, T, 2.2 * sp)); set(hose(TENT_B, 2.3, 0.3, 0.3, T, 2.4 * sp, 1.1));
    neck(-2.75 + 0.05 * br, 0.35 - 0.06 * Math.sin(T * 2 * sp - 0.8), 0.04 * br);
    set({ frame: [0, 0, 0, 1, 1 + 0.008 * br], tip: [0, 0, 0, 1, 1 + 0.05 * Math.max(0, br)], brokenDoor: [0.1 + 0.06 * Math.sin(T * 1.7)], tangle: [0, 0, 0, 1 + 0.02 * br, 1 + 0.03 * br] });
  };
  switch (x.state) {
    case 'move': {                  // slides on its puddle, hoses paddling
      const ph = T * 6;
      set(hose(TENT_F, -1.4, -0.06, 0.35, T, 6)); set(hose(TENT_U, 3.85, 0.25, 0.3, T, 4)); set(hose(TENT_B, 2.2, 0.3, 0.5, T, 5, 1.1));
      neck(-2.7 + 0.08 * Math.sin(ph), 0.35, 0.08 * Math.sin(ph * 2));
      set({ c: [0.03 * Math.sin(ph), 0, -3 * Math.abs(Math.sin(ph))], brokenDoor: [0.25 * Math.sin(ph - 1)], tangle: [0, 0, 0, 1 + 0.03 * Math.sin(ph * 2), 1 - 0.03 * Math.sin(ph * 2)] });
      break;
    }
    case 'windup': {
      const k = ease.io(ramp(t, 0, 0.55)), tr = Math.sin(T * 50) * 1.2 * ramp(t, 0.4, 0.7);
      idle(); p.c = [0, tr, 0];
      if (v === 1) {                // overhead smash: the red hose rears up and back
        set(hose(TENT_U, 3.9 + 0.25 * k, 0.25 - 0.57 * k, 0.06, T, 14)); neck(-2.75 - 0.15 * k, 0.35, -0.2 * k); p.c = [-0.04 * k, tr, 0];
      } else if (v === 2) {         // nozzle spray: head pulls back, the mouth swells
        neck(-2.75 - 0.3 * k, 0.35 - 0.25 * k, -0.3 * k, 1 + 0.05 * k); p.tip = [-0.1 * k, -2 * k, 0, 1 + 0.2 * k, 1 + 0.32 * k];
      } else {                      // ground sweep: the green hose coils back like a spring
        set(hose(TENT_F, -1.45 - 0.55 * k, -0.04 - 0.76 * k, 0.08, T, 14)); neck(-2.75, 0.35, 0.15 * k); p.c = [-0.03 * k, tr, 0];
      }
      break;
    }
    case 'attack': {
      const k = ease.out(ramp(t, 0, 0.1)), r = ease.io(ramp(t, 0.35, 0.6)), m = k * (1 - r), d = ramp(t, 0.05, 0.4);
      idle();
      if (v === 1) {                // overhead smash: down in front
        const A = (a: number, b: number) => a + (b - a) * m;
        set({ tu1: [A(4.15, 5.45)], tu2: [A(-0.32, 0.1)], tu3: [A(-0.32, 0.1)], tu4: [A(-0.32, 0.12)] });
        neck(-2.6, 0.3, 0.2 * m); p.c = [0.06 * m, 5 * m, 0];
        p.dust = [0, 0, 0, (0.6 + 1.2 * d) * (1 - r), (0.6 + 0.9 * d) * (1 - r)]; p.dust2 = [0, 10 * d, 0, (0.5 + 0.8 * d) * (1 - r), (0.5 + 0.7 * d) * (1 - r)];
      } else if (v === 2) {         // nozzle spray: a long water jet with paper scraps
        const j = ease.out(ramp(t, 0, 0.1)), w = Math.sin(T * 40);
        neck(-2.5, -0.15, 0.3 + 0.03 * w); p.c = [0, w * 0.6, 0]; set(hose(TENT_U, 5.1, 0.2, 0.15, T, 6)); p.tip = [0.04 * w, 3, 0, 1.2, 1.4];
        p.jet = [0.02 * w, 0, 0, j, 1 + 0.08 * Math.sin(T * 33)]; p.splash = [T * 3, 0, 0, j * (1 + 0.2 * Math.sin(T * 25)), j * (1 + 0.2 * Math.sin(T * 25))];
        FL_DROPS.forEach((n, i) => { const u = fract(T * 2.2 + i / 5); p[n] = [0, 6 + 34 * u, -14 + (i - 2) * 6 * u + 30 * u * u, j, j]; });
        SCRAPS.forEach((n, i) => { const u = fract(T * 1.6 + i / 3); p[n] = [T * 6 + i, 4 + 40 * u, -18 * u + (i - 1) * 10 * u + 26 * u * u, j, j]; });
      } else {                      // ground sweep: the hose whips out flat along the floor
        const A = (a: number, b: number) => a + (b - a) * m;
        set({ tf1: [A(-1.45, -1.62)], tf2: [A(-0.04, 0.02) + 0.12 * Math.sin(T * 30) * m], tf3: [A(-0.04, 0.02)], tf4: [A(-0.04, 0.03)] });
        neck(-2.65, 0.35, 0.12 * m); p.c = [0.04 * m, 4 * m, 0];
        p.dust = [0, 30 * d, -4 * d, (0.6 + 1.1 * d) * (1 - r), (0.6 + 0.8 * d) * (1 - r)]; p.dust2 = [0, 20 * d, -2, (0.5 + 0.9 * d) * (1 - r), (0.5 + 0.7 * d) * (1 - r)];
      }
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.35));
      idle(); neck(-2.75 - 0.25 * k, 0.35, -0.4 * k);
      set({ c: [-0.05 * k, -7 * k, 0], tip: [0, 0, 0, 1 + 0.2 * k, 1 + 0.3 * k], eyesShut: [0, 0, 0, 1, 1], brokenDoor: [0.5 * k] });
      for (const n of [...TENT_F, ...TENT_U, ...TENT_B]) p[n] = [(p[n]?.[0] ?? 0) + 0.3 * k];
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 2.4), fl = (o: number): T5 => (Math.sin(T * 37 + o) > 0.3 ? [T * 9, 0, 0, 0.7 + 0.3 * Math.sin(T * 50 + o), 0.7 + 0.3 * Math.sin(T * 50 + o)] : OFF);
      set(hose(TENT_F, -1.5, 0.02, 0.06, T, 1.5)); set(hose(TENT_U, 5.0, 0.22, 0.08, T, 1.3)); set(hose(TENT_B, 1.0, 0.2, 0.1, T, 1.4));
      neck(-2.3 + 0.05 * w, 0.7, 0.45 + 0.1 * w);
      set({ c: [0.03 * w, 0, 3], tip: [0.3, 0, 4, 0.9, 1.1], brokenDoor: [0.5 + 0.1 * w], eyesSpin: [0, 0, 0, 1, 1], spark0: fl(0), spark1: fl(2) });
      set(orbit(STARS, T, 34, 8, 4)); delete p.steam1; delete p.steam2; delete p.rage;
      break;
    }
    case 'dead': {                  // the hoses go limp and the head sags
      const k = ease.out(ramp(t, 0, 0.33)), L = (a: number, b: number) => a + (b - a) * k;
      set(hose(TENT_F, L(-1.45, -1.55), L(-0.04, 0.02), 0, T, 1)); set(hose(TENT_U, L(3.9, 5.0), L(0.25, 0.25), 0, T, 1)); set(hose(TENT_B, L(2.3, 0.9), 0.3, 0, T, 1));
      neck(L(-2.75, -1.9), L(0.35, 0.9), 0.9 * k);
      set({ c: [0, 0, 6 * k], frame: [0.05 * k, 0, 0, 1, 1 - 0.06 * k], tip: [0.4 * k, 0, 0, 0.9, 0.9], brokenDoor: [0.9 * k], eyesX: [0, 0, 0, 1, 1], cracks: [0, 0, 0, 1, 1], dust: [0, -40, 0, 0.5 + k, 0.5 + 0.8 * k] });
      delete p.steam1; delete p.steam2;
      break;
    }
    default: idle();
  }
  return fx(p, FL_FX);
}
const FLOODER_DEMO: [string, Partial<EnemyCtx>][] = [
  ['idle', {}], ['idle phase2', { phase: 2, hp: 0.2 }], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.35 }],
  ['sweep wind .2', { state: 'windup', variant: 0, t: 0.2 }], ['sweep wind .6', { state: 'windup', variant: 0, t: 0.6 }], ['sweep', { state: 'attack', variant: 0, t: 0.15 }],
  ['smash wind .6', { state: 'windup', variant: 1, t: 0.6 }], ['smash .04', { state: 'attack', variant: 1, t: 0.04 }], ['smash .2', { state: 'attack', variant: 1, t: 0.2 }],
  ['spray wind .6', { state: 'windup', variant: 2, t: 0.6 }], ['spray', { state: 'attack', variant: 2, t: 0.3 }],
  ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam', phase: 1, hp: 0.5 }], ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }],
];

export const RIGS: EnemyRig[] = [
  { kind: 'enemy', id: 'flood', name: 'פיצפון שיטפון', parts: FLOOD, scale: 1, pose: floodPose, body: { w: 34, h: 32, origin: 'feet' }, demo: SMALL_DEMO },
  { kind: 'enemy', id: 'tagthief', name: 'גנב התוויות', parts: THIEF, scale: 1, pose: thiefPose, body: { w: 34, h: 50, origin: 'feet' }, demo: SMALL_DEMO },
  { kind: 'enemy', id: 'warden', name: 'שומר הדלת', parts: WARDEN, scale: 1, pose: wardPose, body: { w: 52, h: 84, origin: 'feet' },
    demo: [['idle', {}], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.32 }], ['wind0', { state: 'windup', variant: 0, t: 0.45 }], ['bash', { state: 'attack', variant: 0, t: 0.1 }],
      ['wind1', { state: 'windup', variant: 1, t: 0.45 }], ['slam .04', { state: 'attack', variant: 1, t: 0.04 }], ['slam .12', { state: 'attack', variant: 1, t: 0.12 }], ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam' }],
      ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }]] },
  { kind: 'enemy', id: 'flooder', name: 'מציף הדלתות', parts: FLOODER, scale: 1, pose: flooderPose, body: { w: 190, h: 200, origin: 'feet' }, demo: FLOODER_DEMO },
];
