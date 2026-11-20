/**
 * A playable stage of an area: generated layout, paper-cut world art, the hero, the enemies, pickups, checkpoints and the exit.
 */
import * as Phaser from 'phaser';
import { Backdrop, pickupTex, put, VIEW_H, VIEW_W, worldArt, type WorldArt } from '../art/world';
import '../art/worlds';
import { combo, hudTick, hudUpdate, toast } from '../hud';
import { clearInput, inp, take } from '../input';
import { sfx } from '../sfx';
import { Boss, type Hazard } from './boss';
import { worldDef, type WorldDef } from './worlds';
import { NO_ENV } from './hero';
import { Enemy } from './enemy';
import { enemyRig } from '../art/registry';
import { Puppet } from '../art/puppet';
import { Obstacles } from './obstacles';
import { enemyShot, makeProjTextures, Proj, type ProjDef, type ShotKind } from './proj';
import { inp as input } from '../input';
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
  art!: WorldArt;
  private checkpoint = -1;
  private asleepT = 0;
  private paused = false;
  private hitstop = 0;
  private clock = 0; private kills = 0; private bitsGot = 0; private falls = 0; private cardGot = false;
  private storm = 0;
  private bossHook: ((dt: number) => void) | null = null;
  boss: Boss | null = null;
  wd!: WorldDef;
  /** World state: autoscroll speed, the beat clock, bullet time, wind and falling things. */
  private scrollSpeed = 0; private autoDelay = 0; private beatN = -1; private raceT = 0; private bulletMeter = 100; private slow = 1;
  private windT = 0; private fallT = 1; private lavaCool = 0; private ceilY = 64; private bulletBar: HTMLElement | null = null; private tintGlow: Phaser.GameObjects.Rectangle | null = null;
  private chaseWall: Phaser.GameObjects.Rectangle | null = null;
  projs: Proj[] = [];
  private tipBubble: Phaser.GameObjects.Text | null = null;
  private ora: { pup: Puppet; x: number; mark: Phaser.GameObjects.Text; asked: boolean } | null = null;
  private bars!: Phaser.GameObjects.Graphics;
  private obstacles: Obstacles | null = null;
  private orbs: { img: Phaser.GameObjects.Image; x: number; y: number; cd: number }[] = [];
  private hazards: Hazard[] = [];
  private arena: { x0: number; x1: number; locked: boolean } | null = null;
  private bossBar: HTMLElement | null = null;

  constructor() { super('stage'); }

  init(data: { id?: string }): void { this.def = stageById(data.id ?? new URLSearchParams(location.search).get('stage') ?? 'market.1'); }

  create(): void {
    this.enemies = []; this.bits = []; this.hearts = []; this.oneWay = []; this.flags = []; this.checkpoint = -1; this.asleepT = 0; this.paused = false;
    this.ora = null;
    this.boss = null; this.hazards = []; this.arena = null; this.projs = []; this.orbs = [];
    this.clock = 0; this.kills = 0; this.bitsGot = 0; this.falls = 0; this.cardGot = false; this.card = null; this.hitstop = 0; this.storm = 0;
    const art = (this.art = worldArt(this.def.world));
    const L = (this.layout = layoutFor(this.def));
    pickupTex(this); makeProjTextures(this);
    this.physics.world.setBounds(0, 0, L.length, 1000);
    this.wd = this.def.boss ? { ...worldDef(this.def.world), mech: {}, extra: undefined, hint: 'הבוס מחכה! מכות, ירי ופארי על דברים ורודים.' } : worldDef(this.def.world);
    this.physics.world.gravity.y = 1750 * (this.wd.mech.gravity ?? 1);
    this.raceT = 0; this.beatN = -1; this.bulletMeter = 100; this.slow = 1; this.windT = 0; this.fallT = 1; this.lavaCool = 0; this.scrollSpeed = 0;
    this.cameras.main.setBounds(0, 0, L.length, VIEW_H);
    this.backdrop = new Backdrop(this, art);
    this.fx = new Fx(this);

    // ground and platforms
    this.platforms = this.physics.add.staticGroup();
    for (const [a, b] of L.grounds) {
      put(this, a, GROUND_Y, art.ground(this, Math.round(b - a)), 0, 0).setDepth(2);
      const g = this.platforms.create(a, GROUND_Y, 'spark') as Phaser.Physics.Arcade.Sprite;
      g.setOrigin(0, 0).setDisplaySize(b - a, 70).setVisible(false).refreshBody();
    }
    for (const [a, b] of (L.ceilings ?? [])) {
      put(this, a, -56, art.ground(this, Math.round(b - a)), 0, 0).setDepth(2).setFlipY(true);
      const c = this.platforms.create(a, -56, 'spark') as Phaser.Physics.Arcade.Sprite;
      c.setOrigin(0, 0).setDisplaySize(b - a, 120).setVisible(false).refreshBody();
    }
    L.plats.forEach((p, i) => {
      put(this, p.x, p.y - 4, art.platform(this, p.w, p.style, i), 0, 0).setDepth(2);
      const s = this.platforms.create(p.x, p.y, 'spark') as Phaser.Physics.Arcade.Sprite;
      s.setOrigin(0, 0).setDisplaySize(p.w, 14).setVisible(false).refreshBody().setData('oneway', true);
      const b = s.body as Phaser.Physics.Arcade.StaticBody;
      b.checkCollision.down = false; b.checkCollision.left = false; b.checkCollision.right = false;
      this.oneWay.push(s);
    });
    // props: far ones behind the hero, lamps in the front layer, darker and bigger
    for (const p of L.props) {
      if (p.id === 'bunting') { if (art.bunting) put(this, p.x, p.y, art.bunting(this)).setDepth(1).setScale(1.6, 1.2); continue; }
      const list = art.props(this), key = p.id === 'lamp' ? art.lamp(this) : list[Math.abs(Math.round(p.x / 37)) % Math.max(1, list.length)];
      const im = put(this, p.x, p.y, key, 0.5, 1).setDepth(3);
      if (p.id === 'lamp' && this.def.n % 2 === 0) im.setAlpha(0.95);
    }
    L.cps.forEach((x) => this.flags.push(put(this, x, GROUND_Y, 'flagpost', 0.4, 1).setDepth(3).setAlpha(0.6)));
    this.exit = put(this, L.exit.x, GROUND_Y, L.exit.kind === 'door' ? 'portal' : 'portal', 0.5, 1).setDepth(3);
    if (L.exit.kind === 'door') this.exit.setTint(0x9be7d6);

    // hero and enemies
    this.hero = new Hero(this, 120, GROUND_Y - 2, save.hero);
    this.applyProgress();
    const h = this.hero;
    const m = this.wd.mech;
    h.env = { ...NO_ENV, gravity: m.gravity ?? 1, ice: !!m.ice, swim: !!m.swim, fly: !!m.fly, flip: !!m.flip, size: !!m.size, auto: false, sticky: !!m.sticky };
    if (m.fly) { h.body.setAllowGravity(false); h.sprite.setPosition(160, 270); }
    this.autoDelay = m.auto ? 3 : 0;
    const bx = document.getElementById('bExtra') as HTMLElement;
    if (this.wd.extra) { bx.classList.remove('hide'); bx.dataset.mode = this.wd.extra; bx.textContent = { flip: 'הפוך', size: 'גודל', bullet: 'זמן' }[this.wd.extra]; } else bx.classList.add('hide');
    h.onFlip = () => { sfx.magic(); this.fx.ring(h.x, h.y - 40, 0x9b7bff, 90, 360); };
    h.onSize = () => { sfx.level(); this.fx.ring(h.x, h.y - 40, 0x8be37d, 80, 360); };
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
    h.onShoot = () => this.heroShoot();
    h.onParry = () => this.tryParry();
    h.onDoubleJump = () => { this.fx.ring(h.x, h.y - 6, 0xffffff, 40, 260); this.fx.puff(h.x, h.y, 4); };
    this.physics.add.collider(h.sprite, this.platforms, undefined, (_h, p) => !((p as Phaser.Physics.Arcade.Sprite).getData('oneway') && h.dropping));
    for (const s of L.spawns) this.spawn(s.kind, s.x, s.y, s.range ?? 110, false, !!s.elite);

    // pickups
    for (const [x, y] of L.bits) this.addBit(x, y);
    for (const [x, y] of L.hearts) { const im = put(this, x, y, 'heart').setDepth(5); this.tweens.add({ targets: im, y: y - 6, yoyo: true, repeat: -1, duration: 600, ease: 'sine.inOut' }); this.hearts.push(im); }
    if (L.card && !save.cards.includes(this.def.area.id + '.' + this.def.n)) {
      this.card = put(this, L.card[0], L.card[1], 'card').setDepth(6);
      this.tweens.add({ targets: this.card, y: L.card[1] - 8, yoyo: true, repeat: -1, duration: 700, ease: 'sine.inOut' });
    }
    this.obstacles = new Obstacles(this, art, h, {
      fx: this.fx, platforms: this.platforms, spawnProj: (p) => this.projs.push(p),
      hurt: (fx, dmg) => { if (h.hurt(fx, dmg)) { sfx.hurt(); this.fx.hit(h.x, h.y - 40, 0xff6b6b); if (!save.calm) this.cameras.main.shake(120, 0.008); } },
    }, L.obs ?? []);
    // Ora, the teacher: she waits near the start of stage 1 and opens the lesson of the area
    if (this.def.n === 1 && this.def.area.lesson) {
      const rig = enemyRig('ora');
      if (rig) {
        const pup = new Puppet(this, rig.parts, 'ora');
        pup.setDepth(7);
        const mark = this.add.text(560, GROUND_Y - 130, 'שיעור ↑', { fontFamily: 'Rubik, Arial', fontSize: '18px', fontStyle: '900', color: '#fff4dc', backgroundColor: '#c93a2a', padding: { x: 8, y: 3 } }).setOrigin(0.5).setDepth(8);
        this.ora = { pup, x: 560, mark, asked: false };
      }
    }
    this.bars = this.add.graphics().setDepth(20);
    this.tipBubble = null;
    if ((L.orbs?.length ?? 0) > 0 && !save.paid.includes('tip.parry')) {                    // until the first parry: a hint above the first orb
      const [ox, oy] = (L.orbs as [number, number][])[0];
      this.tipBubble = this.add.text(ox, oy - 52, 'קפצו אל הכדור הוורוד,\nואז לחצו קפיצה שוב: פארי!', { fontFamily: 'Rubik, Arial', fontSize: '17px', fontStyle: '800', color: '#fff4dc', backgroundColor: '#c93a2a', align: 'center', padding: { x: 10, y: 5 } }).setOrigin(0.5, 1).setDepth(8).setVisible(false);
      this.tweens.add({ targets: this.tipBubble, y: oy - 58, yoyo: true, repeat: -1, duration: 600, ease: 'sine.inOut' });
    }
    for (const [ox, oy] of (L.orbs ?? [])) {
      const im = put(this, ox, oy, 'orb').setDepth(6);
      this.tweens.add({ targets: im, scale: im.scale * 1.12, yoyo: true, repeat: -1, duration: 500, ease: 'sine.inOut' });
      this.orbs.push({ img: im, x: ox, y: oy, cd: 0 });
    }
    // overlays: the vignette, and floating dust specks in the air
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(60);
    this.add.particles(0, 0, 'scrap', { x: { min: 0, max: VIEW_W }, y: { min: 0, max: VIEW_H }, lifespan: 6000, speedX: { min: -12, max: 6 }, speedY: { min: -4, max: 10 }, scale: { start: 0.5, end: 0.2 }, alpha: { start: 0.35, end: 0 }, quantity: 1, frequency: 450, tint: 0xfff0c8 }).setScrollFactor(0).setDepth(55);

    if (m.fly || m.chase) {
      this.scrollSpeed = m.fly ? 110 : m.chase as number;
      this.cameras.main.setScroll(0, 0);
      if (m.chase) {
        this.chaseWall = this.add.rectangle(0, 0, 130, VIEW_H, 0x140c2a, 0.92).setOrigin(0, 0).setScrollFactor(0).setDepth(50);
        this.add.particles(0, 0, 'spark', { x: { min: 0, max: 120 }, y: { min: 0, max: VIEW_H }, speedX: { min: 40, max: 160 }, lifespan: 700, scale: { start: 0.5, end: 0 }, alpha: { start: 0.8, end: 0 }, frequency: 40, tint: [0xffe45c, 0xb79cff, 0xffffff] }).setScrollFactor(0).setDepth(51);
      }
    } else {
      this.cameras.main.startFollow(h.sprite, true, 0.1, 0.12);
      this.cameras.main.setDeadzone(80, 40);
      this.cameras.main.setFollowOffset(0, 40);
    }
    if (m.bullet) {
      this.bulletBar = document.createElement('div'); this.bulletBar.id = 'bulletbar'; this.bulletBar.innerHTML = '<span>זמן (B)</span><div><i></i></div>'; document.body.appendChild(this.bulletBar);
      this.tintGlow = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x2bff7a, 0).setOrigin(0, 0).setScrollFactor(0).setDepth(52);
    }
    this.events.once('shutdown', () => { this.bulletBar?.remove(); this.bulletBar = null; (document.getElementById('bExtra') as HTMLElement).classList.add('hide'); });
    toast(this.wd.hint, true, 4);
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

  // ------------------------------------------------------------------ shots and parry
  private heroShoot(): void {
    const h = this.hero, sh = h.def.shot;
    const def: ProjDef = { tex: sh.tex, vx: h.facing * sh.speed, vy: 0, life: sh.life, w: sh.w, h: sh.h, dmg: sh.dmg + (h.dmgBonus > 0 ? 0.25 * h.dmgBonus : 0), owner: 'hero', pierce: sh.pierce, spin: sh.tex === 'shot_twine' ? 9 : 0 };
    this.projs.push(new Proj(this, def, h.x + h.facing * 34, h.y - h.def.bodyH * 0.55));
    sfx.swing(0); this.fx.puff(h.x + h.facing * 28, h.y - h.def.bodyH * 0.55, 1);
  }
  private enemyFire(e: Enemy, kind: ShotKind): void {
    const h = this.hero, dir = h.x >= e.x ? 1 : -1;
    const from = { x: e.x + dir * 22, y: e.rig.body.origin === 'feet' ? e.y - e.rig.body.h * 0.62 : e.y };
    if (kind === 'bolt') {                                              // a lightning strike: marked on the floor, then it falls
      const bx = h.x + (Math.random() - 0.5) * 60;
      this.fx.ring(bx, GROUND_Y - 4, 0xffe45c, 46, 520);
      this.time.delayedCall(520, () => { if (this.scene.isActive()) this.projs.push(new Proj(this, enemyShot('bolt', 1, from, h), bx, -30)); });
      return;
    }
    const def = enemyShot(kind, dir, from, { x: h.x, y: h.y });
    this.projs.push(new Proj(this, def, from.x, kind === 'wave' ? GROUND_Y - 16 : from.y));
    this.fx.ring(from.x, from.y, def.parry ? 0xff7ac8 : 0xffffff, 30, 220);
  }
  /** Jump again into something pink: parry it. Returns true if a parry happened. */
  private tryParry(): boolean {
    const h = this.hero, cx = h.x, cy = h.y - h.def.bodyH * 0.5;
    let hit: { x: number; y: number } | null = null;
    for (const p of this.projs) if (p.alive && p.def.owner === 'enemy' && p.def.parry && Math.hypot(p.x - cx, p.y - cy) < 58) { p.destroy(); hit = p; break; }
    if (!hit) for (const o of this.orbs) if (o.cd <= 0 && Math.hypot(o.x - cx, o.y - cy) < 56) { o.cd = 0.9; o.img.setAlpha(0.3); hit = o; break; }
    if (!hit) return false;
    if (!save.paid.includes('tip.parry')) { save.paid.push('tip.parry'); store(); this.tipBubble?.destroy(); this.tipBubble = null; toast('פארי! הכדורים הוורודים ממלאים את מד הקסם', true, 3); }
    sfx.card(); this.fx.ring(hit.x, hit.y, 0xff7ac8, 80, 360); this.fx.hit(hit.x, hit.y, 0xff7ac8, true); this.fx.text(hit.x, hit.y - 30, 'פארי!', '#ff7ac8', 26);
    h.meter = Math.min(100, h.meter + 22 * h.meterGain);
    return true;
  }
  private updateProjs(dt: number): void {
    const h = this.hero, cam = this.cameras.main;
    for (const o of this.orbs) { o.cd = Math.max(0, o.cd - dt); if (o.cd <= 0 && o.img.alpha < 1) o.img.setAlpha(1); }
    const hr = new Phaser.Geom.Rectangle(h.body.x, h.body.y, h.body.width, h.body.height);
    for (const p of this.projs) {
      p.step(dt, h.x, h.y - 40);
      if (p.x < cam.scrollX - 300 || p.x > cam.scrollX + VIEW_W + 300 || p.y > 700) p.alive = false;
      if (p.def.floor && p.y > GROUND_Y - 6) { p.alive = false; if (p.def.tex === 'pk_drop') this.fx.puff(p.x, GROUND_Y - 6, 2); }
      if (!p.alive) continue;
      const r = p.rect();
      if (p.def.owner === 'hero') {
        for (const e of this.enemies) {
          if (!e.alive || p.hits.has(e) || !Phaser.Geom.Intersects.RectangleToRectangle(r, e.rect())) continue;
          p.hits.add(e); this.damage(e, p.def.dmg, 140, 0); h.meter = Math.min(100, h.meter + 2 * h.meterGain);
          if (p.hits.size > (p.def.pierce ?? 0)) { p.alive = false; break; }
        }
        const b = this.boss;
        if (p.alive && b && b.alive && !p.hits.has(b) && Phaser.Geom.Intersects.RectangleToRectangle(r, b.rect())) {
          p.hits.add(b); const res = b.hit(p.def.dmg); this.fx.hit(p.x, p.y, 0xffffff, false); if (res !== 'blocked') { sfx.hit(); h.meter = Math.min(100, h.meter + 1.5 * h.meterGain); } if (p.hits.size > (p.def.pierce ?? 0)) p.alive = false;
        }
      } else if (h.state !== 'dash' && Phaser.Geom.Intersects.RectangleToRectangle(r, hr) && h.hurt(p.x, p.def.dmg)) {
        sfx.hurt(); this.fx.hit(h.x, h.y - 40, 0xff6b6b); if (!save.calm) this.cameras.main.shake(120, 0.008); p.alive = false;
      }
    }
    for (let i = this.projs.length - 1; i >= 0; i--) if (!this.projs[i].alive) { this.projs[i].img.destroy(); this.projs.splice(i, 1); }
  }

  private spawn(kind: string, x: number, y: number, range: number, copy = false, elite = false): Enemy {
    const e = new Enemy(this, kind, x, y, range, copy, elite);
    if (e.def.fly) { /* no ground collision */ } else this.physics.add.collider(e.sprite, this.platforms);
    e.onSpawn = (k, ex, ey) => { if (this.enemies.filter((o) => o.def.id === k && o.alive).length < 6) { const c = this.spawn(k, ex, ey, 90, true); c.body.setVelocity(e.dir * 160, -260); } };
    e.onSteal = (n) => this.steal(n);
    if (this.wd.mech.fly || this.wd.mech.swim) e.wake();
    e.onShoot = (en, kind) => this.enemyFire(en, kind);
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
    const n = e.elite ? 10 : e.def.guard ? 4 : Math.random() < 0.7 ? 1 : 0;
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
    this.worldTick(dt);
    const sdt = dt * this.slow;                       // bullet time slows everything except the hero

    h.onOneWay = this.oneWay.some((p) => Math.abs(h.y - p.y) < 6 && h.x > p.x - 8 && h.x < p.x + p.displayWidth + 8);
    h.groundY = this.groundBelow(h.x, h.y);
    input.aim = input.mouseOn ? Math.sign(this.input.activePointer.worldX - h.x) : 0;
    h.update(dt);

    for (const e of this.enemies) { e.update(sdt, h, this.enemies); if (this.slow < 1) { e.body.setVelocityX(e.body.velocity.x * this.slow); if (e.def.fly) e.body.setVelocityY(e.body.velocity.y * this.slow); } }
    this.updateProjs(sdt);
    this.obstacles?.update(sdt);
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
    if (this.wd.id === 'lava' && h.y > 560 && this.lavaCool <= 0 && h.state !== 'asleep') { this.lavaCool = 0.9; h.hurt(h.x, 1); h.body.setVelocityY(-1100); this.fx.ring(h.x, 520, 0xff7a2e, 90, 420); sfx.hurt(); toast('לבה! קופצים החוצה', false); }
    if ((h.y > 700 || h.y < -260) && h.state !== 'asleep' && !this.wd.mech.fly) {
      this.falls++;
      if (--h.hp <= 0) { h.hp = 0; h.state = 'asleep'; } else { this.respawn(); toast('נפלת לבור! חוזרים לנקודת השמירה', false); sfx.hurt(); }
    }
    if (h.state === 'asleep') {
      this.asleepT += dt;
      if (this.asleepT === dt) toast('הגיבור נרדם... חוזרים לנקודת השמירה', false);
      if (this.asleepT > 1.4) { this.asleepT = 0; this.respawn(); }
    }
    if (this.tipBubble) this.tipBubble.setVisible(Math.abs(h.x - this.tipBubble.x) < 520);
    // Ora
    const ora = this.ora;
    if (ora) {
      ora.pup.apply(enemyRig('ora')!.pose({ state: 'idle', time: this.time.now / 1000, t: 0, vx: 0, vy: 0, grounded: true, hp: 1, phase: 0, variant: 0 }));
      ora.pup.root.setPosition(ora.x, GROUND_Y).setScale(-1.1, 1.1);
      ora.mark.y = GROUND_Y - 128 + Math.sin(this.time.now / 250) * 5;
      const near = Math.abs(h.x - ora.x) < 120;
      ora.mark.setScale(near ? 1.15 : 1);
      if (near && !ora.asked) { ora.asked = true; toast('אורה מלמדת את השיעור: לחצו ↑', true); }
      if (near && take('upP')) { this.paused = true; this.physics.world.pause(); flow.talk(this, this.def); }
    }
    // health bars of enemies that were hit and of elites
    this.bars.clear();
    for (const e of this.enemies) {
      if (!e.alive || (e.barT <= 0 && !e.elite)) continue;
      const w = e.elite ? 70 : 38, y = e.y - (e.rig.body.origin === 'feet' ? e.rig.body.h * e.scale : e.rig.body.h * 0.5) - 14;
      this.bars.fillStyle(0x17132a, 0.85).fillRect(e.x - w / 2 - 2, y - 2, w + 4, 9);
      this.bars.fillStyle(e.elite ? 0xff7a4d : 0xff6b6b, 1).fillRect(e.x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), 5);
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
  /** The things a world does by itself: scrolling, the beat, bullet time, wind, falling rocks and meteors. */
  private worldTick(dt: number): void {
    const m = this.wd.mech, h = this.hero, cam = this.cameras.main;
    this.raceT += dt; this.lavaCool = Math.max(0, this.lavaCool - dt);
    // autoscroll (flying and chase): the camera runs on, the hero must keep up
    if (this.scrollSpeed > 0 && h.state !== 'asleep') {
      if (m.chase) this.scrollSpeed = Math.min(215, (m.chase as number) + this.raceT * 0.6);
      const maxX = this.layout.length - VIEW_W;
      cam.scrollX = Math.min(maxX, cam.scrollX + this.scrollSpeed * dt);
      if (h.x < cam.scrollX + 24) { h.sprite.x = cam.scrollX + 24; if (m.chase) { if (h.hurt(cam.scrollX + 600, 1)) { sfx.hurt(); toast('הסערה תפסה אתכם! רוצו!', false); } h.sprite.x = cam.scrollX + 110; } }
      if (h.x > cam.scrollX + VIEW_W - 30) h.sprite.x = cam.scrollX + VIEW_W - 30;
      if (m.fly) { if (h.y < 60) { h.sprite.y = 60; h.body.setVelocityY(0); } if (h.y > 500) { h.sprite.y = 500; h.body.setVelocityY(0); } }
      if (this.chaseWall) this.chaseWall.setAlpha(0.8 + Math.sin(this.raceT * 9) * 0.08);
    }
    // the beat (musical world): the hero runs by itself after a countdown, and the world pulses
    if (m.auto) {
      if (this.autoDelay > 0) { this.autoDelay -= dt; h.env.auto = false; if (this.autoDelay <= 0) { h.env.auto = true; toast('קדימה!', true); } }
      const beat = Math.floor(this.raceT * (m.auto as number) / 60);
      if (this.autoDelay <= 0 && beat !== this.beatN) {
        this.beatN = beat;
        if (beat % 4 === 0) { sfx.kick(); cam.zoomTo(1.025, 90); this.time.delayedCall(110, () => cam.zoomTo(1, 160)); } else if (beat % 2 === 0) sfx.hat(); else sfx.tick();
        if (beat % 8 === 0) sfx.bass();
      }
    }
    // bullet time (matrix): hold the button to slow everything but the hero
    if (m.bullet) {
      const want = input.bulletHeld && this.bulletMeter > 0;
      this.slow = want ? 0.3 : 1;
      this.bulletMeter = Phaser.Math.Clamp(this.bulletMeter + (want ? -42 : 14) * dt, 0, 100);
      this.tintGlow?.setAlpha(want ? 0.13 : 0);
      if (this.bulletBar) (this.bulletBar.querySelector('i') as HTMLElement).style.width = this.bulletMeter + '%';
    }
    // wind pushes the hero (desert, mountain, snow)
    if (m.wind) { this.windT += dt; const gust = Math.sin(this.windT * 0.55) * Math.max(0, Math.sin(this.windT * 0.21 + 1)); h.drift += gust * (m.wind as number); }
    // things that fall from the sky: meteors in space, rocks on the mountain, code in the matrix
    const cx = cam.scrollX;
    if (m.meteors) { this.fallT -= dt; if (this.fallT <= 0) { this.fallT = (m.meteors as number) * (0.7 + Math.random() * 0.6); const x = cx + 80 + Math.random() * (VIEW_W - 160); this.projs.push(new Proj(this, { tex: 'pk_meteor', vx: -90, vy: 380, life: 3, w: 34, h: 34, dmg: 1, owner: 'enemy', floor: true, spin: 3 }, x + 90, -40)); }
    }
    if (m.rain) { this.fallT -= dt; if (this.fallT <= 0) { this.fallT = m.rain === 'rock' ? 2.4 : 1.1; const x = m.rain === 'rock' ? h.x + (Math.random() - 0.5) * 320 : cx + 40 + Math.random() * (VIEW_W - 80); if (m.rain === 'rock') { this.fx.ring(x, GROUND_Y - 4, 0xffffff, 40, 600); this.time.delayedCall(600, () => { if (this.scene.isActive()) this.projs.push(new Proj(this, { tex: 'pk_rock', vx: 0, vy: 520, life: 2, w: 36, h: 36, dmg: 1, owner: 'enemy', floor: true, spin: 2 }, x, -30)); }); } else this.projs.push(new Proj(this, { tex: 'pk_codebolt', vx: 0, vy: 430, life: 2.2, w: 12, h: 40, dmg: 1, owner: 'enemy', floor: true }, x, -30)); } }
  }

  private respawn(): void {
    let x = this.checkpoint < 0 ? 120 : this.layout.cps[this.checkpoint] - 20;
    const hh = this.hero;
    if (hh.flipped) { hh.flipped = false; hh.body.setGravityY(0); }
    if (hh.sizeState !== 0) { hh.sizeState = 0; hh.fixBody(); }
    if (this.wd.mech.fly || this.wd.mech.chase) x = Math.max(x, this.cameras.main.scrollX + 160);
    hh.respawn(x, this.wd.mech.fly ? 270 : GROUND_Y - 150);
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
