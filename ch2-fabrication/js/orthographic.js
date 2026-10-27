/* ============================================================
 * 三視圖與立體模型 — 3D 模型 + 第三角法三視圖 + 判讀挑戰（2026-10-27 改版）
 * 模型與視圖來自物件庫 ../assets/ortho-library/（OpenSCAD 實體 → 正投影算出可見線、隱藏線、中心線）。
 * 視圖排版由 ortho-views.js 負責：上視圖在前視圖正上方、右側視圖在前視圖正右方，同一比例尺
 * → 長對正、高平齊、寬相等由排版保證。題庫在 ortho-quiz.js（正解唯一性有自動測試）。
 * ============================================================ */
import * as THREE from '../../vendor/three/three.module.min.js';

const OV = window.OrthoViews;
const LIB = window.ORTHO_LIB;
const QUIZ = window.ORTHO_QUIZ_PC;
const LIB_DIR = '../assets/ortho-library/';
const NAMES_PC = { front: '前視圖', top: '上視圖', right: '右側視圖', left: '左側視圖', bottom: '仰視圖', rear: '後視圖' };
const LEVEL_TXT = { 1: '基礎', 2: '進階', 3: '挑戰', 4: '綜合' };
const PICKER_IDS = ['lblock', 'step3', 'tee', 'notch', 'chamfer', 'ramp', 'holeplate', 'vblock', 'tslot', 'dovetail',
  'cbore', 'cylstack', 'bracket', 'lhole', 'slotplate', 'boss', 'rib'];

/* ---- STL（二進位）→ BufferGeometry ---- */
const geoCache = new Map();
function loadGeometry(id) {
  if (geoCache.has(id)) return geoCache.get(id);
  const p = fetch(LIB_DIR + id + '.stl').then(r => {
    if (!r.ok) throw new Error('STL ' + r.status);
    return r.arrayBuffer();
  }).then(buf => {
    const dv = new DataView(buf), n = dv.getUint32(80, true);
    const pos = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) for (let j = 0; j < 9; j++) pos[i * 9 + j] = dv.getFloat32(84 + i * 50 + 12 + j * 4, true);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.computeVertexNormals();
    g.computeBoundingBox();
    return g;
  });
  geoCache.set(id, p);
  return p;
}

/* ============================================================
 * 3D 檢視器（Z 軸朝上；橘色箭頭＝前視方向）
 * ============================================================ */
function makeViewer(canvas, autoRotate) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#F1F5F9');
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
  camera.up.set(0, 0, 1);
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dl = new THREE.DirectionalLight(0xffffff, 0.95);
  dl.position.set(40, -90, 120); scene.add(dl);
  const group = new THREE.Group(); scene.add(group);
  let az = 0.75, pol = 1.05, drag = false, lx = 0, ly = 0, zoom = 1, radius = 60;
  const target = new THREE.Vector3();
  function updateCam() {
    const d = 400;
    camera.position.set(target.x + d * Math.sin(pol) * Math.sin(az), target.y - d * Math.sin(pol) * Math.cos(az), target.z + d * Math.cos(pol));
    camera.lookAt(target);
  }
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const half = radius * 1.08 / zoom, a = w / h;
    /* 直式畫面以寬度為準，橫式以高度為準 → 物件全貌都在畫面內 */
    const hh = a >= 1 ? half : half / a;
    camera.left = -hh * a; camera.right = hh * a; camera.top = hh; camera.bottom = -hh;
    camera.updateProjectionMatrix();
  }
  const touches = new Map(); let pinch = 0;
  canvas.addEventListener('pointerdown', e => {
    e.preventDefault();
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); drag = false; }
    else { drag = true; lx = e.clientX; ly = e.clientY; }
  });
  const endP = e => { touches.delete(e.pointerId); if (touches.size < 2) pinch = 0; if (!touches.size) drag = false; };
  window.addEventListener('pointerup', endP); window.addEventListener('pointercancel', endP);
  window.addEventListener('pointermove', e => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0 && d > 0) { zoom = Math.min(3, Math.max(0.6, zoom * d / pinch)); resize(); }
      pinch = d; return;
    }
    if (!drag) return;
    az -= (e.clientX - lx) * 0.01;
    pol = Math.min(1.5, Math.max(0.15, pol - (e.clientY - ly) * 0.01));
    lx = e.clientX; ly = e.clientY; updateCam();
  });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = Math.min(3, Math.max(0.6, zoom * (1 - e.deltaY * 0.0012))); resize(); }, { passive: false });

  let token = 0;
  function show(id) {
    const my = ++token;
    loadGeometry(id).then(geo => {
      if (my !== token) return;
      group.clear();
      const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x93A5F5 }));
      group.add(mesh);
      group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color: 0x1E1B4B })));
      const bb = geo.boundingBox, c = new THREE.Vector3(); bb.getCenter(c);
      const size = new THREE.Vector3(); bb.getSize(size);
      /* 前視方向箭頭：放在正面前方，指向 +Y（從前面往物體看） */
      const len = Math.max(14, size.y * 0.45);
      const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(c.x, bb.min.y - len - 4, bb.min.z + size.z * 0.35), len, 0xF97316, len * 0.35, len * 0.22);
      group.add(arrow);
      target.set(c.x, c.y - (len + 4) / 2, c.z);
      radius = 0.5 * Math.hypot(size.x, size.y + len + 4, size.z);
      resize(); updateCam();
    }).catch(err => {
      group.clear();
      console.error('模型載入失敗', id, err);
    });
  }
  updateCam(); resize();
  window.addEventListener('resize', resize);
  let alive = true;
  (function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);
    if (autoRotate && !drag) { az += 0.005; updateCam(); }
    renderer.render(scene, camera);
  })();
  return {
    show, resize,
    dispose() { alive = false; window.removeEventListener('resize', resize); renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); }
  };
}

/* ============================================================
 * 互動①：立體 ↔ 三視圖
 * ============================================================ */
const mainViewer = makeViewer(document.getElementById('orthoView'), false);
let curId = 'lblock', layoutMode = 'three';
function drawViews() {
  const o = LIB.objects[curId];
  const host = document.getElementById('orthoViews');
  const w = Math.max(260, Math.min(520, host.clientWidth || 340));
  const views = layoutMode === 'six' ? o.views : { front: o.views.front, top: o.views.top, right: o.views.right };
  host.innerHTML = OV.svgLayout(views, layoutMode, { maxWidth: w, names: NAMES_PC, projLines: layoutMode === 'three', title: o.name + (layoutMode === 'six' ? ' 六視圖' : ' 三視圖') });
  document.getElementById('orthoDesc').innerHTML = `<strong>${o.name}</strong>（${LEVEL_TXT[o.level]}）：${o.desc}`;
}
function showModel(id) { curId = id; mainViewer.show(id); drawViews(); }
(function buildPicker() {
  const wrap = document.getElementById('modelPicker');
  PICKER_IDS.forEach(id => {
    const o = LIB.objects[id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-ghost btn-sm' + (id === curId ? ' btn-primary' : '');
    b.innerHTML = `<span class="lvl-dot lvl-dot-${o.level}" aria-hidden="true"></span>${o.name}`;
    b.addEventListener('click', () => {
      wrap.querySelectorAll('button').forEach(x => x.classList.remove('btn-primary'));
      b.classList.add('btn-primary');
      showModel(id);
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
    wrap.appendChild(b);
  });
  document.querySelectorAll('[data-layout]').forEach(btn => btn.addEventListener('click', () => {
    layoutMode = btn.dataset.layout;
    document.querySelectorAll('[data-layout]').forEach(x => x.classList.toggle('btn-primary', x === btn));
    drawViews();
  }));
})();
showModel(curId);
let rsT = 0;
window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(drawViews, 150); });
setTimeout(() => mainViewer.resize(), 80);

/* ============================================================
 * 互動②：判讀挑戰（6 題，淺→中→難）
 * ============================================================ */
const LOG_PAGE = 'ch2.orthographic';
const VIEW_LABEL = { top: '上視圖', front: '前視圖', right: '右側視圖' };
const PASS_SCORE = 4;
let qIdx = 0, score = 0, chViewer = null;
function stemOf(q) {
  const name = LIB.objects[q.obj].name;
  return q.type === 'triplet'
    ? `觀察立體模型「${name}」,下列哪一組三視圖(上視圖在上、前視圖在下、右側視圖在右)完全正確?`
    : `觀察立體模型「${name}」,點選正確的「${VIEW_LABEL[q.view]}」`;
}
if (window.SheetTrack) QUIZ.forEach((q, i) => SheetTrack.register(LOG_PAGE, 'q' + (i + 1),
  { t: 'single', stem: stemOf(q), options: q.options.map(o => o.note), answer: 0 }));
function logAnswer(i, correct, origIdx) {
  if (window.SheetTrack) SheetTrack.attempt(LOG_PAGE, 'q' + (i + 1), { ok: correct, a: 'ABCD'.charAt(origIdx), final: true });
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

function buildShell() {
  document.getElementById('challengeArea').innerHTML = `
    <div class="panel" style="margin-bottom:10px">
      <div id="chTitle" style="font-size:13px;font-weight:700;margin-bottom:8px"></div>
      <canvas id="chView"></canvas>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">模型會自動旋轉,也可拖曳檢視;<span style="color:#EA580C;font-weight:700">橘色箭頭＝前視方向</span></div>
    </div>
    <div id="chPrompt" style="font-size:12.5px;color:var(--text-muted);margin-bottom:4px"></div>
    <div id="chOptsHost"></div>
    <div id="chFeedback" style="font-size:13px;margin-top:8px;min-height:20px"></div>`;
  chViewer = makeViewer(document.getElementById('chView'), true);
}
function nextBtn(label) {
  const nb = document.createElement('button');
  nb.className = 'btn btn-primary btn-sm'; nb.style.marginTop = '8px'; nb.textContent = label;
  nb.addEventListener('click', () => { qIdx++; renderQuestion(); });
  return nb;
}
function finish() {
  if (chViewer) { chViewer.dispose(); chViewer = null; }
  const area = document.getElementById('challengeArea');
  if (score < PASS_SCORE) {
    area.innerHTML = `<div class="panel" style="text-align:center;border:2px solid var(--warning)">
      <div style="font-size:30px">💪</div><strong style="font-size:16px">你答對 ${score} / ${QUIZ.length} 題——再多練習!</strong>
      <p style="font-size:13px;color:var(--text-soft);margin-top:4px">至少答對 ${PASS_SCORE} 題才算完成本模組。先回到上方多轉幾個模型對照三視圖,再挑戰一次。</p>
      <button class="btn btn-primary btn-sm" id="chRetry" style="margin-top:8px">↻ 重新挑戰</button></div>`;
    document.getElementById('chRetry').addEventListener('click', () => { qIdx = 0; score = 0; buildShell(); renderQuestion(); });
    return;
  }
  area.innerHTML = `<div class="panel" style="text-align:center;border:2px solid var(--success)">
    <div style="font-size:30px">🎉</div><strong style="font-size:16px">挑戰完成!你答對 ${score} / ${QUIZ.length} 題——${score >= 5 ? '太厲害了' : '表現不錯'}!</strong>
    <p style="font-size:13px;color:var(--text-soft);margin-top:4px">你已能判讀可見線、隱藏線,也分得出上視圖、仰視圖與左右側視圖的位置。</p></div>`;
  if (!Progress.isDone('ch2-ortho')) {
    celebrateModule('ch2-ortho', '三視圖與立體模型');
    document.getElementById('nextBtn').classList.add('pop-in');
  }
}
function renderQuestion() {
  if (qIdx >= QUIZ.length) return finish();
  const q = QUIZ[qIdx], qi = qIdx;
  document.getElementById('chTitle').innerHTML =
    `第 ${qi + 1} / ${QUIZ.length} 題　<span class="lvl-badge lvl-${q.level}">難度:${q.level}</span>　請觀察這個立體模型:`;
  chViewer.show(q.obj);
  setTimeout(() => chViewer.resize(), 60);
  const host = document.getElementById('chOptsHost'), fb = document.getElementById('chFeedback');
  host.innerHTML = ''; fb.innerHTML = '';
  let answered = false;
  const order = shuffle(q.options.map((_, i) => i));
  const wrap = document.createElement('div');
  wrap.className = q.type === 'triplet' ? 'trip-opts' : 'opt-grid';
  /* 同一題的選項用同一比例尺，大小也是線索 */
  let maxMm = 0;
  q.options.forEach(o => (q.type === 'triplet' ? ['front', 'top', 'right'].map(k => o[k]) : [o]).forEach(s => {
    const b = OV.viewOf(s).box; maxMm = Math.max(maxMm, (b[2] - b[0]) / 10, (b[3] - b[1]) / 10);
  }));
  const optW = Math.min(150, Math.max(110, (host.clientWidth || 320) / 2 - 24));
  order.forEach((oi, pos) => {
    const o = q.options[oi];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = q.type === 'triplet' ? 'trip-opt' : 'opt';
    const label = '選項 ' + String.fromCharCode(65 + pos);
    if (q.type === 'triplet') {
      const tw = Math.min(300, (host.clientWidth || 320) - 70);
      el.innerHTML = `<div class="to-label">${label}</div><div class="to-views">${OV.svgLayout({
        front: OV.viewOf(o.front), top: OV.viewOf(o.top), right: OV.viewOf(o.right) }, 'three',
        { maxWidth: tw, names: NAMES_PC, symbol: false, gapMm: 10, title: label })}</div>`;
    } else {
      el.innerHTML = OV.svgSingle(OV.viewOf(o), { pxPerMm: (optW - 20) / maxMm, width: optW, height: optW * 0.82, title: label }) +
        `<div class="opt-label">${label}</div>`;
    }
    el.addEventListener('click', () => {
      if (answered) return;
      answered = true;
      const ok = oi === 0;
      el.style.borderColor = ok ? 'var(--success)' : 'var(--danger)';
      if (!ok) [...wrap.children].forEach((c, j) => { if (order[j] === 0) c.style.borderColor = 'var(--success)'; });
      if (ok) score++;
      logAnswer(qi, ok, oi);
      if (typeof SoundFX !== 'undefined') (ok ? SoundFX.success : SoundFX.error)();
      fb.innerHTML = (ok ? '<span style="color:var(--success);font-weight:700">✓ 答對了!</span> '
        : `<span style="color:var(--danger);font-weight:700">✗ 不對。</span>你選的是「${o.note}」。綠框才是正解。 `) +
        `<span style="color:var(--text-soft)">${q.why}</span>`;
      fb.appendChild(document.createElement('br'));
      fb.appendChild(nextBtn(qi < QUIZ.length - 1 ? '下一題 →' : '看結果 →'));
    });
    wrap.appendChild(el);
  });
  document.getElementById('chPrompt').textContent = q.type === 'triplet'
    ? '▾ 下列哪一組三視圖完全正確?（每組依第三角法排列）'
    : `▾ 點選正確的「${VIEW_LABEL[q.view]}」`;
  host.appendChild(wrap);
}
buildShell();
renderQuestion();
