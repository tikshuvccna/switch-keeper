/** Skills (bought with skill points that come from levels) and gear (bought with bits): the bonuses they give the hero. */
import { save } from './save';

export interface Skill { id: string; name: string; text: string; max: number }
export const SKILLS: Skill[] = [
  { id: 'power', name: 'כוח', text: 'המכה השלישית חזקה יותר', max: 3 },
  { id: 'reach', name: 'טווח', text: 'המכות מגיעות רחוק יותר', max: 3 },
  { id: 'swift', name: 'זריזות', text: 'ריצה מהירה יותר', max: 3 },
  { id: 'vital', name: 'חיוניות', text: 'עוד לב אחד בכל רמה', max: 3 },
  { id: 'focus', name: 'ריכוז', text: 'מד הקסם מתמלא מהר יותר', max: 3 },
];
export interface Gear { id: string; slot: 'lantern' | 'boots' | 'badge'; name: string; text: string; price: number; reach?: number; speed?: number; focus?: number; hp?: number; dmg?: number }
export const GEAR: Gear[] = [
  { id: 'lantern1', slot: 'lantern', name: 'פנס נייר', text: 'מד קסם מהיר יותר', price: 60, focus: 0.15 },
  { id: 'lantern2', slot: 'lantern', name: 'פנס פליז', text: 'מד קסם הרבה יותר מהיר', price: 140, focus: 0.3 },
  { id: 'lantern3', slot: 'lantern', name: 'פנס המגדלור', text: 'מד קסם מהיר מאוד וטווח', price: 260, focus: 0.45, reach: 10 },
  { id: 'boots1', slot: 'boots', name: 'מגפי שליח', text: 'ריצה מהירה יותר', price: 60, speed: 12 },
  { id: 'boots2', slot: 'boots', name: 'מגפי רוח', text: 'ריצה מהירה עוד יותר', price: 140, speed: 24 },
  { id: 'boots3', slot: 'boots', name: 'מגפי ברק', text: 'ריצה מהירה מאוד', price: 260, speed: 38 },
  { id: 'badge1', slot: 'badge', name: 'תג כסף', text: 'לב נוסף', price: 80, hp: 1 },
  { id: 'badge2', slot: 'badge', name: 'תג זהב', text: 'לב נוסף ועוצמה', price: 180, hp: 1, dmg: 1 },
  { id: 'badge3', slot: 'badge', name: 'תג הדואר הראשי', text: 'שני לבבות ועוצמה', price: 320, hp: 2, dmg: 1 },
];
export const gearById = (id: string | null): Gear | undefined => GEAR.find((g) => g.id === id);

export interface Bonus { dmg: number; reach: number; speed: number; hp: number; meter: number }
export function bonuses(): Bonus {
  const sk = (id: string) => save.skills[id] ?? 0;
  const g = [save.gear.lantern, save.gear.boots, save.gear.badge].map(gearById);
  const sum = (f: (x: Gear) => number | undefined) => g.reduce((a, x) => a + (x ? f(x) ?? 0 : 0), 0);
  return {
    dmg: sk('power') + sum((x) => x.dmg),
    reach: sk('reach') * 10 + sum((x) => x.reach),
    speed: sk('swift') * 12 + sum((x) => x.speed),
    hp: Math.floor((save.level - 1) / 2) + sk('vital') + sum((x) => x.hp),
    meter: 1 + sk('focus') * 0.2 + sum((x) => x.focus),
  };
}
