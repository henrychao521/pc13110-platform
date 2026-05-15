/* ============================================================
 * 工程設計流程互動 — STEM 齒輪 + 流程環 + 界定問題 + 排序
 * ============================================================ */

/* ---- SVG 齒輪路徑產生器 ---- */
function gearPath(R, r, teeth) {
  const seg = Math.PI * 2 / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * seg;
    [[r, 0], [R, .12], [R, .38], [r, .5], [r, .98]].forEach(([rad, f]) => {
      const ang = a + seg * f;
      pts.push([Math.cos(ang) * rad, Math.sin(ang) * rad]);
    });
  }
  return 'M' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';
}

function gearSVG(size, teeth, color, dir) {
  const R = size / 2, toothR = R, bodyR = R * 0.78, hubR = R * 0.3;
  return `
    <svg class="gear-svg ${dir}" width="${size}" height="${size}" viewBox="${-R} ${-R} ${size} ${size}">
      <path d="${gearPath(toothR, bodyR, teeth)}" fill="${color}"/>
      <circle r="${bodyR * 0.92}" fill="${color}"/>
      <circle r="${hubR}" fill="#0F172A" opacity=".25"/>
      <circle r="${hubR * 0.45}" fill="#0F172A" opacity=".35"/>
    </svg>`;
}

(function buildGears() {
  const stage = document.getElementById('gearStage');
  stage.innerHTML = `
    <div class="gear-unit" style="margin-right:-14px;z-index:1">
      ${gearSVG(110, 12, '#16A34A', 'ccw')}
      <div class="gear-label">科學探究<small>Science (S)</small></div>
    </div>
    <div class="gear-unit" style="z-index:2">
      ${gearSVG(168, 18, '#F59E0B', 'cw')}
      <div class="gear-label">工程設計<small>Engineering (E)</small></div>
    </div>
    <div class="gear-unit" style="margin-left:-14px;z-index:1">
      ${gearSVG(110, 12, '#2563EB', 'ccw')}
      <div class="gear-label">數學分析<small>Mathematics (M)</small></div>
    </div>
    <div style="width:100%;text-align:center;margin-top:14px;color:#fff">
      <span style="font-size:22px">⬇</span>
      <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.15);
        border:1px solid rgba(255,255,255,.25);padding:8px 18px;border-radius:999px;margin-left:8px">
        <span style="font-size:22px">🛁</span>
        <strong style="font-size:14px">產出：科技產品 Technology (T)</strong>
      </div>
    </div>`;
})();

document.getElementById('gearBtn').addEventListener('click', e => {
  const stage = document.getElementById('gearStage');
  const on = stage.classList.toggle('gear-spinning');
  e.target.textContent = on ? '⏸ 暫停齒輪' : '▶ 啟動 STEM 齒輪';
  if (typeof SoundFX !== 'undefined') SoundFX.click();
});

/* ============================================================
 * 工程設計流程七階段
 * ============================================================ */
const EDP = [
  { icon: '🎯', name: '界定問題', en: 'Identify the Problem',
    detail: '從真實情境中找出「真正要解決的問題」,並寫出具體、可衡量的問題敘述與限制條件（如預算、尺寸、時間）。這是整個流程最關鍵的第一步。' },
  { icon: '🔍', name: '研究與背景調查', en: 'Research',
    detail: '蒐集相關資料、了解既有解決方案與使用者需求,避免「重新發明輪子」,也為後續構思打下知識基礎。' },
  { icon: '💡', name: '構思解決方案', en: 'Brainstorm Solutions',
    detail: '運用六頂思考帽、SCAMPER、心智圖等創意思考法,盡量發想多元、不受框架限制的可能方案。' },
  { icon: '⚖️', name: '選擇最佳方案', en: 'Select the Best Solution',
    detail: '依成本、強度、可行性、安全性等指標,評估各方案的優缺點,選出最合適的一個（可用決策矩陣輔助）。' },
  { icon: '🔧', name: '開發與建構原型', en: 'Develop & Build Prototype',
    detail: '把選定的方案做成可實際測試的原型——可以是木材、積木等實體模型,也可以是 CAD 數位模型。' },
  { icon: '📊', name: '測試與評估', en: 'Test & Evaluate',
    detail: '對原型進行測試,用模擬數據或實測結果評估它是否真的達到設計需求。' },
  { icon: '🔄', name: '改進設計', en: 'Improve & Redesign',
    detail: '依測試發現的問題回頭修改設計,反覆迭代。工程設計流程是循環的——這一步往往會回到前面任一階段。' },
];

(function buildRing() {
  const ring = document.getElementById('edpRing');
  const detail = document.getElementById('edpDetail');
  EDP.forEach((s, i) => {
    const node = document.createElement('div');
    node.className = 'edp-node';
    node.innerHTML = `<div class="en-num">${i + 1}</div><div class="en-icon">${s.icon}</div><div class="en-name">${s.name}</div>`;
    node.addEventListener('click', () => {
      document.querySelectorAll('.edp-node').forEach(n => n.classList.remove('active'));
      node.classList.add('active');
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      detail.innerHTML = `
        <div class="knowledge-box pop-in" style="margin:0">
          <span class="kb-label">${s.icon} 第 ${i + 1} 步・${s.name}</span>
          <p style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin:2px 0 6px">${s.en}</p>
          <p>${s.detail}</p>
        </div>`;
    });
    ring.appendChild(node);
  });
})();

/* ============================================================
 * 完成度追蹤
 * ============================================================ */
let defineOK = false, seqOK = false;
function checkDone() {
  if (defineOK && seqOK) {
    celebrateModule('ch1-process', '工程設計流程互動');
    document.getElementById('nextBtn').classList.add('pop-in');
  }
}

/* ---- 動動腦 1：界定問題 ---- */
Interactions.DiagnosisQuiz({
  container: '#defineQuiz',
  question: '情境：「學校走廊的盆栽常因忘記澆水而枯死。」下列哪一個是「界定良好」的工程問題敘述?',
  options: [
    { text: '我想讓走廊的植物變漂亮。', correct: false,
      explain: '太模糊——沒有具體、可衡量的目標,也沒有限制條件。' },
    { text: '設計一個裝置,在土壤濕度低於設定值時自動提醒澆水;成本需低於 300 元、體積不超過手掌大小。', correct: true,
      explain: '正確!具體（自動提醒）、可衡量（濕度設定值）、有明確限制（成本、體積）——這才是好的問題界定。' },
    { text: '植物為什麼會枯死?', correct: false,
      explain: '這是一個「疑問」,屬於研究調查階段,還不是工程問題敘述。' },
    { text: '直接買一批新的盆栽來換。', correct: false,
      explain: '這是跳到「解決方案」了。界定問題階段應先把問題講清楚,而不是急著給答案。' },
  ],
  onAnswer: (correct) => { if (correct) { defineOK = true; checkDone(); } else { defineOK = true; checkDone(); } },
});

/* ---- 動動腦 2：流程排序 ---- */
Interactions.SequencePuzzle({
  container: '#seqPuzzle',
  title: '把工程設計流程「第一輪」排回正確順序',
  items: EDP.map((s, i) => `${s.icon}　${s.name}`),
  onComplete: () => { seqOK = true; checkDone(); },
});
