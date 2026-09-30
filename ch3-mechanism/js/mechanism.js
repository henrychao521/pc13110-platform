/* ============================================================
 * 機構類型與運動 — 四種機構動畫(曲柄滑塊/凸輪/齒輪/日內瓦)
 * ============================================================ */

const MECHS = {
  '曲柄滑塊': '曲柄滑塊機構:馬達帶動「曲柄」旋轉,透過「連桿」推動「滑塊」做來回直線運動。汽車引擎的活塞、空氣壓縮機,都用這個機構把旋轉變成直線。',
  '凸輪從動件': '凸輪機構:形狀不規則的「凸輪」旋轉時,推動上方的「從動件」上下移動。凸輪的輪廓決定了從動件的運動規律,引擎的汽門就是凸輪控制的。',
  '齒輪系': '齒輪系:兩個齒輪互相咬合,旋轉方向相反。齒數少的轉得快、齒數多的轉得慢——「齒數比」決定了轉速與扭力的轉換。',
  '日內瓦機構': '日內瓦機構:驅動輪「連續旋轉」,但輸出的日內瓦輪卻是「間歇旋轉」——轉一下、停一下。電影放映機、轉盤式設備都靠它做定格前進。',
};
let curMech = '曲柄滑塊', running = true, speed = 1, theta = 0;
const canvas = document.getElementById('mechCanvas');

/* 齒輪路徑 */
function gearPath(ctx, cx, cy, R, r, teeth, rot) {
  ctx.beginPath();
  const seg = Math.PI * 2 / teeth;
  let first = true;
  for (let i = 0; i < teeth; i++) {
    const a = i * seg + rot;
    [[r,0],[R,.12],[R,.38],[r,.5],[r,.98]].forEach(([rad,f]) => {
      const ang = a + seg * f;
      const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    });
  }
  ctx.closePath();
}

function setup() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 300;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function drawCrankSlider(ctx, w, h) {
  const O = { x: w * 0.3, y: h * 0.5 };
  const r = 52, L = 150;
  const P = { x: O.x + Math.cos(theta) * r, y: O.y + Math.sin(theta) * r };
  const dy = P.y - O.y;
  const sx = P.x + Math.sqrt(Math.max(0, L * L - dy * dy));
  /* 滑軌 */
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
  ctx.strokeRect(O.x + r + 20, O.y - 22, w - (O.x + r + 20) - 20, 44);
  /* 曲柄 */
  ctx.strokeStyle = '#C026D3'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(P.x, P.y); ctx.stroke();
  /* 連桿 */
  ctx.strokeStyle = '#22D3EE'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(sx, O.y); ctx.stroke();
  /* 滑塊 */
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(sx - 22, O.y - 18, 44, 36);
  /* 樞紐 */
  ctx.fillStyle = '#E2E8F0';
  [[O.x,O.y],[P.x,P.y],[sx,O.y]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(x,y,6,0,7); ctx.fill(); });
  ctx.fillStyle = '#fff'; ctx.font = '12px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText('旋轉輸入', O.x, O.y + r + 34);
  ctx.fillText('↔ 直線輸出', sx, O.y - 30);
}

function drawCam(ctx, w, h) {
  const C = { x: w * 0.4, y: h * 0.62 };
  const R = 46, e = 26;                       /* 偏心圓凸輪 */
  const center = { x: C.x + Math.cos(theta) * e, y: C.y + Math.sin(theta) * e };
  /* 滾子(半徑 11)中心固定在導軌中線上,與凸輪輪廓相切:到凸輪圓心距離 = R + 11 */
  const dx = center.x - C.x;
  const followerBottom = center.y - Math.sqrt((R + 11) * (R + 11) - dx * dx);
  /* 凸輪 */
  ctx.fillStyle = '#C026D3';
  ctx.beginPath(); ctx.arc(center.x, center.y, R, 0, 7); ctx.fill();
  /* 凸輪轉軸 */
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath(); ctx.arc(C.x, C.y, 7, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(center.x, center.y); ctx.stroke();
  /* 從動件(垂直桿) */
  ctx.fillStyle = '#22D3EE';
  ctx.fillRect(C.x - 9, followerBottom - 80, 18, 80);
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath(); ctx.arc(C.x, followerBottom, 11, 0, 7); ctx.fill();
  /* 導軌 */
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
  ctx.strokeRect(C.x - 16, h * 0.05, 32, followerBottom - 80 - h * 0.05 + 4);
  ctx.fillStyle = '#fff'; ctx.font = '12px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText('凸輪旋轉', C.x, C.y + 34);
  ctx.fillText('↕ 從動件升降', C.x, h * 0.05 - 6);
}

function drawGears(ctx, w, h) {
  const tA = 14, tB = 22;
  const RA = 56, RB = RA * tB / tA;
  const A = { x: w * 0.36, y: h * 0.5 };
  const B = { x: A.x + RA + RB - 8, y: h * 0.5 };
  /* A 驅動 */
  gearPath(ctx, A.x, A.y, RA, RA * 0.78, tA, theta);
  ctx.fillStyle = '#C026D3'; ctx.fill();
  /* B 從動,反向、較慢 */
  gearPath(ctx, B.x, B.y, RB, RB * 0.82, tB, -theta * tA / tB + 0.2);
  ctx.fillStyle = '#22D3EE'; ctx.fill();
  [[A,RA],[B,RB]].forEach(([c]) => {
    ctx.fillStyle = '#0F172A'; ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, 7); ctx.fill();
  });
  ctx.fillStyle = '#fff'; ctx.font = '12px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText('驅動 ' + tA + ' 齒(快)', A.x, A.y + RA + 22);
  ctx.fillText('從動 ' + tB + ' 齒(慢)', B.x, B.y + RB + 22);
}

function drawGeneva(ctx, w, h) {
  /* 6 槽日內瓦機構的真實幾何:中心距 C、撥銷半徑 a = C·sin30°、槽口半徑 b = C·cos30°,
     撥銷在驅動輪轉到兩輪連心線 ±60° 範圍內才進入槽中,把日內瓦輪撥過 60°,其餘時間日內瓦輪靜止 */
  const C = Math.min(120, h * 0.4);
  const a = C * 0.5, b = C * Math.sqrt(3) / 2;
  const D = { x: w * 0.5 - C * 0.5, y: h * 0.5 };   /* 驅動輪 */
  const G = { x: D.x + C, y: h * 0.5 };             /* 日內瓦輪 */
  const step = Math.PI / 3;                          /* 6 槽,每步 60° */
  const t = Math.atan2(Math.sin(theta), Math.cos(theta));   /* 撥銷相對連心線的角度 −π~π */
  const n = Math.floor((theta + Math.PI) / (Math.PI * 2)); /* 已完成的撥動次數 */
  let delta = 0;                                     /* 本次撥動已轉過的角度(0 → −60°) */
  if (t > step) delta = -step;
  else if (t >= -step) {
    const psi = Math.atan2(a * Math.sin(t), a * Math.cos(t) - C);        /* 撥銷相對日內瓦輪中心的方位 */
    const psi0 = Math.atan2(a * Math.sin(-step), a * Math.cos(-step) - C);
    let d = psi - psi0; while (d > 0) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    delta = d;
  }
  const gAngle = -n * step + delta;
  const slot0 = -5 * Math.PI / 6;                    /* 靜止時有一個槽口正對撥銷進入的位置 */
  const R = b * 1.02, pinR = 7, lockR = C * 0.32;
  /* 日內瓦輪:圓盤 + 6 條徑向槽 + 槽間的鎖止凹弧 */
  ctx.save();
  ctx.translate(G.x, G.y); ctx.rotate(gAngle);
  ctx.fillStyle = '#22D3EE';
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0F172A';
  for (let i = 0; i < 6; i++) {
    const ang = slot0 + i * step;
    ctx.save(); ctx.rotate(ang);
    ctx.fillRect(C - a - pinR - 2, -pinR - 2, R - (C - a - pinR - 2) + 2, (pinR + 2) * 2);   /* 槽 */
    ctx.restore();
    const lk = ang + step / 2;                       /* 鎖止凹弧(驅動輪鎖止圓盤卡在這裡) */
    ctx.beginPath(); ctx.arc(Math.cos(lk) * C, Math.sin(lk) * C, lockR, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#E2E8F0'; ctx.beginPath(); ctx.arc(G.x, G.y, 8, 0, 7); ctx.fill();
  /* 驅動輪(連續旋轉):臂 + 撥銷 */
  ctx.fillStyle = '#C026D3';
  ctx.beginPath(); ctx.arc(D.x, D.y, lockR - 3, 0, 7); ctx.fill();
  const pin = { x: D.x + Math.cos(theta) * a, y: D.y + Math.sin(theta) * a };
  ctx.strokeStyle = '#C026D3'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(D.x, D.y); ctx.lineTo(pin.x, pin.y); ctx.stroke();
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath(); ctx.arc(pin.x, pin.y, pinR, 0, 7); ctx.fill();
  ctx.fillStyle = '#0F172A'; ctx.beginPath(); ctx.arc(D.x, D.y, 6, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '12px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText('連續旋轉', D.x - a - 10, h - 16);
  ctx.fillText('間歇旋轉', G.x + 10, h - 16);
}

const DRAW = { '曲柄滑塊': drawCrankSlider, '凸輪從動件': drawCam, '齒輪系': drawGears, '日內瓦機構': drawGeneva };

let needsDraw = true; // 暫停時不必每幀全幅重繪，只有狀態變了才畫
function frame() {
  if (running || needsDraw) {
    needsDraw = false;
    const { ctx, w, h } = setup();
    (DRAW[curMech] || drawCrankSlider)(ctx, w, h);
    if (running) theta += 0.03 * speed;
  }
  requestAnimationFrame(frame);
}
frame();
window.addEventListener('resize', () => { needsDraw = true; });

(function buildSeg() {
  const wrap = document.getElementById('mechSeg');
  Object.keys(MECHS).forEach((name, i) => {
    const b = document.createElement('button');
    b.textContent = name;
    if (i === 0) b.classList.add('on');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      curMech = name; theta = 0; needsDraw = true;
      document.getElementById('mechNote').textContent = '💡 ' + MECHS[name];
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
    wrap.appendChild(b);
  });
})();
document.getElementById('mechNote').textContent = '💡 ' + MECHS[curMech];
document.getElementById('playBtn').addEventListener('click', e => {
  running = !running;
  e.target.textContent = running ? '⏸ 暫停' : '▶ 播放';
});
document.getElementById('speedSlider').addEventListener('input', e => { speed = +e.target.value; });

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '機構最主要的功能是什麼?',
    options: [
      { text: '傳遞與「轉換」運動——把一種運動形式變成另一種', correct: true,
        explain: '正確。馬達只提供旋轉,機構負責轉換成推、拉、升降、間歇等所需運動。' },
      { text: '儲存電能', correct: false,
        explain: '儲存電能是電池的功能；機構負責傳遞並轉換運動。' },
      { text: '產生熱量', correct: false,
        explain: '產生熱量不是機構的目的（摩擦生熱反而是損耗）；機構的功能是傳遞與轉換運動。' },
    ] },
  { question: '汽車引擎把活塞的「直線往復運動」與曲軸的「旋轉」互相轉換,用的是哪種機構?',
    options: [
      { text: '日內瓦機構', correct: false,
        explain: '日內瓦機構是把連續旋轉變成間歇旋轉，不是直線與旋轉互換。' },
      { text: '曲柄滑塊機構', correct: true,
        explain: '正確。曲柄滑塊把旋轉↔直線互相轉換,是引擎活塞的核心機構。' },
      { text: '齒輪齒條', correct: false,
        explain: '齒輪齒條也能讓旋轉與直線互換，但引擎活塞是經連桿接到曲軸，屬於曲柄滑塊機構。' },
    ] },
  { question: '日內瓦機構的特點是什麼?',
    options: [
      { text: '把連續旋轉轉換成「間歇旋轉」(轉一下、停一下)', correct: true,
        explain: '正確。日內瓦機構輸入連續、輸出間歇,常用於定格前進的場合。' },
      { text: '把旋轉變成連續的等速旋轉', correct: false,
        explain: '日內瓦機構的輸出是轉一下、停一下的間歇旋轉，不是連續旋轉。' },
      { text: '完全不會輸出任何運動', correct: false,
        explain: '日內瓦機構有輸出，只是輸出是間歇的。' },
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
    onRetry: () => renderQuizQ(i, box),
    onAnswer: (correct) => {
      if (!correct) return;   /* 答錯:解說下方的「再試一次」由學生自己按 */
      quizCorrect.add(i);
      if (quizCorrect.size === QUIZ.length) {
        celebrateModule('ch3-mechanism', '機構類型與運動');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
}
