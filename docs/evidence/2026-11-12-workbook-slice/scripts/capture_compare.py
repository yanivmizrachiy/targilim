"""Compare capture engines against Chromium's own rendering of the same sheet.
For sheet 1 of a seeded document: native element screenshot vs snapDOM vs
html2canvas 1.4.1 (both at scale 1). Reports mean absolute pixel difference
over the sheet and over the text-only band, and saves crops side by side."""
import base64
import io
import sys

from PIL import Image, ImageChops, ImageStat
from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip("/")
OUT = sys.argv[2]
URL = BASE + "/index.html#g=7&t=G7-03-ENGINE&n=4&l=standard&p=uniform&d=worksheet&q=open&m=single&s=K7M2QF"

JS = """async (engine) => {
  const page = document.querySelector('.wb-page');
  document.body.classList.add('wb-capture');
  await new Promise(r => setTimeout(r, 300));
  let canvas;
  if (engine === 'snapdom') canvas = await TargilimWorkbook.capture.toCanvas(page, { scale: 1, exclude: ['.ex-imgbar'] });
  else canvas = await html2canvas(page, { scale: 1, backgroundColor: '#ffffff', logging: false });
  document.body.classList.remove('wb-capture');
  return canvas.toDataURL('image/png');
}"""


def img(data_url):
    return Image.open(io.BytesIO(base64.b64decode(data_url.split(",", 1)[1]))).convert("RGB")


with sync_playwright() as pw:
    b = pw.chromium.launch()
    p = b.new_page(viewport={"width": 1280, "height": 1400}, device_scale_factor=1)
    p.goto(URL, wait_until="networkidle")
    p.wait_for_selector("#exset[data-paged]", timeout=20000)
    p.add_style_tag(content=".wb-toolbar,.hdr{display:none!important}.wb-flow .ex-imgbar{visibility:hidden}")
    p.evaluate("document.body.classList.add('wb-capture')")
    p.wait_for_timeout(300)
    native = Image.open(io.BytesIO(p.query_selector(".wb-page").screenshot())).convert("RGB")
    p.evaluate("document.body.classList.remove('wb-capture')")
    snap = img(p.evaluate(JS, "snapdom"))
    h2c = img(p.evaluate(JS, "html2canvas"))
    b.close()

size = native.size
res = {}
for name, im in (("snapdom", snap), ("html2canvas", h2c)):
    im = im.resize(size)
    diff = ImageChops.difference(native, im)
    band = (0, 160, size[0], 420)  # exercise 1 text region
    res[name] = {
        "sheet_mean_abs_diff": round(sum(ImageStat.Stat(diff).mean) / 3, 2),
        "text_band_mean_abs_diff": round(sum(ImageStat.Stat(diff.crop(band)).mean) / 3, 2),
    }
print(size, res)
crop = (0, 300, size[0], 470)
row = Image.new("RGB", (size[0], (crop[3] - crop[1]) * 3 + 20), "white")
for i, im in enumerate((native, snap.resize(size), h2c.resize(size))):
    row.paste(im.crop(crop), (0, i * (crop[3] - crop[1] + 10)))
row.save(OUT)
