/* ============================================================
 * 常見控制板 — 選板挑戰
 * ============================================================ */

const QUIZ = [
  { question: '你要做一個「會把感測到的溫度上傳到雲端」的智慧裝置,最適合用哪種控制板?',
    options: [
      { text: 'Arduino Uno', correct: false },
      { text: 'ESP32', correct: true,
        explain: '正確。要把資料上傳雲端需要連網,ESP32 內建 WiFi,最適合這類物聯網專案。' },
      { text: '都不行', correct: false },
    ] },
  { question: '課堂上要讓「完全沒寫過程式」的同學,最快做出一個會偵測搖晃的小裝置,適合用?',
    options: [
      { text: 'micro:bit——板上內建加速度計與感測器,可用積木式程式,門檻最低', correct: true,
        explain: '正確。micro:bit 為教育設計,內建感測器、支援積木式程式,最適合零基礎入門。' },
      { text: 'Raspberry Pi', correct: false },
      { text: 'ESP32', correct: false },
    ] },
  { question: '某專案需要「即時影像辨識」,要處理大量影像運算,較適合?',
    options: [
      { text: 'Arduino Uno', correct: false },
      { text: 'Raspberry Pi——是會跑作業系統的單板電腦,運算力較強', correct: true,
        explain: '正確。影像辨識、AI 等較重的運算,適合運算力強、能跑作業系統的 Raspberry Pi。' },
      { text: 'micro:bit', correct: false },
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
        celebrateModule('ch5-boards', '常見控制板');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});

/* ============================================================
 * ESP32 腳位接線挑戰 — 為元件挑選正確的腳位
 * ============================================================ */
(function pinChallenge() {
  const svg = document.getElementById('pinSvg');
  if (!svg) return;
  const titleEl = document.getElementById('pinTitle');
  const descEl = document.getElementById('pinDesc');
  const slotsEl = document.getElementById('pinSlots');
  const statusEl = document.getElementById('pinStatus');
  const nextBtn = document.getElementById('pinNext');
  const resetBtn = document.getElementById('pinReset');

  /* ESP32 DevKit V1 簡化腳位定義(雙排,左右各 13 隻)*/
  const PINS = [
    /* 左排(由上到下) */
    { name:'3V3',  roles:['POW3V3'], color:'#DC2626' },
    { name:'GND',  roles:['GND'],    color:'#1F2937' },
    { name:'D15',  roles:['DIO','PWM'], color:'#FBBF24' },
    { name:'D2',   roles:['DIO','PWM'], color:'#FBBF24' },
    { name:'D4',   roles:['DIO','PWM'], color:'#FBBF24' },
    { name:'D16',  roles:['DIO','PWM'], color:'#FBBF24' },
    { name:'D17',  roles:['DIO','PWM'], color:'#FBBF24' },
    { name:'D5',   roles:['DIO','PWM'], color:'#FBBF24' },
    { name:'D18',  roles:['DIO','PWM'], color:'#FBBF24' },
    { name:'D19',  roles:['DIO','PWM'], color:'#FBBF24' },
    { name:'D21',  roles:['DIO','PWM','I2C'], color:'#FBBF24' },
    { name:'D22',  roles:['DIO','PWM','I2C'], color:'#FBBF24' },
    { name:'D23',  roles:['DIO','PWM'], color:'#FBBF24' },
    /* 右排(由上到下) */
    { name:'VIN(5V)', roles:['POW5V'], color:'#DC2626' },
    { name:'GND',  roles:['GND'],   color:'#1F2937' },
    { name:'D13',  roles:['DIO','PWM','ADC2'], color:'#FBBF24' },
    { name:'D12',  roles:['DIO','PWM','ADC2'], color:'#FBBF24' },
    { name:'D14',  roles:['DIO','PWM','ADC2'], color:'#FBBF24' },
    { name:'D27',  roles:['DIO','PWM','ADC2'], color:'#FBBF24' },
    { name:'D26',  roles:['DIO','PWM','ADC2'], color:'#FBBF24' },
    { name:'D25',  roles:['DIO','PWM','ADC2'], color:'#FBBF24' },
    { name:'D33',  roles:['DIO','PWM','ADC1'], color:'#22D3EE' },
    { name:'D32',  roles:['DIO','PWM','ADC1'], color:'#22D3EE' },
    { name:'D35',  roles:['IN_ONLY','ADC1'], color:'#94A3B8' },
    { name:'D34',  roles:['IN_ONLY','ADC1'], color:'#94A3B8' },
    { name:'D39',  roles:['IN_ONLY','ADC1'], color:'#94A3B8' },
  ];

  /* 挑戰題目:每個 slot 用「滿足任一 role」來判定正確 */
  const CHALLENGES = [
    {
      title:'🟡 接一顆 LED(透過 220Ω 限流電阻)',
      desc:'LED 需要一隻能<strong>輸出</strong>的數位腳位(讓電壓 HIGH/LOW 切換),以及 GND 構成迴路。GPIO 34–39 不能輸出,只能輸入。',
      slots:[
        { label:'LED 正極 → 限流電阻 →', need:'DIO', hint:'任一可輸出的數位腳(GPIO 34–39 不行,它們僅輸入)' },
        { label:'LED 負極 →',           need:'GND', hint:'接 GND' },
      ],
    },
    {
      title:'👆 接一顆按鈕',
      desc:'按鈕只要讀「按下」或「放開」,用<strong>數位輸入</strong>即可。ESP32 用 INPUT_PULLUP 模式可省去外接上拉電阻。注意 GPIO 34–39 內部沒有上拉,要用 INPUT_PULLUP 需選其他腳。',
      slots:[
        { label:'按鈕一腳 → GPIO',  need:'DIO', hint:'任一非「僅輸入」的數位腳(可用 INPUT_PULLUP)' },
        { label:'按鈕另一腳 →',      need:'GND', hint:'接 GND' },
      ],
    },
    {
      title:'💡 接光敏電阻(分壓電路)',
      desc:'光敏電阻 + 固定電阻組成<strong>分壓電路</strong>,中間點電壓會隨光線變化。要讀這個類比電壓,得選一隻 <strong>ADC1</strong> 腳(GPIO 32/33/34/35/36/39)——ADC2 在 WiFi 啟用時不穩。',
      slots:[
        { label:'分壓中點 → ADC 腳', need:'ADC1', hint:'選 ADC1:GPIO 32、33、34、35、39。藍色或灰色標示的腳位' },
        { label:'LDR 一端 →',         need:'POW3V3', hint:'接 3V3' },
        { label:'10kΩ 一端 →',        need:'GND', hint:'接 GND' },
      ],
    },
    {
      title:'🔧 接 SG90 伺服馬達',
      desc:'伺服需要 PWM 訊號控制角度、外加電源與接地。SG90 的 VCC 接 <strong>5V</strong>(用 VIN 引腳取得),控制線選任一支援 PWM 的數位 I/O 腳。',
      slots:[
        { label:'訊號線 (橘) →',   need:'PWM',  hint:'任一可 PWM 的數位 I/O 腳(GPIO 34–39 不行)' },
        { label:'紅色電源 →',      need:'POW5V', hint:'接 VIN/5V(不要接 3V3)' },
        { label:'棕色接地 →',      need:'GND',   hint:'接 GND' },
      ],
    },
  ];

  let qi = 0;
  let slotIdx = 0;
  let filledRoles = [];

  function drawSvg() {
    const w = 360, h = 460;
    const x1 = 20, x2 = 240, ph = (h - 60) / 13;
    let pinHtml = '';
    for (let i = 0; i < 13; i++) {
      const left = PINS[i];
      const right = PINS[i + 13];
      const y = 30 + i * ph + ph / 2;
      pinHtml += pinDot(x1, y, left, i);
      pinHtml += pinDot(x2 + 80, y, right, i + 13, true);
    }
    svg.innerHTML = `
      <rect x="${x1+30}" y="20" width="${x2+50 - (x1+30)}" height="${h-40}" rx="8" fill="#0C4A6E" stroke="#082F49"/>
      <rect x="${x1+50}" y="35" width="${x2+30 - (x1+50)}" height="50" rx="3" fill="#0EA5E9"/>
      <text x="180" y="65" text-anchor="middle" fill="#fff" font-size="16" font-weight="700">ESP32</text>
      <rect x="${180-22}" y="10" width="44" height="14" fill="#94A3B8"/>
      <text x="180" y="20" text-anchor="middle" font-size="8" fill="#1F2937">USB</text>
      ${pinHtml}
    `;
    function pinDot(x, y, p, idx, right) {
      const tx = right ? x - 10 : x + 10;
      const anchor = right ? 'end' : 'start';
      return `<g class="pin-clickable" data-pi="${idx}" style="cursor:pointer">
        <rect x="${x-6}" y="${y-6}" width="12" height="12" rx="2" fill="${p.color}" stroke="#0b0b18" stroke-width="1"/>
        <text x="${tx}" y="${y+3}" text-anchor="${anchor}" font-size="11" font-family="JetBrains Mono" font-weight="700" fill="#E0E7FF">${p.name}</text>
      </g>`;
    }
  }

  function loadQ() {
    const Q = CHALLENGES[qi];
    titleEl.textContent = `第 ${qi+1}/${CHALLENGES.length} 題　${Q.title}`;
    descEl.innerHTML = Q.desc;
    slotIdx = 0;
    filledRoles = new Array(Q.slots.length).fill(null);
    renderSlots();
    statusEl.className = 'pin-status tip';
    statusEl.innerHTML = `👉 第 1 步:${Q.slots[0].hint}`;
    nextBtn.style.display = 'none';
  }
  function renderSlots() {
    const Q = CHALLENGES[qi];
    slotsEl.innerHTML = Q.slots.map((s, i) => {
      const filled = filledRoles[i];
      let cls = '';
      if (filled) cls = filled.ok ? 'filled' : 'wrong';
      return `<li class="${cls}">
        <span class="ps-tag">空格 ${i+1}</span>
        <span>${s.label}</span>
        <span class="ps-val">${filled ? filled.name : '—'}</span>
      </li>`;
    }).join('');
  }
  function pinAt(idx) { return PINS[idx]; }

  function click(idx) {
    const Q = CHALLENGES[qi];
    if (slotIdx >= Q.slots.length) return;
    const need = Q.slots[slotIdx].need;
    const p = pinAt(idx);
    const ok = p.roles.includes(need) || (need === 'DIO' && (p.roles.includes('DIO')));
    filledRoles[slotIdx] = { name: p.name, ok };
    renderSlots();
    if (!ok) {
      statusEl.className = 'pin-status bad';
      statusEl.innerHTML = `❌ <strong>${p.name}</strong> 不適合這個用途。${Q.slots[slotIdx].hint}`;
      return;
    }
    statusEl.className = 'pin-status ok';
    statusEl.innerHTML = `✓ <strong>${p.name}</strong> 正確!`;
    slotIdx++;
    if (slotIdx < Q.slots.length) {
      setTimeout(() => {
        statusEl.className = 'pin-status tip';
        statusEl.innerHTML = `👉 第 ${slotIdx+1} 步:${Q.slots[slotIdx].hint}`;
      }, 700);
    } else {
      setTimeout(() => {
        statusEl.className = 'pin-status ok';
        statusEl.innerHTML = '🎉 本題完成!所有腳位都接對了。';
        nextBtn.style.display = qi < CHALLENGES.length - 1 ? 'inline-block' : 'none';
        if (qi === CHALLENGES.length - 1) {
          statusEl.innerHTML = '🎉 4 題全部完成!現在你已經懂得「該接哪一隻腳」。下方可繼續做選板挑戰。';
        }
      }, 700);
    }
  }

  svg.addEventListener('click', e => {
    const g = e.target.closest('g.pin-clickable');
    if (!g) return;
    click(+g.dataset.pi);
  });
  nextBtn.addEventListener('click', () => { if (qi < CHALLENGES.length - 1) { qi++; loadQ(); } });
  resetBtn.addEventListener('click', loadQ);
  drawSvg();
  loadQ();
})();
