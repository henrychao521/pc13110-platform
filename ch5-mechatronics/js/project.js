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

/* ============================================================
 * 資料流視覺化 — 感測 → 處理 → 致動 + 訊號類型 + 動畫流動點
 * ============================================================ */
(function flowSim() {
  const svg = document.getElementById('flowSvg');
  const leg = document.getElementById('flowLegend');
  if (!svg || !leg) return;

  /* 感測器 → 控制板:輸入訊號類型 */
  const SENSOR_SIG = {
    '💡 光感測器':   { type:'類比 0–3.3V', code:'analogRead()', color:'#22D3EE' },
    '🌡️ 溫濕度感測器':{ type:'數位通訊(1-Wire)', code:'dht.read()',     color:'#A78BFA' },
    '📏 距離感測器': { type:'數位(回波脈寬)', code:'pulseIn()',     color:'#FBBF24' },
    '👆 觸控／按鈕': { type:'數位 HIGH/LOW',  code:'digitalRead()',   color:'#FBBF24' },
    '🔊 聲音感測器': { type:'類比 0–3.3V',    code:'analogRead()',    color:'#22D3EE' },
  };
  /* 控制板 → 致動器:輸出訊號類型 */
  const ACTUATOR_SIG = {
    '💡 LED 燈':     { type:'數位 HIGH/LOW(或 PWM 調亮度)', code:'digitalWrite()',  color:'#F87171' },
    '⚙️ 伺服馬達':   { type:'PWM(1–2ms 脈寬)',           code:'servo.write()',   color:'#34D399' },
    '🔔 蜂鳴器':     { type:'PWM 頻率(產生音高)',         code:'tone()',          color:'#F472B6' },
    '🔄 直流馬達':   { type:'PWM(透過驅動器調速)',         code:'analogWrite()',   color:'#F59E0B' },
  };

  function draw() {
    const s = (typeof state !== 'undefined' && state.sensor) || '';
    const b = (typeof state !== 'undefined' && state.board) || '';
    const a = (typeof state !== 'undefined' && state.actuator) || '';
    const ss = SENSOR_SIG[s];
    const as = ACTUATOR_SIG[a];

    const x1 = 80,  x2 = 360, x3 = 640;
    const y = 100;
    const r = 50;
    function box(cx, label, sub, color) {
      const c = color || '#0EA5E9';
      const lbl = label || '?';
      return `<g>
        <rect x="${cx-78}" y="${y-40}" width="156" height="80" rx="10" fill="#fff" stroke="${c}" stroke-width="3"/>
        <text x="${cx}" y="${y-8}" text-anchor="middle" font-size="14" font-weight="700" fill="#1F2937">${lbl}</text>
        <text x="${cx}" y="${y+15}" text-anchor="middle" font-size="11" fill="#6B7280">${sub}</text>
      </g>`;
    }
    function arrow(ax, bx, sig, code) {
      const mx = (ax + bx) / 2;
      const has = !!sig;
      const color = has ? sig.color : '#94A3B8';
      return `<g>
        <path id="${ax}_${bx}_arr" d="M${ax} ${y} L${bx} ${y}" stroke="${color}" stroke-width="3" fill="none"/>
        <polygon points="${bx-8},${y-6} ${bx},${y} ${bx-8},${y+6}" fill="${color}"/>
        <rect x="${mx-70}" y="${y-32}" width="140" height="22" rx="6" fill="${has?'#fff':'#E5E7EB'}" stroke="${color}" stroke-width="1.5"/>
        <text x="${mx}" y="${y-17}" text-anchor="middle" font-size="11" font-weight="700" fill="${has?'#1F2937':'#6B7280'}">${has?sig.type:'(待選擇)'}</text>
        ${has ? `<text x="${mx}" y="${y+25}" text-anchor="middle" font-size="10" font-family="JetBrains Mono" fill="#6B7280">${sig.code}</text>` : ''}
      </g>`;
    }

    svg.innerHTML = `
      ${arrow(x1+78, x2-78, ss, ss && ss.code)}
      ${arrow(x2+78, x3-78, as, as && as.code)}
      ${box(x1, s || '?', '感知 / 輸入', '#22D3EE')}
      ${box(x2, b || '?', '處理 / 控制板', '#0EA5E9')}
      ${box(x3, a || '?', '動作 / 輸出', '#34D399')}
    `;

    /* 動畫流動點:依照已選元件加 dots */
    activeDotsGroups = [];
    if (ss) activeDotsGroups.push(makeDots(`${x1+78}_${x2-78}_arr`, 4));
    if (as) activeDotsGroups.push(makeDots(`${x2+78}_${x3-78}_arr`, 4));

    /* 圖例 */
    if (ss && as) {
      leg.innerHTML = `📊 <strong>資料流</strong>:<br>
        ① <strong>${s}</strong> 用 <code>${ss.code}</code> 把<strong>${ss.type}</strong>的訊號送進<strong>${b||'控制板'}</strong>;<br>
        ② <strong>${b||'控制板'}</strong> 經程式判斷後,用 <code>${as.code}</code> 輸出<strong>${as.type}</strong>給 <strong>${a}</strong>。`;
    } else if (ss || as) {
      leg.innerHTML = '📊 <strong>資料流</strong>:已標出部分訊號類型。三個元件都選好後,會看到完整的訊號類型與程式 API。';
    } else {
      leg.innerHTML = '📊 <strong>資料流</strong>:選好三個元件後,這裡會即時顯示訊號如何從感測器流到控制板、再流到致動器,並標示<strong>訊號類型</strong>(類比/數位/PWM)。';
    }
  }

  let activeDotsGroups = [];
  function makeDots(pathId, n) {
    const dots = [];
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('r', 3.5);
      c.setAttribute('fill', '#F59E0B');
      c.setAttribute('stroke', '#92400E');
      c.setAttribute('stroke-width', '0.5');
      svg.appendChild(c);
      dots.push({ el: c, offset: i / n });
    }
    return { dots, pathId };
  }
  function tick() {
    for (const g of activeDotsGroups) {
      const p = svg.querySelector('#' + g.pathId);
      if (!p) continue;
      const L = p.getTotalLength();
      for (const d of g.dots) {
        d.offset = (d.offset + 0.012) % 1;
        const pt = p.getPointAtLength(d.offset * L);
        d.el.setAttribute('cx', pt.x);
        d.el.setAttribute('cy', pt.y);
      }
    }
    requestAnimationFrame(tick);
  }
  /* 攔截原本的 refresh:在它跑完後重畫 SVG */
  const origRefresh = window.refresh;
  if (typeof origRefresh === 'function') {
    window.refresh = function() { origRefresh(); draw(); };
  } else {
    /* 監聽選項點擊 */
    document.querySelectorAll('.pick-col .opt').forEach(el => el.addEventListener('click', () => setTimeout(draw, 30)));
  }
  draw();
  tick();
})();
