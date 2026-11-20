/**
 * The three mini-games, one for each lesson, each with an easy, medium and hard level:
 *  l14 "מחסן התוויות": parcels roll by on a conveyor with MAC labels; tap the one the order slip asks for.
 *  l15 "להיות המתג": frames arrive; you are the switch: forward, flood or filter, by the rules and the MAC table.
 *  l16 "מציירים גבולות": count the collision and broadcast domains of a diagram before time runs out.
 * playGame() draws into a host element and calls done() with the result.
 */
import { sfx } from '../sfx';
import { broadcastCount, collisionCount, drawTopo, randomTopo, TOPO_KEY } from './topo';

export interface GameResult { won: boolean; score: number; goal: number; mistakes: number }
export const LEVELS = [{ name: 'קל', prize: 'מדליית ארד' }, { name: 'בינוני', prize: 'מדליית כסף' }, { name: 'קשה', prize: 'מדליית זהב' }];

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const rnd = (n: number) => Math.floor(Math.random() * n);
const hexByte = () => rnd(256).toString(16).toUpperCase().padStart(2, '0');
const macOf = (first?: string) => [first ?? hexByte(), hexByte(), hexByte(), hexByte(), hexByte(), hexByte()].join(':');

interface Frame { host: HTMLElement; set(score: number, goal: number, mistakes: number, left: number): void; end(won: boolean, msg: string): void }
function shell(host: HTMLElement, title: string, hint: string, done: (r: GameResult) => void): Frame {
  host.textContent = '';
  const bar = el('div', 'gbar'), score = el('b', 'gscore'), miss = el('b', 'gmiss'), time = el('b', 'gtime');
  bar.append(score, miss, time);
  const body = el('div', 'gbody');
  host.append(el('h3', 'gtitle', title), el('p', 'ghint', hint), bar, body);
  let last = { score: 0, goal: 1, mistakes: 0 };
  return {
    host: body,
    set(s, g, m, left) { last = { score: s, goal: g, mistakes: m }; score.textContent = 'נכון ' + s + '/' + g; miss.textContent = 'טעויות ' + m + '/3'; time.textContent = Math.max(0, Math.ceil(left)) + ' שנ׳'; },
    end(won, msg) {
      body.textContent = '';
      const box = el('div', 'gend' + (won ? ' win' : ''));
      box.append(el('h3', '', won ? 'ניצחון!' : 'עוד לא'), el('p', '', msg));
      body.append(box);
      done({ won, score: last.score, goal: last.goal, mistakes: last.mistakes });
    },
  };
}

// ------------------------------------------------------------------ l14: the label warehouse
function labels(host: HTMLElement, level: number, done: (r: GameResult) => void): () => void {
  const goal = [8, 10, 12][level], speed = [95, 125, 160][level], total = [100, 90, 90][level];
  const f = shell(host, 'מחסן התוויות', 'חבילות עוברות על המסוע. לחצו על החבילה שהכתובת שלה מתאימה להזמנה.', done);
  const lane = el('div', 'lane'), slip = el('div', 'slip');
  f.host.append(slip, lane);
  let score = 0, mistakes = 0, left = total, running = true, spawnT = 0, target: { mac: string; kind: string } | null = null;
  type Box = { d: HTMLElement; x: number; mac: string; hit: boolean };
  let boxes: Box[] = [];
  const kindOf = (m: string) => (m.startsWith('FF:FF') ? 'broadcast' : parseInt(m.slice(0, 2), 16) & 1 ? 'multicast' : 'unicast');
  const randomOf = (k: string) => { let m: string; do { m = macOf(); if (k === 'unicast') m = (parseInt(m.slice(0, 2), 16) & 0xfe).toString(16).toUpperCase().padStart(2, '0') + m.slice(2); else if (k === 'multicast') m = (parseInt(m.slice(0, 2), 16) | 1).toString(16).toUpperCase().padStart(2, '0') + m.slice(2); else m = 'FF:FF:FF:FF:FF:FF'; } while (k !== 'broadcast' && kindOf(m) !== k); return m; };
  const newSlip = () => {
    if (level < 2 || Math.random() < 0.25) { const m = macOf(); target = { mac: m, kind: '' }; slip.textContent = ''; slip.append('הזמנה: הביאו את החבילה עם הכתובת ', Object.assign(el('b', 'ltrb', m), { dir: 'ltr' })); }
    else { const k = ['unicast', 'multicast', 'broadcast'][rnd(3)]; target = { mac: '', kind: k }; slip.textContent = 'הזמנה: חבילה שנשלחת ' + ({ unicast: 'למחשב אחד (Unicast)', multicast: 'לקבוצה (Multicast)', broadcast: 'לכולם (Broadcast)' } as Record<string, string>)[k]; }
  };
  const similar = (m: string) => { const p = m.split(':'); const i = rnd(6); p[i] = hexByte(); if (level === 1 && Math.random() < 0.5) { const c = p[i].split(''); c[0] = m.split(':')[i][0]; p[i] = c.join(''); } return p.join(':'); };
  const spawn = () => {
    let mac: string;
    const t = target as { mac: string; kind: string };
    if (t.mac) mac = Math.random() < 0.4 ? t.mac : level === 0 ? macOf() : similar(t.mac);
    else mac = Math.random() < 0.4 ? randomOf(t.kind) : randomOf(['unicast', 'multicast', 'broadcast'][rnd(3)]);
    const d = el('button', 'parcel');
    d.type = 'button'; d.append(Object.assign(el('span', '', mac), { dir: 'ltr' }));
    const b: Box = { d, x: -170, mac, hit: false };
    d.onclick = () => {
      if (!running || b.hit) return;
      const ok = t.mac ? b.mac === t.mac : kindOf(b.mac) === t.kind;
      if (ok) { b.hit = true; score++; sfx.bit(); d.classList.add('good'); boxes.forEach((o) => { if (o !== b) o.hit = false; }); newSlip(); f.set(score, goal, mistakes, left); if (score >= goal) finish(true); }
      else { mistakes++; sfx.nope(); d.classList.add('bad'); f.set(score, goal, mistakes, left); if (mistakes >= 3) finish(false); }
    };
    lane.append(d); boxes.push(b);
  };
  const finish = (won: boolean) => { if (!running) return; running = false; f.end(won, won ? 'כל ההזמנות נשלחו בזמן.' : mistakes >= 3 ? 'יותר מדי חבילות לא נכונות.' : 'נגמר הזמן.'); };
  newSlip(); f.set(0, goal, 0, left);
  let prev = performance.now(), raf = 0;
  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    left -= dt; spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = 1.5 - level * 0.2; }
    const W = lane.clientWidth || 600;
    for (const b of boxes) { b.x += speed * dt; b.d.style.transform = 'translateX(' + (b.x - 0) + 'px)'; }
    boxes = boxes.filter((b) => { if (b.x > W + 20) { b.d.remove(); return false; } if (b.hit && b.d.classList.contains('good') && b.d.dataset.rm !== '1') { b.d.dataset.rm = '1'; setTimeout(() => b.d.remove(), 250); } return !(b.d.dataset.rm === '1'); });
    f.set(score, goal, mistakes, left);
    if (left <= 0) finish(false); else raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { running = false; cancelAnimationFrame(raf); };
}

// ------------------------------------------------------------------ l15: be the switch
function beSwitch(host: HTMLElement, level: number, done: (r: GameResult) => void): () => void {
  const goal = [8, 10, 12][level], perFrame = [0, 14, 10][level];
  const f = shell(host, 'להיות המתג', 'מסגרות מגיעות אליכם. החליטו כמו מתג: להעביר לפורט, להציף או לסנן.', done);
  const hosts = [{ m: 'AA', p: 1 }, { m: 'BB', p: 2 }, { m: 'CC', p: 3 }, { m: 'DD', p: 4 }, ...(level >= 1 ? [{ m: 'EE', p: 2 }, { m: 'FF', p: 4 }] : [])];
  const nPorts = 4;
  const table = new Map<string, number>();
  const age = new Map<string, number>();
  const card = el('div', 'frame'), table$ = el('div', 'mactable2'), acts = el('div', 'acts');
  f.host.append(card, table$, acts);
  let score = 0, mistakes = 0, running = true, left = 0, cur: { src: string; dst: string; port: number } | null = null;
  const total = 120 + level * -10;
  left = total;
  const drawTable = () => { table$.textContent = ''; table$.append('טבלת MAC: '); if (!table.size) table$.append('(ריקה)'); for (const [m, p] of table) { const c = Object.assign(el('span', 'trow', m + ' ← ' + p), { dir: 'ltr' }); table$.append(c); } };
  const newFrame = () => {
    // age out an old entry now and then (hard level): its owner is unknown again
    if (level === 2 && table.size > 2 && Math.random() < 0.35) { const k = [...table.keys()][rnd(table.size)]; table.delete(k); card.dataset.note = 'שורה ' + k + ' נמחקה אחרי 5 דקות בלי תעבורה'; } else card.dataset.note = '';
    const s = hosts[rnd(hosts.length)];
    let dst = Math.random() < (level >= 1 ? 0.15 : 0) ? 'FF' : hosts[rnd(hosts.length)].m;
    if (dst === s.m) dst = hosts[(hosts.indexOf(s) + 1) % hosts.length].m;
    if (Math.random() < 0.2) { const same = hosts.find((h) => h.p === s.p && h.m !== s.m); if (same) dst = same.m; }
    cur = { src: s.m, dst, port: s.p };
    left = Math.max(left, 0);
    card.textContent = '';
    card.append(el('b', '', 'מסגרת נכנסת מפורט ' + s.p), Object.assign(el('span', '', 'מקור ' + s.m + '  ←  יעד ' + (dst === 'FF' ? 'FF (Broadcast)' : dst)), { dir: 'ltr' }));
    if (card.dataset.note) card.append(el('i', '', card.dataset.note));
    frameT = perFrame || 999;
  };
  let frameT = 999;
  const correct = (): string => { const c = cur as { src: string; dst: string; port: number }; if (c.dst === 'FF') return 'flood'; const p = table.get(c.dst); if (p === undefined) return 'flood'; return p === c.port ? 'filter' : 'p' + p; };
  const act = (a: string) => {
    if (!running || !cur) return;
    const c = cur, right = correct();
    table.set(c.src, c.port);                                       // the switch learns the source, whatever the player chose
    if (a === right) { score++; sfx.bit(); card.classList.add('ok'); } else { mistakes++; sfx.nope(); card.classList.add('no'); const why = right === 'flood' ? 'היעד לא מוכר או Broadcast: מציפים' : right === 'filter' ? 'היעד באותו פורט: מסננים' : 'היעד מוכר בפורט ' + right.slice(1) + ': מעבירים רק אליו'; card.append(el('i', '', why)); }
    drawTable(); f.set(score, goal, mistakes, left);
    if (score >= goal) return end(true); if (mistakes >= 3) return end(false);
    setTimeout(() => { card.classList.remove('ok', 'no'); if (running) newFrame(); }, a === right ? 350 : 1400);
    cur = null;
  };
  for (let p = 1; p <= nPorts; p++) { const b = el('button', 'mini', 'העבר לפורט ' + p); b.type = 'button'; b.onclick = () => act('p' + p); acts.append(b); }
  const fl = el('button', 'mini', 'הציף (לכל הפורטים)'), fi = el('button', 'mini', 'סנן (זרוק)');
  fl.type = fi.type = 'button'; fl.onclick = () => act('flood'); fi.onclick = () => act('filter'); acts.append(fl, fi);
  const end = (won: boolean) => { if (!running) return; running = false; f.end(won, won ? 'הטבלה שלכם נכונה והמתג עובד חלק.' : mistakes >= 3 ? 'יותר מדי החלטות שגויות.' : 'נגמר הזמן.'); };
  drawTable(); newFrame(); f.set(0, goal, 0, left);
  let prev = performance.now(), raf = 0;
  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    left -= dt;
    if (cur && perFrame) { frameT -= dt; if (frameT <= 0) { act('timeout'); } }
    f.set(score, goal, mistakes, left);
    if (left <= 0) end(false); else raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  void age;
  return () => { running = false; cancelAnimationFrame(raf); };
}

// ------------------------------------------------------------------ l16: draw the borders (count the domains)
function borders(host: HTMLElement, level: number, done: (r: GameResult) => void): () => void {
  const goal = [6, 8, 10][level], per = [30, 24, 20][level], total = 160;
  const f = shell(host, 'מציירים גבולות', 'ספרו את האזורים בתרשים לפני שנגמר הזמן.', done);
  const fig = el('div', 'topowrap'), q = el('p', 'winfo'), ans = el('div', 'row2');
  f.host.append(fig, q, ans, el('p', 'wkeytxt', TOPO_KEY));
  let score = 0, mistakes = 0, left = total, running = true, qT = per, answered = false;
  let kind: 'collision' | 'broadcast' = 'collision', t = randomTopo(1, Math.random), right = 0;
  const finish = (won: boolean) => { if (!running) return; running = false; f.end(won, won ? 'ספרתם נכון את כל האזורים.' : mistakes >= 3 ? 'יותר מדי ספירות שגויות.' : 'נגמר הזמן.'); };
  const next = () => {
    kind = level === 0 ? 'collision' : Math.random() < 0.5 ? 'collision' : 'broadcast';
    t = randomTopo(level === 0 ? 1 : level === 1 ? 1 + rnd(3) : 2 + rnd(2), Math.random);
    if (kind === 'broadcast' && !t.nodes.some((n) => n.t === 'rt') && level >= 1) t = randomTopo(3, Math.random);
    right = kind === 'collision' ? collisionCount(t) : broadcastCount(t);
    answered = false; qT = per;
    fig.textContent = ''; fig.append(drawTopo(t));
    q.textContent = kind === 'collision' ? 'כמה אזורי התנגשות יש בתרשים?' : 'כמה אזורי Broadcast יש בתרשים?';
    ans.textContent = '';
    for (let n = 1; n <= 9; n++) { const b = el('button', 'chip', String(n)); b.type = 'button'; b.onclick = () => pick(n, b); ans.append(b); }
  };
  const pick = (n: number, b: HTMLElement) => {
    if (answered || !running) return;
    answered = true;
    fig.textContent = ''; fig.append(drawTopo(t, kind));
    if (n === right) { score++; sfx.bit(); b.classList.add('ok'); q.textContent = 'נכון: ' + right; } else { mistakes++; sfx.nope(); b.classList.add('bad'); q.textContent = 'התשובה: ' + right + ' (הצבעים מראים למה)'; }
    f.set(score, goal, mistakes, left);
    if (score >= goal) return finish(true); if (mistakes >= 3) return finish(false);
    setTimeout(() => { if (running) next(); }, 1700);
  };
  next(); f.set(0, goal, 0, left);
  let prev = performance.now(), raf = 0;
  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    left -= dt;
    if (!answered) { qT -= dt; if (qT <= 0) { answered = true; mistakes++; sfx.nope(); fig.textContent = ''; fig.append(drawTopo(t, kind)); q.textContent = 'נגמר הזמן לשאלה. התשובה: ' + right; f.set(score, goal, mistakes, left); if (mistakes >= 3) return finish(false); setTimeout(() => { if (running) next(); }, 1700); } }
    f.set(score, goal, mistakes, left);
    if (left <= 0) finish(false); else raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => { running = false; cancelAnimationFrame(raf); };
}

/** Start the game of a lesson at a level (0..2). Returns a function that stops it. */
export function playGame(lessonId: string, level: number, host: HTMLElement, done: (r: GameResult) => void): () => void {
  if (lessonId === 'l14') return labels(host, level, done);
  if (lessonId === 'l15') return beSwitch(host, level, done);
  return borders(host, level, done);
}
