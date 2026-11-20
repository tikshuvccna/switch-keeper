/**
 * The lesson gate. A lesson (short steps with a check each, a quiz, then a three-level mini-game) opens as a sheet over the game.
 * `done` is called when it closes, with passed = quiz passed and at least the easy level of the mini-game won.
 */
import { lesson, payOnce, save, store } from '../game/save';
import { sfx } from '../sfx';
import { LESSONS, type Check } from './content';
import { LEVELS, playGame } from './games';
import { mountWidget } from './widgets';

export interface LessonResult { passed: boolean; medal: number }
const MEDAL_BITS = [30, 50, 80];
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};

export function openLesson(id: string, areaTitle: string, done: (r: LessonResult) => void): void {
  const L = LESSONS[id];
  const root = document.getElementById('lessonsheet') as HTMLElement;
  if (!L) { done({ passed: false, medal: 0 }); return; }
  const st = lesson(id);
  let stop: (() => void) | null = null;
  const close = () => { stop?.(); root.classList.add('hide'); root.textContent = ''; done({ passed: st.quiz && st.medal > 0, medal: st.medal }); };
  const frame = (title: string, sub: string) => {
    stop?.(); stop = null;
    root.textContent = ''; root.classList.remove('hide');
    const box = el('div', 'kraft lesson');
    const head = el('div', 'khead');
    head.append(el('h2', '', title), Object.assign(el('button', 'back', 'יציאה'), { type: 'button', onclick: () => { sfx.click(); close(); } }));
    const body = el('div', 'kbody');
    if (sub) body.append(el('p', 'lsub', sub));
    box.append(head, body); root.append(box);
    return body;
  };
  const checkBlock = (c: Check, onOk: () => void, label = 'בדיקת הבנה'): HTMLElement => {
    const box = el('div', 'checkbox');
    box.append(el('p', 'cq', label + ': ' + c.q));
    const opts = el('div', 'opts'), msg = el('p', 'cexp');
    c.options.forEach((o, i) => {
      const b = el('button', 'opt', o); b.type = 'button';
      b.onclick = () => {
        if (i === c.correct) { sfx.bit(); b.classList.add('ok'); opts.querySelectorAll('button').forEach((x) => ((x as HTMLButtonElement).disabled = true)); msg.textContent = c.explain; const nx = el('button', 'slot big', 'המשך'); nx.type = 'button'; nx.onclick = () => { sfx.click(); onOk(); }; box.append(nx); }
        else { sfx.nope(); b.classList.add('bad'); b.disabled = true; msg.textContent = 'לא בדיוק. נסו שוב.'; }
      };
      opts.append(b);
    });
    box.append(opts, msg);
    return box;
  };

  const steps = (n: number) => {
    if (n >= L.steps.length) return quiz(0, 0);
    const s = L.steps[n];
    const body = frame('שיעור ' + L.num + ': ' + L.title, areaTitle + ' · צעד ' + (n + 1) + ' מתוך ' + L.steps.length);
    body.append(el('h3', 'stitle', s.title));
    for (const t of s.text) body.append(el('p', 'stext', t));
    const w = el('div', 'widget'); body.append(w); mountWidget(s.widget, w);
    body.append(checkBlock(s.check, () => steps(n + 1)));
  };
  const quiz = (i: number, right: number) => {
    if (i >= L.quiz.length) {
      const ok = right >= L.pass;
      const body = frame('בוחן: ' + L.title, '');
      body.append(el('h3', 'stitle', ok ? 'עברתם את הבוחן!' : 'עוד קצת'), el('p', 'stext', 'ענו נכון על ' + right + ' מתוך ' + L.quiz.length + (ok ? '.' : '. צריך לפחות ' + L.pass + '.')));
      if (ok) { st.quiz = true; store(); sfx.card(); const nx = el('button', 'slot big', 'למשחק ' + L.gameName); nx.type = 'button'; nx.onclick = () => games(); body.append(nx); }
      const again = el('button', 'slot', ok ? 'ללמוד שוב' : 'ללמוד ולנסות שוב'); again.type = 'button'; again.onclick = () => steps(0); body.append(again);
      return;
    }
    const body = frame('בוחן: ' + L.title, 'שאלה ' + (i + 1) + ' מתוך ' + L.quiz.length);
    const c = L.quiz[i];
    const box = el('div', 'checkbox');
    box.append(el('p', 'cq', c.q));
    const opts = el('div', 'opts'), msg = el('p', 'cexp');
    let locked = false;
    c.options.forEach((o, k) => {
      const b = el('button', 'opt', o); b.type = 'button';
      b.onclick = () => {
        if (locked) return; locked = true;
        const good = k === c.correct;
        b.classList.add(good ? 'ok' : 'bad'); (opts.children[c.correct] as HTMLElement).classList.add('ok'); sfx[good ? 'bit' : 'nope']();
        msg.textContent = c.explain;
        const nx = el('button', 'slot big', i + 1 >= L.quiz.length ? 'לסיום' : 'הבאה'); nx.type = 'button'; nx.onclick = () => quiz(i + 1, right + (good ? 1 : 0)); box.append(nx);
      };
      opts.append(b);
    });
    box.append(opts, msg); body.append(box);
  };
  const games = (note = '') => {
    const body = frame('משחק: ' + L.gameName, note || 'עברו את הרמה הקלה כדי לפתוח את השער. רמות גבוהות נותנות פרסים.');
    const list = el('div', 'glevels');
    LEVELS.forEach((lv, i) => {
      const open = i === 0 || st.medal >= i;
      const b = el('button', 'glevel' + (open ? '' : ' lock') + (st.medal > i ? ' done' : ''));
      b.type = 'button';
      b.append(el('b', '', lv.name), el('span', '', lv.prize + ' · ' + MEDAL_BITS[i] + ' ביטים'), el('i', '', st.medal > i ? 'הושג' : open ? 'לשחק' : 'נעול'));
      b.onclick = () => { if (open) { sfx.click(); play(i); } else sfx.nope(); };
      list.append(b);
    });
    body.append(list);
    const fin = el('button', 'slot big', st.quiz && st.medal > 0 ? 'חזרה למשחק' : 'חזרה'); fin.type = 'button'; fin.onclick = () => close(); body.append(fin);
  };
  const play = (lv: number) => {
    const body = frame('משחק: ' + L.gameName + ' · ' + LEVELS[lv].name, '');
    const host = el('div', 'gamehost'); body.append(host);
    stop = playGame(id, lv, host, (r) => {
      if (r.won) {
        if (st.medal < lv + 1) st.medal = lv + 1;
        const b = payOnce('lesson.' + id + '.' + lv, MEDAL_BITS[lv]);
        store();
        const nx = el('button', 'slot big', 'חזרה לרמות'); nx.type = 'button'; nx.onclick = () => games(b ? '+' + b + ' ביטים על ' + LEVELS[lv].prize : ''); host.append(nx);
      } else { const nx = el('button', 'slot', 'עוד ניסיון'); nx.type = 'button'; nx.onclick = () => play(lv); const bk = el('button', 'slot', 'חזרה לרמות'); bk.type = 'button'; bk.onclick = () => games(); host.append(nx, bk); }
    });
  };
  void save;
  if (st.quiz) games(); else steps(0);
}
