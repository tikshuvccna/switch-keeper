/**
 * The hero (prototype: "בומפר", the close-range keeper): run, variable jump with coyote time and a jump buffer,
 * a three-hit combo, a dash with invulnerability frames, a magic shockwave that needs a full meter, drop-through platforms.
 */
import * as Phaser from 'phaser';
import { inp, take } from './input';

export const SPEED = 230;
const ACCEL = 2600;
const JUMP_V = -690;
const COMBO = [
  { time: 0.24, hit: [0.07, 0.17], dmg: 1, lunge: 150, push: 220, reach: 62 },
  { time: 0.24, hit: [0.07, 0.17], dmg: 1, lunge: 150, push: 240, reach: 62 },
  { time: 0.36, hit: [0.1, 0.24], dmg: 2, lunge: 260, push: 520, reach: 78 },
];

export class Hero {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  hp = 5; maxHp = 5; meter = 0; xp = 0; level = 1; bits = 0;
  facing: 1 | -1 = 1;
  invuln = 0;
  /** What the hero is doing now. */
  state: 'free' | 'attack' | 'dash' | 'magic' | 'hurt' | 'asleep' = 'free';
  attackStage = -1;                // index in COMBO while attacking
  attackT = 0;
  comboCount = 0;
  private comboWindow = 0;
  private queued = false;
  private coyote = 0; private buffer = 0;
  private dashT = 0; private dashCool = 0;
  private dropT = 0;
  private hurtT = 0;
  private magicT = 0;
  /** Enemies already hit by the current swing. */
  readonly hitSet = new Set<unknown>();
  readonly slash: Phaser.GameObjects.Sprite;
  onMagic?: () => void;
  onJump?: () => void;
  onSwing?: (stage: number) => void;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, 'hero');
    this.sprite.setOrigin(0.5, 1).setCollideWorldBounds(true).setDepth(10);
    const b = this.sprite.body as Phaser.Physics.Arcade.Body;
    b.setSize(26, 56).setOffset(7, 8);
    b.setMaxVelocity(900, 1100);
    this.slash = scene.add.sprite(x, y, 'slash').setDepth(11).setVisible(false).setAlpha(0.9);
  }
  get body(): Phaser.Physics.Arcade.Body { return this.sprite.body as Phaser.Physics.Arcade.Body; }
  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }
  get dropping(): boolean { return this.dropT > 0; }
  get xpNext(): number { return 40 + this.level * 30; }
  get grounded(): boolean { return this.body.blocked.down || this.body.touching.down; }

  /** The hitbox of the current swing in world coordinates, or null when no hit is active. */
  hitbox(): Phaser.Geom.Rectangle | null {
    if (this.state !== 'attack') return null;
    const c = COMBO[this.attackStage];
    if (this.attackT < c.hit[0] || this.attackT > c.hit[1]) return null;
    const w = c.reach, h = 56, x = this.facing > 0 ? this.x + 8 : this.x - 8 - w;
    return new Phaser.Geom.Rectangle(x, this.y - 62, w, h);
  }
  get damage(): number { return COMBO[Math.max(0, this.attackStage)].dmg + (this.level >= 3 ? 1 : 0) * (this.attackStage === 2 ? 1 : 0); }
  get push(): number { return COMBO[Math.max(0, this.attackStage)].push; }

  /** A hit landed: fills the magic meter and counts the combo. */
  landed(): void { this.meter = Math.min(100, this.meter + 9); this.comboCount++; }
  addXp(n: number): boolean {
    this.xp += n;
    if (this.xp >= this.xpNext) { this.xp -= this.xpNext; this.level++; this.maxHp = Math.min(9, this.maxHp + (this.level % 2 === 0 ? 1 : 0)); this.hp = this.maxHp; return true; }
    return false;
  }

  hurt(from: number, dmg = 1): boolean {
    if (this.invuln > 0 || this.state === 'asleep' || this.state === 'magic') return false;
    this.hp -= dmg; this.invuln = 1.1; this.comboCount = 0;
    this.state = 'hurt'; this.hurtT = 0.28; this.slash.setVisible(false); this.attackStage = -1;
    const dir = this.x >= from ? 1 : -1;
    this.body.setVelocity(dir * 280, -300);
    if (this.hp <= 0) { this.hp = 0; this.state = 'asleep'; }
    return true;
  }

  respawn(x: number, y: number): void {
    this.hp = this.maxHp; this.invuln = 1.5; this.state = 'free'; this.meter = Math.min(this.meter, 50); this.comboCount = 0;
    this.sprite.setPosition(x, y); this.body.setVelocity(0, 0); this.body.setAllowGravity(true);
  }

  private startAttack(stage: number): void {
    this.state = 'attack'; this.attackStage = stage; this.attackT = 0; this.queued = false; this.hitSet.clear();
    this.body.setVelocityX(this.facing * COMBO[stage].lunge);
    this.slash.setVisible(true).setFlipX(this.facing < 0).setScale(stage === 2 ? 1.35 : 1);
    this.onSwing?.(stage);
  }

  update(dt: number): void {
    const sp = this.sprite, b = this.body;
    this.invuln = Math.max(0, this.invuln - dt);
    this.dashCool = Math.max(0, this.dashCool - dt);
    this.dropT = Math.max(0, this.dropT - dt);
    this.comboWindow = Math.max(0, this.comboWindow - dt);
    if (this.comboWindow === 0 && this.state !== 'attack') this.comboCount = 0;
    const grounded = this.grounded;
    this.coyote = grounded ? 0.1 : Math.max(0, this.coyote - dt);
    if (take('jumpP')) this.buffer = 0.12; else this.buffer = Math.max(0, this.buffer - dt);
    const wantAttack = take('attackP'), wantDash = take('dashP'), wantMagic = take('magicP');
    sp.setAlpha(this.invuln > 0 && Math.floor(this.invuln * 14) % 2 === 0 ? 0.45 : 1);

    if (this.state === 'asleep') { this.body.setVelocityX(0); sp.setAngle(90).setAlpha(0.8); return; }
    sp.setAngle(0);

    switch (this.state) {
      case 'hurt':
        this.hurtT -= dt;
        if (this.hurtT <= 0) this.state = 'free';
        break;
      case 'dash':
        this.dashT -= dt;
        b.setVelocity(this.facing * 640, 0);
        if (this.dashT <= 0) { this.state = 'free'; b.setAllowGravity(true); b.setVelocityX(this.facing * 260); }
        break;
      case 'magic':
        this.magicT -= dt;
        b.setVelocityX(0);
        if (this.magicT <= 0) this.state = 'free';
        break;
      case 'attack': {
        const c = COMBO[this.attackStage];
        this.attackT += dt;
        b.setVelocityX(this.facing * c.lunge * Math.max(0, 1 - this.attackT / c.time));
        if (wantAttack) this.queued = true;
        if (this.attackT >= c.time) {
          this.slash.setVisible(false);
          if (this.queued && this.attackStage < 2) this.startAttack(this.attackStage + 1);
          else { this.state = 'free'; this.comboWindow = 0.6; if (this.attackStage === 2) this.comboCount = 0; this.attackStage = -1; }
        }
        break;
      }
      default: {
        let dir = 0;
        if (inp.left) dir -= 1;
        if (inp.right) dir += 1;
        if (dir !== 0) this.facing = dir > 0 ? 1 : -1;
        const target = dir * SPEED, v = b.velocity.x, a = ACCEL * dt * (grounded ? 1 : 0.55);
        b.setVelocityX(v < target ? Math.min(target, v + a) : Math.max(target, v - a));
        if (dir === 0 && grounded) b.setVelocityX(Math.abs(v) < 30 ? 0 : v * 0.8);
        if (this.buffer > 0 && this.coyote > 0) {
          if (inp.down && this.onOneWay) { this.dropT = 0.28; this.buffer = 0; this.coyote = 0; }
          else { b.setVelocityY(JUMP_V); this.buffer = 0; this.coyote = 0; this.onJump?.(); }
        }
        if (!inp.jumpHeld && b.velocity.y < -200) b.setVelocityY(b.velocity.y * 0.6);     // a short hop when the button is released
        if (wantAttack) this.startAttack(0);
        else if (wantDash && this.dashCool <= 0) {
          this.state = 'dash'; this.dashT = 0.17; this.dashCool = 0.55; this.invuln = Math.max(this.invuln, 0.2);
          b.setAllowGravity(false); this.slash.setVisible(false);
        } else if (wantMagic && this.meter >= 100) {
          this.state = 'magic'; this.magicT = 0.42; this.meter = 0; this.invuln = Math.max(this.invuln, 0.5);
          this.onMagic?.();
        }
      }
    }
    sp.setFlipX(this.facing < 0);
    if (this.slash.visible) this.slash.setPosition(this.x + this.facing * 40, this.y - 36);
  }
  /** Set by the stage: is the hero standing on a one-way platform right now? */
  onOneWay = false;
}
