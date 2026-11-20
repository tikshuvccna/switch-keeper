/**
 * The stages. A stage is generated from its area, number and a seed, out of hand-designed segments. Every area has its own
 * mix of obstacles (spikes, belts, beams, cannons, movers, fans...) and enemies, so the stages do not feel alike.
 * Coordinates: x runs right, the street is at y 480; one jump is about 135 px high and a double jump about 250 px.
 */
import { rng } from '../art/world';
import type { Obs } from './obstacles';

export const GROUND_Y = 480;
export type PropId = 'lamp' | 'crates' | 'barrel' | 'sign' | 'flag' | 'bunting';
export interface Spawn { kind: string; x: number; y: number; range?: number; elite?: boolean }
export interface Layout {
  length: number;
  grounds: [number, number][];
  plats: { x: number; y: number; w: number; style: 'plank' | 'awning' }[];
  cps: number[];
  spawns: Spawn[];
  bits: [number, number][];
  hearts: [number, number][];
  /** Pink parry orbs: jump into them and press jump again to bounce off. */
  orbs?: [number, number][];
  obs?: Obs[];
  card: [number, number] | null;
  props: { id: PropId; x: number; y: number; front?: boolean }[];
  exit: { x: number; kind: 'door' | 'gate' | 'boss' };
}
export interface AreaDef { id: string; n: number; name: string; theme: string; blurb: string; pool: string[]; lesson: string; boss: string; mix: [string, number][] }
export const AREAS: AreaDef[] = [
  {
    id: 'market', n: 1, name: 'שוק הצעקות', theme: 'market', blurb: 'כל קול נשמע בכל מקום. כאן לומדים על כתובות MAC ועל הרכזת.', lesson: 'l14', boss: 'hubhog',
    pool: ['crate', 'imp', 'dup', 'crategun', 'dupgun'],
    mix: [['street', 3], ['pit', 2], ['steps', 2], ['ambush', 2], ['spikes', 3], ['crumble', 2], ['gauntlet', 1], ['springs', 2], ['high', 1], ['orbtrail', 1], ['fan', 1]],
  },
  {
    id: 'street', n: 2, name: 'רחוב המתג', theme: 'market', blurb: 'דלתות ממוספרות וחבילות עם תוויות. כאן לומדים איך המתג מנתב.', lesson: 'l15', boss: 'flooder',
    pool: ['flood', 'tagthief', 'warden', 'dup', 'crategun'],
    mix: [['belts', 4], ['beams', 3], ['movers', 2], ['street', 2], ['ambush', 2], ['gauntlet', 3], ['springs', 1], ['spikes', 1], ['crumble', 1], ['orbtrail', 1], ['fan', 1]],
  },
  {
    id: 'borders', n: 3, name: 'גשרי הגבול', theme: 'borders', blurb: 'גבולות בין שכונות. כאן סופרים אזורי התנגשות ואזורי Broadcast.', lesson: 'l16', boss: 'borderking',
    pool: ['hornhawk', 'gatewarden', 'drifter', 'crate', 'tagthief', 'crategun'],
    mix: [['movers', 4], ['beams', 2], ['swingers', 3], ['fan', 3], ['orbtrail', 3], ['high', 2], ['pit', 1], ['ambush', 2], ['gauntlet', 1], ['crumble', 2]],
  },
  {
    id: 'tower', n: 4, name: 'מגדל הסערה', theme: 'tower', blurb: 'סערת ה-Broadcast מחכה בפסגה.', lesson: '', boss: 'storm',
    pool: ['stormling', 'echoknight', 'hornhawk', 'gatewarden', 'flood', 'dupgun'],
    mix: [['swingers', 3], ['beams', 3], ['fan', 3], ['crumble', 3], ['movers', 2], ['gauntlet', 3], ['spikes', 2], ['belts', 2], ['orbtrail', 2], ['ambush', 2]],
  },
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
  const L: Layout = { length: 0, grounds: [], plats: [], cps: [], spawns: [], bits: [], hearts: [], orbs: [], obs: [], card: null, props: [], exit: { x: 0, kind: 'door' } };
  const diff = (def.area.n - 1) * 0.8 + def.n * 0.7;                    // 1.5 .. 6
  let x = 0;
  const ground = (a: number, b: number) => { const last = L.grounds[L.grounds.length - 1]; if (last && Math.abs(last[1] - a) < 1) last[1] = b; else L.grounds.push([a, b]); };
  const plat = (px: number, py: number, w: number) => L.plats.push({ x: px, y: py, w, style: r() < 0.5 ? 'plank' : 'awning' });
  const coins = (cx: number, cy: number, n: number, gap = 34, arc = 0) => { for (let i = 0; i < n; i++) L.bits.push([cx + i * gap, cy - Math.sin((i / Math.max(1, n - 1)) * Math.PI) * arc]); };
  const foe = (kind: string, ex: number, ey = GROUND_Y, range = 110, elite = false) => L.spawns.push({ kind, x: ex, y: ey, range, elite });
  const orb = (ox: number, oy: number) => (L.orbs as [number, number][]).push([ox, oy]);
  const obs = (o: Obs) => (L.obs as Obs[]).push(o);
  const pick = () => pool[Math.floor(r() * pool.length)];
  const flying = (k: string) => ['imp', 'hornhawk', 'drifter', 'stormling'].includes(k);
  const place = (k: string, ex: number, range = 100) => foe(k, ex, flying(k) ? 230 + r() * 60 : GROUND_Y, range);
  const props = (a: number, b: number) => {
    const ids: PropId[] = ['crates', 'barrel', 'sign', 'flag'];
    for (let px = a + 80; px < b - 60; px += 200 + r() * 170) L.props.push({ id: ids[Math.floor(r() * ids.length)], x: px, y: GROUND_Y });
  };
  const nFoes = (len: number) => Math.max(1, Math.round((len / 700) * (diff * 0.55 + 0.7)));

  // the start: a safe pad with a lamp
  ground(0, 760); L.props.push({ id: 'lamp', x: 90, y: GROUND_Y }, { id: 'sign', x: 640, y: GROUND_Y });
  coins(330, GROUND_Y - 30, 5);
  x = 760;

  const SEG: Record<string, () => void> = {
    street() { const len = 480 + r() * 300; ground(x, x + len); props(x, x + len); coins(x + 80, GROUND_Y - 30, 4); for (let k = 0; k < nFoes(len); k++) place(pick(), x + 170 + r() * (len - 300)); x += len; },
    pit() {
      const gap = 110 + Math.min(80, diff * 10) + r() * 40;
      L.cps.push(Math.max(40, x - 60)); x += gap;
      if (gap > 170) plat(x - gap / 2 - 45, 400, 90);
      if (gap > 200) orb(x - gap / 2, 330);
      coins(x - gap + 20, GROUND_Y - 110, 5, gap / 5, 80);
      const len = 380 + r() * 200; ground(x, x + len); props(x, x + len); if (r() < 0.7) place(pick(), x + len * 0.6); x += len;
    },
    steps() {
      const len = 800; ground(x, x + len);
      plat(x + 70, 395, 130); plat(x + 250, 315, 120); plat(x + 430, 235, 120); plat(x + 620, 330, 110);
      coins(x + 90, 365, 3, 32); coins(x + 270, 285, 3, 30); coins(x + 450, 205, 3, 30);
      if (!L.card && r() < 0.6) { plat(x + 340, 150, 90); L.card = [x + 385, 108]; orb(x + 340, 250); }
      place(pick(), x + 430, 80);
      for (let k = 0; k < Math.round(diff * 0.4); k++) place(pick(), x + 150 + r() * 500, 120);
      x += len;
    },
    ambush() {
      const len = 640 + diff * 40; ground(x, x + len); L.props.push({ id: 'bunting', x: x + len / 2, y: 80 });
      const n = Math.min(7, 2 + Math.round(diff * 0.8));
      for (let k = 0; k < n; k++) place(pick(), x + 150 + (k / n) * (len - 280) + r() * 60, 90);
      coins(x + len / 2 - 80, GROUND_Y - 30, 6); x += len;
    },
    high() {
      const n = 4 + Math.round(r() * 2), gap = n * 150 + 60;
      L.cps.push(Math.max(40, x - 60));
      for (let k = 0; k < n; k++) { plat(x + 40 + k * 150, k % 2 ? 350 : 410, 100); coins(x + 60 + k * 150, (k % 2 ? 350 : 410) - 36, 2, 26); }
      x += gap; ground(x, x + 420); props(x, x + 420); x += 420;
    },
    spikes() {
      const len = 760; ground(x, x + len); props(x, x + len);
      for (let k = 0; k < 2 + (diff > 3 ? 1 : 0); k++) {
        const sx = x + 160 + k * 220, w = 66 + r() * 44;
        obs({ kind: 'spikes', x: sx, y: GROUND_Y, w }); coins(sx - 8, GROUND_Y - 120, 4, w / 3, 60);
      }
      place(pick(), x + 650, 60); x += len;
    },
    crumble() {
      const gap = 460; L.cps.push(Math.max(40, x - 60));
      for (let k = 0; k < 4; k++) { obs({ kind: 'crumble', x: x + 20 + k * 118, y: k % 2 ? 400 : 440, w: 96 }); coins(x + 50 + k * 118, (k % 2 ? 400 : 440) - 34, 2, 26); }
      x += gap; ground(x, x + 360); props(x, x + 360); place(pick(), x + 240); x += 360;
    },
    gauntlet() {
      const len = 760; ground(x, x + len); props(x, x + len);
      obs({ kind: 'cannon', x: x + len - 70, y: GROUND_Y, dir: -1, speed: 2.4, phase: 0 });
      if (diff > 2.5) obs({ kind: 'cannon', x: x + 70, y: GROUND_Y, dir: 1, speed: 3, phase: 1.3 });
      orb(x + 300, 360); orb(x + 460, 330); coins(x + 250, 300, 5, 40, 40);
      place(pick(), x + 380, 120); x += len;
    },
    springs() {
      const len = 620; ground(x, x + len); props(x, x + len);
      obs({ kind: 'spring', x: x + 140, y: GROUND_Y }); plat(x + 200, 190, 120); coins(x + 230, 156, 4, 28);
      if (!L.card && r() < 0.5) L.card = [x + 260, 150];
      place(pick(), x + 420); x += len;
    },
    movers() {
      const gap = 420; L.cps.push(Math.max(40, x - 60));
      obs({ kind: 'mover', x: x + 20, y: 410, w: 110, dx: 150, speed: 1.1 + diff * 0.05 });
      obs({ kind: 'mover', x: x + 250, y: 400, w: 100, dx: 110, dy: -70, speed: 1.3, phase: 1 });
      coins(x + 80, 330, 4, 70, 60);
      x += gap; ground(x, x + 380); props(x, x + 380); place(pick(), x + 260); x += 380;
    },
    belts() {
      const len = 760; ground(x, x + len); props(x, x + len);
      obs({ kind: 'belt', x: x + 140, y: GROUND_Y, w: 300, dir: r() < 0.5 ? -1 : 1 });
      place(pick(), x + 260, 100); place(pick(), x + 560, 100); coins(x + 200, GROUND_Y - 40, 6); x += len;
    },
    beams() {
      const len = 780; ground(x, x + len); props(x, x + len);
      obs({ kind: 'beam', x: x + 140, y: GROUND_Y, w: 190, speed: 3.2 + r() });
      obs({ kind: 'beam', x: x + 440, y: GROUND_Y, w: 170, speed: 3.6 + r(), phase: 1.5 });
      coins(x + 355, GROUND_Y - 40, 3); place(pick(), x + 360, 40); x += len;
    },
    swingers() {
      const len = 700; ground(x, x + len); props(x, x + len);
      obs({ kind: 'swinger', x: x + 220, y: GROUND_Y - 360, len: 300, speed: 1.5 + diff * 0.05 });
      obs({ kind: 'swinger', x: x + 470, y: GROUND_Y - 360, len: 300, speed: 1.35, phase: 1.6 });
      coins(x + 330, GROUND_Y - 40, 4, 28); place(pick(), x + 330, 50); x += len;
    },
    fan() {
      const len = 700; ground(x, x + len); props(x, x + len);
      obs({ kind: 'fan', x: x + 150, y: GROUND_Y, w: 80, len: 340 });
      plat(x + 240, 190, 130); coins(x + 120, 280, 5, 0, 0); coins(x + 270, 156, 4, 28);
      if (!L.card && r() < 0.5) L.card = [x + 300, 150];
      place(pick(), x + 460); x += len;
    },
    orbtrail() {
      const gap = 420; L.cps.push(Math.max(40, x - 60));
      orb(x + 90, 360); orb(x + 210, 330); orb(x + 330, 360); coins(x + 60, 300, 8, 44, 30);
      x += gap; ground(x, x + 400); props(x, x + 400); place(pick(), x + 260); x += 400;
    },
    rest() { ground(x, x + 520); L.cps.push(x + 120); L.props.push({ id: 'lamp', x: x + 260, y: GROUND_Y }); L.hearts.push([x + 330, GROUND_Y - 36]); props(x, x + 520); x += 520; },
  };
  const weights = def.area.mix;
  const total = weights.reduce((a, [, w]) => a + w, 0);
  const chooseSeg = (): string => { let t = r() * total; for (const [k, w] of weights) { t -= w; if (t <= 0) return k; } return 'street'; };

  const segs = def.boss ? 0 : 7 + Math.round(def.n * 1.2);
  let last = '';
  for (let i = 0; i < segs; i++) {
    let kind = chooseSeg();
    if (kind === last) kind = chooseSeg();
    if (i > 0 && i % 4 === 0) kind = 'rest';
    last = kind;
    const x0 = x;
    SEG[kind]();
    if (x0 > 0 && kind !== 'rest' && i % 2 === 1) L.cps.push(x0 + 60);
  }
  // a mini-boss at the end of stages 2 and 3
  if (!def.boss && def.n >= 2) { const mk = pool[def.n % pool.length]; ground(x, x + 700); foe(mk, x + 440, flying(mk) ? 250 : GROUND_Y, 160, true); L.props.push({ id: 'bunting', x: x + 350, y: 80 }); L.cps.push(x + 40); x += 700; }
  if (!L.card && !def.boss) { plat(x - 300, 330, 100); plat(x - 220, 250, 90); L.card = [x - 175, 210]; }
  if (def.boss) {
    ground(x, x + 1400); L.props.push({ id: 'lamp', x: x + 60, y: GROUND_Y }, { id: 'lamp', x: x + 1340, y: GROUND_Y });
    plat(x + 420, 360, 140); plat(x + 840, 360, 140); orb(x + 700, 300); orb(x + 1100, 330);
    L.cps.push(x + 20); x += 1400; L.exit = { x: x - 80, kind: 'boss' };
  } else { ground(x, x + 520); L.props.push({ id: 'lamp', x: x + 60, y: GROUND_Y }); x += 520; L.exit = { x: x - 150, kind: def.n === 1 ? 'gate' : 'door' }; }
  L.length = x;
  L.cps = [...new Set(L.cps.map((c) => Math.round(c)))].sort((a, b) => a - b);
  return L;
}
