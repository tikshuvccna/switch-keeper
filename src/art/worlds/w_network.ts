/** עולם הרשת: inside a computer network: a dark teal circuit-board land with glowing traces, chip buildings, cable arches, server racks and flowing packets. */
import * as Phaser from 'phaser';
import { registerWorld, mk, tex, lin, soft, nosoft, wrap, rng, VIEW_W, VIEW_H, LAYER_W } from '../world';
import { INK, ell, rr, shade } from '../puppet';

const once = (sc: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (c: CanvasRenderingContext2D) => void): string =>
  sc.textures.exists(key) ? key : tex(sc, key, mk(w, h, draw, res), res);
const TAU = Math.PI * 2;
const GLOW = '#3cf2cf', GOLD = '#e8b84a';
const CABLES = ['#2f8fe8', '#f2b134', '#e4572e', '#3fd17a', '#b67bff'];

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, a = 0.8): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col.replace('A', String(a))); g.addColorStop(1, col.replace('A', '0'));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
/** A little data packet: an envelope. */
function envelope(c: CanvasRenderingContext2D, x: number, y: number, w: number, col: string, lw: number): void {
  const h = w * 0.68;
  c.fillStyle = col; c.beginPath(); rr(c, x - w / 2, y - h / 2, w, h, w * 0.08); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.strokeStyle = lw ? INK : 'rgba(10,40,50,0.6)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(x - w / 2 + 1, y - h / 2 + 1); c.lineTo(x, y + h * 0.08); c.lineTo(x + w / 2 - 1, y - h / 2 + 1); c.stroke();
}
/** A chip package: a dark body with pins on both sides and a notch. */
function chip(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, body: string, lw: number, pins = true): void {
  if (pins) {
    c.fillStyle = '#c9d3dc';
    for (let px = x + 8; px < x + w - 6; px += 12) { c.fillRect(px, y - 6, 5, 7); c.fillRect(px, y + h - 1, 5, 7); }
  }
  c.fillStyle = lin(c, y, y + h, [[0, shade(body, 0.18)], [1, shade(body, -0.25)]]); c.beginPath(); rr(c, x, y, w, h, 4); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x + 4, y + 3, w - 8, 3);
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); ell(c, x + 10, y + h - 10, 3, 3); c.fill();
}
function rack(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, lw: number): void {
  c.fillStyle = lin(c, y, y + h, [[0, '#2d3c4e'], [1, '#141c28']]); c.beginPath(); rr(c, x, y, w, h, 4); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  for (let sy = y + 8; sy < y + h - 12; sy += 14) {
    c.fillStyle = '#3b4d63'; c.fillRect(x + 5, sy, w - 10, 10);
    c.fillStyle = 'rgba(0,0,0,0.35)'; for (let k = 0; k < 4; k++) c.fillRect(x + 9 + k * 5, sy + 3, 3, 4);
    for (let k = 0; k < 3; k++) { const on = r(); c.fillStyle = on < 0.5 ? '#3fff9a' : on < 0.75 ? '#ffc94a' : '#3cf2cf'; c.fillRect(x + w - 12 - k * 6, sy + 3, 3, 3); }
  }
}

registerWorld({
  id: 'network', name: 'עולם הרשת',

  sky: (sc) => once(sc, 'network_sky', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#04141f'], [0.5, '#0a3240'], [1, '#126058']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    // a faint grid
    c.strokeStyle = 'rgba(60,242,207,0.07)'; c.lineWidth = 1;
    for (let x = 0; x <= VIEW_W; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, VIEW_H); c.stroke(); }
    for (let y = 0; y <= VIEW_H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(VIEW_W, y); c.stroke(); }
    const r = rng(5);
    for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(160,255,230,${0.2 + r() * 0.5})`; const s = r() < 0.2 ? 3 : 2; c.fillRect(Math.round(r() * VIEW_W), Math.round(r() * 300), s, s); }
    // the internet globe: meridians, parallels and lit nodes joined by arcs
    const gx = 690, gy = 170, R = 112;
    glow(c, gx, gy, R * 2, 'rgba(60,242,207,A)', 0.28);
    c.fillStyle = lin(c, gy - R, gy + R, [[0, '#145c6a'], [1, '#0a2f3d']]); c.beginPath(); ell(c, gx, gy, R, R); c.fill();
    c.strokeStyle = 'rgba(60,242,207,0.75)'; c.lineWidth = 2; c.beginPath(); ell(c, gx, gy, R, R); c.stroke();
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(60,242,207,0.4)';
    for (let k = 1; k < 6; k++) { const rx = R * Math.abs(Math.cos((k / 6) * Math.PI)); c.beginPath(); ell(c, gx, gy, Math.max(1, rx), R); c.stroke(); }
    for (let k = -2; k <= 2; k++) { const yy = gy + (k * R) / 3, rx = Math.sqrt(R * R - (yy - gy) ** 2); c.beginPath(); ell(c, gx, yy, rx, rx * 0.16); c.stroke(); }
    const nodes: [number, number][] = [[-60, -40], [10, -80], [70, -30], [40, 40], [-30, 60], [-80, 20], [90, 50]];
    c.strokeStyle = 'rgba(255,214,107,0.85)'; c.lineWidth = 1.8;
    for (let i = 0; i < nodes.length; i++) { const [ax, ay] = nodes[i], [bx, by] = nodes[(i + 2) % nodes.length]; c.beginPath(); c.moveTo(gx + ax, gy + ay); c.quadraticCurveTo(gx + (ax + bx) / 2 * 1.5, gy + (ay + by) / 2 * 1.5 - 30, gx + bx, gy + by); c.stroke(); }
    for (const [nx, ny] of nodes) { glow(c, gx + nx, gy + ny, 12, 'rgba(255,224,130,A)', 0.9); c.fillStyle = '#fff2c0'; c.beginPath(); ell(c, gx + nx, gy + ny, 3, 3); c.fill(); }
    // orbiting ring
    c.strokeStyle = 'rgba(60,242,207,0.35)'; c.lineWidth = 2; c.beginPath(); ell(c, gx, gy, R * 1.5, R * 0.32, -0.25); c.stroke();
    envelope(c, gx - R * 1.38, gy + 22, 18, '#fff4dc', 0);
  }),

  far: (sc) => once(sc, 'network_far', LAYER_W, VIEW_H, 1, (c) => {
    const r = rng(81), base = 420;
    // the back row: tall chip towers with dim lit windows
    let x = -40;
    while (x < LAYER_W) {
      const w = 80 + r() * 90, h = 120 + r() * 170, lit: [number, number][] = [];
      for (let i = 0; i < 14; i++) if (r() < 0.6) lit.push([r(), r()]);
      wrap(LAYER_W, x, w, (xx) => {
        c.fillStyle = '#0f3a48'; for (let py = base - h + 10; py < base; py += 14) { c.fillRect(xx - 6, py, 6, 5); c.fillRect(xx + w, py, 6, 5); }
        c.fillStyle = '#0d3240'; c.fillRect(xx, base - h, w, h + 60);
        c.fillStyle = 'rgba(60,242,207,0.18)'; c.fillRect(xx, base - h, w, 3);
        for (const [a, b] of lit) { c.fillStyle = `rgba(60,242,207,${0.25 + a * 0.4})`; c.fillRect(xx + 8 + a * (w - 22), base - h + 12 + b * (h - 30), 8, 3); }
      });
      x += w + 20 + r() * 50;
    }
    // glowing data cables arching between the towers, with packets riding them
    for (let i = 0; i < 7; i++) {
      const x0 = i * (LAYER_W / 7) + 40, span = 180 + r() * 120, top = 170 + r() * 90, col = ['#3cf2cf', '#ffd66b', '#7fb8ff'][i % 3];
      wrap(LAYER_W, x0, span, (xx) => {
        c.strokeStyle = col; c.globalAlpha = 0.35; c.lineWidth = 3; c.beginPath(); c.moveTo(xx, base); c.quadraticCurveTo(xx + span / 2, top - 120, xx + span, base); c.stroke(); c.globalAlpha = 1;
        const t = 0.35 + (i % 3) * 0.15, px = (1 - t) * (1 - t) * xx + 2 * t * (1 - t) * (xx + span / 2) + t * t * (xx + span), py = (1 - t) * (1 - t) * base + 2 * t * (1 - t) * (top - 120) + t * t * base;
        glow(c, px, py, 16, 'rgba(255,240,180,A)', 0.5); envelope(c, px, py, 14, '#d8fff4', 0);
      });
    }
    // the front row: low wide chips
    x = 0;
    while (x < LAYER_W) {
      const w = 110 + r() * 120, h = 40 + r() * 50;
      wrap(LAYER_W, x, w, (xx) => {
        c.fillStyle = '#145060'; for (let px = xx + 8; px < xx + w - 6; px += 12) c.fillRect(px, base + 12 - h - 6, 5, 7);
        c.fillStyle = '#12485a'; c.beginPath(); rr(c, xx, base + 12 - h, w, h + 60, 4); c.fill();
        c.fillStyle = 'rgba(60,242,207,0.3)'; c.fillRect(xx + 10, base + 12 - h + 10, w * 0.4, 3);
      });
      x += w + 30 + r() * 60;
    }
    c.fillStyle = lin(c, 360, VIEW_H, [[0, 'rgba(18,96,88,0)'], [1, 'rgba(18,96,88,0.85)']]); c.fillRect(0, 360, LAYER_W, VIEW_H - 360);
  }),

  mid: (sc) => once(sc, 'network_mid', LAYER_W, VIEW_H, 1.5, (c) => {
    const r = rng(91), base = 482;
    // the board itself and glowing traces running along it
    c.fillStyle = lin(c, 430, base, [[0, '#0f4f4a'], [1, '#0b3a38']]); c.fillRect(0, 440, LAYER_W, 60);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 440); c.lineTo(LAYER_W, 440); c.stroke();
    for (let i = 0; i < 6; i++) {
      const y = 450 + i * 5;
      c.strokeStyle = i % 2 ? 'rgba(60,242,207,0.55)' : 'rgba(232,184,74,0.55)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, y);
      for (let x = 0; x < LAYER_W; x += 120) { c.lineTo(x + 60, y); c.lineTo(x + 66, y + (i % 2 ? -4 : 4)); c.lineTo(x + 114, y + (i % 2 ? -4 : 4)); c.lineTo(x + 120, y); }
      c.stroke();
    }
    // big cable arches (the roads of the network)
    for (let i = 0; i < 5; i++) {
      const x0 = 120 + i * 384, span = 220 + r() * 60, h = 170 + r() * 80, col = CABLES[i % CABLES.length];
      wrap(LAYER_W, x0, span, (xx) => {
        const arc = () => { c.beginPath(); c.moveTo(xx, base - 40); c.bezierCurveTo(xx, base - 40 - h, xx + span, base - 40 - h, xx + span, base - 40); };
        arc(); c.strokeStyle = INK; c.lineWidth = 16; c.stroke();
        arc(); c.strokeStyle = col; c.lineWidth = 12; c.stroke();
        arc(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.stroke();
        for (const ex of [xx, xx + span]) { c.fillStyle = '#c9d3dc'; c.beginPath(); rr(c, ex - 11, base - 46, 22, 18, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.fillStyle = '#e8b84a'; c.fillRect(ex - 6, base - 34, 12, 3); }
        // a packet travelling on the arch
        const t = 0.3 + (i % 3) * 0.2, bx = (1 - t) ** 3 * xx + 3 * (1 - t) ** 2 * t * xx + 3 * (1 - t) * t * t * (xx + span) + t ** 3 * (xx + span);
        const by = (1 - t) ** 3 * (base - 40) + 3 * (1 - t) ** 2 * t * (base - 40 - h) + 3 * (1 - t) * t * t * (base - 40 - h) + t ** 3 * (base - 40);
        glow(c, bx, by - 14, 22, 'rgba(255,240,180,A)', 0.6); envelope(c, bx, by - 14, 22, '#fff4dc', 2);
      });
    }
    // chips, server racks and capacitors standing on the board
    let x = 20;
    while (x < LAYER_W - 40) {
      const k = r(), at = x;
      if (k < 0.35) {
        const w = 90 + r() * 70, h = 60 + r() * 50, body = ['#1e2a3a', '#25324a', '#1b3340'][Math.floor(r() * 3)];
        wrap(LAYER_W, at, w, (xx) => {
          chip(c, xx, base - 40 - h, w, h, body, 2);
          c.fillStyle = 'rgba(60,242,207,0.8)'; c.fillRect(xx + 12, base - 40 - h + 16, w * 0.5, 3); c.fillStyle = 'rgba(232,184,74,0.7)'; c.fillRect(xx + 12, base - 40 - h + 24, w * 0.3, 3);
        });
        x += w + 40 + r() * 40;
      } else if (k < 0.65) {
        const w = 44 + r() * 14, h = 120 + r() * 80, seed = r() * 1000;
        wrap(LAYER_W, at, w * 2 + 6, (xx) => { const rr2 = rng(seed); rack(c, xx, base - 40 - h, w, h, rr2, 2); rack(c, xx + w + 4, base - 40 - h * 0.8, w, h * 0.8, rr2, 2); });
        x += w * 2 + 50 + r() * 40;
      } else {
        const n = 2 + Math.floor(r() * 2);
        wrap(LAYER_W, at, n * 30, (xx) => {
          for (let i = 0; i < n; i++) {
            const cx = xx + i * 30, h = 40 + (i % 2) * 16, col = i % 2 ? '#2f6fd1' : '#3a8a6a';
            c.fillStyle = col; c.beginPath(); rr(c, cx, base - 40 - h, 24, h, 6); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
            c.fillStyle = '#c9d3dc'; c.beginPath(); ell(c, cx + 12, base - 40 - h + 3, 11, 3.5); c.fill(); c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(cx + 4, base - 34 - h, 4, h - 12);
            c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(cx + 15, base - 32 - h, 3, h - 14);
          }
        });
        x += n * 30 + 40 + r() * 40;
      }
    }
    // solder dots along the board edge
    for (let x2 = 10; x2 < LAYER_W; x2 += 24) { c.fillStyle = '#e8b84a'; c.beginPath(); ell(c, x2, 444, 2.5, 2.5); c.fill(); }
    // push back: a dark teal tint, then soft glow pools on the traces
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(8,40,52,0.35)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }),

  ground: (sc, w) => once(sc, `network_ground_${w}`, w, 120, 1, (c) => {
    const r = rng(w * 19 + 1);
    // board body: layered laminate
    c.fillStyle = lin(c, 0, 120, [[0, '#0f5a52'], [1, '#062a2a']]); c.fillRect(0, 0, w, 120);
    for (const [y, col] of [[36, 'rgba(232,184,74,0.35)'], [60, 'rgba(0,0,0,0.25)'], [84, 'rgba(60,242,207,0.18)']] as [number, string][]) { c.fillStyle = col; c.fillRect(0, y, w, 3); }
    // vias and buried traces
    for (let x = 14; x < w; x += 40 + r() * 40) {
      const y = 44 + r() * 60;
      c.strokeStyle = 'rgba(60,242,207,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, 22); c.lineTo(x, y - 10); c.lineTo(x + 10, y); c.lineTo(x + 40, y); c.stroke();
      c.fillStyle = 'rgba(232,184,74,0.6)'; c.beginPath(); ell(c, x + 40, y, 3.5, 3.5); c.fill(); c.fillStyle = '#062a2a'; c.beginPath(); ell(c, x + 40, y, 1.4, 1.4); c.fill();
    }
    // the board top: green lacquer with gold traces and solder dots
    c.fillStyle = lin(c, 0, 22, [[0, '#23a08a'], [1, '#147563']]); c.fillRect(0, 0, w, 22);
    c.strokeStyle = GOLD; c.lineWidth = 2;
    for (let x = 0; x < w;) {
      const len = 30 + r() * 50, y = 8 + Math.floor(r() * 3) * 4;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y); c.lineTo(x + len + 5, y + (r() < 0.5 ? 4 : -4)); c.stroke();
      c.fillStyle = '#f6d27a'; c.beginPath(); ell(c, x, y, 2.6, 2.6); c.fill();
      x += len + 14 + r() * 20;
    }
    for (let x = 6; x < w; x += 18 + r() * 30) { c.fillStyle = '#d9e2e8'; c.beginPath(); ell(c, x, 18, 1.8, 1.8); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22); c.lineTo(w, 22); c.stroke();
    c.fillStyle = 'rgba(150,255,230,0.55)'; c.fillRect(0, 2, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }),

  platform: (sc, w, style, seed) => once(sc, `network_plat_${style}_${w}_${seed}`, w, 40, 1, (c) => {
    if (style === 'plank') {
      // a chip package with legs
      c.fillStyle = '#c9d3dc'; c.strokeStyle = INK; c.lineWidth = 1.5;
      for (let px = 10; px < w - 10; px += 12) { c.beginPath(); c.moveTo(px, 22); c.lineTo(px, 30); c.lineTo(px + 4, 34); c.lineTo(px + 6, 34); c.lineTo(px + 6, 22); c.closePath(); c.fill(); c.stroke(); }
      soft(c, 6, 4, 0.35);
      c.fillStyle = lin(c, 4, 24, [[0, '#3a4a60'], [1, '#1a2230']]); c.beginPath(); rr(c, 2, 4, w - 4, 20, 4); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = 'rgba(150,255,230,0.6)'; c.fillRect(6, 6, w - 12, 2.5);
      c.fillStyle = GLOW; c.fillRect(14, 13, Math.min(60, w * 0.4), 3);
      c.fillStyle = 'rgba(232,184,74,0.8)'; c.fillRect(14, 18, Math.min(34, w * 0.25), 2);
      c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); ell(c, w - 14, 15, 3.5, 3.5); c.fill();
    } else {
      // a ribbon of bundled cables held by clips
      const n = 4, ch = 5;
      soft(c, 6, 4, 0.35); c.fillStyle = INK; c.beginPath(); rr(c, 2, 4, w - 4, n * ch + 4, 6); c.fill(); nosoft(c);
      for (let i = 0; i < n; i++) {
        const col = CABLES[(seed + i) % CABLES.length];
        c.fillStyle = lin(c, 6 + i * ch, 6 + (i + 1) * ch, [[0, shade(col, 0.35)], [1, shade(col, -0.2)]]); c.beginPath(); rr(c, 4, 6 + i * ch, w - 8, ch - 0.5, 2.5); c.fill();
      }
      for (const x of [16, w / 2 - 6, w - 28]) { c.fillStyle = '#c9d3dc'; c.beginPath(); rr(c, x, 2, 12, n * ch + 8, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x + 2, 4, 3, n * ch + 4); }
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); rr(c, 2, 4, w - 4, n * ch + 4, 6); c.stroke();
      // a connector plugging the ends
      c.fillStyle = '#e8b84a'; c.fillRect(w * 0.3, 26, 8, 6); c.fillRect(w * 0.7, 26, 8, 6);
    }
  }),

  lamp: (sc) => once(sc, 'network_lamp', 70, 200, 2, (c) => {
    glow(c, 35, 36, 36, 'rgba(60,242,207,A)', 0.8);
    c.fillStyle = '#2d3c4e'; c.beginPath(); rr(c, 31, 50, 8, 140, 3); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#1e2a3a'; c.beginPath(); rr(c, 18, 182, 34, 16, 4); c.fill(); c.stroke();
    c.fillStyle = '#3fff9a'; c.fillRect(24, 188, 4, 4); c.fillStyle = '#ffc94a'; c.fillRect(31, 188, 4, 4);
    c.strokeStyle = GLOW; c.lineWidth = 2; c.beginPath(); c.moveTo(35, 60); c.lineTo(35, 180); c.stroke();
    // the glowing beacon orb with signal arcs
    c.fillStyle = '#d8fff4'; c.beginPath(); ell(c, 35, 36, 12, 12); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = GLOW; c.beginPath(); ell(c, 35, 36, 6, 6); c.fill();
    c.strokeStyle = 'rgba(60,242,207,0.9)'; c.lineWidth = 2.5;
    for (let k = 1; k <= 2; k++) { c.beginPath(); c.arc(35, 36, 12 + k * 8, -2.4, -0.7); c.stroke(); }
    c.fillStyle = '#2d3c4e'; c.beginPath(); rr(c, 27, 46, 16, 8, 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
  }),

  props: (sc) => [
    once(sc, 'network_rack', 64, 120, 2, (c) => { rack(c, 6, 4, 52, 114, rng(3), 3); c.fillStyle = '#c9d3dc'; c.fillRect(10, 112, 6, 6); c.fillRect(48, 112, 6, 6); }),
    once(sc, 'network_caps', 80, 70, 2, (c) => {
      for (const [x, h, col] of [[6, 58, '#2f6fd1'], [32, 44, '#3a8a6a'], [56, 30, '#b67bff']] as [number, number, string][]) {
        c.fillStyle = col; c.beginPath(); rr(c, x, 68 - h, 20, h, 6); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
        c.fillStyle = '#c9d3dc'; c.beginPath(); ell(c, x + 10, 70 - h, 9, 3); c.fill(); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + 4, 74 - h, 3, h - 12); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x + 13, 74 - h, 2, h - 12);
      }
    }),
    once(sc, 'network_packets', 90, 70, 2, (c) => {
      // a stack of envelopes (packets) waiting to be delivered
      envelope(c, 44, 58, 70, '#f6efe0', 3); envelope(c, 40, 38, 62, '#ffe39a', 3); envelope(c, 48, 20, 48, '#9be7d6', 3);
      c.fillStyle = '#e4572e'; c.beginPath(); ell(c, 48, 22, 5, 5); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }),
    once(sc, 'network_router', 100, 70, 2, (c) => {
      for (const x of [22, 50, 78]) { c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(x, 40); c.lineTo(x + (x - 50) * 0.2, 8); c.stroke(); c.strokeStyle = '#3b4d63'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#3b4d63'; c.beginPath(); ell(c, x + (x - 50) * 0.2, 8, 3.5, 3.5); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); }
      c.fillStyle = lin(c, 38, 68, [[0, '#4a5c74'], [1, '#222c3a']]); c.beginPath(); rr(c, 6, 38, 88, 28, 6); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(12, 41, 76, 3);
      for (let k = 0; k < 6; k++) { c.fillStyle = k % 3 === 2 ? '#ffc94a' : '#3fff9a'; c.fillRect(16 + k * 11, 52, 6, 4); }
      c.strokeStyle = 'rgba(60,242,207,0.8)'; c.lineWidth = 2; for (let k = 1; k <= 2; k++) { c.beginPath(); c.arc(50, 8, 8 + k * 8, -2.3, -0.84); c.stroke(); }
    }),
    once(sc, 'network_spool', 80, 76, 2, (c) => {
      c.fillStyle = '#8a5a34'; c.beginPath(); ell(c, 40, 38, 36, 36); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#2f8fe8'; c.beginPath(); ell(c, 40, 38, 28, 28); c.fill(); c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2; for (let k = 12; k < 28; k += 4) { c.beginPath(); ell(c, 40, 38, k, k); c.stroke(); }
      c.fillStyle = '#c9a06a'; c.beginPath(); ell(c, 40, 38, 9, 9); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = INK; c.beginPath(); ell(c, 40, 38, 3, 3); c.fill();
      c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(66, 50); c.quadraticCurveTo(78, 70, 60, 74); c.stroke(); c.strokeStyle = '#2f8fe8'; c.lineWidth = 3.5; c.stroke();
      c.fillStyle = '#c9d3dc'; c.beginPath(); rr(c, 50, 68, 12, 8, 2); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
    }),
    once(sc, 'network_heatsink', 80, 64, 2, (c) => {
      chip(c, 6, 40, 68, 20, '#1e2a3a', 2.6, false);
      c.fillStyle = '#9fb3c4'; c.strokeStyle = INK; c.lineWidth = 2;
      for (let x = 10; x < 70; x += 9) { c.beginPath(); rr(c, x, 6, 6, 36, 2); c.fill(); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.45)'; for (let x = 11; x < 70; x += 9) c.fillRect(x + 1, 8, 2, 30);
      glow(c, 40, 50, 16, 'rgba(60,242,207,A)', 0.4);
    }),
  ],

  bunting: (sc) => once(sc, 'network_bunting', 200, 40, 2, (c) => {
    c.strokeStyle = INK; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    c.strokeStyle = '#f2b134'; c.lineWidth = 2; c.stroke();
    for (let i = 1; i < 7; i++) {
      const t = i / 7, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6;
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 6); c.stroke();
      glow(c, x, y + 13, 14, 'rgba(60,242,207,A)', 0.5);
      envelope(c, x, y + 13, 18, ['#fff4dc', '#9be7d6', '#ffe39a'][i % 3], 1.8);
    }
  }),

  ambient: (sc) => {
    const t = once(sc, 'network_bit', 6, 6, 1, (c) => { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, 0, 6, 6); c.fillStyle = '#fff'; c.fillRect(1.5, 1.5, 3, 3); });
    return {
      texture: t, x: { min: 0, max: VIEW_W }, y: { min: 60, max: VIEW_H + 20 }, lifespan: 5000, frequency: 120, quantity: 1,
      speedY: { min: -40, max: -15 }, speedX: { min: -6, max: 6 }, scale: { min: 0.6, max: 1.3 },
      alpha: { start: 0.9, end: 0 }, tint: [0x3cf2cf, 0x3fff9a, 0xffd66b, 0x7fb8ff], blendMode: 'ADD',
    };
  },

  overlay: (sc) => once(sc, 'network_overlay', VIEW_W, VIEW_H, 1, (c) => {
    // a cool glow from the top and a faint dark edge
    c.fillStyle = lin(c, 0, 160, [[0, 'rgba(60,242,207,0.08)'], [1, 'rgba(60,242,207,0)']]); c.fillRect(0, 0, VIEW_W, 160);
  }),
});
