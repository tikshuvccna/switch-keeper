/** What a rig file exports. A rig = the parts of one creature + a function that gives its pose for what it is doing. */
import type { PartDef, Pose } from './puppet';

/** What a hero is doing. */
export interface RigCtx {
  state: 'free' | 'attack' | 'dash' | 'magic' | 'hurt' | 'asleep';
  /** Seconds, always running (idle breathing, run cycle). */
  time: number;
  /** Combo stage 0..2 and the seconds since the swing began (state 'attack'). Magic: `time` since the cast began is in `attackT`. */
  stage: number; attackT: number;
  vx: number; vy: number; grounded: boolean;
}
/** What an enemy is doing. */
export interface EnemyCtx {
  /** idle: standing; move: walking/flying; windup: telegraphing an attack (harmless); attack: the attack itself; hurt: just hit; jam: stunned and fragile;
   *  sleep: dormant (imps); wake: just woke up; dead: being disconnected (plays about 0.35 s, then the creature is removed). */
  state: 'idle' | 'move' | 'windup' | 'attack' | 'hurt' | 'jam' | 'sleep' | 'wake' | 'dead';
  time: number;                 // seconds, always running
  t: number;                    // seconds since the current state began
  vx: number; vy: number; grounded: boolean;
  /** 0..1 how much health is left (for bosses: look more angry as it drops). */
  hp: number;
  /** Boss phase 0..2 (enemies: always 0). */
  phase: number;
  /** Which attack is being telegraphed or performed (windup/attack states): 0..2. Enemies with one attack always get 0. */
  variant: number;
}

interface RigBase {
  id: string;
  /** Hebrew display name. */
  name: string;
  parts: PartDef[];
  /** Whole-puppet scale applied by the game (1 = design units are pixels). */
  scale: number;
}
export interface HeroRig extends RigBase {
  kind: 'hero';
  pose(c: RigCtx): Pose;
  /** Example contexts shown in the gallery (?gallery). */
  demo: [string, Partial<RigCtx>][];
}
export interface EnemyRig extends RigBase {
  kind: 'enemy';
  pose(c: EnemyCtx): Pose;
  /** Collision size in game pixels and where the creature sits: 'feet' = root at the bottom of the body, 'center' = root at the middle (flyers). */
  body: { w: number; h: number; origin: 'feet' | 'center' };
  demo: [string, Partial<EnemyCtx>][];
}
export type Rig = HeroRig | EnemyRig;
