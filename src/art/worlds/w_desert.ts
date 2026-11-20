/** מדבר החול: a hot golden desert of layered dunes, mesas, far pyramids, oasis palms, cacti, camels and striped tents. */
import * as Phaser from 'phaser';
import { registerWorld, mk, tex, lin, soft, nosoft, wrap, rng, VIEW_W, VIEW_H, LAYER_W } from '../world';
import { INK, ell, rr, shade } from '../puppet';

const once = (sc: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (c: CanvasRenderingContext2D) => void): string =>
  sc.textures.exists(key) ? key : tex(sc, key, mk(w, h, draw, res), res);
const TAU = Math.PI * 2;
const RUG = ['#c8452f', '#1f7a8c', '#f2b134', '#7a3b6e', '#2f4f8f'];

const wave = (x: number, parts: [number, number, number][]) => parts.reduce((s, [k, a, p]) => s + a * Math.sin((x / LAYER_W) * TAU * k + p), 0);
function dune(c: CanvasRenderingContext2D, y0: number, parts: [number, number, number][], fill: string | CanvasGradient, crest?: string): void {
  c.beginPath(); c.moveTo(0, VIEW_H);
  for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, y0 + wave(x, parts));
  c.lineTo(LAYER_W, VIEW_H); c.closePath(); c.fillStyle = fill; c.fill();
  if (crest) { c.strokeStyle = crest; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, y0 + 2 + wave(x, parts)); c.stroke(); }
}
/** A friendly camel facing right, feet at (x, y). */
function camel(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, lw: number, blanket?: string): void {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = lw / s;
  const legs = () => { c.beginPath(); for (const lx of [-24, -14, 14, 24]) rr(c, lx - 3, -42, 6, 42, 2.5); };
  legs(); c.fill(); if (lw) c.stroke();
  c.beginPath(); ell(c, 0, -48, 30, 14); ell(c, -6, -62, 15, 13); c.moveTo(20, -58); c.quadraticCurveTo(32, -54, 36, -84); c.lineTo(46, -88); c.lineTo(54, -82); c.lineTo(46, -77); c.quadraticCurveTo(42, -50, 26, -40); c.closePath();
  c.fill(); if (lw) c.stroke();
  c.beginPath(); ell(c, 0, -48, 29, 13); ell(c, -6, -62, 14, 12); c.fill();
  if (blanket) { c.fillStyle = blanket; c.beginPath(); rr(c, -20, -64, 26, 22, 4); c.fill(); if (lw) c.stroke(); c.fillStyle = '#f2b134'; c.fillRect(-20, -46, 26, 3); }
  if (lw) { c.fillStyle = INK; c.beginPath(); ell(c, 45, -84, 1.6, 1.6); c.fill(); c.strokeStyle = INK; c.lineWidth = 2 / s; c.beginPath(); c.moveTo(-30, -50); c.quadraticCurveTo(-36, -40, -33, -32); c.stroke(); }
  c.restore();
}
/** An oasis palm: a curved trunk and a crown of fronds. */
function palm(c: CanvasRenderingContext2D, x: number, y: number, h: number, lean: number, lw: number, tr: string, leaf: string): void {
  const tx = x + lean, ty = y - h;
  c.strokeStyle = INK; c.lineCap = 'round';
  if (lw) { c.lineWidth = 10 + lw * 2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * 0.1, y - h * 0.6, tx, ty); c.stroke(); }
  c.strokeStyle = tr; c.lineWidth = 10; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + lean * 0.1, y - h * 0.6, tx, ty); c.stroke();
  c.strokeStyle = shade(tr, -0.3); c.lineWidth = 2;
  for (let t = 0.1; t < 0.95; t += 0.09) { const px = (1 - t) * (1 - t) * x + 2 * t * (1 - t) * (x + lean * 0.1) + t * t * tx, py = (1 - t) * (1 - t) * y + 2 * t * (1 - t) * (y - h * 0.6) + t * t * ty; c.beginPath(); c.moveTo(px - 5, py); c.lineTo(px + 5, py - 3); c.stroke(); }
  for (const [a, L] of [[-2.9, 46], [-2.3, 42], [-1.5, 30], [-0.8, 42], [-0.2, 46], [0.4, 34], [2.6, 34]] as [number, number][]) {
    const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.7 + 14;
    const mx = tx + Math.cos(a) * L * 0.5, my = ty + Math.sin(a) * L * 0.5 - 10;
    c.fillStyle = leaf; c.beginPath(); c.moveTo(tx, ty); c.quadraticCurveTo(mx, my - 15, ex, ey); c.quadraticCurveTo(mx + 2, my + 9, tx, ty); c.fill();
    if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }
  }
  c.fillStyle = '#7a4a26'; c.beginPath(); ell(c, tx - 4, ty + 4, 4, 4); ell(c, tx + 4, ty + 5, 4, 4); c.fill();
}
function cactus(c: CanvasRenderingContext2D, x: number, y: number, h: number, col: string, lw: number): void {
  const arm = (side: number, ay: number, len: number) => { c.beginPath(); c.moveTo(x + side * 6, y - ay); c.lineTo(x + side * 20, y - ay); c.arcTo(x + side * 26, y - ay, x + side * 26, y - ay - 6, 6); c.lineTo(x + side * 26, y - ay - len); };
  c.lineCap = 'round';
  for (const [side, ay, len] of [[-1, h * 0.45, h * 0.3], [1, h * 0.6, h * 0.26]] as [number, number, number][]) {
    if (lw) { arm(side, ay, len); c.strokeStyle = INK; c.lineWidth = 12 + lw * 2; c.stroke(); }
    arm(side, ay, len); c.strokeStyle = col; c.lineWidth = 12; c.stroke();
  }
  c.fillStyle = col; c.beginPath(); rr(c, x - 9, y - h, 18, h, 9); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.strokeStyle = shade(col, -0.25); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - 3, y - h + 8); c.lineTo(x - 3, y - 2); c.moveTo(x + 3, y - h + 8); c.lineTo(x + 3, y - 2); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x - 6, y - h + 8, 2.5, h - 16);
}
function tent(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: string, b: string, lw: number): void {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x0 = x - w / 2 + (w / n) * i, x1 = x0 + w / n;
    c.fillStyle = i % 2 ? b : a; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x0, y); c.lineTo(x1, y); c.closePath(); c.fill();
  }
  c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - w / 2, y); c.lineTo(x + w / 2, y); c.closePath();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.fillStyle = '#3a1e14'; c.beginPath(); c.moveTo(x, y - h * 0.55); c.lineTo(x - w * 0.14, y); c.lineTo(x + w * 0.14, y); c.closePath(); c.fill();
  c.strokeStyle = '#5a3a20'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x, y - h - 12); c.stroke();
  c.fillStyle = a; c.beginPath(); c.moveTo(x, y - h - 12); c.lineTo(x + 12, y - h - 8); c.lineTo(x, y - h - 4); c.fill();
}
function jar(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string): void {
  c.fillStyle = lin(c, y - 40 * s, y, [[0, shade(col, 0.2)], [1, shade(col, -0.25)]]);
  c.beginPath(); c.moveTo(x - 7 * s, y - 40 * s); c.lineTo(x + 7 * s, y - 40 * s); c.lineTo(x + 6 * s, y - 34 * s); c.bezierCurveTo(x + 22 * s, y - 28 * s, x + 20 * s, y - 4 * s, x + 9 * s, y); c.lineTo(x - 9 * s, y); c.bezierCurveTo(x - 20 * s, y - 4 * s, x - 22 * s, y - 28 * s, x - 6 * s, y - 34 * s); c.closePath(); c.fill();
  c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
  c.strokeStyle = '#3a1e14'; c.lineWidth = 2; c.beginPath(); c.moveTo(x - 16 * s, y - 20 * s); c.lineTo(x + 16 * s, y - 20 * s); c.stroke();
  c.strokeStyle = '#f6e3b8'; c.lineWidth = 1.8; c.beginPath(); for (let k = 0; k < 7; k++) { c.lineTo(x - 14 * s + k * 4.6 * s, y - (k % 2 ? 14 : 18) * s); } c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); ell(c, x - 8 * s, y - 24 * s, 2.5 * s, 6 * s, 0.2); c.fill();
}

registerWorld({
  id: 'desert', name: 'מדבר החול',

  sky: (sc) => once(sc, 'desert_sky', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#4f9ad8'], [0.38, '#9fd0e6'], [0.62, '#ffe0a0'], [1, '#ffb066']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const sx = 250, sy = 190;
    const g = c.createRadialGradient(sx, sy, 20, sx, sy, 380); g.addColorStop(0, 'rgba(255,250,215,1)'); g.addColorStop(0.2, 'rgba(255,226,150,0.65)'); g.addColorStop(1, 'rgba(255,190,110,0)');
    c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.fillStyle = 'rgba(255,240,190,0.5)'; c.beginPath(); ell(c, sx, sy, 112, 112); c.fill();
    c.fillStyle = '#fff6d6'; c.beginPath(); ell(c, sx, sy, 92, 92); c.fill();
        // long thin clouds
    for (const [x, y, w] of [[560, 90, 260], [760, 140, 180], [80, 70, 160], [640, 210, 140]] as [number, number, number][]) {
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); rr(c, x, y, w, 9, 4.5); rr(c, x + w * 0.2, y - 7, w * 0.5, 9, 4.5); c.fill();
    }
    // heat haze shimmer bands over the horizon
    c.strokeStyle = 'rgba(255,240,210,0.35)'; c.lineWidth = 2;
    for (let y = 330; y < 470; y += 14) { c.beginPath(); for (let x = 0; x <= VIEW_W; x += 12) c.lineTo(x, y + Math.sin(x * 0.045 + y) * 2.5); c.stroke(); }
    // two birds
    c.strokeStyle = 'rgba(80,60,60,0.6)'; c.lineWidth = 2;
    for (const [x, y] of [[620, 260], [650, 245]]) { c.beginPath(); c.moveTo(x - 8, y - 3); c.quadraticCurveTo(x - 4, y - 6, x, y); c.quadraticCurveTo(x + 4, y - 6, x + 8, y - 3); c.stroke(); }
  }),

  far: (sc) => once(sc, 'desert_far', LAYER_W, VIEW_H, 1, (c) => {
    const r = rng(41);
    // the farthest mesas
    let x = -60;
    while (x < LAYER_W) {
      const w = 120 + r() * 160, h = 60 + r() * 90, col = '#e3a879';
      wrap(LAYER_W, x, w, (xx) => {
        c.fillStyle = col; c.beginPath(); c.moveTo(xx, 400); c.lineTo(xx + w * 0.12, 400 - h); c.lineTo(xx + w * 0.88, 400 - h); c.lineTo(xx + w, 400); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,230,190,0.4)'; c.fillRect(xx + w * 0.12, 400 - h, w * 0.76, 5);
        c.fillStyle = 'rgba(160,80,60,0.25)'; c.fillRect(xx + w * 0.08, 400 - h * 0.6, w * 0.84, 6); c.fillRect(xx + w * 0.04, 400 - h * 0.3, w * 0.92, 5);
      });
      x += w + 100 + r() * 220;
    }
    // two pyramids with a lit face and a shadow face
    for (const [px, ph] of [[620, 170], [760, 110], [1560, 140]] as [number, number][]) wrap(LAYER_W, px - ph, ph * 2, (xx) => {
      const cx = xx + ph;
      c.fillStyle = '#f1c487'; c.beginPath(); c.moveTo(cx, 410 - ph); c.lineTo(cx - ph * 1.05, 410); c.lineTo(cx + ph * 0.25, 410); c.closePath(); c.fill();
      c.fillStyle = '#c98858'; c.beginPath(); c.moveTo(cx, 410 - ph); c.lineTo(cx + ph * 0.25, 410); c.lineTo(cx + ph * 1.05, 410); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(150,90,60,0.25)'; c.lineWidth = 1.5; for (let k = 1; k < 7; k++) { const y = 410 - ph + (ph / 7) * k, hw = (ph / 7) * k * 1.05; c.beginPath(); c.moveTo(cx - hw, y); c.lineTo(cx + hw, y); c.stroke(); }
    });
    // far dunes and a camel caravan on a crest
    dune(c, 420, [[2, 14, 0.5], [5, 9, 1.4], [9, 4, 0.2]], '#efb87a');
    for (let i = 0; i < 4; i++) wrap(LAYER_W, 1040 + i * 46, 50, (xx) => camel(c, xx, 414 + wave(1040 + i * 46, [[2, 14, 0.5], [5, 9, 1.4], [9, 4, 0.2]]), 0.42, '#a8693f', 0));
    dune(c, 450, [[3, 12, 2.4], [7, 7, 0.9]], '#f4c58a');
    c.fillStyle = lin(c, 330, VIEW_H, [[0, 'rgba(255,214,160,0)'], [0.6, 'rgba(255,214,160,0.55)'], [1, '#ffd6a0']]); c.fillRect(0, 330, LAYER_W, VIEW_H - 330);
  }),

  mid: (sc) => once(sc, 'desert_mid', LAYER_W, VIEW_H, 1.5, (c) => {
    const r = rng(53), base = 482;
    const D1: [number, number, number][] = [[2, 26, 1.1], [5, 14, 0.2], [11, 5, 2.2]];
    dune(c, 410, D1, lin(c, 360, 482, [[0, '#f7cf8f'], [1, '#e7a865']]), 'rgba(255,245,215,0.7)');
    // wind-carved rock arches and stacks on the back dune
    for (const ax of [260, 1180]) wrap(LAYER_W, ax - 90, 180, (xx) => {
      const y = 430 + wave(ax, D1);
      c.fillStyle = '#c4683f'; c.beginPath(); c.moveTo(xx - 90, y + 30); c.lineTo(xx - 82, y - 120); c.quadraticCurveTo(xx - 70, y - 160, xx - 20, y - 158); c.lineTo(xx + 40, y - 152); c.quadraticCurveTo(xx + 88, y - 140, xx + 84, y - 90); c.lineTo(xx + 92, y + 30); c.lineTo(xx + 50, y + 30); c.lineTo(xx + 46, y - 60); c.quadraticCurveTo(xx, y - 120, xx - 44, y - 60); c.lineTo(xx - 48, y + 30); c.closePath(); c.fill();
      c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(255,200,150,0.45)'; c.fillRect(xx - 80, y - 150, 150, 6);
      c.strokeStyle = 'rgba(120,50,30,0.4)'; c.lineWidth = 2; for (const dy of [-110, -80, -30]) { c.beginPath(); c.moveTo(xx - 84, y + dy); c.lineTo(xx - 50, y + dy + 4); c.moveTo(xx + 48, y + dy); c.lineTo(xx + 86, y + dy - 3); c.stroke(); }
    });
    for (const sx of [720, 1620]) wrap(LAYER_W, sx - 40, 80, (xx) => {
      const y = 440 + wave(sx, D1);
      c.fillStyle = '#b85f3a'; c.beginPath(); c.moveTo(xx - 30, y + 20); c.lineTo(xx - 22, y - 100); c.lineTo(xx - 32, y - 130); c.lineTo(xx + 28, y - 134); c.lineTo(xx + 20, y - 100); c.lineTo(xx + 30, y + 20); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(255,200,150,0.4)'; c.fillRect(xx - 30, y - 132, 56, 5);
    });
    const D2: [number, number, number][] = [[3, 12, 0.7], [7, 6, 2.6]];
    dune(c, 454, D2, lin(c, 430, 482, [[0, '#ffd99c'], [1, '#f0b878']]), 'rgba(255,248,225,0.8)');
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 454 + wave(x, D2)); c.stroke();
    // ripples on the front dune
    c.strokeStyle = 'rgba(190,120,60,0.35)'; c.lineWidth = 1.5;
    for (let i = 0; i < 90; i++) { const x = r() * LAYER_W, y = 466 + wave(x, D2) + r() * 14; c.beginPath(); c.moveTo(x - 12, y); c.quadraticCurveTo(x, y - 3, x + 12, y); c.stroke(); }
    // the oasis: a pond with palms and a striped tent
    for (const ox of [520, 1480]) wrap(LAYER_W, ox - 200, 400, (xx) => {
      c.fillStyle = '#2fa3b8'; c.beginPath(); ell(c, xx, base - 6, 110, 14); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(xx - 60, base - 9, 40, 2.5); c.fillRect(xx + 10, base - 5, 50, 2.5);
      palm(c, xx - 70, base - 10, 150, -26, 2, '#a8743f', '#3fa36a');
      palm(c, xx + 80, base - 10, 120, 30, 2, '#9a6838', '#4cb874');
      palm(c, xx - 10, base - 12, 95, 12, 2, '#a8743f', '#5cc47e');
      for (const [bx, bs] of [[-100, 1], [110, 0.8]] as [number, number][]) { c.fillStyle = '#4c9a4a'; c.beginPath(); ell(c, xx + bx, base - 8, 16 * bs, 10 * bs); ell(c, xx + bx + 12, base - 6, 12 * bs, 8 * bs); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); }
    });
    let x = 40;
    while (x < LAYER_W - 40) {
      const k = r(), at = x;
      if ((at > 360 && at < 680) || (at > 1320 && at < 1640)) { x += 60; continue; }
      if (k < 0.35) { const h = 70 + r() * 50; wrap(LAYER_W, at - 30, 60, (xx) => cactus(c, xx, base, h, '#4f9a55', 2)); x += 70 + r() * 60; }
      else if (k < 0.6) { const w = 110 + r() * 30, cols = r() < 0.5 ? ['#c8452f', '#fff0d6'] : ['#1f7a8c', '#ffe7b8']; const th = 82 + r() * 10; wrap(LAYER_W, at - w / 2, w, (xx) => tent(c, xx, base, w, th, cols[0], cols[1], 2)); x += w + 40 + r() * 40; }
      else if (k < 0.8) { wrap(LAYER_W, at - 30, 70, (xx) => { jar(c, xx, base, 1, '#c86a3c'); jar(c, xx + 26, base, 0.75, '#e0a050'); jar(c, xx - 22, base, 0.6, '#a85a34'); }); x += 90 + r() * 40; }
      else { const bl = RUG[Math.floor(r() * 5)]; wrap(LAYER_W, at - 40, 80, (xx) => camel(c, xx, base, 0.95, '#c98a52', 2, bl)); x += 110 + r() * 50; }
    }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(230,150,90,0.3)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }),

  ground: (sc, w) => once(sc, `desert_ground_${w}`, w, 120, 1, (c) => {
    const r = rng(w * 17 + 3);
    // sandstone body in strata
    c.fillStyle = lin(c, 0, 120, [[0, '#d99055'], [1, '#7a3e24']]); c.fillRect(0, 0, w, 120);
    const bands: [number, string][] = [[40, 'rgba(255,200,140,0.25)'], [62, 'rgba(120,50,30,0.25)'], [84, 'rgba(255,190,130,0.18)'], [104, 'rgba(90,30,20,0.3)']];
    for (const [y, col] of bands) { c.fillStyle = col; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 20) c.lineTo(x, y + Math.sin(x * 0.02 + y) * 3); c.lineTo(w, y + 9); c.lineTo(0, y + 9); c.fill(); }
    c.strokeStyle = 'rgba(70,25,15,0.4)'; c.lineWidth = 2;
    for (let x = 20; x < w; x += 70 + r() * 80) { const y = 40 + r() * 60; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8, y + 10); c.lineTo(x + 4, y + 22); c.stroke(); }
    for (let i = 0; i < w / 40; i++) { c.fillStyle = 'rgba(80,30,20,0.35)'; c.beginPath(); ell(c, r() * w, 36 + r() * 80, 3 + r() * 4, 2 + r() * 2); c.fill(); }
    // the sand lip with a wavy underside
    c.fillStyle = lin(c, 0, 26, [[0, '#ffe2a6'], [1, '#f2be7c']]); c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0);
    for (let x = w; x >= 0; x -= 10) c.lineTo(x, 22 + Math.sin(x * 0.06) * 3 + Math.sin(x * 0.17) * 2);
    c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(190,120,60,0.45)'; c.lineWidth = 1.6;
    for (let x = 6; x < w; x += 26 + r() * 10) { const y = 9 + r() * 7; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 3, x + 16, y); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(0, 2, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }),

  platform: (sc, w, style, seed) => once(sc, `desert_plat_${style}_${w}_${seed}`, w, 40, 1, (c) => {
    if (style === 'plank') {
      // a carved sandstone slab
      soft(c, 6, 4, 0.3); c.fillStyle = lin(c, 4, 30, [[0, '#f3c88c'], [1, '#c98852']]); c.beginPath(); rr(c, 2, 4, w - 4, 26, 5); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = 'rgba(255,245,215,0.6)'; c.fillRect(6, 6, w - 12, 3);
      c.strokeStyle = 'rgba(120,60,30,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, 19); for (let x = 8; x < w - 8; x += 12) { c.lineTo(x + 6, 14); c.lineTo(x + 12, 19); } c.stroke();
      c.lineWidth = 1.5; for (let x = w * 0.33; x < w - 6; x += w * 0.33) { c.beginPath(); c.moveTo(x, 6); c.lineTo(x - 2, 28); c.stroke(); }
      c.fillStyle = 'rgba(120,60,30,0.3)'; c.beginPath(); c.moveTo(w * 0.5, 30); c.lineTo(w * 0.5 + 8, 38); c.lineTo(w * 0.5 + 16, 30); c.fill();
    } else {
      // a woven rug awning on two poles, with a fringe
      const a = RUG[seed % RUG.length], b = RUG[(seed + 2) % RUG.length];
      c.fillStyle = '#6b3f22'; for (const x of [6, w - 10]) { c.fillRect(x, 4, 4, 34); }
      soft(c, 6, 4, 0.3); c.fillStyle = a; c.beginPath(); rr(c, 2, 4, w - 4, 18, 3); c.fill(); nosoft(c);
      c.fillStyle = '#fff0d0'; c.fillRect(2, 8, w - 4, 2.5); c.fillRect(2, 17, w - 4, 2.5);
      c.fillStyle = b; for (let x = 10; x < w - 10; x += 16) { c.beginPath(); c.moveTo(x, 13.5); c.lineTo(x + 4, 11); c.lineTo(x + 8, 13.5); c.lineTo(x + 4, 16); c.closePath(); c.fill(); }
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); rr(c, 2, 4, w - 4, 18, 3); c.stroke();
      c.strokeStyle = '#f2b134'; c.lineWidth = 2; for (let x = 6; x < w - 4; x += 6) { c.beginPath(); c.moveTo(x, 23); c.lineTo(x, 29); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(6, 5.5, w - 12, 2);
    }
  }),

  lamp: (sc) => once(sc, 'desert_lamp', 70, 200, 2, (c) => {
    const g = c.createRadialGradient(35, 46, 4, 35, 46, 38); g.addColorStop(0, 'rgba(255,214,120,0.9)'); g.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = g; c.fillRect(0, 6, 70, 80);
    c.fillStyle = '#6b3f22'; c.beginPath(); rr(c, 31, 74, 8, 116, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#c4683f'; c.beginPath(); c.moveTo(18, 198); c.lineTo(22, 184); c.lineTo(48, 184); c.lineTo(52, 198); c.closePath(); c.fill(); c.stroke();
    // a pierced brass lantern
    c.fillStyle = '#d99a2b'; c.beginPath(); c.moveTo(35, 14); c.lineTo(46, 30); c.lineTo(24, 30); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffe39a'; c.beginPath(); c.moveTo(24, 30); c.lineTo(46, 30); c.lineTo(50, 50); c.lineTo(44, 68); c.lineTo(26, 68); c.lineTo(20, 50); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#b8761c'; c.fillRect(22, 46, 26, 4); c.strokeRect(22, 46, 26, 4);
    c.fillStyle = '#c4683f'; for (const [x, y] of [[30, 38], [40, 38], [30, 58], [40, 58], [35, 40]]) { c.beginPath(); ell(c, x, y, 1.6, 2.6); c.fill(); }
    c.fillStyle = '#d99a2b'; c.beginPath(); rr(c, 26, 68, 18, 8, 3); c.fill(); c.stroke();
    c.beginPath(); ell(c, 35, 11, 3, 3); c.fill(); c.lineWidth = 2; c.stroke();
  }),

  props: (sc) => [
    once(sc, 'desert_cactus', 70, 120, 2, (c) => {
      cactus(c, 35, 112, 100, '#4f9a55', 3);
      c.fillStyle = '#ff7fae'; c.beginPath(); ell(c, 35, 13, 6, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#d9a46a'; c.beginPath(); ell(c, 35, 114, 26, 6); c.fill(); c.lineWidth = 2.5; c.stroke();
    }),
    once(sc, 'desert_jars', 100, 70, 2, (c) => { jar(c, 34, 68, 1.4, '#c86a3c'); jar(c, 72, 68, 1.05, '#e0a050'); jar(c, 88, 68, 0.6, '#1f7a8c'); }),
    once(sc, 'desert_palm', 110, 130, 2, (c) => {
      palm(c, 52, 124, 100, 10, 2.5, '#a8743f', '#3fa36a');
      c.fillStyle = '#d9a46a'; c.beginPath(); ell(c, 52, 125, 22, 5); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
    }),
    once(sc, 'desert_tent', 120, 100, 2, (c) => { tent(c, 60, 98, 110, 80, '#c8452f', '#fff0d6', 3); }),
    once(sc, 'desert_camel', 110, 100, 2, (c) => { camel(c, 46, 98, 1, '#d29a5e', 3, '#1f7a8c'); }),
    once(sc, 'desert_rocks', 100, 56, 2, (c) => {
      c.fillStyle = lin(c, 6, 54, [[0, '#d98a5a'], [1, '#9a4f30']]); c.beginPath(); c.moveTo(4, 54); c.lineTo(10, 24); c.lineTo(30, 8); c.lineTo(52, 12); c.lineTo(60, 30); c.lineTo(62, 54); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = 'rgba(255,220,180,0.5)'; c.beginPath(); c.moveTo(12, 24); c.lineTo(30, 11); c.lineTo(50, 14); c.lineTo(30, 18); c.closePath(); c.fill();
      // a round barrel cactus with a flower
      c.fillStyle = '#5aa860'; c.beginPath(); ell(c, 78, 40, 17, 15); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(29,60,30,0.45)'; c.lineWidth = 1.5; for (const dx of [-8, 0, 8]) { c.beginPath(); c.moveTo(78 + dx, 27); c.quadraticCurveTo(78 + dx * 1.4, 40, 78 + dx, 54); c.stroke(); }
      c.fillStyle = '#ffd23f'; c.beginPath(); ell(c, 78, 25, 5, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#d9a46a'; c.beginPath(); ell(c, 50, 54, 46, 3); c.fill();
    }),
  ],

  bunting: (sc) => once(sc, 'desert_bunting', 200, 40, 2, (c) => {
    c.strokeStyle = '#5a3a20'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    for (let i = 1; i < 10; i++) {
      const t = i / 10, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6;
      c.fillStyle = RUG[i % RUG.length]; c.beginPath(); rr(c, x - 7, y, 14, 18, 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.8; c.stroke();
      c.fillStyle = '#fff0d0'; c.fillRect(x - 7, y + 5, 14, 2); c.fillRect(x - 7, y + 11, 14, 2);
      c.strokeStyle = '#f2b134'; c.lineWidth = 1.2; for (let k = -5; k <= 5; k += 2.5) { c.beginPath(); c.moveTo(x + k, y + 18); c.lineTo(x + k, y + 22); c.stroke(); }
    }
  }),

  ambient: (sc) => {
    const t = once(sc, 'desert_speck', 6, 3, 1, (c) => { c.fillStyle = '#fff'; c.beginPath(); ell(c, 3, 1.5, 3, 1.5); c.fill(); });
    return {
      texture: t, x: { min: 0, max: VIEW_W }, y: { min: 120, max: VIEW_H }, lifespan: 3500, frequency: 70, quantity: 1,
      speedX: { min: -220, max: -110 }, speedY: { min: -8, max: 14 }, scale: { min: 0.5, max: 1.3 },
      alpha: { start: 0.6, end: 0 }, tint: [0xffe2a6, 0xf2be7c, 0xffffff],
    };
  },

  overlay: (sc) => once(sc, 'desert_overlay', VIEW_W, VIEW_H, 1, (c) => {
    // warm sun glare from the upper left and a faint heat at the bottom
    const g = c.createRadialGradient(140, 60, 10, 140, 60, 520); g.addColorStop(0, 'rgba(255,236,180,0.28)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.fillStyle = lin(c, 380, VIEW_H, [[0, 'rgba(255,170,90,0)'], [1, 'rgba(255,170,90,0.12)']]); c.fillRect(0, 380, VIEW_W, VIEW_H - 380);
  }),
});
