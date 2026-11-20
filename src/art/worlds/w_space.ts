/** החלל: friendly outer space: a violet starfield with nebulae, ringed planets, a big moon, a space station, and a moon-base surface. */
import * as Phaser from 'phaser';
import { INK, ell, rr, shade } from '../puppet';
import { LAYER_W, VIEW_H, VIEW_W, lin, mk, nosoft, registerWorld, rng, soft, tex, wrap } from '../world';

/** wrap() with the same random numbers for both copies, so an item crossing the seam matches itself. */
function wrapR(r: () => number, x: number, ew: number, f: (xx: number, r: () => number) => void): void { const s = Math.floor(r() * 1e9); wrap(LAYER_W, x, ew, (xx) => f(xx, rng(s))); }

const ID = 'space';

function planet(c: CanvasRenderingContext2D, x: number, y: number, rad: number, a: string, b: string, ring: string | null, ink: boolean): void {
  if (ring) { c.strokeStyle = ring; c.lineWidth = rad * 0.16; c.beginPath(); c.ellipse(x, y, rad * 1.8, rad * 0.42, -0.25, Math.PI, Math.PI * 2); c.stroke(); }
  c.fillStyle = lin(c, y - rad, y + rad, [[0, a], [1, b]]); c.beginPath(); ell(c, x, y, rad, rad); c.fill();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.save(); c.beginPath(); ell(c, x, y, rad, rad); c.clip();
  c.fillStyle = 'rgba(255,255,255,0.14)'; for (let k = -2; k <= 2; k++) { c.fillRect(x - rad, y + k * rad * 0.35, rad * 2, rad * 0.12); }
  c.fillStyle = 'rgba(20,10,60,0.35)'; c.beginPath(); ell(c, x + rad * 0.45, y + rad * 0.4, rad, rad); c.fill();
  c.restore();
  if (ring) { c.strokeStyle = ring; c.lineWidth = rad * 0.16; c.beginPath(); c.ellipse(x, y, rad * 1.8, rad * 0.42, -0.25, 0, Math.PI); c.stroke(); }
}

function rock(c: CanvasRenderingContext2D, x: number, y: number, rad: number, col: string, r: () => number, ink: boolean): void {
  c.fillStyle = lin(c, y - rad, y + rad, [[0, shade(col, 0.2)], [1, shade(col, -0.35)]]);
  c.beginPath(); const n = 9;
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, q = rad * (0.78 + r() * 0.3); if (i) c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q * 0.85); else c.moveTo(x + q, y); }
  c.closePath(); c.fill(); if (ink) { c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = 'rgba(20,10,60,0.3)'; for (let k = 0; k < 2; k++) { c.beginPath(); ell(c, x + (r() - 0.5) * rad, y + (r() - 0.5) * rad * 0.6, rad * 0.2, rad * 0.14); c.fill(); }
}

function station(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  c.fillStyle = '#7a86c8';
  c.fillRect(x - 70 * s, y - 2 * s, 140 * s, 4 * s);
  for (const sx of [-1, 1]) { c.fillStyle = '#3a5ab8'; c.fillRect(x + sx * 46 * s - 16 * s, y - 22 * s, 32 * s, 44 * s); c.strokeStyle = 'rgba(160,190,255,0.6)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x + sx * 46 * s - 16 * s, y - 22 * s + k * 11 * s); c.lineTo(x + sx * 46 * s + 16 * s, y - 22 * s + k * 11 * s); c.stroke(); } }
  c.fillStyle = '#b8c2ec'; c.beginPath(); ell(c, x, y, 18 * s, 18 * s); c.fill();
  c.strokeStyle = '#b8c2ec'; c.lineWidth = 4 * s; c.beginPath(); ell(c, x, y, 34 * s, 10 * s); c.stroke();
  c.fillStyle = '#ffd66b'; for (let k = -1; k <= 1; k++) { c.beginPath(); ell(c, x + k * 7 * s, y - 3 * s, 2 * s, 2 * s); c.fill(); }
}

function sky(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_sky`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#0b0826'], [0.5, '#1d1452'], [1, '#3a2a86']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    // nebulae: soft coloured clouds
    for (const [x, y, rad, col] of [[200, 160, 260, '255,90,180'], [700, 260, 300, '80,180,255'], [480, 80, 200, '170,110,255'], [880, 60, 180, '255,160,90']] as [number, number, number, string][]) {
      const g = c.createRadialGradient(x, y, 10, x, y, rad); g.addColorStop(0, `rgba(${col},0.35)`); g.addColorStop(0.5, `rgba(${col},0.12)`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    const r = rng(19);
    for (let i = 0; i < 260; i++) { const s = r() < 0.9 ? 0.6 + r() * 0.8 : 1.6 + r(); c.fillStyle = `rgba(255,255,255,${0.4 + r() * 0.6})`; c.beginPath(); ell(c, r() * VIEW_W, r() * VIEW_H, s, s); c.fill(); }
    for (let i = 0; i < 8; i++) { const x = r() * VIEW_W, y = r() * 380; c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x + 1.2, y - 1.2); c.lineTo(x + 6, y); c.lineTo(x + 1.2, y + 1.2); c.lineTo(x, y + 6); c.lineTo(x - 1.2, y + 1.2); c.lineTo(x - 6, y); c.lineTo(x - 1.2, y - 1.2); c.closePath(); c.fill(); }
    // the big moon
    const mx = 760, my = 150, mr = 96;
    const g = c.createRadialGradient(mx, my, mr * 0.8, mx, my, mr * 1.8); g.addColorStop(0, 'rgba(220,220,255,0.35)'); g.addColorStop(1, 'rgba(220,220,255,0)'); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.fillStyle = lin(c, my - mr, my + mr, [[0, '#f4f1ff'], [1, '#bdb6e6']]); c.beginPath(); ell(c, mx, my, mr, mr); c.fill();
    c.fillStyle = 'rgba(140,130,200,0.35)'; for (const [cx, cy, cr] of [[-30, -30, 18], [24, 10, 26], [-40, 36, 12], [40, -46, 10], [-6, 60, 14]] as [number, number, number][]) { c.beginPath(); ell(c, mx + cx, my + cy, cr, cr * 0.9); c.fill(); }
    c.fillStyle = 'rgba(40,30,110,0.28)'; c.save(); c.beginPath(); ell(c, mx, my, mr, mr); c.clip(); c.beginPath(); ell(c, mx + 40, my + 34, mr, mr); c.fill(); c.restore();
    // a comet
    const cg = c.createLinearGradient(130, 40, 320, 120); cg.addColorStop(0, 'rgba(160,230,255,0)'); cg.addColorStop(1, 'rgba(220,250,255,0.85)');
    c.fillStyle = cg; c.beginPath(); c.moveTo(130, 30); c.lineTo(322, 116); c.lineTo(316, 128); c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); ell(c, 322, 122, 6, 6); c.fill();
  }));
}

function far(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_far`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(43);
    planet(c, 260, 200, 70, '#ffb36b', '#d9506e', 'rgba(255,220,170,0.75)', false);
    planet(c, 1180, 130, 44, '#7be0c8', '#2f7aa8', null, false);
    wrapR(r, 1720, 260, (xx, r) => planet(c, xx + 70, 250, 90, '#c49bff', '#5a3ab8', 'rgba(220,200,255,0.6)', false));
    planet(c, 700, 90, 22, '#ff8aa8', '#a83a6e', null, false);
    station(c, 900, 260, 1.2);
    // satellites
    for (const [x, y] of [[480, 330], [1460, 90]] as [number, number][]) {
      c.fillStyle = '#9aa6dc'; c.fillRect(x - 6, y - 6, 12, 12); c.fillStyle = '#3a5ab8'; c.fillRect(x - 30, y - 5, 20, 10); c.fillRect(x + 10, y - 5, 20, 10);
      c.strokeStyle = '#9aa6dc'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - 6); c.lineTo(x, y - 16); c.stroke();
    }
    // a band of small asteroids
    for (let i = 0; i < 70; i++) { const x = r() * LAYER_W, y = 340 + Math.sin(x / LAYER_W * Math.PI * 2) * 30 + (r() - 0.5) * 50; wrapR(r, x - 10, 20, (xx, r) => rock(c, xx, y, 3 + r() * 8, '#6a66a8', r, false)); }
    // distant lunar horizon
    c.fillStyle = '#3d3a80'; c.beginPath(); c.moveTo(0, VIEW_H);
    for (let x = 0; x <= LAYER_W; x += 40) c.lineTo(x, 430 - Math.sin(x / LAYER_W * Math.PI * 6) * 20 - Math.sin(x / LAYER_W * Math.PI * 14) * 8);
    c.lineTo(LAYER_W, VIEW_H); c.closePath(); c.fill();
    c.fillStyle = lin(c, 380, VIEW_H, [[0, 'rgba(90,70,180,0)'], [1, 'rgba(110,90,200,0.7)']]); c.fillRect(0, 380, LAYER_W, VIEW_H);
  }));
}

function mid(scene: Phaser.Scene): string {
  const RES = 1.5;
  return tex(scene, `${ID}_mid`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(67), base = 482;
    // floating rocks drifting in the air
    for (const [x, y, rad] of [[140, 120, 34], [620, 70, 22], [980, 160, 40], [1380, 100, 28], [1760, 170, 30], [430, 230, 16], [1220, 260, 14]] as [number, number, number][]) {
      wrapR(r, x - rad, rad * 2, (xx, r) => { soft(c, 10, 6, 0.3); rock(c, xx + rad, y, rad, '#8a8fc8', r, true); nosoft(c); });
    }
    // the moon base along the horizon
    c.fillStyle = '#4a4890'; c.beginPath(); c.moveTo(0, VIEW_H); for (let x = 0; x <= LAYER_W; x += 30) c.lineTo(x, base - 20 - Math.abs(Math.sin(x / 210)) * 26); c.lineTo(LAYER_W, VIEW_H); c.closePath(); c.fill();
    const kinds = ['dome', 'dish', 'tower', 'dome', 'rocket', 'tubes', 'dish', 'dome'];
    let x = 30, i = 0;
    while (x < LAYER_W - 150) {
      const k = kinds[i % kinds.length]; i++;
      const w = { dome: 180, dish: 110, tower: 70, rocket: 80, tubes: 160 }[k] as number;
      wrapR(r, x, w, (xx, r) => {
        soft(c, 10, 5, 0.35);
        if (k === 'dome') {
          c.fillStyle = '#c8cff0'; c.beginPath(); c.rect(xx, base - 40, w, 40); c.fill(); nosoft(c); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.fillStyle = 'rgba(140,220,255,0.75)'; c.beginPath(); c.arc(xx + w / 2, base - 40, w * 0.42, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
          c.strokeStyle = 'rgba(29,26,51,0.45)'; c.lineWidth = 1.5; for (let k2 = 1; k2 < 4; k2++) { c.beginPath(); c.ellipse(xx + w / 2, base - 40, w * 0.42 * k2 / 4, w * 0.42, 0, Math.PI, 0); c.stroke(); }
          c.beginPath(); c.moveTo(xx + w / 2 - w * 0.42, base - 40 - w * 0.2); c.lineTo(xx + w / 2 + w * 0.42, base - 40 - w * 0.2); c.stroke();
          c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); ell(c, xx + w / 2 - w * 0.2, base - 40 - w * 0.25, w * 0.06, w * 0.1, 0.5); c.fill();
          c.fillStyle = '#ffd66b'; for (let k2 = 0; k2 < 4; k2++) c.fillRect(xx + 14 + k2 * (w - 28) / 3 - 5, base - 28, 10, 8);
          c.fillStyle = '#5ab0ff'; c.fillRect(xx, base - 12, w, 4);
        } else if (k === 'dish') {
          c.fillStyle = '#9aa6dc'; c.fillRect(xx + w / 2 - 5, base - 70, 10, 70); nosoft(c); c.lineWidth = 2.5; c.strokeStyle = INK; c.strokeRect(xx + w / 2 - 5, base - 70, 10, 70);
          c.save(); c.translate(xx + w / 2, base - 80); c.rotate(-0.5);
          c.fillStyle = '#e8ecfa'; c.beginPath(); c.ellipse(0, 0, 48, 20, 0, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
          c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-30, 8); c.lineTo(0, -30); c.lineTo(30, 8); c.stroke();
          c.fillStyle = '#ff6b8a'; c.beginPath(); ell(c, 0, -32, 5, 5); c.fill(); c.stroke();
          c.restore();
        } else if (k === 'tower') {
          c.strokeStyle = '#9aa6dc'; c.lineWidth = 4; c.beginPath(); c.moveTo(xx + 10, base); c.lineTo(xx + w / 2, base - 220); c.lineTo(xx + w - 10, base); c.stroke(); nosoft(c);
          c.lineWidth = 2; for (let y = base - 30; y > base - 210; y -= 30) { const t = (base - y) / 220, hw = (w / 2 - 10) * (1 - t); c.beginPath(); c.moveTo(xx + w / 2 - hw, y); c.lineTo(xx + w / 2 + hw, y - 30); c.stroke(); }
          const g = c.createRadialGradient(xx + w / 2, base - 224, 1, xx + w / 2, base - 224, 20); g.addColorStop(0, 'rgba(255,110,140,1)'); g.addColorStop(1, 'rgba(255,110,140,0)'); c.fillStyle = g; c.fillRect(xx + w / 2 - 20, base - 244, 40, 40);
        } else if (k === 'rocket') {
          c.fillStyle = lin(c, base - 200, base, [[0, '#ffffff'], [1, '#c8cff0']]);
          c.beginPath(); c.moveTo(xx + w / 2, base - 200); c.bezierCurveTo(xx + w / 2 + 30, base - 160, xx + w / 2 + 22, base - 80, xx + w / 2 + 20, base - 40); c.lineTo(xx + w / 2 - 20, base - 40); c.bezierCurveTo(xx + w / 2 - 22, base - 80, xx + w / 2 - 30, base - 160, xx + w / 2, base - 200); c.fill(); nosoft(c); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.fillStyle = '#e4572e'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(xx + w / 2 + s * 20, base - 80); c.lineTo(xx + w / 2 + s * 38, base - 30); c.lineTo(xx + w / 2 + s * 20, base - 40); c.closePath(); c.fill(); c.stroke(); }
          c.fillStyle = '#5ab0ff'; c.beginPath(); ell(c, xx + w / 2, base - 130, 9, 9); c.fill(); c.stroke();
          c.fillStyle = '#e4572e'; c.beginPath(); c.moveTo(xx + w / 2, base - 200); c.quadraticCurveTo(xx + w / 2 + 16, base - 180, xx + w / 2 + 18, base - 170); c.lineTo(xx + w / 2 - 18, base - 170); c.quadraticCurveTo(xx + w / 2 - 16, base - 180, xx + w / 2, base - 200); c.fill(); c.stroke();
          c.strokeStyle = '#9aa6dc'; c.lineWidth = 3; c.beginPath(); c.moveTo(xx + w / 2 - 14, base - 40); c.lineTo(xx + w / 2 - 20, base); c.moveTo(xx + w / 2 + 14, base - 40); c.lineTo(xx + w / 2 + 20, base); c.stroke();
        } else {
          c.fillStyle = '#b8c2ec'; c.beginPath(); rr(c, xx, base - 30, w, 22, 11); c.fill(); nosoft(c); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
          c.fillStyle = '#9aa6dc'; for (let k2 = 0; k2 < 4; k2++) { c.beginPath(); rr(c, xx + 12 + k2 * (w - 30) / 3, base - 34, 8, 30, 2); c.fill(); c.stroke(); }
          c.fillStyle = '#5ab0ff'; for (let k2 = 0; k2 < 3; k2++) { c.beginPath(); ell(c, xx + 32 + k2 * (w - 30) / 3, base - 19, 4, 4); c.fill(); }
        }
        nosoft(c);
      });
      x += w + 40 + r() * 90;
    }
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(50,30,130,0.33)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }, RES), RES);
}

/** Grey-blue moon rock: a lit dusty top, craters and pebbles, darker bedrock below. */
function ground(scene: Phaser.Scene, w: number): string {
  const k = `${ID}_ground_${w}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 120, (c) => {
    const r = rng(w * 11 + 7), H = 120;
    c.fillStyle = lin(c, 0, H, [[0, '#8a90c8'], [0.3, '#5a5c9c'], [1, '#26245a']]); c.fillRect(0, 0, w, H);
    // rock chunks in the body
    for (let i = 0; i < w / 30; i++) { const x = r() * w, y = 34 + r() * 80, s = 6 + r() * 16; c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(10,8,40,0.18)'; c.beginPath(); ell(c, x, y, s, s * 0.6); c.fill(); }
    // glowing crystals in the rock
    for (let x = 60 + r() * 100; x < w - 20; x += 220 + r() * 160) { const y = 56 + r() * 40; c.fillStyle = 'rgba(120,230,255,0.75)'; c.beginPath(); c.moveTo(x, y + 10); c.lineTo(x + 5, y - 8); c.lineTo(x + 10, y + 10); c.closePath(); c.moveTo(x + 8, y + 10); c.lineTo(x + 14, y - 2); c.lineTo(x + 18, y + 10); c.closePath(); c.fill(); }
    // the dusty top
    c.fillStyle = lin(c, 0, 22, [[0, '#e2e4f8'], [1, '#a9aedb']]); c.fillRect(0, 0, w, 22);
    // craters on the lip
    for (let x = 30 + r() * 40; x < w - 40; x += 90 + r() * 120) {
      const cw = 14 + r() * 18;
      c.fillStyle = 'rgba(70,70,130,0.45)'; c.beginPath(); ell(c, x, 12, cw, 4.5); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.ellipse(x, 12.5, cw, 4.5, 0, 0.1, Math.PI - 0.1); c.lineWidth = 1.4; c.strokeStyle = 'rgba(255,255,255,0.7)'; c.stroke();
    }
    for (let i = 0; i < w / 20; i++) { c.fillStyle = 'rgba(80,80,140,0.5)'; c.beginPath(); ell(c, r() * w, 6 + r() * 12, 1.5 + r() * 1.5, 1 + r()); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22);
    for (let x = 0; x <= w; x += 20) c.lineTo(x, 22 + (r() < 0.3 ? 3 : 0));
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(0, 0, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }));
}

/** 'plank': a riveted metal panel with little thrusters; 'awning': a small floating rock. */
function platform(scene: Phaser.Scene, w: number, style: 'plank' | 'awning', seed: number): string {
  const k = `${ID}_plat_${style}_${w}_${seed}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 42, (c) => {
    const r = rng(seed * 19 + w);
    if (style === 'plank') {
      // thruster glows underneath
      for (const x of [w * 0.25, w * 0.75]) { const g = c.createRadialGradient(x, 30, 1, x, 30, 12); g.addColorStop(0, 'rgba(120,230,255,0.9)'); g.addColorStop(1, 'rgba(120,230,255,0)'); c.fillStyle = g; c.fillRect(x - 12, 22, 24, 20); }
      soft(c, 6, 4, 0.35);
      c.fillStyle = lin(c, 4, 22, [[0, '#dfe4f8'], [1, '#8f98c8']]); c.beginPath(); rr(c, 2, 4, w - 4, 18, 3); c.fill(); nosoft(c);
      c.lineWidth = 2.8; c.strokeStyle = INK; c.stroke();
      // hazard stripes at the ends
      c.save(); c.beginPath(); rr(c, 2, 4, w - 4, 18, 3); c.clip();
      for (const x0 of [2, w - 20]) { c.fillStyle = '#ffd23f'; c.fillRect(x0, 4, 18, 18); c.fillStyle = INK; for (let s = -18; s < 18; s += 8) { c.beginPath(); c.moveTo(x0 + s, 22); c.lineTo(x0 + s + 4, 22); c.lineTo(x0 + s + 22, 4); c.lineTo(x0 + s + 18, 4); c.closePath(); c.fill(); } }
      c.restore();
      c.lineWidth = 2.8; c.strokeStyle = INK; c.beginPath(); rr(c, 2, 4, w - 4, 18, 3); c.stroke();
      c.fillStyle = '#5a6098'; for (let x = 28; x < w - 26; x += 18) { c.beginPath(); ell(c, x, 14, 1.6, 1.6); c.fill(); }
      c.fillStyle = 'rgba(255,255,255,0.65)'; c.fillRect(22, 6, w - 44, 2.5);
      for (const x of [w * 0.25, w * 0.75]) { c.fillStyle = '#5a6098'; c.beginPath(); c.moveTo(x - 6, 22); c.lineTo(x + 6, 22); c.lineTo(x + 4, 28); c.lineTo(x - 4, 28); c.closePath(); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
    } else {
      soft(c, 6, 4, 0.3);
      c.fillStyle = lin(c, 4, 40, [[0, '#b8bce6'], [1, '#4a4890']]);
      c.beginPath(); c.moveTo(4, 8); c.quadraticCurveTo(w / 2, 0, w - 4, 8); c.lineTo(w - 10, 18);
      const n = 5; for (let i = 1; i < n; i++) { const t = 1 - i / n; c.lineTo(10 + (w - 20) * t, 26 + Math.sin(Math.PI * t) * 12 + r() * 3); }
      c.lineTo(10, 18); c.closePath(); c.fill(); nosoft(c);
      c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#e2e4f8'; c.beginPath(); c.moveTo(4, 8); c.quadraticCurveTo(w / 2, 0, w - 4, 8); c.lineTo(w - 6, 11); c.quadraticCurveTo(w / 2, 5, 6, 11); c.closePath(); c.fill();
      c.fillStyle = 'rgba(70,70,130,0.45)'; c.beginPath(); ell(c, w * 0.35, 20, 6, 3); ell(c, w * 0.7, 24, 4, 2); c.fill();
      c.fillStyle = 'rgba(120,230,255,0.8)'; c.beginPath(); c.moveTo(w * 0.55, 34); c.lineTo(w * 0.58, 26); c.lineTo(w * 0.61, 34); c.closePath(); c.fill();
    }
  }));
}

function lamp(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_lamp`, mk(70, 200, (c) => {
    const g = c.createRadialGradient(35, 24, 3, 35, 24, 34); g.addColorStop(0, 'rgba(120,230,255,0.95)'); g.addColorStop(1, 'rgba(120,230,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, 70);
    c.fillStyle = '#9aa6dc'; c.beginPath(); rr(c, 31, 34, 8, 150, 3); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#c8cff0'; c.beginPath(); c.moveTo(14, 198); c.lineTo(22, 178); c.lineTo(48, 178); c.lineTo(56, 198); c.closePath(); c.fill(); c.stroke();
    for (const y of [70, 110, 150]) { c.fillStyle = '#5a6098'; c.beginPath(); rr(c, 26, y, 18, 6, 2); c.fill(); c.lineWidth = 2; c.stroke(); }
    c.fillStyle = '#e8ecfa'; c.beginPath(); rr(c, 22, 30, 26, 10, 3); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#b8f0ff'; c.beginPath(); ell(c, 35, 22, 10, 10); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); ell(c, 32, 19, 3, 3); c.fill();
  }, 2), 2);
}

function props(scene: Phaser.Scene): string[] {
  const out: string[] = [];
  const add = (id: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => out.push(tex(scene, `${ID}_prop_${id}`, mk(w, h, f, 2), 2));
  add('dish', 90, 100, (c) => {
    c.fillStyle = '#9aa6dc'; c.beginPath(); rr(c, 40, 50, 10, 48, 2); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#c8cff0'; c.beginPath(); rr(c, 26, 88, 38, 10, 3); c.fill(); c.stroke();
    c.save(); c.translate(45, 46); c.rotate(-0.55);
    c.fillStyle = lin(c, -10, 24, [[0, '#ffffff'], [1, '#b8c2ec']]); c.beginPath(); c.ellipse(0, 0, 40, 18, 0, 0, Math.PI); c.closePath(); c.fill(); c.lineWidth = 3; c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(-24, 6); c.lineTo(0, -26); c.lineTo(24, 6); c.stroke();
    c.fillStyle = '#ff6b8a'; c.beginPath(); ell(c, 0, -28, 5, 5); c.fill(); c.stroke();
    c.restore();
  });
  add('rover', 110, 70, (c) => {
    for (const x of [22, 55, 88]) { c.fillStyle = '#3a3a6a'; c.beginPath(); ell(c, x, 56, 12, 12); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); c.fillStyle = '#9aa6dc'; c.beginPath(); ell(c, x, 56, 5, 5); c.fill(); }
    c.fillStyle = lin(c, 26, 50, [[0, '#ffffff'], [1, '#b8c2ec']]); c.beginPath(); rr(c, 8, 26, 94, 22, 6); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#3a5ab8'; c.beginPath(); rr(c, 18, 14, 40, 12, 2); c.fill(); c.lineWidth = 2; c.stroke();
    c.strokeStyle = 'rgba(160,190,255,0.7)'; c.lineWidth = 1; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(18 + k * 10, 14); c.lineTo(18 + k * 10, 26); c.stroke(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(84, 26); c.lineTo(84, 8); c.stroke();
    c.fillStyle = '#e8ecfa'; c.beginPath(); rr(c, 76, 2, 18, 10, 3); c.fill(); c.lineWidth = 2; c.stroke();
    c.fillStyle = '#5ab0ff'; c.beginPath(); ell(c, 89, 7, 3, 3); c.fill();
    c.fillStyle = '#ffd23f'; c.fillRect(66, 33, 26, 5);
  });
  add('rocket', 60, 120, (c) => {
    c.fillStyle = lin(c, 4, 100, [[0, '#ffffff'], [1, '#c8cff0']]);
    c.beginPath(); c.moveTo(30, 4); c.bezierCurveTo(46, 26, 44, 70, 42, 96); c.lineTo(18, 96); c.bezierCurveTo(16, 70, 14, 26, 30, 4); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#e4572e'; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(30 + s * 12, 70); c.lineTo(30 + s * 26, 112); c.lineTo(30 + s * 12, 98); c.closePath(); c.fill(); c.stroke(); }
    c.beginPath(); c.moveTo(30, 4); c.quadraticCurveTo(40, 14, 42, 24); c.lineTo(18, 24); c.quadraticCurveTo(20, 14, 30, 4); c.fill(); c.stroke();
    c.fillStyle = '#5ab0ff'; c.beginPath(); ell(c, 30, 48, 8, 8); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#ffffff'; c.beginPath(); ell(c, 27, 45, 2.4, 2.4); c.fill();
    c.fillStyle = '#5a6098'; c.beginPath(); rr(c, 20, 96, 20, 10, 2); c.fill(); c.lineWidth = 2; c.stroke();
    c.fillStyle = '#9aa6dc'; c.fillRect(14, 112, 32, 6); c.strokeRect(14, 112, 32, 6);
  });
  add('crystals', 70, 70, (c) => {
    const g = c.createRadialGradient(35, 50, 2, 35, 50, 34); g.addColorStop(0, 'rgba(120,230,255,0.5)'); g.addColorStop(1, 'rgba(120,230,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, 70);
    for (const [x, h, a, col] of [[20, 36, -0.35, '#7be0ff'], [36, 58, 0, '#b39bff'], [52, 30, 0.4, '#ff8ad8']] as [number, number, number, string][]) {
      c.save(); c.translate(x, 68); c.rotate(a);
      c.fillStyle = col; c.beginPath(); c.moveTo(-7, 0); c.lineTo(-7, -h + 10); c.lineTo(0, -h); c.lineTo(7, -h + 10); c.lineTo(7, 0); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(-7, -h + 10); c.lineTo(0, -h); c.lineTo(0, 0); c.lineTo(-7, 0); c.closePath(); c.fill();
      c.restore();
    }
    rock(c, 35, 66, 22, '#8a8fc8', rng(2), true);
  });
  add('tank', 60, 76, (c) => {
    for (const [x, col] of [[18, '#ff8a5a'], [42, '#5ab0ff']] as [number, string][]) {
      c.fillStyle = lin(c, 10, 74, [[0, shade(col, 0.3)], [1, shade(col, -0.25)]]); c.beginPath(); rr(c, x - 12, 16, 24, 58, 11); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#c8cff0'; c.beginPath(); rr(c, x - 5, 6, 10, 12, 2); c.fill(); c.lineWidth = 2; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x - 7, 24, 3, 40);
      c.fillStyle = '#fff4dc'; c.fillRect(x - 10, 44, 20, 8);
    }
  });
  add('beacon', 50, 110, (c) => {
    c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(12, 108); c.lineTo(12, 6); c.stroke(); c.strokeStyle = '#c8cff0'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#b39bff'; c.beginPath(); c.moveTo(13, 8); c.lineTo(46, 14); c.lineTo(40, 24); c.lineTo(46, 34); c.lineTo(13, 34); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, q = k % 2 ? 2.6 : 6; c.lineTo(26 + Math.cos(a) * q, 21 + Math.sin(a) * q); } c.closePath(); c.fill(); c.lineWidth = 1.2; c.stroke();
    c.fillStyle = '#8a8fc8'; c.beginPath(); ell(c, 12, 106, 12, 4); c.fill(); c.lineWidth = 2; c.stroke();
  });
  return out;
}

function ambient(scene: Phaser.Scene): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig & { texture: string } {
  const k = tex(scene, `${ID}_twinkle`, mk(14, 14, (c) => {
    const g = c.createRadialGradient(7, 7, 0, 7, 7, 7); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(200,220,255,0.6)'); g.addColorStop(1, 'rgba(200,220,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 14, 14);
    c.fillStyle = '#ffffff'; c.fillRect(6.4, 0, 1.2, 14); c.fillRect(0, 6.4, 14, 1.2);
  }));
  return {
    texture: k, x: { min: 0, max: VIEW_W }, y: { min: 0, max: VIEW_H }, lifespan: 4000, frequency: 120, quantity: 1,
    speedX: { min: -6, max: 6 }, speedY: { min: -8, max: 2 }, scale: { min: 0.3, max: 0.9 }, alpha: { values: [0, 1, 0.2, 0.9, 0] }, blendMode: 'ADD',
    tint: [0xffffff, 0xb8f0ff, 0xffd6f0, 0xfff2b0],
  };
}

function overlay(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_overlay`, mk(VIEW_W, VIEW_H, (c) => {
    // a faint glow of the moon over the scene
    const g = c.createRadialGradient(760, 150, 60, 760, 150, 520); g.addColorStop(0, 'rgba(200,200,255,0.10)'); g.addColorStop(1, 'rgba(200,200,255,0)'); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
  }));
}

registerWorld({ id: ID, name: 'החלל', sky, far, mid, ground, platform, lamp, props, ambient, overlay });
