/**
 * A playable stage of an area: generated layout, paper-cut world art, the hero, the enemies, pickups, checkpoints and the exit.
 */
import * as Phaser from 'phaser';
import { Backdrop, groundTex, pickupTex, platformTex, propTex, put, THEMES, VIEW_H, VIEW_W } from '../art/world';
import { combo, hudTick, hudUpdate, toast } from '../hud';
import { clearInput, inp, take } from '../input';
import { sfx } from '../sfx';
import { Boss, type Hazard } from './boss';
import { Enemy } from './enemy';
import { Fx } from './fx';
import { Hero } from './hero';
import { GROUND_Y, layoutFor, stageById, type Layout, type StageDef } from './levels';
import { flow } from './flow';
import { bonuses } from './progress';
import { save, store } from './save';

export class Stage extends Phaser.Scene {
  hero!: Hero;
  enemies: Enemy[] = [];
  def!: StageDef;
  layout!: Layout;
  fx!: Fx;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private oneWay: Phaser.Physics.Arcade.Sprite[] = [];
  private bits: { s: Phaser.GameObjects.Image; x: number; y: number; ph: number; fall?: Phaser.Physics.Arcade.Sprite }[] = [];
  private hearts: Phaser.GameObjects.Image[] = [];
  private card: Phaser.GameObjects.Image | null = null;
  private exit!: Phaser.GameObjects.Image;
  private flags: Phaser.GameObjects.Image[] = [];
  private backdrop!: Backdrop;
  private checkpoint = -1;
  private asleepT = 0;
  private paused = false;
  private hitstop = 0;
  private clock = 0; private kills = 0; private bitsGot = 0; private falls = 0; private cardGot = false;
  private storm = 0;
  private bossHook: ((dt: number) => void) | null = null;
  boss: Boss | null = null;
  private hazards: Hazard[] = [];
  private arena: { x0: number; x1: number; locked: boolean } | null = null;
  private bossBar: HTMLElement | null = null;

  constructor() { super('stage'); }

  init(data: { id?: string }): void { this.def = stageById(data.id ?? new URLSearchParams(location.search).get('stage') ?? 'market.1'); }

  create(): void {
    this.enemies = []; this.bits = []; this.hearts = []; this.oneWay = []; this.flags = []; this.checkpoint = -1; this.asleepT = 0; this.paused = false;
    this.boss = null; this.hazards = []; this.arena = null;
    this.clock = 0; this.kills = 0; this.bitsGot = 0; this.falls = 0; this.cardGot = false; this.card = null; this.hitstop = 0; this.storm = 0;
    const th = THEMES[this.def.area.theme];
    const L = (this.layout = layoutFor(this.def));
    pickupTex(this);
    this.physics.world.setBounds(0, 0, L.length, 1000);
    this.physics.world.gravity.y = 1750;
    this.cameras.main.setBounds(0, 0, L.length, VIEW_H);
    this.backdrop = new Backdrop(this, th);
    this.fx = new Fx(this);

    // ground and platforms
    this.platforms = this.physics.add.staticGroup();
    for (const [a, b] of L.grounds) {
      put(this, a, GROUND_Y, groundTex(this, th, Math.round(b - a)), 0, 0).setDepth(2);
      const g = this.platforms.create(a, GROUND_Y, 'spark') as Phaser.Physics.Arcade.Sprite;
      g.setOrigin(0, 0).setDisplaySize(b - a, 70).setVisible(false).refreshBody();
    }
    L.plats.forEach((p, i) => {
      put(this, p.x, p.y - 4, platformTex(this, th, p.w, p.style, i), 0, 0).setDepth(2);
      const s = this.platforms.create(p.x, p.y, 'spark') as Phaser.Physics.Arcade.Sprite;
      s.setOrigin(0, 0).setDisplaySize(p.w, 14).setVisible(false).refreshBody().setData('oneway', true);
      const b = s.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false;
      this.oneWay.push(s);
    });
    // props: far ones behind the hero, lamps in the front layer, darker and bigger
    for (const p of L.props) {
      if (p.id === 'bunting') { put(this, p.x, p.y, propTex(this, th, 'bunting')).setDepth(1).setScale(1.6, 1.2); continue; }
      const im = put(this, p.x, p.y, propTex(this, th, p.id), 0.5, 1).setDepth(p.id === 'lamp' ? 3 : 3);
      if (p.id === 'lamp' && this.def.n % 2 === 0) im.setAlpha(0.95);
    }
    L.cps.forEach((x) => this.flags.push(put(this, x, GROUND_Y, 'flagpost', 0.4, 1).setDepth(3).setAlpha(0.6)));
    this.exit = put(this, L.exit.x, GROUND_Y, L.exit.kind === 'door' ? 'portal' : 'portal', 0.5, 1).setDepth(3);
    if (L.exit.kind === 'door') this.exit.setTint(0x9be7d6);

    // hero and enemies
    this.hero = new Hero(this, 120, GROUND_Y - 2, save.hero);
    this.applyProgress();
    const h = this.hero;
    h.onJump = () => { sfx.jump(); this.fx.puff(h.x, h.y, 3); };
    h.onLand = () => { this.fx.puff(h.x - 8, h.y, 3); this.fx.puff(h.x + 8, h.y, 3); this.noise(h.x, 300); };
    h.onDash = () => { sfx.dash(); this.fx.puff(h.x, h.y - 10, 5); };
    h.onSwing = (n) => {
      sfx.swing(n);
      const hb = h.def.combo[n];
      this.fx.slash(h.x + h.facing * (hb.reach / 2), h.y - hb.h / 2 - 6, h.facing, h.def.slash, n, hb.reach / 96);
      this.noise(h.x, 360);
    };
    h.onMagic = () => this.magic();
    this.physics.add.collider(h.sprite, this.platforms, undefined, (_h, p) => !((p as Phaser.Physics.Arcade.Sprite).getData('oneway') && h.dropping));
    for (const s of L.spawns) this.spawn(s.kind, s.x, s.y, s.range ?? 110);

    // pickups
    for (const [x, y] of L.bits) this.addBit(x, y);
    for (const [x, y] of L.hearts) { const im = put(this, x, y, 'heart').setDepth(5); this.tweens.add({ targets: im, y: y - 6, yoyo: true, repeat: -1, duration: 600, ease: 'sine.inOut' }); this.hearts.push(im); }
    if (L.card && !save.cards.includes(this.def.area.id + '.' + this.def.n)) {
      this.card = put(this, L.card[0], L.card[1], 'card').setDepth(6);
      this.tweens.add({ targets: this.card, y: L.card[1] - 8, yoyo: true, repeat: -1, duration: 700, ease: 'sine.inOut' });
    }
    // overlays: the vignette, and floating dust specks in the air
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(60);
    this.add.particles(0, 0, 'scrap', { x: { min: 0, max: VIEW_W }, y: { min: 0, max: VIEW_H }, lifespan: 6000, speedX: { min: -12, max: 6 }, speedY: { min: -4, max: 10 }, scale: { start: 0.5, end: 0.2 }, alpha: { start: 0.35, end: 0 }, quantity: 1, frequency: 450, tint: 0xfff0c8 }).setScrollFactor(0).setDepth(55);

    this.cameras.main.startFollow(h.sprite, true, 0.1, 0.12);
    this.cameras.main.setDeadzone(80, 40);
    this.cameras.main.setFollowOffset(0, 40);
    if (this.def.boss) this.setupBoss();
    this.events.on('jam', (x: number, y: number) => { sfx.jam(); this.fx.hit(x, y, 0xffe45c); this.fx.text(x, y - 20, 'שיבוש!', '#ffe45c', 26); });
    (window as unknown as { __sk: unknown }).__sk = { scene: this, hero: h, enemies: this.enemies, inp, save };
    flow.onStage(this);
  }

  /** Bonuses from the level, the skills and the gear. */
  applyProgress(): void {
    const h = this.hero, b = bonuses();
    h.dmgBonus = b.dmg; h.reachBonus = b.reach; h.speedBonus = b.speed; h.meterGain = b.meter;
    h.setMaxHp(h.def.hp + b.hp, true);
  }

  private spawn(kind: string, x: number, y: number, range: number, copy = false): Enemy {
    const e = new Enemy(this, kind, x, y, range, copy);
    if (e.def.fly) { /* no ground collision */ } else this.physics.add.collider(e.sprite, this.platforms);
    e.onSpawn = (k, ex, ey) => { if (this.enemies.filter((o) => o.def.id === k && o.alive).length < 6) { const c = this.spawn(k, ex, ey, 90, true); c.body.setVelocity(e.dir * 160, -260); } };
    e.onSteal = (n) => this.steal(n);
    this.enemies.push(e);
    return e;
  }
  private steal(n: number): void {
    const k = Math.min(n, save.bits); if (!k) return;
    save.bits -= k; this.fx.text(this.hero.x, this.hero.y - 100, '-' + k + ' ביטים', '#ff8fb8');
    for (let i = 0; i < k; i++) this.addBit(this.hero.x, this.hero.y - 60, true);
  }
  private addBit(x: number, y: number, drop = false): void {
    const s = put(this, x, y, 'bit').setDepth(5);
    const o = { s, x, y, ph: Math.random() * 6 } as Stage['bits'][number];
    if (drop) { const p = this.physics.add.sprite(x, y, 'spark').setVisible(false); p.body!.setSize(10, 10); p.setVelocity((Math.random() - 0.5) * 220, -300); this.physics.add.collider(p, this.platforms); o.fall = p; }
    this.bits.push(o);
  }

  // ------------------------------------------------------------------ the boss arena
  private setupBoss(): void {
    const x1 = this.layout.length, x0 = x1 - 1400;
    this.arena = { x0, x1, locked: false };
    const id = this.def.area.boss;
    this.boss = new Boss(this, id, x1 - 330, x0, x1, {
      hazard: (hz) => this.addHazard(hz),
      telegraph: (a, b, y, dur) => this.telegraph(a, b, y, dur),
      ring: (x, y, c, r) => this.fx.ring(x, y, c, r, 400),
      shake: (a) => { if (!save.calm) this.cameras.main.shake(260, a); },
      spawn: (k, x) => { const e = this.spawn(k, x, GROUND_Y, 90); e.hp = e.maxHp = 2; },
      say: (t) => toast(t, false),
      sound: (n) => (n === 'boom' ? sfx.magic() : n === 'whack' ? sfx.hit() : sfx.hurt()),
    });
    if (id !== 'flooder') this.physics.add.collider(this.boss.sprite, this.platforms);
    this.boss.onDead = () => { this.paused = true; this.physics.world.pause(); this.hideBossBar(); flow.bossDown(this.def, { time: Math.round(this.clock), kills: this.kills, bits: this.bitsGot, falls: this.falls, card: this.cardGot, hp: this.hero.hp / this.hero.maxHp }); };
    this.exit.setVisible(false);
    this.bossBar = document.createElement('div');
    this.bossBar.id = 'bossbar'; this.bossBar.innerHTML = '<span></span><div><i></i></div>';
    (this.bossBar.firstElementChild as HTMLElement).textContent = this.boss.rig.name;
    document.body.appendChild(this.bossBar);
    this.events.once('shutdown', () => this.hideBossBar());
  }
  private hideBossBar(): void { this.bossBar?.remove(); this.bossBar = null; }
  private addHazard(h: Hazard): void {
    if (h.vx !== 0) {            // a moving ring on the floor
      h.img = this.add.image(h.rect.x, h.rect.y + 30, 'ring').setTint(0xffd23f).setScale(0.36, 0.2).setDepth(9).setAlpha(0);
    }
    this.hazards.push(h);
  }
  private telegraph(x0: number, x1: number, y: number, dur: number): void {
    const r = this.add.rectangle((x0 + x1) / 2, y - 5, x1 - x0, 10, 0xe4402e, 0.75).setDepth(7);
    this.tweens.add({ targets: r, alpha: 0.15, yoyo: true, repeat: Math.max(1, Math.floor(dur / 0.15)), duration: 150, onComplete: () => r.destroy() });
    this.time.delayedCall(dur * 1000 + 30, () => r.destroy());
  }
  private updateBoss(dt: number): void {
    const b = this.boss, a = this.arena, h = this.hero;
    if (!b || !a) return;
    if (!a.locked && h.x > a.x0 + 140) {                                  // entering the arena: lock the camera and show the bar
      a.locked = true; this.cameras.main.setBounds(a.x0, 0, a.x1 - a.x0, VIEW_H); toast('הבוס מתעורר!', false); sfx.magic();
      this.physics.world.setBounds(a.x0, 0, a.x1 - a.x0, 1000);
      this.bossBar?.classList.add('on');
    }
    if (a.locked) b.update(dt, h, this.time.now);
    if (this.bossBar) (this.bossBar.querySelector('i') as HTMLElement).style.width = Math.max(0, (b.hp / b.maxHp) * 100) + '%';
    const now = this.time.now;
    const r = new Phaser.Geom.Rectangle(h.body.x, h.body.y, h.body.width, h.body.height);
    for (const hz of this.hazards) {
      if (hz.vx !== 0) { hz.rect.x += hz.vx * dt; if (hz.img) { hz.img.setPosition(hz.rect.x + 23, hz.rect.y + 30).setAlpha(now >= hz.from ? 0.9 : 0); } }
      else if (hz.kind === 'air') { hz.rect.y += 380 * dt * (now >= hz.from ? 1 : 0); }
    }
    for (const hz of this.hazards) {
      if (now < hz.from || now > hz.until) continue;
      if (hz.kind === 'air' && hz.rect.y > GROUND_Y) continue;
      if (Phaser.Geom.Intersects.RectangleToRectangle(r, hz.rect) && h.hurt(hz.rect.x + hz.rect.width / 2, hz.dmg)) { sfx.hurt(); this.fx.hit(h.x, h.y - 40, 0xff6b6b); if (!save.calm) this.cameras.main.shake(120, 0.008); }
    }
    for (let i = this.hazards.length - 1; i >= 0; i--) if (now > this.hazards[i].until || this.hazards[i].rect.x < a.x0 - 50 || this.hazards[i].rect.x > a.x1 + 50) { this.hazards[i].img?.destroy(); this.hazards.splice(i, 1); }
    // contact with the boss
    if (b.alive && b.dangerous && h.state !== 'dash' && h.state !== 'asleep' && Phaser.Geom.Intersects.RectangleToRectangle(r, b.rect()) && h.hurt(b.x)) { sfx.hurt(); if (!save.calm) this.cameras.main.shake(140, 0.01); }
  }

  /** Noise wakes sleeping enemies nearby: every one in range wakes at once. */
  private noise(x: number, range: number): void {
    for (const e of this.enemies) if (e.alive && e.asleep && Math.abs(e.x - x) < range) { e.wake(); this.fx.ring(e.x, e.y, 0xffffff, 40, 300); this.fx.text(e.x, e.y - 30, '!', '#ffd23f', 28); }
  }

  private magic(): void {
    const h = this.hero;
    sfx.magic();
    if (!save.calm) this.cameras.main.shake(260, 0.012);
    const color = h.def.slash;
    this.fx.ring(h.x, h.y - 40, color, 400, 480, 30); this.fx.ring(h.x, h.y - 40, 0xffffff, 300, 380, 30);
    this.noise(h.x, 900);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - h.x, e.y - h.y);
      if (h.def.magic === 'shockwave' && d < 380) this.damage(e, 3, 640);
      else if (h.def.magic === 'bind' && d < 520) { e.jam = Math.max(e.jam, 4); this.fx.text(e.x, e.y - 50, 'נקשר!', '#4fd1c5', 24); this.fx.hit(e.x, e.y - 20, 0x4fd1c5); }
      else if (h.def.magic === 'broadcast' && Math.abs(e.x - h.x) < 560) this.damage(e, 4, 380);
    }
    if (this.boss && this.boss.alive && Math.abs(this.boss.x - h.x) < 560) this.boss.hit(h.def.magic === 'bind' ? 2 : 4);
  }

  private damage(e: Enemy, dmg: number, push: number, stage = 2): void {
    const h = this.hero;
    const res = e.hit(dmg, h.x, push, stage);
    if (res === 'blocked') { sfx.bit(); this.fx.ring(e.x, e.y - 40, 0xffffff, 36, 200); this.fx.text(e.x, e.y - 70, 'חסום!', '#c8c3d6', 18); return; }
    sfx.hit();
    this.fx.hit(e.x, e.y - e.rig.body.h * 0.5, 0xffffff, res === 'dead' || dmg >= 2);
    if (res === 'dead') this.defeat(e);
    else if (e.def.splits && !e.isCopy && !e.splitDone) {
      e.splitDone = true;
      const dir = Math.sign(h.x - e.x || 1);
      const c = this.spawn(e.def.id, e.x - dir * 30, e.y, 120, true);
      c.body.setVelocity(-dir * 220, -260); sfx.jam();
    }
  }

  private defeat(e: Enemy): void {
    this.kills++; sfx.kill();
    this.fx.pop(e.x, e.y - e.rig.body.h * 0.5);
    this.time.delayedCall(360, () => e.destroy());
    const n = e.def.guard ? 4 : Math.random() < 0.7 ? 1 : 0;
    for (let i = 0; i < n; i++) this.addBit(e.x, e.y - 30, true);
    this.hero.meter = Math.min(100, this.hero.meter + 5 * this.hero.meterGain);
    this.gainXp(e.def.xp);
  }
  gainXp(n: number): void {
    save.xp += n;
    let need = 40 + save.level * 30;
    while (save.xp >= need) {
      save.xp -= need; save.level++; save.skillPoints++; need = 40 + save.level * 30;
      sfx.level(); toast('רמה ' + save.level + '!', true); this.fx.text(this.hero.x, this.hero.y - 120, 'רמה ' + save.level, '#8be37d', 30);
      this.applyProgress();
    }
  }

  update(_t: number, dtMs: number): void {
    let dt = Math.min(0.05, dtMs / 1000);
    const h = this.hero;
    this.backdrop.update(this.cameras.main.scrollX);
    hudTick(dt);
    if (this.paused) { clearInput(); return; }
    if (this.hitstop > 0) { this.hitstop -= dt; this.physics.world.pause(); if (this.hitstop <= 0) this.physics.world.resume(); dt *= 0.1; }
    this.clock += dt;
    this.stormClock(dt);

    h.onOneWay = this.oneWay.some((p) => Math.abs(h.y - p.y) < 6 && h.x > p.x - 8 && h.x < p.x + p.displayWidth + 8);
    h.groundY = this.groundBelow(h.x, h.y);
    h.update(dt);

    for (const e of this.enemies) e.update(dt, h, this.enemies);
    for (let i = this.enemies.length - 1; i >= 0; i--) if (!this.enemies[i].alive && !this.enemies[i].puppet.root.active) this.enemies.splice(i, 1);

    // the swing
    const hb = h.hitbox();
    if (hb) {
      for (const e of this.enemies) {
        if (!e.alive || h.hitSet.has(e) || !Phaser.Geom.Intersects.RectangleToRectangle(hb, e.rect())) continue;
        h.hitSet.add(e);
        h.landed(); combo(h.comboCount);
        this.damage(e, h.damage, h.push, h.attackStage);
        if (!save.calm) { this.cameras.main.shake(70, 0.004); this.hitstop = 0.05; }
      }
    }
    if (hb && this.boss && this.boss.alive && !h.hitSet.has(this.boss) && Phaser.Geom.Intersects.RectangleToRectangle(hb, this.boss.rect())) {
      h.hitSet.add(this.boss); h.landed(); combo(h.comboCount);
      const res = this.boss.hit(h.damage);
      this.fx.hit(this.boss.x, h.y - 50, 0xffffff, res !== 'blocked');
      if (res === 'blocked') { sfx.bit(); this.fx.text(this.boss.x, this.boss.y - this.boss.rig.body.h - 10, 'שריון! חכו שייפתח', '#c8c3d6', 18); } else { sfx.hit(); if (!save.calm) { this.cameras.main.shake(80, 0.005); this.hitstop = 0.05; } }
    }
    // contact damage
    if (h.state !== 'dash' && h.state !== 'asleep') {
      const r = new Phaser.Geom.Rectangle(h.body.x, h.body.y, h.body.width, h.body.height);
      for (const e of this.enemies) {
        if (!e.dangerous || !Phaser.Geom.Intersects.RectangleToRectangle(r, e.rect())) continue;
        if (h.hurt(e.x)) { sfx.hurt(); e.strike(); this.fx.hit(h.x, h.y - 40, 0xff6b6b); if (!save.calm) this.cameras.main.shake(120, 0.008); break; }
      }
    }
    // bits, hearts and the card
    for (const b of this.bits) {
      if (!b.s.active) continue;
      if (b.fall) { b.s.setPosition(b.fall.x, b.fall.y); b.x = b.fall.x; b.y = b.fall.y; } else b.s.y = b.y + Math.sin(this.time.now / 300 + b.ph) * 3;
      if (Math.abs(b.x - h.x) < 34 && Math.abs(b.y - (h.y - 36)) < 56) {
        b.fall?.destroy(); b.s.destroy(); save.bits++; this.bitsGot++; h.meter = Math.min(100, h.meter + 1.5 * h.meterGain); sfx.bit();
        this.fx.text(b.x, b.y - 10, '+1', '#ffd23f', 16);
      }
    }
    this.bits = this.bits.filter((b) => b.s.active);
    for (const im of this.hearts) if (im.active && Math.abs(im.x - h.x) < 34 && Math.abs(im.y - (h.y - 36)) < 56) { im.destroy(); h.hp = Math.min(h.maxHp, h.hp + 2); sfx.level(); this.fx.text(h.x, h.y - 100, '+♥', '#ff6b6b', 26); }
    const k = this.card;
    if (k && k.active && Math.abs(k.x - h.x) < 36 && Math.abs(k.y - (h.y - 36)) < 56) {
      k.destroy(); this.card = null; this.cardGot = true; sfx.card();
      save.cards.push(this.def.area.id + '.' + this.def.n); store();
      toast('קלף ידע חדש נוסף לאלבום!', true); this.fx.hit(h.x, h.y - 60, 0xffd23f, true);
    }
    // checkpoints
    this.layout.cps.forEach((x, i) => { if (h.x > x && i > this.checkpoint) { this.checkpoint = i; this.flags[i].setAlpha(1); toast('נקודת שמירה', true); sfx.bit(); this.fx.ring(x, GROUND_Y - 40, 0x4fd1c5, 60, 400); } });
    // pits and sleep
    if (h.y > 700 && h.state !== 'asleep') {
      this.falls++;
      if (--h.hp <= 0) { h.hp = 0; h.state = 'asleep'; } else { this.respawn(); toast('נפלת לבור! חוזרים לנקודת השמירה', false); sfx.hurt(); }
    }
    if (h.state === 'asleep') {
      this.asleepT += dt;
      if (this.asleepT === dt) toast('הגיבור נרדם... חוזרים לנקודת השמירה', false);
      if (this.asleepT > 1.4) { this.asleepT = 0; this.respawn(); }
    }
    // the exit
    const ex = this.layout.exit;
    if (Math.abs(h.x - ex.x) < 70 && h.grounded && ex.kind !== 'boss') { if (take('upP')) this.useExit(); } else inp.upP = false;
    if (this.bossHook) this.bossHook(dt);
    this.updateBoss(dt);
    this.hud();
  }
  private hud(): void {
    const h = this.hero;
    hudUpdate({ hp: h.hp, maxHp: h.maxHp, meter: h.meter, xp: save.xp, xpNext: 40 + save.level * 30, level: save.level, bits: save.bits });
  }
  private groundBelow(x: number, y: number): number {
    let best = 900;
    for (const [a, b] of this.layout.grounds) if (x > a - 4 && x < b + 4 && GROUND_Y >= y - 6) best = Math.min(best, GROUND_Y);
    for (const p of this.layout.plats) if (x > p.x && x < p.x + p.w && p.y >= y - 6) best = Math.min(best, p.y);
    return best === 900 ? GROUND_Y + 400 : best;
  }
  private respawn(): void {
    const x = this.checkpoint < 0 ? 120 : this.layout.cps[this.checkpoint] - 20;
    this.hero.respawn(x, GROUND_Y - 150);
  }
  /** The 10-15 minute rule: a soft warning, then the storm sends the player back to the lesson tower. */
  private stormClock(dt: number): void {
    save.playMin += dt / 60;
    if (save.playMin > 8 && this.storm === 0) { this.storm = 1; toast('הסערה מתקרבת... עוד כמה דקות', false); }
    if (save.playMin > 12 && this.storm === 1) { this.storm = 2; flow.storm(this); }
  }
  private useExit(): void {
    this.paused = true; this.physics.world.pause();
    const s = Math.round(this.clock);
    flow.finish(this, this.def, { time: s, kills: this.kills, bits: this.bitsGot, falls: this.falls, card: this.cardGot, hp: this.hero.hp / this.hero.maxHp });
  }
  resume(): void { this.paused = false; this.physics.world.resume(); }
  setBossHook(f: ((dt: number) => void) | null): void { this.bossHook = f; }
}
