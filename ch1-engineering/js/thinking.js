/* ============================================================
 * 創意思考工具箱 — 六頂思考帽 / SCAMPER / 曼陀羅九宮格
 * 內容自動儲存於 localStorage
 * ============================================================ */

const STORE_KEY = 'pc13110_ch1_thinking';
const NEED = 6;

const HATS = [
  { id: 'white',  name: '白帽　客觀事實', q: '關於這個主題,我們已知哪些事實與數據?', bg: '#475569' },
  { id: 'red',    name: '紅帽　情感直覺', q: '對這個方案,我的第一直覺與感受是什麼?', bg: '#DC2626' },
  { id: 'black',  name: '黑帽　謹慎風險', q: '這個想法可能有什麼缺點、風險或困難?', bg: '#1F2937' },
  { id: 'yellow', name: '黃帽　樂觀價值', q: '這個想法有什麼好處、價值與可行性?', bg: '#D97706' },
  { id: 'green',  name: '綠帽　創意替代', q: '有沒有更多新點子、或完全不同的替代方案?', bg: '#16A34A' },
  { id: 'blue',   name: '藍帽　管理總結', q: '整體思考的流程與結論是什麼?下一步要做什麼?', bg: '#2563EB' },
];

const SCAMPER = [
  { id: 's', L: 'S', name: '替代 Substitute',    q: '可以用什麼材料、元件或方法,來「替代」原本的?', bg: '#DC2626' },
  { id: 'c', L: 'C', name: '結合 Combine',       q: '可以把哪些功能或物件「結合」在一起?', bg: '#D97706' },
  { id: 'a', L: 'A', name: '調整 Adapt',         q: '有沒有別的東西的點子,可以「借用、調整」過來用?', bg: '#16A34A' },
  { id: 'm', L: 'M', name: '修改 Modify',        q: '可以把它放大、縮小、改變形狀或顏色嗎?', bg: '#0891B2' },
  { id: 'p', L: 'P', name: '其他用途 Put to use', q: '它還能拿來做什麼別的、原本沒想到的用途?', bg: '#2563EB' },
  { id: 'e', L: 'E', name: '消除 Eliminate',     q: '可以「拿掉」哪個部分,讓它更簡單、更便宜?', bg: '#7C3AED' },
  { id: 'r', L: 'R', name: '重組 Rearrange',     q: '可以把順序、結構或流程「重新排列、顛倒」嗎?', bg: '#C026D3' },
];

/* 曼陀羅 8 個外格的引導提示 */
const MANDALA = [
  '使用者是誰?', '要解決什麼痛點?', '需要哪些功能?',
  '用什麼材料/元件?', '〈核心主題〉', '可能的造型外觀?',
  '成本與限制?', '怎麼測試效果?', '如何更省電/環保?',
];

/* ---- 狀態 ---- */
let state = { topic: '', hats: {}, scamper: {}, mandala: {} };
try { state = Object.assign(state, JSON.parse(localStorage.getItem(STORE_KEY)) || {}); } catch (e) {}

function persist() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); refreshCount(); }

/* ---- 主題輸入 ---- */
const topicInput = document.getElementById('topicInput');
const topicEcho = document.getElementById('topicEcho');
topicInput.value = state.topic || '';
function echoTopic() {
  topicEcho.textContent = state.topic ? '目前主題：' + state.topic : '';
  const c = document.querySelector('.mandala-center textarea');
  if (c) c.value = state.topic || '';
}
topicInput.addEventListener('input', () => { state.topic = topicInput.value.trim(); persist(); echoTopic(); });

/* ---- 六頂思考帽 ---- */
(function buildHats() {
  const grid = document.getElementById('hatsGrid');
  HATS.forEach(h => {
    const card = document.createElement('div');
    card.className = 'hat-card think-cell';
    card.style.borderColor = h.bg + '55';
    card.innerHTML = `
      <div class="hat-head" style="background:${h.bg}">
        <span style="font-size:18px">🎩</span>
        <div><div style="font-weight:800;font-size:13.5px">${h.name}</div>
        <div class="hat-q">${h.q}</div></div>
      </div>
      <div class="hat-body"><textarea placeholder="寫下你的想法…">${state.hats[h.id] || ''}</textarea></div>`;
    const ta = card.querySelector('textarea');
    ta.addEventListener('input', () => { state.hats[h.id] = ta.value; persist(); });
    grid.appendChild(card);
  });
})();

/* ---- SCAMPER ---- */
(function buildScamper() {
  const list = document.getElementById('scamperList');
  SCAMPER.forEach(s => {
    const row = document.createElement('div');
    row.className = 'scamper-row think-cell';
    row.innerHTML = `
      <div class="scamper-letter" style="background:${s.bg}">${s.L}</div>
      <div style="flex:1">
        <div style="font-weight:800;font-size:14px">${s.name}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${s.q}</div>
        <textarea placeholder="寫下你的想法…">${state.scamper[s.id] || ''}</textarea>
      </div>`;
    const ta = row.querySelector('textarea');
    ta.addEventListener('input', () => { state.scamper[s.id] = ta.value; persist(); });
    list.appendChild(row);
  });
})();

/* ---- 曼陀羅九宮格 ---- */
(function buildMandala() {
  const grid = document.getElementById('mandalaGrid');
  MANDALA.forEach((hint, i) => {
    const cell = document.createElement('div');
    if (i === 4) {
      cell.className = 'mandala-cell mandala-center';
      cell.innerHTML = `<div style="font-size:11px;opacity:.8;margin-bottom:4px">核心主題</div>
        <textarea readonly placeholder="先在上方輸入主題">${state.topic || ''}</textarea>`;
    } else {
      cell.className = 'mandala-cell think-cell';
      cell.innerHTML = `<div class="mc-n">${hint}</div>
        <textarea style="flex:1" placeholder="…">${state.mandala['m' + i] || ''}</textarea>`;
      const ta = cell.querySelector('textarea');
      ta.addEventListener('input', () => { state.mandala['m' + i] = ta.value; persist(); });
    }
    grid.appendChild(cell);
  });
})();

/* ---- 分頁切換 ---- */
document.querySelectorAll('#thinkTabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#thinkTabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (typeof SoundFX !== 'undefined') SoundFX.click();
  });
});

/* ---- 完成度 ---- */
function countFilled() {
  let n = 0;
  Object.values(state.hats).forEach(v => { if (v && v.trim()) n++; });
  Object.values(state.scamper).forEach(v => { if (v && v.trim()) n++; });
  Object.values(state.mandala).forEach(v => { if (v && v.trim()) n++; });
  return n;
}
function refreshCount() {
  const n = countFilled();
  document.getElementById('filledCount').textContent = n;
  const ok = n >= NEED && !!state.topic;
  document.getElementById('doneBtn').disabled = !ok;
}
document.getElementById('needCount').textContent = NEED;

document.getElementById('doneBtn').addEventListener('click', () => {
  celebrateModule('ch1-thinking', '創意思考工具箱');
  document.getElementById('doneBtn').textContent = '✓ 已完成';
  document.getElementById('doneBtn').disabled = true;
  document.getElementById('nextBtn').classList.add('pop-in');
});

document.getElementById('printBtn').addEventListener('click', () => {
  // 列印時三套工具全部展開，印完還原原本的分頁狀態
  const activePanel = document.querySelector('.tab-panel.active');
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('active'));
  window.print();
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p === activePanel));
});

echoTopic();
refreshCount();
