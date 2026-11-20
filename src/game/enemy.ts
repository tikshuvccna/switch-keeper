/**
 * Enemies. Each is an arcade body (invisible) plus a puppet from its rig. Behaviour comes from an archetype:
 *  brawler: walks, chases, winds up (harmless, readable), lunges.   Collision Twins jam each other when they meet.
 *  flyer:   sleeps until there is noise; then hovers over the hero and dives.
 *  hopper:  hops toward the hero and spits a small copy of itself now and then.
 *  thief:   darts in, swipes (stealing bits) and darts out.
 *  warden:  blocks frontal hits; stagger it with the third hit of a combo or hit it from behind.
 * Defeated enemies are "disconnected": they pop into paper scraps and drop bits.
 */
import * as Phaser from 'phaser';
import { enemyRig } from '../art/registry';
import { eye, INK, paper, Puppet, rr, shade, type PartDef } from '../art/puppet';
import type { EnemyCtx, EnemyRig } from '../art/types';
import type { Hero } from './hero';

export type Arch = 'brawler' | 'flyer' | 'hopper' | 'thief' | 'warden';
export interface EnemyDef { id: string; arch: Arch; hp: number; speed: number; chase: number; xp: number; touch?: number; splits?: boolean; fly?: boolean; guard?: boolean; awake?: boolean }
export const ENEMIES: Record<string, EnemyDef> = {
  crate: { id: 'crate', arch: 'brawler', hp: 3, speed: 70, chase: 120, xp: 10 },
  imp: { id: 'imp', arch: 'flyer', hp: 2, speed: 150, chase: 150, xp: 10, fly: true },
  dup: { id: 'dup', arch: 'brawler', hp: 3, speed: 52, chase: 80, xp: 12, splits: true },
  flood: { id: 'flood', arch: 'hopper', hp: 3, speed: 150, chase: 150, xp: 12 },
  tagthief: { id: 'tagthief', arch: 'thief', hp: 3, speed: 150, chase: 230, xp: 14 },
  warden: { id: 'warden', arch: 'warden', hp: 6, speed: 55, chase: 95, xp: 20, guard: true },
  hornhawk: { id: 'hornhawk', arch: 'flyer', hp: 2, speed: 160, chase: 160, xp: 14, fly: true },
  drifter: { id: 'drifter', arch: 'flyer', hp: 2, speed: 140, chase: 140, xp: 14, fly: true, awake: true },
  gatewarden: { id: 'gatewarden', arch: 'warden', hp: 7, speed: 50, chase: 90, xp: 22, guard: true },
  stormling: { id: 'stormling', arch: 'flyer', hp: 2, speed: 170, chase: 170, xp: 16, fly: true, awake: true },
  echoknight: { id: 'echoknight', arch: 'brawler', hp: 4, speed: 80, chase: 135, xp: 20 },
};

/** A plain stand-in while a creature's real rig is not drawn yet. */
function fallback(id: string): EnemyRig {
  const col = ['#d98f5c', '#9b7bff', '#6fd3a0', '#5ac8fa', '#ff8fb8', '#c0a070'][Math.abs([...id].reduce((a, ch) => a + ch.charCodeAt(0), 0)) % 6];
  const parts: PartDef[] = [{ name: 'body', at: [0, -20], img: { w: 44, h: 44, ax: 22, ay: 36, draw: (c) => { paper(c, () => rr(c, 4, 4, 36, 36, 12), col, { y0: 4, y1: 40 }); eye(c, 28, 18, 4.5); eye(c, 17, 18, 4.5); } } }];
  void INK; void shade;
  return { kind: 'enemy', id, name: id, parts, scale: 1, pose: (c: EnemyCtx) => ({ body: [0, 0, c.state === 'move' ? -Math.abs(Math.sin(c.time * 8)) * 3 : 0, 1, c.state === 'windup' ? 0.8 : 1] }), body: { w: 36, h: 36, origin: 'feet' }, demo: [] };
}

export class Enemy {
  readonly def: EnemyDef;
  readonly rig: EnemyRig;
  readonly puppet: Puppet;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hp: number; maxHp: number;
  alive = true;
  dir: 1 | -1 = 1;
  state: EnemyCtx['state'] = 'idle';
  t = 0;
  /** Jammed (stunned and fragile: double damage). */
  jam = 0;
  stun = 0;
  asleep = false;
  isCopy = false;
  splitDone = false;
  home: number; range: number;
  /** Seconds the health bar stays visible. */
  barT = 0;
  scale = 1;
  private cool = 0; private lunge = 0; private dive = 0; private hopT = 0; private spawnCool = 4; private variant = 0;
  private time = Math.random() * 6; private flash = 0; private dying = 0;
  private phase = Math.random() * 6;
  onSpawn?: (kind: string, x: number, y: number) => void;
  onSteal?: (n: number) => void;

  constructor(private scene: Phaser.Scene, kind: string, x: number, y: number, range = 120, copy = false) {
    this.def = ENEMIES[kind] ?? ENEMIES.crate;
    this.rig = enemyRig(kind) ?? fallback(kind);
    this.isCopy = copy; this.home = x; this.range = range;
    this.scale = (copy ? 0.75 : 1) * this.rig.scale;
    this.hp = this.maxHp = copy ? 1 : this.def.hp;
    const w = this.rig.body.w * (copy ? 0.75 : 1), h = this.rig.body.h * (copy ? 0.75 : 1);
    this.sprite = scene.physics.add.sprite(x, y, 'spark').setVisible(false).setOrigin(0.5, this.rig.body.origin === 'feet' ? 1 : 0.5);
    const b = this.sprite.body as Phaser.Physics.Arcade.Body;
    b.setSize(w, h);
    if (this.rig.body.origin === 'feet') b.setOffset(4 - w / 2, 8 - h); else b.setOffset(4 - w / 2, 4 - h / 2);
    if (this.def.fly) { b.setAllowGravity(false); if (!this.def.awake) { this.asleep = true; this.state = 'sleep'; } else this.state = 'move'; }
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.puppet = new Puppet(scene, this.rig.parts, this.rig.id);
    this.puppet.setDepth(8);
  }
  get body(): Phaser.Physics.Arcade.Body { return this.sprite.body as Phaser.Physics.Arcade.Body; }
  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }
  rect(): Phaser.Geom.Rectangle { const b = this.body; return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height); }
  /** Can touching this enemy hurt the hero right now? */
  get dangerous(): boolean {
    if (!this.alive || this.asleep || this.jam > 0 || this.stun > 0.1 || this.state === 'windup' || this.state === 'wake' || this.dying > 0) return false;
    return true;
  }
  wake(): void { if (this.asleep) { this.asleep = false; this.setState('wake'); } }
  private setState(s: EnemyCtx['state']): void { if (this.state !== s) { this.state = s; this.t = 0; } }

  /** Damage the enemy. Returns 'dead', 'hit' or 'blocked'. */
  hit(dmg: number, fromX: number, push: number, heroStage: number): 'dead' | 'hit' | 'blocked' {
    this.wake();
    const front = Math.sign(fromX - this.x) === this.dir;          // the attacker is on the side the enemy faces
    if (this.def.guard && this.jam <= 0 && this.state !== 'windup' && this.stun <= 0 && front && heroStage < 2) {
      this.body.setVelocityX((this.x >= fromX ? 1 : -1) * 90);
      return 'blocked';
    }
    const d = this.jam > 0 ? dmg * 2 : dmg;
    this.hp -= d; this.barT = 2.2; this.flash = 0.09;
    this.stun = this.def.guard ? 0.5 : 0.25; this.cool = Math.max(this.cool, 0.5); this.lunge = 0; this.dive = 0;
    if (this.state === 'windup' || this.state === 'attack') this.setState('hurt');
    this.body.setVelocity((this.x >= fromX ? 1 : -1) * push, this.def.fly ? -80 : -170);
    this.setState('hurt');
    if (this.hp <= 0) { this.alive = false; this.dying = 0.35; return 'dead'; }
    return 'hit';
  }

  update(dt: number, hero: Hero, others: Enemy[]): void {
    if (!this.sprite.active) return;
    if (this.dying > 0) { this.dying -= dt; this.view(dt); return; }
    if (!this.alive) return;
    this.time += dt; this.t += dt;
    this.stun = Math.max(0, this.stun - dt); this.cool = Math.max(0, this.cool - dt); this.flash = Math.max(0, this.flash - dt); this.barT = Math.max(0, this.barT - dt);
    const b = this.body, dx = hero.x - this.x, near = Math.abs(dx) < 330 && Math.abs(hero.y - this.y) < 150, awake = hero.state !== 'asleep';
    if (this.jam > 0) {
      this.jam -= dt; b.setVelocityX(b.velocity.x * 0.9); this.setState('jam');
      if (this.jam <= 0) this.setState('idle');
    } else if (this.stun > 0) { b.setVelocityX(b.velocity.x * 0.92); }
    else {
      if (this.state === 'hurt' || this.state === 'jam') this.setState('idle');
      switch (this.def.arch) {
        case 'brawler': this.brawler(dt, dx, near, awake, others); break;
        case 'warden': this.warden(dt, dx, near, awake); break;
        case 'flyer': this.flyer(dt, hero, dx); break;
        case 'hopper': this.hopper(dt, dx, near, awake); break;
        case 'thief': this.thief(dt, dx, near, awake); break;
      }
    }
    if (this.state !== 'windup' || this.def.arch === 'flyer') this.dirToward(dx);
    this.view(dt);
  }
  private dirToward(dx: number): void { if (this.state === 'move' || this.state === 'windup' || this.state === 'attack') { if (Math.abs(dx) > 8 && (this.state !== 'move' || Math.abs(dx) < 330)) this.dir = dx > 0 ? 1 : -1; } }

  private patrol(speed: number): void {
    if (this.x > this.home + this.range) this.dir = -1;
    if (this.x < this.home - this.range) this.dir = 1;
    this.body.setVelocityX(this.dir * speed); this.setState('move');
  }
  private brawler(dt: number, dx: number, near: boolean, awake: boolean, others: Enemy[]): void {
    const b = this.body, d = this.def;
    if (this.state === 'windup') { b.setVelocityX(0); if (this.t > 0.5) { this.setState('attack'); this.lunge = 0.22; } return; }
    if (this.state === 'attack') { this.lunge -= dt; b.setVelocityX(this.dir * 330); if (this.lunge <= 0) { this.cool = 1.1; this.setState('idle'); } return; }
    if (near && Math.abs(dx) < 105 && this.cool <= 0 && awake) { this.dir = dx > 0 ? 1 : -1; this.setState('windup'); return; }
    if (near && awake) { this.dir = dx > 0 ? 1 : -1; b.setVelocityX(this.dir * d.chase); this.setState('move'); } else this.patrol(d.speed);
    if (d.id === 'crate') {                      // the Collision Twin rule: two crates that meet jam each other
      for (const o of others) {
        if (o === this || o.def.id !== 'crate' || !o.alive || o.jam > 0 || o.state === 'windup') continue;
        if (Math.abs(o.x - this.x) < 36 && Math.abs(o.y - this.y) < 24 && Math.sign(o.x - this.x) === this.dir) {
          this.jam = o.jam = 2.6; b.setVelocityX(-this.dir * 90); o.body.setVelocityX(this.dir * 90); this.scene.events.emit('jam', (this.x + o.x) / 2, this.y - 20);
        }
      }
    }
  }
  private warden(dt: number, dx: number, near: boolean, awake: boolean): void {
    const b = this.body;
    if (this.state === 'windup') { b.setVelocityX(0); if (this.t > 0.65) { this.setState('attack'); this.lunge = this.variant === 0 ? 0.32 : 0.25; } return; }
    if (this.state === 'attack') {
      this.lunge -= dt;
      b.setVelocityX(this.variant === 0 ? this.dir * 360 : 0);
      if (this.lunge <= 0) { this.cool = 1.6; this.setState('idle'); }
      return;
    }
    if (near && Math.abs(dx) < 120 && this.cool <= 0 && awake) { this.dir = dx > 0 ? 1 : -1; this.variant = Math.random() < 0.5 ? 0 : 1; this.setState('windup'); return; }
    if (near && awake) { this.dir = dx > 0 ? 1 : -1; b.setVelocityX(this.dir * this.def.chase); this.setState('move'); } else this.patrol(this.def.speed);
  }
  private flyer(dt: number, hero: Hero, dx: number): void {
    const b = this.body;
    if (this.asleep) { b.setVelocity(0, 0); this.setState('sleep'); return; }
    if (this.state === 'wake') { b.setVelocity(0, -20); if (this.t > 0.5) this.setState('move'); return; }
    if (this.state === 'windup') { b.setVelocity(-this.dir * 40, -30); if (this.t > 0.45) { this.setState('attack'); this.dive = 0.62; } return; }
    if (this.state === 'attack') {
      this.dive -= dt;
      b.setVelocity(Math.sign(dx || 1) * 230, 260 * (this.dive > 0.3 ? 1 : -0.8));
      if (this.dive <= 0) { this.cool = 2.2 + Math.random() * 1.6; this.setState('move'); }
      return;
    }
    const tx = hero.x + Math.sin(this.time * 1.3) * 140, ty = hero.y - 150 + Math.sin(this.time * 2.1) * 22;
    b.setVelocity(Phaser.Math.Clamp((tx - this.x) * 1.8, -150, 150), Phaser.Math.Clamp((ty - this.y) * 2.2, -130, 130));
    this.setState('move');
    if (this.cool <= 0 && Math.abs(dx) < 260) this.setState('windup');
  }
  private hopper(dt: number, dx: number, near: boolean, awake: boolean): void {
    const b = this.body, grounded = b.blocked.down || b.touching.down;
    this.spawnCool -= dt;
    if (this.state === 'windup') { b.setVelocityX(0); if (this.t > 0.55) { this.setState('attack'); if (!this.isCopy && this.spawnCool <= 0) { this.onSpawn?.('flood', this.x + this.dir * 24, this.y - 6); this.spawnCool = 5; } this.cool = 0.4; } return; }
    if (this.state === 'attack') { if (this.t > 0.25) this.setState('idle'); return; }
    this.hopT -= dt;
    if (grounded) {
      b.setVelocityX(b.velocity.x * 0.8);
      if (this.hopT <= 0) {
        if (near && awake && !this.isCopy && this.spawnCool <= 0 && this.cool <= 0) { this.dir = dx > 0 ? 1 : -1; this.setState('windup'); return; }
        const toward = near && awake ? (dx > 0 ? 1 : -1) : (this.x > this.home + this.range ? -1 : this.x < this.home - this.range ? 1 : this.dir);
        this.dir = toward as 1 | -1;
        b.setVelocity(this.dir * (near ? 170 : 90), -430); this.hopT = 0.9 + Math.random() * 0.4; this.setState('move');
      } else if (this.state === 'move' && this.t > 0.3) this.setState('idle');
    }
  }
  private thief(dt: number, dx: number, near: boolean, awake: boolean): void {
    const b = this.body;
    if (this.state === 'windup') { b.setVelocityX(0); if (this.t > 0.35) { this.setState('attack'); this.lunge = 0.2; } return; }
    if (this.state === 'attack') { this.lunge -= dt; b.setVelocityX(this.dir * 380); if (this.lunge <= 0) { this.cool = 1.4; this.setState('idle'); this.dir = (this.dir * -1) as 1 | -1; this.retreat = 0.7; } return; }
    if (this.retreat > 0) { this.retreat -= dt; b.setVelocityX(-this.dir * 200); this.setState('move'); return; }
    if (near && Math.abs(dx) < 130 && this.cool <= 0 && awake) { this.dir = dx > 0 ? 1 : -1; this.setState('windup'); return; }
    if (near && awake) { this.dir = dx > 0 ? 1 : -1; b.setVelocityX(this.dir * this.def.chase); this.setState('move'); } else this.patrol(this.def.speed);
  }
  private retreat = 0;

  /** The hero got hit by this enemy's attack: a thief takes bits. */
  strike(): void { if (this.def.arch === 'thief' && this.state === 'attack') this.onSteal?.(3); }

  private view(_dt: number): void {
    const p = this.puppet, b = this.body;
    const alive = this.dying <= 0;
    const ctx: EnemyCtx = {
      state: alive ? this.state : 'dead', time: this.time, t: alive ? this.t : 0.35 - this.dying,
      vx: Math.abs(b.velocity.x), vy: b.velocity.y, grounded: b.blocked.down || b.touching.down, hp: Math.max(0, this.hp / this.maxHp), phase: 0, variant: this.variant,
    };
    p.apply(this.rig.pose(ctx));
    const centre = this.rig.body.origin === 'center';
    p.root.setPosition(Math.round(this.x), Math.round(centre ? this.y : this.y));
    p.root.setScale(this.dir * this.scale, this.scale);
    p.flash(this.flash > 0);
    p.setAlpha(alive ? 1 : Math.max(0, this.dying / 0.35));
    p.setDepth(this.def.fly ? 9 : 8);
  }
  destroy(): void { this.puppet.destroy(); this.sprite.destroy(); }
}
