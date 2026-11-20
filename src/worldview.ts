/** ?world=<id>[&x=<scroll>]: shows one world: sky, far and mid layers, ground, platforms, props, ambient particles and overlay. */
import * as Phaser from 'phaser';
import { Backdrop, pickupTex, put, VIEW_H, VIEW_W, worldArt } from './art/world';
import './art/worlds';

export class WorldView extends Phaser.Scene {
  constructor() { super('world'); }
  create(): void {
    const q = new URLSearchParams(location.search), id = q.get('world') || 'market', x0 = Number(q.get('x') ?? 0);
    const art = worldArt(id);
    pickupTex(this);
    const bd = new Backdrop(this, art);
    const lampKey = art.lamp(this), props = art.props(this);
    put(this, 0, 480, art.ground(this, 1500), 0, 0).setDepth(2);
    put(this, 300, 395, art.platform(this, 170, 'plank', 1), 0, 0).setDepth(2);
    put(this, 560, 330, art.platform(this, 150, 'awning', 0), 0, 0).setDepth(2);
    put(this, 820, 395, art.platform(this, 150, 'plank', 2), 0, 0).setDepth(2);
    put(this, 120, 480, lampKey, 0.5, 1).setDepth(3);
    props.forEach((k, i) => put(this, 300 + i * 150, 480, k, 0.5, 1).setDepth(3));
    if (art.bunting) put(this, 600, 80, art.bunting(this)).setDepth(1).setScale(1.6, 1.2);
    for (let i = 0; i < 5; i++) put(this, 340 + i * 28, 360, 'bit').setDepth(4).setScale(0.7);
    put(this, 700, 300, 'card').setDepth(4).setScale(0.7);
    put(this, 1100, 480, 'portal', 0.5, 1).setDepth(3).setScale(0.8);
    if (art.ambient) { const cfg = art.ambient(this); this.add.particles(0, 0, cfg.texture, cfg).setScrollFactor(0).setDepth(55); }
    if (art.overlay) this.add.image(0, 0, art.overlay(this)).setOrigin(0).setScrollFactor(0).setDepth(58).setDisplaySize(VIEW_W, VIEW_H);
    this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(60);
    this.add.text(10, 8, id + ' ' + art.name, { fontSize: '14px', color: '#ffffff', backgroundColor: '#000000a0' }).setScrollFactor(0).setDepth(70);
    this.cameras.main.setScroll(x0, 0);
    bd.update(x0);
    this.events.on('update', () => bd.update(this.cameras.main.scrollX));
    // slow auto scroll so the parallax and the wrap-around seams can be checked in a screenshot series
    this.input.keyboard?.on('keydown-RIGHT', () => { this.cameras.main.scrollX += 120; });
    (window as unknown as { __wv: unknown }).__wv = this;
  }
}
