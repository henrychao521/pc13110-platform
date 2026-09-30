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
    if (group.startsWith('rail')) msg = '這是<strong>電源軌</strong>——橫向相通,通常接正電源或接地(有些麵包板的電源軌在中間斷成兩段,紅藍線中斷處要拉跳線跨接)。';
    else msg = '這是<strong>中間區的一直行</strong>——縱向 5 個孔相通;上下兩半(a–e 與 f–j)被中央溝槽隔開,互不相通。';
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
const r1 = makeRail('bot+'); r1.style.marginTop = '8px';
board.appendChild(r1);
const r2 = makeRail('bot-'); r2.style.marginBottom = '0';
board.appendChild(r2);
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
      { text: '中間區每一直行的 5 個孔縱向相通,上下兩半(a–e 與 f–j)互不相通', correct: true,
        explain: '正確。中間區縱向 5 孔一組相通;電源軌則是橫向相通(部分麵包板在中間斷開)。' },
      { text: '整塊麵包板的所有孔全部相通', correct: false },
      { text: '麵包板的孔位之間完全不相通', correct: false },
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
        celebrateModule('ch4-tools', '常用工具與量測');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
}

/* ============================================================
 * 虛擬三用電表 — V / Ω / A 三檔 × 紅黑探棒在 A/B/C 節點
 * 測試電路:9V 電池 + 4.7kΩ + 10kΩ 串聯
 * 節點 D 在 A 與 R1 之間:電流檔時把這段導線打開(斷點),電表要跨在 A–D 兩端才是串接
 * ============================================================ */
(function dmmSim() {
  const svg = document.getElementById('dmmSvg');
  if (!svg) return;
  let mode = 'V', pR = 'A', pB = 'C';
  const VBAT = 9, R1 = 4700, R2 = 10000;
  const V_B = VBAT * R2 / (R1 + R2);
  const NODE_V = { A: VBAT, D: VBAT, B: V_B, C: 0 };
  const I_LOOP_mA = VBAT / (R1 + R2) * 1000;
  const NODE_POS = { A:[40,40], D:[112,40], B:[320,110], C:[40,200] };

  function nodeMark(name) {
    const [x, y] = NODE_POS[name];
    const hl = (name === pR || name === pB);
    return `<circle cx="${x}" cy="${y}" r="${hl?7:5}" fill="${hl?'#FCD34D':'#fff'}" stroke="#1F2937" stroke-width="2"/>
      <text x="${x-12}" y="${y+4}" text-anchor="end" font-size="13" font-weight="800" fill="#1F2937">${name}</text>`;
  }
  function probeMark(node, color, dx, dy) {
    const [x, y] = NODE_POS[node];
    return `<g><line x1="${x}" y1="${y}" x2="${x+dx}" y2="${y+dy}" stroke="${color}" stroke-width="2.5"/>
      <circle cx="${x+dx}" cy="${y+dy}" r="6" fill="${color}" stroke="#0b0b18" stroke-width="1"/></g>`;
  }

  function draw() {
    const open = mode === 'A', noBat = mode === 'R';
    svg.innerHTML = `
      <g transform="translate(40,120)" opacity="${noBat ? 0.3 : 1}">
        <!-- 電池符號:長板在上=正極(接 A 節點 9V),短板在下=負極(接 C 節點 0V) -->
        <line x1="0" y1="-12" x2="0" y2="-5" stroke="#1F2937" stroke-width="3"/>
        <line x1="-14" y1="-5" x2="14" y2="-5" stroke="#1F2937" stroke-width="3"/>
        <line x1="-7" y1="5" x2="7" y2="5" stroke="#1F2937" stroke-width="3"/>
        <line x1="0" y1="5" x2="0" y2="12" stroke="#1F2937" stroke-width="3"/>
        <text x="-18" y="-8" text-anchor="end" font-size="13" font-weight="700" fill="#1F2937">+</text>
        <text x="-18" y="13" text-anchor="end" font-size="13" font-weight="700" fill="#6B7280">−</text>
        <text x="0" y="38" text-anchor="middle" font-size="11" fill="#6B7280">9V</text>
      </g>
      ${noBat ? '<text x="58" y="160" font-size="11" fill="#B45309" font-weight="700">電池已拔除</text>' : ''}
      ${open
        ? `<path d="M40 108 L40 40 L60 40" stroke="#1F2937" stroke-width="2.5" fill="none"/>
           <path d="M80 40 L130 40" stroke="#1F2937" stroke-width="2.5" fill="none"/>
           <text x="70" y="30" text-anchor="middle" font-size="10" fill="#DC2626" font-weight="700">斷開</text>`
        : '<path d="M40 108 L40 40 L130 40" stroke="#1F2937" stroke-width="2.5" fill="none"/>'}
      <path d="M180 40 L320 40 L320 88" stroke="#1F2937" stroke-width="2.5" fill="none"/>
      <path d="M320 132 L320 200 L40 200 L40 132" stroke="#1F2937" stroke-width="2.5" fill="none"/>
      <g transform="translate(155,40)">
        <rect x="-25" y="-7" width="50" height="14" rx="3" fill="#FBBF24" stroke="#92400E" stroke-width="1.5"/>
        <text x="0" y="-12" text-anchor="middle" font-size="11" fill="#92400E" font-weight="700">R1 4.7kΩ</text>
      </g>
      <g transform="translate(320,110)">
        <rect x="-7" y="-22" width="14" height="44" rx="3" fill="#FBBF24" stroke="#92400E" stroke-width="1.5"/>
        <text x="14" y="3" font-size="11" fill="#92400E" font-weight="700">R2 10kΩ</text>
      </g>
      ${nodeMark('A')}${nodeMark('D')}${nodeMark('B')}${nodeMark('C')}
      ${probeMark(pR, '#DC2626', -22, -20)}
      ${probeMark(pB, '#1F2937', -22, 20)}
    `;
  }

  function fmt(val, unit) {
    if (unit === 'Ω' && Math.abs(val) >= 1000) return [(val/1000).toFixed(2), 'kΩ'];
    if (unit === 'mA') return [val.toFixed(3), 'mA'];
    return [val.toFixed(2), unit];
  }

  function compute() {
    const dispEl = document.getElementById('dmmRead');
    const uEl = document.getElementById('dmmUnit');
    const note = document.getElementById('dmmNote');
    let raw = 0, unit = 'V', msg = '';
    if (mode === 'V') {
      raw = NODE_V[pR] - NODE_V[pB]; unit = 'V';
      msg = pR === pB
        ? '紅黑探棒同一點 → 兩端電位差 = 0V'
        : `V(${pR}) − V(${pB}) = ${NODE_V[pR].toFixed(2)} − ${NODE_V[pB].toFixed(2)} = <strong>${raw.toFixed(2)}V</strong>`;
    } else if (mode === 'R') {
      /* 電阻檔:模擬中已先拔掉電池(帶電量電阻讀數不準、還可能傷電表);A、D 之間是導線 */
      const pos = { A: 0, D: 0, B: R1, C: R1 + R2 };
      raw = Math.abs(pos[pR] - pos[pB]); unit = 'Ω';
      msg = raw === 0
        ? `${pR}–${pB} 之間只有導線 → 0Ω`
        : `${pR}–${pB} 之間電阻 = <strong>${raw} Ω</strong>。電阻檔一定要先<strong>關電源／拔電池</strong>再量(本模擬已先拔除)。`;
    } else {
      const pair = [pR, pB].sort().join('');
      if (pair === 'AD') {
        raw = I_LOOP_mA * (pR === 'A' ? 1 : -1); unit = 'mA';
        msg = `✅ 正確串接:迴路在 A–D 打開,電表跨在斷點兩端,電流「穿過」電表。I = 9V ÷ (4.7+10)kΩ = <strong>${Math.abs(raw).toFixed(3)} mA</strong>`
          + (pR === 'A' ? '' : '<br>讀數為負:紅黑棒接反了,電流從黑棒流進電表。');
      } else if (pair === 'AC') {
        dispEl.textContent = 'FUSE'; uEl.textContent = '';
        note.innerHTML = '⛔ <strong>短路!</strong>電流檔內阻幾乎為零,紅黑棒跨在電池兩端(A、C)等於把正負極直接接通——真實電表會瞬間大電流、<strong>燒斷保險絲</strong>。電流檔要跨在迴路的<strong>斷點</strong>(A–D)兩端。';
        return;
      } else if (pair === 'AB') {
        raw = VBAT / R2 * 1000 * (pR === 'A' ? 1 : -1); unit = 'mA';
        msg = `⚠ 電表並接在 A–B:它幾乎零電阻,把 R1 繞過去了,量到的 ${Math.abs(raw).toFixed(3)} mA <strong>不是原電路的電流</strong>。電流檔要跨在斷點 A–D 兩端。`;
      } else {
        raw = 0; unit = 'mA';
        msg = '迴路已在 A–D 打開,這兩點之間沒有電流流過電表 → 0。量電流要把電表<strong>串接</strong>在斷點 A–D 兩端。';
      }
    }
    const [txt, u] = fmt(raw, unit);
    dispEl.textContent = txt;
    uEl.textContent = u;
    note.innerHTML = msg;
  }

  document.getElementById('dmmMode').addEventListener('click', e => {
    const b = e.target.closest('button[data-m]'); if (!b) return;
    mode = b.dataset.m;
    [...document.querySelectorAll('#dmmMode button')].forEach(x => x.classList.toggle('on', x === b));
    draw(); compute();
  });
  document.getElementById('probeR').addEventListener('click', e => {
    const b = e.target.closest('button[data-n]'); if (!b) return;
    pR = b.dataset.n;
    [...document.querySelectorAll('#probeR button')].forEach(x => x.classList.toggle('on', x === b));
    draw(); compute();
  });
  document.getElementById('probeB').addEventListener('click', e => {
    const b = e.target.closest('button[data-n]'); if (!b) return;
    pB = b.dataset.n;
    [...document.querySelectorAll('#probeB button')].forEach(x => x.classList.toggle('on', x === b));
    draw(); compute();
  });
  draw(); compute();
})();
