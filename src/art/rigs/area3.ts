/**
 * Area 3, "Border Bridges" (borders between neighbourhoods; a router stops broadcasts; collision and broadcast domains):
 * the Hornhawk, the Bridge Gatekeeper, the Domain Drifter and the Border King boss.
 * Original designs for this game. Shared helpers come from area1.ts.
 * Angles: 0 = a limb hangs down; negative swings it forward (+x). A part drawn pointing +x (barrier arms, wings drawn sideways) turns
 * its far end DOWN with a positive rotation and UP with a negative one.
 */
import { add, ease, eye, INK, paper, rr, ell, shade, shine, type Img, type PartDef, type Pose } from '../puppet';
import type { EnemyCtx, EnemyRig } from '../types';
import {
  CREAM, RED, TEAL, MUSTARD, NAVY, PINK, OFF, type T5, img, clamp01, ramp, fract, fx, only, orbit, puff, blob, starImg, puffImg, sparkImg,
  ringImg, madEye, spiralEye, squint, xEye, sleepEye, vein, blush,
} from './area1';

const STARS = ['star1', 'star2', 'star3'];
const starParts = (parent: string, at: [number, number], r = 4): PartDef[] => STARS.map((n, i) => ({ name: n, parent, at, img: starImg(i === 1 ? MUSTARD : '#fff3b0', r) }));
const ON: T5 = [0, 0, 0, 1, 1];
const STONE = '#9aa3b5', STONE_D = '#6f7890', SAND = '#d9c49a', WOODC = '#a8683a', IRONC = '#3b3f58', ORANGE = '#f08a24';
/** Red-and-white barrier stripes clipped to the current path (call after building a path). */
function stripes(c: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, step: number, col = RED, slope = 1): void {
  c.save(); c.clip(); c.fillStyle = col;
  for (let x = x0 - (y1 - y0) * slope; x < x1 + (y1 - y0); x += step * 2) { c.beginPath(); c.moveTo(x, y1); c.lineTo(x + step, y1); c.lineTo(x + step + (y1 - y0) * slope, y0); c.lineTo(x + (y1 - y0) * slope, y0); c.closePath(); c.fill(); }
  c.restore();
}
function zz(s: number): Img {
  return img(s + 4, s + 4, s / 2 + 2, s / 2 + 2, (c) => {
    const z = () => { c.beginPath(); c.moveTo(2, 2); c.lineTo(s + 2, 2); c.lineTo(2, s + 2); c.lineTo(s + 2, s + 2); };
    z(); c.lineWidth = 4.4; c.strokeStyle = INK; c.stroke(); z(); c.lineWidth = 2; c.strokeStyle = '#d9ccff'; c.stroke();
  });
}
function featherImg(col: string): Img {
  return img(14, 8, 7, 4, (c) => paper(c, () => { c.moveTo(1.5, 4); c.quadraticCurveTo(6, -0.5, 12.5, 3); c.quadraticCurveTo(6, 8, 1.5, 4); c.closePath(); }, col, { lw: 1.3, y0: 1, y1: 7 }));
}

// ================================================================== HORNHAWK (Broadcast Horn): a hawk whose beak is a loudspeaker horn
const HAWK = '#c0612f', HAWK_D = '#7d3a24', HORN = '#2fa39a';
const HAWK_FACES = ['face', 'faceMad', 'faceDizzy', 'faceOuch', 'faceShut'];
const HAWK_FX = ['ring1', 'ring2', 'ring3', 'zz1', 'zz2', 'fea1', 'fea2', ...STARS, ...HAWK_FACES];
function hawkWing(dark: number): Img {
  return img(48, 30, 42, 7, (c) => {
    const path = () => {
      c.moveTo(43, 6); c.bezierCurveTo(32, 1, 16, 1, 3, 5);
      c.quadraticCurveTo(7, 9, 9, 12); c.quadraticCurveTo(12, 16, 16, 15); c.quadraticCurveTo(19, 20, 24, 18); c.quadraticCurveTo(28, 24, 33, 20); c.quadraticCurveTo(38, 21, 44, 12);
      c.closePath();
    };
    paper(c, path, shade(HAWK_D, dark), { y0: 1, y1: 22, top: 0.25 });
    c.save(); c.beginPath(); path(); c.clip();
    paper(c, () => { c.moveTo(44, 4); c.bezierCurveTo(32, 0, 20, 2, 12, 5); c.quadraticCurveTo(26, 12, 44, 12); c.closePath(); }, shade(HAWK, dark), { lw: 1.6, y0: 1, y1: 12 });
    c.restore();
    c.strokeStyle = shade(HAWK_D, dark - 0.3); c.lineWidth = 1.2; c.beginPath();
    for (const [x0, y0, x1, y1] of [[14, 8, 10, 12], [20, 10, 17, 15], [26, 11, 24, 18], [32, 12, 32, 19]]) { c.moveTo(x0, y0); c.lineTo(x1, y1); }
    c.stroke();
  });
}
function hawkFace(kind: 'calm' | 'mad' | 'dizzy' | 'ouch' | 'shut'): Img {
  return img(22, 14, 11, 7, (c) => {
    if (kind === 'calm') { madEye(c, 6, 7.5, 4, HAWK, 0.32, 0.45, 0.12); madEye(c, 15.5, 7, 4.6, HAWK, -0.32, 0.45, 0.12); }
    else if (kind === 'mad') { madEye(c, 6, 7.5, 4.2, HAWK, 0.6, 0.45, -0.05); madEye(c, 15.5, 7, 4.8, HAWK, -0.6, 0.45, -0.05); }
    else if (kind === 'dizzy') { spiralEye(c, 6, 7.5, 3.8); spiralEye(c, 15.5, 7, 4.4); }
    else if (kind === 'shut') { sleepEye(c, 6, 7.5, 3.2); sleepEye(c, 15.5, 7, 3.6); }
    else { squint(c, 6, 7.5, 3.6, 1); squint(c, 15.5, 7, 4, -1); }
  });
}
const HAWKP: PartDef[] = [
  { name: 'c', at: [0, 0] },
  { name: 'zz1', at: [12, -22], img: zz(7) },
  { name: 'zz2', at: [12, -22], img: zz(5) },
  { name: 'wingB', parent: 'c', at: [2, -7], img: hawkWing(-0.25) },
  { name: 'tail', parent: 'c', at: [-13, 1], img: img(26, 20, 23, 7, (c) => {
    for (const [r, d] of [[-0.35, -0.2], [0.3, -0.12], [0, 0]] as const) {
      c.save(); c.translate(23, 7); c.rotate(r);
      paper(c, () => { c.moveTo(0, -3); c.lineTo(-17, -4.5); c.lineTo(-21, -1.5); c.lineTo(-18, 0.5); c.lineTo(-21, 2.5); c.lineTo(-17, 4.5); c.lineTo(0, 3); c.closePath(); }, shade(HAWK_D, d), { lw: 1.8, y0: -5, y1: 5 });
      c.strokeStyle = shade(CREAM, -0.1); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-15, -2.8); c.lineTo(-15, 2.8); c.stroke();
      c.restore();
    }
  }) },
  { name: 'legs', parent: 'c', at: [3, 9], img: img(18, 14, 8, 1, (c) => {
    for (const x of [5, 11]) {
      const L = () => { c.beginPath(); c.moveTo(x, 1); c.lineTo(x + 0.5, 9); };
      L(); c.lineWidth = 4.4; c.strokeStyle = INK; c.stroke(); L(); c.lineWidth = 2; c.strokeStyle = MUSTARD; c.stroke();
      c.beginPath(); c.moveTo(x - 3, 12); c.quadraticCurveTo(x - 2, 9, x + 0.5, 9); c.quadraticCurveTo(x + 3, 9, x + 5, 12); c.moveTo(x + 0.5, 9); c.lineTo(x + 1, 12.5); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    }
  }) },
  { name: 'body', parent: 'c', at: [0, 0], img: img(38, 32, 19, 16, (c) => {
    const path = () => { c.moveTo(3, 13); c.bezierCurveTo(8, 4, 20, 2, 28, 4); c.bezierCurveTo(36, 7, 37, 20, 32, 25); c.bezierCurveTo(26, 31, 12, 30, 7, 23); c.quadraticCurveTo(4, 19, 3, 13); c.closePath(); };
    paper(c, path, HAWK, { y0: 2, y1: 30 });
    c.save(); c.beginPath(); path(); c.clip();
    paper(c, () => ell(c, 26, 19, 9.5, 9.5), CREAM, { lw: 2, y0: 9, y1: 29, top: 0.1, bot: -0.15 });                 // the speaker-grille chest
    c.fillStyle = shade(HAWK_D, -0.1);
    for (let y = 13; y <= 26; y += 3) for (let x = 19; x <= 33; x += 3) if ((x - 26) ** 2 + (y - 19) ** 2 < 52) { c.beginPath(); ell(c, x + ((y / 3) % 2 ? 1.5 : 0), y, 0.9, 0.9); c.fill(); }
    c.restore();
    c.strokeStyle = shade(HAWK_D, 0.1); c.lineWidth = 1.2; c.beginPath(); c.moveTo(8, 12); c.quadraticCurveTo(11, 15, 9, 18); c.moveTo(12, 10); c.quadraticCurveTo(15, 13, 13, 17); c.stroke();
    shine(c, 10, 8, 16, 5, 0.45);
  }) },
  { name: 'head', parent: 'body', at: [8, -9], img: img(26, 24, 8, 18, (c) => {
    paper(c, () => { c.moveTo(6, 9); c.lineTo(-0.5, 4); c.lineTo(5, 5.5); c.lineTo(1, 0.5); c.lineTo(9, 4); c.closePath(); }, HAWK_D, { lw: 1.8, y0: 0, y1: 9 });   // crest
    paper(c, () => ell(c, 13, 11, 10, 9.5), HAWK, { y0: 1, y1: 21 });
    paper(c, () => { c.moveTo(7, 14); c.quadraticCurveTo(14, 21, 22, 15); c.quadraticCurveTo(20, 21, 13, 20.5); c.quadraticCurveTo(8, 19, 7, 14); c.closePath(); }, CREAM, { lw: 1.6, y0: 14, y1: 21 });
    shine(c, 7, 6, 11, 3.5, 0.45, 2);
  }) },
  { name: 'face', parent: 'head', at: [5, -9], img: hawkFace('calm') },
  { name: 'faceMad', parent: 'head', at: [5, -9], img: hawkFace('mad') },
  { name: 'faceDizzy', parent: 'head', at: [5, -9], img: hawkFace('dizzy') },
  { name: 'faceOuch', parent: 'head', at: [5, -9], img: hawkFace('ouch') },
  { name: 'faceShut', parent: 'head', at: [5, -9], img: hawkFace('shut') },
  { name: 'horn', parent: 'head', at: [12, -2], img: img(28, 24, 2, 12, (c) => {
    paper(c, () => { c.moveTo(1, 8.5); c.lineTo(8, 8.5); c.lineTo(19, 3); c.lineTo(19, 21); c.lineTo(8, 15.5); c.lineTo(1, 15.5); c.closePath(); }, HORN, { y0: 3, y1: 21 });
    c.strokeStyle = shade(HORN, -0.35); c.lineWidth = 1.1; c.beginPath(); c.moveTo(8, 8.5); c.lineTo(8, 15.5); c.moveTo(13.5, 6); c.lineTo(13.5, 18); c.stroke();
    paper(c, () => { c.moveTo(2, 8.5); c.quadraticCurveTo(7, 4, 11, 6.5); c.quadraticCurveTo(8.5, 7.5, 7.5, 9); c.closePath(); }, MUSTARD, { lw: 1.4, y0: 4, y1: 9 });   // the hooked beak tip on top
    paper(c, () => ell(c, 20, 12, 4.2, 9.5), CREAM, { lw: 2.2, y0: 2, y1: 22 });
    paper(c, () => ell(c, 21, 12, 2.5, 7), '#2a1430', { lw: 1.3, y0: 5, y1: 19, top: 0.1, bot: -0.3 });
    shine(c, 5, 10, 8, 10, 0.6, 1.4);
  }) },
  { name: 'ring1', parent: 'horn', at: [23, 0], img: ringImg(16) },
  { name: 'ring2', parent: 'horn', at: [23, 0], img: ringImg(22, MUSTARD) },
  { name: 'ring3', parent: 'horn', at: [23, 0], img: ringImg(28) },
  { name: 'wingF', parent: 'c', at: [5, -5], img: hawkWing(0) },
  { name: 'fea1', parent: 'c', at: [0, -6], img: featherImg(HAWK) },
  { name: 'fea2', parent: 'c', at: [0, -6], img: featherImg(HAWK_D) },
  ...starParts('c', [0, -24]),
];
function hawkFlap(T: number, f: number, amp = 1, lift = 0.25): Pose {
  const s = Math.sin(T * f);
  return { wingF: [lift + 0.75 * s * amp], wingB: [lift + 0.1 + 0.65 * Math.sin(T * f - 0.45) * amp], c: [0, 0, -2.6 * Math.sin(T * f + 1.3) * amp], body: [0, 0, 0, 1 + 0.03 * Math.sin(T * f + 0.6) * amp, 1 - 0.03 * Math.sin(T * f + 0.6) * amp],
    tail: [0.15 * Math.sin(T * f * 0.5 - 1)], legs: [0.25 + 0.12 * Math.sin(T * f - 1.6)], head: [0.06 * Math.sin(T * f - 1)] };
}
/** Sound rings fanning out from the horn mouth: each ring flies along its own angle. */
function fanRings(t: number, speed: number, reach: number, spread: number, grow = 1): Pose {
  const p: Pose = {};
  ['ring1', 'ring2', 'ring3'].forEach((n, i) => {
    const u = fract(t * speed + i / 3), a = (i - 1) * spread, s = (0.45 + u * 0.7) * grow;
    p[n] = [a, Math.cos(a) * u * reach, Math.sin(a) * u * reach, s * (1 - u * 0.45), s];
  });
  return p;
}
function hawkPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  switch (x.state) {
    case 'sleep': {               // perched: wings folded, head tucked into the chest feathers
      const b = Math.sin(T * 1.7), u = fract(T * 0.55);
      p = add({ c: [0.05, 0, 3], body: [0, 0, 0, 1 + 0.035 * b, 1 + 0.045 * b], head: [0.75, -5, 4], horn: [0.35, -2, 0, 0.9, 0.9], wingF: [0.45], wingB: [0.5], tail: [0.55 + 0.04 * b], legs: [0, 0, 0, 1, 1.05] },
        only('faceShut', HAWK_FACES),
        { zz1: [0.2 * Math.sin(T * 2), 6 * u, -10 * u, 0.6 + 0.6 * u, 0.6 + 0.6 * u], zz2: [0, 2 + 6 * fract(u + 0.5), -8 - 10 * fract(u + 0.5), 0.4 + 0.5 * fract(u + 0.5), 0.4 + 0.5 * fract(u + 0.5)] });
      break;
    }
    case 'wake': {                // head pops up, wings snap open, one honk
      const k = ease.back(ramp(t, 0, 0.3)), up = ramp(t, 0, 0.12);
      p = add(hawkFlap(T, 16, k), { c: [0.05 * (1 - k), 0, 3 * (1 - k)], head: [0.75 * (1 - up) - 0.2 * Math.sin(Math.PI * ramp(t, 0.1, 0.3)), -5 * (1 - up), 4 * (1 - up) - 2 * k], horn: [-0.15 * k, 0, 0, 1 + 0.25 * k, 1 + 0.3 * k], body: [0, 0, 0, 1 + 0.08 * k, 1 + 0.06 * k] },
        t < 0.1 ? only('faceShut', HAWK_FACES) : only('face', HAWK_FACES), t > 0.1 ? fanRings(t, 2.6, 22, 0.35) : {});
      if (t > 0.1) p.face = [0, 0, -1, 1.2, 1.2];
      break;
    }
    case 'windup': {              // puffs up the speaker chest, pulls the head back, wings high, aims the horn down at the target
      const k = ease.out(ramp(t, 0, 0.4)), tr = Math.sin(T * 60) * 0.8 * ramp(t, 0.25, 0.45), br = Math.sin(T * 30) * 0.06 * k;
      p = add(hawkFlap(T, 20, 0.35, 0.25 + 1.0 * k), { c: [-0.3 * k, -5 * k + tr, -4 * k], body: [0, 0, 0, 1 + 0.26 * k, 1 + 0.24 * k], head: [0.5 * k, -3 * k, -1 * k], horn: [0.1 * k + br, 0, 0, 1 + 0.18 * k, 1 + 0.22 * k],
        tail: [-0.3 * k, 0, 0, 1, 1 + 0.35 * k], legs: [-0.5 * k] }, only(k > 0.5 && Math.floor(t * 12) % 2 ? 'faceMad' : t > 0.15 ? 'faceMad' : 'face', HAWK_FACES));
      break;
    }
    case 'attack': {              // the dive: tucked wings, nose down, rings fanning out of the horn
      const k = ease.out(ramp(t, 0, 0.08)), w = Math.sin(T * 45) * 0.06;
      p = add({ c: [0.95 * k, 6 * k, 2 * k, 1 + 0.12 * k, 1 - 0.1 * k], body: [0, 0, 0, 1.06, 0.96], wingF: [-1.0 * k + 1.15 * (1 - k) + w], wingB: [-0.85 * k + 1.2 * (1 - k)], head: [-0.25 * k], horn: [-0.1 * k, 1.5 * k, 0, 1.1, 1.25],
        tail: [-0.45 * k, 0, 0, 1, 0.8], legs: [0.9 * k] }, only('faceMad', HAWK_FACES), fanRings(t, 3.4, 30, 0.42));
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [-0.5 * k, -4 * k, 0, 1 + 0.12 * k, 1 - 0.14 * k], wingF: [1.4 * k], wingB: [1.3 * k], head: [-0.4 * k], horn: [-0.3 * k], tail: [0.6 * k] }, only('faceOuch', HAWK_FACES),
        { fea1: [T * 3, -10 * (1 - k) - 4, -8 * (1 - k), k > 0.05 ? 1 : 0.001, k > 0.05 ? 1 : 0.001], fea2: [-T * 2, 10 * (1 - k) + 2, -12 * (1 - k), k > 0.05 ? 1 : 0.001, k > 0.05 ? 1 : 0.001] });
      break;
    }
    case 'jam': {                 // a dizzy wobbling hover, horn drooping
      const w = Math.sin(T * 3);
      p = add(hawkFlap(T, 7, 0.4, 0.4), { c: [0.25 * w, 0, 4 + 2 * Math.sin(T * 2.2)], head: [0.45 + 0.1 * w], horn: [0.5 + 0.1 * Math.sin(T * 4), 0, 1], tail: [0.4] }, only('faceDizzy', HAWK_FACES), orbit(STARS, T, 13, 4));
      break;
    }
    case 'dead': {                // tumbles, shrinks into scraps
      const k = ease.in(ramp(t, 0, 0.32));
      p = add({ c: [k * 8, 0, 6 * k, 1 - 0.7 * k, 1 - 0.7 * k], wingF: [1.4 * k], wingB: [1.4 * k], head: [0.6 * k], horn: [0.5 * k] }, only('faceDizzy', HAWK_FACES),
        { fea1: [k * 6, -16 * k, -10 * k, 1, 1], fea2: [-k * 5, 14 * k, -14 * k, 1, 1] });
      break;
    }
    case 'move': p = add(hawkFlap(T, 15, 1, 0.15), { c: [0.18, 0, 0] }, only('face', HAWK_FACES)); break;
    default: p = add(hawkFlap(T, 10, 0.85), only('face', HAWK_FACES));
  }
  return fx(p, HAWK_FX);
}

// ================================================================== GATEWARDEN (Bridge Gatekeeper): a stone toll post with a crossing-arm barrier and a lantern
const GATE_FACES = ['face', 'faceMad', 'faceDizzy', 'faceOuch'];
const GATE_FX = ['lampY', 'lampR', 'dust', 'dust2', 'dust3', ...STARS, ...GATE_FACES];
function gateLeg(dark: number): Img {
  return img(24, 20, 11, 2, (c) => {
    paper(c, () => rr(c, 4, 0, 14, 11, 4), shade(STONE, dark), { lw: 2.4, y0: 0, y1: 11 });
    paper(c, () => { c.moveTo(2, 10); c.lineTo(17, 10); c.bezierCurveTo(22, 10, 23, 13, 23, 17); c.lineTo(2, 17); c.closePath(); }, shade(WOODC, dark - 0.15), { lw: 2.4, y0: 10, y1: 17 });
    c.fillStyle = shade(IRONC, dark); c.fillRect(3, 14.2, 19.5, 1.6);
  });
}
function gateFace(kind: 'calm' | 'mad' | 'dizzy' | 'ouch'): Img {
  return img(34, 26, 17, 11, (c) => {
    if (kind === 'calm' || kind === 'mad') {
      const m = kind === 'mad';
      madEye(c, 10, 9, m ? 5 : 4.6, '#e8d6ad', m ? 0.55 : 0.25, 0.4, m ? 0.0 : 0.3);
      madEye(c, 24, 9, m ? 5.4 : 5, '#e8d6ad', m ? -0.55 : -0.25, 0.4, m ? 0.0 : 0.3);
      paper(c, () => rr(c, 11, 18, 13, m ? 6 : 4.5, 2), IRONC, { lw: 1.8, y0: 18, y1: 24 });                     // the coin-slot mouth
      c.fillStyle = m ? '#ffd23f' : '#14101f'; c.fillRect(13.5, 19.6, 8, m ? 2.6 : 1.3);
      if (m) { vein(c, 30, 2, 5); }
    } else if (kind === 'dizzy') {
      spiralEye(c, 10, 9, 4.6); spiralEye(c, 24, 9, 5);
      c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(11, 20); c.bezierCurveTo(14, 17, 16, 23, 19, 20); c.bezierCurveTo(21, 18, 22, 21, 24, 20); c.stroke();
    } else {
      squint(c, 10, 9, 4.4, 1); squint(c, 24, 9, 4.8, -1);
      paper(c, () => ell(c, 17.5, 20, 3.4, 3), '#3a1424', { lw: 1.8, y0: 17, y1: 23 });
    }
  });
}
function lampGlow(col: string, glow: string): Img {
  return img(18, 18, 9, 9, (c) => { c.fillStyle = glow; c.beginPath(); ell(c, 9, 9, 8.5, 8.5); c.fill(); c.fillStyle = col; c.beginPath(); ell(c, 9, 9.5, 3.6, 4.4); c.fill(); c.fillStyle = '#fff'; c.beginPath(); ell(c, 8, 8, 1.4, 1.8); c.fill(); });
}
const GATE: PartDef[] = [
  { name: 'c', at: [0, -20] },
  { name: 'legB', parent: 'c', at: [-11, 4], img: gateLeg(-0.2) },
  { name: 'legF', parent: 'c', at: [11, 4], img: gateLeg(0) },
  { name: 'armB', parent: 'c', at: [-21, -30], img: img(16, 26, 8, 3, (c) => {
    paper(c, () => rr(c, 3.5, 1, 9, 14, 3), shade(WOODC, -0.25), { lw: 2.4, y0: 1, y1: 15 });
    paper(c, () => ell(c, 8, 18, 6.5, 6), shade(STONE, -0.2), { lw: 2.4, y0: 12, y1: 24 });
  }) },
  { name: 'body', parent: 'c', at: [0, 6], img: img(56, 60, 28, 58, (c) => {
    paper(c, () => rr(c, 5, 8, 46, 50, 8), STONE, { y0: 8, y1: 58 });                                               // the stone post
    c.save(); c.beginPath(); rr(c, 5, 8, 46, 50, 8); c.clip();
    c.strokeStyle = shade(STONE, -0.32); c.lineWidth = 1.4; c.beginPath();
    for (const [y, o] of [[44, 0], [51, 1]] as const) { c.moveTo(5, y); c.lineTo(51, y); for (let x = 12 + o * 8; x < 50; x += 16) { c.moveTo(x, y); c.lineTo(x, y + 7); } }
    c.stroke();
    c.fillStyle = 'rgba(29,26,51,0.12)'; c.fillRect(5, 52, 46, 6);
    c.restore();
    paper(c, () => rr(c, 9, 13, 38, 28, 4), '#e8d6ad', { lw: 2.4, y0: 13, y1: 41, top: 0.1, bot: -0.12 });          // the wooden face plank
    c.strokeStyle = 'rgba(120,80,40,0.25)'; c.lineWidth = 1; c.beginPath(); for (const y of [20, 27, 34]) { c.moveTo(11, y); c.lineTo(45, y); } c.stroke();
    paper(c, () => rr(c, 13, 44, 30, 7, 2), RED, { lw: 1.8, y0: 44, y1: 51 });                                     // a striped sash
    c.save(); c.beginPath(); rr(c, 13, 44, 30, 7, 2); c.fillStyle = '#fff'; stripes(c, 13, 43, 44, 51, 4, '#fff'); c.restore();
    c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); rr(c, 13, 44, 30, 7, 2); c.stroke();
    shine(c, 9, 46, 9, 55, 0.35);
  }) },
  { name: 'brow', parent: 'body', at: [0, -45], img: img(46, 14, 23, 7, (c) => paper(c, () => { c.moveTo(3, 9); c.quadraticCurveTo(4, 3, 12, 3); c.lineTo(34, 3); c.quadraticCurveTo(42, 3, 43, 9); c.lineTo(36, 11); c.quadraticCurveTo(23, 7, 10, 11); c.closePath(); }, STONE_D, { lw: 2.2, y0: 2, y1: 11 })) },
  { name: 'face', parent: 'body', at: [0, -31], img: gateFace('calm') },
  { name: 'faceMad', parent: 'body', at: [0, -31], img: gateFace('mad') },
  { name: 'faceDizzy', parent: 'body', at: [0, -31], img: gateFace('dizzy') },
  { name: 'faceOuch', parent: 'body', at: [0, -31], img: gateFace('ouch') },
  { name: 'cap', parent: 'body', at: [0, -50], img: img(60, 20, 30, 16, (c) => {                                   // a crenellated bridge-parapet cap
    paper(c, () => { c.moveTo(2, 18); c.lineTo(2, 8); c.lineTo(10, 8); c.lineTo(10, 3); c.lineTo(19, 3); c.lineTo(19, 8); c.lineTo(26, 8); c.lineTo(26, 3); c.lineTo(34, 3); c.lineTo(34, 8); c.lineTo(41, 8); c.lineTo(41, 3); c.lineTo(50, 3); c.lineTo(50, 8); c.lineTo(58, 8); c.lineTo(58, 18); c.closePath(); }, shade(STONE, 0.12), { y0: 3, y1: 18 });
    c.strokeStyle = shade(STONE, -0.3); c.lineWidth = 1.2; c.beginPath(); c.moveTo(4, 13); c.lineTo(56, 13); c.stroke();
  }) },
  { name: 'lamp', parent: 'cap', at: [0, -13], img: img(24, 34, 12, 33, (c) => {                                 // a lantern standing on the cap
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); ell(c, 12, 4, 3.2, 2.8); c.stroke();
    paper(c, () => { c.moveTo(4, 12); c.lineTo(12, 6); c.lineTo(20, 12); c.closePath(); }, IRONC, { lw: 2, y0: 6, y1: 12 });
    paper(c, () => rr(c, 6, 12, 12, 14, 2), '#fff2b0', { lw: 2, y0: 12, y1: 26, top: 0.3, bot: -0.1 });
    c.strokeStyle = IRONC; c.lineWidth = 1.4; c.beginPath(); c.moveTo(12, 12); c.lineTo(12, 26); c.stroke();
    paper(c, () => rr(c, 4, 26, 16, 4, 1.5), IRONC, { lw: 1.8, y0: 26, y1: 30 });
    paper(c, () => rr(c, 9, 29, 6, 4, 1), IRONC, { lw: 1.6, y0: 29, y1: 33 });
  }) },
  { name: 'lampY', parent: 'lamp', at: [0, -14], img: lampGlow('#ffd23f', 'rgba(255,220,90,0.55)') },
  { name: 'lampR', parent: 'lamp', at: [0, -14], img: lampGlow('#ff4b3a', 'rgba(255,80,60,0.6)') },
  { name: 'barW', parent: 'body', at: [24, -12], img: img(22, 18, 17, 9, (c) => paper(c, () => rr(c, 2, 3, 13, 12, 3), IRONC, { lw: 2.2, y0: 3, y1: 15 })) },   // counterweight (rides on the bar)
  { name: 'bar', parent: 'body', at: [24, -12], img: img(70, 14, 6, 7, (c) => {                                  // the crossing-arm barrier, pointing +x
    const path = () => rr(c, 2, 3.5, 64, 7, 3.5);
    c.beginPath(); path(); c.fillStyle = '#fff'; c.fill();
    c.beginPath(); path(); stripes(c, 2, 66, 3.5, 10.5, 6, RED, 0.6);
    c.beginPath(); path(); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke();
    paper(c, () => ell(c, 63, 7, 3.4, 3.4), '#ff4b3a', { lw: 1.6, y0: 3, y1: 11 });
    shine(c, 10, 5.4, 56, 5.4, 0.5, 1.4);
  }) },
  { name: 'hub', parent: 'body', at: [24, -12], img: img(16, 16, 8, 8, (c) => { paper(c, () => ell(c, 8, 8, 6.5, 6.5), MUSTARD, { lw: 2.2, y0: 1, y1: 15 }); c.fillStyle = INK; c.beginPath(); ell(c, 8, 8, 1.8, 1.8); c.fill(); }) },
  { name: 'dust', at: [44, -6], img: puffImg(8, '#efe2c6') },
  { name: 'dust2', at: [62, -6], img: puffImg(7, '#efe2c6') },
  { name: 'dust3', at: [-20, -6], img: puffImg(7, '#efe2c6') },
  ...starParts('c', [0, -76], 5),
];
function gatePose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  const bar = (a: number): Pose => ({ bar: [a], barW: [a] });
  switch (x.state) {
    case 'move': {                  // a slow, heavy waddle; the barrier bobs and the lantern swings
      const ph = T * 6, s = Math.sin(ph);
      p = add({ c: [0.06 * s, 0, -2.5 * Math.abs(Math.cos(ph))], legF: [-0.4 * s, 0, Math.min(0, -2.5 * Math.cos(ph))], legB: [0.4 * s, 0, Math.min(0, 2.5 * Math.cos(ph))], armB: [-0.3 * s],
        body: [0, 0, 0, 1 + 0.025 * Math.cos(2 * ph), 1 - 0.025 * Math.cos(2 * ph)], lamp: [-0.35 * Math.sin(ph - 1.1)], lampY: ON, cap: [0.03 * Math.sin(ph - 0.5)] }, bar(0.12 + 0.08 * Math.sin(2 * ph - 1)), only('face', GATE_FACES));
      break;
    }
    case 'windup': {                // raises the barrier high; the lantern blinks red/yellow like a crossing signal
      const k = ease.io(ramp(t, 0, 0.45)), tr = Math.sin(T * 48) * 0.7 * ramp(t, 0.35, 0.55), bl = Math.floor(t * 8) % 2;
      p = add({ c: [-0.14 * k, tr, -2 * k], body: [0, 0, 0, 1 - 0.03 * k, 1 + 0.05 * k], legF: [-0.25 * k], legB: [0.2 * k], armB: [0.6 * k], brow: [0, 0, 2.5 * k], lamp: [0.25 * k * Math.sin(T * 14)],
        lampY: bl ? ON : OFF, lampR: bl ? OFF : ON }, bar(0.12 - 1.72 * k + 0.05 * Math.sin(T * 30) * k), only(t > 0.12 ? 'faceMad' : 'face', GATE_FACES));
      break;
    }
    case 'attack': {                // slams the barrier down in front; body pitches forward; dust where it lands
      const k = ease.in(ramp(t, 0, 0.07)), b = Math.sin(ramp(t, 0.07, 0.24) * Math.PI) * (1 - ramp(t, 0.07, 0.24)), r = ease.io(ramp(t, 0.24, 0.42)), d = ramp(t, 0.06, 0.34);
      const down = 0.36 * k - 0.14 * b;
      p = add({ c: [0.12 * k * (1 - r), 4 * k * (1 - r), 2 * k * (1 - r)], body: [0, 0, 0, 1 + 0.06 * k * (1 - r), 1 - 0.07 * k * (1 - r)], legF: [-0.3 * k * (1 - r)], legB: [0.35 * k * (1 - r)], armB: [-0.4 * k * (1 - r)],
        brow: [0, 0, 2.5], lamp: [-0.6 * k + 0.4 * b], lampR: ON },
      bar(t < 0.07 ? -1.6 + 1.96 * k : down * (1 - r) + 0.12 * r), only('faceMad', GATE_FACES),
      t > 0.06 ? { dust: [0, 10 * d, -6 * d, (0.6 + 0.9 * d) * (1 - r * 0.6), (0.6 + 0.7 * d) * (1 - r * 0.6)], dust2: [0, 16 * d, -3 * d, (0.4 + 0.8 * d) * (1 - r * 0.6), (0.4 + 0.6 * d) * (1 - r * 0.6)] } : {});
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [-0.12 * k, -4 * k, 0], body: [0, 0, 0, 1 + 0.1 * k, 1 - 0.1 * k], armB: [0.8 * k], brow: [0, 0, -2 * k], lamp: [0.9 * k], cap: [-0.15 * k, 0, -2 * k], lampY: ON }, bar(0.12 - 0.6 * k), only('faceOuch', GATE_FACES));
      break;
    }
    case 'jam': {
      const w = Math.sin(T * 2.6);
      p = add({ c: [0.1 + 0.04 * w, 0, 1], body: [0, 0, 0, 1.02, 0.98], armB: [0.3 - 0.15 * w], legF: [-0.15], legB: [0.15], lamp: [0.5 * Math.sin(T * 3.1)], cap: [0.12 + 0.05 * w, 0, 1], lampY: Math.sin(T * 9) > 0 ? ON : OFF },
        bar(0.36 + 0.04 * w), only('faceDizzy', GATE_FACES), orbit(STARS, T, 18, 5));
      break;
    }
    case 'dead': {                  // the barrier drops, the cap slides off, then it settles flat
      const k = ease.in(ramp(t, 0, 0.3));
      p = add({ c: [-0.3 * k, -4 * k, 10 * k, 1 + 0.15 * k, 1 - 0.55 * k], armB: [1.2 * k], cap: [-0.8 * k, -10 * k, -6 * k], lamp: [1.2 * k] }, bar(0.12 + 0.3 * k), only('faceDizzy', GATE_FACES),
        k > 0.6 ? { dust: [0, 0, 0, 1.2, 1], dust3: [0, 0, 0, 1.2, 1] } : {});
      break;
    }
    default: {
      const b = Math.sin(T * 2.2);
      p = add({ c: [0.015 * b, 0, 0], body: [0, 0, 0, 1 + 0.012 * b, 1 - 0.018 * b], armB: [0.06 * b], lamp: [0.18 * Math.sin(T * 1.6)], lampY: Math.sin(T * 1.3) > -0.6 ? ON : OFF, brow: [0, 0, 0.6 * Math.max(0, Math.sin(T * 0.7))] },
        bar(0.12 + 0.03 * Math.sin(T * 2.2 - 0.8)), only('face', GATE_FACES));
    }
  }
  return fx(p, GATE_FX);
}

// ================================================================== DRIFTER (Domain Drifter): a crumpled, torn map sheet that drifts between domains
const MAPC = '#efe3c2', LAND = '#a9d18e', RIVER = '#6cc3e8';
const DRIFT_FACES = ['face', 'faceScared', 'faceDizzy', 'faceOuch'];
const PLANE_FACES = ['pface', 'pfaceMad'];
const DRIFT_FX = ['echo', 'plane', 'streak', 'ball', ...PLANE_FACES, ...STARS, ...DRIFT_FACES];
function sheetOutline(c: CanvasRenderingContext2D): void {     // a crumpled sheet with a torn-off top-right corner
  c.moveTo(4, 5); c.lineTo(12, 3); c.lineTo(19, 5); c.lineTo(24, 3);
  c.lineTo(26, 7); c.lineTo(29, 8); c.lineTo(30, 12); c.lineTo(34, 14);                     // the tear
  c.lineTo(33, 22); c.lineTo(35, 30);
  c.lineTo(31, 33); c.lineTo(27, 38); c.lineTo(23, 34); c.lineTo(18, 39); c.lineTo(14, 34); c.lineTo(9, 38); c.lineTo(5, 33);
  c.lineTo(3, 24); c.lineTo(5, 15); c.closePath();
}
function mapPrint(c: CanvasRenderingContext2D, w: number, h: number): void {
  c.fillStyle = LAND; c.beginPath(); ell(c, w * 0.25, h * 0.35, w * 0.2, h * 0.16); ell(c, w * 0.75, h * 0.7, w * 0.2, h * 0.18); c.fill();
  c.strokeStyle = RIVER; c.lineWidth = 1.8; c.beginPath(); c.moveTo(w * 0.05, h * 0.75); c.bezierCurveTo(w * 0.35, h * 0.55, w * 0.5, h * 0.95, w * 0.95, h * 0.45); c.stroke();
  c.strokeStyle = 'rgba(214,60,50,0.85)'; c.lineWidth = 1.3; c.setLineDash([2.4, 1.8]); c.beginPath(); c.moveTo(w * 0.55, 0); c.bezierCurveTo(w * 0.4, h * 0.4, w * 0.7, h * 0.6, w * 0.45, h); c.stroke(); c.setLineDash([]);
}
function driftFace(kind: 'calm' | 'scared' | 'dizzy' | 'ouch'): Img {
  return img(28, 20, 14, 9, (c) => {
    if (kind === 'calm' || kind === 'scared') {
      const s = kind === 'scared';
      eye(c, 8, 10, s ? 5.4 : 5, 0.3); eye(c, 20, 9.5, s ? 5.9 : 5.5, 0.3);
      c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath();                                       // worried brows (high in the middle)
      c.moveTo(3, 4); c.quadraticCurveTo(7, 3.5, 11, s ? 0.5 : 1.8); c.moveTo(16, s ? 0 : 1.4); c.quadraticCurveTo(21, 3, 25, 3.5); c.stroke();
      c.beginPath(); if (s) { c.moveTo(11, 18); c.quadraticCurveTo(14, 15.5, 17, 18); } else { c.moveTo(11.5, 17.5); c.quadraticCurveTo(14, 16, 16.5, 17.5); } c.stroke();
    } else if (kind === 'dizzy') {
      spiralEye(c, 8, 10, 4.8); spiralEye(c, 20, 9.5, 5.2);
      c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(10, 17.5); c.bezierCurveTo(12, 15.5, 14, 19.5, 16, 17.5); c.bezierCurveTo(17, 16.5, 18, 17.5, 19, 17); c.stroke();
    } else {
      squint(c, 8, 10, 4.4, 1); squint(c, 20, 9.5, 4.8, -1);
      paper(c, () => ell(c, 14, 17, 2.6, 2.4), '#3a1424', { lw: 1.6, y0: 14, y1: 20 });
    }
  });
}
function planeFace(mad: boolean): Img {
  return img(18, 10, 9, 5, (c) => {
    if (mad) { madEye(c, 5, 5, 3.4, MAPC, 0.5, 0.5, 0); madEye(c, 13, 5, 3.6, MAPC, -0.5, 0.5, 0); }
    else { eye(c, 5, 5, 3.2, 0.4); eye(c, 13, 5, 3.4, 0.4); }
  });
}
const DRIFT: PartDef[] = [
  { name: 'c', at: [0, 0] },
  { name: 'echo', parent: 'c', at: [0, 0], img: img(38, 42, 19, 21, (c) => {                                      // a dashed after-image (the "other domain")
    c.beginPath(); sheetOutline(c); c.fillStyle = 'rgba(191,224,238,0.55)'; c.fill();
    c.setLineDash([3.5, 2.5]); c.lineWidth = 2; c.strokeStyle = 'rgba(70,120,170,0.8)'; c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(70,120,170,0.6)'; c.beginPath(); ell(c, 13, 17, 3.6, 4); ell(c, 24, 16.5, 3.9, 4.3); c.fill();
  }) },
  { name: 'handB', parent: 'c', at: [-14, 4], img: img(14, 14, 11, 4, (c) => paper(c, () => { c.moveTo(11, 2); c.lineTo(2, 8); c.lineTo(9, 12); c.closePath(); }, shade(MAPC, -0.2), { lw: 1.8, y0: 2, y1: 12 })) },
  { name: 'sheet', parent: 'c', at: [0, 0], img: img(38, 42, 19, 21, (c) => {
    paper(c, () => sheetOutline(c), MAPC, { y0: 3, y1: 39, top: 0.12, bot: -0.12 });
    c.save(); c.beginPath(); sheetOutline(c); c.clip();
    mapPrint(c, 38, 40);
    c.strokeStyle = 'rgba(29,26,51,0.18)'; c.lineWidth = 1.1; c.beginPath();                                        // crumple creases
    c.moveTo(4, 14); c.lineTo(15, 19); c.lineTo(22, 12); c.lineTo(33, 20); c.moveTo(15, 19); c.lineTo(13, 34); c.moveTo(22, 12); c.lineTo(24, 4); c.moveTo(25, 27); c.lineTo(33, 31); c.stroke();
    c.fillStyle = 'rgba(29,26,51,0.08)'; c.beginPath(); c.moveTo(15, 19); c.lineTo(22, 12); c.lineTo(33, 20); c.lineTo(34, 30); c.lineTo(23, 30); c.closePath(); c.fill();
    c.restore();
    paper(c, () => { c.moveTo(24, 3); c.lineTo(26, 7); c.lineTo(29, 8); c.lineTo(30, 12); c.lineTo(25, 10); c.closePath(); }, shade(MAPC, -0.18), { lw: 1.4, y0: 3, y1: 12 });   // the curled tear
    paper(c, () => { c.moveTo(31, 4); c.lineTo(34, 9); c.lineTo(30, 8); c.closePath(); }, '#d9ccb0', { lw: 0.01, y0: 4, y1: 9 });
    shine(c, 7, 9, 7, 20, 0.6);
  }) },
  { name: 'face', parent: 'sheet', at: [-1, -2], img: driftFace('calm') },
  { name: 'faceScared', parent: 'sheet', at: [-1, -2], img: driftFace('scared') },
  { name: 'faceDizzy', parent: 'sheet', at: [-1, -2], img: driftFace('dizzy') },
  { name: 'faceOuch', parent: 'sheet', at: [-1, -2], img: driftFace('ouch') },
  { name: 'handF', parent: 'c', at: [14, 5], img: img(14, 14, 3, 4, (c) => paper(c, () => { c.moveTo(3, 2); c.lineTo(12, 8); c.lineTo(5, 12); c.closePath(); }, shade(MAPC, -0.05), { lw: 1.8, y0: 2, y1: 12 })) },
  { name: 'streak', parent: 'c', at: [-22, 2], img: img(40, 22, 38, 11, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineCap = 'round';
    for (const [y, x0, w] of [[4, 8, 2.4], [11, 2, 3], [18, 12, 2.4]] as const) { c.beginPath(); c.moveTo(x0, y); c.lineTo(36, y); c.lineWidth = w + 2.4; c.strokeStyle = INK; c.stroke(); c.lineWidth = w; c.strokeStyle = '#d7f1ff'; c.stroke(); }
  }) },
  { name: 'plane', parent: 'c', at: [0, 0], img: img(54, 30, 27, 15, (c) => {                                       // the folded paper plane (nose at +x)
    paper(c, () => { c.moveTo(52, 13); c.lineTo(2, 3); c.lineTo(14, 15); c.closePath(); }, shade(MAPC, 0.05), { y0: 3, y1: 15, lw: 2.4 });
    c.save(); c.beginPath(); c.moveTo(52, 13); c.lineTo(2, 3); c.lineTo(14, 15); c.closePath(); c.clip(); mapPrint(c, 54, 18); c.restore();
    paper(c, () => { c.moveTo(52, 13); c.lineTo(14, 15); c.lineTo(8, 27); c.closePath(); }, shade(MAPC, -0.15), { y0: 13, y1: 27, lw: 2.4 });
    paper(c, () => { c.moveTo(52, 13); c.lineTo(14, 15); c.lineTo(20, 20); c.closePath(); }, shade(MAPC, -0.3), { y0: 13, y1: 20, lw: 1.6 });
    shine(c, 10, 6, 36, 11, 0.6, 1.6);
  }) },
  { name: 'pface', parent: 'plane', at: [9, -4], img: planeFace(false) },
  { name: 'pfaceMad', parent: 'plane', at: [9, -4], img: planeFace(true) },
  { name: 'ball', parent: 'c', at: [0, 0], img: img(26, 24, 13, 12, (c) => {                                        // a crumpled paper ball (dead)
    paper(c, () => { c.moveTo(4, 9); c.lineTo(9, 3); c.lineTo(16, 4); c.lineTo(23, 8); c.lineTo(22, 17); c.lineTo(15, 21); c.lineTo(6, 19); c.lineTo(3, 14); c.closePath(); }, MAPC, { lw: 2.2, y0: 3, y1: 21 });
    c.strokeStyle = 'rgba(29,26,51,0.3)'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(9, 3); c.lineTo(12, 11); c.lineTo(22, 17); c.moveTo(12, 11); c.lineTo(6, 19); c.moveTo(12, 11); c.lineTo(23, 8); c.stroke();
    c.strokeStyle = 'rgba(214,60,50,0.7)'; c.setLineDash([2, 1.5]); c.beginPath(); c.moveTo(15, 4); c.lineTo(17, 20); c.stroke(); c.setLineDash([]);
  }) },
  ...starParts('c', [0, -26]),
];
function driftPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t;
  let p: Pose;
  /** A phase-shift blink every 2.6 s: the sheet squashes thin and its after-image slides out. */
  const u = fract(T / 2.6), ph = u > 0.84 ? Math.sin(((u - 0.84) / 0.16) * Math.PI) : 0;
  const bob = Math.sin(T * 2.4);
  const tails = (lean: number): Pose => ({ handF: [lean - 0.3 + 0.35 * Math.sin(T * 5)], handB: [lean + 0.3 - 0.35 * Math.sin(T * 5 + 1)] });
  switch (x.state) {
    case 'move': {                 // drifting sideways, tilted into the motion, rippling
      const w = Math.sin(T * 6);
      p = add({ c: [0.22 + 0.05 * w, 0, 3 * bob], sheet: [0.05 * Math.sin(T * 7), 0, 0, (1 - 0.8 * ph) * (1 + 0.04 * w), 1 - 0.04 * w], echo: ph > 0.02 ? [0, -12 * ph, -2 * ph, 1, 1] : OFF }, tails(0.5), { handF: [0, -11 * ph], handB: [0, 11 * ph] }, only('face', DRIFT_FACES));
      break;
    }
    case 'windup': {               // crumples, then folds itself into a paper plane, nose up, pulled back
      const a = ease.in(ramp(t, 0, 0.22)), b = ease.back(ramp(t, 0.2, 0.42)), tr = Math.sin(T * 60) * 0.8 * ramp(t, 0.35, 0.5);
      const s = 1 - a;
      p = add({ c: [-0.22 * b, -5 * b + tr, -2 * b], sheet: [0.6 * a, 0, 0, Math.max(0.001, s * (1 - 0.3 * a)), Math.max(0.001, s)], handF: a > 0.9 ? OFF : [0.5 * a, 0, 0, s, s], handB: a > 0.9 ? OFF : [-0.5 * a, 0, 0, s, s],
        plane: b > 0 ? [0, 0, 0, Math.max(0.001, b), Math.max(0.001, 0.4 + 0.6 * b)] : OFF, pface: b > 0 && t < 0.32 ? ON : OFF, pfaceMad: t >= 0.32 ? ON : OFF },
      only(a < 0.6 ? 'faceScared' : 'x', DRIFT_FACES));
      break;
    }
    case 'attack': {               // a quick glide forward as a paper plane, with streaks behind it
      const k = ease.out(ramp(t, 0, 0.06)), w = Math.sin(T * 30) * 0.03;
      p = add({ c: [0.12 * k + w, 4 * k, 0], plane: [0, 0, 0, 1 + 0.15 * k, 1 - 0.08 * k], pfaceMad: ON, streak: [0, -14, 0, 0.7 + 0.3 * Math.sin(T * 40), 1], sheet: [0, 0, 0, 0.001, 0.001], handF: OFF, handB: OFF }, only('x', DRIFT_FACES));
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.3));
      p = add({ c: [-0.4 * k, -4 * k, 0], sheet: [0.2 * k, 0, 0, 1 - 0.3 * k, 1 + 0.12 * k], echo: [0, -10 * k, 3 * k, 1, 1] }, tails(-1.2 * k), only('faceOuch', DRIFT_FACES));
      break;
    }
    case 'jam': {                  // limp and slowly turning, flickering between domains
      const w = Math.sin(T * 2.2), fl = Math.sin(T * 9) > 0.4;
      p = add({ c: [0.35 * w, 0, 5 + 2 * Math.sin(T * 1.7)], sheet: [0, 0, 0, fl ? 0.5 : 1, 0.95], echo: fl ? [0.2, 8, 3, 1, 1] : OFF, handF: [0.9], handB: [-0.9] }, only('faceDizzy', DRIFT_FACES), orbit(STARS, T, 14, 4));
      break;
    }
    case 'dead': {                 // crumples into a ball that shrinks away
      const k = ease.in(ramp(t, 0, 0.14)), b = ease.in(ramp(t, 0.12, 0.33));
      p = add({ c: [k * 3 + b * 6, 0, 8 * b], sheet: k < 1 ? [k * 2, 0, 0, Math.max(0.001, 1 - k), Math.max(0.001, 1 - 0.7 * k)] : OFF, handF: OFF, handB: OFF,
        ball: k > 0.6 ? [0, 0, 0, Math.max(0.001, 1 - 0.8 * b), Math.max(0.001, 1 - 0.8 * b)] : OFF }, only('faceDizzy', DRIFT_FACES));
      break;
    }
    default: {                     // idle / sleep / wake: a ghostly hover with the phase-shift blink
      p = add({ c: [0.06 * Math.sin(T * 1.3), 0, 3 * bob], sheet: [0.04 * Math.sin(T * 1.9), 0, 0, Math.max(0.12, 1 - 0.85 * ph), 1 + 0.03 * Math.sin(T * 2.4 + 1)],
        echo: ph > 0.02 ? [0, (u < 0.92 ? -1 : 1) * 14 * ph, -3 * ph, 1, 1] : OFF }, tails(0), { handF: [0, -11 * ph, 0, 1 - 0.5 * ph, 1], handB: [0, 11 * ph, 0, 1 - 0.5 * ph, 1] }, only(ph > 0.3 ? 'faceScared' : 'face', DRIFT_FACES));
    }
  }
  return fx(p, DRIFT_FX);
}

// ================================================================== BORDER KING (area 3 boss): a stern king built of a stone gate arch, barrier arms, signs and flags
const KING_EYES = ['eyes', 'eyesSpin', 'eyesX', 'eyesShut'];
const KING_LEDS = ['ledG', 'ledY', 'ledR'];
const POSTS = ['post1', 'post2', 'post3', 'post4'];
const BOOM = ['boom1', 'boom2', 'boom3'];
const KING_FX = [...KING_EYES, ...KING_LEDS, ...POSTS, 'mouthOpen', 'rage', 'cracks', 'steam1', 'steam2', 'dustF', 'dustF2', 'dustB', 'dustW1', 'dustW2', 'spark0', 'spark1', 'shock', ...STARS];
const BSEG = 92;
function kingLeg(dark: number): Img {
  return img(46, 56, 23, 4, (c) => {
    paper(c, () => rr(c, 8, 1, 30, 42, 5), shade(STONE, dark), { y0: 1, y1: 43 });
    c.save(); c.beginPath(); rr(c, 8, 1, 30, 42, 5); c.clip(); c.strokeStyle = shade(STONE, dark - 0.3); c.lineWidth = 1.4; c.beginPath();
    for (const y of [14, 28]) { c.moveTo(8, y); c.lineTo(38, y); } c.moveTo(22, 1); c.lineTo(22, 14); c.moveTo(16, 14); c.lineTo(16, 28); c.moveTo(28, 28); c.lineTo(28, 43); c.stroke(); c.restore();
    paper(c, () => { c.moveTo(3, 54); c.lineTo(5, 42); c.lineTo(41, 42); c.lineTo(44, 54); c.closePath(); }, shade(STONE_D, dark), { y0: 42, y1: 54 });   // plinth foot
    const g = () => { c.beginPath(); c.moveTo(5, 47); c.lineTo(42, 47); c.lineTo(43, 51); c.lineTo(4, 51); c.closePath(); };
    g(); c.fillStyle = '#fff'; c.fill(); g(); stripes(c, 4, 43, 47, 51, 4, shade(MUSTARD, dark), 0.8); g(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
  });
}
function boomSeg(i: number): Img {
  const L = BSEG + 6;
  return img(L, 22, 3, 11, (c) => {
    const w = 15 - i * 2.5, y0 = 11 - w / 2;
    const path = () => rr(c, 0, y0, L - (i === 2 ? 2 : 0), w, w / 2);
    c.beginPath(); path(); c.fillStyle = '#fff'; c.fill();
    c.beginPath(); path(); stripes(c, 0, L, y0, y0 + w, 9, RED, 0.7);
    c.beginPath(); path(); c.lineWidth = 2.8; c.strokeStyle = INK; c.stroke();
    if (i === 2) paper(c, () => ell(c, L - 6, 11, 4.5, 4.5), '#ff4b3a', { lw: 1.8, y0: 6, y1: 16 });
    else paper(c, () => rr(c, L - 9, y0 - 1, 7, w + 2, 2), IRONC, { lw: 1.8, y0: y0, y1: y0 + w });
    shine(c, 6, y0 + 2.5, L - 12, y0 + 2.5, 0.5, 1.8);
  });
}
function kingEyes(kind: 'calm' | 'spin' | 'x' | 'shut'): Img {
  return img(76, 30, 38, 15, (c) => {
    paper(c, () => { ell(c, 18, 15, 13, 12); ell(c, 58, 15, 13, 12); }, SAND, { lw: 0.01, y0: 0, y1: 30, top: 0.05, bot: 0 });
    if (kind === 'calm') { madEye(c, 18, 15, 10, SAND, 0.3, 0.35, 0.3); madEye(c, 58, 15, 10.5, SAND, -0.3, 0.35, 0.3); }
    else if (kind === 'spin') { spiralEye(c, 18, 15, 10); spiralEye(c, 58, 15, 10.5); }
    else if (kind === 'x') { xEye(c, 18, 15, 8.5); xEye(c, 58, 15, 9); }
    else { squint(c, 18, 15, 8.5, 1); squint(c, 58, 15, 9, -1); }
  });
}
function kingArm(dark: number): Img {
  return img(30, 64, 15, 6, (c) => {
    paper(c, () => rr(c, 5, 1, 20, 58, 6), shade(WOODC, dark), { y0: 1, y1: 59 });
    c.strokeStyle = shade(WOODC, dark - 0.35); c.lineWidth = 1.2; c.beginPath(); c.moveTo(12, 6); c.lineTo(12, 54); c.moveTo(18, 10); c.lineTo(18, 50); c.stroke();
    for (const y of [12, 44]) paper(c, () => rr(c, 3, y, 24, 6, 2), shade(IRONC, dark), { lw: 2, y0: y, y1: y + 6 });
    paper(c, () => ell(c, 15, 4, 9, 7), shade(STONE, dark), { lw: 2.4, y0: -3, y1: 11 });                            // shoulder knob
  });
}
function postImg(h: number, i: number): Img {
  return img(30, h + 6, 15, h + 2, (c) => {
    const body = () => rr(c, 6, 9, 18, h - 9, 3);
    c.beginPath(); body(); c.fillStyle = '#fff'; c.fill();
    c.beginPath(); body(); c.save(); c.clip(); c.fillStyle = i % 2 ? RED : ORANGE; for (let y = 14; y < h; y += 16) c.fillRect(6, y, 18, 8); c.restore();
    c.beginPath(); body(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
    paper(c, () => { c.moveTo(4, 11); c.lineTo(4, 6); c.quadraticCurveTo(15, 0, 26, 6); c.lineTo(26, 11); c.closePath(); }, STONE, { lw: 2.2, y0: 1, y1: 11 });
    paper(c, () => rr(c, 2, h - 4, 26, 7, 2), STONE_D, { lw: 2.2, y0: h - 4, y1: h + 3 });
    shine(c, 10, 14, 10, h - 8, 0.45, 2);
  });
}
const KING: PartDef[] = [
  { name: 'c', at: [0, -50] },
  { name: 'legB', parent: 'c', at: [-52, -2], img: kingLeg(-0.2) },
  { name: 'legF', parent: 'c', at: [52, -2], img: kingLeg(0) },
  { name: 'boom1', parent: 'c', at: [-62, -26], img: boomSeg(0) },
  { name: 'boomW', parent: 'boom1', at: [0, 0], img: img(40, 34, 36, 17, (c) => { paper(c, () => rr(c, 3, 4, 26, 26, 5), IRONC, { y0: 4, y1: 30 }); c.fillStyle = MUSTARD; c.beginPath(); ell(c, 16, 17, 4, 4); c.fill(); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); }) },
  { name: 'boom2', parent: 'boom1', at: [BSEG, 0], img: boomSeg(1) },
  { name: 'boom3', parent: 'boom2', at: [BSEG, 0], img: boomSeg(2) },
  { name: 'armB', parent: 'c', at: [-86, -114], img: kingArm(-0.22) },
  { name: 'signB', parent: 'armB', at: [0, 54], img: img(84, 96, 42, 6, (c) => {                                 // a yellow diamond sign with chevrons
    paper(c, () => rr(c, 37, 0, 10, 20, 2), '#8d8d9e', { lw: 2.2, y0: 0, y1: 20 });
    c.save(); c.translate(42, 54); c.rotate(Math.PI / 4);
    paper(c, () => rr(c, -27, -27, 54, 54, 6), shade(MUSTARD, -0.15), { y0: -30, y1: 30, lw: 3 });
    c.restore();
    c.save(); c.translate(42, 54); c.rotate(Math.PI / 4); c.beginPath(); rr(c, -21, -21, 42, 42, 4); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.restore();
    c.fillStyle = INK; for (const dx of [-11, 3]) { c.beginPath(); c.moveTo(34 + dx, 42); c.lineTo(46 + dx, 54); c.lineTo(34 + dx, 66); c.lineTo(41 + dx, 66); c.lineTo(53 + dx, 54); c.lineTo(41 + dx, 42); c.closePath(); c.fill(); }
  }) },
  { name: 'body', parent: 'c', at: [0, 0], img: img(196, 132, 98, 128, (c) => {                                  // the stone gate arch
    const out = () => { c.moveTo(8, 128); c.lineTo(8, 28); c.quadraticCurveTo(8, 6, 30, 5); c.lineTo(166, 5); c.quadraticCurveTo(188, 6, 188, 28); c.lineTo(188, 128); c.lineTo(132, 128); c.lineTo(132, 92); c.bezierCurveTo(132, 62, 64, 62, 64, 92); c.lineTo(64, 128); c.closePath(); };
    paper(c, () => { c.moveTo(64, 128); c.lineTo(64, 92); c.bezierCurveTo(64, 62, 132, 62, 132, 92); c.lineTo(132, 128); c.closePath(); }, '#2b2140', { y0: 64, y1: 128, top: 0.15, bot: -0.2 });   // the dark gateway
    c.fillStyle = 'rgba(255,214,120,0.18)'; c.beginPath(); ell(c, 98, 120, 26, 7); c.fill();
    paper(c, out, STONE, { y0: 5, y1: 128 });
    c.save(); c.beginPath(); out(); c.clip();
    c.strokeStyle = shade(STONE, -0.3); c.lineWidth = 1.5; c.beginPath();
    for (let y = 26, r = 0; y < 128; y += 17, r++) { c.moveTo(8, y); c.lineTo(188, y); for (let x = 22 + (r % 2) * 13; x < 188; x += 26) { c.moveTo(x, y); c.lineTo(x, y + 17); } }
    c.stroke();
    c.fillStyle = shade(STONE, 0.22); c.fillRect(8, 5, 180, 7);
    c.fillStyle = 'rgba(29,26,51,0.12)'; c.fillRect(8, 112, 180, 16);
    c.restore();
    paper(c, () => { c.moveTo(62, 92); c.bezierCurveTo(62, 58, 134, 58, 134, 92); c.lineTo(124, 92); c.bezierCurveTo(124, 70, 72, 70, 72, 92); c.closePath(); }, shade(STONE, 0.15), { y0: 58, y1: 92 });   // arch voussoirs
    c.strokeStyle = shade(STONE, -0.3); c.lineWidth = 1.4; c.beginPath(); for (const a of [0.2, 0.4, 0.6, 0.8]) { const ang = Math.PI * (1 + a); c.moveTo(98 + Math.cos(ang) * 28, 92 + Math.sin(ang) * 24); c.lineTo(98 + Math.cos(ang) * 37, 92 + Math.sin(ang) * 33); } c.stroke();
    paper(c, () => { c.moveTo(91, 58); c.lineTo(105, 58); c.lineTo(102, 72); c.lineTo(94, 72); c.closePath(); }, SAND, { lw: 2, y0: 58, y1: 72 });   // keystone
    // a blue-and-white sash across the chest
    c.save(); c.beginPath(); out(); c.clip();
    paper(c, () => { c.moveTo(4, 20); c.lineTo(30, 6); c.lineTo(194, 96); c.lineTo(194, 120); c.closePath(); }, NAVY, { lw: 2.6, y0: 6, y1: 120 });
    c.fillStyle = MUSTARD; c.beginPath(); c.moveTo(12, 22); c.lineTo(24, 15); c.lineTo(194, 108); c.lineTo(194, 112); c.closePath(); c.fill();
    c.restore();
    shine(c, 15, 30, 15, 110, 0.3, 3.5);
  }) },
  { name: 'cracks', parent: 'body', at: [0, 0], img: img(196, 132, 98, 128, (c) => {
    c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath();
    c.moveTo(30, 6); c.lineTo(36, 20); c.lineTo(30, 30); c.lineTo(40, 44); c.moveTo(36, 20); c.lineTo(46, 22);
    c.moveTo(170, 60); c.lineTo(160, 70); c.lineTo(168, 82); c.lineTo(158, 96); c.moveTo(120, 8); c.lineTo(126, 20); c.lineTo(118, 28); c.stroke();
  }) },
  { name: 'dome', parent: 'body', at: [0, -60], img: img(64, 44, 32, 40, (c) => {                                 // the little router dome on his chest
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); c.moveTo(18, 22); c.lineTo(10, 3); c.moveTo(46, 22); c.lineTo(54, 3); c.stroke();
    c.strokeStyle = '#8d8d9e'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(18, 22); c.lineTo(10, 3); c.moveTo(46, 22); c.lineTo(54, 3); c.stroke();
    paper(c, () => ell(c, 10, 3, 2.8, 2.8), RED, { lw: 1.4, y0: 0, y1: 6 }); paper(c, () => ell(c, 54, 3, 2.8, 2.8), RED, { lw: 1.4, y0: 0, y1: 6 });
    paper(c, () => { c.moveTo(6, 38); c.bezierCurveTo(6, 12, 58, 12, 58, 38); c.closePath(); }, '#d6dde8', { y0: 14, y1: 38 });
    paper(c, () => rr(c, 3, 34, 58, 8, 3), NAVY, { lw: 2.2, y0: 34, y1: 42 });
    c.fillStyle = '#20263f'; for (const x of [16, 26, 38, 48]) { c.beginPath(); ell(c, x, 38, 2.4, 1.6); c.fill(); }
    shine(c, 16, 24, 26, 18, 0.7, 2.4);
  }) },
  ...KING_LEDS.map((n, i): PartDef => ({ name: n, parent: 'dome', at: [0, -12], img: img(14, 14, 7, 7, (c) => {
    const col = ['#5dff8a', '#ffd23f', '#ff4b3a'][i];
    c.fillStyle = ['rgba(120,255,160,0.45)', 'rgba(255,220,90,0.5)', 'rgba(255,80,60,0.55)'][i]; c.beginPath(); ell(c, 7, 7, 6.8, 6.8); c.fill();
    c.fillStyle = col; c.beginPath(); ell(c, 7, 7, 3.6, 3.6); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); ell(c, 6, 5.8, 1.1, 1.1); c.fill();
  }) })),
  { name: 'spark0', parent: 'dome', at: [-22, -36], img: sparkImg(10) },
  { name: 'spark1', parent: 'dome', at: [22, -36], img: sparkImg(9, '#bff4ff') },
  { name: 'head', parent: 'body', at: [0, -124], img: img(124, 88, 62, 84, (c) => {                              // the stern sandstone face block
    paper(c, () => { c.moveTo(14, 84); c.lineTo(8, 22); c.quadraticCurveTo(8, 6, 26, 6); c.lineTo(98, 6); c.quadraticCurveTo(116, 6, 116, 22); c.lineTo(110, 84); c.closePath(); }, SAND, { y0: 6, y1: 84 });
    c.save(); c.beginPath(); c.moveTo(14, 84); c.lineTo(8, 22); c.quadraticCurveTo(8, 6, 26, 6); c.lineTo(98, 6); c.quadraticCurveTo(116, 6, 116, 22); c.lineTo(110, 84); c.closePath(); c.clip();
    c.fillStyle = 'rgba(29,26,51,0.1)'; c.fillRect(0, 70, 124, 18);
    c.restore();
    paper(c, () => { c.moveTo(56, 34); c.lineTo(70, 34); c.lineTo(73, 58); c.quadraticCurveTo(63, 64, 53, 58); c.closePath(); }, shade(SAND, -0.12), { y0: 34, y1: 62 });   // nose
    c.fillStyle = '#fff'; c.fillRect(54.5, 45, 17, 4); c.strokeStyle = INK; c.lineWidth = 1.2; c.strokeRect(54.5, 45, 17, 4);
    shine(c, 16, 22, 18, 60, 0.4, 3);
  }) },
  { name: 'eyes', parent: 'head', at: [0, -56], img: kingEyes('calm') },
  { name: 'eyesSpin', parent: 'head', at: [0, -56], img: kingEyes('spin') },
  { name: 'eyesX', parent: 'head', at: [0, -56], img: kingEyes('x') },
  { name: 'eyesShut', parent: 'head', at: [0, -56], img: kingEyes('shut') },
  { name: 'brows', parent: 'head', at: [0, -71], img: img(96, 22, 48, 11, (c) => {
    paper(c, () => { c.moveTo(3, 7); c.quadraticCurveTo(22, 1, 44, 12); c.lineTo(42, 18); c.quadraticCurveTo(22, 10, 4, 15); c.closePath(); }, STONE_D, { lw: 2.4, y0: 1, y1: 18 });
    paper(c, () => { c.moveTo(93, 7); c.quadraticCurveTo(74, 1, 52, 12); c.lineTo(54, 18); c.quadraticCurveTo(74, 10, 92, 15); c.closePath(); }, STONE_D, { lw: 2.4, y0: 1, y1: 18 });
  }) },
  { name: 'rage', parent: 'head', at: [0, -34], img: img(110, 22, 55, 11, (c) => { blush(c, 18, 11, 12, 7, 0.55); blush(c, 92, 11, 12, 7, 0.55); vein(c, 104, 1, 10); }) },
  { name: 'mouthOpen', parent: 'head', at: [0, -12], img: img(44, 26, 22, 4, (c) => {
    paper(c, () => { c.moveTo(4, 4); c.lineTo(40, 4); c.quadraticCurveTo(38, 24, 22, 24); c.quadraticCurveTo(6, 24, 4, 4); c.closePath(); }, '#5a1d2e', { lw: 2.4, y0: 4, y1: 24 });
    c.fillStyle = '#fffaf0'; c.fillRect(8, 5, 28, 4); paper(c, () => ell(c, 22, 19, 8, 4), PINK, { lw: 1.4, y0: 15, y1: 23 });
  }) },
  { name: 'beard', parent: 'head', at: [0, -20], img: img(132, 64, 66, 6, (c) => {                              // a wide beard of striped barrier tape
    const strip = (x: number, len: number, bend: number, w: number, white: boolean) => {
      const path = () => { c.moveTo(x - w / 2, 4); c.bezierCurveTo(x - w / 2 + bend, len * 0.4, x - w / 2 - bend, len * 0.7, x - w / 2 + bend * 0.5, len); c.lineTo(x + w / 2 + bend * 0.5, len + 3); c.bezierCurveTo(x + w / 2 - bend, len * 0.7, x + w / 2 + bend, len * 0.4, x + w / 2, 4); c.closePath(); };
      c.beginPath(); path(); c.fillStyle = white ? '#fffaf0' : RED; c.fill();
      c.beginPath(); path(); c.save(); c.clip(); c.fillStyle = white ? RED : '#fffaf0'; for (let y = 6; y < len + 4; y += 11) { c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x + 20, y + 6); c.lineTo(x + 20, y + 11); c.lineTo(x - 20, y + 5); c.closePath(); c.fill(); } c.restore();
      c.beginPath(); path(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
    };
    const L: [number, number, number, number, boolean][] = [[16, 34, 4, 15, false], [116, 34, -4, 15, false], [34, 44, 5, 17, true], [98, 44, -5, 17, true], [52, 52, 4, 17, false], [80, 52, -4, 17, false], [66, 56, 3, 16, true]];
    for (const s of L) strip(...s);
    paper(c, () => rr(c, 8, 1, 116, 9, 4), IRONC, { lw: 2.4, y0: 1, y1: 10 });                                    // the jaw band the tapes hang from
    // moustache: two curls of tape
    for (const d of [-1, 1]) paper(c, () => { const x0 = 66 + d * 3; c.moveTo(x0, 7); c.bezierCurveTo(x0 + d * 18, 2, x0 + d * 34, 6, x0 + d * 40, 16); c.bezierCurveTo(x0 + d * 44, 22, x0 + d * 36, 26, x0 + d * 32, 20); c.bezierCurveTo(x0 + d * 26, 14, x0 + d * 14, 16, x0, 13); c.closePath(); }, '#fffaf0', { lw: 2.2, y0: 2, y1: 26 });
  }) },
  { name: 'crown', parent: 'head', at: [0, -80], img: img(110, 54, 55, 50, (c) => {                              // a crown of little traffic cones
    const cone = (x: number, h: number) => {
      paper(c, () => { c.moveTo(x - 9, 40); c.lineTo(x - 2, 40 - h); c.quadraticCurveTo(x, 42 - h - 3, x + 2, 40 - h); c.lineTo(x + 9, 40); c.closePath(); }, ORANGE, { lw: 2.2, y0: 40 - h, y1: 40 });
      c.save(); c.beginPath(); c.moveTo(x - 9, 40); c.lineTo(x - 2, 40 - h); c.lineTo(x + 2, 40 - h); c.lineTo(x + 9, 40); c.closePath(); c.clip();
      c.fillStyle = '#fffaf0'; c.fillRect(x - 10, 40 - h * 0.62, 20, h * 0.18); c.fillRect(x - 10, 40 - h * 0.3, 20, h * 0.12); c.restore();
    };
    cone(18, 22); cone(92, 22); cone(36, 30); cone(74, 30); cone(55, 38);
    paper(c, () => rr(c, 6, 38, 98, 13, 4), MUSTARD, { y0: 38, y1: 51 });
    for (const [x, col] of [[22, TEAL], [55, RED], [88, TEAL]] as const) paper(c, () => ell(c, x, 44.5, 4, 3.6), col, { lw: 1.6, y0: 41, y1: 48 });
    shine(c, 12, 41.5, 40, 41.5, 0.6, 1.6);
  }) },
  { name: 'flagL', parent: 'crown', at: [-44, -6], img: img(40, 50, 3, 48, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(3, 48); c.lineTo(3, 3); c.stroke(); c.strokeStyle = '#8d8d9e'; c.lineWidth = 1.6; c.stroke();
    paper(c, () => { c.moveTo(4, 4); c.quadraticCurveTo(20, 1, 37, 10); c.quadraticCurveTo(20, 14, 4, 20); c.closePath(); }, TEAL, { y0: 2, y1: 20, lw: 2.2 });
  }) },
  { name: 'flagR', parent: 'crown', at: [44, -6], img: img(40, 50, 3, 48, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3.6; c.beginPath(); c.moveTo(3, 48); c.lineTo(3, 3); c.stroke(); c.strokeStyle = '#8d8d9e'; c.lineWidth = 1.6; c.stroke();
    paper(c, () => { c.moveTo(4, 4); c.quadraticCurveTo(20, 1, 37, 10); c.quadraticCurveTo(20, 14, 4, 20); c.closePath(); }, RED, { y0: 2, y1: 20, lw: 2.2 });
    c.fillStyle = '#fffaf0'; c.fillRect(10, 8, 12, 3);
  }) },
  { name: 'steam1', parent: 'head', at: [-50, -76], img: puffImg(10) },
  { name: 'steam2', parent: 'head', at: [50, -78], img: puffImg(9) },
  { name: 'armF', parent: 'c', at: [86, -114], img: kingArm(0) },
  { name: 'signF', parent: 'armF', at: [0, 54], img: img(84, 92, 42, 6, (c) => {                                 // a round red "halt" sign with a white bar
    paper(c, () => rr(c, 37, 0, 10, 20, 2), '#8d8d9e', { lw: 2.2, y0: 0, y1: 20 });
    paper(c, () => ell(c, 42, 52, 36, 36), RED, { y0: 16, y1: 88, lw: 3 });
    c.strokeStyle = '#fffaf0'; c.lineWidth = 2.4; c.beginPath(); ell(c, 42, 52, 30, 30); c.stroke();
    paper(c, () => rr(c, 18, 45, 48, 14, 3), '#fffaf0', { lw: 2.2, y0: 45, y1: 59, top: 0, bot: -0.08 });
    shine(c, 18, 36, 28, 26, 0.55, 3);
  }) },
  ...POSTS.map((n, i): PartDef => ({ name: n, at: [130 + i * 40, 2], img: postImg(84 + i * 10, i) })),
  { name: 'dustW1', at: [150, -8], img: puffImg(16, '#efe2c6') },
  { name: 'dustW2', at: [215, -8], img: puffImg(14, '#efe2c6') },
  { name: 'dustF', at: [64, -8], img: puffImg(14, '#efe2c6') },
  { name: 'dustF2', at: [110, -8], img: puffImg(12, '#efe2c6') },
  { name: 'dustB', at: [-70, -8], img: puffImg(14, '#efe2c6') },
  { name: 'shock', at: [130, -40], img: img(60, 70, 4, 35, (c) => {                                             // a decree shockwave
    for (const [r, col] of [[0, CREAM], [10, MUSTARD]] as const) { const path = () => { c.beginPath(); c.moveTo(4 + r, 6 + r); c.quadraticCurveTo(54, 35, 4 + r, 64 - r); }; path(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); path(); c.lineWidth = 3.4; c.strokeStyle = col; c.stroke(); }
  }) },
  ...starParts('head', [0, -98], 7),
];
function kingPose(x: EnemyCtx): Pose {
  const T = x.time, t = x.t, v = x.variant;
  const anger = clamp01(Math.max(x.phase / 2, (1 - x.hp) * 1.2)), sp = 1 + anger * 0.6;
  const p: Pose = { brows: [0, 0, 7 * anger] };
  if (anger > 0.3) { p.rage = ON; const u = fract(T * 1.3); p.steam1 = puff(u, -14, -34, 1); p.steam2 = puff(fract(u + 0.5), 12, -36, 0.9); }
  if (x.phase >= 2 || x.hp < 0.34) p.cracks = ON;
  p[anger > 0.66 ? 'ledR' : anger > 0.3 ? 'ledY' : 'ledG'] = Math.sin(T * (3 + anger * 6)) > -0.5 ? ON : OFF;
  p.eyes = ON;
  const set = (q: Pose): void => { Object.assign(p, q); };
  const boom = (a: number, b2: number, b3: number): void => set({ boom1: [a], boom2: [b2], boom3: [b3] });
  const br = Math.sin(T * 1.8 * sp);
  const flags = (f: number, a = 1): void => set({ flagL: [-0.1 + 0.08 * Math.sin(T * f) * a, 0, 0, 1 + 0.1 * Math.sin(T * f * 1.7) * a, 1], flagR: [0.05 + 0.08 * Math.sin(T * f + 1) * a, 0, 0, 1 + 0.1 * Math.sin(T * f * 1.7 + 1) * a, 1] });
  const idle = (): void => {
    set({ c: [0, 0, -1.5 * br], body: [0, 0, 0, 1 + 0.012 * br, 1 + 0.02 * br], head: [0.02 * Math.sin(T * 1.8 * sp - 0.7)], beard: [0.03 * Math.sin(T * 1.8 * sp - 1.4), 0, 0, 1, 1 + 0.03 * Math.sin(T * 1.8 * sp - 1.2)],
      armF: [-0.12 + 0.05 * br], armB: [0.12 - 0.05 * br], signF: [0.1 - 0.06 * Math.sin(T * 1.8 * sp - 1)], signB: [-0.06 + 0.06 * Math.sin(T * 1.8 * sp - 1.2)], crown: [0.03 * Math.sin(T * 1.8 * sp - 1.1)], dome: [0, 0, 0, 1 + 0.02 * br, 1 + 0.02 * br] });
    boom(-2.05 + 0.03 * br, 0.03 + 0.02 * Math.sin(T * 1.8 * sp - 0.8), 0.04 + 0.03 * Math.sin(T * 1.8 * sp - 1.5));
    flags(4 * sp);
  };
  switch (x.state) {
    case 'move': {                  // heavy stomping steps
      const ph = T * 4.2, s = Math.sin(ph), lift = (o: number) => Math.max(0, Math.sin(ph + o));
      idle();
      set({ c: [0.035 * s, 0, -4 * Math.abs(s) + 2], legF: [-0.22 * s, 0, -9 * lift(0)], legB: [0.22 * s, 0, -9 * lift(Math.PI)], body: [0, 0, 0, 1 + 0.025 * Math.cos(2 * ph), 1 - 0.025 * Math.cos(2 * ph)],
        armF: [-0.12 + 0.25 * s], armB: [0.12 - 0.25 * s], signF: [0.1 - 0.2 * Math.sin(ph - 0.9)], signB: [-0.06 + 0.2 * Math.sin(ph - 0.9)], head: [0.04 * Math.sin(2 * ph - 0.8)], crown: [0.08 * Math.sin(2 * ph - 1.4)],
        beard: [0.08 * Math.sin(2 * ph - 1.6), 0, 0, 1, 1 + 0.04 * Math.sin(2 * ph - 1.2)] });
      boom(-2.05 + 0.06 * Math.sin(2 * ph), 0.08 * Math.sin(2 * ph - 0.8), 0.1 * Math.sin(2 * ph - 1.5));
      flags(7);
      break;
    }
    case 'windup': {
      const k = ease.io(ramp(t, 0, 0.6)), tr = Math.sin(T * 45) * 1.4 * ramp(t, 0.45, 0.75);
      idle(); p.brows = [0, 0, 7 * anger + 4 * k];
      if (v === 1) {                // decree: both signs raised high overhead
        set({ c: [-0.08 * k, tr, -6 * k], body: [0, 0, 0, 1 - 0.02 * k, 1 + 0.05 * k], armF: [-3.0 * k - 0.12 * (1 - k)], armB: [2.75 * k + 0.12 * (1 - k)], signF: [0.25 * k + 0.06 * Math.sin(T * 20) * k], signB: [-0.2 * k], head: [-0.12 * k, 0, -3 * k],
          legF: [-0.08 * k], legB: [0.08 * k], beard: [-0.1 * k, 0, 0, 1, 1.05] });
        p.mouthOpen = k > 0.5 ? [0, 0, 0, 1, 0.6 + 0.4 * k] : OFF;
      } else if (v === 2) {         // border wall: lifts the front foot for a stamp, arms spread
        set({ c: [-0.1 * k, tr - 4 * k, -10 * k], legF: [-0.45 * k, 0, -26 * k], legB: [0.12 * k], armF: [-1.1 * k], armB: [1.0 * k], signF: [0.6 * k], signB: [-0.6 * k], head: [-0.1 * k], body: [0, 0, 0, 1, 1 + 0.03 * k] });
        boom(-2.05 - 0.2 * k, 0.03, 0.04);
      } else {                      // barrier sweep: the boom is hauled back, body twists back
        set({ c: [-0.12 * k, tr - 6 * k, -2 * k], armF: [-0.6 * k], armB: [1.2 * k], signB: [-0.4 * k], legF: [-0.15 * k], legB: [0.18 * k], head: [-0.08 * k] });
        boom(-2.05 - 0.55 * k, 0.15 * k + 0.04 * Math.sin(T * 25) * k, 0.2 * k);
      }
      break;
    }
    case 'attack': {
      const k = ease.out(ramp(t, 0, 0.12)), r = ease.io(ramp(t, 0.5, 0.85)), m = k * (1 - r), d = ramp(t, 0.08, 0.6);
      idle(); p.brows = [0, 0, 7 * anger + 4];
      if (v === 1) {                // decree stamp: both signs slam down in front, shockwave
        const s = ease.in(ramp(t, 0, 0.1)), b = Math.sin(ramp(t, 0.1, 0.3) * Math.PI) * (1 - ramp(t, 0.1, 0.3)), q = s * (1 - r);
        set({ c: [0.2 * q, 10 * q, 8 * q], body: [0, 0, 0, 1 + 0.04 * q, 1 - 0.05 * q], armF: [-3.0 * (1 - s) - 1.1 * q - 0.12 * r + 0.15 * b], armB: [2.75 * (1 - s) - 1.0 * q + 0.12 * r + 0.15 * b], signF: [-0.2 * q], signB: [-0.25 * q],
          head: [0.15 * q, 0, 3 * q], mouthOpen: [0, 0, 0, 1, 1 - r], legF: [-0.1 * q], legB: [0.15 * q], crown: [0.15 * b, 0, -6 * b] });
        if (t > 0.08) { p.shock = [0, 50 * d, 0, (0.6 + 0.9 * d) * (1 - r), (0.6 + 0.9 * d) * (1 - r)]; p.dustF = [0, 30 * d, 0, (0.6 + 1.2 * d) * (1 - r), (0.6 + 0.9 * d) * (1 - r)]; p.dustF2 = [0, 40 * d, 0, (0.5 + 1.0 * d) * (1 - r), (0.5 + 0.8 * d) * (1 - r)]; }
      } else if (v === 2) {         // border wall: the stamp, then posts rise out of the ground one after another
        const s = ease.in(ramp(t, 0, 0.08)), sq = Math.sin(ramp(t, 0.08, 0.3) * Math.PI) * (1 - ramp(t, 0.08, 0.3));
        set({ c: [(-0.1 + 0.1 * s) * (1 - r), 6 * sq, (-10 + 18 * s) * (1 - r) * (1 - 0.6 * sq)], legF: [-0.45 * (1 - s), 0, -26 * (1 - s)], body: [0, 0, 0, 1 + 0.06 * sq, 1 - 0.07 * sq], armF: [-1.1 * (1 - s) - 0.3 * sq], armB: [1.0 * (1 - s) + 0.3 * sq],
          signF: [0.6 * (1 - s) - 0.4 * sq], signB: [-0.6 * (1 - s) + 0.4 * sq], head: [0.1 * sq, 0, 4 * sq], crown: [-0.2 * sq, 0, -8 * sq] });
        POSTS.forEach((n, i) => { const g = ease.back(ramp(t, 0.1 + i * 0.07, 0.3 + i * 0.07)); const sh = 1 - r; p[n] = g > 0 ? [0.04 * Math.sin(T * 30 + i) * (1 - g), 0, 0, Math.max(0.001, sh), Math.max(0.001, g * sh)] : OFF; });
        if (t > 0.08) { const e = ramp(t, 0.08, 0.5); p.dustW1 = [0, 10 * e, 0, (0.6 + 1.0 * e) * (1 - r), (0.6 + 0.8 * e) * (1 - r)]; p.dustW2 = [0, 20 * e, 0, (0.5 + 0.9 * e) * (1 - r), (0.5 + 0.7 * e) * (1 - r)]; p.dustF = [0, -10 * e, 0, (0.5 + 0.8 * e) * (1 - r), (0.5 + 0.6 * e) * (1 - r)]; }
      } else {                      // barrier sweep: the boom swings over and slams flat along the ground in front
        const s = ease.in(ramp(t, 0, 0.14)), b = Math.sin(ramp(t, 0.14, 0.4) * Math.PI * 2) * (1 - ramp(t, 0.14, 0.4));
        const a = -2.6 + 2.8 * s;
        boom(a * (1 - r) - 2.05 * r - 0.06 * b, (0.15 - 0.09 * s + 0.1 * b) * (1 - r), (0.2 - 0.12 * s + 0.16 * b) * (1 - r));
        set({ c: [0.1 * m, 10 * m, 2 * m], armF: [-0.6 * (1 - k) + 0.55 * m], armB: [1.2 * (1 - k) - 0.6 * m], signF: [0.5 * m], head: [0.1 * m], legF: [-0.2 * m], legB: [0.25 * m] });
        if (t > 0.12) { p.dustF = [0, 40 * d, 0, (0.6 + 1.2 * d) * (1 - r), (0.6 + 0.9 * d) * (1 - r)]; p.dustF2 = [0, 60 * d, 0, (0.5 + 1.0 * d) * (1 - r), (0.5 + 0.8 * d) * (1 - r)]; p.dustW1 = [0, 30 * d, 0, (0.5 + 0.8 * d) * (1 - r), (0.5 + 0.6 * d) * (1 - r)]; }
      }
      break;
    }
    case 'hurt': {
      const k = 1 - ease.out(ramp(t, 0.05, 0.4));
      idle();
      set({ c: [-0.06 * k, -10 * k, 0], body: [0, 0, 0, 1 - 0.04 * k, 1 + 0.04 * k], head: [-0.18 * k, 0, -4 * k], crown: [-0.3 * k, -4 * k, -6 * k], eyes: OFF, eyesShut: ON, mouthOpen: [0, 0, 0, 1, 0.8 * k + 0.001], armF: [0.5 * k], armB: [-0.5 * k], signF: [0.4 * k], signB: [-0.4 * k] });
      boom(-2.05 - 0.25 * k, 0.2 * k, 0.3 * k);
      break;
    }
    case 'jam': {                   // dazed: crown askew, spiral eyes, the dome sparks
      const w = Math.sin(T * 2.2), fl = (o: number): T5 => (Math.sin(T * 37 + o) > 0.3 ? [T * 9, 0, 0, 0.7 + 0.3 * Math.sin(T * 50 + o), 0.7 + 0.3 * Math.sin(T * 50 + o)] : OFF);
      idle();
      set({ c: [0.04 * w, 0, 6], body: [0.015 * w, 0, 0, 1.03, 0.97], head: [0.12 + 0.06 * w], crown: [0.45 + 0.1 * w, 12, 4], beard: [0.1 * w], armF: [0.25 + 0.1 * w], armB: [-0.2 + 0.1 * w], signF: [0.3], signB: [-0.3],
        eyes: OFF, eyesSpin: ON, mouthOpen: [0, 0, 0, 1, 0.5], spark0: fl(0), spark1: fl(2), legF: [-0.08, 0, 0, 1, 0.95], legB: [0.08, 0, 0, 1, 0.95] });
      boom(-1.75 + 0.05 * w, 0.25, 0.35);
      flags(1.5, 0.4); set(orbit(STARS, T, 46, 10, 4)); delete p.steam1; delete p.steam2; delete p.rage;
      p.ledG = OFF; p.ledY = OFF; p.ledR = Math.sin(T * 12) > 0 ? ON : OFF;
      break;
    }
    case 'dead': {                  // 2.2 s: recoils, the crown topples, the signs drop, the boom falls and the arch sinks into rubble
      const a = ease.out(ramp(t, 0, 0.3)), b = ease.in(ramp(t, 0.35, 1.0)), cDrop = ease.in(ramp(t, 0.8, 1.8)), e = ease.out(ramp(t, 1.0, 2.2));
      const wob = Math.sin(t * 9) * (1 - ramp(t, 0, 0.9)) * 0.06;
      set({ c: [wob - 0.09 * a * (1 - b) + 0.08 * cDrop, -6 * a * (1 - b), -8 * a * (1 - b) + 46 * cDrop, 1 + 0.1 * cDrop, 1 - 0.45 * cDrop], body: [0, 0, 0, 1, 1], head: [0.35 * b - 0.25 * a * (1 - b), 0, 4 * b], beard: [0.2 * b - 0.2 * a * (1 - b)], crown: [-2.4 * b - 0.4 * a * (1 - b), -90 * b, 150 * b * b - 40 * b - 10 * a * (1 - b)],
        armF: [0.25 * b + 0.3 * a * (1 - b)], armB: [-0.25 * b], signF: [0.6 * b, 0, 24 * cDrop], signB: [-0.6 * b, 0, 24 * cDrop], eyes: OFF, eyesX: ON, mouthOpen: [0, 0, 0, 1, 0.7], cracks: ON,
        legF: [0, 0, 0, 1, 1 - 0.4 * cDrop], legB: [0, 0, 0, 1, 1 - 0.4 * cDrop],
        dustF: e > 0 ? [0, 20 * e, 0, 0.5 + 1.4 * e, 0.5 + 1.1 * e] : OFF, dustB: e > 0 ? [0, -20 * e, 0, 0.5 + 1.4 * e, 0.5 + 1.1 * e] : OFF, dustF2: e > 0 ? [0, 10 * e, 0, 0.4 + e, 0.4 + 0.9 * e] : OFF });
      boom(-2.05 - 1.1 * ease.in(ramp(t, 0.5, 1.2)), 0.1 * b, 0.15 * b);
      flags(1, 0.2);
      delete p.steam1; delete p.steam2; delete p.rage; p.ledG = OFF; p.ledY = OFF; p.ledR = OFF;
      break;
    }
    default: idle();
  }
  return fx(p, KING_FX);
}

// ------------------------------------------------------------------ registry
const SMALL_DEMO: [string, Partial<EnemyCtx>][] = [
  ['idle', {}], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.3 }], ['windup .12', { state: 'windup', t: 0.12 }], ['windup .45', { state: 'windup', t: 0.45, time: 0.47 }],
  ['attack .05', { state: 'attack', t: 0.05 }], ['attack .18', { state: 'attack', t: 0.18 }], ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam' }], ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }],
];
const KING_DEMO: [string, Partial<EnemyCtx>][] = [
  ['idle', {}], ['idle phase2', { phase: 2, hp: 0.2 }], ['move a', { state: 'move', time: 0.1 }], ['move b', { state: 'move', time: 0.5 }],
  ['sweep wind .3', { state: 'windup', variant: 0, t: 0.3 }], ['sweep wind .6', { state: 'windup', variant: 0, t: 0.6 }], ['sweep .1', { state: 'attack', variant: 0, t: 0.1 }], ['sweep .25', { state: 'attack', variant: 0, t: 0.25 }],
  ['decree wind .6', { state: 'windup', variant: 1, t: 0.6 }], ['decree .06', { state: 'attack', variant: 1, t: 0.06 }], ['decree .2', { state: 'attack', variant: 1, t: 0.2 }],
  ['wall wind .6', { state: 'windup', variant: 2, t: 0.6 }], ['wall .15', { state: 'attack', variant: 2, t: 0.15 }], ['wall .4', { state: 'attack', variant: 2, t: 0.4 }],
  ['hurt', { state: 'hurt', t: 0.05 }], ['jam', { state: 'jam', phase: 1, hp: 0.5 }], ['dead .1', { state: 'dead', t: 0.1 }], ['dead .3', { state: 'dead', t: 0.3 }], ['dead 1', { state: 'dead', t: 1 }], ['dead 2.2', { state: 'dead', t: 2.2 }],
];
export const RIGS: EnemyRig[] = [
  { kind: 'enemy', id: 'hornhawk', name: 'נץ הצופר', parts: HAWKP, scale: 1, pose: hawkPose, body: { w: 34, h: 30, origin: 'center' },
    demo: [['sleep', { state: 'sleep' }], ['wake .05', { state: 'wake', t: 0.05 }], ['wake .25', { state: 'wake', t: 0.25 }], ...SMALL_DEMO] },
  { kind: 'enemy', id: 'gatewarden', name: 'שומר הגשר', parts: GATE, scale: 1, pose: gatePose, body: { w: 56, h: 88, origin: 'feet' }, demo: SMALL_DEMO },
  { kind: 'enemy', id: 'drifter', name: 'נודד הגבול', parts: DRIFT, scale: 1, pose: driftPose, body: { w: 34, h: 30, origin: 'center' },
    demo: [['idle', {}], ['idle phase', { time: 2.6 * 2.9 }], ...SMALL_DEMO.slice(1, 3), ['windup .1', { state: 'windup', t: 0.1 }], ['windup .25', { state: 'windup', t: 0.25 }], ...SMALL_DEMO.slice(4)] },
  { kind: 'enemy', id: 'borderking', name: 'מלך הגבולות', parts: KING, scale: 1, pose: kingPose, body: { w: 180, h: 200, origin: 'feet' }, demo: KING_DEMO },
];
