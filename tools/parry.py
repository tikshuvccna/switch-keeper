"""Check the parry: pink orbs and pink projectiles. usage: python -I tools/parry.py"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ST = "() => { const h = window.__sk.hero, s = window.__sk.scene; return { y: Math.round(h.y), vy: Math.round(h.body.velocity.y), meter: Math.round(h.meter), air: h.airJumps, grounded: h.grounded, projs: s.projs.length }; }"
def load(b, sid):
    pg = b.new_context(viewport={"width": 1100, "height": 620}).new_page()
    pg.errs = []
    pg.on("pageerror", lambda e: pg.errs.append(str(e)))
    pg.goto("http://localhost:5213/?stage=" + sid, wait_until="domcontentloaded")
    pg.wait_for_function("() => window.__sk && window.__sk.scene.layout", timeout=30000)
    pg.evaluate("() => { const h = window.__sk.hero; h.maxHp = h.hp = 50; }")
    pg.wait_for_timeout(500)
    return pg
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = load(b, "market.2")
    o = pg.evaluate("() => window.__sk.scene.layout.orbs[0]")
    print("orb at", o)
    # 1. a real jump from the ground next to the orb: jump, double jump, then press jump at the orb
    pg.evaluate("([x, y]) => { const h = window.__sk.hero; h.sprite.setPosition(x - 40, 479); h.body.setVelocity(0, 0); h.meter = 0; }", o)
    pg.wait_for_timeout(300)
    pg.keyboard.press("Space"); pg.wait_for_timeout(180)
    print("after jump", pg.evaluate(ST))
    # in the air: move onto the orb and press jump again
    pg.evaluate("([x, y]) => { const h = window.__sk.hero; h.sprite.setPosition(x, y + 40); h.body.setVelocity(0, 0); h.airJumps = 0; }", o)
    pg.keyboard.press("Space"); pg.wait_for_timeout(120)
    print("PARRY on orb (meter should be ~22, airJumps 1, going up):", pg.evaluate(ST))
    # 2. press jump again without an orb nearby: only the double jump
    pg.evaluate("() => { const h = window.__sk.hero; h.sprite.setPosition(40, 300); h.body.setVelocity(0, 0); h.airJumps = 1; h.meter = 0; }")
    pg.keyboard.press("Space"); pg.wait_for_timeout(120)
    print("double jump, no parry (meter 0, airJumps 0):", pg.evaluate(ST))
    def shoot(kind):
        pg.evaluate("(k) => { const s = window.__sk.scene, h = window.__sk.hero; s.projs.forEach(p => p.destroy()); s.projs.length = 0; h.sprite.setPosition(s.cameras.main.scrollX + 300, 250); h.body.setVelocity(0, 0); h.body.setAllowGravity(false); h.airJumps = 0; h.meter = 0; h.invuln = 0; h.hp = 50; s.enemyFire({ x: h.x + 260, y: h.y - 13, rig: { body: { origin: 'feet', h: 40 } } }, k); }", kind)
    def approach(press):
        for i in range(400):
            d = pg.evaluate("() => { const s = window.__sk.scene, h = window.__sk.hero, p = s.projs[0]; return p ? Math.hypot(p.x - h.x, p.y - (h.y - 38)) : -1; }")
            if d < 0: return "gone"
            if d < 52:
                if press: pg.keyboard.press("Space")
                pg.wait_for_timeout(150); return "pressed" if press else "close"
            pg.wait_for_timeout(30)
        return "never arrived"
    # 3. a pink packet: parry destroys it, bounces the hero and fills the meter
    shoot("pink"); pg.evaluate("() => { window.__sk.hero.body.setAllowGravity(false); }")
    print("pink packet:", approach(True), pg.evaluate(ST), "hp", pg.evaluate("() => window.__sk.hero.hp"))
    # 4. the same pink packet without pressing jump: it hurts
    shoot("pink"); print("pink, no parry:", approach(False)); pg.wait_for_timeout(400); print("  hp after", pg.evaluate("() => window.__sk.hero.hp"), "(less than 50 = it hurt)")
    # 5. a white packet: pressing jump does not parry it
    shoot("packet"); print("white packet:", approach(True)); pg.wait_for_timeout(300); print("  hp after", pg.evaluate("() => window.__sk.hero.hp"), "meter", pg.evaluate("() => Math.round(window.__sk.hero.meter)"), "(hp 49 and meter 0 = not parried)", pg.errs[:2])
    b.close()
