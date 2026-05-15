/* ============================================================
 * PC13110 工程設計學習平台 — 共用核心
 * 進度儲存(localStorage)、Toast、章節進度計算、頁尾注入
 * ============================================================ */

const PROGRESS_KEY = 'pc13110_progress_v1';

/* 平台地圖：每章的模組 ID 清單(供進度百分比計算用) */
const CHAPTER_MAP = {
  ch1: ['ch1-trends', 'ch1-process', 'ch1-thinking', 'ch1-planner', 'ch1-career'],
  ch2: ['ch2-cad', 'ch2-prototype', 'ch2-modeling', 'ch2-ortho', 'ch2-print3d',
        'ch2-laser', 'ch2-cnc', 'ch2-emerging', 'ch2-sim'],
  ch3: [],
  ch4: [],
  ch5: [],
};

const Progress = (() => {
  function load() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { done: {}, scores: {} };
    } catch (e) {
      return { done: {}, scores: {} };
    }
  }
  function save(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  }
  return {
    load, save,
    /* 標記某模組完成；可附帶分數(0~100) */
    mark(id, score) {
      const p = load();
      p.done[id] = true;
      if (typeof score === 'number') p.scores[id] = Math.max(p.scores[id] || 0, score);
      save(p);
    },
    isDone(id) { return !!load().done[id]; },
    score(id) { return load().scores[id] || 0; },
    /* 回傳某章完成百分比 0~100 */
    chapterPercent(chapterId) {
      const ids = CHAPTER_MAP[chapterId] || [];
      if (!ids.length) return 0;
      const p = load();
      const done = ids.filter(id => p.done[id]).length;
      return Math.round(done / ids.length * 100);
    },
    /* 全平台完成百分比 */
    overallPercent() {
      const all = Object.values(CHAPTER_MAP).flat();
      if (!all.length) return 0;
      const p = load();
      return Math.round(all.filter(id => p.done[id]).length / all.length * 100);
    },
    reset() { localStorage.removeItem(PROGRESS_KEY); },
  };
})();

/* ---- Toast 浮動提示 ---- */
function showToast(msg, type = '') {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.className = 'toast show ' + type;
  t.textContent = msg;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.className = 'toast ' + type; }, 2400);
}

/* ---- 計算回到 repo 根目錄的相對前綴 ---- */
function rootPrefix() {
  let depth = 0;
  if (location.pathname.includes('/pages/')) depth++;
  if (/\/ch[1-5]-[a-z]+\//.test(location.pathname)) depth++;
  return '../'.repeat(depth);
}

/* ---- 自動注入頁尾 ---- */
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('footer')) {
    const footer = document.createElement('footer');
    footer.innerHTML = `
      <p>© 趙珩宇老師製作・PC13110 工程設計學習平台</p>
      <p class="footer-note">
        對應普通型高級中等學校「生活科技」教科書（PC13110，趙珩宇 編）。
        本平台整合多項開源專案，授權詳見各模組標註。
      </p>`;
    document.body.appendChild(footer);
  }
});

/* ---- 完成模組的共用慶祝流程 ---- */
function celebrateModule(id, label, score) {
  Progress.mark(id, score);
  if (typeof SoundFX !== 'undefined') SoundFX.win();
  showToast(`✓ 完成「${label}」` + (typeof score === 'number' ? `（${score} 分）` : ''), 'success');
}
