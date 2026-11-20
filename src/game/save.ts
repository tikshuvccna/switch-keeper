/** Everything the player keeps between sessions (localStorage). */
export interface Save {
  name: string;
  hero: string;
  heroes: string[];
  level: number; xp: number; bits: number; skillPoints: number;
  skills: Record<string, number>;
  gear: { lantern: string | null; boots: string | null; badge: string | null };
  owned: string[];
  cards: string[];
  /** Stage records: stars 0-3 and best time. */
  stages: Record<string, { stars: number; best: number }>;
  /** Areas whose boss was beaten. */
  areas: Record<string, boolean>;
  lessons: Record<string, { quiz: boolean; medal: number }>;
  paid: string[];
  music: number; sound: number; calm: boolean;
  /** Minutes played since the last storm (the 10-15 minute rule). */
  playMin: number;
}
const KEY = 'switchkeeper.save.v1';
export function newSave(): Save {
  return { name: '', hero: 'bumper', heroes: ['bumper'], level: 1, xp: 0, bits: 0, skillPoints: 0, skills: {}, gear: { lantern: null, boots: null, badge: null }, owned: [], cards: [], stages: {}, areas: {}, lessons: {}, paid: [], music: 1, sound: 1, calm: false, playMin: 0 };
}
export const save: Save = (() => {
  const s = newSave();
  try { Object.assign(s, JSON.parse(localStorage.getItem(KEY) ?? '{}')); } catch { /* no storage */ }
  return s;
})();
export function store(): void { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch { /* no storage */ } }
export function payOnce(key: string, bits: number): number { if (save.paid.includes(key)) return 0; save.paid.push(key); save.bits += bits; return bits; }
export function lesson(id: string): { quiz: boolean; medal: number } { return (save.lessons[id] ??= { quiz: false, medal: 0 }); }
