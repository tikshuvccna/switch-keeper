/**
 * Ora (אורה): the old postmistress-tortoise who teaches the lessons. A friendly NPC: she stands by the start of an area, waves a
 * letter, and opens the lesson when the hero talks to her. (Typed as an enemy rig only so that the gallery and the registry can show her.)
 */
import { add, ell, eye, INK, paper, rr, shade, shine, type PartDef, type Pose } from '../puppet';
import type { EnemyCtx, EnemyRig } from '../types';

const SHELL = '#2f8f7a', SKIN = '#9fc77a', RED = '#e4572e', CREAM = '#fff1d6', MUST = '#f2b134';

const PARTS: PartDef[] = [
  { name: 'legB', at: [-10, -16], behind: true, img: { w: 22, h: 22, ax: 11, ay: 4, draw: (c) => paper(c, () => rr(c, 3, 2, 16, 18, 7), shade(SKIN, -0.2), { y0: 2, y1: 20 }) } },
  { name: 'tail', at: [-30, -22], behind: true, img: { w: 20, h: 14, ax: 14, ay: 7, draw: (c) => paper(c, () => { c.moveTo(16, 3); c.lineTo(2, 8); c.lineTo(16, 12); c.closePath(); }, SKIN, { lw: 2.6 }) } },
  { name: 'shell', at: [-2, -22], img: { w: 78, h: 60, ax: 39, ay: 50, draw: (c) => {
    paper(c, () => { c.moveTo(4, 50); c.bezierCurveTo(2, 10, 24, 2, 40, 2); c.bezierCurveTo(58, 2, 76, 12, 74, 50); c.closePath(); }, SHELL, { y0: 2, y1: 50, lw: 3.2 });
    c.save(); c.beginPath(); c.moveTo(4, 50); c.bezierCurveTo(2, 10, 24, 2, 40, 2); c.bezierCurveTo(58, 2, 76, 12, 74, 50); c.closePath(); c.clip();
    c.strokeStyle = 'rgba(29,26,51,0.55)'; c.lineWidth = 2.2;
    for (const [x0, y0, x1, y1] of [[40, 2, 40, 50], [18, 8, 26, 50], [62, 8, 54, 50], [4, 28, 74, 28]]) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    c.fillStyle = RED; c.fillRect(0, 42, 78, 6);                                                        // a postal stripe
    c.fillStyle = CREAM; c.beginPath(); ell(c, 40, 20, 9, 7); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();   // the envelope badge
    c.beginPath(); c.moveTo(33, 17); c.lineTo(40, 22); c.lineTo(47, 17); c.stroke();
    c.restore(); shine(c, 14, 18, 24, 10, 0.4);
  } } },
  { name: 'legF', at: [12, -16], img: { w: 22, h: 22, ax: 11, ay: 4, draw: (c) => paper(c, () => rr(c, 3, 2, 16, 18, 7), SKIN, { y0: 2, y1: 20 }) } },
  { name: 'neck', at: [26, -40], img: { w: 26, h: 26, ax: 4, ay: 20, draw: (c) => paper(c, () => rr(c, 2, 6, 20, 16, 8), SKIN, { y0: 6, y1: 22 }) } },
  { name: 'head', parent: 'neck', at: [14, -8], img: { w: 56, h: 44, ax: 18, ay: 32, draw: (c) => {
    paper(c, () => ell(c, 24, 22, 20, 17), SKIN, { y0: 5, y1: 40 });
    paper(c, () => ell(c, 40, 28, 10, 7), shade(SKIN, 0.15), { y0: 21, y1: 35, lw: 2.4 });
    c.fillStyle = INK; c.beginPath(); ell(c, 46, 26, 1.6, 1.2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(34, 32); c.quadraticCurveTo(41, 37, 48, 31); c.stroke();
    eye(c, 33, 17, 4.4, 0.3);
    c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); ell(c, 33, 17, 7.6, 7.6); c.stroke(); c.beginPath(); c.moveTo(25.5, 16); c.lineTo(10, 14); c.stroke();   // round glasses
    c.fillStyle = 'rgba(255,111,111,0.35)'; c.beginPath(); ell(c, 26, 29, 4, 2.6); c.fill();
    paper(c, () => { c.moveTo(6, 18); c.bezierCurveTo(8, 2, 28, -1, 36, 6); c.lineTo(30, 10); c.bezierCurveTo(22, 6, 12, 8, 10, 20); c.closePath(); }, MUST, { lw: 2.6 });   // a tidy hairnet of a cap
  } } },
  { name: 'arm', at: [10, -32], img: { w: 18, h: 40, ax: 9, ay: 6, draw: (c) => {
    paper(c, () => rr(c, 4, 2, 11, 24, 5), SKIN, { y0: 2, y1: 26 });
    paper(c, () => ell(c, 9.5, 30, 5.5, 5.5), SKIN, { y0: 24, y1: 36 });
    paper(c, () => rr(c, 1, 26, 17, 12, 2), CREAM, { lw: 2.2, y0: 26, y1: 38 });                        // the letter in her hand
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(2, 27); c.lineTo(9.5, 33); c.lineTo(17, 27); c.stroke();
  } } },
];

function pose(c: EnemyCtx): Pose {
  const t = c.time, b = Math.sin(t * 2);
  const base: Pose = { shell: [0, 0, 0, 1, 1 + 0.018 * b], neck: [0.06 * Math.sin(t * 1.4)], head: [0.05 * Math.sin(t * 1.9 + 1)], tail: [0.25 * Math.sin(t * 3)], arm: [-1.9 + 0.35 * Math.sin(t * 4)] };
  if (c.state === 'windup' || c.state === 'attack') return add(base, { neck: [-0.1], head: [-0.15], arm: [-2.3 + 0.5 * Math.sin(t * 9)] });
  return base;
}

export const RIGS: EnemyRig[] = [{
  kind: 'enemy', id: 'ora', name: 'אורה', parts: PARTS, scale: 1.1, pose, body: { w: 60, h: 50, origin: 'feet' },
  demo: [['idle', {}], ['idle b', { time: 1.2 }], ['talk', { state: 'windup' }]],
}];
