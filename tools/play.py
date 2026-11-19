"""Drive the prototype with the real keyboard. usage: python -I tools/play.py <out_prefix> [WxH]"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
prefix = sys.argv[1]
w, h = (int(v) for v in (sys.argv[2] if len(sys.argv) > 2 else "960x540").split("x"))
ST = "() => { const s = window.__sk; const h = s.hero; return { x: Math.round(h.x), y: Math.round(h.y), hp: h.hp, meter: Math.round(h.meter), state: h.state, bits: h.bits, lvl: h.level, en: s.enemies.length, ground: h.grounded }; }"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": w, "height": h}).new_page()
    logs = []
    pg.on("pageerror", lambda e: logs.append("PAGEERROR: " + str(e)))
    pg.on("console", lambda m: logs.append(m.type + ": " + m.text) if m.type == "error" else None)
    pg.goto("http://localhost:5213/", wait_until="domcontentloaded")
    pg.wait_for_function("() => window.__sk", timeout=30000)
    pg.wait_for_timeout(800)
    pg.screenshot(path=f"{prefix}_0start.png")
    print("start", pg.evaluate(ST))
    pg.keyboard.down("ArrowRight"); pg.wait_for_timeout(1500); pg.keyboard.up("ArrowRight")
    print("ran right", pg.evaluate(ST))
    pg.keyboard.press("Space"); pg.wait_for_timeout(250)
    print("mid-jump", pg.evaluate(ST))
    pg.wait_for_timeout(700)
    for k in range(3):
        pg.keyboard.press("j"); pg.wait_for_timeout(90)
    pg.wait_for_timeout(300)
    pg.screenshot(path=f"{prefix}_1attack.png")
    pg.keyboard.press("k"); pg.wait_for_timeout(100)
    print("dash", pg.evaluate(ST))
    pg.wait_for_timeout(500)
    print("end", pg.evaluate(ST))
    for l in logs[:10]: print("LOG", l)
    b.close()
