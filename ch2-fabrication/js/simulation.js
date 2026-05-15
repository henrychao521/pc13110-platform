/* ============================================================
 * 虛擬模擬與分析入門 — 懸臂梁受力小實驗 + 檢核
 * ============================================================ */

let load = 30, thick = 2;       /* thick: 1 細 / 2 中 / 3 粗 */
let movedLoad = false, switchedThick = false;

/* ---- 粗細控制 ---- */
(function buildThick() {
  const wrap = document.getElementById('thickSeg');
  [[1, '細梁'], [2, '中梁'], [3, '粗梁']].forEach(([v, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    if (v === thick) b.classList.add('on');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      thick = v; switchedThick = true;
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      draw();
    });
    wrap.appendChild(b);
  });
})();

document.getElementById('loadSlider').addEventListener('input', e => {
  load = +e.target.value;
  movedLoad = true;
  draw();
});

/* ---- 繪製懸臂梁 ---- */
const canvas = document.getElementById('beamCanvas');
function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 260;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const wallX = 60, beamLen = w - 130, beamY = h * 0.38;
  const beamThick = 10 + thick * 9;

  /* 牆 */
  ctx.fillStyle = '#475569';
  ctx.fillRect(wallX - 26, beamY - 50, 26, 130);
  for (let y = beamY - 46; y < beamY + 76; y += 14) {
    ctx.strokeStyle = '#1E293B'; ctx.beginPath();
    ctx.moveTo(wallX - 26, y); ctx.lineTo(wallX - 14, y - 10); ctx.stroke();
  }

  /* 變形量:撓度 ∝ 載重 / 厚度³（真實懸臂梁剛度與厚度三次方成正比)*/
  const stiffness = Math.pow(thick, 3);
  const maxDefl = load / stiffness * 5.5;
  const overload = maxDefl > 70;

  /* 以多段四邊形畫出變形的梁 */
  const N = 40;
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N;
    const x0 = wallX + beamLen * t0, x1 = wallX + beamLen * t1;
    const d0 = maxDefl * t0 * t0, d1 = maxDefl * t1 * t1;
    /* 應力:固定端最大(彎矩最大)→ 紅,自由端 → 藍 */
    const stress = 1 - t0;
    const r = Math.round(60 + stress * 195);
    const g = Math.round(120 - stress * 70);
    const b = Math.round(220 - stress * 180);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.beginPath();
    ctx.moveTo(x0, beamY + d0);
    ctx.lineTo(x1, beamY + d1);
    ctx.lineTo(x1, beamY + d1 + beamThick);
    ctx.lineTo(x0, beamY + d0 + beamThick);
    ctx.closePath();
    ctx.fill();
  }

  /* 自由端載重箭頭 */
  const tipX = wallX + beamLen, tipY = beamY + maxDefl + beamThick;
  const arrowLen = 18 + load * 0.5;
  ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY); ctx.lineTo(tipX, tipY + arrowLen); ctx.stroke();
  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.moveTo(tipX, tipY + arrowLen + 8);
  ctx.lineTo(tipX - 6, tipY + arrowLen);
  ctx.lineTo(tipX + 6, tipY + arrowLen);
  ctx.fill();
  ctx.font = '12px "Noto Sans TC"';
  ctx.fillText(`載重 ${load}`, tipX + 10, tipY + arrowLen);

  /* 應力集中標示 */
  ctx.fillStyle = '#DC2626';
  ctx.font = '700 11px "Noto Sans TC"';
  ctx.fillText('← 應力最大（最易斷裂)', wallX + 6, beamY - 10);

  /* 統計 */
  const stat = document.getElementById('beamStat');
  if (overload) {
    if (typeof SoundFX !== 'undefined') SoundFX.warn();
    stat.innerHTML = `<div style="background:var(--danger-light);color:#a72d2d;padding:8px 12px;border-radius:8px;border-left:3px solid var(--danger)">
      ⚠ <strong>變形過大!</strong>這樣的載重對「${['細','中','粗'][thick-1]}梁」太重了,結構恐失效。
      可<strong>換用更粗的梁</strong>或<strong>減少載重</strong>——這正是模擬要先告訴我們的事。</div>`;
  } else {
    stat.innerHTML = `<div style="font-size:13px;color:var(--text-soft)">
      目前變形量:<b style="font-family:var(--font-mono)">${maxDefl.toFixed(1)}</b>　|
      梁愈粗,剛度愈大（與厚度的<strong>三次方</strong>成正比),同樣載重下變形愈小。</div>`;
  }
}
window.addEventListener('resize', draw);
draw();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '為什麼工程師要在「製造前」先用電腦做虛擬模擬?',
    options: [
      { text: '為了讓設計圖比較好看', correct: false },
      { text: '為了在投入材料與時間前,先預測並找出設計的問題（如會不會變形、斷裂)', correct: true,
        explain: '正確。模擬能在製造前預先發現問題,避免浪費與危險。' },
      { text: '因為法律規定一定要模擬', correct: false },
    ] },
  { question: '從懸臂梁實驗中,你觀察到「梁愈粗,同樣載重下變形愈小」。這說明了什麼?',
    options: [
      { text: '材料的尺寸與形狀,會大大影響結構的剛度與強度', correct: true,
        explain: '正確。結構的剛度和尺寸關係極大(懸臂梁剛度與厚度三次方成正比),這正是結構分析要量化的事。' },
      { text: '粗的梁比較重,所以比較容易壞', correct: false },
      { text: '梁的粗細跟受力完全無關', correct: false },
    ] },
];
let answered = 0;
const quizWrap = document.createElement('div');
quizWrap.className = 'activity-box';
quizWrap.innerHTML = '<span class="ab-label">🧠 觀念檢核</span><h3 style="margin-bottom:10px">完成下方 2 題即可完成第 2 章</h3><div id="simQuiz"></div>';
document.querySelector('.module-nav').before(quizWrap);
QUIZ.forEach((q, i) => {
  const box = document.createElement('div');
  box.style.marginBottom = '14px';
  document.getElementById('simQuiz').appendChild(box);
  Interactions.DiagnosisQuiz({
    container: box, question: `第 ${i + 1} 題　${q.question}`, options: q.options,
    onAnswer: () => {
      answered++;
      if (answered === QUIZ.length) {
        celebrateModule('ch2-sim', '虛擬模擬與分析入門');
        showToast('🎉 恭喜!你已完成第 2 章所有模組', 'success');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
