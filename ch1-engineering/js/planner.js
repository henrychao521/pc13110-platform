/* ============================================================
 * 專題規劃器 — jsMind 心智圖 + Frappe Gantt 甘特圖
 * ============================================================ */

const MIND_KEY  = 'pc13110_ch1_mind';
const GANTT_KEY = 'pc13110_ch1_gantt';
let interacted = false;

function markInteracted() {
  if (interacted) return;
  interacted = true;
  document.getElementById('doneBtn').disabled = false;
}

/* ---- 預設心智圖 ---- */
function defaultMind() {
  return {
    meta: { name: 'pc13110-project', author: 'student', version: '1.0' },
    format: 'node_tree',
    data: {
      id: 'root', topic: '我的工程專題',
      children: [
        { id: 'b1', topic: '🎯 界定問題', direction: 'left', children: [
          { id: 'b1a', topic: '使用者是誰?' }, { id: 'b1b', topic: '限制條件（成本/尺寸）' } ] },
        { id: 'b2', topic: '🔍 研究調查', direction: 'right', children: [
          { id: 'b2a', topic: '既有方案有哪些?' }, { id: 'b2b', topic: '需要的背景知識' } ] },
        { id: 'b3', topic: '💡 構思設計', direction: 'left', children: [
          { id: 'b3a', topic: '創意發想' }, { id: 'b3b', topic: 'CAD 草圖' } ] },
        { id: 'b4', topic: '🔧 製作原型', direction: 'right', children: [
          { id: 'b4a', topic: '材料與元件' }, { id: 'b4b', topic: '加工方式' } ] },
        { id: 'b5', topic: '📊 測試改進', direction: 'left', children: [
          { id: 'b5a', topic: '測試方法' }, { id: 'b5b', topic: '改進記錄' } ] },
      ],
    },
  };
}

/* ---- 初始化 jsMind ---- */
let jm;
function initMind() {
  let data;
  try { data = JSON.parse(localStorage.getItem(MIND_KEY)); } catch (e) {}
  if (!data) data = defaultMind();
  document.getElementById('jsmindBox').innerHTML = '';
  jm = new jsMind({
    container: 'jsmindBox',
    editable: true,
    theme: 'primary',
    view: { engine: 'svg', hmargin: 60, vmargin: 40, line_width: 2, line_color: '#94A3B8' },
  });
  jm.show(data);
  jm.add_event_listener((type) => {
    /* type 3 = edit：節點新增/刪除/改名 */
    if (type === 3 || type === jsMind.event_type.edit) {
      try { localStorage.setItem(MIND_KEY, JSON.stringify(jm.get_data('node_tree'))); } catch (e) {}
      markInteracted();
    }
  });
}
initMind();

let nodeSeq = 100;
function newId() { return 'n' + (nodeSeq++) + Date.now().toString(36).slice(-3); }

document.getElementById('mAddChild').addEventListener('click', () => {
  const sel = jm.get_selected_node();
  if (!sel) { showToast('請先點選一個節點', 'warning'); return; }
  const node = jm.add_node(sel, newId(), '新項目');
  if (node) { jm.select_node(node); jm.begin_edit(node); }
  SoundFX && SoundFX.click();
});
document.getElementById('mAddSib').addEventListener('click', () => {
  const sel = jm.get_selected_node();
  if (!sel || !sel.parent) { showToast('請先選一個非中心的節點', 'warning'); return; }
  const node = jm.add_node(sel.parent, newId(), '新項目');
  if (node) { jm.select_node(node); jm.begin_edit(node); }
  SoundFX && SoundFX.click();
});
document.getElementById('mEdit').addEventListener('click', () => {
  const sel = jm.get_selected_node();
  if (!sel) { showToast('請先點選一個節點', 'warning'); return; }
  jm.begin_edit(sel);
});
document.getElementById('mDel').addEventListener('click', () => {
  const sel = jm.get_selected_node();
  if (!sel) { showToast('請先點選一個節點', 'warning'); return; }
  if (sel.id === 'root') { showToast('中心主題不能刪除', 'danger'); return; }
  jm.remove_node(sel);
  SoundFX && SoundFX.click();
});
document.getElementById('mReset').addEventListener('click', () => {
  if (!confirm('重設為範例心智圖?目前的編輯會消失。')) return;
  localStorage.removeItem(MIND_KEY);
  initMind();
});

/* ============================================================
 * Frappe Gantt 甘特圖
 * ============================================================ */
function addDays(base, n) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function defaultTasks() {
  const t0 = new Date();
  return [
    { id: 't1', name: '界定問題與背景調查', start: addDays(t0, 0),  end: addDays(t0, 5),  progress: 20 },
    { id: 't2', name: '創意構思與選擇方案', start: addDays(t0, 5),  end: addDays(t0, 9),  progress: 0, dependencies: 't1' },
    { id: 't3', name: 'CAD 設計與建模',     start: addDays(t0, 9),  end: addDays(t0, 18), progress: 0, dependencies: 't2' },
    { id: 't4', name: '製作與組裝原型',     start: addDays(t0, 18), end: addDays(t0, 30), progress: 0, dependencies: 't3' },
    { id: 't5', name: '測試與評估',         start: addDays(t0, 30), end: addDays(t0, 37), progress: 0, dependencies: 't4' },
    { id: 't6', name: '改進設計與成果發表', start: addDays(t0, 37), end: addDays(t0, 44), progress: 0, dependencies: 't5' },
  ];
}
function loadTasks() {
  try {
    const t = JSON.parse(localStorage.getItem(GANTT_KEY));
    if (t && t.length) return t;
  } catch (e) {}
  return defaultTasks();
}
function saveTasks(tasks) {
  try { localStorage.setItem(GANTT_KEY, JSON.stringify(tasks)); } catch (e) {}
}

let gantt, ganttTasks = loadTasks(), currentView = 'Day';
function renderGantt() {
  document.getElementById('ganttBox').innerHTML = '';
  gantt = new Gantt('#ganttBox', ganttTasks, {
    view_mode: currentView,
    readonly_progress: false,
    on_date_change: (task, start, end) => {
      const t = ganttTasks.find(x => x.id === task.id);
      if (t) { t.start = (start.toISOString ? start.toISOString() : start).slice(0, 10);
               t.end = (end.toISOString ? end.toISOString() : end).slice(0, 10); }
      saveTasks(ganttTasks); markInteracted();
      showToast('已更新「' + task.name + '」時程', 'success');
    },
    on_progress_change: (task, progress) => {
      const t = ganttTasks.find(x => x.id === task.id);
      if (t) t.progress = progress;
      saveTasks(ganttTasks); markInteracted();
    },
  });
}
renderGantt();

document.querySelectorAll('.gv').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.gv').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentView = btn.dataset.view;
    if (gantt && gantt.change_view_mode) gantt.change_view_mode(currentView);
    else renderGantt();
    SoundFX && SoundFX.click();
  });
});
document.getElementById('gReset').addEventListener('click', () => {
  if (!confirm('重設為範例時程?')) return;
  localStorage.removeItem(GANTT_KEY);
  ganttTasks = defaultTasks();
  renderGantt();
});

/* ---- 分頁切換 ---- */
document.querySelectorAll('#planTabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#planTabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    SoundFX && SoundFX.click();
    if (tab.dataset.tab === 'gantt') setTimeout(renderGantt, 30);
  });
});

/* ---- 完成 ---- */
document.getElementById('doneBtn').addEventListener('click', () => {
  celebrateModule('ch1-planner', '專題規劃器');
  const b = document.getElementById('doneBtn');
  b.textContent = '✓ 已完成'; b.disabled = true;
  document.getElementById('nextBtn').classList.add('pop-in');
});
