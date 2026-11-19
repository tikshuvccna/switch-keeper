/**
 * One input state for keyboard and touch. Held keys are plain booleans; one-shot presses (jump, attack, dash, magic, up)
 * are flags that the game consumes with take().
 */
export interface Inp {
  left: boolean; right: boolean; down: boolean; jumpHeld: boolean;
  jumpP: boolean; attackP: boolean; dashP: boolean; magicP: boolean; upP: boolean;
}
export const inp: Inp = { left: false, right: false, down: false, jumpHeld: false, jumpP: false, attackP: false, dashP: false, magicP: false, upP: false };
type Shot = 'jumpP' | 'attackP' | 'dashP' | 'magicP' | 'upP';
export function take(k: Shot): boolean { const v = inp[k]; inp[k] = false; return v; }
export function clearInput(): void { for (const k of Object.keys(inp) as (keyof Inp)[]) inp[k] = false; }

const KEYS: Record<string, (down: boolean, repeat: boolean) => void> = {
  ArrowLeft: (d) => { inp.left = d; }, KeyA: (d) => { inp.left = d; },
  ArrowRight: (d) => { inp.right = d; }, KeyD: (d) => { inp.right = d; },
  ArrowDown: (d) => { inp.down = d; }, KeyS: (d) => { inp.down = d; },
  Space: (d, r) => { inp.jumpHeld = d; if (d && !r) inp.jumpP = true; },
  ArrowUp: (d, r) => { inp.jumpHeld = d; if (d && !r) { inp.jumpP = true; inp.upP = true; } },
  KeyW: (d, r) => { inp.jumpHeld = d; if (d && !r) { inp.jumpP = true; inp.upP = true; } },
  KeyJ: (d, r) => { if (d && !r) inp.attackP = true; }, KeyZ: (d, r) => { if (d && !r) inp.attackP = true; },
  KeyK: (d, r) => { if (d && !r) inp.dashP = true; }, ShiftLeft: (d, r) => { if (d && !r) inp.dashP = true; },
  KeyL: (d, r) => { if (d && !r) inp.magicP = true; }, KeyX: (d, r) => { if (d && !r) inp.magicP = true; },
};

export function initInput(): void {
  window.addEventListener('keydown', (e) => { const f = KEYS[e.code]; if (f) { f(true, e.repeat); e.preventDefault(); } });
  window.addEventListener('keyup', (e) => { const f = KEYS[e.code]; if (f) f(false, false); });
  window.addEventListener('blur', clearInput);

  // touch: a floating stick in the left half, four buttons on the right
  const pad = document.getElementById('pad') as HTMLElement, knob = document.getElementById('knob') as HTMLElement, base = document.getElementById('stick') as HTMLElement;
  let id = -1, x0 = 0, y0 = 0;
  const R = 46;
  pad.addEventListener('pointerdown', (e) => {
    if (id !== -1) return;
    id = e.pointerId; x0 = e.clientX; y0 = e.clientY;
    pad.setPointerCapture(id);
    base.style.left = x0 + 'px'; base.style.top = y0 + 'px'; base.classList.add('on');
    knob.style.transform = 'translate(-50%, -50%)';
  });
  pad.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    let dx = e.clientX - x0, dy = e.clientY - y0;
    const d = Math.hypot(dx, dy);
    if (d > R) { dx *= R / d; dy *= R / d; }
    inp.left = dx < -R * 0.3; inp.right = dx > R * 0.3; inp.down = dy > R * 0.55;
    knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
  });
  const end = (e: PointerEvent) => { if (e.pointerId !== id) return; id = -1; inp.left = inp.right = inp.down = false; base.classList.remove('on'); };
  pad.addEventListener('pointerup', end);
  pad.addEventListener('pointercancel', end);

  document.querySelectorAll<HTMLButtonElement>('#btns button').forEach((b) => {
    const k = b.dataset.k;
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (k === 'jump') { inp.jumpHeld = true; inp.jumpP = true; inp.upP = true; }
      else if (k === 'attack') inp.attackP = true;
      else if (k === 'dash') inp.dashP = true;
      else if (k === 'magic') inp.magicP = true;
    });
    const up = () => { if (k === 'jump') inp.jumpHeld = false; };
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
  });
  if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
}
