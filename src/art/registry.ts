/** Every rig file in src/art/rigs/ exports RIGS; they are collected here (so adding a creature = adding a file). */
import type { EnemyRig, HeroRig, Rig } from './types';

const mods = import.meta.glob<{ RIGS: Rig[] }>('./rigs/*.ts', { eager: true });
export const ALL: Rig[] = Object.values(mods).flatMap((m) => m.RIGS ?? []);
export const heroRig = (id: string): HeroRig => ALL.find((r): r is HeroRig => r.kind === 'hero' && r.id === id) ?? (ALL.find((r): r is HeroRig => r.kind === 'hero') as HeroRig);
export const enemyRig = (id: string): EnemyRig | undefined => ALL.find((r): r is EnemyRig => r.kind === 'enemy' && r.id === id);
