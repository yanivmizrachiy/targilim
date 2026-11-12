"""Baseline (before) capture of the current targilim generator.

Seeds Math.random so the same worksheets can be compared later, then for each
representative topic: desktop screenshot, phone screenshot, Chromium A4 print
PDF (what "Save as PDF" produces) and PNG renders of every PDF page.
Usage: python -I capture_before.py <base_url> <out_dir>
"""
import json
import pathlib
import sys

import fitz  # PyMuPDF
from playwright.sync_api import sync_playwright

BASE = sys.argv[1].rstrip("/")
OUT = pathlib.Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

SEED_JS = """
(() => {
  let s = 0x9e3779b9 ^ %d;
  Math.random = function () {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
})();
"""

CASES = [
    # name, grade, domain, topic id, level, count
    ("geometry-pythagoras", "7", "geometry", "G7-03-ENGINE", "standard", "6"),
    ("algebra-equations", "7", "algebra", "A7-03-ENGINE", "standard", "6"),
    ("numeric-percent", "8", "numeric", "N8-04-ENGINE", "standard", "6"),
    ("uncertainty-frequency", "7", "uncertainty", "U7-01-ENGINE", "standard", "6"),
    ("algebra-slope-graph", "8", "algebra", "A8-02-ENGINE", "standard", "6"),
]


def generate(page, grade, domain, topic, level, count):
    page.wait_for_function("typeof TOPICS==='object' && document.querySelectorAll('#st option').length>0")
    page.wait_for_timeout(600)  # phase2-loader finishes, then onGrade()
    page.select_option("#sg", grade)
    page.evaluate("onGrade()")
    page.select_option("#sd", domain)
    page.evaluate("onDomain()")
    page.select_option("#st", topic)
    page.select_option("#sl", level)
    page.select_option("#sn", count)
    page.evaluate("generate()")
    page.wait_for_selector("#exset .ex-card")
    page.evaluate("document.fonts && document.fonts.ready")
    page.wait_for_timeout(500)


def render_pdf(pdf_path, prefix):
    doc = fitz.open(pdf_path)
    info = {"pages": doc.page_count, "text_chars": 0}
    for i, p in enumerate(doc):
        pix = p.get_pixmap(dpi=80)
        pix.save(str(OUT / f"{prefix}-p{i + 1}.png"))
        info["text_chars"] += len(p.get_text())
    return info


def main():
    report = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for idx, (name, grade, domain, topic, level, count) in enumerate(CASES):
            entry = {}
            for label, vp in (("desktop", {"width": 1280, "height": 900}), ("phone", {"width": 390, "height": 844})):
                ctx = browser.new_context(viewport=vp, device_scale_factor=1 if label == "desktop" else 2, locale="he-IL")
                ctx.add_init_script(SEED_JS % (1000 + idx))
                page = ctx.new_page()
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.goto(BASE + "/index.html", wait_until="networkidle")
                generate(page, grade, domain, topic, level, count)
                page.screenshot(path=str(OUT / f"{name}-{label}.png"), full_page=True)
                if label == "desktop":
                    page.emulate_media(media="print")
                    pdf = OUT / f"{name}-print.pdf"
                    page.pdf(path=str(pdf), format="A4", print_background=True, prefer_css_page_size=True)
                    entry["print_pdf"] = render_pdf(pdf, f"{name}-print")
                    page.emulate_media(media="screen")
                    page.evaluate("toggleAnswerKey()")
                    page.emulate_media(media="print")
                    pdf2 = OUT / f"{name}-print-with-key.pdf"
                    page.pdf(path=str(pdf2), format="A4", print_background=True, prefer_css_page_size=True)
                    entry["print_pdf_with_key"] = render_pdf(pdf2, f"{name}-print-key")
                    entry["cards"] = page.evaluate("document.querySelectorAll('#exset .ex-card').length")
                    entry["answer_marker_in_student_dom"] = page.evaluate("document.querySelectorAll('#exset .ex-card .mcq-correct').length")
                entry[label + "_errors"] = errors
                ctx.close()
            report[name] = entry
        browser.close()
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


main()
