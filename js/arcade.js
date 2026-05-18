/* ============================================================
 * 下課遊樂區 — 上下選單 + 旁側面板
 * 像素小遊戲、占卜師、新聞記者、氣象記者
 * ============================================================ */

const GAME_BASE = 'arcade/games/';
const ITEMS = [
  { type: 'game', id: 'snake', icon: '🐍', name: '像素貪食蛇', kind: '遊戲',
    desc: '經典貪食蛇的像素版!吃到方塊就會變長,小心別撞到牆壁或咬到自己。',
    ctrl: '方向鍵 / WASD / 滑動 / 螢幕按鈕', lic: '本平台原創' },
  { type: 'game', id: 'breakout', icon: '🧱', name: '像素打磚塊', kind: '遊戲',
    desc: '移動底板把球接住,反彈打掉上方所有彩色磚塊,別讓球掉下去!',
    ctrl: '滑鼠 / 手指拖動 / ← → 鍵', lic: '本平台原創' },
  { type: 'game', id: 'shooter', icon: '🚀', name: '像素太空射擊', kind: '遊戲',
    desc: '駕駛太空船自動射擊,擊落一波波下降的外星方塊,別讓它們撞上你。',
    ctrl: '← → / A D / 滑鼠 / 手指拖動', lic: '本平台原創' },
  { type: 'game', id: 'memory', icon: '🧠', name: '工程記憶配對', kind: '遊戲',
    desc: '翻牌記憶遊戲,配對齒輪、燈泡、機器人等工程圖示,挑戰用最少步數完成。',
    ctrl: '點擊翻牌', lic: '本平台原創' },
  { type: 'game', id: 'circuit', icon: '🔌', name: '接電路', kind: '遊戲',
    desc: '電路解謎!點格子旋轉電線,把電池接到燈泡讓它亮起來 —— 呼應第 4 章電路。',
    ctrl: '點擊格子旋轉電線', lic: '本平台原創' },
  { type: 'game', id: '2048', icon: '🔢', name: '2048', kind: '遊戲',
    desc: '滑動合成相同數字,挑戰湊出 2048!考驗規劃與邏輯的經典益智遊戲。',
    ctrl: '方向鍵 / 滑動', lic: 'MIT 授權・Gabriele Cirulli' },
  { type: 'game', id: 'hextris', icon: '⬡', name: 'Hextris', kind: '遊戲',
    desc: '旋轉中央六邊形接住同色方塊,六邊形版的方塊消除,考驗反應與空間思考。',
    ctrl: '方向鍵 / 點畫面兩側', lic: 'GPL 授權・Hextris 開源團隊' },
  { type: 'fortune', icon: '🔮', name: '占卜師', kind: '今日運勢',
    desc: '抽一張今日的工程運勢籤,看看今天有什麼好兆頭。' },
  { type: 'news', icon: '📰', name: '新聞記者', kind: '科技快報',
    desc: '為你帶來最新的科技新聞頭條,點標題可看原文。' },
  { type: 'weather', icon: '🌤️', name: '氣象記者', kind: '即時天氣',
    desc: '播報你所在地點的即時天氣。手機開啟後請允許定位。' },
];

const FORTUNES = [
  { s: 5, t: '大吉・靈感爆發', d: '把卡關的問題拆成小步驟,今天會豁然開朗。', i: '一張白紙' },
  { s: 5, t: '大吉・貴人相助', d: '主動向同學或老師請教,會得到關鍵的提示。', i: '你的好奇心' },
  { s: 4, t: '中吉・穩紮穩打', d: '按部就班完成手邊的任務,進度會超乎預期。', i: '一支順手的筆' },
  { s: 5, t: '大吉・創意滿點', d: '今天的點子特別多,記得隨手把它們記下來。', i: '一疊便利貼' },
  { s: 4, t: '中吉・團隊好運', d: '和夥伴合作會事半功倍,別一個人埋頭苦幹。', i: '一句謝謝' },
  { s: 5, t: '大吉・突破瓶頸', d: '再試一次那個曾經放棄的方法,這次會成功。', i: '一點耐心' },
  { s: 4, t: '中吉・細節達人', d: '多檢查一次,你會發現一個重要的小地方。', i: '一面放大鏡' },
  { s: 5, t: '大吉・學習之星', d: '今天學的東西記得特別牢,適合挑戰新主題。', i: '一杯水' },
  { s: 4, t: '中吉・動手最旺', d: '與其想太多,不如直接動手做做看原型。', i: '一塊積木' },
  { s: 5, t: '大吉・溝通順暢', d: '把想法說出來分享,會收到很棒的回饋。', i: '好心情' },
  { s: 4, t: '中吉・整理好運', d: '整理一下桌面或檔案,思緒也會跟著清晰起來。', i: '一個資料夾' },
  { s: 5, t: '大吉・勇氣加倍', d: '勇敢舉手發表你的想法,今天特別有說服力。', i: '一個自信的微笑' },
  { s: 4, t: '中吉・適度休息', d: '適時休息一下,回來之後會更有效率。', i: '一首喜歡的歌' },
  { s: 5, t: '大吉・工程魂全開', d: '今天適合動手做專題,完成度會很高。', i: '一把螺絲起子' },
];

const WMO = {
  0: ['☀️', '晴朗'], 1: ['🌤️', '晴時多雲'], 2: ['⛅', '多雲'], 3: ['☁️', '陰天'],
  45: ['🌫️', '有霧'], 48: ['🌫️', '霧淞'],
  51: ['🌦️', '毛毛雨'], 53: ['🌦️', '毛毛雨'], 55: ['🌦️', '毛毛雨'],
  56: ['🌧️', '凍雨'], 57: ['🌧️', '凍雨'],
  61: ['🌧️', '小雨'], 63: ['🌧️', '下雨'], 65: ['🌧️', '大雨'],
  66: ['🌧️', '凍雨'], 67: ['🌧️', '凍雨'],
  71: ['🌨️', '小雪'], 73: ['🌨️', '下雪'], 75: ['🌨️', '大雪'], 77: ['🌨️', '雪粒'],
  80: ['🌦️', '陣雨'], 81: ['🌦️', '陣雨'], 82: ['⛈️', '強陣雨'],
  85: ['🌨️', '陣雪'], 86: ['🌨️', '強陣雪'],
  95: ['⛈️', '雷雨'], 96: ['⛈️', '雷雨夾冰雹'], 99: ['⛈️', '強雷雨'],
};

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function click() { if (typeof SoundFX !== 'undefined') SoundFX.click(); }

/* ---- 選單 ---- */
const menuEl = document.getElementById('arcMenu');
const panelEl = document.getElementById('arcPanel');
let selected = 0;

(function buildMenu() {
  ITEMS.forEach((it, i) => {
    if (i === 7) {
      const sep = document.createElement('div');
      sep.className = 'arc-menu-sep mono';
      sep.textContent = '— 特別來賓 —';
      menuEl.appendChild(sep);
    }
    const el = document.createElement('div');
    el.className = 'arc-item';
    el.dataset.i = i;
    el.innerHTML = `<span class="ai-ic">${it.icon}</span>
      <span><span class="ai-name">${it.name}</span><br><span class="ai-kind">${it.kind}</span></span>`;
    el.addEventListener('click', () => selectItem(i));
    menuEl.appendChild(el);
  });
})();

function selectItem(i) {
  selected = i;
  [...menuEl.querySelectorAll('.arc-item')].forEach(el =>
    el.classList.toggle('on', +el.dataset.i === i));
  click();
  renderPanel(ITEMS[i]);
}

/* ---- 面板 ---- */
function panelHead(it, tag) {
  return `<div class="ap-head">
      <span class="ap-ic">${it.icon}</span>
      <div><div class="ap-title">${it.name}</div></div>
      ${tag ? `<span class="ap-tag">${tag}</span>` : ''}
    </div>`;
}
function renderPanel(it) {
  if (it.type === 'game') {
    panelEl.innerHTML = panelHead(it, it.lic) +
      `<div class="ap-desc">${it.desc}</div>
       <div class="ap-meta">🎮 操作方式:${it.ctrl}</div>
       <button class="ap-btn" id="apPlay">▶ 開始遊戲</button>`;
    document.getElementById('apPlay').addEventListener('click', () => openGame(it));
  } else if (it.type === 'fortune') {
    panelEl.innerHTML = panelHead(it, '今日運勢') +
      `<div class="ap-desc">${it.desc}</div>
       <div class="ap-card" id="fortuneCard"></div>
       <button class="ap-btn" id="apRoll">🔮 抽今日運勢籤</button>`;
    document.getElementById('apRoll').addEventListener('click', rollFortune);
    document.getElementById('fortuneCard').innerHTML =
      '<div class="ap-loading">點下方按鈕,抽一張今日運勢籤 ✨</div>';
  } else if (it.type === 'news') {
    panelEl.innerHTML = panelHead(it, '科技快報') +
      `<div class="ap-desc">${it.desc}</div>
       <div class="ap-card" id="newsCard"></div>
       <div class="ap-meta" style="margin-top:8px">新聞來源:Hacker News(科技新聞社群)</div>
       <button class="ap-btn ghost" id="apNews">↻ 重新整理</button>`;
    document.getElementById('apNews').addEventListener('click', loadNews);
    loadNews();
  } else if (it.type === 'weather') {
    panelEl.innerHTML = panelHead(it, '即時天氣') +
      `<div class="ap-desc">${it.desc}</div>
       <div class="ap-card" id="wxCard"></div>
       <div class="ap-meta" style="margin-top:8px">氣象資料:Open-Meteo</div>
       <button class="ap-btn ghost" id="apWx">↻ 重新定位</button>`;
    document.getElementById('apWx').addEventListener('click', loadWeather);
    loadWeather();
  }
}

/* ---- 遊戲覆蓋層 ---- */
const overlay = document.getElementById('playOverlay');
const frame = document.getElementById('playFrame');
function openGame(it) {
  click();
  document.getElementById('playTitle').textContent = '🕹️ ' + it.name;
  frame.src = GAME_BASE + it.id + '/index.html';
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => frame.focus(), 100);
}
function closeGame() {
  overlay.classList.add('hidden');
  frame.src = 'about:blank';
  document.body.style.overflow = '';
}
document.getElementById('playClose').addEventListener('click', closeGame);

/* ---- 占卜師 ---- */
function rollFortune() {
  click();
  const f = FORTUNES[(Math.random() * FORTUNES.length) | 0];
  const stars = '★'.repeat(f.s) + '☆'.repeat(5 - f.s);
  document.getElementById('fortuneCard').innerHTML = `
    <div class="ap-fortune-stars">${stars}</div>
    <div class="ap-fortune-title">${f.t}</div>
    <div class="ap-fortune-line">今日宜:${f.d}</div>
    <div class="ap-fortune-line" style="margin-top:6px">幸運小物:<b>${f.i}</b></div>`;
}

/* ---- 新聞記者(Hacker News API,免金鑰、支援 CORS) ---- */
async function loadNews() {
  click();
  const card = document.getElementById('newsCard');
  if (!card) return;
  card.innerHTML = '<div class="ap-loading">📡 連線取得最新科技新聞中…</div>';
  try {
    const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json());
    const items = await Promise.all(ids.slice(0, 7).map(id =>
      fetch('https://hacker-news.firebaseio.com/v0/item/' + id + '.json').then(r => r.json())));
    card.innerHTML = items.filter(Boolean).map((it, i) => {
      const url = it.url || ('https://news.ycombinator.com/item?id=' + it.id);
      return `<a class="ap-news-item" href="${esc(url)}" target="_blank" rel="noopener">
        <span class="ap-news-rank">${i + 1}.</span>
        <span class="ap-news-title">${esc(it.title || '(無標題)')}</span>
        <span class="ap-news-meta">　👍 ${it.score || 0}</span></a>`;
    }).join('');
  } catch (e) {
    card.innerHTML = '<div class="ap-loading">⚠ 暫時連不上新聞來源,請稍後再按「重新整理」。</div>';
  }
}

/* ---- 氣象記者(geolocation + Open-Meteo,免金鑰) ---- */
function loadWeather() {
  click();
  const card = document.getElementById('wxCard');
  if (!card) return;
  card.innerHTML = '<div class="ap-loading">📍 正在取得你的所在位置…(手機請允許定位)</div>';
  const TAIPEI = [25.0330, 121.5654];
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      p => fetchWx(p.coords.latitude, p.coords.longitude, true),
      () => fetchWx(TAIPEI[0], TAIPEI[1], false),
      { timeout: 9000, maximumAge: 600000 }
    );
  } else {
    fetchWx(TAIPEI[0], TAIPEI[1], false);
  }
}
async function fetchWx(lat, lon, located) {
  const card = document.getElementById('wxCard');
  if (!card) return;
  card.innerHTML = '<div class="ap-loading">🌐 查詢氣象資料中…</div>';
  try {
    const w = await fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat +
      '&longitude=' + lon + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m').then(r => r.json());
    const c = w.current || {};
    let place = located ? '你的所在位置' : '臺北市(預設位置)';
    try {
      const g = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' +
        lat + '&longitude=' + lon + '&localityLanguage=zh').then(r => r.json());
      const nm = [...new Set([g.principalSubdivision, g.city || g.locality].filter(Boolean))].join(' ');
      if (nm) place = nm + (located ? '' : '(預設)');
    } catch (e) { /* 反向地理編碼失敗則沿用預設文字 */ }
    const wx = WMO[c.weather_code] || ['🌡️', '—'];
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:18px">
        <div class="ap-wx-big">${wx[0]}</div>
        <div>
          <div class="ap-wx-temp">${Math.round(c.temperature_2m)}°C</div>
          <div style="font-size:14px;font-weight:700">${wx[1]}</div>
        </div>
      </div>
      <div class="ap-wx-row">
        <span>💧 濕度 <b>${Math.round(c.relative_humidity_2m)}%</b></span>
        <span>💨 風速 <b>${Math.round(c.wind_speed_10m)} km/h</b></span>
      </div>
      <div class="ap-wx-row"><span>📍 地點 <b>${esc(place)}</b></span></div>`;
  } catch (e) {
    card.innerHTML = '<div class="ap-loading">⚠ 暫時取不到氣象資料,請稍後再按「重新定位」。</div>';
  }
}

/* ---- 鍵盤:▲▼ 選擇、Enter 啟動 ---- */
window.addEventListener('keydown', e => {
  if (!overlay.classList.contains('hidden')) {
    if (e.key === 'Escape') closeGame();
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 'arrowdown' || k === 's') { e.preventDefault(); selectItem((selected + 1) % ITEMS.length); }
  else if (k === 'arrowup' || k === 'w') { e.preventDefault(); selectItem((selected - 1 + ITEMS.length) % ITEMS.length); }
  else if (k === 'enter' || k === ' ') {
    e.preventDefault();
    const it = ITEMS[selected];
    if (it.type === 'game') openGame(it);
    else if (it.type === 'fortune') rollFortune();
    else if (it.type === 'news') loadNews();
    else if (it.type === 'weather') loadWeather();
  }
});

/* 預設選第一項 */
selectItem(0);
