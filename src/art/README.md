# Art guide for the creatures of "שומר המתג" (Switch Keeper)

Everything here is original art made in code: **puppets** (see `puppet.ts`). A creature is a list of parts (`PartDef`), each a small picture
drawn once with canvas paths and hung from a joint of its parent, plus a `pose()` function that turns joints for what the creature is doing.
Look at `rigs/bumper.ts` first: it is the reference (a stocky otter postal carrier who swings a giant rubber stamp).

## The world and the look
Switchburg is a postal sorting town made of paper: a layered paper-cut look with a thick ink outline (`INK` #1d1a33, ~3 px), flat saturated
colour with a soft lighter top and darker bottom (`paper()`), a small white shine stroke (`shine()`), big glossy expressive eyes (`eye()`).
Palette: warm cream paper #f6e9cf, postal red #e4572e, teal #1fa89a, mustard #f2b134, plum #6b3fa0, navy #2f3b78, fur browns. Friendly, a bit mischievous, never gory.
The game teaches computer networks (unit 5: MAC addresses, hubs, switches, collision and broadcast domains). Enemies are *network troubles with a face*
(noise, collisions, clones, floods, shouting), never humans, never realistic weapons or blood. Defeated enemies are "disconnected": they pop into paper scraps.
Do not copy or resemble any existing game, film or brand character. No robots, plugs, cubes or wizards (earlier games used those). Make strong, readable silhouettes.

## Rules for a rig file (`rigs/<name>.ts`)
* `export const RIGS: HeroRig[] | EnemyRig[] = [...]` (see `types.ts`). One file can hold several rigs. The registry loads every file in `rigs/` by itself.
* Design units are pixels at scale 1. A hero is about 95-110 units tall (including headgear); small enemies 40-60; large enemies 80-130; bosses 200-320.
  The root is at the feet (or the middle for flyers: say so in `body.origin`). The creature faces **+x**; the game mirrors it for the other direction.
* Angles: rotation 0 = a limb hangs down. Negative swings it forward (+x), positive backward. A rotation turns the part around its joint (the joint is `ax, ay` inside its picture).
  A part's `at` is its joint position in the parent's space. Parts are drawn in list order; `behind: true` puts a part behind its parent's picture (far arm, far leg, tail). Parents must come before children in the list.
* `pose(ctx)` must be a cheap pure function of the context (no state, no randomness). Return `Pose` entries as `[rot, dx, dy, scaleX, scaleY]`. Use `sample()` keyframes for attacks and `add()` to combine.
  Handle EVERY state in the context type, with clear anticipation (windup must be a readable telegraph of at least 0.4 s: crouch, inflate, raise), a snappy attack, squash and stretch, secondary motion (tails, ears, cloth).
  For `idle`/`move` use `ctx.time` for loops (breathing, walk or flap cycle).
* Texture drawing happens once per part at 2x resolution. Keep each picture small (a part is at most ~120 units wide); big bosses are made of several parts.
* Provide `demo`: example contexts the gallery shows (idle, move at two times, each attack stage or state, hurt, dead...).

## How to check your work (do this repeatedly, it is the whole point)
1. The dev server runs on port 5213 (`npm run dev` in the project root if it is not running).
2. `python -I tools/gallery.py tmp/<name>.png <rig id>` renders all your demo poses; then LOOK at the PNG with the Read tool. Add `t=<seconds>` to see another moment of loops, e.g. `python -I tools/gallery.py tmp/x.png myrig 0.7`.
3. `npx tsc --noEmit` must pass. The page must show no errors (the script prints them).
4. Iterate on the drawing until it looks like polished 2D game art: clean silhouette, good proportions, charming faces, readable poses. Fix anything odd (limbs detaching, parts overlapping badly, flat or muddy colours).
Only create or edit files in `src/art/rigs/` that your task names. Do not edit other files, do not commit, do not use the network or Flow, do not run other dev servers.
