/** מתחת למים: a sunny reef under the sea: light rays, coral, kelp, a sunken ship and old pillars, jellyfish, fish schools and bubbles. */
import * as Phaser from 'phaser';
import { registerWorld, mk, tex, lin, soft, nosoft, wrap, rng, VIEW_W, VIEW_H, LAYER_W } from '../world';
import { INK, ell, rr, shade } from '../puppet';

const once = (sc: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (c: CanvasRenderingContext2D) => void): string =>
  sc.textures.exists(key) ? key : tex(sc, key, mk(w, h, draw, res), res);
const TAU = Math.PI * 2;
const CORAL = ['#ff7a6b', '#ff9fc6', '#ffb347', '#b67bff', '#ff6f9e'];
const wave = (x: number, parts: [number, number, number][]) => parts.reduce((s, [k, a, p]) => s + a * Math.sin((x / LAYER_W) * TAU * k + p), 0);

function fish(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, dir = 1): void {
  c.save(); c.translate(x, y); c.scale(dir * s, s);
  c.fillStyle = col; c.beginPath(); ell(c, 0, 0, 10, 5); c.moveTo(-8, 0); c.lineTo(-16, -5); c.lineTo(-15, 0); c.lineTo(-16, 5); c.closePath(); c.fill();
  c.restore();
}
/** A branching coral: recursive round-capped strokes. */
function branch(c: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number, w: number, depth: number, r: () => number): void {
  const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
  c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
  if (depth > 0) { branch(c, ex, ey, len * 0.78, ang - 0.45 - r() * 0.2, w * 0.78, depth - 1, r); branch(c, ex, ey, len * 0.74, ang + 0.4 + r() * 0.2, w * 0.78, depth - 1, r); }
}
function coralTree(c: CanvasRenderingContext2D, x: number, y: number, h: number, col: string, seed: number, lw: number): void {
  c.lineCap = 'round';
  if (lw) { c.strokeStyle = INK; const r1 = rng(seed); c.save(); c.lineWidth = 1; branchOutline(c, x, y, h, r1, lw); c.restore(); }
  c.strokeStyle = col; branch(c, x, y, h * 0.34, -Math.PI / 2, h * 0.12, 3, rng(seed));
  c.strokeStyle = shade(col, 0.35); c.globalAlpha = 0.6; branch(c, x - 1, y - 1, h * 0.34, -Math.PI / 2, h * 0.04, 3, rng(seed)); c.globalAlpha = 1;
}
function branchOutline(c: CanvasRenderingContext2D, x: number, y: number, h: number, r: () => number, lw: number): void {
  const go = (x0: number, y0: number, len: number, ang: number, w: number, depth: number) => {
    const ex = x0 + Math.cos(ang) * len, ey = y0 + Math.sin(ang) * len;
    c.lineWidth = w + lw * 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(ex, ey); c.stroke();
    if (depth > 0) { go(ex, ey, len * 0.78, ang - 0.45 - r() * 0.2, w * 0.78, depth - 1); go(ex, ey, len * 0.74, ang + 0.4 + r() * 0.2, w * 0.78, depth - 1); }
  };
  go(x, y, h * 0.34, -Math.PI / 2, h * 0.12, 3);
}
function kelp(c: CanvasRenderingContext2D, x: number, y: number, h: number, col: string, ph: number, lw: number): void {
  const pts: [number, number][] = [];
  for (let t = 0; t <= 1.001; t += 0.1) pts.push([x + Math.sin(t * 5 + ph) * 10 * t, y - t * h]);
  c.lineCap = 'round';
  if (lw) { c.strokeStyle = INK; c.lineWidth = 6 + lw * 2; c.beginPath(); pts.forEach(([px, py]) => c.lineTo(px, py)); c.stroke(); }
  c.strokeStyle = col; c.lineWidth = 6; c.beginPath(); pts.forEach(([px, py]) => c.lineTo(px, py)); c.stroke();
  for (let i = 2; i < pts.length; i += 1) {
    const [px, py] = pts[i], s = i % 2 ? 1 : -1;
    c.fillStyle = shade(col, 0.1); c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + s * 16, py - 12, px + s * 22, py - 4); c.quadraticCurveTo(px + s * 12, py + 4, px, py); c.fill();
    if (lw) { c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.stroke(); }
  }
}
function brain(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, col: string, lw: number): void {
  c.fillStyle = lin(c, y - ry * 2, y, [[0, shade(col, 0.2)], [1, shade(col, -0.2)]]); c.beginPath(); c.moveTo(x - rx, y); c.bezierCurveTo(x - rx, y - ry * 1.4, x + rx, y - ry * 1.4, x + rx, y); c.closePath(); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.strokeStyle = shade(col, -0.3); c.lineWidth = 1.6;
  for (let k = 1; k < 4; k++) { c.beginPath(); for (let t = -0.85; t <= 0.85; t += 0.1) c.lineTo(x + t * rx * (1 - k * 0.18), y - ry * 0.22 * k + Math.sin(t * 14 + k) * 2.4); c.stroke(); }
}
function anemone(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, lw: number): void {
  c.lineCap = 'round';
  for (let k = -4; k <= 4; k++) {
    const a = -Math.PI / 2 + k * 0.25, ex = x + Math.cos(a) * 26 * s, ey = y - 12 * s + Math.sin(a) * 22 * s;
    if (lw) { c.strokeStyle = INK; c.lineWidth = 5 * s + lw * 2; c.beginPath(); c.moveTo(x, y - 10 * s); c.quadraticCurveTo(x + (ex - x) * 0.4, ey + 6 * s, ex, ey); c.stroke(); }
    c.strokeStyle = col; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(x, y - 10 * s); c.quadraticCurveTo(x + (ex - x) * 0.4, ey + 6 * s, ex, ey); c.stroke();
    c.fillStyle = shade(col, 0.45); c.beginPath(); ell(c, ex, ey, 2.4 * s, 2.4 * s); c.fill();
  }
  c.fillStyle = shade(col, -0.25); c.beginPath(); rr(c, x - 9 * s, y - 14 * s, 18 * s, 14 * s, 5 * s); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
}
function jelly(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string): void {
  c.strokeStyle = col; c.lineWidth = 2 * s; c.globalAlpha = 0.6;
  for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 6 * s, y); for (let t = 0; t <= 1; t += 0.1) c.lineTo(x + k * 6 * s + Math.sin(t * 8 + k) * 3 * s, y + t * 40 * s); c.stroke(); }
  c.globalAlpha = 0.8; c.fillStyle = col; c.beginPath(); c.moveTo(x - 18 * s, y); c.bezierCurveTo(x - 18 * s, y - 26 * s, x + 18 * s, y - 26 * s, x + 18 * s, y); c.quadraticCurveTo(x, y + 6 * s, x - 18 * s, y); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); ell(c, x - 7 * s, y - 12 * s, 4 * s, 2.5 * s, -0.5); c.fill(); c.globalAlpha = 1;
}

registerWorld({
  id: 'underwater', name: 'מתחת למים',

  sky: (sc) => once(sc, 'underwater_sky', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#7fe6ec'], [0.3, '#2fb2cf'], [0.7, '#167fae'], [1, '#0e5a88']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    // the bright surface far above
    const g = c.createRadialGradient(560, -40, 10, 560, -40, 420); g.addColorStop(0, 'rgba(255,255,230,0.85)'); g.addColorStop(1, 'rgba(255,255,230,0)'); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
    for (let y = 8; y < 60; y += 12) { c.beginPath(); for (let x = 0; x <= VIEW_W; x += 10) c.lineTo(x, y + Math.sin(x * 0.04 + y) * 3); c.stroke(); }
    // light rays fanning down
    c.globalCompositeOperation = 'lighter';
    for (const [x, w, a] of [[380, 60, 0.12], [480, 40, 0.1], [600, 80, 0.13], [720, 50, 0.09], [840, 36, 0.08], [250, 44, 0.07]] as [number, number, number][]) {
      c.fillStyle = lin(c, 0, 480, [[0, `rgba(220,255,250,${a})`], [1, 'rgba(220,255,250,0)']]); c.beginPath(); c.moveTo(x, 0); c.lineTo(x + w, 0); c.lineTo(x + w * 2.4 - 160, 480); c.lineTo(x - 160 + w * 0.3, 480); c.closePath(); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    // a far school of fish and a turtle-like manta shape is avoided: keep fish only
    const r = rng(9);
    for (let i = 0; i < 26; i++) fish(c, 120 + r() * 220 + Math.sin(i) * 20, 170 + r() * 60, 0.5 + r() * 0.2, 'rgba(20,70,110,0.35)');
  }),

  far: (sc) => once(sc, 'underwater_far', LAYER_W, VIEW_H, 1, (c) => {
    const r = rng(101);
    // distant rock mounds
    const R1: [number, number, number][] = [[3, 30, 0.4], [7, 16, 2], [13, 6, 1]];
    c.fillStyle = '#2a7fa6'; c.beginPath(); c.moveTo(0, VIEW_H); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 360 + wave(x, R1)); c.lineTo(LAYER_W, VIEW_H); c.fill();
    // old pillars, a broken arch and the sunken ship
    for (const px of [300, 360, 470, 1260]) wrap(LAYER_W, px - 20, 40, (xx) => {
      const h = 120 + ((px * 7) % 60);
      c.fillStyle = '#4a9cbc'; c.fillRect(xx - 14, 380 - h, 28, h + 40); c.fillRect(xx - 20, 380 - h - 10, 40, 12);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(xx - 10, 380 - h, 5, h + 30);
      c.fillStyle = 'rgba(20,60,90,0.25)'; for (let k = -8; k <= 8; k += 8) c.fillRect(xx + k, 380 - h + 4, 2, h + 30);
    });
    wrap(LAYER_W, 300, 180, (xx) => { c.fillStyle = '#4a9cbc'; c.fillRect(xx, 380 - 155, 70, 14); });
    wrap(LAYER_W, 860, 360, (xx) => {
      c.save(); c.translate(xx + 180, 372); c.rotate(-0.12);
      c.fillStyle = '#2f6f8f'; c.beginPath(); c.moveTo(-170, -40); c.lineTo(160, -54); c.lineTo(130, 10); c.lineTo(-140, 20); c.closePath(); c.fill();
      c.fillRect(-40, -170, 9, 130); c.fillRect(60, -140, 8, 92);
      c.beginPath(); c.moveTo(-31, -160); c.lineTo(28, -120); c.lineTo(-31, -110); c.closePath(); c.fill();
      c.fillRect(-120, -80, 70, 40);
      c.fillStyle = 'rgba(20,60,90,0.35)'; for (let k = -130; k < 120; k += 26) { c.beginPath(); ell(c, k, -18, 5, 5); c.fill(); }
      c.restore();
    });
    // jellyfish and fish schools
    for (const [jx, jy, s] of [[640, 200, 1], [700, 150, 0.7], [1500, 230, 0.9], [1700, 170, 0.6]] as [number, number, number][]) wrap(LAYER_W, jx - 20, 40, (xx) => jelly(c, xx, jy, s, '#ffb3e0'));
    for (const [sx, sy] of [[150, 240], [1100, 190], [1800, 280]]) {
      const pts: [number, number][] = []; for (let i = 0; i < 22; i++) pts.push([sx + (r() - 0.5) * 140, sy + (r() - 0.5) * 50]);
      wrap(LAYER_W, sx - 80, 160, (xx) => { for (const [fx, fy] of pts) fish(c, fx - sx + xx, fy, 0.7, 'rgba(255,214,120,0.7)', -1); });
    }
    // closer reef silhouettes
    const R2: [number, number, number][] = [[4, 18, 1.2], [9, 9, 0.2]];
    c.fillStyle = '#1f6d93'; c.beginPath(); c.moveTo(0, VIEW_H); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 420 + wave(x, R2)); c.lineTo(LAYER_W, VIEW_H); c.fill();
    for (let x = 20; x < LAYER_W; x += 60 + r() * 80) {
      const h = 30 + r() * 50, y = 424 + wave(x, R2);
      wrap(LAYER_W, x - 20, 40, (xx) => { c.strokeStyle = '#1f6d93'; c.lineCap = 'round'; branch(c, xx, y, h * 0.4, -Math.PI / 2, 5, 2, rng(Math.floor(x))); });
    }
    c.fillStyle = lin(c, 300, VIEW_H, [[0, 'rgba(14,90,136,0)'], [1, 'rgba(14,90,136,0.7)']]); c.fillRect(0, 300, LAYER_W, VIEW_H - 300);
  }),

  mid: (sc) => once(sc, 'underwater_mid', LAYER_W, VIEW_H, 1.5, (c) => {
    const r = rng(111), base = 482;
    // a sandy rise with rocks
    const S: [number, number, number][] = [[3, 10, 0.6], [8, 5, 2]];
    c.fillStyle = lin(c, 440, base, [[0, '#e9d6a6'], [1, '#c9b27e']]); c.beginPath(); c.moveTo(0, VIEW_H); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 456 + wave(x, S)); c.lineTo(LAYER_W, VIEW_H); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 456 + wave(x, S)); c.stroke();
    // tall kelp forests
    for (let x = 0; x < LAYER_W; x += 14 + r() * 60) {
      const h = 160 + r() * 200, ph = r() * 6, col = ['#3fa36a', '#4cb874', '#2f8f5a'][Math.floor(r() * 3)];
      wrap(LAYER_W, x - 30, 60, (xx) => kelp(c, xx, base, h, col, ph, 2));
      x += r() < 0.3 ? 120 : 0;
    }
    // coral groups
    let x = 30;
    while (x < LAYER_W - 40) {
      const k = r(), at = x, col = CORAL[Math.floor(r() * CORAL.length)], seed = Math.floor(r() * 1000);
      if (k < 0.35) { const h = 90 + r() * 60; wrap(LAYER_W, at - 50, 100, (xx) => coralTree(c, xx, base - 4, h, col, seed, 2)); x += 80 + r() * 50; }
      else if (k < 0.6) { const rx = 30 + r() * 20; wrap(LAYER_W, at - rx, rx * 2, (xx) => brain(c, xx, base - 2, rx, rx * 0.8, col, 2)); x += rx * 2 + 30 + r() * 40; }
      else if (k < 0.8) { wrap(LAYER_W, at - 30, 60, (xx) => anemone(c, xx, base - 2, 1.2, col, 2)); x += 70 + r() * 40; }
      else {
        // a sea fan
        const h = 80 + r() * 40;
        wrap(LAYER_W, at - 50, 100, (xx) => {
          c.fillStyle = shade(col, -0.1); c.beginPath(); c.moveTo(xx, base); c.quadraticCurveTo(xx - h * 0.7, base - h * 0.6, xx - h * 0.4, base - h); c.quadraticCurveTo(xx, base - h * 1.2, xx + h * 0.4, base - h); c.quadraticCurveTo(xx + h * 0.7, base - h * 0.6, xx, base); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
          c.strokeStyle = shade(col, 0.35); c.lineWidth = 1.5; for (let a = -0.9; a <= 0.9; a += 0.3) { c.beginPath(); c.moveTo(xx, base); c.quadraticCurveTo(xx + a * h * 0.3, base - h * 0.5, xx + a * h * 0.45, base - h * 0.95); c.stroke(); }
        });
        x += 90 + r() * 40;
      }
    }
    // a few bright fish passing
    for (let i = 0; i < 10; i++) { const fx = r() * LAYER_W, fy = 250 + r() * 150, col = ['#ffd23f', '#ff7a6b', '#62b6ff'][i % 3], d = r() < 0.5 ? 1 : -1; wrap(LAYER_W, fx - 20, 40, (xx) => { c.save(); c.strokeStyle = INK; c.lineWidth = 2; fish(c, xx, fy, 1.6, col, d); c.restore(); c.fillStyle = INK; c.beginPath(); ell(c, xx + d * 9, fy - 1.5, 1.6, 1.6); c.fill(); }); }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(30,120,170,0.36)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }),

  ground: (sc, w) => once(sc, `underwater_ground_${w}`, w, 120, 1, (c) => {
    const r = rng(w * 23 + 7);
    // coral rock body: porous with holes
    c.fillStyle = lin(c, 0, 120, [[0, '#b77a9a'], [1, '#4a2d5a']]); c.fillRect(0, 0, w, 120);
    for (let i = 0; i < w / 14; i++) { const x = r() * w, y = 30 + r() * 86, s = 2 + r() * 6; c.fillStyle = 'rgba(40,20,60,0.4)'; c.beginPath(); ell(c, x, y, s, s * 0.8); c.fill(); c.fillStyle = 'rgba(255,200,230,0.25)'; c.beginPath(); ell(c, x - s * 0.3, y - s * 0.6, s * 0.6, s * 0.25); c.fill(); }
    for (let x = 40; x < w; x += 120 + r() * 100) { c.fillStyle = '#ff9f7a'; c.beginPath(); ell(c, x, 60 + r() * 40, 10, 6); c.fill(); }
    // the sandy seabed lip
    c.fillStyle = lin(c, 0, 26, [[0, '#fbecc0'], [1, '#e2c78c']]); c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0);
    for (let x = w; x >= 0; x -= 12) c.lineTo(x, 21 + Math.sin(x * 0.08) * 3 + r() * 2);
    c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(170,130,70,0.35)'; c.lineWidth = 1.4; for (let x = 6; x < w; x += 22 + r() * 10) { c.beginPath(); c.moveTo(x, 12); c.quadraticCurveTo(x + 7, 9, x + 14, 12); c.stroke(); }
    // shells and pebbles on the sand
    for (let x = 30; x < w; x += 60 + r() * 90) {
      const kind = r();
      if (kind < 0.4) { c.fillStyle = '#ffd1c4'; c.beginPath(); c.moveTo(x - 6, 14); c.quadraticCurveTo(x, 2, x + 6, 14); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.4; c.stroke(); c.beginPath(); c.moveTo(x, 13); c.lineTo(x, 6); c.moveTo(x - 3, 13); c.lineTo(x - 2, 7); c.moveTo(x + 3, 13); c.lineTo(x + 2, 7); c.stroke(); }
      else if (kind < 0.7) { c.fillStyle = '#ff9f43'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? 2.4 : 6; c.lineTo(x + Math.cos(a) * rad, 11 + Math.sin(a) * rad); } c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke(); }
      else { c.fillStyle = '#9fb3c4'; c.beginPath(); ell(c, x, 13, 5, 3); ell(c, x + 7, 14, 3, 2); c.fill(); }
    }
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(0, 2, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }),

  platform: (sc, w, style, seed) => once(sc, `underwater_plat_${style}_${w}_${seed}`, w, 40, 1, (c) => {
    const r = rng(seed * 13 + w);
    if (style === 'plank') {
      // a sunken ship plank with barnacles and a hanging weed
      for (let x = 16; x < w - 10; x += 34 + r() * 30) { c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(x, 18); c.quadraticCurveTo(x + 4, 28, x - 1, 38); c.stroke(); c.strokeStyle = '#4cb874'; c.lineWidth = 3; c.stroke(); }
      soft(c, 6, 4, 0.3); c.fillStyle = lin(c, 4, 22, [[0, '#a98a6a'], [1, '#6f5640']]); c.beginPath(); c.moveTo(2, 6); c.lineTo(w - 6, 4); c.lineTo(w - 2, 12); c.lineTo(w - 5, 21); c.lineTo(4, 22); c.closePath(); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(40,30,20,0.4)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(6, 13); c.lineTo(w - 8, 12); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(6, 6.5, w - 14, 2.5);
      for (let i = 0; i < w / 30; i++) { const bx = 8 + r() * (w - 16); c.fillStyle = '#e6e0d0'; c.beginPath(); ell(c, bx, 18, 3, 2.4); c.fill(); c.strokeStyle = INK; c.lineWidth = 1; c.stroke(); }
      for (const x of [10, w - 12]) { c.fillStyle = '#5a6a7a'; c.beginPath(); ell(c, x, 9, 2, 2); c.fill(); }
    } else {
      // a coral ledge: a bumpy pink shelf
      const col = CORAL[seed % CORAL.length];
      soft(c, 6, 4, 0.3);
      c.fillStyle = lin(c, 4, 32, [[0, shade(col, 0.3)], [1, shade(col, -0.3)]]); c.beginPath(); c.moveTo(2, 10);
      for (let x = 2; x <= w - 2; x += 12) c.quadraticCurveTo(x + 6, 1, Math.min(w - 2, x + 12), 8);
      for (let x = w - 4; x > 4; x -= 14) c.quadraticCurveTo(x - 7, 34 + r() * 4, x - 14, 22);
      c.closePath(); c.fill(); nosoft(c); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = 'rgba(80,20,60,0.35)'; for (let i = 0; i < w / 10; i++) { c.beginPath(); ell(c, 6 + r() * (w - 12), 14 + r() * 10, 1.6, 1.6); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(8, 7, w - 16, 2);
    }
  }),

  lamp: (sc) => once(sc, 'underwater_lamp', 70, 200, 2, (c) => {
    const g = c.createRadialGradient(35, 40, 4, 35, 40, 36); g.addColorStop(0, 'rgba(230,255,250,0.95)'); g.addColorStop(1, 'rgba(160,240,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, 80);
    // a stone pillar with an open clam holding a glowing pearl
    c.fillStyle = lin(c, 60, 196, [[0, '#9fc7d6'], [1, '#5f8fa6']]); c.beginPath(); rr(c, 26, 60, 18, 128, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(29,26,51,0.3)'; c.lineWidth = 1.5; for (const x of [31, 35, 39]) { c.beginPath(); c.moveTo(x, 64); c.lineTo(x, 184); c.stroke(); }
    c.fillStyle = '#7fb3c6'; c.beginPath(); rr(c, 18, 184, 34, 14, 3); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    kelp(c, 26, 190, 70, '#4cb874', 1, 1.8);
    c.fillStyle = '#ff9fc6'; c.beginPath(); c.moveTo(12, 56); c.quadraticCurveTo(35, 72, 58, 56); c.quadraticCurveTo(35, 66, 12, 56); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); c.moveTo(12, 52); c.quadraticCurveTo(14, 18, 35, 16); c.quadraticCurveTo(56, 18, 58, 52); c.quadraticCurveTo(35, 44, 12, 52); c.fillStyle = '#ffb8d6'; c.fill(); c.stroke();
    c.strokeStyle = 'rgba(160,60,110,0.5)'; c.lineWidth = 1.5; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(35, 46); c.lineTo(35 + k * 9, 22); c.stroke(); }
    c.fillStyle = '#f4fbff'; c.beginPath(); ell(c, 35, 54, 9, 9); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); ell(c, 32, 51, 3, 2); c.fill();
  }),

  props: (sc) => [
    once(sc, 'underwater_coral', 100, 110, 2, (c) => { coralTree(c, 50, 106, 104, '#ff7a6b', 5, 3); }),
    once(sc, 'underwater_brain', 90, 52, 2, (c) => { brain(c, 45, 50, 40, 36, '#b67bff', 3); }),
    once(sc, 'underwater_anemone', 80, 60, 2, (c) => { anemone(c, 40, 58, 1.35, '#ff9fc6', 2.5); }),
    once(sc, 'underwater_clam', 90, 56, 2, (c) => {
      c.fillStyle = '#9fb3c4'; c.beginPath(); ell(c, 45, 50, 40, 6); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = '#7a9ab0'; c.beginPath(); c.moveTo(10, 46); c.quadraticCurveTo(45, 62, 80, 46); c.quadraticCurveTo(45, 36, 10, 46); c.fill(); c.stroke();
      c.fillStyle = '#a9c4d6'; c.beginPath(); c.moveTo(10, 42); c.quadraticCurveTo(14, 6, 45, 4); c.quadraticCurveTo(76, 6, 80, 42); c.quadraticCurveTo(45, 32, 10, 42); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(29,26,51,0.35)'; c.lineWidth = 1.5; for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(45, 36); c.lineTo(45 + k * 10, 8); c.stroke(); }
      const g = c.createRadialGradient(45, 40, 1, 45, 40, 18); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(27, 22, 36, 36);
      c.fillStyle = '#f6f2ff'; c.beginPath(); ell(c, 45, 41, 7, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }),
    once(sc, 'underwater_star', 70, 50, 2, (c) => {
      c.fillStyle = lin(c, 10, 48, [[0, '#9aa6bb'], [1, '#5f6c86']]); c.beginPath(); c.moveTo(4, 48); c.quadraticCurveTo(8, 18, 34, 16); c.quadraticCurveTo(62, 18, 66, 48); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
      c.fillStyle = '#ff9f43'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5 + 0.2, rad = k % 2 ? 5 : 14; c.lineTo(34 + Math.cos(a) * rad, 22 + Math.sin(a) * rad); } c.closePath(); c.fill(); c.lineWidth = 2.2; c.stroke();
      c.fillStyle = '#ffd9a0'; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5 + 0.2; c.beginPath(); ell(c, 34 + Math.cos(a) * 7, 22 + Math.sin(a) * 7, 1.4, 1.4); c.fill(); }
    }),
    once(sc, 'underwater_kelp', 70, 130, 2, (c) => { kelp(c, 26, 128, 116, '#3fa36a', 0.5, 2.5); kelp(c, 46, 128, 84, '#5cc47e', 2.5, 2.5); c.fillStyle = '#c9b27e'; c.beginPath(); ell(c, 36, 128, 26, 4); c.fill(); }),
  ],

  bunting: (sc) => once(sc, 'underwater_bunting', 200, 40, 2, (c) => {
    // a mooring rope with shells and little floats
    c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    c.strokeStyle = '#d9b77a'; c.lineWidth = 2.4; c.stroke();
    for (let i = 1; i < 8; i++) {
      const t = i / 8, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6;
      if (i % 2) { c.fillStyle = '#ffd1c4'; c.beginPath(); c.moveTo(x - 8, y + 3); c.quadraticCurveTo(x, y + 22, x + 8, y + 3); c.quadraticCurveTo(x, y + 8, x - 8, y + 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke(); }
      else { c.fillStyle = i % 4 ? '#ff7a6b' : '#f6f2e6'; c.beginPath(); ell(c, x, y + 10, 7, 7); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); ell(c, x - 2, y + 7, 2.2, 1.4); c.fill(); }
    }
  }),

  ambient: (sc) => {
    const t = once(sc, 'underwater_bubble', 14, 14, 1, (c) => {
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); ell(c, 7, 7, 6, 6); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 1.4; c.beginPath(); ell(c, 7, 7, 6, 6); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); ell(c, 4.8, 4.6, 1.6, 1.2); c.fill();
    });
    return {
      texture: t, x: { min: 0, max: VIEW_W }, y: { min: 300, max: VIEW_H + 20 }, lifespan: 6000, frequency: 140, quantity: 1,
      speedY: { min: -70, max: -30 }, speedX: { min: -8, max: 8 }, scale: { min: 0.35, max: 1 },
      alpha: { start: 0.8, end: 0 },
    };
  },

  overlay: (sc) => once(sc, 'underwater_overlay', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = 'rgba(40,150,200,0.1)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.globalCompositeOperation = 'lighter';
    for (const [x, w, a] of [[420, 70, 0.05], [610, 50, 0.045], [180, 40, 0.035], [820, 60, 0.04]] as [number, number, number][]) {
      c.fillStyle = lin(c, 0, VIEW_H, [[0, `rgba(220,255,250,${a})`], [1, 'rgba(220,255,250,0)']]); c.beginPath(); c.moveTo(x, 0); c.lineTo(x + w, 0); c.lineTo(x + w * 2 - 200, VIEW_H); c.lineTo(x - 200, VIEW_H); c.closePath(); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = lin(c, 380, VIEW_H, [[0, 'rgba(10,60,100,0)'], [1, 'rgba(10,60,100,0.12)']]); c.fillRect(0, 380, VIEW_W, VIEW_H - 380);
  }),
});
