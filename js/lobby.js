/* ============================================================
 * 工程實驗室 — 角色建立 + 可走動世界(第一階段:單人版)
 * 架構預留多人:玩家狀態集中在 me / players,日後接 WebSocket
 * 即可同步遠端玩家。需要 main.js 的 CHAPTER_INFO/CHAPTER_MAP/Progress。
 * ============================================================ */

/* ---------- 玩家資料 ---------- */
const PLAYER_KEY = 'pc13110_player_v1';
const OPT = {
  skin:  ['#f6cda0', '#e8b07e', '#c9895a', '#8a5a36'],
  hair:  ['#2b2119', '#5b3a1c', '#caa248', '#9a9aa8', '#b8452f'],
  shirt: ['#4f8cff', '#2dd4a7', '#e879f9', '#ff6b6b', '#ffd34e', '#eef0f8'],
  hairStyle: ['短髮', '包頭', '刺蝟', '長髮'],
  acc:   ['無配件', '鴨舌帽', '眼鏡', '工程安全帽'],
};
function defaultPlayer() { return { name: '', skin: 0, hair: 0, shirt: 0, hairStyle: 0, acc: 0, room: '' }; }
function urlRoom() {
  return (new URLSearchParams(location.search).get('room') || '')
    .toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
}
function loadPlayer() {
  try { const p = JSON.parse(localStorage.getItem(PLAYER_KEY)); return (p && p.name) ? p : null; }
  catch (e) { return null; }
}
function savePlayer(p) { localStorage.setItem(PLAYER_KEY, JSON.stringify(p)); }

/* ---------- 程序化像素小人 ----------
 * 12 寬 × 16 高的像素角色。cx=中心X, by=底部Y, u=像素單位
 * f: 0=站立, 1/2=走路兩幀(左右腳交替)
 */
function drawChar(ctx, cx, by, u, pl, f) {
  const ox = Math.round(cx - 6 * u), oy = Math.round(by - 16 * u);
  const R = (c, r, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(ox + c * u, oy + r * u, w * u, h * u); };
  const skin = OPT.skin[pl.skin], hair = OPT.hair[pl.hair], shirt = OPT.shirt[pl.shirt];
  const pants = '#33314f', shoe = '#1c1b30';

  /* 影子 */
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(cx, by - u * 0.4, 5.4 * u, 1.7 * u, 0, 0, 7); ctx.fill();

  /* 腿 + 鞋(走路交替抬腳) */
  const leg = (c, h) => { R(c, 13, 2, h - 1, pants); R(c, 13 + h - 1, 2, 1, shoe); };
  leg(4, f === 1 ? 2 : 3);
  leg(6, f === 2 ? 2 : 3);

  /* 身體(上衣)+ 手臂 */
  R(3, 8, 6, 5, shirt);
  R(2, 8, 1, 3, shirt); R(2, 11, 1, 1, skin);
  R(9, 8, 1, 3, shirt); R(9, 11, 1, 1, skin);

  /* 頭 + 眼睛 */
  R(3, 2, 6, 6, skin);
  R(4, 5, 1, 1, '#23223a'); R(7, 5, 1, 1, '#23223a');

  /* 髮型 */
  if (pl.hairStyle === 0) {                    /* 短髮 */
    R(3, 1, 6, 2, hair); R(3, 3, 1, 2, hair); R(8, 3, 1, 2, hair);
  } else if (pl.hairStyle === 1) {             /* 包頭 */
    R(3, 1, 6, 2, hair); R(3, 3, 1, 1, hair); R(8, 3, 1, 1, hair);
    R(5, -1, 2, 2, hair);
  } else if (pl.hairStyle === 2) {             /* 刺蝟 */
    R(3, 1, 6, 2, hair);
    R(3, -1, 1, 2, hair); R(5, -1, 1, 2, hair); R(7, -1, 1, 2, hair);
    R(3, 3, 1, 2, hair); R(8, 3, 1, 2, hair);
  } else {                                     /* 長髮 */
    R(3, 1, 6, 2, hair); R(2, 3, 1, 6, hair); R(9, 3, 1, 6, hair);
  }

  /* 配件 */
  if (pl.acc === 1) {                          /* 鴨舌帽 */
    R(3, 0, 6, 2, '#d23b4e'); R(1, 2, 4, 1, '#b22f40');
  } else if (pl.acc === 2) {                   /* 眼鏡 */
    R(3, 5, 2, 1, '#23223a'); R(6, 5, 2, 1, '#23223a'); R(5, 5, 1, 1, '#23223a');
  } else if (pl.acc === 3) {                   /* 工程安全帽 */
    R(3, 0, 6, 2, '#ffce3a'); R(2, 2, 8, 1, '#ffce3a'); R(5, -1, 2, 1, '#e6b400');
  }
}

/* ============================================================
 * 角色建立畫面
 * ============================================================ */
let me = loadPlayer() || defaultPlayer();

(function setupCreator() {
  const overlay = document.getElementById('creator');
  const prev = document.getElementById('prevCanvas');
  const pctx = prev.getContext('2d');
  const controls = document.getElementById('crControls');
  const nameInput = document.getElementById('crName');
  const roomInput = document.getElementById('crRoom');
  nameInput.value = me.name || '';
  roomInput.value = urlRoom() || me.room || '';

  const CATS = [
    { key: 'skin', label: '膚色', type: 'color', opts: OPT.skin },
    { key: 'hair', label: '髮色', type: 'color', opts: OPT.hair },
    { key: 'hairStyle', label: '髮型', type: 'text', opts: OPT.hairStyle },
    { key: 'shirt', label: '上衣', type: 'color', opts: OPT.shirt },
    { key: 'acc', label: '配件', type: 'text', opts: OPT.acc },
  ];

  function renderControls() {
    controls.innerHTML = '';
    CATS.forEach(cat => {
      const row = document.createElement('div');
      row.className = 'cr-row';
      row.innerHTML = `<div class="cr-label">${cat.label}</div>`;
      const opts = document.createElement('div');
      opts.className = 'cr-opts';
      cat.opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'cr-opt' + (me[cat.key] === i ? ' on' : '') + (cat.type === 'color' ? ' swatch' : '');
        if (cat.type === 'color') b.style.background = o; else b.textContent = o;
        b.addEventListener('click', () => {
          me[cat.key] = i;
          if (typeof SoundFX !== 'undefined') SoundFX.click();
          renderControls();
        });
        opts.appendChild(b);
      });
      row.appendChild(opts);
      controls.appendChild(row);
    });
  }
  renderControls();

  let bob = 0;
  (function previewLoop() {
    bob += 0.08;
    pctx.clearRect(0, 0, prev.width, prev.height);
    const f = Math.floor(bob % 2);
    drawChar(pctx, prev.width / 2, prev.height - 20, 9, me, f);
    requestAnimationFrame(previewLoop);
  })();

  document.getElementById('crStart').addEventListener('click', () => {
    const nm = nameInput.value.trim();
    if (!nm) { nameInput.classList.add('cr-err'); nameInput.focus(); return; }
    me.name = nm.slice(0, 12);
    me.room = roomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
    savePlayer(me);
    if (typeof SoundFX !== 'undefined') SoundFX.win();
    overlay.classList.add('hidden');
    startWorld();
  });
  nameInput.addEventListener('input', () => nameInput.classList.remove('cr-err'));

  /* 重建角色 */
  document.getElementById('rebuildBtn').addEventListener('click', () => {
    me = loadPlayer() || defaultPlayer();
    nameInput.value = me.name || '';
    roomInput.value = urlRoom() || me.room || '';
    renderControls();
    overlay.classList.remove('hidden');
  });
})();

/* ============================================================
 * 可走動世界
 * ============================================================ */
const TILE = 40;
const MAP = [
  '###################',
  '#.................#',
  '#.................#',
  '#.................#',
  '#.................#',
  '#.................#',
  '#.................#',
  '#.................#',
  '#.................#',
  '#.................#',
  '#.................#',
  '#.................#',
  '###################',
];
const COLS = MAP[0].length, ROWS = MAP.length;
const W = COLS * TILE, H = ROWS * TILE;

const STAGE_META = {
  ch1: { icon: '🚀', color: '#4f8cff' },
  ch2: { icon: '🖨️', color: '#2dd4a7' },
  ch3: { icon: '⚙️', color: '#e879f9' },
  ch4: { icon: '⚡', color: '#ff6b6b' },
  ch5: { icon: '🤖', color: '#a98bff' },
};
/* 5 個傳送門(關卡入口),座標為格子中心 */
const PORTALS = [
  { id: 'ch1', col: 4,  row: 3 },
  { id: 'ch2', col: 9,  row: 3 },
  { id: 'ch3', col: 14, row: 3 },
  { id: 'ch4', col: 6,  row: 9 },
  { id: 'ch5', col: 12, row: 9 },
].map(p => ({ ...p, x: (p.col + 0.5) * TILE, y: (p.row + 0.5) * TILE }));

/* ---- 互動實體:NPC 導師與布告欄 ---- */
const ENTITIES = [
  { id: 'npc-chief', kind: 'npc', col: 6, row: 6,
    look: { skin: 1, hair: 0, shirt: 0, hairStyle: 0, acc: 3 },
    name: '實驗室主任', lines: [
      '歡迎來到工程設計實驗室!我是這裡的主任。',
      '這裡有五道傳送門,每一道通往課本的一章。走到門口按 E 就能進入那一關。',
      '完成模組會累積你的「總進度」,也會解鎖成就徽章 —— 點右上角的「🏅 成就」看看吧!',
    ] },
  { id: 'npc-senior', kind: 'npc', col: 13, row: 6,
    look: { skin: 2, hair: 2, shirt: 2, hairStyle: 2, acc: 2 },
    name: '工程師學長', lines: [
      '嗨,學弟妹!不知道從哪開始?我建議照順序從第 1 章走起。',
      '第 1 章會教你「工程設計流程」—— 這是貫穿全部五章的主軸。',
      '記得:工程不是一次到位,測試、修正、再測試,才是真功夫。',
    ] },
  { id: 'npc-maker', kind: 'npc', col: 9, row: 10,
    look: { skin: 0, hair: 4, shirt: 4, hairStyle: 1, acc: 1 },
    name: '創客社同學', lines: [
      '我最愛第 2 章的數位加工!3D 列印、雷射切割超好玩。',
      '想動手做專題的話,第 5 章的機電整合可以讓你的作品「動起來」喔。',
    ] },
  { id: 'board-notice', kind: 'board', col: 2, row: 2,
    name: '實驗室布告欄', lines: [
      '【怎麼移動】方向鍵 / WASD;手機用左下角的虛擬搖桿。',
      '【進入關卡】走到傳送門,按 E 或點「進入」。',
      '【成就徽章】完成模組、走訪傳送門、和 NPC 對話都會解鎖徽章。',
      '【切換介面】右上角可切回經典首頁。',
    ] },
  { id: 'arcade', kind: 'arcade', col: 16, row: 10, name: '遊戲機台' },
].map(e => ({ ...e, x: (e.col + 0.5) * TILE, y: (e.row + 0.5) * TILE }));

/* ---- 成就徽章(條件依進度與探索狀態判定) ---- */
const BADGES = [
  { id: 'arrive',  icon: '🎒', name: '新生報到', desc: '建立角色並進入實驗室',
    check: () => true },
  { id: 'first',   icon: '🚪', name: '初次出發', desc: '完成任一個學習模組',
    check: () => Progress.overallPercent() > 0 },
  { id: 'chat',    icon: '💬', name: '不恥下問', desc: '和實驗室裡的 NPC 對話',
    check: (lab) => Object.keys(lab.talked || {}).length >= 1 },
  { id: 'explore', icon: '🗺️', name: '實驗室探險家', desc: '走訪全部 5 個傳送門',
    check: (lab) => Object.keys(lab.visited || {}).length >= 5 },
  { id: 'chapter', icon: '⭐', name: '章節達人', desc: '完成任一整章的所有模組',
    check: () => ['ch1','ch2','ch3','ch4','ch5'].some(c => Progress.chapterPercent(c) === 100) },
  { id: 'social',  icon: '🌟', name: '萬人迷', desc: '和全部 3 位 NPC 都對話過',
    check: (lab) => ['npc-chief','npc-senior','npc-maker'].every(n => (lab.talked || {})[n]) },
  { id: 'half',    icon: '🔥', name: '勢如破竹', desc: '總進度達到 50%',
    check: () => Progress.overallPercent() >= 50 },
  { id: 'master',  icon: '🏆', name: '工程大師', desc: '完成全部 27 個學習模組',
    check: () => Progress.overallPercent() >= 100 },
];

/* ---- 實驗室探索狀態(localStorage) ---- */
const LAB_KEY = 'pc13110_lab_v1';
function loadLab() {
  try {
    const l = JSON.parse(localStorage.getItem(LAB_KEY)) || {};
    l.visited = l.visited || {}; l.talked = l.talked || {}; l.badges = l.badges || {};
    return l;
  } catch (e) { return { visited: {}, talked: {}, badges: {} }; }
}
function saveLab(l) { localStorage.setItem(LAB_KEY, JSON.stringify(l)); }

let worldStarted = false;
function startWorld() {
  if (worldStarted) return;
  worldStarted = true;

  const cv = document.getElementById('world');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  document.getElementById('hudName').textContent = me.name;
  const pct = Progress.overallPercent();
  document.getElementById('hudPct').textContent = '總進度 ' + pct + '%';

  /* 玩家狀態(多人版:此處會擴成 players[]) */
  const player = { x: 9.5 * TILE, y: 6.5 * TILE, dir: 1, moving: false, walk: 0, walkT: 0,
    chat: '', chatUntil: 0 };

  /* ---- 輸入 ---- */
  const keys = {};
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
    keys[k] = true;
    if (e.repeat) return;                       /* 忽略長按重複,避免對話被重複觸發 */
    if (k === 'e' || k === ' ' || k === 'enter') { if (dialog) advanceDialog(); else tryEnter(); }
    else if (k === 'escape') { if (dialog) closeDialog(); else closeBadgePanel(); }
  });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  /* 虛擬搖桿(觸控,類比方向 + 力度) */
  const joy = { active: false, cx: 0, cy: 0, dx: 0, dy: 0 };
  (function setupJoystick() {
    const base = document.getElementById('joystick');
    const knob = document.getElementById('joyKnob');
    if (!base) return;
    const RAD = 36;
    const pt = e => (e.touches && e.touches[0]) ? e.touches[0] : e;
    function start(e) {
      const r = base.getBoundingClientRect();
      joy.cx = r.left + r.width / 2; joy.cy = r.top + r.height / 2;
      joy.active = true; move(e);
    }
    function move(e) {
      if (!joy.active) return;
      const p = pt(e);
      let dx = p.clientX - joy.cx, dy = p.clientY - joy.cy;
      const d = Math.hypot(dx, dy) || 1;
      if (d > RAD) { dx = dx / d * RAD; dy = dy / d * RAD; }
      joy.dx = dx / RAD; joy.dy = dy / RAD;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
    }
    function end() {
      joy.active = false; joy.dx = 0; joy.dy = 0;
      knob.style.transform = 'translate(0,0)';
    }
    base.addEventListener('touchstart', e => { e.preventDefault(); start(e); }, { passive: false });
    window.addEventListener('touchmove', e => { if (joy.active) { e.preventDefault(); move(e); } }, { passive: false });
    window.addEventListener('touchend', end);
    window.addEventListener('touchcancel', end);
    base.addEventListener('mousedown', e => {
      start(e);
      const mm = ev => move(ev);
      const mu = () => { end(); window.removeEventListener('mousemove', mm); window.removeEventListener('mouseup', mu); };
      window.addEventListener('mousemove', mm); window.addEventListener('mouseup', mu);
    });
  })();
  document.getElementById('actionBtn').addEventListener('click', tryEnter);

  /* ---- 鄰近聊天輸入 ---- */
  const chatInput = document.getElementById('chatInput');
  function sendChat() {
    const text = chatInput.value.trim().slice(0, 60);
    chatInput.value = '';
    chatInput.blur();
    if (!text) return;
    player.chat = text; player.chatUntil = performance.now() + 5500;
    if (net.ws && net.ws.readyState === 1) net.ws.send(JSON.stringify({ t: 'chat', text }));
    if (typeof SoundFX !== 'undefined') SoundFX.click();
  }
  chatInput.addEventListener('keydown', e => {
    e.stopPropagation();                       /* 打字時不觸發角色移動 */
    if (e.key === 'Enter') sendChat();
    else if (e.key === 'Escape') chatInput.blur();
  });
  document.getElementById('chatSend').addEventListener('click', sendChat);

  /* ---- 碰撞 ---- */
  function isWall(px, py) {
    const c = Math.floor(px / TILE), r = Math.floor(py / TILE);
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return true;
    return MAP[r][c] === '#';
  }
  /* 玩家以腳部一個小方框做碰撞 */
  const PB = 9;   /* 半寬 */
  function blocked(nx, ny) {
    return isWall(nx - PB, ny - 4) || isWall(nx + PB, ny - 4) ||
           isWall(nx - PB, ny - 16) || isWall(nx + PB, ny - 16);
  }

  /* ---- 實驗室狀態、傳送門與互動實體 ---- */
  const lab = loadLab();
  let activePortal = null, activeEntity = null, overlayOpen = false, lastClosedEntity = null;

  function tryEnter() {
    if (overlayOpen) return;
    if (activeEntity) {
      if (activeEntity.kind === 'arcade') {
        if (typeof SoundFX !== 'undefined') SoundFX.win();
        window.location.href = 'arcade.html';
      } else {
        openDialog(activeEntity);
      }
      return;
    }
    if (activePortal) {
      if (typeof SoundFX !== 'undefined') SoundFX.win();
      window.location.href = CHAPTER_INFO[activePortal.id].hub;
    }
  }

  /* ---- NPC / 布告欄對話框 ---- */
  let dialog = null;
  function openDialog(ent) {
    dialog = { entity: ent, line: 0 };
    overlayOpen = true;
    if (ent.kind === 'npc' && !lab.talked[ent.id]) { lab.talked[ent.id] = true; saveLab(lab); }
    renderDialog();
    if (typeof SoundFX !== 'undefined') SoundFX.click();
  }
  function advanceDialog() {
    if (!dialog) return;
    if (dialog.line < dialog.entity.lines.length - 1) { dialog.line++; renderDialog(); }
    else closeDialog();
  }
  function closeDialog() {
    if (dialog) lastClosedEntity = dialog.entity;   /* 鎖住:離開後再回來才會再觸發 */
    dialog = null; overlayOpen = false;
    document.getElementById('dlgOverlay').classList.add('hidden');
    checkBadges();
  }
  function renderDialog() {
    const ent = dialog.entity, last = dialog.line === ent.lines.length - 1;
    const ov = document.getElementById('dlgOverlay');
    ov.classList.remove('hidden');
    ov.querySelector('.dlg-ic').textContent = ent.kind === 'npc' ? '🧑‍🔧' : '📋';
    ov.querySelector('.dlg-name').textContent = ent.name;
    ov.querySelector('.dlg-text').textContent = ent.lines[dialog.line];
    ov.querySelector('.dlg-step').textContent = (dialog.line + 1) + ' / ' + ent.lines.length;
    ov.querySelector('.dlg-next').textContent = last ? '✕ 結束' : '▸ 繼續';
  }

  /* ---- 成就徽章 ---- */
  function checkBadges() {
    let unlocked = null;
    BADGES.forEach(b => {
      if (!lab.badges[b.id] && b.check(lab)) {
        lab.badges[b.id] = Date.now();
        if (!unlocked) unlocked = b;
      }
    });
    if (unlocked) { saveLab(lab); showBadgeToast(unlocked); if (typeof SoundFX !== 'undefined') SoundFX.win(); }
    const earned = BADGES.filter(b => lab.badges[b.id]).length;
    const bb = document.getElementById('badgeBtn');
    if (bb) bb.textContent = '🏅 成就 ' + earned + '/' + BADGES.length;
  }
  function showBadgeToast(b) {
    const t = document.getElementById('badgeToast');
    t.innerHTML = `<span class="bt-ic">${b.icon}</span><span class="bt-tx"><b>解鎖成就</b><br>${b.name}</span>`;
    t.classList.add('on');
    clearTimeout(showBadgeToast._t);
    showBadgeToast._t = setTimeout(() => t.classList.remove('on'), 3400);
  }
  function openBadgePanel() {
    overlayOpen = true;
    const ov = document.getElementById('badgeOverlay');
    const earned = BADGES.filter(b => lab.badges[b.id]).length;
    ov.querySelector('.bp-count').textContent = earned + ' / ' + BADGES.length;
    ov.querySelector('.bp-grid').innerHTML = BADGES.map(b => {
      const got = !!lab.badges[b.id];
      return `<div class="bp-card${got ? ' got' : ''}">
        <div class="bp-ic">${got ? b.icon : '🔒'}</div>
        <div class="bp-name">${b.name}</div>
        <div class="bp-desc">${b.desc}</div>
      </div>`;
    }).join('');
    ov.classList.remove('hidden');
  }
  function closeBadgePanel() {
    overlayOpen = false;
    document.getElementById('badgeOverlay').classList.add('hidden');
  }

  document.getElementById('dlgOverlay').querySelector('.dlg-next').addEventListener('click', advanceDialog);
  document.getElementById('dlgOverlay').querySelector('.dlg-close').addEventListener('click', closeDialog);
  document.getElementById('dlgOverlay').addEventListener('click', e => { if (e.target.id === 'dlgOverlay') closeDialog(); });
  document.getElementById('badgeBtn').addEventListener('click', openBadgePanel);
  document.getElementById('badgeOverlay').querySelector('.bp-close').addEventListener('click', closeBadgePanel);
  document.getElementById('badgeOverlay').addEventListener('click', e => { if (e.target.id === 'badgeOverlay') closeBadgePanel(); });

  /* ---- 多人連線(第二階段;連不到伺服器則維持單人) ---- */
  const net = { ws: null, id: null, others: new Map(), sendT: 0, lastX: 0, lastY: 0, lastF: -1 };
  function setNet(text, online) {
    const el = document.getElementById('netChip');
    if (el) { el.textContent = text; el.classList.toggle('online', !!online); }
  }
  function showNotice(text) {
    const el = document.getElementById('noticeBar');
    if (!el) return;
    el.textContent = text;
    el.classList.add('on');
    clearTimeout(showNotice._t);
    showNotice._t = setTimeout(() => el.classList.remove('on'), 6000);
  }
  function addOther(p) {
    if (!p || p.id === net.id) return;
    net.others.set(p.id, {
      x: p.x, y: p.y, tx: p.x, ty: p.y, f: p.f || 0,
      name: p.name || '訪客', look: p.look || defaultPlayer(),
    });
  }
  function connectMP() {
    if (location.protocol === 'https:') { setNet('單機模式(線上版)', false); return; }
    let ws;
    try { ws = new WebSocket('ws://' + location.hostname + ':8732'); }
    catch (e) { setNet('單機模式', false); return; }
    net.ws = ws;
    setNet('連線中…', false);
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ t: 'join', role: 'student', room: me.room || '',
        name: me.name, look: me, x: Math.round(player.x), y: Math.round(player.y) }));
    });
    ws.addEventListener('message', ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'welcome') { net.id = m.id; net.others.clear(); (m.players || []).forEach(addOther); }
      else if (m.t === 'join') addOther(m);
      else if (m.t === 'state') { const o = net.others.get(m.id); if (o) { o.tx = m.x; o.ty = m.y; o.f = m.f; } }
      else if (m.t === 'leave') net.others.delete(m.id);
      else if (m.t === 'notice') { showNotice('📢 ' + m.text); if (typeof SoundFX !== 'undefined') SoundFX.success(); }
      else if (m.t === 'summon') {
        player.x = m.x; player.y = m.y;
        showNotice('📢 老師請大家集合,你已被帶到集合點!');
        if (typeof SoundFX !== 'undefined') SoundFX.win();
      }
      else if (m.t === 'chat') {
        const o = net.others.get(m.id);
        if (o) { o.chat = m.text; o.chatUntil = performance.now() + 5500; }
      }
      const label = me.room ? '班級 ' + me.room : '公開實驗室';
      setNet(label + ' ・ ' + (net.others.size + 1) + ' 人', true);
    });
    ws.addEventListener('close', () => { net.ws = null; net.others.clear(); setNet('單機模式(已斷線)', false); });
    ws.addEventListener('error', () => { /* close 事件會接著處理 */ });
  }

  /* ---- 更新 ---- */
  const SPEED = 2.5;
  function update() {
    let dx = 0, dy = 0;
    if (joy.active && Math.hypot(joy.dx, joy.dy) > 0.2) {
      dx = joy.dx; dy = joy.dy;                       /* 類比搖桿:方向 + 力度 */
    } else {
      if (keys['arrowup'] || keys['w']) dy -= 1;
      if (keys['arrowdown'] || keys['s']) dy += 1;
      if (keys['arrowleft'] || keys['a']) dx -= 1;
      if (keys['arrowright'] || keys['d']) dx += 1;
      if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    }
    if (overlayOpen) { dx = 0; dy = 0; }   /* 對話/成就面板開啟時暫停移動 */
    player.moving = !!(dx || dy);
    if (dx < 0) player.dir = -1; else if (dx > 0) player.dir = 1;

    let nx = player.x + dx * SPEED;
    if (!blocked(nx, player.y)) player.x = nx;
    let ny = player.y + dy * SPEED;
    if (!blocked(player.x, ny)) player.y = ny;

    if (player.moving) {
      player.walkT += 1;
      if (player.walkT > 8) { player.walk ^= 1; player.walkT = 0; }
    } else player.walk = 0;

    /* 最近的可互動目標:傳送門 或 NPC/布告欄 */
    activePortal = null; activeEntity = null;
    let best = 999;
    PORTALS.forEach(p => {
      const d = Math.hypot(p.x - player.x, p.y - (player.y - 8));
      if (d < 50 && d < best) { best = d; activePortal = p; activeEntity = null; }
    });
    ENTITIES.forEach(en => {
      const d = Math.hypot(en.x - player.x, en.y - (player.y - 8));
      if (d < 50 && d < best) { best = d; activeEntity = en; activePortal = null; }
    });
    /* 剛結束對話的實體:要走開再回來才會再次觸發(避免一直迴圈) */
    if (activeEntity && activeEntity === lastClosedEntity) activeEntity = null;
    else if (activeEntity !== lastClosedEntity) lastClosedEntity = null;
    if (activePortal && !lab.visited[activePortal.id]) {
      lab.visited[activePortal.id] = true; saveLab(lab); checkBadges();
    }
    const prompt = document.getElementById('prompt');
    if (activePortal) {
      const info = CHAPTER_INFO[activePortal.id];
      prompt.innerHTML = `<b>${STAGE_META[activePortal.id].icon} ${info.name}</b><span>按 E / 點「進入」開始這一關</span>`;
      prompt.classList.add('on');
      document.getElementById('actionBtn').classList.add('ready');
    } else if (activeEntity) {
      const k = activeEntity.kind;
      const ic = k === 'npc' ? '💬' : k === 'arcade' ? '🕹️' : '📋';
      const verb = k === 'npc' ? '對話' : k === 'arcade' ? '進入遊樂區' : '查看';
      prompt.innerHTML = `<b>${ic} ${activeEntity.name}</b><span>按 E / 點「進入」${verb}</span>`;
      prompt.classList.add('on');
      document.getElementById('actionBtn').classList.add('ready');
    } else {
      prompt.classList.remove('on');
      document.getElementById('actionBtn').classList.remove('ready');
    }

    /* 多人:送出自己的位置、內插其他玩家 */
    if (net.ws && net.ws.readyState === 1) {
      const fNow = player.moving ? player.walk + 1 : 0;
      const moved = Math.abs(player.x - net.lastX) > 0.5 ||
                    Math.abs(player.y - net.lastY) > 0.5 || fNow !== net.lastF;
      const now = performance.now();
      if (moved && now - net.sendT > 70) {
        net.ws.send(JSON.stringify({ t: 'move', x: Math.round(player.x), y: Math.round(player.y), f: fNow }));
        net.sendT = now; net.lastX = player.x; net.lastY = player.y; net.lastF = fNow;
      }
    }
    net.others.forEach(o => { o.x += (o.tx - o.x) * 0.25; o.y += (o.ty - o.y) * 0.25; });
  }

  /* ---- 繪製 ---- */
  function drawFloor() {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (MAP[r][c] === '#') {
        ctx.fillStyle = '#2a2950';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        ctx.fillStyle = '#3a3870';
        ctx.fillRect(c * TILE, r * TILE, TILE, 6);
        ctx.fillStyle = '#1a1933';
        ctx.fillRect(c * TILE, r * TILE + TILE - 5, TILE, 5);
      } else {
        ctx.fillStyle = (c + r) % 2 ? '#20203c' : '#242444';
        ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
      }
    }
  }
  function drawPortal(p, t) {
    const m = STAGE_META[p.id], info = CHAPTER_INFO[p.id];
    const pulse = 0.5 + 0.5 * Math.sin(t / 26 + p.col);
    const near = activePortal === p;
    /* 光暈 */
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.16 * pulse + (near ? 0.2 : 0);
    ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, 30, 22, 0, 0, 7); ctx.fill();
    ctx.restore();
    /* 底座 */
    ctx.fillStyle = m.color;
    ctx.fillRect(p.x - 22, p.y - 6, 44, 14);
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(p.x - 22, p.y + 5, 44, 3);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillRect(p.x - 22, p.y - 6, 44, 3);
    /* 圖示 */
    ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(m.icon, p.x, p.y - 20 - pulse * 3);
    /* 招牌 */
    const pc = Progress.chapterPercent(p.id);
    ctx.fillStyle = near ? '#ffd34e' : '#14132b';
    ctx.fillRect(p.x - 40, p.y - 58, 80, 20);
    ctx.fillStyle = '#0b0b18'; ctx.lineWidth = 2;
    ctx.strokeStyle = '#0b0b18'; ctx.strokeRect(p.x - 40, p.y - 58, 80, 20);
    ctx.fillStyle = near ? '#14132b' : '#e8e8f5';
    ctx.font = '700 11px "Noto Sans TC",sans-serif';
    ctx.fillText('第 ' + p.id.slice(2) + ' 章 ・ ' + pc + '%', p.x, p.y - 48);
  }
  function drawName(x, y, name, kind) {
    ctx.font = '700 11px "Noto Sans TC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(name).width + 12;
    ctx.fillStyle = 'rgba(11,11,24,.8)';
    ctx.fillRect(x - w / 2, y - 8, w, 16);
    ctx.fillStyle = kind === 'me' ? '#ffd34e' : kind === 'npc' ? '#ffb86b' : '#9fe8d0';
    ctx.fillText(name, x, y);
  }
  function drawBoard(en, t) {
    const x = en.x, y = en.y, near = activeEntity === en;
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(x, y + 2, 27, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5b3a1c';
    ctx.fillRect(x - 18, y - 8, 5, 12); ctx.fillRect(x + 13, y - 8, 5, 12);
    ctx.fillStyle = '#0b0b18'; ctx.fillRect(x - 29, y - 46, 58, 40);
    ctx.fillStyle = near ? '#ffd34e' : '#caa24a'; ctx.fillRect(x - 26, y - 43, 52, 34);
    ctx.fillStyle = '#1c1b30';
    ctx.font = '16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('📋', x, y - 32);
    ctx.font = '700 9px "Noto Sans TC",sans-serif';
    ctx.fillText('布告欄', x, y - 16);
    if (near) {
      ctx.fillStyle = '#ffd34e'; ctx.font = '13px serif';
      ctx.fillText('❗', x, y - 56 - Math.sin(t / 10) * 2);
    }
  }
  function drawArcade(en, t) {
    const x = en.x, y = en.y, near = activeEntity === en;
    const glow = 0.5 + 0.5 * Math.sin(t / 22);
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(x, y + 2, 24, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a3aa8'; ctx.fillRect(x - 18, y - 52, 36, 52);
    ctx.fillStyle = '#7a5cd0'; ctx.fillRect(x - 18, y - 52, 5, 52);
    ctx.fillStyle = near ? '#ffd34e' : '#e879f9'; ctx.fillRect(x - 18, y - 57, 36, 7);
    ctx.fillStyle = '#0b0b18'; ctx.fillRect(x - 13, y - 49, 26, 19);
    ctx.fillStyle = `rgba(79,200,255,${0.45 + 0.4 * glow})`; ctx.fillRect(x - 11, y - 47, 22, 15);
    ctx.fillStyle = '#3a2a78'; ctx.fillRect(x - 16, y - 28, 32, 9);
    ctx.fillStyle = '#ff6b6b'; ctx.fillRect(x - 9, y - 27, 4, 4);
    ctx.fillStyle = '#ffd34e'; ctx.fillRect(x + 4, y - 27, 4, 4);
    ctx.font = '13px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🕹️', x, y - 39);
    ctx.fillStyle = '#fff'; ctx.font = '700 9px "Noto Sans TC",sans-serif';
    ctx.fillText('遊樂區', x, y - 53);
    if (near) {
      ctx.fillStyle = '#ffd34e'; ctx.font = '13px serif';
      ctx.fillText('❗', x, y - 67 - Math.sin(t / 10) * 2);
    }
  }
  function drawBubble(cx, bottomY, text) {
    ctx.font = '700 11px "Noto Sans TC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let t = text;
    if (ctx.measureText(t).width > 250) {
      while (t.length > 1 && ctx.measureText(t + '…').width > 250) t = t.slice(0, -1);
      t += '…';
    }
    const w = Math.ceil(ctx.measureText(t).width) + 16, h = 20;
    let top = bottomY - 6 - h;
    if (top < 3) top = 3;
    const left = cx - w / 2;
    ctx.fillStyle = '#fdfdff';
    ctx.fillRect(left, top, w, h);
    ctx.strokeStyle = '#0b0b18'; ctx.lineWidth = 2;
    ctx.strokeRect(left, top, w, h);
    ctx.fillStyle = '#fdfdff'; ctx.fillRect(cx - 4, top + h - 1, 8, 6);
    ctx.fillStyle = '#0b0b18';
    ctx.fillRect(cx - 5, top + h - 1, 2, 6); ctx.fillRect(cx + 3, top + h - 1, 2, 6);
    ctx.fillStyle = '#14132b';
    ctx.fillText(t, cx, top + h / 2);
  }

  let frame = 0;
  function render() {
    frame++;
    ctx.clearRect(0, 0, W, H);
    drawFloor();
    PORTALS.forEach(p => drawPortal(p, frame));
    ENTITIES.forEach(en => {
      if (en.kind === 'board') drawBoard(en, frame);
      else if (en.kind === 'arcade') drawArcade(en, frame);
    });
    /* 角色:自己 + 其他連線玩家 + NPC,依 y 排序處理前後遮擋 */
    const now = performance.now();
    const cast = [{ x: player.x, y: player.y, look: me, name: me.name,
      f: player.moving ? player.walk + 1 : 0, kind: 'me', chat: player.chat, chatUntil: player.chatUntil }];
    net.others.forEach(o => cast.push({ x: o.x, y: o.y, look: o.look, name: o.name, f: o.f,
      kind: 'other', chat: o.chat, chatUntil: o.chatUntil }));
    ENTITIES.forEach(en => {
      if (en.kind === 'npc') cast.push({ x: en.x, y: en.y, look: en.look, name: en.name, f: 0, kind: 'npc', ent: en });
    });
    cast.sort((a, b) => a.y - b.y);
    cast.forEach(c => {
      drawChar(ctx, c.x, c.y, 2.6, c.look, c.f);
      drawName(c.x, c.y - 16 * 2.6 - 12, c.name, c.kind);
      if (c.kind === 'npc' && activeEntity === c.ent) {
        ctx.fillStyle = '#ffd34e'; ctx.font = '13px serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('❗', c.x, c.y - 16 * 2.6 - 26 - Math.sin(frame / 10) * 2);
      }
      /* 聊天泡泡:自己一定顯示,其他人需在一定範圍內 */
      if (c.chat && now < c.chatUntil) {
        const inRange = c.kind === 'me' || Math.hypot(c.x - player.x, c.y - player.y) < 175;
        if (inRange) drawBubble(c.x, c.y - 16 * 2.6 - 26, c.chat);
      }
    });
  }

  checkBadges();
  connectMP();
  (function loop() { update(); render(); requestAnimationFrame(loop); })();
}

/* 已有角色 → 略過建立畫面,直接進入世界
 * (放在檔尾:確保 startWorld 用到的常數都已初始化) */
if (loadPlayer()) {
  const ur = urlRoom();
  if (ur && ur !== me.room) { me.room = ur; savePlayer(me); }
  document.getElementById('creator').classList.add('hidden');
  startWorld();
}
