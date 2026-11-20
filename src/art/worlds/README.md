# World art: one file per world (`w_<id>.ts`)

Every stage of "שומר המתג" happens in its own world with its own look. A world file calls `registerWorld({...})` (see `WorldArt` in
`src/art/world.ts`) and is loaded automatically (every `w_*.ts` in this folder). Read first: `src/art/world.ts` (the finished dusk-market world is
the quality reference: `sky`, `far`, `mid`, `groundTex`, `platformTex`, `propTex` and the helpers `mk`, `tex`, `lin`, `soft`, `nosoft`, `wrap`, `rng`,
`put`, `registerRes`; also `INK`, `paper`, `rr`, `ell`, `shade` in `src/art/puppet.ts`) and `src/art/README.md` (the paper-cut style).

## Style
A layered **paper-cut** look: flat saturated shapes with a soft top highlight and a darker bottom, a thick ink outline (`INK` #1d1a33) on near things
(ground, platforms, props), no outline on far layers, soft drop shadows (`soft()`), glowing lights with radial gradients. Each world must be recognisable at a
glance, with its own palette, mood and scenery, and **not look like the market**. Friendly and colourful, never scary or gory. Originals only.

## What a world provides (all drawn once with canvas paths; textures are cached by key, so use unique keys like `candy_far`)
* `sky(scene)`: a 960x540 texture (gradient, sun/moon/planets/stars/aurora...). Does not scroll.
* `far(scene)`: a 1920x540 texture that scrolls slowly and **wraps seamlessly** (draw anything near the left/right edge twice with `wrap()`).
* `mid(scene)` (recommended): a 1920x540 texture drawn at 1.5x resolution (`mk(w, h, draw, 1.5)`, `tex(..., 1.5)`) that scrolls faster; seamless too. Put the main
  scenery here, standing on a base line at y = 482 (the street level). Add atmosphere (a tint with `source-atop` like the market does) so it sits behind the action.
* `ground(scene, w)`: texture of width w and height 120: the top 22 px is the walkable lip (light, lit top edge, ink outline), then the body (rock, snow, candy...). Must tile
  well for any w (seed with w). The hero stands with its feet on y = 0 of this texture.
* `platform(scene, w, style, seed)`: a one-way platform, width w, height about 40, top edge at y = 4 (the hero stands on it). `style` is `'plank'` or `'awning'`: make the two
  styles look different (e.g. ice block and icicle ledge). The `seed` varies colours.
* `lamp(scene)`: a tall decorative prop (a lamp post, a crystal, a totem...) used at checkpoints. Origin: bottom centre. Draw with `mk(..., 2)` and register with `tex(scene, key, cv, 2)`.
* `props(scene)`: 5 or 6 scenery props that stand on the ground (bottom centre origin, 2x resolution as above, 40-130 px tall), specific to the world.
* `bunting(scene)` (optional): a banner or strand hung across the street (200 x 40 at 2x).
* `ambient(scene)` (optional): returns a Phaser particle emitter config plus `texture` (a small texture key you create) for drifting snow, embers, bubbles, code, stars...
  Particles are spawned over the whole screen (`x: {min:0,max:960}, y: {min:0,max:540}`, scroll factor 0): keep it light (frequency >= 60 ms, lifespan <= 6000).
* `overlay(scene)` (optional): a 960x540 texture drawn over the whole screen (e.g. a blue underwater tint with light rays, scanlines, heat haze). Mostly transparent.

## Check your work (the whole point: iterate until each world looks beautiful)
1. The dev server runs on port 5213 (`npm run dev` in the project root if it is not).
2. `python -I tools/world.py tmp/<id>.png <id>` renders the world preview (backdrop, ground, platforms, props, pickups, ambient, overlay); add a scroll value as the third
   argument to check other places and the wrap-around seam, e.g. `... <id> 0`, `... <id> 1500`, `... <id> 1900`. LOOK at every PNG with the Read tool.
3. `npx tsc --noEmit` must pass and the script must print no errors.
Only create `src/art/worlds/w_<id>.ts` files for your worlds (a file may share helpers by importing from `../world` and `../puppet`). Do not edit other files, do not commit,
no network, no other dev servers.
