"""After-capture + acceptance checks for the workbook path.

For each case: generate through the real UI with a fixed document code, wait
for pagination, then check and record:
  - sheets, clipping (flow overflow), scaled blocks, answer leakage on student sheets
  - print PDF (Chromium, A4) page count == student sheets (key hidden) and
    == student + key sheets (key shown)
  - the in-app "הורד PDF" download: page count, A4 size, rendered pages
  - phone width: zoom applied, no horizontal scroll
  - one exercise "הורד כתמונה" PNG
Usage: python -I capture_after.py <base_url> <out_dir>
"""
import json
import pathlib
import sys

import fitz
from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip("/")
OUT = pathlib.Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)
CODE = "K7M2QF"

CASES = [
    # name, grade, [(domain, topic)], count, level, progression, doc, qtype, view
    ("geometry-pythagoras", "7", [("geometry", "G7-03-ENGINE")], "6", "standard", "uniform", "worksheet", "mixed", "color"),
    ("algebra-equations", "7", [("algebra", "A7-03-ENGINE")], "6", "standard", "uniform", "worksheet", "mixed", "color"),
    ("numeric-percent", "8", [("numeric", "N8-04-ENGINE")], "6", "standard", "uniform", "worksheet", "mixed", "color"),
    ("uncertainty-frequency", "7", [("uncertainty", "U7-01-ENGINE")], "6", "standard", "uniform", "worksheet", "mixed", "color"),
    ("algebra-slope-graph", "8", [("algebra", "A8-02-ENGINE")], "6", "standard", "uniform", "worksheet", "mixed", "color"),
    ("exam-grade8-multi", "8", [("numeric", "N8-04-ENGINE"), ("algebra", "A8-02-ENGINE"), ("uncertainty", "U8-01-ENGINE")], "9", "challenge", "graduated", "exam", "mixed", "color"),
    ("quiz-pythagoras-bw", "7", [("geometry", "G7-03-ENGINE")], "5", "challenge", "graduated", "quiz", "mixed", "bw"),
    ("legacy-inequalities", "8", [("algebra", "A8-04")], "4", "standard", "uniform", "worksheet", "mixed", "color"),
]

STATE_JS = """() => {
  const set = document.getElementById('exset');
  const flows = [...document.querySelectorAll('.wb-page .wb-flow')];
  const student = [...document.querySelectorAll('.wb-page:not(.wb-key-page)')];
  return {
    sheets: +(set && set.dataset.paged || 0), keySheets: +(set && set.dataset.keyPages || 0),
    cards: document.querySelectorAll('.wb-page .ex-card').length,
    clipped: flows.filter(f => f.scrollHeight - f.clientHeight > 1).length,
    scaled: document.querySelectorAll('.wb-page [data-scaled]').length,
    leak: student.some(p => /mcq-correct|tf-verdict|ak-item|✓ נכון|✗ שגוי/.test(p.innerHTML)),
    rawTex: student.some(p => /\\$[^$<]{1,40}\\$/.test(p.innerText)),
    undef: /undefined|NaN/.test(document.getElementById('out').innerText),
    chapters: document.querySelectorAll('.wb-chapters .wb-chapter-link').length,
    zoom: getComputedStyle(document.querySelector('.wb-pages')).getPropertyValue('--wb-zoom'),
    hscroll: document.documentElement.scrollWidth > window.innerWidth + 1,
    seed: set && set.dataset.seed,
    figLabelsOutside: [...document.querySelectorAll('.wb-page svg.wb-fig')].reduce((n, svg) => {
      const vb = svg.viewBox.baseVal; return n + [...svg.querySelectorAll('text')].filter(t => { const b = t.getBBox(); return b.x < vb.x - 0.2 || b.y < vb.y - 0.2 || b.x + b.width > vb.x + vb.width + 0.2 || b.y + b.height > vb.y + vb.height + 0.2; }).length; }, 0),
  };
}"""


def setup(page, grade, topics, count, level, prog, doc, qtype, view):
    page.wait_for_function("typeof generate==='function' && document.querySelectorAll('#st option').length>0")
    page.wait_for_function("(window.TOPICS_READY=true) && document.readyState==='complete'")
    page.wait_for_timeout(700)
    page.select_option("#sg", grade); page.evaluate("onGrade()")
    for domain, topic in topics:
        page.select_option("#sd", domain); page.evaluate("onDomain()")
        page.select_option("#st", topic)
        if len(topics) > 1:
            page.click("#btnAddTopic")
    page.select_option("#sn", count); page.select_option("#sl", level)
    page.dispatch_event("#sl", "change")
    page.select_option("#sprog", prog); page.select_option("#sdoc", doc)
    if page.is_visible("#selQType"):
        page.select_option("#selQType", qtype)
    page.select_option("#sv", view); page.evaluate("onVisualMode()")
    page.fill("#sseed", CODE)
    page.click(".btn-gen")
    page.wait_for_selector("#exset[data-paged]", timeout=20000)
    page.wait_for_timeout(400)


def pdf_info(path, prefix, dpi=70):
    d = fitz.open(path)
    sizes = {(round(p.rect.width), round(p.rect.height)) for p in d}
    for i, p in enumerate(d):
        p.get_pixmap(dpi=dpi).save(str(OUT / f"{prefix}-p{i + 1}.png"))
    return {"pages": d.page_count, "sizes_pt": sorted(sizes)}


def main():
    report = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for name, grade, topics, count, level, prog, doc, qtype, view in CASES:
            entry = {}
            ctx = browser.new_context(viewport={"width": 1280, "height": 900}, locale="he-IL", accept_downloads=True)
            page = ctx.new_page()
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.goto(BASE + "/index.html", wait_until="networkidle")
            setup(page, grade, topics, count, level, prog, doc, qtype, view)
            entry["state"] = page.evaluate(STATE_JS)
            page.screenshot(path=str(OUT / f"{name}-desktop.png"), full_page=True)
            first = page.query_selector(".wb-page")
            first.screenshot(path=str(OUT / f"{name}-sheet1.png"))
            # print without and with key
            page.emulate_media(media="print")
            page.pdf(path=str(OUT / f"{name}-print.pdf"), prefer_css_page_size=True, print_background=True)
            entry["print"] = pdf_info(OUT / f"{name}-print.pdf", f"{name}-print")
            page.emulate_media(media="screen")
            page.click("#btnAnswerKey")
            page.emulate_media(media="print")
            page.pdf(path=str(OUT / f"{name}-print-key.pdf"), prefer_css_page_size=True, print_background=True)
            entry["print_key"] = pdf_info(OUT / f"{name}-print-key.pdf", f"{name}-print-key")
            page.emulate_media(media="screen")
            page.click("#btnAnswerKey")
            # in-app PDF download (student sheets only)
            with page.expect_download(timeout=60000) as dl:
                page.click("#btnPdf")
            dpath = OUT / f"{name}-download.pdf"
            dl.value.save_as(str(dpath))
            entry["download_name"] = dl.value.suggested_filename
            entry["download"] = pdf_info(dpath, f"{name}-download", dpi=80)
            # one exercise as image
            with page.expect_download(timeout=30000) as img:
                page.click("#exCard0 .btn-img-download")
            ipath = OUT / f"{name}-ex1.png"
            img.value.save_as(str(ipath))
            entry["image"] = img.value.suggested_filename
            entry["errors"] = errors
            ctx.close()
            # phone
            ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, locale="he-IL", is_mobile=True, has_touch=True)
            page = ctx.new_page()
            page.goto(BASE + "/index.html", wait_until="networkidle")
            setup(page, grade, topics, count, level, prog, doc, qtype, view)
            entry["phone"] = page.evaluate(STATE_JS)
            page.screenshot(path=str(OUT / f"{name}-phone.png"), full_page=False)
            page.evaluate("document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.querySelector('.wb-viewport').getBoundingClientRect().top + window.scrollY - 70)"); page.wait_for_timeout(500)
            page.screenshot(path=str(OUT / f"{name}-phone-sheet.png"), full_page=False)
            ctx.close()
            report[name] = entry
            print(name, json.dumps(entry, ensure_ascii=False))
        browser.close()
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


main()
