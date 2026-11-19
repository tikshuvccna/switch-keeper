/** Grey-box art: every texture is drawn with shapes in code. Real art (Blender sprite sheets) replaces these later. */
import * as Phaser from 'phaser';

export function makeTextures(s: Phaser.Scene): void {
  const g = s.make.graphics({ x: 0, y: 0 }, false);
  const tex = (key: string, w: number, h: number, draw: () => void) => { g.clear(); draw(); g.generateTexture(key, w, h); };

  // the hero: a grey body, a lighter head and an eye on the right side (the sprite is flipped to face left)
  tex('hero', 40, 64, () => {
    g.fillStyle(0x59607a); g.fillRoundedRect(4, 22, 32, 40, 8);
    g.fillStyle(0xb7bfd6); g.fillRoundedRect(6, 2, 28, 26, 9);
    g.fillStyle(0xffd23f); g.fillRect(6, 30, 28, 5);                                    // the keeper's sash
    g.fillStyle(0x23202e); g.fillCircle(27, 14, 3.2);
  });
  tex('walker', 44, 44, () => { g.fillStyle(0xd98f5c); g.fillRoundedRect(2, 4, 40, 38, 8); g.fillStyle(0x23202e); g.fillCircle(30, 18, 3.5); g.fillCircle(18, 18, 3.5); });
  tex('walkerJam', 44, 44, () => { g.fillStyle(0xffe45c); g.fillRoundedRect(2, 4, 40, 38, 8); g.fillStyle(0x23202e); g.fillRect(12, 14, 8, 3); g.fillRect(26, 14, 8, 3); });
  tex('imp', 38, 38, () => { g.fillStyle(0x9b7bff); g.fillTriangle(19, 1, 37, 19, 19, 37); g.fillTriangle(19, 1, 1, 19, 19, 37); g.fillStyle(0x23202e); g.fillCircle(19, 18, 4); });
  tex('dup', 42, 42, () => { g.fillStyle(0x6fd3a0); g.fillRoundedRect(2, 6, 38, 34, 6); g.lineStyle(3, 0x23202e); g.strokeRoundedRect(6, 10, 30, 26, 4); g.fillStyle(0x23202e); g.fillCircle(21, 23, 3); });
  tex('bit', 16, 16, () => { g.fillStyle(0xffcc33); g.fillCircle(8, 8, 7); g.lineStyle(2, 0x7a5200); g.strokeCircle(8, 8, 7); });
  tex('card', 24, 32, () => { g.fillStyle(0x7b6cf6); g.fillRoundedRect(1, 1, 22, 30, 4); g.lineStyle(2, 0xffd23f); g.strokeRoundedRect(1, 1, 22, 30, 4); g.fillStyle(0xffffff); g.fillRect(8, 8, 8, 3); g.fillRect(8, 14, 8, 3); g.fillRect(8, 20, 8, 3); });
  tex('spark', 8, 8, () => { g.fillStyle(0xffffff); g.fillRect(0, 0, 8, 8); });
  tex('flag', 10, 70, () => { g.fillStyle(0x23202e); g.fillRect(0, 0, 3, 70); g.fillStyle(0x4fd1c5); g.fillTriangle(3, 2, 3, 24, 10, 13); });
  tex('slash', 64, 56, () => { g.lineStyle(10, 0xffffff, 0.95); g.beginPath(); g.arc(-6, 28, 52, -0.9, 0.9); g.strokePath(); });
  tex('portal', 90, 150, () => {
    g.fillStyle(0x3a2f66); g.fillRoundedRect(0, 0, 90, 150, 44);
    g.fillStyle(0x7b6cf6); g.fillRoundedRect(8, 8, 74, 134, 36);
    g.fillStyle(0xffd23f); g.fillRoundedRect(30, 70, 30, 34, 6); g.fillCircle(45, 66, 10);              // the padlock
  });
  // two layers of pigeonholes (the sorting office) for the background
  tex('holes', 128, 128, () => {
    g.fillStyle(0x3b3358); g.fillRect(0, 0, 128, 128);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) { g.fillStyle(0x2b2540); g.fillRoundedRect(x * 64 + 6, y * 64 + 6, 52, 52, 6); }
    g.lineStyle(3, 0x4a4170); g.strokeRect(0, 0, 128, 128);
  });
  tex('holesFar', 128, 128, () => {
    g.fillStyle(0x2a2440); g.fillRect(0, 0, 128, 128);
    g.fillStyle(0x231e38); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) g.fillRect(x * 32 + 5, y * 32 + 5, 22, 22);
  });
  g.destroy();
}
