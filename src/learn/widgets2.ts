/** More pictures for the lessons: the network card, the layers, and a hub next to a switch. */
import { sfx } from '../sfx';
import { drawTopo, star } from './topo';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
};
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag: string, a: Record<string, string | number>, parent?: Element): SVGElement => {
  const e = document.createElementNS(NS, tag);
  for (const k of Object.keys(a)) e.setAttribute(k, String(a[k]));
  parent?.appendChild(e);
  return e as SVGElement;
};

/** A network card with its MAC sticker: tap parts to read what they are. */
export function nic(host: HTMLElement): void {
  const svg = sv('svg', { viewBox: '0 0 420 190', class: 'pic' });
  sv('rect', { x: 20, y: 30, width: 300, height: 120, rx: 10, fill: '#2f8f7a', stroke: '#1d1a33', 'stroke-width': 4 }, svg);
  for (let i = 0; i < 9; i++) sv('rect', { x: 36 + i * 11, y: 150, width: 7, height: 22, fill: '#f2b134', stroke: '#1d1a33', 'stroke-width': 2 }, svg);
  sv('rect', { x: 300, y: 56, width: 70, height: 56, rx: 6, fill: '#b9bfd3', stroke: '#1d1a33', 'stroke-width': 4 }, svg);
  for (let i = 0; i < 8; i++) sv('rect', { x: 308 + i * 7, y: 64, width: 4, height: 14, fill: '#1d1a33' }, svg);
  sv('rect', { x: 50, y: 56, width: 130, height: 36, rx: 4, fill: '#fff4dc', stroke: '#1d1a33', 'stroke-width': 3 }, svg);
  const t = sv('text', { x: 115, y: 79, 'text-anchor': 'middle', 'font-family': 'Courier New, monospace', 'font-weight': 800, 'font-size': 12, fill: '#c93a2a' }, svg); t.textContent = '00:1A:2B:3C:4D:5E';
  sv('rect', { x: 200, y: 56, width: 60, height: 36, rx: 4, fill: '#17132a', stroke: '#1d1a33', 'stroke-width': 3 }, svg);
  const info = el('p', 'winfo', 'לחצו על חלק בכרטיס כדי לגלות מה הוא.');
  const tip = (e: SVGElement, txt: string) => { e.style.cursor = 'pointer'; e.addEventListener('click', () => { sfx.click(); info.textContent = txt; }); };
  tip(svg.children[0] as SVGElement, 'כרטיס רשת (NIC): מחבר את המחשב לרשת.');
  tip(svg.children[10] as SVGElement, 'מדבקת הכתובת: כתובת ה-MAC שצרב היצרן. אין שני כרטיסים עם אותה כתובת.');
  tip(svg.children[9] as SVGElement, 'מחבר RJ-45: כאן נכנס כבל הרשת.');
  tip(svg.children[1] as SVGElement, 'מגעי הזהב נכנסים לחריץ בלוח האם.');
  tip(svg.children[11] as SVGElement, 'שבב הרשת: הוא שולח וקורא את המסגרות.');
  host.append(svg, info);
}

/** The layers of the OSI model with layer 2 lit: this is where MAC addresses live. */
export function layers(host: HTMLElement): void {
  const names = ['7 יישום', '6 הצגה', '5 שיח', '4 תעבורה', '3 רשת: כתובת IP', '2 קישור נתונים: כתובת MAC', '1 פיזית: אותות וכבלים'];
  const box = el('div', 'layerstack');
  names.forEach((n, i) => { const b = el('button', 'layer' + (i === 5 ? ' hot' : ''), n); b.type = 'button'; b.onclick = () => { sfx.click(); info.textContent = i === 5 ? 'כאן עובדים כרטיס הרשת והמתג: המסגרת נושאת כתובת MAC.' : i === 4 ? 'כאן עובד הנתב: כתובות IP מעבירות מידע בין רשתות.' : i === 6 ? 'כאן עוברים הביטים בכבל או באוויר.' : 'שכבה גבוהה יותר, קרובה לאפליקציה.'; }; box.append(b); });
  const info = el('p', 'winfo', 'כתובת MAC שייכת לשכבה 2. לחצו על שכבה.');
  host.append(box, info);
}

/** A hub and a switch side by side: send a frame from A to B and see who gets it. */
export function hubvs(host: HTMLElement): void {
  const row = el('div', 'hubvs'), log = el('p', 'winfo', 'לחצו "A שולח ל-B" ובדקו מי מקבל.');
  const mk = (kind: 'hub' | 'sw', title: string) => {
    const cell = el('div', 'hcell'); cell.append(el('b', '', title));
    const holder = el('div', 'hholder'); holder.append(drawTopo(star(kind), 'none', 260, 200));
    cell.append(holder); row.append(cell);
    return holder;
  };
  const a = mk('hub', 'רכזת'), b = mk('sw', 'מתג');
  const learned = { v: false };
  const send = el('button', 'mini', 'A שולח ל-B'), again = el('button', 'mini', 'נסו שוב');
  send.type = again.type = 'button';
  const show = (holder: HTMLElement, kind: 'hub' | 'sw', hot: number[]) => { holder.textContent = ''; holder.append(drawTopo(star(kind), 'none', 260, 200, new Set(hot))); };
  send.onclick = () => {
    sfx.bit();
    show(a, 'hub', [0, 1, 2, 3]);                                        // the hub copies the frame to every port
    if (!learned.v) { show(b, 'sw', [0, 1, 2, 3]); learned.v = true; log.textContent = 'הרכזת העתיקה לכולם. המתג עדיין לא מכיר את B, ולכן הציף לכולם, אבל למד ש-A בפורט 1.'; }
    else { show(b, 'sw', [0, 1]); log.textContent = 'הרכזת שוב העתיקה לכולם (C ו-D שמעו מה שלא היה להם). המתג העביר רק ל-B.'; }
  };
  again.onclick = () => { sfx.click(); show(a, 'hub', []); show(b, 'sw', []); log.textContent = 'לחצו שוב וראו: בפעם השנייה המתג כבר לא מציף.'; };
  const ctl = el('div', 'row2'); ctl.append(send, again);
  host.append(row, ctl, log);
}
