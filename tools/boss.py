"""Fight a boss with a simple bot. usage: python -I tools/boss.py <prefix> <stage id>"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
pre, sid = sys.argv[1], sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": 1100, "height": 620}).new_page()
    logs = []
    pg.on("pageerror", lambda e: logs.append("PAGE ERROR: " + str(e)))
    pg.on("console", lambda m: logs.append("CONSOLE: " + m.text) if m.type == "error" else None)
    pg.goto("http://localhost:5213/?stage=" + sid, wait_until="domcontentloaded")
    pg.wait_for_function("() => window.__sk && window.__sk.scene.arena", timeout=30000)
    pg.evaluate("() => { const s = window.__sk.scene; const h = window.__sk.hero; h.sprite.setPosition(s.arena.x0 + 300, 470); h.maxHp = 40; h.hp = 40; }")
    pg.wait_for_timeout(800)
    pg.screenshot(path=pre + "_arena.png")
    for i in range(160):
        st = pg.evaluate("""() => { const s = window.__sk.scene, h = window.__sk.hero, b = s.boss; if (!b) return null; h.hp = Math.max(h.hp, 20);
          const dx = b.x - h.x; const want = Math.abs(dx) > 150 ? Math.sign(dx) : 0; window.__sk.inp.right = want > 0; window.__sk.inp.left = want < 0;
          if (b.open && Math.abs(dx) < (b.rig.body.w / 2 + 90)) window.__sk.inp.attackP = true; if (h.meter >= 100) window.__sk.inp.magicP = true;
          return { hp: b.hp, state: b.state, phase: b.phase, alive: b.alive, hx: Math.round(h.x), bx: Math.round(b.x), hhp: h.hp }; }""")
        if i % 20 == 0: print(i, st)
        if i == 40: pg.screenshot(path=pre + "_fight.png")
        if st and not st["alive"]: break
        pg.wait_for_timeout(250)
    pg.wait_for_timeout(2800)
    pg.screenshot(path=pre + "_end.png")
    print("result visible:", pg.evaluate("() => !!document.querySelector('#screen .ticket')"))
    for l in logs[:8]: print(l)
    b.close()
