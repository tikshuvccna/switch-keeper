"""Check each mechanic with real key presses: combo kills, twins jam, imps wake on noise, duplicate splits, magic, pit, gate."""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
prefix = sys.argv[1]
ST = "() => { const s = window.__sk; const h = s.hero; return { x: Math.round(h.x), y: Math.round(h.y), hp: h.hp, meter: Math.round(h.meter), state: h.state, lvl: h.level, xp: h.xp, en: s.enemies.length, kinds: s.enemies.map(e => e.kind[0] + (e.jam > 0 ? 'J' : '') + (e.asleep ? 'z' : '') + (e.isCopy ? 'c' : '')).join(' ') }; }"
TELE = "([x, y]) => { const h = window.__sk.hero; h.sprite.setPosition(x, y); h.body.setVelocity(0, 0); }"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": 960, "height": 540}).new_page()
    logs = []
    pg.on("pageerror", lambda e: logs.append("PAGEERROR: " + str(e)))
    pg.goto("http://localhost:5213/", wait_until="domcontentloaded")
    pg.wait_for_function("() => window.__sk", timeout=30000)
    pg.wait_for_timeout(600)
    # 1. twins: stand away and watch them meet and jam
    pg.evaluate(TELE, [1120, 300]); 
    seen = False
    for i in range(40):
        pg.wait_for_timeout(250)
        k = pg.evaluate(ST)["kinds"]
        if "wJ" in k: seen = True; break
    print("twins jam seen:", seen, pg.evaluate(ST)["kinds"][:40])
    pg.screenshot(path=f"{prefix}_twins.png")
    # 2. combo vs the jammed twin (double damage)
    pg.evaluate("() => { const e = window.__sk.enemies.filter(e => e.kind === 'walker' && e.jam > 0)[0]; const h = window.__sk.hero; if (e) { h.sprite.setPosition(e.x - 40, 480); h.body.setVelocity(0, 0); h.facing = 1; } }")
    pg.wait_for_timeout(100)
    for i in range(3): pg.keyboard.press("j"); pg.wait_for_timeout(260)
    pg.wait_for_timeout(300)
    print("after combo:", pg.evaluate(ST))
    # 3. imps: asleep until the first swing nearby
    pg.evaluate(TELE, [2150, 470]); pg.wait_for_timeout(300)
    print("imps before noise:", pg.evaluate(ST)["kinds"])
    pg.keyboard.press("j"); pg.wait_for_timeout(300)
    print("imps after swing:", pg.evaluate(ST)["kinds"])
    pg.screenshot(path=f"{prefix}_imps.png")
    # 4. duplicate frame splits on first non-lethal hit
    pg.evaluate("() => { const h = window.__sk.hero; const e = window.__sk.enemies.find(e => e.kind === 'dup' && !e.isCopy); h.sprite.setPosition(e.x - 75, 480); h.body.setVelocity(0, 0); h.facing = 1; }")
    pg.wait_for_timeout(120)
    pg.keyboard.press("j"); pg.wait_for_timeout(350)
    print("dup split:", pg.evaluate(ST)["kinds"])
    # 5. magic needs a full meter
    pg.evaluate("() => { window.__sk.hero.meter = 100; }")
    pg.keyboard.press("l"); pg.wait_for_timeout(700)
    print("after magic:", pg.evaluate(ST))
    pg.screenshot(path=f"{prefix}_magic.png")
    # 6. pit
    pg.evaluate(TELE, [1570, 400]); pg.wait_for_timeout(1500)
    print("after pit:", pg.evaluate(ST))
    # 7. gate
    pg.evaluate(TELE, [4230, 470]); pg.wait_for_timeout(400)
    pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(400)
    print("gate visible:", pg.evaluate("() => !document.getElementById('gate').classList.contains('hide')"), pg.evaluate("() => document.getElementById('gateStats').textContent"))
    pg.screenshot(path=f"{prefix}_gate.png")
    for l in logs[:10]: print("LOG", l)
    b.close()
