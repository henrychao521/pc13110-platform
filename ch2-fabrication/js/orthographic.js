/* ============================================================
 * 三視圖與立體模型 — three.js 立體檢視 + 三視圖投影 + 判讀挑戰
 * 體素網格 3×3×3;5 個模型的 x-y footprint 各不相同,
 * 確保上視圖(俯視投影)互不重複。
 * ============================================================ */
import * as THREE from '../../vendor/three/three.module.min.js';

const N = 3;
const R = [0, 1, 2];

/* ---- 5 個模型(體素 [x, y, z];x 左右、y 前後深度、z 上下)----
 * 每個模型的 x-y 平面 footprint 都不同 → 上視圖必定互異。
 */
function fromFootprint(fp, zs) {
  const o = [];
  fp.forEach(([x, y]) => zs.forEach(z => o.push([x, y, z])));
  return o;
}
const MODELS = {
  '立方體':   fromFootprint([[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]], R),
  'L 形塊':   fromFootprint([[0,0],[1,0],[2,0],[0,1],[0,2]], [0, 1]),
  '十字塊':   fromFootprint([[1,0],[0,1],[1,1],[2,1],[1,2]], R),
  '階梯角塊': [
    [0,0,0],[0,0,1],[0,0,2],
    [1,0,0],[1,0,1],
    [0,1,0],[0,1,1],
    [1,1,0],
  ],
  '長條塊':   fromFootprint([[1,0],[1,1],[1,2]], R),
};
const MODEL_NAMES = Object.keys(MODELS);

/* ---- 投影 ---- */
function grid() { return Array.from({ length: N }, () => Array(N).fill(0)); }
function projFront(vx) { const m = grid(); vx.forEach(([x,, z]) => m[z][x] = 1); return m; }
function projTop(vx)   { const m = grid(); vx.forEach(([x, y]) => m[y][x] = 1); return m; }
function projSide(vx)  { const m = grid(); vx.forEach(([, y, z]) => m[z][y] = 1); return m; }

/* ---- 繪製 2D 視圖(flipZ:z 向上的視圖需上下翻轉)---- */
function drawView(canvas, matrix, flipZ, size) {
  size = size || 96;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr; canvas.height = size * dpr;
  canvas.style.width = size + 'px'; canvas.style.height = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const cell = size / N;
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const mr = flipZ ? (N - 1 - r) : r;
      ctx.fillStyle = matrix[mr][c] ? '#2563EB' : '#fff';
      ctx.fillRect(c * cell, r * cell, cell, cell);
      ctx.strokeStyle = '#CBD5E1';
      ctx.strokeRect(c * cell, r * cell, cell, cell);
    }
  }
}

/* ---- 比較兩個矩陣是否相同 ---- */
function sameMatrix(a, b) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (a[r][c] !== b[r][c]) return false;
  return true;
}

/* ============================================================
 * three.js 體素檢視器(可重複建立)
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
  canvas.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointerup', () => { drag = false; });
  window.addEventListener('pointermove', e => {
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
      cube.position.set(x, z, y);          /* three.js Y 為上 → 體素 z 對應 Y */
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
 * 判讀挑戰:觀察立體模型,選出正確的上視圖
 * ============================================================ */
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

const CH_MODELS = ['L 形塊', '階梯角塊', '十字塊'];   /* 3 題 */
let chRound = 0, chScore = 0, chViewer = null;

/* 先建立挑戰區的固定結構(含 3D 檢視 canvas),只建立一次 */
function buildChallengeShell() {
  document.getElementById('challengeArea').innerHTML = `
    <div class="panel" style="margin-bottom:10px">
      <div id="chTitle" style="font-size:13px;font-weight:700;margin-bottom:8px"></div>
      <canvas id="chView"></canvas>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">🖱️ 模型會自動旋轉,也可拖曳檢視</div>
    </div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">▾ 點選正確的上視圖(從正上方往下看)</div>
    <div class="opt-grid" id="chOpts"></div>
    <div id="chFeedback" style="font-size:13px;margin-top:8px;min-height:20px"></div>`;
  chViewer = makeVoxelViewer(document.getElementById('chView'), true);
}

function renderRound() {
  if (chRound >= CH_MODELS.length) {
    document.getElementById('challengeArea').innerHTML = `
      <div class="panel" style="text-align:center;border:2px solid var(--success)">
        <div style="font-size:30px">🎉</div>
        <strong style="font-size:16px">判讀挑戰完成!你答對 ${chScore} / ${CH_MODELS.length} 題。</strong>
        <p style="font-size:13px;color:var(--text-soft);margin-top:4px">你已掌握「立體 → 上視圖」的判讀能力。</p>
      </div>`;
    if (!Progress.isDone('ch2-ortho')) {
      celebrateModule('ch2-ortho', '三視圖與立體模型');
      document.getElementById('nextBtn').classList.add('pop-in');
    }
    return;
  }
  const ansName = CH_MODELS[chRound];
  document.getElementById('chTitle').textContent =
    `第 ${chRound + 1} / ${CH_MODELS.length} 題　請觀察這個立體模型:`;
  chViewer.show(MODELS[ansName]);
  setTimeout(() => chViewer.resize(), 60);

  /* 選項:正確答案 + 3 個其他模型,共 4 個(footprint 皆不同 → 上視圖必不重複)*/
  const others = shuffle(MODEL_NAMES.filter(k => k !== ansName)).slice(0, 3);
  const optNames = shuffle([ansName, ...others]);
  const ansTop = projTop(MODELS[ansName]);

  const optsWrap = document.getElementById('chOpts');
  optsWrap.innerHTML = '';
  document.getElementById('chFeedback').innerHTML = '';
  let answered = false;
  optNames.forEach((name, i) => {
    const opt = document.createElement('div');
    opt.className = 'opt';
    const cv = document.createElement('canvas');
    drawView(cv, projTop(MODELS[name]), false, 104);
    const label = document.createElement('div');
    label.className = 'opt-label';
    label.textContent = '選項 ' + String.fromCharCode(65 + i);
    opt.appendChild(cv);
    opt.appendChild(label);
    opt.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const correct = sameMatrix(projTop(MODELS[name]), ansTop);
      opt.style.borderColor = correct ? 'var(--success)' : 'var(--danger)';
      if (!correct) {
        [...optsWrap.children].forEach((o, j) => {
          if (sameMatrix(projTop(MODELS[optNames[j]]), ansTop)) o.style.borderColor = 'var(--success)';
        });
      }
      if (correct) chScore++;
      if (typeof SoundFX !== 'undefined') (correct ? SoundFX.success : SoundFX.error)();
      document.getElementById('chFeedback').innerHTML = correct
        ? '<span style="color:var(--success);font-weight:700">✓ 答對了!上視圖就是把模型「壓扁」到地面後的輪廓。</span>'
        : '<span style="color:var(--danger);font-weight:700">✗ 不對。綠框才是正確的上視圖——想像從正上方垂直往下看。</span>';
      const nb = document.createElement('button');
      nb.className = 'btn btn-primary btn-sm';
      nb.style.marginTop = '8px';
      nb.textContent = chRound < CH_MODELS.length - 1 ? '下一題 →' : '看結果 →';
      nb.addEventListener('click', () => { chRound++; renderRound(); });
      const fb = document.getElementById('chFeedback');
      fb.appendChild(document.createElement('br'));
      fb.appendChild(nb);
    });
    optsWrap.appendChild(opt);
  });
}

buildChallengeShell();
renderRound();
