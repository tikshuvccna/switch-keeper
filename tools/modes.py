"""Test the world mechanics one by one. usage: python -I tools/modes.py <prefix>"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
pre = sys.argv[1]
ST = "() => { const h = window.__sk.hero; return { x: Math.round(h.x), y: Math.round(h.y), vy: Math.round(h.body.velocity.y), g: h.grounded, flip: h.flipped, size: h.sizeState, hp: h.hp, cam: Math.round(window.__sk.scene.cameras.main.scrollX) }; }"
def load(b, sid):
    pg = b.new_context(viewport={"width": 1100, "height": 620}).new_page()
    pg.errs = []
    pg.on("pageerror", lambda e: pg.errs.append(str(e)))
    pg.goto("http://localhost:5213/?stage=" + sid, wait_until="domcontentloaded")
    pg.wait_for_function("() => window.__sk && window.__sk.scene.layout", timeout=30000)
    pg.evaluate("() => { const h = window.__sk.hero; h.maxHp = h.hp = 50; }")
    pg.wait_for_timeout(600)
    return pg
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    # antigravity
    pg = load(b, "tower.3")
    print("flip start", pg.evaluate(ST))
    pg.keyboard.press("g"); pg.wait_for_timeout(900)
    print("flipped (on the ceiling?)", pg.evaluate(ST)); pg.screenshot(path=pre + "_flip.png")
    pg.keyboard.down("ArrowRight"); pg.wait_for_timeout(1200); pg.keyboard.up("ArrowRight")
    print("walked on ceiling", pg.evaluate(ST))
    pg.keyboard.press("g"); pg.wait_for_timeout(1100); print("flipped back", pg.evaluate(ST), pg.errs[:2]); pg.close()
    # underwater
    pg = load(b, "street.2")
    for i in range(6): pg.keyboard.press("Space"); pg.wait_for_timeout(260)
    print("swim up", pg.evaluate(ST)); pg.wait_for_timeout(1500); print("sinks slowly", pg.evaluate(ST)); pg.screenshot(path=pre + "_swim.png"); print(pg.errs[:2]); pg.close()
    # flying
    pg = load(b, "borders.2")
    pg.keyboard.down("ArrowUp"); pg.wait_for_timeout(700); pg.keyboard.up("ArrowUp"); print("fly up", pg.evaluate(ST))
    pg.keyboard.down("ArrowRight"); pg.wait_for_timeout(1500); pg.keyboard.up("ArrowRight"); print("fly right", pg.evaluate(ST)); pg.screenshot(path=pre + "_fly.png"); print(pg.errs[:2]); pg.close()
    # giant: size and tunnel
    pg = load(b, "borders.3")
    pg.keyboard.press("r"); pg.wait_for_timeout(300); print("big", pg.evaluate(ST))
    pg.keyboard.press("r"); pg.wait_for_timeout(300); print("small", pg.evaluate(ST)); pg.screenshot(path=pre + "_size.png")
    x = pg.evaluate("() => { const o = window.__sk.scene.layout.obs.find(o => o.kind === 'lowbar'); return o ? o.x : -1; }")
    pg.evaluate("(x) => { window.__sk.hero.sprite.setPosition(x - 120, 470); }", x)
    pg.keyboard.down("ArrowRight"); pg.wait_for_timeout(2400); pg.keyboard.up("ArrowRight"); print("small passes tunnel (x was", x, ")", pg.evaluate(ST), pg.errs[:2]); pg.close()
    # musical
    pg = load(b, "borders.4")
    pg.wait_for_timeout(4200); print("auto-run", pg.evaluate(ST)); pg.screenshot(path=pre + "_music.png"); print(pg.errs[:2]); pg.close()
    # chase
    pg = load(b, "tower.4")
    pg.wait_for_timeout(3000); print("chase", pg.evaluate(ST)); pg.screenshot(path=pre + "_chase.png"); print(pg.errs[:2]); pg.close()
    # matrix bullet time
    pg = load(b, "tower.1")
    pg.keyboard.down("b"); pg.wait_for_timeout(1200); print("bullet time slow:", pg.evaluate("() => window.__sk.scene.slow")); pg.keyboard.up("b"); print(pg.errs[:2]); pg.close()
    # space gravity
    pg = load(b, "tower.2")
    pg.keyboard.down("Space"); mx = 999
    for i in range(30):
        pg.wait_for_timeout(30); mx = min(mx, pg.evaluate("() => window.__sk.hero.y"))
    pg.keyboard.up("Space"); print("space jump height", round(480 - mx)); pg.close()
    b.close()
