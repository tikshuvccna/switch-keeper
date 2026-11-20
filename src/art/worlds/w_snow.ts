/** עולם השלג: a winter land under an aurora: snowy peaks, ice cliffs, frosted pines, igloos, snowmen, lanterns and ice-crystal spires. */
import * as Phaser from 'phaser';
import { registerWorld, mk, tex, lin, soft, nosoft, wrap, rng, VIEW_W, VIEW_H, LAYER_W } from '../world';
import { INK, ell, rr, shade } from '../puppet';

const once = (sc: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (c: CanvasRenderingContext2D) => void): string =>
  sc.textures.exists(key) ? key : tex(sc, key, mk(w, h, draw, res), res);
const TAU = Math.PI * 2;
const wave = (x: number, parts: [number, number, number][]) => parts.reduce((s, [k, a, p]) => s + a * Math.sin((x / LAYER_W) * TAU * k + p), 0);

function frostPine(c: CanvasRenderingContext2D, x: number, y: number, h: number, col: string, lw: number): void {
  const w = h * 0.4;
  c.fillStyle = '#6b4a34'; c.fillRect(x - h * 0.035, y - h * 0.14, h * 0.07, h * 0.14);
  for (let i = 0; i < 4; i++) {
    const t0 = y - h * 0.1 - i * h * 0.21, tw = w * (1 - i * 0.2), top = t0 - h * 0.34;
    c.fillStyle = col; c.beginPath(); c.moveTo(x - tw, t0); c.lineTo(x, top); c.lineTo(x + tw, t0); c.quadraticCurveTo(x, t0 - h * 0.05, x - tw, t0); c.closePath(); c.fill();
    if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
    // snow resting on each tier
    const f = 0.5, dy = (t0 - top) * f;
    c.fillStyle = '#f4f9ff'; c.beginPath(); c.moveTo(x, top); c.lineTo(x + tw * f, top + dy);
    c.quadraticCurveTo(x + tw * 0.35, top + dy + 7, x + tw * 0.2, top + dy - 1); c.quadraticCurveTo(x + tw * 0.05, top + dy + 8, x - tw * 0.12, top + dy); c.quadraticCurveTo(x - tw * 0.3, top + dy + 7, x - tw * f, top + dy); c.closePath(); c.fill();
    if (lw) { c.strokeStyle = INK; c.lineWidth = lw * 0.6; c.stroke(); }
  }
}
function igloo(c: CanvasRenderingContext2D, x: number, y: number, R: number, lw: number): void {
  c.fillStyle = lin(c, y - R, y, [[0, '#ffffff'], [1, '#c6dcef']]); c.beginPath(); c.arc(x, y, R, Math.PI, 0); c.closePath(); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.strokeStyle = 'rgba(80,120,170,0.45)'; c.lineWidth = 1.5;
  for (let k = 1; k < 4; k++) { const yy = y - (R * k) / 4, hw = Math.sqrt(R * R - (y - yy) ** 2); c.beginPath(); c.moveTo(x - hw, yy); c.lineTo(x + hw, yy); c.stroke();
    for (let j = -3; j <= 3; j++) { const bx = x + j * (hw / 3.5) + (k % 2) * (hw / 7); if (Math.abs(bx - x) < hw) { c.beginPath(); c.moveTo(bx, yy); c.lineTo(bx, yy + R / 4); c.stroke(); } } }
  c.fillStyle = '#e6f0fa'; c.beginPath(); c.moveTo(x + R * 0.35, y); c.lineTo(x + R * 0.35, y - R * 0.38); c.arc(x + R * 0.6, y - R * 0.38, R * 0.25, Math.PI, 0); c.lineTo(x + R * 0.85, y); c.closePath(); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.fillStyle = '#2a3a66'; c.beginPath(); c.moveTo(x + R * 0.45, y); c.lineTo(x + R * 0.45, y - R * 0.34); c.arc(x + R * 0.6, y - R * 0.34, R * 0.15, Math.PI, 0); c.lineTo(x + R * 0.75, y); c.closePath(); c.fill();
  const g = c.createRadialGradient(x + R * 0.6, y - R * 0.15, 1, x + R * 0.6, y - R * 0.15, R * 0.3); g.addColorStop(0, 'rgba(255,200,110,0.8)'); g.addColorStop(1, 'rgba(255,200,110,0)'); c.fillStyle = g; c.fillRect(x + R * 0.3, y - R * 0.45, R * 0.6, R * 0.45);
}
function snowman(c: CanvasRenderingContext2D, x: number, y: number, s: number, lw: number): void {
  const ball = (cy: number, r: number) => { c.fillStyle = lin(c, cy - r, cy + r, [[0, '#ffffff'], [1, '#c6dcef']]); c.beginPath(); ell(c, x, cy, r, r * 0.95); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); } };
  ball(y - 20 * s, 21 * s); ball(y - 52 * s, 15 * s); ball(y - 76 * s, 11 * s);
  c.fillStyle = '#c8452f'; c.beginPath(); rr(c, x - 13 * s, y - 68 * s, 26 * s, 6 * s, 3 * s); c.fill(); c.beginPath(); rr(c, x + 4 * s, y - 66 * s, 6 * s, 16 * s, 2 * s); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.stroke(); }
  c.fillStyle = '#2a3a66'; c.beginPath(); rr(c, x - 9 * s, y - 92 * s, 18 * s, 10 * s, 2 * s); rr(c, x - 13 * s, y - 84 * s, 26 * s, 4 * s, 2 * s); c.fill(); if (lw) { c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.stroke(); }
  c.fillStyle = INK; for (const [ex, ey] of [[-4, -78], [4, -78], [0, -48], [0, -40], [0, -22]]) { c.beginPath(); ell(c, x + ex * s, y + ey * s, 1.6 * s, 1.6 * s); c.fill(); }
  c.fillStyle = '#ff8a3d'; c.beginPath(); c.moveTo(x, y - 75 * s); c.lineTo(x + 12 * s, y - 73 * s); c.lineTo(x, y - 71 * s); c.closePath(); c.fill();
  c.strokeStyle = '#6b4a34'; c.lineWidth = 2.2 * s; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - 14 * s, y - 54 * s); c.lineTo(x - 30 * s, y - 66 * s); c.moveTo(x - 25 * s, y - 62 * s); c.lineTo(x - 28 * s, y - 70 * s); c.moveTo(x + 14 * s, y - 54 * s); c.lineTo(x + 30 * s, y - 62 * s); c.stroke();
}
function crystal(c: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, lean: number, lw: number): void {
  c.fillStyle = lin(c, y - h, y, [[0, '#e8fbff'], [0.5, '#9ee3f5'], [1, '#5fb6e0']]);
  c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w / 2 + lean * 0.8, y - h * 0.8); c.lineTo(x + lean, y - h); c.lineTo(x + w / 2 + lean * 0.8, y - h * 0.8); c.lineTo(x + w / 2, y); c.closePath(); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(x - w / 2 + 3, y - 2); c.lineTo(x - w / 2 + lean * 0.8 + 3, y - h * 0.8); c.lineTo(x + lean, y - h + 4); c.lineTo(x - w * 0.1 + lean * 0.5, y - h * 0.5); c.lineTo(x - w * 0.15, y - 2); c.closePath(); c.fill();
}
function lantern(c: CanvasRenderingContext2D, x: number, y: number, h: number, lw: number): void {
  const g = c.createRadialGradient(x, y - h + 10, 2, x, y - h + 10, 40); g.addColorStop(0, 'rgba(255,214,120,0.75)'); g.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = g; c.fillRect(x - 40, y - h - 30, 80, 80);
  c.fillStyle = '#2a3a66'; c.fillRect(x - 3, y - h + 20, 6, h - 20); if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(x - 3, y - h + 20, 6, h - 20); }
  c.fillStyle = '#ffe39a'; c.beginPath(); rr(c, x - 8, y - h + 2, 16, 18, 3); c.fill(); if (lw) c.stroke();
  c.fillStyle = '#2a3a66'; c.beginPath(); c.moveTo(x - 12, y - h + 3); c.lineTo(x, y - h - 8); c.lineTo(x + 12, y - h + 3); c.closePath(); c.fill(); if (lw) c.stroke();
  c.fillStyle = '#f4f9ff'; c.beginPath(); ell(c, x, y - h - 4, 9, 4); c.fill();
}

registerWorld({
  id: 'snow', name: 'עולם השלג',

  sky: (sc) => once(sc, 'snow_sky', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#24366f'], [0.4, '#5a7fc0'], [0.75, '#a9d0ee'], [1, '#e2f2fb']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const r = rng(17);
    for (let i = 0; i < 60; i++) { const x = r() * VIEW_W, y = r() * 200, s = 0.8 + r() * 1.4; c.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.5})`; c.beginPath(); ell(c, x, y, s, s); c.fill(); }
    // aurora curtains: vertical streaks along a wavy ribbon
    c.globalCompositeOperation = 'lighter';
    for (const [y0, amp, col, ph] of [[120, 40, [80, 255, 180], 0], [90, 30, [120, 200, 255], 1.7], [150, 26, [190, 120, 255], 3.1]] as [number, number, number[], number][]) {
      for (let x = -20; x < VIEW_W + 20; x += 4) {
        const y = y0 + Math.sin(x * 0.008 + ph) * amp + Math.sin(x * 0.021 + ph * 2) * amp * 0.4, len = 70 + Math.sin(x * 0.03 + ph) * 30;
        const a = 0.12 + 0.08 * Math.sin(x * 0.05 + ph);
        c.fillStyle = lin(c, y - len, y + 10, [[0, `rgba(${col},0)`], [0.7, `rgba(${col},${a})`], [1, `rgba(${col},0)`]]); c.fillRect(x, y - len, 4, len + 10);
      }
    }
    c.globalCompositeOperation = 'source-over';
    // a pale moon
    const g = c.createRadialGradient(170, 110, 4, 170, 110, 90); g.addColorStop(0, 'rgba(240,248,255,0.8)'); g.addColorStop(1, 'rgba(240,248,255,0)'); c.fillStyle = g; c.fillRect(60, 0, 220, 220);
    c.fillStyle = '#f4f9ff'; c.beginPath(); ell(c, 170, 110, 30, 30); c.fill();
    c.fillStyle = 'rgba(160,190,230,0.45)'; c.beginPath(); ell(c, 162, 104, 6, 5); ell(c, 180, 120, 4, 4); ell(c, 176, 98, 3, 3); c.fill();
  }),

  far: (sc) => once(sc, 'snow_far', LAYER_W, VIEW_H, 1, (c) => {
    const r = rng(121);
    const range = (yb: number, minH: number, maxH: number, body: string, shadow: string, step: number) => {
      let x = -100;
      while (x < LAYER_W) {
        const w = step + r() * step, h = minH + r() * (maxH - minH), off = (r() - 0.5) * w * 0.3;
        wrap(LAYER_W, x, w * 1.4, (xx) => {
          const px = xx + w / 2 + off, py = yb - h;
          c.fillStyle = body; c.beginPath(); c.moveTo(xx - w * 0.3, yb + 60); c.lineTo(px - w * 0.12, py + h * 0.12); c.lineTo(px, py); c.lineTo(px + w * 0.1, py + h * 0.1); c.lineTo(xx + w * 1.3, yb + 60); c.closePath(); c.fill();
          c.fillStyle = shadow; c.beginPath(); c.moveTo(px, py); c.lineTo(px + w * 0.1, py + h * 0.1); c.lineTo(xx + w * 1.3, yb + 60); c.lineTo(px + w * 0.05, yb + 60); c.lineTo(px - w * 0.05, py + h * 0.5); c.closePath(); c.fill();
        });
        x += w * 0.8;
      }
    };
    range(340, 150, 250, '#eef5fd', '#b6cdea', 170);
    c.fillStyle = lin(c, 260, 420, [[0, 'rgba(210,232,248,0)'], [1, 'rgba(210,232,248,0.7)']]); c.fillRect(0, 260, LAYER_W, 160);
    range(400, 90, 170, '#f6faff', '#a8c4e6', 140);
    // ice cliffs with flat tops
    let x = 0;
    while (x < LAYER_W) {
      const w = 100 + r() * 120, h = 50 + r() * 50;
      wrap(LAYER_W, x, w, (xx) => {
        c.fillStyle = '#9fd3ee'; c.beginPath(); c.moveTo(xx, 450); c.lineTo(xx + 8, 450 - h); c.lineTo(xx + w - 6, 450 - h + 4); c.lineTo(xx + w, 450); c.closePath(); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)'; for (let k = 10; k < w - 10; k += 18) c.fillRect(xx + k, 450 - h + 8, 3, h - 14);
        c.fillStyle = '#f6faff'; c.beginPath(); rr(c, xx + 4, 452 - h - 8, w - 6, 12, 6); c.fill();
      });
      x += w + 60 + r() * 140;
    }
    c.fillStyle = lin(c, 380, VIEW_H, [[0, 'rgba(226,242,251,0)'], [1, 'rgba(226,242,251,0.9)']]); c.fillRect(0, 380, LAYER_W, VIEW_H - 380);
  }),

  mid: (sc) => once(sc, 'snow_mid', LAYER_W, VIEW_H, 1.5, (c) => {
    const r = rng(131), base = 482;
    const S: [number, number, number][] = [[3, 14, 0.3], [6, 7, 1.9], [11, 3, 0.5]];
    c.fillStyle = lin(c, 420, base, [[0, '#ffffff'], [1, '#cfe2f3']]); c.beginPath(); c.moveTo(0, VIEW_H); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 446 + wave(x, S)); c.lineTo(LAYER_W, VIEW_H); c.fill();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 446 + wave(x, S)); c.stroke();
    // ice-crystal spires
    for (const sx of [180, 860, 1420]) wrap(LAYER_W, sx - 70, 140, (xx) => {
      const g = c.createRadialGradient(xx, base - 90, 10, xx, base - 90, 140); g.addColorStop(0, 'rgba(180,240,255,0.45)'); g.addColorStop(1, 'rgba(180,240,255,0)'); c.fillStyle = g; c.fillRect(xx - 140, base - 230, 280, 230);
      crystal(c, xx - 34, base, 120, 30, -14, 2); crystal(c, xx + 30, base, 140, 34, 12, 2); crystal(c, xx, base, 230, 46, 0, 2); crystal(c, xx - 12, base, 70, 22, -18, 2); crystal(c, xx + 50, base, 60, 20, 18, 2);
    });
    let x = 40;
    while (x < LAYER_W - 40) {
      const k = r(), at = x;
      const nearSpire = [180, 860, 1420].some((s) => Math.abs(at - s) < 110);
      if (nearSpire) { x += 40; continue; }
      if (k < 0.45) { const h = 90 + r() * 90; wrap(LAYER_W, at - 40, 80, (xx) => frostPine(c, xx, base + 2, h, '#2f7a6a', 2)); x += 34 + r() * 50; }
      else if (k < 0.62) { const R = 40 + r() * 14; wrap(LAYER_W, at - R, R * 2, (xx) => igloo(c, xx, base, R, 2)); x += R * 2 + 30 + r() * 40; }
      else if (k < 0.78) { wrap(LAYER_W, at - 30, 60, (xx) => snowman(c, xx, base, 0.9, 2)); x += 70 + r() * 50; }
      else { const h = 100 + r() * 40; wrap(LAYER_W, at - 40, 80, (xx) => lantern(c, xx, base, h, 2)); x += 60 + r() * 40; }
    }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(100,140,205,0.34)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }),

  ground: (sc, w) => once(sc, `snow_ground_${w}`, w, 120, 1, (c) => {
    const r = rng(w * 29 + 3);
    // icy rock body
    c.fillStyle = lin(c, 0, 120, [[0, '#7f9cc4'], [1, '#33456e']]); c.fillRect(0, 0, w, 120);
    for (let x = -20; x < w; x += 46 + r() * 40) {
      c.fillStyle = 'rgba(30,45,90,0.3)'; c.beginPath(); c.moveTo(x, 120); c.lineTo(x + 14, 40 + r() * 30); c.lineTo(x + 40, 60 + r() * 30); c.lineTo(x + 52, 120); c.fill();
    }
    c.strokeStyle = 'rgba(190,240,255,0.55)'; c.lineWidth = 2;
    for (let x = 30; x < w; x += 90 + r() * 80) { c.beginPath(); c.moveTo(x, 34); c.lineTo(x + 10, 54); c.lineTo(x + 4, 70); c.lineTo(x + 16, 92); c.stroke(); }
    // icicles under the snow lip
    for (let x = 6; x < w - 4; x += 14 + r() * 18) {
      const len = 8 + r() * 22;
      c.fillStyle = lin(c, 20, 20 + len, [[0, '#e8fbff'], [1, '#8fd3f0']]); c.beginPath(); c.moveTo(x - 4, 20); c.lineTo(x, 20 + len); c.lineTo(x + 4, 20); c.closePath(); c.fill(); c.strokeStyle = 'rgba(29,26,51,0.6)'; c.lineWidth = 1.3; c.stroke();
    }
    // the snow top: puffy edge
    c.fillStyle = lin(c, 0, 26, [[0, '#ffffff'], [1, '#d8e8f6']]); c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, 20);
    for (let x = w; x > 0;) { const bw = 16 + r() * 20; c.quadraticCurveTo(x - bw / 2, 30 + r() * 4, x - bw, 20); x -= bw; }
    c.lineTo(0, 20); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = 'rgba(140,180,230,0.35)'; for (let x = 10; x < w; x += 40 + r() * 40) { c.beginPath(); ell(c, x, 14, 10, 2); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.9)'; for (let i = 0; i < w / 20; i++) c.fillRect(r() * w, 5 + r() * 10, 1.6, 1.6);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }),

  platform: (sc, w, style, seed) => once(sc, `snow_plat_${style}_${w}_${seed}`, w, 40, 1, (c) => {
    const r = rng(seed * 17 + w);
    if (style === 'plank') {
      // snow-capped wooden planks with icicles
      for (let x = 10; x < w - 6; x += 12 + r() * 14) { const len = 5 + r() * 12; c.fillStyle = '#c8efff'; c.beginPath(); c.moveTo(x - 3, 20); c.lineTo(x, 22 + len); c.lineTo(x + 3, 20); c.closePath(); c.fill(); c.strokeStyle = 'rgba(29,26,51,0.6)'; c.lineWidth = 1.2; c.stroke(); }
      soft(c, 6, 4, 0.3); c.fillStyle = lin(c, 8, 22, [[0, '#b98a5c'], [1, '#7f5a38']]); c.beginPath(); rr(c, 2, 8, w - 4, 14, 3); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(60,35,20,0.45)'; c.lineWidth = 1.5; for (let x = 30; x < w - 10; x += 36) { c.beginPath(); c.moveTo(x, 10); c.lineTo(x - 2, 21); c.stroke(); }
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(0, 10); c.quadraticCurveTo(4, 2, 14, 3);
      for (let x = 14; x < w - 14; x += 22) c.quadraticCurveTo(x + 11, 0 + r() * 2, x + 22, 3);
      c.quadraticCurveTo(w - 4, 2, w, 10); for (let x = w - 6; x > 6; x -= 14) c.quadraticCurveTo(x - 7, 15 + r() * 3, x - 14, 11); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = 'rgba(150,190,235,0.45)'; c.fillRect(8, 10, w - 16, 2);
    } else {
      // a slab of clear blue ice
      soft(c, 6, 4, 0.3); c.fillStyle = lin(c, 4, 30, [[0, '#e6fbff'], [0.5, '#a6e4f7'], [1, '#62b4e0']]); c.beginPath(); rr(c, 2, 4, w - 4, 26, 5); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(10, 8); c.lineTo(w - 12, 8); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.45)'; for (let x = 14; x < w - 20; x += 40 + r() * 20) { c.beginPath(); c.moveTo(x, 26); c.lineTo(x + 12, 10); c.lineTo(x + 20, 10); c.lineTo(x + 8, 26); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(40,90,150,0.4)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(w * 0.5, 6); c.lineTo(w * 0.53, 16); c.lineTo(w * 0.49, 28); c.stroke();
      c.strokeStyle = 'rgba(40,90,150,0.3)'; c.beginPath(); c.moveTo(w / 3, 4); c.lineTo(w / 3, 30); c.moveTo((2 * w) / 3, 4); c.lineTo((2 * w) / 3, 30); c.stroke();
    }
  }),

  lamp: (sc) => once(sc, 'snow_lamp', 70, 200, 2, (c) => {
    // an ice-crystal torch: a glowing crystal on a frosted stone post
    const g = c.createRadialGradient(35, 40, 4, 35, 40, 38); g.addColorStop(0, 'rgba(200,250,255,0.95)'); g.addColorStop(1, 'rgba(160,230,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, 84);
    c.fillStyle = lin(c, 70, 190, [[0, '#a9bfdc'], [1, '#5c739c']]); c.beginPath(); c.moveTo(28, 70); c.lineTo(42, 70); c.lineTo(46, 186); c.lineTo(24, 186); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#8fa8cc'; c.beginPath(); rr(c, 16, 184, 38, 14, 4); c.fill(); c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); ell(c, 35, 184, 22, 5); c.fill(); c.lineWidth = 2; c.stroke();
    c.fillStyle = '#8fa8cc'; c.beginPath(); rr(c, 20, 62, 30, 10, 3); c.fill(); c.lineWidth = 3; c.stroke();
    crystal(c, 35, 64, 50, 22, 0, 2.6); crystal(c, 24, 64, 26, 12, -8, 2); crystal(c, 46, 64, 30, 12, 8, 2);
    c.fillStyle = '#ffffff'; c.beginPath(); ell(c, 35, 62, 17, 4); c.fill();
  }),

  props: (sc) => [
    once(sc, 'snow_snowman', 70, 100, 2, (c) => snowman(c, 35, 98, 1.05, 3)),
    once(sc, 'snow_igloo', 110, 60, 2, (c) => igloo(c, 52, 58, 48, 3)),
    once(sc, 'snow_pine', 80, 130, 2, (c) => frostPine(c, 40, 128, 124, '#2f7a6a', 3)),
    once(sc, 'snow_crystals', 80, 90, 2, (c) => { crystal(c, 26, 88, 54, 20, -10, 2.6); crystal(c, 56, 88, 46, 18, 10, 2.6); crystal(c, 40, 88, 84, 26, 0, 2.6); c.fillStyle = '#ffffff'; c.beginPath(); ell(c, 40, 88, 36, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); }),
    once(sc, 'snow_lantern', 90, 140, 2, (c) => lantern(c, 45, 138, 96, 3)),
    once(sc, 'snow_sled', 100, 56, 2, (c) => {
      c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(6, 50); c.lineTo(80, 50); c.quadraticCurveTo(96, 50, 94, 36); c.stroke(); c.strokeStyle = '#c8452f'; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#b98a5c'; c.beginPath(); rr(c, 10, 34, 72, 10, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
      for (const x of [20, 70]) { c.fillStyle = '#7f5a38'; c.fillRect(x, 44, 5, 6); }
      const log = (x: number, y: number) => { c.fillStyle = '#93643c'; c.fillRect(x - 30, y - 6, 30, 12); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x - 30, y - 6, 30, 12); c.fillStyle = '#e8c48e'; c.beginPath(); ell(c, x, y, 4.5, 6); c.fill(); c.stroke(); };
      log(52, 28); log(76, 28); log(64, 16);
      c.fillStyle = '#ffffff'; c.beginPath(); ell(c, 56, 10, 16, 4); c.fill();
    }),
  ],

  bunting: (sc) => once(sc, 'snow_bunting', 200, 40, 2, (c) => {
    // paper snowflakes on a string
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    for (let i = 1; i < 8; i++) {
      const t = i / 8, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6 + 11;
      c.strokeStyle = INK; c.lineWidth = 4.2; c.lineCap = 'round';
      const flake = () => { c.beginPath(); for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); const bx = x + Math.cos(a) * 5.5, by = y + Math.sin(a) * 5.5; c.moveTo(bx, by); c.lineTo(bx + Math.cos(a + 0.7) * 3.5, by + Math.sin(a + 0.7) * 3.5); c.moveTo(bx, by); c.lineTo(bx + Math.cos(a - 0.7) * 3.5, by + Math.sin(a - 0.7) * 3.5); } c.stroke(); };
      flake(); c.strokeStyle = i % 2 ? '#ffffff' : '#bfeaff'; c.lineWidth = 2; flake();
    }
  }),

  ambient: (sc) => {
    const t = once(sc, 'snow_flake', 8, 8, 1, (c) => { const g = c.createRadialGradient(4, 4, 0, 4, 4, 4); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.6, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 8, 8); });
    return {
      texture: t, x: { min: -40, max: VIEW_W + 40 }, y: { min: -20, max: VIEW_H - 60 }, lifespan: 6000, frequency: 60, quantity: 1,
      speedY: { min: 25, max: 60 }, speedX: { min: -20, max: 8 }, scale: { min: 0.5, max: 1.4 },
      alpha: { start: 0.95, end: 0 },
    };
  },
});
