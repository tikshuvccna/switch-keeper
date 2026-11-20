"""Screenshot a world. usage: python -I tools/world.py <out.png> <world id> [scrollX] [WxH]  (dev server on 5213)"""
import sys
from playwright.sync_api import sync_playwright
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
out, wid = sys.argv[1], sys.argv[2]
x = sys.argv[3] if len(sys.argv) > 3 else "0"
w, h = (int(v) for v in (sys.argv[4] if len(sys.argv) > 4 else "1280x720").split("x"))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": w, "height": h}).new_page()
    pg.on("pageerror", lambda e: print("PAGE ERROR:", e))
    pg.on("console", lambda m: print("CONSOLE ERROR:", m.text) if m.type == "error" else None)
    pg.goto(f"http://localhost:5213/?world={wid}&x={x}", wait_until="domcontentloaded")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=out)
    b.close()
