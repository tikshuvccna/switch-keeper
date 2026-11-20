"""Touch layout: no control overlaps another or the HUD, at four sizes. usage: python -I tools/touch.py <out_prefix>"""
import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OV = """() => { const ids = ['bJump','bAtk','bDash','bMagic','hud']; const R = ids.map(i => [i, document.getElementById(i).getBoundingClientRect()]); const out = [];
  for (let a = 0; a < R.length; a++) for (let b = a + 1; b < R.length; b++) { const p = R[a][1], q = R[b][1]; if (p.left < q.right && p.right > q.left && p.top < q.bottom && p.bottom > q.top) out.push(R[a][0] + '/' + R[b][0]); }
  const off = R.filter(([i, r]) => r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight).map(r => r[0]);
  return { overlap: out, off, buttons: R.slice(0, 4).map(([i, r]) => i + ':' + Math.round(r.width)).join(' ') }; }"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=CHROME, headless=True, args=["--headless=new", "--use-angle=d3d11", "--enable-gpu"])
    for (w, h) in [(320, 568), (360, 640), (740, 360), (1200, 760)]:
        pg = b.new_context(viewport={"width": w, "height": h}, has_touch=True, is_mobile=True).new_page()
        pg.on("pageerror", lambda e: print("ERR", e))
        pg.goto("http://localhost:5213/?stage=market.1", wait_until="domcontentloaded")
        pg.wait_for_function("() => window.__sk", timeout=30000); pg.wait_for_timeout(700)
        print(w, h, pg.evaluate(OV))
        pg.screenshot(path=f"{sys.argv[1]}_{w}x{h}.png")
        pg.close()
    b.close()
