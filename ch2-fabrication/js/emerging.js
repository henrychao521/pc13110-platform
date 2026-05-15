/* ============================================================
 * 新興數位加工設備 — 圖鑑展開 + 技術配對挑戰
 * ============================================================ */

const EQUIPMENT = [
  { emoji: '💧', name: '光固化樹脂 3D 列印', tag: '高精度列印',
    principle: '用 UV 紫外光（常透過 LCD 遮罩)逐層固化液態的光敏樹脂。',
    strength: '精度遠高於 FDM,表面光滑細緻,能印出極精細的結構。',
    use: '牙科模型與假牙、珠寶蠟模、公仔模型、精密零件。',
    brand: 'Formlabs（美)、Phrozen 普羅森（臺灣)、ELEGOO、Anycubic（中)。' },
  { emoji: '⚙️', name: '金屬 3D 列印', tag: '加工金屬',
    principle: '用高功率雷射,逐層熔融金屬粉末（SLM／DMLS 技術)。',
    strength: '能做出傳統加工無法達成的內部複雜流道、輕量化鏤空結構。',
    use: '航太引擎零件、客製化醫療植入物（如人工關節)、賽車零件。',
    brand: 'EOS（德)、Markforged（美)、GE Additive。' },
  { emoji: '📷', name: '3D 掃描器', tag: '實體轉數位',
    principle: '用結構光或雷射量測物體表面的形狀,轉成 3D 數位模型。',
    strength: '把「實體 → 數位」,方向與 3D 列印相反,是「逆向工程」的關鍵。',
    use: '逆向工程、文物與藝術品數位典藏、客製化（如量身訂製義肢)。',
    brand: 'SHINING 3D EinScan（中)、Revopoint（中)、Artec（盧森堡)。' },
  { emoji: '🌈', name: 'UV 平台印刷機', tag: '表面彩印',
    principle: '噴印 UV 墨水並即時用 UV 光固化,可直接印在各種材質表面。',
    strength: '能在立體、非平面的物體上,直接印出彩色圖案與文字。',
    use: '客製化手機殼、招牌、獎盃、文創商品的表面印刷。',
    brand: 'Roland DG（日)、Mimaki（日)。' },
  { emoji: '🔄', name: '五軸 CNC 加工機', tag: '複雜曲面',
    principle: '在 X／Y／Z 三軸之外,再加上兩個旋轉軸,刀具能從更多角度切削。',
    strength: '一次裝夾就能加工複雜曲面,精度高、不需反覆翻面。',
    use: '航太渦輪葉片、精密模具、複雜的機械零件。',
    brand: 'DMG MORI（德／日)、Haas（美)等工具機大廠。' },
  { emoji: '🧬', name: '生成式設計', tag: 'AI 輔助設計',
    principle: '設定目標（載重、材料、製造方式、限制),由 AI 演算法自動生成多種最佳化結構。',
    strength: '常產生「仿生」的有機造型,在足夠強度下達到極致的輕量化。',
    use: '輕量化零件、太空與汽車結構設計。(這是軟體／演算法,將在第 3 章深入)',
    brand: 'Autodesk Fusion 生成式設計、nTopology。' },
];

let openCount = 0, matchBuilt = false;
const opened = new Set();

(function buildList() {
  const list = document.getElementById('emgList');
  EQUIPMENT.forEach((e, i) => {
    const card = document.createElement('div');
    card.className = 'emg-card';
    card.innerHTML = `
      <div class="emg-head">
        <span class="eh-emoji">${e.emoji}</span>
        <span><span class="eh-name">${e.name}</span>　<span class="eh-tag">${e.tag}</span></span>
        <span class="eh-arrow">▸</span>
      </div>
      <div class="emg-body"><div class="emg-body-inner">
        <div class="er"><b>原理：</b>${e.principle}</div>
        <div class="er"><b>新穎之處：</b>${e.strength}</div>
        <div class="er"><b>應用：</b>${e.use}</div>
        <div class="er" style="color:var(--text-muted)"><b>代表品牌：</b>${e.brand}</div>
      </div></div>`;
    card.querySelector('.emg-head').addEventListener('click', () => {
      card.classList.toggle('open');
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      if (card.classList.contains('open') && !opened.has(i)) {
        opened.add(i);
        openCount++;
        if (openCount >= 4 && !matchBuilt) buildMatch();
      }
    });
    list.appendChild(card);
  });
})();

/* ---- 技術配對挑戰 ---- */
function buildMatch() {
  matchBuilt = true;
  document.getElementById('matchGate').style.display = 'none';
  const QUIZ = [
    { question: '牙醫要為病人製作一個極精密的牙齒模型,最適合哪種技術?',
      options: [
        { text: '光固化樹脂 3D 列印', correct: true, explain: '正確。樹脂列印精度高、表面細緻,是牙科模型的首選。' },
        { text: 'FDM 塑膠 3D 列印', correct: false },
        { text: '五軸 CNC', correct: false },
      ] },
    { question: '博物館想把一件古董花瓶數位典藏、建立精確的 3D 模型,該用什麼?',
      options: [
        { text: '金屬 3D 列印', correct: false },
        { text: '3D 掃描器', correct: true, explain: '正確。3D 掃描把「實體 → 數位」,是數位典藏與逆向工程的關鍵。' },
        { text: 'UV 印刷機', correct: false },
      ] },
    { question: '航太公司要做一個「內部有複雜散熱通道」的鈦合金零件,最適合?',
      options: [
        { text: '雷射切割', correct: false },
        { text: '金屬 3D 列印', correct: true, explain: '正確。金屬 3D 列印能做出傳統加工無法達成的內部複雜流道。' },
        { text: '3D 掃描器', correct: false },
      ] },
    { question: '想在一座已經做好的木製獎盃曲面上,印出彩色的校徽,該用?',
      options: [
        { text: 'UV 平台印刷機', correct: true, explain: '正確。UV 印刷機能直接在立體、非平面的物體表面印彩色圖案。' },
        { text: '光固化樹脂列印', correct: false },
        { text: 'CNC 雕銑', correct: false },
      ] },
  ];
  let answered = 0;
  QUIZ.forEach((q, i) => {
    const box = document.createElement('div');
    box.style.marginBottom = '14px';
    document.getElementById('matchQuiz').appendChild(box);
    Interactions.DiagnosisQuiz({
      container: box, question: `第 ${i + 1} 題　${q.question}`, options: q.options,
      onAnswer: () => {
        answered++;
        if (answered === QUIZ.length) {
          celebrateModule('ch2-emerging', '新興數位加工設備');
          document.getElementById('nextBtn').classList.add('pop-in');
        }
      },
    });
  });
}
