/**
 * Area 4, "Storm Tower" (the Broadcast Storm): the Stormling, the Echo Knight and the final boss, the Broadcast Storm.
 * Original designs for this game. Shared helpers come from area1.ts.
 * Angles: 0 = a limb hangs down; negative swings it forward (+x); -PI points it straight up.
 */
import { add, ease, eye, INK, paper, rr, ell, shade, shine, type Img, type PartDef, type Pose } from '../puppet';
import type { EnemyCtx, EnemyRig } from '../types';
import {
  CREAM, RED, TEAL, MUSTARD, PINK, OFF, type T5, img, clamp01, ramp, fract, fx, only, orbit, puff, blob, starImg, puffImg, sparkImg,
  ringImg, madEye, spiralEye, squint, xEye, vein, blush,
} from './area1';

const STARS = ['star1', 'star2', 'star3'];
const starParts = (parent: string, at: [number, number], r = 4): PartDef[] => STARS.map((n, i) => ({ name: n, parent, at, img: starImg(i === 1 ? MUSTARD : '#fff3b0', r) }));
const ON: T5 = [0, 0, 0, 1, 1];
const BOLT = '#ffe14d', CLOUD = '#97a5cf', CLOUD_D = '#6a77a8', TIN = '#b8c2d2';
/** A lightning bolt (zigzag) from the top centre (w/2, 2) down to the bottom. */
function boltImg(w: number, h: number, col = BOLT, lw = 2.2): Img {
  return img(w, h, w / 2, 2, (c) => {
    const x = w / 2, k = w * 0.32;
    paper(c, () => { c.moveTo(x + k * 0.3, 2); c.lineTo(x - k, h * 0.48); c.lineTo(x + k * 0.15, h * 0.46); c.lineTo(x - k * 0.55, h - 2); c.lineTo(x + k, h * 0.4); c.lineTo(x - k * 0.05, h * 0.42); c.lineTo(x + k * 0.9, 2); c.closePath(); }, col, { lw, y0: 2, y1: h, top: 0.4, bot: -0.1 });
  });
}
/** A long jagged strike, drawn from the top (w/2, 2) to the floor at (w/2, h-2), with a glow. */
function strikeImg(w: number, h: number, seed: number): Img {
  return img(w, h, w / 2, 2, (c) => {
    const pts: [number, number][] = [[w / 2, 2]];
    for (let i = 1; i < 9; i++) pts.push([w / 2 + Math.sin(i * 2.3 + seed) * w * 0.28, 2 + (h - 4) * (i / 9)]);
    pts.push([w / 2, h - 2]);
    const line = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
    line(); c.lineWidth = 24; c.strokeStyle = 'rgba(255,240,120,0.35)'; c.stroke();
    line(); c.lineWidth = 13; c.strokeStyle = INK; c.stroke();
    line(); c.lineWidth = 8; c.strokeStyle = BOLT; c.stroke();
    line(); c.lineWidth = 2.4; c.strokeStyle = '#fffbe0'; c.stroke();
    c.fillStyle = 'rgba(255,240,120,0.5)'; c.beginPath(); ell(c, w / 2, h - 4, w * 0.45, 5); c.fill();
  });
}
function envImg(col = '#fffaf0', stamp = RED): Img {
  return img(22, 16, 11, 8, (c) => {
    paper(c, () => rr(c, 2, 2, 18, 12, 1.5), col, { lw: 1.8, y0: 2, y1: 14, top: 0.05, bot: -0.12 });
    c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(2.5, 2.5); c.lineTo(11, 9); c.lineTo(19.5, 2.5); c.stroke();
    c.fillStyle = stamp; c.fillRect(14.5, 4, 3.6, 4); c.strokeRect(14.5, 4, 3.6, 4);
  });
}

// ================================================================== STORMLING (Static Sprite): a grumpy little thundercloud with a lightning tail
const STL_FACES = ['face', 'faceMad', 'faceDizzy', 'faceOuch'];
const STL_SPARKS = ['sp1', 'sp2', 'sp3'];
const STL_FX = [...STL_SPARKS, 'zip1', 'zip2', 'puffT', ...STARS, ...STL_FACES];
function stlFace(kind: 'calm' | 'mad' | 'dizzy' | 'ouch'): Img {
  return img(26, 18, 13, 8, (c) => {
    if (kind === 'calm' || kind === 'mad') {
      const m = kind === 'mad';
      madEye(c, 7, 8, m ? 4.4 : 4, CLOUD, m ? 0.6 : 0.42, 0.4, m ? -0.05 : 0.12);
      madEye(c, 18, 7.5, m ? 4.9 : 4.5, CLOUD, m ? -0.6 : -0.42, 0.4, m ? -0.05 : 0.12);
      c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath();
      if (m) { c.moveTo(9, 15.5); for (let i = 1; i <= 5; i++) c.lineTo(9 + i * 1.6, 15.5 + (i % 2 ? -1.6 : 0)); }
      else { c.moveTo(10, 16); c.quadraticCurveTo(12.5, 14, 15, 16); }
      c.stroke();
      if (m) vein(c, 23, 1.5, 4.5);
    } else if (kind === 'dizzy') {
      spiralEye(c, 7, 8, 4); spiralEye(c, 18, 7.5, 4.4);
      c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(9, 15.5); c.bezierCurveTo(11, 13.5, 13, 17.5, 15, 15.5); c.stroke();
    } else {
      squint(c, 7, 8, 3.8, 1); squint(c, 18, 7.5, 4.2, -1);
      paper(c, () => ell(c, 12.5, 15, 2.6, 2.4), '#3a1424', { lw: 1.6, y0: 12, y1: 18 });
    }
  });
}
const STL: PartDef[] = [
  { name: 'c', at: [0, 0] },
  { name: 'tail', parent: 'c', at: [-10, 6], img: img(30, 24, 27, 4, (c) => {                                   // the lightning-bolt tail, pointing back
    paper(c, () => { c.moveTo(28, 2); c.lineTo(15, 7); c.lineTo(18, 10); c.lineTo(3, 21); c.lineTo(12, 11); c.lineTo(9, 9); c.lineTo(26, 6.5); c.closePath(); }, BOLT, { lw: 2, y0: 2, y1: 21, top: 0.4 });
  }) },
  { name: 'puffB', parent: 'c', at: [-11, 8], img: puffImg(4.5, shade(CLOUD, -0.15)) },
  { name: 'body', parent: 'c', at: [0, 0], img: img(40, 32, 20, 17, (c) => {
    const path = () => { ell(c, 11, 19, 8.5, 7.5); ell(c, 19, 12, 10, 9.5); ell(c, 29, 17, 8.5, 8.5); ell(c, 20, 22, 13, 7); };
    blob(c, path, CLOUD, { y0: 3, y1: 30, lw: 2.6 });
    c.save(); c.beginPath(); path(); c.clip();
    c.fillStyle = shade(CLOUD, -0.22); c.beginPath(); ell(c, 20, 31, 18, 5); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(8, 15); c.quadraticCurveTo(11, 11, 15, 12); c.moveTo(16, 6); c.quadraticCurveTo(20, 3.5, 24, 6); c.stroke();
    c.restore();
    c.strokeStyle = BOLT; c.lineWidth = 1.4; c.beginPath(); c.moveTo(31, 5); c.lineTo(33, 8); c.lineTo(31.5, 8.5); c.lineTo(34, 11.5); c.stroke();     // a static crackle
  }) },
  { name: 'face', parent: 'body', at: [2, -1], img: stlFace('calm') },
  { name: 'faceMad', parent: 'body', at: [2, -1], img: stlFace('mad') },
  { name: 'faceDizzy', parent: 'body', at: [2, -1], img: stlFace('dizzy') },
  { name: 'faceOuch', parent: 'body', at: [2, -1], img: stlFace('ouch') },
  { name: 'puffF', parent: 'c', at: [12, 9], img: puffImg(4.5, CLOUD) },
  { name: 'sp1', parent: 'c', at: [-15, -16], img: boltImg(10, 15) },
  { name: 'sp2', parent: 'c', at: [16, -17], img: boltImg(9, 13, '#bff4ff') },
  { name: 'sp3', parent: 'c', at: [4, 12], img: boltImg(9, 12) },
  { name: 'zip1', parent: 'c', at: [-14, -5], img: img(30, 6, 29, 3, (c) => { c.beginPath(); c.moveTo(3, 3); c.lineTo(28, 3); c.lineWidth = 4.4; c.strokeStyle = INK; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#e4ecff'; c.stroke(); }) },
  { name: 'zip2', parent: 'c', at: [-12, 7], img: img(24, 6, 23, 3, (c) => { c.beginPath(); c.moveTo(3, 3); c.lineTo(22, 3); c.lineWidth = 4.4; c.strokeStyle = INK; c.stroke(); c.lineWidth = 2; c.strokeStyle = BOLT; c.stroke(); }) },
  { name: 'puffT', parent: 'c', at: [-22, 2], img: puffImg(5, '#e4ecff') },
  ...starParts('c', [0, -22]),
];
/** Sparks that blink on and off at random-looking moments; `rate` 0..1 = how often. */
function crackle(names: string[], T: number, rate: number, jump = 3): Pose {
  const p: Pose = {};
  names.forEach((n, i) => {
    const on = Math.sin(T * (23 + i * 7) + i * 2.1) > 1 - 2 * rate;
    const s = 0.6 + 0.5 * Math.abs(Math.sin(T * 41 + i));
    p[n] = on ? [T * 6 + i, Math.sin(T * 13 + i) * jump, Math.cos(T * 17 + i * 2) * jump, s, s] : OFF;
  });
  return p;
}
function stlPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  const hover = (f: number, a: number): Pose => ({ c: [0.08 * Math.sin(T * f * 0.5), 0, a * Math.sin(T * f)], body: [0, 0, 0, 1 + 0.04 * Math.sin(T * f * 2), 1 - 0.04 * Math.sin(T * f * 2)], tail: [0.2 * Math.sin(T * f * 1.5)],
    puffF: [0, 0, 1.5 * Math.sin(T * f + 1)], puffB: [0, 0, 1.5 * Math.sin(T * f + 2)] });
  switch (x.state) {
    case 'move': p = add(hover(4, 2), { c: [0.18, 0, 0], tail: [0.35] }, crackle(STL_SPARKS, T, 0.15), only('face', STL_FACES)); break;
    case 'windup': {                // swells up and crackles harder and harder
      const k = ease.out(ramp(t, 0, 0.4)), tr = Math.sin(T * 65) * 1.2 * k;
      p = add(hover(5, 1), { c: [-0.2 * k, -4 * k + tr, 0], body: [0, 0, 0, 1 + 0.32 * k, 1 + 0.26 * k], tail: [0.6 * k + 0.2 * Math.sin(T * 40) * k], puffF: [0, 4 * k, -2 * k], puffB: [0, -3 * k, -2 * k], face: [0, 0, 0, 1, 1] },
        crackle(STL_SPARKS, T, 0.25 + 0.6 * k, 3 + 4 * k), only(t > 0.15 ? 'faceMad' : 'face', STL_FACES));
      break;
    }
    case 'attack': {                // zips forward: stretched long, tail streaming
      const k = ease.out(ramp(t, 0, 0.06));
      p = add({ c: [0.15 * k, 8 * k, 0, 1 + 0.3 * k, 1 - 0.2 * k], body: [0, 0, 0, 1.05, 0.95], tail: [-0.35 * k + 0.1 * Math.sin(T * 50), -3 * k], puffF: [0, 6 * k, -4 * k], puffB: [0, -4 * k, 2 * k],
        zip1: [0, -6 * Math.sin(T * 30), 0, 0.8 + 0.3 * Math.sin(T * 40), 1], zip2: [0, -4 * Math.sin(T * 30 + 1), 0, 0.7 + 0.3 * Math.sin(T * 37), 1], puffT: puff(fract(t * 5), -14, -4, 0.9) },
        crackle(STL_SPARKS, T, 0.7, 6), only('faceMad', STL_FACES));
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [-0.4 * k, -4 * k, 0], body: [0, 0, 0, 1 + 0.25 * k, 1 - 0.25 * k], tail: [0.8 * k], puffF: [0, 5 * k, -3 * k], puffB: [0, -5 * k, -3 * k] }, crackle(STL_SPARKS, T, 0.9 * k, 8), only('faceOuch', STL_FACES));
      break;
    }
    case 'jam': {                   // fizzled out: deflated and drooping, the odd weak spark
      const w = Math.sin(T * 2.6);
      p = add({ c: [0.25 * w, 0, 5 + 2 * Math.sin(T * 1.9)], body: [0.05 * Math.sin(T * 3.3), 0, 0, 1.08, 0.86], tail: [-0.7 + 0.1 * w], puffF: [0, 0, 3], puffB: [0, 0, 3] }, crackle(STL_SPARKS, T, 0.08), only('faceDizzy', STL_FACES), orbit(STARS, T, 13, 4));
      break;
    }
    case 'dead': {                  // a last zap, then it puffs away
      const k = ease.in(ramp(t, 0, 0.32)), b = ramp(t, 0, 0.12);
      p = add({ c: [k * 4, 0, -4 * k, 1 + 0.4 * b - 1.3 * k + 0.001, 1 + 0.3 * b - 1.2 * k + 0.001], tail: [1.5 * k], puffF: [0, 10 * k, 6 * k], puffB: [0, -10 * k, 6 * k] }, t < 0.12 ? crackle(STL_SPARKS, T, 1, 8) : {}, only('faceDizzy', STL_FACES));
      break;
    }
    default: p = add(hover(3, 2.5), crackle(STL_SPARKS, T, 0.12), only('face', STL_FACES));
  }
  return fx(p, STL_FX);
}

// ================================================================== ECHO KNIGHT: a clanking armour of tin cans and megaphones with a bucket helm and a lightning sword
const KN_EYES = ['eyes', 'eyesMad', 'eyesDizzy', 'eyesOuch'];
const KN_FX = ['zap1', 'zap2', 'zap3', 'glow', 'slash', 'dust', 'dust2', ...STARS, ...KN_EYES];
function canImg(w: number, h: number, col: string, band?: string, dark = 0): Img {
  return img(w + 6, h + 6, (w + 6) / 2, 3, (c) => {
    paper(c, () => rr(c, 3, 3, w, h, 3), shade(col, dark), { y0: 3, y1: h + 3, top: 0.3, bot: -0.2 });
    c.save(); c.beginPath(); rr(c, 3, 3, w, h, 3); c.clip();
    if (band) { c.fillStyle = shade(band, dark); c.fillRect(3, 3 + h * 0.3, w, h * 0.4); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(3, 3 + h * 0.3, w, h * 0.4); }
    c.strokeStyle = shade(col, dark - 0.35); c.lineWidth = 1.1; c.beginPath(); c.moveTo(3, 6); c.lineTo(w + 3, 6); c.moveTo(3, h); c.lineTo(w + 3, h); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(3 + w * 0.18, 4, w * 0.12, h - 2);
    c.restore();
  });
}
function knEyes(kind: 'calm' | 'mad' | 'dizzy' | 'ouch'): Img {
  return img(30, 12, 15, 6, (c) => {
    if (kind === 'calm' || kind === 'mad') {
      const col = kind === 'mad' ? '#ff5a3c' : BOLT, gl = kind === 'mad' ? 'rgba(255,90,60,0.45)' : 'rgba(255,230,80,0.45)';
      for (const [x, d] of [[8, 1], [22, -1]] as const) {
        c.fillStyle = gl; c.beginPath(); ell(c, x, 6, 6.5, 4.5); c.fill();
        c.fillStyle = col; c.beginPath(); c.moveTo(x - 4.5, 4 - d * (kind === 'mad' ? 1.4 : 0.4)); c.lineTo(x + 4.5, 4 + d * (kind === 'mad' ? 1.4 : 0.4)); c.lineTo(x + 3.5, 8); c.lineTo(x - 3.5, 8); c.closePath(); c.fill();
        c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
      }
    } else if (kind === 'dizzy') { spiralEye(c, 8, 6, 4); spiralEye(c, 22, 6, 4); }
    else { c.strokeStyle = BOLT; c.lineWidth = 2; for (const [x, d] of [[8, 1], [22, -1]] as const) { c.beginPath(); c.moveTo(x - 3 * d, 2.5); c.lineTo(x + 3 * d, 6); c.lineTo(x - 3 * d, 9.5); c.stroke(); } }
  });
}
function megaphone(dark: number, len = 22): Img {
  return img(len + 8, 24, 3, 12, (c) => {
    paper(c, () => { c.moveTo(2, 8); c.lineTo(len - 2, 2); c.lineTo(len - 2, 22); c.lineTo(2, 16); c.closePath(); }, shade(RED, dark), { y0: 2, y1: 22, lw: 2.4 });
    c.fillStyle = shade('#fffaf0', dark); c.beginPath(); c.moveTo(len * 0.4, 6.5); c.lineTo(len * 0.6, 5.3); c.lineTo(len * 0.6, 18.7); c.lineTo(len * 0.4, 17.5); c.closePath(); c.fill();
    paper(c, () => ell(c, len - 1, 12, 4, 10), shade(CREAM, dark), { lw: 2.2, y0: 2, y1: 22 });
    paper(c, () => ell(c, len, 12, 2.2, 7), '#2a1430', { lw: 1.2, y0: 5, y1: 19 });
  });
}
const KNIGHT: PartDef[] = [
  { name: 'c', at: [0, -36] },
  { name: 'legB', parent: 'c', at: [-8, 4], img: img(22, 34, 10, 2, (c) => {
    paper(c, () => rr(c, 4, 1, 12, 20, 3), shade(TIN, -0.25), { lw: 2.2, y0: 1, y1: 21 });
    paper(c, () => { c.moveTo(2, 20); c.lineTo(16, 20); c.quadraticCurveTo(21, 21, 21, 27); c.lineTo(21, 31); c.lineTo(2, 31); c.closePath(); }, shade('#5a6a8a', -0.2), { lw: 2.2, y0: 20, y1: 31 });
  }) },
  { name: 'armB', parent: 'c', at: [-13, -30], img: canImg(9, 14, TIN, undefined, -0.25) },
  { name: 'handB', parent: 'armB', at: [0, 15], img: img(16, 16, 8, 3, (c) => paper(c, () => ell(c, 8, 8, 6, 5.5), shade('#5a6a8a', -0.2), { lw: 2.2, y0: 2, y1: 14 })) },
  { name: 'legF', parent: 'c', at: [8, 4], img: img(22, 34, 10, 2, (c) => {
    paper(c, () => rr(c, 4, 1, 12, 20, 3), TIN, { lw: 2.2, y0: 1, y1: 21 });
    c.strokeStyle = shade(TIN, -0.35); c.lineWidth = 1; c.beginPath(); c.moveTo(4, 7); c.lineTo(16, 7); c.moveTo(4, 14); c.lineTo(16, 14); c.stroke();
    paper(c, () => { c.moveTo(2, 20); c.lineTo(16, 20); c.quadraticCurveTo(21, 21, 21, 27); c.lineTo(21, 31); c.lineTo(2, 31); c.closePath(); }, '#5a6a8a', { lw: 2.2, y0: 20, y1: 31 });
  }) },
  { name: 'body', parent: 'c', at: [0, 6], img: img(44, 46, 22, 44, (c) => {                                   // the big tin-can torso with a lightning label
    paper(c, () => rr(c, 5, 6, 34, 36, 4), TIN, { y0: 6, y1: 42, top: 0.3 });
    c.save(); c.beginPath(); rr(c, 5, 6, 34, 36, 4); c.clip();
    c.fillStyle = TEAL; c.fillRect(5, 16, 34, 16); c.strokeStyle = INK; c.lineWidth = 1.4; c.strokeRect(5, 16, 34, 16);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(10, 6, 4, 36);
    c.restore();
    paper(c, () => { c.moveTo(24, 17); c.lineTo(17, 25); c.lineTo(22, 25); c.lineTo(19, 31); c.lineTo(27, 22.5); c.lineTo(22, 22.5); c.closePath(); }, BOLT, { lw: 1.4, y0: 17, y1: 31 });
    for (const y of [6, 42]) paper(c, () => ell(c, 22, y, 17.5, 3), shade(TIN, 0.15), { lw: 2, y0: y - 3, y1: y + 3 });
    paper(c, () => rr(c, 8, 42, 28, 4, 2), '#5a6a8a', { lw: 1.8, y0: 42, y1: 46 });
  }) },
  { name: 'padB', parent: 'body', at: [-12, -38], img: megaphone(-0.25, 14) },
  { name: 'head', parent: 'body', at: [1, -40], img: img(40, 40, 20, 36, (c) => {                                 // the bucket helm (upside-down pail)
    paper(c, () => { c.moveTo(9, 8); c.lineTo(31, 8); c.lineTo(36, 34); c.lineTo(4, 34); c.closePath(); }, '#9fb0c4', { y0: 8, y1: 34, top: 0.3 });
    c.save(); c.beginPath(); c.moveTo(9, 8); c.lineTo(31, 8); c.lineTo(36, 34); c.lineTo(4, 34); c.closePath(); c.clip();
    c.strokeStyle = shade('#9fb0c4', -0.3); c.lineWidth = 1.1; c.beginPath(); for (const y of [13, 29]) { c.moveTo(0, y); c.lineTo(40, y); } c.stroke();
    paper(c, () => rr(c, 5, 16, 32, 10, 3), '#20263f', { lw: 2, y0: 16, y1: 26, top: 0.1, bot: -0.2 });          // the visor slit
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(11, 8, 3, 26);
    c.restore();
    paper(c, () => ell(c, 20, 8, 11.5, 2.4), shade('#9fb0c4', 0.2), { lw: 2, y0: 5, y1: 11 });
    paper(c, () => rr(c, 2, 33, 36, 4, 2), '#7d8ea6', { lw: 2, y0: 33, y1: 37 });
    paper(c, () => ell(c, 5, 22, 2.4, 2.4), '#8d8d9e', { lw: 1.4, y0: 19, y1: 25 }); paper(c, () => ell(c, 35, 22, 2.4, 2.4), '#8d8d9e', { lw: 1.4, y0: 19, y1: 25 });
  }) },
  { name: 'plume', parent: 'head', at: [-2, -27], img: img(30, 26, 8, 24, (c) => {                              // a little megaphone crest on top
    paper(c, () => { c.moveTo(6, 25); c.lineTo(9, 14); c.lineTo(13, 14); c.lineTo(12, 25); c.closePath(); }, '#8d8d9e', { lw: 2, y0: 14, y1: 25 });
    paper(c, () => { c.moveTo(8, 16); c.lineTo(24, 4); c.lineTo(28, 14); c.lineTo(12, 19); c.closePath(); }, RED, { lw: 2, y0: 4, y1: 19 });
    paper(c, () => ell(c, 26, 9, 3, 5.6, -0.4), CREAM, { lw: 1.8, y0: 3, y1: 15 });
  }) },
  { name: 'eyes', parent: 'head', at: [1, -15], img: knEyes('calm') },
  { name: 'eyesMad', parent: 'head', at: [1, -15], img: knEyes('mad') },
  { name: 'eyesDizzy', parent: 'head', at: [1, -15], img: knEyes('dizzy') },
  { name: 'eyesOuch', parent: 'head', at: [1, -15], img: knEyes('ouch') },
  { name: 'armF', parent: 'c', at: [12, -30], img: canImg(9, 14, TIN) },
  { name: 'foreF', parent: 'armF', at: [0, 15], img: canImg(8, 12, TIN, RED) },
  { name: 'sword', parent: 'foreF', at: [0, 15], img: img(26, 62, 13, 8, (c) => {                                // grip at the joint, the bolt blade continues the forearm (+y)
    paper(c, () => rr(c, 9.5, 0, 7, 10, 2), '#5a3a2a', { lw: 2, y0: 0, y1: 10 });
    paper(c, () => rr(c, 2, 9, 22, 6, 3), MUSTARD, { lw: 2, y0: 9, y1: 15 });
    paper(c, () => { c.moveTo(9, 15); c.lineTo(18, 15); c.lineTo(14, 30); c.lineTo(20, 30); c.lineTo(11, 48); c.lineTo(14, 36); c.lineTo(8, 36); c.lineTo(12, 26); c.lineTo(7, 26); c.closePath(); }, BOLT, { lw: 2.2, y0: 15, y1: 48, top: 0.45 });
    c.beginPath(); c.moveTo(11, 48); c.lineTo(12.5, 60); c.lineTo(15, 44); c.closePath(); c.fillStyle = BOLT; c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    shine(c, 11, 18, 13, 25, 0.8, 1.4);
  }) },
  { name: 'glow', parent: 'sword', at: [0, 32], img: img(30, 60, 15, 30, (c) => { c.fillStyle = 'rgba(255,240,120,0.35)'; c.beginPath(); ell(c, 15, 30, 14, 29); c.fill(); c.fillStyle = 'rgba(255,255,220,0.3)'; c.beginPath(); ell(c, 15, 30, 8, 22); c.fill(); }) },
  { name: 'zap1', parent: 'sword', at: [-8, 30], img: boltImg(10, 16) },
  { name: 'zap2', parent: 'sword', at: [9, 44], img: boltImg(10, 14, '#bff4ff') },
  { name: 'zap3', parent: 'sword', at: [2, 60], img: sparkImg(6) },
  { name: 'padF', parent: 'body', at: [13, -38], img: megaphone(0, 14) },
  { name: 'slash', at: [16, -64], img: img(70, 80, 6, 4, (c) => {                                                  // a diagonal slash arc, from top-left to bottom-right
    const path = () => { c.moveTo(6, 4); c.bezierCurveTo(54, 6, 70, 40, 52, 78); c.bezierCurveTo(56, 42, 38, 18, 6, 4); c.closePath(); };
    c.beginPath(); path(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#fffbe0'; c.fill();
    c.beginPath(); c.moveTo(14, 7); c.bezierCurveTo(50, 12, 62, 40, 54, 66); c.lineWidth = 2.4; c.strokeStyle = BOLT; c.stroke();
  }) },
  { name: 'dust', at: [24, -6], img: puffImg(7, '#efe2c6') },
  { name: 'dust2', at: [-18, -6], img: puffImg(6, '#efe2c6') },
  ...starParts('c', [0, -78], 5),
];
function knightPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  const rest: Pose = { armF: [-0.25], foreF: [-1.0], sword: [-1.3] };
  switch (x.state) {
    case 'move': {                  // a stiff clanking march, pads bouncing
      const ph = T * 8, s = Math.sin(ph), cl = Math.abs(Math.cos(ph));
      p = add(rest, { c: [0.04 * s, 0, -3 * cl], legF: [-0.5 * s, 0, Math.min(0, -2.5 * Math.cos(ph))], legB: [0.5 * s, 0, Math.min(0, 2.5 * Math.cos(ph))], armB: [-0.45 * s], handB: [-0.2],
        armF: [0.15 * s], head: [0.05 * Math.sin(2 * ph - 0.6), 0, -1.2 * cl], padF: [0.15 * Math.sin(2 * ph - 1)], padB: [0.15 * Math.sin(2 * ph - 1.3)], body: [0, 0, 0, 1, 1 + 0.03 * Math.cos(2 * ph)] }, only('eyes', KN_EYES));
      break;
    }
    case 'windup': {                // raises the sword overhead; the bolt crackles and glows
      const k = ease.io(ramp(t, 0, 0.42)), tr = Math.sin(T * 55) * 0.7 * ramp(t, 0.3, 0.5), cr = ramp(t, 0.15, 0.4);
      p = add({ c: [-0.12 * k, tr - 2 * k, -2 * k], armF: [-0.25 - 2.7 * k], foreF: [-1.0 + 0.6 * k], sword: [-1.3 + 0.75 * k], armB: [0.5 * k], handB: [-0.4 * k], legF: [-0.3 * k], legB: [0.25 * k], head: [-0.1 * k], padF: [-0.2 * k],
        glow: cr > 0 ? [0, 0, 0, (0.6 + 0.4 * cr) * (1 + 0.1 * Math.sin(T * 40)), 0.6 + 0.4 * cr] : OFF }, crackle(['zap1', 'zap2', 'zap3'], T, 0.3 + 0.6 * cr, 3), only(t > 0.12 ? 'eyesMad' : 'eyes', KN_EYES));
      break;
    }
    case 'attack': {                // a diagonal downward slash with a lunge
      const k = ease.out(ramp(t, 0, 0.08)), r = ease.io(ramp(t, 0.22, 0.4)), m = k * (1 - r), d = ramp(t, 0.04, 0.3), sl = ramp(t, 0.02, 0.2);
      const A = (a: number, b: number, c2: number) => a + (b - a) * k + (c2 - b) * r;
      p = add({ c: [0.22 * m, 8 * m, 2 * m], armF: [A(-2.95, -0.75, -0.25)], foreF: [A(-0.4, -0.3, -1.0)], sword: [A(-0.55, -0.1, -1.3)], armB: [0.9 * m], handB: [-0.5 * m], legF: [-0.65 * m], legB: [0.6 * m], head: [0.12 * m], padF: [0.25 * m],
        slash: sl > 0 && sl < 1 ? [0, 0, 0, 0.7 + 0.4 * sl, 0.7 + 0.4 * sl] : OFF, dust: [0, 10 * d, -4 * d, (0.5 + 0.7 * d) * (1 - r), (0.5 + 0.5 * d) * (1 - r)] }, crackle(['zap1', 'zap2'], T, 0.6 * (1 - r), 4), only('eyesMad', KN_EYES));
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add(rest, { c: [-0.15 * k, -4 * k, 0], head: [-0.3 * k, -2 * k, -3 * k], armF: [0.6 * k], armB: [0.8 * k], padF: [-0.5 * k], padB: [-0.4 * k], body: [0, 0, 0, 1 + 0.06 * k, 1 - 0.06 * k] }, only('eyesOuch', KN_EYES));
      break;
    }
    case 'jam': {                   // dazed: helm askew, sword drooping to the floor
      const w = Math.sin(T * 2.8);
      p = add({ c: [0.1 + 0.04 * w, 0, 1], head: [0.35 + 0.08 * w, 2, 1], armF: [0.15 + 0.1 * w], foreF: [-0.4], sword: [-0.2], armB: [0.3 - 0.1 * w], legF: [-0.15], legB: [0.15], padF: [0.3], padB: [0.2] },
        crackle(['zap3'], T, 0.1), only('eyesDizzy', KN_EYES), orbit(STARS, T, 16, 5));
      break;
    }
    case 'dead': {                  // the cans clatter apart
      const k = ease.in(ramp(t, 0, 0.3));
      p = add(rest, { c: [0.3 * k, 0, 18 * k, 1 + 0.1 * k, 1 - 0.4 * k], head: [1.4 * k, 14 * k, -10 * k], armF: [0.6 * k, 6 * k, 0], sword: [1.4 * k], armB: [-0.8 * k], padF: [0.8 * k, 6 * k, -4 * k], padB: [-0.8 * k, -6 * k, -4 * k], legF: [-0.6 * k], legB: [0.6 * k] },
        only('eyesDizzy', KN_EYES), k > 0.7 ? { dust: [0, 0, 0, 1.2, 1], dust2: [0, 0, 0, 1, 0.9] } : {});
      break;
    }
    default: {
      const b = Math.sin(T * 2.4);
      p = add(rest, { c: [0, 0, -0.6 * b], body: [0, 0, 0, 1, 1 + 0.015 * b], head: [0.03 * Math.sin(T * 2.4 - 0.7)], armF: [0.05 * b], sword: [0.05 * Math.sin(T * 2.4 - 1)], armB: [-0.06 * b], padF: [0.06 * Math.sin(T * 2.4 - 1)], padB: [0.06 * Math.sin(T * 2.4 - 1.2)] },
        crackle(['zap3'], T, 0.08), only('eyes', KN_EYES));
    }
  }
  p = add(p, { padF: [-0.4], padB: [Math.PI + 0.4], plume: [0.12 * Math.sin(T * 3) + (x.state === 'attack' ? 0.3 : 0)] });
  return fx(p, KN_FX);
}

// ================================================================== BROADCAST STORM (final boss): a swirling thundercloud-tornado of envelopes and loudspeaker horns
const ST_EYES = ['eyes', 'eyesSpin', 'eyesX', 'eyesShut'];
const BANDS = ['tw1', 'tw2', 'tw3', 'tw4'];
const DEB_N = 6, SCRAP_N = 3;
const DEB_F = Array.from({ length: DEB_N }, (_, i) => 'eF' + i), DEB_B = Array.from({ length: DEB_N }, (_, i) => 'eB' + i);
const SCR_F = Array.from({ length: SCRAP_N }, (_, i) => 'sF' + i), SCR_B = Array.from({ length: SCRAP_N }, (_, i) => 'sB' + i);
const ZAPS = ['zap1', 'zap2', 'zap3', 'zap4'];
const FRAMES = ['a', 'b', 'c'];
const ST_FX = [...ST_EYES, ...DEB_F, ...DEB_B, ...SCR_F, ...SCR_B, ...ZAPS, ...BANDS.flatMap((b) => [...FRAMES.map((f) => b + f), b + 'd1', b + 'd2']),
  'cd1', 'cd2', 'mouthOpen', 'rage', 'boltF', 'boltB', 'strike1', 'strike2', 'ring1', 'ring2', 'ring3', 'streak', 'dust1', 'dust2', ...STARS];
function bandPath(c: CanvasRenderingContext2D, w: number, h: number, tip: boolean): void {
  if (tip) { c.moveTo(3, 6); c.quadraticCurveTo(w / 2, 0, w - 3, 6); c.bezierCurveTo(w * 0.85, h * 0.5, w * 0.62, h * 0.75, w * 0.78, h - 3); c.bezierCurveTo(w * 0.5, h - 4, w * 0.36, h * 0.7, w * 0.4, h * 0.55); c.bezierCurveTo(w * 0.25, h * 0.45, w * 0.1, h * 0.3, 3, 6); c.closePath(); return; }
  c.moveTo(3, h * 0.3); c.quadraticCurveTo(w / 2, -h * 0.05, w - 3, h * 0.3); c.quadraticCurveTo(w - 1, h * 0.65, w - 10, h - 4); c.quadraticCurveTo(w / 2, h + 2, 10, h - 4); c.quadraticCurveTo(1, h * 0.65, 3, h * 0.3); c.closePath();
}
/** One ring of the tornado; `frame` 0..2 shifts its swirl streaks so cycling the frames reads as spinning. */
function bandImg(w: number, h: number, frame: number, tip = false): Img {
  return img(w, h, w / 2, 3, (c) => {
    paper(c, () => bandPath(c, w, h, tip), shade(CLOUD, 0.05), { y0: 0, y1: h, top: 0.2, bot: -0.3, lw: 2.6 });
    c.save(); c.beginPath(); bandPath(c, w, h, tip); c.clip();
    const step = w / 2.6, off = (frame / 3) * step;
    const curve = (x: number, row: number) => h * (0.3 + row * 0.3) + h * 0.22 * (1 - Math.pow((x - w / 2) / (w / 2), 2));
    for (let row = 0; row < 2; row++) for (let x0 = -step + off + row * step * 0.5; x0 < w; x0 += step) {
      const x1 = x0 + step * 0.55;
      c.beginPath(); for (let x = x0; x <= x1; x += 2) { const y = curve(x, row); if (x === x0) c.moveTo(x, y); else c.lineTo(x, y); }
      c.lineWidth = row ? 1.8 : 2.6; c.strokeStyle = row ? 'rgba(40,30,80,0.32)' : 'rgba(255,255,255,0.55)'; c.stroke();
    }
    c.fillStyle = 'rgba(40,30,80,0.18)'; c.fillRect(0, h * 0.72, w, h);
    c.restore();
  });
}
function bandDark(w: number, h: number, tip = false): Img {
  return img(w, h, w / 2, 3, (c) => { c.beginPath(); bandPath(c, w, h, tip); c.fillStyle = 'rgba(46,20,70,0.3)'; c.fill(); });
}
function cloudPath(c: CanvasRenderingContext2D): void {
  ell(c, 48, 92, 40, 34); ell(c, 86, 58, 48, 44); ell(c, 140, 48, 50, 44); ell(c, 190, 80, 42, 38); ell(c, 120, 104, 92, 36); ell(c, 200, 112, 26, 22); ell(c, 34, 118, 24, 20);
}
function stEyes(kind: 'calm' | 'spin' | 'x' | 'shut'): Img {
  return img(96, 40, 48, 20, (c) => {
    if (kind === 'calm') {
      for (const [x, d, r] of [[22, 1, 15], [72, -1, 16]] as const) {
        c.fillStyle = 'rgba(255,230,80,0.45)'; c.beginPath(); ell(c, x, 20, r + 6, r * 0.8 + 5); c.fill();
        paper(c, () => { c.moveTo(x - r, 20 - d * 7); c.quadraticCurveTo(x, 6 + (d > 0 ? 6 : 0), x + r, 20 + d * 7); c.quadraticCurveTo(x, 34, x - r, 20 - d * 7); c.closePath(); }, '#fff3a0', { lw: 2.6, y0: 6, y1: 34, top: 0.3, bot: -0.1 });
        paper(c, () => { const px = x + 3; c.moveTo(px + 2, 12); c.lineTo(px - 5, 22); c.lineTo(px, 22); c.lineTo(px - 3, 31); c.lineTo(px + 6, 19); c.lineTo(px + 1, 19); c.closePath(); }, INK, { lw: 0.01, y0: 12, y1: 31 });
      }
    } else if (kind === 'spin') { spiralEye(c, 22, 20, 13); spiralEye(c, 72, 20, 14); }
    else if (kind === 'x') { xEye(c, 22, 20, 11); xEye(c, 72, 20, 12); }
    else { squint(c, 22, 20, 11, 1); squint(c, 72, 20, 12, -1); }
  });
}
function stHorn(dark: number, len: number): Img {
  return img(len + 12, 46, 4, 23, (c) => {                                                                          // a loudspeaker horn pointing +x
    paper(c, () => { c.moveTo(2, 16); c.lineTo(len * 0.45, 16); c.lineTo(len - 2, 3); c.lineTo(len - 2, 43); c.lineTo(len * 0.45, 30); c.lineTo(2, 30); c.closePath(); }, shade(MUSTARD, dark), { y0: 3, y1: 43 });
    c.strokeStyle = shade(MUSTARD, dark - 0.35); c.lineWidth = 1.4; c.beginPath(); c.moveTo(len * 0.45, 16); c.lineTo(len * 0.45, 30); c.moveTo(len * 0.7, 10); c.lineTo(len * 0.7, 36); c.stroke();
    paper(c, () => ell(c, len, 23, 8, 21), shade(CREAM, dark), { lw: 2.8, y0: 2, y1: 44 });
    paper(c, () => ell(c, len + 1.5, 23, 5, 16), '#22163a', { lw: 1.6, y0: 7, y1: 39, top: 0.1, bot: -0.3 });
    shine(c, 8, 19, len * 0.4, 19, 0.6, 2);
  });
}
function tendril(dark: number, len: number): Img {
  return img(36, len + 10, 18, 8, (c) => blob(c, () => { ell(c, 18, 12, 15, 12); ell(c, 17, len * 0.5, 12, len * 0.3); ell(c, 18, len - 2, 11, 10); }, shade(CLOUD, dark), { y0: 0, y1: len + 8, lw: 2.6 }));
}
const STORM: PartDef[] = [
  { name: 'floorSwirl', at: [0, -6], img: img(170, 26, 85, 13, (c) => {
    c.fillStyle = 'rgba(70,60,110,0.22)'; c.beginPath(); ell(c, 85, 15, 80, 9); c.fill();
    for (const [x, r] of [[30, 8], [58, 10], [100, 11], [136, 8]] as const) blob(c, () => { ell(c, x, 13, r * 1.3, r * 0.75); ell(c, x + r * 0.8, 11, r, r * 0.65); }, '#d8d2e6', { lw: 1.2, y0: 4, y1: 22, top: 0.1, bot: -0.15 });
  }) },
  { name: 'dust1', at: [-70, -14], img: puffImg(14, '#d8d2e6') },
  { name: 'dust2', at: [70, -14], img: puffImg(13, '#d8d2e6') },
  { name: 'c', at: [0, -228] },
  ...DEB_B.map((n, i): PartDef => ({ name: n, parent: 'c', at: [0, 86], img: envImg(i % 3 === 1 ? '#f6e2b8' : '#fffaf0', i % 2 ? TEAL : RED) })),
  ...SCR_B.map((n, i): PartDef => ({ name: n, parent: 'c', at: [0, 86], img: i === 1 ? puffImg(8, shade(CLOUD, -0.1)) : stHorn(-0.15, 18) })),
  { name: 'streak', parent: 'c', at: [-120, 30], img: img(120, 120, 116, 60, (c) => {
    for (const [y, x0, w] of [[18, 40, 3], [44, 10, 4], [70, 30, 4], [96, 56, 3]] as const) { c.beginPath(); c.moveTo(x0, y); c.lineTo(114, y); c.lineWidth = w + 3; c.strokeStyle = INK; c.stroke(); c.lineWidth = w; c.strokeStyle = '#e4ecff'; c.stroke(); }
  }) },
  { name: 'armB', parent: 'c', at: [-96, -6], img: tendril(-0.2, 54) },
  { name: 'hornB', parent: 'armB', at: [0, 50], img: stHorn(-0.2, 40) },
  { name: 'boltB', parent: 'hornB', at: [44, 0], img: boltImg(36, 70) },
  { name: 'cloudB', parent: 'c', at: [0, 0], img: img(240, 150, 120, 80, (c) => blob(c, () => { ell(c, 40, 60, 34, 30); ell(c, 120, 32, 50, 30); ell(c, 200, 56, 34, 30); }, CLOUD_D, { y0: 0, y1: 100, lw: 3 })) },
  { name: 'tw1', parent: 'c', at: [6, 56] },
  ...FRAMES.map((f, i): PartDef => ({ name: 'tw1' + f, parent: 'tw1', at: [0, 0], img: bandImg(200, 50, i) })),
  { name: 'tw1d1', parent: 'tw1', at: [0, 0], img: bandDark(200, 50) }, { name: 'tw1d2', parent: 'tw1', at: [0, 0], img: bandDark(200, 50) },
  { name: 'tw2', parent: 'tw1', at: [0, 32] },
  ...FRAMES.map((f, i): PartDef => ({ name: 'tw2' + f, parent: 'tw2', at: [0, 0], img: bandImg(150, 46, i) })),
  { name: 'tw2d1', parent: 'tw2', at: [0, 0], img: bandDark(150, 46) }, { name: 'tw2d2', parent: 'tw2', at: [0, 0], img: bandDark(150, 46) },
  { name: 'tw3', parent: 'tw2', at: [0, 30] },
  ...FRAMES.map((f, i): PartDef => ({ name: 'tw3' + f, parent: 'tw3', at: [0, 0], img: bandImg(104, 42, i) })),
  { name: 'tw3d1', parent: 'tw3', at: [0, 0], img: bandDark(104, 42) }, { name: 'tw3d2', parent: 'tw3', at: [0, 0], img: bandDark(104, 42) },
  { name: 'tw4', parent: 'tw3', at: [0, 28] },
  ...FRAMES.map((f, i): PartDef => ({ name: 'tw4' + f, parent: 'tw4', at: [0, 0], img: bandImg(62, 58, i, true) })),
  { name: 'tw4d1', parent: 'tw4', at: [0, 0], img: bandDark(62, 58, true) }, { name: 'tw4d2', parent: 'tw4', at: [0, 0], img: bandDark(62, 58, true) },
  { name: 'cloud', parent: 'c', at: [0, 0], img: img(240, 150, 120, 84, (c) => {                                  // the main thundercloud, with stamped envelopes stuck in it
    blob(c, () => cloudPath(c), CLOUD, { y0: 10, y1: 142, lw: 3.2, top: 0.25 });
    c.save(); c.beginPath(); cloudPath(c); c.clip();
    c.fillStyle = shade(CLOUD, -0.25); c.beginPath(); ell(c, 120, 150, 120, 28); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(56, 40); c.quadraticCurveTo(66, 24, 84, 22); c.moveTo(120, 18); c.quadraticCurveTo(136, 8, 156, 14); c.moveTo(22, 82); c.quadraticCurveTo(28, 66, 42, 62); c.stroke();
    c.strokeStyle = 'rgba(40,30,80,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(150, 70); c.quadraticCurveTo(170, 60, 186, 72); c.moveTo(60, 100); c.quadraticCurveTo(80, 92, 96, 102); c.stroke();
    c.restore();
    for (const [x, y, r] of [[34, 110, -0.5], [196, 58, 0.4], [168, 120, 0.15]] as const) { c.save(); c.translate(x, y); c.rotate(r); c.translate(-11, -8); envImg(r > 0.3 ? '#f6e2b8' : '#fffaf0', r > 0 ? TEAL : RED).draw(c); c.restore(); }
  }) },
  { name: 'cd1', parent: 'cloud', at: [0, 0], img: img(240, 150, 120, 84, (c) => { c.beginPath(); cloudPath(c); c.fillStyle = 'rgba(46,20,70,0.28)'; c.fill(); }) },
  { name: 'cd2', parent: 'cloud', at: [0, 0], img: img(240, 150, 120, 84, (c) => { c.beginPath(); cloudPath(c); c.fillStyle = 'rgba(60,10,40,0.3)'; c.fill(); }) },
  { name: 'hornT', parent: 'cloud', at: [-34, -62], img: stHorn(-0.1, 30) },
  { name: 'face', parent: 'cloud', at: [24, 2] },
  { name: 'eyes', parent: 'face', at: [0, -14], img: stEyes('calm') },
  { name: 'eyesSpin', parent: 'face', at: [0, -14], img: stEyes('spin') },
  { name: 'eyesX', parent: 'face', at: [0, -14], img: stEyes('x') },
  { name: 'eyesShut', parent: 'face', at: [0, -14], img: stEyes('shut') },
  { name: 'brows', parent: 'face', at: [0, -38], img: img(110, 28, 55, 14, (c) => {
    blob(c, () => { c.moveTo(4, 8); c.quadraticCurveTo(28, 0, 50, 18); c.lineTo(46, 25); c.quadraticCurveTo(26, 12, 6, 17); c.closePath(); }, '#3c3566', { lw: 2.4, y0: 0, y1: 25 });
    blob(c, () => { c.moveTo(106, 8); c.quadraticCurveTo(82, 0, 60, 18); c.lineTo(64, 25); c.quadraticCurveTo(84, 12, 104, 17); c.closePath(); }, '#3c3566', { lw: 2.4, y0: 0, y1: 25 });
  }) },
  { name: 'rage', parent: 'face', at: [0, 4], img: img(130, 26, 65, 13, (c) => { blush(c, 14, 13, 14, 8, 0.5); blush(c, 116, 13, 14, 8, 0.5); vein(c, 120, 0, 12); }) },
  { name: 'mouth', parent: 'face', at: [4, 22], img: img(64, 22, 32, 11, (c) => {                                 // a clenched zigzag grimace
    paper(c, () => rr(c, 3, 3, 58, 16, 7), '#2a1430', { lw: 2.6, y0: 3, y1: 19, top: 0.1, bot: -0.2 });
    c.beginPath(); c.moveTo(7, 11); for (let i = 1; i <= 10; i++) c.lineTo(7 + i * 5, i % 2 ? 6 : 16); c.lineWidth = 3.2; c.strokeStyle = '#fffaf0'; c.stroke();
  }) },
  { name: 'mouthOpen', parent: 'face', at: [4, 14], img: img(80, 64, 40, 4, (c) => {                              // the huge shouting mouth (opens downward)
    paper(c, () => { c.moveTo(6, 6); c.quadraticCurveTo(40, 0, 74, 6); c.quadraticCurveTo(80, 50, 40, 60); c.quadraticCurveTo(0, 50, 6, 6); c.closePath(); }, '#2a1430', { lw: 3, y0: 2, y1: 60, top: 0.1, bot: -0.2 });
    c.fillStyle = '#fffaf0'; c.beginPath(); for (let i = 0; i < 6; i++) { const x = 12 + i * 10.5; c.moveTo(x, 6); c.lineTo(x + 5, 14); c.lineTo(x + 10, 6); } c.fill();
    paper(c, () => ell(c, 40, 48, 18, 9), PINK, { lw: 2, y0: 39, y1: 57 });
    c.fillStyle = 'rgba(255,240,120,0.5)'; c.beginPath(); ell(c, 40, 30, 10, 8); c.fill();
  }) },
  { name: 'ring1', parent: 'face', at: [44, 34], img: ringImg(60) },
  { name: 'ring2', parent: 'face', at: [44, 34], img: ringImg(84, BOLT) },
  { name: 'ring3', parent: 'face', at: [44, 34], img: ringImg(108) },
  ...ZAPS.map((n, i): PartDef => ({ name: n, parent: 'cloud', at: [[-100, 40], [96, -30], [-60, -70], [110, 40]][i] as [number, number], img: boltImg(26, 46 - i * 4, i % 2 ? '#bff4ff' : BOLT) })),
  { name: 'armF', parent: 'c', at: [92, 20], img: tendril(0, 56) },
  { name: 'hornF', parent: 'armF', at: [0, 52], img: stHorn(0, 44) },
  { name: 'boltF', parent: 'hornF', at: [48, 0], img: boltImg(38, 76) },
  ...DEB_F.map((n, i): PartDef => ({ name: n, parent: 'c', at: [0, 86], img: envImg(i % 3 === 1 ? '#f6e2b8' : '#fffaf0', i % 2 ? TEAL : RED) })),
  ...SCR_F.map((n, i): PartDef => ({ name: n, parent: 'c', at: [0, 86], img: i === 1 ? puffImg(8, shade(CLOUD, -0.1)) : stHorn(0, 18) })),
  { name: 'strike1', at: [150, -220], img: strikeImg(64, 220, 1) },
  { name: 'strike2', at: [235, -220], img: strikeImg(64, 220, 4) },
  ...starParts('face', [0, -70], 8),
];
/** Debris on an ellipse around the funnel: front copies show when an item is in front (sin > 0), back copies otherwise. */
function debris(T: number, speed: number, count: number, scraps: number, rx: number, ry: number, fall = 0): Pose {
  const p: Pose = {};
  const put = (fn: string, bn: string, i: number, n: number, ph: number, sc: number) => {
    const a = T * speed + (i / n) * Math.PI * 2 + ph, s = Math.sin(a), yy = (((i * 37) % 5) - 2) * 8;
    const dropY = fall > 0 ? fract(T * 0.7 + i * 0.37) * 170 * fall : 0;
    const v: T5 = [a * 0.8 + i, Math.cos(a) * rx * (1 - 0.3 * fall), s * ry + yy + dropY, sc * (0.82 + 0.18 * s), sc * (0.82 + 0.18 * s)];
    p[fn] = s > 0 ? v : OFF; p[bn] = s > 0 ? OFF : v;
  };
  for (let i = 0; i < DEB_N; i++) if (i < count) put(DEB_F[i], DEB_B[i], i, count, 0, 1.55);
  for (let i = 0; i < SCRAP_N; i++) if (i < scraps) put(SCR_F[i], SCR_B[i], i, scraps, 0.9, 1.0);
  return p;
}
function stormPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t, v = x.variant, ph = x.phase;
  const anger = clamp01(Math.max(ph / 2, (1 - x.hp) * 1.2));
  const p: Pose = { brows: [0, 0, 6 * anger], eyes: ON, mouth: ON };
  if (ph >= 1 || anger > 0.45) { p.cd1 = ON; for (const b of BANDS) p[b + 'd1'] = ON; }
  if (ph >= 2 || anger > 0.85) { p.cd2 = ON; for (const b of BANDS) p[b + 'd2'] = ON; }
  if (anger > 0.3) p.rage = ON;
  const set = (q: Pose): void => { Object.assign(p, q); };
  /** Spin speed s: cycles the swirl frames, sways the bands. */
  const spin = (s: number, lean = 0, squash = 1): void => {
    BANDS.forEach((b, i) => {
      const f = Math.floor(T * s * 9 + i) % 3;
      FRAMES.forEach((fr, j) => { p[b + fr] = j === f ? ON : OFF; });
      p[b] = [lean * (0.5 + 0.25 * i) + 0.06 * Math.sin(T * (3 + s) - i * 0.9), 4 * Math.sin(T * s * 2.2 - i * 1.1), 0, 1 + 0.05 * Math.sin(T * s * 3 - i), squash];
    });
  };
  const count = 3 + Math.min(3, ph + Math.round(anger * 1.5)), scraps = ph >= 2 ? 3 : ph >= 1 ? 1 : 0;
  const zaps = (rate: number): void => set(crackle(ZAPS.slice(0, 1 + ph + (ph >= 2 ? 1 : 0)), T * 0.6, rate, 4));
  const bob = Math.sin(T * 1.6);
  const idle = (s = 1): void => {
    spin(s);
    set(debris(T, 1.6 * s, count, scraps, 150, 26));
    set({ c: [0.025 * Math.sin(T * 1.1), 0, 5 * bob], cloud: [0, 0, 0, 1 + 0.02 * bob, 1 + 0.025 * bob], cloudB: [0.02 * Math.sin(T * 1.3), 0, 0, 1 + 0.03 * Math.sin(T * 1.6 - 0.5), 1], face: [0.03 * Math.sin(T * 1.7)],
      armF: [-0.75 + 0.15 * Math.sin(T * 2.1)], hornF: [0.55 - 0.12 * Math.sin(T * 2.1 - 0.8)], armB: [0.85 - 0.12 * Math.sin(T * 1.9)], hornB: [2.6 + 0.1 * Math.sin(T * 1.9 - 0.8)], hornT: [-1.9 + 0.08 * Math.sin(T * 2.3)],
      floorSwirl: [0, 3 * Math.sin(T * 2.4), 0, 1 + 0.04 * Math.sin(T * 3), 1], mouth: [0, 0, 0, 1 + 0.04 * Math.sin(T * 8), 1] });
    zaps(0.18 + 0.15 * anger);
  };
  switch (x.state) {
    case 'move': idle(1.3); set({ c: [0.12, 0, 5 * bob] }); spin(1.4, -0.15); break;
    case 'windup': {
      const k = ease.io(ramp(t, 0, 0.6)), tr = Math.sin(T * 45) * 2 * ramp(t, 0.45, 0.75);
      idle(1 + k); p.brows = [0, 0, 6 * anger + 5 * k];
      if (v === 1) {                // shout: inhale: the cloud swells, the face rears back, mouth clamped
        set({ c: [-0.12 * k, -10 * k + tr, -6 * k], cloud: [0, 0, 0, 1 + 0.12 * k, 1 + 0.14 * k], cloudB: [0, 0, 0, 1 + 0.15 * k, 1 + 0.12 * k], face: [-0.1 * k, -4 * k, -2 * k], mouth: [0, 0, 0, 1 - 0.35 * k, 1 - 0.3 * k],
          armF: [-1.5 * k - 0.75 * (1 - k)], hornF: [0.05], armB: [1.6 * k + 0.85 * (1 - k)], hornB: [2.0] });
      } else if (v === 2) {         // lightning: both horn-arms rise up, bolts crackle above them
        const cr = ramp(t, 0.25, 0.6);
        set({ c: [0, tr, -8 * k], armF: [-0.75 - 2.2 * k], hornF: [0.55 + 0.83 * k], armB: [0.85 + 2.0 * k], hornB: [2.6 - 0.74 * k], face: [-0.06 * k, 0, -3 * k],
          boltF: cr > 0 && Math.sin(T * 47) > -0.3 ? [-1.57 + 0.2 * Math.sin(T * 31), 0, 0, 0.6 + 0.5 * cr, 0.6 + 0.5 * cr] : OFF, boltB: cr > 0 && Math.sin(T * 53 + 1) > -0.3 ? [-1.57 + 0.2 * Math.sin(T * 29), 0, 0, 0.6 + 0.5 * cr, 0.6 + 0.5 * cr] : OFF });
        zaps(0.4 + 0.5 * cr);
      } else {                      // tornado dash: leans back, the funnel winds up tight and spins faster
        spin(1 + 2.5 * k, 0.12 * k, 1 - 0.12 * k);
        set(debris(T, 1.6 + 3 * k, count, scraps, 150 - 40 * k, 26 - 8 * k));
        set({ c: [-0.18 * k, -12 * k + tr, 0], armF: [-0.4 * k - 0.75], armB: [0.4 * k + 0.85], floorSwirl: [0, 0, 0, 1 + 0.4 * k, 1 + 0.3 * k], dust1: puff(fract(T * 2), -30, -10, 0.9 * k + 0.001), dust2: puff(fract(T * 2 + 0.5), 30, -10, 0.9 * k + 0.001) });
      }
      break;
    }
    case 'attack': {
      const k = ease.out(ramp(t, 0, 0.1)), r = ease.io(ramp(t, 0.6, 0.95)), m = k * (1 - r);
      idle(1.5); p.brows = [0, 0, 6 * anger + 5];
      if (v === 1) {                // shout: the giant mouth opens, rings of sound pour out, everything shakes
        const vib = Math.sin(T * 70) * 2 * m;
        set({ c: [0.08 * m, 6 * m + vib, 0], cloud: [0, 0, 0, 1 + 0.05 * m, 1 - 0.03 * m], face: [0.12 * m, 4 * m, 0], mouth: OFF, mouthOpen: [0, 0, 0, 1 + 0.1 * m, Math.max(0.05, m * (1 + 0.08 * Math.sin(T * 40)))], eyes: OFF, eyesShut: ON,
          armF: [-1.4 * m - 0.75 * (1 - m)], hornF: [0.15 * m + 0.55 * (1 - m)], armB: [1.4 * m + 0.85 * (1 - m)], hornB: [2.2] });
        ['ring1', 'ring2', 'ring3'].forEach((n, i) => { const u = fract(t * 2.2 + i / 3), s = (0.5 + u * 0.9) * m; p[n] = [0, u * 120, (i - 1) * 6 * u, Math.max(0.001, s * (1 - u * 0.5)), Math.max(0.001, s)]; });
        set(debris(T, 2.5, count, scraps, 170 + 30 * m, 30));
      } else if (v === 2) {         // lightning: the arms swing down and two bolts strike the floor in front
        const s = ease.in(ramp(t, 0, 0.08)), fl = Math.sin(T * 60) > -0.5;
        set({ c: [0.06 * m, 6 * m, 4 * m], armF: [-2.95 * (1 - s) - 1.3 * s * (1 - r) - 0.75 * r], hornF: [1.38 * (1 - s) + 0.45 * s], armB: [2.85 * (1 - s) + 1.4 * s * (1 - r) + 0.85 * r], hornB: [1.86 * (1 - s) + 2.4 * s], face: [0.08 * m] });
        const on = t > 0.06 && r < 0.9;
        p.strike1 = on && fl ? [0.03 * Math.sin(T * 50), 0, 0, 1 + 0.15 * Math.sin(T * 70), 1] : OFF;
        p.strike2 = on && (t > 0.12) && Math.sin(T * 60 + 2) > -0.5 ? [0.03 * Math.sin(T * 45), 0, 0, 1 + 0.15 * Math.sin(T * 63), 1] : OFF;
        zaps(0.9 * (1 - r));
      } else {                      // tornado dash: leaning hard forward, spinning flat out, debris trailing
        spin(4, -0.35 * m, 0.92);
        set(debris(T, 5, count, scraps, 120, 20));
        set({ c: [0.3 * m, 0, 6 * m], armF: [-0.3 * m - 0.75 * (1 - m)], armB: [1.6 * m + 0.85 * (1 - m)], hornB: [2.0], cloudB: [0, -6 * m, 0, 1.05, 1], face: [0.1 * m],
          streak: [0, -10 * Math.sin(T * 25), 0, 0.8 + 0.25 * Math.sin(T * 33), 1], dust1: puff(fract(T * 3), -60, -14, 1.2 * m + 0.001), dust2: puff(fract(T * 3 + 0.5), -40, -20, 1.0 * m + 0.001), floorSwirl: [0, -10 * m, 0, 1.3, 1] });
      }
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.4));
      idle(0.6);
      set({ c: [-0.1 * k, -12 * k, -4 * k], cloud: [0, 0, 0, 1 - 0.06 * k, 1 + 0.08 * k], face: [-0.15 * k], eyes: OFF, eyesShut: ON, mouth: OFF, mouthOpen: [0, 0, 0, 0.7, 0.45 * k + 0.001], armF: [-0.75 + 0.6 * k], armB: [0.85 - 0.5 * k], hornT: [-1.9 - 0.4 * k] });
      break;
    }
    case 'jam': {                   // dazed: the spin nearly stops, the funnel sags, envelopes rain down, spiral eyes
      const w = Math.sin(T * 2);
      spin(0.25, 0.15 * w, 0.85);
      set(debris(T, 0.3, count, scraps, 150, 20, 1));
      set({ c: [0.06 * w, 0, 22], cloud: [0.03 * w, 0, 0, 1.04, 0.94], cloudB: [0, 0, 6, 1, 0.92], face: [0.12 + 0.05 * w, 0, 4], eyes: OFF, eyesSpin: ON, mouth: OFF, mouthOpen: [0, 0, 0, 0.6, 0.3],
        armF: [-0.1 + 0.08 * w], hornF: [0.6], armB: [0.2 - 0.08 * w], hornB: [2.0], hornT: [-1.2 + 0.1 * w], floorSwirl: [0, 0, 0, 0.8, 0.8] });
      set(orbit(STARS, T, 60, 12, 3.5)); set(crackle(ZAPS.slice(0, 2), T * 0.4, 0.06, 3)); delete p.rage;
      break;
    }
    case 'dead': {                  // 2.2 s: spins backwards and unwinds, envelopes fly off and drop, the cloud shrinks to a puff on the floor
      const a = ramp(t, 0, 0.5), u = ease.in(ramp(t, 0.3, 2.0)), g = 1 - 0.85 * u, sp = 1.5 * (1 - ramp(t, 0, 1.6));
      spin(sp, 0.25 * Math.sin(t * 6) * (1 - u), Math.max(0.05, 1 - u));
      set(debris(t, -2 * (1 - a), count, scraps, 150 + 120 * a, 26, 0));
      DEB_F.concat(DEB_B, SCR_F, SCR_B).forEach((n) => { const q = p[n]; if (q && (q[3] ?? 1) > 0.01) p[n] = [(q[0] ?? 0) + t * 3, q[1], (q[2] ?? 0) + 180 * ease.in(ramp(t, 0.2, 1.1)), (q[3] ?? 1) * (1 - ramp(t, 1.0, 1.3)) + 0.001, (q[4] ?? 1) * (1 - ramp(t, 1.0, 1.3)) + 0.001]; });
      set({ c: [-1.2 * ease.out(ramp(t, 0, 2.2)) + 0.1 * Math.sin(t * 14) * (1 - a), 0, 150 * u, g, g], eyes: OFF, eyesX: ON, mouth: OFF, mouthOpen: [0, 0, 0, 0.7, 0.4], armF: [0.2 * a], armB: [-0.2 * a], hornF: [1.2 * a], hornB: [2.0 - 0.8 * a], hornT: [-1.2 * a - 1.9 * (1 - a)],
        floorSwirl: [0, 0, 0, Math.max(0.001, 1 - u), Math.max(0.001, 1 - u)], dust1: [0, 20 * u, 0, 0.4 + 1.2 * u, 0.4 + u], dust2: [0, -20 * u, 0, 0.4 + 1.2 * u, 0.4 + u] });
      delete p.rage;
      break;
    }
    default: idle();
  }
  const q = p.c ?? [0, 0, 0, 1, 1];                                   // the whole storm is drawn at 1.1x (about 300 units across)
  p.c = [q[0] ?? 0, q[1] ?? 0, q[2] ?? 0, (q[3] ?? 1) * 1.1, (q[4] ?? 1) * 1.1];
  return fx(p, ST_FX);
}

// ------------------------------------------------------------------ registry
const SMALL_DEMO: [string, Partial<EnemyCtx>][] = [
  ['idle', {}], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.3 }], ['windup .12', { state: 'windup', t: 0.12 }], ['windup .45', { state: 'windup', t: 0.45, time: 0.47 }],
  ['attack .05', { state: 'attack', t: 0.05 }], ['attack .18', { state: 'attack', t: 0.18 }], ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam' }], ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }],
];
const STORM_DEMO: [string, Partial<EnemyCtx>][] = [
  ['idle', {}], ['idle phase1', { phase: 1, hp: 0.6 }], ['idle phase2', { phase: 2, hp: 0.2 }], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.4 }],
  ['dash wind .3', { state: 'windup', variant: 0, t: 0.3 }], ['dash wind .6', { state: 'windup', variant: 0, t: 0.6 }], ['dash', { state: 'attack', variant: 0, t: 0.2 }],
  ['shout wind .6', { state: 'windup', variant: 1, t: 0.6 }], ['shout', { state: 'attack', variant: 1, t: 0.25 }],
  ['bolt wind .6', { state: 'windup', variant: 2, t: 0.6, time: 0.31 }], ['bolt .1', { state: 'attack', variant: 2, t: 0.15, time: 0.31 }],
  ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam', phase: 1, hp: 0.5 }], ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }], ['dead 1', { state: 'dead', t: 1 }], ['dead 2.2', { state: 'dead', t: 2.2 }],
];
export const RIGS: EnemyRig[] = [
  { kind: 'enemy', id: 'stormling', name: 'ננס הסערה', parts: STL, scale: 1, pose: stlPose, body: { w: 34, h: 30, origin: 'center' }, demo: SMALL_DEMO },
  { kind: 'enemy', id: 'echoknight', name: 'אביר ההד', parts: KNIGHT, scale: 1, pose: knightPose, body: { w: 46, h: 84, origin: 'feet' }, demo: SMALL_DEMO },
  { kind: 'enemy', id: 'storm', name: 'סערת ה-Broadcast', parts: STORM, scale: 1, pose: stormPose, body: { w: 180, h: 200, origin: 'feet' }, demo: STORM_DEMO },
];
