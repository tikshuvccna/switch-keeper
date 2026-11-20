import * as Phaser from 'phaser';
import './style.css';
import './ui.css';
import './hud.css';
import './learn/learn.css';
import { initInput } from './input';
import { unlockAudio } from './sfx';
import { Gallery } from './gallery';
import { attach } from './game/flow';
import { LESSONS } from './learn/content';
import { openLesson } from './learn/api';
import { Menu } from './game/menu';
import { Stage } from './game/stage';
import { showMenuScreen } from './ui';
import { setVolumes } from './sfx';
import { save } from './game/save';

initInput();
const first = () => { unlockAudio(); window.removeEventListener('pointerdown', first); window.removeEventListener('keydown', first); };
window.addEventListener('pointerdown', first);
window.addEventListener('keydown', first);

const q = new URLSearchParams(location.search);
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960, height: 540,
  backgroundColor: '#241f38',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1750 }, debug: new URLSearchParams(location.search).has('debug') } },
  render: { antialias: true, roundPixels: true },
  scene: q.has('gallery') ? [Gallery] : q.has('stage') ? [Stage, Menu] : [Menu, Stage],
});
attach(game);
(window as unknown as { __learn: unknown }).__learn = { openLesson, LESSONS };
setVolumes(save.music, save.sound);
if (!q.has('gallery') && !q.has('stage')) showMenuScreen(); else document.body.classList.add('playing');
