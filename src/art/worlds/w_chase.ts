/** המרדף: a chase through a stormy countryside: a dark storm wall rolls in from the left over orange-violet skies, bent trees, broken mills and bridges. */
import * as Phaser from 'phaser';
import { INK, ell, rr, shade } from '../puppet';
import { LAYER_W, VIEW_H, VIEW_W, lin, mk, nosoft, registerWorld, rng, soft, tex, wrap } from '../world';

/** wrap() with the same random numbers for both copies, so an item crossing the seam matches itself. */
function wrapR(r: () => number, x: number, ew: number, f: (xx: number, r: () => number) => void): void { const s = Math.floor(r() * 1e9); wrap(LAYER_W, x, ew, (xx) => f(xx, rng(s))); }

const ID = 'chase';

function bolt(c: CanvasRenderingContext2D, x: number, y: number, len: number, r: () => number, width: number): void {
  c.beginPath(); c.moveTo(x, y);
  let px = x, py = y;
  while (py < y + len) { px += (r() - 0.5) * 30; py += 14 + r() * 18; c.lineTo(px, py); }
  c.strokeStyle = 'rgba(255,240,200,0.35)'; c.lineWidth = width * 3; c.stroke();
  c.strokeStyle = '#fff6d8'; c.lineWidth = width; c.stroke();
}

/** A tree bent by the wind blowing to the right. */
function bentTree(c: CanvasRenderingContext2D, x: number, base: number, s: number, trunk: string, leaf: string | null, ink: boolean): void {
  c.fillStyle = trunk; c.beginPath(); c.moveTo(x - 7 * s, base); c.quadraticCurveTo(x - 2 * s, base - 60 * s, x + 30 * s, base - 110 * s); c.lineTo(x + 38 * s, base - 106 * s); c.quadraticCurveTo(x + 10 * s, base - 60 * s, x + 7 * s, base); c.closePath(); c.fill();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.strokeStyle = trunk; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x + 8 * s, base - 60 * s); c.quadraticCurveTo(x + 30 * s, base - 70 * s, x + 50 * s, base - 66 * s); c.stroke();
  if (leaf) {
    c.fillStyle = leaf; c.beginPath(); ell(c, x + 38 * s, base - 112 * s, 30 * s, 18 * s, 0.25); ell(c, x + 60 * s, base - 104 * s, 22 * s, 13 * s, 0.3); ell(c, x + 20 * s, base - 116 * s, 18 * s, 12 * s); c.fill();
    if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  }
}

function brokenMill(c: CanvasRenderingContext2D, x: number, base: number, s: number, col: string, ink: boolean): void {
  c.fillStyle = col; c.beginPath(); c.moveTo(x - 18 * s, base); c.lineTo(x - 12 * s, base - 80 * s); c.lineTo(x + 12 * s, base - 80 * s); c.lineTo(x + 18 * s, base); c.closePath(); c.fill(); if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.beginPath(); c.moveTo(x - 16 * s, base - 78 * s); c.lineTo(x - 2 * s, base - 98 * s); c.lineTo(x + 6 * s, base - 90 * s); c.lineTo(x + 16 * s, base - 78 * s); c.closePath(); c.fill(); if (ink) c.stroke();
  // two sails left, one snapped
  const hx = x, hy = base - 84 * s;
  c.save(); c.translate(hx, hy);
  for (const [a, L] of [[0.5, 60], [2.1, 56], [3.7, 26]] as [number, number][]) {
    c.save(); c.rotate(a); c.fillStyle = col; c.beginPath(); c.rect(2 * s, -5 * s, L * s, 10 * s); c.fill(); if (ink) { c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); }
    if (ink) { c.strokeStyle = 'rgba(29,26,51,0.4)'; c.lineWidth = 1; for (let k = 12; k < L; k += 10) { c.beginPath(); c.moveTo(k * s, -5 * s); c.lineTo(k * s, 5 * s); c.stroke(); } }
    c.restore();
  }
  c.restore();
  if (ink) { c.fillStyle = '#2a1a1a'; c.beginPath(); rr(c, x - 5 * s, base - 22 * s, 10 * s, 22 * s, 4 * s); c.fill(); }
}

function fence(c: CanvasRenderingContext2D, x: number, base: number, w: number, col: string, r: () => number, ink: boolean): void {
  c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2;
  for (let px = x; px < x + w; px += 26) {
    const a = (r() - 0.5) * 0.4 + 0.12, h = 30 + r() * 10;
    c.save(); c.translate(px, base); c.rotate(a); c.beginPath(); c.rect(-3, -h, 6, h); c.fill(); if (ink) c.stroke(); c.restore();
  }
  for (const y of [base - 22, base - 12]) { if (r() < 0.75) { c.save(); c.translate(x, y); c.rotate((r() - 0.5) * 0.06); c.beginPath(); c.rect(0, -2, w * (0.5 + r() * 0.5), 4); c.fill(); if (ink) c.stroke(); c.restore(); } }
}

function sky(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_sky`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#3a2058'], [0.45, '#8a3a6a'], [0.75, '#e0703e'], [1, '#ffb05a']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    // a low sun on the right, still bright before the storm
    const g = c.createRadialGradient(820, 380, 10, 820, 380, 320); g.addColorStop(0, 'rgba(255,220,140,0.9)'); g.addColorStop(0.3, 'rgba(255,170,90,0.4)'); g.addColorStop(1, 'rgba(255,150,80,0)'); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.fillStyle = '#ffe9b0'; c.beginPath(); ell(c, 820, 380, 40, 40); c.fill();
    // thin streaky clouds on the right
    c.fillStyle = 'rgba(255,190,150,0.45)'; for (const [x, y, w] of [[600, 150, 260], [700, 230, 200], [560, 300, 160]] as [number, number, number][]) { c.beginPath(); rr(c, x, y, w, 8, 4); rr(c, x + 40, y + 12, w * 0.7, 6, 3); c.fill(); }
    // the storm wall rolling in from the left: heavy layered dark clouds
    const r = rng(13);
    const layer = (edge: number, col: string, a: number) => {
      c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(edge, 0);
      for (let y = 0; y <= VIEW_H; y += 36) { const bulge = edge + Math.sin(y / 50) * 30 + r() * 30; c.quadraticCurveTo(bulge + 50, y + 18, edge + (r() - 0.5) * 30, y + 36); }
      c.lineTo(0, VIEW_H); c.closePath(); c.fill(); c.globalAlpha = 1;
    };
    layer(470, '#4a2a5e', 0.55); layer(380, '#3a2050', 0.8); layer(290, '#2a1640', 0.92); layer(190, '#1d1030', 1);
    // round billows along the top
    for (let x = 0; x < 620; x += 50) { const s = 40 + r() * 40 - x * 0.04; c.fillStyle = x < 300 ? '#241238' : '#3a2050'; c.beginPath(); ell(c, x, 10 + r() * 30, s, s * 0.8); c.fill(); }
    // lightning inside the storm
    bolt(c, 230, 60, 260, r, 2.5); bolt(c, 120, 120, 180, r, 1.6); bolt(c, 380, 30, 120, r, 1.4);
    const lg = c.createRadialGradient(230, 160, 10, 230, 160, 200); lg.addColorStop(0, 'rgba(255,230,255,0.22)'); lg.addColorStop(1, 'rgba(255,230,255,0)'); c.fillStyle = lg; c.fillRect(0, 0, 500, 400);
  }));
}

function far(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_far`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(59);
    // distant lightning on the horizon
    for (const x of [300, 980, 1560]) wrapR(r, x - 30, 60, (xx, r) => bolt(c, xx, 240, 150, rng(x), 1.5));
    // rolling hill bands
    const hill = (y0: number, amp: number, freq: number, col: string, ph: number) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, VIEW_H);
      for (let x = 0; x <= LAYER_W; x += 20) c.lineTo(x, y0 - Math.sin(x / LAYER_W * Math.PI * 2 * freq + ph) * amp - Math.sin(x / LAYER_W * Math.PI * 2 * freq * 3 + ph) * amp * 0.25);
      c.lineTo(LAYER_W, VIEW_H); c.closePath(); c.fill();
    };
    hill(380, 30, 3, '#7a3a6a', 0.4);
    // silhouettes of mills and trees on the far hill
    for (const x of [200, 760, 1300, 1720]) wrapR(r, x - 40, 80, (xx, r) => brokenMill(c, xx + 40, 392 - Math.sin((x) / LAYER_W * Math.PI * 6 + 0.4) * 30, 0.8, '#5e2a58', false));
    hill(420, 24, 4, '#5a2a52', 1.7);
    for (let i = 0; i < 16; i++) { const x = r() * LAYER_W; wrapR(r, x - 20, 70, (xx, r) => bentTree(c, xx, 432, 0.45 + r() * 0.2, '#43203e', '#43203e', false)); }
    hill(450, 16, 5, '#43203e', 2.4);
    c.fillStyle = lin(c, 330, VIEW_H, [[0, 'rgba(255,150,90,0)'], [1, 'rgba(160,70,90,0.6)']]); c.fillRect(0, 330, LAYER_W, VIEW_H);
  }));
}

function mid(scene: Phaser.Scene): string {
  const RES = 1.5;
  return tex(scene, `${ID}_mid`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(71), base = 482;
    // the near hill line
    c.fillStyle = '#4a3a3a'; c.beginPath(); c.moveTo(0, VIEW_H); for (let x = 0; x <= LAYER_W; x += 20) c.lineTo(x, base - 30 - Math.sin(x / LAYER_W * Math.PI * 8) * 14); c.lineTo(LAYER_W, VIEW_H); c.closePath(); c.fill();
    c.fillStyle = '#5e4a3a'; c.fillRect(0, base - 10, LAYER_W, 40);
    const kinds = ['tree', 'bridge', 'mill', 'fence', 'tree', 'hay', 'tree', 'fence'];
    let x = 20, i = 0;
    while (x < LAYER_W - 200) {
      const k = kinds[i % kinds.length]; i++;
      const w = { tree: 120, bridge: 300, mill: 120, fence: 180, hay: 110 }[k] as number;
      wrapR(r, x, w, (xx, r) => {
        soft(c, 10, 5, 0.35);
        if (k === 'tree') bentTree(c, xx + 20, base - 10, 1.3 + r() * 0.4, '#5a3a2a', r() < 0.3 ? null : ['#6a7a3a', '#8a6a2a', '#7a4a2a'][Math.floor(r() * 3)], true);
        else if (k === 'mill') brokenMill(c, xx + 60, base - 10, 2, '#b08a6a', true);
        else if (k === 'fence') { nosoft(c); fence(c, xx, base - 8, w, '#8a6a4a', r, true); }
        else if (k === 'hay') {
          c.fillStyle = lin(c, base - 70, base, [[0, '#f2c86a'], [1, '#b8862a']]); c.beginPath(); c.moveTo(xx + 10, base - 8); c.quadraticCurveTo(xx + 20, base - 90, xx + 55, base - 90); c.quadraticCurveTo(xx + 90, base - 90, xx + 100, base - 8); c.closePath(); c.fill(); nosoft(c); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.strokeStyle = 'rgba(120,80,20,0.5)'; c.lineWidth = 1.5; for (let k2 = 0; k2 < 6; k2++) { c.beginPath(); c.moveTo(xx + 30 + k2 * 9, base - 80); c.lineTo(xx + 40 + k2 * 12, base - 50); c.stroke(); }
          c.strokeStyle = '#f2c86a'; c.lineWidth = 2; for (let k2 = 0; k2 < 5; k2++) { c.beginPath(); c.moveTo(xx + 80, base - 70 + k2 * 6); c.lineTo(xx + 110 + k2 * 4, base - 74 + k2 * 6); c.stroke(); }
        } else {
          // a ruined wooden bridge on posts with a missing middle section
          nosoft(c);
          c.fillStyle = '#7a5a3a'; c.strokeStyle = INK; c.lineWidth = 2.5;
          for (const px of [20, 100, 200, 280]) { c.beginPath(); c.rect(xx + px - 6, base - 120, 12, 120); c.fill(); c.stroke(); }
          c.save(); c.translate(xx, base - 124);
          c.fillStyle = '#9a7a52'; c.beginPath(); c.rect(0, 0, 130, 14); c.fill(); c.stroke();
          c.save(); c.translate(130, 0); c.rotate(0.35); c.beginPath(); c.rect(0, 0, 40, 12); c.fill(); c.stroke(); c.restore();
          c.beginPath(); c.rect(190, 0, 110, 14); c.fill(); c.stroke();
          c.save(); c.translate(190, 0); c.rotate(-0.5); c.beginPath(); c.rect(-34, 0, 34, 12); c.fill(); c.stroke(); c.restore();
          c.strokeStyle = 'rgba(29,26,51,0.4)'; c.lineWidth = 1.2; for (let k2 = 12; k2 < 130; k2 += 14) { c.beginPath(); c.moveTo(k2, 0); c.lineTo(k2, 14); c.stroke(); } for (let k2 = 202; k2 < 300; k2 += 14) { c.beginPath(); c.moveTo(k2, 0); c.lineTo(k2, 14); c.stroke(); }
          // rope rail sagging
          c.strokeStyle = '#d9b98a'; c.lineWidth = 2; c.beginPath(); c.moveTo(20, -30); c.quadraticCurveTo(60, -14, 100, -30); c.moveTo(200, -30); c.quadraticCurveTo(240, -14, 280, -30); c.moveTo(100, -30); c.quadraticCurveTo(110, -10, 116, 10); c.stroke();
          c.fillStyle = '#7a5a3a'; for (const px of [20, 100, 200, 280]) { c.beginPath(); c.rect(px - 4, -34, 8, 34); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
          c.restore();
        }
        nosoft(c);
      });
      x += w + 30 + r() * 80;
    }
    // birds fleeing to the right
    c.strokeStyle = 'rgba(29,26,51,0.8)'; c.lineWidth = 2;
    for (let k = 0; k < 12; k++) { const bx = r() * LAYER_W, by = 80 + r() * 160, s = 5 + r() * 3; wrapR(r, bx - 10, 20, (xx, r) => { c.beginPath(); c.moveTo(xx - s, by - 3); c.quadraticCurveTo(xx - s / 2, by - 6, xx, by); c.quadraticCurveTo(xx + s / 2, by - 6, xx + s, by - 3); c.stroke(); }); }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(80,30,80,0.3)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }, RES), RES);
}

/** A dirt road: a warm-lit top with ruts and pebbles, then layered earth and rocks. */
function ground(scene: Phaser.Scene, w: number): string {
  const k = `${ID}_ground_${w}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 120, (c) => {
    const r = rng(w * 23 + 3), H = 120;
    c.fillStyle = lin(c, 0, H, [[0, '#9a6a4a'], [0.35, '#6a4434'], [1, '#2e1c22']]); c.fillRect(0, 0, w, H);
    // embedded stones
    for (let i = 0; i < w / 26; i++) {
      const x = r() * w, y = 34 + r() * 80, s = 6 + r() * 14;
      c.fillStyle = shade('#8a7a8a', (r() - 0.5) * 0.4); c.beginPath(); ell(c, x, y, s, s * 0.65); c.fill(); c.lineWidth = 1.6; c.strokeStyle = 'rgba(29,26,51,0.5)'; c.stroke();
      c.fillStyle = 'rgba(255,220,180,0.25)'; c.beginPath(); ell(c, x - s * 0.3, y - s * 0.3, s * 0.35, s * 0.18); c.fill();
    }
    // roots and a grass fringe hanging from the top
    c.strokeStyle = 'rgba(40,24,20,0.5)'; c.lineWidth = 2; for (let x = 20; x < w; x += 60 + r() * 60) { c.beginPath(); c.moveTo(x, 22); c.quadraticCurveTo(x + 10, 38, x + 4, 50 + r() * 14); c.stroke(); }
    // the road top
    c.fillStyle = lin(c, 0, 22, [[0, '#e8b07a'], [1, '#b87a4e']]); c.fillRect(0, 0, w, 22);
    c.strokeStyle = 'rgba(110,60,30,0.45)'; c.lineWidth = 2; for (const y of [8, 15]) { c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 30) c.lineTo(x, y + (r() - 0.5) * 2); c.stroke(); }
    for (let i = 0; i < w / 18; i++) { c.fillStyle = r() < 0.5 ? 'rgba(90,60,50,0.6)' : 'rgba(255,230,190,0.6)'; c.beginPath(); ell(c, r() * w, 4 + r() * 15, 1.5 + r() * 2, 1 + r()); c.fill(); }
    // tufts of grass bent to the right at the edge
    c.fillStyle = '#7a8a3a'; for (let x = 6; x < w; x += 30 + r() * 40) { c.beginPath(); c.moveTo(x, 4); c.quadraticCurveTo(x + 4, -4, x + 14, -6); c.quadraticCurveTo(x + 6, -1, x + 8, 4); c.closePath(); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22); c.lineTo(w, 22); c.stroke();
    c.fillStyle = 'rgba(255,230,180,0.7)'; c.fillRect(0, 0, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }));
}

/** 'plank': a pair of nailed wooden planks; 'awning': a row of old stone blocks. */
function platform(scene: Phaser.Scene, w: number, style: 'plank' | 'awning', seed: number): string {
  const k = `${ID}_plat_${style}_${w}_${seed}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 42, (c) => {
    const r = rng(seed * 41 + w);
    if (style === 'plank') {
      soft(c, 6, 4, 0.35);
      c.fillStyle = lin(c, 4, 24, [[0, '#c89a62'], [1, '#8a5e38']]); c.beginPath(); c.moveTo(2, 5); c.lineTo(w - 2, 4); c.lineTo(w - 4, 14); c.lineTo(4, 14.5); c.closePath(); c.fill(); nosoft(c);
      c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
      c.fillStyle = lin(c, 14, 26, [[0, '#b4864e'], [1, '#7a5030']]); c.beginPath(); c.moveTo(8, 14.5); c.lineTo(w - 6, 14); c.lineTo(w - 10, 25); c.lineTo(10, 26); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = 'rgba(60,30,20,0.4)'; c.lineWidth = 1.2; for (let x = 20; x < w - 10; x += 30 + r() * 20) { c.beginPath(); c.moveTo(x, 7); c.lineTo(x + 12, 8); c.stroke(); c.beginPath(); c.moveTo(x + 8, 18); c.lineTo(x + 22, 19); c.stroke(); }
      // a cross brace and nails
      c.fillStyle = '#7a5030'; c.beginPath(); c.moveTo(w * 0.3, 26); c.lineTo(w * 0.3 + 8, 26); c.lineTo(w * 0.3 + 16, 38); c.lineTo(w * 0.3 + 8, 38); c.closePath(); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#c0c6d6'; for (const x of [8, w - 10, w / 2]) { c.beginPath(); ell(c, x, 9, 1.8, 1.8); c.fill(); c.beginPath(); ell(c, x + 4, 20, 1.6, 1.6); c.fill(); }
      c.fillStyle = 'rgba(255,230,180,0.6)'; c.fillRect(6, 6, w - 14, 2);
    } else {
      let x = 2;
      soft(c, 6, 4, 0.35);
      while (x < w - 6) {
        const bw = Math.min(w - 2 - x, 30 + r() * 22), col = shade('#9a8a9a', (r() - 0.5) * 0.3);
        c.fillStyle = lin(c, 4, 30, [[0, shade(col, 0.25)], [1, shade(col, -0.3)]]); c.beginPath(); rr(c, x, 4 + r() * 1.5, bw, 24 + r() * 6, 4); c.fill();
        c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
        c.fillStyle = 'rgba(255,240,220,0.4)'; c.fillRect(x + 4, 6, bw - 8, 2.5);
        c.strokeStyle = 'rgba(29,26,51,0.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x + bw * 0.3, 10); c.lineTo(x + bw * 0.45, 18); c.lineTo(x + bw * 0.4, 24); c.stroke();
        if (r() < 0.5) { c.fillStyle = '#6a8a3a'; c.beginPath(); ell(c, x + bw * 0.7, 5, 6, 2.5); c.fill(); }
        x += bw;
      }
      nosoft(c);
    }
  }));
}

function lamp(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_lamp`, mk(80, 200, (c) => {
    // a crooked post with a swinging lantern
    c.fillStyle = '#6a4a2e'; c.beginPath(); c.moveTo(22, 198); c.lineTo(26, 30); c.lineTo(34, 30); c.lineTo(32, 198); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(26, 34); c.lineTo(66, 28); c.lineTo(66, 36); c.lineTo(30, 42); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(30, 70); c.lineTo(52, 36); c.lineTo(56, 38); c.lineTo(32, 78); c.closePath(); c.fill(); c.stroke();
    const g = c.createRadialGradient(64, 66, 3, 64, 66, 30); g.addColorStop(0, 'rgba(255,200,110,0.95)'); g.addColorStop(1, 'rgba(255,200,110,0)'); c.fillStyle = g; c.fillRect(30, 32, 50, 70);
    c.save(); c.translate(62, 36); c.rotate(-0.25);
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 14); c.stroke();
    c.fillStyle = '#3a3044'; c.beginPath(); c.moveTo(-9, 18); c.lineTo(0, 12); c.lineTo(9, 18); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffd27a'; c.beginPath(); rr(c, -7, 18, 14, 18, 3); c.fill(); c.lineWidth = 2.4; c.stroke();
    c.strokeStyle = 'rgba(29,26,51,0.6)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 18); c.lineTo(0, 36); c.stroke();
    c.fillStyle = '#3a3044'; c.fillRect(-8, 35, 16, 4);
    c.restore();
    c.fillStyle = '#6a8a3a'; c.beginPath(); c.moveTo(14, 198); c.quadraticCurveTo(24, 180, 40, 184); c.quadraticCurveTo(30, 190, 40, 198); c.closePath(); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
  }, 2), 2);
}

function props(scene: Phaser.Scene): string[] {
  const out: string[] = [];
  const add = (id: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => out.push(tex(scene, `${ID}_prop_${id}`, mk(w, h, f, 2), 2));
  add('fence', 110, 60, (c) => { fence(c, 8, 58, 96, '#9a7a52', rng(5), true); });
  add('hay', 90, 64, (c) => {
    c.fillStyle = lin(c, 6, 62, [[0, '#f6d27a'], [1, '#c0902e']]); c.beginPath(); rr(c, 6, 14, 78, 48, 8); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = '#8a5a1a'; c.lineWidth = 3; c.beginPath(); c.moveTo(28, 14); c.lineTo(28, 62); c.moveTo(62, 14); c.lineTo(62, 62); c.stroke();
    c.strokeStyle = 'rgba(140,100,30,0.5)'; c.lineWidth = 1.2; for (let y = 22; y < 58; y += 7) { c.beginPath(); c.moveTo(10, y); c.lineTo(80, y + 2); c.stroke(); }
    c.strokeStyle = '#f6d27a'; c.lineWidth = 2; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(80, 20 + k * 8); c.lineTo(88 + k, 16 + k * 8); c.stroke(); }
  });
  add('wheel', 80, 80, (c) => {
    c.save(); c.translate(40, 44); c.rotate(0.2);
    c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); ell(c, 0, 0, 32, 32); c.stroke(); c.strokeStyle = '#8a5e38'; c.lineWidth = 6; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 5; for (let k = 0; k < 6; k++) { if (k === 4) continue; const a = k * Math.PI / 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); c.stroke(); }
    c.strokeStyle = '#a8784a'; c.lineWidth = 3; for (let k = 0; k < 6; k++) { if (k === 4) continue; const a = k * Math.PI / 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 30, Math.sin(a) * 30); c.stroke(); }
    c.fillStyle = '#5a3a24'; c.beginPath(); ell(c, 0, 0, 7, 7); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.restore();
    c.fillStyle = '#7a8a3a'; c.beginPath(); c.moveTo(4, 78); c.quadraticCurveTo(20, 66, 36, 70); c.quadraticCurveTo(28, 74, 30, 78); c.closePath(); c.fill();
  });
  add('sapling', 90, 110, (c) => bentTree(c, 24, 108, 0.85, '#6a4a2e', '#8a9a3a', true));
  add('sign', 80, 110, (c) => {
    c.save(); c.translate(36, 108); c.rotate(0.12);
    c.fillStyle = '#7a5a3a'; c.beginPath(); rr(c, -4, -96, 8, 96, 2); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#c89a62'; c.beginPath(); c.moveTo(-6, -92); c.lineTo(30, -92); c.lineTo(42, -82); c.lineTo(30, -72); c.lineTo(-6, -72); c.closePath(); c.fill(); c.stroke();
    c.save(); c.rotate(-0.5); c.beginPath(); c.moveTo(-50, -50); c.lineTo(-12, -50); c.lineTo(-12, -34); c.lineTo(-50, -34); c.lineTo(-60, -42); c.closePath(); c.fill(); c.stroke(); c.restore();
    c.fillStyle = '#e4572e'; c.beginPath(); c.moveTo(4, -86); c.lineTo(24, -86); c.lineTo(24, -90); c.lineTo(32, -82); c.lineTo(24, -74); c.lineTo(24, -78); c.lineTo(4, -78); c.closePath(); c.fill(); c.lineWidth = 1.6; c.stroke();
    c.restore();
  });
  add('rocks', 90, 56, (c) => {
    for (const [x, y, rx, ry, col] of [[30, 40, 26, 16, '#8a7a8a'], [62, 44, 20, 12, '#7a6a7a'], [46, 24, 16, 12, '#9a8a9a']] as [number, number, number, number, string][]) {
      c.fillStyle = lin(c, y - ry, y + ry, [[0, shade(col, 0.25)], [1, shade(col, -0.3)]]); c.beginPath(); ell(c, x, y, rx, ry); c.fill(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
      c.fillStyle = 'rgba(255,230,200,0.35)'; c.beginPath(); ell(c, x - rx * 0.3, y - ry * 0.45, rx * 0.4, ry * 0.2); c.fill();
    }
    c.fillStyle = '#7a8a3a'; c.beginPath(); c.moveTo(6, 54); c.quadraticCurveTo(14, 44, 26, 44); c.quadraticCurveTo(18, 48, 20, 54); c.closePath(); c.fill();
  });
  return out;
}

function ambient(scene: Phaser.Scene): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig & { texture: string } {
  // one texture with two frames: a leaf and a rain streak
  const key = `${ID}_wind`;
  if (!scene.textures.exists(key)) {
    tex(scene, key, mk(40, 14, (c) => {
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(1, 7); c.quadraticCurveTo(7, 0, 13, 7); c.quadraticCurveTo(7, 14, 1, 7); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(1, 7); c.lineTo(13, 7); c.stroke();
      const g = c.createLinearGradient(18, 0, 40, 0); g.addColorStop(0, 'rgba(220,220,255,0)'); g.addColorStop(1, 'rgba(230,230,255,0.9)'); c.fillStyle = g; c.fillRect(18, 6, 22, 1.6);
    }));
    const t = scene.textures.get(key); t.add('leaf', 0, 0, 0, 14, 14); t.add('rain', 0, 18, 4, 22, 6);
  }
  return {
    texture: key, frame: ['leaf', 'rain', 'rain'], x: { min: -40, max: VIEW_W }, y: { min: -20, max: VIEW_H }, lifespan: 2600, frequency: 60, quantity: 1,
    speedX: { min: 180, max: 340 }, speedY: { min: 60, max: 150 }, rotate: { min: 10, max: 30 }, scale: { min: 0.7, max: 1.2 },
    alpha: { start: 0.85, end: 0 }, tint: [0xd8b04a, 0xc0703a, 0x9aa04a, 0xffffff],
  };
}

function overlay(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_overlay`, mk(VIEW_W, VIEW_H, (c) => {
    // the storm's shadow on the left side
    const g = c.createLinearGradient(0, 0, 420, 0); g.addColorStop(0, 'rgba(20,8,30,0.55)'); g.addColorStop(0.5, 'rgba(20,8,30,0.2)'); g.addColorStop(1, 'rgba(20,8,30,0)');
    c.fillStyle = g; c.fillRect(0, 0, 420, VIEW_H);
    c.fillStyle = lin(c, 0, 120, [[0, 'rgba(20,8,30,0.3)'], [1, 'rgba(20,8,30,0)']]); c.fillRect(0, 0, VIEW_W, 120);
  }));
}

registerWorld({ id: ID, name: 'המרדף', sky, far, mid, ground, platform, lamp, props, ambient, overlay });
