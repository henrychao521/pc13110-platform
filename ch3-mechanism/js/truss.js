/* ============================================================
 * 桁架結構解算 — 三種桁架受力視覺化 + 靜定計算器 + 檢核
 * 桿件以定性方式標示張力/壓力(符號正確,量值為示意)
 * ============================================================ */

/* 節點座標(網格單位);桿件 [節點a, 節點b, 受力類型 'T'張/'C'壓, 相對量值] */
const SPAN = 4, H = 1.6;
function bottom(i) { return [i, 0]; }
function topPt(i)    { return [i, H]; }

const TRUSSES = {
  'Pratt 普拉特': {
    joints: [bottom(0),bottom(1),bottom(2),bottom(3),bottom(4),
             topPt(0),topPt(1),topPt(2),topPt(3),topPt(4)],
    /* index: B0..B4 = 0..4, T0..T4 = 5..9 */
    members: [
      /* 底弦(張) */ [0,1,'T',1],[1,2,'T',1.4],[2,3,'T',1.4],[3,4,'T',1],
      /* 頂弦(壓) */ [5,6,'C',1],[6,7,'C',1.4],[7,8,'C',1.4],[8,9,'C',1],
      /* 直桿(壓) */ [0,5,'C',.5],[1,6,'C',.9],[2,7,'C',1.2],[3,8,'C',.9],[4,9,'C',.5],
      /* 斜桿(張)朝中央 */ [5,1,'T',1.1],[6,2,'T',.8],[8,2,'T',.8],[9,3,'T',1.1],
    ],
    note: 'Pratt:斜桿朝中央傾斜。受力時<strong>斜桿全為張力(紅)、直桿全為壓力(藍)</strong>。較長的斜桿承受張力,最能發揮鋼材的抗拉特性,是鋼橋最常見的形式。',
  },
  'Howe 豪威': {
    joints: [bottom(0),bottom(1),bottom(2),bottom(3),bottom(4),
             topPt(0),topPt(1),topPt(2),topPt(3),topPt(4)],
    members: [
      [0,1,'T',1],[1,2,'T',1.4],[2,3,'T',1.4],[3,4,'T',1],
      [5,6,'C',1],[6,7,'C',1.4],[7,8,'C',1.4],[8,9,'C',1],
      /* 直桿(張) */ [0,5,'T',.5],[1,6,'T',.9],[2,7,'T',1.2],[3,8,'T',.9],[4,9,'T',.5],
      /* 斜桿(壓)朝外側 */ [0,6,'C',1.1],[1,7,'C',.8],[3,7,'C',.8],[4,8,'C',1.1],
    ],
    note: 'Howe:斜桿方向與 Pratt 相反。受力時<strong>斜桿全為壓力(藍)、直桿全為張力(紅)</strong>。斜桿受壓較適合抗壓性佳的木材,常用於傳統木造桁架。',
  },
  'Warren 華倫': {
    joints: [bottom(0),bottom(1),bottom(2),bottom(3),bottom(4),
             topPt(0),topPt(1),topPt(2),topPt(3)],
    /* B0..B4=0..4, T0..T3=5..8(頂節點在底節點之間)*/
    members: [
      [0,1,'T',1],[1,2,'T',1.3],[2,3,'T',1.3],[3,4,'T',1],
      [5,6,'C',1.2],[6,7,'C',1.3],[7,8,'C',1.2],
      /* 斜桿 W 形,張壓交替 */
      [0,5,'C',1.1],[5,1,'T',1],[1,6,'C',.7],[6,2,'T',.6],
      [2,7,'T',.6],[7,3,'C',.7],[3,8,'T',1],[8,4,'C',1.1],
    ],
    note: 'Warren:斜桿呈 W 形交錯,幾乎沒有直桿。斜桿的受力<strong>張力、壓力交替出現</strong>。桿件數最少、結構簡潔,常見於現代鋼橋與屋架。',
  },
};
/* Warren 頂節點實際 x 位置(在底節點之間)*/
TRUSSES['Warren 華倫'].joints[5] = [0.5, H];
TRUSSES['Warren 華倫'].joints[6] = [1.5, H];
TRUSSES['Warren 華倫'].joints[7] = [2.5, H];
TRUSSES['Warren 華倫'].joints[8] = [3.5, H];

let curTruss = 'Pratt 普拉特', load = 100;
const canvas = document.getElementById('trussCanvas');

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 300;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const T = TRUSSES[curTruss];
  const pad = 56, plotW = w - pad * 2, plotH = h - 110;
  const sx = plotW / SPAN, sy = plotH / H;
  const oy = h - 64;
  const P = (j) => ({ x: pad + T.joints[j][0] * sx, y: oy - T.joints[j][1] * sy });
  const loadScale = load / 100;

  /* 桿件 */
  T.members.forEach(([a, b, type, mag]) => {
    const A = P(a), B = P(b);
    ctx.strokeStyle = type === 'T' ? '#EF4444' : '#3B82F6';
    ctx.lineWidth = 2 + mag * loadScale * 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
  });
  /* 節點 */
  T.joints.forEach((_, j) => {
    const p = P(j);
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill();
  });
  /* 支承(底弦兩端) */
  ctx.fillStyle = '#94A3B8';
  [P(0), P(4)].forEach(p => {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 5); ctx.lineTo(p.x - 12, p.y + 24); ctx.lineTo(p.x + 12, p.y + 24);
    ctx.fill();
  });
  /* 中央載重箭頭(底弦中點 B2) */
  const mid = P(2);
  const al = 26 + load * 0.35;
  ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(mid.x, mid.y - al); ctx.lineTo(mid.x, mid.y - 6); ctx.stroke();
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.moveTo(mid.x, mid.y - 2); ctx.lineTo(mid.x - 6, mid.y - 12); ctx.lineTo(mid.x + 6, mid.y - 12);
  ctx.fill();
  ctx.font = '700 13px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText(load + ' kN', mid.x, mid.y - al - 8);
  /* 圖例 */
  ctx.font = '12px "Noto Sans TC"'; ctx.textAlign = 'left';
  ctx.fillStyle = '#EF4444'; ctx.fillText('━ 張力(被拉)', 14, 22);
  ctx.fillStyle = '#3B82F6'; ctx.fillText('━ 壓力(被壓)', 14, 40);
}

(function buildSeg() {
  const wrap = document.getElementById('trussSeg');
  Object.keys(TRUSSES).forEach((name, i) => {
    const b = document.createElement('button');
    b.textContent = name;
    if (i === 0) b.classList.add('on');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      curTruss = name;
      document.getElementById('trussNote').innerHTML = '💡 ' + TRUSSES[name].note;
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      draw();
    });
    wrap.appendChild(b);
  });
})();
document.getElementById('trussNote').innerHTML = '💡 ' + TRUSSES[curTruss].note;
document.getElementById('loadSlider').addEventListener('input', e => {
  load = +e.target.value;
  document.getElementById('loadVal').textContent = load + ' kN';
  draw();
});
window.addEventListener('resize', draw);
draw();

/* ---- 靜定計算器 ---- */
document.getElementById('calcBtn').addEventListener('click', () => {
  const bRaw = document.getElementById('bIn').value.trim();
  const rRaw = document.getElementById('rIn').value.trim();
  const jRaw = document.getElementById('jIn').value.trim();
  const b = +bRaw, r = +rRaw, j = +jRaw;
  if (!bRaw || !rRaw || !jRaw || !Number.isFinite(b) || !Number.isFinite(r) || !Number.isFinite(j)) {
    document.getElementById('calcResult').innerHTML =
      `<div style="background:var(--danger-light);color:#a72d2d;border-radius:8px;padding:10px 12px;margin-top:6px">請先填入 b（桿件數）、r（反力數）、j（節點數）三個數字。</div>`;
    if (typeof SoundFX !== 'undefined') SoundFX.error();
    return;
  }
  const n = b + r - 2 * j;
  let verdict, color;
  if (n < 0) { verdict = `不穩定結構(桿件不足,會垮掉)`; color = 'var(--danger)'; }
  else if (n === 0) { verdict = `靜定結構——可用基礎平衡方程式完全解出`; color = 'var(--success)'; }
  else { verdict = `靜不定結構,靜不定度 = ${n}(需用 FEA 等方法分析)`; color = 'var(--warning)'; }
  document.getElementById('calcResult').innerHTML =
    `<div style="background:var(--bg-soft);border-radius:8px;padding:10px 12px;margin-top:6px">
      n = b + r − 2j = ${b} + ${r} − 2×${j} = <strong style="font-family:var(--font-mono);font-size:16px">${n}</strong><br>
      <span style="color:${color};font-weight:700">→ ${verdict}</span></div>`;
  if (typeof SoundFX !== 'undefined') SoundFX.success();
});

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '桁架為什麼特別穩固?核心關鍵是什麼形狀?',
    options: [
      { text: '正方形', correct: false },
      { text: '三角形——唯一無法被壓變形的多邊形', correct: true,
        explain: '正確。三角形受力不會變形,所以桁架以三角形為基本單元。' },
      { text: '圓形', correct: false },
    ] },
  { question: 'Pratt 桁架受到向下載重時,它的「斜桿」處於什麼受力狀態?',
    options: [
      { text: '張力(被拉)', correct: true,
        explain: '正確。Pratt 的斜桿受張力,適合發揮鋼材的抗拉特性,最省鋼材。' },
      { text: '壓力(被壓)', correct: false },
      { text: '完全不受力', correct: false },
    ] },
  { question: '用 n = b + r − 2j 算出某桁架 n = 2,代表這個桁架?',
    options: [
      { text: '不穩定,會垮掉', correct: false },
      { text: '靜定,可直接用平衡方程式解出', correct: false },
      { text: '靜不定,靜不定度為 2,需用 FEA 等方法分析', correct: true,
        explain: '正確。n>0 為靜不定,多出的桿件讓結構更穩固,但需考慮材料變形才能求解。' },
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
        celebrateModule('ch3-truss', '桁架結構解算');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
