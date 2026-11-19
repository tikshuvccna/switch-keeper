# שומר המתג (Switch Keeper), prototype

Game 4 of the Tikshuv games: a side-scrolling adventure (MapleStory and Golden Axe style) for unit 5 (lessons 14-16).
Design spec: `E:\Tikshuv Games\specs\switch-keeper\00_DESIGN.md`.

**State: grey-box prototype.** One hero ("בומפר"), one street of the first area, boxes instead of art. Run, jump (hold for a full jump), three-hit combo (J), dash (K), magic shockwave (L, needs a full meter), drop through platforms (down + jump).
Enemies: Collision Twins (jam when they meet: double damage), Echo Imps (sleep until there is noise), Duplicate Frames (split when hit). One hidden knowledge card, bits, checkpoints, two pits, and the locked lesson portal at the end.

## Run
`npm install`, `npm run dev` (http://localhost:5213/), `npm run build`.
Tests (need the dev server): `python -I tools/mech.py tmp/m`, `python -I tools/touch.py tmp/t`, `python -I tools/play.py tmp/a`.
Hooks: `?debug` shows physics bodies. `window.__sk` = {scene, hero, enemies, inp}.
