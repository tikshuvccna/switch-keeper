/** עולם המוזיקה: a concert stage at night: spotlights, giant instruments, staff lines with notes, a glowing equalizer skyline. */
import * as Phaser from 'phaser';
import { INK, ell, rr, shade } from '../puppet';
import { LAYER_W, VIEW_H, VIEW_W, lin, mk, nosoft, registerWorld, rng, soft, tex, wrap } from '../world';

/** wrap() with the same random numbers for both copies, so an item crossing the seam matches itself. */
function wrapR(r: () => number, x: number, ew: number, f: (xx: number, r: () => number) => void): void { const s = Math.floor(r() * 1e9); wrap(LAYER_W, x, ew, (xx) => f(xx, rng(s))); }

const ID = 'musical';
const NEON = ['#ff4fa3', '#4fd1ff', '#ffd23f', '#9b5de5', '#4fffb0', '#ff8a3d'];

/** A music note: 1 = quarter, 2 = eighth, 3 = beamed pair. */
function note(c: CanvasRenderingContext2D, x: number, y: number, s: number, kind: number, col: string, ink: boolean): void {
  c.fillStyle = col; c.strokeStyle = ink ? INK : col;
  const head = (hx: number, hy: number) => { c.beginPath(); ell(c, hx, hy, 6 * s, 4.4 * s, -0.4); c.fill(); if (ink) { c.lineWidth = 1.8; c.stroke(); } };
  const stem = (hx: number, hy: number, top: number) => { c.fillStyle = col; c.fillRect(hx + 4.2 * s, top, 2.2 * s, hy - top); if (ink) { c.lineWidth = 1.4; c.strokeRect(hx + 4.2 * s, top, 2.2 * s, hy - top); } };
  if (kind === 3) {
    stem(x, y, y - 26 * s); stem(x + 18 * s, y - 4 * s, y - 30 * s);
    c.fillStyle = col; c.beginPath(); c.moveTo(x + 4.2 * s, y - 26 * s); c.lineTo(x + 24.4 * s, y - 30 * s); c.lineTo(x + 24.4 * s, y - 24 * s); c.lineTo(x + 4.2 * s, y - 20 * s); c.closePath(); c.fill(); if (ink) { c.lineWidth = 1.6; c.stroke(); }
    head(x, y); head(x + 18 * s, y - 4 * s);
  } else {
    stem(x, y, y - 26 * s);
    if (kind === 2) { c.fillStyle = col; c.beginPath(); c.moveTo(x + 6.4 * s, y - 26 * s); c.quadraticCurveTo(x + 16 * s, y - 18 * s, x + 12 * s, y - 8 * s); c.quadraticCurveTo(x + 12 * s, y - 16 * s, x + 6.4 * s, y - 18 * s); c.closePath(); c.fill(); if (ink) { c.lineWidth = 1.6; c.stroke(); } }
    head(x, y);
  }
}

function speaker(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ink: boolean): void {
  c.fillStyle = lin(c, y, y + h, [[0, '#3b3456'], [1, '#1d1a2e']]); c.beginPath(); rr(c, x, y, w, h, 5); c.fill(); if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  const cone = (cx: number, cy: number, r: number) => {
    c.fillStyle = '#56507a'; c.beginPath(); ell(c, cx, cy, r, r); c.fill();
    c.fillStyle = '#26223a'; c.beginPath(); ell(c, cx, cy, r * 0.78, r * 0.78); c.fill();
    c.fillStyle = '#4a4468'; c.beginPath(); ell(c, cx, cy, r * 0.3, r * 0.3); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); ell(c, cx - r * 0.3, cy - r * 0.35, r * 0.25, r * 0.12, -0.6); c.fill();
  };
  const r = Math.min(w, h * 0.55) * 0.36;
  cone(x + w / 2, y + h * 0.7, r); cone(x + w / 2, y + h * 0.26, r * 0.55);
  c.fillStyle = '#4fd1ff'; c.beginPath(); ell(c, x + w - 9, y + 9, 2.5, 2.5); c.fill();
}

function sky(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_sky`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#0d0a2b'], [0.5, '#2b1458'], [0.85, '#6b1f6e'], [1, '#a8306e']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const r = rng(17);
    c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 50; i++) { c.beginPath(); ell(c, r() * VIEW_W, r() * 300, 0.8 + r(), 0.8 + r()); c.fill(); }
    // spotlight beams from the top
    c.globalCompositeOperation = 'lighter';
    for (const [x, a, col] of [[120, 0.35, '255,79,163'], [330, -0.2, '79,209,255'], [640, 0.25, '255,210,63'], [860, -0.35, '155,93,229']] as [number, number, string][]) {
      const g = c.createLinearGradient(0, 0, 0, VIEW_H); g.addColorStop(0, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.save(); c.translate(x, -10); c.rotate(a); c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.lineTo(110, VIEW_H + 80); c.lineTo(-110, VIEW_H + 80); c.closePath(); c.fill(); c.restore();
    }
    c.globalCompositeOperation = 'source-over';
    // the disco ball
    const bx = 480, by = 70, br = 42;
    const g = c.createRadialGradient(bx, by, 10, bx, by, 160); g.addColorStop(0, 'rgba(220,210,255,0.5)'); g.addColorStop(1, 'rgba(220,210,255,0)'); c.fillStyle = g; c.fillRect(bx - 160, by - 160, 320, 320);
    c.strokeStyle = '#8a86a8'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, 0); c.lineTo(bx, by - br); c.stroke();
    c.save(); c.beginPath(); ell(c, bx, by, br, br); c.clip();
    c.fillStyle = '#9b97c0'; c.fillRect(bx - br, by - br, br * 2, br * 2);
    for (let yy = -br; yy < br; yy += 8) for (let xx = -br; xx < br; xx += 8) { const v = r(); c.fillStyle = v < 0.15 ? '#ffffff' : v < 0.3 ? NEON[Math.floor(r() * NEON.length)] : `rgba(${120 + v * 100},${120 + v * 100},${170 + v * 70},1)`; c.fillRect(bx + xx + 0.6, by + yy + 0.6, 6.8, 6.8); }
    c.fillStyle = 'rgba(20,10,50,0.35)'; c.beginPath(); ell(c, bx + 18, by + 18, br, br); c.fill();
    c.restore();
    c.fillStyle = '#ffffff'; for (const [sx, sy] of [[bx - 20, by - 18], [bx + 14, by - 26]]) { c.beginPath(); c.moveTo(sx, sy - 8); c.lineTo(sx + 2, sy - 2); c.lineTo(sx + 8, sy); c.lineTo(sx + 2, sy + 2); c.lineTo(sx, sy + 8); c.lineTo(sx - 2, sy + 2); c.lineTo(sx - 8, sy); c.lineTo(sx - 2, sy - 2); c.closePath(); c.fill(); }
  }));
}

function far(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_far`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(29);
    // waving staff lines with notes across the sky
    const staffY = (x: number, k: number) => 150 + Math.sin(x / LAYER_W * Math.PI * 4) * 40 + k * 11;
    c.strokeStyle = 'rgba(200,180,255,0.35)'; c.lineWidth = 1.6;
    for (let k = 0; k < 5; k++) { c.beginPath(); for (let x = 0; x <= LAYER_W; x += 16) { const y = staffY(x, k); if (x) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); }
    for (let x = 60; x < LAYER_W - 30; x += 70 + r() * 60) {
      const k = Math.floor(r() * 5), kind = 1 + Math.floor(r() * 3);
      wrapR(r, x - 10, 40, (xx, r) => note(c, xx, staffY(x, k) + (r() < 0.5 ? 0 : 5.5), 1.1, kind, `rgba(255,220,250,0.6)`, false));
    }
    // a bar line every so often
    c.fillStyle = 'rgba(200,180,255,0.35)'; for (let x = 240; x < LAYER_W; x += 480) { const y0 = staffY(x, 0), y1 = staffY(x, 4); c.fillRect(x, y0, 2, y1 - y0); }
    // speaker stacks far behind
    for (let x = 0; x < LAYER_W; x += 320) wrapR(r, x + 120, 90, (xx, r) => { c.fillStyle = '#231a44'; c.fillRect(xx, 230, 90, 260); c.fillStyle = '#2f2556'; for (let k = 0; k < 3; k++) { c.beginPath(); ell(c, xx + 45, 280 + k * 80, 28, 28); c.fill(); } });
    // the equalizer skyline
    const base = 470;
    for (let x = 0, i = 0; x < LAYER_W; x += 26, i++) {
      const h = 60 + (Math.sin(i * 0.37) * 0.5 + 0.5) * 120 + r() * 80;
      const seg = 12;
      for (let y = base - seg; y > base - h; y -= seg + 3) {
        const t = (base - y) / 260;
        c.fillStyle = t < 0.35 ? '#2fd5c4' : t < 0.6 ? '#9b5de5' : t < 0.8 ? '#ff4fa3' : '#ffd23f';
        c.globalAlpha = 0.38; c.beginPath(); rr(c, x + 2, y, 21, seg, 3); c.fill();
      }
      c.globalAlpha = 1;
    }
    c.fillStyle = lin(c, 360, VIEW_H, [[0, 'rgba(120,30,110,0)'], [1, 'rgba(150,40,120,0.8)']]); c.fillRect(0, 360, LAYER_W, VIEW_H - 360);
  }));
}

function mid(scene: Phaser.Scene): string {
  const RES = 1.5;
  return tex(scene, `${ID}_mid`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(53), base = 482;
    // the lighting truss across the top with stage lamps
    c.strokeStyle = '#6a6488'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22); c.lineTo(LAYER_W, 22); c.moveTo(0, 40); c.lineTo(LAYER_W, 40); c.stroke();
    c.lineWidth = 2; c.beginPath(); for (let x = 0; x < LAYER_W; x += 18) { c.moveTo(x, 22); c.lineTo(x + 9, 40); c.lineTo(x + 18, 22); } c.stroke();
    for (let x = 60; x < LAYER_W; x += 160) {
      const col = NEON[(x / 160 | 0) % NEON.length];
      c.fillStyle = '#2b2740'; c.save(); c.translate(x, 46); c.rotate(((x / 160 | 0) % 2 ? 0.3 : -0.3)); c.beginPath(); rr(c, -10, 0, 20, 26, 4); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
      c.fillStyle = col; c.beginPath(); ell(c, 0, 26, 9, 4); c.fill(); c.restore();
    }
    // instruments along the stage
    const kinds = ['piano', 'speakers', 'violin', 'drums', 'trumpet', 'speakers', 'harp', 'mic'];
    let x = 20, i = 0;
    while (x < LAYER_W - 160) {
      const k = kinds[i % kinds.length]; i++;
      const w = { piano: 300, speakers: 120, violin: 110, drums: 260, trumpet: 170, harp: 140, mic: 60 }[k] as number;
      wrapR(r, x, w, (xx, r) => {
        soft(c, 12, 6, 0.4);
        if (k === 'piano') {
          // a grand piano from the side with its lid propped open
          c.fillStyle = '#1b1830'; c.beginPath(); c.moveTo(xx, base - 120); c.lineTo(xx + 190, base - 120); c.bezierCurveTo(xx + 240, base - 120, xx + 300, base - 110, xx + 300, base - 90); c.lineTo(xx + 300, base - 80); c.lineTo(xx, base - 80); c.closePath(); c.fill(); nosoft(c);
          c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.fillStyle = '#2a2648'; c.beginPath(); c.moveTo(xx + 10, base - 124); c.lineTo(xx + 280, base - 240); c.lineTo(xx + 290, base - 232); c.lineTo(xx + 40, base - 122); c.closePath(); c.fill(); c.stroke();
          c.strokeStyle = '#8a86a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(xx + 200, base - 122); c.lineTo(xx + 220, base - 196); c.stroke();
          c.fillStyle = '#1b1830'; for (const lx of [20, 160, 270]) { c.beginPath(); rr(c, xx + lx, base - 82, 12, 82, 3); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#d9b24a'; c.fillRect(xx + lx - 1, base - 8, 14, 8); c.fillStyle = '#1b1830'; }
          c.fillStyle = '#f6efe0'; c.fillRect(xx - 6, base - 104, 46, 8); c.fillStyle = INK; for (let kx = 0; kx < 46; kx += 6) c.fillRect(xx - 6 + kx, base - 104, 1, 8);
          c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(xx + 40, base - 116, 200, 3);
        } else if (k === 'speakers') {
          speaker(c, xx, base - 120, 110, 120, true); nosoft(c);
          speaker(c, xx + 10, base - 210, 90, 88, true);
        } else if (k === 'violin') {
          c.save(); c.translate(xx + 55, base - 4);
          c.fillStyle = lin(c, -250, 0, [[0, '#d98a3a'], [1, '#8a3e18']]);
          c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-55, 0, -60, -50, -36, -70); c.bezierCurveTo(-22, -82, -24, -96, -38, -108); c.bezierCurveTo(-58, -130, -42, -168, 0, -170); c.bezierCurveTo(42, -168, 58, -130, 38, -108); c.bezierCurveTo(24, -96, 22, -82, 36, -70); c.bezierCurveTo(60, -50, 55, 0, 0, 0); c.fill(); nosoft(c);
          c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.fillStyle = '#2b1a14'; c.beginPath(); rr(c, -6, -270, 12, 150, 4); c.fill(); c.stroke();
          c.beginPath(); ell(c, 0, -282, 11, 13); c.fill(); c.stroke();
          c.strokeStyle = INK; c.lineWidth = 2.5; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 18, -60); c.bezierCurveTo(s * 26, -76, s * 14, -88, s * 22, -104); c.stroke(); }
          c.fillStyle = '#2b1a14'; c.fillRect(-14, -36, 28, 6);
          c.strokeStyle = 'rgba(255,240,220,0.8)'; c.lineWidth = 0.9; for (const s of [-4.5, -1.5, 1.5, 4.5]) { c.beginPath(); c.moveTo(s, -268); c.lineTo(s * 1.4, -20); c.stroke(); }
          c.restore();
        } else if (k === 'drums') {
          const drum = (cx: number, cy: number, rx: number, h: number, col: string) => {
            c.fillStyle = lin(c, cy, cy + h, [[0, shade(col, 0.2)], [1, shade(col, -0.3)]]); c.beginPath(); c.rect(cx - rx, cy, rx * 2, h); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
            c.fillStyle = '#e8e4f4'; c.beginPath(); ell(c, cx, cy, rx, rx * 0.25); c.fill(); c.stroke();
            c.fillStyle = '#c9c6dc'; c.fillRect(cx - rx, cy + h - 5, rx * 2, 5);
            c.strokeStyle = '#d9d6ea'; c.lineWidth = 2; for (let k2 = -2; k2 <= 2; k2++) { c.beginPath(); c.moveTo(cx + k2 * rx * 0.4, cy + 2); c.lineTo(cx + k2 * rx * 0.4, cy + h - 4); c.stroke(); }
          };
          // bass drum seen from the front
          c.fillStyle = '#e4572e'; c.beginPath(); ell(c, xx + 130, base - 70, 70, 70); c.fill(); nosoft(c); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
          c.fillStyle = '#f6efe0'; c.beginPath(); ell(c, xx + 130, base - 70, 58, 58); c.fill(); c.lineWidth = 2; c.stroke();
          c.fillStyle = '#9b5de5'; c.beginPath(); ell(c, xx + 130, base - 70, 26, 26); c.fill();
          note(c, xx + 124, base - 62, 1.2, 3, '#ffd23f', true);
          drum(xx + 40, base - 150, 34, 46, '#2f6fd1'); drum(xx + 220, base - 140, 34, 52, '#1fa89a');
          c.strokeStyle = '#8a86a8'; c.lineWidth = 3; for (const lx of [40, 220]) { c.beginPath(); c.moveTo(xx + lx, base - 96); c.lineTo(xx + lx, base); c.stroke(); }
          // cymbals
          for (const [cx2, cy2] of [[xx + 6, base - 196], [xx + 258, base - 210]]) { c.strokeStyle = '#8a86a8'; c.beginPath(); c.moveTo(cx2, cy2); c.lineTo(cx2, base); c.stroke(); c.fillStyle = '#e8c04a'; c.beginPath(); ell(c, cx2, cy2, 40, 7); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.strokeStyle = '#8a86a8'; c.lineWidth = 3; }
        } else if (k === 'trumpet') {
          c.save(); c.translate(xx + 10, base - 150); c.rotate(-0.25);
          c.fillStyle = lin(c, -40, 40, [[0, '#ffe08a'], [1, '#c98a1a']]);
          c.beginPath(); c.moveTo(0, -6); c.lineTo(110, -6); c.quadraticCurveTo(140, -8, 160, -44); c.lineTo(166, 44); c.quadraticCurveTo(140, 8, 110, 6); c.lineTo(0, 6); c.closePath(); c.fill(); nosoft(c); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.fillStyle = '#7a4a10'; c.beginPath(); ell(c, 163, 0, 7, 44); c.fill(); c.stroke();
          c.fillStyle = 'none'; c.lineWidth = 9; c.strokeStyle = '#e8b040'; c.beginPath(); rr(c, 30, -4, 70, 40, 18); c.stroke(); c.lineWidth = 2; c.strokeStyle = INK; c.beginPath(); rr(c, 25.5, -8.5, 79, 49, 22); c.stroke();
          c.fillStyle = '#f6e0a0'; for (let k2 = 0; k2 < 3; k2++) { c.beginPath(); rr(c, 50 + k2 * 14, -24, 8, 18, 2); c.fill(); c.lineWidth = 2; c.stroke(); }
          c.fillStyle = '#c98a1a'; c.beginPath(); rr(c, -14, -5, 16, 10, 3); c.fill(); c.stroke();
          c.restore();
          c.strokeStyle = '#8a86a8'; c.lineWidth = 3; c.beginPath(); c.moveTo(xx + 70, base - 160); c.lineTo(xx + 70, base); c.moveTo(xx + 50, base); c.lineTo(xx + 90, base); c.stroke();
        } else if (k === 'harp') {
          c.fillStyle = lin(c, base - 300, base, [[0, '#ffe08a'], [1, '#c98a1a']]);
          c.beginPath(); c.moveTo(xx + 10, base); c.lineTo(xx + 24, base - 280); c.bezierCurveTo(xx + 70, base - 300, xx + 100, base - 230, xx + 130, base - 230); c.lineTo(xx + 130, base - 214); c.bezierCurveTo(xx + 96, base - 214, xx + 66, base - 270, xx + 36, base - 262); c.lineTo(xx + 40, base - 10); c.lineTo(xx + 128, base - 30); c.lineTo(xx + 130, base - 216); c.lineTo(xx + 140, base - 214); c.lineTo(xx + 138, base); c.closePath(); c.fill(); nosoft(c);
          c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.strokeStyle = 'rgba(255,248,230,0.85)'; c.lineWidth = 1.2;
          for (let s = 0; s < 9; s++) { const t = s / 9, sx = xx + 42 + t * 84; const topY = base - 262 + (t < 0.4 ? -8 * t : 30 * (t - 0.4)) + t * 20; c.beginPath(); c.moveTo(sx, topY); c.lineTo(sx, base - 14 - t * 16); c.stroke(); }
        } else {
          // a microphone on a stand
          c.strokeStyle = '#8a86a8'; c.lineWidth = 4; c.beginPath(); c.moveTo(xx + 30, base); c.lineTo(xx + 30, base - 180); c.stroke(); nosoft(c);
          c.lineWidth = 3; c.beginPath(); c.moveTo(xx + 10, base); c.lineTo(xx + 30, base - 20); c.lineTo(xx + 50, base); c.stroke();
          c.fillStyle = '#c9c6dc'; c.beginPath(); ell(c, xx + 30, base - 194, 12, 16); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.strokeStyle = 'rgba(29,26,51,0.4)'; c.lineWidth = 1; for (let k2 = -2; k2 <= 2; k2++) { c.beginPath(); c.moveTo(xx + 20, base - 194 + k2 * 5); c.lineTo(xx + 40, base - 194 + k2 * 5); c.stroke(); }
        }
        nosoft(c);
      });
      x += w + 40 + r() * 70;
    }
    // giant piano keys as stairs in the back
    for (const sx of [520, 1500]) wrapR(r, sx, 200, (xx, r) => {
      for (let k = 0; k < 7; k++) {
        const h = 30 + k * 18; c.fillStyle = '#f6efe0'; c.beginPath(); rr(c, xx + k * 28, base - h, 26, h, 3); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
        if (k % 7 !== 2 && k % 7 !== 6) { c.fillStyle = '#1b1830'; c.beginPath(); rr(c, xx + k * 28 + 18, base - h - 12, 16, 22, 2); c.fill(); }
      }
    });
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(60,20,110,0.38)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }, RES), RES);
}

/** The giant keyboard: white keys and black keys on the walkable top, a glossy black lacquer body with a gold trim. */
function ground(scene: Phaser.Scene, w: number): string {
  const k = `${ID}_ground_${w}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 120, (c) => {
    const H = 120, KW = 30;
    c.fillStyle = lin(c, 0, H, [[0, '#2c2650'], [0.4, '#18142e'], [1, '#0c0a1a']]); c.fillRect(0, 0, w, H);
    c.fillStyle = '#d9b24a'; c.fillRect(0, 30, w, 4); c.fillStyle = '#8a6a1a'; c.fillRect(0, 34, w, 2);
    c.fillStyle = '#7a1f3e'; c.fillRect(0, 36, w, 10);
    c.fillStyle = 'rgba(255,255,255,0.08)'; for (let x = 0; x < w; x += 140) { c.beginPath(); c.moveTo(x + 20, 46); c.lineTo(x + 60, 46); c.lineTo(x + 30, H); c.lineTo(x - 10, H); c.closePath(); c.fill(); }
    // glowing lights along the front, like stage foot lights
    for (let x = 30; x < w; x += 60) { const g = c.createRadialGradient(x, 70, 1, x, 70, 16); g.addColorStop(0, 'rgba(255,214,107,0.7)'); g.addColorStop(1, 'rgba(255,214,107,0)'); c.fillStyle = g; c.fillRect(x - 16, 54, 32, 32); c.fillStyle = '#ffe9a0'; c.beginPath(); ell(c, x, 70, 3, 3); c.fill(); }
    // white keys
    c.fillStyle = lin(c, 0, 30, [[0, '#ffffff'], [0.7, '#f1ecf8'], [1, '#c9c2dc']]); c.fillRect(0, 0, w, 30);
    c.fillStyle = 'rgba(29,26,51,0.75)'; for (let x = KW; x < w; x += KW) c.fillRect(x - 1, 2, 2, 28);
    // black keys in the 2 + 3 pattern
    for (let i = 0, x = 0; x < w + KW; x += KW, i++) {
      const m = i % 7; if (m === 2 || m === 6) continue;
      const bx = x + KW - 9; if (bx > w) break;
      c.fillStyle = lin(c, 0, 18, [[0, '#4a4468'], [1, '#14112a']]); c.beginPath(); rr(c, bx, 0, 18, 18, 2); c.fill(); c.lineWidth = 1.5; c.strokeStyle = INK; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(bx + 3, 2, 12, 2);
    }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 30); c.lineTo(w, 30); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(0, 0, w, 2.5);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }));
}

/** 'plank': a speaker cabinet; 'awning': a row of drum tops. */
function platform(scene: Phaser.Scene, w: number, style: 'plank' | 'awning', seed: number): string {
  const k = `${ID}_plat_${style}_${w}_${seed}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 42, (c) => {
    const col = NEON[seed % NEON.length];
    if (style === 'plank') {
      soft(c, 7, 4, 0.4);
      c.fillStyle = lin(c, 4, 38, [[0, '#3f3860'], [1, '#1b1830']]); c.beginPath(); rr(c, 2, 4, w - 4, 34, 5); c.fill(); nosoft(c);
      c.lineWidth = 2.8; c.strokeStyle = INK; c.stroke();
      c.fillStyle = col; c.fillRect(4, 5, w - 8, 3);
      const n = Math.max(1, Math.round((w - 16) / 36));
      for (let i = 0; i < n; i++) {
        const cx = 8 + (w - 16) * (i + 0.5) / n, cy = 23;
        c.fillStyle = '#56507a'; c.beginPath(); ell(c, cx, cy, 12, 12); c.fill();
        c.fillStyle = '#22203a'; c.beginPath(); ell(c, cx, cy, 9, 9); c.fill();
        c.fillStyle = col; c.beginPath(); ell(c, cx, cy, 3.5, 3.5); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(6, 9, w - 12, 1.5);
    } else {
      const n = Math.max(1, Math.round(w / 70)), dw = w / n;
      for (let i = 0; i < n; i++) {
        const x = i * dw + 2, ww = dw - 4, dc = NEON[(seed + i) % NEON.length];
        soft(c, 6, 4, 0.35);
        c.fillStyle = lin(c, 8, 36, [[0, shade(dc, 0.15)], [1, shade(dc, -0.35)]]); c.beginPath(); c.rect(x, 9, ww, 24); c.fill(); nosoft(c);
        c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
        c.strokeStyle = '#e8e4f4'; c.lineWidth = 1.6; c.beginPath(); for (let zx = x; zx < x + ww - 6; zx += 12) { c.moveTo(zx, 12); c.lineTo(zx + 6, 30); c.lineTo(zx + 12, 12); } c.stroke();
        c.fillStyle = '#c9c6dc'; c.fillRect(x, 30, ww, 4); c.lineWidth = 1.5; c.strokeStyle = INK; c.strokeRect(x, 30, ww, 4);
        c.fillStyle = '#f6f2ff'; c.beginPath(); ell(c, x + ww / 2, 9, ww / 2, 5); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); ell(c, x + ww * 0.35, 8, ww * 0.18, 1.5); c.fill();
      }
    }
  }));
}

function lamp(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_lamp`, mk(90, 200, (c) => {
    const g = c.createRadialGradient(45, 40, 4, 45, 40, 44); g.addColorStop(0, 'rgba(255,240,170,0.95)'); g.addColorStop(1, 'rgba(255,240,170,0)'); c.fillStyle = g; c.fillRect(0, 0, 90, 90);
    // tripod
    c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(45, 70); c.lineTo(45, 160); c.moveTo(45, 150); c.lineTo(16, 198); c.moveTo(45, 150); c.lineTo(74, 198); c.moveTo(45, 150); c.lineTo(45, 198); c.stroke();
    c.strokeStyle = '#8a86a8'; c.lineWidth = 3; c.stroke();
    // the spotlight can
    c.save(); c.translate(45, 50); c.rotate(-0.25);
    c.fillStyle = lin(c, -20, 20, [[0, '#4a4468'], [1, '#1b1830']]); c.beginPath(); rr(c, -22, -18, 40, 36, 6); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff6c8'; c.beginPath(); ell(c, 20, 0, 7, 18); c.fill(); c.stroke();
    c.fillStyle = '#ff4fa3'; c.fillRect(-14, -18, 4, 36);
    c.restore();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(45, 56, 18, 0.3, Math.PI - 0.3); c.stroke();
  }, 2), 2);
}

function props(scene: Phaser.Scene): string[] {
  const out: string[] = [];
  const add = (id: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => out.push(tex(scene, `${ID}_prop_${id}`, mk(w, h, f, 2), 2));
  add('metronome', 64, 100, (c) => {
    c.fillStyle = lin(c, 8, 98, [[0, '#c0703a'], [1, '#7a3e1a']]); c.beginPath(); c.moveTo(6, 98); c.lineTo(20, 8); c.lineTo(44, 8); c.lineTo(58, 98); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#f6efe0'; c.beginPath(); c.moveTo(18, 70); c.lineTo(25, 18); c.lineTo(39, 18); c.lineTo(46, 70); c.closePath(); c.fill(); c.lineWidth = 2; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(32, 68); c.lineTo(44, 14); c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); rr(c, 36, 28, 10, 8, 2); c.fill(); c.lineWidth = 1.6; c.stroke();
    c.fillStyle = 'rgba(29,26,51,0.4)'; for (let y = 24; y < 66; y += 6) c.fillRect(30, y, 4, 1);
  });
  add('gramophone', 100, 110, (c) => {
    c.fillStyle = lin(c, 70, 108, [[0, '#a8713f'], [1, '#6b4224']]); c.beginPath(); rr(c, 14, 74, 60, 34, 4); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#1b1830'; c.beginPath(); ell(c, 44, 74, 30, 5); c.fill(); c.lineWidth = 2; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(56, 70); c.quadraticCurveTo(62, 50, 50, 40); c.stroke(); c.strokeStyle = '#d9b24a'; c.lineWidth = 2; c.stroke();
    c.fillStyle = lin(c, 0, 50, [[0, '#ffe08a'], [1, '#c98a1a']]); c.beginPath(); c.moveTo(48, 44); c.lineTo(52, 36); c.quadraticCurveTo(70, 10, 98, 4); c.quadraticCurveTo(92, 40, 94, 62); c.quadraticCurveTo(66, 50, 48, 44); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = 'rgba(122,74,16,0.5)'; c.lineWidth = 1.5; for (const t of [0.4, 0.7]) { c.beginPath(); c.moveTo(50, 40); c.quadraticCurveTo(70 + t * 10, 20 + t * 10, 96, 4 + t * 58); c.stroke(); }
  });
  add('amp', 90, 80, (c) => {
    c.fillStyle = lin(c, 4, 78, [[0, '#3f3860'], [1, '#1b1830']]); c.beginPath(); rr(c, 4, 8, 82, 70, 6); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#d9b24a'; c.fillRect(8, 12, 74, 12); c.lineWidth = 1.5; c.strokeRect(8, 12, 74, 12);
    for (let k = 0; k < 5; k++) { c.fillStyle = '#1b1830'; c.beginPath(); ell(c, 16 + k * 14, 18, 3.5, 3.5); c.fill(); }
    c.fillStyle = '#26223a'; c.beginPath(); rr(c, 10, 28, 70, 44, 3); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1; for (let y = 31; y < 72; y += 4) { c.beginPath(); c.moveTo(10, y); c.lineTo(80, y); c.stroke(); }
    c.fillStyle = '#ff4fa3'; c.beginPath(); ell(c, 76, 18, 2.4, 2.4); c.fill();
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(45, 8, 12, Math.PI, 0); c.stroke();
  });
  add('stand', 70, 120, (c) => {
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(35, 50); c.lineTo(35, 112); c.moveTo(35, 104); c.lineTo(14, 118); c.moveTo(35, 104); c.lineTo(56, 118); c.stroke();
    c.strokeStyle = '#8a86a8'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#4a4468'; c.beginPath(); c.moveTo(4, 50); c.lineTo(66, 50); c.lineTo(60, 10); c.lineTo(10, 10); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff8e8'; c.beginPath(); c.moveTo(12, 46); c.lineTo(58, 46); c.lineTo(54, 4); c.lineTo(16, 4); c.closePath(); c.fill(); c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(29,26,51,0.5)'; c.lineWidth = 0.8; for (const y0 of [12, 28]) for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(18, y0 + k * 2.5); c.lineTo(52, y0 + k * 2.5); c.stroke(); }
    c.fillStyle = INK; for (const [nx, ny] of [[24, 18], [32, 15], [42, 21], [28, 34], [40, 32], [48, 37]] as [number, number][]) { c.beginPath(); ell(c, nx, ny, 1.8, 1.4); c.fill(); c.fillRect(nx + 1.2, ny - 6, 0.8, 6); }
  });
  add('maracas', 70, 72, (c) => {
    for (const [x, a, col] of [[24, -0.35, '#e4572e'], [46, 0.3, '#1fa89a']] as [number, number, string][]) {
      c.save(); c.translate(x, 70); c.rotate(a);
      c.fillStyle = '#a8713f'; c.beginPath(); rr(c, -3.5, -30, 7, 30, 3); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
      c.fillStyle = lin(c, -64, -26, [[0, shade(col, 0.2)], [1, shade(col, -0.25)]]); c.beginPath(); ell(c, 0, -46, 14, 19); c.fill(); c.lineWidth = 2.6; c.stroke();
      c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); c.moveTo(-12, -44); c.lineTo(-6, -50); c.lineTo(0, -44); c.lineTo(6, -50); c.lineTo(12, -44); c.stroke();
      c.restore();
    }
  });
  add('conga', 60, 100, (c) => {
    c.fillStyle = lin(c, 10, 98, [[0, '#ff6b8a'], [1, '#9b2a5a']]); c.beginPath(); c.moveTo(10, 12); c.bezierCurveTo(2, 50, 16, 80, 16, 98); c.lineTo(44, 98); c.bezierCurveTo(44, 80, 58, 50, 50, 12); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = '#d9d6ea'; c.lineWidth = 2; for (const x of [16, 30, 44]) { c.beginPath(); c.moveTo(x, 16); c.lineTo(x + (x - 30) * -0.3, 40); c.stroke(); }
    c.fillStyle = '#d9b24a'; c.fillRect(8, 40, 44, 5); c.lineWidth = 1.6; c.strokeStyle = INK; c.strokeRect(8, 40, 44, 5);
    c.fillStyle = '#f6efe0'; c.beginPath(); ell(c, 30, 12, 21, 6); c.fill(); c.lineWidth = 2.6; c.stroke();
  });
  return out;
}

function bunting(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_bunting`, mk(200, 40, (c) => {
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    for (let i = 1; i < 10; i++) {
      const t = i / 10, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6, col = NEON[i % NEON.length];
      const g = c.createRadialGradient(x, y + 9, 1, x, y + 9, 10); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = 0.5; c.fillStyle = g; c.fillRect(x - 10, y - 1, 20, 20); c.globalAlpha = 1;
      c.fillStyle = '#4a4468'; c.fillRect(x - 2, y, 4, 3);
      c.fillStyle = col; c.beginPath(); ell(c, x, y + 8, 3.6, 5); c.fill(); c.lineWidth = 1.2; c.strokeStyle = INK; c.stroke();
    }
  }, 2), 2);
}

function ambient(scene: Phaser.Scene): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig & { texture: string } {
  const k = tex(scene, `${ID}_note`, mk(20, 28, (c) => note(c, 6, 22, 0.75, 2, '#ffffff', false), 2), 2);
  return {
    texture: k, x: { min: 0, max: VIEW_W }, y: { min: 60, max: VIEW_H }, lifespan: 5000, frequency: 260, quantity: 1,
    speedX: { min: -14, max: 14 }, speedY: { min: -38, max: -14 }, rotate: { min: -20, max: 20 }, scale: { min: 0.35, max: 0.7 },
    alpha: { values: [0, 0.9, 0.7, 0] }, tint: [0xff4fa3, 0x4fd1ff, 0xffd23f, 0x9b5de5, 0x4fffb0],
  };
}

function overlay(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_overlay`, mk(VIEW_W, VIEW_H, (c) => {
    // soft coloured stage glow pools on the floor
    c.globalCompositeOperation = 'lighter';
    for (const [x, col] of [[180, '255,79,163'], [520, '79,209,255'], [820, '255,210,63']] as [number, string][]) {
      const g = c.createRadialGradient(x, 500, 10, x, 500, 220); g.addColorStop(0, `rgba(${col},0.10)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - 220, 280, 440, 260);
    }
  }));
}

registerWorld({ id: ID, name: 'עולם המוזיקה', sky, far, mid, ground, platform, lamp, props, bunting, ambient, overlay });
