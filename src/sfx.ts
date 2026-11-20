/** A few synthesised effects (prototype). Real music and sounds come later. */
let ac: AudioContext | null = null;
function ctx(): AudioContext | null {
  if (!ac) { try { ac = new AudioContext(); } catch { return null; } }
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}
function tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number): void {
  const a = ctx(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(Math.max(0.0002, vol * sfxVol), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sfx = {
  jump: () => tone(300, 620, 0.12, 'square', 0.05),
  swing: (n: number) => tone(500 + n * 120, 180, 0.1, 'sawtooth', 0.04),
  hit: () => tone(180, 60, 0.12, 'square', 0.09),
  kill: () => { tone(500, 1000, 0.15, 'triangle', 0.08); tone(300, 120, 0.2, 'square', 0.05); },
  hurt: () => tone(220, 70, 0.25, 'sawtooth', 0.09),
  dash: () => tone(800, 200, 0.14, 'sawtooth', 0.04),
  bit: () => tone(900, 1500, 0.08, 'triangle', 0.06),
  card: () => { tone(600, 1200, 0.2, 'triangle', 0.08); setTimeout(() => tone(900, 1800, 0.25, 'triangle', 0.08), 120); },
  magic: () => { tone(100, 700, 0.4, 'sawtooth', 0.09); tone(60, 40, 0.5, 'square', 0.08); },
  jam: () => tone(150, 400, 0.2, 'square', 0.06),
  kick: () => tone(160, 45, 0.16, 'sine', 0.14),
  hat: () => tone(6000, 5000, 0.04, 'square', 0.025),
  tick: () => tone(1400, 1200, 0.03, 'square', 0.02),
  bass: () => tone(110, 100, 0.3, 'triangle', 0.1),
  click: () => tone(700, 500, 0.05, 'square', 0.04),
  buy: () => { tone(600, 1200, 0.1, 'triangle', 0.07); setTimeout(() => tone(900, 1500, 0.12, 'triangle', 0.07), 90); },
  nope: () => tone(160, 100, 0.15, 'square', 0.06),
  level: () => { tone(500, 1000, 0.15, 'triangle', 0.08); setTimeout(() => tone(700, 1400, 0.2, 'triangle', 0.08), 130); },
};
export function unlockAudio(): void { ctx(); }

/** Master volumes (0..1); the effects use sound, music is not used by this module yet. */
let sfxVol = 1;
export function setVolumes(_music: number, sound: number): void { sfxVol = sound; }
export const volume = (): number => sfxVol;
