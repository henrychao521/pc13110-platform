/* ============================================================
 * 為什麼需要 CAD — 改圖競速 + 應用領域圖鑑 + 檢核
 * ============================================================ */

/* ---- 改圖競速任務 ---- */
const RACE_TASKS = [
  { title: '任務 1：把矩形零件的寬度加大 10 mm',
    hand: 8, cad: 1,
    handNote: '需要找出該邊、擦掉、重新依尺規畫一遍。',
    cadNote: '直接修改尺寸數值,圖面自動更新。',
    takeaway: 'CAD 的尺寸是「參數」,改數字就改圖——這就是「參數化設計」的威力。' },
  { title: '任務 2：修正一個畫錯位置的圓孔',
    hand: 14, cad: 2,
    handNote: '橡皮擦難以擦淨,紙面留下痕跡,影響圖面品質。',
    cadNote: '選取圓孔、輸入新座標即可,圖面乾淨如新。',
    takeaway: '手繪修改會「留下痕跡」;CAD 的修改乾淨、可逆、不留殘影。' },
  { title: '任務 3：把整個設計等比例縮小為 80%',
    hand: 30, cad: 1,
    handNote: '幾乎等於整張圖重畫一次,且每條線都要重新換算。',
    cadNote: '一個「縮放」指令,電腦精準完成換算。',
    takeaway: 'CAD 由電腦運算定義尺寸,縮放、陣列等操作精度極高、不會累積誤差。' },
  { title: '任務 4：複製一份設計給三位同學',
    hand: 20, cad: 1,
    handNote: '重新描圖會失真;影印則無法再編輯。',
    cadNote: '複製數位檔案,每一份都和原稿完全相同,且都能繼續編輯。',
    takeaway: '數位檔案易於「保存與複製」,這是紙本永遠做不到的。' },
];

let raceIdx = 0, raceDone = 0, totalHand = 0, totalCad = 0;
const raceArea = document.getElementById('raceArea');

function renderRaceTask() {
  if (raceIdx >= RACE_TASKS.length) {
    raceArea.innerHTML = `
      <div class="panel" style="text-align:center;border:2px solid var(--theme)">
        <div style="font-size:34px">🏆</div>
        <h4 style="font-size:17px;margin:4px 0">四項任務完成!</h4>
        <p style="font-size:14px;color:var(--text-soft)">
          累計耗時 — 傳統手繪 <strong style="color:#D97706">${totalHand} 單位</strong>　vs
          CAD <strong style="color:var(--theme)">${totalCad} 單位</strong>。
          CAD 省下了約 <strong>${Math.round((1 - totalCad / totalHand) * 100)}%</strong> 的時間,
          而且每一次修改都更精準、更乾淨。
        </p>
      </div>`;
    return;
  }
  const t = RACE_TASKS[raceIdx];
  raceArea.innerHTML = `
    <div class="race-task">
      <div style="font-weight:800;font-size:14.5px;margin-bottom:4px">${t.title}</div>
      <div style="font-size:12px;color:var(--text-muted)">第 ${raceIdx + 1} / ${RACE_TASKS.length} 項</div>
      <div class="race-bar-row">
        <span class="rb-label">✏️ 傳統手繪</span>
        <div class="race-track"><div class="race-fill hand" id="rfHand"></div></div>
      </div>
      <div class="race-bar-row">
        <span class="rb-label">🖥️ CAD</span>
        <div class="race-track"><div class="race-fill cad" id="rfCad"></div></div>
      </div>
      <div id="raceResult" style="font-size:13px;min-height:20px;margin-top:6px"></div>
      <button class="btn btn-primary btn-sm" id="raceStart" style="margin-top:8px">▶ 開始這項任務</button>
    </div>`;
  document.getElementById('raceStart').addEventListener('click', runRace);
}

function runRace() {
  const t = RACE_TASKS[raceIdx];
  const btn = document.getElementById('raceStart');
  btn.disabled = true;
  const handFill = document.getElementById('rfHand');
  const cadFill = document.getElementById('rfCad');
  const maxT = Math.max(t.hand, t.cad);
  let elapsed = 0;
  if (typeof SoundFX !== 'undefined') SoundFX.click();
  const timer = setInterval(() => {
    elapsed += 0.4;
    const hp = Math.min(1, elapsed / t.hand);
    const cp = Math.min(1, elapsed / t.cad);
    handFill.style.width = (hp * 100) + '%';
    cadFill.style.width = (cp * 100) + '%';
    if (cp >= 1) cadFill.textContent = t.cad + ' 單位';
    if (hp >= 1) handFill.textContent = t.hand + ' 單位';
    if (typeof SoundFX !== 'undefined' && Math.random() < .3) SoundFX.tick();
    if (elapsed >= maxT) {
      clearInterval(timer);
      totalHand += t.hand; totalCad += t.cad;
      document.getElementById('raceResult').innerHTML = `
        <div style="background:#FFF7ED;border-left:3px solid #D97706;padding:6px 10px;border-radius:6px;margin-bottom:4px">
          ✏️ <strong>手繪</strong>:${t.handNote}</div>
        <div style="background:var(--theme-light);border-left:3px solid var(--theme);padding:6px 10px;border-radius:6px;margin-bottom:6px">
          🖥️ <strong>CAD</strong>:${t.cadNote}</div>
        <div style="font-weight:700;color:var(--theme-dark)">💡 ${t.takeaway}</div>`;
      raceDone++;
      if (typeof SoundFX !== 'undefined') SoundFX.success();
      const next = document.createElement('button');
      next.className = 'btn btn-primary btn-sm';
      next.style.marginTop = '8px';
      next.textContent = raceIdx < RACE_TASKS.length - 1 ? '下一項任務 →' : '看總結 →';
      next.addEventListener('click', () => { raceIdx++; renderRaceTask(); checkQuizGate(); });
      document.querySelector('.race-task').appendChild(next);
    }
  }, 40);
}
renderRaceTask();

/* ---- CAD 應用領域圖鑑 ---- */
const APPS = [
  { icon: '🏛️', name: '建築業', detail: '住宅、商業大樓、橋梁與公共建設的規劃與設計。建築資訊模型（BIM）就是 CAD 的延伸應用。' },
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
function checkQuizGate() {
  if (raceDone >= RACE_TASKS.length && !quizBuilt) buildQuiz();
}
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
        { text: 'CAD（電腦輔助設計）', correct: false },
        { text: 'CAE（電腦輔助工程）', correct: false },
        { text: 'CAM（電腦輔助製造）', correct: true, explain: '正確。CAM 負責產生 G-code、刀具路徑等加工指令。' },
        { text: 'CPU（中央處理器）', correct: false },
      ] },
    { question: '為什麼像淡江大橋那樣的複雜流線造型,幾乎一定要靠 CAD?',
      options: [
        { text: '因為 CAD 比較便宜', correct: false },
        { text: '因為複雜的曲面與形態,傳統手繪幾乎無法精確呈現與轉化為實際建築', correct: true,
          explain: '正確。CAD 讓設計師的創意不再受限於繪圖工具,能精準處理複雜幾何。' },
        { text: '因為法律規定要用 CAD', correct: false },
        { text: '因為手繪無法畫直線', correct: false },
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
