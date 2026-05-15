/* ============================================================
 * 科技趨勢儀表板 — 互動 Canvas 圖表 + 分頁 + 檢核
 * 純自製輕量圖表引擎(折線/長條),支援滑鼠 hover 顯示數值
 * ============================================================ */

/* ---- 通用 Canvas 設定(處理高 DPI) ---- */
function setupCanvas(canvas, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.parentElement.clientWidth - 0;
  canvas.style.width = cssW + 'px';
  canvas.style.height = cssHeight + 'px';
  canvas.width = cssW * dpr;
  canvas.height = cssHeight * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: cssW, h: cssHeight };
}

const THEME = '#2563EB';

/* ---- 折線圖(單線,動畫 + hover) ---- */
function lineChart(canvas, { labels, values, yMax, unit, color = THEME, milestones = {} }) {
  const PAD = { l: 48, r: 18, t: 18, b: 42 };
  let hoverIdx = -1, anim = 0;

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas, 280);
    const plotW = w - PAD.l - PAD.r, plotH = h - PAD.t - PAD.b;
    ctx.clearRect(0, 0, w, h);

    /* y 格線 */
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
      const y = PAD.t + plotH * i / ySteps;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(w - PAD.r, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText((yMax * (ySteps - i) / ySteps).toFixed(1), PAD.l - 8, y);
    }

    /* x 標籤 */
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const step = plotW / (labels.length - 1);
    labels.forEach((lb, i) => {
      if (labels.length > 12 && i % 2 !== 0 && i !== labels.length - 1) return;
      ctx.fillStyle = '#94A3B8';
      ctx.fillText(lb, PAD.l + step * i, h - PAD.b + 8);
    });

    const px = i => PAD.l + step * i;
    const py = v => PAD.t + plotH * (1 - v / yMax);
    const shown = Math.floor(anim * (labels.length - 1)) + 1;

    /* 漸層填充 */
    const grad = ctx.createLinearGradient(0, PAD.t, 0, PAD.t + plotH);
    grad.addColorStop(0, color + '40');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    ctx.moveTo(px(0), py(values[0]));
    for (let i = 1; i < shown; i++) ctx.lineTo(px(i), py(values[i]));
    ctx.lineTo(px(shown - 1), PAD.t + plotH);
    ctx.lineTo(px(0), PAD.t + plotH);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    /* 折線 */
    ctx.beginPath();
    ctx.moveTo(px(0), py(values[0]));
    for (let i = 1; i < shown; i++) ctx.lineTo(px(i), py(values[i]));
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.lineJoin = 'round'; ctx.stroke();

    /* 資料點 + 里程碑 */
    for (let i = 0; i < shown; i++) {
      ctx.beginPath();
      ctx.arc(px(i), py(values[i]), i === hoverIdx ? 6 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = i === hoverIdx ? color : '#fff';
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.fill(); ctx.stroke();
      if (milestones[i]) {
        ctx.fillStyle = '#DC2626';
        ctx.font = '700 10px "Noto Sans TC"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(milestones[i], px(i), py(values[i]) - 10);
      }
    }

    /* hover tooltip */
    if (hoverIdx >= 0 && hoverIdx < shown) {
      const x = px(hoverIdx), y = py(values[hoverIdx]);
      const txt = `${labels[hoverIdx]}：${values[hoverIdx]} ${unit}`;
      ctx.font = '700 12px "Noto Sans TC"';
      const tw = ctx.measureText(txt).width + 18;
      let tx = x - tw / 2; tx = Math.max(PAD.l, Math.min(tx, w - PAD.r - tw));
      const ty = Math.max(PAD.t, y - 40);
      ctx.fillStyle = '#0F172A';
      ctx.beginPath(); ctx.roundRect(tx, ty, tw, 26, 6); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, tx + tw / 2, ty + 13);
    }

    if (anim < 1) { anim = Math.min(1, anim + 0.045); requestAnimationFrame(draw); }
  }

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const plotW = r.width - PAD.l - PAD.r;
    const step = plotW / (labels.length - 1);
    const idx = Math.round((x - PAD.l) / step);
    const ni = (idx >= 0 && idx < labels.length) ? idx : -1;
    if (ni !== hoverIdx) { hoverIdx = ni; if (ni >= 0 && typeof SoundFX !== 'undefined') SoundFX.tick(); draw(); }
  });
  canvas.addEventListener('mouseleave', () => { hoverIdx = -1; draw(); });

  return { redraw: () => { anim = 1; draw(); }, animate: () => { anim = 0; draw(); } };
}

/* ---- 長條圖(動畫 + hover) ---- */
function barChart(canvas, { labels, values, unit, colors, yMax }) {
  const PAD = { l: 52, r: 18, t: 18, b: 42 };
  let hoverIdx = -1, anim = 0;
  yMax = yMax || Math.max(...values) * 1.15;

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas, 240);
    const plotW = w - PAD.l - PAD.r, plotH = h - PAD.t - PAD.b;
    ctx.clearRect(0, 0, w, h);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.strokeStyle = '#E2E8F0'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.t + plotH * i / 4;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(w - PAD.r, y); ctx.stroke();
      ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(yMax * (4 - i) / 4), PAD.l - 8, y);
    }

    const slot = plotW / values.length;
    const bw = slot * 0.52;
    values.forEach((v, i) => {
      const bh = plotH * (v / yMax) * anim;
      const x = PAD.l + slot * i + (slot - bw) / 2;
      const y = PAD.t + plotH - bh;
      const c = (colors && colors[i]) || THEME;
      ctx.fillStyle = i === hoverIdx ? c : c + 'D0';
      ctx.beginPath(); ctx.roundRect(x, y, bw, bh, [6, 6, 0, 0]); ctx.fill();
      /* 數值 */
      if (anim > 0.9) {
        ctx.fillStyle = '#334155'; ctx.font = '700 11px "Noto Sans TC"';
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(v + (unit || ''), x + bw / 2, y - 4);
      }
      ctx.fillStyle = '#64748B'; ctx.font = '12px "Noto Sans TC"';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(labels[i], PAD.l + slot * i + slot / 2, h - PAD.b + 8);
    });

    if (anim < 1) { anim = Math.min(1, anim + 0.05); requestAnimationFrame(draw); }
  }

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    const plotW = r.width - PAD.l - PAD.r;
    const slot = plotW / values.length;
    const idx = Math.floor((e.clientX - r.left - PAD.l) / slot);
    const ni = (idx >= 0 && idx < values.length) ? idx : -1;
    if (ni !== hoverIdx) { hoverIdx = ni; draw(); }
  });
  canvas.addEventListener('mouseleave', () => { hoverIdx = -1; draw(); });

  return { animate: () => { anim = 0; draw(); }, redraw: () => { anim = 1; draw(); } };
}

/* ---- 多線圖(發電來源) ---- */
function multiLineChart(canvas, { labels, series, yMax, unit }) {
  const PAD = { l: 44, r: 110, t: 18, b: 42 };
  let anim = 0, hover = -1;

  function draw() {
    const { ctx, w, h } = setupCanvas(canvas, 280);
    const plotW = w - PAD.l - PAD.r, plotH = h - PAD.t - PAD.b;
    ctx.clearRect(0, 0, w, h);

    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.strokeStyle = '#E2E8F0';
    for (let i = 0; i <= 5; i++) {
      const y = PAD.t + plotH * i / 5;
      ctx.beginPath(); ctx.moveTo(PAD.l, y); ctx.lineTo(w - PAD.r, y); ctx.stroke();
      ctx.fillStyle = '#94A3B8'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(yMax * (5 - i) / 5), PAD.l - 8, y);
    }
    const step = plotW / (labels.length - 1);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    labels.forEach((lb, i) => { ctx.fillStyle = '#64748B'; ctx.fillText(lb, PAD.l + step * i, h - PAD.b + 8); });

    const px = i => PAD.l + step * i;
    const py = v => PAD.t + plotH * (1 - v / yMax);

    series.forEach((s, si) => {
      ctx.beginPath();
      s.values.forEach((v, i) => { const x = px(i), y = py(v * anim + yMax * (1 - anim) * 0); i ? ctx.lineTo(x, py(v)) : ctx.moveTo(x, py(v)); });
      ctx.strokeStyle = s.color; ctx.lineWidth = hover === si ? 4 : 2.6;
      ctx.lineJoin = 'round'; ctx.globalAlpha = (hover === -1 || hover === si) ? 1 : 0.3;
      ctx.stroke();
      s.values.forEach((v, i) => {
        ctx.beginPath(); ctx.arc(px(i), py(v), 4, 0, Math.PI * 2);
        ctx.fillStyle = s.color; ctx.fill();
      });
      /* 圖例 */
      const ly = PAD.t + si * 24;
      ctx.globalAlpha = 1;
      ctx.fillStyle = s.color;
      ctx.beginPath(); ctx.roundRect(w - PAD.r + 12, ly, 14, 14, 3); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.font = '600 12px "Noto Sans TC"';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(s.name, w - PAD.r + 32, ly + 7);
    });
    ctx.globalAlpha = 1;
    if (anim < 1) { anim = Math.min(1, anim + 0.05); requestAnimationFrame(draw); }
  }
  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    const ly = e.clientY - r.top - PAD.t;
    const idx = Math.floor(ly / 24);
    const ni = (e.clientX - r.left > r.width - PAD.r && idx >= 0 && idx < series.length) ? idx : -1;
    if (ni !== hover) { hover = ni; draw(); }
  });
  canvas.addEventListener('mouseleave', () => { hover = -1; draw(); });
  return { animate: () => { anim = 0; draw(); }, redraw: () => { anim = 1; draw(); } };
}

/* ============================================================
 * 建立各圖表
 * ============================================================ */
const charts = {};
let chartsBuilt = {};

function buildChart(key) {
  if (chartsBuilt[key]) { charts[key].animate(); return; }
  chartsBuilt[key] = true;

  if (key === 'ai') {
    charts.ai = lineChart(document.getElementById('chartChatGPT'), {
      labels: ['2023.1', '2023.5', '2023.9', '2024.1', '2024.5', '2024.9', '2025.1', '2025.5', '2025.9'],
      values: [100, 180, 200, 250, 300, 400, 540, 800, 700],
      yMax: 900, unit: '百萬', color: '#2563EB',
      milestones: { 0: '突破 1 億' },
    });
    charts.ai.animate();
  }
  if (key === 'quantum') {
    charts.quantum = lineChart(document.getElementById('chartIC'), {
      labels: ['2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014','2015','2016','2017','2018','2019','2020','2021','2022'],
      values: [1.1,1.1,1.4,1.5,1.3,1.2,1.8,1.6,1.6,1.9,2.2,2.3,2.4,2.5,2.6,2.7,3.2,4.1,4.5],
      yMax: 5, unit: '兆', color: '#059669',
      milestones: { 0: '破 1 兆', 10: '破 2 兆', 16: '破 3 兆', 17: '破 4 兆' },
    });
    charts.quantum.animate();
  }
  if (key === 'bio') {
    charts.bio = barChart(document.getElementById('chartBio'), {
      labels: ['2022 年', '2025 年（預估）'],
      values: [3340, 6500], unit: ' 億', yMax: 7500,
      colors: ['#C026D3', '#9333EA'],
    });
    charts.bio.animate();
  }
  if (key === 'energy') {
    charts.energy = multiLineChart(document.getElementById('chartEnergy'), {
      labels: ['2016 年', '2020 年', '2025 年（目標）'],
      yMax: 60, unit: '%',
      series: [
        { name: '燃煤',   color: '#475569', values: [46, 45, 30] },
        { name: '天然氣', color: '#0EA5E9', values: [32, 36, 50] },
        { name: '再生能源', color: '#16A34A', values: [5, 6, 20] },
        { name: '核能',   color: '#F59E0B', values: [12, 11, 0] },
      ],
    });
    charts.energy.animate();
  }
}

/* ---- 分頁切換 ---- */
document.querySelectorAll('#trendTabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.tab;
    document.querySelectorAll('#trendTabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + key).classList.add('active');
    if (typeof SoundFX !== 'undefined') SoundFX.click();
    setTimeout(() => buildChart(key), 30);
  });
});

/* 視窗縮放重繪 */
let resizeT;
window.addEventListener('resize', () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => Object.values(charts).forEach(c => c && c.redraw()), 200);
});

/* 預設建立 AI 圖表 */
buildChart('ai');

/* ============================================================
 * 檢核測驗
 * ============================================================ */
const QUIZ = [
  {
    question: '哪一項科技領域在 2023 年全球研發支出中占比超過三分之一?',
    options: [
      { text: '人工智慧、半導體與生醫科技', correct: true, explain: 'WEF 2023 報告指出,超過三分之一的研發支出投入這三大新興領域。' },
      { text: '農業與食品科技', correct: false },
      { text: '傳統製造業', correct: false },
      { text: '觀光與服務業', correct: false },
    ],
  },
  {
    question: '台積電於 2023 年成功量產的先進製程晶片是幾奈米?',
    options: [
      { text: '7 奈米', correct: false },
      { text: '5 奈米', correct: false },
      { text: '3 奈米', correct: true, explain: '台積電 2023 年量產 3 奈米製程,使 AI 晶片效能提升至少 15%、節能達 30%。' },
      { text: '1 奈米', correct: false },
    ],
  },
  {
    question: '根據經濟部規劃,臺灣設定 2025 年再生能源發電占比要提升至多少?',
    options: [
      { text: '10%', correct: false },
      { text: '20%', correct: true, explain: '臺灣目標 2025 年再生能源發電占比達 20%,裝置量 2700 萬瓩（27GW）。' },
      { text: '40%', correct: false },
      { text: '60%', correct: false },
    ],
  },
  {
    question: '為什麼說近年科技是「指數級」而非「線性」成長?',
    options: [
      { text: '因為政府禁止科技發展', correct: false },
      { text: '因為技術突破頻率加快,過去需數十年的技術如今幾年內就能商業化', correct: true, explain: '資源高度集中於 AI、半導體、生醫等領域,使技術突破變得更頻繁、普及更快。' },
      { text: '因為科技發展已經停止', correct: false },
      { text: '因為只有單一公司在研發', correct: false },
    ],
  },
];

let answered = 0;
const quizArea = document.getElementById('quizArea');
QUIZ.forEach((q, i) => {
  const box = document.createElement('div');
  box.style.marginBottom = '14px';
  quizArea.appendChild(box);
  Interactions.DiagnosisQuiz({
    container: box,
    question: `第 ${i + 1} 題　${q.question}`,
    options: q.options,
    onAnswer: (correct) => {
      answered++;
      if (answered === QUIZ.length) {
        celebrateModule('ch1-trends', '科技趨勢儀表板');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
