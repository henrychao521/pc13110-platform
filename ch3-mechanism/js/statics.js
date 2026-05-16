/* ============================================================
 * 靜力學與自由體圖 — 簡支梁反力計算器 + 檢核
 * ============================================================ */

let P = 100, aPct = 50, moved = false;
const canvas = document.getElementById('beamCanvas');

function compute() {
  const a = aPct / 100;            /* 載重位置比例(距 A) */
  const RB = P * a;
  const RA = P - RB;
  return { RA, RB, a };
}

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 280;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const x0 = 60, x1 = w - 60, beamY = h * 0.5, len = x1 - x0;
  const { RA, RB, a } = compute();
  const loadX = x0 + len * a;

  /* 梁 */
  ctx.fillStyle = '#64748B';
  ctx.fillRect(x0, beamY - 7, len, 14);

  /* A 端鉸支承(三角形) */
  ctx.fillStyle = '#C026D3';
  ctx.beginPath();
  ctx.moveTo(x0, beamY + 7); ctx.lineTo(x0 - 14, beamY + 34); ctx.lineTo(x0 + 14, beamY + 34);
  ctx.closePath(); ctx.fill();
  /* B 端滾支承(三角形 + 滾子) */
  ctx.beginPath();
  ctx.moveTo(x1, beamY + 7); ctx.lineTo(x1 - 14, beamY + 30); ctx.lineTo(x1 + 14, beamY + 30);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(x1 - 7, beamY + 36, 5, 0, 7); ctx.arc(x1 + 7, beamY + 36, 5, 0, 7); ctx.fill();
  ctx.fillStyle = '#334155'; ctx.font = '13px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText('A', x0, beamY + 54);
  ctx.fillText('B', x1, beamY + 54);

  /* 載重 P(向下箭頭) */
  const arrowLen = 30 + P * 0.35;
  ctx.strokeStyle = '#DC2626'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(loadX, beamY - 7 - arrowLen); ctx.lineTo(loadX, beamY - 9); ctx.stroke();
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(loadX, beamY - 6); ctx.lineTo(loadX - 6, beamY - 16); ctx.lineTo(loadX + 6, beamY - 16);
  ctx.fill();
  ctx.font = '700 13px "Noto Sans TC"';
  ctx.fillText('P = ' + P + ' N', loadX, beamY - 16 - arrowLen);

  /* 反力箭頭(向上,綠) */
  function reaction(x, val, label) {
    const al = 24 + val * 0.35;
    ctx.strokeStyle = '#16A34A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, beamY + 40 + al); ctx.lineTo(x, beamY + 42); ctx.stroke();
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.moveTo(x, beamY + 38); ctx.lineTo(x - 6, beamY + 48); ctx.lineTo(x + 6, beamY + 48);
    ctx.fill();
    ctx.font = '700 12px "Noto Sans TC"';
    ctx.fillText(label + '=' + val.toFixed(0) + 'N', x, beamY + 56 + al);
  }
  reaction(x0, RA, 'Rₐ');
  reaction(x1, RB, 'Rᵦ');
}

function refresh() {
  const { RA, RB } = compute();
  document.getElementById('pVal').textContent = P + ' N';
  document.getElementById('aVal').textContent = aPct + '%';
  document.getElementById('raVal').textContent = RA.toFixed(1) + ' N';
  document.getElementById('rbVal').textContent = RB.toFixed(1) + ' N';
  const closer = aPct < 50 ? 'A' : aPct > 50 ? 'B' : '正中央';
  document.getElementById('beamNote').innerHTML = aPct === 50
    ? '載重在正中央,兩端反力相等(各分擔一半)。'
    : `載重較靠近 ${closer} 端,所以 ${closer} 端反力較大——離支點越近,分擔越多。`;
  draw();
}

document.getElementById('pSlider').addEventListener('input', e => { P = +e.target.value; moved = true; refresh(); });
document.getElementById('aSlider').addEventListener('input', e => { aPct = +e.target.value; moved = true; refresh(); });
window.addEventListener('resize', draw);
refresh();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '結構分析中,被描述為「第一步、也是最重要的一步」的是什麼?',
    options: [
      { text: '繪製自由體圖(FBD)', correct: true, explain: '正確。先把物體分離出來、畫出所有外力,後面才能計算。' },
      { text: '計算材料的降伏強度', correct: false },
      { text: '進行網格劃分', correct: false },
    ] },
  { question: '若物體處於靜止平衡狀態,下列何者正確?',
    options: [
      { text: '淨力大於零,淨力矩等於零', correct: false },
      { text: '淨力與淨力矩「都」等於零(ΣF=0 且 ΣM=0)', correct: true,
        explain: '正確。靜止平衡的條件是淨力為零、且對任一點的淨力矩也為零。' },
      { text: '只要淨力為零即可,力矩不必管', correct: false },
    ] },
  { question: '在反力計算器中,當你把載重從中央往 A 端移動,會觀察到什麼?',
    options: [
      { text: 'Rₐ 變大、Rᵦ 變小', correct: true,
        explain: '正確。載重越靠近 A,A 端分擔越多;由力矩平衡 Rᵦ=P·a/L 可推得。' },
      { text: '兩端反力都不變', correct: false },
      { text: 'Rₐ 變小、Rᵦ 變大', correct: false },
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
        celebrateModule('ch3-statics', '靜力學與自由體圖');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
