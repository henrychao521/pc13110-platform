/* ============ 3-2 AR 齒輪機構實境體驗 ============ */

/* ---- model-viewer 載入狀態 ---- */
(() => {
  const mv = document.getElementById('gearViewer');
  const status = document.getElementById('mvStatus');
  if (!mv || !status) return;
  mv.addEventListener('load', () => {
    status.textContent = mv.canActivateAR
      ? '✓ 模型已載入——點右下角 AR 按鈕,把齒輪組擺上桌面!'
      : '✓ 模型已載入。此裝置不支援 AR,可拖曳旋轉觀察;改用 iPhone/iPad Safari 開啟即可體驗 AR。';
  });
  mv.addEventListener('error', () => {
    status.textContent = '✗ 模型載入失敗——請確認 assets/models/gear-train.glb 存在,並以網頁伺服器(而非 file://)開啟本頁。';
  });
})();

/* ---- 檢核 ---- */
const QUIZ = [
  { question: '本模型大齒輪 16 齒、小齒輪 8 齒。大齒輪轉一整圈,小齒輪轉幾圈?',
    options: [
      { text: '2 圈——由 n₁z₁ = n₂z₂,齒數一半、轉速兩倍', correct: true,
        explain: '正確。16×1 = 8×n₂,得 n₂ = 2。齒數比就是轉速比的倒數。' },
      { text: '半圈——齒輪小,轉得慢', correct: false },
      { text: '1 圈——嚙合的齒輪轉速一定相同', correct: false },
    ] },
  { question: '外嚙合的兩個齒輪(像本模型這樣齒對齒咬合),轉向有什麼關係?',
    options: [
      { text: '轉向相同', correct: false },
      { text: '轉向相反;若需要同向,可在中間加一顆惰輪', correct: true,
        explain: '正確。外嚙合必反向——觀察模型:鋼灰輪逆時針、黃銅輪順時針。' },
      { text: '沒有固定關係,看馬達裝在哪邊', correct: false },
    ] },
  { question: '想在 iPhone 的 Safari 用 AR Quick Look 把模型擺上桌,網頁要提供哪種 3D 格式?',
    options: [
      { text: 'STL——3D 列印不是都用這個?', correct: false },
      { text: 'USDZ;GLB 則用於網頁 3D 檢視與 Android AR', correct: true,
        explain: '正確。iOS 的 AR Quick Look 只吃 USDZ;同一份幾何輸出兩種格式即可全平台通用。' },
      { text: 'JPG 全景照片', correct: false },
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
        celebrateModule('ch3-ar', 'AR 齒輪機構實境體驗');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
