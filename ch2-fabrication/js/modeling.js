/* ============================================================
 * 程式化 CAD 建模器 — three.js 驅動
 * 每行一個零件,key=value 參數;支援 box / cylinder / sphere / cone
 * ============================================================ */
import * as THREE from '../../vendor/three/three.module.min.js';

const COLORS = {
  red: '#DC2626', blue: '#2563EB', green: '#16A34A', orange: '#EA580C',
  silver: '#CBD5E1', gray: '#64748B', yellow: '#EAB308', purple: '#9333EA',
};

const EXAMPLES = {
  '🪑 桌子': `# 一張桌子（每行一個零件）
box w=80 d=80 h=8 z=40 color=orange
cylinder r=5 h=40 x=-32 y=-32 color=silver
cylinder r=5 h=40 x=32 y=-32 color=silver
cylinder r=5 h=40 x=-32 y=32 color=silver
cylinder r=5 h=40 x=32 y=32 color=silver`,
  '⛄ 雪人': `# 雪人 — 三顆球疊起來
sphere r=24 z=0 color=silver
sphere r=17 z=44 color=silver
sphere r=11 z=74 color=silver
cone r=5 h=12 z=72 color=orange`,
  '🚀 火箭': `# 火箭 — 圓柱身 + 圓錐頭 + 兩片尾翼
cylinder r=14 h=50 z=0 color=silver
cone r=14 h=26 z=50 color=red
box w=6 d=22 h=20 x=-16 z=0 color=red
box w=6 d=22 h=20 x=16 z=0 color=red`,
  '🧱 積木塔': `# 積木塔
box w=44 d=44 h=20 z=0 color=red
box w=32 d=32 h=20 z=20 color=blue
box w=22 d=22 h=20 z=40 color=yellow
cylinder r=9 h=16 z=60 color=green`,
};

/* ---- three.js 場景 ---- */
const canvas = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color('#F1F5F9');

const camera = new THREE.PerspectiveCamera(45, 1, 1, 2000);

scene.add(new THREE.AmbientLight(0xffffff, 0.65));
const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(80, 140, 100);
scene.add(dir);
const dir2 = new THREE.DirectionalLight(0xffffff, 0.35);
dir2.position.set(-90, 40, -70);
scene.add(dir2);

const grid = new THREE.GridHelper(200, 20, 0x94a3b8, 0xcbd5e1);
scene.add(grid);

const modelGroup = new THREE.Group();
scene.add(modelGroup);

/* ---- 相機軌道控制 ---- */
const target = new THREE.Vector3(0, 28, 0);
let az = 0.8, pol = 1.05, rad = 200;
function updateCam() {
  camera.position.set(
    target.x + rad * Math.sin(pol) * Math.sin(az),
    target.y + rad * Math.cos(pol),
    target.z + rad * Math.sin(pol) * Math.cos(az)
  );
  camera.lookAt(target);
}
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);

let dragging = false, lx = 0, ly = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lx = e.clientX; ly = e.clientY; });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', e => {
  if (!dragging) return;
  az -= (e.clientX - lx) * 0.01;
  pol = Math.min(1.45, Math.max(0.2, pol - (e.clientY - ly) * 0.01));
  lx = e.clientX; ly = e.clientY;
  updateCam();
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  rad = Math.min(500, Math.max(70, rad * (1 + e.deltaY * 0.0012)));
  updateCam();
}, { passive: false });

(function loop() {
  requestAnimationFrame(loop);
  renderer.render(scene, camera);
})();

/* ---- 程式碼解析與建模 ---- */
function parseLine(line) {
  const clean = line.split('#')[0].trim();
  if (!clean) return null;
  const tokens = clean.split(/\s+/);
  const shape = tokens[0].toLowerCase();
  const p = { x: 0, y: 0, z: 0, color: 'blue' };
  for (let i = 1; i < tokens.length; i++) {
    const m = tokens[i].match(/^([a-zA-Z]+)=(.+)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    p[key] = (key === 'color') ? m[2].toLowerCase() : parseFloat(m[2]);
  }
  return { shape, p };
}

function buildModel() {
  modelGroup.clear();
  const code = document.getElementById('codeEditor').value;
  const lines = code.split('\n');
  let count = 0;
  const errors = [];

  lines.forEach((line, idx) => {
    const parsed = parseLine(line);
    if (!parsed) return;
    const { shape, p } = parsed;
    let geo;
    try {
      if (shape === 'box') geo = new THREE.BoxGeometry(p.w || 20, p.h || 20, p.d || 20);
      else if (shape === 'cylinder') geo = new THREE.CylinderGeometry(p.r || 10, p.r || 10, p.h || 20, 40);
      else if (shape === 'sphere') geo = new THREE.SphereGeometry(p.r || 12, 36, 24);
      else if (shape === 'cone') geo = new THREE.ConeGeometry(p.r || 12, p.h || 24, 40);
      else { errors.push(`第 ${idx + 1} 行:不認識的零件「${shape}」`); return; }
    } catch (e) { errors.push(`第 ${idx + 1} 行:參數有誤`); return; }

    const colHex = COLORS[p.color] || COLORS.blue;
    const mat = new THREE.MeshLambertMaterial({ color: colHex });
    const mesh = new THREE.Mesh(geo, mat);
    /* z 為零件底部離地高度 → 換算成 three.js 的 Y（向上）*/
    let halfH;
    if (shape === 'sphere') halfH = (p.r || 12);
    else if (shape === 'box') halfH = (p.h || 20) / 2;
    else halfH = (p.h || 20) / 2;
    mesh.position.set(p.x || 0, (p.z || 0) + halfH, -(p.y || 0));
    /* 加描邊 */
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.25 })
    );
    edges.position.copy(mesh.position);
    modelGroup.add(mesh);
    modelGroup.add(edges);
    count++;
  });

  const msg = document.getElementById('modelMsg');
  if (errors.length) {
    msg.innerHTML = `<span style="color:var(--danger)">⚠ ${errors.join('；')}</span>`;
    if (typeof SoundFX !== 'undefined') SoundFX.error();
  } else if (count === 0) {
    msg.innerHTML = `<span style="color:var(--text-muted)">沒有偵測到零件,請至少寫一行。</span>`;
  } else {
    msg.innerHTML = `<span style="color:var(--success);font-weight:700">✓ 建模成功!共 ${count} 個零件。</span>`;
    if (typeof SoundFX !== 'undefined') SoundFX.success();
  }
  if (count >= 3 && !Progress.isDone('ch2-modeling')) {
    celebrateModule('ch2-modeling', '程式化 CAD 建模器');
    document.getElementById('nextBtn').classList.add('pop-in');
    msg.innerHTML += ' 🎉 完成挑戰（3 個以上零件)!';
  }
  return count;
}

/* ---- 範例按鈕 ---- */
(function buildExamples() {
  const wrap = document.getElementById('exBtns');
  Object.keys(EXAMPLES).forEach(name => {
    const b = document.createElement('button');
    b.className = 'btn btn-ghost btn-sm';
    b.textContent = name;
    b.addEventListener('click', () => {
      document.getElementById('codeEditor').value = EXAMPLES[name];
      buildModel();
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
    wrap.appendChild(b);
  });
})();

document.getElementById('runBtn').addEventListener('click', buildModel);

/* ---- 初始化 ---- */
document.getElementById('codeEditor').value = EXAMPLES['🪑 桌子'];
resize();
updateCam();
buildModel();
setTimeout(resize, 60);
