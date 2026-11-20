/** עיר הסייבר: a neon cyber city at night: a striped neon sun, glowing skyscrapers, abstract hologram billboards, flying cars, drones and wet streets. */
import * as Phaser from 'phaser';
import { registerWorld, mk, tex, lin, soft, nosoft, wrap, rng, VIEW_W, VIEW_H, LAYER_W } from '../world';
import { INK, ell, rr, shade } from '../puppet';

const once = (sc: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (c: CanvasRenderingContext2D) => void): string =>
  sc.textures.exists(key) ? key : tex(sc, key, mk(w, h, draw, res), res);
const TAU = Math.PI * 2;
const NEON = ['#ff3fb4', '#2ff3ff', '#b46bff', '#ffe14a'];
const RGB: Record<string, string> = { '#ff3fb4': '255,63,180', '#2ff3ff': '47,243,255', '#b46bff': '180,107,255', '#ffe14a': '255,225,74' };

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a = 0.7): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
/** A neon tube line: a wide soft stroke under a bright thin one. */
function tube(c: CanvasRenderingContext2D, path: () => void, col: string, w = 3): void {
  c.lineCap = 'round'; c.lineJoin = 'round';
  path(); c.strokeStyle = `rgba(${RGB[col]},0.3)`; c.lineWidth = w * 4; c.stroke();
  path(); c.strokeStyle = col; c.lineWidth = w; c.stroke();
  path(); c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = w * 0.35; c.stroke();
}
/** An abstract hologram billboard (shapes only, no text or brands). */
function billboard(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string, kind: number): void {
  c.fillStyle = `rgba(${RGB[col]},0.16)`; c.fillRect(x, y, w, h);
  c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(x, y, w, h);
  c.strokeStyle = `rgba(${RGB[col]},0.25)`; c.lineWidth = 1; for (let yy = y + 3; yy < y + h; yy += 4) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
  const cx = x + w / 2, cy = y + h / 2, s = Math.min(w, h) * 0.32;
  if (kind % 4 === 0) tube(c, () => { c.beginPath(); c.moveTo(cx - s, cy + s * 0.8); c.lineTo(cx, cy - s); c.lineTo(cx + s, cy + s * 0.8); c.closePath(); }, col, 2.5);
  else if (kind % 4 === 1) tube(c, () => { c.beginPath(); ell(c, cx, cy, s, s); c.moveTo(cx + s * 0.45, cy); c.ellipse(cx, cy, s * 0.45, s * 0.45, 0, 0, TAU); }, col, 2.5);
  else if (kind % 4 === 2) tube(c, () => { c.beginPath(); for (let t = 0; t <= 1; t += 0.05) c.lineTo(x + 8 + t * (w - 16), cy + Math.sin(t * TAU * 2) * s * 0.7); }, col, 2.5);
  else tube(c, () => { c.beginPath(); c.moveTo(cx - s, cy); c.lineTo(cx + s * 0.4, cy); c.moveTo(cx, cy - s * 0.6); c.lineTo(cx + s, cy); c.lineTo(cx, cy + s * 0.6); }, col, 2.5);
}
function car(c: CanvasRenderingContext2D, x: number, y: number, s: number, light: string, dir: number): void {
  c.fillStyle = `rgba(${RGB[light]},0.25)`; c.beginPath(); c.moveTo(x - dir * 14 * s, y - 2 * s); c.lineTo(x - dir * 90 * s, y); c.lineTo(x - dir * 14 * s, y + 3 * s); c.fill();
  c.fillStyle = '#1a1036'; c.beginPath(); rr(c, x - 16 * s, y - 5 * s, 32 * s, 9 * s, 4 * s); c.fill(); c.beginPath(); rr(c, x - 8 * s, y - 10 * s, 16 * s, 7 * s, 3 * s); c.fill();
  c.fillStyle = light; c.fillRect(x + dir * 13 * s - 2 * s, y - 2 * s, 4 * s, 2.5 * s);
  c.fillStyle = '#ff3b5c'; c.fillRect(x - dir * 15 * s - 1.5 * s, y - 2 * s, 3 * s, 2.5 * s);
}
function drone(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  c.fillStyle = '#1a1036'; c.strokeStyle = '#1a1036'; c.lineWidth = 2 * s;
  c.beginPath(); c.moveTo(x - 14 * s, y - 4 * s); c.lineTo(x + 14 * s, y - 4 * s); c.stroke();
  c.beginPath(); ell(c, x - 14 * s, y - 6 * s, 7 * s, 1.6 * s); ell(c, x + 14 * s, y - 6 * s, 7 * s, 1.6 * s); rr(c, x - 6 * s, y - 6 * s, 12 * s, 7 * s, 3 * s); c.fill();
  c.fillStyle = '#2ff3ff'; c.fillRect(x - 1.5 * s, y - 2 * s, 3 * s, 2 * s);
}

registerWorld({
  id: 'cyber', name: 'עיר הסייבר',

  sky: (sc) => once(sc, 'cyber_sky', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#07041a'], [0.45, '#25093f'], [0.75, '#5c1460'], [1, '#a3206e']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const r = rng(3);
    for (let i = 0; i < 50; i++) { c.fillStyle = `rgba(255,220,255,${0.2 + r() * 0.5})`; c.fillRect(r() * VIEW_W, r() * 220, 1.5, 1.5); }
    // a big striped neon sun low on the horizon
    const sx = 480, sy = 300, R = 150;
    glow(c, sx, sy, R * 2.1, '255,63,180', 0.35);
    c.save(); c.beginPath(); ell(c, sx, sy, R, R); c.clip();
    c.fillStyle = lin(c, sy - R, sy + R, [[0, '#ffe14a'], [0.5, '#ff7a6b'], [1, '#ff3fb4']]); c.fillRect(sx - R, sy - R, R * 2, R * 2);
    c.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 8; k++) { const y = sy + 6 + k * 18, hgt = 2 + k * 1.6; c.fillRect(sx - R, y, R * 2, hgt); }
    c.restore();
    // thin cloud bands across it
    c.fillStyle = 'rgba(40,10,70,0.55)'; for (const [x, y, w] of [[120, 180, 320], [560, 220, 300], [300, 120, 200], [700, 150, 180]] as [number, number, number][]) { c.beginPath(); rr(c, x, y, w, 7, 3.5); c.fill(); }
  }),

  far: (sc) => once(sc, 'cyber_far', LAYER_W, VIEW_H, 1, (c) => {
    const r = rng(141), base = 430;
    // the back skyline
    let x = -40;
    while (x < LAYER_W) {
      const w = 50 + r() * 60, h = 160 + r() * 200, col = NEON[Math.floor(r() * 3)], seed = r() * 1e6, spire = r() < 0.35;
      wrap(LAYER_W, x, w, (xx) => {
        const rr2 = rng(seed);
        c.fillStyle = '#1c0d3c'; c.fillRect(xx, base - h, w, h + 120);
        if (spire) { c.fillRect(xx + w / 2 - 2, base - h - 50, 4, 50); c.fillStyle = '#ff3b5c'; c.beginPath(); ell(c, xx + w / 2, base - h - 50, 2.5, 2.5); c.fill(); }
        c.fillStyle = `rgba(${RGB[col]},0.55)`; c.fillRect(xx, base - h, w, 2);
        for (let yy = base - h + 10; yy < base + 40; yy += 9) for (let wx = xx + 5; wx < xx + w - 6; wx += 8) if (rr2() < 0.32) { c.fillStyle = `rgba(${RGB[col]},${0.25 + rr2() * 0.45})`; c.fillRect(wx, yy, 4, 3); }
      });
      x += w + 6 + r() * 20;
    }
    // flying vehicles in traffic lanes and drones
    for (let i = 0; i < 14; i++) { const fx = r() * LAYER_W, fy = 120 + (i % 3) * 40 + r() * 20, d = i % 2 ? 1 : -1, l = NEON[1 + (i % 3)]; wrap(LAYER_W, fx - 90, 180, (xx) => car(c, xx, fy, 0.7, l, d)); }
    for (let i = 0; i < 6; i++) { const fx = r() * LAYER_W, fy = 60 + r() * 120; wrap(LAYER_W, fx - 20, 40, (xx) => drone(c, xx, fy, 0.8)); }
    // the front skyline with big hologram billboards
    x = 0;
    while (x < LAYER_W) {
      const w = 80 + r() * 80, h = 110 + r() * 130, col = NEON[Math.floor(r() * 4)], kind = Math.floor(r() * 4), bb = r() < 0.55, seed = r() * 1e6;
      wrap(LAYER_W, x, w, (xx) => {
        const rr2 = rng(seed);
        c.fillStyle = '#2a1050'; c.fillRect(xx, base + 20 - h, w, h + 100);
        c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(xx + w * 0.7, base + 20 - h, w * 0.3, h + 100);
        for (let yy = base + 30 - h; yy < base + 60; yy += 12) for (let wx = xx + 6; wx < xx + w - 8; wx += 11) if (rr2() < 0.4) { c.fillStyle = rr2() < 0.5 ? 'rgba(47,243,255,0.55)' : 'rgba(255,170,230,0.5)'; c.fillRect(wx, yy, 6, 5); }
        if (bb) billboard(c, xx + 8, base + 30 - h, w - 16, Math.min(60, h * 0.35), col, kind);
      });
      x += w + 14 + r() * 40;
    }
    c.fillStyle = lin(c, 330, VIEW_H, [[0, 'rgba(163,32,110,0)'], [1, 'rgba(163,32,110,0.75)']]); c.fillRect(0, 330, LAYER_W, VIEW_H - 330);
  }),

  mid: (sc) => once(sc, 'cyber_mid', LAYER_W, VIEW_H, 1.5, (c) => {
    const r = rng(151), base = 482;
    // close buildings with neon outlines and signs
    let x = 0;
    while (x < LAYER_W) {
      const w = 130 + r() * 90, h = 180 + r() * 150, col = NEON[Math.floor(r() * 4)], kind = Math.floor(r() * 4), seed = r() * 1e6;
      wrap(LAYER_W, x, w, (xx) => {
        const rr2 = rng(seed);
        c.fillStyle = lin(c, base - h, base, [[0, '#2b1356'], [1, '#160a30']]); c.fillRect(xx, base - h, w, h);
        c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(xx, base - h, w, h);
        for (let yy = base - h + 16; yy < base - 60; yy += 20) for (let wx = xx + 10; wx < xx + w - 18; wx += 20) {
          const on = rr2(); c.fillStyle = on < 0.35 ? 'rgba(47,243,255,0.6)' : on < 0.55 ? 'rgba(255,120,210,0.55)' : 'rgba(10,5,30,0.7)'; c.fillRect(wx, yy, 12, 10);
        }
        tube(c, () => { c.beginPath(); c.moveTo(xx + 2, base - h + 2); c.lineTo(xx + w - 2, base - h + 2); }, col, 2.5);
        // a sign box sticking out of the wall
        const sy = base - h * 0.62;
        c.fillStyle = '#12082a'; c.fillRect(xx + w - 30, sy, 44, 70); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(xx + w - 30, sy, 44, 70);
        tube(c, () => { c.beginPath(); rr(c, xx + w - 26, sy + 4, 36, 62, 4); }, col, 2);
        billboard(c, xx + w - 22, sy + 10, 28, 50, NEON[(kind + 1) % 4], kind);
        // a lit shop front at street level
        c.fillStyle = `rgba(${RGB[col]},0.28)`; c.fillRect(xx + 12, base - 50, w * 0.55, 50);
        tube(c, () => { c.beginPath(); c.moveTo(xx + 10, base - 54); c.lineTo(xx + 14 + w * 0.55, base - 54); }, col, 3);
      });
      x += w + 70 + r() * 90;
    }
    // laser fences between buildings, drones overhead
    for (let i = 0; i < 6; i++) {
      const fx = 120 + i * 320 + r() * 60;
      wrap(LAYER_W, fx, 100, (xx) => {
        c.fillStyle = '#3a2a5e'; c.fillRect(xx, base - 70, 6, 70); c.fillRect(xx + 90, base - 70, 6, 70);
        for (let k = 0; k < 4; k++) tube(c, () => { c.beginPath(); c.moveTo(xx + 6, base - 14 - k * 16); c.lineTo(xx + 90, base - 14 - k * 16); }, '#ff3fb4', 1.4);
      });
    }
    for (let i = 0; i < 5; i++) { const dx = r() * LAYER_W, dy = 120 + r() * 120; wrap(LAYER_W, dx - 30, 60, (xx) => { drone(c, xx, dy, 1.6); glow(c, xx, dy + 8, 30, '47,243,255', 0.18); }); }
    // wet street reflections under everything
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(20,6,50,0.32)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }),

  ground: (sc, w) => once(sc, `cyber_ground_${w}`, w, 120, 1, (c) => {
    const r = rng(w * 31 + 11);
    c.fillStyle = lin(c, 0, 120, [[0, '#2a2140'], [1, '#0b0716']]); c.fillRect(0, 0, w, 120);
    // metal panels with bolts and vents
    for (let x = 0; x < w; x += 64) {
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; c.strokeRect(x + 2, 30, 60, 40); c.strokeRect(x + 2, 74, 60, 44);
      c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(x + 4, 32, 56, 3);
      c.fillStyle = '#5a4c7a'; for (const [bx, by] of [[7, 35], [57, 35], [7, 65], [57, 65]]) { c.beginPath(); ell(c, x + bx, by, 1.8, 1.8); c.fill(); }
      if (r() < 0.4) { c.fillStyle = 'rgba(0,0,0,0.5)'; for (let k = 0; k < 4; k++) c.fillRect(x + 14, 82 + k * 7, 36, 3); }
    }
    // pink and cyan reflections smeared down from the street
    for (let x = 10; x < w; x += 30 + r() * 50) { const col = r() < 0.5 ? '255,63,180' : '47,243,255'; c.fillStyle = lin(c, 24, 90, [[0, `rgba(${col},0.35)`], [1, `rgba(${col},0)`]]); c.fillRect(x, 24, 4 + r() * 8, 66); }
    // the street top: dark asphalt-metal, a neon edge strip and lane dashes
    c.fillStyle = lin(c, 0, 22, [[0, '#4a3f6a'], [1, '#2a2244']]); c.fillRect(0, 0, w, 22);
    c.fillStyle = 'rgba(255,225,74,0.7)'; for (let x = 10; x < w; x += 60) c.fillRect(x, 10, 26, 3);
    c.fillStyle = 'rgba(47,243,255,0.25)'; c.fillRect(0, 18, w, 8);
    c.fillStyle = '#2ff3ff'; c.fillRect(0, 20, w, 3);
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(0, 21, w, 1);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 24); c.lineTo(w, 24); c.stroke();
    c.fillStyle = 'rgba(255,63,180,0.8)'; c.fillRect(0, 2, w, 2.5);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1); c.lineTo(w, 1); c.stroke();
  }),

  platform: (sc, w, style, seed) => once(sc, `cyber_plat_${style}_${w}_${seed}`, w, 40, 1, (c) => {
    const col = NEON[seed % NEON.length];
    if (style === 'plank') {
      // a steel girder with neon trim and lightening holes
      soft(c, 6, 4, 0.4); c.fillStyle = lin(c, 4, 26, [[0, '#7c7a9a'], [1, '#3b3858']]); c.beginPath(); rr(c, 2, 4, w - 4, 22, 2); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#2a2744'; c.fillRect(4, 10, w - 8, 10);
      c.fillStyle = 'rgba(0,0,0,0.5)'; for (let x = 14; x < w - 14; x += 22) { c.beginPath(); ell(c, x, 15, 4.5, 3.5); c.fill(); }
      c.fillStyle = col; c.fillRect(4, 6, w - 8, 2.5); c.fillStyle = `rgba(${RGB[col]},0.35)`; c.fillRect(4, 4, w - 8, 6);
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(4, 6.5, w - 8, 1);
      c.fillStyle = '#c9c6dc'; for (const x of [8, w - 8]) { c.beginPath(); ell(c, x, 23, 1.6, 1.6); c.fill(); }
      c.fillStyle = `rgba(${RGB[col]},0.3)`; c.beginPath(); c.moveTo(10, 26); c.lineTo(w - 10, 26); c.lineTo(w * 0.7, 40); c.lineTo(w * 0.3, 40); c.closePath(); c.fill();
    } else {
      // a translucent hologram slab with a grid and glowing edges
      const g = c.createLinearGradient(0, 4, 0, 30); g.addColorStop(0, `rgba(${RGB[col]},0.55)`); g.addColorStop(1, `rgba(${RGB[col]},0.12)`);
      c.fillStyle = g; c.beginPath(); rr(c, 2, 4, w - 4, 24, 4); c.fill();
      c.strokeStyle = `rgba(${RGB[col]},0.45)`; c.lineWidth = 1; for (let x = 10; x < w - 4; x += 10) { c.beginPath(); c.moveTo(x, 6); c.lineTo(x, 27); c.stroke(); } for (const y of [12, 20]) { c.beginPath(); c.moveTo(4, y); c.lineTo(w - 4, y); c.stroke(); }
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); rr(c, 2, 4, w - 4, 24, 4); c.stroke();
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); rr(c, 4, 6, w - 8, 20, 3); c.stroke();
      c.fillStyle = '#ffffff'; c.fillRect(6, 6, w - 12, 1.6);
      c.fillStyle = `rgba(${RGB[col]},0.25)`; for (let k = 0; k < 3; k++) c.fillRect(8, 30 + k * 3.5, w - 16, 1.4);
    }
  }),

  lamp: (sc) => once(sc, 'cyber_lamp', 70, 200, 2, (c) => {
    glow(c, 44, 30, 36, '47,243,255', 0.6);
    c.fillStyle = '#3a3558'; c.beginPath(); rr(c, 14, 30, 8, 160, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#3a3558'; c.beginPath(); c.moveTo(18, 30); c.quadraticCurveTo(20, 14, 40, 16); c.lineTo(62, 18); c.lineTo(62, 26); c.lineTo(40, 24); c.quadraticCurveTo(28, 24, 22, 34); c.closePath(); c.fill(); c.stroke();
    tube(c, () => { c.beginPath(); c.moveTo(30, 29); c.lineTo(60, 30); }, '#2ff3ff', 3);
    c.fillStyle = '#3a3558'; c.beginPath(); rr(c, 6, 184, 24, 14, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    tube(c, () => { c.beginPath(); c.moveTo(18, 60); c.lineTo(18, 176); }, '#ff3fb4', 1.6);
  }),

  props: (sc) => [
    once(sc, 'cyber_sign', 80, 120, 2, (c) => {
      c.fillStyle = '#3a3558'; c.fillRect(37, 50, 7, 68); c.strokeStyle = INK; c.lineWidth = 3; c.strokeRect(37, 50, 7, 68);
      c.fillStyle = '#12082a'; c.beginPath(); rr(c, 6, 6, 68, 46, 6); c.fill(); c.stroke();
      tube(c, () => { c.beginPath(); c.moveTo(18, 29); c.lineTo(50, 29); c.moveTo(40, 17); c.lineTo(56, 29); c.lineTo(40, 41); }, '#ffe14a', 3);
      c.strokeStyle = '#ff3fb4'; c.lineWidth = 1.5; c.beginPath(); rr(c, 10, 10, 60, 38, 4); c.stroke();
    }),
    once(sc, 'cyber_kiosk', 80, 110, 2, (c) => {
      c.fillStyle = lin(c, 10, 108, [[0, '#4a3f6a'], [1, '#221a3a']]); c.beginPath(); rr(c, 8, 10, 64, 98, 6); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#0c1a30'; c.beginPath(); rr(c, 16, 20, 48, 36, 3); c.fill(); c.stroke();
      billboard(c, 18, 22, 44, 32, '#2ff3ff', 2);
      c.fillStyle = '#12082a'; c.beginPath(); rr(c, 22, 66, 36, 20, 3); c.fill(); c.lineWidth = 2; c.stroke();
      for (let k = 0; k < 3; k++) { c.fillStyle = NEON[k]; c.fillRect(26 + k * 11, 72, 7, 7); }
      tube(c, () => { c.beginPath(); c.moveTo(12, 12); c.lineTo(68, 12); }, '#ff3fb4', 2);
      c.fillStyle = '#0b0716'; c.fillRect(26, 94, 28, 5);
    }),
    once(sc, 'cyber_holo', 80, 110, 2, (c) => {
      // a floor projector with a floating hologram ring and diamond
      const g = c.createLinearGradient(0, 30, 0, 96); g.addColorStop(0, 'rgba(47,243,255,0)'); g.addColorStop(1, 'rgba(47,243,255,0.35)');
      c.fillStyle = g; c.beginPath(); c.moveTo(22, 96); c.lineTo(8, 24); c.lineTo(72, 24); c.lineTo(58, 96); c.closePath(); c.fill();
      tube(c, () => { c.beginPath(); c.moveTo(40, 14); c.lineTo(54, 34); c.lineTo(40, 54); c.lineTo(26, 34); c.closePath(); }, '#2ff3ff', 2.2);
      tube(c, () => { c.beginPath(); ell(c, 40, 62, 26, 6); }, '#b46bff', 1.8);
      c.fillStyle = lin(c, 92, 108, [[0, '#5a4c7a'], [1, '#2a2140']]); c.beginPath(); rr(c, 14, 94, 52, 14, 5); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#2ff3ff'; c.beginPath(); ell(c, 40, 96, 12, 3); c.fill();
    }),
    once(sc, 'cyber_barrier', 110, 50, 2, (c) => {
      c.fillStyle = '#3a3558'; for (const x of [12, 92]) { c.fillRect(x, 20, 7, 28); c.strokeStyle = INK; c.lineWidth = 2.6; c.strokeRect(x, 20, 7, 28); }
      c.fillStyle = '#1a1036'; c.beginPath(); rr(c, 4, 10, 102, 16, 3); c.fill(); c.lineWidth = 3; c.stroke();
      c.save(); c.beginPath(); rr(c, 6, 12, 98, 12, 2); c.clip(); c.fillStyle = '#ffe14a'; for (let x = -10; x < 110; x += 16) { c.beginPath(); c.moveTo(x, 24); c.lineTo(x + 8, 12); c.lineTo(x + 16, 12); c.lineTo(x + 8, 24); c.closePath(); c.fill(); } c.restore();
      tube(c, () => { c.beginPath(); c.moveTo(8, 8); c.lineTo(102, 8); }, '#ff3fb4', 1.6);
      for (const x of [16, 96]) { glow(c, x, 4, 8, '255,59,92', 0.8); c.fillStyle = '#ff3b5c'; c.beginPath(); ell(c, x, 4, 2.5, 2.5); c.fill(); }
    }),
    once(sc, 'cyber_pipes', 90, 80, 2, (c) => {
      for (const [x, h, col] of [[8, 70, '#5a4c7a'], [34, 52, '#4a3f6a'], [58, 62, '#5a4c7a']] as [number, number, string][]) {
        c.fillStyle = col; c.beginPath(); rr(c, x, 78 - h, 22, h, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(x + 4, 80 - h, 4, h - 6);
        c.fillStyle = '#2a2140'; c.fillRect(x - 2, 78 - h, 26, 6); c.strokeRect(x - 2, 78 - h, 26, 6);
      }
      tube(c, () => { c.beginPath(); c.moveTo(19, 30); c.lineTo(19, 70); }, '#2ff3ff', 1.6);
      tube(c, () => { c.beginPath(); c.moveTo(69, 40); c.lineTo(69, 72); }, '#ff3fb4', 1.6);
      glow(c, 45, 22, 14, '180,107,255', 0.6);
    }),
    once(sc, 'cyber_bench', 100, 50, 2, (c) => {
      c.fillStyle = '#3a3558'; for (const x of [16, 78]) { c.fillRect(x, 26, 6, 22); c.strokeStyle = INK; c.lineWidth = 2.4; c.strokeRect(x, 26, 6, 22); }
      c.fillStyle = lin(c, 18, 30, [[0, '#7c7a9a'], [1, '#3b3858']]); c.beginPath(); rr(c, 6, 18, 88, 10, 3); c.fill(); c.lineWidth = 3; c.stroke();
      c.beginPath(); rr(c, 10, 2, 80, 10, 3); c.fill(); c.stroke();
      tube(c, () => { c.beginPath(); c.moveTo(12, 31); c.lineTo(88, 31); }, '#b46bff', 1.6);
    }),
  ],

  bunting: (sc) => once(sc, 'cyber_bunting', 200, 40, 2, (c) => {
    // a cable strung with little neon tubes
    c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    for (let i = 1; i < 8; i++) {
      const t = i / 8, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6, col = NEON[i % 4];
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 4); c.stroke();
      tube(c, () => { c.beginPath(); c.moveTo(x - 6, y + 6); c.lineTo(x + 6, y + 6); c.lineTo(x, y + 16); c.closePath(); }, col, 1.8);
    }
  }),

  ambient: (sc) => {
    const t = once(sc, 'cyber_rain', 2, 18, 1, (c) => { c.fillStyle = lin(c, 0, 18, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,1)']]); c.fillRect(0, 0, 2, 18); });
    return {
      texture: t, x: { min: 0, max: VIEW_W + 60 }, y: { min: -20, max: VIEW_H - 40 }, lifespan: 900, frequency: 60, quantity: 2,
      speedY: { min: 420, max: 560 }, speedX: { min: -60, max: -40 }, rotate: 6, scale: { min: 0.6, max: 1 },
      alpha: { start: 0.45, end: 0 }, tint: [0x2ff3ff, 0xff3fb4, 0xb46bff, 0xffffff], blendMode: 'ADD',
    };
  },

  overlay: (sc) => once(sc, 'cyber_overlay', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = 'rgba(10,0,30,0.12)'; for (let y = 0; y < VIEW_H; y += 3) c.fillRect(0, y, VIEW_W, 1);
    const g = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 260, VIEW_W / 2, VIEW_H / 2, 620); g.addColorStop(0, 'rgba(255,63,180,0)'); g.addColorStop(1, 'rgba(120,20,140,0.18)');
    c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
  }),
});
