/* ============================================================
 * 競賽與職涯倫理 — 競賽圖鑑 + 工程倫理情境題
 * ============================================================ */

const COMPETITIONS = [
  { name: 'FRC（FIRST Robotics Competition）', cat: 'robot',
    detail: '被譽為「機器人界的奧運」。參賽隊伍須在約 6 週的有限時間內,打造一台工業等級的機器人,強調工程管理與團隊合作。',
    url: 'https://www.firstinspires.org/robotics/frc', img: 'comp-site-frc.jpg' },
  { name: 'MakeX 世界機器人挑戰賽', cat: 'robot',
    detail: '由中國深圳科技公司 Makeblock 創辦的國際性機器人競賽平台,旨在推廣 STEAM 教育,鼓勵青少年透過機器人競賽培養創新與跨學科整合能力。',
    url: 'https://www.makex.cc' },
  { name: '智慧鐵人創意競賽（IICC）', cat: 'creative',
    detail: '由教育部主辦,結合科學、人文、藝術與生活常識的創意競賽,考驗團隊臨場解決問題與跨域整合的能力。',
    url: 'https://ironman.creativity.edu.tw/', img: 'comp-site-iicc.jpg' },
  { name: '全國高級中學生活科技學藝競賽', cat: 'maker',
    detail: '屬於高中實作類型的競賽,在限時與限定材料下完成作品,直接考驗學生的設計與實作能力。',
    url: 'https://ghresource.k12ea.gov.tw/nss/p/LivingTechnologyCompetition', img: 'comp-site-livtech.jpg' },
  { name: '旺宏科學獎', cat: 'science',
    detail: '由旺宏教育基金會主辦,鼓勵高中職學生進行科學專題研究,培養探究與獨立研究的能力。',
    url: 'https://www.mxeduc.org.tw/scienceaward/', img: 'comp-site-mxic.jpg' },
  { name: 'Intel ISEF 國際科技展覽會', cat: 'science',
    detail: '國際性的中學生科學與工程研究展覽會,匯聚世界各地的青少年研究者,是科展類的最高殿堂之一。',
    url: 'https://www.societyforscience.org/isef/', img: 'comp-site-isef.jpg' },
  { name: 'IEYI 世界青少年發明展', cat: 'invent',
    detail: '鼓勵青少年發明創作的國際展覽,著重於創意發想與發明的實用性。臺灣為創始會員國,設有臺灣選拔賽。',
    url: 'https://www.teyi.org/', img: 'comp-site-ieyi.jpg' },
];

const CATS = [
  { id: 'all', name: '全部' },
  { id: 'robot', name: '🤖 機器人競賽' },
  { id: 'creative', name: '💡 創意競賽' },
  { id: 'maker', name: '🛠️ 高中實作' },
  { id: 'science', name: '🔬 科展研究' },
  { id: 'invent', name: '🏅 發明展' },
];
const CAT_LABEL = { robot: '機器人競賽', creative: '創意競賽', maker: '高中實作', science: '科展研究', invent: '發明展' };
const CAT_ICON = { robot: '🤖', creative: '💡', maker: '🛠️', science: '🔬', invent: '🏅' };

let activeCat = 'all';

(function buildFilters() {
  const wrap = document.getElementById('compFilters');
  CATS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'comp-filter' + (c.id === 'all' ? ' active' : '');
    b.textContent = c.name;
    b.addEventListener('click', () => {
      activeCat = c.id;
      document.querySelectorAll('.comp-filter').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      SoundFX && SoundFX.click();
      renderComps();
    });
    wrap.appendChild(b);
  });
})();

function renderComps() {
  const grid = document.getElementById('compGrid');
  grid.innerHTML = '';
  COMPETITIONS.filter(c => activeCat === 'all' || c.cat === activeCat).forEach(c => {
    const card = document.createElement('div');
    card.className = 'comp-card';
    const linkHTML = c.url
      ? `<a href="${c.url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:700;color:var(--theme)">🔗 前往官方網站 ↗</a>`
      : '';
    let shotHTML = '';
    if (c.img && c.url) {
      shotHTML = `<a class="cc-shot" href="${c.url}" target="_blank" rel="noopener" title="前往「${c.name}」官方網站">
           <img src="../../assets/photos/${c.img}" alt="${c.name} 官方網站畫面" loading="lazy">
           <span class="cc-shot-go">官方網站 ↗</span>
         </a>`;
    } else if (c.url) {
      shotHTML = `<a class="cc-shot cc-ph" href="${c.url}" target="_blank" rel="noopener" title="前往「${c.name}」官方網站">
           <span class="cc-ph-ic">${CAT_ICON[c.cat] || '🔗'}</span>
           <span class="cc-ph-name">${c.name}</span>
           <span class="cc-shot-go">官方網站 ↗</span>
         </a>`;
    }
    card.innerHTML = `
      ${shotHTML}
      <span class="cc-type">${CAT_LABEL[c.cat]}</span>
      <h4>${c.name}</h4>
      <div class="cc-detail">${c.detail}${linkHTML}</div>
      <div class="cc-hint">▾ 點擊展開介紹</div>`;
    card.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      card.classList.toggle('open');
      card.querySelector('.cc-hint').textContent = card.classList.contains('open') ? '▴ 點擊收合' : '▾ 點擊展開介紹';
      SoundFX && SoundFX.click();
    });
    grid.appendChild(card);
  });
}
renderComps();

/* ============================================================
 * 工程倫理情境題
 * ============================================================ */
const ETHICS = [
  {
    question: '你發現自己設計的產品有一個低機率的安全瑕疵,但修正會延誤上市。你應該怎麼做?',
    options: [
      { text: '隱瞞問題,因為出事的機率很小。', correct: false },
      { text: '誠實向團隊回報,評估風險並進行修正,即使因此延誤上市。', correct: true,
        explain: '正確。阿波羅 1 號的教訓告訴我們:當安全與進度衝突時,安全永遠優先。隱瞞瑕疵違反工程倫理。' },
      { text: '把問題悄悄推給其他部門,假裝沒看到。', correct: false },
    ],
  },
  {
    question: '參加競賽時,你發現一個很棒的點子,但其實是直接照抄別隊去年的得獎設計。你應該?',
    options: [
      { text: '直接拿來用,反正評審大概不會發現。', correct: false },
      { text: '尊重原創——重新發想自己的版本,或在引用時公開致謝、說明出處。', correct: true,
        explain: '正確。工程倫理重視誠信與智慧財產權。借鑑他人是常態,但必須誠實標註來源、做出自己的貢獻。' },
      { text: '把別隊的設計稍微改個顏色,當作全新作品。', correct: false },
    ],
  },
  {
    question: '為了壓低成本,你的裝置原本打算全部使用最便宜、但不易回收的塑膠。下列何者較符合工程倫理與永續精神?',
    options: [
      { text: '只看成本,哪個最便宜就用哪個。', correct: false },
      { text: '在可接受的成本範圍內,優先選擇較易回收或對環境友善的材料。', correct: true,
        explain: '正確。工程師的決策會影響環境。在創新、成本與永續之間取得平衡,是現代工程倫理的重要一環。' },
      { text: '使用便宜材料,並在說明書上不提環保問題。', correct: false },
    ],
  },
];

let answered = 0;
const wrap = document.getElementById('ethicsQuiz');
ETHICS.forEach((q, i) => {
  const box = document.createElement('div');
  box.style.marginBottom = '14px';
  wrap.appendChild(box);
  Interactions.DiagnosisQuiz({
    container: box,
    question: `情境 ${i + 1}　${q.question}`,
    options: q.options,
    onAnswer: () => {
      answered++;
      if (answered === ETHICS.length) {
        celebrateModule('ch1-career', '競賽與職涯倫理');
        showToast('🎉 恭喜!你已完成第 1 章所有模組', 'success');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
