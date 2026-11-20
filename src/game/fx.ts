/** Hit effects: slash crescents, impact stars and rings, dust, paper scraps and floating numbers. */
import * as Phaser from 'phaser';

export class Fx {
  private scraps: Phaser.GameObjects.Particles.ParticleEmitter;
  private dust: Phaser.GameObjects.Particles.ParticleEmitter;
  constructor(private scene: Phaser.Scene) {
    if (!scene.textures.exists('crescent')) {
      const cv = document.createElement('canvas'); cv.width = 240; cv.height = 180;
      const c = cv.getContext('2d') as CanvasRenderingContext2D;
      c.fillStyle = '#fff'; c.beginPath(); c.arc(40, 90, 80, -1.15, 1.15); c.arc(70, 90, 84, 1.05, -1.05, true); c.closePath(); c.fill();
      scene.textures.addCanvas('crescent', cv);
      const dv = document.createElement('canvas'); dv.width = 32; dv.height = 32;
      const d = dv.getContext('2d') as CanvasRenderingContext2D;
      const g = d.createRadialGradient(16, 16, 1, 16, 16, 15); g.addColorStop(0, 'rgba(255,244,220,0.9)'); g.addColorStop(1, 'rgba(255,244,220,0)'); d.fillStyle = g; d.fillRect(0, 0, 32, 32);
      scene.textures.addCanvas('puff', dv);
    }
    this.scraps = scene.add.particles(0, 0, 'scrap', { speed: { min: 90, max: 340 }, lifespan: { min: 380, max: 800 }, scale: { start: 1.5, end: 0.4 }, rotate: { min: 0, max: 360 }, gravityY: 700, emitting: false, tint: [0xfff4dc, 0xffd23f, 0xe4572e, 0x1fa89a, 0xffffff] }).setDepth(30);
    this.dust = scene.add.particles(0, 0, 'puff', { speed: { min: 20, max: 90 }, angle: { min: 200, max: 340 }, lifespan: 420, scale: { start: 0.9, end: 1.6 }, alpha: { start: 0.7, end: 0 }, emitting: false }).setDepth(8);
  }
  slash(x: number, y: number, facing: number, color: number, stage: number, scale = 1): void {
    const s = this.scene.add.image(x, y, 'crescent').setTint(color).setDepth(12).setAlpha(0.95);
    s.setFlipX(facing < 0).setScale(0.15 * scale, 0.5 * scale).setAngle((stage === 1 ? 25 : stage === 2 ? -10 : -22) * facing);
    this.scene.tweens.add({ targets: s, scaleX: 0.5 * scale * (stage === 2 ? 1.4 : 1), scaleY: 0.6 * scale, alpha: 0, duration: 190, ease: 'cubic.out', onComplete: () => s.destroy() });
  }
  hit(x: number, y: number, color = 0xffffff, big = false): void {
    for (let i = 0; i < (big ? 4 : 2); i++) {
      const st = this.scene.add.image(x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 24, 'star').setTint(i % 2 ? 0xffd23f : color).setDepth(31).setScale(0.3).setAngle(Math.random() * 90);
      this.scene.tweens.add({ targets: st, scale: (big ? 1.1 : 0.8) + Math.random() * 0.3, alpha: 0, angle: st.angle + 70, duration: 280, onComplete: () => st.destroy() });
    }
    this.ring(x, y, color, big ? 70 : 44, 240);
    this.scraps.explode(big ? 12 : 6, x, y);
  }
  ring(x: number, y: number, color: number, radius: number, dur = 300, depth = 29): void {
    const r = this.scene.add.image(x, y, 'ring').setTint(color).setDepth(depth).setScale(0.12).setAlpha(0.9);
    this.scene.tweens.add({ targets: r, scale: radius / 64, alpha: 0, duration: dur, ease: 'cubic.out', onComplete: () => r.destroy() });
  }
  pop(x: number, y: number): void {                  // a defeated enemy: scraps, stars and a ring
    this.scraps.explode(26, x, y);
    for (let i = 0; i < 3; i++) {
      const st = this.scene.add.image(x, y, 'star').setTint([0xffd23f, 0xffffff, 0xff8fb8][i]).setDepth(31).setScale(0.4);
      this.scene.tweens.add({ targets: st, x: x + (i - 1) * 46, y: y - 30 - i * 12, scale: 1.2, alpha: 0, angle: 120, duration: 480, ease: 'cubic.out', onComplete: () => st.destroy() });
    }
    this.ring(x, y, 0xffffff, 80, 360);
  }
  puff(x: number, y: number, n = 4): void { this.dust.explode(n, x, y); }
  text(x: number, y: number, s: string, color = '#ffffff', size = 22): void {
    const t = this.scene.add.text(x, y, s, { fontFamily: 'Rubik, Arial', fontSize: size + 'px', fontStyle: '900', color, stroke: '#1d1a33', strokeThickness: 5 }).setOrigin(0.5).setDepth(40);
    this.scene.tweens.add({ targets: t, y: y - 42, alpha: 0, duration: 650, ease: 'cubic.out', onComplete: () => t.destroy() });
  }
}
