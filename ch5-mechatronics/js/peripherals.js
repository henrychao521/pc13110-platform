/* ============================================================
 * 機電整合的電子周邊 — 伺服馬達角度控制 + 序列埠監控 + 檢核
 * ============================================================ */

let angle = 90, displayAngle = 90;
const canvas = document.getElementById('servoCanvas');
const mon = document.getElementById('serialMon');

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 240;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2, cy = h * 0.66;
  /* 伺服馬達本體 */
  ctx.fillStyle = '#1E40AF';
  ctx.fillRect(cx - 46, cy - 6, 92, 64);
  ctx.fillStyle = '#1E3A8A';
  ctx.fillRect(cx - 60, cy + 6, 14, 30); ctx.fillRect(cx + 46, cy + 6, 14, 30);
  /* 角度刻度弧(0°在右、180°在左,上半圈) */
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy, 74, Math.PI, 0); ctx.stroke();
  for (let a = 0; a <= 180; a += 30) {
    const rad = Math.PI - a / 180 * Math.PI;
    const x1 = cx + Math.cos(rad) * 68, y1 = cy + Math.sin(rad) * -68;
    const x2 = cx + Math.cos(rad) * 80, y2 = cy + Math.sin(rad) * -80;
    ctx.strokeStyle = '#475569';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.fillStyle = '#94A3B8'; ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'center';
    ctx.fillText(a + '°', cx + Math.cos(rad) * 94, cy + Math.sin(rad) * -94 + 4);
  }
  /* 伺服臂(轉到 displayAngle) */
  const rad = Math.PI - displayAngle / 180 * Math.PI;
  const armLen = 66;
  ctx.strokeStyle = '#A78BFA'; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(rad) * armLen, cy + Math.sin(rad) * -armLen);
  ctx.stroke();
  /* 轉軸 */
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '700 15px "JetBrains Mono"'; ctx.textAlign = 'center';
  ctx.fillText(Math.round(displayAngle) + '°', cx, cy + 44);
}

/* 平滑動畫到目標角度 */
function loop() {
  displayAngle += (angle - displayAngle) * 0.2;
  draw();
  if (Math.abs(angle - displayAngle) > 0.3) requestAnimationFrame(loop);
  else { displayAngle = angle; draw(); }
}

function logSerial(v) {
  const line = document.createElement('div');
  line.textContent = '> 角度 angle = ' + v;
  mon.appendChild(line);
  while (mon.children.length > 8) mon.removeChild(mon.firstChild);
  mon.scrollTop = mon.scrollHeight;
}

document.getElementById('angSlider').addEventListener('input', e => {
  angle = +e.target.value;
  document.getElementById('angVal').textContent = angle + '°';
  logSerial(angle);
  requestAnimationFrame(loop);
});
window.addEventListener('resize', draw);
draw();
logSerial(90);

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '機電整合系統「感知 → 處理 → 動作」中,負責「處理」的是?',
    options: [
      { text: '感測器', correct: false },
      { text: '控制板(執行程式做判斷)', correct: true,
        explain: '正確。感測器負責感知、控制板負責處理運算、致動器負責動作。' },
      { text: '伺服馬達', correct: false },
    ] },
  { question: '伺服馬達(Servo)和一般馬達最大的不同是什麼?',
    options: [
      { text: '伺服馬達能「精準轉到指定的角度」', correct: true,
        explain: '正確。伺服馬達可由程式控制轉到特定角度(常見 0°～180°),一般馬達只能持續轉動。' },
      { text: '伺服馬達不需要電', correct: false },
      { text: '伺服馬達只能逆時針轉', correct: false },
    ] },
  { question: '機械開關切換瞬間會快速彈跳數次,微處理器可能誤判成多次按壓。這個問題的解法稱為?',
    options: [
      { text: '去彈跳(Debounce)', correct: true,
        explain: '正確。加延遲或等待接點穩定後再讀取,稱為「去彈跳」。' },
      { text: '加大電壓', correct: false },
      { text: '把開關拆掉', correct: false },
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
        celebrateModule('ch5-peripherals', '機電整合的電子周邊');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});

/* ============================================================
 * 動手接線:感測器接到 ESP32 — LDR / 按鈕 / HC-SR04
 * SVG 接線動畫 + 環境變數滑桿 + 即時序列埠讀值
 * ============================================================ */
(function wireSim() {
  const svg = document.getElementById('wireSvg');
  if (!svg) return;
  const tabs = document.getElementById('wireTabs');
  const ctrlEl = document.getElementById('wireCtrls');
  const wmon = document.getElementById('wireSerial');
  const goBtn = document.getElementById('wireGo');

  const COL = { red:'#DC2626', black:'#1F2937', yellow:'#EAB308', orange:'#F97316', green:'#16A34A' };

  /* ESP32 右側腳位座標 */
  const PIN = {
    '3V3':     [170, 70],
    '5V':      [170, 95],
    'GND':     [170, 120],
    'GPIO 34': [170, 160],
    'GPIO 25': [170, 195],
    'GPIO 5':  [170, 230],
    'GPIO 18': [170, 265],
    'GPIO 13': [170, 300],
  };

  function esp32Svg() {
    let pins = '';
    for (const [name, p] of Object.entries(PIN)) {
      pins += `<circle cx="${p[0]}" cy="${p[1]}" r="4.5" class="wire-pin"/>`;
      pins += `<text x="${p[0] - 9}" y="${p[1] + 3}" text-anchor="end" class="wire-label">${name}</text>`;
    }
    return `<g id="esp32-board">
      <rect x="50" y="30" width="120" height="300" rx="6" fill="#0C4A6E"/>
      <rect x="60" y="86" width="100" height="218" fill="#082F49"/>
      <rect x="60" y="40" width="100" height="38" rx="3" fill="#0EA5E9"/>
      <text x="110" y="63" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">ESP32</text>
      <rect x="92" y="20" width="36" height="14" fill="#94A3B8" stroke="#475569"/>
      <text x="110" y="30" text-anchor="middle" font-size="7" fill="#1F2937">USB</text>
      ${pins}
    </g>`;
  }

  function curve(ax, ay, bx, by) {
    const mid = (ax + bx) / 2;
    return `M${ax} ${ay} C${mid} ${ay}, ${mid} ${by}, ${bx} ${by}`;
  }

  const S = {
    ldr: {
      sensorSvg: () => `<g id="sensor-ldr">
        <rect x="500" y="105" width="80" height="22" rx="4" fill="#fff" stroke="#475569" stroke-width="1.5"/>
        <path d="M508 116 q4 -8 8 0 q4 8 8 0 q4 -8 8 0 q4 8 8 0 q4 -8 8 0 q4 8 8 0 q4 -8 8 0" stroke="#1F2937" fill="none"/>
        <line x1="540" y1="105" x2="540" y2="90"  stroke="#475569" stroke-width="1.5"/>
        <line x1="540" y1="127" x2="540" y2="155" stroke="#475569" stroke-width="1.5"/>
        <g stroke="#F59E0B" stroke-width="2" id="ldrLight">
          <line x1="495" y1="80" x2="505" y2="98"/>
          <line x1="540" y1="65" x2="540" y2="85"/>
          <line x1="585" y1="80" x2="575" y2="98"/>
        </g>
        <text x="540" y="100" text-anchor="middle" font-size="10" font-weight="700" fill="#374151">LDR</text>
        <rect x="500" y="170" width="80" height="18" rx="3" fill="#FBBF24" stroke="#92400E" stroke-width="1.5"/>
        <line x1="510" y1="179" x2="570" y2="179" stroke="#9A3412" stroke-width="2"/>
        <line x1="540" y1="170" x2="540" y2="155" stroke="#92400E" stroke-width="1.5"/>
        <line x1="540" y1="188" x2="540" y2="210" stroke="#92400E" stroke-width="1.5"/>
        <text x="540" y="183" text-anchor="middle" font-size="9" font-weight="700" fill="#92400E">10kΩ</text>
        <circle cx="540" cy="90"  r="4" class="wire-pin"/>
        <circle cx="540" cy="155" r="4" class="wire-pin"/>
        <circle cx="540" cy="210" r="4" class="wire-pin"/>
        <text x="558" y="93"  font-size="10" font-family="JetBrains Mono" fill="#475569">VCC</text>
        <text x="558" y="158" font-size="10" font-family="JetBrains Mono" fill="#475569">ADC</text>
        <text x="558" y="213" font-size="10" font-family="JetBrains Mono" fill="#475569">GND</text>
      </g>`,
      wires: [
        { d: curve(170, 70,  540, 90),  c: COL.red },
        { d: curve(170, 160, 540, 155), c: COL.yellow },
        { d: curve(170, 120, 540, 210), c: COL.black },
      ],
      ctrl: `<div class="wire-ctrl-row"><span class="wcl">☀️ 環境亮度</span>
        <input type="range" id="ldrLux" min="0" max="10000" value="800" step="50">
        <span class="wcv" id="ldrLuxV">800 lux</span></div>`,
      init() {
        const slider = document.getElementById('ldrLux');
        const lv = document.getElementById('ldrLuxV');
        const lightG = document.getElementById('ldrLight');
        const upd = () => {
          const lux = +slider.value;
          lv.textContent = lux + ' lux';
          if (lightG) lightG.setAttribute('opacity', Math.min(1, lux / 4000).toFixed(2));
          return lux;
        };
        return {
          listen(update) { slider.addEventListener('input', update); },
          read() {
            const lux = upd();
            const R_ldr = Math.max(50, 1e6 / Math.pow(Math.max(1, lux), 0.7));
            const v = 3.3 * 10000 / (10000 + R_ldr);
            const adc = Math.round(4095 * v / 3.3);
            return `光線=${lux} lux | R(LDR)≈${Math.round(R_ldr)}Ω | analogRead(34)=${adc} | V≈${v.toFixed(2)}V`;
          },
        };
      },
    },

    btn: {
      sensorSvg: () => `<g id="sensor-btn">
        <rect x="490" y="140" width="100" height="60" rx="6" fill="#1F2937"/>
        <circle cx="540" cy="170" r="16" fill="#EF4444" stroke="#7F1D1D" stroke-width="2" id="btnCap"/>
        <text x="540" y="174" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">BTN</text>
        <line x1="500" y1="200" x2="500" y2="220" stroke="#475569" stroke-width="2"/>
        <line x1="580" y1="200" x2="580" y2="220" stroke="#475569" stroke-width="2"/>
        <circle cx="500" cy="225" r="4" class="wire-pin"/>
        <circle cx="580" cy="225" r="4" class="wire-pin"/>
        <text x="500" y="245" text-anchor="middle" font-size="10" font-family="JetBrains Mono" fill="#475569">Pin A</text>
        <text x="580" y="245" text-anchor="middle" font-size="10" font-family="JetBrains Mono" fill="#475569">Pin B</text>
        <text x="540" y="280" text-anchor="middle" font-size="11" fill="#6B7280">ESP32 用 INPUT_PULLUP 模式內建上拉</text>
        <text x="540" y="296" text-anchor="middle" font-size="11" fill="#6B7280">(放開=讀到 HIGH;按下短路到 GND=LOW)</text>
      </g>`,
      wires: [
        { d: curve(170, 195, 500, 225), c: COL.yellow },
        { d: curve(170, 120, 580, 225), c: COL.black },
      ],
      ctrl: `<div class="wire-ctrl-row"><span class="wcl">👆 按鈕狀態</span>
        <button type="button" id="btnToggle" class="wire-btn-toggle">放開(未按)</button>
        <span class="wcv" id="btnRead">digitalRead = 1</span></div>`,
      init() {
        const toggle = document.getElementById('btnToggle');
        const cap = document.getElementById('btnCap');
        const out = document.getElementById('btnRead');
        let pressed = false;
        let listener = null;
        toggle.addEventListener('click', () => {
          pressed = !pressed;
          toggle.textContent = pressed ? '按下' : '放開(未按)';
          toggle.classList.toggle('on', pressed);
          if (cap) cap.setAttribute('transform', pressed ? 'translate(0,3)' : '');
          if (listener) listener();
        });
        return {
          listen(update) { listener = update; },
          read() {
            const v = pressed ? 0 : 1;
            out.textContent = `digitalRead = ${v}`;
            return `按鈕狀態:${pressed ? '按下' : '放開'} | digitalRead(GPIO 25)=${v} | 電壓≈${pressed ? '0V (LOW)' : '3.3V (HIGH)'}`;
          },
        };
      },
    },

    hcsr04: {
      sensorSvg: () => `<g id="sensor-hc">
        <rect x="450" y="100" width="180" height="65" rx="5" fill="#1E3A8A"/>
        <circle cx="490" cy="130" r="22" fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        <circle cx="590" cy="130" r="22" fill="#94A3B8" stroke="#475569" stroke-width="2"/>
        <text x="490" y="134" text-anchor="middle" font-size="10" font-weight="700" fill="#1F2937">T</text>
        <text x="590" y="134" text-anchor="middle" font-size="10" font-weight="700" fill="#1F2937">R</text>
        <text x="540" y="158" text-anchor="middle" font-size="11" font-weight="700" fill="#FCD34D">HC-SR04</text>
        ${[['VCC',475],['TRIG',510],['ECHO',570],['GND',605]].map(([n,x])=>`
          <line x1="${x}" y1="165" x2="${x}" y2="185" stroke="#475569" stroke-width="2"/>
          <circle cx="${x}" cy="190" r="4" class="wire-pin"/>
          <text x="${x}" y="207" text-anchor="middle" font-size="9" font-family="JetBrains Mono" fill="#475569">${n}</text>
        `).join('')}
        <g id="hcWave" opacity="0.7">
          <path d="M468 130 q-8 -8 -16 0 q-8 8 -16 0" stroke="#FCD34D" fill="none" stroke-width="1.5"/>
          <path d="M468 130 q-14 -14 -28 0 q-14 14 -28 0" stroke="#FCD34D" fill="none" stroke-width="1.2"/>
        </g>
        <line id="hcWall" x1="380" y1="100" x2="380" y2="160" stroke="#475569" stroke-width="5" opacity="0.6"/>
        <text id="hcWallT" x="380" y="225" text-anchor="middle" font-size="10" fill="#475569" font-family="JetBrains Mono">物體 ← 50 cm</text>
      </g>`,
      wires: [
        { d: curve(170, 95,  475, 190), c: COL.red },
        { d: curve(170, 230, 510, 190), c: COL.green },
        { d: curve(170, 265, 570, 190), c: COL.orange },
        { d: curve(170, 120, 605, 190), c: COL.black },
      ],
      ctrl: `<div class="wire-ctrl-row"><span class="wcl">📏 物體距離</span>
        <input type="range" id="hcDist" min="2" max="400" value="50" step="1">
        <span class="wcv" id="hcDistV">50 cm</span></div>`,
      init() {
        const slider = document.getElementById('hcDist');
        const lv = document.getElementById('hcDistV');
        const wall = document.getElementById('hcWall');
        const wallT = document.getElementById('hcWallT');
        const upd = () => {
          const d = +slider.value;
          lv.textContent = d + ' cm';
          if (wall && wallT) {
            const x = Math.max(220, 450 - (d / 400) * 230);
            wall.setAttribute('x1', x); wall.setAttribute('x2', x);
            wallT.setAttribute('x', x); wallT.textContent = `物體 ← ${d} cm`;
          }
          return d;
        };
        return {
          listen(update) { slider.addEventListener('input', update); },
          read() {
            const d = upd();
            const us = Math.round(d / 0.01715);
            const tag = d < 10 ? '⚠ 過近' : d > 350 ? '⚠ 接近極限' : '✓ 範圍內';
            return `距離=${d} cm | ECHO 高電位≈${us} μs | ${tag}`;
          },
        };
      },
    },
  };

  let cur = 'ldr';
  let wired = false;
  let tickT = null;

  function render(s) {
    cur = s;
    wired = false;
    if (tickT) { clearInterval(tickT); tickT = null; }
    goBtn.disabled = false;
    goBtn.textContent = '▶ 接線通電';
    ctrlEl.innerHTML = '';
    wmon.innerHTML = '<div style="color:#94A3B8">(尚未接線 — 點上方按鈕開始接線)</div>';
    const sc = S[s];
    const wiresSvg = sc.wires.map((w, i) =>
      `<path d="${w.d}" class="wire-wire" stroke="${w.c}"/>`).join('');
    svg.innerHTML = esp32Svg() + sc.sensorSvg() + wiresSvg;
    [...tabs.querySelectorAll('button')].forEach(b => b.classList.toggle('active', b.dataset.s === s));
  }

  function goWire() {
    if (wired) return;
    wired = true;
    goBtn.disabled = true;
    goBtn.textContent = '✓ 已通電';
    const paths = [...svg.querySelectorAll('.wire-wire')];
    paths.forEach((p, i) => setTimeout(() => p.classList.add('show'), i * 350));
    setTimeout(() => svg.querySelectorAll('.wire-pin').forEach(c => c.classList.add('lit')),
      paths.length * 350 + 700);

    const sc = S[cur];
    ctrlEl.innerHTML = sc.ctrl;
    setTimeout(() => {
      const ctl = sc.init();
      wmon.innerHTML = '';
      const update = () => {
        const line = ctl.read();
        const d = document.createElement('div');
        d.textContent = '> ' + line;
        wmon.appendChild(d);
        while (wmon.children.length > 24) wmon.firstElementChild.remove();
        wmon.scrollTop = wmon.scrollHeight;
      };
      ctl.listen(update);
      update();
      tickT = setInterval(update, 900);
    }, paths.length * 350 + 1000);
  }

  tabs.addEventListener('click', e => {
    const b = e.target.closest('button[data-s]');
    if (b) render(b.dataset.s);
  });
  goBtn.addEventListener('click', goWire);
  render('ldr');
})();
