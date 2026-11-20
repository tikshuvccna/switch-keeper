import sys
from playwright.sync_api import sync_playwright
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    pg = b.new_context(viewport={"width": 1280, "height": 720}).new_page()
    pg.on("pageerror", lambda e: print("PAGE ERROR:", e))
    pg.on("console", lambda m: print("CONSOLE ERROR:", m.text) if m.type == "error" else None)
    pg.goto(f"http://localhost:5213/?world&x={sys.argv[2] if len(sys.argv) > 2 else 0}", wait_until="domcontentloaded")
    pg.wait_for_timeout(2500)
    pg.screenshot(path=sys.argv[1])
    b.close()
