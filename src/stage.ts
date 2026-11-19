/**
 * The prototype stage: one long street of the first area ("שוק הצעקות"): ground with two pits, one-way platforms, checkpoints,
 * twin walkers, sleeping imps, duplicate frames, coins, one hidden knowledge card, and the locked lesson portal at the end.
 */
import * as Phaser from 'phaser';
import { makeTextures } from './art';
import { Enemy, type Kind } from './enemies';
import { Hero } from './hero';
import { combo, hudTick, hudUpdate, showGate, toast } from './hud';
import { clearInput, inp, take } from './input';
import { sfx } from './sfx';

export const W = 4400, H = 540, GROUND = 480;
const SAVE = 'switchkeeper.proto.v1';

const GROUNDS: [number, number][] = [[0, 1500], [1640, 2900], [3050, 4400]];
const PLATS: [number, number, number][] = [        // x, top y, width
  [320, 385, 170], [580, 320, 150], [860, 385, 150],
  [1700, 390, 120], [1790, 310, 110], [1860, 235, 120],           // the way up to the hidden card
  [2060, 395, 170], [2320, 330, 150], [2580, 395, 160],
  [3180, 390, 150], [3420, 320, 140], [3700, 390, 160],
];
const CHECKPOINTS = [1100, 2450, 3250];
const ENEMIES: ([Kind, number, number] | [Kind, number, number, number] | [Kind, number, number, number, 1 | -1])[] = [   // kind, x, y, range, start direction
  ['walker', 1000, GROUND, 150, 1], ['walker', 1260, GROUND, 150, -1],          // the Collision Twins
  ['imp', 700, 250], ['imp', 2200, 250], ['imp', 2330, 280], ['imp', 3500, 240],
  ['dup', 1900, GROUND, 120], ['dup', 2700, GROUND, 160], ['dup', 3400, GROUND, 140],
  ['walker', 3620, GROUND, 160, -1], ['walker', 3860, GROUND, 160, 1],
];
const CARD_AT: [number, number] = [1920, 195];

export class Stage extends Phaser.Scene {
  hero!: Hero;
  enemies: Enemy[] = [];
  platforms!: Phaser.Physics.Arcade.StaticGroup;
  private oneWay: Phaser.Physics.Arcade.Sprite[] = [];
  private bitsLeft: Phaser.Physics.Arcade.Sprite[] = [];
  private card!: Phaser.Physics.Arcade.Sprite | null;
  private portal!: Phaser.GameObjects.Image;
  private sparks!: Phaser.GameObjects.Particles.ParticleEmitter;
  private far!: Phaser.GameObjects.TileSprite; private near!: Phaser.GameObjects.TileSprite;
  private checkpoint = 0;
  private flags: Phaser.GameObjects.Image[] = [];
  private asleepT = 0;
  private paused = false;
  private clock = 0; private kills = 0; private bitsGot = 0;
  private cards: string[] = [];
  private split = new WeakSet<Enemy>();
  private landNoise = 0;

  constructor() { super('stage'); }

  create(): void {
    makeTextures(this);
    try { this.cards = (JSON.parse(localStorage.getItem(SAVE) ?? '{}') as { cards?: string[] }).cards ?? []; } catch { /* no storage */ }
    this.physics.world.setBounds(0, 0, W, 1000);
    this.physics.world.gravity.y = 1750;
    this.cameras.main.setBackgroundColor('#241f38').setBounds(0, 0, W, H);

    this.far = this.add.tileSprite(0, 0, 960, 540, 'holesFar').setOrigin(0).setScrollFactor(0).setDepth(-3);
    this.near = this.add.tileSprite(0, 0, 960, 540, 'holes').setOrigin(0).setScrollFactor(0).setDepth(-2).setAlpha(0.55);

    this.platforms = this.physics.add.staticGroup();
    for (const [a, b] of GROUNDS) {
      this.addBlock(a, GROUND, b - a, H - GROUND + 60, 0x4a4170, false);
    }
    for (const [x, y, w] of PLATS) this.addBlock(x, y, w, 18, 0x6a5fb0, true);

    CHECKPOINTS.forEach((x) => this.flags.push(this.add.image(x, GROUND, 'flag').setOrigin(0.5, 1).setDepth(2).setAlpha(0.5)));
    this.portal = this.add.image(4240, GROUND, 'portal').setOrigin(0.5, 1).setDepth(2);
    this.add.triangle(4240, GROUND - 175, 0, 0, 30, 0, 15, 22, 0xffd23f).setOrigin(0.5).setDepth(3);

    this.hero = new Hero(this, 120, 400);
    this.hero.onJump = () => sfx.jump();
    this.hero.onSwing = (n) => { sfx.swing(n); this.noise(this.hero.x, 360); };
    this.hero.onMagic = () => this.magic();
    this.physics.add.collider(this.hero.sprite, this.platforms, undefined, (_h, p) => !((p as Phaser.Physics.Arcade.Sprite).getData('oneway') && this.hero.dropping));

    for (const en of ENEMIES) this.spawn(en[0], en[1], en[2], en[3] ?? 120, en[4]);

    this.sparks = this.add.particles(0, 0, 'spark', { speed: { min: 80, max: 300 }, lifespan: 420, scale: { start: 1.2, end: 0 }, gravityY: 500, emitting: false, tint: [0xffffff, 0xffd23f, 0x9b7bff] }).setDepth(20);

    // coins in the street and on the platforms
    const coinSpots: [number, number][] = [];
    for (let x = 250; x < 4300; x += 130) { if (GROUNDS.some(([a, b]) => x > a + 30 && x < b - 30)) coinSpots.push([x, GROUND - 24]); }
    for (const [x, y, w] of PLATS) for (let k = 0; k < 3; k++) coinSpots.push([x + w * (0.25 + k * 0.25), y - 24]);
    for (const [x, y] of coinSpots) this.bitsLeft.push(this.physics.add.sprite(x, y, 'bit').setDepth(5).setImmovable(true));
    for (const c of this.bitsLeft) (c.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // the hidden card (only if it is not in the album yet)
    this.card = null;
    if (!this.cards.includes('mac')) {
      this.card = this.physics.add.sprite(CARD_AT[0], CARD_AT[1], 'card').setDepth(6);
      (this.card.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
      this.tweens.add({ targets: this.card, y: CARD_AT[1] - 8, yoyo: true, repeat: -1, duration: 700, ease: 'sine.inOut' });
    }

    this.cameras.main.startFollow(this.hero.sprite, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(60, 40);
    (window as unknown as { __sk: unknown }).__sk = { scene: this, hero: this.hero, enemies: this.enemies, inp };
    this.input.once('pointerdown', () => sfx.jump);
  }

  private addBlock(x: number, y: number, w: number, h: number, color: number, oneWay: boolean): void {
    const p = this.platforms.create(x, y, 'spark') as Phaser.Physics.Arcade.Sprite;
    p.setOrigin(0, 0).setDisplaySize(w, h).setTint(color).refreshBody().setDepth(1);
    if (oneWay) {
      p.setData('oneway', true);
      const b = p.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false;
      this.oneWay.push(p);
    }
    this.add.rectangle(x, y, w, 5, 0xffffff, 0.22).setOrigin(0, 0).setDepth(2);       // the lit edge
  }

  private spawn(kind: Kind, x: number, y: number, range: number, dir?: 1 | -1, copy = false): Enemy {
    const e = new Enemy(this, kind, x, y, range, copy);
    if (dir) e.dir = dir;
    if (kind !== 'imp') this.physics.add.collider(e.sprite, this.platforms);
    this.enemies.push(e);
    return e;
  }

  /** Noise wakes sleeping imps nearby: every imp in range wakes at once. */
  private noise(x: number, range: number): void {
    for (const e of this.enemies) if (e.alive && e.asleep && Math.abs(e.x - x) < range) { e.wake(); this.sparks.explode(5, e.x, e.y); }
  }

  private magic(): void {
    sfx.magic();
    const h = this.hero;
    this.cameras.main.shake(260, 0.012);
    const ring = this.add.circle(h.x, h.y - 30, 20, 0xffffff, 0).setStrokeStyle(8, 0xffd23f).setDepth(15);
    this.tweens.add({ targets: ring, radius: 380, alpha: 0, duration: 420, onComplete: () => ring.destroy() });
    this.noise(h.x, 900);
    for (const e of this.enemies) {
      if (!e.alive || Math.hypot(e.x - h.x, e.y - h.y) > 380) continue;
      this.damage(e, 3, 640);
    }
  }

  /** Damage an enemy and handle what happens next (split, defeat, rewards). */
  private damage(e: Enemy, dmg: number, push: number): void {
    const dead = e.hit(dmg, this.hero.x, push);
    sfx.hit();
    this.sparks.explode(6, e.x, e.y - 16);
    if (dead) this.defeat(e);
    else if (e.kind === 'dup' && !e.isCopy && !this.split.has(e)) {
      this.split.add(e);
      const c = this.spawn('dup', e.x - Math.sign(this.hero.x - e.x || 1) * 30, e.y, 120, undefined, true);
      c.body.setVelocity(-Math.sign(this.hero.x - e.x || 1) * 220, -260);
      sfx.jam();
    }
  }

  private defeat(e: Enemy): void {
    this.kills++;
    sfx.kill();
    this.sparks.explode(16, e.x, e.y - 16);
    e.sprite.destroy(); e.label?.destroy();
    if (Math.random() < 0.7) {
      const c = this.physics.add.sprite(e.x, e.y - 20, 'bit').setDepth(5);
      (c.body as Phaser.Physics.Arcade.Body).setVelocity((Math.random() - 0.5) * 160, -280);
      this.physics.add.collider(c, this.platforms);
      this.bitsLeft.push(c);
    }
    this.hero.meter = Math.min(100, this.hero.meter + 5);
    if (this.hero.addXp(e.kind === 'dup' ? (e.isCopy ? 5 : 12) : 10)) { sfx.level(); toast('רמה ' + this.hero.level + '!', true); }
  }

  update(_t: number, dtMs: number): void {
    const dt = Math.min(0.05, dtMs / 1000);
    const h = this.hero;
    this.far.tilePositionX = this.cameras.main.scrollX * 0.15;
    this.near.tilePositionX = this.cameras.main.scrollX * 0.4;
    hudTick(dt);
    if (this.paused) { clearInput(); return; }
    this.clock += dt;

    // standing on a one-way platform? (so that down + jump can drop through)
    h.onOneWay = this.oneWay.some((p) => Math.abs(h.y - p.y) < 6 && h.x > p.x - 8 && h.x < p.x + p.displayWidth + 8);
    const wasGrounded = h.grounded, vy = h.body.velocity.y;
    h.update(dt);
    if (!wasGrounded && h.grounded && vy > 520) this.noise(h.x, 320);            // a hard landing is noisy

    for (const e of this.enemies) e.update(dt, h, this.enemies);
    for (let i = this.enemies.length - 1; i >= 0; i--) if (!this.enemies[i].alive) this.enemies.splice(i, 1);

    // the swing
    const hb = h.hitbox();
    if (hb) {
      for (const e of this.enemies) {
        if (h.hitSet.has(e) || !Phaser.Geom.Intersects.RectangleToRectangle(hb, e.rect())) continue;
        h.hitSet.add(e);
        h.landed();
        combo(h.comboCount);
        this.damage(e, h.damage, h.push);
        this.cameras.main.shake(70, 0.004);
      }
    }
    // contact damage
    if (h.state !== 'dash' && h.state !== 'asleep') {
      const r = new Phaser.Geom.Rectangle(h.body.x, h.body.y, h.body.width, h.body.height);
      for (const e of this.enemies) {
        if (e.asleep || e.jam > 0 || e.stun > 0.1 || e.windT > 0) continue;
        if (Phaser.Geom.Intersects.RectangleToRectangle(r, e.rect()) && h.hurt(e.x)) { sfx.hurt(); this.cameras.main.shake(120, 0.008); break; }
      }
    }
    // bits and the card
    for (const c of this.bitsLeft) {
      if (!c.active) continue;
      if (Math.abs(c.x - h.x) < 26 && Math.abs(c.y - (h.y - 28)) < 40) { c.destroy(); h.bits++; this.bitsGot++; h.meter = Math.min(100, h.meter + 1.5); sfx.bit(); }
    }
    this.bitsLeft = this.bitsLeft.filter((c) => c.active);
    if (this.card && Math.abs(this.card.x - h.x) < 34 && Math.abs(this.card.y - (h.y - 30)) < 44) {
      this.card.destroy(); this.card = null; this.cards.push('mac'); sfx.card();
      toast('קלף ידע חדש: כתובת MAC (48 ביט)', true);
      this.sparks.explode(18, h.x, h.y - 40);
      try { localStorage.setItem(SAVE, JSON.stringify({ cards: this.cards })); } catch { /* no storage */ }
    }
    // checkpoints
    CHECKPOINTS.forEach((x, i) => { if (h.x > x && i + 1 > this.checkpoint) { this.checkpoint = i + 1; this.flags[i].setAlpha(1); toast('נקודת שמירה', true); } });
    // falling into a pit, or falling asleep
    if (h.y > 640 && h.state !== 'asleep') {
      if (--h.hp <= 0) { h.hp = 0; h.state = 'asleep'; } else { this.respawn(); toast('נפלת לבור! חוזרים לנקודת השמירה', false); sfx.hurt(); }
    }
    if (h.state === 'asleep') {
      this.asleepT += dt;
      if (this.asleepT === dt) toast('הגיבור נרדם... חוזרים לנקודת השמירה', false);
      if (this.asleepT > 1.4) { this.asleepT = 0; this.respawn(); }
    }
    // the portal: the lesson gate
    if (Math.abs(h.x - this.portal.x) < 70 && h.grounded) {
      if (take('upP')) this.openGate();
    } else inp.upP = false;
    hudUpdate({ hp: h.hp, maxHp: h.maxHp, meter: h.meter, xp: h.xp, xpNext: h.xpNext, level: h.level, bits: h.bits });
  }

  private respawn(): void {
    const x = this.checkpoint === 0 ? 120 : CHECKPOINTS[this.checkpoint - 1] - 30;
    this.hero.respawn(x, 400);
  }

  private openGate(): void {
    this.paused = true;
    this.physics.world.pause();
    const s = Math.round(this.clock);
    showGate('כאן יפתח שיעור 14: כתובת MAC. בגרסה המלאה צריך ללמוד, לעבור בוחן ולעבור את משחק-הקטן כדי שהשער ייפתח.',
      'זמן ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + ' · ' + this.kills + ' אויבים נוטרלו · ' + this.bitsGot + ' ביטים · ' + this.cards.length + ' קלפים',
      () => { this.paused = false; this.physics.world.resume(); });
  }
}
