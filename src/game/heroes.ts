/** The three heroes: movement numbers, combo tables and what their magic does. The look lives in art/rigs. */
export interface Swing { time: number; hit: [number, number]; dmg: number; lunge: number; push: number; reach: number; h: number }
export interface HeroDef {
  id: string; name: string; blurb: string;
  hp: number; speed: number; jump: number; bodyW: number; bodyH: number;
  combo: [Swing, Swing, Swing];
  /** magic: shockwave (push and hurt everything near), bind (stun a crowd), broadcast (hurt everything on screen). */
  magic: 'shockwave' | 'bind' | 'broadcast';
  magicName: string;
  glide: boolean;
  slash: number;           // colour of the swing effect
}
export const HEROES: Record<string, HeroDef> = {
  bumper: {
    id: 'bumper', name: 'בומפר', blurb: 'קרב צמוד, מכות חזקות ודוחף אויבים', hp: 6, speed: 225, jump: -690, bodyW: 30, bodyH: 76,
    combo: [
      { time: 0.24, hit: [0.07, 0.17], dmg: 1, lunge: 150, push: 220, reach: 78, h: 70 },
      { time: 0.24, hit: [0.08, 0.18], dmg: 1, lunge: 150, push: 240, reach: 78, h: 70 },
      { time: 0.38, hit: [0.14, 0.28], dmg: 2, lunge: 260, push: 520, reach: 100, h: 84 },
    ],
    magic: 'shockwave', magicName: 'גל הדף', glide: false, slash: 0xff7a4d,
  },
  lasso: {
    id: 'lasso', name: 'לאסו', blurb: 'מהירה וארוכת טווח, קושרת קבוצות', hp: 5, speed: 255, jump: -705, bodyW: 26, bodyH: 92,
    combo: [
      { time: 0.22, hit: [0.06, 0.16], dmg: 1, lunge: 90, push: 160, reach: 130, h: 60 },
      { time: 0.22, hit: [0.06, 0.16], dmg: 1, lunge: 90, push: 160, reach: 130, h: 60 },
      { time: 0.34, hit: [0.1, 0.26], dmg: 2, lunge: 160, push: 380, reach: 170, h: 100 },
    ],
    magic: 'bind', magicName: 'קשירה', glide: false, slash: 0x4fd1c5,
  },
  beacon: {
    id: 'beacon', name: 'משואה', blurb: 'קלה ומרחפת, קרני אור וגל שידור', hp: 5, speed: 215, jump: -690, bodyW: 30, bodyH: 70,
    combo: [
      { time: 0.22, hit: [0.07, 0.15], dmg: 1, lunge: 70, push: 150, reach: 96, h: 60 },
      { time: 0.22, hit: [0.07, 0.15], dmg: 1, lunge: 70, push: 150, reach: 96, h: 60 },
      { time: 0.36, hit: [0.12, 0.26], dmg: 2, lunge: 60, push: 300, reach: 230, h: 70 },
    ],
    magic: 'broadcast', magicName: 'שידור כללי', glide: true, slash: 0xffe45c,
  },
};
