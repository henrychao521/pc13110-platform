/* ============================================================
 * 邏輯與感應電路 — AND/OR 邏輯實驗 + 光感應路燈 + 檢核
 * ============================================================ */

/* ---- AND / OR 邏輯實驗 ---- */
let s1 = false, s2 = false, mode = 'and';

function logicResult(a, b) { return mode === 'and' ? (a && b) : (a || b); }

function renderLogic() {
  document.getElementById('sw1').classList.toggle('on', s1);
  document.getElementById('sw2').classList.toggle('on', s2);
  const lit = logicResult(s1, s2);
  document.getElementById('led').classList.toggle('lit', lit);
  /* 真值表 */
  const rows = [[0,0],[0,1],[1,0],[1,1]];
  const tbl = document.getElementById('truthTable');
  tbl.innerHTML = `<tr><th>S₁</th><th>S₂</th><th>LED(${mode === 'and' ? 'AND' : 'OR'})</th></tr>` +
    rows.map(([a, b]) => {
      const out = mode === 'and' ? (a && b) : (a || b);
      const cur = (a === (s1 ? 1 : 0) && b === (s2 ? 1 : 0));
      return `<tr class="${cur ? 'cur' : ''}"><td>${a}</td><td>${b}</td><td>${out ? '🟡 亮' : '⚫ 滅'}</td></tr>`;
    }).join('');
}
document.getElementById('sw1').addEventListener('click', () => { s1 = !s1; SoundFX && SoundFX.click(); renderLogic(); });
document.getElementById('sw2').addEventListener('click', () => { s2 = !s2; SoundFX && SoundFX.click(); renderLogic(); });
document.querySelectorAll('.logicmode').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.logicmode').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    mode = btn.dataset.mode;
    SoundFX && SoundFX.click();
    renderLogic();
  });
});
renderLogic();

/* ---- 光感應路燈 ---- */
let bright = 80;
const sky = document.getElementById('skyCanvas');
const VCC = 5, R1 = 10;          /* 固定電阻 10 kΩ */
const THRESHOLD = 2.5;           /* 分壓點電壓門檻 */

function drawSky() {
  const dpr = window.devicePixelRatio || 1;
  const w = sky.clientWidth, h = 240;
  sky.width = w * dpr; sky.height = h * dpr;
  const ctx = sky.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  /* 光敏電阻阻值:亮 → 低、暗 → 高(kΩ) */
  const Rcds = 1 + (100 - bright) * (100 - bright) / 100;
  const Vo = VCC * Rcds / (R1 + Rcds);     /* 分壓點電壓(取 CdS 端) */
  const lampOn = Vo > THRESHOLD;

  /* 天空漸層 */
  const t = bright / 100;
  const grd = ctx.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, `rgb(${15+t*120|0},${20+t*150|0},${40+t*160|0})`);
  grd.addColorStop(1, `rgb(${30+t*150|0},${35+t*150|0},${55+t*120|0})`);
  ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);

  /* 太陽 / 月亮 */
  const cx = w * 0.78, cy = h * 0.28;
  if (bright > 45) { ctx.fillStyle = '#FDB813'; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.fill(); }
  else { ctx.fillStyle = '#E8E8F0'; ctx.beginPath(); ctx.arc(cx, cy, 18, 0, 7); ctx.fill();
    /* 星星 */ ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let i = 0; i < 12; i++) ctx.fillRect((i*73%w), (i*51%(h*0.6)), 2, 2); }

  /* 地面 */
  ctx.fillStyle = '#2d3b2d'; ctx.fillRect(0, h - 40, w, 40);

  /* 路燈 */
  const px = w * 0.26, baseY = h - 40;
  ctx.strokeStyle = '#555'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(px, baseY); ctx.lineTo(px, baseY - 120); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px, baseY - 120); ctx.lineTo(px + 36, baseY - 120); ctx.stroke();
  /* 燈頭 */
  const lx = px + 36, ly = baseY - 116;
  if (lampOn) {
    const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, 70);
    g.addColorStop(0, 'rgba(255,235,150,.95)'); g.addColorStop(1, 'rgba(255,235,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 70, 0, 7); ctx.fill();
  }
  ctx.fillStyle = lampOn ? '#FCD34D' : '#5a5a4a';
  ctx.beginPath(); ctx.arc(lx, ly, 9, 0, 7); ctx.fill();

  return { Rcds, Vo, lampOn };
}

function refreshLight() {
  const r = drawSky();
  const label = bright > 66 ? '白天' : bright > 33 ? '黃昏' : '夜晚';
  document.getElementById('brightVal').textContent = label;
  document.getElementById('lightStat').innerHTML = `
    光敏電阻阻值:<b style="font-family:var(--font-mono)">${r.Rcds.toFixed(1)} kΩ</b>
    （${bright > 50 ? '光亮→阻值低' : '昏暗→阻值高'})<br>
    分壓點電壓 V<sub>o</sub>:<b style="font-family:var(--font-mono)">${r.Vo.toFixed(2)} V</b>
    　(門檻 ${THRESHOLD} V)<br>
    <strong style="color:${r.lampOn ? 'var(--warning)' : 'var(--text-muted)'}">
      路燈狀態:${r.lampOn ? '💡 自動點亮(天色已暗,V_o 超過門檻)' : '⚫ 熄滅(天色仍亮,V_o 未達門檻)'}</strong>`;
}
document.getElementById('brightSlider').addEventListener('input', e => { bright = +e.target.value; refreshLight(); });
window.addEventListener('resize', refreshLight);
refreshLight();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '把兩個開關「串聯」在電路中,形成的是哪一種邏輯?',
    options: [
      { text: 'AND 邏輯——兩個開關都導通,LED 才會亮', correct: true,
        explain: '正確。串聯需要每個開關都通,屬於 AND(及)邏輯。' },
      { text: 'OR 邏輯', correct: false },
      { text: '兩者都不是', correct: false },
    ] },
  { question: '光敏電阻(CdS)的特性是什麼?',
    options: [
      { text: '阻值固定不變', correct: false },
      { text: '阻值會隨光線變化:光亮時阻值低、昏暗時阻值高', correct: true,
        explain: '正確。CdS 的阻值隨環境光改變,是光感應電路的核心元件。' },
      { text: '光線越亮阻值越高', correct: false },
    ] },
  { question: '光敏電阻本身不會輸出電壓訊號,要怎麼把它的阻值變化變成電壓變化?',
    options: [
      { text: '搭配一顆固定電阻組成「分壓電路」,量測分壓點的電壓', correct: true,
        explain: '正確。分壓電路是把感測器的「阻值變化」轉成「電壓變化」的標準做法。' },
      { text: '直接用三用電表測光線', correct: false },
      { text: '把光敏電阻加熱', correct: false },
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
        celebrateModule('ch4-logic', '邏輯與感應電路');
        showToast('🎉 恭喜!你已完成第 4 章所有模組', 'success');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
