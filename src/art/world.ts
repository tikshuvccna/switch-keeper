/**
 * The world of Switchburg, a postal town cut out of paper: sky, far skyline, mid-ground street, ground, platforms and props.
 * Everything is drawn once with canvas paths and kept as textures. Layers scroll at different speeds (parallax).
 */
import * as Phaser from 'phaser';
import { INK, ell, rr, shade } from './puppet';

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface Theme {
  id: string;
  sky: [string, string, string];
  sun: string; haze: string;
  far: [string, string]; window: string;
  stone: [string, string, string]; wood: [string, string]; accent: string[];
  fog: string;
}
export const THEMES: Record<string, Theme> = {
  market: {
    id: 'market', sky: ['#3d2c74', '#d9667a', '#ffc98a'], sun: '#fff0cf', haze: '#ffb38a',
    far: ['#7a5fb0', '#54418f'], window: '#ffd66b',
    stone: ['#e9d3b0', '#c9a97d', '#8d6a52'], wood: ['#b9814f', '#8a5a34'], accent: ['#e4572e', '#1fa89a', '#f2b134', '#6b3fa0'],
    fog: '#7d5a9c',
  },
  borders: {
    id: 'borders', sky: ['#1c3b5a', '#3f8fa6', '#cfeedd'], sun: '#effff4', haze: '#a8dccf',
    far: ['#5a86ad', '#37608a'], window: '#ffe28a',
    stone: ['#d3e3d9', '#9db8ac', '#5a7474'], wood: ['#a9794a', '#7a5430'], accent: ['#2f6fd1', '#e4572e', '#f2b134', '#1fa89a'],
    fog: '#4f7fa8',
  },
  tower: {
    id: 'tower', sky: ['#120f26', '#3a2f66', '#8a7bd0'], sun: '#dcd8ff', haze: '#6f61b8',
    far: ['#4f4888', '#2f2966'], window: '#ffd23f',
    stone: ['#bdb7dc', '#847cb4', '#463f78'], wood: ['#8a6a5a', '#5e4638'], accent: ['#6b3fa0', '#2f6fd1', '#e4572e', '#ffd23f'],
    fog: '#3a2f66',
  },
};

const mk = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, res = 1): HTMLCanvasElement => {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(w * res); cv.height = Math.ceil(h * res);
  const c = cv.getContext('2d') as CanvasRenderingContext2D;
  c.scale(res, res); c.lineJoin = 'round'; c.lineCap = 'round';
  draw(c);
  return cv;
};
const RES_OF = new Map<string, number>();
/** Tell put() that a texture made elsewhere was drawn at this resolution multiple. */
export function registerRes(key: string, res: number): void { RES_OF.set(key, res); }
function tex(scene: Phaser.Scene, key: string, cv: HTMLCanvasElement, res = 1): string { if (!scene.textures.exists(key)) scene.textures.addCanvas(key, cv); RES_OF.set(key, res); return key; }
/** Add an image of a generated texture at its design size (textures drawn at 2x are shown at half). */
export function put(scene: Phaser.GameObjects.GameObject['scene'], x: number, y: number, key: string, ox = 0.5, oy = 0.5): Phaser.GameObjects.Image {
  return scene.add.image(x, y, key).setOrigin(ox, oy).setScale(1 / (RES_OF.get(key) ?? 1));
}
const lin = (c: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]) => { const g = c.createLinearGradient(0, y0, 0, y1); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
function soft(c: CanvasRenderingContext2D, blur = 8, oy = 4, a = 0.3): void { c.shadowColor = `rgba(24,10,56,${a})`; c.shadowBlur = blur; c.shadowOffsetY = oy; }
function nosoft(c: CanvasRenderingContext2D): void { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; }
/** Draw something at x and again one world-width to each side, so a layer wraps around without a seam. */
function wrap(w: number, x: number, ew: number, f: (x: number) => void): void { f(x); if (x + ew > w) f(x - w); if (x < 0) f(x + w); }

// ------------------------------------------------------------------ sky and layers
export const VIEW_W = 960, VIEW_H = 540, LAYER_W = 1920;

function sky(scene: Phaser.Scene, th: Theme): string {
  return tex(scene, 'sky_' + th.id, mk(VIEW_W, VIEW_H, (c) => {
    c.fillStyle = lin(c, 0, VIEW_H, [[0, th.sky[0]], [0.55, th.sky[1]], [1, th.sky[2]]]); c.fillRect(0, 0, VIEW_W, VIEW_H);
    const r = rng(7);
    c.fillStyle = 'rgba(255,255,255,0.8)';                                                      // a few paper stars
    for (let i = 0; i < 26; i++) { const x = r() * VIEW_W, y = r() * 190, s = 1 + r() * 1.8; c.beginPath(); ell(c, x, y, s, s); c.fill(); }
    const g = c.createRadialGradient(740, 330, 10, 740, 330, 260);                              // the low paper sun and its glow
    g.addColorStop(0, 'rgba(255,240,200,0.95)'); g.addColorStop(0.25, 'rgba(255,200,150,0.55)'); g.addColorStop(1, 'rgba(255,160,120,0)');
    c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
    c.fillStyle = th.sun; c.beginPath(); ell(c, 740, 330, 58, 58); c.fill();
    // paper clouds: flat, lighter, with a soft shadow
    for (const [x, y, s] of [[150, 110, 1], [470, 70, 0.8], [820, 130, 1.1], [330, 210, 0.7], [640, 190, 0.9]] as [number, number, number][]) {
      soft(c, 10, 5, 0.18);
      c.fillStyle = 'rgba(255,226,214,0.88)';
      c.beginPath(); rr(c, x - 70 * s, y, 140 * s, 22 * s, 11 * s); ell(c, x - 24 * s, y, 32 * s, 24 * s); ell(c, x + 20 * s, y - 6 * s, 38 * s, 28 * s); c.fill();
      nosoft(c);
    }
  }));
}

/** The far skyline: two rows of paper buildings with lit windows, chimneys, domes and two big loudspeaker towers. */
function far(scene: Phaser.Scene, th: Theme): string {
  return tex(scene, 'far_' + th.id, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(21), base = 410;
    const row = (col: string, minH: number, maxH: number, y0: number, lights: number) => {
      let x = -20;
      while (x < LAYER_W) {
        const w = 70 + r() * 90, h = minH + r() * (maxH - minH), kind = r();
        wrap(LAYER_W, x, w, (xx) => {
          c.fillStyle = col; c.beginPath();
          if (kind < 0.35) { rr(c, xx, y0 - h, w, h + 200, 3); c.moveTo(xx - 4, y0 - h); c.lineTo(xx + w / 2, y0 - h - 34 - r() * 20); c.lineTo(xx + w + 4, y0 - h); }
          else if (kind < 0.55) { rr(c, xx, y0 - h, w, h + 200, 3); ell(c, xx + w / 2, y0 - h, w * 0.42, w * 0.36); }
          else { rr(c, xx, y0 - h, w, h + 200, 3); if (r() < 0.6) rr(c, xx + w * 0.7, y0 - h - 36, 11, 40, 2); }
          c.fill();
          c.fillStyle = th.window;
          const n = Math.floor(lights * (w / 100));
          for (let i = 0; i < n; i++) { if (r() < 0.55) { c.globalAlpha = 0.5 + r() * 0.5; c.fillRect(xx + 8 + r() * (w - 22), y0 - h + 14 + r() * (h - 26), 6, 9); } }
          c.globalAlpha = 1;
        });
        x += w + 4 + r() * 14;
      }
    };
    row(th.far[0], 90, 220, base - 10, 3);
    row(th.far[1], 60, 170, base + 6, 4);
    // two loudspeaker towers: the area is the loud market
    for (const x of [520, 1440]) wrap(LAYER_W, x, 60, (xx) => {
      c.fillStyle = shade(th.far[1], -0.25); c.fillRect(xx - 5, base - 260, 10, 280);
      c.beginPath(); c.moveTo(xx + 5, base - 262); c.lineTo(xx + 62, base - 300); c.lineTo(xx + 62, base - 226); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(255,214,107,0.4)'; c.lineWidth = 3;
      for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(xx + 62, base - 263, 14 * k + 6, -0.7, 0.7); c.stroke(); }
    });
    // haze over the bottom
    c.fillStyle = lin(c, base - 60, VIEW_H, [[0, 'rgba(255,170,130,0)'], [0.45, 'rgba(255,170,130,0.55)'], [1, th.haze]]); c.fillRect(0, base - 60, LAYER_W, VIEW_H - base + 60);
  }));
}

/** The mid-ground street: stalls with striped awnings, hanging lanterns, string lights, crates and loudspeaker horns. */
function mid(scene: Phaser.Scene, th: Theme): string {
  const RES = 1.5;
  return tex(scene, 'mid_' + th.id, mk(LAYER_W, VIEW_H, (c) => {
    const r = rng(33), base = 482;
    // a low wall that runs behind everything
    c.fillStyle = shade('#6b3fa0', -0.3); c.fillRect(0, base - 52, LAYER_W, 80);
    c.fillStyle = shade('#6b3fa0', -0.1); for (let x = 0; x < LAYER_W; x += 30) { c.fillRect(x + 2, base - 50, 26, 6); }
    // stalls
    let x = 20;
    const acc = th.accent;
    while (x < LAYER_W - 140) {
      const w = 120 + r() * 70, h = 86 + r() * 36, col = acc[Math.floor(r() * 3)], kind = r();
      wrap(LAYER_W, x, w, (xx) => {
        soft(c, 10, 5, 0.35);
        // posts and back panel
        c.fillStyle = shade(th.wood[1], -0.2); c.fillRect(xx + 5, base - h, 7, h); c.fillRect(xx + w - 12, base - h, 7, h);
        c.fillStyle = shade(col, -0.45); c.fillRect(xx + 12, base - h + 18, w - 24, h - 18);
        nosoft(c);
        // counter with goods: parcels and envelopes
        c.fillStyle = th.wood[0]; c.fillRect(xx, base - 24, w, 24); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(xx, base - 24, w, 24);
        for (let i = 0; i < 4; i++) {
          const bx = xx + 10 + i * ((w - 30) / 4) + r() * 6, bw = 18 + r() * 12, bh = 14 + r() * 14;
          c.fillStyle = ['#e9d3b0', '#cfa66f', '#f6efe0', acc[3]][i % 4]; c.fillRect(bx, base - 24 - bh, bw, bh); c.lineWidth = 2; c.strokeRect(bx, base - 24 - bh, bw, bh);
          c.fillStyle = 'rgba(29,26,51,0.4)'; c.fillRect(bx + bw / 2 - 1, base - 24 - bh, 2, bh);
        }
        // the striped scalloped awning
        const ay = base - h - 4, n = Math.round(w / 18);
        for (let i = 0; i < n; i++) {
          c.fillStyle = i % 2 ? '#fff4dc' : col; c.beginPath(); c.moveTo(xx - 8 + i * ((w + 16) / n), ay); c.lineTo(xx - 8 + (i + 1) * ((w + 16) / n), ay); c.lineTo(xx - 8 + (i + 1) * ((w + 16) / n), ay + 20); c.arc(xx - 8 + (i + 0.5) * ((w + 16) / n), ay + 20, (w + 16) / n / 2, 0, Math.PI); c.closePath(); c.fill();
          c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
        }
        c.fillStyle = shade(col, -0.2); c.fillRect(xx - 8, ay - 6, w + 16, 8); c.strokeRect(xx - 8, ay - 6, w + 16, 8);
        if (kind < 0.5) {                      // a hanging lantern
          const lx = xx + w / 2, ly = ay + 34;
          c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, ay + 14); c.lineTo(lx, ly); c.stroke();
          const g = c.createRadialGradient(lx, ly + 8, 2, lx, ly + 8, 34); g.addColorStop(0, 'rgba(255,214,107,0.7)'); g.addColorStop(1, 'rgba(255,214,107,0)'); c.fillStyle = g; c.fillRect(lx - 34, ly - 26, 68, 68);
          c.fillStyle = '#ffd66b'; c.beginPath(); rr(c, lx - 7, ly, 14, 18, 5); c.fill(); c.stroke();
        }
      });
      x += w + 36 + r() * 120;
      if (r() < 0.45) {                         // a loudspeaker horn on a pole between the stalls
        const px = x - 18;
        wrap(LAYER_W, px, 70, (xx) => {
          c.fillStyle = shade('#6b3fa0', -0.1); c.fillRect(xx, base - 170, 8, 170); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(xx, base - 170, 8, 170);
          c.fillStyle = acc[0]; c.beginPath(); c.moveTo(xx + 8, base - 176); c.lineTo(xx + 58, base - 204); c.lineTo(xx + 58, base - 140); c.lineTo(xx + 8, base - 160); c.closePath(); c.fill(); c.stroke();
          c.fillStyle = '#fff4dc'; c.beginPath(); ell(c, xx + 58, base - 172, 7, 32); c.fill(); c.stroke();
          c.strokeStyle = 'rgba(255,244,220,0.7)'; c.lineWidth = 3; for (let k = 1; k <= 2; k++) { c.beginPath(); c.arc(xx + 62, base - 172, 20 * k + 6, -0.8, 0.8); c.stroke(); }
        });
        x += 60;
      }
    }
    // string lights across the street
    c.strokeStyle = 'rgba(29,26,51,0.8)'; c.lineWidth = 2;
    for (let sx = 0; sx < LAYER_W; sx += 320) {
      c.beginPath(); c.moveTo(sx, 118); c.quadraticCurveTo(sx + 160, 188, sx + 320, 118); c.stroke();
      for (let k = 1; k < 8; k++) {
        const t = k / 8, px = sx + 320 * t, py = (1 - t) * (1 - t) * 118 + 2 * t * (1 - t) * 188 + t * t * 118 + 6;
        const g = c.createRadialGradient(px, py + 5, 1, px, py + 5, 16); g.addColorStop(0, 'rgba(255,224,130,0.85)'); g.addColorStop(1, 'rgba(255,224,130,0)'); c.fillStyle = g; c.fillRect(px - 16, py - 12, 32, 32);
        c.fillStyle = ['#ffd66b', '#ff9d7a', '#9be7d6'][k % 3]; c.beginPath(); ell(c, px, py + 5, 4, 5.5); c.fill(); c.lineWidth = 1.5; c.stroke();
      }
    }
    // push the whole layer back with a cool dusk tint
    c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(70,38,110,0.34)'; c.fillRect(0, 0, LAYER_W, VIEW_H); c.globalCompositeOperation = 'source-over';
  }, RES), RES);
}

export class Backdrop {
  private layers: { img: Phaser.GameObjects.Image[]; f: number; w: number }[] = [];
  constructor(scene: Phaser.Scene, th: Theme) {
    const s = scene.add.image(0, 0, sky(scene, th)).setOrigin(0).setScrollFactor(0).setDepth(-30);
    s.setDisplaySize(VIEW_W, VIEW_H);
    const add = (key: string, f: number, depth: number, res = 1) => {
      const imgs = [0, 1].map(() => scene.add.image(0, 0, key).setOrigin(0).setScrollFactor(0).setDepth(depth).setScale(1 / res));
      this.layers.push({ img: imgs, f, w: LAYER_W });
    };
    add(far(scene, th), 0.12, -20);
    add(mid(scene, th), 0.45, -10, 1.5);
  }
  update(camX: number): void {
    for (const l of this.layers) {
      const off = -((camX * l.f) % l.w);
      l.img[0].x = Math.round(off); l.img[1].x = Math.round(off + l.w);
    }
  }
}

// ------------------------------------------------------------------ ground, platforms, props, pickups
/** A stretch of street: cobbles on top, a stone wall under it. */
export function groundTex(scene: Phaser.Scene, th: Theme, w: number, h = 120): string {
  const key = `ground_${th.id}_${w}`;
  if (scene.textures.exists(key)) return key;
  return tex(scene, key, mk(w, h, (c) => {
    const r = rng(w * 13 + 5);
    c.fillStyle = lin(c, 0, h, [[0, th.stone[1]], [0.25, shade(th.stone[2], -0.1)], [1, shade(th.stone[2], -0.7)]]); c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(29,26,51,0.35)'; c.lineWidth = 2;                                         // bricks of the wall
    for (let y = 30; y < h; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); const off = ((y / 22) | 0) % 2 ? 0 : 20; for (let x = off; x < w; x += 40) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 22); c.stroke(); } }
    for (let x = 30; x < w - 40; x += 150 + r() * 90) {                                              // arched niches
      c.fillStyle = 'rgba(29,10,56,0.45)'; c.beginPath(); c.moveTo(x, 90); c.lineTo(x, 66); c.arc(x + 16, 66, 16, Math.PI, 0); c.lineTo(x + 32, 90); c.closePath(); c.fill();
    }
    // the cobbled surface
    c.fillStyle = th.stone[0]; c.fillRect(0, 0, w, 22); c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 22); c.lineTo(w, 22); c.stroke();
    for (let x = 0; x < w; x += 30 + r() * 14) { c.beginPath(); rr(c, x + 2, 4, 24 + r() * 8, 14, 5); c.fillStyle = r() < 0.5 ? th.stone[0] : shade(th.stone[0], -0.08); c.fill(); c.lineWidth = 1.8; c.strokeStyle = 'rgba(29,26,51,0.55)'; c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(0, 0, w, 3);                                  // the lit top edge
    c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 1.5); c.lineTo(w, 1.5); c.stroke();
  }));
}

/** A one-way platform: a wooden shelf or a striped awning. */
export function platformTex(scene: Phaser.Scene, th: Theme, w: number, style: 'plank' | 'awning', seed: number): string {
  const key = `plat_${th.id}_${style}_${w}_${seed}`;
  if (scene.textures.exists(key)) return key;
  const H = style === 'plank' ? 40 : 34;
  return tex(scene, key, mk(w, H, (c) => {
    const col = th.accent[seed % th.accent.length];
    soft(c, 6, 4, 0.3);
    if (style === 'plank') {
      c.fillStyle = lin(c, 4, 22, [[0, th.wood[0]], [1, th.wood[1]]]); c.beginPath(); rr(c, 2, 4, w - 4, 18, 4); c.fill(); nosoft(c);
      c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      c.strokeStyle = 'rgba(29,26,51,0.3)'; c.lineWidth = 1.5; for (let x = 18; x < w - 8; x += 40) { c.beginPath(); c.moveTo(x, 8); c.lineTo(x - 3, 20); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(6, 6, w - 12, 3);
      for (const x of [w * 0.2, w * 0.8]) { c.beginPath(); c.moveTo(x - 8, 22); c.lineTo(x + 8, 22); c.lineTo(x, 36); c.closePath(); c.fillStyle = '#4a4a62'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }   // brackets
      for (const x of [10, w - 10]) { c.beginPath(); ell(c, x, 13, 2.4, 2.4); c.fillStyle = '#d9d2c0'; c.fill(); c.lineWidth = 1.4; c.stroke(); }
    } else {
      const n = Math.max(3, Math.round(w / 22)), cw = (w - 4) / n;
      c.fillStyle = shade(col, -0.25); c.beginPath(); rr(c, 2, 4, w - 4, 8, 3); c.fill(); nosoft(c);
      for (let i = 0; i < n; i++) {
        c.fillStyle = i % 2 ? '#fff4dc' : col; c.beginPath(); c.moveTo(2 + i * cw, 5); c.lineTo(2 + (i + 1) * cw, 5); c.lineTo(2 + (i + 1) * cw, 18); c.arc(2 + (i + 0.5) * cw, 18, cw / 2, 0, Math.PI); c.closePath(); c.fill();
        c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke();
      }
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(4, 5, w - 8, 3);
      c.lineWidth = 3; c.strokeStyle = INK; c.strokeRect(2, 4, w - 4, 8);
    }
  }));
}

export function propTex(scene: Phaser.Scene, th: Theme, id: 'lamp' | 'crates' | 'barrel' | 'sign' | 'flag' | 'bunting'): string {
  const key = `prop_${th.id}_${id}`;
  if (scene.textures.exists(key)) return key;
  const acc = th.accent;
  const draw: Record<string, [number, number, (c: CanvasRenderingContext2D) => void]> = {
    lamp: [70, 200, (c) => {
      const g = c.createRadialGradient(35, 34, 4, 35, 34, 34); g.addColorStop(0, 'rgba(255,224,130,0.85)'); g.addColorStop(1, 'rgba(255,224,130,0)'); c.fillStyle = g; c.fillRect(0, 0, 70, 70);
      c.fillStyle = '#3a3558'; c.beginPath(); rr(c, 31, 40, 8, 158, 3); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#3a3558'; c.beginPath(); rr(c, 22, 186, 26, 12, 4); c.fill(); c.stroke();
      c.fillStyle = '#ffe9a0'; c.beginPath(); rr(c, 24, 20, 22, 28, 7); c.fill(); c.stroke();
      c.fillStyle = '#3a3558'; c.beginPath(); c.moveTo(20, 22); c.lineTo(35, 8); c.lineTo(50, 22); c.closePath(); c.fill(); c.stroke();
    }],
    crates: [110, 96, (c) => {
      const box = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.beginPath(); rr(c, x, y, w, h, 3); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); c.fillStyle = 'rgba(29,26,51,0.3)'; c.fillRect(x + w / 2 - 3, y + 2, 6, h - 4); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(x + 4, y + 3, w - 8, 3); };
      box(6, 52, 52, 40, '#cfa66f'); box(62, 60, 42, 32, '#e4c795'); box(20, 12, 44, 38, '#b9814f');
      c.fillStyle = '#fff4dc'; c.beginPath(); rr(c, 26, 22, 18, 14, 2); c.fill(); c.lineWidth = 2; c.stroke();
    }],
    barrel: [50, 64, (c) => {
      c.fillStyle = lin(c, 4, 60, [[0, '#c98f55'], [1, '#8a5a34']]); c.beginPath(); c.moveTo(8, 6); c.bezierCurveTo(-2, 22, -2, 44, 8, 60); c.lineTo(42, 60); c.bezierCurveTo(52, 44, 52, 22, 42, 6); c.closePath(); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
      c.fillStyle = '#4a4a62'; c.fillRect(3, 16, 44, 6); c.fillRect(3, 42, 44, 6); c.lineWidth = 2; c.strokeRect(3, 16, 44, 6); c.strokeRect(3, 42, 44, 6);
    }],
    sign: [70, 110, (c) => {
      c.fillStyle = '#6b4a2f'; c.fillRect(32, 28, 7, 80); c.lineWidth = 3; c.strokeStyle = INK; c.strokeRect(32, 28, 7, 80);
      c.fillStyle = '#fff4dc'; c.beginPath(); rr(c, 4, 6, 62, 40, 6); c.fill(); c.stroke();
      c.fillStyle = acc[0]; c.beginPath(); c.moveTo(14, 16); c.lineTo(48, 16); c.lineTo(48, 12); c.lineTo(58, 22); c.lineTo(48, 32); c.lineTo(48, 28); c.lineTo(14, 28); c.closePath(); c.fill(); c.lineWidth = 2; c.stroke();
    }],
    flag: [40, 110, (c) => {
      c.fillStyle = '#3a3558'; c.fillRect(8, 4, 5, 104); c.lineWidth = 2.5; c.strokeStyle = INK; c.strokeRect(8, 4, 5, 104);
      c.fillStyle = acc[1]; c.beginPath(); c.moveTo(13, 8); c.lineTo(36, 18); c.lineTo(13, 34); c.closePath(); c.fill(); c.stroke();
    }],
    bunting: [200, 40, (c) => {
      c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(100, 30, 200, 6); c.stroke();
      for (let i = 1; i < 8; i++) { const t = i / 8, x = 200 * t, y = (1 - t) * (1 - t) * 6 + 2 * t * (1 - t) * 30 + t * t * 6; c.fillStyle = acc[i % acc.length]; c.beginPath(); c.moveTo(x - 10, y); c.lineTo(x + 10, y); c.lineTo(x, y + 20); c.closePath(); c.fill(); c.lineWidth = 2; c.stroke(); }
    }],
  };
  const [w, h, f] = draw[id];
  return tex(scene, key, mk(w, h, f, 2), 2);
}

export function pickupTex(scene: Phaser.Scene): void {
  tex(scene, 'bit', mk(24, 24, (c) => {                                                      // a stamp-coin
    c.fillStyle = lin(c, 2, 22, [[0, '#ffe58a'], [1, '#f2a516']]); c.beginPath(); ell(c, 12, 12, 9.5, 9.5); c.fill(); c.lineWidth = 2.6; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = 'rgba(122,82,0,0.7)'; c.lineWidth = 1.6; c.beginPath(); ell(c, 12, 12, 6, 6); c.stroke();
    c.fillStyle = '#8a5200'; c.fillRect(8.5, 9, 7, 1.8); c.fillRect(8.5, 13, 7, 1.8);
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); ell(c, 8.5, 7.5, 2, 1.2, -0.6); c.fill();
  }, 2), 2);
  tex(scene, 'card', mk(34, 44, (c) => {                                                      // a knowledge card: a sealed envelope
    soft(c, 5, 3, 0.35);
    c.fillStyle = lin(c, 2, 42, [[0, '#8f80ff'], [1, '#5b49d6']]); c.beginPath(); rr(c, 3, 3, 28, 36, 5); c.fill(); nosoft(c);
    c.lineWidth = 2.8; c.strokeStyle = INK; c.stroke();
    c.strokeStyle = '#ffd23f'; c.lineWidth = 2; c.beginPath(); rr(c, 7, 7, 20, 28, 3); c.stroke();
    c.fillStyle = '#fff4dc'; c.beginPath(); ell(c, 17, 18, 5.5, 5.5); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#e4572e'; c.beginPath(); ell(c, 17, 18, 2.4, 2.4); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.fillRect(11, 28, 12, 2); c.fillRect(11, 31, 8, 2);
  }, 2), 2);
  tex(scene, 'heart', mk(22, 20, (c) => {
    c.fillStyle = '#ff6b6b'; c.beginPath(); c.moveTo(11, 18); c.bezierCurveTo(-4, 8, 2, -2, 11, 5); c.bezierCurveTo(20, -2, 26, 8, 11, 18); c.fill(); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); ell(c, 7, 6, 2, 1.4, -0.6); c.fill();
  }, 2), 2);
  tex(scene, 'flagpost', mk(34, 84, (c) => {                                                  // a checkpoint flag
    c.fillStyle = '#3a3558'; c.fillRect(6, 4, 5, 76); c.lineWidth = 2.6; c.strokeStyle = INK; c.strokeRect(6, 4, 5, 76);
    c.fillStyle = '#4fd1c5'; c.beginPath(); c.moveTo(11, 8); c.lineTo(32, 18); c.lineTo(11, 30); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#f2b134'; c.beginPath(); ell(c, 8.5, 5, 4.5, 4.5); c.fill(); c.stroke();
  }, 2), 2);
  tex(scene, 'portal', mk(120, 190, (c) => {                                                  // the lesson gate: an arched door with a book seal
    soft(c, 10, 6, 0.35);
    c.fillStyle = lin(c, 0, 190, [[0, '#8f80ff'], [1, '#3f2f93']]); c.beginPath(); c.moveTo(8, 186); c.lineTo(8, 70); c.arc(60, 70, 52, Math.PI, 0); c.lineTo(112, 186); c.closePath(); c.fill(); nosoft(c);
    c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    c.fillStyle = lin(c, 40, 186, [[0, '#2a1f66'], [1, '#150f3a']]); c.beginPath(); c.moveTo(22, 186); c.lineTo(22, 72); c.arc(60, 72, 38, Math.PI, 0); c.lineTo(98, 186); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#ffd23f'; c.lineWidth = 3; c.beginPath(); c.moveTo(60, 34); c.lineTo(60, 186); c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); rr(c, 38, 96, 44, 36, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();      // the padlock body
    c.lineWidth = 6; c.strokeStyle = '#ffd23f'; c.beginPath(); c.arc(60, 96, 14, Math.PI, 0); c.stroke(); c.lineWidth = 2; c.strokeStyle = INK; c.beginPath(); c.arc(60, 96, 17, Math.PI, 0); c.stroke();
    c.fillStyle = INK; c.beginPath(); ell(c, 60, 112, 4.5, 4.5); c.fill(); c.fillRect(58, 112, 4, 12);
  }, 2), 2);
  tex(scene, 'spark', mk(8, 8, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 8, 8); }));
  tex(scene, 'shadow', mk(64, 18, (c) => { const g = c.createRadialGradient(32, 9, 2, 32, 9, 30); g.addColorStop(0, 'rgba(24,10,56,0.5)'); g.addColorStop(1, 'rgba(24,10,56,0)'); c.fillStyle = g; c.save(); c.scale(1, 0.3); c.fillRect(0, 0, 64, 60); c.restore(); }));
  tex(scene, 'scrap', mk(10, 8, (c) => { c.fillStyle = '#fff4dc'; c.beginPath(); c.moveTo(0, 2); c.lineTo(8, 0); c.lineTo(10, 6); c.lineTo(2, 8); c.closePath(); c.fill(); }));
  tex(scene, 'ring', mk(128, 128, (c) => { c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); ell(c, 64, 64, 56, 56); c.stroke(); }));
  tex(scene, 'star', mk(28, 28, (c) => { c.fillStyle = '#fff'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r2 = k % 2 ? 5 : 13; c.lineTo(14 + Math.cos(a) * r2, 14 + Math.sin(a) * r2); } c.closePath(); c.fill(); }));
  tex(scene, 'vignette', mk(VIEW_W, VIEW_H, (c) => { const g = c.createRadialGradient(VIEW_W / 2, VIEW_H / 2, 250, VIEW_W / 2, VIEW_H / 2, 620); g.addColorStop(0, 'rgba(20,8,48,0)'); g.addColorStop(1, 'rgba(20,8,48,0.5)'); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H); }));
}
