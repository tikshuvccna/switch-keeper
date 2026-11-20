/** ?gallery: every creature in every example pose, for checking the art. ?gallery=<id> shows only that rig, bigger. */
import * as Phaser from 'phaser';
import { Puppet } from './art/puppet';
import { ALL } from './art/registry';

export class Gallery extends Phaser.Scene {
  constructor() { super('gallery'); }
  create(): void {
    this.cameras.main.setBackgroundColor('#f1dfc0');
    const only = new URLSearchParams(location.search).get('gallery');
    const rigs = ALL.filter((r) => !only || r.id === only);
    const time = Number(new URLSearchParams(location.search).get('t') ?? 0.3);
    let row = 0;
    const cols = 6, sx = 160, sy = 175;
    for (const rig of rigs) {
      this.add.text(10, 8 + row * sy - 6, rig.id + ' ' + rig.name, { fontSize: '14px', color: '#1d1a33', fontStyle: 'bold' });
      rig.demo.forEach(([name, o], i) => {
        const col = i % cols, r = row + Math.floor(i / cols);
        const x = 90 + col * sx, y = 150 + r * sy;
        this.add.rectangle(x, y - 40, sx - 10, sy - 14, 0xffffff, 0.35);
        this.add.text(x, y + 20, name, { fontSize: '13px', color: '#1d1a33' }).setOrigin(0.5);
        const p = new Puppet(this, rig.parts, rig.id);
        const k = rig.scale * 1.45;
        p.root.setPosition(x, rig.kind === 'enemy' && rig.body.origin === 'center' ? y - 30 : y).setScale(k);
        const base = rig.kind === 'hero'
          ? { state: 'free', time, stage: 0, attackT: 0, vx: 0, vy: 0, grounded: true }
          : { state: 'idle', time, t: 0.2, vx: 0, vy: 0, grounded: true, hp: 1, phase: 0, variant: 0 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        p.apply(rig.pose({ ...base, ...o } as any));
      });
      row += Math.ceil(rig.demo.length / cols);
    }
  }
}
