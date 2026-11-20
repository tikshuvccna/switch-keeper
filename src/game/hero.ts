/**
 * The player: arcade physics body (invisible) + a puppet drawn from the hero's rig. Run, variable jump with coyote time and
 * a jump buffer (a glide for Beacon), a three-hit combo, a dash with invulnerability frames, magic with a meter, drop-through platforms.
 */
import * as Phaser from 'phaser';
import { heroRig } from '../art/registry';
import { Puppet } from '../art/puppet';
import type { HeroRig } from '../art/types';
import { inp, take } from '../input';
import { HEROES, type HeroDef } from './heroes';
import { save } from './save';

export type HeroState = 'free' | 'attack' | 'dash' | 'magic' | 'hurt' | 'asleep';

export class Hero {
  readonly def: HeroDef;
  readonly rig: HeroRig;
  readonly puppet: Puppet;
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly shadow: Phaser.GameObjects.Image;
  hp: number; maxHp: number; meter = 0;
  facing: 1 | -1 = 1;
  invuln = 0;
  state: HeroState = 'free';
  attackStage = 0; attackT = 0; comboCount = 0; magicT = 0;
  readonly hitSet = new Set<unknown>();
  /** Fire a shot (set by the stage). */
  onShoot?: () => void;
  /** Is there something pink to parry right now? Returns true when the parry happened. */
  onParry?: () => boolean;
  onMagic?: () => void; onJump?: () => void; onSwing?: (stage: number) => void; onLand?: (v: number) => void; onDash?: () => void;
  /** Extra damage and reach from skills and gear (set by the stage from the save). */
  dmgBonus = 0; reachBonus = 0; speedBonus = 0; meterGain = 1;
  onOneWay = false;
  onDoubleJump?: () => void;
  /** Ground height under the hero (for the shadow); set by the stage. */
  groundY = 480;

  airJumps = 1; private shootCool = 0;
  /** Sideways drift from a conveyor belt (set each frame by the stage). */
  drift = 0;
  private comboWindow = 0; private queued = false;
  private coyote = 0; private buffer = 0;
  private dashT = 0; private dashCool = 0; private dropT = 0; private hurtT = 0;
  private time = 0;
  private squash = 0;                    // + stretch, - squash (decays)
  private wasGrounded = true; private lastVy = 0;

  constructor(private scene: Phaser.Scene, x: number, y: number, heroId: string) {
    this.def = HEROES[heroId] ?? HEROES.bumper;
    this.rig = heroRig(this.def.id);
    this.hp = this.maxHp = this.def.hp;
    this.sprite = scene.physics.add.sprite(x, y, 'spark').setVisible(false).setOrigin(0.5, 1).setCollideWorldBounds(true);
    const b = this.sprite.body as Phaser.Physics.Arcade.Body;
    b.setSize(this.def.bodyW, this.def.bodyH).setOffset(4 - this.def.bodyW / 2 + 0, 8 - this.def.bodyH + 8);
    this.fixBody();
    b.setMaxVelocity(900, 1100);
    this.puppet = new Puppet(scene, this.rig.parts, this.rig.id);
    this.puppet.setDepth(10);
    this.shadow = scene.add.image(x, y, 'shadow').setDepth(9).setAlpha(0.8);
  }
  /** Phaser's offset is measured from the top-left of the 8x8 'spark' texture; keep the body centred under the origin (feet). */
  private fixBody(): void {
    const b = this.body, w = this.def.bodyW, h = this.def.bodyH;
    b.setSize(w, h);
    b.setOffset(4 - w / 2, 8 - h);
  }
  get body(): Phaser.Physics.Arcade.Body { return this.sprite.body as Phaser.Physics.Arcade.Body; }
  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }
  get dropping(): boolean { return this.dropT > 0; }
  get grounded(): boolean { return this.body.blocked.down || this.body.touching.down; }
  get swing() { return this.def.combo[Math.max(0, Math.min(2, this.attackStage))]; }
  get damage(): number { return this.swing.dmg + this.dmgBonus * (this.attackStage === 2 ? 1 : 0); }
  get push(): number { return this.swing.push; }

  hitbox(): Phaser.Geom.Rectangle | null {
    if (this.state !== 'attack') return null;
    const c = this.swing;
    if (this.attackT < c.hit[0] || this.attackT > c.hit[1]) return null;
    const w = c.reach + this.reachBonus, x = this.facing > 0 ? this.x + 6 : this.x - 6 - w;
    return new Phaser.Geom.Rectangle(x, this.y - c.h - 6, w, c.h);
  }
  landed(): void { this.meter = Math.min(100, this.meter + 9 * this.meterGain); this.comboCount++; }

  hurt(from: number, dmg = 1): boolean {
    if (this.invuln > 0 || this.state === 'asleep' || this.state === 'magic') return false;
    this.hp -= dmg; this.invuln = 1.1; this.comboCount = 0;
    this.state = 'hurt'; this.hurtT = 0.3; this.attackStage = 0;
    this.body.setVelocity((this.x >= from ? 1 : -1) * 290, -310);
    if (this.hp <= 0) { this.hp = 0; this.state = 'asleep'; }
    return true;
  }
  /** Shot upward by a spring: keeps control and gets the air jump back. */
  launch(vy: number): void { this.body.setVelocityY(vy); this.airJumps = 1; this.squash = 0.3; }
  respawn(x: number, y: number): void {
    this.hp = this.maxHp; this.invuln = 1.6; this.state = 'free'; this.meter = Math.min(this.meter, 50); this.comboCount = 0;
    this.sprite.setPosition(x, y); this.body.setVelocity(0, 0); this.body.setAllowGravity(true);
  }
  setMaxHp(n: number, heal = false): void { this.maxHp = n; if (heal || this.hp > n) this.hp = Math.min(n, heal ? n : this.hp); }

  private startAttack(stage: number): void {
    this.state = 'attack'; this.attackStage = stage; this.attackT = 0; this.queued = false; this.hitSet.clear();
    this.body.setVelocityX(this.facing * this.def.combo[stage].lunge);
    this.onSwing?.(stage);
  }

  update(dt: number): void {
    const b = this.body, def = this.def;
    this.time += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.dashCool = Math.max(0, this.dashCool - dt); this.shootCool = Math.max(0, this.shootCool - dt);
    this.dropT = Math.max(0, this.dropT - dt);
    this.comboWindow = Math.max(0, this.comboWindow - dt);
    if (this.comboWindow === 0 && this.state !== 'attack') this.comboCount = 0;
    const grounded = this.grounded;
    if (!this.wasGrounded && grounded && this.lastVy > 380) { this.squash = -Math.min(0.28, this.lastVy / 3200); this.onLand?.(this.lastVy); }
    this.wasGrounded = grounded; this.lastVy = b.velocity.y;
    if (grounded) this.airJumps = 1;
    this.coyote = grounded ? 0.1 : Math.max(0, this.coyote - dt);
    if (take('jumpP')) this.buffer = 0.12; else this.buffer = Math.max(0, this.buffer - dt);
    const wantAttack = take('attackP'), wantDash = take('dashP'), wantMagic = take('magicP');
    this.squash *= Math.max(0, 1 - 9 * dt);
    const speed = def.speed + this.speedBonus;

    if (this.state === 'asleep') b.setVelocityX(0);
    else switch (this.state) {
      case 'hurt':
        this.hurtT -= dt;
        if (this.hurtT <= 0) this.state = 'free';
        break;
      case 'dash':
        this.dashT -= dt;
        b.setVelocity(this.facing * 650, 0);
        if (this.dashT <= 0) { this.state = 'free'; b.setAllowGravity(true); b.setVelocityX(this.facing * 260); }
        break;
      case 'magic':
        this.magicT += dt;
        b.setVelocityX(0);
        if (this.magicT > 0.5) this.state = 'free';
        break;
      case 'attack': {
        const c = this.swing;
        this.attackT += dt;
        b.setVelocityX(this.facing * c.lunge * Math.max(0, 1 - this.attackT / c.time));
        if (wantAttack) this.queued = true;
        if (this.attackT >= c.time) {
          if (this.queued && this.attackStage < 2) this.startAttack(this.attackStage + 1);
          else { this.state = 'free'; this.comboWindow = 0.6; if (this.attackStage === 2) this.comboCount = 0; this.attackStage = 0; }
        }
        break;
      }
      default: {
        let dir = 0;
        if (inp.left) dir -= 1;
        if (inp.right) dir += 1;
        if (dir !== 0) this.facing = dir > 0 ? 1 : -1;
        if (inp.aim !== 0 && (wantAttack || inp.shootHeld)) this.facing = inp.aim > 0 ? 1 : -1;       // the mouse turns the hero toward the pointer
        const target = dir * speed, v = b.velocity.x, a = 2600 * dt * (grounded ? 1 : 0.55);
        b.setVelocityX(v < target ? Math.min(target, v + a) : Math.max(target, v - a));
        if (dir === 0 && grounded) b.setVelocityX(Math.abs(v) < 30 ? 0 : v * 0.8);
        if (this.buffer > 0 && this.coyote > 0) {
          if (inp.down && this.onOneWay) { this.dropT = 0.28; this.buffer = 0; this.coyote = 0; }
          else { b.setVelocityY(def.jump); this.buffer = 0; this.coyote = 0; this.squash = 0.22; this.onJump?.(); }
        } else if (this.buffer > 0 && !grounded) {
          if (this.onParry?.()) { b.setVelocityY(def.jump * 0.92); this.buffer = 0; this.airJumps = 1; this.squash = 0.25; }          // a parry: bounce and get the double jump back
          else if (this.airJumps > 0) { this.airJumps--; b.setVelocityY(def.jump * 0.9); this.buffer = 0; this.squash = 0.25; this.onJump?.(); this.onDoubleJump?.(); }
        }
        if (inp.shootHeld && this.shootCool <= 0) { this.shootCool = def.shot.rate; this.onShoot?.(); }
        if (!inp.jumpHeld && b.velocity.y < -200) b.setVelocityY(b.velocity.y * 0.6);              // a short hop when the button is released
        if (def.glide && inp.jumpHeld && b.velocity.y > 60 && !grounded) b.setVelocityY(Math.max(60, b.velocity.y - 2400 * dt));   // Beacon floats down slowly
        if (wantAttack) this.startAttack(0);
        else if (wantDash && this.dashCool <= 0) {
          this.state = 'dash'; this.dashT = 0.17; this.dashCool = 0.55; this.invuln = Math.max(this.invuln, 0.2);
          b.setAllowGravity(false); this.onDash?.();
        } else if (wantMagic && this.meter >= 100) {
          this.state = 'magic'; this.magicT = 0; this.meter = 0; this.invuln = Math.max(this.invuln, 0.6);
          this.onMagic?.();
        }
      }
    }
    if (this.drift && this.grounded && this.state === 'free') this.sprite.x += this.drift * dt;
    this.view(dt);
  }

  /** Put the puppet where the body is and pose it. */
  private view(dt: number): void {
    const p = this.puppet, r = this.rig, b = this.body;
    p.setAlpha(this.invuln > 0 && this.state !== 'asleep' && Math.floor(this.invuln * 14) % 2 === 0 ? 0.5 : 1);
    p.apply(r.pose({
      state: this.state, time: this.time, stage: this.attackStage, attackT: this.state === 'magic' ? this.magicT : this.attackT,
      vx: Math.abs(b.velocity.x), vy: b.velocity.y, grounded: this.grounded,
    }));
    const s = r.scale, sq = this.squash;
    p.root.setPosition(Math.round(this.x), Math.round(this.y) + (this.state === 'asleep' ? 2 : 0));
    p.root.setScale(this.facing * s * (1 - sq * 0.6), s * (1 + sq));
    p.root.setAngle(this.state === 'asleep' ? 78 * this.facing : 0);
    // the shadow stays on the floor under the hero and shrinks as it rises
    const h = Math.max(0, this.groundY - this.y);
    this.shadow.setPosition(this.x, this.groundY + 2).setScale(Math.max(0.35, 1 - h / 380)).setAlpha(Math.max(0.2, 0.8 - h / 420));
    void dt;
  }
  destroy(): void { this.puppet.destroy(); this.shadow.destroy(); this.sprite.destroy(); }
}
