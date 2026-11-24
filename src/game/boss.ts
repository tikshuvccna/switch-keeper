/**
 * Bosses. A boss lives in an arena at the end of an area. It follows a loop of attacks, each with a long readable windup
 * (the telegraph: a marker on the floor and the rig's windup pose), and is stunned after some of them: that is the window to hit it.
 *  Hub Hog: always hittable. Attacks: charge, belly-shout (rings run along the floor: jump them), jump slam. Calls crates when angry.
 *  Door Flooder: only hittable while it is stunned (after a smash or a spray). Attacks: ground sweep, overhead smash, spray.
 */
import * as Phaser from 'phaser';
import { enemyRig } from '../art/registry';
import { Puppet } from '../art/puppet';
import type { EnemyCtx, EnemyRig } from '../art/types';
import type { Hero } from './hero';
import { GROUND_Y } from './levels';

export interface Hazard { rect: Phaser.Geom.Rectangle; until: number; from: number; kind: 'floor' | 'air'; dmg: number; vx: number; img?: Phaser.GameObjects.Image }
export interface BossHooks {
  hazard(h: Hazard): void;
  telegraph(x0: number, x1: number, y: number, dur: number): void;
  ring(x: number, y: number, color: number, r: number): void;
  shake(a: number): void;
  spawn(kind: string, x: number): void;
  say(text: string): void;
  sound(n: 'whack' | 'boom' | 'roar'): void;
}

type State = EnemyCtx['state'];
export class Boss {
  readonly rig: EnemyRig;
  readonly puppet: Puppet;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hp: number; maxHp: number;
  alive = true;
  dir: 1 | -1 = -1;
  state: State = 'idle';
  t = 0;
  variant = 0;
  phase = 0;
  stun = 0;
  private time = 0; private cool = 1.6; private flash = 0; private dying = 0;
  private charge = 0; private vx = 0; private airborne = false; private slamX = 0;
  private called = [false, false];
  onDead?: () => void;

  constructor(private scene: Phaser.Scene, readonly id: 'hubhog' | 'flooder' | 'borderking' | 'storm' | string, x: number, private x0: number, private x1: number, private hooks: BossHooks) {
    this.rig = enemyRig(id) ?? placeholder(id);
    this.hp = this.maxHp = id === 'storm' ? 42 : id === 'flooder' || id === 'borderking' ? 36 : 30;
    const w = this.rig.body.w, h = this.rig.body.h;
    this.sprite = scene.physics.add.sprite(x, GROUND_Y, 'spark').setVisible(false).setOrigin(0.5, 1);
    const b = this.sprite.body as Phaser.Physics.Arcade.Body;
    b.setSize(w, h).setOffset(4 - w / 2, 8 - h);
    if (id === 'flooder') { b.setAllowGravity(false); b.setImmovable(true); }
    this.puppet = new Puppet(scene, this.rig.parts, this.rig.id);
    this.puppet.setDepth(8);
    this.flooder = id === 'flooder';
  }
  private flooder: boolean;
  get body(): Phaser.Physics.Arcade.Body { return this.sprite.body as Phaser.Physics.Arcade.Body; }
  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }
  rect(): Phaser.Geom.Rectangle { const b = this.body; return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height); }
  /** Touching the boss hurts unless it is stunned or winding up. */
  get dangerous(): boolean { return this.alive && this.state !== 'windup' && this.state !== 'jam' && this.stun <= 0 && this.dying <= 0 && !this.flooder; }
  /** Can the boss be hurt now? */
  get open(): boolean { return this.alive && (!this.flooder || this.state === 'jam'); }

  private set(s: State): void { if (this.state !== s) { this.state = s; this.t = 0; } }

  hit(dmg: number): 'dead' | 'hit' | 'blocked' {
    if (!this.open) { this.flash = 0.05; return 'blocked'; }
    this.hp -= dmg; this.flash = 0.09;
    if (this.hp <= 0) { this.alive = false; this.dying = 2.2; this.set('dead'); this.body.setVelocity(0, 0); return 'dead'; }
    this.phase = this.hp < this.maxHp * 0.34 ? 2 : this.hp < this.maxHp * 0.67 ? 1 : 0;
    const add1 = this.id === 'borderking' ? 'hornhawk' : this.id === 'storm' ? 'stormling' : 'crate';
    const add2 = this.id === 'borderking' ? 'gatewarden' : this.id === 'storm' ? 'stormling' : 'crate';
    if (this.phase >= 1 && !this.called[0] && !this.flooder) { this.called[0] = true; this.hooks.say('הבוס קורא לעזרה!'); this.hooks.spawn(add1, Math.max(this.x0 + 100, this.x - 240)); this.hooks.spawn(add1, Math.min(this.x1 - 100, this.x + 240)); }
    if (this.phase >= 2 && !this.called[1] && !this.flooder) { this.called[1] = true; this.hooks.say('שלב אחרון! היזהרו!'); this.hooks.spawn(add2, Math.max(this.x0 + 100, this.x - 160)); this.hooks.spawn(add2, Math.min(this.x1 - 100, this.x + 160)); }
    return 'hit';
  }

  update(dt: number, hero: Hero, nowMs: number): void {
    this.time += dt; this.t += dt; this.flash = Math.max(0, this.flash - dt);
    if (this.dying > 0) {
      this.dying -= dt;
      if (Math.random() < 0.3) this.hooks.ring(this.x + (Math.random() - 0.5) * this.rig.body.w, this.y - Math.random() * this.rig.body.h, 0xffffff, 60);
      if (this.dying <= 0) this.onDead?.();
      this.view(); return;
    }
    const b = this.body, dx = hero.x - this.x, ang = this.phase;
    this.cool = Math.max(0, this.cool - dt); this.stun = Math.max(0, this.stun - dt);
    if (this.flooder) { this.flooderAi(dt, hero, nowMs); this.view(); return; }
    switch (this.state) {
      case 'jam': b.setVelocityX(b.velocity.x * 0.9); if (this.t > 1.5) this.set('idle'); break;
      case 'windup': b.setVelocityX(0); if (this.t > (this.variant === 1 ? 0.9 : 0.75) - ang * 0.1) this.begin(hero, nowMs); break;
      case 'attack': this.attack(dt, hero, nowMs); break;
      default: {
        this.dir = dx > 0 ? 1 : -1;
        if (Math.abs(dx) > 200) { b.setVelocityX(this.dir * (70 + ang * 25)); this.set('move'); } else { b.setVelocityX(0); this.set('idle'); }
        if (this.cool <= 0) { this.variant = Math.random() < 0.34 ? 0 : Math.random() < 0.5 ? 1 : 2; if (ang === 0 && this.variant === 1 && Math.random() < 0.5) this.variant = 0; this.set('windup'); this.hooks.sound('roar'); this.markFor(hero); }
      }
    }
    // stay in the arena
    if (this.x < this.x0 + 120) { this.sprite.x = this.x0 + 120; b.setVelocityX(Math.max(0, b.velocity.x)); if (this.state === 'attack' && this.variant === 0) { this.stunBy(1.5); } }
    if (this.x > this.x1 - 120) { this.sprite.x = this.x1 - 120; b.setVelocityX(Math.min(0, b.velocity.x)); if (this.state === 'attack' && this.variant === 0) { this.stunBy(1.5); } }
    this.view();
  }
  private stunBy(s: number): void { this.set('jam'); this.hooks.shake(0.02); this.hooks.sound('boom'); this.t = 1.5 - s; }

  private markFor(hero: Hero): void {
    if (this.id === 'borderking' && this.variant === 0) {
      this.slamX = hero.x;
      this.hooks.telegraph(hero.x - 160, hero.x - 80, GROUND_Y, 0.8);
      this.hooks.telegraph(hero.x + 80, hero.x + 160, GROUND_Y, 0.8);
    } else if (this.id === 'storm' && this.variant === 1) {
      this.hooks.telegraph(this.x0 + 80, this.x1 - 80, GROUND_Y, 0.85);
    } else if (this.variant === 0) this.hooks.telegraph(Math.min(this.x, hero.x) - 40, Math.max(this.x, hero.x) + 40, GROUND_Y, 0.75);
    else if (this.variant === 2) { this.slamX = hero.x; this.hooks.telegraph(hero.x - 90, hero.x + 90, GROUND_Y, 0.7); }
    else this.hooks.telegraph(this.x - 400, this.x + 400, GROUND_Y, 0.9);
  }
  private begin(hero: Hero, nowMs: number): void {
    this.set('attack'); this.dir = hero.x > this.x ? 1 : -1;
    if (this.id === 'borderking' && this.variant === 0) {
      // Border King: drops twin boundary barriers on both sides of the hero
      this.hooks.sound('boom'); this.hooks.shake(0.015);
      for (const off of [-120, 120]) {
        const bx = Phaser.Math.Clamp(this.slamX + off, this.x0 + 80, this.x1 - 80);
        this.hooks.ring(bx, GROUND_Y - 40, 0x2f6fd1, 120);
        this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(bx - 36, GROUND_Y - 190, 72, 190), from: nowMs, until: nowMs + 650, kind: 'floor', dmg: 1, vx: 0 });
      }
      this.charge = 0.65; this.vx = 0;
    } else if (this.id === 'storm' && this.variant === 1) {
      // Broadcast Storm: sky barrage + outward rings
      this.hooks.sound('roar'); this.hooks.shake(0.018);
      const bolts = 5 + this.phase * 2;
      for (let k = 0; k < bolts; k++) {
        const px = this.x0 + 120 + Math.random() * (this.x1 - this.x0 - 240);
        this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(px, 20 - k * 36, 26, 36), from: nowMs + k * 190, until: nowMs + 3200 + k * 190, kind: 'air', dmg: 1, vx: 0 });
      }
      for (const d of [-1, 1]) this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(this.x, GROUND_Y - 46, 46, 46), from: nowMs + 200, until: nowMs + 4200, kind: 'floor', dmg: 1, vx: d * 300 });
    } else if (this.variant === 0) {
      const spd = this.id === 'storm' ? 500 + this.phase * 50 : 430 + this.phase * 40;
      this.charge = 0.95 + this.phase * 0.2; this.vx = this.dir * spd;
    } else if (this.variant === 1) {            // the belly-shout / horn wave: rings along the floor
      this.hooks.sound('roar'); this.hooks.shake(0.012);
      const n = 1 + this.phase, rvx = this.id === 'borderking' ? 300 : 250;
      for (const d of [-1, 1]) for (let k = 0; k < n; k++) this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(this.x, GROUND_Y - 46, 46, 46), from: nowMs + k * 460, until: nowMs + 4200 + k * 460, kind: 'floor', dmg: 1, vx: d * rvx });
    } else {
      this.airborne = true;
      this.body.setVelocity((this.slamX - this.x) * 1.25, this.id === 'storm' ? -680 : -620);
    }
  }
  private attack(dt: number, hero: Hero, nowMs: number): void {
    const b = this.body;
    if (this.variant === 0) { this.charge -= dt; b.setVelocityX(this.vx); if (this.charge <= 0) { this.cool = 1.4 - this.phase * 0.25; this.set('idle'); } }
    else if (this.variant === 1) { if (this.t > (this.id === 'storm' ? 1.15 : 0.9)) { this.cool = 1.4 - this.phase * 0.25; this.set('idle'); } }
    else {
      if (this.airborne && this.t > 0.2 && (b.blocked.down || b.touching.down)) {
        this.airborne = false; this.hooks.shake(0.02); this.hooks.sound('boom');
        const rad = this.id === 'storm' ? 210 : 170;
        this.hooks.ring(this.x, GROUND_Y - 6, this.id === 'storm' ? 0xb79cff : 0xffd23f, rad);
        this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(this.x - rad, GROUND_Y - 36, rad * 2, 36), from: nowMs, until: nowMs + 260, kind: 'floor', dmg: 1, vx: 0 });
        if (this.id === 'storm') for (const d of [-1, 1]) this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(this.x, GROUND_Y - 46, 46, 46), from: nowMs + 100, until: nowMs + 3600, kind: 'floor', dmg: 1, vx: d * 280 });
        b.setVelocityX(0); this.set('jam'); this.t = 0.6;                        // landed: a short window
        this.cool = 1.3 - this.phase * 0.2;
      }
    }
    void hero;
  }

  /** The door flooder never moves: it picks an attack, telegraphs it, strikes and then lies open for a moment. */
  private flooderAi(dt: number, hero: Hero, nowMs: number): void {
    switch (this.state) {
      case 'jam': if (this.t > 2.0 - this.phase * 0.3) { this.set('idle'); this.cool = 0.6; } break;
      case 'windup':
        if (this.t > (this.variant === 2 ? 1.0 : 0.85)) {
          this.set('attack');
          if (this.variant === 0) { this.hooks.shake(0.012); this.hooks.sound('whack'); this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(this.x - 560, GROUND_Y - 46, 520, 46), from: nowMs, until: nowMs + 420, kind: 'floor', dmg: 1, vx: 0 }); }
          else if (this.variant === 1) { this.hooks.shake(0.02); this.hooks.sound('boom'); this.hooks.ring(this.slamX, GROUND_Y - 6, 0x6fd3ff, 160); this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(this.slamX - 80, GROUND_Y - 200, 160, 200), from: nowMs, until: nowMs + 360, kind: 'floor', dmg: 1, vx: 0 }); }
          else for (let k = 0; k < 4 + this.phase * 2; k++) { const px = this.x0 + 160 + Math.random() * (this.x - this.x0 - 260); this.hooks.hazard({ rect: new Phaser.Geom.Rectangle(px, 40 - k * 40, 22, 30), from: nowMs + k * 220, until: nowMs + 3000 + k * 220, kind: 'air', dmg: 1, vx: 0 }); }
        }
        break;
      case 'attack': if (this.t > 0.5) { this.set(this.variant === 0 ? 'idle' : 'jam'); this.cool = 1.0 - this.phase * 0.2; } break;
      default:
        this.set('idle');
        if (this.cool <= 0) {
          this.variant = Math.floor(Math.random() * 3);
          this.set('windup');
          if (this.variant === 0) this.hooks.telegraph(this.x - 560, this.x - 40, GROUND_Y, 0.85);
          else if (this.variant === 1) { this.slamX = hero.x; this.hooks.telegraph(hero.x - 80, hero.x + 80, GROUND_Y, 0.85); }
          else this.hooks.telegraph(this.x0 + 100, this.x - 100, GROUND_Y, 1.0);
        }
    }
    void dt;
  }

  private view(): void {
    const p = this.puppet, b = this.body;
    const ctx: EnemyCtx = { state: this.dying > 0 ? 'dead' : this.state, time: this.time, t: this.dying > 0 ? 2.2 - this.dying : this.t, vx: Math.abs(b.velocity.x), vy: b.velocity.y, grounded: b.blocked.down || b.touching.down, hp: Math.max(0, this.hp / this.maxHp), phase: this.phase, variant: this.variant };
    p.apply(this.rig.pose(ctx));
    p.root.setPosition(Math.round(this.x), Math.round(this.y));
    p.root.setScale(this.flooder ? this.rig.scale : this.dir * this.rig.scale, this.rig.scale);
    p.flash(this.flash > 0);
    p.setAlpha(this.dying > 0 ? 0.4 + 0.6 * Math.abs(Math.sin(this.dying * 18)) : 1);
  }
  destroy(): void { this.puppet.destroy(); this.sprite.destroy(); }
}

function placeholder(id: string): EnemyRig {
  return {
    kind: 'enemy', id, name: id, scale: 1, body: { w: 160, h: 130, origin: 'feet' }, demo: [], pose: () => ({}),
    parts: [{ name: 'body', at: [0, -60], img: { w: 160, h: 130, ax: 80, ay: 65, draw: (c) => { c.fillStyle = '#c0709a'; c.beginPath(); c.ellipse(80, 65, 70, 56, 0, 0, 7); c.fill(); c.lineWidth = 4; c.strokeStyle = '#1d1a33'; c.stroke(); } } }],
  };
}
