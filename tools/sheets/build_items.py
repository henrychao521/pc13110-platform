#!/usr/bin/env python3
"""產生 assets/sheet-items.json（給試算表「匯入最新題庫」用；規格：classroom-sheets/SPEC.md 第 2 節）。

pc13110 是純前端平台，題目寫在各頁的 JS 裡，所以這支程式用無頭瀏覽器把每一頁打開，
讓頁面自己把題目登記到 SheetTrack.defs（和學生作答時是同一段程式），再收集起來：
  - 章節頁：凡是載入 js/sheet-track.js 的頁面（工坊除外）；要先解鎖才出現的測驗會直接呼叫建立函式
  - 工坊：只載入 workshop-content.js，用 SheetTrack.workshopDefs() 登記六台機台
每題的指紋 h 用 Python 依 EMT build.py 的 q_hash 同法重算一次，和瀏覽器算的不一致就中止。

用法：python3 tools/sheets/build_items.py            （寫入 assets/sheet-items.json）
      python3 tools/sheets/build_items.py --check    （只檢查，不寫檔）
"""
import datetime
import functools
import hashlib
import http.server
import json
import pathlib
import re
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "sheet-items.json"
PLATFORM = "pc13110"


def q_hash(q):
    """同 EMT tools/build.py 的 q_hash：題幹、選項、答案、排序項目有任何改動，指紋就會變。"""
    core = {k: q.get(k) for k in ("type", "stem", "options", "answer", "items")}
    return hashlib.sha1(json.dumps(core, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:8]


def pages():
    out = []
    for p in sorted(ROOT.glob("ch*/pages/*.html")):
        if "sheet-track.js" in p.read_text(encoding="utf-8"):
            out.append(p.relative_to(ROOT).as_posix())
    return out


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


HARVEST = """<!doctype html><meta charset="utf-8"><body>
<script src="js/sheet-log.js"></script><script src="js/sheet-track.js"></script>
<script src="js/workshop-content.js"></script>
<script>WK_MACHINES.forEach(m => SheetTrack.workshopDefs(m));</script></body>"""

COLLECT = """async () => {
  const d = Object.values(SheetTrack.defs);
  await Promise.all(d.map(x => x.ready));
  return d.map(x => ({q: x.q, h: x.h, t: x.t, page: x.page, stem: x.stem, options: x.options, answer: x.answer, items: x.items}));
}"""

UNLOCK = """() => {
  try { if (typeof buildQuiz === 'function' && !quizBuilt) buildQuiz(); } catch (e) {}
  try { if (typeof buildMatch === 'function' && !matchBuilt) buildMatch(); } catch (e) {}
}"""


def main():
    check = "--check" in sys.argv
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{srv.server_address[1]}/"
    got, errors, per_page = {}, [], {}
    with sync_playwright() as pw:
        try:
            br = pw.chromium.launch(channel="chrome")   # 本機用系統 Chrome（沒另裝 Playwright 瀏覽器）
        except Exception:
            br = pw.chromium.launch()
        ctx = br.new_context()
        # 收題庫時絕不對外送資料：擋掉 script.google.com
        ctx.route(re.compile(r"https://script\.google(usercontent)?\.com/.*"), lambda r: r.abort())
        pg = ctx.new_page()
        for rel in pages():
            pg.goto(base + rel, wait_until="load")
            pg.wait_for_timeout(600)
            pg.evaluate(UNLOCK)
            pg.wait_for_timeout(200)
            rows = pg.evaluate(COLLECT)
            per_page[rel] = len(rows)
            for r in rows:
                got[r["q"]] = r
        pg.route(base + "__harvest__.html", lambda r: r.fulfill(body=HARVEST, content_type="text/html; charset=utf-8"))
        pg.goto(base + "__harvest__.html")
        rows = pg.evaluate(COLLECT)
        per_page["workshop.html"] = len(rows)
        for r in rows:
            got[r["q"]] = r
        br.close()
    srv.shutdown()

    qs = []
    for q in sorted(got.values(), key=lambda r: r["q"]):
        h = q_hash({"type": q["t"], "stem": q["stem"], "options": q["options"], "answer": q["answer"], "items": q["items"]})
        if h != q["h"]:
            errors.append(f"{q['q']}: 瀏覽器指紋 {q['h']} ≠ Python {h}")
        if not re.fullmatch(r"[A-Za-z0-9_.:-]{1,40}", q["q"]):
            errors.append(f"{q['q']}: 題目代號格式不符")
        if not q["answer"]:
            errors.append(f"{q['q']}: 沒有正解")
        if q["options"] and q["t"] != "other" and len(q["options"]) > 6:
            errors.append(f"{q['q']}: 選項超過 6 個")
        qs.append({"q": q["q"], "h": h, "t": q["t"], "page": q["page"], "stem": q["stem"],
                   "options": q["options"], "answer": q["answer"], "items": q["items"]})

    for rel, n in per_page.items():
        print(f"{n:3d}  {rel}")
    print(f"共 {len(qs)} 題，{len(set(q['page'] for q in qs))} 份作答（頁面／機台）")
    if errors:
        print("錯誤：\n  " + "\n  ".join(errors))
        sys.exit(1)
    if check:
        return
    data = {"platform": PLATFORM, "version": datetime.date.today().isoformat(), "questions": qs}
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"已寫入 {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
