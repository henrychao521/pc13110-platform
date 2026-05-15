/* ============================================================
 * 3D 列印操作 — 切片與逐層列印模擬器
 * 側視圖逐層堆疊;模型分外殼/填充/支撐,並處理懸空(overhang)
 * ============================================================ */

const GW = 48, GH = 38;

/* ---- 模型產生器:回傳 grid[row][col]，row 0 為底層 ---- */
function emptyGrid() { return Array.from({ length: GH }, () => Array(GW).fill(0)); }

const MODELS = {
  '方塊': () => { const g = emptyGrid();
    for (let r = 0; r < 28; r++) for (let c = 12; c < 36; c++) g[r][c] = 1;
    return g; },
  '金字塔': () => { const g = emptyGrid();
    for (let r = 0; r < 30; r++) {
      const hw = Math.round(16 - r * 0.5);
      for (let c = 24 - hw; c <= 24 + hw; c++) if (c >= 0 && c < GW) g[r][c] = 1;
    } return g; },
  '筆筒': () => { const g = emptyGrid();
    for (let r = 0; r < 30; r++) for (let c = 11; c < 37; c++) {
      if (r < 4) g[r][c] = 1;                        /* 底座 */
      else if (c < 16 || c >= 32) g[r][c] = 1;       /* 兩側牆 */
    } return g; },
  '拱橋': () => { const g = emptyGrid();
    for (let r = 0; r < 25; r++) {                   /* 兩支橋墩 */
      for (let c = 8; c < 16; c++) g[r][c] = 1;
      for (let c = 33; c < 41; c++) g[r][c] = 1;
    }
    for (let r = 25; r < 32; r++) for (let c = 8; c < 41; c++) g[r][c] = 1; /* 橋面(懸空) */
    return g; },
};

/* ---- 參數 ---- */
const PARAMS = {
  model: '方塊',
  layer: 0.2,      /* mm */
  infill: 25,      /* % */
  support: false,
};
const LAYER_OPTS = [0.3, 0.2, 0.1];
const INFILL_OPTS = [10, 25, 50, 100];

/* ---- 分析 grid:分類外殼/內部/懸空,並計算支撐 ---- */
function analyze(g) {
  const shell = emptyGrid(), inner = emptyGrid(), support = emptyGrid(), overhang = emptyGrid();
  for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
    if (!g[r][c]) continue;
    const nb = [[r+1,c],[r-1,c],[r,c+1],[r,c-1]];
    let exposed = false;
    nb.forEach(([rr, cc]) => {
      if (rr < 0 || rr >= GH || cc < 0 || cc >= GW || !g[rr][cc]) exposed = true;
    });
    if (exposed) shell[r][c] = 1; else inner[r][c] = 1;
    if (r > 0 && !g[r - 1][c]) overhang[r][c] = 1;   /* 下方懸空 */
  }
  /* 支撐:從懸空格往下填,直到碰到實體或地面 */
  for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
    if (!overhang[r][c]) continue;
    for (let rr = r - 1; rr >= 0; rr--) {
      if (g[rr][c]) break;
      support[rr][c] = 1;
    }
  }
  return { shell, inner, support, overhang };
}

/* ---- 統計 ---- */
function computeStats() {
  const g = MODELS[PARAMS.model]();
  const a = analyze(g);
  let shellN = 0, innerN = 0, supportN = 0, topRow = 0, overhangN = 0;
  for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
    if (a.shell[r][c]) shellN++;
    if (a.inner[r][c]) innerN++;
    if (PARAMS.support && a.support[r][c]) supportN++;
    if (a.overhang[r][c]) overhangN++;
    if (g[r][c]) topRow = Math.max(topRow, r);
  }
  const heightMM = (topRow + 1) * 2;
  const layers = Math.round(heightMM / PARAMS.layer);
  const printed = shellN + innerN * PARAMS.infill / 100 + supportN;
  const time = printed * 0.045 * (0.2 / PARAMS.layer);
  const material = printed * 0.085;
  return { layers, time, material, overhangN, supportN, g, a };
}

/* ---- 控制項 UI ---- */
function buildSeg(id, opts, current, fmt, onPick) {
  const wrap = document.getElementById(id);
  wrap.innerHTML = '';
  opts.forEach(o => {
    const b = document.createElement('button');
    b.textContent = fmt(o);
    if (o === current) b.classList.add('on');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      onPick(o);
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      refreshStats();
    });
    wrap.appendChild(b);
  });
}
buildSeg('segModel', Object.keys(MODELS), PARAMS.model, x => x, v => PARAMS.model = v);
buildSeg('segLayer', LAYER_OPTS, PARAMS.layer, x => x + ' mm', v => PARAMS.layer = v);
buildSeg('segInfill', INFILL_OPTS, PARAMS.infill, x => x + '%', v => PARAMS.infill = v);
buildSeg('segSupport', [false, true], false, x => x ? '開啟' : '關閉', v => PARAMS.support = v);

function refreshStats() {
  const s = computeStats();
  document.getElementById('statBox').innerHTML = `
    <div class="sb-row"><span>預估層數</span><b>${s.layers} 層</b></div>
    <div class="sb-row"><span>預估列印時間</span><b>${s.time.toFixed(0)} 分鐘</b></div>
    <div class="sb-row"><span>預估耗材</span><b>${s.material.toFixed(1)} 公克</b></div>
    <div class="sb-row"><span>懸空格數</span><b style="color:${s.overhangN ? 'var(--danger)' : 'var(--success)'}">${s.overhangN}</b></div>`;
  drawStatic(s);
}

/* ---- Canvas 繪製 ---- */
const canvas = document.getElementById('printCanvas');
function setupCv() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 340;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}
function cellSize(w, h) { return Math.min((w - 20) / GW, (h - 20) / GH); }

function drawCell(ctx, r, c, cs, ox, oy, type, infill) {
  const x = ox + c * cs;
  const y = oy + (GH - 1 - r) * cs;
  if (type === 'shell') { ctx.fillStyle = '#3B82F6'; ctx.fillRect(x, y, cs, cs); }
  else if (type === 'inner') {
    ctx.fillStyle = '#1E3A5F'; ctx.fillRect(x, y, cs, cs);
    ctx.strokeStyle = '#60A5FA'; ctx.lineWidth = 1;
    const step = infill >= 100 ? 2 : infill >= 50 ? 3 : infill >= 25 ? 5 : 9;
    for (let i = -cs; i < cs; i += step) {
      ctx.beginPath(); ctx.moveTo(x + i, y); ctx.lineTo(x + i + cs, y + cs); ctx.stroke();
    }
  }
  else if (type === 'support') {
    ctx.fillStyle = 'rgba(234,88,12,.55)'; ctx.fillRect(x, y, cs, cs);
  }
  else if (type === 'fail') { ctx.fillStyle = '#EF4444'; ctx.fillRect(x, y, cs, cs); }
  ctx.strokeStyle = 'rgba(15,23,42,.35)'; ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, cs, cs);
}

function drawStatic(s) {
  const { ctx, w, h } = setupCv();
  ctx.clearRect(0, 0, w, h);
  const cs = cellSize(w, h), ox = (w - GW * cs) / 2, oy = (h - GH * cs) / 2;
  /* 列印平台 */
  ctx.fillStyle = '#475569';
  ctx.fillRect(ox - 6, oy + GH * cs, GW * cs + 12, 8);
  /* 模型輪廓預覽(切片預覽) */
  for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
    if (s.a.shell[r][c]) drawCell(ctx, r, c, cs, ox, oy, 'shell', PARAMS.infill);
    else if (s.a.inner[r][c]) drawCell(ctx, r, c, cs, ox, oy, 'inner', PARAMS.infill);
    if (PARAMS.support && s.a.support[r][c]) drawCell(ctx, r, c, cs, ox, oy, 'support', PARAMS.infill);
  }
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  ctx.font = '12px "Noto Sans TC"';
  ctx.fillText('切片預覽（按「開始列印」逐層堆疊)', ox, oy - 6);
}

/* ---- 逐層列印動畫 ---- */
let printing = false;
function startPrint() {
  if (printing) return;
  printing = true;
  document.getElementById('printBtn').disabled = true;
  document.getElementById('printResult').innerHTML = '';
  const s = computeStats();
  const { ctx, w, h } = setupCv();
  const cs = cellSize(w, h), ox = (w - GW * cs) / 2, oy = (h - GH * cs) / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#475569';
  ctx.fillRect(ox - 6, oy + GH * cs, GW * cs + 12, 8);

  let row = 0, failed = false;
  const timer = setInterval(() => {
    /* 畫這一層 */
    for (let c = 0; c < GW; c++) {
      if (PARAMS.support && s.a.support[row][c]) drawCell(ctx, row, c, cs, ox, oy, 'support', PARAMS.infill);
      if (s.a.shell[row][c] || s.a.inner[row][c]) {
        const isFail = s.a.overhang[row][c] && !PARAMS.support;
        if (isFail) { failed = true; drawCell(ctx, row, c, cs, ox, oy, 'fail', PARAMS.infill); }
        else drawCell(ctx, row, c, cs, ox, oy, s.a.shell[row][c] ? 'shell' : 'inner', PARAMS.infill);
      }
    }
    /* 噴頭指示線 */
    ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 2;
    const y = oy + (GH - 1 - row) * cs;
    ctx.beginPath(); ctx.moveTo(ox - 10, y); ctx.lineTo(ox + GW * cs + 10, y); ctx.stroke();
    if (typeof SoundFX !== 'undefined' && row % 3 === 0) SoundFX.tick();
    row++;
    if (row >= GH) {
      clearInterval(timer);
      printing = false;
      document.getElementById('printBtn').disabled = false;
      finishPrint(failed, s);
    }
  }, 90);
}

function finishPrint(failed, s) {
  const res = document.getElementById('printResult');
  if (failed) {
    if (typeof SoundFX !== 'undefined') SoundFX.error();
    res.innerHTML = `<div style="background:var(--danger-light);color:#a72d2d;padding:10px 12px;border-radius:8px;border-left:3px solid var(--danger)">
      ✗ <strong>列印失敗</strong>:模型有<strong>懸空</strong>部位,卻沒有開啟支撐,材料憑空下垂(紅色處)。
      請開啟「支撐結構」再印一次。</div>`;
  } else {
    if (typeof SoundFX !== 'undefined') SoundFX.win();
    let extra = '';
    if (PARAMS.support && s.overhangN === 0) {
      extra = '<br>💡 提示:這個模型沒有懸空,其實<strong>不需要支撐</strong>——你白白多花了材料與時間。';
    }
    res.innerHTML = `<div style="background:var(--success-light);color:#15803d;padding:10px 12px;border-radius:8px;border-left:3px solid var(--success)">
      ✓ <strong>列印成功!</strong>共 ${s.layers} 層,耗時約 ${s.time.toFixed(0)} 分鐘、用料約 ${s.material.toFixed(1)} 公克。${extra}</div>`;
    if (PARAMS.model === '拱橋' && !Progress.isDone('ch2-print3d')) {
      celebrateModule('ch2-print3d', '3D 列印操作');
      document.getElementById('nextBtn').classList.add('pop-in');
      res.innerHTML += '<div style="margin-top:6px;font-weight:700;color:var(--theme-dark)">🎉 完成挑戰:成功印出有懸空的拱橋模型!</div>';
    }
  }
}

document.getElementById('printBtn').addEventListener('click', startPrint);
document.getElementById('resetBtn').addEventListener('click', () => {
  document.getElementById('printResult').innerHTML = '';
  refreshStats();
});
window.addEventListener('resize', () => { if (!printing) refreshStats(); });
refreshStats();
