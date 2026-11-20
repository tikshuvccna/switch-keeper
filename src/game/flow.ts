/**
 * How the game moves between the menu, the stages, the lesson gates and the boss. The Phaser scenes call into this; the DOM screens (ui.ts)
 * call back. Lessons are gates inside the world: the third stage of an area ends at a locked gate that needs the area's lesson.
 */
import type * as Phaser from 'phaser';
import { openLesson } from '../learn/api';
import { showMenuScreen, showResult } from '../ui';
import { sfx } from '../sfx';
import { AREAS, STAGES, stageById, type StageDef } from './levels';
import { lesson, payOnce, save, store } from './save';

export interface Stats { time: number; kills: number; bits: number; falls: number; card: boolean; hp: number }
let game: Phaser.Game | null = null;

export function attach(g: Phaser.Game): void { game = g; }

export function isOpen(id: string): boolean {
  const i = STAGES.findIndex((s) => s.id === id);
  if (i <= 0) return true;
  const prev = STAGES[i - 1];
  const rec = save.stages[prev.id];
  if (prev.boss) return !!save.areas[prev.area.id];
  return !!rec && rec.stars > 0;
}
export function lessonPassed(areaId: string): boolean {
  const a = AREAS.find((x) => x.id === areaId);
  if (!a || !a.lesson) return AREAS.slice(0, 3).every((x) => lesson(x.lesson).quiz && lesson(x.lesson).medal > 0);
  const l = lesson(a.lesson);
  return l.quiz && l.medal > 0;
}

export function play(id: string): void {
  if (!game) return;
  document.body.classList.add('playing');
  document.getElementById('screen')?.classList.add('hide');
  const sc = game.scene;
  sc.getScenes(true).forEach((s) => { if (s.scene.key !== 'stage') sc.stop(s.scene.key); });
  if (sc.isActive('stage')) sc.stop('stage');
  sc.start('stage', { id });
}
export function toMenu(): void {
  if (!game) return;
  document.body.classList.remove('playing');
  const sc = game.scene;
  sc.getScenes(true).forEach((s) => sc.stop(s.scene.key));
  sc.start('menu');
  showMenuScreen();
}

export const flow = {
  onStage(_s: Phaser.Scene): void { /* hook for tutorials */ },
  /** The player used the exit of a stage. */
  finish(scene: Phaser.Scene, def: StageDef, st: Stats): void {
    // a lesson gate: the third stage ends at a gate that needs the area's lesson
    if (def.n === 1 && def.area.lesson && !lessonPassed(def.area.id)) {
      const lessonId = def.area.lesson;
      sfx.card();
      openLesson(lessonId, def.area.name, (res) => {
        if (res.passed) { this.complete(scene, def, st); } else { (scene as unknown as { resume(): void }).resume(); }
      });
      return;
    }
    this.complete(scene, def, st);
  },
  /** The hero talks to Ora: the lesson of the area opens (as often as the player likes). */
  talk(scene: Phaser.Scene, def: StageDef): void {
    sfx.card();
    openLesson(def.area.lesson, def.area.name, () => { (scene as unknown as { resume(): void }).resume(); });
  },
  complete(_scene: Phaser.Scene, def: StageDef, st: Stats): void {
    const stars = 1 + (st.falls === 0 ? 1 : 0) + (st.card || st.hp >= 0.5 ? 1 : 0);
    const rec = (save.stages[def.id] ??= { stars: 0, best: 0 });
    const first = rec.stars === 0;
    rec.stars = Math.max(rec.stars, stars);
    if (!rec.best || st.time < rec.best) rec.best = st.time;
    let bonus = 0;
    if (first) bonus += payOnce('stage.' + def.id, 30);
    store();
    const next = STAGES[STAGES.findIndex((s) => s.id === def.id) + 1];
    showResult({ def, stars, stats: st, bonus, first, nextId: next && next.area === def.area ? next.id : null });
  },
  /** The boss is beaten: the area is done. */
  bossDown(def: StageDef, st: Stats): void {
    save.areas[def.area.id] = true;
    const bonus = payOnce('area.' + def.area.id, 100);
    const rec = (save.stages[def.id] ??= { stars: 0, best: 0 });
    rec.stars = 3; rec.best = rec.best ? Math.min(rec.best, st.time) : st.time;
    store();
    const next = AREAS[AREAS.findIndex((a) => a.id === def.area.id) + 1];
    showResult({ def, stars: 3, stats: st, bonus, first: true, nextId: null, areaDone: next ? next.name : 'כל העיר' });
  },
  /** The 10-15 minute rule: a storm rolls in and carries the player to the lesson tower. */
  storm(scene: Phaser.Scene): void {
    save.playMin = 0; store();
    const next = AREAS.find((a) => a.lesson && isOpen(a.id + '.1') && !lessonPassed(a.id));
    scene.cameras.main.fadeOut(900, 40, 20, 80);
    scene.time.delayedCall(950, () => { toMenu(); if (next) setTimeout(() => openLesson(next.lesson, next.name, () => { showMenuScreen(); }), 400); });
  },
  go: play,
  stageById,
};
