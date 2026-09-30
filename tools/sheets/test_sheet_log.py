#!/usr/bin/env python3
"""作答紀錄端到端測試（只用本機假 endpoint，絕不送正式 Google 網址）。

  python3 tools/sheets/test_sheet_log.py

- 網站用本機 http.server 開；假 endpoint 是另一個本機埠，把收到的 POST 內容記下來
- 用 Playwright 攔截 js/sheet-config.js，把 endpoint 換成假 endpoint（正式檔案裡永遠是空字串）
- 所有對 script.google.com／googleusercontent.com 的請求一律中止並算失敗
"""
import functools
import http.server
import json
import pathlib
import re
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
ITEMS = {q["q"]: q for q in json.loads((ROOT / "assets" / "sheet-items.json").read_text(encoding="utf-8"))["questions"]}
RECEIVED = []
FAILS = []
GOOGLE_HITS = []


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


class FakeGAS(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n).decode("utf-8")
        RECEIVED.append({"ctype": self.headers.get("Content-Type", ""), "body": json.loads(body)})
        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')


def serve(handler):
    s = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, f"http://127.0.0.1:{s.server_address[1]}"


def check(cond, msg):
    print(("  ✓ " if cond else "  ✗ ") + msg)
    if not cond:
        FAILS.append(msg)


SOLVE_ORDER = """async (root) => {
  const host = document.querySelector(root);
  for (let guard = 0; guard < 200; guard++) {
    const lis = [...host.querySelectorAll('.sp-item')];
    const pos = lis.findIndex((li, i) => +li.dataset.orig !== i);
    if (pos < 0) break;
    const j = lis.findIndex(li => +li.dataset.orig === pos);
    lis[j].querySelector('.sp-up').click();
  }
  host.querySelector('.sp-check').click();
}"""


def answer_dq(page, box_sel, qkey, wrong_first=False):
    """在 DiagnosisQuiz 作答：wrong_first 時先選錯、按「再試一次」，再選正解。回傳第一次所選代號。"""
    k = ITEMS[qkey]["answer"]
    ki = "ABCDEF".index(k)
    first = k
    if wrong_first:
        wi = 0 if ki != 0 else 1
        first = "ABCDEF"[wi]
        page.locator(box_sel).locator(".dq-options button").nth(wi).click()
        page.locator(box_sel).locator(".dq-retry").click()
    page.locator(box_sel).locator(".dq-options button").nth(ki).click()
    return first


def fill_identity(page, cls, seat):
    page.click("#sl-btn")
    page.fill("#sl-class", cls)
    page.fill("#sl-seat", seat)
    page.click("#sl-save")


def wait_records(page, n, timeout=6000):
    for _ in range(timeout // 200):
        if len(RECEIVED) >= n:
            return True
        page.wait_for_timeout(200)
    return len(RECEIVED) >= n


def main():
    site, base = serve(functools.partial(Quiet, directory=str(ROOT)))
    fake, fake_url = serve(FakeGAS)
    endpoint = fake_url + "/exec"
    cfg_js = f"window.SHEET_CONFIG = {{ platform: 'pc13110', endpoint: '{endpoint}', token: 'test-token' }};"

    with sync_playwright() as pw:
        try:
            br = pw.chromium.launch(channel="chrome")
        except Exception:
            br = pw.chromium.launch()

        def new_ctx(with_endpoint=True, **kw):
            ctx = br.new_context(**kw)
            def google(r):
                GOOGLE_HITS.append(r.request.url)
                r.abort()
            ctx.route(re.compile(r"https://script\.google(usercontent)?\.com/.*"), google)
            if with_endpoint:
                ctx.route(re.compile(r".*/js/sheet-config\.js(\?.*)?$"),
                          lambda r: r.fulfill(body=cfg_js, content_type="application/javascript"))
            return ctx

        # ---------- 1. 第 1 章科技趨勢（6 題）：填班級座號（全形）、第 1 題先答錯再試一次 ----------
        print("1. ch1 trends：DiagnosisQuiz 6 題＋班級座號＋再試一次")
        ctx = new_ctx()
        pg = ctx.new_page()
        pg.goto(base + "/ch1-engineering/pages/trends.html")
        check(pg.locator("#sl-wrap").count() == 1, "有設定 endpoint 時顯示班級座號元件")
        check("各題對錯與所選答案會送給老師" in pg.locator("footer").last.inner_text(), "頁尾有告知文字")
        fill_identity(pg, "３０１", "１２")
        check("301 班 12 號" in pg.locator("#sl-btn").inner_text(), "全形轉半形、按鈕顯示目前填的值")
        pg.click("#sl-btn")
        check("各題對錯與所選答案會送給老師" in pg.locator("#sl-panel").inner_text(), "告知文字依 SPEC")
        pg.click("#sl-wrap .sl-close")
        boxes = "#quizArea > div"
        firsts = []
        for i in range(6):
            firsts.append(answer_dq(pg, f"{boxes} >> nth={i}", f"ch1.trends:q{i+1}", wrong_first=(i == 0)))
        check(wait_records(pg, 1), "全部答對後送出 1 筆")
        r = RECEIVED[-1]["body"]
        check(RECEIVED[-1]["ctype"].startswith("text/plain"), "Content-Type 是 text/plain")
        check(r["v"] == 1 and r["platform"] == "pc13110" and r["token"] == "test-token", "v／platform／token")
        check(re.fullmatch(r"[0-9a-f]{32}", r["sid"]) is not None, "sid 32 碼 16 進位")
        check(r["page"] == "ch1.trends" and r["kind"] == "quiz", "page／kind")
        check(r["class"] == "301" and r["seat"] == "12", "班級座號帶入（學生自己填的）")
        it = {x["q"]: x for x in r["items"]}
        check(len(it) == 6, "6 題")
        q1 = it.get("ch1.trends:q1", {})
        check(q1.get("ok") == 0 and q1.get("tries") == 2 and q1.get("a") == firsts[0] and q1.get("k") == ITEMS["ch1.trends:q1"]["answer"],
              f"第 1 題記第一次作答：ok=0 a={q1.get('a')} k={q1.get('k')} tries={q1.get('tries')}")
        check(all(x["ok"] == 1 and x["tries"] == 1 and x["a"] == x["k"] for q, x in it.items() if q != "ch1.trends:q1"), "其他 5 題 ok=1 tries=1")
        check(all(x["h"] == ITEMS[q]["h"] for q, x in it.items()), "指紋和 sheet-items.json 一致")
        check(r["meta"]["score"] == 5 and r["meta"]["max"] == 6 and r["meta"]["sec"] >= 0, f"meta {r['meta']}")
        n_before = len(RECEIVED)
        pg.wait_for_timeout(500)
        q = pg.evaluate("() => { try { return localStorage.getItem('sheetlog-queue-pc13110'); } catch (e) { return 'ERR'; } }")
        check(q is None, "送達後佇列清空")

        # ---------- 2. 第 5 章 ESP32：測驗 4 題＋排序題（先排錯檢查一次） ----------
        print("2. ch5 esp32：DiagnosisQuiz＋排序題（tries、原始順序）")
        pg.goto(base + "/ch5-mechatronics/pages/esp32.html")
        pg.locator("#seqArea .sp-check").click()   # 洗牌保證不是正解 → 第一次錯
        first_order = pg.evaluate("() => [...document.querySelectorAll('#seqArea .sp-item')].map(li => +li.dataset.orig + 1).join('>')")
        pg.evaluate(SOLVE_ORDER, "#seqArea")
        for i in range(4):
            answer_dq(pg, f"#quizArea > div >> nth={i}", f"ch5.esp32:q{i+1}")
        check(wait_records(pg, n_before + 1), "測驗＋排序全部完成後送出 1 筆")
        r = RECEIVED[-1]["body"]
        it = {x["q"]: x for x in r["items"]}
        o = it.get("ch5.esp32:order", {})
        check(r["page"] == "ch5.esp32" and len(it) == 5, f"page ch5.esp32、5 題（實得 {len(it)}）")
        check(o.get("t") == "order" and o.get("ok") == 0 and o.get("tries") == 2 and o.get("a") == first_order and o.get("k") == "1>2>3>4>5",
              f"排序題 a={o.get('a')}（第一次排的原始編號）k={o.get('k')} tries={o.get('tries')}")
        check(r["class"] == "301" and r["seat"] == "12", "同分頁內班級座號沿用（sessionStorage）")

        # ---------- 3. 第 2 章三視圖挑戰（6 題，選項隨機） ----------
        print("3. ch2 orthographic：隨機選項題（模型代號／三視圖 A–D）")
        n_before = len(RECEIVED)
        pg.goto(base + "/ch2-fabrication/pages/orthographic.html")
        pg.wait_for_timeout(800)
        picks = []
        for i in range(6):
            pg.wait_for_selector("#chOptsHost .opt, #chOptsHost .trip-opt")
            opts = pg.locator("#chOptsHost .opt, #chOptsHost .trip-opt")
            pick = i % 2   # 故意有對有錯
            opts.nth(pick).click()
            pg.locator("#chFeedback button").click()
        check(wait_records(pg, n_before + 1), "6 題答完送出 1 筆")
        r = RECEIVED[-1]["body"]
        it = {x["q"]: x for x in r["items"]}
        check(r["page"] == "ch2.orthographic" and len(it) == 6, "6 題")
        ok_consistent = all((x["a"] == x["k"]) == (x["ok"] == 1) and x["tries"] == 1 for x in it.values())
        check(ok_consistent, "每題 ok 與 a==k 一致、tries=1")
        check(all(re.fullmatch(r"M[1-8]", x["a"]) for q, x in it.items() if ITEMS[q]["t"] == "other"), "視圖題 a 為模型代號 M1–M8")
        check(all(re.fullmatch(r"[A-D]", x["a"]) and x["k"] == "A" for q, x in it.items() if ITEMS[q]["t"] == "single"), "三視圖組合題 a 為 A–D、k=A")
        check(r["meta"]["score"] == sum(x["ok"] for x in it.values()), "meta.score＝答對數")
        ctx.close()

        # ---------- 4. 沒填班級座號＋離開頁面時送出做到一半的作答 ----------
        print("4. ch3 truss：匿名、只答 1 題就離開（pagehide 進佇列，下頁補送）")
        n_before = len(RECEIVED)
        ctx = new_ctx()
        pg = ctx.new_page()
        pg.goto(base + "/ch3-mechanism/pages/truss.html")
        answer_dq(pg, "#quizArea > div >> nth=0", "ch3.truss:q1")
        pg.goto(base + "/ch3-mechanism/pages/statics.html")
        check(wait_records(pg, n_before + 1), "離開頁面後送出 1 筆")
        r = RECEIVED[-1]["body"]
        check(r["page"] == "ch3.truss" and len(r["items"]) == 1 and r["items"][0]["q"] == "ch3.truss:q1", "只含已作答的 1 題")
        check(r["class"] == "" and r["seat"] == "", "沒填班級座號就是空的（匿名）")

        # ---------- 5. 佇列：endpoint 連不上時留在 localStorage，恢復後補送 ----------
        print("5. ch3 statics：離線佇列補送")
        n_before = len(RECEIVED)
        blocked = re.compile(re.escape(fake_url) + r"/.*")
        pg.route(blocked, lambda r: r.abort())
        for i in range(3):
            answer_dq(pg, f"#quizArea > div >> nth={i}", f"ch3.statics:q{i+1}")
        pg.wait_for_timeout(800)
        qlen = pg.evaluate("() => JSON.parse(localStorage.getItem('sheetlog-queue-pc13110') || '[]').length")
        check(qlen == 1 and len(RECEIVED) == n_before, f"送不出去時留在佇列（{qlen} 筆）")
        pg.unroute(blocked)
        pg.reload()
        check(wait_records(pg, n_before + 1), "重開頁面後補送")
        r = RECEIVED[-1]["body"]
        check(r["page"] == "ch3.statics" and len(r["items"]) == 3, "補送內容正確")
        pg.wait_for_timeout(500)
        check(pg.evaluate("() => localStorage.getItem('sheetlog-queue-pc13110')") is None, "補送後佇列清空")
        ctx.close()

        # ---------- 6. 工坊：雷射切割機認證（步驟排序＋3 題，第 1 題先答錯） ----------
        print("6. 工坊雷射切割機：步驟排序＋認證測驗（選項洗牌→原始代號）")
        n_before = len(RECEIVED)
        ctx = new_ctx()
        pg = ctx.new_page()
        pg.goto(base + "/workshop.html")
        pg.wait_for_function("() => window.__wk", timeout=180000)   # PlayCanvas 與場景從 CDN 載入，偶爾很慢
        opened = False
        for _ in range(60):
            pg.evaluate("() => window.__wk.toMachine(0)")
            pg.wait_for_timeout(500)
            if pg.locator("#mprompt").is_visible():
                pg.evaluate("() => document.getElementById('mprompt').click()")
                pg.wait_for_timeout(300)
                if pg.locator("#lsBody").is_visible():
                    opened = True
                    break
        check(opened, "走到機台旁開啟課程")
        if opened:
            fill_identity(pg, "302", "7")
            for _ in range(3):
                pg.click("#lsNext")
            pg.evaluate(SOLVE_ORDER, "#lessonMount")
            pg.click("#lsNext")
            quiz = [ITEMS[f"workshop.laser:q{i}"] for i in (1, 2, 3)]
            k0 = "ABCDEF".index(quiz[0]["answer"])
            wrong = 0 if k0 != 0 else 1
            pg.click(f".qz-opt[data-q='0'][data-o='{wrong}']")
            for qi in (1, 2):
                pg.click(f".qz-opt[data-q='{qi}'][data-o='{'ABCDEF'.index(quiz[qi]['answer'])}']")
            pg.click("#qzCheck")
            pg.click(f".qz-opt[data-q='0'][data-o='{k0}']")
            pg.click("#qzCheck")
            check(wait_records(pg, n_before + 1), "全對取得資格時送出 1 筆")
            r = RECEIVED[-1]["body"]
            it = {x["q"]: x for x in r["items"]}
            check(r["page"] == "workshop.laser" and len(it) == 4, f"page workshop.laser、4 題（實得 {len(it)}）")
            check(it.get("workshop.laser:steps", {}).get("ok") == 1 and it["workshop.laser:steps"]["a"] == "1>2>3>4", "步驟排序（直接排對）ok=1 a=1>2>3>4")
            x = it.get("workshop.laser:q1", {})
            check(x.get("ok") == 0 and x.get("a") == "ABCDEF"[wrong] and x.get("k") == quiz[0]["answer"] and x.get("tries") == 2,
                  f"第 1 題 a={x.get('a')}（原始代號）k={x.get('k')} tries={x.get('tries')}")
            check(all(it[f"workshop.laser:q{i}"]["ok"] == 1 and it[f"workshop.laser:q{i}"]["tries"] == 1 for i in (2, 3)), "第 2、3 題 ok=1 tries=1")
            check(r["class"] == "302" and r["seat"] == "7", "班級座號")
            check(all(x["h"] == ITEMS[q]["h"] for q, x in it.items()), "指紋一致")
        ctx.close()

        # ---------- 7. endpoint 空字串：不顯示、不送 ----------
        print("7. endpoint 空字串：完全不送、不顯示")
        n_before = len(RECEIVED)
        posts = []
        ctx = new_ctx(with_endpoint=False)
        pg = ctx.new_page()
        pg.on("request", lambda req: posts.append(req.url) if req.method == "POST" else None)
        pg.goto(base + "/ch5-mechatronics/pages/boards.html")
        check(pg.locator("#sl-wrap").count() == 0, "沒有班級座號元件")
        check("送給老師" not in pg.inner_text("body"), "沒有告知文字")
        for i in range(3):
            answer_dq(pg, f"#quizArea > div >> nth={i}", f"ch5.boards:q{i+1}", wrong_first=(i == 1))
        pg.goto(base + "/ch5-mechatronics/pages/peripherals.html")
        pg.wait_for_timeout(1000)
        check(not posts and len(RECEIVED) == n_before, "沒有任何 POST")
        check(pg.evaluate("() => localStorage.getItem('sheetlog-queue-pc13110')") is None, "佇列沒有東西")
        ctx.close()
        br.close()

    check(not GOOGLE_HITS, "沒有任何對 Google 網址的請求")
    site.shutdown()
    fake.shutdown()
    print(f"\n假 endpoint 共收到 {len(RECEIVED)} 筆；{'全部通過' if not FAILS else f'{len(FAILS)} 項失敗'}")
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
