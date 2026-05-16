/* ============================================================
 * PC13110 工程設計學習平台 — 共用核心
 * 進度儲存(localStorage)、Toast、章節進度計算、頁尾注入
 * ============================================================ */

const PROGRESS_KEY = 'pc13110_progress_v1';

/* 平台地圖：每章的模組 ID 清單(供進度百分比計算用) */
const CHAPTER_MAP = {
  ch1: ['ch1-trends', 'ch1-process', 'ch1-thinking', 'ch1-planner', 'ch1-career'],
  ch2: ['ch2-cad', 'ch2-prototype', 'ch2-modeling', 'ch2-ortho', 'ch2-print3d',
        'ch2-laser', 'ch2-cnc', 'ch2-emerging', 'ch2-sim'],
  ch3: ['ch3-statics', 'ch3-truss', 'ch3-fea', 'ch3-mechanism', 'ch3-ai'],
  ch4: ['ch4-components', 'ch4-tools', 'ch4-circuit', 'ch4-logic'],
  ch5: ['ch5-boards', 'ch5-peripherals', 'ch5-esp32', 'ch5-project'],
};

const Progress = (() => {
  function load() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { done: {}, scores: {} };
    } catch (e) {
      return { done: {}, scores: {} };
    }
  }
  function save(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
  return {
    load, save,
    /* 標記某模組完成；可附帶分數(0~100) */
    mark(id, score) {
      const p = load();
      p.done[id] = true;
      if (typeof score === 'number') p.scores[id] = Math.max(p.scores[id] || 0, score);
      save(p);
    },
    isDone(id) { return !!load().done[id]; },
    score(id) { return load().scores[id] || 0; },
    /* 回傳某章完成百分比 0~100 */
    chapterPercent(chapterId) {
      const ids = CHAPTER_MAP[chapterId] || [];
      if (!ids.length) return 0;
      const p = load();
      const done = ids.filter(id => p.done[id]).length;
      return Math.round(done / ids.length * 100);
    },
    /* 全平台完成百分比 */
    overallPercent() {
      const all = Object.values(CHAPTER_MAP).flat();
      if (!all.length) return 0;
      const p = load();
      return Math.round(all.filter(id => p.done[id]).length / all.length * 100);
    },
    reset() { localStorage.removeItem(PROGRESS_KEY); },
  };
})();

/* ---- Toast 浮動提示 ---- */
function showToast(msg, type = '') {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.className = 'toast show ' + type;
  t.textContent = msg;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.className = 'toast ' + type; }, 2400);
}

/* ---- 計算回到 repo 根目錄的相對前綴 ---- */
function rootPrefix() {
  let depth = 0;
  if (location.pathname.includes('/pages/')) depth++;
  if (/\/ch[1-5]-[a-z]+\//.test(location.pathname)) depth++;
  return '../'.repeat(depth);
}

/* ---- 自動注入頁尾 ---- */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('footer')) {
    const footer = document.createElement('footer');
    footer.innerHTML = `
      <p>© 趙珩宇老師製作・PC13110 工程設計學習平台</p>
      <p class="footer-note">
        對應普通型高級中等學校「生活科技」教科書（PC13110，趙珩宇 編）。
        本平台整合多項開源專案，授權詳見各模組標註。
      </p>
      <p class="footer-note">
        <a href="${rootPrefix()}teacher.html" style="color:var(--brand);font-weight:700">教師後台</a>
        ・課程規劃、作業指派與學生進度檢視
      </p>`;
    document.body.appendChild(footer);
  }
});

/* ---- 完成模組的共用慶祝流程 ---- */
function celebrateModule(id, label, score) {
  Progress.mark(id, score);
  if (typeof SoundFX !== 'undefined') SoundFX.win();
  showToast(`✓ 完成「${label}」` + (typeof score === 'number' ? `（${score} 分）` : ''), 'success');
}

/* ============================================================
 * 平台模組總表 — 順序固定。作為「作業位元遮罩」與「進度編碼」的索引基準。
 * 修改順序會使既有的作業連結／進度代碼失效，新增模組請一律往後加。
 * ============================================================ */
const CHAPTER_INFO = {
  ch1: { name: '加速發展的科技與工程', short: '科技與工程', cls: 'cc-c1', cvar: '--c1', hub: 'ch1-engineering/index.html' },
  ch2: { name: '數位加工到機構實作', short: '數位加工', cls: 'cc-c2', cvar: '--c2', hub: 'ch2-fabrication/index.html' },
  ch3: { name: '機構與結構的深化探究', short: '機構與結構', cls: 'cc-c3', cvar: '--c3', hub: 'ch3-mechanism/index.html' },
  ch4: { name: '日常生活中的電', short: '日常的電', cls: 'cc-c4', cvar: '--c4', hub: 'ch4-electricity/index.html' },
  ch5: { name: '機電整合的工程設計', short: '機電整合', cls: 'cc-c5', cvar: '--c5', hub: 'ch5-mechatronics/index.html' },
};

const MODULES = [
  { id:'ch1-trends',     ch:'ch1', tag:'1-1',     icon:'📈', title:'科技趨勢儀表板',       link:'ch1-engineering/pages/trends.html',      hours:1, obj:'判讀 AI、量子半導體、生醫、再生能源四大趨勢的數據與社會影響' },
  { id:'ch1-process',    ch:'ch1', tag:'1-2',     icon:'🔄', title:'工程設計流程互動',     link:'ch1-engineering/pages/process.html',     hours:1, obj:'說明工程設計流程七階段，並理解 STEM／CDIO 的跨域整合' },
  { id:'ch1-thinking',   ch:'ch1', tag:'1-2',     icon:'💡', title:'創意思考工具箱',       link:'ch1-engineering/pages/thinking.html',    hours:2, obj:'運用六頂思考帽、SCAMPER、曼陀羅法產生並收斂設計構想' },
  { id:'ch1-planner',    ch:'ch1', tag:'1-3',     icon:'🗂️', title:'專題規劃器',           link:'ch1-engineering/pages/planner.html',     hours:1, obj:'用心智圖梳理專題架構、用甘特圖排定時程' },
  { id:'ch1-career',     ch:'ch1', tag:'1-3/1-4', icon:'🏆', title:'競賽與職涯倫理',       link:'ch1-engineering/pages/career.html',      hours:1, obj:'認識科技競賽管道，並思辨工程倫理情境' },
  { id:'ch2-cad',        ch:'ch2', tag:'2-1',     icon:'🖥️', title:'為什麼需要 CAD?',      link:'ch2-fabrication/pages/cad-intro.html',   hours:1, obj:'比較手繪與 CAD，理解參數化設計的優勢' },
  { id:'ch2-prototype',  ch:'ch2', tag:'2-2',     icon:'🧱', title:'實體建模與原型製作',   link:'ch2-fabrication/pages/prototype.html',   hours:1, obj:'認識原型材料與快速原型在設計流程中的角色' },
  { id:'ch2-modeling',   ch:'ch2', tag:'2-3',     icon:'📐', title:'程式化 CAD 建模器',    link:'ch2-fabrication/pages/modeling.html',    hours:1, obj:'以程式參數驅動三維模型的建立' },
  { id:'ch2-ortho',      ch:'ch2', tag:'2-3',     icon:'📊', title:'三視圖與立體模型',     link:'ch2-fabrication/pages/orthographic.html',hours:1, obj:'在立體模型與前／上／側三視圖間相互轉換判讀' },
  { id:'ch2-print3d',    ch:'ch2', tag:'2-3',     icon:'🖨️', title:'3D 列印操作',          link:'ch2-fabrication/pages/print3d.html',     hours:1, obj:'理解切片參數與逐層堆疊成形的原理與操作' },
  { id:'ch2-laser',      ch:'ch2', tag:'2-3',     icon:'🔦', title:'雷射切割與割字操作',   link:'ch2-fabrication/pages/laser.html',       hours:1, obj:'依材料設定雷射功率／速度，並規劃切割路徑' },
  { id:'ch2-cnc',        ch:'ch2', tag:'2-3',     icon:'🛠️', title:'CNC 雕銑操作',         link:'ch2-fabrication/pages/cnc.html',         hours:1, obj:'規劃刀具路徑，並判斷進給速度與斷刀風險' },
  { id:'ch2-emerging',   ch:'ch2', tag:'延伸',    icon:'🚀', title:'新興數位加工設備',     link:'ch2-fabrication/pages/emerging.html',    hours:1, obj:'認識樹脂／金屬列印、3D 掃描、五軸加工等新興設備' },
  { id:'ch2-sim',        ch:'ch2', tag:'2-3',     icon:'🔬', title:'虛擬模擬與分析入門',   link:'ch2-fabrication/pages/simulation.html',  hours:2, obj:'以懸臂梁模擬初識虛擬分析的概念與用途' },
  { id:'ch3-statics',    ch:'ch3', tag:'3-1',     icon:'⚖️', title:'靜力學與自由體圖',     link:'ch3-mechanism/pages/statics.html',       hours:2, obj:'繪製自由體圖，並計算簡支梁的支承反力' },
  { id:'ch3-truss',      ch:'ch3', tag:'3-1',     icon:'🌉', title:'桁架結構解算',         link:'ch3-mechanism/pages/truss.html',         hours:2, obj:'判斷桁架靜定，並解算各桿件的張力／壓力' },
  { id:'ch3-fea',        ch:'ch3', tag:'3-1',     icon:'🔥', title:'電腦輔助結構分析 FEA', link:'ch3-mechanism/pages/fea.html',           hours:1, obj:'解讀有限元素應力雲圖，辨識應力集中位置' },
  { id:'ch3-mechanism',  ch:'ch3', tag:'3-2',     icon:'🎡', title:'機構類型與運動',       link:'ch3-mechanism/pages/mechanism.html',     hours:2, obj:'分析曲柄滑塊、凸輪、齒輪、日內瓦機構的運動' },
  { id:'ch3-ai',         ch:'ch3', tag:'3-3',     icon:'🤖', title:'AI 輔助的機構結構分析',link:'ch3-mechanism/pages/ai-analysis.html',   hours:1, obj:'認識生成式設計與 AI 輔助的結構最佳化' },
  { id:'ch4-components', ch:'ch4', tag:'4-1',     icon:'🔌', title:'基本電子元件',         link:'ch4-electricity/pages/components.html',  hours:1, obj:'辨識電阻、電容、二極體等元件並讀電阻色碼' },
  { id:'ch4-tools',      ch:'ch4', tag:'4-2',     icon:'🛠️', title:'常用工具與量測',       link:'ch4-electricity/pages/tools.html',       hours:1, obj:'認識麵包板接線方式與三用電表量測' },
  { id:'ch4-circuit',    ch:'ch4', tag:'4-3',     icon:'💡', title:'電路設計與模擬',       link:'ch4-electricity/pages/circuit.html',     hours:2, obj:'用模擬器設計分壓電路並驗證電壓、電流' },
  { id:'ch4-logic',      ch:'ch4', tag:'4-3',     icon:'🚦', title:'邏輯與感應電路',       link:'ch4-electricity/pages/logic.html',       hours:2, obj:'設計 AND／OR 邏輯閘與光感應控制電路' },
  { id:'ch5-boards',     ch:'ch5', tag:'5-1',     icon:'🎛️', title:'常見控制板',           link:'ch5-mechatronics/pages/boards.html',     hours:1, obj:'比較 Arduino、micro:bit、ESP32 等控制板的特性' },
  { id:'ch5-peripherals',ch:'ch5', tag:'5-2',     icon:'⚙️', title:'機電整合的電子周邊',   link:'ch5-mechatronics/pages/peripherals.html',hours:2, obj:'操作伺服馬達與感測器，並觀察序列埠資料' },
  { id:'ch5-esp32',      ch:'ch5', tag:'5-3',     icon:'🔷', title:'認識 ESP32 與實作',    link:'ch5-mechatronics/pages/esp32.html',      hours:3, obj:'認識 ESP32 腳位，並以 Wokwi 模擬程式燒錄' },
  { id:'ch5-project',    ch:'ch5', tag:'統整',    icon:'🏆', title:'機電整合統整專題',     link:'ch5-mechatronics/pages/project.html',    hours:2, obj:'整合「感測—控制—致動」完成機電整合專題規劃' },
];

/* ---- 模組查詢輔助 ---- */
function moduleIndex(id) { return MODULES.findIndex(m => m.id === id); }
function moduleById(id) { return MODULES.find(m => m.id === id); }

/* ============================================================
 * 作業 ⇄ 代碼:把「指派的模組集合」編成 base36 位元遮罩
 * ============================================================ */
function b36ToBig(s) {
  let n = 0n;
  for (const c of String(s).toLowerCase()) {
    const d = parseInt(c, 36);
    if (isNaN(d)) continue;
    n = n * 36n + BigInt(d);
  }
  return n;
}
function bigToIds(mask) {
  const ids = [];
  MODULES.forEach((m, i) => { if ((mask >> BigInt(i)) & 1n) ids.push(m.id); });
  return ids;
}
function encodeAssign(ids) {
  let mask = 0n;
  (ids || []).forEach(id => {
    const i = moduleIndex(id);
    if (i >= 0) mask |= (1n << BigInt(i));
  });
  return mask.toString(36);
}
function decodeAssign(code) {
  if (!code) return [];
  try { return bigToIds(b36ToBig(code)); } catch (e) { return []; }
}

/* ============================================================
 * 學生進度 ⇄ 分享代碼(供教師後台彙整檢視)
 * 代碼格式: PC13110~<base64(JSON)>
 * ============================================================ */
function exportProgressCode(name) {
  const p = Progress.load();
  let doneMask = 0n;
  const scores = {};
  MODULES.forEach((m, i) => {
    if (p.done[m.id]) doneMask |= (1n << BigInt(i));
    if (p.scores[m.id]) scores[i] = p.scores[m.id];
  });
  const payload = { v: 1, n: (name || '').slice(0, 20), d: doneMask.toString(36), s: scores };
  return 'PC13110~' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}
function parseProgressCode(code) {
  const raw = String(code || '').trim().replace(/^PC13110~/, '');
  if (!raw) return null;
  let payload;
  try {
    payload = JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch (e) { return null; }
  if (!payload || payload.v !== 1) return null;
  const doneIds = bigToIds(b36ToBig(payload.d || '0'));
  const scores = {};
  Object.entries(payload.s || {}).forEach(([i, sc]) => {
    const m = MODULES[+i];
    if (m) scores[m.id] = sc;
  });
  return { name: payload.n || '(未命名)', done: doneIds, scores };
}
