/** עולם הענקים: a huge child's playroom seen from tiny size: floor planks, crayon and pencil towers, block buildings, spools, a teddy bear. */
import * as Phaser from 'phaser';
import { INK, ell, rr, shade } from '../puppet';
import { LAYER_W, VIEW_H, VIEW_W, lin, mk, nosoft, registerWorld, rng, soft, tex, wrap } from '../world';

/** wrap() with the same random numbers for both copies, so an item crossing the seam matches itself. */
function wrapR(r: () => number, x: number, ew: number, f: (xx: number, r: () => number) => void): void { const s = Math.floor(r() * 1e9); wrap(LAYER_W, x, ew, (xx) => f(xx, rng(s))); }

const ID = 'giant';
const BLOCKS = ['#e4572e', '#2f6fd1', '#f2b134', '#1fa89a', '#9b5de5', '#ff7aa2'];

function crayon(c: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, col: string, ink: boolean): void {
  const top = base - h;
  c.fillStyle = lin(c, 0, 0, [[0, col], [1, col]]);
  // body with a light left side and dark right side
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(col, 0.25)); g.addColorStop(0.45, col); g.addColorStop(1, shade(col, -0.3));
  c.fillStyle = g; c.beginPath(); c.rect(x, top + w * 0.9, w, h - w * 0.9); c.moveTo(x, top + w * 0.9); c.lineTo(x + w * 0.2, top + w * 0.5); c.lineTo(x + w * 0.42, top); c.lineTo(x + w * 0.58, top); c.lineTo(x + w * 0.8, top + w * 0.5); c.lineTo(x + w, top + w * 0.9); c.closePath(); c.fill();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  // the paper wrapper
  c.fillStyle = 'rgba(255,248,230,0.9)'; c.fillRect(x, top + h * 0.35, w, h * 0.42);
  c.fillStyle = shade(col, -0.1); c.fillRect(x, top + h * 0.38, w, 4); c.fillRect(x, top + h * 0.74, w, 4);
  c.fillStyle = 'rgba(29,26,51,0.12)'; c.fillRect(x + w * 0.65, top + h * 0.35, w * 0.35, h * 0.42);
  for (let k = 0; k < 3; k++) { c.fillStyle = shade(col, -0.15); c.beginPath(); ell(c, x + w / 2, top + h * (0.46 + k * 0.09), w * 0.28, 3); c.fill(); }
  if (ink) { c.lineWidth = 2; c.strokeStyle = INK; c.strokeRect(x, top + h * 0.35, w, h * 0.42); }
}

function pencil(c: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, ink: boolean): void {
  const top = base - h, tip = w * 1.3;
  // eraser at the bottom (it stands on its eraser), ferrule, yellow hex body, wood tip, graphite point
  const stripe = (x0: number, x1: number, col: string) => { const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(col, 0.2)); g.addColorStop(1, shade(col, -0.25)); c.fillStyle = g; c.fillRect(x0, top + tip, x1 - x0, h - tip); };
  stripe(x, x + w, '#ffc93c');
  c.fillStyle = 'rgba(29,26,51,0.12)'; c.fillRect(x + w * 0.33, top + tip, 2, h - tip); c.fillRect(x + w * 0.66, top + tip, 2, h - tip);
  c.fillStyle = '#f7b7c4'; c.fillRect(x, base - w * 0.7, w, w * 0.7);
  c.fillStyle = '#c9ced6'; c.fillRect(x, base - w * 1.2, w, w * 0.5);
  c.fillStyle = 'rgba(29,26,51,0.25)'; c.fillRect(x, base - w * 1.05, w, 2); c.fillRect(x, base - w * 0.85, w, 2);
  c.fillStyle = '#f1d3a8'; c.beginPath(); c.moveTo(x, top + tip); c.lineTo(x + w / 2, top); c.lineTo(x + w, top + tip); c.closePath(); c.fill();
  c.fillStyle = '#3d3a4f'; c.beginPath(); c.moveTo(x + w * 0.36, top + tip * 0.28); c.lineTo(x + w / 2, top); c.lineTo(x + w * 0.64, top + tip * 0.28); c.closePath(); c.fill();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.beginPath(); c.moveTo(x, base); c.lineTo(x, top + tip); c.lineTo(x + w / 2, top); c.lineTo(x + w, top + tip); c.lineTo(x + w, base); c.closePath(); c.stroke(); }
}

function block(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, mark: number, ink: boolean): void {
  // a cube in a slight 3/4 view: front, top and side
  const d = s * 0.22;
  c.fillStyle = shade(col, 0.3); c.beginPath(); c.moveTo(x, y); c.lineTo(x + d, y - d); c.lineTo(x + s + d, y - d); c.lineTo(x + s, y); c.closePath(); c.fill(); if (ink) { c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = shade(col, -0.3); c.beginPath(); c.moveTo(x + s, y); c.lineTo(x + s + d, y - d); c.lineTo(x + s + d, y + s - d); c.lineTo(x + s, y + s); c.closePath(); c.fill(); if (ink) c.stroke();
  c.fillStyle = col; c.beginPath(); rr(c, x, y, s, s, 3); c.fill(); if (ink) c.stroke();
  c.fillStyle = 'rgba(255,248,230,0.92)'; c.beginPath(); rr(c, x + s * 0.14, y + s * 0.14, s * 0.72, s * 0.72, 4); c.fill();
  c.fillStyle = col; c.beginPath();
  const cx = x + s / 2, cy = y + s / 2, q = s * 0.22;
  if (mark % 4 === 0) ell(c, cx, cy, q, q);
  else if (mark % 4 === 1) { c.moveTo(cx, cy - q); c.lineTo(cx + q, cy + q * 0.8); c.lineTo(cx - q, cy + q * 0.8); c.closePath(); }
  else if (mark % 4 === 2) { for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr2 = k % 2 ? q * 0.45 : q * 1.05; c.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } c.closePath(); }
  else { c.moveTo(cx, cy + q); c.bezierCurveTo(cx - q * 1.6, cy - q * 0.2, cx - q * 0.5, cy - q * 1.3, cx, cy - q * 0.4); c.bezierCurveTo(cx + q * 0.5, cy - q * 1.3, cx + q * 1.6, cy - q * 0.2, cx, cy + q); }
  c.fill();
}

function spool(c: CanvasRenderingContext2D, x: number, base: number, w: number, h: number, thread: string, ink: boolean): void {
  const rim = h * 0.12;
  c.fillStyle = '#c9965e'; c.beginPath(); rr(c, x, base - rim, w, rim, 3); rr(c, x, base - h, w, rim, 3); c.fill(); if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, shade(thread, 0.2)); g.addColorStop(0.5, thread); g.addColorStop(1, shade(thread, -0.3));
  c.fillStyle = g; c.beginPath(); c.rect(x + w * 0.08, base - h + rim, w * 0.84, h - rim * 2); c.fill(); if (ink) c.stroke();
  c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 1.2;
  for (let y = base - h + rim + 4; y < base - rim; y += 5) { c.beginPath(); c.moveTo(x + w * 0.08, y); c.lineTo(x + w * 0.92, y + 2); c.stroke(); }
  // a loose end of thread
  c.strokeStyle = thread; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w * 0.92, base - h * 0.4); c.quadraticCurveTo(x + w * 1.3, base - h * 0.2, x + w * 1.2, base); c.stroke();
}

function coin(c: CanvasRenderingContext2D, x: number, base: number, r: number, ink: boolean): void {
  c.fillStyle = '#b8862a'; c.beginPath(); ell(c, x + r * 0.12, base - r, r * 0.9, r); c.fill();
  c.fillStyle = lin(c, base - 2 * r, base, [[0, '#ffe58a'], [1, '#e2a21c']]); c.beginPath(); ell(c, x, base - r, r * 0.9, r); c.fill(); if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.strokeStyle = 'rgba(122,82,0,0.6)'; c.lineWidth = 2; c.beginPath(); ell(c, x, base - r, r * 0.72, r * 0.8); c.stroke();
  c.fillStyle = 'rgba(122,82,0,0.6)'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, q = k % 2 ? r * 0.18 : r * 0.42; c.lineTo(x + Math.cos(a) * q * 0.9, base - r + Math.sin(a) * q); } c.closePath(); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); ell(c, x - r * 0.4, base - r * 1.4, r * 0.14, r * 0.3, 0.5); c.fill();
}

function key(c: CanvasRenderingContext2D, x: number, base: number, s: number, ink: boolean): void {
  c.save(); c.translate(x, base); c.rotate(-0.35);
  c.fillStyle = lin(c, -150 * s, 0, [[0, '#e8c46a'], [1, '#b8862a']]);
  c.beginPath(); ell(c, 0, -120 * s, 30 * s, 30 * s); c.rect(-7 * s, -96 * s, 14 * s, 96 * s); c.rect(7 * s, -26 * s, 20 * s, 9 * s); c.rect(7 * s, -10 * s, 14 * s, 9 * s); c.fill();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = '#5a4a3a'; c.beginPath(); ell(c, 0, -120 * s, 13 * s, 13 * s); c.fill();
  c.restore();
}

function sky(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_sky`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#6b4a6e'], [0.5, '#c4876f'], [1, '#f2c48f']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    // wallpaper stripes and small flowers
    for (let x = 0; x < VIEW_W; x += 48) { c.fillStyle = 'rgba(255,230,200,0.07)'; c.fillRect(x, 0, 22, VIEW_H); }
    c.fillStyle = 'rgba(255,230,200,0.12)';
    for (let y = 30; y < VIEW_H; y += 60) for (let x = (y / 60) % 2 ? 35 : 11; x < VIEW_W; x += 48) { c.beginPath(); ell(c, x, y, 3, 3); c.fill(); }
    // the big window with the moon
    const wx = 520, wy = 40, ww = 300, wh = 300;
    c.fillStyle = lin(c, wy, wy + wh, [[0, '#1d2a66'], [1, '#4f58a8']]); c.fillRect(wx, wy, ww, wh);
    const r = rng(5);
    c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 30; i++) { c.beginPath(); ell(c, wx + r() * ww, wy + r() * wh * 0.7, 1 + r() * 1.3, 1 + r() * 1.3); c.fill(); }
    const g = c.createRadialGradient(wx + 190, wy + 100, 8, wx + 190, wy + 100, 120); g.addColorStop(0, 'rgba(255,248,220,0.8)'); g.addColorStop(1, 'rgba(255,248,220,0)'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    c.fillStyle = '#fff6dc'; c.beginPath(); ell(c, wx + 190, wy + 100, 38, 38); c.fill();
    c.fillStyle = 'rgba(200,190,160,0.5)'; c.beginPath(); ell(c, wx + 178, wy + 92, 7, 6); ell(c, wx + 200, wy + 112, 5, 4); c.fill();
    c.fillStyle = '#2a2f5e'; c.beginPath(); c.moveTo(wx, wy + wh); for (let x = 0; x <= ww; x += 30) c.lineTo(wx + x, wy + wh - 40 - (x % 60 ? 20 : 0) - r() * 20); c.lineTo(wx + ww, wy + wh); c.closePath(); c.fill();
    // frame and cross bars
    c.strokeStyle = '#f6e6cc'; c.lineWidth = 14; c.strokeRect(wx, wy, ww, wh); c.lineWidth = 9; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
    c.fillStyle = '#f6e6cc'; c.fillRect(wx - 24, wy + wh, ww + 48, 16);
    // curtains
    for (const [x0, dir] of [[wx - 60, 1], [wx + ww + 60, -1]] as [number, number][]) {
      c.fillStyle = lin(c, 0, 380, [[0, '#d65a5a'], [1, '#9c3a4a']]);
      c.beginPath(); c.moveTo(x0, 20); c.lineTo(x0 + dir * 90, 20); c.quadraticCurveTo(x0 + dir * 40, 200, x0 + dir * 70, 380); c.lineTo(x0, 380); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 3; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(x0 + dir * k * 18, 20); c.quadraticCurveTo(x0 + dir * k * 10, 200, x0 + dir * k * 15, 380); c.stroke(); }
    }
    c.fillStyle = '#8a5a34'; c.fillRect(wx - 80, 14, ww + 160, 10);
    // a warm lamp glow at the top left
    const lg = c.createRadialGradient(120, 60, 10, 120, 60, 380); lg.addColorStop(0, 'rgba(255,214,140,0.55)'); lg.addColorStop(1, 'rgba(255,214,140,0)'); c.fillStyle = lg; c.fillRect(0, 0, VIEW_W, VIEW_H);
  }));
}

function far(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_far`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(23), base = 440;
    const sil = '#7a4f5e', sil2 = '#68424f';
    // a tall bookshelf
    wrapR(r, 40, 330, (xx, r) => {
      c.fillStyle = sil2; c.fillRect(xx, 40, 330, base - 40 + 100);
      for (let s = 0; s < 4; s++) {
        const sy = 60 + s * 96;
        let bx = xx + 14;
        while (bx < xx + 310) { const bw = 14 + r() * 18, bh = 50 + r() * 30; c.fillStyle = shade(['#b0606a', '#6a7ab0', '#c49a5a', '#5a9a8a', '#9a6ab0'][Math.floor(r() * 5)], -0.35); c.fillRect(bx, sy + 80 - bh, bw, bh); bx += bw + 2; if (r() < 0.1) bx += 20; }
        c.fillStyle = shade(sil2, -0.15); c.fillRect(xx, sy + 80, 330, 12);
      }
    });
    // the giant teddy bear sitting
    wrapR(r, 520, 300, (xx, r) => {
      const cx = xx + 150;
      c.fillStyle = '#8a5c4e';
      c.beginPath(); ell(c, cx, base - 110, 120, 130); ell(c, cx, base - 290, 88, 80); ell(c, cx - 70, base - 350, 32, 32); ell(c, cx + 70, base - 350, 32, 32);
      ell(c, cx - 110, base - 120, 38, 70, 0.5); ell(c, cx + 110, base - 120, 38, 70, -0.5); ell(c, cx - 80, base - 10, 55, 40); ell(c, cx + 80, base - 10, 55, 40); c.fill();
      c.fillStyle = '#a07464'; c.beginPath(); ell(c, cx, base - 268, 36, 28); ell(c, cx, base - 100, 70, 80); ell(c, cx - 70, base - 350, 16, 16); ell(c, cx + 70, base - 350, 16, 16); c.fill();
      c.fillStyle = '#4a2f3a'; c.beginPath(); ell(c, cx - 30, base - 305, 8, 9); ell(c, cx + 30, base - 305, 8, 9); ell(c, cx, base - 280, 11, 8); c.fill();
      c.fillStyle = '#c25a6a'; c.beginPath(); c.moveTo(cx - 30, base - 222); c.lineTo(cx, base - 208); c.lineTo(cx + 30, base - 222); c.lineTo(cx + 30, base - 196); c.lineTo(cx, base - 208); c.lineTo(cx - 30, base - 196); c.closePath(); c.fill();
    });
    // a desk with a lamp and picture frames
    wrapR(r, 1000, 520, (xx, r) => {
      c.fillStyle = sil; c.fillRect(xx, base - 160, 520, 26); c.fillRect(xx + 20, base - 134, 30, 240); c.fillRect(xx + 470, base - 134, 30, 240);
      c.fillRect(xx + 360, base - 200, 60, 40); c.fillRect(xx + 384, base - 330, 10, 130);
      c.beginPath(); c.moveTo(xx + 340, base - 300); c.lineTo(xx + 440, base - 300); c.lineTo(xx + 410, base - 360); c.lineTo(xx + 370, base - 360); c.closePath(); c.fill();
      const g = c.createRadialGradient(xx + 390, base - 290, 4, xx + 390, base - 290, 140); g.addColorStop(0, 'rgba(255,220,150,0.5)'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = g; c.fillRect(xx + 250, base - 430, 280, 280);
      c.fillStyle = sil; for (const [fx, fy, fw, fh] of [[60, 120, 80, 100], [170, 90, 60, 70]] as [number, number, number, number][]) { c.fillRect(xx + fx, fy, fw, fh); c.fillStyle = 'rgba(255,220,180,0.15)'; c.fillRect(xx + fx + 8, fy + 8, fw - 16, fh - 16); c.fillStyle = sil; }
      c.fillStyle = shade(sil, 0.1); for (let k = 0; k < 5; k++) c.fillRect(xx + 80 + k * 26, base - 160 - 40 - k * 6, 20, 40 + k * 6);
    });
    // a chair back and a rocking horse
    wrapR(r, 1600, 300, (xx, r) => {
      c.fillStyle = sil2; c.fillRect(xx, 80, 24, 460); c.fillRect(xx + 200, 80, 24, 460); for (let k = 0; k < 4; k++) c.fillRect(xx, 110 + k * 50, 224, 14);
      c.fillStyle = sil;
      c.beginPath(); c.moveTo(xx + 40, base + 10); c.quadraticCurveTo(xx + 150, base + 50, xx + 270, base + 10); c.lineTo(xx + 270, base + 22); c.quadraticCurveTo(xx + 150, base + 62, xx + 40, base + 22); c.fill();
      c.beginPath(); ell(c, xx + 150, base - 70, 80, 36); ell(c, xx + 240, base - 130, 26, 44, 0.4); c.rect(xx + 90, base - 50, 16, 64); c.rect(xx + 190, base - 50, 16, 64); c.fill();
    });
    c.fillStyle = lin(c, base - 80, VIEW_H, [[0, 'rgba(242,196,143,0)'], [1, 'rgba(242,196,143,0.8)']]); c.fillRect(0, base - 80, LAYER_W, VIEW_H);
  }));
}

function mid(scene: Phaser.Scene): string {
  const RES = 1.5;
  return tex(scene, `${ID}_mid`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(91), base = 482;
    // the rug along the floor
    c.fillStyle = '#9c3a4a'; c.fillRect(0, base - 22, LAYER_W, 80);
    c.fillStyle = '#e8b04a'; for (let x = 0; x < LAYER_W; x += 32) { c.beginPath(); c.moveTo(x, base - 22); c.lineTo(x + 16, base - 10); c.lineTo(x + 32, base - 22); c.closePath(); c.fill(); }
    c.fillStyle = '#2f6f8a'; c.fillRect(0, base - 6, LAYER_W, 6);
    const items: [string, number, number][] = [];
    let x = 10;
    const kinds = ['crayons', 'blocks', 'pencil', 'spool', 'coin', 'blocks', 'crayons', 'key', 'spool', 'blocks'];
    let i = 0;
    while (x < LAYER_W - 120) { const k = kinds[i % kinds.length]; const w = { crayons: 150, blocks: 190, pencil: 60, spool: 110, coin: 120, key: 120 }[k] as number; items.push([k, x, w]); x += w + 30 + r() * 50; i++; }
    soft(c, 0, 0, 0);
    for (const [k, x0, w] of items) {
      wrapR(r, x0, w, (xx, r) => {
        soft(c, 10, 5, 0.3);
        if (k === 'crayons') { crayon(c, xx, base, 40, 300, BLOCKS[Math.floor(r() * 6)], true); nosoft(c); crayon(c, xx + 46, base, 40, 230, BLOCKS[Math.floor(r() * 6)], true); crayon(c, xx + 92, base, 40, 340 * (0.7 + r() * 0.3), BLOCKS[Math.floor(r() * 6)], true); }
        else if (k === 'blocks') {
          const s = 58; let m = Math.floor(r() * 4);
          block(c, xx, base - s, s, BLOCKS[m % 6], m, true); nosoft(c);
          block(c, xx + s + 6, base - s, s, BLOCKS[(m + 1) % 6], m + 1, true);
          block(c, xx + s * 2 + 12, base - s, s, BLOCKS[(m + 2) % 6], m + 2, true);
          block(c, xx + s * 0.5 + 3, base - s * 2 - 10, s, BLOCKS[(m + 3) % 6], m + 3, true);
          block(c, xx + s * 1.5 + 9, base - s * 2 - 10, s, BLOCKS[(m + 4) % 6], m + 4, true);
          let ty = base - s * 2 - 14, tx = xx + s * 0.5 + 3;
          if (r() < 0.7) { block(c, xx + s + 6, base - s * 3 - 20, s, BLOCKS[(m + 5) % 6], m + 5, true); m++; ty = base - s * 3 - 24; tx = xx + s + 6; }
          // a triangle roof block on the top
          c.fillStyle = '#e4572e'; c.beginPath(); c.moveTo(tx - 4, ty); c.lineTo(tx + s / 2, ty - s * 0.8); c.lineTo(tx + s + 4, ty); c.closePath(); c.fill(); c.lineWidth = 2.2; c.strokeStyle = INK; c.stroke();
        }
        else if (k === 'pencil') { pencil(c, xx + 6, base, 44, 360, true); }
        else if (k === 'spool') { spool(c, xx, base, 90, 120, ['#3fa7d6', '#ff7aa2', '#7bc96f'][Math.floor(r() * 3)], true); }
        else if (k === 'coin') { coin(c, xx + 60, base, 58, true); }
        else if (k === 'key') { key(c, xx + 30, base, 1.6, true); }
        nosoft(c);
      });
    }
    // dangling yarn from above
    c.strokeStyle = '#ff9ab0'; c.lineWidth = 3;
    for (const sx of [300, 980, 1500]) wrapR(r, sx - 60, 120, (xx, r) => { c.beginPath(); c.moveTo(xx, -10); c.bezierCurveTo(xx + 40, 60, xx - 30, 110, xx + 20, 160); c.stroke(); c.fillStyle = '#ff9ab0'; c.beginPath(); ell(c, xx + 20, 172, 16, 14); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.strokeStyle = 'rgba(29,26,51,0.3)'; c.beginPath(); c.moveTo(xx + 8, 166); c.lineTo(xx + 32, 178); c.moveTo(xx + 10, 178); c.lineTo(xx + 30, 164); c.stroke(); c.strokeStyle = '#ff9ab0'; c.lineWidth = 3; });
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(120,60,80,0.3)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }, RES), RES);
}

/** A giant floor plank: a lit honey-coloured top, wood grain, board seams and nail heads. */
function ground(scene: Phaser.Scene, w: number): string {
  const k = `${ID}_ground_${w}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 120, (c) => {
    const r = rng(w * 17 + 9), H = 120;
    c.fillStyle = lin(c, 0, H, [[0, '#c98a52'], [0.3, '#a5683c'], [1, '#5e3828']]); c.fillRect(0, 0, w, H);
    // grain in the plank face
    c.strokeStyle = 'rgba(70,34,20,0.25)'; c.lineWidth = 2;
    for (let y = 30; y < H; y += 9 + r() * 6) { c.beginPath(); c.moveTo(0, y); let yy = y; for (let x = 0; x <= w; x += 40) { yy += (r() - 0.5) * 3; c.lineTo(x, yy); } c.stroke(); }
    for (let n = 0; n < w / 180; n++) { const kx = r() * w, ky = 40 + r() * 60; c.strokeStyle = 'rgba(70,34,20,0.3)'; c.beginPath(); ell(c, kx, ky, 12, 5); ell(c, kx, ky, 6, 2.5); c.stroke(); }
    // seams between floor boards: a dark gap every so often
    for (let x = 120 + r() * 80; x < w - 30; x += 200 + r() * 120) { c.fillStyle = 'rgba(40,18,12,0.7)'; c.fillRect(x, 22, 4, H); c.fillStyle = 'rgba(255,220,170,0.15)'; c.fillRect(x + 4, 22, 2, H); }
    c.fillStyle = 'rgba(40,18,12,0.6)'; c.fillRect(0, 70, w, 3);
    // the top face
    c.fillStyle = lin(c, 0, 22, [[0, '#f7c98a'], [1, '#d9995a']]); c.fillRect(0, 0, w, 22);
    c.strokeStyle = 'rgba(120,64,30,0.25)'; c.lineWidth = 1.5; for (let y = 6; y < 20; y += 5) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + (r() - 0.5) * 2); c.stroke(); }
    for (let x = 40 + r() * 30; x < w - 20; x += 160 + r() * 90) { c.fillStyle = '#8a8fa0'; c.beginPath(); ell(c, x, 11, 4, 3); c.fill(); c.lineWidth = 1.4; c.strokeStyle = INK; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x - 2, 9, 2, 1.5); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22); c.lineTo(w, 22); c.stroke();
    c.fillStyle = 'rgba(255,245,220,0.7)'; c.fillRect(0, 0, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }));
}

/** 'plank': a wooden school ruler; 'awning': a pile of closed books. */
function platform(scene: Phaser.Scene, w: number, style: 'plank' | 'awning', seed: number): string {
  const k = `${ID}_plat_${style}_${w}_${seed}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 42, (c) => {
    const r = rng(seed * 13 + w);
    if (style === 'plank') {
      soft(c, 6, 4, 0.3);
      c.fillStyle = lin(c, 4, 22, [[0, '#ffe7a6'], [1, '#e8b85a']]); c.beginPath(); rr(c, 2, 4, w - 4, 18, 3); c.fill(); nosoft(c);
      c.lineWidth = 2.8; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#c98a3a'; c.fillRect(3, 19, w - 6, 3);
      c.strokeStyle = INK; c.lineWidth = 1.2;
      for (let x = 8, i = 0; x < w - 6; x += 6, i++) { const L = i % 10 === 0 ? 10 : i % 5 === 0 ? 7 : 4; c.beginPath(); c.moveTo(x, 5); c.lineTo(x, 5 + L); c.stroke(); }
      c.fillStyle = INK; c.font = 'bold 7px Arial'; c.textAlign = 'center';
      for (let x = 8, i = 0; x < w - 14; x += 60, i++) if (i) c.fillText(String(i), x, 20);
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(5, 5, w - 10, 2);
      c.fillStyle = '#ffffff'; c.beginPath(); ell(c, w - 14, 14, 3.5, 3.5); c.fill(); c.lineWidth = 1.5; c.stroke();
    } else {
      const cols = ['#2f6fd1', '#e4572e', '#1fa89a', '#9b5de5', '#f2b134'];
      const books = [[2, 4, w - 4, 15], [8 + r() * 6, 19, w - 18 - r() * 8, 13]];
      soft(c, 6, 4, 0.3);
      for (let b = books.length - 1; b >= 0; b--) {
        const [x, y, bw, bh] = books[b]; const col = cols[(seed + b * 2) % cols.length];
        c.fillStyle = '#fff4dc'; c.beginPath(); rr(c, x + 3, y + 2, bw - 6, bh - 4, 2); c.fill();
        c.fillStyle = lin(c, y, y + bh, [[0, shade(col, 0.2)], [1, shade(col, -0.2)]]); c.beginPath(); rr(c, x, y, bw, bh, 3); c.fill(); if (b === 0) nosoft(c);
        c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
        c.fillStyle = '#ffd66b'; c.fillRect(x + 12, y + 2, 4, bh - 4); c.fillRect(x + bw - 16, y + 2, 4, bh - 4);
        c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(x + bw * 0.35, y + bh / 2 - 1.5, bw * 0.3, 3);
      }
      nosoft(c);
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(6, 5, w - 12, 2.5);
    }
  }));
}

function lamp(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_lamp`, mk(80, 200, (c) => {
    const g = c.createRadialGradient(40, 36, 4, 40, 36, 40); g.addColorStop(0, 'rgba(255,220,130,0.9)'); g.addColorStop(1, 'rgba(255,220,130,0)'); c.fillStyle = g; c.fillRect(0, 0, 80, 90);
    spool(c, 14, 198, 52, 58, '#3fa7d6', true);
    // a tall candle on the spool
    c.fillStyle = lin(c, 60, 140, [[0, '#fff6e6'], [1, '#f2d9b6']]); c.beginPath(); rr(c, 28, 54, 24, 88, 4); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#fff6e6'; c.beginPath(); c.moveTo(34, 56); c.quadraticCurveTo(32, 74, 36, 78); c.quadraticCurveTo(39, 70, 38, 56); c.fill(); c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(40, 54); c.lineTo(40, 46); c.stroke();
    c.fillStyle = '#ffb02e'; c.beginPath(); c.moveTo(40, 18); c.quadraticCurveTo(52, 36, 40, 46); c.quadraticCurveTo(28, 36, 40, 18); c.fill(); c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff3b0'; c.beginPath(); c.moveTo(40, 28); c.quadraticCurveTo(46, 38, 40, 44); c.quadraticCurveTo(34, 38, 40, 28); c.fill();
  }, 2), 2);
}

function props(scene: Phaser.Scene): string[] {
  const out: string[] = [];
  const add = (id: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => out.push(tex(scene, `${ID}_prop_${id}`, mk(w, h, f, 2), 2));
  add('thimble', 70, 74, (c) => {
    c.fillStyle = lin(c, 4, 72, [[0, '#e6e9f2'], [1, '#8a90a8']]); c.beginPath(); c.moveTo(10, 72); c.lineTo(16, 16); c.quadraticCurveTo(35, -4, 54, 16); c.lineTo(60, 72); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(29,26,51,0.3)'; for (let y = 20; y < 60; y += 7) for (let x = 20 + (y % 14 ? 3 : 0); x < 52; x += 7) { c.beginPath(); ell(c, x, y, 1.6, 1.6); c.fill(); }
    c.fillStyle = '#c0c6d6'; c.beginPath(); rr(c, 8, 62, 54, 10, 4); c.fill(); c.lineWidth = 2.5; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(20, 18, 3, 40);
  });
  add('buttons', 90, 56, (c) => {
    const btn = (x: number, y: number, rx: number, col: string) => { c.fillStyle = col; c.beginPath(); ell(c, x, y, rx, rx * 0.36); c.fill(); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke(); c.fillStyle = shade(col, -0.35); c.fillRect(x - rx, y, rx * 2, 6); c.beginPath(); c.rect(x - rx, y, rx * 2, 6); c.stroke(); c.fillStyle = shade(col, -0.3); for (const dx of [-6, 6]) for (const dy of [-2, 2]) { c.beginPath(); ell(c, x + dx * rx / 20, y + dy, 2, 1); c.fill(); } };
    btn(45, 46, 38, '#e4572e'); btn(43, 34, 30, '#1fa89a'); btn(47, 22, 24, '#f2b134'); btn(44, 11, 16, '#9b5de5');
  });
  add('coin', 80, 84, (c) => coin(c, 40, 82, 38, true));
  add('crayon', 110, 50, (c) => {
    c.save(); c.translate(56, 46); c.rotate(-0.08);
    c.fillStyle = '#2f6fd1'; c.beginPath(); c.moveTo(-50, -26); c.lineTo(30, -26); c.lineTo(46, -14); c.lineTo(52, -12); c.lineTo(52, -4); c.lineTo(46, -2); c.lineTo(30, 0); c.lineTo(-50, 0); c.closePath(); c.fill(); c.lineWidth = 2.8; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(255,248,230,0.92)'; c.fillRect(-36, -26, 50, 26); c.lineWidth = 2; c.strokeRect(-36, -26, 50, 26);
    c.fillStyle = '#2f6fd1'; c.fillRect(-36, -22, 50, 3); c.fillRect(-36, -7, 50, 3);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(-48, -23, 76, 3);
    c.restore();
  });
  add('blocks', 100, 96, (c) => { block(c, 6, 58, 36, '#2f6fd1', 0, true); block(c, 48, 58, 36, '#f2b134', 1, true); block(c, 26, 18, 36, '#e4572e', 2, true); });
  add('yarn', 84, 80, (c) => {
    c.fillStyle = lin(c, 6, 78, [[0, '#ffb3c8'], [1, '#e0607e']]); c.beginPath(); ell(c, 40, 44, 34, 34); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.save(); c.beginPath(); ell(c, 40, 44, 32, 32); c.clip(); c.strokeStyle = 'rgba(140,30,60,0.45)'; c.lineWidth = 2;
    for (let k = -3; k <= 3; k++) { c.beginPath(); ell(c, 40 + k * 4, 44, 34, 12 + Math.abs(k) * 3, 0.7 + k * 0.1); c.stroke(); }
    c.restore();
    c.strokeStyle = '#e0607e'; c.lineWidth = 3; c.beginPath(); c.moveTo(70, 58); c.bezierCurveTo(84, 70, 64, 78, 82, 78); c.stroke();
    c.fillStyle = '#c0c6d6'; c.save(); c.translate(26, 28); c.rotate(-0.8); c.beginPath(); rr(c, -3, -40, 6, 70, 3); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.restore();
  });
  return out;
}

function bunting(scene: Phaser.Scene): string {
  // a strand of yarn with little paper cut-outs pegged on it
  return tex(scene, `${ID}_bunting`, mk(200, 40, (c) => {
    c.strokeStyle = '#ff9ab0'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
    for (let i = 1; i < 8; i++) {
      const t = i / 8, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6;
      c.fillStyle = BLOCKS[i % BLOCKS.length]; c.beginPath();
      if (i % 2) { for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, q = k % 2 ? 4 : 9; c.lineTo(x + Math.cos(a) * q, y + 12 + Math.sin(a) * q); } c.closePath(); }
      else rr(c, x - 7, y + 3, 14, 18, 2);
      c.fill(); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#c9965e'; c.fillRect(x - 1.5, y - 2, 3, 7); c.lineWidth = 1; c.strokeRect(x - 1.5, y - 2, 3, 7);
    }
  }, 2), 2);
}

function ambient(scene: Phaser.Scene): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig & { texture: string } {
  const k = tex(scene, `${ID}_mote`, mk(10, 10, (c) => { const g = c.createRadialGradient(5, 5, 0, 5, 5, 5); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(1, 'rgba(255,240,200,0)'); c.fillStyle = g; c.fillRect(0, 0, 10, 10); }));
  return {
    texture: k, x: { min: 0, max: VIEW_W }, y: { min: 0, max: VIEW_H }, lifespan: 6000, frequency: 90, quantity: 1,
    speedX: { min: -8, max: 8 }, speedY: { min: -6, max: 6 }, scale: { min: 0.3, max: 1 }, alpha: { values: [0, 0.85, 0.6, 0] }, blendMode: 'ADD',
  };
}

function overlay(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_overlay`, mk(VIEW_W, VIEW_H, (c) => {
    // a soft beam of moonlight falling from the window toward the floor
    for (let k = 0; k < 6; k++) {
      const s = k * 22;
      c.fillStyle = lin(c, 0, VIEW_H, [[0, 'rgba(255,240,210,0.035)'], [1, 'rgba(255,240,210,0)']]);
      c.beginPath(); c.moveTo(560 + s, 40); c.lineTo(800 - s, 40); c.lineTo(560 - s * 1.5, VIEW_H); c.lineTo(180 + s * 1.5, VIEW_H); c.closePath(); c.fill();
    }
    const g = c.createRadialGradient(VIEW_W / 2, VIEW_H, 50, VIEW_W / 2, VIEW_H, 600); g.addColorStop(0, 'rgba(255,190,120,0.08)'); g.addColorStop(1, 'rgba(255,190,120,0)'); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
  }));
}

registerWorld({ id: ID, name: 'עולם הענקים', sky, far, mid, ground, platform, lamp, props, bunting, ambient, overlay });
