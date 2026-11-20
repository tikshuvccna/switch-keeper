/**
 * The stages. A stage is generated from its area, number and a seed, out of hand-designed segments. Every area has its own
 * mix of obstacles (spikes, belts, beams, cannons, movers, fans...) and enemies, so the stages do not feel alike.
 * Coordinates: x runs right, the street is at y 480; one jump is about 135 px high and a double jump about 250 px.
 */
import { rng } from '../art/world';
import type { Obs } from './obstacles';
import { worldDef } from './worlds';

export const GROUND_Y = 480;
/** Hebrew names of the worlds (the stage titles). */
export const WORLD_NAMES: Record<string, string> = {
  market: 'שוק הצעקות', candy: 'ארץ הממתקים', desert: 'מדבר החול', mountain: 'הר הרוחות', network: 'עולם הרשת', underwater: 'מתחת למים', snow: 'עולם השלג', cyber: 'עיר הסייבר',
  lava: 'הר הגעש', flying: 'מעל העננים', giant: 'עולם הענקים', musical: 'עולם המוזיקה', matrix: 'המטריקס', space: 'החלל', antigravity: 'אנטי-כבידה', chase: 'המרדף',
};
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
  /** Ceiling slabs (antigravity worlds): [x0, x1] at the top of the screen. */
  ceilings?: [number, number][];
  card: [number, number] | null;
  props: { id: PropId; x: number; y: number; front?: boolean }[];
  exit: { x: number; kind: 'door' | 'gate' | 'boss' };
}
export interface AreaDef { id: string; n: number; name: string; theme: string; blurb: string; pool: string[]; lesson: string; boss: string; mix: [string, number][]; /** The world of each regular stage, in order, and of the boss arena. */ worlds: string[]; bossWorld: string }
export const AREAS: AreaDef[] = [
  {
    id: 'market', n: 1, name: 'שוק הצעקות', theme: 'market', blurb: 'כל קול נשמע בכל מקום. כאן לומדים על כתובות MAC ועל הרכזת.', lesson: 'l14', boss: 'hubhog',
    worlds: ['market', 'candy', 'desert', 'mountain'], bossWorld: 'market',
    pool: ['crate', 'imp', 'dup', 'crategun', 'dupgun'],
    mix: [['street', 3], ['pit', 2], ['steps', 2], ['ambush', 2], ['spikes', 3], ['crumble', 2], ['gauntlet', 1], ['springs', 2], ['high', 1], ['orbtrail', 1], ['fan', 1]],
  },
  {
    id: 'street', n: 2, name: 'רחוב המתג', theme: 'market', blurb: 'דלתות ממוספרות וחבילות עם תוויות. כאן לומדים איך המתג מנתב.', lesson: 'l15', boss: 'flooder',
    worlds: ['network', 'underwater', 'snow', 'cyber'], bossWorld: 'network',
    pool: ['flood', 'tagthief', 'warden', 'dup', 'crategun'],
    mix: [['belts', 4], ['beams', 3], ['movers', 2], ['street', 2], ['ambush', 2], ['gauntlet', 3], ['springs', 1], ['spikes', 1], ['crumble', 1], ['orbtrail', 1], ['fan', 1]],
  },
  {
    id: 'borders', n: 3, name: 'גשרי הגבול', theme: 'borders', blurb: 'גבולות בין שכונות. כאן סופרים אזורי התנגשות ואזורי Broadcast.', lesson: 'l16', boss: 'borderking',
    worlds: ['lava', 'flying', 'giant', 'musical'], bossWorld: 'mountain',
    pool: ['hornhawk', 'gatewarden', 'drifter', 'crate', 'tagthief', 'crategun'],
    mix: [['movers', 4], ['beams', 2], ['swingers', 3], ['fan', 3], ['orbtrail', 3], ['high', 2], ['pit', 1], ['ambush', 2], ['gauntlet', 1], ['crumble', 2]],
  },
  {
    id: 'tower', n: 4, name: 'מגדל הסערה', theme: 'tower', blurb: 'סערת ה-Broadcast מחכה בפסגה.', lesson: '', boss: 'storm',
    worlds: ['matrix', 'space', 'antigravity', 'chase'], bossWorld: 'space',
    pool: ['stormling', 'echoknight', 'hornhawk', 'gatewarden', 'flood', 'dupgun'],
    mix: [['swingers', 3], ['beams', 3], ['fan', 3], ['crumble', 3], ['movers', 2], ['gauntlet', 3], ['spikes', 2], ['belts', 2], ['orbtrail', 2], ['ambush', 2]],
  },
];
export interface StageDef { id: string; area: AreaDef; n: number; title: string; seed: number; boss: boolean; world: string }
export const STAGES: StageDef[] = AREAS.flatMap((a) => [1, 2, 3, 4, 5].map((n) => ({
  id: `${a.id}.${n}`, area: a, n, seed: a.n * 100 + n * 7, boss: n === 5, world: n === 5 ? a.bossWorld : a.worlds[n - 1],
  title: n === 5 ? 'הבוס: ' + a.name : WORLD_NAMES[a.worlds[n - 1]] ?? `${a.name} ${n}`,
})));
export const stageById = (id: string): StageDef => STAGES.find((s) => s.id === id) ?? STAGES[0];

export function layoutFor(def: StageDef): Layout {
  const r = rng(def.seed * 977 + 13);
  const wd = worldDef(def.world);
  const pool = wd.pool ?? def.area.pool;
  const L: Layout = { length: 0, grounds: [], plats: [], cps: [], spawns: [], bits: [], hearts: [], orbs: [], obs: [], card: null, props: [], exit: { x: 0, kind: 'door' } };
  const diff = (def.area.n - 1) * 0.8 + Math.min(def.n, 4) * 0.7;                    // 1.5 .. 6
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

  const ceilGaps: [number, number][] = [];
  const cgap = (a: number, b: number) => ceilGaps.push([a, b]);
  const SEG: Record<string, () => void> = {
    // ---- candy
    sticky() { const len = 780; ground(x, x + len); props(x, x + len); obs({ kind: 'sand', x: x + 150, y: GROUND_Y, w: 210, tint: 0xe58fb5 }); obs({ kind: 'sand', x: x + 470, y: GROUND_Y, w: 180, tint: 0xe58fb5 }); place(pick(), x + 260, 80); place(pick(), x + 560, 80); coins(x + 160, GROUND_Y - 110, 5, 36, 40); x += len; },
    gumdrops() {
      L.cps.push(Math.max(40, x - 60)); const n = 4; let cx = x;
      for (let k = 0; k < n; k++) { ground(cx + 20, cx + 140); obs({ kind: 'spring', x: cx + 80, y: GROUND_Y, w: 90, tint: 0xff9bd0 }); coins(cx + 150, 250, 3, 40, 30); cx += 330; }
      x = cx; ground(x, x + 360); props(x, x + 360); place(pick(), x + 240); x += 360;
    },
    // ---- desert
    sand() { const len = 800; ground(x, x + len); props(x, x + len); obs({ kind: 'sand', x: x + 120, y: GROUND_Y, w: 230, tint: 0xe3b25a }); obs({ kind: 'spikes', x: x + 440, y: GROUND_Y, w: 66 }); obs({ kind: 'sand', x: x + 540, y: GROUND_Y, w: 190, tint: 0xe3b25a }); place(pick(), x + 380, 70); place(pick(), x + 690, 50); coins(x + 130, GROUND_Y - 120, 5, 40, 40); x += len; },
    // ---- mountain
    climb() {
      const len = 900; ground(x, x + len); props(x, x + len);
      [[60, 405], [200, 325], [340, 245], [480, 165], [650, 255], [790, 345]].forEach(([dx, y]) => { plat(x + dx, y, 100); coins(x + dx + 20, y - 34, 2, 30); });
      orb(x + 560, 230); if (!L.card && r() < 0.6) { plat(x + 400, 105, 90); L.card = [x + 445, 62]; }
      place('hornhawk' in {} ? 'hornhawk' : pick(), x + 520, 60); x += len;
    },
    // ---- snow
    icefloor() { const len = 980; ground(x, x + len); props(x, x + len); obs({ kind: 'spikes', x: x + 300, y: GROUND_Y, w: 66 }); obs({ kind: 'spikes', x: x + 620, y: GROUND_Y, w: 88 }); coins(x + 120, GROUND_Y - 40, 6, 44); place(pick(), x + 760, 90); place(pick(), x + 480, 60); x += len; },
    // ---- lava
    lava() {
      L.cps.push(Math.max(40, x - 60));
      for (let k = 0; k < 4; k++) obs({ kind: 'crumble', x: x + 30 + k * 125, y: 430 - (k % 2) * 50, w: 96 });
      obs({ kind: 'mover', x: x + 40, y: 360, w: 100, dx: 110, speed: 1.2 }); coins(x + 70, 300, 5, 80, 60);
      x += 540; ground(x, x + 380); props(x, x + 380); place(pick(), x + 260); x += 380;
    },
    geysers() { const len = 780; ground(x, x + len); props(x, x + len); obs({ kind: 'geyser', x: x + 200, y: GROUND_Y, speed: 3.4 }); obs({ kind: 'geyser', x: x + 440, y: GROUND_Y, speed: 3.8, phase: 1.5 }); obs({ kind: 'geyser', x: x + 650, y: GROUND_Y, speed: 3.2, phase: 0.7 }); coins(x + 300, GROUND_Y - 40, 4, 36); place(pick(), x + 330, 40); x += len; },
    // ---- the underwater reef
    reef() {
      const len = 820; ground(x, x + len);
      [[80, 400], [250, 330], [420, 260], [590, 340], [720, 420]].forEach(([dx, y]) => { plat(x + dx, y, 110); coins(x + dx + 30, y - 40, 3, 26); });
      for (let k = 0; k < 3; k++) foe(pool[k % pool.length], x + 220 + k * 220, 200 + r() * 160, 140);
      coins(x + 40, 200, 8, 80, 60); x += len;
    },
    urchins() { const len = 780; ground(x, x + len); props(x, x + len); for (let k = 0; k < 3; k++) obs({ kind: 'spikes', x: x + 160 + k * 200, y: GROUND_Y, w: 44 + r() * 30 }); place(pick(), x + 320, 140); place(pick(), x + 560, 140); coins(x + 120, 330, 6, 70, 60); x += len; },
    // ---- the giant world: tunnels for the small, walls for the big
    tunnels() {
      const len = 820; ground(x, x + len); props(x, x + len);
      obs({ kind: 'lowbar', x: x + 260, y: GROUND_Y - 56, w: 220 }); coins(x + 290, GROUND_Y - 30, 5, 32); place(pick(), x + 640, 80); x += len;
    },
    walls() {
      const len = 820; ground(x, x + len); props(x, x + len);
      obs({ kind: 'wall', x: x + 330, y: 150, w: 46, h: 330 }); coins(x + 410, GROUND_Y - 30, 5, 32); place(pick(), x + 200, 80); place(pick(), x + 620, 80); x += len;
    },
    // ---- space: floating rocks over wide gaps (low gravity)
    asteroids() {
      L.cps.push(Math.max(40, x - 60)); const gap = 520;
      obs({ kind: 'mover', x: x + 30, y: 420, w: 120, dx: 130, speed: 1 }); obs({ kind: 'mover', x: x + 280, y: 360, w: 110, dx: 0, dy: 90, speed: 1.1, phase: 1 });
      plat(x + 190, 300, 90); coins(x + 60, 260, 8, 50, 70); x += gap; ground(x, x + 380); props(x, x + 380); place(pick(), x + 250); x += 380;
    },
    // ---- antigravity: ground and ceiling, with spikes and gaps on both
    flips() {
      const v = Math.floor(r() * 4), len = 960; ground(x, x + len);
      const sp = (a: number, w: number, top: boolean) => obs({ kind: 'spikes', x: x + a, y: top ? 64 : GROUND_Y, w, flip: top });
      if (v === 0) { sp(220, 70, false); sp(520, 70, true); sp(800, 70, false); coins(x + 180, GROUND_Y - 40, 5, 30); coins(x + 480, 110, 5, 30); }
      else if (v === 1) { cgap(x + 300, x + 520); obs({ kind: 'crumble', x: x + 330, y: 300, w: 150 }); sp(640, 90, false); coins(x + 380, 120, 4, 40); }
      else if (v === 2) { sp(300, 120, false); sp(300, 120, true); place(pick(), x + 520, 80); coins(x + 560, 180, 5, 36, 50); }
      else { sp(180, 60, true); sp(420, 60, false); sp(660, 60, true); place(pick(), x + 760, 60); coins(x + 200, 120, 4, 30); coins(x + 440, GROUND_Y - 40, 4, 30); }
      x += len;
    },

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
  SEG.flyzone = () => {
    const len = 6200 + def.n * 300; let px = x + 300;
    while (px < x + len - 400) {
      const t = r();
      if (t < 0.45) { const h = 150 + r() * 120; obs({ kind: 'pillar', x: px, y: r() < 0.5 ? 0 : 540 - h, w: 70, h, tint: 0xffffff }); coins(px - 80, 200 + r() * 140, 4, 34, 40); }
      else if (t < 0.7) { const ht = 130 + r() * 90, hb = 130 + r() * 90; obs({ kind: 'pillar', x: px, y: 0, w: 70, h: ht }); obs({ kind: 'pillar', x: px, y: 540 - hb, w: 70, h: hb }); coins(px + 4, ht + 40, 3, 0, 0); }
      else { foe(pool[Math.floor(r() * pool.length)], px, 130 + r() * 280, 120); foe(pool[Math.floor(r() * pool.length)], px + 120, 130 + r() * 280, 120); }
      if (Math.round((px - x) / 330) % 5 === 4) L.cps.push(px - 120);
      px += 300 + r() * 120;
    }
    x += len; ground(x, x + 520); L.props.push({ id: 'lamp', x: x + 60, y: GROUND_Y }); x += 520; L.exit = { x: x - 150, kind: 'door' };
  };
  SEG.beats = () => {
    const B = 112, bars = 20 + def.n * 2; let bx = x + 280;
    ground(x, bx);
    for (let i = 0; i < bars; i++) {
      const pat = i < 3 ? [0, 3][i % 2] : Math.floor(r() * 7);
      const bar = bx;
      if (pat === 1) { ground(bar, bar + 2 * B); ground(bar + 3.3 * B, bar + 4 * B); }
      else ground(bar, bar + 4 * B);
      if (pat === 0) { obs({ kind: 'spikes', x: bar + 2 * B - 10, y: GROUND_Y, w: 66 }); coins(bar + 1.5 * B, 330, 4, 28, 50); }
      else if (pat === 1) { coins(bar + 2 * B, 330, 4, 36, 70); }
      else if (pat === 2) { foe('crate', bar + 3 * B, GROUND_Y, 20); }
      else if (pat === 3) { plat(bar + 1.2 * B, 380, 150); coins(bar + 1.4 * B, 340, 4, 30); }
      else if (pat === 4) { obs({ kind: 'beam', x: bar + 1.6 * B, y: GROUND_Y, w: 150, speed: 2, phase: 0 }); }
      else if (pat === 5) { obs({ kind: 'spring', x: bar + B, y: GROUND_Y }); plat(bar + 1.6 * B, 200, 150); coins(bar + 1.7 * B, 166, 5, 24); }
      else { obs({ kind: 'cannon', x: bar + 3.7 * B, y: GROUND_Y, dir: -1, speed: 1, phase: 0.3 }); orb(bar + 2 * B, 330); }
      if (i % 6 === 5) L.cps.push(bar + 4 * B + 20);
      bx = bar + 4 * B;
    }
    x = bx; ground(x, x + 520); L.props.push({ id: 'lamp', x: x + 60, y: GROUND_Y }); x += 520; L.exit = { x: x - 150, kind: 'door' };
  };
  const weights = wd.mix;
  const total = weights.reduce((a, [, w]) => a + w, 0);
  const chooseSeg = (): string => { let t = r() * total; for (const [k, w] of weights) { t -= w; if (t <= 0) return k; } return 'street'; };

  const single = wd.mech.fly || wd.mech.auto;
  const segs = def.boss ? 0 : single ? 1 : 7 + Math.round(def.n * 1.0);
  let last = '';
  for (let i = 0; i < segs; i++) {
    let kind = chooseSeg();
    if (kind === last) kind = chooseSeg();
    if (single) kind = wd.mech.fly ? 'flyzone' : 'beats';
    else if (i > 0 && i % 4 === 0) kind = 'rest';
    last = kind;
    const x0 = x;
    SEG[kind]();
    if (x0 > 0 && kind !== 'rest' && i % 2 === 1) L.cps.push(x0 + 60);
  }
  // a mini-boss at the end of stages 2 to 4 (not in the flying and rhythm worlds)
  if (!def.boss && def.n >= 2 && !single) { const mk = pool[def.n % pool.length]; ground(x, x + 700); foe(mk, x + 440, flying(mk) ? 250 : GROUND_Y, 160, true); L.props.push({ id: 'bunting', x: x + 350, y: 80 }); L.cps.push(x + 40); x += 700; }
  if (!L.card && !def.boss) { plat(x - 300, 330, 100); plat(x - 220, 250, 90); L.card = [x - 175, 210]; }
  if (def.boss) {
    ground(x, x + 1400); L.props.push({ id: 'lamp', x: x + 60, y: GROUND_Y }, { id: 'lamp', x: x + 1340, y: GROUND_Y });
    plat(x + 420, 360, 140); plat(x + 840, 360, 140); orb(x + 700, 300); orb(x + 1100, 330);
    L.cps.push(x + 20); x += 1400; L.exit = { x: x - 80, kind: 'boss' };
  } else if (!single) { ground(x, x + 520); L.props.push({ id: 'lamp', x: x + 60, y: GROUND_Y }); x += 520; L.exit = { x: x - 150, kind: def.n === 1 ? 'gate' : 'door' }; }
  else if (def.n === 1) L.exit.kind = 'gate';
  L.length = x;
  if (wd.mech.flip && !def.boss) {                       // a ceiling over the whole stage, except the gaps
    const cuts = ceilGaps.sort((a, b) => a[0] - b[0]); let cur = 0; L.ceilings = [];
    for (const [a, b] of cuts) { if (a > cur) L.ceilings.push([cur, a]); cur = b; }
    if (cur < x) L.ceilings.push([cur, x]);
  }
  if (!L.card && single) { plat(120, 200, 100); L.card = [160, 160]; }
  L.cps = [...new Set(L.cps.map((c) => Math.round(c)))].sort((a, b) => a - b);
  return L;
}
