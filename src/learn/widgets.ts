/** Small interactive pieces inside the lesson steps. Each draws itself into a host element. */
import { sfx } from '../sfx';
import { broadcastCount, collisionCount, drawTopo, randomTopo, TOPO_KEY, type Topo } from './topo';
import type { WidgetId } from './content';
import { cli, hubvs, layers, nic } from './widgets2';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const ltr = <T extends HTMLElement>(e: T): T => { e.dir = 'ltr'; return e; };
function shuffle<T>(a: T[]): T[] { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }

export function mountWidget(id: WidgetId, host: HTMLElement): void {
  host.textContent = '';
  if (id === 'none') return;
  ({ mac, cast, frame, switchSim, csma, domains, nic, layers, hubvs, cli } as Record<string, (h: HTMLElement) => void>)[id === 'switch' ? 'switchSim' : id](host);
}

// ------------------------------------------------------------------ a MAC address: tap a byte to see its bits
function mac(host: HTMLElement): void {
  const bytes = ['00', '1A', '2B', '3C', '4D', '5E'];
  const row = ltr(el('div', 'macrow')), info = el('p', 'winfo', 'לחצו על בית');
  bytes.forEach((b, i) => {
    const c = el('button', 'byte ' + (i < 3 ? 'oui' : 'ser'), b);
    c.type = 'button';
    c.onclick = () => {
      sfx.click();
      const v = parseInt(b, 16);
      info.textContent = '';
      const bits = ltr(el('b', '', v.toString(2).padStart(8, '0')));
      info.append('הבית ' + b + ' בהקסדצימלי הוא ', bits, ' בבינארי, ו-' + v + ' בעשרוני. ', i < 3 ? 'הוא חלק מזיהוי היצרן.' : 'הוא חלק מהמספר הסידורי.');
    };
    row.append(c);
  });
  const key = el('div', 'wkey');
  key.append(el('span', 'k oui', '3 בתים ראשונים: היצרן (OUI)'), el('span', 'k ser', '3 בתים אחרונים: מספר סידורי'));
  host.append(row, key, info);
}

// ------------------------------------------------------------------ unicast, multicast or broadcast
function cast(host: HTMLElement): void {
  const items: [string, string][] = [['00:1A:2B:3C:4D:5E', 'Unicast: מחשב אחד'], ['01:00:5E:00:00:05', 'Multicast: קבוצה'], ['FF:FF:FF:FF:FF:FF', 'Broadcast: כולם'], ['3C:52:82:1F:09:A4', 'Unicast: מחשב אחד'], ['33:33:00:00:00:01', 'Multicast: קבוצה'], ['AC:DE:48:00:11:22', 'Unicast: מחשב אחד']];
  const grid = el('div', 'castgrid');
  for (const [a, t] of items) {
    const c = el('button', 'castcard');
    c.type = 'button';
    c.append(ltr(el('b', '', a)), el('span', '', '?'));
    c.onclick = () => { sfx.click(); (c.lastElementChild as HTMLElement).textContent = t; c.classList.add(t.startsWith('Broad') ? 'b' : t.startsWith('Multi') ? 'm' : 'u'); };
    grid.append(c);
  }
  host.append(grid, el('p', 'winfo', 'רמז: Unicast נגמר בספרה זוגית בבית הראשון, Multicast בספרה אי-זוגית, ו-Broadcast הוא רק F.'));
}

// ------------------------------------------------------------------ put the fields of a frame in order
function frame(host: HTMLElement): void {
  const order = ['MAC יעד', 'MAC מקור', 'סוג או אורך', 'מידע (Data)', 'FCS'];
  let next = 0;
  const strip = el('div', 'framestrip'), pool = el('div', 'framepool'), msg = el('p', 'winfo', 'לחצו על השדות לפי הסדר שבו הם יוצאים לכבל.');
  order.forEach((o) => { const s = el('div', 'slot2'); s.textContent = ''; strip.append(s); });
  for (const f of shuffle(order)) {
    const b = el('button', 'chip', f);
    b.type = 'button';
    b.onclick = () => {
      if (order[next] === f) { sfx.bit(); (strip.children[next] as HTMLElement).textContent = f; strip.children[next].classList.add('on'); b.remove(); next++; msg.textContent = next === order.length ? 'נכון! כך נראית מסגרת Ethernet.' : 'יפה, הבא בתור...'; }
      else { sfx.nope(); msg.textContent = 'לא עכשיו. מה יוצא ראשון?'; }
    };
    pool.append(b);
  }
  host.append(strip, pool, msg);
}

// ------------------------------------------------------------------ CSMA/CD in a hub
function csma(host: HTMLElement): void {
  const box = el('div', 'hubbox'), log = el('p', 'winfo', 'שני מחשבים רוצים לשדר.');
  const row = el('div', 'row2');
  const both = el('button', 'mini', 'שניהם שולחים עכשיו'), one = el('button', 'mini', 'אחד מחכה שהקו יהיה פנוי');
  both.type = one.type = 'button';
  box.append(el('div', 'pcA', 'מחשב A'), el('div', 'hubM', 'רכזת'), el('div', 'pcB', 'מחשב B'));
  both.onclick = () => {
    sfx.nope(); box.classList.add('crash'); log.textContent = 'התנגשות! שני האותות התערבבו. כל מחשב מגריל זמן המתנה אחר...';
    setTimeout(() => { box.classList.remove('crash'); sfx.bit(); log.textContent = 'A הגריל זמן קצר ושידר ראשון. B המתין ושידר אחריו. אין התנגשות.'; }, 1700);
  };
  one.onclick = () => { sfx.bit(); log.textContent = 'A הקשיב לקו, היה פנוי, ושידר. B שמע שהקו תפוס והמתין. אין התנגשות.'; };
  row.append(both, one);
  host.append(box, row, log);
}

// ------------------------------------------------------------------ a tiny switch you can test
function switchSim(host: HTMLElement): void {
  const pcs = [{ n: 'A', mac: 'AA', port: 1 }, { n: 'B', mac: 'BB', port: 2 }, { n: 'C', mac: 'CC', port: 3 }, { n: 'D', mac: 'DD', port: 4 }];
  const table = new Map<string, number>();
  let from = 0, to = 1;
  const ports = el('div', 'ports'), tbl = ltr(el('div', 'mactable')), log = el('p', 'winfo', 'בחרו שולח ומקבל ולחצו שלח.');
  const lights: HTMLElement[] = [];
  pcs.forEach((p) => { const c = el('div', 'port'); c.append(el('b', '', 'פורט ' + p.port), el('span', '', 'מחשב ' + p.n)); ports.append(c); lights.push(c); });
  const pick = (label: string, set: (i: number) => void, get: () => number) => {
    const r = el('div', 'pickrow'); r.append(el('span', '', label));
    pcs.forEach((p, i) => { const b = el('button', 'chip' + (get() === i ? ' on' : ''), p.n); b.type = 'button'; b.onclick = () => { set(i); r.querySelectorAll('.chip').forEach((x, k) => x.classList.toggle('on', k === i)); }; r.append(b); });
    return r;
  };
  const drawTable = () => { tbl.textContent = 'טבלת MAC: ' + (table.size ? [...table].map(([m, p]) => m + ' ← פורט ' + p).join('   ') : '(ריקה)'); };
  const send = el('button', 'mini', 'שלח מסגרת'), bc = el('button', 'mini', 'שלח Broadcast'), reset = el('button', 'mini', 'אפס טבלה');
  send.type = bc.type = reset.type = 'button';
  const go = (dst: string | 'ALL') => {
    const s = pcs[from]; table.set(s.mac, s.port);
    let txt = 'המתג למד: ' + s.mac + ' נמצא בפורט ' + s.port + '. ';
    lights.forEach((l) => l.classList.remove('lit', 'src'));
    lights[from].classList.add('src');
    if (dst === 'ALL') { txt += 'יעד Broadcast: הציף לכל הפורטים חוץ מ-' + s.port + '.'; lights.forEach((l, i) => i !== from && l.classList.add('lit')); }
    else if (pcs.find((p) => p.mac === dst)?.port === s.port) txt += 'היעד באותו פורט כמו המקור: סינן, לא העביר.';
    else if (table.has(dst)) { const p = table.get(dst) as number; txt += 'היעד ' + dst + ' מוכר בפורט ' + p + ': העביר רק אליו.'; lights[p - 1].classList.add('lit'); }
    else { txt += 'היעד ' + dst + ' עוד לא בטבלה: הציף לכל הפורטים חוץ מ-' + s.port + '.'; lights.forEach((l, i) => i !== from && l.classList.add('lit')); }
    log.textContent = txt; drawTable(); sfx.bit();
  };
  send.onclick = () => go(pcs[to].mac);
  bc.onclick = () => go('ALL');
  reset.onclick = () => { table.clear(); drawTable(); lights.forEach((l) => l.classList.remove('lit', 'src')); log.textContent = 'הטבלה התאפסה.'; };
  const ctrl = el('div', 'row2'); ctrl.append(send, bc, reset);
  host.append(ports, pick('שולח:', (i) => { from = i; }, () => from), pick('מקבל:', (i) => { to = i; }, () => to), ctrl, tbl, log);
  drawTable();
}

// ------------------------------------------------------------------ count the domains of a diagram
function domains(host: HTMLElement): void {
  let kind: 'collision' | 'broadcast' = 'collision', t: Topo, answered = false;
  const wrap = el('div', 'topowrap'), q = el('p', 'winfo'), ans = el('div', 'row2'), kinds = el('div', 'row2');
  const make = (level: number) => { t = randomTopo(level, Math.random); answered = false; draw(); };
  let level = 1;
  const draw = () => {
    wrap.textContent = '';
    wrap.append(drawTopo(t, answered ? kind : 'none'));
    q.textContent = kind === 'collision' ? 'כמה אזורי התנגשות יש בתרשים?' : 'כמה אזורי Broadcast יש בתרשים?';
    ans.textContent = '';
    const right = kind === 'collision' ? collisionCount(t) : broadcastCount(t);
    const maxOpt = Math.max(8, right);
    for (let n = 1; n <= maxOpt; n++) {
      const b = el('button', 'chip', String(n));
      b.type = 'button';
      b.onclick = () => {
        if (answered) return;
        answered = true;
        if (n === right) { sfx.bit(); q.textContent = 'נכון! ' + right + '. הצבעים מראים כל אזור.'; b.classList.add('ok'); } else { sfx.nope(); q.textContent = 'לא בדיוק: התשובה ' + right + '. הצבעים מראים את האזורים.'; b.classList.add('bad'); }
        wrap.textContent = ''; wrap.append(drawTopo(t, kind));
      };
      ans.append(b);
    }
  };
  for (const [k, name] of [['collision', 'אזורי התנגשות'], ['broadcast', 'אזורי Broadcast']] as const) {
    const b = el('button', 'mini' + (k === kind ? ' on' : ''), name);
    b.type = 'button';
    b.onclick = () => { kind = k; kinds.querySelectorAll('.mini').forEach((x) => x.classList.toggle('on', x === b)); level = k === 'broadcast' ? 3 : 1; make(level); };
    kinds.append(b);
  }
  const more = el('button', 'mini', 'תרשים אחר'); more.type = 'button'; more.onclick = () => { level = kind === 'broadcast' ? 3 : 1 + Math.floor(Math.random() * 2); make(level); };
  host.append(kinds, wrap, q, ans, more, el('p', 'wkeytxt', TOPO_KEY));
  make(1);
}
