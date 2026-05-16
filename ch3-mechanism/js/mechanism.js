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
  const followerBottom = center.y - R;
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
  ctx.fillRect(C.x - 9, followerBottom - 90, 18, 90);
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath(); ctx.arc(C.x, followerBottom, 11, 0, 7); ctx.fill();
  /* 導軌 */
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
  ctx.strokeRect(C.x - 16, h * 0.05, 32, followerBottom - 90 - h * 0.05 + 4);
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
  const D = { x: w * 0.34, y: h * 0.5 };       /* 驅動輪 */
  const G = { x: w * 0.64, y: h * 0.5 };       /* 日內瓦輪 */
  const rev = theta / (Math.PI * 2);
  const fullRevs = Math.floor(rev);
  const phase = rev - fullRevs;
  const step = Math.PI * 2 / 6;                /* 6 槽,每步 60° */
  let adv = phase < 0.3 ? (phase / 0.3) : 1;
  adv = adv < 0.5 ? 2*adv*adv : 1 - Math.pow(-2*adv+2,2)/2;   /* 平滑 */
  const gAngle = fullRevs * step + adv * step;
  /* 日內瓦輪(六角盤 + 槽) */
  ctx.save();
  ctx.translate(G.x, G.y); ctx.rotate(gAngle);
  ctx.fillStyle = '#22D3EE';
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = i * step;
    ctx.lineTo(Math.cos(a) * 60, Math.sin(a) * 60);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#0F172A';
  for (let i = 0; i < 6; i++) {
    const a = i * step + step / 2;
    ctx.beginPath(); ctx.arc(Math.cos(a) * 58, Math.sin(a) * 58, 8, 0, 7); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#E2E8F0'; ctx.beginPath(); ctx.arc(G.x, G.y, 9, 0, 7); ctx.fill();
  /* 驅動輪(連續旋轉)+ 撥銷 */
  ctx.fillStyle = '#C026D3';
  ctx.beginPath(); ctx.arc(D.x, D.y, 30, 0, 7); ctx.fill();
  const pin = { x: D.x + Math.cos(theta) * 44, y: D.y + Math.sin(theta) * 44 };
  ctx.strokeStyle = '#C026D3'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(D.x, D.y); ctx.lineTo(pin.x, pin.y); ctx.stroke();
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath(); ctx.arc(pin.x, pin.y, 8, 0, 7); ctx.fill();
  ctx.fillStyle = '#0F172A'; ctx.beginPath(); ctx.arc(D.x, D.y, 8, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '12px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText('連續旋轉', D.x, D.y + 48);
  ctx.fillText('間歇旋轉', G.x, G.y + 78);
}

const DRAW = { '曲柄滑塊': drawCrankSlider, '凸輪從動件': drawCam, '齒輪系': drawGears, '日內瓦機構': drawGeneva };

function frame() {
  const { ctx, w, h } = setup();
  (DRAW[curMech] || drawCrankSlider)(ctx, w, h);
  if (running) theta += 0.03 * speed;
  requestAnimationFrame(frame);
}
frame();

(function buildSeg() {
  const wrap = document.getElementById('mechSeg');
  Object.keys(MECHS).forEach((name, i) => {
    const b = document.createElement('button');
    b.textContent = name;
    if (i === 0) b.classList.add('on');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      curMech = name; theta = 0;
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
      { text: '儲存電能', correct: false },
      { text: '產生熱量', correct: false },
    ] },
  { question: '汽車引擎把活塞的「直線往復運動」與曲軸的「旋轉」互相轉換,用的是哪種機構?',
    options: [
      { text: '日內瓦機構', correct: false },
      { text: '曲柄滑塊機構', correct: true,
        explain: '正確。曲柄滑塊把旋轉↔直線互相轉換,是引擎活塞的核心機構。' },
      { text: '齒輪齒條', correct: false },
    ] },
  { question: '日內瓦機構的特點是什麼?',
    options: [
      { text: '把連續旋轉轉換成「間歇旋轉」(轉一下、停一下)', correct: true,
        explain: '正確。日內瓦機構輸入連續、輸出間歇,常用於定格前進的場合。' },
      { text: '把旋轉變成連續的等速旋轉', correct: false },
      { text: '完全不會輸出任何運動', correct: false },
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
        celebrateModule('ch3-mechanism', '機構類型與運動');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
