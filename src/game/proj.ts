/**
 * Projectiles: the hero's shots and the packets, rings and bolts that enemies fire. Pink ones can be parried (jump into them and
 * press jump again): the parry destroys them, bounces the hero and fills the super meter.
 */
import * as Phaser from 'phaser';
import { eye, INK, paper, rr, ell } from '../art/puppet';
import { put, registerRes } from '../art/world';

export type ShotKind = 'packet' | 'pink' | 'arc' | 'ring' | 'bolt' | 'plane' | 'tag' | 'wave' | 'drop';
export interface ProjDef {
  tex: string; vx: number; vy: number; grav?: number; life: number; w: number; h: number; dmg: number;
  owner: 'hero' | 'enemy'; parry?: boolean; pierce?: number; spin?: number; homing?: number; boom?: number; scale?: number; tint?: number; floor?: boolean; alpha?: number;
}
export class Proj {
  img: Phaser.GameObjects.Image;
  t = 0; alive = true; hits = new Set<unknown>(); x: number; y: number; vx: number; vy: number;
  constructor(scene: Phaser.Scene, readonly def: ProjDef, x: number, y: number) {
    this.x = x; this.y = y; this.vx = def.vx; this.vy = def.vy;
    this.img = put(scene, x, y, def.tex).setDepth(13);
    if (def.scale) this.img.setScale(this.img.scaleX * def.scale);
    if (def.tint) this.img.setTint(def.tint);
    if (def.alpha !== undefined) this.img.setAlpha(def.alpha);
    if (def.vx < 0 && !def.spin) this.img.setFlipX(true);
  }
  rect(): Phaser.Geom.Rectangle { return new Phaser.Geom.Rectangle(this.x - this.def.w / 2, this.y - this.def.h / 2, this.def.w, this.def.h); }
  step(dt: number, tx: number, ty: number): void {
    const d = this.def;
    this.t += dt;
    if (d.homing) { const a = Math.atan2(ty - this.y, tx - this.x), cur = Math.atan2(this.vy, this.vx), sp = Math.hypot(this.vx, this.vy); let da = a - cur; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI; const n = cur + Phaser.Math.Clamp(da, -d.homing * dt, d.homing * dt); this.vx = Math.cos(n) * sp; this.vy = Math.sin(n) * sp; }
    if (d.boom && this.t > d.boom) this.vx -= Math.sign(this.vx || d.vx) * 1100 * dt;       // a boomerang: it slows, turns and comes back
    if (d.grav) this.vy += d.grav * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.img.setPosition(this.x, this.y);
    if (d.spin) this.img.rotation += d.spin * dt; else if (d.grav || d.homing) this.img.rotation = Math.atan2(this.vy, this.vx) * (this.vx < 0 ? -1 : 1) * 0.6;
    if (this.t > d.life) this.alive = false;
  }
  destroy(): void { this.alive = false; this.img.destroy(); }
}

const PINK = '#ff7ac8';
let made = false;
export function makeProjTextures(scene: Phaser.Scene): void {
  if (made && scene.textures.exists('shot_stamp')) return;
  made = true;
  const mk = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
    if (scene.textures.exists(key)) return;
    const cv = document.createElement('canvas'); cv.width = w * 2; cv.height = h * 2;
    const c = cv.getContext('2d') as CanvasRenderingContext2D; c.scale(2, 2); c.lineJoin = 'round'; c.lineCap = 'round';
    draw(c); scene.textures.addCanvas(key, cv); (scene.textures.get(key) as Phaser.Textures.Texture).setFilter(Phaser.Textures.FilterMode.LINEAR);
    registerRes(key, 2);
  };
  mk('shot_stamp', 30, 22, (c) => { paper(c, () => rr(c, 5, 8, 22, 11, 3), '#2a2a3a', { lw: 2, y0: 8, y1: 19 }); paper(c, () => rr(c, 2, 3, 26, 9, 3), '#e4572e', { lw: 2.4, y0: 3, y1: 12 }); c.strokeStyle = '#fff4dc'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(7, 7.5); c.lineTo(23, 7.5); c.stroke(); });
  mk('shot_twine', 28, 28, (c) => { c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); ell(c, 14, 14, 8, 8); c.stroke(); c.strokeStyle = '#e6c98e'; c.lineWidth = 4; c.beginPath(); ell(c, 14, 14, 8, 8); c.stroke(); c.strokeStyle = '#a8864a'; c.lineWidth = 1.2; c.setLineDash([2, 3]); c.beginPath(); ell(c, 14, 14, 8, 8); c.stroke(); });
  mk('shot_light', 34, 34, (c) => { const g = c.createRadialGradient(17, 17, 1, 17, 17, 16); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#fff2a0'); g.addColorStop(0.7, 'rgba(255,210,63,0.6)'); g.addColorStop(1, 'rgba(255,210,63,0)'); c.fillStyle = g; c.fillRect(0, 0, 34, 34); });
  const envelope = (col: string, seal: string) => (c: CanvasRenderingContext2D) => { paper(c, () => rr(c, 3, 4, 26, 18, 3), col, { lw: 2.4, y0: 4, y1: 22 }); c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(4, 5); c.lineTo(16, 14); c.lineTo(28, 5); c.stroke(); c.fillStyle = seal; c.beginPath(); ell(c, 16, 14, 3, 3); c.fill(); };
  mk('packet', 32, 26, envelope('#fff4dc', '#e4572e'));
  mk('packet_pink', 32, 26, envelope(PINK, '#fff4dc'));
  mk('pk_bolt', 22, 46, (c) => { c.fillStyle = '#ffe45c'; c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(13, 2); c.lineTo(4, 26); c.lineTo(11, 26); c.lineTo(7, 44); c.lineTo(19, 18); c.lineTo(12, 18); c.lineTo(17, 2); c.closePath(); c.fill(); c.stroke(); });
  mk('pk_plane', 34, 22, (c) => { c.fillStyle = PINK; c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(2, 11); c.lineTo(32, 2); c.lineTo(20, 20); c.lineTo(15, 13); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(32, 2); c.lineTo(15, 13); c.stroke(); });
  mk('pk_tag', 26, 18, (c) => { paper(c, () => { c.moveTo(3, 3); c.lineTo(19, 3); c.lineTo(24, 9); c.lineTo(19, 15); c.lineTo(3, 15); c.closePath(); }, '#e9d3b0', { lw: 2.2, y0: 3, y1: 15 }); c.fillStyle = INK; c.beginPath(); ell(c, 8, 9, 2, 2); c.fill(); });
  mk('pk_drop', 20, 26, (c) => { c.fillStyle = '#7fd4ff'; c.strokeStyle = INK; c.lineWidth = 2.2; c.beginPath(); c.moveTo(10, 2); c.bezierCurveTo(18, 12, 18, 22, 10, 24); c.bezierCurveTo(2, 22, 2, 12, 10, 2); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); ell(c, 7, 14, 1.8, 3.5); c.fill(); });
  mk('pk_ring', 56, 56, (c) => { c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); ell(c, 28, 28, 18, 18); c.stroke(); c.strokeStyle = PINK; c.lineWidth = 5; c.beginPath(); ell(c, 28, 28, 18, 18); c.stroke(); });
  mk('pk_wave', 56, 30, (c) => { c.fillStyle = '#ffd23f'; c.strokeStyle = INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(3, 28); c.quadraticCurveTo(10, 2, 30, 4); c.quadraticCurveTo(48, 6, 53, 28); c.lineTo(46, 28); c.quadraticCurveTo(42, 14, 30, 13); c.quadraticCurveTo(16, 14, 10, 28); c.closePath(); c.fill(); c.stroke(); });
  mk('pk_meteor', 40, 40, (c) => { c.fillStyle = 'rgba(255,170,60,0.55)'; c.beginPath(); c.moveTo(20, 20); c.lineTo(38, 2); c.lineTo(30, 24); c.closePath(); c.fill(); paper(c, () => ell(c, 18, 22, 13, 12), '#8b7a9a', { lw: 3, y0: 10, y1: 34 }); c.fillStyle = 'rgba(29,26,51,0.35)'; c.beginPath(); ell(c, 14, 24, 3.5, 3); c.fill(); c.beginPath(); ell(c, 22, 18, 2.5, 2); c.fill(); });
  mk('pk_rock', 40, 40, (c) => { paper(c, () => { c.moveTo(6, 30); c.lineTo(10, 12); c.lineTo(22, 5); c.lineTo(34, 14); c.lineTo(33, 31); c.lineTo(20, 36); c.closePath(); }, '#8a7d6a', { lw: 3, y0: 5, y1: 36 }); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(14, 12, 8, 3); });
  mk('pk_codebolt', 16, 46, (c) => { const g = c.createLinearGradient(0, 0, 0, 46); g.addColorStop(0, 'rgba(60,255,140,0)'); g.addColorStop(1, '#7dffb0'); c.fillStyle = g; c.fillRect(5, 0, 6, 40); c.fillStyle = '#eafff2'; c.fillRect(4, 36, 8, 8); c.strokeStyle = INK; c.lineWidth = 1.6; c.strokeRect(4, 36, 8, 8); });
  mk('orb', 38, 38, (c) => { const g = c.createRadialGradient(19, 19, 2, 19, 19, 18); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.5, 'rgba(255,122,200,0.7)'); g.addColorStop(1, 'rgba(255,122,200,0)'); c.fillStyle = g; c.fillRect(0, 0, 38, 38); c.fillStyle = PINK; c.strokeStyle = INK; c.lineWidth = 2.6; c.beginPath(); ell(c, 19, 19, 9, 9); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); ell(c, 16, 16, 2.6, 2); c.fill(); });
  void eye;
}

/** What each enemy shot kind is: a speed, a size and who it hurts. dir is -1 or 1. */
export function enemyShot(kind: ShotKind, dir: number, from: { x: number; y: number }, target: { x: number; y: number }): ProjDef {
  switch (kind) {
    case 'pink': return { tex: 'packet_pink', vx: dir * 250, vy: 0, life: 3, w: 26, h: 18, dmg: 1, owner: 'enemy', parry: true };
    case 'arc': { const dx = target.x - from.x, t = 0.9; return { tex: 'pk_drop', vx: Phaser.Math.Clamp(dx / t, -300, 300), vy: -430, grav: 900, life: 2.2, w: 16, h: 20, dmg: 1, owner: 'enemy', floor: true }; }
    case 'ring': return { tex: 'pk_ring', vx: dir * 230, vy: 0, life: 3.2, w: 36, h: 36, dmg: 1, owner: 'enemy', parry: true, spin: 0 };
    case 'bolt': return { tex: 'pk_bolt', vx: 0, vy: 560, life: 1.6, w: 18, h: 44, dmg: 1, owner: 'enemy' };
    case 'plane': return { tex: 'pk_plane', vx: dir * 150, vy: -40, life: 4.2, w: 26, h: 16, dmg: 1, owner: 'enemy', parry: true, homing: 1.1 };
    case 'tag': return { tex: 'pk_tag', vx: dir * 330, vy: 0, life: 1.8, w: 22, h: 14, dmg: 1, owner: 'enemy', boom: 0.55, spin: 8 };
    case 'wave': return { tex: 'pk_wave', vx: dir * 290, vy: 0, life: 1.8, w: 46, h: 26, dmg: 1, owner: 'enemy', floor: true };
    case 'drop': return { tex: 'pk_drop', vx: 0, vy: 300, life: 2.4, w: 16, h: 20, dmg: 1, owner: 'enemy' };
    default: return { tex: 'packet', vx: dir * 260, vy: 0, life: 3, w: 26, h: 18, dmg: 1, owner: 'enemy' };
  }
}
