/* ============================================================
 * 電路設計與模擬 — 檢核
 * ============================================================ */

const QUIZ = [
  { question: '為什麼在實際接線前,要先用軟體「模擬」電路?',
    options: [
      { text: '可在電腦中預先確認電路是否正常,減少實作時燒壞零件的風險', correct: true,
        explain: '正確。SPICE 模擬能先驗證電路,降低出錯與損壞的風險。' },
      { text: '因為法律規定一定要模擬', correct: false },
      { text: '為了讓電路圖比較好看', correct: false },
    ] },
  { question: '電路模擬程式常被統稱為什麼?',
    options: [
      { text: 'CNC', correct: false },
      { text: 'SPICE', correct: true,
        explain: '正確。SPICE 是專門用來模擬電路運作的程式。' },
      { text: 'PCB', correct: false },
    ] },
  { question: '「模擬 → 麵包板 → PCB」這個流程的用意是什麼?',
    options: [
      { text: '逐步驗證,把出錯與零件損壞的風險降到最低', correct: true,
        explain: '正確。先模擬、再用免銲的麵包板測試、最後才轉成正式的 PCB。' },
      { text: '故意讓流程變複雜', correct: false },
      { text: '因為麵包板比 PCB 更耐用', correct: false },
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
        celebrateModule('ch4-circuit', '電路設計與模擬');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
