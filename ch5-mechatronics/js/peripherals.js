/* ============================================================
 * 機電整合的電子周邊 — 伺服馬達角度控制 + 序列埠監控 + 檢核
 * ============================================================ */

let angle = 90, displayAngle = 90;
const canvas = document.getElementById('servoCanvas');
const mon = document.getElementById('serialMon');

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 240;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h * 0.66;
  /* 伺服馬達本體 */
  ctx.fillStyle = '#1E40AF';
  ctx.fillRect(cx - 46, cy - 6, 92, 64);
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(cx - 60, cy + 6, 14, 30); ctx.fillRect(cx + 46, cy + 6, 14, 30);
  /* 角度刻度弧(0°在右、180°在左,上半圈) */
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, 74, Math.PI, 0); ctx.stroke();
  for (let a = 0; a <= 180; a += 30) {
    const rad = Math.PI - a / 180 * Math.PI;
    const x1 = cx + Math.cos(rad) * 68, y1 = cy + Math.sin(rad) * -68;
    const x2 = cx + Math.cos(rad) * 80, y2 = cy + Math.sin(rad) * -80;
    ctx.strokeStyle = '#475569';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = '#94A3B8'; ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(a + '°', cx + Math.cos(rad) * 94, cy + Math.sin(rad) * -94 + 4);
  }
  /* 伺服臂(轉到 displayAngle) */
  const rad = Math.PI - displayAngle / 180 * Math.PI;
  const armLen = 66;
  ctx.strokeStyle = '#A78BFA'; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(rad) * armLen, cy + Math.sin(rad) * -armLen);
  ctx.stroke();
  /* 轉軸 */
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '700 15px "JetBrains Mono"'; ctx.textAlign = 'center';
  ctx.fillText(Math.round(displayAngle) + '°', cx, cy + 44);
}

/* 平滑動畫到目標角度 */
function loop() {
  displayAngle += (angle - displayAngle) * 0.2;
  draw();
  if (Math.abs(angle - displayAngle) > 0.3) requestAnimationFrame(loop);
  else { displayAngle = angle; draw(); }
}

function logSerial(v) {
  const line = document.createElement('div');
  line.textContent = '> 角度 angle = ' + v;
  mon.appendChild(line);
  while (mon.children.length > 8) mon.removeChild(mon.firstChild);
  mon.scrollTop = mon.scrollHeight;
}

document.getElementById('angSlider').addEventListener('input', e => {
  angle = +e.target.value;
  document.getElementById('angVal').textContent = angle + '°';
  logSerial(angle);
  requestAnimationFrame(loop);
});
window.addEventListener('resize', draw);
draw();
logSerial(90);

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '機電整合系統「感知 → 處理 → 動作」中,負責「處理」的是?',
    options: [
      { text: '感測器', correct: false },
      { text: '控制板(執行程式做判斷)', correct: true,
        explain: '正確。感測器負責感知、控制板負責處理運算、致動器負責動作。' },
      { text: '伺服馬達', correct: false },
    ] },
  { question: '伺服馬達(Servo)和一般馬達最大的不同是什麼?',
    options: [
      { text: '伺服馬達能「精準轉到指定的角度」', correct: true,
        explain: '正確。伺服馬達可由程式控制轉到特定角度(常見 0°～180°),一般馬達只能持續轉動。' },
      { text: '伺服馬達不需要電', correct: false },
      { text: '伺服馬達只能逆時針轉', correct: false },
    ] },
  { question: '機械開關切換瞬間會快速彈跳數次,微處理器可能誤判成多次按壓。這個問題的解法稱為?',
    options: [
      { text: '去彈跳(Debounce)', correct: true,
        explain: '正確。加延遲或等待接點穩定後再讀取,稱為「去彈跳」。' },
      { text: '加大電壓', correct: false },
      { text: '把開關拆掉', correct: false },
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
        celebrateModule('ch5-peripherals', '機電整合的電子周邊');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
