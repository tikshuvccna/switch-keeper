/** ארץ הממתקים: a pastel sweets land of frosting hills, gumdrop mountains, lollipops, candy canes and gingerbread houses. */
import * as Phaser from 'phaser';
import { registerWorld, mk, tex, lin, soft, nosoft, wrap, rng, VIEW_W, VIEW_H, LAYER_W } from '../world';
import { INK, ell, rr, shade } from '../puppet';

const once = (sc: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (c: CanvasRenderingContext2D) => void): string =>
  sc.textures.exists(key) ? key : tex(sc, key, mk(w, h, draw, res), res);
const TAU = Math.PI * 2;
const SWEET = ['#ff6fae', '#5fd3b0', '#ffd23f', '#9b7bff', '#ff9b5c', '#62b6ff'];

/** A wavy seamless line: sum of sines whose periods divide the layer width. */
const wave = (x: number, parts: [number, number, number][]) => parts.reduce((s, [k, a, p]) => s + a * Math.sin((x / LAYER_W) * TAU * k + p), 0);
function hill(c: CanvasRenderingContext2D, y0: number, parts: [number, number, number][], fill: string | CanvasGradient, bottom = VIEW_H): void {
  c.beginPath(); c.moveTo(0, bottom);
  for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, y0 + wave(x, parts));
  c.lineTo(LAYER_W, bottom); c.closePath(); c.fillStyle = fill; c.fill();
}
function swirl(c: CanvasRenderingContext2D, x: number, y: number, R: number, a: string, b: string, lw: number): void {
  c.fillStyle = a; c.beginPath(); ell(c, x, y, R, R); c.fill();
  c.strokeStyle = b; c.lineWidth = R * 0.13; c.beginPath();
  for (let t = 0; t < 3.2 * TAU; t += 0.15) { const r = (t / (3.2 * TAU)) * R * 0.9; c.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); }
  c.stroke();
  if (lw > 0) { c.strokeStyle = INK; c.lineWidth = lw; c.beginPath(); ell(c, x, y, R, R); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); ell(c, x - R * 0.4, y - R * 0.45, R * 0.22, R * 0.12, -0.6); c.fill();
}
function cane(c: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, flip: number, lw: number): void {
  const path = () => { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h + w * 1.6); c.arc(x + flip * w * 1.6, y - h + w * 1.6, w * 1.6, flip > 0 ? Math.PI : 0, flip > 0 ? TAU * 0.98 : -Math.PI * 0.98, flip < 0); };
  path(); c.lineCap = 'round'; c.strokeStyle = INK; c.lineWidth = w + lw * 2; if (lw > 0) c.stroke();
  path(); c.strokeStyle = '#fff6f8'; c.lineWidth = w; c.stroke();
  c.save(); path(); c.lineCap = 'butt'; c.setLineDash([w * 0.7, w * 0.7]); c.strokeStyle = '#ff4f7e'; c.lineWidth = w; c.stroke(); c.restore();
  c.lineCap = 'round';
}
function gingerHouse(c: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, roof: string): void {
  c.fillStyle = '#c47a3c'; c.beginPath(); rr(c, x, base - h, w, h, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  c.fillStyle = '#a5602c'; c.fillRect(x + 2, base - 10, w - 4, 8);
  c.fillStyle = roof; c.beginPath(); c.moveTo(x - 12, base - h + 4); c.lineTo(x + w / 2, base - h - w * 0.55); c.lineTo(x + w + 12, base - h + 4); c.closePath(); c.fill(); c.stroke();
  // icing drips under the roof
  c.fillStyle = '#fff6f8'; c.beginPath(); c.moveTo(x - 12, base - h + 4);
  for (let i = 0; i <= 6; i++) { const px = x - 12 + ((w + 24) / 6) * i; c.lineTo(px, base - h + 4); if (i < 6) c.arc(px + (w + 24) / 12, base - h + 4, (w + 24) / 12, Math.PI, 0, true); }
  c.lineTo(x + w + 12, base - h); c.lineTo(x - 12, base - h); c.closePath(); c.fill(); c.lineWidth = 1.5; c.stroke();
  // door and windows
  c.fillStyle = '#7a3f1d'; c.beginPath(); c.moveTo(x + w / 2 - 9, base); c.lineTo(x + w / 2 - 9, base - 22); c.arc(x + w / 2, base - 22, 9, Math.PI, 0); c.lineTo(x + w / 2 + 9, base); c.fill(); c.stroke();
  for (const wx of [x + 8, x + w - 22]) { c.fillStyle = '#ffe58a'; c.beginPath(); rr(c, wx, base - h + 14, 14, 14, 3); c.fill(); c.stroke(); c.fillStyle = '#ff6fae'; c.fillRect(wx + 6, base - h + 14, 2, 14); }
  for (let i = 0; i < 4; i++) { c.fillStyle = SWEET[i]; c.beginPath(); ell(c, x + 6 + i * ((w - 12) / 3), base - h + 36, 3, 3); c.fill(); }
}

registerWorld({
  id: 'candy', name: 'ארץ הממתקים',

  sky: (sc) => once(sc, 'candy_sky', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#9fc9ff'], [0.42, '#f6b8e4'], [0.75, '#ffd0d8'], [1, '#fff1b8']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    // a sugar sun with soft candy rays
    const sx = 700, sy = 150;
    c.save(); c.translate(sx, sy);
    for (let i = 0; i < 16; i++) { c.rotate(TAU / 16); c.fillStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(255,214,120,0.16)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-40, -420); c.lineTo(40, -420); c.closePath(); c.fill(); }
    c.restore();
    const g = c.createRadialGradient(sx, sy, 10, sx, sy, 190); g.addColorStop(0, 'rgba(255,250,210,0.95)'); g.addColorStop(0.35, 'rgba(255,220,170,0.45)'); g.addColorStop(1, 'rgba(255,200,220,0)');
    c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.fillStyle = '#fff6c8'; c.beginPath(); ell(c, sx, sy, 52, 52); c.fill();
    c.strokeStyle = 'rgba(255,170,120,0.55)'; c.lineWidth = 6; c.beginPath(); for (let t = 0; t < 2.6 * TAU; t += 0.15) { const r = (t / (2.6 * TAU)) * 44; c.lineTo(sx + Math.cos(t) * r, sy + Math.sin(t) * r); } c.stroke();
    // sparkles
    const r = rng(11);
    for (let i = 0; i < 34; i++) {
      const x = r() * VIEW_W, y = r() * 260, s = 1.5 + r() * 3;
      c.fillStyle = `rgba(255,255,255,${0.5 + r() * 0.5})`; c.beginPath(); c.moveTo(x, y - s * 2); c.lineTo(x + s * 0.5, y - s * 0.5); c.lineTo(x + s * 2, y); c.lineTo(x + s * 0.5, y + s * 0.5); c.lineTo(x, y + s * 2); c.lineTo(x - s * 0.5, y + s * 0.5); c.lineTo(x - s * 2, y); c.lineTo(x - s * 0.5, y - s * 0.5); c.closePath(); c.fill();
    }
    // cotton-candy clouds: puffs in pink, mint and lilac with a light top
    const clouds: [number, number, number, string][] = [[140, 120, 1.1, '#ffc6e6'], [430, 70, 0.8, '#c9f3e6'], [880, 230, 0.9, '#e2d1ff'], [300, 250, 0.7, '#ffe0f0'], [600, 300, 0.65, '#ffd8ea'], [60, 330, 0.6, '#d6f5ff']];
    for (const [x, y, s, col] of clouds) {
      const puffs: [number, number, number][] = [[-60, 6, 30], [-28, -10, 38], [10, -20, 44], [50, -6, 36], [80, 8, 26]];
      c.fillStyle = shade(col, -0.12);
      c.beginPath(); for (const [dx, dy, rr2] of puffs) ell(c, x + dx * s, y + (dy + 8) * s, rr2 * s, rr2 * 0.9 * s); c.fill();
      c.fillStyle = col; c.beginPath(); for (const [dx, dy, rr2] of puffs) ell(c, x + dx * s, y + dy * s, rr2 * s, rr2 * 0.85 * s); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); for (const [dx, dy, rr2] of puffs) ell(c, x + dx * s - 4 * s, y + (dy - rr2 * 0.45) * s, rr2 * 0.5 * s, rr2 * 0.25 * s); c.fill();
    }
  }),

  far: (sc) => once(sc, 'candy_far', LAYER_W, VIEW_H, 1, (c) => {
    const r = rng(23);
    // the back row: big frosted mountains (snow-cap = frosting with drips)
    const peaks: [number, number, number, string][] = [];
    for (let x = 40; x < LAYER_W; x += 220 + r() * 140) peaks.push([x, 150 + r() * 120, 130 + r() * 80, ['#d9a6e8', '#f0a7cf', '#b9b0f2'][Math.floor(r() * 3)]]);
    for (const [x, h, w, col] of peaks) wrap(LAYER_W, x - w, w * 2, (xx) => {
      const cx = xx + w, top = 400 - h - 60;
      c.fillStyle = col; c.beginPath(); c.moveTo(cx - w, 420); c.bezierCurveTo(cx - w * 0.6, top + 20, cx - w * 0.25, top, cx, top); c.bezierCurveTo(cx + w * 0.25, top, cx + w * 0.6, top + 20, cx + w, 420); c.closePath(); c.fill();
      // frosting cap with drips
      c.save(); c.clip();
      c.fillStyle = '#fff3fa'; c.beginPath(); c.moveTo(cx - w, top - 10);
      const capY = top + h * 0.28;
      for (let k = 0; k <= 8; k++) { const px = cx - w + (2 * w / 8) * k; c.lineTo(px, capY + (k % 2 ? 18 + r() * 14 : 0)); }
      c.lineTo(cx + w, top - 10); c.closePath(); c.fill(); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.moveTo(cx, top); c.bezierCurveTo(cx - w * 0.25, top, cx - w * 0.6, top + 20, cx - w, 420); c.lineTo(cx - w * 0.75, 420); c.bezierCurveTo(cx - w * 0.45, top + 60, cx - w * 0.2, top + 20, cx, top); c.fill();
    });
    // the front row: gumdrops with sugar dots
    let x = -40;
    while (x < LAYER_W) {
      const w = 70 + r() * 70, h = 60 + r() * 70, col = ['#8fe0c4', '#ffb08a', '#ffd76e', '#ff9ccf', '#a9c4ff'][Math.floor(r() * 5)];
      wrap(LAYER_W, x, w, (xx) => {
        c.fillStyle = shade(col, -0.08); c.beginPath(); c.moveTo(xx, 430); c.lineTo(xx + w * 0.1, 430 - h * 0.7); c.quadraticCurveTo(xx + w / 2, 430 - h * 1.25, xx + w * 0.9, 430 - h * 0.7); c.lineTo(xx + w, 430); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.55)'; for (let i = 0; i < 7; i++) { c.beginPath(); ell(c, xx + w * 0.2 + ((i * 37) % 60) / 60 * w * 0.6, 430 - h * 0.25 - ((i * 23) % 50) / 50 * h * 0.6, 2, 2); c.fill(); }
      });
      x += w * 0.7 + r() * 50;
    }
    // pink haze over the bottom
    c.fillStyle = lin(c, 300, VIEW_H, [[0, 'rgba(255,214,232,0)'], [0.5, 'rgba(255,214,232,0.6)'], [1, '#ffe6ef']]); c.fillRect(0, 300, LAYER_W, VIEW_H - 300);
  }),

  mid: (sc) => once(sc, 'candy_mid', LAYER_W, VIEW_H, 1.5, (c) => {
    const r = rng(37), base = 482;
    // rolling hills: chocolate behind, mint frosting in front
    hill(c, 400, [[3, 22, 0.4], [5, 12, 1.3], [8, 6, 2]], lin(c, 360, 482, [[0, '#9a5a3a'], [1, '#6e3a24']]));
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.beginPath(); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 404 + wave(x, [[3, 22, 0.4], [5, 12, 1.3], [8, 6, 2]])); c.stroke();
    hill(c, 438, [[4, 16, 2.2], [7, 9, 0.3], [12, 4, 1]], lin(c, 410, 482, [[0, '#b7f0d6'], [1, '#7fd3b2']]));
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 438 + wave(x, [[4, 16, 2.2], [7, 9, 0.3], [12, 4, 1]])); c.stroke();
    // sprinkles on the mint hill
    for (let i = 0; i < 160; i++) { const x = r() * LAYER_W, y = 450 + wave(x, [[4, 16, 2.2], [7, 9, 0.3], [12, 4, 1]]) + r() * 30; c.save(); c.translate(x, y); c.rotate(r() * TAU); c.fillStyle = SWEET[i % 6]; c.beginPath(); rr(c, -4, -1.5, 8, 3, 1.5); c.fill(); c.restore(); }
    // scenery: houses, lollipops, canes and licorice twists
    let x = 30;
    while (x < LAYER_W - 60) {
      const kind = r(), at = x;
      if (kind < 0.3) {
        const w = 70 + r() * 30, h = 50 + r() * 20, roof = ['#ff6fae', '#9b7bff', '#5fd3b0'][Math.floor(r() * 3)];
        wrap(LAYER_W, at - 20, w + 40, (xx) => gingerHouse(c, xx, base - 8, w, h, roof));
        x += w + 50 + r() * 60;
      } else if (kind < 0.55) {
        const h = 150 + r() * 90, R = 30 + r() * 14, ca = SWEET[Math.floor(r() * 6)];
        wrap(LAYER_W, at - R, R * 2, (xx) => {
          c.fillStyle = '#fff6f0'; c.fillRect(xx - 4, base - h, 8, h); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(xx - 4, base - h, 8, h);
          swirl(c, xx, base - h - R + 6, R, ca, '#fff6f8', 2.4);
        });
        x += R * 2 + 40 + r() * 60;
      } else if (kind < 0.78) {
        const h = 120 + r() * 70;
        wrap(LAYER_W, at - 10, 60, (xx) => { cane(c, xx, base, h, 12, 1, 2); cane(c, xx + 34, base, h * 0.75, 10, -1, 2); });
        x += 90 + r() * 60;
      } else {
        const h = 90 + r() * 70, col = r() < 0.5 ? '#3a2340' : '#e0384f';
        wrap(LAYER_W, at - 12, 24, (xx) => {
          c.fillStyle = col; c.beginPath(); rr(c, xx - 9, base - h, 18, h, 6); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
          c.strokeStyle = shade(col, 0.3); c.lineWidth = 3; for (let y = base - h + 8; y < base - 4; y += 12) { c.beginPath(); c.moveTo(xx - 8, y + 6); c.lineTo(xx + 8, y); c.stroke(); }
        });
        x += 50 + r() * 50;
      }
    }
    // a candy garland across the top
    for (let sx = 0; sx < LAYER_W; sx += 480) {
      c.strokeStyle = 'rgba(29,26,51,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(sx, 90); c.quadraticCurveTo(sx + 240, 170, sx + 480, 90); c.stroke();
      for (let k = 1; k < 10; k++) { const t = k / 10, px = sx + 480 * t, py = (1 - t) * (1 - t) * 90 + 2 * t * (1 - t) * 170 + t * t * 90; c.fillStyle = SWEET[k % 6]; c.beginPath(); ell(c, px, py + 6, 7, 7); c.fill(); c.lineWidth = 1.5; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); ell(c, px - 2, py + 3, 2.4, 1.6); c.fill(); }
    }
    // push the layer back with a soft pink-lilac tint
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(214,150,210,0.28)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }),

  ground: (sc, w) => once(sc, `candy_ground_${w}`, w, 120, 1, (c) => {
    const r = rng(w * 13 + 5);
    // cake body: chocolate sponge with a cream layer
    c.fillStyle = lin(c, 0, 120, [[0, '#8a4b2c'], [1, '#4a2216']]); c.fillRect(0, 0, w, 120);
    c.fillStyle = '#fff0dc'; c.fillRect(0, 58, w, 10); c.fillStyle = '#ff9fc6'; c.fillRect(0, 68, w, 5);
    c.fillStyle = '#6a3420'; c.fillRect(0, 96, w, 8);
    c.fillStyle = 'rgba(40,14,8,0.35)'; for (let i = 0; i < w / 6; i++) { c.beginPath(); ell(c, r() * w, 24 + r() * 90, 1.5 + r() * 2, 1.5 + r() * 1.5); c.fill(); }
    // the pink frosting lip with drips
    c.fillStyle = '#ffb3d4'; c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, 20);
    for (let x = w; x > 0;) { const dw = 18 + r() * 26, dd = 8 + r() * 20; c.lineTo(x - dw * 0.2, 20); c.quadraticCurveTo(x - dw * 0.2, 20 + dd, x - dw / 2, 20 + dd); c.quadraticCurveTo(x - dw * 0.8, 20 + dd, x - dw * 0.8, 20); x -= dw; }
    c.lineTo(0, 20); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(0, 4, w, 4);
    // sprinkles on the frosting
    for (let i = 0; i < w / 9; i++) { c.save(); c.translate(r() * w, 8 + r() * 10); c.rotate(r() * TAU); c.fillStyle = SWEET[i % 6]; c.beginPath(); rr(c, -3.5, -1.3, 7, 2.6, 1.3); c.fill(); c.restore(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }),

  platform: (sc, w, style, seed) => once(sc, `candy_plat_${style}_${w}_${seed}`, w, 40, 1, (c) => {
    if (style === 'plank') {
      // a wafer biscuit with a cream filling
      soft(c, 6, 4, 0.3); c.fillStyle = '#e8b56a'; c.beginPath(); rr(c, 2, 4, w - 4, 24, 4); c.fill(); nosoft(c);
      c.fillStyle = '#fff3e0'; c.fillRect(3, 12, w - 6, 5); c.fillStyle = '#f6c6dc'; c.fillRect(3, 21, w - 6, 3);
      c.strokeStyle = 'rgba(122,70,20,0.45)'; c.lineWidth = 1.5;
      for (let x = 10; x < w - 4; x += 10) { c.beginPath(); c.moveTo(x, 5); c.lineTo(x, 11); c.stroke(); c.beginPath(); c.moveTo(x, 18); c.lineTo(x, 27); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(6, 6, w - 12, 2.5);
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); rr(c, 2, 4, w - 4, 24, 4); c.stroke();
    } else {
      // a gummy slab: glossy jelly with sugar crystals
      const col = SWEET[seed % SWEET.length];
      soft(c, 6, 4, 0.3); c.fillStyle = lin(c, 4, 30, [[0, shade(col, 0.35)], [0.5, col], [1, shade(col, -0.25)]]); c.beginPath(); rr(c, 2, 4, w - 4, 22, 10); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); rr(c, 10, 8, w - 20, 4, 2); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.8)'; const r = rng(seed * 7 + w); for (let i = 0; i < w / 12; i++) c.fillRect(6 + r() * (w - 12), 14 + r() * 9, 2, 2);
      // little jelly drips
      for (const x of [w * 0.25, w * 0.7]) { c.fillStyle = shade(col, -0.1); c.beginPath(); c.moveTo(x - 6, 24); c.quadraticCurveTo(x, 40, x + 6, 24); c.fill(); c.lineWidth = 2; c.stroke(); }
    }
  }),

  lamp: (sc) => once(sc, 'candy_lamp', 70, 200, 2, (c) => {
    const g = c.createRadialGradient(35, 34, 4, 35, 34, 36); g.addColorStop(0, 'rgba(255,240,170,0.9)'); g.addColorStop(1, 'rgba(255,200,230,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, 72);
    cane(c, 35, 196, 150, 9, 1, 2.5);
    c.fillStyle = '#7a3f1d'; c.beginPath(); rr(c, 22, 186, 26, 12, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    // a glowing gumdrop lantern hanging from the hook
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(61, 50); c.lineTo(61, 58); c.stroke();
    c.fillStyle = '#ffe9a0'; c.beginPath(); c.moveTo(50, 80); c.quadraticCurveTo(50, 56, 61, 56); c.quadraticCurveTo(72, 56, 72, 80); c.closePath(); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); ell(c, 56, 64, 2.5, 4, 0.3); c.fill();
  }),

  props: (sc) => [
    once(sc, 'candy_cupcake', 70, 84, 2, (c) => {
      c.fillStyle = '#7fd3e6'; c.beginPath(); c.moveTo(12, 44); c.lineTo(58, 44); c.lineTo(52, 82); c.lineTo(18, 82); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(29,26,51,0.35)'; c.lineWidth = 2; for (let x = 20; x < 56; x += 7) { c.beginPath(); c.moveTo(x, 46); c.lineTo(x - 2 + (x - 35) * -0.1, 80); c.stroke(); }
      c.fillStyle = '#ffb3d4'; c.beginPath(); ell(c, 35, 42, 28, 10); ell(c, 35, 30, 22, 12); ell(c, 35, 18, 13, 10); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#ffb3d4'; c.beginPath(); ell(c, 35, 42, 26, 8); ell(c, 35, 30, 20, 10); ell(c, 35, 18, 11, 8); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); ell(c, 27, 26, 6, 3, -0.3); c.fill();
      c.fillStyle = '#e0384f'; c.beginPath(); ell(c, 35, 6, 6, 6); c.fill(); c.lineWidth = 2; c.stroke();
      const r = rng(4); for (let i = 0; i < 12; i++) { c.save(); c.translate(14 + r() * 42, 24 + r() * 18); c.rotate(r() * TAU); c.fillStyle = SWEET[i % 6]; c.fillRect(-3, -1, 6, 2.2); c.restore(); }
    }),
    once(sc, 'candy_lolly', 60, 130, 2, (c) => {
      c.fillStyle = '#fff6f0'; c.beginPath(); rr(c, 27, 50, 6, 78, 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      swirl(c, 30, 30, 26, '#ff6fae', '#fff6f8', 3);
      c.fillStyle = '#5fd3b0'; c.beginPath(); c.moveTo(30, 58); c.lineTo(18, 66); c.lineTo(20, 54); c.closePath(); c.moveTo(30, 58); c.lineTo(42, 66); c.lineTo(40, 54); c.closePath(); c.fill(); c.lineWidth = 2; c.stroke();
    }),
    once(sc, 'candy_canes', 70, 120, 2, (c) => { cane(c, 22, 118, 110, 10, 1, 2.5); cane(c, 50, 118, 82, 9, -1, 2.5); }),
    once(sc, 'candy_gumdrops', 100, 60, 2, (c) => {
      const drop = (x: number, y: number, w: number, h: number, col: string) => {
        c.fillStyle = lin(c, y - h, y, [[0, shade(col, 0.3)], [1, shade(col, -0.15)]]); c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w * 0.42, y - h * 0.6); c.quadraticCurveTo(x, y - h * 1.2, x + w * 0.42, y - h * 0.6); c.lineTo(x + w / 2, y); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 6; i++) c.fillRect(x - w * 0.3 + ((i * 13) % 10) / 10 * w * 0.6, y - h * 0.25 - ((i * 7) % 10) / 10 * h * 0.5, 2, 2);
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); ell(c, x - w * 0.2, y - h * 0.65, w * 0.08, h * 0.12, 0.4); c.fill();
      };
      drop(26, 58, 40, 42, '#5fd3b0'); drop(74, 58, 38, 36, '#ffd23f'); drop(50, 58, 44, 54, '#ff6fae');
    }),
    once(sc, 'candy_donut', 80, 80, 2, (c) => {
      c.fillStyle = '#e8a65a'; c.beginPath(); ell(c, 40, 42, 34, 34); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#9b7bff'; c.beginPath();
      for (let i = 0; i <= 24; i++) { const a = (i / 24) * TAU, rad = 28 + (i % 2 ? 3 : -1); c.lineTo(40 + Math.cos(a) * rad, 42 + Math.sin(a) * rad); }
      c.closePath(); c.fill(); c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ffe6ef'; c.beginPath(); ell(c, 40, 42, 11, 11); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      const r = rng(8); for (let i = 0; i < 16; i++) { const a = r() * TAU, d = 15 + r() * 10; c.save(); c.translate(40 + Math.cos(a) * d, 42 + Math.sin(a) * d); c.rotate(r() * TAU); c.fillStyle = ['#fff', '#ffd23f', '#5fd3b0', '#ff6fae'][i % 4]; c.fillRect(-3, -1, 6, 2.2); c.restore(); }
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); ell(c, 24, 26, 6, 3, -0.7); c.fill();
      c.fillStyle = '#c98f55'; c.fillRect(30, 74, 20, 4);
    }),
    once(sc, 'candy_wrapped', 96, 56, 2, (c) => {
      // a big wrapped candy lying on the ground, and a small one on top
      const wrapc = (x: number, y: number, rx: number, ry: number, col: string) => {
        c.fillStyle = shade(col, 0.2);
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * rx * 0.8, y); c.lineTo(x + s * (rx + 18), y - ry * 0.9); c.lineTo(x + s * (rx + 13), y); c.lineTo(x + s * (rx + 18), y + ry * 0.9); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke(); }
        c.fillStyle = col; c.beginPath(); ell(c, x, y, rx, ry); c.fill(); c.lineWidth = 3; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 4; for (const dx of [-rx * 0.45, 0, rx * 0.45]) { c.beginPath(); c.moveTo(x + dx - 5, y - ry * 0.85); c.lineTo(x + dx + 5, y + ry * 0.85); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); ell(c, x - rx * 0.4, y - ry * 0.5, rx * 0.25, ry * 0.15); c.fill();
      };
      wrapc(48, 38, 24, 16, '#ff9b5c'); wrapc(52, 14, 13, 9, '#62b6ff');
    }),
  ],

  bunting: (sc) => once(sc, 'candy_bunting', 200, 40, 2, (c) => {
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    for (let i = 1; i < 8; i++) {
      const t = i / 8, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6 + 9, col = SWEET[i % 6];
      c.fillStyle = shade(col, 0.25); c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 12, y - 5); c.lineTo(x - 12, y + 5); c.closePath(); c.moveTo(x + 6, y); c.lineTo(x + 12, y - 5); c.lineTo(x + 12, y + 5); c.closePath(); c.fill(); c.lineWidth = 1.5; c.stroke();
      c.fillStyle = col; c.beginPath(); ell(c, x, y, 7, 6); c.fill(); c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); ell(c, x - 2, y - 2, 2.5, 1.5); c.fill();
    }
  }),

  ambient: (sc) => {
    const t = once(sc, 'candy_sprinkle', 10, 4, 1, (c) => { c.fillStyle = '#fff'; c.beginPath(); rr(c, 0, 0, 10, 4, 2); c.fill(); });
    return {
      texture: t, x: { min: 0, max: VIEW_W }, y: { min: -20, max: VIEW_H }, lifespan: 5500, frequency: 110, quantity: 1,
      speedY: { min: 14, max: 34 }, speedX: { min: -10, max: 10 }, rotate: { start: 0, end: 360 }, scale: { min: 0.6, max: 1.1 },
      alpha: { start: 0.9, end: 0 }, tint: [0xff6fae, 0x5fd3b0, 0xffd23f, 0x9b7bff, 0xffffff, 0x62b6ff],
    };
  },
});
