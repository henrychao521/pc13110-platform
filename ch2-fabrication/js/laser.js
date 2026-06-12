/* ============================================================
 * 雷射切割模擬器 — 路徑加工 + 功率/速度/材料判定
 * ============================================================ */

/* ---- 幾何輔助:回傳折線(點陣列) ---- */
function circle(cx, cy, r, n = 48) {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const a = i / n * Math.PI * 2;
    p.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return p;
}
function rect(x1, y1, x2, y2) {
  return [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 }, { x: x1, y: y1 }];
}
function star(cx, cy, rOut, rIn) {
  const p = [];
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? rIn : rOut;
    p.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return p;
}
function gear(cx, cy, teeth, rOut, rIn) {
  const p = [], seg = Math.PI * 2 / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * seg;
    [[rIn, 0], [rOut, .12], [rOut, .38], [rIn, .5], [rIn, .98]].forEach(([r, f]) => {
      p.push({ x: cx + Math.cos(a + seg * f) * r, y: cy + Math.sin(a + seg * f) * r });
    });
  }
  p.push(p[0]);
  return p;
}

/* ---- 圖案(座標 0-100) ---- */
const DESIGNS = {
  '書籤': {
    cut: [rect(32, 12, 68, 88), circle(50, 20, 3.5)],
    engrave: [
      [{ x: 38, y: 40 }, { x: 62, y: 40 }],
      [{ x: 38, y: 48 }, { x: 62, y: 48 }],
      [{ x: 38, y: 56 }, { x: 62, y: 56 }],
      star(50, 72, 8, 3.5),
    ],
  },
  '齒輪': {
    cut: [gear(50, 50, 10, 38, 30), circle(50, 50, 8)],
    engrave: [circle(50, 50, 18), [{ x: 50, y: 35 }, { x: 50, y: 28 }],
      [{ x: 65, y: 50 }, { x: 72, y: 50 }], [{ x: 35, y: 50 }, { x: 28, y: 50 }]],
  },
  '名牌': {
    cut: [rect(18, 30, 82, 70), circle(26, 38, 2.6)],
    engrave: [
      [{ x: 34, y: 44 }, { x: 50, y: 44 }],
      [{ x: 34, y: 52 }, { x: 66, y: 52 }],
      [{ x: 34, y: 60 }, { x: 58, y: 60 }],
    ],
  },
};

/* ---- 材料:切割/雕刻所需「力道」窗口 ---- */
const MATERIALS = {
  '紙板':     { cut: [3, 6], eng: [3, 4] },
  '皮革':     { cut: [4, 7], eng: [3, 5] },
  '椴木合板': { cut: [6, 9], eng: [4, 6] },
  '壓克力':   { cut: [6, 9], eng: [4, 6] },
  'PVC':      { danger: true },
};

const P = { design: '書籤', mode: '切割', mat: '椴木合板', power: 3, speed: 1 };
let didCut = false, didEngrave = false;

/* ---- 控制項 ---- */
function seg(id, opts, cur, fmt, onPick, dangerVal) {
  const wrap = document.getElementById(id);
  wrap.innerHTML = '';
  opts.forEach(o => {
    const b = document.createElement('button');
    b.textContent = fmt(o);
    if (o === cur) b.classList.add('on');
    if (dangerVal !== undefined && o === dangerVal) b.classList.add('danger-opt');
    b.addEventListener('click', () => {
      // 加工進行中鎖定參數，避免動畫進度被 drawPreview 整片擦掉、結果文案錯置
      if (running) {
        if (typeof showToast === 'function') showToast('加工中，請等本次完成', 'warn');
        return;
      }
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      onPick(o);
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      drawPreview();
    });
    wrap.appendChild(b);
  });
}
seg('segDesign', Object.keys(DESIGNS), P.design, x => x, v => P.design = v);
seg('segMode', ['切割', '雕刻'], P.mode, x => x, v => P.mode = v);
seg('segMat', Object.keys(MATERIALS), P.mat, x => x, v => P.mat = v, 'PVC');
seg('segPower', [1, 2, 3], P.power, x => ['低', '中', '高'][x - 1], v => P.power = v);
seg('segSpeed', [1, 2, 3], P.speed, x => ['慢', '中', '快'][x - 1], v => P.speed = v);

/* ---- 判定 ---- */
function evaluate() {
  const m = MATERIALS[P.mat];
  if (m.danger) return 'danger';
  const force = P.power * 2 + (4 - P.speed);
  const win = P.mode === '切割' ? m.cut : m.eng;
  if (force < win[0]) return 'undercut';
  if (force > win[1]) return 'burnt';
  return 'good';
}

/* ---- Canvas ---- */
const canvas = document.getElementById('laserCanvas');
function setup() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 320;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const scale = Math.min(w, h) * 0.86 / 100;
  const ox = (w - 100 * scale) / 2, oy = (h - 100 * scale) / 2;
  return { ctx, w, h, scale, ox, oy };
}
const T = (pt, s) => ({ x: s.ox + pt.x * s.scale, y: s.oy + pt.y * s.scale });

function paths() { return DESIGNS[P.design][P.mode === '切割' ? 'cut' : 'engrave']; }

function drawPreview() {
  const s = setup();
  s.ctx.clearRect(0, 0, s.w, s.h);
  /* 工作檯格線 */
  s.ctx.strokeStyle = 'rgba(148,163,184,.2)';
  for (let i = 0; i <= 100; i += 10) {
    s.ctx.beginPath();
    s.ctx.moveTo(s.ox + i * s.scale, s.oy); s.ctx.lineTo(s.ox + i * s.scale, s.oy + 100 * s.scale);
    s.ctx.moveTo(s.ox, s.oy + i * s.scale); s.ctx.lineTo(s.ox + 100 * s.scale, s.oy + i * s.scale);
    s.ctx.stroke();
  }
  s.ctx.strokeStyle = 'rgba(148,163,184,.6)'; s.ctx.lineWidth = 1.5;
  paths().forEach(poly => {
    s.ctx.beginPath();
    poly.forEach((pt, i) => { const q = T(pt, s); i ? s.ctx.lineTo(q.x, q.y) : s.ctx.moveTo(q.x, q.y); });
    s.ctx.stroke();
  });
  s.ctx.fillStyle = 'rgba(255,255,255,.5)'; s.ctx.font = '12px "Noto Sans TC"';
  s.ctx.fillText(`圖案預覽：${P.design}（${P.mode}模式)`, s.ox, s.oy - 6);
}

/* ---- 加工動畫 ---- */
let running = false;
function run() {
  if (running) return;
  const outcome = evaluate();
  const resEl = document.getElementById('laserResult');

  if (outcome === 'danger') {
    if (typeof SoundFX !== 'undefined') SoundFX.error();
    resEl.innerHTML = `<div style="background:var(--danger-light);color:#a72d2d;padding:10px 12px;border-radius:8px;border-left:3px solid var(--danger)">
      ☠️ <strong>危險!立即停止!</strong>PVC 含氯,雷射切割會產生<strong>有毒氯氣</strong>,
      會傷害人體並腐蝕機器。請更換為安全材料。</div>`;
    return;
  }

  running = true;
  document.getElementById('goBtn').disabled = true;
  resEl.innerHTML = '';
  const s = setup();
  drawPreview();

  /* 攤平所有線段 */
  const segs = [];
  paths().forEach(poly => {
    for (let i = 1; i < poly.length; i++) segs.push([poly[i - 1], poly[i]]);
  });
  const colors = { good: '#22C55E', undercut: '#FBBF24', burnt: '#9A6B3F' };
  const col = colors[outcome];

  let si = 0, t = 0;
  const speedStep = 0.04 + P.speed * 0.03;
  const timer = setInterval(() => {
    if (si >= segs.length) {
      clearInterval(timer);
      running = false;
      document.getElementById('goBtn').disabled = false;
      finish(outcome);
      return;
    }
    const [a, b] = segs[si];
    const A = T(a, s), B = T(b, s);
    t += speedStep;
    const cx = A.x + (B.x - A.x) * Math.min(1, t);
    const cy = A.y + (B.y - A.y) * Math.min(1, t);
    /* 畫已加工線段 */
    s.ctx.strokeStyle = col;
    s.ctx.lineWidth = outcome === 'burnt' ? 4 : 2.4;
    s.ctx.setLineDash(outcome === 'undercut' ? [4, 4] : []);
    s.ctx.beginPath(); s.ctx.moveTo(A.x, A.y); s.ctx.lineTo(cx, cy); s.ctx.stroke();
    s.ctx.setLineDash([]);
    /* 雷射頭 + 光點 */
    s.ctx.fillStyle = '#EF4444';
    s.ctx.beginPath(); s.ctx.arc(cx, cy, 4, 0, Math.PI * 2); s.ctx.fill();
    s.ctx.strokeStyle = 'rgba(239,68,68,.4)';
    s.ctx.beginPath(); s.ctx.arc(cx, cy, 8, 0, Math.PI * 2); s.ctx.stroke();
    if (typeof SoundFX !== 'undefined' && Math.random() < .25) SoundFX.tick();
    if (t >= 1) { t = 0; si++; }
  }, 30);
}

function finish(outcome) {
  const resEl = document.getElementById('laserResult');
  if (outcome === 'good') {
    if (typeof SoundFX !== 'undefined') SoundFX.win();
    if (P.mode === '切割') didCut = true; else didEngrave = true;
    resEl.innerHTML = `<div style="background:var(--success-light);color:#15803d;padding:10px 12px;border-radius:8px;border-left:3px solid var(--success)">
      ✓ <strong>${P.mode}完美!</strong>功率與速度搭配得宜,${P.mat}的${P.mode}乾淨俐落。</div>`;
    if (didCut && didEngrave && !Progress.isDone('ch2-laser')) {
      celebrateModule('ch2-laser', '雷射切割與割字操作');
      document.getElementById('nextBtn').classList.add('pop-in');
      resEl.innerHTML += '<div style="margin-top:6px;font-weight:700;color:var(--theme-dark)">🎉 完成挑戰:成功完成切割與雕刻!</div>';
    }
  } else if (outcome === 'undercut') {
    if (typeof SoundFX !== 'undefined') SoundFX.error();
    resEl.innerHTML = `<div style="background:#FFFBEB;color:#92400E;padding:10px 12px;border-radius:8px;border-left:3px solid #FBBF24">
      ⚠ <strong>能量不足:切不斷／刻不出。</strong>對 ${P.mat} 而言,
      目前的功率太低、或速度太快。試試<strong>提高功率</strong>或<strong>放慢速度</strong>。</div>`;
  } else {
    if (typeof SoundFX !== 'undefined') SoundFX.error();
    resEl.innerHTML = `<div style="background:#FEF2F2;color:#a72d2d;padding:10px 12px;border-radius:8px;border-left:3px solid var(--danger)">
      🔥 <strong>能量過高:材料燒焦了。</strong>對 ${P.mat} 而言,功率太高、或速度太慢,
      邊緣焦黑。試試<strong>降低功率</strong>或<strong>加快速度</strong>。</div>`;
  }
}

document.getElementById('goBtn').addEventListener('click', run);
window.addEventListener('resize', () => { if (!running) drawPreview(); });
drawPreview();
