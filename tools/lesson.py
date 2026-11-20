"""Walk through a lesson with the right answers, then try the mini-games. usage: python -I tools/lesson.py <prefix> <l14|l15|l16>"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
pre, lid = sys.argv[1], sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": 1100, "height": 640}).new_page()
    logs = []
    pg.on("pageerror", lambda e: logs.append("PAGE ERROR: " + str(e)))
    pg.on("console", lambda m: logs.append("CONSOLE: " + m.text) if m.type == "error" else None)
    pg.goto("http://localhost:5213/", wait_until="domcontentloaded")
    pg.wait_for_function("() => window.__learn", timeout=30000)
    pg.evaluate("(id) => window.__learn.openLesson(id, 'בדיקה', (r) => { window.__res = r; })", lid)
    L = pg.evaluate("(id) => window.__learn.LESSONS[id]", lid)
    for i, s in enumerate(L["steps"]):
        pg.wait_for_timeout(250)
        if i in (0, 2): pg.screenshot(path=f"{pre}_step{i}.png")
        pg.locator(".opt").nth(s["check"]["correct"]).click()
        pg.locator(".checkbox .slot.big").click()
    for i, q in enumerate(L["quiz"]):
        pg.wait_for_timeout(150)
        pg.locator(".opt").nth(q["correct"]).click()
        pg.locator(".checkbox .slot.big").click()
    pg.wait_for_timeout(300)
    pg.screenshot(path=f"{pre}_quizdone.png")
    pg.get_by_text("למשחק").first.click()
    pg.wait_for_timeout(300)
    pg.screenshot(path=f"{pre}_levels.png")
    pg.locator(".glevel").nth(0).click()
    pg.wait_for_timeout(2500)
    pg.screenshot(path=f"{pre}_game.png")
    # a few random clicks to exercise the handlers
    for k in range(6):
        for sel in [".parcel", ".acts .mini", ".topowrap + p + .row2 .chip", ".gbody .chip"]:
            loc = pg.locator(sel)
            if loc.count(): 
                try: loc.nth(k % loc.count()).click(timeout=500)
                except Exception: pass
        pg.wait_for_timeout(300)
    pg.screenshot(path=f"{pre}_game2.png")
    for l in logs[:8]: print(l)
    print("done; quiz saved:", pg.evaluate("() => JSON.parse(localStorage.getItem('switchkeeper.save.v1') || '{}').lessons"))
    b.close()
