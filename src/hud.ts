/** The heads-up display lives in the DOM (Hebrew text renders cleanly there). */
const $ = (id: string) => document.getElementById(id) as HTMLElement;

let shownHearts = '', shownMeter = -1, shownXp = -1, shownBits = -1, shownLvl = 0, toastT = 0, comboT = 0;

export function hudUpdate(s: { hp: number; maxHp: number; meter: number; xp: number; xpNext: number; level: number; bits: number }): void {
  const h = Array.from({ length: s.maxHp }, (_, i) => '<i class="seal' + (i < s.hp ? ' on' : '') + '"></i>').join('');
  const key = h + s.hp;
  if (key !== shownHearts) { shownHearts = key; $('hearts').innerHTML = h; }
  const m = Math.round(s.meter);
  if (m !== shownMeter) { shownMeter = m; ($('meter').firstElementChild as HTMLElement).style.width = m + '%'; $('meter').classList.toggle('full', m >= 100); }
  const x = Math.round((s.xp / s.xpNext) * 100);
  if (x !== shownXp) { shownXp = x; ($('xp').firstElementChild as HTMLElement).style.width = x + '%'; }
  if (s.level !== shownLvl) { shownLvl = s.level; $('lvl').textContent = 'רמה ' + s.level; }
  if (s.bits !== shownBits) { shownBits = s.bits; $('bits').textContent = String(s.bits); }
}

export function toast(text: string, good = true): void {
  const t = $('toast');
  t.textContent = text; t.className = 'on ' + (good ? 'good' : 'bad');
  toastT = 1.4;
}
export function combo(n: number): void {
  const c = $('combo');
  if (n < 2) { c.className = ''; return; }
  c.textContent = 'קומבו x' + n;
  c.className = 'on';
  c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  comboT = 2.2;
}
export function hudTick(dt: number): void {
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').className = ''; }
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) $('combo').className = ''; }
}
export function showGate(text: string, stats: string, onClose: () => void): void {
  $('gateText').textContent = text; $('gateStats').textContent = stats;
  $('gate').classList.remove('hide');
  $('gateOk').onclick = () => { $('gate').classList.add('hide'); onClose(); };
}
