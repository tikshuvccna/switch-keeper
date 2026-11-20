/** מעל העננים: a bright sky world of floating islands, waterfalls, balloons, kites and airships. The hero flies here. */
import * as Phaser from 'phaser';
import { INK, ell, rr, shade } from '../puppet';
import { LAYER_W, VIEW_H, VIEW_W, lin, mk, nosoft, registerWorld, rng, soft, tex, wrap } from '../world';

/** wrap() with the same random numbers for both copies, so an item crossing the seam matches itself. */
function wrapR(r: () => number, x: number, ew: number, f: (xx: number, r: () => number) => void): void { const s = Math.floor(r() * 1e9); wrap(LAYER_W, x, ew, (xx) => f(xx, rng(s))); }

const ID = 'flying';
const SKY: [number, string][] = [[0, '#3f8fe0'], [0.45, '#8fcaf2'], [0.78, '#ffd9c2'], [1, '#ffbfa0']];

/** A puffy cloud: a row of bumps on a flat base. */
function cloud(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, top: string, bot: string): void {
  c.fillStyle = lin(c, y - h, y, [[0, top], [1, bot]]);
  c.beginPath();
  const n = Math.max(3, Math.round(w / (h * 0.9)));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, bx = x + w * t, bh = h * (0.55 + 0.45 * Math.sin(Math.PI * t)) * (0.8 + r() * 0.3);
    ell(c, bx, y - bh * 0.5, w / n * 0.75, bh * 0.62);
  }
  rr(c, x, y - h * 0.35, w, h * 0.35, h * 0.17);
  c.fill();
}

/** A floating island: a grassy lip and a rocky underside that tapers down. */
function island(c: CanvasRenderingContext2D, x: number, y: number, w: number, d: number, r: () => number, rock: string, grass: string, ink: boolean): void {
  c.beginPath(); c.moveTo(x, y);
  const n = 5 + Math.floor(r() * 3);
  for (let i = 1; i < n; i++) { const t = i / n; c.lineTo(x + w * t, y + d * Math.sin(Math.PI * t) * (0.6 + r() * 0.5) + 4); }
  c.lineTo(x + w, y); c.closePath();
  c.fillStyle = lin(c, y, y + d, [[0, rock], [1, shade(rock, -0.35)]]); c.fill();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = 'rgba(0,0,0,0.12)';
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(x + w * (0.2 + i * 0.25), y + 6); c.lineTo(x + w * (0.25 + i * 0.25), y + d * 0.55); c.lineTo(x + w * (0.3 + i * 0.25), y + 6); c.fill(); }
  c.fillStyle = grass; c.beginPath(); rr(c, x - 6, y - 8, w + 12, 14, 7); c.fill();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y - 7, w, 2.5);
}

function waterfall(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  c.fillStyle = lin(c, y, y + h, [[0, 'rgba(220,245,255,0.95)'], [0.7, 'rgba(180,230,255,0.7)'], [1, 'rgba(255,255,255,0)']]);
  c.fillRect(x, y, w, h);
  c.fillStyle = 'rgba(255,255,255,0.8)'; for (let k = 0; k < 3; k++) c.fillRect(x + w * (0.2 + k * 0.28), y, 1.5, h * 0.8);
}

function balloon(c: CanvasRenderingContext2D, x: number, y: number, s: number, cols: string[], ink: boolean): void {
  // envelope with stripes
  c.save();
  c.beginPath(); c.moveTo(x, y + 46 * s); c.bezierCurveTo(x - 40 * s, y + 20 * s, x - 34 * s, y - 34 * s, x, y - 34 * s); c.bezierCurveTo(x + 34 * s, y - 34 * s, x + 40 * s, y + 20 * s, x, y + 46 * s); c.closePath();
  c.fillStyle = cols[0]; c.fill(); c.clip();
  for (let k = -2; k <= 2; k += 2) { c.fillStyle = cols[1]; c.beginPath(); ell(c, x + k * 11 * s, y + 4 * s, 6 * s, 50 * s); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); ell(c, x - 14 * s, y - 14 * s, 8 * s, 14 * s, 0.3); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(x - 40 * s, y + 24 * s, 80 * s, 30 * s);
  c.restore();
  c.beginPath(); c.moveTo(x, y + 46 * s); c.bezierCurveTo(x - 40 * s, y + 20 * s, x - 34 * s, y - 34 * s, x, y - 34 * s); c.bezierCurveTo(x + 34 * s, y - 34 * s, x + 40 * s, y + 20 * s, x, y + 46 * s); c.closePath();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.strokeStyle = ink ? INK : cols[2]; c.lineWidth = 1.5;
  c.beginPath(); c.moveTo(x - 8 * s, y + 42 * s); c.lineTo(x - 7 * s, y + 58 * s); c.moveTo(x + 8 * s, y + 42 * s); c.lineTo(x + 7 * s, y + 58 * s); c.stroke();
  c.fillStyle = cols[2]; c.beginPath(); rr(c, x - 9 * s, y + 57 * s, 18 * s, 12 * s, 2 * s); c.fill(); if (ink) { c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
}

function kite(c: CanvasRenderingContext2D, x: number, y: number, s: number, a: string, b: string): void {
  c.beginPath(); c.moveTo(x, y - 20 * s); c.lineTo(x + 13 * s, y); c.lineTo(x, y + 26 * s); c.lineTo(x - 13 * s, y); c.closePath();
  c.fillStyle = a; c.fill();
  c.fillStyle = b; c.beginPath(); c.moveTo(x, y - 20 * s); c.lineTo(x + 13 * s, y); c.lineTo(x, y); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(x, y); c.lineTo(x - 13 * s, y); c.lineTo(x, y + 26 * s); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(29,26,51,0.6)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y + 26 * s);
  for (let k = 1; k <= 6; k++) c.quadraticCurveTo(x - 10 * s + k * 4 * s, y + 26 * s + k * 10 * s - 5 * s, x + (k % 2 ? 6 : -6) * s, y + 26 * s + k * 10 * s);
  c.stroke();
  for (let k = 1; k <= 3; k++) { c.fillStyle = k % 2 ? a : b; c.beginPath(); ell(c, x + (k % 2 ? 4 : -4) * s, y + 26 * s + k * 18 * s, 3.5 * s, 2 * s, 0.6); c.fill(); }
}

function airship(c: CanvasRenderingContext2D, x: number, y: number, s: number, body: string, ink: boolean): void {
  c.fillStyle = lin(c, y - 18 * s, y + 18 * s, [[0, shade(body, 0.25)], [1, shade(body, -0.2)]]);
  c.beginPath(); ell(c, x, y, 52 * s, 17 * s); c.fill(); if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = shade(body, -0.25); c.beginPath(); c.moveTo(x + 44 * s, y - 4 * s); c.lineTo(x + 64 * s, y - 18 * s); c.lineTo(x + 60 * s, y); c.lineTo(x + 64 * s, y + 18 * s); c.lineTo(x + 44 * s, y + 4 * s); c.closePath(); c.fill(); if (ink) c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.5; for (const k of [-20, 0, 20]) { c.beginPath(); c.moveTo(x + k * s, y - 16 * s); c.lineTo(x + k * s, y + 16 * s); c.stroke(); }
  c.fillStyle = '#9a6a3c'; c.beginPath(); rr(c, x - 18 * s, y + 18 * s, 34 * s, 9 * s, 3 * s); c.fill(); if (ink) { c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = '#ffe9a0'; for (let k = 0; k < 3; k++) c.fillRect(x - 13 * s + k * 10 * s, y + 20 * s, 5 * s, 4 * s);
  c.fillStyle = '#5a5a78'; c.beginPath(); ell(c, x - 56 * s, y, 2 * s, 9 * s); c.fill();
}

function birds(c: CanvasRenderingContext2D, x: number, y: number, n: number, col: string, r: () => number): void {
  c.strokeStyle = col; c.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const bx = x + i * 14 + r() * 8, by = y + Math.abs(i - n / 2) * 6 + r() * 4, s = 4 + r() * 2;
    c.beginPath(); c.moveTo(bx - s, by - 2); c.quadraticCurveTo(bx - s / 2, by - 4, bx, by); c.quadraticCurveTo(bx + s / 2, by - 4, bx + s, by - 2); c.stroke();
  }
}

function windmill(c: CanvasRenderingContext2D, x: number, base: number, s: number, ink: boolean, wall: string, sail: string): void {
  c.fillStyle = wall; c.beginPath(); c.moveTo(x - 12 * s, base); c.lineTo(x - 8 * s, base - 46 * s); c.lineTo(x + 8 * s, base - 46 * s); c.lineTo(x + 12 * s, base); c.closePath(); c.fill(); if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = '#c0504d'; c.beginPath(); c.moveTo(x - 11 * s, base - 45 * s); c.lineTo(x, base - 58 * s); c.lineTo(x + 11 * s, base - 45 * s); c.closePath(); c.fill(); if (ink) c.stroke();
  c.fillStyle = '#5b3a2a'; c.beginPath(); rr(c, x - 3.5 * s, base - 14 * s, 7 * s, 14 * s, 3 * s); c.fill();
  const hx = x, hy = base - 48 * s;
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 2 + 0.4;
    c.save(); c.translate(hx, hy); c.rotate(a);
    c.fillStyle = sail; c.beginPath(); c.rect(3 * s, -4 * s, 30 * s, 8 * s); c.fill(); if (ink) { c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); }
    c.restore();
  }
  c.fillStyle = '#5b3a2a'; c.beginPath(); ell(c, hx, hy, 3 * s, 3 * s); c.fill();
}

function sky(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_sky`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, SKY); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const g = c.createRadialGradient(760, 120, 10, 760, 120, 330);
    g.addColorStop(0, 'rgba(255,252,230,1)'); g.addColorStop(0.15, 'rgba(255,240,200,0.7)'); g.addColorStop(1, 'rgba(255,230,190,0)');
    c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.fillStyle = '#fffbe8'; c.beginPath(); ell(c, 760, 120, 40, 40); c.fill();
    // a soft rainbow arc
    const cols = ['#ff8a8a', '#ffc27a', '#fff08a', '#9be59b', '#8ad0ff', '#b39bff'];
    c.lineWidth = 9; c.globalAlpha = 0.32;
    cols.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(300, 560, 330 - i * 9, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); });
    c.globalAlpha = 1;
    // tall far cloud towers
    const r = rng(11);
    for (const [x, y, w, h, a] of [[-40, 470, 380, 210, 0.55], [600, 480, 420, 250, 0.5], [300, 500, 360, 150, 0.6]] as [number, number, number, number, number][]) {
      c.globalAlpha = a; cloud(c, x, y, w, h, r, '#ffffff', '#ffd2c6'); c.globalAlpha = 1;
    }
    for (const [x, y, w] of [[90, 90, 150], [420, 60, 110], [560, 190, 130], [190, 220, 90]] as [number, number, number][]) {
      c.globalAlpha = 0.75; cloud(c, x, y, w, w * 0.28, r, '#ffffff', '#e2ecff'); c.globalAlpha = 1;
    }
  }));
}

function far(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_far`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(41);
    // distant floating islands (no outline, bluish)
    for (const [x, y, w] of [[80, 230, 170], [420, 170, 110], [700, 260, 210], [1060, 150, 130], [1340, 240, 180], [1680, 190, 140]] as [number, number, number][]) {
      wrapR(r, x - 10, w + 20, (xx, r) => {
        waterfall(c, xx + w * 0.62, y, 10, 150);
        island(c, xx, y, w, w * 0.55, r, '#8a9fd0', '#8fd0a6', false);
        c.fillStyle = '#7fb89a'; for (let k = 0; k < 3; k++) { c.beginPath(); ell(c, xx + w * (0.2 + k * 0.3), y - 14, 10, 12); c.fill(); }
      });
    }
    // small balloons and birds far away
    for (const [x, y, k] of [[300, 120, 0], [960, 90, 1], [1500, 130, 2], [1850, 80, 1]] as [number, number, number][]) {
      wrapR(r, x - 20, 40, (xx, r) => balloon(c, xx, y, 0.42, [['#ff9a8a', '#ffe08a', '#7a6aa0'], ['#8ad0ff', '#ffffff', '#7a6aa0'], ['#b39bff', '#ffd6e8', '#7a6aa0']][k], false));
    }
    for (const [x, y] of [[560, 90], [1240, 70], [1760, 300]] as [number, number][]) birds(c, x, y, 5, 'rgba(70,80,130,0.55)', r);
    // the sea of clouds
    for (let row = 0; row < 2; row++) {
      let x = -60;
      while (x < LAYER_W) {
        const w = 200 + r() * 220, h = 90 + r() * 70;
        wrapR(r, x, w, (xx, r) => cloud(c, xx, 470 + row * 50, w, h - row * 20, r, row ? '#ffffff' : '#fff1ea', row ? '#e4e2ff' : '#f7c9c0'));
        x += w * 0.7;
      }
    }
    c.fillStyle = lin(c, 380, VIEW_H, [[0, 'rgba(255,230,220,0)'], [1, 'rgba(255,240,235,0.7)']]); c.fillRect(0, 380, LAYER_W, VIEW_H - 380);
  }));
}

function mid(scene: Phaser.Scene): string {
  const RES = 1.5;
  return tex(scene, `${ID}_mid`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(77);
    // big islands with waterfalls, windmills and trees
    const isl: [number, number, number, number][] = [[60, 300, 260, 0], [520, 360, 200, 1], [880, 250, 300, 2], [1330, 330, 240, 0], [1680, 280, 200, 1]];
    for (const [x, y, w, kind] of isl) {
      wrapR(r, x - 20, w + 40, (xx, r) => {
        waterfall(c, xx + w * 0.72, y + 2, 14, 200);
        soft(c, 10, 6, 0.2);
        island(c, xx, y, w, w * 0.6, r, '#a98a78', '#7fcf6a', true);
        nosoft(c);
        if (kind === 0) windmill(c, xx + w * 0.35, y - 6, 1.4, true, '#f6efe0', '#fff4dc');
        if (kind === 1) {
          for (const t of [0.25, 0.5]) { c.fillStyle = '#6b4a2f'; c.fillRect(xx + w * t - 3, y - 30, 6, 26); c.fillStyle = '#5dbb63'; c.beginPath(); ell(c, xx + w * t, y - 38, 18, 16); ell(c, xx + w * t + 10, y - 30, 12, 10); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
        }
        if (kind === 2) {
          // a tiny cottage with a red roof
          c.fillStyle = '#f6efe0'; c.beginPath(); rr(c, xx + w * 0.2, y - 40, 50, 34, 3); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.fillStyle = '#e4572e'; c.beginPath(); c.moveTo(xx + w * 0.2 - 8, y - 38); c.lineTo(xx + w * 0.2 + 25, y - 64); c.lineTo(xx + w * 0.2 + 58, y - 38); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#ffd66b'; c.fillRect(xx + w * 0.2 + 10, y - 30, 10, 10); c.strokeRect(xx + w * 0.2 + 10, y - 30, 10, 10);
          windmill(c, xx + w * 0.62, y - 6, 1.1, true, '#e9d3b0', '#ffffff');
        }
        // flowers along the grass
        for (let k = 0; k < 5; k++) { c.fillStyle = ['#ff8aa8', '#ffe08a', '#ffffff'][k % 3]; c.beginPath(); ell(c, xx + 10 + r() * (w - 20), y - 8 - r() * 3, 2.6, 2.6); c.fill(); }
      });
    }
    // balloons, kites and an airship
    const bal: [number, number, number, string[]][] = [[400, 130, 1, ['#e4572e', '#ffd23f', '#8a5a34']], [1200, 110, 0.85, ['#1fa89a', '#fff4dc', '#8a5a34']], [1560, 150, 0.7, ['#6b3fa0', '#ffb6c8', '#8a5a34']]];
    for (const [x, y, s, cols] of bal) wrapR(r, x - 45 * s, 90 * s, (xx, r) => balloon(c, xx + 45 * s, y, s, cols, true));
    for (const [x, y, a, b] of [[300, 210, '#ff6b8a', '#ffd23f'], [1100, 220, '#4fb3ff', '#ffffff'], [1820, 200, '#9be59b', '#ff9a5a']] as [number, number, string, string][]) {
      wrapR(r, x - 20, 40, (xx, r) => { kite(c, xx, y, 1.1, a, b); c.lineWidth = 2; c.strokeStyle = INK; c.beginPath(); c.moveTo(xx, y - 20); c.lineTo(xx + 13, y); c.lineTo(xx, y + 26); c.lineTo(xx - 13, y); c.closePath(); c.stroke(); });
    }
    wrapR(r, 700, 140, (xx, r) => airship(c, xx + 70, 90, 1.2, '#f2b134', true));
    for (const [x, y] of [[230, 60], [1000, 180], [1450, 60]] as [number, number][]) birds(c, x, y, 4, 'rgba(29,26,51,0.75)', r);
    // cloud puffs at the bottom, near
    let x = -40;
    while (x < LAYER_W) {
      const w = 160 + r() * 160;
      wrapR(r, x, w, (xx, r) => cloud(c, xx, 560, w, 120 + r() * 50, r, '#ffffff', '#f0dcef'));
      x += w * 0.75;
    }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(150,200,255,0.25)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }, RES), RES);
}

/** The top of a floating island: a grass lip, a rocky body that tapers at the ends and cloud puffs around its foot. */
function ground(scene: Phaser.Scene, w: number): string {
  const key = `${ID}_ground_${w}`;
  if (scene.textures.exists(key)) return key;
  return tex(scene, key, mk(w, 120, (c) => {
    const r = rng(w * 7 + 3), H = 120;
    const taper = Math.min(60, w * 0.18);
    // the rocky underside
    c.beginPath(); c.moveTo(0, 14); c.lineTo(w, 14);
    c.lineTo(w - taper * 0.3, 60); c.lineTo(w - taper, H);
    c.lineTo(taper, H); c.lineTo(taper * 0.3, 60); c.closePath();
    c.fillStyle = lin(c, 14, H, [[0, '#b48c72'], [0.5, '#8d6a5a'], [1, '#5e4458']]); c.fill();
    c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.save(); c.clip();
    // strata and chunks
    c.strokeStyle = 'rgba(29,26,51,0.25)'; c.lineWidth = 2;
    for (let y = 36; y < H; y += 20) { c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 40) c.lineTo(x, y + (r() - 0.5) * 6); c.stroke(); }
    for (let x = 10; x < w; x += 50 + r() * 50) { c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); rr(c, x, 30 + r() * 50, 20 + r() * 16, 10, 4); c.fill(); }
    // hanging roots and vines
    c.strokeStyle = '#4e8a4a'; c.lineWidth = 2.5;
    for (let x = 20; x < w - 10; x += 34 + r() * 40) { const L = 14 + r() * 26; c.beginPath(); c.moveTo(x, 18); c.quadraticCurveTo(x + 6, 18 + L / 2, x - 2, 18 + L); c.stroke(); c.fillStyle = '#6fc06a'; c.beginPath(); ell(c, x - 2, 18 + L, 3, 2.4); c.fill(); }
    c.restore();
    // clouds around the foot
    for (let x = -20; x < w; x += 70 + r() * 50) cloud(c, x, H + 6, 90 + r() * 40, 34, r, '#ffffff', '#efe2f5');
    // the grass lip
    c.fillStyle = lin(c, 0, 22, [[0, '#9be27a'], [1, '#56b25a']]); c.beginPath(); rr(c, 0, 0, w, 22, 10); c.fill();
    c.fillStyle = '#56b25a';
    for (let x = 8; x < w - 8; x += 14 + r() * 10) { c.beginPath(); c.moveTo(x - 5, 21); c.lineTo(x, 27 + r() * 6); c.lineTo(x + 5, 21); c.fill(); }
    c.lineWidth = 3; c.strokeStyle = INK; c.beginPath(); rr(c, 0, 0, w, 22, 10); c.stroke();
    for (let x = 12; x < w - 12; x += 22 + r() * 30) { c.fillStyle = ['#ffffff', '#ffe08a', '#ff9ab8'][Math.floor(r() * 3)]; c.beginPath(); ell(c, x, 8 + r() * 6, 2.2, 2.2); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(8, 3, w - 16, 3);
  }));
}

/** 'plank': a small wooden airship deck with a propeller; 'awning': a cloud puff. */
function platform(scene: Phaser.Scene, w: number, style: 'plank' | 'awning', seed: number): string {
  const key = `${ID}_plat_${style}_${w}_${seed}`;
  if (scene.textures.exists(key)) return key;
  return tex(scene, key, mk(w, 42, (c) => {
    const r = rng(seed * 31 + w);
    if (style === 'plank') {
      const hull = ['#e4572e', '#1fa89a', '#6b3fa0', '#f2b134'][seed % 4];
      soft(c, 6, 4, 0.3);
      c.fillStyle = hull; c.beginPath(); c.moveTo(4, 16); c.lineTo(w - 4, 16); c.quadraticCurveTo(w - 10, 34, w / 2, 34); c.quadraticCurveTo(10, 34, 4, 16); c.closePath(); c.fill(); nosoft(c);
      c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(10, 19, w - 20, 3);
      c.fillStyle = '#ffd66b'; for (let x = 20; x < w - 20; x += 26) { c.beginPath(); ell(c, x, 25, 3, 3); c.fill(); c.lineWidth = 1.5; c.stroke(); }
      c.fillStyle = lin(c, 4, 16, [[0, '#d9a066'], [1, '#a8713f']]); c.beginPath(); rr(c, 1, 4, w - 2, 13, 3); c.fill(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = 'rgba(29,26,51,0.35)'; c.lineWidth = 1.4; for (let x = 16 + r() * 8; x < w - 6; x += 22) { c.beginPath(); c.moveTo(x, 5); c.lineTo(x, 16); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(4, 5, w - 8, 2.5);
      // a little propeller at the tail
      c.fillStyle = '#5a5a78'; c.beginPath(); ell(c, w - 2, 26, 2.5, 9); c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
    } else {
      soft(c, 7, 4, 0.22);
      c.fillStyle = lin(c, 2, 40, [[0, '#ffffff'], [0.6, '#f3f0ff'], [1, '#c9c2f0']]);
      c.beginPath(); rr(c, 3, 8, w - 6, 24, 12);
      const n = Math.max(3, Math.round(w / 34));
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; ell(c, 6 + (w - 12) * t, 24, (w - 12) / n * 0.62, 14 + r() * 4); }
      c.fill(); nosoft(c);
      c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#ffffff'; c.beginPath(); rr(c, 6, 9, w - 12, 12, 6); c.fill();
      c.fillStyle = 'rgba(160,150,220,0.35)'; c.beginPath(); rr(c, 12, 30, w - 24, 5, 2.5); c.fill();
    }
  }));
}

function lamp(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_lamp`, mk(76, 200, (c) => {
    const g = c.createRadialGradient(38, 40, 4, 38, 40, 36); g.addColorStop(0, 'rgba(255,236,150,0.9)'); g.addColorStop(1, 'rgba(255,236,150,0)'); c.fillStyle = g; c.fillRect(0, 0, 76, 80);
    c.fillStyle = '#8a5a34'; c.beginPath(); rr(c, 34, 50, 8, 146, 3); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    // a windsock
    c.fillStyle = '#ff6b4a'; c.beginPath(); c.moveTo(42, 64); c.lineTo(72, 68); c.lineTo(70, 80); c.lineTo(42, 84); c.closePath(); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(52, 65.5); c.lineTo(60, 66.6); c.lineTo(60, 81.5); c.lineTo(52, 82.6); c.closePath(); c.fill();
    c.fillStyle = '#6b4a2f'; c.beginPath(); rr(c, 24, 184, 28, 12, 4); c.fill(); c.stroke();
    // the lantern
    c.fillStyle = '#ffe9a0'; c.beginPath(); rr(c, 26, 22, 24, 28, 7); c.fill(); c.lineWidth = 3; c.stroke();
    c.fillStyle = '#1fa89a'; c.beginPath(); c.moveTo(22, 24); c.quadraticCurveTo(38, 2, 54, 24); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); ell(c, 38, 4, 4, 4); c.fill(); c.lineWidth = 2; c.stroke();
  }, 2), 2);
}

function props(scene: Phaser.Scene): string[] {
  const out: string[] = [];
  const add = (id: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => out.push(tex(scene, `${ID}_prop_${id}`, mk(w, h, f, 2), 2));
  add('windmill', 90, 120, (c) => windmill(c, 45, 118, 1.85, true, '#f6efe0', '#fff4dc'));
  add('balloon', 80, 130, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(40, 92); c.lineTo(24, 126); c.moveTo(40, 92); c.lineTo(56, 126); c.stroke();
    for (const x of [24, 56]) { c.fillStyle = '#6b4a2f'; c.beginPath(); rr(c, x - 3, 118, 6, 10, 2); c.fill(); c.stroke(); }
    balloon(c, 40, 38, 0.8, ['#ff8a5a', '#ffe08a', '#a8713f'], true);
  });
  add('dandelion', 70, 70, (c) => {
    for (const [x, h] of [[20, 50], [38, 62], [54, 40]] as [number, number][]) {
      c.strokeStyle = '#4e8a4a'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, 70); c.quadraticCurveTo(x - 4, 70 - h / 2, x, 70 - h); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.95)'; c.beginPath(); ell(c, x, 70 - h, 9, 9); c.fill(); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = 'rgba(29,26,51,0.3)'; c.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.beginPath(); c.moveTo(x, 70 - h); c.lineTo(x + Math.cos(a) * 8, 70 - h + Math.sin(a) * 8); c.stroke(); }
    }
    c.fillStyle = '#6fc06a'; c.beginPath(); c.moveTo(4, 70); c.quadraticCurveTo(14, 54, 26, 70); c.moveTo(40, 70); c.quadraticCurveTo(56, 52, 66, 70); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  });
  add('signpost', 80, 110, (c) => {
    c.fillStyle = '#8a5a34'; c.beginPath(); rr(c, 36, 20, 8, 88, 2); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    // cloud-shaped signs pointing both ways
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(42, 22); c.lineTo(72, 22); c.lineTo(78, 32); c.lineTo(72, 42); c.lineTo(42, 42); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#8ad0ff'; c.beginPath(); c.moveTo(38, 50); c.lineTo(8, 50); c.lineTo(2, 60); c.lineTo(8, 70); c.lineTo(38, 70); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#5a7ab8'; for (let k = 0; k < 3; k++) { c.beginPath(); ell(c, 50 + k * 8, 32, 2.4, 2.4); c.fill(); c.beginPath(); ell(c, 14 + k * 8, 60, 2.4, 2.4); c.fill(); }
    c.fillStyle = '#6fc06a'; c.beginPath(); ell(c, 40, 108, 18, 6); c.fill(); c.lineWidth = 2; c.stroke();
  });
  add('chimes', 60, 116, (c) => {
    c.fillStyle = '#6b4a2f'; c.beginPath(); rr(c, 8, 10, 6, 104, 2); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.beginPath(); rr(c, 8, 10, 48, 6, 2); c.fill(); c.stroke();
    const cols = ['#8ad0ff', '#b39bff', '#ffb6c8', '#9be59b'];
    for (let k = 0; k < 4; k++) {
      const x = 22 + k * 10, L = 24 + k * 6; c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(x, 16); c.lineTo(x, 22); c.stroke();
      c.fillStyle = cols[k]; c.beginPath(); rr(c, x - 2.5, 22, 5, L, 2); c.fill(); c.lineWidth = 1.6; c.stroke();
    }
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(34, 64); c.lineTo(42, 72); c.lineTo(34, 80); c.lineTo(26, 72); c.closePath(); c.fill(); c.lineWidth = 1.6; c.stroke();
  });
  add('birdhouse', 70, 116, (c) => {
    c.fillStyle = '#8a5a34'; c.beginPath(); rr(c, 31, 50, 8, 64, 2); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#7ec8e3'; c.beginPath(); rr(c, 14, 24, 42, 34, 4); c.fill(); c.stroke();
    c.fillStyle = '#e4572e'; c.beginPath(); c.moveTo(6, 28); c.lineTo(35, 4); c.lineTo(64, 28); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); ell(c, 35, 40, 7, 7); c.fill();
    c.fillStyle = '#ffd23f'; c.beginPath(); ell(c, 54, 20, 7, 6); c.fill(); c.lineWidth = 1.8; c.stroke();
    c.fillStyle = '#ff9a3a'; c.beginPath(); c.moveTo(60, 19); c.lineTo(66, 21); c.lineTo(60, 23); c.fill();
    c.fillStyle = INK; c.beginPath(); ell(c, 56, 18, 1.4, 1.4); c.fill();
  });
  return out;
}

function bunting(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_bunting`, mk(200, 40, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    const cols = ['#ff8a8a', '#ffc27a', '#fff08a', '#9be59b', '#8ad0ff', '#b39bff', '#ffb6c8'];
    for (let i = 1; i < 8; i++) {
      const t = i / 8, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6;
      c.fillStyle = cols[i - 1]; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8, y + 9); c.lineTo(x, y + 20); c.lineTo(x - 8, y + 9); c.closePath(); c.fill(); c.lineWidth = 1.8; c.stroke();
      c.strokeStyle = 'rgba(29,26,51,0.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y + 20); c.quadraticCurveTo(x + 4, y + 24, x - 1, y + 28); c.stroke(); c.strokeStyle = INK;
    }
  }, 2), 2);
}

function ambient(scene: Phaser.Scene): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig & { texture: string } {
  const key = tex(scene, `${ID}_feather`, mk(16, 8, (c) => {
    c.fillStyle = '#ffffff'; c.beginPath(); ell(c, 8, 4, 7, 2.8, 0.2); c.fill();
    c.strokeStyle = 'rgba(180,170,220,0.9)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(1, 5); c.lineTo(15, 3); c.stroke();
  }));
  return {
    texture: key, x: { min: 0, max: VIEW_W }, y: { min: 0, max: VIEW_H }, lifespan: 6000, frequency: 160, quantity: 1,
    speedX: { min: 10, max: 34 }, speedY: { min: 4, max: 20 }, rotate: { min: 0, max: 360 }, scale: { min: 0.6, max: 1.2 },
    alpha: { start: 0.85, end: 0 }, tint: [0xffffff, 0xffd6e8, 0xfff0c8, 0xd8ecff],
  };
}

function overlay(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_overlay`, mk(VIEW_W, VIEW_H, (c) => {
    // warm light rays from the sun, very faint
    c.globalCompositeOperation = 'lighter';
    for (const [a, w] of [[2.2, 0.06], [2.45, 0.04], [2.7, 0.07], [2.95, 0.035]] as [number, number][]) {
      c.fillStyle = 'rgba(255,240,200,0.05)'; c.beginPath(); c.moveTo(760, 120); c.lineTo(760 + Math.cos(a - w) * 1200, 120 + Math.sin(a - w) * 1200); c.lineTo(760 + Math.cos(a + w) * 1200, 120 + Math.sin(a + w) * 1200); c.closePath(); c.fill();
    }
  }));
}

registerWorld({ id: ID, name: 'מעל העננים', sky, far, mid, ground, platform, lamp, props, bunting, ambient, overlay });
