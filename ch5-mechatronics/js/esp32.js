/* ============================================================
 * 認識 ESP32 與實作 — 腳位互動圖 + 開發流程排序 + 檢核
 * ============================================================ */

/* 代表性腳位:[名稱, 類別色, 功能說明] */
const CAT = {
  pwr:  '#DC2626', gpio: '#16A34A', adc: '#2563EB', dac: '#7C3AED',
  touch:'#0891B2', serial:'#D97706', flash:'#64748B',
};
const PINS_L = [
  { n: '3V3', c: 'pwr',   d: '電源輸出腳位:提供 3.3V 電源給外部元件。' },
  { n: 'GND', c: 'pwr',   d: '接地腳位:電路的共同參考點,所有元件都要接到 GND。' },
  { n: 'GPIO36', c: 'adc', d: '類比輸入腳位:可用 analogRead() 讀取類比訊號(如感測器電壓)。注意:GPIO34-39 只能輸入,不能輸出。' },
  { n: 'GPIO25', c: 'dac', d: 'DAC 數位類比轉換腳位:能輸出真正的類比電壓,常用於音訊輸出。' },
  { n: 'GPIO4',  c: 'touch', d: '觸控感測腳位:內建電容觸控功能,人手碰觸即可感測,免接按鈕。' },
  { n: 'GPIO2',  c: 'gpio', d: '一般數位 I/O 腳位:可用 digitalWrite() 輸出高/低電位,常用來接 LED。' },
];
const PINS_R = [
  { n: '5V',   c: 'pwr',   d: '電源腳位:NodeMCU-32s 有穩壓 IC,插 USB 時可提供 5V 輸出。' },
  { n: 'GPIO1（TX）', c: 'serial', d: '序列埠 TX 腳位:程式燒錄與序列通訊使用。建議避免接其他元件,以免無法輸出序列訊息。' },
  { n: 'GPIO3（RX）', c: 'serial', d: '序列埠 RX 腳位:序列通訊接收使用,同樣建議保留。' },
  { n: 'GPIO6-11', c: 'flash', d: 'Flash 燒錄專用腳位:連接內部記憶體,不建議使用,以免造成無法燒錄。' },
  { n: 'GPIO21', c: 'gpio', d: 'I2C 的 SDA 腳位:可與 LCD、感測器等 I2C 介面裝置通訊。' },
  { n: 'EN',   c: 'pwr',   d: 'Enable 重置腳位:當 EN 為低電位時會重新啟動 ESP32(相當於重開機)。' },
];

(function buildBoard() {
  const board = document.getElementById('espBoard');
  const colL = document.createElement('div'); colL.className = 'pin-col';
  const chip = document.createElement('div'); chip.className = 'esp-chip'; chip.textContent = 'ESP32';
  const colR = document.createElement('div'); colR.className = 'pin-col';
  function addPin(col, p, right) {
    const el = document.createElement('div');
    el.className = 'pin' + (right ? ' pin-r' : '');
    el.textContent = p.n;
    el.style.background = CAT[p.c];
    el.addEventListener('click', () => {
      document.querySelectorAll('.pin.sel').forEach(x => x.classList.remove('sel'));
      el.classList.add('sel');
      document.getElementById('pinInfo').innerHTML = `<strong>${p.n}</strong>　${p.d}`;
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
    col.appendChild(el);
  }
  PINS_L.forEach(p => addPin(colL, p, false));
  PINS_R.forEach(p => addPin(colR, p, true));
  board.appendChild(colL); board.appendChild(chip); board.appendChild(colR);
})();

/* ---- 開發流程排序 ---- */
Interactions.SequencePuzzle({
  container: '#seqArea',
  title: '把 ESP32 在 Arduino IDE 的開發流程排回正確順序',
  items: [
    '① 下載並安裝 Arduino IDE',
    '② 安裝 USB 晶片驅動程式(CP210x 或 CH340)',
    '③ 在「開發板管理員」安裝 ESP32 相容性套件',
    '④ 在工具選單選擇開發板(如 Node32s)與序列埠',
    '⑤ 撰寫程式,編譯並上傳燒錄到 ESP32',
  ],
  onComplete: () => {},
});

/* ---- 檢核 ---- */
const QUIZ = [
  { question: 'ESP32 相較於一般 Arduino Uno,最大的優勢是什麼?',
    options: [
      { text: '內建 WiFi 與藍牙,適合物聯網專案', correct: true,
        explain: '正確。ESP32 把 WiFi 與藍牙做進晶片,還有雙核心 CPU,很適合需要連網的專案。' },
      { text: '完全不需要寫程式', correct: false },
      { text: '體積比房子還大', correct: false },
    ] },
  { question: 'ESP32 的 GPIO6～11 腳位,為什麼「不建議使用」?',
    options: [
      { text: '它們是 Flash 燒錄專用腳位,接其他元件可能造成無法燒錄', correct: true,
        explain: '正確。GPIO6-11 連接內部 Flash 記憶體,佔用會干擾程式燒錄。' },
      { text: '它們會漏電', correct: false },
      { text: '它們的電壓特別高', correct: false },
    ] },
  { question: '在「序列埠控制 LED」實作中,為什麼「閃爍模式」的程式碼要放在會持續執行的迴圈裡?',
    options: [
      { text: '因為閃爍需要「持續地」改變 LED 狀態,不是一次性設定', correct: true,
        explain: '正確。恆亮/恆滅是一次設定;閃爍要不斷切換狀態,所以必須放在持續執行的迴圈中。' },
      { text: '因為迴圈裡的程式比較漂亮', correct: false },
      { text: '因為這樣比較省電', correct: false },
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
        celebrateModule('ch5-esp32', '認識 ESP32 與實作');
        document.getElementById('nextBtn').classList.add('pop-in');
      }
    },
  });
});
