/* ============================================================
 * 實體建模與原型製作 — 材料圖鑑 + 材料選擇 + 流程排序
 * ============================================================ */

const MATERIALS = [
  { emoji: '🪵', name: '木材（松木板／松木條）',
    img: 'wood-plank.jpg', credit: 'Bart Lumber・CC0', file: 'Wood_planks_1111.jpg',
    feat: '安全、容易加工,可快速做出外觀、結構,也能做出可動的機構。',
    use: '建築骨架、機構模型、結構強度的初步驗證。',
    note: '有紋理與節點,各部位性質不均,適合驗證造型與機構。' },
  { emoji: '🔩', name: '金屬（鐵桿／金屬薄板）',
    img: 'metal-barstock.jpg', credit: 'Alister 77・Public Domain', file: 'Assorted_bar_stock.jpg',
    feat: '加工較木材複雜,但材料性質均勻固定,物理分析結果準確。',
    use: '需要強度的成品、機器人結構;薄金屬板可做出有強度的外殼。',
    note: '常用鐵桿做支撐骨架,以螺絲或三秒膠快速接合。' },
  { emoji: '🧱', name: '積木（Modular blocks）',
    img: 'lego-bricks.jpg', credit: 'Benjamin D. Esham・CC BY-SA 4.0', file: 'Lego_bricks.jpg',
    feat: '具備「好拆卸、好組裝」的特性,改來改去都很方便。',
    use: '測試機構連動的邏輯、結構概念,設計初期快速驗證。',
    note: '除了塑膠積木,教學現場也有金屬積木零件可選用。' },
  { emoji: '📋', name: '風扣板／白奶紙板／灰紙板',
    img: 'foam-board.jpg', credit: 'Sweetie candykim・CC0', file: 'Foamboard.JPG',
    feat: '防潮、質地輕、好切割,可用美工刀加工。',
    use: '建築與室內設計模型,做出牆面、直立物件,甚至彎折出曲面。',
    note: '風扣板由「Fome Board」音譯而來,即發泡板。' },
  { emoji: '🧽', name: 'PU 泡綿',
    img: 'pu-foam.jpg', credit: 'Silverchemist・CC BY-SA 3.0', file: 'Molded_polyurethane_foam.JPG',
    feat: '質地軟、好塑形,可手工鋸切並用砂紙磨出外型。',
    use: '產品外觀模型,反覆操作做出心中的造型。',
    note: '表面會有孔洞,需塗補土填補。' },
  { emoji: '🪣', name: '補土（Filler）',
    img: 'wood-filler.jpg', credit: 'Rlsheehan・CC BY-SA 4.0', file: 'Tubs_of_wood_filler_or_putty.jpg',
    feat: '可填補模型表面的裂痕、縫隙等瑕疵,並增加強度。',
    use: 'PU 泡綿、木材等模型的表面修補與加固。',
    note: '是外觀模型加工流程中不可或缺的一步。' },
];

(function buildMaterials() {
  const grid = document.getElementById('matGrid');
  MATERIALS.forEach(m => {
    const card = document.createElement('div');
    card.className = 'mat-card';
    const commons = 'https://commons.wikimedia.org/wiki/File:' + m.file;
    card.innerHTML = `
      <div class="mt-head"><span class="mt-emoji">${m.emoji}</span><span class="mt-name">${m.name}</span></div>
      <img class="mt-photo" src="../../assets/photos/${m.img}" alt="${m.name}實物照片" loading="lazy">
      <div class="mt-credit">📷 實物照片　${m.credit}・<a href="${commons}" target="_blank" rel="noopener">Wikimedia Commons</a></div>
      <div class="mt-body">
        <div class="mt-row"><b>特性：</b>${m.feat}</div>
        <div class="mt-row"><b>適用：</b>${m.use}</div>
        <div class="mt-row" style="color:var(--text-muted)"><b>補充：</b>${m.note}</div>
      </div>`;
    grid.appendChild(card);
  });
})();

/* ---- 材料選擇情境題 ---- */
let matDone = false, seqDone = false;
function checkComplete() {
  if (matDone && seqDone) {
    celebrateModule('ch2-prototype', '實體建模與原型製作');
    document.getElementById('nextBtn').classList.add('pop-in');
  }
}

const MAT_QUIZ = [
  { question: '你想快速測試一個「齒輪帶動連桿」的機構能不能順利連動,還會反覆修改。最適合用什麼?',
    options: [
      { text: '積木（Modular blocks）', correct: true,
        explain: '正確。積木「好拆卸、好組裝」,最適合在設計初期反覆測試機構連動邏輯。' },
      { text: 'PU 泡綿', correct: false },
      { text: '補土', correct: false },
    ] },
  { question: '你要做一個建築物的室內空間模型,需要切出許多牆面。最適合的材料是?',
    options: [
      { text: '鐵桿', correct: false },
      { text: '風扣板或紙板', correct: true,
        explain: '正確。風扣板、白奶紙板防潮、質輕、好切割,是建築與室內模型的常用材料。' },
      { text: '積木', correct: false },
    ] },
  { question: '你要做一台跑車的外觀模型,需要打磨出流線曲面。最適合的材料與工序是?',
    options: [
      { text: '直接用金屬板敲打成形', correct: false },
      { text: '用 PU 泡綿切割、砂磨出外型,再以補土填補表面孔洞', correct: true,
        explain: '正確。PU 泡綿好塑形,但表面有孔洞,需補土修補,這是外觀模型的標準工序。' },
      { text: '用積木堆出車身', correct: false },
    ] },
];
let mAnswered = 0;
MAT_QUIZ.forEach((q, i) => {
  const box = document.createElement('div');
  box.style.marginBottom = '14px';
  document.getElementById('matQuiz').appendChild(box);
  Interactions.DiagnosisQuiz({
    container: box, question: `第 ${i + 1} 題　${q.question}`, options: q.options,
    onAnswer: () => { mAnswered++; if (mAnswered === MAT_QUIZ.length) { matDone = true; checkComplete(); } },
  });
});

/* ---- 外觀製作流程排序 ---- */
Interactions.SequencePuzzle({
  container: '#seqArea',
  title: '把外觀模型的製作步驟排回正確順序',
  items: [
    '🧽 以 PU 泡綿切割出車身的大致外型',
    '🪣 用補土填補表面的孔洞與縫隙',
    '✨ 對物體表面進行砂磨,使其平整',
    '🎨 為模型外觀上色',
    '💨 進行風洞測試,觀察空氣阻力',
    '✅ 確認設計,進入下一階段',
  ],
  onComplete: () => { seqDone = true; checkComplete(); },
});
