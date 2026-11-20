"""Menu -> stage -> exit -> result -> next stage -> map. usage: python -I tools/flow.py <prefix>"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": 1100, "height": 640}).new_page()
    logs = []
    pg.on("pageerror", lambda e: logs.append("PAGE ERROR: " + str(e)))
    pg.on("console", lambda m: logs.append("CONSOLE: " + m.text) if m.type == "error" else None)
    pg.goto("http://localhost:5213/", wait_until="domcontentloaded")
    pg.wait_for_selector(".slot.big", timeout=30000)
    pg.locator(".slot.big").click()
    pg.wait_for_function("() => window.__sk && window.__sk.scene.layout", timeout=20000)
    pg.wait_for_timeout(600)
    pg.evaluate("() => { const s = window.__sk.scene, h = window.__sk.hero; h.sprite.setPosition(s.layout.exit.x, 470); }")
    pg.wait_for_timeout(500)
    pg.keyboard.press("ArrowUp"); pg.wait_for_timeout(700)
    pg.screenshot(path=sys.argv[1] + "_result.png")
    print("result:", pg.evaluate("() => document.querySelector('#screen .ticket h2')?.textContent"))
    pg.locator(".ticket .slot.big").click()
    pg.wait_for_function("() => window.__sk && window.__sk.scene.def.id === 'market.2'", timeout=20000)
    print("next stage:", pg.evaluate("() => window.__sk.scene.def.id"), "| save:", pg.evaluate("() => JSON.stringify(window.__sk.save.stages)"))
    for l in logs[:8]: print(l)
    b.close()
