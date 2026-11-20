/** המטריקס: a dark green digital world: falling glyph rain, a glowing horizon grid, data monoliths, wireframe towers and gateway booths. */
import * as Phaser from 'phaser';
import { INK, ell, rr } from '../puppet';
import { LAYER_W, VIEW_H, VIEW_W, lin, mk, nosoft, registerWorld, rng, soft, tex, wrap } from '../world';

/** wrap() with the same random numbers for both copies, so an item crossing the seam matches itself. */
function wrapR(r: () => number, x: number, ew: number, f: (xx: number, r: () => number) => void): void { const s = Math.floor(r() * 1e9); wrap(LAYER_W, x, ew, (xx) => f(xx, rng(s))); }

const ID = 'matrix';
const G = '#39ff7a', G2 = '#1fcf5a', GD = '#0a3a1e';

/** An abstract glyph: a few strokes in a small cell (not real letters), or a digit. */
function glyph(c: CanvasRenderingContext2D, x: number, y: number, s: number, r: () => number): void {
  const v = r();
  if (v < 0.25) { c.font = `bold ${Math.round(s * 1.25)}px "Courier New", monospace`; c.fillText(String(Math.floor(r() * 10)), x, y + s); return; }
  const k = Math.floor(r() * 6);
  c.fillRect(x, y + (k % 2 ? 0 : s * 0.45), s, s * 0.14);
  c.fillRect(x + (k > 2 ? s * 0.8 : 0), y, s * 0.16, s);
  if (k % 3 === 0) c.fillRect(x + s * 0.35, y + s * 0.25, s * 0.14, s * 0.6);
  if (k % 3 === 1) c.fillRect(x, y + s * 0.86, s * 0.7, s * 0.14);
  if (k === 5) c.fillRect(x + s * 0.4, y + s * 0.4, s * 0.25, s * 0.25);
}

/** A falling column of glyphs: bright head at the bottom, fading tail upward. */
function column(c: CanvasRenderingContext2D, x: number, y0: number, n: number, s: number, col: string, a: number, r: () => number): void {
  for (let i = 0; i < n; i++) {
    const t = i / n;
    c.globalAlpha = a * (0.15 + 0.85 * t);
    c.fillStyle = i === n - 1 ? '#d9ffe6' : col;
    glyph(c, x, y0 + i * s * 1.35, s, r);
  }
  c.globalAlpha = 1;
}

function sky(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_sky`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#010805'], [0.55, '#03190c'], [0.8, '#07331a'], [1, '#0c5a2c']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const r = rng(3);
    // the deepest, faintest rain
    for (let x = 4; x < VIEW_W; x += 18) column(c, x, -20 + r() * 300, 6 + Math.floor(r() * 14), 9, '#1d8a45', 0.35, r);
    // a glowing horizon
    const g = c.createRadialGradient(VIEW_W / 2, 400, 10, VIEW_W / 2, 400, 520); g.addColorStop(0, 'rgba(80,255,140,0.35)'); g.addColorStop(1, 'rgba(80,255,140,0)'); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    // the perspective grid floor below the horizon
    const hy = 400;
    c.strokeStyle = 'rgba(57,255,122,0.45)'; c.lineWidth = 1;
    for (let k = -20; k <= 20; k++) { c.beginPath(); c.moveTo(VIEW_W / 2 + k * 8, hy); c.lineTo(VIEW_W / 2 + k * 120, VIEW_H); c.stroke(); }
    for (let k = 1; k < 10; k++) { const y = hy + Math.pow(k / 9, 2) * (VIEW_H - hy); c.globalAlpha = 0.3 + k / 20; c.beginPath(); c.moveTo(0, y); c.lineTo(VIEW_W, y); c.stroke(); }
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(160,255,190,0.8)'; c.fillRect(0, hy - 1, VIEW_W, 2);
    // a great hollow sun-ring of data
    c.strokeStyle = 'rgba(57,255,122,0.5)'; c.lineWidth = 3; c.beginPath(); c.arc(VIEW_W / 2, hy, 120, Math.PI, 0); c.stroke();
    c.lineWidth = 1; c.setLineDash([4, 6]); c.beginPath(); c.arc(VIEW_W / 2, hy, 150, Math.PI, 0); c.stroke(); c.setLineDash([]);
    c.fillStyle = 'rgba(57,255,122,0.18)'; for (let k = 0; k < 7; k++) c.fillRect(VIEW_W / 2 - 120, hy - 20 - k * 14, 240, 6);
  }));
}

function far(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_far`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(37), base = 420;
    // data monoliths, tall and dark, with glowing seams
    let x = 0;
    while (x < LAYER_W) {
      const w = 40 + r() * 70, h = 120 + r() * 230;
      wrapR(r, x, w, (xx, r) => {
        c.fillStyle = lin(c, base - h, base, [[0, '#06301a'], [1, '#03170c']]); c.fillRect(xx, base - h, w, h + 140);
        c.fillStyle = 'rgba(57,255,122,0.5)'; c.fillRect(xx, base - h, w, 2);
        c.fillStyle = 'rgba(57,255,122,0.35)';
        for (let y = base - h + 12; y < base; y += 10) for (let k = 0; k < w / 10 - 1; k++) if (r() < 0.25) c.fillRect(xx + 5 + k * 10, y, 5, 3);
      });
      x += w + 20 + r() * 80;
    }
    // rain in front of them
    for (let cx = 6; cx < LAYER_W; cx += 24) { const n = 5 + Math.floor(r() * 12), y0 = r() * 360 - 40; wrapR(r, cx, 14, (xx, r) => column(c, xx, y0, n, 11, G2, 0.4, rng(cx))); }
    c.fillStyle = lin(c, base - 40, VIEW_H, [[0, 'rgba(10,80,40,0)'], [1, 'rgba(20,120,60,0.8)']]); c.fillRect(0, base - 40, LAYER_W, VIEW_H);
  }));
}

function mid(scene: Phaser.Scene): string {
  const RES = 1.5;
  return tex(scene, `${ID}_mid`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(61), base = 482;
    const kinds = ['tower', 'monolith', 'booth', 'tower', 'cube', 'monolith', 'tower', 'booth'];
    let x = 30, i = 0;
    while (x < LAYER_W - 140) {
      const k = kinds[i % kinds.length]; i++;
      const w = { tower: 150, monolith: 70, booth: 70, cube: 130 }[k] as number;
      const h = k === 'tower' ? 250 + r() * 140 : 0;
      wrapR(r, x, w, (xx, r) => {
        if (k === 'tower') {
          // a wireframe building: front face, depth lines and floors
          const d = 30;
          c.fillStyle = 'rgba(8,40,20,0.85)'; c.fillRect(xx, base - h, w, h);
          c.strokeStyle = G; c.lineWidth = 2; c.globalAlpha = 0.85;
          c.strokeRect(xx, base - h, w, h);
          c.beginPath(); c.moveTo(xx, base - h); c.lineTo(xx + d, base - h - d * 0.6); c.lineTo(xx + w + d, base - h - d * 0.6); c.lineTo(xx + w, base - h); c.moveTo(xx + w + d, base - h - d * 0.6); c.lineTo(xx + w + d, base - d * 0.6); c.lineTo(xx + w, base); c.stroke();
          c.lineWidth = 1; c.globalAlpha = 0.45;
          for (let y = base - h + 22; y < base; y += 22) { c.beginPath(); c.moveTo(xx, y); c.lineTo(xx + w, y); c.lineTo(xx + w + d, y - d * 0.6); c.stroke(); }
          for (let vx = xx + 25; vx < xx + w; vx += 25) { c.beginPath(); c.moveTo(vx, base - h); c.lineTo(vx, base); c.stroke(); }
          c.globalAlpha = 1;
          c.fillStyle = 'rgba(160,255,190,0.8)';
          for (let y = base - h + 6; y < base - 10; y += 22) for (let vx = xx + 6; vx < xx + w - 10; vx += 25) if (r() < 0.22) c.fillRect(vx, y, 13, 9);
          // antenna
          c.strokeStyle = G; c.lineWidth = 2; c.beginPath(); c.moveTo(xx + w / 2, base - h); c.lineTo(xx + w / 2, base - h - 40); c.stroke();
          const gg = c.createRadialGradient(xx + w / 2, base - h - 42, 1, xx + w / 2, base - h - 42, 14); gg.addColorStop(0, 'rgba(160,255,190,1)'); gg.addColorStop(1, 'rgba(160,255,190,0)'); c.fillStyle = gg; c.fillRect(xx + w / 2 - 14, base - h - 56, 28, 28);
        } else if (k === 'monolith') {
          soft(c, 14, 0, 0.5); c.shadowColor = 'rgba(57,255,122,0.6)';
          c.fillStyle = lin(c, base - 260, base, [[0, '#0d3f22'], [1, '#05190d']]); c.beginPath(); c.moveTo(xx, base); c.lineTo(xx + 8, base - 250); c.lineTo(xx + w - 8, base - 250); c.lineTo(xx + w, base); c.closePath(); c.fill(); nosoft(c);
          c.strokeStyle = G; c.lineWidth = 2; c.stroke();
          c.fillStyle = G;
          const rr2 = r;
          for (let y = base - 236; y < base - 20; y += 14) { c.globalAlpha = 0.3 + rr2() * 0.7; glyph(c, xx + 14 + rr2() * (w - 40), y, 9, rr2); }
          c.globalAlpha = 1;
        } else if (k === 'booth') {
          // a generic gateway booth: a tall box with a glowing door and a panel on top
          soft(c, 16, 0, 0.6); c.shadowColor = 'rgba(57,255,122,0.7)';
          c.fillStyle = '#0b2a17'; c.beginPath(); rr(c, xx, base - 170, w, 170, 6); c.fill(); nosoft(c);
          c.strokeStyle = G; c.lineWidth = 2.5; c.stroke();
          c.fillStyle = '#103d22'; c.beginPath(); rr(c, xx + 4, base - 162, w - 8, 18, 3); c.fill();
          c.fillStyle = G; c.font = 'bold 12px "Courier New", monospace'; c.textAlign = 'center'; c.fillText('> _', xx + w / 2, base - 149);
          const dg = c.createLinearGradient(0, base - 136, 0, base); dg.addColorStop(0, 'rgba(160,255,190,0.9)'); dg.addColorStop(1, 'rgba(57,255,122,0.3)');
          c.fillStyle = dg; c.beginPath(); rr(c, xx + 10, base - 136, w - 20, 130, 4); c.fill();
          c.strokeStyle = 'rgba(5,30,15,0.6)'; c.lineWidth = 2; for (let y = base - 120; y < base; y += 22) { c.beginPath(); c.moveTo(xx + 10, y); c.lineTo(xx + w - 10, y); c.stroke(); }
          c.fillStyle = '#05190d'; c.beginPath(); ell(c, xx + w - 18, base - 70, 3, 3); c.fill();
        } else {
          // a floating data cube over a pedestal
          c.fillStyle = '#0b2a17'; c.fillRect(xx + 40, base - 40, 50, 40); c.strokeStyle = G; c.lineWidth = 2; c.strokeRect(xx + 40, base - 40, 50, 40);
          const cy = base - 140, s = 44;
          soft(c, 18, 0, 0.6); c.shadowColor = 'rgba(57,255,122,0.8)';
          c.fillStyle = 'rgba(57,255,122,0.25)'; c.beginPath(); c.moveTo(xx + 65, cy - s); c.lineTo(xx + 65 + s, cy - s / 2); c.lineTo(xx + 65 + s, cy + s / 2); c.lineTo(xx + 65, cy + s); c.lineTo(xx + 65 - s, cy + s / 2); c.lineTo(xx + 65 - s, cy - s / 2); c.closePath(); c.fill(); nosoft(c);
          c.strokeStyle = G; c.lineWidth = 2; c.stroke();
          c.beginPath(); c.moveTo(xx + 65 - s, cy - s / 2); c.lineTo(xx + 65, cy); c.lineTo(xx + 65 + s, cy - s / 2); c.moveTo(xx + 65, cy); c.lineTo(xx + 65, cy + s); c.stroke();
          c.fillStyle = 'rgba(160,255,190,0.5)'; c.beginPath(); c.moveTo(xx + 65, cy - s); c.lineTo(xx + 65 + s, cy - s / 2); c.lineTo(xx + 65, cy); c.lineTo(xx + 65 - s, cy - s / 2); c.closePath(); c.fill();
          c.strokeStyle = 'rgba(57,255,122,0.4)'; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(xx + 65, cy + s + 6); c.lineTo(xx + 65, base - 42); c.stroke(); c.setLineDash([]);
        }
      });
      x += w + 40 + r() * 90;
    }
    // brighter near rain columns
    for (let cx = 10; cx < LAYER_W; cx += 46 + r() * 40) { const n = 4 + Math.floor(r() * 9), y0 = r() * 340 - 60; wrapR(r, cx, 16, (xx, r) => column(c, xx, y0, n, 13, G, 0.65, rng(cx * 3))); }
    // a low wall of circuits
    c.fillStyle = '#04150b'; c.fillRect(0, base - 30, LAYER_W, 60);
    c.strokeStyle = 'rgba(57,255,122,0.5)'; c.lineWidth = 1.5;
    for (let x2 = 0; x2 < LAYER_W; x2 += 40) { c.beginPath(); c.moveTo(x2, base - 30); c.lineTo(x2, base - 18); c.lineTo(x2 + 20, base - 18); c.lineTo(x2 + 20, base - 6); c.stroke(); c.fillStyle = G; c.fillRect(x2 + 18, base - 8, 4, 4); }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(0,30,12,0.3)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }, RES), RES);
}

/** A dark grid floor with a bright green walkable lip. */
function ground(scene: Phaser.Scene, w: number): string {
  const k = `${ID}_ground_${w}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 120, (c) => {
    const r = rng(w * 5 + 1), H = 120;
    c.fillStyle = lin(c, 0, H, [[0, '#0c3a1e'], [0.3, '#062412'], [1, '#020a05']]); c.fillRect(0, 0, w, H);
    // grid tiles
    c.strokeStyle = 'rgba(57,255,122,0.28)'; c.lineWidth = 1.5;
    for (let y = 44; y < H; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 22); c.lineTo(x, H); c.stroke(); }
    // lit tiles and glyphs in the floor
    for (let y = 22; y < H; y += 24) for (let x = 0; x < w; x += 32) {
      const v = r();
      if (v < 0.06) { c.fillStyle = `rgba(57,255,122,${0.12 + r() * 0.15})`; c.fillRect(x + 1, y + 1, 30, 22); }
      else if (v < 0.16) { c.fillStyle = `rgba(57,255,122,${0.25 + r() * 0.3})`; glyph(c, x + 11, y + 6, 10, r); }
    }
    // the bright lip
    c.fillStyle = lin(c, 0, 22, [[0, '#2bd968'], [1, '#0f6a33']]); c.fillRect(0, 0, w, 22);
    c.fillStyle = 'rgba(5,30,15,0.5)'; for (let x = 0; x < w; x += 32) c.fillRect(x, 6, 1.5, 16);
    c.fillStyle = '#b8ffcf'; for (let x = 16; x < w; x += 64) c.fillRect(x - 6, 12, 12, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22); c.lineTo(w, 22); c.stroke();
    c.fillStyle = '#d9ffe6'; c.fillRect(0, 0, w, 3);
    c.strokeStyle = '#04150b'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
    c.fillStyle = 'rgba(160,255,190,0.85)'; c.fillRect(0, 3, w, 2);
  }));
}

/** 'plank': a translucent green code slab; 'awning': a circuit-board ledge with chips. */
function platform(scene: Phaser.Scene, w: number, style: 'plank' | 'awning', seed: number): string {
  const k = `${ID}_plat_${style}_${w}_${seed}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 42, (c) => {
    const r = rng(seed * 7 + w);
    if (style === 'plank') {
      c.shadowColor = 'rgba(57,255,122,0.7)'; c.shadowBlur = 12;
      c.fillStyle = 'rgba(24,130,64,0.88)'; c.beginPath(); rr(c, 2, 4, w - 4, 22, 3); c.fill(); nosoft(c);
      c.lineWidth = 2.5; c.strokeStyle = '#04150b'; c.stroke();
      c.fillStyle = 'rgba(160,255,190,0.25)'; c.fillRect(4, 6, w - 8, 8);
      c.strokeStyle = G; c.lineWidth = 1.5; c.beginPath(); rr(c, 4, 6, w - 8, 18, 2); c.stroke();
      c.fillStyle = '#b8ffcf';
      for (let x = 8; x < w - 12; x += 10) { c.globalAlpha = 0.35 + r() * 0.6; glyph(c, x, 10, 7, r); }
      c.globalAlpha = 1;
      c.fillStyle = '#d9ffe6'; c.fillRect(4, 5, w - 8, 2);
      // a fading drip of code under it
      for (let x = 14; x < w - 10; x += 26 + r() * 20) { c.fillStyle = G; for (let k2 = 0; k2 < 3; k2++) { c.globalAlpha = 0.6 - k2 * 0.2; c.fillRect(x, 28 + k2 * 4, 3, 3); } }
      c.globalAlpha = 1;
    } else {
      soft(c, 6, 4, 0.5);
      c.fillStyle = lin(c, 4, 20, [[0, '#1a6a38'], [1, '#0b3a1e']]); c.beginPath(); c.moveTo(8, 4); c.lineTo(w - 8, 4); c.lineTo(w - 2, 10); c.lineTo(w - 2, 16); c.lineTo(w - 8, 22); c.lineTo(8, 22); c.lineTo(2, 16); c.lineTo(2, 10); c.closePath(); c.fill(); nosoft(c);
      c.lineWidth = 2.5; c.strokeStyle = '#04150b'; c.stroke();
      c.strokeStyle = 'rgba(57,255,122,0.8)'; c.lineWidth = 1.2;
      for (let x = 12; x < w - 16; x += 18) { c.beginPath(); c.moveTo(x, 8); c.lineTo(x, 13); c.lineTo(x + 9, 13); c.lineTo(x + 9, 18); c.stroke(); c.fillStyle = G; c.beginPath(); ell(c, x + 9, 18, 1.6, 1.6); c.fill(); }
      for (let x = w * 0.3; x < w - 30; x += w * 0.4) { c.fillStyle = '#04150b'; c.fillRect(x, 7, 22, 11); c.fillStyle = '#c9d6cf'; for (let p = 0; p < 4; p++) { c.fillRect(x + 2 + p * 5.5, 5, 2, 2); c.fillRect(x + 2 + p * 5.5, 18, 2, 2); } }
      c.fillStyle = '#d9ffe6'; c.fillRect(8, 4, w - 16, 2);
      c.strokeStyle = 'rgba(57,255,122,0.5)'; c.lineWidth = 1; for (const x of [w * 0.25, w * 0.75]) { c.beginPath(); c.moveTo(x, 22); c.lineTo(x, 36); c.stroke(); c.fillStyle = G; c.fillRect(x - 2, 35, 4, 4); }
    }
  }));
}

function lamp(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_lamp`, mk(70, 200, (c) => {
    const g = c.createRadialGradient(35, 34, 3, 35, 34, 34); g.addColorStop(0, 'rgba(160,255,190,0.95)'); g.addColorStop(1, 'rgba(57,255,122,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, 70);
    c.fillStyle = '#0b2a17'; c.beginPath(); c.moveTo(22, 198); c.lineTo(28, 60); c.lineTo(42, 60); c.lineTo(48, 198); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = G; c.lineWidth = 1.5; for (let y = 76; y < 190; y += 14) { c.beginPath(); c.moveTo(29, y); c.lineTo(41, y); c.stroke(); }
    c.fillStyle = '#0b2a17'; c.beginPath(); rr(c, 16, 186, 38, 12, 3); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    // a spinning data crystal on top
    c.fillStyle = 'rgba(57,255,122,0.85)'; c.beginPath(); c.moveTo(35, 10); c.lineTo(48, 34); c.lineTo(35, 58); c.lineTo(22, 34); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(220,255,230,0.85)'; c.beginPath(); c.moveTo(35, 10); c.lineTo(48, 34); c.lineTo(35, 34); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(160,255,190,0.8)'; c.lineWidth = 1.5; c.beginPath(); ell(c, 35, 34, 26, 6); c.stroke();
  }, 2), 2);
}

function props(scene: Phaser.Scene): string[] {
  const out: string[] = [];
  const add = (id: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => out.push(tex(scene, `${ID}_prop_${id}`, mk(w, h, f, 2), 2));
  add('terminal', 80, 100, (c) => {
    c.fillStyle = '#0b2a17'; c.beginPath(); c.moveTo(14, 98); c.lineTo(20, 52); c.lineTo(60, 52); c.lineTo(66, 98); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#123a20'; c.beginPath(); rr(c, 6, 6, 68, 50, 6); c.fill(); c.stroke();
    c.fillStyle = '#021006'; c.beginPath(); rr(c, 12, 12, 56, 38, 3); c.fill();
    c.fillStyle = G; c.font = 'bold 8px "Courier New", monospace'; c.textAlign = 'left';
    c.fillText('> ping', 15, 22); c.fillText('  ok', 15, 31); c.fillText('> _', 15, 42);
    c.fillStyle = 'rgba(57,255,122,0.15)'; for (let y = 12; y < 50; y += 3) c.fillRect(12, y, 56, 1);
    c.fillStyle = '#0f4a26'; c.beginPath(); rr(c, 18, 60, 44, 10, 2); c.fill(); c.lineWidth = 2; c.stroke();
  });
  add('rack', 60, 120, (c) => {
    c.fillStyle = '#0b2a17'; c.beginPath(); rr(c, 4, 4, 52, 114, 4); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    const r = rng(9);
    for (let y = 10; y < 110; y += 13) {
      c.fillStyle = '#06190d'; c.fillRect(9, y, 42, 10);
      for (let k = 0; k < 4; k++) { c.fillStyle = r() < 0.5 ? G : '#0f6a33'; c.fillRect(12 + k * 6, y + 4, 3, 3); }
      c.fillStyle = 'rgba(57,255,122,0.35)'; c.fillRect(38, y + 4, 10, 2);
    }
  });
  add('crystal', 70, 80, (c) => {
    const g = c.createRadialGradient(35, 46, 2, 35, 46, 36); g.addColorStop(0, 'rgba(57,255,122,0.5)'); g.addColorStop(1, 'rgba(57,255,122,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, 80);
    for (const [x, h, a] of [[22, 46, -0.3], [36, 70, 0], [50, 40, 0.35]] as [number, number, number][]) {
      c.save(); c.translate(x, 78); c.rotate(a);
      c.fillStyle = 'rgba(40,200,100,0.85)'; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-8, -h + 12); c.lineTo(0, -h); c.lineTo(8, -h + 12); c.lineTo(8, 0); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      c.fillStyle = 'rgba(220,255,230,0.7)'; c.beginPath(); c.moveTo(-8, -h + 12); c.lineTo(0, -h); c.lineTo(0, 0); c.lineTo(-8, 0); c.closePath(); c.fill();
      c.restore();
    }
    c.fillStyle = '#0b2a17'; c.beginPath(); ell(c, 35, 76, 30, 5); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  });
  add('antenna', 60, 126, (c) => {
    c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(30, 124); c.lineTo(30, 30); c.moveTo(14, 124); c.lineTo(30, 70); c.lineTo(46, 124); c.stroke();
    c.strokeStyle = '#2bd968'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#0b2a17'; c.beginPath(); ell(c, 30, 30, 22, 9); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = 'rgba(160,255,190,0.8)'; c.lineWidth = 2; for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(30, 20, 6 * k, -2.4, -0.7); c.stroke(); }
    c.fillStyle = '#d9ffe6'; c.beginPath(); ell(c, 30, 20, 3, 3); c.fill();
  });
  add('disk', 70, 70, (c) => {
    c.save(); c.translate(35, 68); c.rotate(-0.12);
    c.fillStyle = '#123a20'; c.beginPath(); rr(c, -28, -60, 56, 60, 4); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#c9d6cf'; c.beginPath(); rr(c, -16, -60, 32, 18, 2); c.fill(); c.lineWidth = 2; c.stroke(); c.fillStyle = '#123a20'; c.fillRect(4, -57, 7, 12);
    c.fillStyle = '#d9ffe6'; c.beginPath(); rr(c, -20, -34, 40, 28, 2); c.fill(); c.stroke();
    c.fillStyle = '#0f6a33'; c.font = 'bold 10px "Courier New", monospace'; c.textAlign = 'center'; c.fillText('1010', 0, -16);
    c.restore();
  });
  add('cables', 100, 50, (c) => {
    for (const [col, y] of [['#0f6a33', 40], ['#2bd968', 34], ['#0b2a17', 44]] as [string, number][]) {
      c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(30, y - 30, 60, y + 10, 100, y - 20); c.stroke();
      c.strokeStyle = col; c.lineWidth = 5; c.stroke();
    }
    c.fillStyle = '#123a20'; c.beginPath(); rr(c, 36, 22, 30, 22, 4); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = G; c.beginPath(); ell(c, 44, 33, 2.5, 2.5); ell(c, 51, 33, 2.5, 2.5); ell(c, 58, 33, 2.5, 2.5); c.fill();
  });
  return out;
}

function bunting(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_bunting`, mk(200, 40, (c) => {
    c.strokeStyle = '#2bd968'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    const r = rng(4);
    for (let i = 1; i < 10; i++) {
      const t = i / 10, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6;
      c.fillStyle = 'rgba(57,255,122,0.85)'; glyph(c, x - 4, y + 3, 8, r);
    }
  }, 2), 2);
}

function ambient(scene: Phaser.Scene): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig & { texture: string } {
  const k = tex(scene, `${ID}_drop`, mk(6, 26, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 26); g.addColorStop(0, 'rgba(57,255,122,0)'); g.addColorStop(0.8, 'rgba(57,255,122,0.8)'); g.addColorStop(1, 'rgba(220,255,230,1)');
    c.fillStyle = g; c.fillRect(1, 0, 4, 26);
  }));
  return {
    texture: k, x: { min: 0, max: VIEW_W }, y: { min: -40, max: VIEW_H }, lifespan: 2400, frequency: 70, quantity: 1,
    speedY: { min: 160, max: 320 }, speedX: 0, scale: { min: 0.5, max: 1.1 }, alpha: { start: 0.75, end: 0 }, blendMode: 'ADD',
  };
}

function overlay(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_overlay`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = 'rgba(20,255,90,0.05)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.fillStyle = 'rgba(0,20,8,0.16)'; for (let y = 0; y < VIEW_H; y += 3) c.fillRect(0, y, VIEW_W, 1);
    const g = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 260, VIEW_W / 2, VIEW_H / 2, 600); g.addColorStop(0, 'rgba(0,20,8,0)'); g.addColorStop(1, 'rgba(0,30,10,0.35)'); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
  }));
}

registerWorld({ id: ID, name: 'המטריקס', sky, far, mid, ground, platform, lamp, props, bunting, ambient, overlay });
