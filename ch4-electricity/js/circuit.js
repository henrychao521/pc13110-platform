/* ============================================================
 * 電路設計與模擬 — 檢核
 * ============================================================ */

const QUIZ = [
  { question: '為什麼在實際接線前,要先用軟體「模擬」電路?',
    options: [
      { text: '可在電腦中預先確認電路是否正常,減少實作時燒壞零件的風險', correct: true,
        explain: '正確。SPICE 模擬能先驗證電路,降低出錯與損壞的風險。' },
      { text: '因為法律規定一定要模擬', correct: false },
      { text: '為了讓電路圖比較好看', correct: false },
    ] },
  { question: '電路模擬程式常被統稱為什麼?',
    options: [
      { text: 'CNC', correct: false },
      { text: 'SPICE', correct: true,
        explain: '正確。SPICE 是專門用來模擬電路運作的程式。' },
      { text: 'PCB', correct: false },
    ] },
  { question: '「模擬 → 麵包板 → PCB」這個流程的用意是什麼?',
    options: [
      { text: '逐步驗證,把出錯與零件損壞的風險降到最低', correct: true,
        explain: '正確。先模擬、再用免銲的麵包板測試、最後才轉成正式的 PCB。' },
      { text: '故意讓流程變複雜', correct: false },
      { text: '因為麵包板比 PCB 更耐用', correct: false },
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
        celebrateModule('ch4-circuit', '電路設計與模擬');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});

/* ============================================================
 * 引導式電路積木 — 步驟化建構 LED 點亮 / 分壓器
 * ============================================================ */
(function gcbSim() {
  const svg = document.getElementById('gcbSvg');
  if (!svg) return;
  const tabs = document.getElementById('gcbTabs');
  const titleEl = document.getElementById('gcbTitle');
  const stepsEl = document.getElementById('gcbSteps');
  const readout = document.getElementById('gcbReadout');
  const nextBtn = document.getElementById('gcbNext');
  const resetBtn = document.getElementById('gcbReset');

  /* 共用元件繪製 */
  function battery(x, y) {
    return `<g><line x1="${x-3}" y1="${y-12}" x2="${x-3}" y2="${y+12}" stroke="#1F2937" stroke-width="3"/>
      <line x1="${x+3}" y1="${y-22}" x2="${x+3}" y2="${y+22}" stroke="#1F2937" stroke-width="3"/>
      <text x="${x-10}" y="${y-28}" font-size="13" font-weight="700">+</text>
      <text x="${x+12}" y="${y-28}" font-size="13" font-weight="700" fill="#6B7280">−</text>
      <text x="${x}" y="${y+38}" text-anchor="middle" font-size="11" fill="#6B7280">9V</text></g>`;
  }
  function resistor(x, y, w, label) {
    return `<g><rect x="${x-w/2}" y="${y-7}" width="${w}" height="14" rx="3" fill="#FBBF24" stroke="#92400E" stroke-width="1.5"/>
      <text x="${x}" y="${y-12}" text-anchor="middle" font-size="11" font-weight="700" fill="#92400E">${label}</text></g>`;
  }
  function led(x, y, lit) {
    const glow = lit ? `<circle cx="${x}" cy="${y}" r="20" fill="#DC2626" opacity="0.3"/>` : '';
    const body = lit ? '#DC2626' : '#9CA3AF';
    return `<g>${glow}<polygon points="${x-12},${y} ${x+8},${y-12} ${x+8},${y+12}" fill="${body}" stroke="#1F2937" stroke-width="1.5"/>
      <rect x="${x+8}" y="${y-12}" width="3" height="24" fill="#1F2937"/>
      <text x="${x}" y="${y+30}" text-anchor="middle" font-size="11" fill="#1F2937">LED</text></g>`;
  }
  function wire(d, live) { return `<path d="${d}" stroke="${live?'#DC2626':'#1F2937'}" stroke-width="2.5" fill="none"/>`; }
  function makeDots(pid, n) {
    const dots = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', 3.5);
      c.setAttribute('fill', '#F59E0B');
      svg.appendChild(c);
      dots.push({ el: c, offset: i / n });
    }
    return { dots, pid };
  }

  /* === 場景 === */
  const SC = {
    led: {
      title: '目標:LED 點亮電路(9V + 330Ω + LED)',
      steps: [
        '放一顆 9V 電池',
        '從正極拉一條線到頂部',
        '串接一顆 330Ω 限流電阻',
        '接上 LED(三角形朝右)',
        '回到電池負極,形成完整迴路',
        '通電 → 看電流流動,LED 點亮',
      ],
      draw(step) {
        let elements = '';
        if (step >= 1) elements += battery(60, 140);
        if (step >= 2) elements += wire('M60 118 L60 60 L160 60');
        if (step >= 3) elements += resistor(200, 60, 50, '330Ω') + wire('M225 60 L260 60');
        if (step >= 4) elements += led(300, 60, step >= 6) + wire('M260 60 L288 60') + wire('M308 60 L320 60 L320 200');
        if (step >= 5) elements += wire('M60 162 L60 200 L320 200');
        svg.innerHTML = `<g>${elements}<path id="ledLoop" d="M60 118 L60 60 L320 60 L320 200 L60 200 L60 162" fill="none" stroke="none"/></g>`;
        return step >= 6 ? makeDots('ledLoop', 10) : null;
      },
    },
    div: {
      title: '目標:分壓器測中點電壓(9V + 4.7kΩ + 10kΩ)',
      steps: [
        '放一顆 9V 電池',
        '從正極接出第一個電阻 R1 = 4.7kΩ',
        '串上第二個電阻 R2 = 10kΩ,再接回負極',
        '在 R1 與 R2 之間引出測量點(節點 B)',
        '用克希荷夫電壓定律算出 V_B = 9V × R2/(R1+R2)',
        '對照計算結果與「下方讀數」是否一致',
      ],
      draw(step) {
        let elements = '';
        if (step >= 1) elements += battery(60, 140);
        if (step >= 2) elements += wire('M60 118 L60 60 L160 60') + resistor(200, 60, 50, 'R1 4.7kΩ');
        if (step >= 3) elements += wire('M225 60 L300 60 L300 100') + resistor(300, 130, 30, '').replace('330Ω','') +
          `<rect x="288" y="105" width="24" height="50" rx="3" fill="#FBBF24" stroke="#92400E"/>
           <text x="320" y="135" font-size="11" font-weight="700" fill="#92400E">R2 10kΩ</text>` +
          wire('M300 160 L300 200 L60 200 L60 162');
        if (step >= 4) elements += `<circle cx="300" cy="100" r="6" fill="#FBBF24" stroke="#1F2937" stroke-width="2"/>
          <text x="315" y="100" font-size="13" font-weight="800" fill="#1F2937">B</text>`;
        svg.innerHTML = elements;
        if (step >= 6) {
          readout.style.display = 'block';
          readout.textContent = 'V_B = 9V × 10000 / (4700+10000) = 6.12V  ✓';
        }
        return null;
      },
    },
  };

  let cur = 'led';
  let step = 0;
  let dotGroup = null;
  let raf = 0;

  function renderSteps() {
    const ss = SC[cur].steps;
    stepsEl.innerHTML = ss.map((t, i) => {
      const cls = i < step ? 'done' : i === step ? 'active' : '';
      return `<li class="${cls}"><span class="num">${i+1}</span><span>${t}</span></li>`;
    }).join('');
    titleEl.textContent = SC[cur].title;
    nextBtn.disabled = step >= ss.length;
    nextBtn.textContent = step >= ss.length ? '✓ 已完成' : '▶ 下一步';
  }
  function redraw() {
    if (dotGroup) { dotGroup.dots.forEach(d => d.el.remove()); dotGroup = null; }
    dotGroup = SC[cur].draw(step);
    readout.style.display = (cur === 'div' && step >= 6) ? 'block' : (cur === 'div' ? 'none' : 'none');
  }
  function setScenario(c) {
    cur = c; step = 0; readout.style.display = 'none';
    [...tabs.querySelectorAll('button')].forEach(b => b.classList.toggle('active', b.dataset.c === c));
    renderSteps(); redraw();
  }
  function tick() {
    if (dotGroup) {
      const p = svg.querySelector('#' + dotGroup.pid);
      if (p) {
        const L = p.getTotalLength();
        for (const d of dotGroup.dots) {
          d.offset = (d.offset + 0.012) % 1;
          const pt = p.getPointAtLength(d.offset * L);
          d.el.setAttribute('cx', pt.x);
          d.el.setAttribute('cy', pt.y);
        }
      }
    }
    raf = requestAnimationFrame(tick);
  }

  tabs.addEventListener('click', e => {
    const b = e.target.closest('button[data-c]'); if (b) setScenario(b.dataset.c);
  });
  nextBtn.addEventListener('click', () => {
    if (step < SC[cur].steps.length) { step++; renderSteps(); redraw(); }
  });
  resetBtn.addEventListener('click', () => { step = 0; renderSteps(); redraw(); });
  setScenario('led');
  tick();
})();
