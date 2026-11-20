/**
 * The stages. A stage is generated from its area, number and a seed, out of hand-designed segments (street, pit, steps, ambush,
 * high road, rest) so every stage has its own rhythm but the same quality. Coordinates: x runs right, the street is at y 480.
 */
import { rng } from '../art/world';

export const GROUND_Y = 480;
export type PropId = 'lamp' | 'crates' | 'barrel' | 'sign' | 'flag' | 'bunting';
export interface Spawn { kind: string; x: number; y: number; range?: number }
export interface Layout {
  length: number;
  grounds: [number, number][];
  plats: { x: number; y: number; w: number; style: 'plank' | 'awning' }[];
  cps: number[];
  spawns: Spawn[];
  bits: [number, number][];
  hearts: [number, number][];
  card: [number, number] | null;
  props: { id: PropId; x: number; y: number; front?: boolean }[];
  exit: { x: number; kind: 'door' | 'gate' | 'boss' };
}
export interface AreaDef { id: string; n: number; name: string; theme: string; blurb: string; pool: string[]; lesson: string; boss: string }
export const AREAS: AreaDef[] = [
  { id: 'market', n: 1, name: 'שוק הצעקות', theme: 'market', blurb: 'כל קול נשמע בכל מקום. כאן לומדים על כתובות MAC ועל הרכזת.', pool: ['crate', 'imp', 'dup'], lesson: 'l14', boss: 'hubhog' },
  { id: 'street', n: 2, name: 'רחוב המתג', theme: 'market', blurb: 'דלתות ממוספרות וחבילות עם תוויות. כאן לומדים איך המתג מנתב.', pool: ['flood', 'tagthief', 'warden', 'dup'], lesson: 'l15', boss: 'flooder' },
  { id: 'borders', n: 3, name: 'גשרי הגבול', theme: 'borders', blurb: 'גבולות בין שכונות. כאן סופרים אזורי התנגשות ואזורי Broadcast.', pool: ['hornhawk', 'gatewarden', 'drifter', 'crate', 'tagthief'], lesson: 'l16', boss: 'borderking' },
  { id: 'tower', n: 4, name: 'מגדל הסערה', theme: 'tower', blurb: 'סערת ה-Broadcast מחכה בפסגה.', pool: ['stormling', 'echoknight', 'hornhawk', 'gatewarden', 'flood'], lesson: '', boss: 'storm' },
];
export interface StageDef { id: string; area: AreaDef; n: number; title: string; seed: number; boss: boolean }
export const STAGES: StageDef[] = AREAS.flatMap((a) => [1, 2, 3, 4].map((n) => ({
  id: `${a.id}.${n}`, area: a, n, seed: a.n * 100 + n * 7, boss: n === 4,
  title: n === 4 ? 'הבוס: ' + a.name : `${a.name} ${n}`,
})));
export const stageById = (id: string): StageDef => STAGES.find((s) => s.id === id) ?? STAGES[0];

export function layoutFor(def: StageDef): Layout {
  const r = rng(def.seed * 977 + 13);
  const pool = def.area.pool;
  const L: Layout = { length: 0, grounds: [], plats: [], cps: [], spawns: [], bits: [], hearts: [], card: null, props: [], exit: { x: 0, kind: 'door' } };
  const diff = (def.area.n - 1) * 0.8 + def.n * 0.7;                    // 1.5 .. 6
  let x = 0;
  const ground = (a: number, b: number) => { const last = L.grounds[L.grounds.length - 1]; if (last && Math.abs(last[1] - a) < 1) last[1] = b; else L.grounds.push([a, b]); };
  const plat = (px: number, py: number, w: number) => L.plats.push({ x: px, y: py, w, style: r() < 0.5 ? 'plank' : 'awning' });
  const coins = (cx: number, cy: number, n: number, gap = 34, arc = 0) => { for (let i = 0; i < n; i++) L.bits.push([cx + i * gap, cy - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * arc]); };
  const foe = (kind: string, ex: number, ey = GROUND_Y, range = 110) => L.spawns.push({ kind, x: ex, y: ey, range });
  const pick = () => pool[Math.floor(r() * pool.length)];
  const nGround = (len: number) => Math.max(1, Math.round((len / 700) * (diff * 0.55 + 0.6)));
  const props = (a: number, b: number) => {
    const ids: PropId[] = ['crates', 'barrel', 'sign', 'flag'];
    for (let px = a + 80; px < b - 60; px += 190 + r() * 160) L.props.push({ id: ids[Math.floor(r() * ids.length)], x: px, y: GROUND_Y });
  };

  // the start: a safe pad with a lamp
  ground(0, 760); L.props.push({ id: 'lamp', x: 90, y: GROUND_Y }, { id: 'sign', x: 640, y: GROUND_Y });
  coins(330, GROUND_Y - 30, 5);
  x = 760;
  const segs = def.boss ? 0 : 6 + Math.round(def.n * 0.8) + (def.area.n > 2 ? 1 : 0);
  let last = '';
  for (let i = 0; i < segs; i++) {
    const roll = r();
    let kind = roll < 0.28 ? 'street' : roll < 0.45 ? 'pit' : roll < 0.62 ? 'steps' : roll < 0.8 ? 'ambush' : roll < 0.9 ? 'high' : 'street';
    if (kind === last && kind !== 'street') kind = 'street';
    if (i > 0 && i % 3 === 0) kind = 'rest';
    last = kind;
    const x0 = x;
    if (kind === 'street') {
      const len = 450 + r() * 300; ground(x, x + len); props(x, x + len); coins(x + 80, GROUND_Y - 30, 4);
      for (let k = 0; k < nGround(len); k++) foe(pick(), x + 160 + r() * (len - 280), GROUND_Y, 100);
      x += len;
    } else if (kind === 'pit') {
      const gap = 100 + Math.min(70, diff * 8) + r() * 30;
      L.cps.push(Math.max(40, x - 60));
      x += gap;
      if (gap > 150) plat(x - gap / 2 - 45, 410, 90);
      coins(x - gap + 20, GROUND_Y - 100, 5, gap / 5, 70);
      const len = 380 + r() * 200; ground(x, x + len); props(x, x + len); if (r() < 0.6) foe(pick(), x + len * 0.6);
      x += len;
    } else if (kind === 'steps') {
      const len = 760; ground(x, x + len);
      plat(x + 70, 395, 130); plat(x + 250, 318, 120); plat(x + 420, 246, 120); plat(x + 600, 330, 110);
      coins(x + 90, 365, 3, 32); coins(x + 270, 288, 3, 30); coins(x + 440, 216, 3, 30);
      if (!L.card && r() < 0.55) { plat(x + 330, 170, 90); L.card = [x + 375, 128]; }
      foe('imp', x + 420, 150);
      for (let k = 0; k < Math.round(diff * 0.4); k++) foe(pick(), x + 150 + r() * 450, GROUND_Y, 120);
      x += len;
    } else if (kind === 'ambush') {
      const len = 620 + diff * 40; ground(x, x + len); L.props.push({ id: 'bunting', x: x + len / 2, y: 80 });
      const n = Math.min(6, 2 + Math.round(diff * 0.7));
      for (let k = 0; k < n; k++) foe(pick(), x + 150 + (k / n) * (len - 280) + r() * 60, GROUND_Y, 90);
      coins(x + len / 2 - 80, GROUND_Y - 30, 6);
      x += len;
    } else if (kind === 'high') {
      const n = 4 + Math.round(r() * 2), gap = n * 150 + 60;
      L.cps.push(Math.max(40, x - 60));
      for (let k = 0; k < n; k++) { plat(x + 40 + k * 150, k % 2 ? 360 : 410, 100); coins(x + 60 + k * 150, (k % 2 ? 360 : 410) - 36, 2, 26); }
      x += gap;
      ground(x, x + 420); props(x, x + 420); x += 420;
    } else {                                                        // rest: a flag, a lamp and a heart
      ground(x, x + 520); L.cps.push(x + 120); L.props.push({ id: 'lamp', x: x + 260, y: GROUND_Y }); L.hearts.push([x + 330, GROUND_Y - 36]);
      props(x, x + 520); x += 520;
    }
    if (x0 > 0 && kind !== 'rest' && i % 2 === 1) L.cps.push(x0 + 60);
  }
  if (!L.card && !def.boss) { plat(x - 300, 330, 100); plat(x - 220, 250, 90); L.card = [x - 175, 210]; }
  if (def.boss) { ground(x, x + 1400); L.props.push({ id: 'lamp', x: x + 60, y: GROUND_Y }, { id: 'lamp', x: x + 1340, y: GROUND_Y }); L.cps.push(x + 20); x += 1400; L.exit = { x: x - 80, kind: 'boss' }; }
  else { ground(x, x + 520); L.props.push({ id: 'lamp', x: x + 60, y: GROUND_Y }); x += 520; L.exit = { x: x - 150, kind: def.n === 3 ? 'gate' : 'door' }; }
  L.length = x;
  L.cps = [...new Set(L.cps.map((c) => Math.round(c)))].sort((a, b) => a - b);
  return L;
}
