/** הר הרוחות: blue-grey cliffs and misty peaks, pine forests, waterfalls, rope bridges, mountain huts, eagles and cloth-flag strands. */
import * as Phaser from 'phaser';
import { registerWorld, mk, tex, lin, soft, nosoft, wrap, rng, VIEW_W, VIEW_H, LAYER_W } from '../world';
import { INK, ell, rr, shade } from '../puppet';

const once = (sc: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (c: CanvasRenderingContext2D) => void): string =>
  sc.textures.exists(key) ? key : tex(sc, key, mk(w, h, draw, res), res);
const TAU = Math.PI * 2;
const FLAGS = ['#2f6fd1', '#f6f2e6', '#e4572e', '#3fa35a', '#f2b134'];
const wave = (x: number, parts: [number, number, number][]) => parts.reduce((s, [k, a, p]) => s + a * Math.sin((x / LAYER_W) * TAU * k + p), 0);

function pine(c: CanvasRenderingContext2D, x: number, y: number, h: number, col: string, lw: number): void {
  const w = h * 0.42, tiers = 4;
  c.fillStyle = '#6b4a34'; c.fillRect(x - h * 0.04, y - h * 0.16, h * 0.08, h * 0.16);
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(x - h * 0.04, y - h * 0.16, h * 0.08, h * 0.16); }
  for (let i = 0; i < tiers; i++) {
    const t0 = y - h * 0.12 - i * h * 0.21, tw = w * (1 - i * 0.2);
    c.fillStyle = shade(col, i * 0.06); c.beginPath(); c.moveTo(x - tw, t0); c.lineTo(x, t0 - h * 0.36); c.lineTo(x + tw, t0);
    c.quadraticCurveTo(x, t0 - h * 0.06, x - tw, t0); c.closePath(); c.fill();
    if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  }
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.moveTo(x, y - h * 0.9); c.lineTo(x - w * 0.5, y - h * 0.5); c.lineTo(x - w * 0.1, y - h * 0.55); c.closePath(); c.fill();
}
/** A tall cliff block with strata, a grass cap and (optionally) a waterfall on its face. Top at y0, bottom at y1. */
function cliff(c: CanvasRenderingContext2D, x: number, w: number, y0: number, y1: number, r: () => number, fall: boolean): void {
  const pts: [number, number][] = [];
  for (let y = y0; y <= y1; y += 24) pts.push([x + (r() - 0.5) * 14 - (y - y0) * 0.04, y]);
  const rpts: [number, number][] = [];
  for (let y = y1; y >= y0; y -= 24) rpts.push([x + w + (r() - 0.5) * 14 + (y - y0) * 0.04, y]);
  c.beginPath(); c.moveTo(pts[0][0], y0); for (const p of pts) c.lineTo(p[0], p[1]); c.lineTo(x - (y1 - y0) * 0.04, y1 + 40); c.lineTo(x + w + (y1 - y0) * 0.04, y1 + 40); for (const p of rpts) c.lineTo(p[0], p[1]); c.closePath();
  c.fillStyle = lin(c, y0, y1, [[0, '#9fb2c8'], [1, '#5d6f8c']]); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.save(); c.clip();
  c.fillStyle = 'rgba(40,50,80,0.25)'; c.fillRect(x + w * 0.65, y0, w, y1 - y0 + 40);
  c.strokeStyle = 'rgba(40,50,80,0.35)'; c.lineWidth = 2;
  for (let y = y0 + 30; y < y1; y += 26 + r() * 16) { c.beginPath(); c.moveTo(x - 20, y); c.lineTo(x + w * 0.4, y + 4); c.lineTo(x + w + 20, y - 2); c.stroke(); }
  for (let i = 0; i < 4; i++) { const cx = x + r() * w, cy = y0 + 30 + r() * (y1 - y0 - 40); c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + 6, cy + 14); c.lineTo(cx + 2, cy + 26); c.stroke(); }
  if (fall) {
    const fx = x + w * 0.38, fw = w * 0.22;
    c.fillStyle = lin(c, y0, y1, [[0, '#d8f2ff'], [1, '#8fd0f0']]); c.fillRect(fx, y0 + 6, fw, y1 - y0);
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2;
    for (let k = 0; k < 5; k++) { const lx = fx + 3 + k * (fw - 6) / 4; c.beginPath(); c.moveTo(lx, y0 + 10 + k * 13); c.lineTo(lx, y1 - 10 - k * 7); c.stroke(); }
  }
  c.restore();
  // the grass cap
  c.fillStyle = '#6fbf73'; c.beginPath(); c.moveTo(pts[0][0] - 6, y0 + 8); c.quadraticCurveTo(x + w / 2, y0 - 12, rpts[rpts.length - 1][0] + 6, y0 + 8);
  for (let k = 8; k >= 0; k--) c.lineTo(x + (w * k) / 8, y0 + 8 + (k % 2 ? 8 : 2)); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  if (fall) {
    const fx = x + w * 0.38, fw = w * 0.22;
    c.fillStyle = '#f2fbff'; c.beginPath(); for (let k = 0; k < 5; k++) ell(c, fx + fw / 2 + (k - 2) * fw * 0.4, y1 + 2 - (k % 2) * 5, fw * 0.4, 8); c.fill();
  }
}
function hut(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, roof: string, lw: number): void {
  c.fillStyle = '#b07a4f'; c.beginPath(); rr(c, x, y - h, w, h, 3); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.strokeStyle = 'rgba(70,40,20,0.45)'; c.lineWidth = 1.5; for (let ly = y - h + 8; ly < y; ly += 8) { c.beginPath(); c.moveTo(x + 2, ly); c.lineTo(x + w - 2, ly); c.stroke(); }
  c.fillStyle = '#8d939f'; c.fillRect(x, y - 8, w, 8);
  c.fillStyle = roof; c.beginPath(); c.moveTo(x - 10, y - h + 2); c.lineTo(x + w / 2, y - h - w * 0.45); c.lineTo(x + w + 10, y - h + 2); c.closePath(); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.fillStyle = '#f4fbff'; c.beginPath(); c.moveTo(x - 10, y - h + 2); c.lineTo(x + w / 2, y - h - w * 0.45); c.lineTo(x + w / 2 + 6, y - h - w * 0.38); c.lineTo(x - 2, y - h + 2); c.closePath(); c.fill();
  c.fillStyle = '#ffd66b'; c.beginPath(); rr(c, x + w * 0.62, y - h * 0.72, w * 0.22, h * 0.3, 2); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.stroke(); }
  c.fillStyle = '#5a3a24'; c.beginPath(); rr(c, x + w * 0.16, y - h * 0.62, w * 0.24, h * 0.62, 2); c.fill(); if (lw) c.stroke();
  c.fillStyle = '#6f7684'; c.fillRect(x + w * 0.7, y - h - w * 0.4, 8, 16);
}
function flagLine(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, sag: number, n: number, s: number): void {
  c.strokeStyle = 'rgba(29,26,51,0.75)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1); c.stroke();
  for (let k = 1; k < n; k++) {
    const t = k / n, px = (1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * (x0 + x1) / 2 + t * t * x1, py = (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * ((y0 + y1) / 2 + sag) + t * t * y1;
    c.fillStyle = FLAGS[k % FLAGS.length]; c.beginPath(); c.moveTo(px - 5 * s, py); c.lineTo(px + 5 * s, py); c.lineTo(px + 6 * s, py + 12 * s); c.lineTo(px - 4 * s, py + 12 * s); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(29,26,51,0.6)'; c.lineWidth = 1; c.stroke();
  }
}
function eagle(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string): void {
  c.fillStyle = col; c.beginPath(); c.moveTo(x - 30 * s, y - 4 * s); c.quadraticCurveTo(x - 14 * s, y - 14 * s, x - 3 * s, y - 2 * s); c.lineTo(x, y + 2 * s); c.lineTo(x + 3 * s, y - 2 * s);
  c.quadraticCurveTo(x + 14 * s, y - 14 * s, x + 30 * s, y - 4 * s); c.quadraticCurveTo(x + 14 * s, y - 4 * s, x + 4 * s, y + 4 * s); c.lineTo(x + 3 * s, y + 10 * s); c.lineTo(x - 3 * s, y + 10 * s); c.lineTo(x - 4 * s, y + 4 * s); c.quadraticCurveTo(x - 14 * s, y - 4 * s, x - 30 * s, y - 4 * s); c.fill();
}

registerWorld({
  id: 'mountain', name: 'הר הרוחות',

  sky: (sc) => once(sc, 'mountain_sky', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#4d7cc0'], [0.45, '#9cc4e4'], [0.8, '#dceef0'], [1, '#eef6ee']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const g = c.createRadialGradient(780, 110, 10, 780, 110, 260); g.addColorStop(0, 'rgba(255,252,230,0.95)'); g.addColorStop(0.25, 'rgba(255,245,210,0.4)'); g.addColorStop(1, 'rgba(255,245,210,0)');
    c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H); c.fillStyle = '#fffbea'; c.beginPath(); ell(c, 780, 110, 40, 40); c.fill();
    for (const [x, y, s] of [[160, 90, 1.1], [480, 150, 0.8], [880, 230, 0.7], [320, 240, 0.6]] as [number, number, number][]) {
      c.fillStyle = 'rgba(190,210,232,0.9)'; c.beginPath(); rr(c, x - 80 * s, y + 6 * s, 160 * s, 20 * s, 10 * s); ell(c, x - 30 * s, y + 6 * s, 34 * s, 22 * s); ell(c, x + 18 * s, y, 42 * s, 28 * s); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); rr(c, x - 80 * s, y, 160 * s, 20 * s, 10 * s); ell(c, x - 30 * s, y, 34 * s, 22 * s); ell(c, x + 18 * s, y - 6 * s, 42 * s, 28 * s); c.fill();
    }
    eagle(c, 620, 200, 0.9, 'rgba(50,60,90,0.75)'); eagle(c, 700, 240, 0.6, 'rgba(50,60,90,0.6)');
  }),

  far: (sc) => once(sc, 'mountain_far', LAYER_W, VIEW_H, 1, (c) => {
    const r = rng(61);
    const range = (yb: number, minH: number, maxH: number, col: string, snow: boolean, step: number) => {
      let x = -100;
      while (x < LAYER_W) {
        const w = step + r() * step, h = minH + r() * (maxH - minH), lean = (r() - 0.5) * w * 0.4, sh = r();
        wrap(LAYER_W, x, w, (xx) => {
          const px = xx + w / 2 + lean, py = yb - h;
          c.fillStyle = col; c.beginPath(); c.moveTo(xx - w * 0.3, yb + 40); c.lineTo(px - w * 0.18, py + h * 0.2); c.lineTo(px, py); c.lineTo(px + w * 0.16, py + h * 0.18); c.lineTo(px + w * 0.24, py + h * 0.14); c.lineTo(xx + w * 1.3, yb + 40); c.closePath(); c.fill();
          c.fillStyle = 'rgba(30,40,80,0.18)'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + w * 0.16, py + h * 0.18); c.lineTo(px + w * 0.24, py + h * 0.14); c.lineTo(xx + w * 1.3, yb + 40); c.lineTo(px + w * 0.1 * sh, yb + 40); c.closePath(); c.fill();
          if (snow) {
            c.fillStyle = '#f4f8ff'; c.beginPath(); c.moveTo(px - w * 0.18 * 0.45, py + h * 0.2 * 0.45); c.lineTo(px, py); c.lineTo(px + w * 0.16 * 0.6, py + h * 0.18 * 0.6);
            c.lineTo(px + w * 0.05, py + h * 0.16); c.lineTo(px - w * 0.02, py + h * 0.11); c.lineTo(px - w * 0.06, py + h * 0.15); c.closePath(); c.fill();
          }
        });
        x += w * 0.75;
      }
    };
    range(330, 140, 240, '#8ea6cc', true, 180);
    c.fillStyle = lin(c, 240, 400, [[0, 'rgba(230,240,248,0)'], [1, 'rgba(230,240,248,0.75)']]); c.fillRect(0, 240, LAYER_W, 160);
    range(380, 90, 170, '#6f8bb6', true, 150);
    c.fillStyle = lin(c, 300, 440, [[0, 'rgba(225,236,244,0)'], [1, 'rgba(225,236,244,0.8)']]); c.fillRect(0, 300, LAYER_W, 140);
    // a dark forest ridge
    c.fillStyle = '#4f7a86'; c.beginPath(); c.moveTo(0, VIEW_H); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 430 + wave(x, [[3, 12, 0.3], [7, 6, 1]])); c.lineTo(LAYER_W, VIEW_H); c.fill();
    for (let x = 0; x < LAYER_W; x += 9 + r() * 6) { const y = 432 + wave(x, [[3, 12, 0.3], [7, 6, 1]]), h = 18 + r() * 18; wrap(LAYER_W, x - 6, 12, (xx) => { c.beginPath(); c.moveTo(xx - h * 0.28, y + 4); c.lineTo(xx, y - h); c.lineTo(xx + h * 0.28, y + 4); c.fill(); }); }
    c.fillStyle = lin(c, 420, VIEW_H, [[0, 'rgba(225,236,244,0.15)'], [1, 'rgba(225,236,244,0.7)']]); c.fillRect(0, 420, LAYER_W, VIEW_H - 420);
  }),

  mid: (sc) => once(sc, 'mountain_mid', LAYER_W, VIEW_H, 1.5, (c) => {
    const r = rng(71), base = 482;
    // two cliff pairs joined by rope bridges, one with a waterfall
    for (const [ax, aw, at, bx, bw, bt] of [[120, 170, 200, 520, 190, 236], [1080, 200, 180, 1470, 160, 220]] as number[][]) {
      cliff(c, ax, aw, at, base, r, false);
      cliff(c, bx, bw, bt, base, r, true);
      // the rope bridge
      const x0 = ax + aw - 4, y0 = at + 4, x1 = bx + 4, y1 = bt + 4, sag = 46;
      const P = (t: number) => [(1 - t) * (1 - t) * x0 + 2 * t * (1 - t) * (x0 + x1) / 2 + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * t * (1 - t) * ((y0 + y1) / 2 + sag) + t * t * y1];
      c.strokeStyle = '#5a3a24'; c.lineWidth = 2; c.beginPath(); for (let t = 0; t <= 1; t += 0.05) { const [px, py] = P(t); c.lineTo(px, py - 22); } c.stroke();
      for (let t = 0.04; t < 1; t += 0.045) {
        const [px, py] = P(t); c.fillStyle = t * 100 % 9 < 4.5 ? '#c89262' : '#b07a4f'; c.beginPath(); rr(c, px - 4, py - 3, 8, 6, 1); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
        c.strokeStyle = 'rgba(90,58,36,0.8)'; c.beginPath(); c.moveTo(px, py - 3); c.lineTo(px, py - 22); c.stroke();
      }
      for (const [px, py] of [[x0, y0], [x1, y1]]) { c.fillStyle = '#6b4a34'; c.fillRect(px - 3, py - 30, 6, 32); c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(px - 3, py - 30, 6, 32); }
      // a cloth-flag strand from the cliff top
      flagLine(c, ax + 30, at - 30, ax + aw - 20, at - 26, 18, 8, 1);
      c.fillStyle = '#6b4a34'; c.fillRect(ax + 28, at - 34, 4, 38); c.fillRect(ax + aw - 22, at - 30, 4, 34);
      hut(c, bx + 30, bt + 6, 64, 40, '#c8513a', 2);
      pine(c, ax + 50, at + 8, 50, '#3f8a5a', 1.5); pine(c, bx + bw - 30, bt + 8, 44, '#3f8a5a', 1.5);
    }
    // pine forest in the gaps, standing on the base line
    for (let x = 0; x < LAYER_W; x += 26 + r() * 40) {
      const h = 70 + r() * 70, col = ['#2f7a55', '#3f8a5a', '#2b6b52'][Math.floor(r() * 3)];
      wrap(LAYER_W, x - 30, 60, (xx) => pine(c, xx, base + 4, h, col, 2));
    }
    // a few huts at the bottom
    for (const [i, hx] of [380, 930, 1330, 1800].entries()) { const roof = i % 2 ? '#2f6fd1' : '#c8513a'; wrap(LAYER_W, hx - 10, 100, (xx) => hut(c, xx, base, 70, 46, roof, 2)); }
    // misty layer tint
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(150,180,215,0.32)'; c.fillRect(0, 0, LAYER_W, VIEW_H);
    c.fillStyle = lin(c, 380, base, [[0, 'rgba(230,240,248,0)'], [1, 'rgba(230,240,248,0.35)']]); c.fillRect(0, 380, LAYER_W, base - 380);
    c.globalCompositeOperation = 'source-over';
  }),

  ground: (sc, w) => once(sc, `mountain_ground_${w}`, w, 120, 1, (c) => {
    const r = rng(w * 11 + 9);
    c.fillStyle = lin(c, 0, 120, [[0, '#7d8ba6'], [1, '#3b4560']]); c.fillRect(0, 0, w, 120);
    // big cliff stones
    for (let y = 26; y < 120; y += 30) {
      let x = -((y / 30) % 2) * 30 - r() * 20;
      while (x < w) {
        const sw = 50 + r() * 40;
        c.fillStyle = shade('#7d8ba6', (r() - 0.5) * 0.2 - (y - 26) / 300); c.beginPath(); rr(c, x + 2, y + 2, sw - 4, 26, 7); c.fill();
        c.strokeStyle = 'rgba(29,26,51,0.45)'; c.lineWidth = 2; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 8, y + 4, sw - 18, 3);
        x += sw;
      }
    }
    // the grassy lip with tufts hanging over
    c.fillStyle = lin(c, 0, 26, [[0, '#8fd47a'], [1, '#4f9d58']]); c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, 20);
    for (let x = w; x > 0; x -= 8) c.lineTo(x - 4, 20 + (Math.floor(x / 8) % 3 === 0 ? 9 : 3 + r() * 3));
    c.lineTo(0, 20); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(40,100,50,0.6)'; c.lineWidth = 1.6;
    for (let x = 4; x < w; x += 12 + r() * 10) { c.beginPath(); c.moveTo(x, 14); c.lineTo(x + 2, 7); c.moveTo(x + 4, 14); c.lineTo(x + 7, 8); c.stroke(); }
    for (let x = 20; x < w; x += 70 + r() * 90) { c.fillStyle = ['#fff', '#ffd23f', '#ff8fb0'][Math.floor(r() * 3)]; c.beginPath(); ell(c, x, 10, 2.5, 2.5); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(0, 2, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }),

  platform: (sc, w, style, seed) => once(sc, `mountain_plat_${style}_${w}_${seed}`, w, 40, 1, (c) => {
    if (style === 'plank') {
      // a wooden ledge of two lashed planks on rope-tied struts
      for (const x of [w * 0.18, w * 0.82]) { c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(x, 20); c.lineTo(x - 10, 38); c.stroke(); c.strokeStyle = '#7a5434'; c.lineWidth = 4; c.stroke(); }
      soft(c, 6, 4, 0.3);
      c.fillStyle = lin(c, 4, 22, [[0, '#c99662'], [1, '#93643c']]); c.beginPath(); rr(c, 2, 4, w - 4, 16, 3); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(70,40,20,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(4, 12); c.lineTo(w - 4, 12); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(6, 6, w - 12, 2.5);
      for (const x of [w * 0.18, w * 0.82]) { c.fillStyle = '#e8d3a0'; c.fillRect(x - 5, 4, 10, 16); c.strokeStyle = 'rgba(120,90,40,0.8)'; c.lineWidth = 1.2; for (let y = 7; y < 20; y += 4) { c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x + 5, y + 2); c.stroke(); } }
    } else {
      // a mossy rock slab
      const r = rng(seed * 31 + w);
      soft(c, 6, 4, 0.3);
      c.fillStyle = lin(c, 4, 36, [[0, '#a3b0c4'], [1, '#5f6c86']]); c.beginPath(); c.moveTo(4, 8); c.lineTo(w - 4, 6);
      for (let x = w - 4; x > 4; x -= 16) c.lineTo(x - 8, 26 + r() * 10); c.closePath(); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = lin(c, 4, 14, [[0, '#9ad67e'], [1, '#5ca85e']]); c.beginPath(); c.moveTo(3, 8); c.lineTo(w - 3, 6); c.lineTo(w - 6, 13);
      for (let x = w - 6; x > 6; x -= 10) c.lineTo(x - 5, 12 + (Math.floor(x / 10) % 2 ? 6 : 1)); c.closePath(); c.fill(); c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(8, 7, w - 16, 2);
      c.strokeStyle = 'rgba(30,40,70,0.4)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(w * 0.4, 16); c.lineTo(w * 0.45, 26); c.moveTo(w * 0.7, 15); c.lineTo(w * 0.66, 24); c.stroke();
    }
  }),

  lamp: (sc) => once(sc, 'mountain_lamp', 70, 200, 2, (c) => {
    const g = c.createRadialGradient(46, 70, 4, 46, 70, 36); g.addColorStop(0, 'rgba(255,224,140,0.9)'); g.addColorStop(1, 'rgba(255,224,140,0)'); c.fillStyle = g; c.fillRect(6, 30, 70, 80);
    // a wooden post with a little roof and a hanging lantern, on a stone base
    c.fillStyle = '#7a5434'; c.beginPath(); rr(c, 18, 30, 9, 160, 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#7a5434'; c.beginPath(); rr(c, 18, 40, 38, 7, 2); c.fill(); c.stroke();
    c.fillStyle = '#c8513a'; c.beginPath(); c.moveTo(8, 34); c.lineTo(36, 18); c.lineTo(64, 34); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#f4fbff'; c.beginPath(); c.moveTo(8, 34); c.lineTo(36, 18); c.lineTo(40, 22); c.lineTo(14, 34); c.closePath(); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(46, 47); c.lineTo(46, 56); c.stroke();
    c.fillStyle = '#3a3a4a'; c.beginPath(); rr(c, 38, 56, 16, 4, 1); c.fill(); c.stroke();
    c.fillStyle = '#ffe39a'; c.beginPath(); rr(c, 39, 60, 14, 18, 3); c.fill(); c.stroke();
    c.fillStyle = '#3a3a4a'; c.beginPath(); rr(c, 38, 78, 16, 4, 1); c.fill(); c.stroke();
    c.fillStyle = '#8d939f'; c.beginPath(); c.moveTo(8, 198); c.lineTo(12, 182); c.lineTo(34, 178); c.lineTo(42, 186); c.lineTo(42, 198); c.closePath(); c.fill(); c.lineWidth = 3; c.stroke();
  }),

  props: (sc) => [
    once(sc, 'mountain_pine', 80, 130, 2, (c) => pine(c, 40, 128, 124, '#3f8a5a', 3)),
    once(sc, 'mountain_boulder', 100, 64, 2, (c) => {
      c.fillStyle = lin(c, 8, 62, [[0, '#aab6c8'], [1, '#5f6c86']]); c.beginPath(); c.moveTo(6, 62); c.quadraticCurveTo(4, 24, 30, 12); c.quadraticCurveTo(58, 2, 80, 20); c.quadraticCurveTo(98, 36, 94, 62); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#6fbf73'; c.beginPath(); c.moveTo(22, 18); c.quadraticCurveTo(50, 2, 78, 18); c.quadraticCurveTo(66, 24, 58, 20); c.quadraticCurveTo(46, 28, 36, 22); c.quadraticCurveTo(28, 26, 22, 18); c.fill(); c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(30,40,70,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(60, 30); c.lineTo(66, 44); c.lineTo(62, 56); c.stroke();
      c.fillStyle = '#5ca85e'; c.beginPath(); ell(c, 10, 60, 10, 6); ell(c, 92, 60, 9, 5); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }),
    once(sc, 'mountain_hut', 110, 100, 2, (c) => hut(c, 20, 98, 72, 50, '#c8513a', 3)),
    once(sc, 'mountain_sign', 76, 110, 2, (c) => {
      c.fillStyle = '#7a5434'; c.fillRect(34, 20, 8, 88); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(34, 20, 8, 88);
      for (const [y, dir, col] of [[18, 1, '#c99662'], [44, -1, '#b07a4f']] as [number, number, string][]) {
        const x0 = dir > 0 ? 14 : 8, x1 = dir > 0 ? 64 : 58;
        c.fillStyle = col; c.beginPath(); if (dir > 0) { c.moveTo(x0, y); c.lineTo(x1, y); c.lineTo(x1 + 10, y + 10); c.lineTo(x1, y + 20); c.lineTo(x0, y + 20); } else { c.moveTo(x1, y); c.lineTo(x0, y); c.lineTo(x0 - 8, y + 10); c.lineTo(x0, y + 20); c.lineTo(x1, y + 20); }
        c.closePath(); c.fill(); c.stroke();
        c.fillStyle = 'rgba(70,40,20,0.6)'; c.fillRect(x0 + 10, y + 8, 30, 3);
      }
      c.fillStyle = '#5ca85e'; c.beginPath(); ell(c, 38, 108, 20, 5); c.fill(); c.lineWidth = 2; c.stroke();
    }),
    once(sc, 'mountain_cairn', 60, 80, 2, (c) => {
      const stones: [number, number, number, number][] = [[30, 70, 24, 9], [30, 53, 19, 8], [31, 38, 15, 7], [29, 25, 11, 6], [30, 14, 7, 5]];
      stones.forEach(([x, y, rx, ry], i) => { c.fillStyle = shade('#9aa6bb', (i % 2) * 0.12 - 0.05); c.beginPath(); ell(c, x, y, rx, ry); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); ell(c, x - rx * 0.3, y - ry * 0.4, rx * 0.35, ry * 0.25); c.fill(); });
      c.fillStyle = '#5ca85e'; c.beginPath(); ell(c, 30, 79, 26, 3); c.fill();
    }),
    once(sc, 'mountain_logs', 100, 56, 2, (c) => {
      const log = (x: number, y: number, rad: number) => {
        c.fillStyle = '#93643c'; c.fillRect(x - 40, y - rad, 40, rad * 2); c.strokeStyle = INK; c.lineWidth = 2.6; c.strokeRect(x - 40, y - rad, 40, rad * 2);
        c.fillStyle = '#e8c48e'; c.beginPath(); ell(c, x, y, rad * 0.7, rad); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(120,70,30,0.6)'; c.lineWidth = 1.2; c.beginPath(); ell(c, x, y, rad * 0.35, rad * 0.5); c.stroke();
      };
      log(70, 44, 10); log(92, 44, 10); log(80, 26, 10);
      // red-cap mushrooms
      for (const [x, s] of [[14, 1], [30, 0.7]] as [number, number][]) { c.fillStyle = '#f6efe0'; c.fillRect(x - 3 * s, 54 - 14 * s, 6 * s, 14 * s); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - 3 * s, 54 - 14 * s, 6 * s, 14 * s); c.fillStyle = '#e4572e'; c.beginPath(); c.moveTo(x - 11 * s, 54 - 13 * s); c.quadraticCurveTo(x, 54 - 30 * s, x + 11 * s, 54 - 13 * s); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); ell(c, x - 3 * s, 54 - 20 * s, 2 * s, 2 * s); ell(c, x + 4 * s, 54 - 17 * s, 1.6 * s, 1.6 * s); c.fill(); }
    }),
  ],

  bunting: (sc) => once(sc, 'mountain_bunting', 200, 40, 2, (c) => {
    flagLine(c, 0, 4, 200, 4, 24, 12, 1.05);
  }),

  ambient: (sc) => {
    const t = once(sc, 'mountain_leaf', 12, 7, 1, (c) => { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, 3.5); c.quadraticCurveTo(6, -2, 12, 3.5); c.quadraticCurveTo(6, 9, 0, 3.5); c.fill(); });
    return {
      texture: t, x: { min: 0, max: VIEW_W + 100 }, y: { min: -20, max: VIEW_H - 100 }, lifespan: 6000, frequency: 260, quantity: 1,
      speedX: { min: -60, max: -25 }, speedY: { min: 10, max: 35 }, rotate: { start: 0, end: 540 }, scale: { min: 0.7, max: 1.2 },
      alpha: { start: 0.85, end: 0 }, tint: [0x6fbf73, 0x9ad67e, 0xf2b134, 0xe4572e],
    };
  },
});
