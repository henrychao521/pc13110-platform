/* ============================================================
 * 基本電子元件 — 元件圖鑑 + 電阻色碼計算器 + 檢核
 * ============================================================ */

const COMPONENTS = [
  { em: '⏛', name: '電阻器', sym: 'R / Ω',
    fn: '阻止電流通過,用於分壓、限流、保護電路。', use: '電熱裝置、保護電路、控制訊號;熱敏電阻還能當溫度感測元件。' },
  { em: '⊐⊏', name: '電容器', sym: 'C / F',
    fn: '在兩平行導電板間隔絕緣材料,能暫時儲存電荷。', use: '濾波(讓電源更穩定)、振盪、暫時儲能;分有極性與無極性兩種。' },
  { em: '〰', name: '電感器', sym: 'L / H',
    fn: '由線圈構成,通電時儲存磁能,能抵抗電流的變化。', use: '濾波、變壓器、訊號調諧。' },
  { em: '▷｜', name: '二極體', sym: 'D',
    fn: '讓電流「只能單方向通過」的元件。', use: '整流(把交流變直流)、保護電路;發光二極體(LED)還能發光。' },
  { em: '🎚', name: '電晶體', sym: 'Q',
    fn: '主動元件,能「放大」訊號,也能當作電子開關。', use: '訊號放大、開關控制——是現代電子電路的核心元件。' },
  { em: '▦', name: '積體電路 IC', sym: 'IC',
    fn: '把大量電晶體、電阻等元件整合在一塊微小晶片上。', use: '如 NE555 計時器、LM386 音頻放大器、微控制器——一顆 IC 就是一個完整功能模組。' },
];
(function buildComps() {
  const grid = document.getElementById('compGrid');
  COMPONENTS.forEach(c => {
    const card = document.createElement('div');
    card.className = 'comp-card';
    card.innerHTML = `
      <div class="cc-h"><span class="cc-em">${c.em}</span>
        <span class="cc-n">${c.name}</span><span class="cc-sym">${c.sym}</span></div>
      <div class="cc-b">
        <div><b>功能:</b>${c.fn}</div>
        <div><b>用途:</b>${c.use}</div>
      </div>`;
    card.querySelector('.cc-h').addEventListener('click', () => {
      card.classList.toggle('open');
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
    grid.appendChild(card);
  });
})();

/* ============================================================
 * 電阻色碼計算器
 * ============================================================ */
const DIGIT_COLORS = [
  ['黑', '#1a1a1a', 0], ['棕', '#7B3F00', 1], ['紅', '#D62828', 2], ['橙', '#E07000', 3],
  ['黃', '#E6B800', 4], ['綠', '#2E8B57', 5], ['藍', '#1E5FBF', 6], ['紫', '#7B30C0', 7],
  ['灰', '#808080', 8], ['白', '#EDEDED', 9],
];
const MULT_COLORS = [
  ['黑 ×1', '#1a1a1a', 1], ['棕 ×10', '#7B3F00', 10], ['紅 ×100', '#D62828', 100],
  ['橙 ×1k', '#E07000', 1e3], ['黃 ×10k', '#E6B800', 1e4], ['綠 ×100k', '#2E8B57', 1e5],
  ['藍 ×1M', '#1E5FBF', 1e6], ['金 ×0.1', '#C9A227', 0.1], ['銀 ×0.01', '#B0B0B0', 0.01],
];
const TOL_COLORS = [
  ['棕 ±1%', '#7B3F00', 1], ['紅 ±2%', '#D62828', 2], ['綠 ±0.5%', '#2E8B57', 0.5],
  ['藍 ±0.25%', '#1E5FBF', 0.25], ['紫 ±0.1%', '#7B30C0', 0.1], ['金 ±5%', '#C9A227', 5],
  ['銀 ±10%', '#B0B0B0', 10],
];

let bandMode = 4;
/* 預設:黃 紫 紅 金 → 4.7kΩ ±5% */
let sel = { d: [4, 7, 2], mult: 2, tol: 5 };  /* mult index, tol index */

function buildBandPickers() {
  const row = document.getElementById('bandRow');
  row.innerHTML = '';
  const nDigits = bandMode === 5 ? 3 : 2;
  function picker(label, options, idx, onChange) {
    const wrap = document.createElement('div');
    wrap.className = 'band-pick';
    const lab = document.createElement('div');
    lab.className = 'bp-label'; lab.textContent = label;
    const s = document.createElement('select');
    options.forEach((o, i) => {
      const op = document.createElement('option');
      op.value = i; op.textContent = o[0];
      if (i === idx) op.selected = true;
      s.appendChild(op);
    });
    s.addEventListener('change', () => { onChange(+s.value); updateResistor(); });
    wrap.appendChild(lab); wrap.appendChild(s);
    return wrap;
  }
  for (let i = 0; i < nDigits; i++) {
    row.appendChild(picker('第 ' + (i + 1) + ' 環', DIGIT_COLORS, sel.d[i], v => sel.d[i] = v));
  }
  row.appendChild(picker('乘冪', MULT_COLORS, sel.mult, v => sel.mult = v));
  row.appendChild(picker('誤差', TOL_COLORS, sel.tol, v => sel.tol = v));
}

function fmtOhm(v) {
  if (v >= 1e6) return (v / 1e6).toFixed(2).replace(/\.?0+$/, '') + ' MΩ';
  if (v >= 1e3) return (v / 1e3).toFixed(2).replace(/\.?0+$/, '') + ' kΩ';
  return v.toFixed(2).replace(/\.?0+$/, '') + ' Ω';
}

function updateResistor() {
  const nDigits = bandMode === 5 ? 3 : 2;
  let digits = 0;
  for (let i = 0; i < nDigits; i++) digits = digits * 10 + DIGIT_COLORS[sel.d[i]][2];
  const val = digits * MULT_COLORS[sel.mult][2];
  const tol = TOL_COLORS[sel.tol][2];
  /* 繪製電阻 */
  const res = document.getElementById('resistor');
  res.innerHTML = '';
  const bandColors = [];
  for (let i = 0; i < nDigits; i++) bandColors.push(DIGIT_COLORS[sel.d[i]][1]);
  bandColors.push(MULT_COLORS[sel.mult][1]);
  bandColors.push(TOL_COLORS[sel.tol][1]);
  bandColors.forEach((c, i) => {
    const b = document.createElement('div');
    b.className = 'rband';
    b.style.background = c;
    if (i === bandColors.length - 1) b.style.marginLeft = '20px';   /* 誤差環稍微分開 */
    res.appendChild(b);
  });
  document.getElementById('resOut').textContent = fmtOhm(val) + '  ±' + tol + '%';
  const target = Math.abs(val - 4700) < 1;
  document.getElementById('resNote').innerHTML = target
    ? '🎉 答對了!黃-紫-紅-金 正好是 4.7 kΩ ±5% 的常見電阻。'
    : '目前阻值:' + fmtOhm(val) + '。試著調出 4.7 kΩ(黃-紫-紅)。';
  if (target && !Progress.isDone('ch4-components')) {
    if (quizDone) finishModule();
    else if (!resistorTarget && typeof showToast === 'function') showToast('色碼正確!完成下方檢核即可過關', '');
  }
  resistorTarget = target;
}
let resistorTarget = false, quizDone = false;
function finishModule() {
  celebrateModule('ch4-components', '基本電子元件');
  document.getElementById('nextBtn').classList.add('pop-in');
}

document.querySelectorAll('.bandmode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bandmode').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    bandMode = +btn.dataset.mode;
    if (bandMode === 5 && sel.d.length < 3) sel.d[2] = 0;
    buildBandPickers();
    updateResistor();
    if (typeof SoundFX !== 'undefined') SoundFX.click();
  });
});
buildBandPickers();
updateResistor();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '下列哪一個是「主動元件」(能放大或控制訊號)?',
    options: [
      { text: '電阻器', correct: false },
      { text: '電晶體', correct: true, explain: '正確。電晶體能放大訊號、也能當開關,是主動元件。電阻、電容、電感屬被動元件。' },
      { text: '電容器', correct: false },
    ] },
  { question: '二極體最主要的特性是什麼?',
    options: [
      { text: '讓電流只能「單方向」通過', correct: true,
        explain: '正確。二極體的單向導通特性,常用於整流(交流變直流)。' },
      { text: '把電流放大十倍', correct: false },
      { text: '儲存大量電荷', correct: false },
    ] },
  { question: '四色環電阻「黃-紫-紅-金」,它的阻值是多少?',
    options: [
      { text: '47 Ω ±5%', correct: false },
      { text: '4.7 kΩ ±5%(黃4、紫7、紅×100、金±5%)', correct: true,
        explain: '正確。47 × 100 = 4700 Ω = 4.7 kΩ,金環代表 ±5% 誤差。' },
      { text: '470 kΩ ±10%', correct: false },
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
        quizDone = true;
        // 完成條件統一：檢核 + 4.7kΩ 色碼挑戰都要完成（原本檢核單獨就過關，挑戰形同裝飾）
        if (Progress.isDone('ch4-components')) return;
        if (resistorTarget) finishModule();
        else if (typeof showToast === 'function') showToast('檢核完成!再把色碼調出 4.7 kΩ 就過關', '');
      }
    },
  });
});

/* ============================================================
 * 元件運作動畫 — LED / 電容 / 二極體 / 電晶體
 * SVG 電路圖 + 沿線跑的電流點 + 互動控制
 * ============================================================ */
(function compSim() {
  const svg = document.getElementById('csimSvg');
  if (!svg) return;
  const tabs = document.getElementById('csimTabs');
  const ctrlEl = document.getElementById('csimCtrls');
  const infoEl = document.getElementById('csimInfo');

  function battery(x, y) {
    return `<g>
      <line x1="${x-3}" y1="${y-12}" x2="${x-3}" y2="${y+12}" stroke="#1F2937" stroke-width="3"/>
      <line x1="${x+3}" y1="${y-22}" x2="${x+3}" y2="${y+22}" stroke="#1F2937" stroke-width="3"/>
      <text x="${x-10}" y="${y-26}" font-size="13" font-weight="700" fill="#1F2937">+</text>
      <text x="${x+10}" y="${y-26}" font-size="13" font-weight="700" fill="#6B7280">−</text>
      <text x="${x}" y="${y+40}" text-anchor="middle" font-size="11" fill="#6B7280">9V</text>
    </g>`;
  }
  function resistor(x, y, label) {
    return `<g>
      <rect x="${x-22}" y="${y-7}" width="44" height="14" rx="3" fill="#FBBF24" stroke="#92400E" stroke-width="1.5"/>
      <text x="${x}" y="${y-12}" text-anchor="middle" font-size="11" font-weight="700" fill="#92400E">${label||'R'}</text>
    </g>`;
  }
  function led(x, y, lit, color) {
    color = color || '#EF4444';
    const glow = lit ? `<circle cx="${x}" cy="${y}" r="20" fill="${color}" opacity="0.3"/>` : '';
    const body = lit ? color : '#9CA3AF';
    return `<g>${glow}
      <polygon points="${x-12},${y} ${x+8},${y-12} ${x+8},${y+12}" fill="${body}" stroke="#1F2937" stroke-width="1.5"/>
      <rect x="${x+8}" y="${y-12}" width="3" height="24" fill="#1F2937"/>
      <text x="${x}" y="${y+30}" text-anchor="middle" font-size="11" fill="#1F2937">LED</text>
    </g>`;
  }
  function makeDots(pathId, n) {
    const dots = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', 3.5);
      c.setAttribute('fill', '#F59E0B');
      c.setAttribute('stroke', '#92400E');
      c.setAttribute('stroke-width', '0.5');
      svg.appendChild(c);
      dots.push({ el: c, offset: i / n });
    }
    return { dots, pathId };
  }
  function stepDots(group, speed) {
    const path = svg.querySelector('#' + group.pathId);
    if (!path) return;
    const L = path.getTotalLength();
    for (const d of group.dots) {
      d.offset = (d.offset + speed) % 1;
      const p = path.getPointAtLength(d.offset * L);
      d.el.setAttribute('cx', p.x);
      d.el.setAttribute('cy', p.y);
    }
  }

  const SC = {
    led: {
      init() {
        let on = true;
        const draw = () => {
          svg.innerHTML = `
            ${battery(80, 140)}
            <path id="loopPath" class="csim-wire ${on?'live':''}"
              d="M83 118 L83 70 L640 70 L640 140 L580 140 L580 200 L83 200 L83 162"/>
            ${resistor(300, 70, '330Ω')}
            ${led(580, 140, on, '#DC2626')}
            <g transform="translate(500,70)">
              <circle r="6" fill="#0EA5E9" stroke="#0b0b18" stroke-width="1.5"/>
              <line x1="-6" y1="-6" x2="${on?6:-14}" y2="${on?-6:-18}" stroke="#1F2937" stroke-width="3"/>
              <circle cx="6" cy="-6" r="3" fill="#1F2937"/>
              <text y="-26" text-anchor="middle" font-size="11" font-weight="700" fill="#1F2937">${on?'ON':'OFF'}</text>
            </g>`;
          return on ? makeDots('loopPath', 14) : null;
        };
        let grp = draw();
        return {
          ctrls: `<button id="ledSw" class="on">⏻ 開關 ON</button>
            <button id="ledNoR" type="button">移除電阻會怎樣?</button>`,
          bind() {
            infoEl.innerHTML = '✅ 接通:電池正極推動電子,經過<strong>電阻</strong>限流後到 LED,讓它發光。電流回到負極形成完整迴路。';
            document.getElementById('ledSw').addEventListener('click', () => {
              on = !on; grp = draw();
              const btn = document.getElementById('ledSw');
              btn.className = on?'on':'';
              btn.textContent = on?'⏻ 開關 ON':'⏻ 開關 OFF';
              infoEl.innerHTML = on
                ? '✅ 接通:電池正極推動電子,經過<strong>電阻</strong>限流後到 LED,讓它發光。'
                : '❌ 斷開:迴路被切斷,沒有電流流動,LED 不亮。';
            });
            document.getElementById('ledNoR').addEventListener('click', () => {
              infoEl.innerHTML = '⚠ <strong>沒有電阻</strong>:電流會瞬間飆高,LED 會被燒掉!所以一定要串電阻限流。';
            });
          },
          tick() { if (on && grp) stepDots(grp, 0.012); },
        };
      },
    },
    cap: {
      init() {
        let mode = 'charge';
        let charge = 0;
        const draw = () => {
          const f = charge;
          svg.innerHTML = `
            ${battery(80, 140)}
            <path id="capCh" class="csim-wire ${mode==='charge'?'live':''}"
              d="M83 118 L83 70 L300 70 L300 130"/>
            <path id="capDi" class="csim-wire ${mode==='discharge'?'live':''}"
              d="M300 150 L300 220 L500 220 L500 158"/>
            <path class="csim-wire" d="M83 162 L83 220 L260 220"/>
            <path class="csim-wire" d="M340 70 L500 70 L500 128"/>
            <line x1="280" y1="130" x2="320" y2="130" stroke="#1F2937" stroke-width="3"/>
            <line x1="280" y1="150" x2="320" y2="150" stroke="#1F2937" stroke-width="3"/>
            <rect x="280" y="118" width="40" height="10" fill="#FCD34D" opacity="${f}"/>
            <text x="300" y="170" text-anchor="middle" font-size="11" fill="#6B7280">電容 C</text>
            ${resistor(180, 70, '1kΩ')}
            ${led(500, 140, mode==='discharge' && f>0.05, '#22C55E')}
            <g transform="translate(640,40)">
              <rect width="20" height="200" fill="none" stroke="#1F2937" stroke-width="2" rx="3"/>
              <rect x="2" y="${202 - f*200}" width="16" height="${f*200}" fill="#3B82F6"/>
              <text x="10" y="-6" text-anchor="middle" font-size="10" fill="#6B7280">充電量</text>
              <text x="10" y="220" text-anchor="middle" font-size="11" font-family="JetBrains Mono" fill="#1E3A8A">${Math.round(f*100)}%</text>
            </g>`;
          if (mode === 'charge' && f < 0.99) return makeDots('capCh', 6);
          if (mode === 'discharge' && f > 0.05) return makeDots('capDi', 6);
          return null;
        };
        let grp = draw();
        const setMode = (m) => {
          mode = m;
          ['mC','mD','mO'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('on', id === ({charge:'mC',discharge:'mD',open:'mO'}[m]));
          });
          grp = draw();
          infoEl.innerHTML = m === 'charge'
            ? '🔌 <strong>充電中</strong>:電子流向電容兩極板,正負電荷累積。電容「滿」起來後充電電流趨近於零。'
            : m === 'discharge'
            ? '⚡ <strong>放電中</strong>:把電容接到 LED——電容像小電池一樣推動電流,LED 亮起。能量很快用完(充電量條會下降)。'
            : '⏸ <strong>斷開</strong>:電容保留電荷不消失,等待下一次連接。';
        };
        return {
          ctrls: `<button id="mC" class="on">🔌 充電</button>
            <button id="mD">⚡ 放電</button>
            <button id="mO">⏸ 斷開</button>
            <button id="mReset" style="border-color:var(--text-muted);color:var(--text-muted)">↺ 重設</button>`,
          bind() {
            document.getElementById('mC').addEventListener('click', () => setMode('charge'));
            document.getElementById('mD').addEventListener('click', () => setMode('discharge'));
            document.getElementById('mO').addEventListener('click', () => setMode('open'));
            document.getElementById('mReset').addEventListener('click', () => { charge = 0; grp = draw(); });
            setMode('charge');
          },
          tick() {
            // 充電條每變化 5% 重繪一次（原本用亂數機率重繪，會抖動）
            let needRedraw = false;
            if (mode === 'charge') {
              if (charge < 1) charge = Math.min(1, charge + 0.006);
            } else if (mode === 'discharge') {
              if (charge > 0) charge = Math.max(0, charge - 0.012);
            }
            if (this._drawn === undefined) this._drawn = -1;
            if (Math.abs(charge - this._drawn) >= 0.05 || ((charge === 0 || charge === 1) && this._drawn !== charge)) {
              needRedraw = true;
              this._drawn = charge;
            }
            if (needRedraw) grp = draw();
            if (grp) stepDots(grp, mode === 'discharge' ? 0.014 : 0.012);
          },
        };
      },
    },
    diode: {
      init() {
        let fwd = true;
        const draw = () => {
          const pos = fwd ? 80 : 640;
          const neg = fwd ? 640 : 80;
          svg.innerHTML = `
            ${battery(pos, 140)}
            <path id="dPath" class="csim-wire ${fwd?'live':''}"
              d="M${pos===80?83:pos+3} 118 L${pos===80?83:pos+3} 70 L${pos===80?640:80} 70 L${pos===80?640:80} 200 L${pos===80?83:pos+3} 200 L${pos===80?83:pos+3} 162"/>
            ${resistor(300, 70, '470Ω')}
            <g transform="translate(480,70)">
              <line x1="-30" y1="0" x2="-14" y2="0" stroke="#1F2937" stroke-width="3"/>
              <line x1="6" y1="0" x2="22" y2="0" stroke="#1F2937" stroke-width="3"/>
              <polygon points="-14,-12 -14,12 6,0" fill="${fwd?'#1F2937':'#9CA3AF'}" stroke="#1F2937" stroke-width="1.5"/>
              <line x1="6" y1="-12" x2="6" y2="12" stroke="${fwd?'#1F2937':'#9CA3AF'}" stroke-width="3"/>
              <text y="-18" text-anchor="middle" font-size="11" font-weight="700" fill="#1F2937">二極體</text>
              <text y="28" text-anchor="middle" font-size="9" fill="#6B7280">${fwd?'→ 順向(導通)':'← 逆向(阻擋)'}</text>
            </g>
            ${led(fwd?580:140, 200, fwd, '#EAB308')}
            ${fwd?'':'<text x="480" y="50" text-anchor="middle" font-size="14" font-weight="700" fill="#DC2626">⛔ 電流被擋下</text>'}`;
          return fwd ? makeDots('dPath', 12) : null;
        };
        let grp = draw();
        return {
          ctrls: `<button id="dFlip">⇄ 反轉電池極性</button>`,
          bind() {
            infoEl.innerHTML = '✅ <strong>順向偏壓</strong>:電池正極接二極體陽極(三角形寬邊),電流通過,LED 亮。';
            document.getElementById('dFlip').addEventListener('click', () => {
              fwd = !fwd; grp = draw();
              document.getElementById('dFlip').classList.toggle('on', !fwd);
              infoEl.innerHTML = fwd
                ? '✅ <strong>順向偏壓</strong>:電池正極接陽極,電流通過,LED 亮。'
                : '⛔ <strong>逆向偏壓</strong>:電池極性反過來。二極體像「單向閥」把電流擋下,LED 不亮——這就是「整流」的基礎。';
            });
          },
          tick() { if (fwd && grp) stepDots(grp, 0.014); },
        };
      },
    },
    trans: {
      init() {
        let base = false;
        const draw = () => {
          svg.innerHTML = `
            ${battery(80, 80)}
            <path id="cPath" class="csim-wire ${base?'live':''}"
              d="M83 58 L83 30 L640 30 L640 130 L500 130 L500 110"/>
            <path class="csim-wire" d="M500 150 L500 200 L83 200 L83 102"/>
            ${resistor(300, 30, '220Ω')}
            ${led(640, 80, base, '#DC2626')}
            <text x="180" y="22" font-size="11" fill="#6B7280">主迴路(大電流)</text>
            ${battery(80, 220)}
            <path id="bPath" class="csim-wire ${base?'live':''}"
              d="M83 198 L83 175 L380 175 L380 145"/>
            <path class="csim-wire" d="M380 235 L380 250 L83 250 L83 242"/>
            ${resistor(220, 175, '10kΩ')}
            <text x="280" y="262" font-size="11" fill="#6B7280">基極小電流(透過 10kΩ 限流)</text>
            <g transform="translate(450,140)">
              <circle r="28" fill="none" stroke="#1F2937" stroke-width="2"/>
              <line x1="-12" y1="-18" x2="-12" y2="18" stroke="#1F2937" stroke-width="3"/>
              <line x1="-12" y1="-8" x2="14" y2="-20" stroke="#1F2937" stroke-width="2"/>
              <line x1="-12" y1="8" x2="14" y2="20" stroke="#1F2937" stroke-width="2"/>
              <polygon points="6,18 14,20 10,12" fill="#1F2937"/>
              <line x1="14" y1="-20" x2="14" y2="-38" stroke="#1F2937" stroke-width="2"/>
              <line x1="14" y1="20" x2="14" y2="38" stroke="#1F2937" stroke-width="2"/>
              <line x1="-12" y1="0" x2="-50" y2="0" stroke="#1F2937" stroke-width="2"/>
              <text x="-20" y="-3" text-anchor="end" font-size="10" fill="#6B7280">B</text>
              <text x="22" y="-22" font-size="10" fill="#6B7280">C</text>
              <text x="22" y="40" font-size="10" fill="#6B7280">E</text>
              <text y="55" text-anchor="middle" font-size="11" font-weight="700" fill="#1F2937">NPN</text>
            </g>
            <g transform="translate(280,175)">
              <circle r="6" fill="#0EA5E9" stroke="#0b0b18" stroke-width="1.5"/>
              <line x1="-6" y1="-6" x2="${base?6:-14}" y2="${base?-6:-18}" stroke="#1F2937" stroke-width="3"/>
              <circle cx="6" cy="-6" r="3" fill="#1F2937"/>
              <text y="-26" text-anchor="middle" font-size="10" font-weight="700" fill="#1F2937">${base?'按下':'放開'}</text>
            </g>`;
          const groups = [];
          if (base) { groups.push(makeDots('cPath', 12)); groups.push(makeDots('bPath', 5)); }
          return groups;
        };
        let groups = draw();
        return {
          ctrls: `<button id="tFlip">👆 切換基極輸入</button>`,
          bind() {
            infoEl.innerHTML = '⏸ 基極沒電流 → 電晶體截止 → 主迴路斷掉 → LED 不亮。點按鈕讓基極通電試試。';
            document.getElementById('tFlip').addEventListener('click', () => {
              base = !base; groups = draw();
              document.getElementById('tFlip').classList.toggle('on', base);
              infoEl.innerHTML = base
                ? '✅ 基極通了小電流 → 電晶體「導通」→ 主迴路也通了 → LED 亮。<br><strong>關鍵</strong>:幾 mA 基極電流就控制了幾百 mA 集極電流——「<strong>小電流控制大電流</strong>」。'
                : '⏸ 基極沒電流 → 電晶體截止 → 主迴路斷掉 → LED 不亮。';
            });
          },
          tick() { for (const g of groups) stepDots(g, 0.014); },
        };
      },
    },
  };

  let active = null;
  function render(c) {
    active = SC[c].init();
    ctrlEl.innerHTML = active.ctrls;
    active.bind();
    [...tabs.querySelectorAll('button')].forEach(b => b.classList.toggle('active', b.dataset.c === c));
  }
  function loop() { if (active && active.tick) active.tick(); requestAnimationFrame(loop); }
  tabs.addEventListener('click', e => {
    const b = e.target.closest('button[data-c]');
    if (b) render(b.dataset.c);
  });
  render('led');
  loop();
})();

