"""Load every stage, play right with melee + shots for a few seconds, report errors and activity. usage: python -I tools/sweep.py <prefix>"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ids = [f"{a}.{n}" for a in ["market", "street", "borders", "tower"] for n in [1, 2, 3, 4, 5]]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    def run(sid):
        pg = b.new_context(viewport={"width": 1100, "height": 620}).new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("C: " + m.text) if m.type == "error" else None)
        pg.goto("http://localhost:5213/?stage=" + sid, wait_until="domcontentloaded")
        pg.wait_for_function("() => window.__sk && window.__sk.scene.layout", timeout=30000)
        pg.wait_for_timeout(500)
        L = pg.evaluate("() => { const l = window.__sk.scene.layout; if (!l) return {}; const o = {}; (l.obs || []).forEach(x => o[x.kind] = (o[x.kind] || 0) + 1); return { len: l.length, foes: l.spawns.length, elites: l.spawns.filter(s => s.elite).length, orbs: (l.orbs || []).length, obs: o }; }")
        pg.evaluate("() => { const h = window.__sk.hero; h.hp = h.maxHp = 40; }")
        pg.keyboard.down("ArrowRight"); pg.keyboard.down("k")
        shots = 0; maxp = 0
        for i in range(24):
            pg.keyboard.press("Space"); pg.wait_for_timeout(120); pg.keyboard.press("j"); pg.keyboard.press("g") if i % 6 == 3 else None; pg.keyboard.press("r") if i % 6 == 4 else None; pg.wait_for_timeout(180)
            n = pg.evaluate("() => window.__sk.scene.projs.length")
            maxp = max(maxp, n)
            if i == 14: pg.screenshot(path=f"{sys.argv[1]}_{sid}.png")
        pg.keyboard.up("ArrowRight"); pg.keyboard.up("k")
        x = pg.evaluate("() => Math.round(window.__sk.hero.x)")
        print(sid, pg.evaluate("() => window.__sk.scene.def.world"), L, "x:", x, "maxProj:", maxp, "ERR:" if errs else "", errs[:2])
        pg.close()
    for sid in ids:
        for attempt in range(4):
            try:
                run(sid); break
            except Exception as e:                      # the dev server reloads the page when art files change: retry
                print(sid, "retry", str(e)[:60])
    b.close()
