/* ============================================================
 * 三視圖與立體模型 — three.js 立體檢視 + 三視圖投影 + 判讀挑戰
 * ============================================================ */
import * as THREE from '../../vendor/three/three.module.min.js';

const N = 4; /* 體素網格 4×4×4 */

/* 體素模型:cell = [x, y, z]，x 左右、y 前後深度、z 上下 */
const MODELS = {
  'L 形塊': cells([[0,0,0],[0,0,1],[0,0,2],[1,0,0],[2,0,0]]),
  '階梯':   cells([[0,0,0],[1,0,0],[1,0,1],[2,0,0],[2,0,1],[2,0,2]]),
  'T 形塊': cells([[0,0,2],[1,0,2],[2,0,2],[1,0,0],[1,0,1]]),
  '角落塊': cells([[0,0,0],[1,0,0],[2,0,0],[0,1,0],[1,1,0],[2,1,0],[0,0,1],[0,0,2],[0,1,1]]),
};
/* 把深度 1 的模型補成深度 2，較易觀察 */
function cells(list) {
  const out = [];
  list.forEach(([x, y, z]) => {
    out.push([x, y, z]);
    if (y === 0 && !list.some(c => c[0] === x && c[1] === 1 && c[2] === z)) out.push([x, 1, z]);
  });
  return out;
}

/* ---- 投影 ---- */
function projFront(vx) { const m = grid(); vx.forEach(([x,,z]) => m[z][x] = 1); return m; }
function projTop(vx)   { const m = grid(); vx.forEach(([x,y]) => m[y][x] = 1); return m; }
function projSide(vx)  { const m = grid(); vx.forEach(([,y,z]) => m[z][y] = 1); return m; }
function grid() { return Array.from({ length: N }, () => Array(N).fill(0)); }

/* ---- 繪製 2D 視圖（row 0 在最上方;z 向上的視圖需翻轉)---- */
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

/* ============================================================
 * three.js 立體檢視
 * ============================================================ */
const canvas = document.getElementById('orthoView');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color('#F1F5F9');
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const dl = new THREE.DirectionalLight(0xffffff, 0.9);
dl.position.set(6, 10, 8); scene.add(dl);

const group = new THREE.Group();
scene.add(group);

function buildVoxels(vx) {
  group.clear();
  const geo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
  const mat = new THREE.MeshLambertMaterial({ color: 0x2563EB });
  vx.forEach(([x, y, z]) => {
    const cube = new THREE.Mesh(geo, mat);
    cube.position.set(x, z, y);
    group.add(cube);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x1e293b })
    );
    edge.position.copy(cube.position);
    group.add(edge);
  });
  group.position.set(-(N - 1) / 2, -(N - 1) / 2, -(N - 1) / 2);
}

const target = new THREE.Vector3(0, 0, 0);
let az = 0.9, pol = 1.05, rad = 11;
function updateCam() {
  camera.position.set(rad*Math.sin(pol)*Math.sin(az), rad*Math.cos(pol), rad*Math.sin(pol)*Math.cos(az));
  camera.lookAt(target);
}
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
let drag = false, lx = 0, ly = 0;
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
  rad = Math.min(22, Math.max(6, rad * (1 + e.deltaY * 0.0012)));
  updateCam();
}, { passive: false });
(function loop() { requestAnimationFrame(loop); renderer.render(scene, camera); })();

/* ---- 切換模型 + 更新三視圖 ---- */
function showModel(name) {
  const vx = MODELS[name];
  buildVoxels(vx);
  drawView(document.getElementById('viewFront'), projFront(vx), true);
  drawView(document.getElementById('viewTop'), projTop(vx), false);
  drawView(document.getElementById('viewSide'), projSide(vx), true);
}

(function buildPicker() {
  const wrap = document.getElementById('modelPicker');
  Object.keys(MODELS).forEach((name, i) => {
    const b = document.createElement('button');
    b.className = 'btn btn-ghost btn-sm';
    b.textContent = name;
    b.addEventListener('click', () => {
      document.querySelectorAll('#modelPicker button').forEach(x => x.classList.remove('btn-primary'));
      b.classList.add('btn-primary');
      showModel(name);
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
    if (i === 0) b.classList.add('btn-primary');
    wrap.appendChild(b);
  });
})();

resize();
updateCam();
showModel('L 形塊');
setTimeout(resize, 60);

/* ============================================================
 * 判讀挑戰：給前視圖+側視圖,選正確的上視圖
 * ============================================================ */
const CH_KEYS = Object.keys(MODELS);
let chRound = 0, chDone = 0;
const TOTAL_ROUNDS = 3;

function startChallenge() {
  const area = document.getElementById('challengeArea');
  if (chRound >= TOTAL_ROUNDS) {
    area.innerHTML = `<div class="panel" style="text-align:center;border:2px solid var(--success)">
      <div style="font-size:30px">🎉</div>
      <strong style="font-size:16px">判讀挑戰完成!你答對 ${chDone} / ${TOTAL_ROUNDS} 題。</strong>
      <p style="font-size:13px;color:var(--text-soft);margin-top:4px">你已掌握三視圖的判讀能力。</p></div>`;
    if (!Progress.isDone('ch2-ortho')) {
      celebrateModule('ch2-ortho', '三視圖與立體模型');
      document.getElementById('nextBtn').classList.add('pop-in');
    }
    return;
  }
  const ansName = CH_KEYS[chRound % CH_KEYS.length];
  const ansVx = MODELS[ansName];
  /* 候選上視圖:正確 + 3 個其他模型 */
  const others = CH_KEYS.filter(k => k !== ansName);
  const optNames = [ansName, others[0], others[1], others[2]].sort(() => Math.random() - 0.5);

  area.innerHTML = `
    <div class="panel" style="margin-bottom:10px">
      <div style="font-size:13px;font-weight:700;margin-bottom:8px">第 ${chRound + 1} / ${TOTAL_ROUNDS} 題　某物體的「前視圖」與「側視圖」如下,哪一個才是正確的「上視圖」?</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">
        <div><div style="font-size:11px;font-weight:700;color:var(--theme-dark)">前視圖</div><canvas id="chFront"></canvas></div>
        <div><div style="font-size:11px;font-weight:700;color:var(--theme-dark)">側視圖</div><canvas id="chSide"></canvas></div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">▾ 點選正確的上視圖</div>
    <div class="opt-grid" id="chOpts"></div>
    <div id="chFeedback" style="font-size:13px;margin-top:8px;min-height:20px"></div>`;

  drawView(document.getElementById('chFront'), projFront(ansVx), true, 84);
  drawView(document.getElementById('chSide'), projSide(ansVx), true, 84);

  const optsWrap = document.getElementById('chOpts');
  let answered = false;
  optNames.forEach(name => {
    const cv = document.createElement('canvas');
    drawView(cv, projTop(MODELS[name]), false, 110);
    cv.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const correct = name === ansName;
      cv.style.borderColor = correct ? 'var(--success)' : 'var(--danger)';
      if (!correct) {
        optsWrap.querySelectorAll('canvas').forEach((c, i) => {
          if (optNames[i] === ansName) c.style.borderColor = 'var(--success)';
        });
      }
      if (correct) chDone++;
      if (typeof SoundFX !== 'undefined') (correct ? SoundFX.success : SoundFX.error)();
      document.getElementById('chFeedback').innerHTML = correct
        ? '<span style="color:var(--success);font-weight:700">✓ 答對了!上視圖是「從正上方往下看」的投影。</span>'
        : '<span style="color:var(--danger);font-weight:700">✗ 不對。綠框才是正確的上視圖,再仔細比對一次。</span>';
      const nb = document.createElement('button');
      nb.className = 'btn btn-primary btn-sm';
      nb.style.marginTop = '8px';
      nb.textContent = chRound < TOTAL_ROUNDS - 1 ? '下一題 →' : '看結果 →';
      nb.addEventListener('click', () => { chRound++; startChallenge(); });
      document.getElementById('chFeedback').appendChild(document.createElement('br'));
      document.getElementById('chFeedback').appendChild(nb);
    });
    optsWrap.appendChild(cv);
  });
}
startChallenge();
