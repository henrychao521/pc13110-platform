/* ============================================================
 * 像素大廳 — 關卡式入口
 * 讀取 main.js 的 Progress / CHAPTER_INFO / CHAPTER_MAP,
 * 把五章渲染成像素風關卡卡片。
 * ============================================================ */

const STAGES = [
  { id: 'ch1', icon: '🚀', en: 'TECH & ENGINEERING', color: 'var(--c1)' },
  { id: 'ch2', icon: '🖨️', en: 'DIGITAL FABRICATION', color: 'var(--c2)' },
  { id: 'ch3', icon: '⚙️', en: 'MECHANISM & STRUCTURE', color: 'var(--c3)' },
  { id: 'ch4', icon: '⚡', en: 'DAILY ELECTRICITY', color: 'var(--c4)' },
  { id: 'ch5', icon: '🤖', en: 'MECHATRONICS', color: 'var(--c5)' },
];

function rankOf(pct) {
  if (pct >= 100) return '⭐ 工程大師';
  if (pct >= 75) return '資深工程師';
  if (pct >= 50) return '工程師';
  if (pct >= 25) return '見習工程師';
  if (pct > 0) return '新手見習生';
  return '尚未啟程';
}

/* ---- XP 進度列 ---- */
(function renderXP() {
  const pct = Progress.overallPercent();
  document.getElementById('xpPct').textContent = pct + '%';
  document.getElementById('xpRank').textContent = 'RANK ─ ' + rankOf(pct);
  const track = document.getElementById('xpTrack');
  const cells = 20;
  const on = Math.round(pct / 100 * cells);
  for (let i = 0; i < cells; i++) {
    const c = document.createElement('div');
    c.className = 'px-xp-cell' + (i < on ? ' on' : '');
    track.appendChild(c);
  }
})();

/* ---- 關卡卡片 ---- */
(function renderStages() {
  const grid = document.getElementById('stageGrid');
  const prog = Progress.load();

  STAGES.forEach((s, idx) => {
    const info = CHAPTER_INFO[s.id];
    const mods = CHAPTER_MAP[s.id] || [];
    const done = mods.filter(m => prog.done[m]).length;
    const total = mods.length;
    const cleared = total > 0 && done === total;

    const pips = mods.map((m, i) =>
      `<span class="px-pip${prog.done[m] ? ' on' : ''}"></span>`).join('');

    const card = document.createElement('div');
    card.className = 'px-stage';
    card.innerHTML = `
      <div class="px-stage-top" style="background:${s.color}">
        <span class="px-stage-no mono">STAGE ${idx + 1}</span>
        ${cleared ? '<span class="px-stage-clear mono">✓ CLEAR</span>' : ''}
      </div>
      <div class="px-screen" style="background-color:${s.color}">
        <span class="ico">${s.icon}</span>
      </div>
      <div class="px-stage-body">
        <div class="px-stage-en mono">${s.en}</div>
        <div class="px-stage-name">${info.name}</div>
        <div class="px-pips">${pips}</div>
        <div class="px-stage-meta">${done} / ${total} 模組完成</div>
        <div class="px-enter" style="background:${s.color}">▶ ENTER</div>
      </div>`;

    card.addEventListener('click', () => {
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      window.location.href = info.hub;
    });
    grid.appendChild(card);
  });
})();
