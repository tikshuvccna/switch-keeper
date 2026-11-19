/**
 * The three prototype enemies, one for each idea of the first area:
 *  - Collision Twin ("walker"): two of them that run into each other jam, and a jammed enemy takes double damage.
 *  - Echo Imp: sleeps until there is noise (swings, magic, hard landings), then every imp in range wakes at once.
 *  - Duplicate Frame: splits into a smaller copy the first time it is hit.
 * They never kill: a "defeated" enemy is disconnected and fades into sparks.
 */
import * as Phaser from 'phaser';
import type { Hero } from './hero';

export type Kind = 'walker' | 'imp' | 'dup';
export class Enemy {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  kind: Kind;
  hp: number;
  alive = true;
  /** Jammed (walkers): stunned and fragile. */
  jam = 0;
  stun = 0;
  /** Ground enemies wind up (harmless, flashing) before a short lunge, so the player has time to strike first. */
  windT = 0; private lungeT = 0; private lungeCool = 0;
  asleep = false;
  isCopy = false;
  dir: 1 | -1 = 1;
  private t = Math.random() * 6;
  private dive = 0; private diveCool = 2 + Math.random() * 2;
  private home: number; private range: number;
  private baseY: number;
  readonly label?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, kind: Kind, x: number, y: number, range = 120, copy = false) {
    this.kind = kind; this.isCopy = copy; this.home = x; this.range = range; this.baseY = y;
    const key = kind === 'walker' ? 'walker' : kind === 'imp' ? 'imp' : 'dup';
    this.sprite = scene.physics.add.sprite(x, y, key).setOrigin(0.5, 1).setDepth(8);
    const b = this.sprite.body as Phaser.Physics.Arcade.Body;
    if (kind === 'walker') { b.setSize(36, 36).setOffset(4, 6); this.hp = 3; }
    else if (kind === 'imp') { b.setSize(28, 28).setOffset(5, 5); b.setAllowGravity(false); this.hp = 2; this.asleep = true; this.sprite.setOrigin(0.5, 0.5); }
    else { b.setSize(32, 32).setOffset(5, 8); this.hp = copy ? 1 : 3; if (copy) this.sprite.setScale(0.75); }
    this.dir = Math.random() < 0.5 ? 1 : -1;
    if (kind === 'imp') this.label = scene.add.text(x, y - 26, 'z z', { fontSize: '16px', color: '#c8bdff' }).setOrigin(0.5).setDepth(9);
  }
  get body(): Phaser.Physics.Arcade.Body { return this.sprite.body as Phaser.Physics.Arcade.Body; }
  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }
  /** The bounding box of the enemy for hit tests. */
  rect(): Phaser.Geom.Rectangle { const b = this.body; return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height); }

  wake(): void { if (this.asleep) { this.asleep = false; this.label?.setVisible(false); } }

  /** Damage the enemy. Returns true when it was disconnected. */
  hit(dmg: number, fromX: number, push: number): boolean {
    this.wake();
    const d = this.jam > 0 ? dmg * 2 : dmg;
    this.hp -= d;
    this.stun = 0.25; this.windT = 0; this.lungeT = 0; this.lungeCool = 0.5; this.sprite.clearTint();
    const dir = this.x >= fromX ? 1 : -1;
    this.body.setVelocity(dir * push, this.kind === 'imp' ? -80 : -170);
    this.sprite.setTintFill(0xffffff);
    this.sprite.scene.time.delayedCall(70, () => { if (this.alive) this.sprite.clearTint(); });
    if (this.hp <= 0) { this.alive = false; return true; }
    return false;
  }

  update(dt: number, hero: Hero, others: Enemy[]): void {
    if (!this.alive) return;
    const b = this.body, sp = this.sprite;
    this.t += dt;
    this.stun = Math.max(0, this.stun - dt);
    if (this.label) this.label.setPosition(this.x, this.y - 26);
    if (this.jam > 0) {
      this.jam -= dt;
      b.setVelocityX(b.velocity.x * 0.9);
      sp.setTexture('walkerJam');
      if (this.jam <= 0) sp.setTexture('walker');
      return;
    }
    if (this.stun > 0) { b.setVelocityX(b.velocity.x * 0.92); return; }
    const dx = hero.x - this.x, near = Math.abs(dx) < 300 && Math.abs(hero.y - this.y) < 120;

    if (this.kind === 'walker' || this.kind === 'dup') {
      const speed = this.kind === 'walker' ? 70 : 52, chase = this.kind === 'walker' ? 120 : 80;
      this.lungeCool = Math.max(0, this.lungeCool - dt);
      if (this.windT > 0) {
        this.windT -= dt; b.setVelocityX(0);
        sp.setTint(Math.floor(this.windT * 18) % 2 ? 0xffffaa : 0xffffff);
        if (this.windT <= 0) { sp.clearTint(); this.lungeT = 0.22; }
        return;
      }
      if (this.lungeT > 0) { this.lungeT -= dt; b.setVelocityX(this.dir * 330); if (this.lungeT <= 0) this.lungeCool = 1.1; return; }
      if (near && Math.abs(dx) < 105 && this.lungeCool <= 0 && hero.state !== 'asleep') { this.windT = 0.5; this.dir = dx > 0 ? 1 : -1; sp.setFlipX(this.dir < 0); return; }
      if (near && hero.state !== 'asleep') { this.dir = dx > 0 ? 1 : -1; b.setVelocityX(this.dir * chase); }
      else {
        if (this.x > this.home + this.range) this.dir = -1;
        if (this.x < this.home - this.range) this.dir = 1;
        b.setVelocityX(this.dir * speed);
      }
      sp.setFlipX(this.dir < 0);
      if (this.kind === 'walker') {
        // the Collision Twin rule: two walkers that meet jam each other
        for (const o of others) {
          if (o === this || o.kind !== 'walker' || !o.alive || o.jam > 0) continue;
          if (Math.abs(o.x - this.x) < 34 && Math.abs(o.y - this.y) < 20 && Math.sign(o.x - this.x) === this.dir) {
            this.jam = o.jam = 2.6;
            this.body.setVelocityX(-this.dir * 90); o.body.setVelocityX(this.dir * 90);
          }
        }
      }
    } else if (!this.asleep) {          // imp
      this.diveCool -= dt;
      if (this.dive > 0) {
        this.dive -= dt;
        b.setVelocity(Math.sign(dx || 1) * 230, 260 * (this.dive > 0.3 ? 1 : -0.8));
        if (this.dive <= 0) this.diveCool = 2.2 + Math.random() * 1.6;
      } else {
        const tx = hero.x + Math.sin(this.t * 1.3) * 140, ty = hero.y - 130 + Math.sin(this.t * 2.1) * 22;
        b.setVelocity(Phaser.Math.Clamp((tx - this.x) * 1.8, -150, 150), Phaser.Math.Clamp((ty - this.y) * 2.2, -130, 130));
        if (this.diveCool <= 0 && Math.abs(dx) < 260) this.dive = 0.62;
      }
      sp.setFlipX(dx < 0);
    } else {
      b.setVelocity(0, 0);
      sp.y = this.baseY + Math.sin(this.t * 2) * 3;
    }
  }
}
