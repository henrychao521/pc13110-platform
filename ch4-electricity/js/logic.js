/* ============================================================
 * 邏輯與感應電路 — AND/OR 邏輯實驗 + 光感應路燈 + 檢核
 * ============================================================ */

/* ---- AND / OR 邏輯實驗 ---- */
let s1 = false, s2 = false, mode = 'and';

function logicResult(a, b) { return mode === 'and' ? (a && b) : (a || b); }

function renderLogic() {
  document.getElementById('sw1').classList.toggle('on', s1);
  document.getElementById('sw2').classList.toggle('on', s2);
  const lit = logicResult(s1, s2);
  document.getElementById('led').classList.toggle('lit', lit);
  /* 真值表 */
  const rows = [[0,0],[0,1],[1,0],[1,1]];
  const tbl = document.getElementById('truthTable');
  tbl.innerHTML = `<tr><th>S₁</th><th>S₂</th><th>LED(${mode === 'and' ? 'AND' : 'OR'})</th></tr>` +
    rows.map(([a, b]) => {
      const out = mode === 'and' ? (a && b) : (a || b);
      const cur = (a === (s1 ? 1 : 0) && b === (s2 ? 1 : 0));
      return `<tr class="${cur ? 'cur' : ''}"><td>${a}</td><td>${b}</td><td>${out ? '🟡 亮' : '⚫ 滅'}</td></tr>`;
    }).join('');
}
document.getElementById('sw1').addEventListener('click', () => { s1 = !s1; SoundFX && SoundFX.click(); renderLogic(); });
document.getElementById('sw2').addEventListener('click', () => { s2 = !s2; SoundFX && SoundFX.click(); renderLogic(); });
document.querySelectorAll('.logicmode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.logicmode').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    mode = btn.dataset.mode;
    SoundFX && SoundFX.click();
    renderLogic();
  });
});
renderLogic();

/* ---- 光感應路燈 ---- */
let bright = 80;
const sky = document.getElementById('skyCanvas');
const VCC = 5, R1 = 10;          /* 固定電阻 10 kΩ */
const THRESHOLD = 2.5;           /* 分壓點電壓門檻 */

function drawSky() {
  const dpr = window.devicePixelRatio || 1;
  const w = sky.clientWidth, h = 240;
  sky.width = w * dpr; sky.height = h * dpr;
  const ctx = sky.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  /* 光敏電阻阻值:亮 → 低、暗 → 高(kΩ) */
  const Rcds = 1 + (100 - bright) * (100 - bright) / 100;
  const Vo = VCC * Rcds / (R1 + Rcds);     /* 分壓點電壓(取 CdS 端) */
  const lampOn = Vo > THRESHOLD;

  /* 天空漸層 */
  const t = bright / 100;
  const grd = ctx.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, `rgb(${15+t*120|0},${20+t*150|0},${40+t*160|0})`);
  grd.addColorStop(1, `rgb(${30+t*150|0},${35+t*150|0},${55+t*120|0})`);
  ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);

  /* 太陽 / 月亮 */
  const cx = w * 0.78, cy = h * 0.28;
  if (bright > 45) { ctx.fillStyle = '#FDB813'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.fill(); }
  else { ctx.fillStyle = '#E8E8F0'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.fill();
    /* 星星 */ ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 12; i++) ctx.fillRect((i*73%w), (i*51%(h*0.6)), 2, 2); }

  /* 地面 */
  ctx.fillStyle = '#2d3b2d'; ctx.fillRect(0, h - 40, w, 40);

  /* 路燈 */
  const px = w * 0.26, baseY = h - 40;
  ctx.strokeStyle = '#555'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(px, baseY); ctx.lineTo(px, baseY - 120); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, baseY - 120); ctx.lineTo(px + 36, baseY - 120); ctx.stroke();
  /* 燈頭 */
  const lx = px + 36, ly = baseY - 116;
  if (lampOn) {
    const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, 70);
    g.addColorStop(0, 'rgba(255,235,150,.95)'); g.addColorStop(1, 'rgba(255,235,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 70, 0, 7); ctx.fill();
  }
  ctx.fillStyle = lampOn ? '#FCD34D' : '#5a5a4a';
  ctx.beginPath(); ctx.arc(lx, ly, 9, 0, 7); ctx.fill();

  return { Rcds, Vo, lampOn };
}

function refreshLight() {
  const r = drawSky();
  // 門檻對齊實際的關燈點（Vo 在 bright=70 越過 2.5V），否則 67–69 會標「白天」卻還亮著
  const label = bright >= 70 ? '白天' : bright > 33 ? '黃昏' : '夜晚';
  document.getElementById('brightVal').textContent = label;
  document.getElementById('lightStat').innerHTML = `
    光敏電阻阻值:<b style="font-family:var(--font-mono)">${r.Rcds.toFixed(1)} kΩ</b>
    （${bright > 50 ? '光亮→阻值低' : '昏暗→阻值高'})<br>
    分壓點電壓 V<sub>o</sub>:<b style="font-family:var(--font-mono)">${r.Vo.toFixed(2)} V</b>
    　(門檻 ${THRESHOLD} V)<br>
    <strong style="color:${r.lampOn ? 'var(--warning)' : 'var(--text-muted)'}">
      路燈狀態:${r.lampOn ? '💡 自動點亮(天色已暗,V_o 超過門檻)' : '⚫ 熄滅(天色仍亮,V_o 未達門檻)'}</strong>`;
}
document.getElementById('brightSlider').addEventListener('input', e => { bright = +e.target.value; refreshLight(); });
window.addEventListener('resize', refreshLight);
refreshLight();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '把兩個開關「串聯」在電路中,形成的是哪一種邏輯?',
    options: [
      { text: 'AND 邏輯——兩個開關都導通,LED 才會亮', correct: true,
        explain: '正確。串聯需要每個開關都通,屬於 AND(及)邏輯。' },
      { text: 'OR 邏輯', correct: false },
      { text: '兩者都不是', correct: false },
    ] },
  { question: '光敏電阻(CdS)的特性是什麼?',
    options: [
      { text: '阻值固定不變', correct: false },
      { text: '阻值會隨光線變化:光亮時阻值低、昏暗時阻值高', correct: true,
        explain: '正確。CdS 的阻值隨環境光改變,是光感應電路的核心元件。' },
      { text: '光線越亮阻值越高', correct: false },
    ] },
  { question: '光敏電阻本身不會輸出電壓訊號,要怎麼把它的阻值變化變成電壓變化?',
    options: [
      { text: '搭配一顆固定電阻組成「分壓電路」,量測分壓點的電壓', correct: true,
        explain: '正確。分壓電路是把感測器的「阻值變化」轉成「電壓變化」的標準做法。' },
      { text: '直接用三用電表測光線', correct: false },
      { text: '把光敏電阻加熱', correct: false },
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
    onAnswer: (correct) => {
      if (!correct) {
        if (typeof showToast === 'function') showToast('看完解說後再挑戰一次，答對才算通過', 'warn');
        setTimeout(() => renderQuizQ(i, box), 3500);
        return;
      }
      quizCorrect.add(i);
      if (quizCorrect.size === QUIZ.length) {
        celebrateModule('ch4-logic', '邏輯與感應電路');
        showToast('🎉 恭喜!你已完成第 4 章所有模組', 'success');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
}

/* ============================================================
 * 進階邏輯閘擴充 — NOT / NAND / NOR / XOR / XNOR + AND + OR
 * ============================================================ */
(function lgxSim() {
  const svg = document.getElementById('lgxSvg');
  if (!svg) return;
  const gatesEl = document.getElementById('lgxGates');
  const truthEl = document.getElementById('lgxTruth');
  const infoEl = document.getElementById('lgxInfo');
  const aBtn = document.getElementById('lgxA');
  const bBtn = document.getElementById('lgxB');

  const GATES = {
    AND:  { fn:(a,b)=>a&b,        sym:'AND',  fmt:'A · B',         oneIn:false },
    OR:   { fn:(a,b)=>a|b,        sym:'OR',   fmt:'A + B',         oneIn:false },
    NOT:  { fn:(a)=>a^1,          sym:'NOT',  fmt:'¬A',            oneIn:true  },
    NAND: { fn:(a,b)=>(a&b)^1,    sym:'NAND', fmt:'¬(A · B)',      oneIn:false },
    NOR:  { fn:(a,b)=>(a|b)^1,    sym:'NOR',  fmt:'¬(A + B)',      oneIn:false },
    XOR:  { fn:(a,b)=>a^b,        sym:'XOR',  fmt:'A ⊕ B',         oneIn:false },
    XNOR: { fn:(a,b)=>(a^b)^1,    sym:'XNOR', fmt:'¬(A ⊕ B)',      oneIn:false },
  };
  const NOTES = {
    AND:'A、B 同時為 1 時輸出才為 1。',
    OR:'A 或 B 任一為 1 時輸出為 1。',
    NOT:'單一輸入,輸出為輸入的反相(0↔1)。',
    NAND:'AND 的反向。<strong>NAND 是「通用邏輯閘」</strong>——只用 NAND 就能組合出所有其他邏輯閘。',
    NOR:'OR 的反向。也是通用邏輯閘,只用 NOR 即可組合出所有其他邏輯。',
    XOR:'兩輸入「不同」時為 1。常用於加法器、奇偶位元檢查。',
    XNOR:'XOR 的反向——兩輸入「相同」時為 1。用於比較器(判斷兩輸入是否相等)。',
  };

  let cur = 'NAND';
  let A = 0, B = 0;

  function gateSvg(name, Y) {
    const g = GATES[name];
    const oneIn = g.oneIn;
    const yLit = Y === 1 ? '#22C55E' : '#9CA3AF';
    function shapeBuf() { return `<polygon points="120,40 120,120 200,80" fill="#fff" stroke="#1F2937" stroke-width="2.5"/>`; }
    function shapeAnd() { return `<path d="M120 40 L160 40 A40 40 0 0 1 160 120 L120 120 Z" fill="#fff" stroke="#1F2937" stroke-width="2.5"/>`; }
    function shapeOr()  { return `<path d="M115 40 Q145 50 200 80 Q145 110 115 120 Q135 80 115 40 Z" fill="#fff" stroke="#1F2937" stroke-width="2.5"/>`; }
    function shapeXor() { return shapeOr() + `<path d="M108 40 Q128 80 108 120" stroke="#1F2937" stroke-width="2.5" fill="none"/>`; }
    function inv() { return `<circle cx="208" cy="80" r="6" fill="#fff" stroke="#1F2937" stroke-width="2"/>`; }
    let shape = '';
    if (name === 'NOT') shape = shapeBuf() + inv();
    else if (name === 'AND') shape = shapeAnd();
    else if (name === 'NAND') shape = shapeAnd() + inv();
    else if (name === 'OR') shape = shapeOr();
    else if (name === 'NOR') shape = shapeOr() + inv();
    else if (name === 'XOR') shape = shapeXor();
    else if (name === 'XNOR') shape = shapeXor() + inv();
    const inputs = oneIn
      ? `<line x1="40" y1="80" x2="${name==='NOT'?120:115}" y2="80" stroke="${A?'#DC2626':'#1F2937'}" stroke-width="2.5"/>
         <text x="30" y="85" font-size="13" font-weight="700" fill="${A?'#DC2626':'#1F2937'}">A=${A}</text>`
      : `<line x1="40" y1="55" x2="${name.includes('X')||name==='OR'||name==='NOR'?125:120}" y2="55" stroke="${A?'#DC2626':'#1F2937'}" stroke-width="2.5"/>
         <line x1="40" y1="105" x2="${name.includes('X')||name==='OR'||name==='NOR'?125:120}" y2="105" stroke="${B?'#DC2626':'#1F2937'}" stroke-width="2.5"/>
         <text x="30" y="60" font-size="13" font-weight="700" fill="${A?'#DC2626':'#1F2937'}">A=${A}</text>
         <text x="30" y="110" font-size="13" font-weight="700" fill="${B?'#DC2626':'#1F2937'}">B=${B}</text>`;
    return `<g>${inputs}${shape}
      <line x1="${['NOT','NAND','NOR','XNOR'].includes(name) ? 214 : 200}" y1="80" x2="280" y2="80" stroke="${yLit}" stroke-width="3"/>
      <text x="265" y="68" text-anchor="middle" font-size="14" font-weight="700" fill="${yLit}">Y=${Y}</text>
      <circle cx="280" cy="80" r="6" fill="${yLit}"/>
      <text x="160" y="150" text-anchor="middle" font-size="13" font-weight="700" fill="#1F2937">${g.sym} 閘 ・ Y = ${g.fmt}</text>
    </g>`;
  }

  function truth(name) {
    const g = GATES[name];
    if (g.oneIn) {
      return `<thead><tr><th>A</th><th>Y</th></tr></thead><tbody>
        <tr class="${A===0?'cur':''}"><td>0</td><td>${g.fn(0)}</td></tr>
        <tr class="${A===1?'cur':''}"><td>1</td><td>${g.fn(1)}</td></tr></tbody>`;
    }
    const rows = [[0,0],[0,1],[1,0],[1,1]];
    return `<thead><tr><th>A</th><th>B</th><th>Y</th></tr></thead><tbody>` +
      rows.map(([a,b])=>`<tr class="${a===A&&b===B?'cur':''}"><td>${a}</td><td>${b}</td><td>${g.fn(a,b)}</td></tr>`).join('') +
      `</tbody>`;
  }

  function render() {
    const g = GATES[cur];
    const Y = g.oneIn ? g.fn(A) : g.fn(A, B);
    svg.innerHTML = gateSvg(cur, Y);
    truthEl.innerHTML = truth(cur);
    infoEl.innerHTML = `<strong>${g.sym}(${g.fmt})</strong>:${NOTES[cur]}`;
    bBtn.style.display = g.oneIn ? 'none' : 'inline-block';
    [...gatesEl.querySelectorAll('button')].forEach(b => b.classList.toggle('on', b.dataset.g === cur));
  }

  /* Gate selector buttons */
  Object.keys(GATES).forEach(name => {
    const b = document.createElement('button');
    b.dataset.g = name;
    b.textContent = name;
    b.style.cssText = 'font-weight:700;font-size:12.5px;padding:6px 11px;border-radius:7px;border:2px solid var(--border-strong);background:#fff;cursor:pointer;color:var(--text);';
    b.addEventListener('click', () => { cur = name; render(); });
    b.addEventListener('mouseover', () => { if (!b.classList.contains('on')) b.style.background='var(--bg-soft)'; });
    b.addEventListener('mouseout',  () => { if (!b.classList.contains('on')) b.style.background='#fff'; });
    gatesEl.appendChild(b);
  });
  /* On-state styling via class toggle */
  const styleEl = document.createElement('style');
  styleEl.textContent = '#lgxGates button.on{background:var(--theme)!important;color:#fff!important;border-color:var(--theme)!important}';
  document.head.appendChild(styleEl);

  aBtn.addEventListener('click', () => {
    A ^= 1;
    aBtn.textContent = 'A = ' + A;
    aBtn.style.background = A ? 'var(--theme)' : '#fff';
    aBtn.style.color = A ? '#fff' : 'var(--theme)';
    render();
  });
  bBtn.addEventListener('click', () => {
    B ^= 1;
    bBtn.textContent = 'B = ' + B;
    bBtn.style.background = B ? 'var(--theme)' : '#fff';
    bBtn.style.color = B ? '#fff' : 'var(--theme)';
    render();
  });
  render();
})();

/* ============================================================
 * NAND 萬用閘拼接 — 用兩個 NAND 組出 AND
 * 驗算基礎:NAND(a,b) = !(a&&b);反相器 = NAND(x,x) = !x
 * ============================================================ */
(function nandBuilder() {
  const svg = document.getElementById('nubSvg');
  if (!svg) return;
  const truthEl = document.getElementById('nubTruth');
  const andEl = document.getElementById('nubAnd');
  const infoEl = document.getElementById('nubInfo');
  const optsEl = document.getElementById('nubOpts');
  const NAND = (a, b) => (a && b) ? 0 : 1;
  const AND = (a, b) => (a && b) ? 1 : 0;
  const ROWS = [[0, 0], [0, 1], [1, 0], [1, 1]];

  /* 每種接法:第二個 NAND 的輸入來源(逐列由 fn 計算,不寫死真值表) */
  const OPTS = {
    inv: { fn: (a, b) => { const m = NAND(a, b); return NAND(m, m); },
      note: '兩輸入接在一起的 NAND 就是<strong>反相器</strong>:NAND(M,M) = ¬M。第一個 NAND 算出 M = ¬(A·B),再反相一次就變回 A·B——只用 NAND 就拼出了 AND,這就是「通用邏輯閘」的意思。' },
    dup: { fn: (a, b) => NAND(a, b),
      note: '第二個 NAND 沒有用到第一個的輸出 M,只是把 A、B 再做一次 NAND,整體輸出仍是 ¬(A·B)——<strong>等效 NAND</strong>,白白浪費了一個閘。' },
    zero: { fn: (a, b) => NAND(NAND(a, b), 0),
      note: 'NAND 只要任一輸入為 0,輸出必為 1:NAND(M,0) = ¬(M·0) = ¬0 = 1。所以無論 A、B 為何,輸出<strong>恆為 1</strong>,不是 AND。' },
  };

  const LN = 'stroke="#1F2937" stroke-width="2.5" fill="none" stroke-linecap="round"';
  function nandGate(x, y, label) {
    return `<g transform="translate(${x},${y})">
      <path d="M0 0 L34 0 A30 30 0 0 1 34 60 L0 60 Z" fill="#fff" stroke="#1F2937" stroke-width="2.5"/>
      <circle cx="70" cy="30" r="6" fill="#fff" stroke="#1F2937" stroke-width="2"/>
      <text x="28" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="#1F2937">${label}</text>
    </g>`;
  }
  function common() {
    return `
      <text x="46" y="74" text-anchor="end" font-size="13" font-weight="700" fill="#1F2937">A</text>
      <text x="46" y="104" text-anchor="end" font-size="13" font-weight="700" fill="#1F2937">B</text>
      <line x1="52" y1="70" x2="110" y2="70" ${LN}/>
      <line x1="52" y1="100" x2="110" y2="100" ${LN}/>
      ${nandGate(110, 55, 'NAND ①')}
      ${nandGate(330, 55, 'NAND ②')}
      <line x1="406" y1="85" x2="468" y2="85" ${LN}/>
      <circle cx="468" cy="85" r="5" fill="#1F2937"/>
      <text x="480" y="89" font-size="14" font-weight="700" fill="#1F2937">Y</text>`;
  }
  const WIRES = {
    inv: `
      <path d="M186 85 H256" ${LN}/>
      <circle cx="256" cy="85" r="4" fill="#1F2937"/>
      <path d="M256 85 V70 H330" ${LN}/>
      <path d="M256 85 V100 H330" ${LN}/>
      <text x="218" y="78" font-size="12" font-weight="700" fill="#6B7280">M</text>`,
    dup: `
      <circle cx="82" cy="70" r="4" fill="#1F2937"/>
      <circle cx="82" cy="100" r="4" fill="#1F2937"/>
      <path d="M82 70 V28 H305 V70 H330" ${LN}/>
      <path d="M82 100 V152 H305 V100 H330" ${LN}/>
      <path d="M186 85 H216" stroke="#9CA3AF" stroke-width="2.5" fill="none" stroke-dasharray="5 4"/>
      <text x="222" y="89" font-size="11" fill="#9CA3AF">M 未使用</text>`,
    zero: `
      <path d="M186 85 H256 V70 H330" ${LN}/>
      <text x="218" y="78" font-size="12" font-weight="700" fill="#6B7280">M</text>
      <path d="M300 142 V100 H330" ${LN}/>
      <text x="300" y="160" text-anchor="middle" font-size="12" font-weight="700" fill="#1F2937">接 0(低電位)</text>`,
  };
  const PLACEHOLDER = `
    <path d="M186 85 H230" ${LN}/>
    <path d="M240 70 H330 M240 100 H330" stroke="#9CA3AF" stroke-width="2.5" fill="none" stroke-dasharray="5 4"/>
    <text x="285" y="52" text-anchor="middle" font-size="20" font-weight="800" fill="#9CA3AF">?</text>
    <text x="218" y="78" font-size="12" font-weight="700" fill="#6B7280">M</text>`;

  /* 逐列計算真值表;與標準 AND 不同的列標紅 */
  function renderTables(fn) {
    let allOk = true;
    const user = fn
      ? ROWS.map(([a, b]) => {
          const y = fn(a, b);
          const bad = y !== AND(a, b);
          if (bad) allOk = false;
          return `<tr class="${bad ? 'bad' : ''}"><td>${a}</td><td>${b}</td><td>${y}</td></tr>`;
        }).join('')
      : ROWS.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td><td>?</td></tr>`).join('');
    truthEl.innerHTML = `<thead><tr><th>A</th><th>B</th><th>Y</th></tr></thead><tbody>${user}</tbody>`;
    andEl.innerHTML = `<thead><tr><th>A</th><th>B</th><th>A·B</th></tr></thead><tbody>` +
      ROWS.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td><td>${AND(a, b)}</td></tr>`).join('') + '</tbody>';
    return allOk;
  }

  function render(opt) {
    [...optsEl.querySelectorAll('button')].forEach(b => b.classList.toggle('on', b.dataset.o === opt));
    if (!opt) {
      svg.innerHTML = common() + PLACEHOLDER;
      renderTables(null);
      infoEl.innerHTML = '👆 點上方任一種接法,看看哪一種能讓整體等效 AND。';
      return;
    }
    svg.innerHTML = common() + WIRES[opt];
    const ok = renderTables(OPTS[opt].fn);
    const banner = ok
      ? '<strong style="color:#166534">✓ 等效 AND!</strong>'
      : '<strong style="color:#991B1B">✗ 不等效(紅色列是與 AND 不同的地方)。</strong>';
    infoEl.innerHTML = banner + OPTS[opt].note;
  }

  optsEl.addEventListener('click', e => {
    const b = e.target.closest('button[data-o]');
    if (!b) return;
    if (typeof SoundFX !== 'undefined') SoundFX.click();
    render(b.dataset.o);
  });
  render(null);
})();
