/* ============================================================
 * 電腦輔助結構分析 FEA — L 型支架應力模擬器 + 步驟排序 + 檢核
 * ============================================================ */

const MATERIALS = {
  '鋁合金 6061': { yield: 275, color: '#94A3B8' },
  '結構鋼': { yield: 350, color: '#64748B' },
  'ABS 塑膠': { yield: 42, color: '#A78BFA' },
};
let mat = '鋁合金 6061', thick = 5, load = 150;
const canvas = document.getElementById('feaCanvas');

/* 最大應力(MPa):與載重成正比、與厚度平方成反比 */
function maxStress() { return load * 12 / (thick * thick); }
function safetyFactor() { return MATERIALS[mat].yield / maxStress(); }

/* 應力 → 顏色(藍→綠→黃→紅) */
function stressColor(t) {
  t = Math.max(0, Math.min(1, t));
  const stops = [[37,99,235],[16,185,129],[234,179,8],[239,68,68]];
  const seg = Math.min(2, Math.floor(t * 3));
  const f = t * 3 - seg;
  const a = stops[seg], b = stops[seg + 1];
  return `rgb(${a[0]+(b[0]-a[0])*f|0},${a[1]+(b[1]-a[1])*f|0},${a[2]+(b[2]-a[2])*f|0})`;
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 300;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  /* L 型支架幾何:垂直臂貼牆,水平臂向右 */
  const wallX = 70, topY = 50;
  const armT = 18 + thick * 4;                 /* 支架壁厚(畫面)*/
  const vH = 150, hL = w - wallX - 90;
  const cornerX = wallX, cornerY = topY + vH;   /* 內側轉角 */

  /* 牆 */
  ctx.fillStyle = '#475569';
  ctx.fillRect(wallX - 24, topY - 14, 24, vH + armT + 28);
  for (let y = topY - 8; y < topY + vH + armT + 20; y += 14) {
    ctx.strokeStyle = '#1E293B'; ctx.beginPath();
    ctx.moveTo(wallX - 24, y); ctx.lineTo(wallX - 12, y - 9); ctx.stroke();
  }

  /* 以網格繪製 L 型支架,每格依應力上色 */
  const stress0 = maxStress();
  const yieldV = MATERIALS[mat].yield;
  const cell = 6;
  function cellAt(px, py, inV, inH) {
    /* 應力:離內側轉角越近越大;水平臂上的彎矩沿長度遞減 */
    let s;
    if (inV) {           /* 垂直臂 */
      const distBelow = (cornerY - py) / vH;     /* 0 在轉角,1 在頂 */
      s = stress0 * (1 - distBelow * 0.7);
    } else {             /* 水平臂 */
      const along = (px - cornerX) / hL;          /* 0 在轉角,1 在端點 */
      s = stress0 * (1 - along * 0.85);
    }
    return s;
  }
  ctx.lineWidth = 0;
  for (let py = topY; py < cornerY + armT; py += cell) {
    for (let px = wallX; px < wallX + hL; px += cell) {
      const inV = (px < wallX + armT) && (py < cornerY + armT);
      const inH = (py >= cornerY) && (py < cornerY + armT) && (px < wallX + hL);
      if (!inV && !inH) continue;
      const s = cellAt(px, py, inV, inH);
      ctx.fillStyle = stressColor(s / yieldV);
      ctx.fillRect(px, py, cell, cell);
    }
  }
  /* 內側轉角紅點標示 */
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(wallX + armT, cornerY, 5, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = '11px "Noto Sans TC"'; ctx.textAlign = 'left';
  ctx.fillText('← 應力集中:內側轉角', wallX + armT + 8, cornerY - 8);

  /* 載重箭頭(水平臂端點) */
  const tipX = wallX + hL - cell, tipY = cornerY + armT / 2;
  const al = 22 + load * 0.12;
  ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX, tipY + al); ctx.stroke();
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.moveTo(tipX, tipY + al + 8); ctx.lineTo(tipX - 6, tipY + al); ctx.lineTo(tipX + 6, tipY + al);
  ctx.fill();
  ctx.font = '700 12px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText(load + ' N', tipX, tipY + al + 22);

  /* 應力色條圖例 */
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = stressColor(i / 59);
    ctx.fillRect(14 + i * 2.4, 18, 2.6, 12);
  }
  ctx.fillStyle = '#E2E8F0'; ctx.font = '11px "Noto Sans TC"'; ctx.textAlign = 'left';
  ctx.fillText('低應力', 14, 44); ctx.textAlign = 'right'; ctx.fillText('高應力', 14 + 60 * 2.4, 44);
}

function refresh() {
  const s = maxStress(), sf = safetyFactor(), y = MATERIALS[mat].yield;
  document.getElementById('tVal').textContent = thick + ' mm';
  document.getElementById('loadVal').textContent = load + ' N';
  let verdict, color;
  if (sf < 1) { verdict = '✗ 結構失效!最大應力已超過材料降伏強度'; color = 'var(--danger)'; }
  else if (sf < 2) { verdict = '⚠ 安全餘裕不足(工程上建議 ≥ 2)'; color = 'var(--warning)'; }
  else { verdict = '✓ 結構安全,有足夠的安全餘裕'; color = 'var(--success)'; }
  document.getElementById('feaStat').innerHTML = `
    <div class="fs-row"><span>最大馮·米塞斯應力</span><b>${s.toFixed(0)} MPa</b></div>
    <div class="fs-row"><span>材料降伏強度(${mat})</span><b>${y} MPa</b></div>
    <div class="fs-row"><span>安全係數 = 降伏強度 ÷ 最大應力</span><b style="color:${color}">${sf.toFixed(2)}</b></div>
    <div style="color:${color};font-weight:700;margin-top:4px">${verdict}</div>`;
  draw();
}

(function buildMatSeg() {
  const wrap = document.getElementById('matSeg');
  Object.keys(MATERIALS).forEach((name, i) => {
    const b = document.createElement('button');
    b.textContent = name;
    if (i === 0) b.classList.add('on');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      mat = name;
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      refresh();
    });
    wrap.appendChild(b);
  });
})();
document.getElementById('tSlider').addEventListener('input', e => { thick = +e.target.value; refresh(); });
document.getElementById('loadSlider').addEventListener('input', e => { load = +e.target.value; refresh(); });
window.addEventListener('resize', draw);
refresh();

/* ---- FEA 步驟排序 ---- */
Interactions.SequencePuzzle({
  container: '#seqArea',
  title: '把 FEA 模擬的操作步驟排回正確順序',
  items: [
    '① 模型準備:繪製 3D 模型並進行「模型淨化」',
    '② 進入模擬環境:選擇分析類型(如靜態應力)',
    '③ 材料定義:指定材料與其力學性質',
    '④ 施加約束:把固定的面設為「固定」',
    '⑤ 施加負載:加上實際承受的力',
    '⑥ 求解與判讀:執行運算,觀察應力雲圖',
  ],
  onComplete: () => {},
});

/* ---- 檢核 ---- */
const QUIZ = [
  { question: 'FEA(有限元素分析)的核心做法是什麼?',
    options: [
      { text: '把複雜物體切成許多微小元素,逐一計算後再組合', correct: true,
        explain: '正確。透過「網格劃分」把物體切成元素,電腦才能處理複雜結構。' },
      { text: '用尺直接量測物體', correct: false },
      { text: '把物體丟進水裡測體積', correct: false },
    ] },
  { question: 'FEA 結果的彩色應力雲圖中,「紅色」區域代表什麼?',
    options: [
      { text: '溫度最高的地方', correct: false },
      { text: '應力最高、最容易破壞的地方', correct: true,
        explain: '正確。紅色代表馮·米塞斯應力最高處;L 型支架通常集中在內側轉角。' },
      { text: '完全不受力的地方', correct: false },
    ] },
  { question: '某零件最大應力 100 MPa,材料降伏強度 250 MPa,安全係數是多少?是否安全?',
    options: [
      { text: '2.5,通常視為安全', correct: true,
        explain: '正確。安全係數 = 250 ÷ 100 = 2.5,大於工程常用門檻 2,屬安全。' },
      { text: '0.4,結構會失效', correct: false },
      { text: '150,過度浪費材料', correct: false },
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
        celebrateModule('ch3-fea', '電腦輔助結構分析 FEA');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
