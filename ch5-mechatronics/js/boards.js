/* ============================================================
 * 常見控制板 — 選板挑戰
 * ============================================================ */

const QUIZ = [
  { question: '你要做一個「會把感測到的溫度上傳到雲端」的智慧裝置,最適合用哪種控制板?',
    options: [
      { text: 'Arduino Uno', correct: false },
      { text: 'ESP32', correct: true,
        explain: '正確。要把資料上傳雲端需要連網,ESP32 內建 WiFi,最適合這類物聯網專案。' },
      { text: '都不行', correct: false },
    ] },
  { question: '課堂上要讓「完全沒寫過程式」的同學,最快做出一個會偵測搖晃的小裝置,適合用?',
    options: [
      { text: 'micro:bit——板上內建加速度計與感測器,可用積木式程式,門檻最低', correct: true,
        explain: '正確。micro:bit 為教育設計,內建感測器、支援積木式程式,最適合零基礎入門。' },
      { text: 'Raspberry Pi', correct: false },
      { text: 'ESP32', correct: false },
    ] },
  { question: '某專案需要「即時影像辨識」,要處理大量影像運算,較適合?',
    options: [
      { text: 'Arduino Uno', correct: false },
      { text: 'Raspberry Pi——是會跑作業系統的單板電腦,運算力較強', correct: true,
        explain: '正確。影像辨識、AI 等較重的運算,適合運算力強、能跑作業系統的 Raspberry Pi。' },
      { text: 'micro:bit', correct: false },
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
        celebrateModule('ch5-boards', '常見控制板');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
