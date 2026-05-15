/* ============================================================
 * CNC 雕銑模擬器 — 刀具路徑 + 切削參數 + 斷刀判定（俯視圖)
 * ============================================================ */

/* ---- 刀具路徑產生器(座標 0-100) ---- */
function rasterPocket(x1, y1, x2, y2, step) {
  const p = [];
  let y = y1, dir = 1;
  while (y <= y2) {
    p.push({ x: dir > 0 ? x1 : x2, y });
    p.push({ x: dir > 0 ? x2 : x1, y });
    y += step; dir *= -1;
  }
  return p;
}
function spiral(cx, cy, rMax) {
  const p = [];
  for (let a = 0; a < Math.PI * 2 * 6; a += 0.25) {
    const r = (a / (Math.PI * 2 * 6)) * rMax;
    p.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return p;
}
function starPath(cx, cy, rOut, rIn) {
  const p = [];
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? rIn : rOut;
    p.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return p;
}

const TASKS = {
  '方形凹槽': rasterPocket(28, 32, 72, 68, 5),
  '圓形孔':   spiral(50, 50, 22),
  '星形輪廓': starPath(50, 50, 30, 13),
};

const P = { task: '方形凹槽', tool: 2, feed: 2, depth: 2 };
let cncDone = false;

function seg(id, opts, cur, fmt, onPick) {
  const wrap = document.getElementById(id);
  wrap.innerHTML = '';
  opts.forEach(o => {
    const b = document.createElement('button');
    b.textContent = fmt(o);
    if (o === cur) b.classList.add('on');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      onPick(o);
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      refresh();
    });
    wrap.appendChild(b);
  });
}
seg('segTask', Object.keys(TASKS), P.task, x => x, v => P.task = v);
seg('segTool', [1, 2, 3], P.tool, x => ['小', '中', '大'][x - 1], v => P.tool = v);
seg('segFeed', [1, 2, 3], P.feed, x => ['慢', '中', '快'][x - 1], v => P.feed = v);
seg('segDepth', [1, 2, 3], P.depth, x => ['淺', '中', '深'][x - 1], v => P.depth = v);

/* ---- 負荷與時間 ---- */
function breakRisk() { return P.feed + P.depth + (4 - P.tool); }
function estTime() {
  const path = TASKS[P.task];
  let len = 0;
  for (let i = 1; i < path.length; i++)
    len += Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
  return len / (P.feed * P.depth * (0.6 + P.tool * 0.2)) * 0.5;
}

function refresh() {
  const risk = breakRisk();
  const danger = risk >= 8;
  document.getElementById('cncStat').innerHTML = `
    <div style="display:flex;justify-content:space-between"><span>預估加工時間</span>
      <b style="font-family:var(--font-mono)">${estTime().toFixed(0)} 分鐘</b></div>
    <div style="display:flex;justify-content:space-between"><span>刀具負荷指數</span>
      <b style="font-family:var(--font-mono);color:${danger ? 'var(--danger)' : risk >= 6 ? 'var(--warning)' : 'var(--success)'}">
      ${risk} / 9 ${danger ? '⚠ 過載' : risk >= 6 ? '偏高' : '安全'}</b></div>`;
  drawStatic();
}

/* ---- Canvas ---- */
const canvas = document.getElementById('cncCanvas');
function setup() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 320;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const scale = Math.min(w, h) * 0.84 / 100;
  return { ctx, w, h, scale, ox: (w - 100 * scale) / 2, oy: (h - 100 * scale) / 2 };
}
const T = (pt, s) => ({ x: s.ox + pt.x * s.scale, y: s.oy + pt.y * s.scale });

function drawMaterial(s) {
  s.ctx.fillStyle = '#C8A06A';
  s.ctx.fillRect(s.ox + 6 * s.scale, s.oy + 6 * s.scale, 88 * s.scale, 88 * s.scale);
  /* 木紋 */
  s.ctx.strokeStyle = 'rgba(120,80,40,.25)';
  for (let y = 12; y < 94; y += 7) {
    s.ctx.beginPath();
    s.ctx.moveTo(s.ox + 6 * s.scale, s.oy + y * s.scale);
    s.ctx.lineTo(s.ox + 94 * s.scale, s.oy + y * s.scale);
    s.ctx.stroke();
  }
}

function drawStatic() {
  const s = setup();
  s.ctx.clearRect(0, 0, s.w, s.h);
  drawMaterial(s);
  /* 路徑預覽 */
  const path = TASKS[P.task];
  s.ctx.strokeStyle = 'rgba(255,255,255,.55)';
  s.ctx.lineWidth = 1.4;
  s.ctx.setLineDash([3, 3]);
  s.ctx.beginPath();
  path.forEach((pt, i) => { const q = T(pt, s); i ? s.ctx.lineTo(q.x, q.y) : s.ctx.moveTo(q.x, q.y); });
  s.ctx.stroke();
  s.ctx.setLineDash([]);
  s.ctx.fillStyle = 'rgba(255,255,255,.5)';
  s.ctx.font = '12px "Noto Sans TC"';
  s.ctx.fillText(`刀具路徑預覽：${P.task}`, s.ox, s.oy - 6);
}

/* ---- 加工動畫 ---- */
let running = false;
function run() {
  if (running) return;
  running = true;
  document.getElementById('cncGo').disabled = true;
  document.getElementById('cncResult').innerHTML = '';
  const s = setup();
  const path = TASKS[P.task];
  const risk = breakRisk();
  const willBreak = risk >= 8;
  /* 斷刀發生點:路徑進行到約 35-65% */
  const breakAt = willBreak ? Math.floor(path.length * (0.35 + Math.random() * 0.3)) : -1;
  const toolR = (2.5 + P.tool * 2.2);   /* 畫面上的刀具半徑 */
  const carved = [];

  let i = 0, t = 0;
  const stepPer = 0.10 + P.feed * 0.06;
  function frame() {
    s.ctx.clearRect(0, 0, s.w, s.h);
    drawMaterial(s);
    /* 已切削區域 */
    s.ctx.fillStyle = '#3F3A33';
    carved.forEach(c => {
      s.ctx.beginPath();
      s.ctx.arc(s.ox + c.x * s.scale, s.oy + c.y * s.scale, toolR, 0, Math.PI * 2);
      s.ctx.fill();
    });
    if (i >= path.length - 1 || (breakAt >= 0 && i >= breakAt)) {
      finish(willBreak, s, carved.length ? carved[carved.length - 1] : path[0], toolR);
      return;
    }
    const a = path[i], b = path[i + 1];
    t += stepPer;
    const cx = a.x + (b.x - a.x) * Math.min(1, t);
    const cy = a.y + (b.y - a.y) * Math.min(1, t);
    carved.push({ x: cx, y: cy });
    /* 刀具 */
    const q = { x: s.ox + cx * s.scale, y: s.oy + cy * s.scale };
    s.ctx.fillStyle = '#FBBF24';
    s.ctx.beginPath(); s.ctx.arc(q.x, q.y, toolR, 0, Math.PI * 2); s.ctx.fill();
    s.ctx.strokeStyle = '#92400E'; s.ctx.lineWidth = 2;
    s.ctx.stroke();
    if (typeof SoundFX !== 'undefined' && i % 4 === 0) SoundFX.tick();
    if (t >= 1) { t = 0; i++; }
    requestAnimationFrame(frame);
  }
  frame();
}

function finish(broke, s, lastPos, toolR) {
  running = false;
  document.getElementById('cncGo').disabled = false;
  const res = document.getElementById('cncResult');
  if (broke) {
    if (typeof SoundFX !== 'undefined') SoundFX.error();
    /* 畫斷掉的刀 */
    const q = { x: s.ox + lastPos.x * s.scale, y: s.oy + lastPos.y * s.scale };
    s.ctx.strokeStyle = '#EF4444'; s.ctx.lineWidth = 3;
    s.ctx.beginPath();
    s.ctx.moveTo(q.x - toolR, q.y - toolR); s.ctx.lineTo(q.x + toolR, q.y + toolR);
    s.ctx.moveTo(q.x + toolR, q.y - toolR); s.ctx.lineTo(q.x - toolR, q.y + toolR);
    s.ctx.stroke();
    res.innerHTML = `<div style="background:var(--danger-light);color:#a72d2d;padding:10px 12px;border-radius:8px;border-left:3px solid var(--danger)">
      💥 <strong>斷刀!</strong>刀具負荷指數 ${breakRisk()}/9,超過負荷而折斷。
      請<strong>放慢進給</strong>、<strong>切淺一點</strong>,或<strong>換用較粗的刀具</strong>。</div>`;
  } else {
    if (typeof SoundFX !== 'undefined') SoundFX.win();
    res.innerHTML = `<div style="background:var(--success-light);color:#15803d;padding:10px 12px;border-radius:8px;border-left:3px solid var(--success)">
      ✓ <strong>加工完成!</strong>「${P.task}」順利切削成形,耗時約 ${estTime().toFixed(0)} 分鐘,全程未斷刀。</div>`;
    if (!cncDone && !Progress.isDone('ch2-cnc')) {
      cncDone = true;
      celebrateModule('ch2-cnc', 'CNC 雕銑操作');
      document.getElementById('nextBtn').classList.add('pop-in');
      res.innerHTML += '<div style="margin-top:6px;font-weight:700;color:var(--theme-dark)">🎉 完成挑戰:順利完成加工而不斷刀!</div>';
    }
  }
}

document.getElementById('cncGo').addEventListener('click', run);
window.addEventListener('resize', () => { if (!running) drawStatic(); });
refresh();
