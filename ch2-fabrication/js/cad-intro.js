/* ============================================================
 * 為什麼需要 CAD — 手繪 vs CAD 模擬動畫 + 應用圖鑑 + 檢核
 * ============================================================ */

/* ---- 種子亂數(穩定抖動,不閃爍) ---- */
function srand(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5; return x - Math.floor(x); }

const RECT_H = 78;

/* ---- 任務定義 ---- */
const TASKS = [
  { name: '加大寬度',
    before: { rectW: 112, holeDX: 30, holeDY: 26, scale: 1, copies: 1 },
    after:  { rectW: 168, holeDX: 30, holeDY: 26, scale: 1, copies: 1 },
    handUnits: 8, cadUnits: 1,
    handNote: '必須找出那一邊、擦掉,再依尺規一筆一筆重畫。',
    cadNote: '直接修改寬度的「尺寸數值」,圖面立刻自動更新。',
    takeaway: 'CAD 的尺寸是「參數」——改數字就改圖,這就是參數化設計。' },
  { name: '修正圓孔位置',
    before: { rectW: 130, holeDX: 26, holeDY: 24, scale: 1, copies: 1 },
    after:  { rectW: 130, holeDX: 96, holeDY: 52, scale: 1, copies: 1 },
    handUnits: 14, cadUnits: 2,
    handNote: '橡皮擦難以擦淨,紙面留下髒污與凹痕。',
    cadNote: '選取圓孔、輸入新座標,圖面乾淨如新。',
    takeaway: '手繪修改會「留下痕跡」;CAD 的修改乾淨、可逆、不留殘影。' },
  { name: '整體縮小',
    before: { rectW: 140, holeDX: 36, holeDY: 30, scale: 1, copies: 1 },
    after:  { rectW: 140, holeDX: 36, holeDY: 30, scale: 0.6, copies: 1 },
    handUnits: 30, cadUnits: 1,
    handNote: '幾乎等於整張圖重畫,每條線都要重新換算比例。',
    cadNote: '一個「縮放」指令,電腦精準完成所有換算。',
    takeaway: 'CAD 由電腦運算定義尺寸,縮放、陣列都不會累積誤差。' },
  { name: '複製給同學',
    before: { rectW: 96, holeDX: 24, holeDY: 22, scale: 0.84, copies: 1 },
    after:  { rectW: 96, holeDX: 24, holeDY: 22, scale: 0.84, copies: 2 },
    handUnits: 20, cadUnits: 1,
    handNote: '重新描圖會失真——複製出的第二份,和原稿長得不一樣。',
    cadNote: '複製數位檔案,第二份與原稿完全相同,且都能繼續編輯。',
    takeaway: '數位檔案易於保存與複製,這是紙本永遠做不到的。' },
];

/* ---- 取得零件位置 ---- */
function getParts(st, w, h) {
  const pw = st.rectW * st.scale, ph = RECT_H * st.scale;
  if (st.copies >= 2) {
    const gap = 16, total = pw * 2 + gap, x0 = w / 2 - total / 2;
    return [{ x: x0, y: h / 2 - ph / 2, pw, ph },
            { x: x0 + pw + gap, y: h / 2 - ph / 2, pw, ph }];
  }
  return [{ x: w / 2 - pw / 2, y: h / 2 - ph / 2, pw, ph }];
}

/* ---- 手繪風格繪製 ---- */
function sketchSeg(ctx, x1, y1, x2, y2, seed, amp) {
  for (let s = 0; s < 2; s++) {
    ctx.beginPath();
    const steps = 7;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const jx = (srand(seed + i * 3 + s * 50) - 0.5) * amp;
      const jy = (srand(seed + i * 3 + s * 50 + 7) - 0.5) * amp;
      const px = x1 + (x2 - x1) * t + jx, py = y1 + (y2 - y1) * t + jy;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
}
function sketchRect(ctx, x, y, w, h, prog, seed, amp) {
  const corners = [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];
  const total = 4, drawn = prog * total;
  for (let i = 0; i < 4; i++) {
    if (drawn <= i) break;
    const f = Math.min(1, drawn - i);
    const [ax, ay] = corners[i], [bx, by] = corners[i + 1];
    sketchSeg(ctx, ax, ay, ax + (bx - ax) * f, ay + (by - ay) * f, seed + i * 17, amp);
  }
}
function sketchCircle(ctx, cx, cy, r, prog, seed, amp) {
  if (prog <= 0) return;
  for (let s = 0; s < 2; s++) {
    ctx.beginPath();
    const steps = 28, end = Math.floor(steps * prog);
    for (let i = 0; i <= end; i++) {
      const a = i / steps * Math.PI * 2;
      const jr = r + (srand(seed + i + s * 40) - 0.5) * amp;
      const px = cx + Math.cos(a) * jr, py = cy + Math.sin(a) * jr;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
}
function drawSketch(ctx, w, h, st, prog) {
  const parts = getParts(st, w, h);
  ctx.strokeStyle = '#6B7280'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  parts.forEach((p, idx) => {
    const amp = idx === 1 ? 6.5 : 2.6;            /* 第二份(複製)抖動更大=失真 */
    const rectProg = Math.min(1, prog * 1.5);
    const holeProg = Math.max(0, Math.min(1, (prog - 0.62) / 0.38));
    sketchRect(ctx, p.x, p.y, p.pw, p.ph, rectProg, idx * 900 + 10, amp);
    sketchCircle(ctx, p.x + st.holeDX * st.scale, p.y + st.holeDY * st.scale,
      11 * st.scale, holeProg, idx * 900 + 400, amp);
  });
}

/* ---- CAD 風格繪製 ---- */
function drawCAD(ctx, w, h, st, copy2) {
  const parts = getParts(st, w, h);
  parts.forEach((p, idx) => {
    ctx.save();
    if (idx === 1) ctx.globalAlpha = copy2;
    ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.roundRect(p.x, p.y, p.pw, p.ph, 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(p.x + st.holeDX * st.scale, p.y + st.holeDY * st.scale, 11 * st.scale, 0, Math.PI * 2);
    ctx.stroke();
    /* 尺寸標註線 */
    ctx.strokeStyle = '#93C5FD'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 9); ctx.lineTo(p.x + p.pw, p.y - 9);
    ctx.stroke();
    ctx.fillStyle = '#3B82F6'; ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(p.pw) + '', p.x + p.pw / 2, p.y - 12);
    ctx.restore();
  });
}

/* ---- Canvas 設定 ---- */
function setupCv(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 180;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

/* ---- 動畫 ---- */
const HAND_A = 26, HAND_B = 62, HAND_END = 156;
const CAD_A = 16, CAD_END = 46;
let curTask = 0, cleared = 0, animating = false;
const handCv = document.getElementById('handCanvas');
const cadCv = document.getElementById('cadCanvas');
let smudges = [];

function lerp(a, b, t) { return a + (b - a) * t; }
function lerpState(A, B, t) {
  return {
    rectW: lerp(A.rectW, B.rectW, t), holeDX: lerp(A.holeDX, B.holeDX, t),
    holeDY: lerp(A.holeDY, B.holeDY, t), scale: lerp(A.scale, B.scale, t),
    copies: B.copies,
  };
}

function prepareSmudges(task) {
  smudges = [];
  const s = setupCv(handCv);
  const parts = getParts(task.before, s.w, s.h);
  const p = parts[0];
  for (let i = 0; i < 18; i++) {
    smudges.push({
      x: p.x - 8 + srand(i * 5 + 1) * (p.pw + 16),
      y: p.y - 8 + srand(i * 5 + 2) * (p.ph + 16),
      rx: 5 + srand(i * 5 + 3) * 9, ry: 3 + srand(i * 5 + 4) * 6,
      rot: srand(i * 5 + 5) * 3,
    });
  }
}

function drawSmudges(ctx, count, alpha) {
  ctx.fillStyle = `rgba(120,120,120,${alpha})`;
  for (let i = 0; i < count && i < smudges.length; i++) {
    const m = smudges[i];
    ctx.save();
    ctx.translate(m.x, m.y); ctx.rotate(m.rot);
    ctx.beginPath(); ctx.ellipse(0, 0, m.rx, m.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function renderHand(frame, task) {
  const s = setupCv(handCv);
  const { ctx, w, h } = s;
  if (frame <= HAND_A) {
    drawSketch(ctx, w, h, task.before, 1);
  } else if (frame <= HAND_B) {
    drawSketch(ctx, w, h, task.before, 1);
    const ep = (frame - HAND_A) / (HAND_B - HAND_A);
    drawSmudges(ctx, Math.floor(ep * 18), 0.5);
  } else {
    drawSmudges(ctx, 18, 0.2);
    const rp = Math.min(1, (frame - HAND_B) / (HAND_END - HAND_B));
    drawSketch(ctx, w, h, task.after, rp);
  }
}
function renderCAD(frame, task) {
  const s = setupCv(cadCv);
  const { ctx, w, h } = s;
  if (frame <= CAD_A) {
    drawCAD(ctx, w, h, task.before, 0);
  } else {
    let t = Math.min(1, (frame - CAD_A) / (CAD_END - CAD_A));
    t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;  /* ease */
    const st = lerpState(task.before, task.after, t);
    drawCAD(ctx, w, h, st, task.after.copies === 2 ? t : 0);
  }
}

function runTask(idx) {
  if (animating) return;
  animating = true;
  curTask = idx;
  const task = TASKS[idx];
  prepareSmudges(task);
  document.getElementById('taskResult').innerHTML = '';
  document.querySelectorAll('#taskChips button').forEach((b, i) =>
    b.classList.toggle('on', i === idx));
  const handT = document.getElementById('handTime');
  const cadT = document.getElementById('cadTime');
  let frame = 0;
  if (typeof SoundFX !== 'undefined') SoundFX.click();
  const timer = setInterval(() => {
    frame++;
    renderHand(frame, task);
    renderCAD(frame, task);
    /* 狀態文字 */
    if (frame <= HAND_A) handT.textContent = '原圖（已存在)';
    else if (frame <= HAND_B) handT.textContent = '✏️ 擦拭中…';
    else if (frame < HAND_END) handT.textContent = '✏️ 重新描繪中…';
    else handT.textContent = `✓ 完成・耗時 ${task.handUnits} 單位`;
    if (frame <= CAD_A) cadT.textContent = '原圖';
    else if (frame < CAD_END) cadT.textContent = '🖥️ 指令修改中…';
    else cadT.textContent = `✓ 完成・耗時 ${task.cadUnits} 單位`;
    if (typeof SoundFX !== 'undefined' && frame % 6 === 0 && frame < HAND_END) SoundFX.tick();

    if (frame >= HAND_END) {
      clearInterval(timer);
      animating = false;
      finishTask(idx, task);
    }
  }, 38);
}

function finishTask(idx, task) {
  if (typeof SoundFX !== 'undefined') SoundFX.success();
  const chip = document.querySelectorAll('#taskChips button')[idx];
  if (!chip.classList.contains('cleared')) { chip.classList.add('cleared'); cleared++; }
  document.getElementById('taskResult').innerHTML = `
    <div style="background:#FFF7ED;border-left:3px solid #D97706;padding:7px 11px;border-radius:6px;margin-bottom:4px">
      ✏️ <strong>手繪</strong>:${task.handNote}</div>
    <div style="background:var(--theme-light);border-left:3px solid var(--theme);padding:7px 11px;border-radius:6px;margin-bottom:6px">
      🖥️ <strong>CAD</strong>:${task.cadNote}</div>
    <div style="font-weight:700;color:var(--theme-dark)">💡 ${task.takeaway}</div>`;
  if (cleared >= TASKS.length && !quizBuilt) {
    if (typeof SoundFX !== 'undefined') SoundFX.win();
    buildQuiz();
  }
}

/* ---- 任務按鈕 ---- */
(function buildChips() {
  const wrap = document.getElementById('taskChips');
  TASKS.forEach((t, i) => {
    const b = document.createElement('button');
    b.textContent = `${i + 1}. ${t.name}`;
    b.addEventListener('click', () => runTask(i));
    wrap.appendChild(b);
  });
})();
/* 初始畫面 */
(function initDraw() {
  const t = TASKS[0];
  const hs = setupCv(handCv); drawSketch(hs.ctx, hs.w, hs.h, t.before, 1);
  const cs = setupCv(cadCv); drawCAD(cs.ctx, cs.w, cs.h, t.before, 0);
})();
window.addEventListener('resize', () => {
  if (animating) return;
  const t = TASKS[curTask];
  const hs = setupCv(handCv); drawSketch(hs.ctx, hs.w, hs.h, t.before, 1);
  const cs = setupCv(cadCv); drawCAD(cs.ctx, cs.w, cs.h, t.before, 0);
});

/* ---- CAD 應用領域圖鑑 ---- */
const APPS = [
  { icon: '🏛️', name: '建築業', detail: '住宅、商業大樓、橋梁與公共建設的規劃與設計。建築資訊模型（BIM)就是 CAD 的延伸應用。' },
  { icon: '🚗', name: '製造業', detail: '汽車、飛機、船舶、機械設備、電子產品與家電的設計與開發,是 CAD 應用最深的領域。' },
  { icon: '🪑', name: '消費性產品', detail: '家具、玩具、運動器材到包裝設計,讓產品在量產前就能反覆驗證外觀與機能。' },
  { icon: '👗', name: '時尚產業', detail: '服裝打版與珠寶設計。3D 試衣與客製化珠寶,大幅縮短打樣的時間與成本。' },
  { icon: '🎮', name: '電影與遊戲', detail: '3D 模型建構與場景設計。電影特效與遊戲世界,背後都是大量的數位建模工作。' },
  { icon: '🦷', name: '醫療領域', detail: '客製化植入物設計,如假牙、人工關節,以及各式醫療器材,能完全貼合每位病人的身體。' },
];
(function buildApps() {
  const grid = document.getElementById('appGrid');
  const detail = document.getElementById('appDetail');
  APPS.forEach(a => {
    const card = document.createElement('div');
    card.className = 'app-card';
    card.innerHTML = `<div class="ac-icon">${a.icon}</div><div class="ac-name">${a.name}</div>`;
    card.addEventListener('click', () => {
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      detail.style.display = 'block';
      detail.innerHTML = `<strong>${a.icon} ${a.name}</strong>　${a.detail}`;
    });
    grid.appendChild(card);
  });
})();

/* ---- 檢核 ---- */
let quizBuilt = false;
function buildQuiz() {
  quizBuilt = true;
  document.getElementById('quizGate').textContent = '完成下方 3 題即可完成本模組。';
  const QUIZ = [
    { question: 'CAD 最主要的價值之一是「修改設計只需點選幾下」,這屬於哪一個面向?',
      options: [
        { text: '提升設計效率與精度', correct: true, explain: '正確。快速修改、減少人為誤差,正是「效率與精度」的核心。' },
        { text: '強化模擬與分析', correct: false },
        { text: '促進協同作業', correct: false },
        { text: '降低用電量', correct: false },
      ] },
    { question: '在數位製造流程中,負責「把設計轉成機器看得懂的加工指令」的是哪一項?',
      options: [
        { text: 'CAD（電腦輔助設計)', correct: false },
        { text: 'CAE（電腦輔助工程)', correct: false },
        { text: 'CAM（電腦輔助製造)', correct: true, explain: '正確。CAM 負責產生 G-code、刀具路徑等加工指令。' },
        { text: 'CPU（中央處理器)', correct: false },
      ] },
    { question: '從動畫中你觀察到:手繪修改後紙面留下痕跡,CAD 修改後乾淨如新。這說明 CAD 的什麼優勢?',
      options: [
        { text: '修改乾淨、可逆,不會破壞圖面品質', correct: true,
          explain: '正確。CAD 以指令修改,圖面不留殘影,可反覆編輯。' },
        { text: 'CAD 的紙比較貴', correct: false },
        { text: '手繪比較環保', correct: false },
        { text: '兩者其實沒有差別', correct: false },
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
          celebrateModule('ch2-cad', '為什麼需要 CAD?');
          document.getElementById('nextBtn').classList.add('pop-in');
        }
      },
    });
  });
}
