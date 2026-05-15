/* ============================================================
 * Hub 首頁互動：工程設計流程環、章節卡片、整體進度
 * ============================================================ */

/* ---- 工程設計流程 7 階段 ---- */
const PROCESS_STEPS = [
  { icon: '🎯', name: '界定問題', en: 'Identify', book: '第 1 章 1-2 節',
    tool: '工程設計流程互動圖、創意思考工具箱', desc: '從真實情境中找出真正要解決的問題與限制。', link: 'ch1-engineering/index.html' },
  { icon: '🔍', name: '研究與背景調查', en: 'Research', book: '第 1 章 1-1 / 1-3 節',
    tool: '科技趨勢儀表板、競賽圖鑑', desc: '蒐集科技趨勢、案例與既有方案,建立背景知識。', link: 'ch1-engineering/pages/trends.html' },
  { icon: '💡', name: '構思解決方案', en: 'Brainstorm', book: '第 1 章 1-2 節',
    tool: '六頂思考帽 / SCAMPER / 曼陀羅九宮格', desc: '用創意思考法激發多元、不受框架限制的點子。', link: 'ch1-engineering/pages/thinking.html' },
  { icon: '⚖️', name: '選擇最佳方案', en: 'Select', book: '第 1 章・第 3 章',
    tool: '決策評估、結構分析比較', desc: '依成本、強度、可行性等指標,評估並選出最佳解。', link: 'ch1-engineering/index.html' },
  { icon: '🔧', name: '建構原型', en: 'Prototype', book: '第 2 章・第 5 章',
    tool: 'CAD 建模器、ESP32 模擬', desc: '把方案做成可測試的實體或數位原型。', link: 'ch1-engineering/index.html' },
  { icon: '📊', name: '測試與評估', en: 'Test', book: '第 3 章・第 4 章',
    tool: '結構/機構模擬、電路模擬', desc: '用模擬與量測數據驗證原型是否達到設計需求。', link: 'ch1-engineering/index.html' },
  { icon: '🔄', name: '改進設計', en: 'Redesign', book: '第 3 章 最佳化',
    tool: '迭代分析、最佳化', desc: '依測試結果反覆修改,追求材料最少、強度足夠的最佳化。', link: 'ch1-engineering/index.html' },
];

/* ---- 五大章節 ---- */
const CHAPTERS = [
  { id: 'ch1', n: 'CHAPTER 1', cls: 'cc-c1', title: '加速發展的科技與工程',
    desc: '認識 AI、量子、生醫與再生能源四大趨勢,掌握工程設計流程,並用創意思考法規劃自己的專題。',
    tags: ['科技趨勢', '工程設計流程', '六頂思考帽 / SCAMPER', '心智圖 + 甘特圖'],
    link: 'ch1-engineering/index.html', ready: true },
  { id: 'ch2', n: 'CHAPTER 2', cls: 'cc-c2', title: '數位加工到機構實作',
    desc: '從 CAD 建模、實體原型,到 3D 列印、雷射切割、CNC 雕銑——動手操作四大數位加工機具,完整走過「從設計到成品」的歷程。',
    tags: ['程式化 CAD', '3D 列印操作', '雷射切割', 'CNC 雕銑', '新興設備'],
    link: 'ch2-fabrication/index.html', ready: true },
  { id: 'ch3', n: 'CHAPTER 3', cls: 'cc-c3', title: '機構與結構的深化探究',
    desc: '從手算靜力學 FBD 到電腦 FEA 模擬,解算桁架受力,並用物理引擎觀察曲柄、凸輪、齒輪等機構運動。',
    tags: ['自由體圖', '桁架解算', 'FEA 應力雲圖', '機構運動模擬'],
    link: '#', ready: false },
  { id: 'ch4', n: 'CHAPTER 4', cls: 'cc-c4', title: '日常生活中的電',
    desc: '認識電阻、電容、電晶體等元件與量測工具,並用開源電路模擬器設計分壓、邏輯閘與光感應路燈電路。',
    tags: ['電子元件', '電阻色碼', 'CircuitJS 模擬', '邏輯閘'],
    link: '#', ready: false },
  { id: 'ch5', n: 'CHAPTER 5', cls: 'cc-c5', title: '機電整合的工程設計',
    desc: '比較常見控制板,認識感測器與伺服馬達,並用 Wokwi 線上模擬器體驗 ESP32 程式撰寫、燒錄與序列埠控制。',
    tags: ['ESP32', 'Arduino IDE', 'Wokwi 模擬', '藍牙控制'],
    link: '#', ready: false },
];

/* ---- 渲染流程環 ---- */
(function renderRing() {
  const track = document.getElementById('ringTrack');
  const detail = document.getElementById('ringDetail');
  PROCESS_STEPS.forEach((s, i) => {
    const step = document.createElement('div');
    step.className = 'ring-step';
    step.innerHTML = `
      <div class="rs-num">${i + 1}</div>
      <div class="rs-icon">${s.icon}</div>
      <div class="rs-name">${s.name}</div>
      <div class="rs-desc">${s.en}</div>`;
    step.addEventListener('click', () => {
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      document.querySelectorAll('.ring-step').forEach(el => el.style.borderColor = 'var(--border)');
      step.style.borderColor = 'var(--brand)';
      detail.innerHTML = `
        <div class="panel pop-in" style="border-left:4px solid var(--brand)">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <span style="font-size:30px">${s.icon}</span>
            <div>
              <div style="font-size:17px;font-weight:800">第 ${i + 1} 步・${s.name}</div>
              <div style="font-size:12px;color:var(--text-muted);font-family:var(--font-mono)">${s.en}</div>
            </div>
          </div>
          <p style="font-size:14px;color:var(--text-soft);margin:8px 0">${s.desc}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:12.5px">
            <span style="background:var(--bg-soft);padding:5px 11px;border-radius:999px"><strong>對應課本</strong>　${s.book}</span>
            <span style="background:var(--brand-light);color:var(--brand-dark);padding:5px 11px;border-radius:999px"><strong>平台工具</strong>　${s.tool}</span>
          </div>
        </div>`;
    });
    track.appendChild(step);
    if (i < PROCESS_STEPS.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'ring-arrow';
      arrow.textContent = '→';
      track.appendChild(arrow);
    }
  });
})();

/* ---- 渲染章節卡片 ---- */
(function renderChapters() {
  const grid = document.getElementById('chapterGrid');
  CHAPTERS.forEach(ch => {
    const pct = Progress.chapterPercent(ch.id);
    const card = document.createElement('a');
    card.className = 'chapter-card ' + ch.cls + (ch.ready ? '' : ' locked');
    card.href = ch.ready ? ch.link : 'javascript:void(0)';
    card.innerHTML = `
      <div class="cc-banner">
        <div class="cc-num">${ch.n}</div>
        <div class="cc-title">${ch.title}</div>
      </div>
      <div class="cc-body">
        <div class="cc-desc">${ch.desc}</div>
        <div class="cc-tags">${ch.tags.map(t => `<span class="cc-tag">${t}</span>`).join('')}</div>
        <div class="cc-foot">
          ${ch.ready
            ? `<div class="cc-progress"><span style="width:${pct}%"></span></div><div class="cc-pct">${pct}%</div>`
            : `<span class="cc-soon">🔒 即將推出</span>`}
        </div>
      </div>`;
    if (!ch.ready) {
      card.addEventListener('click', e => { e.preventDefault(); showToast('此章節開發中,敬請期待', 'warning'); });
    }
    grid.appendChild(card);
  });
})();

/* ---- 整體進度 ---- */
(function renderOverall() {
  const pct = Progress.overallPercent();
  document.getElementById('overallBar').style.width = pct + '%';
  const txt = document.getElementById('overallText');
  txt.textContent = pct === 0 ? '尚未開始 — 點下方第 1 章出發吧'
    : pct === 100 ? '🎉 全部完成！工程設計大師' : `已完成 ${pct}%`;
})();

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('確定要清除所有學習進度嗎?此動作無法復原。')) {
    Progress.reset();
    location.reload();
  }
});
