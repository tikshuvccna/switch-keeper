# שומר המתג (Switch Keeper)

Game 4 of the Tikshuv games: a side-scrolling adventure (MapleStory and Golden Axe style) for unit 5 (lessons 14-16). Design: `E:\Tikshuv Games\specs\switch-keeper\00_DESIGN.md`.
Original art, all drawn and animated in code ("puppets", see `src/art/README.md`): three heroes, enemies, bosses, a paper-cut postal town.

## What is in
- Menu (post-office look), map of 4 areas x (3 stages + boss), hero choice (Bumper, Lasso, Beacon), skills and gear, card album, settings, credits.
- Stages are generated from segments (`src/game/levels.ts`); enemies (`enemy.ts`), bosses (`boss.ts`: Hub Hog and Door Flooder are done, the others use stand-ins), effects (`fx.ts`).
- Lesson gates: stage 3 of every area ends at a locked gate that needs the area's lesson (steps with checks, quiz, three-level mini-game): `src/learn/`.
- 10-15 minute rule: a warning at 8 minutes, then the storm carries the player to the lesson tower.

## Run
`npm install`, `npm run dev` (http://localhost:5213/), `npm run build`.
Test hooks: `?stage=market.1` starts a stage directly, `?gallery[=rigId]` shows the creatures, `?cheat`.
Tools (dev server needed): `tools/gallery.py`, `tools/shot.py`, `tools/boss.py`, `tools/lesson.py`, `tools/flow.py`, `tools/touch.py`.

## Controls (v2)
Keyboard: arrows or WASD move, Space jump (press again in the air: double jump; press again while touching a pink object: parry),
J or left mouse = melee combo, K or right mouse (hold) = ranged shot, Shift or C = dash, L or Q or middle mouse = super (full meter).
Touch: stick + five buttons (melee, shoot, jump, dash, super).
The lesson comes first: Ora (the tortoise teacher) waits at the start of stage 1 of each area, and the end of stage 1 is a gate that needs the lesson.
