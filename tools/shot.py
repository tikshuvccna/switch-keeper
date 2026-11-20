"""Screenshots of the game. usage: python -I tools/shot.py <out_prefix> [WxH] [query]  (dev server on 5213)"""
import sys
from playwright.sync_api import sync_playwright
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
pre = sys.argv[1]
w, h = (int(v) for v in (sys.argv[2] if len(sys.argv) > 2 else "1100x620").split("x"))
q = sys.argv[3] if len(sys.argv) > 3 else ""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": w, "height": h}).new_page()
    pg.on("pageerror", lambda e: print("PAGE ERROR:", e))
    pg.on("console", lambda m: print("CONSOLE ERROR:", m.text) if m.type == "error" else None)
    pg.goto("http://localhost:5213/?" + q, wait_until="domcontentloaded")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=pre + "_a.png")
    if "stage" in q:
        pg.keyboard.down("ArrowRight"); pg.wait_for_timeout(1800); pg.keyboard.up("ArrowRight")
        pg.keyboard.press("j"); pg.wait_for_timeout(120)
        pg.screenshot(path=pre + "_b.png")
    b.close()
