#!/usr/bin/env python3
"""每日排程入口：更新 data/news.json → 有變動就 commit＋push；任何失敗用 report-notify 送 Telegram。

用 python 而不是 bash 當 launchd 入口：launchd 底下的 bash 讀不到外接碟（TCC），python3 可以。
news.json 本身不是報告，成功時不通知；只有失敗才通知。

環境變數（寫在 plist 的 EnvironmentVariables）：
  NEWS_REPO_DIR    repo 所在（預設為本檔往上兩層）
  NEWS_BRANCH      要推的分支（預設 master，GitHub Pages 的來源分支）
  NEWS_OLLAMA_URL  本機 Ollama（預設 http://127.0.0.1:11434）
  NEWS_MODEL       模型（空白＝自動挑 qwen3.6:35b-a3b → qwen3.5:9b）
  NEWS_NO_PUSH=1   只 commit 不 push（測試用）
"""
import os
import subprocess
import sys
import datetime as dt

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.environ.get("NEWS_REPO_DIR") or os.path.dirname(os.path.dirname(HERE))
BRANCH = os.environ.get("NEWS_BRANCH", "master")
NOTIFY = os.path.expanduser("~/.local/bin/report-notify")
LOG_TAIL = []


def log(msg):
    line = f"[{dt.datetime.now():%Y-%m-%d %H:%M:%S}] {msg}"
    print(line, flush=True)
    LOG_TAIL.append(msg)


def run(cmd, check=True, **kw):
    log("$ " + " ".join(cmd))
    p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, **kw)
    out = (p.stdout + p.stderr).strip()
    if out:
        print(out, flush=True)
    if check and p.returncode != 0:
        raise RuntimeError(f"{' '.join(cmd[:3])} 結束碼 {p.returncode}：{out[-400:]}")
    return p


def notify_fail(reason):
    text = f"交誼廳新聞更新失敗（{os.uname().nodename}）\n原因：{reason}\n\n最後紀錄：\n" + "\n".join(LOG_TAIL[-12:])
    if os.path.exists(NOTIFY):
        subprocess.run([NOTIFY, "--tag", "交誼廳新聞", "--title", "交誼廳新聞更新失敗", "--text", text[:3500]])
    else:
        print("找不到 report-notify，無法通知：" + NOTIFY, file=sys.stderr)


def main():
    try:
        run(["git", "fetch", "origin", BRANCH])
        cur = run(["git", "rev-parse", "--abbrev-ref", "HEAD"]).stdout.strip()
        if cur != BRANCH:
            raise RuntimeError(f"工作目錄在分支 {cur}，不是 {BRANCH}；為避免推錯分支，停止")
        dirty = run(["git", "status", "--porcelain", "--untracked-files=no"]).stdout.strip()
        if dirty:
            raise RuntimeError("工作目錄有未提交的變更，停止（排程只該動 data/news.json）：\n" + dirty[:300])
        run(["git", "pull", "--ff-only", "origin", BRANCH])

        p = run([sys.executable, os.path.join(HERE, "update_news.py")], check=False, timeout=3600)
        if p.returncode != 0:
            tail = (p.stdout + p.stderr).strip().splitlines()[-5:]
            raise RuntimeError(f"update_news.py 結束碼 {p.returncode}：" + " / ".join(tail))

        changed = run(["git", "status", "--porcelain", "--", "data/news.json"]).stdout.strip()
        if not changed:
            log("news.json 沒有變動，結束")
            return 0
        run(["git", "add", "data/news.json"])
        run(["git", "commit", "-m", f"交誼廳新聞：每日自動更新 {dt.date.today():%Y-%m-%d}"])
        if os.environ.get("NEWS_NO_PUSH") == "1":
            log("NEWS_NO_PUSH=1，不 push")
            return 0
        run(["git", "push", "origin", BRANCH])
        log("完成")
        return 0
    except Exception as e:  # noqa: BLE001
        log(f"失敗：{e}")
        notify_fail(str(e))
        return 1


if __name__ == "__main__":
    sys.exit(main())
