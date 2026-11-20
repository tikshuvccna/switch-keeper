/**
 * What each world does to the game: gravity, ice, swimming, flying, flipping gravity, auto-running to a beat, a chase, size changes,
 * bullet time, wind, meteors... plus the segments the level generator uses there and a one-line hint shown at the start of the stage.
 * The look of a world lives in src/art/worlds.
 */
export interface Mech {
  /** Gravity multiplier (1 = normal). */
  gravity?: number;
  ice?: boolean; swim?: boolean; fly?: boolean; flip?: boolean; size?: boolean; bullet?: boolean;
  /** Auto-run to the beat: beats per minute. */
  auto?: number;
  /** The camera runs on by itself and a wall chases the hero: speed in px/s at the start. */
  chase?: number;
  wind?: number; meteors?: number; rain?: 'rock' | 'code';
  /** Sticky or sandy ground zones slow the hero. */
  sticky?: boolean;
}
export interface WorldDef { id: string; mech: Mech; hint: string; mix: [string, number][]; pool?: string[]; /** the extra touch button: what it does */ extra?: 'flip' | 'size' | 'bullet' }

export const WORLD_DEFS: Record<string, WorldDef> = {
  market: { id: 'market', mech: {}, hint: 'שוק הצעקות: כל רעש מעיר אויבים. אורה מחכה לכם בהתחלה.', mix: [['street', 3], ['pit', 2], ['steps', 2], ['ambush', 2], ['spikes', 3], ['crumble', 2], ['gauntlet', 1], ['springs', 2]] },
  candy: { id: 'candy', mech: { sticky: true }, hint: 'ארץ הממתקים: גומי קופץ וקרמל דביק שמאט אתכם.', mix: [['springs', 4], ['sticky', 3], ['steps', 2], ['street', 2], ['pit', 2], ['gumdrops', 3], ['ambush', 2], ['orbtrail', 1]] },
  desert: { id: 'desert', mech: { sticky: true, wind: 120 }, hint: 'מדבר החול: חול טובעני וסופות רוח שדוחפות אתכם.', mix: [['sand', 4], ['spikes', 3], ['street', 2], ['pit', 2], ['crumble', 2], ['ambush', 2], ['orbtrail', 1]] },
  mountain: { id: 'mountain', mech: { wind: 90, rain: 'rock' }, hint: 'הר הרוחות: סלעים נופלים מלמעלה והרוח חזקה.', mix: [['climb', 4], ['steps', 3], ['pit', 2], ['high', 2], ['street', 2], ['ambush', 1], ['fan', 1]] },
  network: { id: 'network', mech: {}, hint: 'עולם הרשת: מסועי נתונים, חבילות וקרני לייזר.', mix: [['belts', 4], ['beams', 3], ['gauntlet', 3], ['movers', 2], ['street', 1], ['ambush', 2], ['orbtrail', 1]] },
  underwater: { id: 'underwater', pool: ['drifter', 'imp', 'hornhawk', 'crate'], mech: { swim: true, gravity: 0.5 }, hint: 'מתחת למים: קפיצה היא שחייה. לחצו שוב ושוב כדי לצוף.', mix: [['reef', 5], ['urchins', 3], ['ambush', 2], ['orbtrail', 1]] },
  snow: { id: 'snow', mech: { ice: true, wind: 110 }, hint: 'עולם השלג: קרח חלקלק ורוח קרה. תתכננו עצירה.', mix: [['icefloor', 4], ['spikes', 2], ['pit', 3], ['steps', 2], ['gauntlet', 2], ['street', 1], ['crumble', 2]] },
  cyber: { id: 'cyber', mech: {}, hint: 'עיר הסייבר: רשתות לייזר ורחפנים.', mix: [['beams', 4], ['movers', 3], ['gauntlet', 3], ['fan', 2], ['ambush', 2], ['orbtrail', 2]] },
  lava: { id: 'lava', mech: { gravity: 1 }, hint: 'הר הגעש: לבה בבורות ומזרקות אש.', mix: [['lava', 5], ['geysers', 3], ['crumble', 3], ['movers', 2], ['ambush', 2], ['steps', 1]] },
  flying: { id: 'flying', pool: ['imp', 'hornhawk', 'drifter', 'stormling'], mech: { fly: true }, hint: 'מעל העננים: אתם עפים! חצים לתנועה, קפיצה לעלות.', mix: [['flyzone', 1]] },
  giant: { id: 'giant', mech: { size: true }, extra: 'size', hint: 'עולם הענקים: R משנה גודל. קטנים נכנסים למנהרות, גדולים שוברים קירות.', mix: [['tunnels', 4], ['walls', 3], ['street', 2], ['steps', 2], ['ambush', 2]] },
  musical: { id: 'musical', mech: { auto: 120 }, hint: 'עולם המוזיקה: רצים לבד לפי הקצב. קפצו, תקפו וזנקו בזמן!', mix: [['beats', 1]] },
  matrix: { id: 'matrix', mech: { bullet: true, rain: 'code' }, extra: 'bullet', hint: 'המטריקס: החזיקו B כדי להאט את הזמן.', mix: [['gauntlet', 4], ['beams', 3], ['ambush', 3], ['movers', 2], ['street', 1], ['orbtrail', 2]] },
  space: { id: 'space', mech: { gravity: 0.45, meteors: 3.2 }, hint: 'החלל: כבידה נמוכה ומטאורים. קפיצות גבוהות!', mix: [['asteroids', 4], ['pit', 3], ['steps', 3], ['gauntlet', 2], ['ambush', 2], ['orbtrail', 2]] },
  antigravity: { id: 'antigravity', mech: { flip: true }, extra: 'flip', hint: 'אנטי-כבידה: G הופך את הכבידה. אפשר ללכת על התקרה!', mix: [['flips', 5], ['ambush', 2], ['beams', 2], ['spikes', 2]] },
  chase: { id: 'chase', mech: { chase: 150 }, hint: 'המרדף: הסערה רודפת אחריכם. אל תעצרו!', mix: [['street', 3], ['pit', 3], ['spikes', 3], ['crumble', 2], ['springs', 2], ['gauntlet', 1]] },
};
export const worldDef = (id: string): WorldDef => WORLD_DEFS[id] ?? WORLD_DEFS.market;
