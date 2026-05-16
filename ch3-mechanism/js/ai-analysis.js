/* ============================================================
 * AI 輔助的機構結構分析 — 生成式設計探索器 + 檢核
 * ============================================================ */

const DESIGNS = [
  { name: '原始實心方案', weight: 100, save: 0,
    note: '最初的設計:實心支架,強度足夠,但用了最多材料、也最重。' },
  { name: 'AI 方案 A:挖除低應力區', weight: 68, save: 32,
    note: 'AI 分析應力分布,把幾乎不受力的中央區域挖空——重量立刻降下來。' },
  { name: 'AI 方案 B:桁架化', weight: 47, save: 53,
    note: 'AI 把材料重新分配成三角桁架,只在「力的路徑」上保留材料。' },
  { name: 'AI 方案 C:仿生有機結構', weight: 35, save: 65,
    note: '最終方案呈現出像骨骼、樹枝般的有機曲線——這正是生成式設計的招牌結果:在足夠強度下達到極致輕量化。' },
];
let dIdx = 0, explored = 1;
const canvas = document.getElementById('genCanvas');

function draw() {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = 240;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const x0 = 70, y0 = 50, bw = w - 150, bh = 140;   /* 設計空間 */
  /* 牆(左側固定) */
  ctx.fillStyle = '#475569';
  ctx.fillRect(x0 - 20, y0 - 10, 20, bh + 20);
  /* 設計空間外框 */
  ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.setLineDash([4,4]); ctx.lineWidth = 1;
  ctx.strokeRect(x0, y0, bw, bh); ctx.setLineDash([]);

  ctx.fillStyle = '#C026D3';
  if (dIdx === 0) {
    ctx.fillRect(x0, y0 + 20, bw - 20, bh - 40);
  } else if (dIdx === 1) {
    ctx.fillRect(x0, y0 + 20, bw - 20, bh - 40);
    ctx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(x0 + bw*0.32 + i*bw*0.18, y0 + bh/2, bw*0.07, bh*0.22, 0, 0, 7);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  } else if (dIdx === 2) {
    /* 桁架化 */
    const pts = [[x0,y0+25],[x0,y0+bh-25],[x0+bw*0.34,y0+bh/2],
                 [x0+bw*0.62,y0+25],[x0+bw*0.62,y0+bh-25],[x0+bw-22,y0+bh/2]];
    ctx.strokeStyle = '#C026D3'; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[0,2],[1,2],[2,3],[2,4],[3,4],[3,5],[4,5]].forEach(([a,b]) => {
      ctx.beginPath(); ctx.moveTo(pts[a][0],pts[a][1]); ctx.lineTo(pts[b][0],pts[b][1]); ctx.stroke();
    });
  } else {
    /* 仿生有機結構 */
    ctx.strokeStyle = '#C026D3'; ctx.lineWidth = 11; ctx.lineCap = 'round';
    const load = { x: x0 + bw - 22, y: y0 + bh/2 };
    [[y0+28],[y0+bh-28],[y0+bh/2]].forEach(([ay], i) => {
      ctx.lineWidth = 7 + i * 3;
      ctx.beginPath();
      ctx.moveTo(x0, ay);
      ctx.bezierCurveTo(x0+bw*0.4, ay + (i-1)*30, x0+bw*0.6, load.y + (i-1)*24, load.x, load.y);
      ctx.stroke();
    });
  }
  /* 載重箭頭 */
  const lx = x0 + bw - 22, ly = y0 + bh/2;
  ctx.fillStyle = '#E2E8F0';
  ctx.beginPath(); ctx.arc(lx, ly, 9, 0, 7); ctx.fill();
  ctx.strokeStyle = '#FBBF24'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + 40); ctx.stroke();
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath(); ctx.moveTo(lx, ly+48); ctx.lineTo(lx-6, ly+40); ctx.lineTo(lx+6, ly+40); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '12px "Noto Sans TC"'; ctx.textAlign = 'center';
  ctx.fillText('固定', x0 - 10, y0 + bh + 24);
  ctx.fillText('受力', lx, ly + 64);
}

function refresh() {
  const d = DESIGNS[dIdx];
  draw();
  document.getElementById('genStat').innerHTML = `
    <div><b>${d.weight}%</b><span>相對重量</span></div>
    <div><b style="color:var(--success)">−${d.save}%</b><span>材料省下</span></div>
    <div><b>✓</b><span>強度仍達標</span></div>`;
  document.getElementById('genNote').innerHTML = `<strong>${d.name}</strong>:${d.note}`;
}
document.getElementById('genBtn').addEventListener('click', () => {
  dIdx = (dIdx + 1) % DESIGNS.length;
  explored = Math.max(explored, dIdx + 1);
  if (typeof SoundFX !== 'undefined') SoundFX.success();
  refresh();
});
window.addEventListener('resize', draw);
refresh();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '「生成式設計(Generative Design)」的運作方式是什麼?',
    options: [
      { text: '使用者設定設計目標,軟體用演算法自動探索並生成多種方案', correct: true,
        explain: '正確。設定材料、載荷、約束等目標後,AI 會生成多種輕量化方案供選擇。' },
      { text: '由工程師一條線一條線手繪完成', correct: false },
      { text: '隨機產生與需求無關的圖形', correct: false },
    ] },
  { question: '使用 ChatGPT 等 LLM 協助工程學習時,最重要的態度是什麼?',
    options: [
      { text: '完全相信,AI 說的一定對', correct: false },
      { text: '保持批判性思維,把 AI 的回答當成「待查證的草稿」', correct: true,
        explain: '正確。LLM 可能產生「幻覺」(說錯話),專業領域尤其需要自己再查證。' },
      { text: '完全不要使用任何 AI 工具', correct: false },
    ] },
  { question: '關於 LLM 的限制,下列何者正確?',
    options: [
      { text: 'LLM 可以完全取代專業 CAE 軟體做精確的物理模擬', correct: false },
      { text: 'LLM 無法取代專業 CAE 軟體進行精確的物理模擬', correct: true,
        explain: '正確。LLM 擅長解釋與發想,但缺乏真實的物理模擬能力,精確分析仍須專業 CAE。' },
      { text: 'LLM 從來不會犯錯', correct: false },
    ] },
];
let answered = 0;
QUIZ.forEach((q, i) => {
  const box = document.createElement('div');
  box.style.marginBottom = '14px';
  document.getElementById('quizArea').appendChild(box);
  Interactions.DiagnosisQuiz({
    container: box, question: `第 ${i + 1} 題　${q.question}`, options: q.options,
    onAnswer: () => {
      answered++;
      if (answered === QUIZ.length) {
        celebrateModule('ch3-ai', 'AI 輔助的機構結構分析');
        showToast('🎉 恭喜!你已完成第 3 章所有模組', 'success');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
