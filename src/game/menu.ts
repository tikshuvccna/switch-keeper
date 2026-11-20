/** The menu scene: the market street at dusk, slowly scrolling, with the chosen hero idling in front of the DOM menu. */
import * as Phaser from 'phaser';
import { heroRig } from '../art/registry';
import { Puppet } from '../art/puppet';
import { Backdrop, pickupTex, put, worldArt } from '../art/world';
import { heroChanged } from '../ui';
import { save } from './save';

export class Menu extends Phaser.Scene {
  private bd!: Backdrop;
  private pup: Puppet | null = null;
  private rigId = '';
  private t = 0;
  constructor() { super('menu'); }
  create(): void {
    const art = worldArt('market');
    pickupTex(this);
    this.bd = new Backdrop(this, art);
    put(this, 0, 480, art.ground(this, 1200), 0, 0).setDepth(2);
    put(this, 150, 480, art.lamp(this), 0.5, 1).setDepth(3);
    put(this, 760, 480, art.props(this)[0], 0.5, 1).setDepth(3);
    put(this, 640, 480, art.props(this)[1], 0.5, 1).setDepth(3);
    this.add.image(0, 0, 'vignette').setOrigin(0).setDepth(60);
    this.makeHero();
    const on = () => this.makeHero();
    heroChanged.addEventListener('change', on);
    this.events.once('shutdown', () => heroChanged.removeEventListener('change', on));
  }
  private makeHero(): void {
    const rig = heroRig(save.hero);
    this.pup?.destroy();
    this.pup = new Puppet(this, rig.parts, 'menu_' + rig.id);
    this.pup.setDepth(10);
    this.rigId = rig.id;
    this.t = 0;
  }
  update(_t: number, dtMs: number): void {
    this.t += dtMs / 1000;
    this.bd.update(this.t * 18);
    const rig = heroRig(save.hero);
    if (this.rigId !== rig.id) this.makeHero();
    const p = this.pup as Puppet;
    p.apply(rig.pose({ state: 'free', time: this.t, stage: 0, attackT: 0, vx: 0, vy: 0, grounded: true }));
    p.root.setPosition(300, 482).setScale(rig.scale * 2.1);
  }
}
