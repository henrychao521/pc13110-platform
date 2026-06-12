/* ============================================================
 * 三視圖與立體模型 — three.js 立體檢視 + 三視圖投影 + 進階判讀挑戰
 * 體素網格 3×3×3;8 個模型。挑戰由淺至難:
 *   淺 → 選上視圖    中 → 選前/側視圖    難 → 選出完全正確的三視圖組合
 * ============================================================ */
import * as THREE from '../../vendor/three/three.module.min.js';

const N = 3;
const R = [0, 1, 2];
const ALL9 = [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]];

function fromFootprint(fp, zs) {
  const o = [];
  fp.forEach(([x, y]) => zs.forEach(z => o.push([x, y, z])));
  return o;
}

/* ---- 8 個體素模型 ---- */
const MODELS = {
  '立方體': fromFootprint(ALL9, R),
  'L 形塊': fromFootprint([[0,0],[1,0],[2,0],[0,1],[0,2]], [0, 1]),
  '十字柱': fromFootprint([[1,0],[0,1],[1,1],[2,1],[1,2]], R),
  '階梯': (() => { const o = []; R.forEach(y => {
    o.push([0,y,0], [1,y,0],[1,y,1], [2,y,0],[2,y,1],[2,y,2]);
  }); return o; })(),
  '直立板': fromFootprint([[0,0],[1,0],[2,0]], R),
  '角柱': fromFootprint([[0,0],[1,0],[0,1],[1,1]], [0, 1]),
  '凸字塊': (() => { const o = fromFootprint(ALL9, [0]); o.push([1,1,1], [1,1,2]); return o; })(),
  '長條臥': [[0,2,0],[1,2,0],[2,2,0]],
};
const MODEL_NAMES = Object.keys(MODELS);

/* ---- 投影 ---- */
function grid() { return Array.from({ length: N }, () => Array(N).fill(0)); }
function projFront(vx) { const m = grid(); vx.forEach(([x,, z]) => m[z][x] = 1); return m; }
function projTop(vx)   { const m = grid(); vx.forEach(([x, y]) => m[y][x] = 1); return m; }
function projSide(vx)  { const m = grid(); vx.forEach(([, y, z]) => m[z][y] = 1); return m; }
const PROJ = { top: projTop, front: projFront, side: projSide };
const VIEW_LABEL = { top: '上視圖', front: '前視圖', side: '側視圖' };
const VIEW_FLIP = { top: false, front: true, side: true };

function sig(m) { return m.map(r => r.join('')).join('|'); }

/* ---- 繪製 2D 視圖 ---- */
function drawView(canvas, matrix, flipZ, size) {
  size = size || 96;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const cell = size / N;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const mr = flipZ ? (N - 1 - r) : r;
    ctx.fillStyle = matrix[mr][c] ? '#2563EB' : '#fff';
    ctx.fillRect(c * cell, r * cell, cell, cell);
    ctx.strokeStyle = '#CBD5E1';
    ctx.strokeRect(c * cell, r * cell, cell, cell);
  }
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ============================================================
 * three.js 體素檢視器
 * ============================================================ */
function makeVoxelViewer(canvas, autoRotate) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#F1F5F9');
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  scene.add(new THREE.AmbientLight(0xffffff, 0.72));
  const dl = new THREE.DirectionalLight(0xffffff, 0.9);
  dl.position.set(6, 10, 8); scene.add(dl);
  const group = new THREE.Group();
  scene.add(group);

  let az = 0.9, pol = 1.0, rad = 9, drag = false, lx = 0, ly = 0;
  function updateCam() {
    camera.position.set(rad*Math.sin(pol)*Math.sin(az), rad*Math.cos(pol), rad*Math.sin(pol)*Math.cos(az));
    camera.lookAt(0, 0, 0);
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const touches = new Map(); // 進行中的指針（雙指＝pinch 縮放）
  let pinchDist = 0;
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      drag = false;
    } else {
      drag = true; lx = e.clientX; ly = e.clientY;
    }
  });
  const endPointer = e => {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinchDist = 0;
    if (touches.size === 0) drag = false;
  };
  window.addEventListener('pointerup', endPointer);
  window.addEventListener('pointercancel', endPointer);
  window.addEventListener('pointermove', e => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0 && d > 0) {
        rad = Math.min(16, Math.max(5, rad * (pinchDist / d)));
        updateCam();
      }
      pinchDist = d;
      return;
    }
    if (!drag) return;
    az -= (e.clientX - lx) * 0.01;
    pol = Math.min(1.4, Math.max(0.3, pol - (e.clientY - ly) * 0.01));
    lx = e.clientX; ly = e.clientY; updateCam();
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    rad = Math.min(16, Math.max(5, rad * (1 + e.deltaY * 0.0012)));
    updateCam();
  }, { passive: false });

  function show(vx) {
    group.clear();
    const geo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    const mat = new THREE.MeshLambertMaterial({ color: 0x2563EB });
    vx.forEach(([x, y, z]) => {
      const cube = new THREE.Mesh(geo, mat);
      cube.position.set(x, z, y);
      group.add(cube);
      const edge = new THREE.LineSegments(
        new THREE.EdgesGeometry(geo),
        new THREE.LineBasicMaterial({ color: 0x1e293b }));
      edge.position.copy(cube.position);
      group.add(edge);
    });
    group.position.set(-(N - 1) / 2, -(N - 1) / 2, -(N - 1) / 2);
  }
  resize(); updateCam();
  window.addEventListener('resize', resize);
  (function loop() {
    requestAnimationFrame(loop);
    if (autoRotate && !drag) { az += 0.006; updateCam(); }
    renderer.render(scene, camera);
  })();
  return { show, resize };
}

/* ============================================================
 * 主檢視器:立體模型 + 即時三視圖
 * ============================================================ */
const mainViewer = makeVoxelViewer(document.getElementById('orthoView'), false);
function showModel(name) {
  const vx = MODELS[name];
  mainViewer.show(vx);
  drawView(document.getElementById('viewFront'), projFront(vx), true);
  drawView(document.getElementById('viewTop'), projTop(vx), false);
  drawView(document.getElementById('viewSide'), projSide(vx), true);
}
(function buildPicker() {
  const wrap = document.getElementById('modelPicker');
  MODEL_NAMES.forEach((name, i) => {
    const b = document.createElement('button');
    b.className = 'btn btn-ghost btn-sm';
    b.textContent = name;
    if (i === 0) b.classList.add('btn-primary');
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('btn-primary'));
      b.classList.add('btn-primary');
      showModel(name);
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
    wrap.appendChild(b);
  });
})();
showModel(MODEL_NAMES[0]);
setTimeout(() => mainViewer.resize(), 80);

/* ============================================================
 * 進階判讀挑戰(6 題,由淺至難)
 * ============================================================ */
const QUESTIONS = [
  { level: '淺', type: 'top',     model: 'L 形塊' },
  { level: '淺', type: 'top',     model: '角柱' },
  { level: '中', type: 'front',   model: '階梯' },
  { level: '中', type: 'side',    model: '凸字塊' },
  { level: '難', type: 'triplet', model: '十字柱' },
  { level: '難', type: 'triplet', model: '直立板' },
];
let qIdx = 0, score = 0, chViewer = null;

/* 視圖題選項:答案 + 不重複的干擾項(以該視圖的投影簽章去重)*/
function buildViewOptions(answerName, type) {
  const proj = PROJ[type];
  const used = new Set([sig(proj(MODELS[answerName]))]);
  const opts = [answerName];
  shuffle(MODEL_NAMES.filter(n => n !== answerName)).forEach(n => {
    if (opts.length >= 4) return;
    const s = sig(proj(MODELS[n]));
    if (!used.has(s)) { used.add(s); opts.push(n); }
  });
  return shuffle(opts);
}

/* 三視圖組合題選項:正解 + 3 個「只錯一個視圖」的干擾項 */
function tripSig(t) { return sig(t.front) + '#' + sig(t.top) + '#' + sig(t.side); }
function buildTripletOptions(answerName) {
  const correct = {
    front: projFront(MODELS[answerName]), top: projTop(MODELS[answerName]),
    side: projSide(MODELS[answerName]), correct: true,
  };
  const opts = [correct];
  const usedSig = new Set([tripSig(correct)]);
  const views = ['front', 'top', 'side'];
  const others = shuffle(MODEL_NAMES.filter(n => n !== answerName));
  let oi = 0;
  while (opts.length < 4 && oi < others.length) {
    const cv = views[(opts.length - 1) % 3];      /* 每個干擾項換掉不同視圖 */
    const donorView = PROJ[cv](MODELS[others[oi]]);
    oi++;
    if (sig(donorView) === sig(correct[cv])) continue;   /* 換掉的視圖必須真的不同 */
    const trip = { front: correct.front, top: correct.top, side: correct.side, correct: false };
    trip[cv] = donorView;
    if (usedSig.has(tripSig(trip))) continue;
    usedSig.add(tripSig(trip));
    opts.push(trip);
  }
  return shuffle(opts);
}

function buildShell() {
  document.getElementById('challengeArea').innerHTML = `
    <div class="panel" style="margin-bottom:10px">
      <div id="chTitle" style="font-size:13px;font-weight:700;margin-bottom:8px"></div>
      <canvas id="chView"></canvas>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">🖱️ 模型會自動旋轉,也可拖曳檢視</div>
    </div>
    <div id="chPrompt" style="font-size:12.5px;color:var(--text-muted);margin-bottom:4px"></div>
    <div id="chOptsHost"></div>
    <div id="chFeedback" style="font-size:13px;margin-top:8px;min-height:20px"></div>`;
  chViewer = makeVoxelViewer(document.getElementById('chView'), true);
}

function nextBtn(label) {
  const nb = document.createElement('button');
  nb.className = 'btn btn-primary btn-sm';
  nb.style.marginTop = '8px';
  nb.textContent = label;
  nb.addEventListener('click', () => { qIdx++; renderQuestion(); });
  return nb;
}

function renderQuestion() {
  if (qIdx >= QUESTIONS.length) {
    const lv = score >= 5 ? '太厲害了' : score >= 3 ? '表現不錯' : '再多練習';
    document.getElementById('challengeArea').innerHTML = `
      <div class="panel" style="text-align:center;border:2px solid var(--success)">
        <div style="font-size:30px">🎉</div>
        <strong style="font-size:16px">挑戰完成!你答對 ${score} / ${QUESTIONS.length} 題——${lv}!</strong>
        <p style="font-size:13px;color:var(--text-soft);margin-top:4px">你已能在「淺、中、難」三種層次判讀三視圖。</p>
      </div>`;
    if (!Progress.isDone('ch2-ortho')) {
      celebrateModule('ch2-ortho', '三視圖與立體模型');
      document.getElementById('nextBtn').classList.add('pop-in');
    }
    return;
  }
  const q = QUESTIONS[qIdx];
  document.getElementById('chTitle').innerHTML =
    `第 ${qIdx + 1} / ${QUESTIONS.length} 題　<span class="lvl-badge lvl-${q.level}">難度:${q.level}</span>　請觀察這個立體模型:`;
  chViewer.show(MODELS[q.model]);
  setTimeout(() => chViewer.resize(), 60);

  const host = document.getElementById('chOptsHost');
  const fb = document.getElementById('chFeedback');
  host.innerHTML = ''; fb.innerHTML = '';
  let answered = false;

  if (q.type === 'triplet') {
    document.getElementById('chPrompt').textContent = '▾ 下列哪一組三視圖(前視圖／上視圖／側視圖)完全正確?';
    const opts = buildTripletOptions(q.model);
    const wrap = document.createElement('div');
    wrap.className = 'trip-opts';
    opts.forEach((t, i) => {
      const row = document.createElement('div');
      row.className = 'trip-opt';
      row.innerHTML = `<div class="to-label">選項 ${String.fromCharCode(65 + i)}</div>`;
      const views = document.createElement('div');
      views.className = 'to-views';
      [['front', '前'], ['top', '上'], ['side', '側']].forEach(([k, lab]) => {
        const cell = document.createElement('div');
        cell.className = 'to-view';
        const cap = document.createElement('div');
        cap.className = 'tv-t'; cap.textContent = lab + '視圖';
        const cv = document.createElement('canvas');
        drawView(cv, t[k], VIEW_FLIP[k], 50);
        cell.appendChild(cap); cell.appendChild(cv);
        views.appendChild(cell);
      });
      row.appendChild(views);
      row.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        row.style.borderColor = t.correct ? 'var(--success)' : 'var(--danger)';
        if (!t.correct) [...wrap.children].forEach((r, j) => {
          if (opts[j].correct) r.style.borderColor = 'var(--success)';
        });
        if (t.correct) score++;
        if (typeof SoundFX !== 'undefined') (t.correct ? SoundFX.success : SoundFX.error)();
        fb.innerHTML = t.correct
          ? '<span style="color:var(--success);font-weight:700">✓ 答對了!三個視圖都正確——這需要同時掌握長、寬、高。</span>'
          : '<span style="color:var(--danger);font-weight:700">✗ 不對。綠框那組才完全正確;其他組各有一個視圖是錯的。</span>';
        fb.appendChild(document.createElement('br'));
        fb.appendChild(nextBtn(qIdx < QUESTIONS.length - 1 ? '下一題 →' : '看結果 →'));
      });
      wrap.appendChild(row);
    });
    host.appendChild(wrap);
  } else {
    document.getElementById('chPrompt').textContent = `▾ 點選正確的「${VIEW_LABEL[q.type]}」`;
    const opts = buildViewOptions(q.model, q.type);
    const ansSig = sig(PROJ[q.type](MODELS[q.model]));
    const grid = document.createElement('div');
    grid.className = 'opt-grid';
    opts.forEach((name, i) => {
      const opt = document.createElement('div');
      opt.className = 'opt';
      const cv = document.createElement('canvas');
      drawView(cv, PROJ[q.type](MODELS[name]), VIEW_FLIP[q.type], 104);
      const label = document.createElement('div');
      label.className = 'opt-label';
      label.textContent = '選項 ' + String.fromCharCode(65 + i);
      opt.appendChild(cv); opt.appendChild(label);
      opt.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = sig(PROJ[q.type](MODELS[name])) === ansSig;
        opt.style.borderColor = correct ? 'var(--success)' : 'var(--danger)';
        if (!correct) [...grid.children].forEach((o, j) => {
          if (sig(PROJ[q.type](MODELS[opts[j]])) === ansSig) o.style.borderColor = 'var(--success)';
        });
        if (correct) score++;
        if (typeof SoundFX !== 'undefined') (correct ? SoundFX.success : SoundFX.error)();
        fb.innerHTML = correct
          ? `<span style="color:var(--success);font-weight:700">✓ 答對了!這就是模型的${VIEW_LABEL[q.type]}。</span>`
          : `<span style="color:var(--danger);font-weight:700">✗ 不對。綠框才是正確的${VIEW_LABEL[q.type]}。</span>`;
        fb.appendChild(document.createElement('br'));
        fb.appendChild(nextBtn(qIdx < QUESTIONS.length - 1 ? '下一題 →' : '看結果 →'));
      });
      grid.appendChild(opt);
    });
    host.appendChild(grid);
  }
}

buildShell();
renderQuestion();
