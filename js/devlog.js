/* ============================================================
 * 開發紀錄 — 各開發段落資料
 * 維護規則:每完成一個開發段落,在 PHASES 陣列最後新增一筆。
 * ============================================================ */

const PHASES = [
  {
    tag: '段落 0',
    date: '2026-05-15',
    title: '專案啟動與整體規劃',
    verbatim: '幫我研究 /Volumes/128G/scrollsaw-platform 這個平台系統的架構內容,我希望建立一個新的教學平台,是以附檔中的教科書內容（我寫的,可以上國教署網站上查,趙珩宇編)製作的教學平台。幫我進行完整且詳細的規劃,內容要新穎、整合多樣的開源程式、系統、github 專案,讓學生可以非常詳細的學到所有的操作知識以及學理知識。',
    context: '研讀教科書《PC13110 生活科技》（趙珩宇編)全 206 頁五章內容,並分析既有的 scrollsaw-platform 架構。提出完整規劃書:五章對應的模組設計、純前端零相依的技術架構、各章可整合的開源專案清單（three.js、matter.js、CircuitJS、Wokwi、JSCAD、jsMind、Frappe Gantt 等),以及分四波的開發 roadmap。',
    decisions: ['獨立建立新 repo', 'CircuitJS／Wokwi 採 iframe 嵌官方服務', '第一波先做 Hub 地基 + 第 1 章'],
    outputs: [
      '完成五章教科書內容研讀與既有平台架構分析',
      '產出完整規劃書與四波開發 roadmap',
    ],
  },
  {
    tag: '段落 1',
    date: '2026-05-16',
    title: '建置 Hub 首頁與第 1 章',
    verbatim: '好的,開始執行。但不要將目前的格式視為其他章節的固定模式,每個章節都要依據內容重新評估設計。',
    context: '建立平台共用核心（進度系統、音效引擎、互動引擎)與全站樣式。完成 Hub 首頁,含「工程設計流程七階段互動環」。第 1 章依內容自訂 5 個模組,而非套用固定格式——涵蓋科技趨勢、工程設計流程、創意思考、專題規劃、競賽倫理。',
    decisions: ['各章模組依內容重新設計,不套固定模板', '整合 jsMind 心智圖、Frappe Gantt 甘特圖'],
    outputs: [
      'Hub 首頁 + 共用核心 + 全站樣式',
      '第 1 章 5 模組:科技趨勢儀表板、工程設計流程互動、創意思考工具箱、專題規劃器、競賽與職涯倫理',
      'commit 68c4324',
    ],
  },
  {
    tag: '段落 2',
    date: '2026-05-16',
    title: '上線部署 GitHub Pages',
    verbatim: '參考 https://henrychao521.github.io/livingtech-tools/ ,將這個網站路徑同樣建立在 https://henrychao521.github.io/ 下方,讓他上線我再來確認內容。',
    context: '將 repo 由私有轉為公開(GitHub Pages 免費版需公開 repo),啟用 GitHub Pages 並以 master 分支根目錄為來源。實測線上各頁面與資源載入正常。',
    decisions: ['repo 轉為公開', 'GitHub Pages 部署於 master 分支根目錄'],
    outputs: [
      '平台上線:https://henrychao521.github.io/pc13110-platform/',
      '全站資源線上實測通過',
    ],
  },
  {
    tag: '段落 3',
    date: '2026-05-16',
    title: '第 1 章內容深化',
    verbatim: '內容很好,但內容除了引用課本中的內容,也希望能另外補充外部資源,以及多方驗證後的資料。請將內容呈現得更加深入,也不一定要限制五個類別,以內容完善、易理解內容為出發點進行設計。',
    context: '新增「多方查證」「延伸資源」「深入探究」「時間軸」四種內容元件。為第 1 章五模組補上學理深探、外部權威資源連結與多方交叉驗證的資料。查證過程中發現教科書 1-1-2 節 IBM 量子處理器年份與公開紀錄不符,平台採正確年份並回報作者。',
    decisions: ['新增多方查證／延伸資源／深入探究／時間軸元件', '量子處理器年份採公開可查證資料'],
    outputs: [
      '5 模組全面深化,新增 16+ 外部權威資源連結與多方查證區塊',
      '回報教科書一處年份勘誤供修訂參考',
    ],
  },
  {
    tag: '段落 4',
    date: '2026-05-16',
    title: '建置第 2 章 數位加工',
    verbatim: '好的,數位加工的操作設計,請同時檢視近幾年台灣常用或是華語圈常用的主流數位加工設備,並查找相關操作手冊,將資訊下載下來後,同步附註給使用者。其他模擬的操作系統,再麻煩你提供你的設計計劃。',
    verbatim2: '（後續澄清)1. 拆成三個模組,並再加一個其他數位加工設備分享,分享一些新興的設備;2. 可以以 flux,但其他國家的品牌也可納入討論;3. 這章的互動操作在於機器操作,下一章是建模分析,兩者不同。比例上我還是希望這章有一定強度。其他,同樣內容要明確、詳盡,最好附上參考資料,同時提供多樣化的模擬操作。',
    context: '調查台灣／華語圈主流數位加工設備(3D 列印、雷射切割、CNC、割字機),下載可取得的官方操作手冊並整理索引附註。第 2 章以「機具操作」為主軸,建置 9 個模組:M4 拆為 3D 列印／雷射／CNC 三個操作模組,並加入「新興數位加工設備」分享。整合 three.js 驅動建模與三視圖,自製多套機具操作模擬器。',
    decisions: ['數位加工拆為 3D 列印／雷射／CNC 三模組 + 新興設備', '雷射以 FLUX(台灣)為範本,並納入他國品牌', '本章重機具操作,深入分析留待第 3 章', 'three.js 加入 vendor'],
    outputs: [
      '數位加工設備調查 + 官方手冊下載(FLUX、Silhouette)與索引',
      '第 2 章 9 模組:CAD 介紹、原型製作、程式化建模、三視圖、3D 列印、雷射切割、CNC、新興設備、虛擬模擬',
      'commit:新增第 2 章',
    ],
  },
  {
    tag: '段落 5',
    date: '2026-05-16',
    title: '建立開發紀錄與紀錄規則',
    verbatim: '先一個段落,請把我們這個專案的所有討論對話以網頁的方式記錄逐字稿以及發展脈絡,並建立規則,後續執行一個段落就進行專案執行進度紀錄。',
    context: '建立本「開發紀錄」網頁,逐段保留使用者需求逐字稿、決策脈絡與執行產出。同時訂立「紀錄維護規則」:後續每完成一個開發段落,即更新本頁並隨程式碼一起 commit。',
    decisions: ['建立 dev-log.html 開發紀錄頁', '訂立逐段紀錄規則,後續每段落更新'],
    outputs: [
      'dev-log.html 開發紀錄與發展脈絡頁',
      '紀錄維護規則正式生效',
    ],
  },
  {
    tag: '段落 6',
    date: '2026-05-16',
    title: '第 2 章視覺強化:模擬動畫與實物圖片',
    verbatim: '這部分好了之後,重新檢視第二章,有些訊息模擬（如手繪和電腦繪圖,是否可以產生模擬動畫?讓資訊更明確?)或是下方的建模材料,也需要找出實圖（再附上參考網址),其他有舉實物或是材料、加工設備等內容,都需要附上實際圖片,不然學生無法理解這是什麼材料?',
    context: '將 M1 的「手繪 vs CAD」改圖競速,改寫為真正的左右同步「模擬動畫」——手繪側模擬擦拭、留痕跡、重描,CAD 側模擬指令修改、平滑變形。並為各種材料與加工設備補上真實照片:從 Wikimedia Commons 取得 19 張 CC0／公有領域／CC BY／CC BY-SA 授權圖片,合法嵌入並完整標註作者、授權與來源連結。',
    decisions: ['手繪 vs CAD 改為 Canvas 模擬動畫', '材料／設備實圖採 Wikimedia Commons 合授權圖片', '完整標註出處並建立 LICENSE_IMAGES.md'],
    outputs: [
      'M1 手繪 vs CAD 模擬動畫(逐筆重繪、擦拭痕跡 vs 參數化平滑變形)',
      '第 2 章嵌入 19 張授權實物照片(材料、加工設備)',
      'LICENSE_IMAGES.md 圖片授權聲明',
    ],
  },
  {
    tag: '段落 7',
    date: '2026-05-16',
    title: '圖片版面修正與全站逐頁驗證',
    verbatim: '圖片大小有的把視窗佔滿了,文字敘述都消失了。請先把圖片下載下來,避免他重新連接到 wiki 造成圖片出來有問題。然後請自行點開瀏覽器確認所有頁面無誤,確認畫面也可同步記錄於紀錄網站。',
    context: '修正圖片元件的尺寸 bug:原本 .figure 圖片未設長寬比與高度上限,直式照片在桌機會撐滿整個視窗、把文字擠掉。已為圖片統一加上長寬比(16:10)與高度上限(桌機 380px、並排圖 260px),確保版面穩定。同時確認:所有圖片皆已下載至本機 assets/photos/,頁面引用的是本機相對路徑,不會連回 Wikimedia(僅圖說的文字超連結指向出處)。最後以瀏覽器逐頁開啟全站 18 個頁面進行驗證。',
    decisions: ['.figure 圖片加上長寬比與高度上限', '確認圖片全為本機檔案,不依賴外部連線', '逐頁驗證並將結果記錄於本開發紀錄'],
    outputs: [
      '修正圖片尺寸 bug,版面不再被圖片撐爆',
      '驗證:首頁、第 1 章(Hub+5 模組)、第 2 章(Hub+9 模組)、開發紀錄頁,共 18 頁',
      '驗證結果:全站 18 頁皆無 console 錯誤,圖片尺寸正常、文字完整顯示',
    ],
  },
  {
    tag: '段落 8',
    date: '2026-05-16',
    title: '修正三視圖判讀挑戰的邏輯錯誤',
    verbatim: 'orthographic.html 這一頁下方的三視圖題目,選項重複且錯誤,希望可以把整個網站中所有內容都重新確認過。',
    context: '三視圖模組的判讀挑戰出現「選項重複且錯誤」。根因有二:(1) 原本模型用一個會「把每個 y=0 體素自動複製到 y=1」的函式產生,使所有模型深度都固定為 2,加上四個模型剛好都用到相同的 x 欄,導致它們的上視圖投影完全相同;(2) 原題型「給前視圖+側視圖,選上視圖」在邏輯上不可解(前+側無法唯一決定上視圖)。重新設計:改用 5 個 x-y footprint 各不相同的體素模型(經程式驗證上視圖必定互異),並把題型改為「直接觀察可旋轉的立體模型,選出正確的上視圖」,確保 4 個選項一定相異且題目可解。',
    decisions: ['重新設計 5 個 footprint 互異的體素模型', '題型改為「看立體模型選上視圖」', '以程式驗證上視圖互不重複,並測試答對/答錯流程'],
    outputs: [
      '三視圖判讀挑戰重建:選項保證相異、題目可解',
      '經程式驗證 5 模型上視圖全互異,並完整測試挑戰流程',
      '檢視:orthographic 是全站唯一動態產生選項的模組,其餘模組選項皆為人工撰寫且已驗證',
    ],
  },
];

/* ============================================================
 * 全站驗證紀錄(每次逐頁驗證後更新)
 * ============================================================ */
const VERIFY = {
  date: '2026-05-16',
  result: '以瀏覽器逐頁開啟全站 18 個頁面驗證——全數通過:無 console 錯誤,圖片尺寸正常受限、文字完整顯示,互動模擬器運作正常。其後並修正三視圖判讀挑戰的選項邏輯錯誤,重新設計後以程式驗證 5 個模型上視圖互不重複,並完整測試答對/答錯流程。',
  pages: [
    '首頁 Hub', '開發紀錄頁',
    '第 1 章 Hub', '1-1 科技趨勢儀表板', '1-2 工程設計流程互動',
    '1-3 創意思考工具箱', '1-4 專題規劃器', '1-5 競賽與職涯倫理',
    '第 2 章 Hub', '2-1 為什麼需要 CAD', '2-2 實體建模與原型',
    '2-3 程式化 CAD 建模器', '2-4 三視圖與立體模型', '2-5 3D 列印操作',
    '2-6 雷射切割與割字', '2-7 CNC 雕銑操作', '2-8 新興數位加工設備', '2-9 虛擬模擬入門',
  ],
};

(function renderVerify() {
  const el = document.getElementById('verifyBlock');
  if (!el) return;
  el.innerHTML = `
    <div class="verify-panel">
      <div class="vp-head">✅ 驗證日期 ${VERIFY.date}　|　共 ${VERIFY.pages.length} 頁</div>
      <div class="vp-result">${VERIFY.result}</div>
      <div class="verify-grid">${VERIFY.pages.map(p => `<span>✓ ${p}</span>`).join('')}</div>
    </div>`;
})();

/* ---- 渲染時間軸 ---- */
(function render() {
  const tl = document.getElementById('timeline');
  PHASES.forEach(p => {
    const phase = document.createElement('div');
    phase.className = 'log-phase';
    const vb2 = p.verbatim2
      ? `<blockquote class="verbatim" style="margin-top:8px"><span class="vq-mark">▸ 補充說明</span><br>${p.verbatim2}</blockquote>`
      : '';
    phase.innerHTML = `
      <div class="lp-card">
        <span class="lp-date">${p.date}</span>
        <span class="lp-tag">${p.tag}</span>
        <h3>${p.title}</h3>
        <div class="lp-sec">
          <h4>💬 使用者需求（逐字稿)</h4>
          <blockquote class="verbatim"><span class="vq-mark">「</span>${p.verbatim}<span class="vq-mark">」</span></blockquote>
          ${vb2}
        </div>
        <div class="lp-sec">
          <h4>🧭 決策與脈絡</h4>
          <p>${p.context}</p>
          <div class="lp-decisions">${p.decisions.map(d => `<span>${d}</span>`).join('')}</div>
        </div>
        <div class="lp-sec">
          <h4>✅ 執行產出</h4>
          <ul>${p.outputs.map(o => `<li>${o}</li>`).join('')}</ul>
        </div>
      </div>`;
    tl.appendChild(phase);
  });
  document.getElementById('mPhase').textContent = PHASES.length;
})();
