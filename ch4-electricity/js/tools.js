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

/* ============================================================
 * 虛擬三用電表 — V / Ω / A 三檔 × 紅黑探棒在 A/B/C 節點
 * 測試電路:9V 電池 + 4.7kΩ + 10kΩ 串聯
 * ============================================================ */
(function dmmSim() {
  const svg = document.getElementById('dmmSvg');
  if (!svg) return;
  let mode = 'V', pR = 'A', pB = 'C';
  const VBAT = 9, R1 = 4700, R2 = 10000;
  const V_B = VBAT * R2 / (R1 + R2);
  const NODE_V = { A: VBAT, B: V_B, C: 0 };
  const I_LOOP_mA = VBAT / (R1 + R2) * 1000;
  const NODE_POS = { A:[40,40], B:[320,110], C:[40,200] };

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
    svg.innerHTML = `
      <g transform="translate(40,120)">
        <line x1="-3" y1="-12" x2="-3" y2="12" stroke="#1F2937" stroke-width="3"/>
        <line x1="3"  y1="-22" x2="3"  y2="22" stroke="#1F2937" stroke-width="3"/>
        <text x="-10" y="-28" font-size="13" font-weight="700" fill="#1F2937">+</text>
        <text x="12"  y="-28" font-size="13" font-weight="700" fill="#6B7280">−</text>
        <text x="0" y="38" text-anchor="middle" font-size="11" fill="#6B7280">9V</text>
      </g>
      <path d="M40 108 L40 40 L130 40" stroke="#1F2937" stroke-width="2.5" fill="none"/>
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
      ${nodeMark('A')}${nodeMark('B')}${nodeMark('C')}
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
      const map = { AB:R1, BA:R1, BC:R2, CB:R2, AC:R1+R2, CA:R1+R2, AA:0, BB:0, CC:0 };
      raw = map[pR + pB]; unit = 'Ω';
      msg = pR === pB
        ? '同一節點 → 0Ω'
        : `${pR}–${pB} 之間電阻 = <strong>${raw} Ω</strong>。⚠ 真實電表測電阻前要先把電源關掉。`;
    } else {
      const series = (pR === 'A' && pB === 'C') || (pR === 'C' && pB === 'A');
      if (series) {
        raw = I_LOOP_mA * (pR === 'A' ? 1 : -1); unit = 'mA';
        msg = `電流檔須<strong>串接</strong>進迴路。電流 I = 9V ÷ (4.7+10)kΩ = <strong>${Math.abs(raw).toFixed(3)} mA</strong>`;
      } else {
        raw = 0; unit = 'mA';
        msg = '⚠ 電流檔必須<strong>串接</strong>進迴路:把紅探棒放 A、黑探棒放 C(把電表當成導線串入)。';
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
    compute();
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
