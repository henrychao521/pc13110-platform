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

/* ---- 節點法逐步解算 ----
 * 幾何自我驗算:斜桿長 = √(2² + 1.5²) = 2.5 m → sinθ = 1.5/2.5 = 0.6、cosθ = 2/2.5 = 0.8
 * ΣFy = 0:50 + F_AB·0.6 = 0 → F_AB = −83.33 kN(負 → 壓力)
 * ΣFx = 0:F_AB·0.8 + F_BC = 0 → F_BC = +66.67 kN(正 → 張力)
 */
(() => {
  if (!document.getElementById('mjStep1')) return;
  const SIN = 0.6, COS = 0.8;
  const ANS_AB = 50 / SIN;        /* 83.33 kN,壓力 */
  const ANS_BC = ANS_AB * COS;    /* 66.67 kN,張力 */
  const TOL = 2;
  const choice = { 2: null, 3: null };

  function bindChoice(id, key) {
    const wrap = document.getElementById(id);
    wrap.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        choice[key] = b.dataset.tc;
        if (typeof SoundFX !== 'undefined') SoundFX.click();
      });
    });
  }
  bindChoice('mjTc2', 2);
  bindChoice('mjTc3', 3);

  function feedback(id, ok, html) {
    const el = document.getElementById(id);
    el.className = 'mj-fb ' + (ok ? 'good' : 'bad');
    el.innerHTML = html;
    if (typeof SoundFX !== 'undefined') (ok ? SoundFX.success() : SoundFX.error());
  }
  function unlock(id) {
    const el = document.getElementById(id);
    el.classList.remove('locked');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function lockStep(stepId, inputId, tcId, checkId) {
    document.getElementById(stepId).classList.add('ok');
    document.getElementById(inputId).disabled = true;
    document.getElementById(checkId).disabled = true;
    document.getElementById(tcId).querySelectorAll('button').forEach(b => { b.disabled = true; });
  }

  document.getElementById('mjNext1').addEventListener('click', () => {
    document.getElementById('mjStep1').classList.add('ok');
    document.getElementById('mjNext1').disabled = true;
    if (typeof SoundFX !== 'undefined') SoundFX.pop();
    unlock('mjStep2');
  });

  document.getElementById('mjCheck2').addEventListener('click', () => {
    const raw = document.getElementById('mjIn2').value.trim();
    const v = Math.abs(parseFloat(raw));
    if (!raw || !Number.isFinite(v)) {
      feedback('mjFb2', false, '請先填入 F<sub>AB</sub> 的大小(kN)。'); return;
    }
    const numOK = Math.abs(v - ANS_AB) <= TOL;
    if (!numOK) {
      feedback('mjFb2', false,
        `再算一次——由 50 + F<sub>AB</sub> × 0.6 = 0,把 F<sub>AB</sub> 移項解出來:F<sub>AB</sub> = −50 ÷ 0.6。大小取絕對值填入。`);
      return;
    }
    if (!choice[2]) {
      feedback('mjFb2', false, '數值正確!還要選它是「張力」還是「壓力」——想想解出來的正負號代表什麼。'); return;
    }
    if (choice[2] !== 'C') {
      feedback('mjFb2', false,
        `數值對了,但方向再想想:解出 F<sub>AB</sub> = <strong>−83.3 kN</strong> 是「負值」,
        代表實際方向與我們的「張力假設」相反——所以它其實是?`);
      return;
    }
    feedback('mjFb2', true,
      `✓ 正確!ΣF<sub>y</sub> = 0:50 + F<sub>AB</sub> × 0.6 = 0 → F<sub>AB</sub> = −50 ÷ 0.6 = <strong>−83.3 kN</strong>。
      負號代表與張力假設相反 → 斜桿 AB 承受 <strong>83.3 kN 的壓力</strong>。`);
    lockStep('mjStep2', 'mjIn2', 'mjTc2', 'mjCheck2');
    unlock('mjStep3');
  });

  document.getElementById('mjCheck3').addEventListener('click', () => {
    const raw = document.getElementById('mjIn3').value.trim();
    const v = Math.abs(parseFloat(raw));
    if (!raw || !Number.isFinite(v)) {
      feedback('mjFb3', false, '請先填入 F<sub>BC</sub> 的大小(kN)。'); return;
    }
    const numOK = Math.abs(v - ANS_BC) <= TOL;
    if (!numOK) {
      feedback('mjFb3', false,
        `再算一次——把 F<sub>AB</sub> = −83.3 代入 F<sub>AB</sub> × 0.8 + F<sub>BC</sub> = 0,
        得 F<sub>BC</sub> = 83.3 × 0.8。`);
      return;
    }
    if (!choice[3]) {
      feedback('mjFb3', false, '數值正確!還要選它是「張力」還是「壓力」——這次解出來是正值還是負值?'); return;
    }
    if (choice[3] !== 'T') {
      feedback('mjFb3', false,
        `數值對了,但方向再想想:F<sub>BC</sub> = +66.7 kN 是「正值」,代表與張力假設<strong>相同</strong>——所以它是?`);
      return;
    }
    feedback('mjFb3', true,
      `✓ 正確!ΣF<sub>x</sub> = 0:(−83.3) × 0.8 + F<sub>BC</sub> = 0 → F<sub>BC</sub> = <strong>+66.7 kN</strong>。
      正號代表與張力假設相同 → 下弦桿 BC 承受 <strong>66.7 kN 的張力</strong>。`);
    lockStep('mjStep3', 'mjIn3', 'mjTc3', 'mjCheck3');
    unlock('mjDone');
    if (typeof SoundFX !== 'undefined') setTimeout(() => SoundFX.win(), 400);
  });
})();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '桁架為什麼特別穩固?核心關鍵是什麼形狀?',
    options: [
      { text: '正方形', correct: false },
      { text: '三角形——三邊長度固定後,形狀就唯一確定(不會歪斜)的多邊形', correct: true,
        explain: '正確。三角形三邊長度固定後形狀就不會歪斜,所以桁架以三角形為基本單元。' },
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
// 答錯時看完解說後重出題，全部答對才算完成（原本答錯也計入完成，檢核形同虛設）
const quizCorrect = new Set();
QUIZ.forEach((q, i) => {
  const box = document.createElement('div');
  box.style.marginBottom = '14px';
  document.getElementById('quizArea').appendChild(box);
  renderQuizQ(i, box);
});
function renderQuizQ(i, box) {
  Interactions.DiagnosisQuiz({
    container: box, question: `第 ${i + 1} 題　${QUIZ[i].question}`, options: QUIZ[i].options,
    onAnswer: (correct) => {
      if (!correct) {
        if (typeof showToast === 'function') showToast('看完解說後再挑戰一次，答對才算通過', 'warn');
        setTimeout(() => renderQuizQ(i, box), 3500);
        return;
      }
      quizCorrect.add(i);
      if (quizCorrect.size === QUIZ.length) {
        celebrateModule('ch3-truss', '桁架結構解算');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
}
