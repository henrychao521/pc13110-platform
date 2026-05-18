/* ============================================================
 * 互動交誼廳 — 三位特別來賓
 *   占卜師(隨機好運占卜)/ 科技新聞記者(即時頭條)/ 氣象記者(定位天氣)
 * 純前端;新聞用 Hacker News 公開 API,天氣用 Open-Meteo(皆免金鑰)。
 * ============================================================ */

const GUESTS = [
  { id: 'fortune', kind: 'fortune', name: '神祕占卜師', role: '為你抽一則今日好運占卜' },
  { id: 'news',    kind: 'news',    name: '科技新聞記者', role: '帶來最新的國際科技頭條' },
  { id: 'weather', kind: 'weather', name: '氣象記者',   role: '報告你所在地的即時天氣' },
];

/* ---------- 像素人像 ---------- */
function drawPortrait(ctx, W, kind) {
  const G = 16, u = W / G;
  ctx.clearRect(0, 0, W, W);
  const R = (c, r, w, h, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(c * u), Math.round(r * u), Math.ceil(w * u), Math.ceil(h * u));
  };
  const bg = { fortune: '#3a2b66', news: '#23365e', weather: '#1f5e52' }[kind];
  const floor = { fortune: '#2a1f4a', news: '#18284a', weather: '#16463c' }[kind];
  const cloth = { fortune: '#6b4ba8', news: '#2f4f8f', weather: '#2dae8f' }[kind];
  const skin = '#f4c89a';
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, W);
  R(0, 12, 16, 4, floor);
  /* 肩 / 衣服 */
  R(2, 12, 12, 4, cloth);
  R(1, 14, 14, 2, cloth);
  /* 脖子 + 頭 */
  R(7, 10, 2, 2, skin);
  R(5, 4, 6, 7, skin);
  R(4, 6, 1, 3, skin); R(11, 6, 1, 3, skin);
  /* 眼睛 + 嘴 */
  R(6, 7, 1, 1, '#1a1a2a'); R(9, 7, 1, 1, '#1a1a2a');
  R(7, 9, 2, 1, '#b5604a');
  if (kind === 'fortune') {
    const hood = '#5a3f96';
    R(4, 2, 8, 2, hood); R(3, 3, 2, 8, hood); R(11, 3, 2, 8, hood);
    R(12, 1, 1, 1, '#ffe27a'); R(13, 2, 1, 1, '#ffd34e'); R(11, 1, 1, 1, '#ffd34e');
    R(7, 13, 2, 2, '#9ad7ff');
  } else if (kind === 'news') {
    const hair = '#3a2a18';
    R(5, 3, 6, 2, hair); R(4, 4, 1, 3, hair); R(11, 4, 1, 3, hair);
    R(7, 12, 2, 1, '#fdfdff');
    R(7, 13, 2, 3, '#ff6b6b');
    R(3, 12, 2, 2, '#ffd34e');
  } else {
    const hair = '#7a4a22';
    R(5, 3, 6, 2, hair); R(4, 4, 1, 2, hair); R(11, 4, 1, 2, hair);
    R(13, 2, 2, 2, '#ffd34e');
    R(12, 2, 1, 1, '#ffe27a'); R(15, 2, 1, 1, '#ffe27a');
    R(13, 1, 1, 1, '#ffe27a'); R(13, 4, 1, 1, '#ffe27a');
    R(6, 12, 4, 1, '#bff0e4');
  }
}

/* ---------- 來賓卡片 ---------- */
const guestsEl = document.getElementById('guests');
GUESTS.forEach(g => {
  const card = document.createElement('div');
  card.className = 'guest';
  card.innerHTML = `
    <canvas width="150" height="150"></canvas>
    <div class="g-name">${g.name}</div>
    <div class="g-role">${g.role}</div>
    <div class="g-go">▶ 上前互動</div>`;
  drawPortrait(card.querySelector('canvas').getContext('2d'), 150, g.kind);
  card.addEventListener('click', () => openGuest(g));
  guestsEl.appendChild(card);
});

/* ---------- 互動視窗 ---------- */
const overlay = document.getElementById('loOverlay');
const loBody = document.getElementById('loBody');
function openGuest(g) {
  if (typeof SoundFX !== 'undefined') SoundFX.click();
  drawPortrait(document.getElementById('hPortrait').getContext('2d'), 64, g.kind);
  document.getElementById('hName').textContent = g.name;
  document.getElementById('hRole').textContent = g.role;
  overlay.classList.remove('hidden');
  if (g.kind === 'fortune') openFortune();
  else if (g.kind === 'news') openNews();
  else openWeather();
}
function closeGuest() { overlay.classList.add('hidden'); loBody.innerHTML = ''; }
document.getElementById('hClose').addEventListener('click', closeGuest);
overlay.addEventListener('click', e => { if (e.target === overlay) closeGuest(); });

/* ============================================================
 * 占卜師
 * ============================================================ */
const FORTUNES = [
  { e: '⚡', t: '今天你的靈感會像電流一樣源源不絕,很適合動手做點新東西!' },
  { e: '🔧', t: '幸運物是「螺絲起子」—— 今天遇到的小難題,你都能輕鬆轉開。' },
  { e: '🌟', t: '今天踏出的一小步,會變成日後回頭看時的一大步,放心去做。' },
  { e: '🧩', t: '一直卡住的問題,今天會冒出意想不到的解法,保持好奇心。' },
  { e: '🤝', t: '今天適合與人合作,一句請教會幫你省下很多時間。' },
  { e: '🚀', t: '幸運方向是「往前」—— 想嘗試的事,今天就是好日子。' },
  { e: '💡', t: '把昨天的失誤當資料,今天的你會升級成更強的版本。' },
  { e: '🛠️', t: '今天做事會特別順手,完成度會超出你自己的預期。' },
  { e: '📐', t: '幸運數字是 3 —— 量三次再下刀,今天的成果會很精準。' },
  { e: '🔋', t: '你的能量是滿格的,記得也留一點電給休息與睡眠。' },
  { e: '🌈', t: '今天會收到一個小小的好消息,留意身邊的訊息。' },
  { e: '🧠', t: '今天記性特別好,適合學新東西、記新概念。' },
  { e: '🎯', t: '專注力是你今天的超能力,先做最重要的那件事就對了。' },
  { e: '😊', t: '你的好心情會感染別人,今天很適合幫助同學。' },
  { e: '⭐', t: '占卜師看見:你最近的努力,很快會被看見並得到回應。' },
  { e: '🔮', t: '今天的選擇題,跟著直覺走通常不會錯。' },
  { e: '🌱', t: '一個小習慣正在你身上發芽,持續下去會長成大本事。' },
  { e: '🏆', t: '今天適合挑戰一個你以為做不到的小目標 —— 你會驚訝。' },
];
function openFortune() {
  loBody.innerHTML = `
    <button class="lo-act" id="drawFortune">🔮 抽一張今日占卜</button>
    <div class="lo-result" id="fortuneResult">
      占卜師微笑著洗牌 —— 點上面的按鈕,為你抽一張今日好運牌。
    </div>`;
  document.getElementById('drawFortune').addEventListener('click', () => {
    const f = FORTUNES[(Math.random() * FORTUNES.length) | 0];
    if (typeof SoundFX !== 'undefined') SoundFX.win();
    document.getElementById('fortuneResult').innerHTML =
      `<span class="big">${f.e}</span>${f.t}`;
  });
}

/* ============================================================
 * 科技新聞記者(Hacker News 即時頭條,失敗則用科技新知)
 * ============================================================ */
const NEWS_FALLBACK = [
  '全球首座 3D 列印混凝土橋已在荷蘭啟用,顯示積層製造正走進土木工程。',
  '工程師用「生成式設計」讓 AI 提出人類想不到的輕量結構,常見於航太零件。',
  '半導體製程持續微縮,讓同樣面積的晶片能塞進更多電晶體。',
  '再生能源發電成本逐年下降,太陽能在許多地區已比化石燃料便宜。',
  'ESP32 等低價無線微控制器,讓校園專題也能輕鬆做出物聯網裝置。',
  '雷射切割與 3D 列印普及,讓「快速原型」從工廠走進教室。',
  '電動車與儲能電池需求大增,帶動鋰電池與回收技術的發展。',
  'AI 影像辨識被應用在製造業檢測,協助找出人眼難察覺的瑕疵。',
];
function openNews() {
  loBody.innerHTML = `
    <div class="lo-result" id="newsArea">📡 記者正在連線,抓取最新科技頭條…</div>
    <button class="lo-act" id="newsRefresh" style="margin-top:12px" disabled>🔄 換一批</button>`;
  document.getElementById('newsRefresh').addEventListener('click', fetchNews);
  fetchNews();
}
function fetchNews() {
  const area = document.getElementById('newsArea');
  const btn = document.getElementById('newsRefresh');
  area.innerHTML = '📡 記者正在連線,抓取最新科技頭條…';
  if (btn) btn.disabled = true;
  fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=5')
    .then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(d => {
      const hits = (d.hits || []).filter(h => h.title);
      if (!hits.length) throw 0;
      area.innerHTML = '<div style="font-size:11px;color:var(--px-dim);margin-bottom:6px">🌐 國際科技頭條・來源 Hacker News</div>' +
        hits.map(h => {
          const url = h.url || ('https://news.ycombinator.com/item?id=' + h.objectID);
          return `<div class="lo-news-item">
            <a href="${url}" target="_blank" rel="noopener">${esc(h.title)}</a>
            <div class="ni-meta">▲ ${h.points || 0} 分・💬 ${h.num_comments || 0}</div>
          </div>`;
        }).join('');
      if (btn) btn.disabled = false;
    })
    .catch(() => {
      const pick = NEWS_FALLBACK.slice().sort(() => Math.random() - 0.5).slice(0, 4);
      area.innerHTML = '<div style="font-size:11px;color:var(--px-dim);margin-bottom:6px">📚 科技新知快報(目前連不上即時新聞)</div>' +
        pick.map(t => `<div class="lo-news-item">${t}</div>`).join('');
      if (btn) btn.disabled = false;
    });
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* ============================================================
 * 氣象記者(瀏覽器定位 + Open-Meteo)
 * ============================================================ */
const WMO = {
  0: ['☀️', '晴朗'], 1: ['🌤️', '大致晴朗'], 2: ['⛅', '局部多雲'], 3: ['☁️', '陰天'],
  45: ['🌫️', '有霧'], 48: ['🌫️', '凍霧'],
  51: ['🌦️', '毛毛雨'], 53: ['🌦️', '毛毛雨'], 55: ['🌧️', '毛毛雨(密)'],
  61: ['🌧️', '小雨'], 63: ['🌧️', '中雨'], 65: ['🌧️', '大雨'],
  66: ['🌧️', '凍雨'], 67: ['🌧️', '凍雨'],
  71: ['🌨️', '小雪'], 73: ['🌨️', '中雪'], 75: ['❄️', '大雪'], 77: ['🌨️', '雪粒'],
  80: ['🌦️', '陣雨'], 81: ['🌧️', '陣雨'], 82: ['⛈️', '強陣雨'],
  85: ['🌨️', '陣雪'], 86: ['❄️', '強陣雪'],
  95: ['⛈️', '雷雨'], 96: ['⛈️', '雷雨夾雹'], 99: ['⛈️', '強雷雨夾雹'],
};
function openWeather() {
  loBody.innerHTML = `
    <button class="lo-act" id="getWeather">📍 看我這裡的即時天氣</button>
    <div class="lo-result" id="weatherArea">
      按上面的按鈕,氣象記者會用你的所在位置查詢即時天氣。
      <div class="lo-hint">※ 瀏覽器會詢問定位權限,允許後才能查到你所在地的天氣。
      位置只用於當下查詢、不會儲存或上傳。</div>
    </div>`;
  document.getElementById('getWeather').addEventListener('click', locateWeather);
}
function locateWeather() {
  const area = document.getElementById('weatherArea');
  area.innerHTML = '📡 正在取得你的位置…';
  if (!navigator.geolocation) { showWeather(25.033, 121.565, '台北(預設)'); return; }
  navigator.geolocation.getCurrentPosition(
    pos => showWeather(pos.coords.latitude, pos.coords.longitude, null),
    () => {
      area.innerHTML = '🙅 無法取得你的位置(可能未允許定位權限)。<br>先為你報告<b>台北</b>的天氣:' +
        '<div class="lo-hint">提示:在瀏覽器網址列旁的定位圖示可重新允許權限。</div>';
      showWeather(25.033, 121.565, '台北(預設)', true);
    },
    { timeout: 9000 }
  );
}
function showWeather(lat, lon, placeName, append) {
  const area = document.getElementById('weatherArea');
  if (!append) area.innerHTML = '📡 已取得位置,氣象記者正在查詢天氣…';
  const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
  const placeP = placeName ? Promise.resolve(placeName) :
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`)
      .then(r => r.json())
      .then(d => [d.city, d.locality, d.principalSubdivision].filter(Boolean)[0] || '你的位置')
      .catch(() => '你的位置');
  Promise.all([fetch(wxUrl).then(r => { if (!r.ok) throw 0; return r.json(); }), placeP])
    .then(([d, place]) => {
      const c = d.current;
      const w = WMO[c.weather_code] || ['🌡️', '天氣'];
      const block = `
        <div class="lo-w-big">${w[0]}</div>
        <div class="lo-w-temp">${Math.round(c.temperature_2m)}°C</div>
        <div style="text-align:center;font-size:13px;font-weight:700">${place}・${w[1]}</div>
        <div class="lo-w-row"><span>體感溫度</span><span>${Math.round(c.apparent_temperature)}°C</span></div>
        <div class="lo-w-row"><span>相對濕度</span><span>${c.relative_humidity_2m}%</span></div>
        <div class="lo-w-row"><span>風速</span><span>${c.wind_speed_10m} km/h</span></div>
        <div class="lo-hint">資料來源:Open-Meteo・更新於 ${new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</div>`;
      if (append) area.innerHTML += '<div style="margin-top:10px">' + block + '</div>';
      else area.innerHTML = block;
    })
    .catch(() => {
      area.innerHTML = '🙇 氣象記者連線失敗,請稍後再試一次。';
    });
}
