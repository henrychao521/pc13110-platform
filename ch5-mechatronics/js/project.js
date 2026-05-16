/* ============================================================
 * 機電整合統整專題 — 系統規劃器
 * ============================================================ */

const STORE = 'pc13110_ch5_project';
const SENSORS = ['💡 光感測器', '🌡️ 溫濕度感測器', '📏 距離感測器', '👆 觸控／按鈕', '🔊 聲音感測器'];
const BOARDS  = ['Arduino Uno', 'micro:bit', 'ESP32'];
const ACTUATORS = ['💡 LED 燈', '⚙️ 伺服馬達', '🔔 蜂鳴器', '🔄 直流馬達'];

let state = { topic: '', sensor: '', board: '', actuator: '', desc: '' };
try { state = Object.assign(state, JSON.parse(localStorage.getItem(STORE)) || {}); } catch (e) {}

function persist() { localStorage.setItem(STORE, JSON.stringify(state)); refresh(); }

function buildCol(id, options, key) {
  const col = document.getElementById(id);
  options.forEach(o => {
    const b = document.createElement('button');
    b.className = 'opt' + (state[key] === o ? ' on' : '');
    b.textContent = o;
    b.addEventListener('click', () => {
      state[key] = o;
      col.querySelectorAll('.opt').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      persist();
    });
    col.appendChild(b);
  });
}
buildCol('colSensor', SENSORS, 'sensor');
buildCol('colBoard', BOARDS, 'board');
buildCol('colActuator', ACTUATORS, 'actuator');

const topicIn = document.getElementById('topicIn');
const descIn = document.getElementById('descIn');
topicIn.value = state.topic || '';
descIn.value = state.desc || '';
topicIn.addEventListener('input', () => { state.topic = topicIn.value.trim(); persist(); });
descIn.addEventListener('input', () => { state.desc = descIn.value.trim(); persist(); });

function refresh() {
  /* 系統方塊圖 */
  const diag = document.getElementById('blockDiag');
  const s = state.sensor || '?', b = state.board || '?', a = state.actuator || '?';
  diag.innerHTML = `
    <div class="blk">${s}<small>感知 輸入</small></div>
    <div class="blk-arrow">→</div>
    <div class="blk">${b}<small>處理 運算</small></div>
    <div class="blk-arrow">→</div>
    <div class="blk">${a}<small>動作 輸出</small></div>`;
  /* 完成判斷 */
  const ok = state.topic && state.sensor && state.board && state.actuator && state.desc && state.desc.length >= 8;
  document.getElementById('doneBtn').disabled = !ok;
  document.getElementById('projHint').textContent = ok
    ? '✓ 規劃完整,可以按「完成專題規劃」了!'
    : '請填入主題、選好三個元件,並寫下運作方式描述(至少 8 個字)。';
}
refresh();

document.getElementById('doneBtn').addEventListener('click', () => {
  const b = document.getElementById('doneBtn');
  celebrateModule('ch5-project', '機電整合統整專題');
  showToast('🎉 恭喜!你已完成第 5 章與全部五章課程!', 'success');
  b.textContent = '✓ 已完成'; b.disabled = true;
  document.getElementById('nextBtn').classList.add('pop-in');
});
document.getElementById('printBtn').addEventListener('click', () => window.print());
