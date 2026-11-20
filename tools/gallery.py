"""Render the art gallery to a PNG. usage: python -I tools/gallery.py <out.png> [rig id] [t=seconds] [WxH]
Needs the dev server (npm run dev, port 5213). Look at the PNG with the Read tool."""
import sys
from playwright.sync_api import sync_playwright
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
out = sys.argv[1]
rig = sys.argv[2] if len(sys.argv) > 2 else ""
t = sys.argv[3] if len(sys.argv) > 3 else "0.3"
w, h = (int(v) for v in (sys.argv[4] if len(sys.argv) > 4 else "1100x700").split("x"))
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": w, "height": h}).new_page()
    pg.on("pageerror", lambda e: print("PAGE ERROR:", e))
    pg.on("console", lambda m: print("CONSOLE ERROR:", m.text) if m.type == "error" else None)
    pg.goto(f"http://localhost:5213/?gallery={rig}&t={t}", wait_until="domcontentloaded")
    pg.wait_for_timeout(1500)
    pg.screenshot(path=out)
    b.close()
