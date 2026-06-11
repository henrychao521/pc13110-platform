# App Store 化 — 工作交接文件

> 用途：把「GitHub 專案 → Apple App Store」的評估與「AR 課本」開發計畫完整交接，
> 讓開發者從 **Linux 雲端容器**切換到 **Mac Studio** 後可無縫接手。
> 建立日期：2026-06-11　│　分支：`claude/github-app-store-analysis-ntvut7`

---

## 0. 這份文件怎麼用（Mac Studio 接手者先看這段）

1. 在 Mac Studio 上：`git clone` 或 `git pull` 本 repo，切到本分支。
2. 讀第 1 節（決策結論）→ 第 4 節（Mac 環境安裝）→ 第 5 節（下一步）。
3. 開始開發前，確認你要走 **路線 A（原生 iOS App）** 還是 **路線 B（WebAR）**，
   兩者差異見第 3 節。建議先 B 後 A（資產可沿用，不浪費）。

---

## 1. 討論逐字重點（這次 session 的決策過程）

**Q1：我 GitHub 上的專案，有哪些可整合發展成 App Store 程式？**

→ 盤點帳號 `henrychao521` 共 **43 個 repo（42 自有 + 1 fork）**。結論：不要一個一個搬，
應整併成 **3 個主力 App**（詳見第 2 節）。並指出 Apple 兩條會直接退件的鐵則：
- **Guideline 4.2**：純 WebView 包網頁 = 必退，要有原生功能（相機/LiDAR/AR/藍牙/Pencil/推播）。
- **後端不能靠自家 Mac/Pi**：即時資料類後端要放雲端。

**Q2：如果做「AR 課本」，能在這台（Linux）電腦上完成嗎？要裝什麼？**

→ 關鍵限制：**原生 iOS App（ARKit/RealityKit）只能在 macOS + Xcode 上開發、簽章、上架**。
Linux 容器（Ubuntu 24.04 / x86_64，無 Swift/Xcode）**做不到原生 App**。
但 **WebAR 路線（model-viewer + USDZ Quick Look）可在 Linux 完成**，且與現有純網頁平台天作之合。

**Q3：（本次）幫我整理逐字稿與工作資料，我要換到 Mac Studio。**

→ 即本文件。

---

## 2. 完整整合分析：42 個自有專案 → 3 個主力 App

### 🥇 主力一：「AI 姿態分析」App（最該先做，最易過審 ★★★★★）

| 整合 Repo | 角色 |
|---|---|
| `grip-system` | 核心：握筆姿勢分析（**已為 iPhone LiDAR 設計**）|
| `sports-skeleton-analysis` | 運動姿勢偵測（YOLOv8-pose）|
| `handpose-legacy` / `grip-system-prototype` | 前代手部/握筆分析，併功能 |
| `off-axis-pi` | 臉部追蹤（TrueDepth）模組 |

- 技術：**ARKit（LiDAR 深度）+ Vision（人體/手部姿態，裝置端）+ CoreML（YOLO 轉檔）**。
- 全程式在裝置上跑 → 不上傳兒童影像 = 隱私審查好過；**不需後端**。
- 分類：Health & Fitness / Education。價值：兒童握筆矯正 + 運動姿勢分析。

### 🥈 主力二：「Living Taiwan 台灣生活即時通」（消費市場最大 ★★★★★）

| 整合 Repo | 角色 |
|---|---|
| `living-portal` | **已是整合入口**（台鐵+水文+台北看板）= 現成 PoC |
| `taiwan-rail-live` | 台鐵即時地圖、列車追蹤 |
| `taipei-dashboard` | 台北即時看板 |
| `hydro-monitor` | 北台灣水文監測 |
| `taiwan-engineering-geo` | 200 個工程地景（地圖點位學習/導覽）|
| `taiwan-railway-api-guide` | TDX API / CCTV 串接知識 |

- 殺手級原生功能：**Live Activities + WidgetKit 列車到站動態**、**MapKit**、定位。
- ⚠️ 唯一要補：TDX API 代理後端**搬上雲端**（不能靠自家 Pi），注意 API 速率限制。

### 🥉 主力三：「生活科技 AR 課本」（商業價值最高，本 repo 為主體 ★★★☆☆）

| 整合 Repo | 角色 |
|---|---|
| `pc13110-platform`（**本 repo**）| 主體：5 章互動教學 |
| `mosme-livingtech-platform` | MOSME 教學內容 |
| `livingtech-tools` | 數位線鋸機教學（國中）|
| `student-portfolio-v3` | 學習歷程 / 作品集 |
| `esp32-web-flasher` | ESP32 燒錄 → 改 **CoreBluetooth** |
| `arcade/`（本 repo 內）| 8 款小遊戲當趣味鉤子 |

- 商業價值最高：對應自編教科書 **PC13110**，「課本官方 App」→ 學校通路天然行銷。
- **不能只包網頁**，過審必須加原生料：
  - 第 2/3 章 CAD・機構・桁架 → **USDZ + QuickLook / RealityKit AR**
  - CAD 草圖 → **Apple Pencil**
  - 第 5 章 ESP32 → **CoreBluetooth** 藍牙燒錄/控制
  - 離線內容、學習進度同步
- iPad-first 最合適。

### 其餘專案分類

- **利基可做 ★★★☆☆**：`xiao-esp32s3-led-matrix` + `esp32-xiao-ai` + `esp32-web-flasher`
  → 一支「ESP32 藍牙控制器」App（iOS 無 Web Serial，走 BLE）；
  `x5-roomtour` / `shadowless-lamp-sim` → 3D/光學檢視器可移植（Gaussian Splatting 在 iPhone GPU 可跑）。
- **不建議上架（後端/IoT/工具）**：`pi-monitor`, `pi-projects`, `pi-camera-hub`, `camera-hub-mac`,
  `camera-system-archive`, `spycam-webui`, `mac-llm-bot`, `moltbot`, `local-llm-benchmark`,
  `openclaw-multi-agent-kit`, `cgu-report-system`, `law-sim`, `Stock`, `stock-class`, `Classroom`,
  `claude-session-logs`, `ai-collaboration-research`, `esp32-arduino-sketches`,
  `henrychao521.github.io`, `henrychao521`, `student-portfolio`, `xmas`, `gpt-ai-assistant`(fork)。

### 建議推進順序
1. **AI 姿態分析**（驗證過、無後端、易過審 → 最快上架）
2. **Living Taiwan**（市場最大，先把 TDX 後端搬雲）
3. **生活科技 AR 課本**（價值最高、工程量最大）

---

## 3. 兩條開發路線（AR 課本）

| | 路線 A：原生 iOS App | 路線 B：WebAR |
|---|---|---|
| 技術 | Swift + ARKit + RealityKit | `<model-viewer>` + USDZ AR Quick Look |
| 平台需求 | **必須 macOS + Xcode + 實機** | 任何 OS 皆可開發（含 Linux）|
| 使用者 | 需到 App Store 下載安裝 | iPhone Safari 開網頁即用，**免裝 App** |
| 上 App Store | ✅ 是終點 | ❌ 是網站；純殼包會撞 4.2 |
| 資產 | glTF/USDZ 模型 | 同樣 glTF/USDZ ← **兩路線資產共用** |
| 適合 | 最終產品 | 原型 / 教學發佈 / 先驗證內容 |

**策略：先 B 後 A。** 在任何機器先把 3D 模型與互動內容做出來（glTF→USDZ），
WebAR 先上線驗證；之後在 Mac 把同一批資產搬進原生 App。資產零浪費。

---

## 4. Mac Studio 環境安裝清單

### 路線 A（原生 iOS App）必裝
- [ ] **Xcode**（App Store 下載，數 GB）→ 含 Swift、ARKit、RealityKit、模擬器、簽章工具
- [ ] **Apple Developer Program**（US$99/年）→ 上架與實機測試
- [ ] **實機**：支援 LiDAR 的 iPhone Pro / iPad Pro（AR 深度功能需要）
- [ ] 選配：**Reality Composer Pro**（隨 Xcode）、**Reality Converter**（Apple 官方 glTF→USDZ GUI）
- [ ] 命令列：`xcode-select --install`（Command Line Tools）

### 路線 B（WebAR）必裝
- [ ] Node.js（`brew install node`）— 本 repo 開發用，Mac 上已有可略
- [ ] **glTF → USDZ 轉檔**（iOS AR Quick Look 只吃 USDZ）：
  - Mac 首選：**Reality Converter**（GUI，Apple 官方）
  - 或命令列：`pip install usd-core`（Pixar 官方，跨平台，含 `usdzip`）
- [ ] 選配建模：`brew install --cask blender`（匯出 glTF）
- [ ] 本機測試伺服器：`python3 -m http.server 8080`（repo 既有作法）

### Homebrew（若 Mac 尚未裝）
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

> 註：本次容器為 Linux，**無法**安裝/驗證上述 macOS 專屬工具；以上為 Mac Studio 上的待辦。

---

## 5. 下一步（Mac Studio 接手後）

**建議先做 WebAR 原型（路線 B），鎖定第 3 章「機構/桁架」：**

1. 準備 1 個 3D 模型（齒輪組或桁架），匯出 `model.glb` → 轉成 `model.usdz`。
2. 在本 repo `ch3-mechanism/pages/` 新增一頁，嵌入：
   ```html
   <script type="module"
     src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"></script>
   <model-viewer src="model.glb" ios-src="model.usdz"
     ar ar-modes="quick-look webxr" camera-controls auto-rotate>
   </model-viewer>
   ```
3. `python3 -m http.server 8080`，用 iPhone Safari 開測試頁 → 點 AR → 模型擺到桌上。
4. 串進 `ch3-mechanism/index.html` 導覽，commit、push。

**之後轉原生（路線 A）：** 沿用同批 USDZ，用 RealityKit/QuickLook 嵌入 iPad App，
再依第 2 節「主力三」補 Apple Pencil 與 ESP32 CoreBluetooth 等原生功能以過 4.2。

---

## 6. 現況快照

- 本 repo：純前端（HTML5 + CSS3 + Vanilla JS），`localStorage` 存進度，零建置工具。
- 已完成：Hub 首頁、第 1 章完整、第 3–5 章導入多個開源模擬工具、arcade 8 款小遊戲。
- 已整合開源庫：jsMind、Frappe Gantt、three.js、Leaflet、qrcode（見 `vendor/`）。
- 本次 session（Linux 容器）**未改動任何功能程式碼**，僅新增此交接文件。
