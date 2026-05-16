/* ============================================================
 * 基本電子元件 — 元件圖鑑 + 電阻色碼計算器 + 檢核
 * ============================================================ */

const COMPONENTS = [
  { em: '⏛', name: '電阻器', sym: 'R / Ω',
    fn: '阻止電流通過,用於分壓、限流、保護電路。', use: '電熱裝置、保護電路、控制訊號;熱敏電阻還能當溫度感測元件。' },
  { em: '⊐⊏', name: '電容器', sym: 'C / F',
    fn: '在兩平行導電板間隔絕緣材料,能暫時儲存電荷。', use: '濾波(讓電源更穩定)、振盪、暫時儲能;分有極性與無極性兩種。' },
  { em: '〰', name: '電感器', sym: 'L / H',
    fn: '由線圈構成,通電時儲存磁能,能抵抗電流的變化。', use: '濾波、變壓器、訊號調諧。' },
  { em: '▷｜', name: '二極體', sym: 'D',
    fn: '讓電流「只能單方向通過」的元件。', use: '整流(把交流變直流)、保護電路;發光二極體(LED)還能發光。' },
  { em: '🎚', name: '電晶體', sym: 'Q',
    fn: '主動元件,能「放大」訊號,也能當作電子開關。', use: '訊號放大、開關控制——是現代電子電路的核心元件。' },
  { em: '▦', name: '積體電路 IC', sym: 'IC',
    fn: '把大量電晶體、電阻等元件整合在一塊微小晶片上。', use: '如 NE555 計時器、LM386 音頻放大器、微控制器——一顆 IC 就是一個完整功能模組。' },
];
(function buildComps() {
  const grid = document.getElementById('compGrid');
  COMPONENTS.forEach(c => {
    const card = document.createElement('div');
    card.className = 'comp-card';
    card.innerHTML = `
      <div class="cc-h"><span class="cc-em">${c.em}</span>
        <span class="cc-n">${c.name}</span><span class="cc-sym">${c.sym}</span></div>
      <div class="cc-b">
        <div><b>功能:</b>${c.fn}</div>
        <div><b>用途:</b>${c.use}</div>
      </div>`;
    card.querySelector('.cc-h').addEventListener('click', () => {
      card.classList.toggle('open');
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
    grid.appendChild(card);
  });
})();

/* ============================================================
 * 電阻色碼計算器
 * ============================================================ */
const DIGIT_COLORS = [
  ['黑', '#1a1a1a', 0], ['棕', '#7B3F00', 1], ['紅', '#D62828', 2], ['橙', '#E07000', 3],
  ['黃', '#E6B800', 4], ['綠', '#2E8B57', 5], ['藍', '#1E5FBF', 6], ['紫', '#7B30C0', 7],
  ['灰', '#808080', 8], ['白', '#EDEDED', 9],
];
const MULT_COLORS = [
  ['黑 ×1', '#1a1a1a', 1], ['棕 ×10', '#7B3F00', 10], ['紅 ×100', '#D62828', 100],
  ['橙 ×1k', '#E07000', 1e3], ['黃 ×10k', '#E6B800', 1e4], ['綠 ×100k', '#2E8B57', 1e5],
  ['藍 ×1M', '#1E5FBF', 1e6], ['金 ×0.1', '#C9A227', 0.1], ['銀 ×0.01', '#B0B0B0', 0.01],
];
const TOL_COLORS = [
  ['棕 ±1%', '#7B3F00', 1], ['紅 ±2%', '#D62828', 2], ['綠 ±0.5%', '#2E8B57', 0.5],
  ['藍 ±0.25%', '#1E5FBF', 0.25], ['紫 ±0.1%', '#7B30C0', 0.1], ['金 ±5%', '#C9A227', 5],
  ['銀 ±10%', '#B0B0B0', 10],
];

let bandMode = 4;
/* 預設:黃 紫 紅 金 → 4.7kΩ ±5% */
let sel = { d: [4, 7, 2], mult: 2, tol: 5 };  /* mult index, tol index */

function buildBandPickers() {
  const row = document.getElementById('bandRow');
  row.innerHTML = '';
  const nDigits = bandMode === 5 ? 3 : 2;
  function picker(label, options, idx, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'band-pick';
    const lab = document.createElement('div');
    lab.className = 'bp-label'; lab.textContent = label;
    const s = document.createElement('select');
    options.forEach((o, i) => {
      const op = document.createElement('option');
      op.value = i; op.textContent = o[0];
      if (i === idx) op.selected = true;
      s.appendChild(op);
    });
    s.addEventListener('change', () => { onChange(+s.value); updateResistor(); });
    wrap.appendChild(lab); wrap.appendChild(s);
    return wrap;
  }
  for (let i = 0; i < nDigits; i++) {
    row.appendChild(picker('第 ' + (i + 1) + ' 環', DIGIT_COLORS, sel.d[i], v => sel.d[i] = v));
  }
  row.appendChild(picker('乘冪', MULT_COLORS, sel.mult, v => sel.mult = v));
  row.appendChild(picker('誤差', TOL_COLORS, sel.tol, v => sel.tol = v));
}

function fmtOhm(v) {
  if (v >= 1e6) return (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + ' MΩ';
  if (v >= 1e3) return (v / 1e3).toFixed(2).replace(/\.?0+$/, '') + ' kΩ';
  return v.toFixed(2).replace(/\.?0+$/, '') + ' Ω';
}

function updateResistor() {
  const nDigits = bandMode === 5 ? 3 : 2;
  let digits = 0;
  for (let i = 0; i < nDigits; i++) digits = digits * 10 + DIGIT_COLORS[sel.d[i]][2];
  const val = digits * MULT_COLORS[sel.mult][2];
  const tol = TOL_COLORS[sel.tol][2];
  /* 繪製電阻 */
  const res = document.getElementById('resistor');
  res.innerHTML = '';
  const bandColors = [];
  for (let i = 0; i < nDigits; i++) bandColors.push(DIGIT_COLORS[sel.d[i]][1]);
  bandColors.push(MULT_COLORS[sel.mult][1]);
  bandColors.push(TOL_COLORS[sel.tol][1]);
  bandColors.forEach((c, i) => {
    const b = document.createElement('div');
    b.className = 'rband';
    b.style.background = c;
    if (i === bandColors.length - 1) b.style.marginLeft = '20px';   /* 誤差環稍微分開 */
    res.appendChild(b);
  });
  document.getElementById('resOut').textContent = fmtOhm(val) + '  ±' + tol + '%';
  const target = Math.abs(val - 4700) < 1;
  document.getElementById('resNote').innerHTML = target
    ? '🎉 答對了!黃-紫-紅-金 正好是 4.7 kΩ ±5% 的常見電阻。'
    : '目前阻值:' + fmtOhm(val) + '。試著調出 4.7 kΩ(黃-紫-紅)。';
  if (target && !Progress.isDone('ch4-components') && quizDone) finishModule();
  resistorTarget = target;
}
let resistorTarget = false, quizDone = false;
function finishModule() {
  celebrateModule('ch4-components', '基本電子元件');
  document.getElementById('nextBtn').classList.add('pop-in');
}

document.querySelectorAll('.bandmode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bandmode').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    bandMode = +btn.dataset.mode;
    if (bandMode === 5 && sel.d.length < 3) sel.d[2] = 0;
    buildBandPickers();
    updateResistor();
    if (typeof SoundFX !== 'undefined') SoundFX.click();
  });
});
buildBandPickers();
updateResistor();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '下列哪一個是「主動元件」(能放大或控制訊號)?',
    options: [
      { text: '電阻器', correct: false },
      { text: '電晶體', correct: true, explain: '正確。電晶體能放大訊號、也能當開關,是主動元件。電阻、電容、電感屬被動元件。' },
      { text: '電容器', correct: false },
    ] },
  { question: '二極體最主要的特性是什麼?',
    options: [
      { text: '讓電流只能「單方向」通過', correct: true,
        explain: '正確。二極體的單向導通特性,常用於整流(交流變直流)。' },
      { text: '把電流放大十倍', correct: false },
      { text: '儲存大量電荷', correct: false },
    ] },
  { question: '四色環電阻「黃-紫-紅-金」,它的阻值是多少?',
    options: [
      { text: '47 Ω ±5%', correct: false },
      { text: '4.7 kΩ ±5%(黃4、紫7、紅×100、金±5%)', correct: true,
        explain: '正確。47 × 100 = 4700 Ω = 4.7 kΩ,金環代表 ±5% 誤差。' },
      { text: '470 kΩ ±10%', correct: false },
    ] },
];
let answered = 0;
QUIZ.forEach((q, i) => {
  const box = document.createElement('div');
  box.style.marginBottom = '14px';
  document.getElementById('quizArea').appendChild(box);
  Interactions.DiagnosisQuiz({
    container: box, question: `第 ${i + 1} 題　${q.question}`, options: q.options,
    onAnswer: () => {
      answered++;
      if (answered === QUIZ.length) {
        quizDone = true;
        if (!Progress.isDone('ch4-components')) finishModule();
      }
    },
  });
});
