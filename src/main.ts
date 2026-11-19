import * as Phaser from 'phaser';
import './style.css';
import { initInput } from './input';
import { unlockAudio } from './sfx';
import { Stage } from './stage';

initInput();
const first = () => { unlockAudio(); window.removeEventListener('pointerdown', first); window.removeEventListener('keydown', first); };
window.addEventListener('pointerdown', first);
window.addEventListener('keydown', first);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960, height: 540,
  backgroundColor: '#241f38',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1750 }, debug: new URLSearchParams(location.search).has('debug') } },
  render: { antialias: true, roundPixels: true },
  scene: [Stage],
});
