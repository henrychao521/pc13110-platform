/* ============================================================
 * 常用工具與量測 — 麵包板連通互動 + 檢核
 * ============================================================ */

const COLS = 20;        /* 中間區欄數 */
const board = document.getElementById('breadboard');
let exploredHoles = 0;
const exploredSet = new Set();

/* 建立一個孔;group = 電氣連通群組 ID */
function makeHole(group) {
  const h = document.createElement('div');
  h.className = 'bb-hole';
  h.dataset.group = group;
  h.addEventListener('click', () => {
    document.querySelectorAll('.bb-hole.hl').forEach(x => x.classList.remove('hl'));
    document.querySelectorAll(`.bb-hole[data-group="${group}"]`).forEach(x => x.classList.add('hl'));
    if (typeof SoundFX !== 'undefined') SoundFX.click();
    if (!exploredSet.has(group)) { exploredSet.add(group); exploredHoles++; }
    let msg;
    if (group.startsWith('rail')) msg = '這是<strong>電源軌</strong>——整條橫向相通,通常接正電源或接地。';
    else msg = '這是<strong>中間區的一直行</strong>——縱向 5 個孔相通;左右兩半被中央溝槽隔開,互不相通。';
    document.getElementById('bbNote').innerHTML = '🔆 已標亮相通的孔。' + msg;
  });
  return h;
}

/* 電源軌(橫向相通) */
function makeRail(id) {
  const rail = document.createElement('div');
  rail.className = 'bb-rail';
  rail.style.marginBottom = '8px';
  for (let i = 0; i < COLS; i++) rail.appendChild(makeHole('rail-' + id));
  return rail;
}
/* 中間區(每直行 5 孔相通) */
function makeMainHalf(prefix) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.gap = '3px';
  for (let c = 0; c < COLS; c++) {
    const col = document.createElement('div');
    col.className = 'bb-col';
    for (let r = 0; r < 5; r++) col.appendChild(makeHole(prefix + '-' + c));
    wrap.appendChild(col);
  }
  return wrap;
}

board.appendChild(makeRail('top+'));
board.appendChild(makeRail('top-'));
board.appendChild(makeMainHalf('T'));
const groove = document.createElement('div');
groove.className = 'bb-groove';
board.appendChild(groove);
board.appendChild(makeMainHalf('B'));
const r1 = makeRail('bot+'); r1.style.marginTop = '8px'; r1.style.marginBottom = '0';
board.appendChild(r1);
document.getElementById('bbNote').textContent = '👆 點任一個孔試試看。';

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '要剝除電線的絕緣外皮、露出內部銅導體,應該用哪種工具?',
    options: [
      { text: '尖嘴鉗', correct: false },
      { text: '剝線鉗(並依線徑選擇正確孔位)', correct: true,
        explain: '正確。剝線鉗專門剝除絕緣外皮,要依線徑選孔位以免剪斷銅線。' },
      { text: '電烙鐵', correct: false },
    ] },
  { question: '用三用電表量測一個大小未知的物理量時,正確做法是?',
    options: [
      { text: '直接用最小範圍量測', correct: false },
      { text: '先用大範圍,再逐步往小範圍檢測,以免損壞電表', correct: true,
        explain: '正確。從大範圍往小範圍量,可避免量測值超出範圍而燒毀電表。' },
      { text: '隨便選一個檔位都可以', correct: false },
    ] },
  { question: '關於麵包板的連通,下列何者正確?',
    options: [
      { text: '中間區每一直行的 5 個孔縱向相通,左右兩半互不相通', correct: true,
        explain: '正確。中間區縱向 5 孔一組相通;電源軌則是整條橫向相通。' },
      { text: '整塊麵包板的所有孔全部相通', correct: false },
      { text: '麵包板的孔位之間完全不相通', correct: false },
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
        celebrateModule('ch4-tools', '常用工具與量測');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
