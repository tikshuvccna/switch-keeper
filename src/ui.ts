/**
 * The DOM screens: the post-office menu, the map of areas and stages, heroes, the album, settings and credits, and the stage result.
 * Look: kraft paper, stitched edges, postage stamps and rubber-stamp lettering (nothing like the earlier games).
 */
import { play, isOpen, lessonPassed, toMenu } from './game/flow';
import { HEROES } from './game/heroes';
import { AREAS, STAGES, type StageDef } from './game/levels';
import { lesson, save, store } from './game/save';
import { openLesson } from './learn/api';
import { GEAR, SKILLS, gearById } from './game/progress';
import { heroRig } from './art/registry';
import { setVolumes, sfx } from './sfx';
import type { Stats } from './game/flow';

const root = () => document.getElementById('screen') as HTMLElement;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const btn = (text: string, cls: string, on: () => void): HTMLButtonElement => {
  const b = el('button', cls, text); b.type = 'button';
  b.onclick = () => { sfx.click(); on(); };
  return b;
};
function open(): HTMLElement { const r = root(); r.textContent = ''; r.classList.remove('hide'); return r; }
export const hideScreen = (): void => root().classList.add('hide');
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

/** An optional event so the menu scene can react to a hero change. */
export const heroChanged = new EventTarget();

// ------------------------------------------------------------------ main menu
export function showMenuScreen(): void {
  const r = open();
  r.className = 'menu';
  const title = el('div', 'stampTitle');
  title.append(el('b', '', 'שומר המתג'), el('span', '', 'עיר המתגים · הרפתקה ברשת'));
  r.append(title);
  const col = el('div', 'slots');
  const next = STAGES.find((s) => isOpen(s.id) && !(save.stages[s.id]?.stars) && !(s.boss && save.areas[s.area.id])) ?? STAGES[0];
  const waiting = AREAS.find((x) => x.lesson && isOpen(x.id + '.1') && !lessonPassed(x.id));
  if (waiting) col.append(btn('שיעור מחכה: ' + waiting.name + ' (ללמוד עכשיו)', 'slot hot', () => openLesson(waiting.lesson, waiting.name, () => showMenuScreen())));
  col.append(btn('המשך מסע', 'slot big', () => play(next.id)));
  col.append(btn('מפת המסע', 'slot', showMap));
  col.append(btn('איך משחקים', 'slot', showHow));
  col.append(btn('גיבורים', 'slot', showHeroes));
  col.append(btn('מגדל השיעורים', 'slot', showTower));
  col.append(btn('כישורים וציוד', 'slot', showSkills));
  col.append(btn('אלבום קלפים', 'slot', showAlbum));
  col.append(btn('הגדרות', 'slot', showSettings));
  col.append(btn('קרדיטים', 'slot', showCredits));
  r.append(col);
  const tag = el('div', 'bitsTag');
  tag.textContent = (save.name ? save.name + ' · ' : '') + save.bits + ' ביטים · רמה ' + save.level;
  r.append(tag);
}

function panel(title: string, onBack: () => void = showMenuScreen): { box: HTMLElement; body: HTMLElement } {
  const r = open();
  r.className = 'sheet';
  const box = el('div', 'kraft');
  const head = el('div', 'khead');
  head.append(el('h2', '', title), btn('חזרה', 'back', onBack));
  const body = el('div', 'kbody');
  box.append(head, body);
  r.append(box);
  return { box, body };
}

// ------------------------------------------------------------------ the map: areas as postage stamps, stages as postmarks
export function showMap(): void {
  const { body } = panel('מפת המסע');
  const grid = el('div', 'stamps');
  for (const a of AREAS) {
    const unlocked = isOpen(a.id + '.1');
    const st = el('div', 'stamp' + (unlocked ? '' : ' lock') + (save.areas[a.id] ? ' done' : ''));
    st.append(el('div', 'num', String(a.n)), el('h3', '', a.name), el('p', '', unlocked ? a.blurb : 'נעול: צריך לנצח את הבוס של האזור הקודם'));
    const row = el('div', 'marks');
    for (const s of STAGES.filter((x) => x.area === a)) {
      const ok = isOpen(s.id), rec = save.stages[s.id];
      const m = el('button', 'mark' + (ok ? '' : ' lock') + (rec?.stars ? ' got' : '') + (s.boss ? ' boss' : ''));
      m.type = 'button';
      m.append(el('b', '', s.boss ? 'בוס' : String(s.n)), el('i', '', rec?.stars ? stars(rec.stars) : ''));
      m.onclick = () => { if (ok) { sfx.click(); play(s.id); } else sfx.nope(); };
      row.append(m);
    }
    st.append(row);
    grid.append(st);
  }
  body.append(grid, el('p', 'note', 'בכל אזור יש 4 שלבים ובוס. שלב 1 של כל אזור נגמר בשער נעול: לומדים אצל אורה, עוברים בוחן ומנצחים במשחק-הקטן כדי להמשיך.'));
}

// ------------------------------------------------------------------ the lesson tower
export function showTower(): void {
  const { body } = panel('מגדל השיעורים');
  body.append(el('p', 'note', 'כאן אפשר ללמוד שוב ולשחק שוב במשחקי-הקטנים. כדי לפתוח את השער בסוף שלב 1 של אזור צריך לעבור את השיעור שלו.'));
  const list = el('div', 'lessons');
  for (const a of AREAS.filter((x) => x.lesson)) {
    const l = lesson(a.lesson), ready = isOpen(a.id + '.1');
    const row = el('div', 'lrow' + (lessonPassed(a.id) ? ' done' : ''));
    row.append(el('b', '', 'שיעור ' + a.lesson.slice(1)), el('span', '', a.name), el('i', '', l.medal > 0 ? ['', 'ארד', 'כסף', 'זהב'][l.medal] : l.quiz ? 'בוחן עבר' : ''));
    const go = btn(ready ? 'ללמוד' : 'נעול', 'mini', () => { if (ready) openLesson(a.lesson, a.name, () => showTower()); });
    if (!ready) go.disabled = true;
    row.append(go);
    list.append(row);
  }
  body.append(list);
}

// ------------------------------------------------------------------ heroes
export function showHeroes(): void {
  const { body } = panel('גיבורים');
  const row = el('div', 'heroes');
  for (const h of Object.values(HEROES)) {
    const own = save.heroes.includes(h.id), cur = save.hero === h.id;
    const c = el('div', 'hcard' + (cur ? ' cur' : '') + (own ? '' : ' lock'));
    c.append(el('h3', '', h.name), el('p', '', h.blurb), el('p', 'magic', 'קסם: ' + h.magicName), el('p', 'hp', '♥'.repeat(h.hp)));
    const price = h.id === 'bumper' ? 0 : 150;
    c.append(btn(cur ? 'נבחר' : own ? 'לבחור' : price + ' ביטים', 'mini', () => {
      if (!own) { if (save.bits < price) { sfx.nope(); return; } save.bits -= price; save.heroes.push(h.id); sfx.buy(); }
      save.hero = h.id; store(); heroChanged.dispatchEvent(new Event('change')); showHeroes();
    }));
    void heroRig;
    row.append(c);
  }
  body.append(row, el('p', 'note', 'הגיבורים החדשים נקנים בביטים שאוספים בדרך. הגיבור הנבחר מופיע בתפריט וגם בשלבים.'));
}

// ------------------------------------------------------------------ how to play
export function showHow(): void {
  const { body } = panel('איך משחקים');
  const items: [string, string, string][] = [
    ['🏃', 'לזוז ולקפוץ', 'חיצים או WASD לתנועה, רווח לקפיצה. לחצו רווח שוב באוויר לקפיצה כפולה.'],
    ['👊', 'מכה', 'J או לחצן שמאלי בעכבר: שלוש מכות ברצף. המכה השלישית חזקה.'],
    ['🎯', 'ירי', 'K או לחצן ימני בעכבר (אפשר להחזיק): יורים מרחוק. לכל גיבור ירי אחר.'],
    ['💨', 'דאש', 'Shift או C: זינוק מהיר שבו אי אפשר לפגוע בכם.'],
    ['⭐', 'סופר', 'מד הקסם מתמלא במכות, באיסוף ובפארי. כשהוא מלא: L או Q או גלגלת העכבר.'],
    ['🩷', 'פארי: כדורים ורודים', 'קפצו אל משהו ורוד (כדור צף או פגז של אויב) ולחצו קפיצה שוב. הפגז נעלם, אתם קופצים גבוה, מקבלים קפיצה כפולה מחדש ומד הקסם מתמלא. כדורים צפים עוזרים להגיע למקומות גבוהים ולקלפים נסתרים.'],
    ['🌍', 'עולמות מיוחדים', 'G הופך כבידה, R משנה גודל, B מאט זמן. בכל עולם יש רמז בהתחלה.'],
    ['📱', 'בטלפון', 'מקל משמאל, וחמישה כפתורים מימין: מכה, ירי, קפיצה, דאש וסופר.'],
  ];
  const list = el('div', 'how');
  for (const [ic, t, d] of items) { const r = el('div', 'hrow' + (t.startsWith('פארי') ? ' hot' : '')); r.append(el('i', '', ic), el('b', '', t), el('span', '', d)); list.append(r); }
  body.append(list, el('p', 'note', 'שיעורים: אורה, הצבה הירוקה בתחילת כל אזור, מלמדת לפני שפותחים את השער.'));
}

// ------------------------------------------------------------------ skills and gear
export function showSkills(): void {
  const { body } = panel('כישורים וציוד');
  body.append(el('p', 'purse', 'נקודות כישור: ' + save.skillPoints + ' · ' + save.bits + ' ביטים'));
  const sk = el('div', 'skills');
  for (const s of SKILLS) {
    const lv = save.skills[s.id] ?? 0, cost = lv + 1;
    const c = el('div', 'skill');
    c.append(el('b', '', s.name), el('span', '', s.text), el('i', '', '●'.repeat(lv) + '○'.repeat(s.max - lv)));
    const b = btn(lv >= s.max ? 'מלא' : cost + ' נק׳', 'mini', () => {
      if (lv >= s.max || save.skillPoints < cost) { sfx.nope(); return; }
      save.skillPoints -= cost; save.skills[s.id] = lv + 1; store(); sfx.buy(); showSkills();
    });
    if (lv >= s.max) b.disabled = true;
    c.append(b); sk.append(c);
  }
  body.append(sk, el('h3', 'sub', 'ציוד'));
  const gr = el('div', 'gear');
  for (const g of GEAR) {
    const own = save.owned.includes(g.id), worn = save.gear[g.slot] === g.id;
    const c = el('div', 'gcard' + (worn ? ' worn' : ''));
    c.append(el('small', '', { lantern: 'פנס', boots: 'מגפיים', badge: 'תג' }[g.slot]), el('b', '', g.name), el('span', '', g.text));
    c.append(btn(worn ? 'לבוש' : own ? 'ללבוש' : g.price + ' ביטים', 'mini', () => {
      if (!own) { if (save.bits < g.price) { sfx.nope(); return; } save.bits -= g.price; save.owned.push(g.id); sfx.buy(); }
      save.gear[g.slot] = g.id; store(); showSkills();
    }));
    gr.append(c);
  }
  void gearById;
  body.append(gr, el('p', 'note', 'נקודות כישור מקבלים בכל עליית רמה. ציוד קונים בביטים שאוספים בשלבים.'));
}

// ------------------------------------------------------------------ album
const CARD_INFO: Record<string, [string, string]> = {
  'market.1': ['כתובת MAC (48 ביטים)', 'כתובת פיזית הצרובה בכרטיס הרשת במפעל, כתובה ב-12 ספרות הקסדצימליות (6 בתים), ופועלת בשכבה 2.'],
  'market.2': ['OUI ומספר סידורי', '3 הבתים הראשונים בכתובת MAC מזהים את יצרן כרטיס הרשת (OUI), ו-3 הבתים האחרונים הם המספר הסידורי.'],
  'market.3': ['Unicast / Multicast / Broadcast', 'Unicast נשלח למחשב אחד (ספרה זוגית בבית הראשון), Multicast לקבוצה (אי-זוגית), ו-Broadcast לכולם: FF:FF:FF:FF:FF:FF.'],
  'market.4': ['מבנה מסגרת Ethernet', 'הסדר בכבל: MAC יעד, MAC מקור, סוג/אורך (Type/Length), מידע (Data), ובסוף בדיקת שגיאות FCS.'],
  'street.1': ['רכזת (Hub) ו-Half Duplex', 'רכזת מעתיקה כל מסגרת לכל הפורטים על ערוץ משותף אחד. רק מכשיר אחד משדר בכל רגע, ולכן יש התנגשויות.'],
  'street.2': ['CSMA/CD', 'פרוטוקול גישה לערוץ משותף: מקשיבים לקו, משדרים כשפנוי, ואם קרתה התנגשות מגרילים זמן המתנה אקראי (Backoff).'],
  'street.3': ['4 פעולות המתג', 'המתג לומד מכתובת המקור, מעביר (Forward) ליעד מוכר, מציף (Flood) ליעד לא מוכר או Broadcast, ומסנן (Filter) באותו פורט.'],
  'street.4': ['טבלת MAC וזקנה (Aging)', 'שורה בטבלת MAC נמחקת כברירת מחדל אחרי 5 דקות (300 שניות) בלי תעבורה. צופים בה בפקודה show mac address-table.'],
  'borders.1': ['אזור התנגשות (Collision Domain)', 'קבוצת מכשירים החולקים ערוץ שידור אחד. כל הפורטים של רכזת הם אזור אחד; כל פורט במתג הוא אזור התנגשות נפרד.'],
  'borders.2': ['אזור Broadcast', 'הטווח שאליו מגיעה הודעת FF:FF:FF:FF:FF:FF. רכזת ומתג מעבירים Broadcast; רק נתב (Router) עוצר אותו.'],
  'borders.3': ['Full Duplex', 'בחיבור למתג יש נתיב נפרד לשליחה ונתיב נפרד לקבלה בו-זמנית — ללא התנגשויות.'],
  'borders.4': ['ספירת אזורי Broadcast', 'מסירים בראש את הנתבים מהתרשים: כל חלק שנשאר מחובר הוא אזור Broadcast אחד (ממשק נתב פעיל = אזור).'],
  'tower.1': ['סערת Broadcast', 'כאשר הודעות Broadcast משוכפלות ללא סוף ברשת (למשל בלולאת מתגים), הן מציפות את כל רוחב הפס ומשביתות את הרשת.'],
  'tower.2': ['שכבה 2 מול שכבה 3', 'שכבה 2 (מתג, MAC, מסגרת) מעבירה מידע בתוך אותה רשת מקומית; שכבה 3 (נתב, IP, חבילה) מנתבת בין רשתות שונות.'],
  'tower.3': ['ריבוי כתובות בפורט מתג', 'לפורט אחד במתג יכולות להיות רשומות כמה כתובות MAC — למשל כאשר מחובר אליו מתג נוסף או רכזת.'],
  'tower.4': ['סינון תעבורה (Filtering)', 'אם כתובת המקור וכתובת היעד יושבות על אותו פורט במתג, המתג מסנן וזורק את המסגרת כדי לחסוך תעבורה מיותרת.'],
};
export function showAlbum(): void {
  const { body } = panel('אלבום קלפים · מילון המתג');
  body.append(el('p', 'note', 'בכל שלב מוסתר קלף ידע אחד. לחצו על קלף שנמצא כדי לקרוא את המושג.'));
  const g = el('div', 'album');
  const detail = el('div', 'carddetail hide');
  for (const s of STAGES.filter((x) => !x.boss)) {
    const id = s.area.id + '.' + s.n, got = save.cards.includes(id);
    const info = CARD_INFO[id];
    const c = el('button', 'kcard' + (got ? ' got' : ''));
    c.type = 'button';
    c.append(el('small', '', s.title), el('b', '', got ? '✉' : '?'));
    if (got && info) {
      c.onclick = () => {
        sfx.click();
        detail.classList.remove('hide');
        detail.textContent = '';
        detail.append(el('h4', '', info[0]), el('p', '', info[1]));
      };
    } else c.disabled = true;
    g.append(c);
  }
  body.append(g, detail, el('p', 'note', save.cards.length + ' מתוך ' + STAGES.filter((x) => !x.boss).length + ' קלפים'));
}

// ------------------------------------------------------------------ settings and credits
export function showSettings(): void {
  const { body } = panel('הגדרות');
  const slider = (label: string, get: () => number, set: (v: number) => void) => {
    const row = el('label', 'set'), r = el('input');
    r.type = 'range'; r.min = '0'; r.max = '1'; r.step = '0.1'; r.value = String(get());
    r.oninput = () => { set(Number(r.value)); store(); setVolumes(save.music, save.sound); };
    row.append(el('span', '', label), r);
    return row;
  };
  body.append(slider('מוזיקה', () => save.music, (v) => { save.music = v; }), slider('צלילים', () => save.sound, (v) => { save.sound = v; sfx.bit(); }));
  const calm = el('label', 'set'), cb = el('input');
  cb.type = 'checkbox'; cb.checked = save.calm; cb.onchange = () => { save.calm = cb.checked; store(); };
  calm.append(el('span', '', 'פחות תנועה (בלי רעידות)'), cb);
  const nm = el('label', 'set'), inp = el('input');
  inp.type = 'text'; inp.maxLength = 14; inp.value = save.name; inp.placeholder = 'כינוי';
  inp.oninput = () => { save.name = inp.value.trim(); store(); };
  nm.append(el('span', '', 'הכינוי שלי'), inp);
  let armed = false;
  const reset = btn('למחוק את כל ההתקדמות', 'mini danger', () => {
    if (!armed) { armed = true; reset.textContent = 'בטוח? ללחוץ שוב כדי למחוק'; return; }
    try { localStorage.removeItem('switchkeeper.save.v1'); } catch { /* no storage */ }
    location.reload();
  });
  body.append(calm, nm, reset);
}
export function showCredits(): void {
  const { body } = panel('קרדיטים');
  const c = el('div', 'credits');
  const p = (t: string, cls = '') => c.append(el('p', cls, t));
  const a = (href: string, text = href) => { const l = el('a', '', text); l.href = href; l.target = '_blank'; l.rel = 'noopener'; l.dir = 'ltr'; const q = el('p'); q.append(l); c.append(q); };
  p('שומר המתג', 'ctitle');
  p('משחק זה פותח ונבנה על ידי מיכאל תקשוב מאתר מגמת תקשוב.');
  a('https://tikshuv-ccna.com');
  p('לפיתוח משחקים, סרטונים שיווקיים, תוכנות וייעוץ פנו:');
  a('mailto:tikshuvccna@gmail.com', 'tikshuvccna@gmail.com');
  p('לפניות בנושא בניית חדרי בריחה דיגיטליים ופיזיים בהתאמה אישית:');
  a('https://escapebuilder.com');
  p('תודה לכל המסייעים, בטא טסטרים ומייעצים.', 'thanks');
  p('דמויות, אויבים ועולם: צוירו ואונפשו בקוד במיוחד למשחק. צלילים: נוצרו בקוד.', 'small');
  body.append(c);
}

// ------------------------------------------------------------------ the result of a stage
export function showResult(r: { def: StageDef; stars: number; stats: Stats; bonus: number; first: boolean; nextId: string | null; areaDone?: string }): void {
  document.body.classList.remove('playing');
  const s = open();
  s.className = 'result';
  const card = el('div', 'ticket');
  const m = Math.floor(r.stats.time / 60), sec = String(r.stats.time % 60).padStart(2, '0');
  card.append(el('h2', '', r.areaDone ? 'האזור נוצח!' : 'סיימתם את השלב!'), el('div', 'bigstars', stars(r.stars)));
  const rows = el('div', 'rows');
  for (const [k, v] of [['זמן', m + ':' + sec], ['אויבים נוטרלו', String(r.stats.kills)], ['ביטים', String(r.stats.bits)], ['נפילות', String(r.stats.falls)], ['קלף ידע', r.stats.card ? 'נמצא' : 'לא נמצא']]) {
    const d = el('div'); d.append(el('span', '', k), el('b', '', v)); rows.append(d);
  }
  card.append(rows);
  if (r.bonus) card.append(el('p', 'bonus', '+' + r.bonus + ' ביטים'));
  if (r.areaDone) card.append(el('p', 'bonus', 'נפתח: ' + r.areaDone));
  const row = el('div', 'row');
  if (r.nextId) row.append(btn('לשלב הבא', 'slot big', () => play(r.nextId as string)));
  row.append(btn('עוד פעם', 'slot', () => play(r.def.id)), btn('למפה', 'slot', () => { toMenu(); setTimeout(showMap, 30); }));
  card.append(row);
  s.append(card);
}

// ------------------------------------------------------------------ pause overlay
export function showPauseScreen(def: StageDef, onResume: () => void, onRestart: () => void): void {
  document.body.classList.add('paused');
  const s = open();
  s.className = 'result';
  const card = el('div', 'ticket');
  card.append(el('h2', '', 'המשחק מושהה'), el('p', 'note', def.title));
  const row = el('div', 'row');
  row.append(
    btn('המשך', 'slot big', () => { document.body.classList.remove('paused'); hideScreen(); onResume(); }),
    btn('התחל שלב מחדש', 'slot', () => { document.body.classList.remove('paused'); hideScreen(); onRestart(); }),
    btn('למפה', 'slot', () => { document.body.classList.remove('paused'); toMenu(); setTimeout(showMap, 30); }),
    btn('לתפריט הראשי', 'slot', () => { document.body.classList.remove('paused'); toMenu(); }),
  );
  card.append(row);
  s.append(card);
}
