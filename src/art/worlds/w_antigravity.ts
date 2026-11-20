/** אנטי-כבידה: a surreal floating city where gravity points both ways: an inverted skyline, islands with trees growing down, gravity rings and crystals. */
import * as Phaser from 'phaser';
import { INK, ell, rr, shade } from '../puppet';
import { LAYER_W, VIEW_H, VIEW_W, lin, mk, nosoft, registerWorld, rng, soft, tex, wrap } from '../world';

/** wrap() with the same random numbers for both copies, so an item crossing the seam matches itself. */
function wrapR(r: () => number, x: number, ew: number, f: (xx: number, r: () => number) => void): void { const s = Math.floor(r() * 1e9); wrap(LAYER_W, x, ew, (xx) => f(xx, rng(s))); }

const ID = 'antigravity';
const TEAL = '#3ff0d8', VIO = '#b06bff', PINK = '#ff7ad9';

/** A gravity well: concentric tilted rings with a bright core. */
function well(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, a: number): void {
  const g = c.createRadialGradient(x, y, 1, x, y, 40 * s); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(x - 40 * s, y - 40 * s, 80 * s, 80 * s);
  c.strokeStyle = col; c.globalAlpha = a;
  for (let k = 1; k <= 4; k++) { c.lineWidth = 3 - k * 0.5; c.beginPath(); c.ellipse(x, y, 18 * s * k, 7 * s * k, -0.3 + k * 0.15, 0.2 * k, Math.PI * 2 - 0.4); c.stroke(); }
  c.globalAlpha = 1;
}

function arrow(c: CanvasRenderingContext2D, x: number, y: number, s: number, up: boolean, col: string): void {
  const d = up ? -1 : 1;
  c.fillStyle = col; c.beginPath(); c.moveTo(x, y + d * 14 * s); c.lineTo(x + 11 * s, y); c.lineTo(x + 4 * s, y); c.lineTo(x + 4 * s, y - d * 12 * s); c.lineTo(x - 4 * s, y - d * 12 * s); c.lineTo(x - 4 * s, y); c.lineTo(x - 11 * s, y); c.closePath(); c.fill();
}

/** A floating island with trees on top AND trees growing downward from its underside. */
function island(c: CanvasRenderingContext2D, x: number, y: number, w: number, r: () => number, ink: boolean, rock: string, leaf: string): void {
  const d = w * 0.32;
  const tree = (tx: number, ty: number, dir: number, s: number) => {
    c.fillStyle = '#5a3a6a'; c.fillRect(tx - 2.5 * s, dir < 0 ? ty - 18 * s : ty, 5 * s, 18 * s);
    c.fillStyle = leaf; c.beginPath(); ell(c, tx, ty + dir * 26 * s, 14 * s, 13 * s); ell(c, tx + 8 * s, ty + dir * 18 * s, 9 * s, 8 * s); c.fill();
    if (ink) { c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); }
  };
  for (let k = 0; k < 2; k++) tree(x + w * (0.3 + k * 0.4), y + d * 0.8, 1, 0.9 + r() * 0.3);
  c.fillStyle = lin(c, y - d, y + d, [[0, shade(rock, 0.15)], [1, shade(rock, -0.3)]]);
  c.beginPath(); c.moveTo(x, y);
  for (let i = 1; i < 6; i++) { const t = i / 6; c.lineTo(x + w * t, y - d * Math.sin(Math.PI * t) * (0.5 + r() * 0.3)); }
  c.lineTo(x + w, y);
  for (let i = 5; i > 0; i--) { const t = i / 6; c.lineTo(x + w * t, y + d * Math.sin(Math.PI * t) * (0.7 + r() * 0.3)); }
  c.closePath(); c.fill();
  if (ink) { c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
  c.fillStyle = 'rgba(63,240,216,0.7)'; c.beginPath(); c.moveTo(x + w * 0.5, y - 3); c.lineTo(x + w * 0.55, y + 8); c.lineTo(x + w * 0.5, y + 16); c.lineTo(x + w * 0.45, y + 8); c.closePath(); c.fill();
  for (let k = 0; k < 2; k++) tree(x + w * (0.25 + k * 0.45), y - d * 0.45, -1, 0.8 + r() * 0.3);
}

/** A building: drawn upright from `y` upward, or hanging down when dir = 1. */
function building(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, dir: number, col: string, win: string, r: () => number): void {
  const y0 = dir < 0 ? y - h : y;
  c.fillStyle = col; c.fillRect(x, y0, w, h);
  const tipY = dir < 0 ? y - h : y + h;
  c.beginPath();
  if (r() < 0.5) { c.moveTo(x - 3, tipY); c.lineTo(x + w / 2, tipY + dir * (20 + r() * 20)); c.lineTo(x + w + 3, tipY); }
  else ell(c, x + w / 2, tipY, w * 0.4, w * 0.32);
  c.fill();
  c.fillStyle = win;
  for (let wy = y0 + 10; wy < y0 + h - 12; wy += 16) for (let wx = x + 7; wx < x + w - 10; wx += 14) if (r() < 0.45) { c.globalAlpha = 0.5 + r() * 0.5; c.fillRect(wx, wy, 6, 8); }
  c.globalAlpha = 1;
}

function sky(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_sky`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, '#1b5c74'], [0.35, '#3a2f86'], [0.65, '#5a2a8a'], [1, '#1d6e7a']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const r = rng(31);
    c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 90; i++) { c.beginPath(); ell(c, r() * VIEW_W, r() * VIEW_H, 0.7 + r() * 1.1, 0.7 + r() * 1.1); c.fill(); }
    // a horizontal bright band in the middle where up and down meet
    c.fillStyle = lin(c, 200, 340, [[0, 'rgba(255,170,240,0)'], [0.5, 'rgba(255,170,240,0.28)'], [1, 'rgba(255,170,240,0)']]); c.fillRect(0, 200, VIEW_W, 140);
    // a great swirl
    const cx = 480, cy = 270;
    for (let k = 0; k < 7; k++) { c.strokeStyle = k % 2 ? 'rgba(63,240,216,0.18)' : 'rgba(255,122,217,0.16)'; c.lineWidth = 10 - k; c.beginPath(); c.ellipse(cx, cy, 90 + k * 55, 26 + k * 16, -0.12, k * 0.5, k * 0.5 + Math.PI * 1.4); c.stroke(); }
    const g = c.createRadialGradient(cx, cy, 4, cx, cy, 110); g.addColorStop(0, 'rgba(255,240,255,0.7)'); g.addColorStop(1, 'rgba(255,240,255,0)'); c.fillStyle = g; c.fillRect(cx - 110, cy - 110, 220, 220);
    // two small moons, one at the top and one mirrored at the bottom
    c.fillStyle = '#ffd6f5'; c.beginPath(); ell(c, 150, 80, 26, 26); c.fill();
    c.fillStyle = '#b8fff2'; c.beginPath(); ell(c, 820, 460, 20, 20); c.fill();
  }));
}

function far(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_far`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(47);
    // the inverted city hanging from the top
    c.fillStyle = '#2a2266'; c.fillRect(0, 0, LAYER_W, 18);
    let x = -10;
    while (x < LAYER_W) { const w = 50 + r() * 70, h = 60 + r() * 140; wrapR(r, x, w, (xx, r) => building(c, xx, 10, w, h, 1, '#3b2f88', '#ffb8f0', r)); x += w + 6 + r() * 20; }
    // an upright city far below
    x = -20;
    while (x < LAYER_W) { const w = 50 + r() * 60, h = 40 + r() * 110; wrapR(r, x, w, (xx, r) => building(c, xx, 470, w, h, -1, '#2a5f86', '#9ffff0', r)); x += w + 10 + r() * 30; }
    c.fillStyle = '#2a5f86'; c.fillRect(0, 466, LAYER_W, 80);
    // distant islands floating in the middle band
    for (const [ix, iy, iw] of [[160, 250, 130], [700, 290, 100], [1150, 240, 150], [1600, 280, 110]] as [number, number, number][]) wrapR(r, ix - 20, iw + 40, (xx, r) => island(c, xx, iy, iw, r, false, '#6a5aa8', '#4fb8a8'));
    for (const [wx, wy] of [[480, 200], [1380, 330]] as [number, number][]) wrapR(r, wx - 80, 160, (xx, r) => well(c, xx + 80, wy, 1.4, '#ffd6f5', 0.5));
    c.fillStyle = lin(c, 0, VIEW_H, [[0, 'rgba(60,40,140,0.35)'], [0.5, 'rgba(120,60,160,0)'], [1, 'rgba(40,110,140,0.4)']]); c.fillRect(0, 0, LAYER_W, VIEW_H);
  }));
}

function mid(scene: Phaser.Scene): string {
  const RES = 1.5;
  return tex(scene, `${ID}_mid`, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(83), base = 482;
    // a hanging deck with an upside-down house from the ceiling
    c.fillStyle = '#4a3f8a'; c.fillRect(0, 0, LAYER_W, 26); c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 26); c.lineTo(LAYER_W, 26); c.stroke();
    c.fillStyle = TEAL; for (let x = 10; x < LAYER_W; x += 40) c.fillRect(x, 20, 20, 3);
    for (const hx of [200, 860, 1460]) wrapR(r, hx - 10, 170, (xx, r) => {
      soft(c, 10, -5, 0.3);
      c.fillStyle = '#f2e8ff'; c.beginPath(); c.rect(xx, 26, 110, 80); c.fill(); nosoft(c); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#ff7a9a'; c.beginPath(); c.moveTo(xx - 10, 104); c.lineTo(xx + 55, 150); c.lineTo(xx + 120, 104); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#ffe9a0'; for (const wx of [14, 66]) { c.beginPath(); rr(c, xx + wx, 50, 26, 22, 3); c.fill(); c.stroke(); }
      c.fillStyle = '#7a5aa0'; c.beginPath(); rr(c, xx + 44, 26, 20, 30, 3); c.fill(); c.stroke();
      // an upside-down tree beside it
      c.fillStyle = '#5a3a6a'; c.fillRect(xx + 140, 26, 7, 50);
      c.fillStyle = '#3fd0a8'; c.beginPath(); ell(c, xx + 143, 88, 24, 22); ell(c, xx + 130, 76, 14, 12); c.fill(); c.lineWidth = 2; c.stroke();
    });
    // islands with trees both ways
    for (const [ix, iy, iw] of [[460, 200, 180], [1120, 250, 210], [1720, 190, 160]] as [number, number, number][]) wrapR(r, ix - 30, iw + 60, (xx, r) => { soft(c, 10, 6, 0.3); island(c, xx, iy, iw, r, true, '#8a7ac8', '#4fd8a8'); nosoft(c); });
    // gravity wells and arrow glyphs
    for (const [wx, wy] of [[300, 300], [960, 140], [1580, 330]] as [number, number][]) wrapR(r, wx - 80, 160, (xx, r) => well(c, xx + 80, wy, 1, TEAL, 0.75));
    for (let i = 0; i < 14; i++) { const ax = 60 + i * 135 + r() * 40, ay = 150 + r() * 220; wrapR(r, ax - 15, 30, (xx, r) => { c.globalAlpha = 0.65; arrow(c, xx, ay, 1, i % 2 === 0, i % 2 ? PINK : TEAL); c.globalAlpha = 1; }); }
    // crystal spires standing on the street
    let x = 30;
    while (x < LAYER_W - 60) {
      const h = 60 + r() * 120, w = 26 + r() * 20, col = [TEAL, VIO, PINK][Math.floor(r() * 3)];
      wrapR(r, x, w, (xx, r) => {
        const g = c.createRadialGradient(xx + w / 2, base - h / 2, 2, xx + w / 2, base - h / 2, h * 0.7); g.addColorStop(0, `${col}66`); g.addColorStop(1, `${col}00`); c.fillStyle = g; c.fillRect(xx + w / 2 - h * 0.7, base - h * 1.2, h * 1.4, h * 1.4);
        c.fillStyle = col; c.beginPath(); c.moveTo(xx, base); c.lineTo(xx + w * 0.15, base - h * 0.75); c.lineTo(xx + w / 2, base - h); c.lineTo(xx + w * 0.85, base - h * 0.75); c.lineTo(xx + w, base); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(xx + w * 0.15, base - h * 0.75); c.lineTo(xx + w / 2, base - h); c.lineTo(xx + w / 2, base); c.lineTo(xx, base); c.closePath(); c.fill();
      });
      x += w + 70 + r() * 160;
    }
    c.fillStyle = '#3a3a7a'; c.fillRect(0, base - 8, LAYER_W, 40);
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(70,40,140,0.32)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }, RES), RES);
}

/** A metal-and-crystal deck that reads well either way up: a lit walking lip on top, symmetric panels with crystal inlays. */
function ground(scene: Phaser.Scene, w: number): string {
  const k = `${ID}_ground_${w}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 120, (c) => {
    const r = rng(w * 3 + 11), H = 120;
    c.fillStyle = lin(c, 22, H, [[0, '#3a3378'], [0.5, '#2a2460'], [1, '#3a3378']]); c.fillRect(0, 0, w, H);
    // symmetric panels with a crystal in the middle of some
    for (let x = 0; x < w; x += 80) {
      c.strokeStyle = 'rgba(15,10,40,0.55)'; c.lineWidth = 2; c.beginPath(); rr(c, x + 4, 30, 72, 80, 6); c.stroke();
      c.strokeStyle = 'rgba(160,140,255,0.25)'; c.beginPath(); rr(c, x + 6, 32, 68, 76, 5); c.stroke();
      if (r() < 0.55) {
        const cx = x + 40, cy = 70, col = [TEAL, VIO, PINK][Math.floor(r() * 3)];
        const g = c.createRadialGradient(cx, cy, 1, cx, cy, 26); g.addColorStop(0, col); g.addColorStop(1, `${col}00`); c.globalAlpha = 0.6; c.fillStyle = g; c.fillRect(cx - 26, cy - 26, 52, 52); c.globalAlpha = 1;
        c.fillStyle = col; c.beginPath(); c.moveTo(cx, cy - 16); c.lineTo(cx + 9, cy); c.lineTo(cx, cy + 16); c.lineTo(cx - 9, cy); c.closePath(); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(cx, cy - 16); c.lineTo(cx, cy + 16); c.lineTo(cx - 9, cy); c.closePath(); c.fill();
      } else {
        c.fillStyle = 'rgba(160,140,255,0.3)'; for (const [dx, dy] of [[12, 40], [68, 40], [12, 100], [68, 100]]) { c.beginPath(); ell(c, x + dx, dy, 2.4, 2.4); c.fill(); }
      }
    }
    // a slim trim at the far side (it becomes the top edge when the deck is a ceiling)
    c.fillStyle = '#6a5ab8'; c.fillRect(0, H - 8, w, 8); c.fillStyle = TEAL; c.globalAlpha = 0.6; c.fillRect(0, H - 9, w, 1.5); c.globalAlpha = 1;
    // the walking lip
    c.fillStyle = lin(c, 0, 22, [[0, '#e6e2ff'], [1, '#9a90d8']]); c.fillRect(0, 0, w, 22);
    c.fillStyle = 'rgba(40,30,90,0.35)'; for (let x = 40; x < w; x += 80) c.fillRect(x, 3, 2, 19);
    c.fillStyle = TEAL; for (let x = 16; x < w; x += 40) { c.beginPath(); rr(c, x, 13, 14, 4, 2); c.fill(); }
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22); c.lineTo(w, 22); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(0, 0, w, 3);
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }));
}

/** 'plank': a glowing glass panel; 'awning': a faceted crystal slab. */
function platform(scene: Phaser.Scene, w: number, style: 'plank' | 'awning', seed: number): string {
  const k = `${ID}_plat_${style}_${w}_${seed}`;
  if (scene.textures.exists(k)) return k;
  return tex(scene, k, mk(w, 42, (c) => {
    const col = [TEAL, PINK, VIO][seed % 3];
    if (style === 'plank') {
      const g = c.createLinearGradient(0, 0, 0, 42); g.addColorStop(0, `${col}00`); g.addColorStop(0.5, `${col}55`); g.addColorStop(1, `${col}00`); c.fillStyle = g; c.fillRect(0, 18, w, 24);
      c.fillStyle = 'rgba(200,250,255,0.42)'; c.beginPath(); rr(c, 2, 4, w - 4, 16, 4); c.fill();
      c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); rr(c, 4.5, 6.5, w - 9, 11, 3); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(8, 6, w - 16, 2.5);
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2; for (let x = 18; x < w - 20; x += 44) { c.beginPath(); c.moveTo(x, 17); c.lineTo(x + 10, 8); c.stroke(); }
      for (const x of [10, w - 10]) { c.fillStyle = col; c.beginPath(); ell(c, x, 12, 3, 3); c.fill(); }
    } else {
      soft(c, 6, 4, 0.3);
      c.fillStyle = lin(c, 4, 36, [[0, shade(col, 0.35)], [1, shade(col, -0.35)]]);
      c.beginPath(); c.moveTo(2, 6); c.lineTo(w - 2, 6); c.lineTo(w - 12, 20);
      const n = Math.max(3, Math.round(w / 30));
      for (let i = 1; i < n; i++) { const t = 1 - i / n; c.lineTo(12 + (w - 24) * t + 8, i % 2 ? 38 : 24); }
      c.lineTo(12, 20); c.closePath(); c.fill(); nosoft(c);
      c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.moveTo(2, 6); c.lineTo(w - 2, 6); c.lineTo(w - 12, 20); c.lineTo(12, 20); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(29,26,51,0.4)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(12, 20); c.lineTo(w - 12, 20); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(6, 4, w - 12, 2.5);
      c.lineWidth = 2.6; c.strokeStyle = INK; c.beginPath(); c.moveTo(2, 5); c.lineTo(w - 2, 5); c.stroke();
    }
  }));
}

function lamp(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_lamp`, mk(80, 200, (c) => {
    const g = c.createRadialGradient(40, 46, 3, 40, 46, 40); g.addColorStop(0, 'rgba(63,240,216,0.9)'); g.addColorStop(1, 'rgba(63,240,216,0)'); c.fillStyle = g; c.fillRect(0, 0, 80, 100);
    c.fillStyle = '#4a3f8a'; c.beginPath(); c.moveTo(26, 198); c.lineTo(32, 100); c.lineTo(48, 100); c.lineTo(54, 198); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#6a5ab8'; c.beginPath(); rr(c, 22, 92, 36, 12, 4); c.fill(); c.stroke();
    c.fillStyle = TEAL; for (let y = 116; y < 190; y += 18) c.fillRect(37, y, 6, 8);
    // floating crystal with rings
    c.strokeStyle = PINK; c.lineWidth = 2; c.beginPath(); c.ellipse(40, 46, 30, 8, -0.3, 0, Math.PI * 2); c.stroke();
    c.fillStyle = TEAL; c.beginPath(); c.moveTo(40, 14); c.lineTo(52, 46); c.lineTo(40, 78); c.lineTo(28, 46); c.closePath(); c.fill(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.beginPath(); c.moveTo(40, 14); c.lineTo(40, 78); c.lineTo(28, 46); c.closePath(); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(40, 46, 22, 5, 0.4, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
    arrow(c, 40, 94 - 6, 0.4, true, '#ffffff');
  }, 2), 2);
}

function props(scene: Phaser.Scene): string[] {
  const out: string[] = [];
  const add = (id: string, w: number, h: number, f: (c: CanvasRenderingContext2D) => void) => out.push(tex(scene, `${ID}_prop_${id}`, mk(w, h, f, 2), 2));
  add('crystals', 80, 90, (c) => {
    const g = c.createRadialGradient(40, 60, 2, 40, 60, 40); g.addColorStop(0, 'rgba(176,107,255,0.5)'); g.addColorStop(1, 'rgba(176,107,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 80, 90);
    for (const [x, h, a, col] of [[22, 44, -0.35, TEAL], [40, 74, 0, VIO], [58, 40, 0.4, PINK]] as [number, number, number, string][]) {
      c.save(); c.translate(x, 88); c.rotate(a);
      c.fillStyle = col; c.beginPath(); c.moveTo(-8, 0); c.lineTo(-8, -h + 12); c.lineTo(0, -h); c.lineTo(8, -h + 12); c.lineTo(8, 0); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.moveTo(-8, -h + 12); c.lineTo(0, -h); c.lineTo(0, 0); c.lineTo(-8, 0); c.closePath(); c.fill();
      c.restore();
    }
  });
  add('generator', 90, 110, (c) => {
    c.fillStyle = '#4a3f8a'; c.beginPath(); rr(c, 20, 84, 50, 24, 5); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = TEAL; c.fillRect(28, 94, 34, 4);
    c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.ellipse(45, 46, 38, 38, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = '#9a90d8'; c.lineWidth = 4; c.stroke();
    c.strokeStyle = PINK; c.lineWidth = 2; c.beginPath(); c.ellipse(45, 46, 26, 26, 0, 0, Math.PI * 2); c.stroke();
    const g = c.createRadialGradient(45, 46, 1, 45, 46, 22); g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(63,240,216,0)'); c.fillStyle = g; c.beginPath(); ell(c, 45, 46, 22, 22); c.fill();
    c.fillStyle = '#4a3f8a'; c.beginPath(); rr(c, 40, 82, 10, 6, 2); c.fill();
  });
  add('orb', 60, 100, (c) => {
    c.fillStyle = '#6a5ab8'; c.beginPath(); c.moveTo(14, 98); c.lineTo(20, 70); c.lineTo(40, 70); c.lineTo(46, 98); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(63,240,216,0.35)'; c.beginPath(); c.moveTo(22, 70); c.lineTo(38, 70); c.lineTo(34, 46); c.lineTo(26, 46); c.closePath(); c.fill();
    const g = c.createRadialGradient(26, 26, 2, 30, 30, 20); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, PINK); g.addColorStop(1, '#8a3ab8'); c.fillStyle = g; c.beginPath(); ell(c, 30, 30, 17, 17); c.fill(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = TEAL; c.lineWidth = 1.6; c.beginPath(); c.ellipse(30, 30, 26, 6, 0.3, 0, Math.PI * 2); c.stroke();
  });
  add('sign', 60, 110, (c) => {
    c.fillStyle = '#9a90d8'; c.beginPath(); rr(c, 26, 30, 8, 78, 2); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#2a2460'; c.beginPath(); rr(c, 6, 4, 48, 52, 8); c.fill(); c.stroke();
    arrow(c, 20, 22, 0.9, true, TEAL); arrow(c, 40, 38, 0.9, false, PINK);
  });
  add('plant', 60, 120, (c) => {
    // a pot on the ground and its plant floating upside down above it
    c.fillStyle = '#ff7a9a'; c.beginPath(); c.moveTo(14, 90); c.lineTo(46, 90); c.lineTo(42, 118); c.lineTo(18, 118); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#5a3a3a'; c.beginPath(); ell(c, 30, 90, 16, 4); c.fill(); c.stroke();
    c.save(); c.translate(30, 46); c.scale(1, -1);
    c.fillStyle = '#5a3a6a'; c.beginPath(); ell(c, 0, 26, 12, 6); c.fill(); c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#3f9a6a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 24); c.lineTo(0, -8); c.stroke();
    c.fillStyle = '#4fd8a8'; for (const [dx, dy, a] of [[-10, 8, -0.6], [10, 2, 0.6], [-8, -6, -0.4], [8, -12, 0.4]] as [number, number, number][]) { c.beginPath(); ell(c, dx, dy, 9, 4.5, a); c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); }
    c.fillStyle = PINK; c.beginPath(); ell(c, 0, -14, 7, 7); c.fill(); c.lineWidth = 2; c.stroke(); c.fillStyle = '#ffe9a0'; c.beginPath(); ell(c, 0, -14, 2.5, 2.5); c.fill();
    c.restore();
    c.strokeStyle = 'rgba(63,240,216,0.7)'; c.lineWidth = 1.5; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(30, 68); c.lineTo(30, 86); c.stroke(); c.setLineDash([]);
  });
  add('stones', 50, 110, (c) => {
    const stone = (x: number, y: number, rx: number, ry: number, col: string) => { c.fillStyle = col; c.beginPath(); ell(c, x, y, rx, ry); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); ell(c, x - rx * 0.3, y - ry * 0.35, rx * 0.35, ry * 0.2); c.fill(); };
    stone(25, 100, 20, 9, '#8a7ac8'); stone(25, 72, 15, 8, '#a99ae0'); stone(25, 46, 12, 7, '#7a6ab8'); stone(25, 22, 9, 6, '#c4b8f0');
    c.strokeStyle = TEAL; c.lineWidth = 1.5; c.setLineDash([2, 3]); for (const y of [88, 61, 36]) { c.beginPath(); c.moveTo(14, y); c.lineTo(36, y); c.stroke(); } c.setLineDash([]);
  });
  return out;
}

function ambient(scene: Phaser.Scene): Phaser.Types.GameObjects.Particles.ParticleEmitterConfig & { texture: string } {
  const k = tex(scene, `${ID}_mote`, mk(10, 10, (c) => { const g = c.createRadialGradient(5, 5, 0, 5, 5, 5); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 10, 10); }));
  return {
    texture: k, x: { min: 0, max: VIEW_W }, y: { min: 0, max: VIEW_H }, lifespan: 5000, frequency: 110, quantity: 1,
    speedX: { min: -6, max: 6 }, speedY: { min: -28, max: 28 }, scale: { min: 0.4, max: 1.1 }, alpha: { values: [0, 0.9, 0.6, 0] }, blendMode: 'ADD',
    tint: [0x3ff0d8, 0xff7ad9, 0xb06bff, 0xffffff],
  };
}

function overlay(scene: Phaser.Scene): string {
  return tex(scene, `${ID}_overlay`, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, 'rgba(40,20,90,0.22)'], [0.25, 'rgba(40,20,90,0)'], [0.75, 'rgba(20,80,90,0)'], [1, 'rgba(20,80,90,0.18)']]); c.fillRect(0, 0, VIEW_W, VIEW_H);
  }));
}

registerWorld({ id: ID, name: 'אנטי-כבידה', sky, far, mid, ground, platform, lamp, props, ambient, overlay });
