/** הר הגעש: a volcano land: a red smoky sky, erupting cones, glowing lava rivers, basalt columns, obsidian crystals, bronze grates and stone totems. */
import * as Phaser from 'phaser';
import { registerWorld, mk, tex, lin, soft, nosoft, wrap, rng, VIEW_W, VIEW_H, LAYER_W } from '../world';
import { INK, ell, rr, shade } from '../puppet';

const once = (sc: Phaser.Scene, key: string, w: number, h: number, res: number, draw: (c: CanvasRenderingContext2D) => void): string =>
  sc.textures.exists(key) ? key : tex(sc, key, mk(w, h, draw, res), res);
const TAU = Math.PI * 2;
const wave = (x: number, parts: [number, number, number][]) => parts.reduce((s, [k, a, p]) => s + a * Math.sin((x / LAYER_W) * TAU * k + p), 0);

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, a = 0.7, rgb = '255,140,40'): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`);
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function smoke(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string): void {
  c.fillStyle = col; c.beginPath();
  for (const [dx, dy, r] of [[-30, 6, 22], [-10, -8, 28], [16, -2, 24], [34, 8, 18], [0, 10, 22]] as [number, number, number][]) ell(c, x + dx * s, y + dy * s, r * s, r * 0.85 * s);
  c.fill();
}
/** Hexagonal basalt columns of varied heights standing on y. */
function columns(c: CanvasRenderingContext2D, x: number, y: number, n: number, cw: number, hs: number[], lw: number): void {
  for (let i = 0; i < n; i++) {
    const cx = x + i * cw, h = hs[i % hs.length];
    c.fillStyle = lin(c, y - h, y, [[0, '#4a3a4e'], [1, '#1e1420']]); c.fillRect(cx, y - h, cw, h);
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(cx + 2, y - h, cw * 0.3, h);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(cx + cw * 0.7, y - h, cw * 0.3, h);
    if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.strokeRect(cx, y - h, cw, h); }
    c.fillStyle = '#6a5866'; c.beginPath(); c.moveTo(cx, y - h); c.lineTo(cx + cw * 0.25, y - h - 5); c.lineTo(cx + cw * 0.75, y - h - 5); c.lineTo(cx + cw, y - h); c.lineTo(cx + cw * 0.75, y - h + 4); c.lineTo(cx + cw * 0.25, y - h + 4); c.closePath(); c.fill();
    if (lw) { c.lineWidth = lw * 0.8; c.stroke(); }
  }
}
function obsidian(c: CanvasRenderingContext2D, x: number, y: number, h: number, w: number, lean: number, lw: number): void {
  c.fillStyle = lin(c, y - h, y, [[0, '#5a3a7a'], [0.5, '#2a1840'], [1, '#140a22']]);
  c.beginPath(); c.moveTo(x - w / 2, y); c.lineTo(x - w * 0.4 + lean * 0.7, y - h * 0.75); c.lineTo(x + lean, y - h); c.lineTo(x + w * 0.45 + lean * 0.7, y - h * 0.7); c.lineTo(x + w / 2, y); c.closePath(); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.fillStyle = 'rgba(200,150,255,0.45)'; c.beginPath(); c.moveTo(x - w * 0.38, y - 3); c.lineTo(x - w * 0.4 + lean * 0.7 + 2, y - h * 0.74); c.lineTo(x + lean, y - h + 3); c.lineTo(x - w * 0.1, y - h * 0.4); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,150,60,0.6)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + w * 0.45 + lean * 0.7, y - h * 0.7); c.lineTo(x + w / 2 - 1, y - 2); c.stroke();
}
function totem(c: CanvasRenderingContext2D, x: number, y: number, s: number, lw: number): void {
  const blocks: [number, number, string][] = [[34, 30, '#6a4a3a'], [28, 26, '#7a5444'], [32, 26, '#5e4234']];
  let yy = y;
  blocks.forEach(([w, h, col], i) => {
    const bw = w * s, bh = h * s;
    c.fillStyle = lin(c, yy - bh, yy, [[0, shade(col, 0.15)], [1, shade(col, -0.25)]]); c.beginPath(); rr(c, x - bw / 2, yy - bh, bw, bh, 4 * s); c.fill();
    if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
    // carved glowing slits and chevrons
    glow(c, x, yy - bh / 2, bw * 0.6, 0.35);
    c.fillStyle = '#ffb347';
    if (i % 2 === 0) { c.fillRect(x - bw * 0.3, yy - bh * 0.6, bw * 0.18, 3 * s); c.fillRect(x + bw * 0.12, yy - bh * 0.6, bw * 0.18, 3 * s); c.fillRect(x - bw * 0.15, yy - bh * 0.3, bw * 0.3, 3 * s); }
    else { c.beginPath(); c.moveTo(x - bw * 0.3, yy - bh * 0.35); c.lineTo(x, yy - bh * 0.65); c.lineTo(x + bw * 0.3, yy - bh * 0.35); c.lineTo(x + bw * 0.3, yy - bh * 0.25); c.lineTo(x, yy - bh * 0.55); c.lineTo(x - bw * 0.3, yy - bh * 0.25); c.closePath(); c.fill(); }
    yy -= bh;
  });
  // the wing-like top piece
  c.fillStyle = '#8a5a3a'; c.beginPath(); c.moveTo(x - 26 * s, yy); c.lineTo(x - 10 * s, yy - 14 * s); c.lineTo(x + 10 * s, yy - 14 * s); c.lineTo(x + 26 * s, yy); c.closePath(); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
}
function lavaPool(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, lw: number): void {
  glow(c, x, y - ry, rx * 1.3, 0.5);
  c.fillStyle = lin(c, y - ry, y + ry, [[0, '#ffd23f'], [0.6, '#ff7a1a'], [1, '#d93a12']]); c.beginPath(); ell(c, x, y, rx, ry); c.fill();
  if (lw) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); }
  c.fillStyle = '#fff1a0'; c.beginPath(); ell(c, x - rx * 0.3, y - ry * 0.2, rx * 0.12, ry * 0.25); ell(c, x + rx * 0.35, y + ry * 0.1, rx * 0.08, ry * 0.2); c.fill();
  c.strokeStyle = 'rgba(255,240,160,0.8)'; c.lineWidth = 1.5; c.beginPath(); ell(c, x + rx * 0.1, y - ry * 0.25, rx * 0.12, ry * 0.25); c.stroke();
}

registerWorld({
  id: 'lava', name: 'הר הגעש',

  sky: (sc) => once(sc, 'lava_sky', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#1e0812'], [0.4, '#5a1420'], [0.75, '#b8361e'], [1, '#ff8a2a']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    glow(c, 620, 470, 420, 0.4, '255,170,60');
    // a dim red sun behind the smoke
    c.fillStyle = 'rgba(255,120,70,0.55)'; c.beginPath(); ell(c, 260, 230, 64, 64); c.fill();
    c.fillStyle = 'rgba(255,170,110,0.5)'; c.beginPath(); ell(c, 260, 230, 50, 50); c.fill();
    // layered smoke clouds
    for (const [x, y, s, col] of [[160, 80, 1.6, 'rgba(60,20,40,0.75)'], [480, 60, 1.9, 'rgba(70,24,44,0.7)'], [820, 110, 1.5, 'rgba(60,20,40,0.7)'], [330, 180, 1.1, 'rgba(90,30,46,0.55)'], [700, 230, 1.2, 'rgba(110,40,50,0.45)'], [60, 260, 1, 'rgba(110,40,50,0.4)']] as [number, number, number, string][]) {
      smoke(c, x, y + 8 * s, s, 'rgba(20,6,14,0.35)'); smoke(c, x, y, s, col);
    }
    const r = rng(23);
    for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,${150 + r() * 80},80,${0.3 + r() * 0.5})`; c.beginPath(); ell(c, r() * VIEW_W, 150 + r() * 300, 1.3, 1.3); c.fill(); }
  }),

  far: (sc) => once(sc, 'lava_far', LAYER_W, VIEW_H, 1, (c) => {
    const r = rng(161);
    // erupting volcano cones
    for (const [vx, vh, vw, erupt] of [[300, 260, 260, true], [760, 170, 200, false], [1180, 300, 300, true], [1650, 200, 220, false]] as [number, number, number, boolean][]) wrap(LAYER_W, vx - vw * 1.2, vw * 2.4, (xx) => {
      const cx = xx + vw * 1.2, top = 430 - vh;
      if (erupt) {
        glow(c, cx, top - 20, 160, 0.55, '255,120,40');
        smoke(c, cx - 20, top - 120, 2.2, 'rgba(50,16,30,0.75)'); smoke(c, cx + 40, top - 200, 1.8, 'rgba(60,20,36,0.6)'); smoke(c, cx - 50, top - 260, 1.4, 'rgba(70,24,40,0.45)');
        c.fillStyle = '#ffb347'; for (const [dx, dy, s] of [[-30, -50, 5], [20, -70, 4], [44, -40, 3.5], [-56, -26, 3], [6, -96, 3]]) { c.beginPath(); ell(c, cx + dx, top + dy, s, s); c.fill(); }
        c.fillStyle = lin(c, top - 60, top, [[0, 'rgba(255,210,63,0)'], [1, 'rgba(255,170,50,0.9)']]); c.beginPath(); c.moveTo(cx - 18, top); c.quadraticCurveTo(cx - 4, top - 70, cx, top - 80); c.quadraticCurveTo(cx + 6, top - 70, cx + 18, top); c.fill();
      }
      c.fillStyle = '#3a1422'; c.beginPath(); c.moveTo(cx - vw * 1.2, 470); c.quadraticCurveTo(cx - vw * 0.4, top + vh * 0.2, cx - vw * 0.12, top); c.lineTo(cx + vw * 0.12, top); c.quadraticCurveTo(cx + vw * 0.4, top + vh * 0.2, cx + vw * 1.2, 470); c.closePath(); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(cx + vw * 0.02, top); c.lineTo(cx + vw * 0.12, top); c.quadraticCurveTo(cx + vw * 0.4, top + vh * 0.2, cx + vw * 1.2, 470); c.lineTo(cx + vw * 0.2, 470); c.closePath(); c.fill();
      // crater glow and lava streaks
      c.fillStyle = '#ff8a2a'; c.beginPath(); ell(c, cx, top + 2, vw * 0.12, 6); c.fill();
      if (erupt) {
        c.strokeStyle = 'rgba(255,140,40,0.85)'; c.lineWidth = 4;
        for (const d of [-1, 0.4, 1]) { c.beginPath(); c.moveTo(cx + d * vw * 0.08, top + 4); c.quadraticCurveTo(cx + d * vw * 0.25, top + vh * 0.4, cx + d * vw * 0.5, top + vh * 0.85); c.stroke(); }
      }
    });
    // a nearer range of dark ridges with glowing seams
    const R: [number, number, number][] = [[3, 18, 0.9], [7, 10, 2.1], [13, 5, 0.4]];
    c.fillStyle = '#2a0e18'; c.beginPath(); c.moveTo(0, VIEW_H); for (let x = 0; x <= LAYER_W; x += 8) c.lineTo(x, 430 + wave(x, R)); c.lineTo(LAYER_W, VIEW_H); c.fill();
    c.strokeStyle = 'rgba(255,110,40,0.45)'; c.lineWidth = 2;
    for (let i = 0; i < 18; i++) { const x = r() * LAYER_W, y = 440 + wave(x, R); wrap(LAYER_W, x - 10, 40, (xx) => { c.beginPath(); c.moveTo(xx, y); c.lineTo(xx + 8, y + 14); c.lineTo(xx + 4, y + 30); c.stroke(); }); }
    c.fillStyle = lin(c, 380, VIEW_H, [[0, 'rgba(255,110,40,0)'], [1, 'rgba(255,110,40,0.5)']]); c.fillRect(0, 380, LAYER_W, VIEW_H - 380);
  }),

  mid: (sc) => once(sc, 'lava_mid', LAYER_W, VIEW_H, 1.5, (c) => {
    const r = rng(171), base = 482;
    // the river of lava along the bottom, with a glowing bank
    c.fillStyle = lin(c, 440, VIEW_H, [[0, 'rgba(255,120,40,0)'], [0.5, 'rgba(255,120,40,0.35)'], [1, 'rgba(255,120,40,0.5)']]); c.fillRect(0, 380, LAYER_W, VIEW_H - 380);
    c.fillStyle = lin(c, 452, 500, [[0, '#ffd23f'], [0.4, '#ff8a1a'], [1, '#c83010']]); c.fillRect(0, 456, LAYER_W, 60);
    c.strokeStyle = 'rgba(255,245,170,0.85)'; c.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const x = r() * LAYER_W, y = 462 + r() * 16, w = 20 + r() * 40; wrap(LAYER_W, x, w, (xx) => { c.beginPath(); c.moveTo(xx, y); c.quadraticCurveTo(xx + w / 2, y - 3, xx + w, y); c.stroke(); }); }
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 456); c.lineTo(LAYER_W, 456); c.stroke();
    // fire-lit rock arches over the river
    for (const ax of [420, 1360]) wrap(LAYER_W, ax - 130, 260, (xx) => {
      glow(c, xx, base - 70, 130, 0.35);
      c.fillStyle = lin(c, base - 230, base, [[0, '#5a3442'], [1, '#2a141e']]); c.beginPath(); c.moveTo(xx - 130, base); c.lineTo(xx - 118, base - 150); c.quadraticCurveTo(xx - 100, base - 236, xx, base - 232); c.quadraticCurveTo(xx + 110, base - 230, xx + 120, base - 140); c.lineTo(xx + 130, base);
      c.lineTo(xx + 72, base); c.lineTo(xx + 66, base - 110); c.quadraticCurveTo(xx, base - 190, xx - 66, base - 110); c.lineTo(xx - 72, base); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(255,150,60,0.75)'; c.lineWidth = 3; c.beginPath(); c.moveTo(xx - 66, base - 110); c.quadraticCurveTo(xx, base - 190, xx + 66, base - 110); c.stroke();
      c.strokeStyle = 'rgba(255,130,50,0.5)'; c.lineWidth = 2; for (const dx of [-100, 90]) { c.beginPath(); c.moveTo(xx + dx, base - 200); c.lineTo(xx + dx + 6, base - 170); c.lineTo(xx + dx, base - 140); c.stroke(); }
    });
    // basalt column clusters, obsidian and totems along the bank
    let x = 30;
    while (x < LAYER_W - 40) {
      const k = r(), at = x;
      if ([420, 1360].some((a) => Math.abs(at - a) < 150)) { x += 40; continue; }
      if (k < 0.4) { const n = 3 + Math.floor(r() * 4), cw = 22 + r() * 6, hs = Array.from({ length: n }, () => 60 + r() * 130); wrap(LAYER_W, at, n * cw, (xx) => columns(c, xx, base, n, cw, hs, 2)); x += n * cw + 40 + r() * 50; }
      else if (k < 0.65) { const h = 70 + r() * 60; wrap(LAYER_W, at - 40, 80, (xx) => { glow(c, xx, base - h * 0.4, h * 0.7, 0.25, '200,120,255'); obsidian(c, xx, base, h, 34, -8, 2); obsidian(c, xx + 26, base, h * 0.6, 24, 10, 2); obsidian(c, xx - 22, base, h * 0.45, 20, -10, 2); }); x += 90 + r() * 50; }
      else if (k < 0.85) { wrap(LAYER_W, at - 30, 60, (xx) => totem(c, xx, base, 1.3, 2)); x += 70 + r() * 50; }
      else { wrap(LAYER_W, at - 50, 100, (xx) => lavaPool(c, xx, base - 4, 44, 9, 2)); x += 110 + r() * 40; }
    }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(80,20,40,0.28)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }),

  ground: (sc, w) => once(sc, `lava_ground_${w}`, w, 120, 1, (c) => {
    const r = rng(w * 37 + 5);
    c.fillStyle = lin(c, 0, 120, [[0, '#3a2a36'], [1, '#120a10']]); c.fillRect(0, 0, w, 120);
    // basalt column faces with glowing cracks between them
    let x = -10;
    while (x < w) {
      const cw = 28 + r() * 18;
      c.fillStyle = 'rgba(255,255,255,0.05)'; c.fillRect(x + 3, 22, cw * 0.3, 98);
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + cw * 0.72, 22, cw * 0.28, 98);
      c.strokeStyle = 'rgba(255,110,30,0.35)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + cw, 22); c.lineTo(x + cw + (r() - 0.5) * 4, 120); c.stroke();
      c.strokeStyle = '#ff9a2a'; c.lineWidth = 1.6; c.stroke();
      if (r() < 0.5) { const y = 40 + r() * 60; c.strokeStyle = '#ff7a1a'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x + 2, y); c.lineTo(x + cw * 0.5, y + 6); c.lineTo(x + cw, y + 2); c.stroke(); }
      x += cw;
    }
    c.fillStyle = lin(c, 80, 120, [[0, 'rgba(255,90,20,0)'], [1, 'rgba(255,90,20,0.35)']]); c.fillRect(0, 80, w, 40);
    // the hot lip: dark rock with a glowing rim underneath
    c.fillStyle = 'rgba(255,120,30,0.5)'; c.fillRect(0, 20, w, 6);
    c.fillStyle = lin(c, 0, 22, [[0, '#6a5562'], [1, '#3e2c38']]); c.beginPath(); c.moveTo(0, 0); c.lineTo(w, 0); c.lineTo(w, 20);
    for (let xx = w; xx > 0; xx -= 14) c.lineTo(xx - 7, 20 + (r() < 0.5 ? 4 : 0));
    c.lineTo(0, 20); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    for (let xx = 8; xx < w; xx += 40 + r() * 60) { c.strokeStyle = '#ff9a2a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(xx, 6); c.lineTo(xx + 6, 12); c.lineTo(xx + 3, 18); c.stroke(); }
    c.fillStyle = 'rgba(255,190,120,0.45)'; c.fillRect(0, 2, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }),

  platform: (sc, w, style, seed) => once(sc, `lava_plat_${style}_${w}_${seed}`, w, 40, 1, (c) => {
    const r = rng(seed * 19 + w);
    if (style === 'plank') {
      // a basalt slab: column tops with glowing seams, a drip of lava below
      soft(c, 6, 4, 0.4); c.fillStyle = lin(c, 4, 26, [[0, '#6a5562'], [1, '#2a1c26']]); c.beginPath(); c.moveTo(2, 6); c.lineTo(w - 2, 4); c.lineTo(w - 6, 24); c.lineTo(w * 0.6, 28); c.lineTo(6, 24); c.closePath(); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.strokeStyle = '#ff9a2a'; c.lineWidth = 1.6; for (let x = 20; x < w - 10; x += 22 + r() * 10) { c.beginPath(); c.moveTo(x, 7); c.lineTo(x + 3, 16); c.lineTo(x - 1, 25); c.stroke(); }
      c.fillStyle = 'rgba(255,200,150,0.4)'; c.fillRect(6, 7, w - 12, 2.5);
      const dx = w * (0.3 + r() * 0.4); glow(c, dx, 30, 10, 0.6); c.fillStyle = '#ffb347'; c.beginPath(); c.moveTo(dx - 4, 26); c.quadraticCurveTo(dx, 38, dx + 4, 26); c.fill();
    } else {
      // a bronze grate with heat glowing through
      glow(c, w / 2, 30, Math.min(70, w * 0.45), 0.35);
      soft(c, 6, 4, 0.35); c.fillStyle = lin(c, 4, 22, [[0, '#e0a24a'], [1, '#8a5420']]); c.beginPath(); rr(c, 2, 4, w - 4, 16, 3); c.fill(); nosoft(c);
      c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.fillStyle = '#2a1408'; for (let x = 10; x < w - 10; x += 10) c.fillRect(x, 9, 5, 8);
      c.fillStyle = 'rgba(255,140,40,0.75)'; for (let x = 10; x < w - 10; x += 10) c.fillRect(x, 14, 5, 3);
      c.fillStyle = 'rgba(255,240,200,0.55)'; c.fillRect(6, 5.5, w - 12, 2);
      for (const x of [w * 0.15, w * 0.85]) { c.fillStyle = '#8a5420'; c.beginPath(); c.moveTo(x - 6, 20); c.lineTo(x + 6, 20); c.lineTo(x, 34); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke(); }
      for (const x of [8, w - 8]) { c.fillStyle = '#ffd27a'; c.beginPath(); ell(c, x, 12, 2.2, 2.2); c.fill(); }
    }
  }),

  lamp: (sc) => once(sc, 'lava_lamp', 70, 200, 2, (c) => {
    // a bronze brazier with a flame on a basalt pillar
    glow(c, 35, 34, 38, 0.85, '255,170,60');
    columns(c, 24, 188, 1, 22, [128], 3);
    c.fillStyle = '#3e2c38'; c.beginPath(); rr(c, 14, 184, 42, 14, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
    c.fillStyle = lin(c, 44, 60, [[0, '#e0a24a'], [1, '#8a5420']]); c.beginPath(); c.moveTo(12, 44); c.lineTo(58, 44); c.lineTo(48, 60); c.lineTo(22, 60); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(18, 45); c.quadraticCurveTo(14, 26, 26, 18); c.quadraticCurveTo(26, 28, 32, 26); c.quadraticCurveTo(30, 12, 38, 4); c.quadraticCurveTo(40, 20, 46, 22); c.quadraticCurveTo(50, 16, 50, 12); c.quadraticCurveTo(60, 30, 52, 45); c.closePath(); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(24, 45); c.quadraticCurveTo(24, 32, 32, 30); c.quadraticCurveTo(34, 22, 38, 18); c.quadraticCurveTo(44, 30, 46, 45); c.closePath(); c.fill();
    c.fillStyle = '#fff3c0'; c.beginPath(); ell(c, 35, 40, 5, 6); c.fill();
  }),

  props: (sc) => [
    once(sc, 'lava_obsidian', 80, 100, 2, (c) => { glow(c, 40, 55, 40, 0.3, '200,120,255'); obsidian(c, 22, 98, 50, 22, -8, 2.6); obsidian(c, 58, 98, 40, 20, 8, 2.6); obsidian(c, 40, 98, 90, 30, 0, 2.6); }),
    once(sc, 'lava_columns', 100, 120, 2, (c) => { columns(c, 6, 118, 4, 22, [70, 104, 86, 52], 3); c.strokeStyle = '#ff9a2a'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(28, 40); c.lineTo(28, 118); c.moveTo(72, 60); c.lineTo(72, 118); c.stroke(); }),
    once(sc, 'lava_totem', 70, 120, 2, (c) => totem(c, 35, 118, 1.3, 3)),
    once(sc, 'lava_pool', 110, 50, 2, (c) => {
      lavaPool(c, 55, 38, 40, 9, 3);
      for (const [x, s] of [[12, 1], [98, 0.9], [30, 0.6], [80, 0.7]] as [number, number][]) { c.fillStyle = lin(c, 30, 48, [[0, '#6a5562'], [1, '#2a1c26']]); c.beginPath(); ell(c, x, 42, 13 * s, 8 * s); c.fill(); c.strokeStyle = INK; c.lineWidth = 2.4; c.stroke(); }
      c.fillStyle = '#ffd23f'; c.beginPath(); ell(c, 50, 22, 3, 3); ell(c, 62, 14, 2, 2); c.fill();
    }),
    once(sc, 'lava_vent', 90, 90, 2, (c) => {
      smoke(c, 46, 22, 0.7, 'rgba(120,90,100,0.55)');
      c.fillStyle = lin(c, 40, 88, [[0, '#6a5562'], [1, '#2a1c26']]); c.beginPath(); c.moveTo(8, 88); c.lineTo(22, 52); c.lineTo(36, 44); c.lineTo(56, 44); c.lineTo(70, 54); c.lineTo(84, 88); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      glow(c, 46, 46, 22, 0.8); c.fillStyle = '#ff8a2a'; c.beginPath(); ell(c, 46, 46, 10, 3.5); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.strokeStyle = '#ff9a2a'; c.lineWidth = 2; c.beginPath(); c.moveTo(30, 58); c.lineTo(36, 70); c.lineTo(32, 86); c.moveTo(62, 60); c.lineTo(58, 74); c.lineTo(64, 86); c.stroke();
    }),
    once(sc, 'lava_urn', 70, 80, 2, (c) => {
      glow(c, 35, 18, 26, 0.7);
      c.fillStyle = lin(c, 20, 78, [[0, '#e0a24a'], [1, '#7a4818']]); c.beginPath(); c.moveTo(18, 22); c.lineTo(52, 22); c.bezierCurveTo(66, 36, 60, 64, 46, 70); c.lineTo(48, 78); c.lineTo(22, 78); c.lineTo(24, 70); c.bezierCurveTo(10, 64, 4, 36, 18, 22); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke();
      c.strokeStyle = '#5a3010'; c.lineWidth = 2; c.beginPath(); c.moveTo(12, 40); c.lineTo(58, 40); c.moveTo(14, 54); c.lineTo(56, 54); c.stroke();
      c.fillStyle = '#ffd27a'; for (let x = 18; x < 54; x += 9) { c.beginPath(); c.moveTo(x, 47); c.lineTo(x + 4, 43); c.lineTo(x + 8, 47); c.lineTo(x + 4, 51); c.closePath(); c.fill(); }
      c.fillStyle = '#ff8a2a'; c.beginPath(); ell(c, 35, 22, 16, 4); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(26, 22); c.quadraticCurveTo(30, 8, 35, 4); c.quadraticCurveTo(40, 12, 44, 22); c.closePath(); c.fill();
    }),
  ],

  bunting: (sc) => once(sc, 'lava_bunting', 200, 40, 2, (c) => {
    // a bronze chain with small glowing lanterns
    c.strokeStyle = INK; c.lineWidth = 3.5; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    c.strokeStyle = '#c88a3a'; c.lineWidth = 2; c.setLineDash([4, 3]); c.stroke(); c.setLineDash([]);
    for (let i = 1; i < 6; i++) {
      const t = i / 6, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6;
      glow(c, x, y + 12, 14, 0.6);
      c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 5); c.stroke();
      c.fillStyle = '#ffb347'; c.beginPath(); rr(c, x - 5, y + 5, 10, 13, 3); c.fill(); c.lineWidth = 1.8; c.stroke();
      c.fillStyle = '#8a5420'; c.fillRect(x - 6, y + 4, 12, 3); c.fillRect(x - 6, y + 17, 12, 3);
    }
  }),

  ambient: (sc) => {
    const t = once(sc, 'lava_ember', 8, 8, 1, (c) => { const g = c.createRadialGradient(4, 4, 0, 4, 4, 4); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 8, 8); });
    return {
      texture: t, x: { min: 0, max: VIEW_W }, y: { min: 200, max: VIEW_H + 20 }, lifespan: 4500, frequency: 80, quantity: 1,
      speedY: { min: -70, max: -25 }, speedX: { min: -20, max: 20 }, scale: { start: 1.1, end: 0.2 },
      alpha: { start: 0.9, end: 0 }, tint: [0xffb347, 0xff7a1a, 0xffd23f, 0xff5a2a, 0x9a8a90], blendMode: 'ADD',
    };
  },

  overlay: (sc) => once(sc, 'lava_overlay', VIEW_W, VIEW_H, 1, (c) => {
    c.fillStyle = lin(c, 0, 120, [[0, 'rgba(30,8,16,0.3)'], [1, 'rgba(30,8,16,0)']]); c.fillRect(0, 0, VIEW_W, 120);
    c.fillStyle = lin(c, 400, VIEW_H, [[0, 'rgba(255,90,30,0)'], [1, 'rgba(255,90,30,0.14)']]); c.fillRect(0, 400, VIEW_W, VIEW_H - 400);
  }),
});
