/**
 * Obstacles and gadgets of a stage: spikes, moving and crumbling platforms, springs, conveyor belts, fans that lift you,
 * floor beams that pulse, wall cannons that fire packets, and swinging weights. Each stage gets a different mix.
 */
import * as Phaser from 'phaser';
import { INK, ell, paper, rr, shade } from '../art/puppet';
import { platformTex, put, registerRes, type Theme } from '../art/world';
import type { Fx } from './fx';
import type { Hero } from './hero';
import { enemyShot, Proj, type ProjDef } from './proj';
import { GROUND_Y } from './levels';
import { sfx } from '../sfx';

export type ObsKind = 'spikes' | 'mover' | 'crumble' | 'spring' | 'belt' | 'fan' | 'beam' | 'cannon' | 'swinger';
export interface Obs {
  kind: ObsKind; x: number; y: number; w?: number;
  /** mover: how far it travels (dx, dy) and how fast; belt: dir; cannon: dir and shot kind; swinger: length. */
  dx?: number; dy?: number; speed?: number; dir?: 1 | -1; len?: number; pink?: boolean; phase?: number;
}

function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): string {
  if (scene.textures.exists(key)) return key;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * 2); cv.height = Math.ceil(h * 2);
  const c = cv.getContext('2d') as CanvasRenderingContext2D; c.scale(2, 2); c.lineJoin = 'round'; c.lineCap = 'round';
  draw(c); scene.textures.addCanvas(key, cv); registerRes(key, 2);
  return key;
}

export interface ObsHooks {
  fx: Fx;
  hurt(fromX: number, dmg: number): void;
  spawnProj(p: Proj): void;
  platforms: Phaser.Physics.Arcade.StaticGroup;
}

interface Live {
  o: Obs; t: number; img?: Phaser.GameObjects.Image; body?: Phaser.Physics.Arcade.Image; extra?: Phaser.GameObjects.GameObject[];
  state?: number; timer?: number; stat?: Phaser.Physics.Arcade.Sprite; x0?: number; y0?: number; fireT?: number;
}

export class Obstacles {
  private list: Live[] = [];
  constructor(private scene: Phaser.Scene, private th: Theme, private hero: Hero, private hk: ObsHooks, defs: Obs[]) {
    for (const o of defs) this.make(o);
  }

  private make(o: Obs): void {
    const s = this.scene, L: Live = { o, t: (o.phase ?? 0), x0: o.x, y0: o.y };
    switch (o.kind) {
      case 'spikes': {
        const w = o.w ?? 120, n = Math.max(2, Math.round(w / 22));
        L.img = put(s, o.x, o.y, tex(s, 'spikes_' + n, n * 22, 24, (c) => {
          for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#b9bfd3' : '#d4d9ea'; c.beginPath(); c.moveTo(i * 22 + 1, 22); c.lineTo(i * 22 + 11, 2); c.lineTo(i * 22 + 21, 22); c.closePath(); c.fill(); c.lineWidth = 2.4; c.strokeStyle = INK; c.stroke(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.moveTo(i * 22 + 11, 5); c.lineTo(i * 22 + 7, 18); c.lineTo(i * 22 + 11, 18); c.closePath(); c.fill(); }
          c.fillStyle = '#3a3558'; c.fillRect(0, 21, n * 22, 3);
        }), 0.5, 1).setDepth(4);
        L.img.x = o.x + (o.w ?? 120) / 2; o.w = n * 22; L.img.x = o.x + o.w / 2;
        break;
      }
      case 'mover': {
        const w = o.w ?? 110, key = platformTex(s, this.th, w, 'plank', 7);
        L.img = put(s, o.x, o.y, key, 0, 0).setDepth(2);
        const ax0 = (o.dx ?? 120) / 2, ay0 = (o.dy ?? 0) / 2;
        const b = s.physics.add.image(o.x + ax0, o.y + ay0, 'spark').setVisible(false).setOrigin(0, 0).setDisplaySize(w, 14);
        const body = b.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true).setAllowGravity(false);
        body.checkCollision.down = false; body.checkCollision.left = false; body.checkCollision.right = false;
        body.friction.x = 1;
        L.body = b;
        s.physics.add.collider(this.hero.sprite, b, undefined, () => !this.hero.dropping);
        break;
      }
      case 'crumble': {
        const w = o.w ?? 100;
        L.img = put(s, o.x, o.y - 4, platformTex(s, this.th, w, 'awning', 3), 0, 0).setDepth(2).setTint(0xd8c4a8);
        const p = this.hk.platforms.create(o.x, o.y, 'spark') as Phaser.Physics.Arcade.Sprite;
        p.setOrigin(0, 0).setDisplaySize(w, 14).setVisible(false).refreshBody().setData('oneway', true);
        const b = p.body as Phaser.Physics.Arcade.StaticBody; b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false;
        L.stat = p; L.state = 0; L.timer = 0;
        break;
      }
      case 'spring': {
        L.img = put(s, o.x, o.y, tex(s, 'spring', 44, 30, (c) => {
          c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(10, 24 - i * 5); c.lineTo(34, 21 - i * 5); } c.stroke();
          c.strokeStyle = '#c8c3d6'; c.lineWidth = 3; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(10, 24 - i * 5); c.lineTo(34, 21 - i * 5); } c.stroke();
          paper(c, () => rr(c, 3, 2, 38, 8, 4), '#e4572e', { lw: 2.6, y0: 2, y1: 10 }); paper(c, () => rr(c, 5, 25, 34, 5, 2), '#4a4a62', { lw: 2.2, y0: 25, y1: 30 });
        }), 0.5, 1).setDepth(4);
        break;
      }
      case 'belt': {
        const w = o.w ?? 200;
        const t = s.add.tileSprite(o.x, o.y - 12, w, 16, tex(s, 'belt' + ((o.dir ?? 1) > 0 ? 'R' : 'L'), 32, 16, (c) => {
          c.fillStyle = '#3a3558'; c.fillRect(0, 0, 32, 16); c.fillStyle = '#e4a02e'; c.beginPath(); if ((o.dir ?? 1) > 0) { c.moveTo(6, 4); c.lineTo(20, 8); c.lineTo(6, 12); } else { c.moveTo(26, 4); c.lineTo(12, 8); c.lineTo(26, 12); } c.closePath(); c.fill();
          c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(0, 0, 32, 16);
        })).setOrigin(0, 0).setDepth(3).setScale(0.5, 0.5);
        t.setSize(w * 2, 32); t.x = o.x; t.setDisplaySize(w, 16);
        L.extra = [t];
        break;
      }
      case 'fan': {
        const base = put(s, o.x, o.y, tex(s, 'fanbase', 56, 30, (c) => {
          paper(c, () => rr(c, 4, 10, 48, 18, 5), '#6b3fa0', { lw: 2.8, y0: 10, y1: 28 }); c.fillStyle = '#17132a'; c.beginPath(); ell(c, 28, 14, 18, 4); c.fill();
        }), 0.5, 1).setDepth(4);
        const blades = put(s, o.x, o.y - 16, tex(s, 'fanblades', 54, 12, (c) => { c.fillStyle = '#fff4dc'; c.strokeStyle = INK; c.lineWidth = 2.2; for (const [a, b] of [[4, 24], [30, 50]]) { c.beginPath(); c.moveTo(a, 6); c.quadraticCurveTo((a + b) / 2, 0, b, 5); c.quadraticCurveTo((a + b) / 2, 11, a, 6); c.fill(); c.stroke(); } }), 0.5, 0.5).setDepth(4);
        L.img = blades; L.extra = [base];
        const streak = s.add.particles(0, 0, 'spark', { x: { min: o.x - (o.w ?? 70) / 2, max: o.x + (o.w ?? 70) / 2 }, y: o.y - 30, speedY: { min: -380, max: -240 }, lifespan: 620, scale: { start: 0.35, end: 0.1 }, alpha: { start: 0.6, end: 0 }, frequency: 55, tint: 0xdff6ff }).setDepth(3);
        L.extra.push(streak);
        break;
      }
      case 'beam': {
        const w = o.w ?? 220;
        const post = tex(s, 'beampost', 24, 40, (c) => { paper(c, () => rr(c, 5, 4, 14, 34, 4), '#4a4a62', { lw: 2.6, y0: 4, y1: 38 }); c.fillStyle = '#ff7ac8'; c.beginPath(); ell(c, 12, 12, 4, 4); c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); });
        const a = put(s, o.x, o.y, post, 0.5, 1).setDepth(4), b = put(s, o.x + w, o.y, post, 0.5, 1).setDepth(4).setFlipX(true);
        const beam = s.add.rectangle(o.x + w / 2, o.y - 22, w - 16, 8, 0xff3d7f, 0.9).setDepth(4).setAlpha(0.1);
        L.extra = [a, b, beam]; L.state = 0;
        break;
      }
      case 'cannon': {
        L.img = put(s, o.x, o.y, tex(s, 'cannon', 64, 52, (c) => {
          paper(c, () => rr(c, 10, 24, 44, 26, 6), '#6b3fa0', { lw: 2.8, y0: 24, y1: 50 });
          paper(c, () => rr(c, 34, 12, 28, 18, 4), '#4a4a62', { lw: 2.8, y0: 12, y1: 30 }); c.fillStyle = '#17132a'; c.beginPath(); ell(c, 60, 21, 3, 7); c.fill();
          c.fillStyle = '#ffd23f'; c.beginPath(); ell(c, 24, 36, 5, 5); c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke();
        }), 0.5, 1).setDepth(4).setFlipX((o.dir ?? 1) < 0);
        L.fireT = 1 + (o.phase ?? 0);
        break;
      }
      case 'swinger': {
        const len = o.len ?? 190;
        const rope = s.add.rectangle(o.x, o.y, 4, len, 0x3a3558).setOrigin(0.5, 0).setDepth(4);
        const wt = put(s, o.x, o.y + len, tex(s, 'weight', 60, 60, (c) => { paper(c, () => ell(c, 30, 30, 24, 24), '#8a6a5a', { lw: 3, y0: 6, y1: 54 }); c.fillStyle = '#ffd23f'; c.beginPath(); ell(c, 30, 30, 9, 9); c.fill(); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); c.fillStyle = INK; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText('!', 30, 35); }), 0.5, 0.5).setDepth(5);
        L.img = wt; L.extra = [rope];
        break;
      }
    }
    this.list.push(L);
  }

  update(dt: number): void {
    const h = this.hero;
    const hr = new Phaser.Geom.Rectangle(h.body.x, h.body.y, h.body.width, h.body.height);
    h.drift = 0;
    for (const L of this.list) {
      const o = L.o; L.t += dt;
      switch (o.kind) {
        case 'spikes': {
          const r = new Phaser.Geom.Rectangle(o.x + 4, o.y - 20, (o.w ?? 120) - 8, 20);
          if (h.state !== 'dash' && Phaser.Geom.Intersects.RectangleToRectangle(hr, r)) this.hk.hurt(o.x + (o.w ?? 120) / 2, 1);
          break;
        }
        case 'mover': {
          const sp = o.speed ?? 1.2, ax = (o.dx ?? 120) / 2, ay = (o.dy ?? 0) / 2;
          const nx = (L.x0 as number) + ax + Math.sin(L.t * sp) * ax, ny = (L.y0 as number) + ay + Math.sin(L.t * sp) * ay;      // the platform starts at its middle and swings both ways
          const b = L.body as Phaser.Physics.Arcade.Image;
          // follow the sine path by velocity (so riders are carried), nudged back toward the exact position
          (b.body as Phaser.Physics.Arcade.Body).setVelocity(Math.cos(L.t * sp) * ax * sp + (nx - b.x) * 6, Math.cos(L.t * sp) * ay * sp + (ny - b.y) * 6);
          (L.img as Phaser.GameObjects.Image).setPosition(b.x, b.y - 4);
          break;
        }
        case 'crumble': {
          const p = L.stat as Phaser.Physics.Arcade.Sprite, w = o.w ?? 100;
          const on = Math.abs(h.y - o.y) < 8 && h.x > o.x - 4 && h.x < o.x + w + 4 && h.grounded;
          if (L.state === 0 && on) { L.state = 1; L.timer = 0; }
          if (L.state === 1) { L.timer = (L.timer as number) + dt; (L.img as Phaser.GameObjects.Image).x = o.x + Math.sin(L.t * 60) * 1.5; if ((L.timer as number) > 0.5) { L.state = 2; L.timer = 0; (p.body as Phaser.Physics.Arcade.StaticBody).checkCollision.up = false; this.scene.tweens.add({ targets: L.img, y: o.y + 300, alpha: 0, duration: 500 }); this.hk.fx.puff(o.x + w / 2, o.y, 4); } }
          if (L.state === 2) { L.timer = (L.timer as number) + dt; if ((L.timer as number) > 3) { L.state = 0; (p.body as Phaser.Physics.Arcade.StaticBody).checkCollision.up = true; (L.img as Phaser.GameObjects.Image).setPosition(o.x, o.y - 4).setAlpha(1); } }
          break;
        }
        case 'spring': {
          const w = 44;
          if (h.body.velocity.y >= 0 && h.x > o.x - w / 2 - 6 && h.x < o.x + w / 2 + 6 && h.y > o.y - 16 && h.y < o.y + 10) {
            h.launch(-1010); sfx.dash(); this.hk.fx.ring(o.x, o.y - 10, 0xffd23f, 50, 300); this.scene.tweens.add({ targets: L.img, scaleY: (L.img as Phaser.GameObjects.Image).scaleY * 0.6, yoyo: true, duration: 90 });
          }
          break;
        }
        case 'belt': {
          const w = o.w ?? 200, t = L.extra?.[0] as Phaser.GameObjects.TileSprite;
          t.tilePositionX -= (o.dir ?? 1) * 40 * dt * 2;
          if (h.grounded && h.x > o.x && h.x < o.x + w && Math.abs(h.y - o.y) < 6) h.drift = (o.dir ?? 1) * 125;
          break;
        }
        case 'fan': {
          const w = o.w ?? 70, top = o.y - (o.len ?? 300);
          (L.img as Phaser.GameObjects.Image).setScale(Math.cos(L.t * 30) * 0.5, 0.5);
          if (h.x > o.x - w / 2 && h.x < o.x + w / 2 && h.y < o.y && h.y > top) { const b = h.body; if (b.velocity.y > -380) b.setVelocityY(Math.max(-380, b.velocity.y - 3200 * dt)); h.airJumps = 1; }
          break;
        }
        case 'beam': {
          const w = o.w ?? 220, per = o.speed ?? 3.2, u = (L.t % per) / per;
          const beam = L.extra?.[2] as Phaser.GameObjects.Rectangle;
          const on = u > 0.55 && u < 0.88, warn = u > 0.4 && u <= 0.55;
          beam.setAlpha(on ? 0.95 : warn ? (Math.sin(L.t * 40) > 0 ? 0.4 : 0.1) : 0.1).setSize(w - 16, on ? 10 : 4);
          if (on) { const r = new Phaser.Geom.Rectangle(o.x + 8, o.y - 30, w - 16, 20); if (h.state !== 'dash' && Phaser.Geom.Intersects.RectangleToRectangle(hr, r)) this.hk.hurt(o.x + w / 2, 1); }
          break;
        }
        case 'cannon': {
          L.fireT = (L.fireT as number) - dt;
          if (L.fireT <= 0) {
            L.fireT = (o.speed ?? 2.6) + 0.4;
            const dir = o.dir ?? 1, pink = o.pink ?? Math.random() < 0.4;
            const def: ProjDef = enemyShot(pink ? 'pink' : 'packet', dir, { x: o.x, y: o.y - 30 }, { x: h.x, y: h.y });
            this.hk.spawnProj(new Proj(this.scene, def, o.x + dir * 36, o.y - 31));
            this.hk.fx.ring(o.x + dir * 40, o.y - 31, pink ? 0xff7ac8 : 0xffffff, 28, 200); sfx.swing(0);
            this.scene.tweens.add({ targets: L.img, scaleX: (L.img as Phaser.GameObjects.Image).scaleX * 0.9, yoyo: true, duration: 80 });
          }
          break;
        }
        case 'swinger': {
          const len = o.len ?? 190, ang = Math.sin(L.t * (o.speed ?? 1.5)) * 0.95;
          const px = o.x + Math.sin(ang) * len, py = o.y + Math.cos(ang) * len;
          (L.img as Phaser.GameObjects.Image).setPosition(px, py);
          (L.extra?.[0] as Phaser.GameObjects.Rectangle).setRotation(-ang);
          if (h.state !== 'dash' && Math.hypot(px - (h.x), py - (h.y - 40)) < 40) this.hk.hurt(px, 1);
          break;
        }
      }
    }
  }
}
void shade;
