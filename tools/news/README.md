# 交誼廳外文科技新聞管線

交誼廳（`lounge.html`）的「科技新聞記者」不再即時抓 Hacker News，改讀 `data/news.json`：
從 `data/news-sources.json` 列的有公信力網站（NASA、ESA、IEEE Spectrum、MIT News、Science News、
JAXA、日本國立天文台、Fraunhofer、CNRS）抓 RSS／Atom，每站取最新 3 則，用**本機模型**翻成繁體中文。
`data/news.json` 不存在或讀取失敗時，頁面退回內建的中文科技新知。

## 檔案

| 檔案 | 用途 |
|---|---|
| `update_news.py` | 抓 feed → 翻譯 → 寫 `data/news.json`（只用標準庫） |
| `run_daily.py` | 排程入口：git pull → `update_news.py` → 有變動就 commit＋push；失敗時用 `report-notify` 送 Telegram |
| `com.henry.pc13110-news.plist` | launchd 範本，每天 06:30 |

## 翻譯安全規則

- **不用 Antigravity／agy、不用雲端模型**：新聞標題是不可信外部內容，agy 有寫檔權限。
- 走本機 Ollama `/api/chat`，`think: false`、`temperature: 0`；提示只要求「翻成繁體中文（台灣用語），只輸出譯文一行」。
- 輸出檢查（任一不過就丟棄、頁面改顯示原文並標「未翻譯」）：
  只能一行；不能有網址或指令字樣；只允許中文、數字、常用標點與拉丁字母；
  譯文裡的每個外文字詞都必須出現在原文（擋住模型自行加料）；不能殘留日文假名或常見簡體字；長度要合理。
  失敗會重試一次。台灣用語小表（軟件→軟體、播客→Podcast、宇宙飛行員→太空人…）在檢查前套用。
- 連結只收 `news-sources.json` 裡該站 `link_domains` 的網域（例如 IEEE Spectrum 的贊助研討會連結會被排除），一律 https。
- 翻譯成功少於 8 則就不覆寫 `news.json`（保留前一天的版本）並回傳錯誤。

## 人工校正

模型譯錯的標題寫進 `data/news-overrides.json`（`{"原文標題": "人工譯文"}`）。之後每天重跑，只要原文標題相同就直接採用人工譯文、不再交給模型重翻。

## 手動執行

```bash
python3 tools/news/update_news.py --dry-run              # 只抓不翻
python3 tools/news/update_news.py                        # 本機 Ollama，模型自動挑
python3 tools/news/update_news.py --model qwen3.5:9b
# 在 MBP 借 Studio 的模型：
ssh -f -N -L 11435:127.0.0.1:11434 studio
python3 tools/news/update_news.py --ollama-url http://127.0.0.1:11435
```

模型自動挑選順序：`qwen3.6:35b-a3b`（Studio）→ `qwen3.5:9b`（MBP）。

## 安裝排程（尚未安裝，由主控決定裝在哪台）

建議裝在 **Mac Studio**：`qwen3.6:35b-a3b` 已在上面、品質較好、全天開機。

```bash
# 1. 在要跑的那台準備一份乾淨的 clone（放 APFS 家目錄，不要放外接碟），停在 master
git clone https://github.com/henrychao521/pc13110-platform.git ~/pc13110-news-bot
cd ~/pc13110-news-bot && git checkout master

# 2. 先手動跑一次，確認能推（測試可加 NEWS_NO_PUSH=1）
NEWS_NO_PUSH=1 python3 tools/news/run_daily.py

# 3. 填入路徑並安裝
REPO=$HOME/pc13110-news-bot
sed "s|__REPO_DIR__|$REPO|g" tools/news/com.henry.pc13110-news.plist > ~/Library/LaunchAgents/com.henry.pc13110-news.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.henry.pc13110-news.plist
launchctl kickstart gui/$(id -u)/com.henry.pc13110-news   # 立刻試跑一次
tail -f ~/Library/Logs/pc13110-news.log
```

移除：`launchctl bootout gui/$(id -u)/com.henry.pc13110-news && rm ~/Library/LaunchAgents/com.henry.pc13110-news.plist`

注意：
- `run_daily.py` 只在分支是 `NEWS_BRANCH`（預設 master）且工作目錄乾淨時才動作，避免推錯分支或夾帶別的變更。
- 失敗（抓不到、模型服務沒開、翻譯成功太少、git 失敗）會執行
  `~/.local/bin/report-notify --tag 交誼廳新聞 --title 交誼廳新聞更新失敗 --text …`；成功不通知（news.json 不是報告）。
- 用 python 當 launchd 入口，因為 launchd 底下的 bash 讀不到外接碟。
- 裝在 MBP 的話模型會用 `qwen3.5:9b`，而且 MBP 若不在家或睡眠就不會跑。
