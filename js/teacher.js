/* ============================================================
 * PC13110 工程設計學習平台 — 教師後台
 * 4 個分頁:課程總覽 / 作業指派 / 學生進度 / 備課資源
 * 純前端,無伺服器;進度以「學習紀錄代碼」由學生匯出、教師貼入彙整。
 * ============================================================ */

/* ---- 各模組備課重點(教學目標取自 MODULES.obj,建議節數取自 MODULES.hours) ---- */
const TEACH_NOTES = {
  'ch1-trends':     { mis:'學生易把「科技新聞標題」當成趨勢本身,忽略背後的數據與時間尺度。', dis:'四大趨勢中,哪一項最可能影響你十年後的工作?為什麼?', as:'能用圖表數據(而非印象)說明一項趨勢的變化方向。' },
  'ch1-process':    { mis:'誤以為工程設計流程是「一條直線」,忽略「測試→改進」的回饋迴圈。', dis:'若原型測試失敗,應該回到哪一個階段?有沒有標準答案?', as:'能說出七階段順序,並指出流程的迭代特性。' },
  'ch1-thinking':   { mis:'把腦力激盪當成「想到什麼說什麼」,忽略 SCAMPER 等工具的系統性。', dis:'六頂思考帽中,你最不習慣戴哪一頂?團隊為何需要每頂帽子?', as:'能針對同一題目,分別用兩種思考法產出不同面向的構想。' },
  'ch1-planner':    { mis:'把甘特圖當成「把事情列出來」,忽略任務之間的先後相依與要徑。', dis:'專題時程被壓縮時,哪些任務可以平行進行、哪些不行?', as:'能畫出含相依關係的甘特圖,並標出關鍵路徑。' },
  'ch1-career':     { mis:'認為工程倫理只是「不要違法」,忽略合法但有爭議的灰色地帶。', dis:'情境題中,若你是工程師,會如何在期限壓力與安全之間取捨?', as:'能對倫理情境提出立場並說明理由,而非只給對／錯。' },
  'ch2-cad':        { mis:'以為 CAD 只是「畫得比較漂亮」,忽略參數化修改與可重用的價值。', dis:'哪些情況下手繪反而比 CAD 更適合?', as:'能舉例說明參數化設計如何縮短修改時間。' },
  'ch2-prototype':  { mis:'認為原型一定要做得很精緻,忽略「低保真原型」快速驗證的目的。', dis:'紙板原型和 3D 列印原型,分別適合驗證哪一種問題?', as:'能依驗證目的選擇合適的原型材料與精度。' },
  'ch2-modeling':   { mis:'把程式化建模當成寫程式作業,忽略它本質是「用參數描述幾何」。', dis:'改一個參數就能改變整個模型,這對量產設計有什麼好處?', as:'能用參數產生指定尺寸的模型。' },
  'ch2-ortho':      { mis:'看三視圖時只比對輪廓,忽略「高度」資訊只能從前／側視圖得知。', dis:'為什麼「前視圖＋側視圖」無法唯一決定上視圖?', as:'能在立體模型與三視圖之間正確互換。' },
  'ch2-print3d':    { mis:'以為列印速度越快越好,忽略層高、填充率對強度與品質的取捨。', dis:'懸空結構為什麼需要支撐?如何用擺放方向減少支撐?', as:'能依需求設定層高與填充率並說明理由。' },
  'ch2-laser':      { mis:'認為雷射功率越大越好,忽略功率／速度需依材料與厚度搭配。', dis:'切割與雕刻所用的雷射參數有何不同?', as:'能為指定材料與厚度選出合理的功率與速度。' },
  'ch2-cnc':        { mis:'忽略進給速度過快會斷刀、過慢會燒料,兩者需要平衡。', dis:'順銑與逆銑的差別會如何影響加工面品質?', as:'能規劃刀具路徑並判斷斷刀風險。' },
  'ch2-emerging':   { mis:'以為新設備一定比舊設備好,忽略成本、材料與適用情境。', dis:'金屬列印昂貴,哪些產品才值得用它來製造?', as:'能比較兩種新興設備的適用時機。' },
  'ch2-sim':        { mis:'把模擬結果當成「絕對正確」,忽略邊界條件與簡化假設的影響。', dis:'懸臂梁模擬中,改變施力位置會如何改變最大應力?', as:'能解讀模擬結果並指出其假設限制。' },
  'ch3-statics':    { mis:'畫自由體圖時漏掉反力或方向標錯,導致力平衡算錯。', dis:'移動載重位置,兩端反力會怎麼變?反力總和為何不變?', as:'能正確繪製自由體圖並算出支承反力。' },
  'ch3-truss':      { mis:'分不清桿件受張力或壓力,或誤判桁架是否靜定。', dis:'同樣載重下,三角形桁架為何比四邊形穩定?', as:'能判斷靜定並解出桿件內力的張／壓。' },
  'ch3-fea':        { mis:'以為應力雲圖「紅色就是會壞」,忽略需與材料許可應力比較。', dis:'L 型支架的內轉角為何容易應力集中?如何改善?', as:'能從雲圖找出應力集中位置並提出改善方向。' },
  'ch3-mechanism':  { mis:'混淆「機構」與「結構」——機構是為傳遞運動,結構是為承載。', dis:'曲柄滑塊把旋轉變成往復,生活中哪些產品用到它?', as:'能辨識四種機構並說明其運動轉換方式。' },
  'ch3-ai':         { mis:'以為生成式設計會「自動給最佳解」,忽略需由人設定目標與限制。', dis:'AI 生成的造型很奇特,工程師該如何驗證它真的能用?', as:'能說明生成式設計的輸入(目標、限制)與人的角色。' },
  'ch4-components': { mis:'背電阻色碼卻不理解色環順序與容差環的意義。', dis:'電容和電阻在電路中扮演的角色有何不同?', as:'能讀出電阻色碼並辨識常見電子元件。' },
  'ch4-tools':      { mis:'麵包板接線時搞錯「同排相通」的規則,造成短路或斷路。', dis:'三用電表量電壓和量電流,接法為何不同?', as:'能正確在麵包板佈線並選對量測檔位。' },
  'ch4-circuit':    { mis:'分壓電路中,誤以為輸出電壓與負載大小無關。', dis:'分壓電阻的比例改變,輸出電壓會如何變化?', as:'能設計分壓電路並用模擬驗證電壓值。' },
  'ch4-logic':      { mis:'混淆 AND 與 OR 的真值表,或忽略感測器需要的偏壓電路。', dis:'光感應路燈為什麼要用「比較」而不是直接接燈?', as:'能設計指定邏輯並接出可動作的感應電路。' },
  'ch5-boards':     { mis:'以為控制板「越貴越好」,忽略專案需求(腳位、無線、功耗)的差異。', dis:'要做一台藍牙遙控車,你會選哪一塊控制板?為什麼?', as:'能依專案需求比較並選擇控制板。' },
  'ch5-peripherals':{ mis:'混淆感測器(輸入)與致動器(輸出),或忽略伺服馬達的訊號需求。', dis:'序列埠監控視窗對於程式除錯有什麼幫助?', as:'能區分輸入／輸出元件並讀懂序列埠輸出。' },
  'ch5-esp32':      { mis:'以為任何腳位都能隨意使用,忽略部分腳位有特殊用途或開機限制。', dis:'ESP32 內建 Wi-Fi／藍牙,這為專題設計帶來什麼可能?', as:'能對照腳位圖完成接線並燒錄程式。' },
  'ch5-project':    { mis:'專題只想著「做出酷東西」,忽略「感測—控制—致動」的完整迴路。', dis:'你的專題若少了感測器,整個系統會變成什麼樣?', as:'能規劃一個含感測、控制、致動三要素的完整系統。' },
};

const $ = sel => document.querySelector(sel);
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function chColor(ch) { return `var(${CHAPTER_INFO[ch].cvar})`; }
function modulesOf(ch) { return MODULES.filter(m => m.ch === ch); }
const CH_ORDER = ['ch1', 'ch2', 'ch3', 'ch4', 'ch5'];

/* ============================================================
 * 分頁切換
 * ============================================================ */
(function initTabs() {
  document.querySelectorAll('.tb-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      document.querySelectorAll('.tb-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tb-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      $('#panel-' + tab.dataset.tab).classList.add('active');
    });
  });
})();

/* ============================================================
 * Tab 1 — 課程總覽
 * ============================================================ */
(function renderOverview() {
  const totalHours = MODULES.reduce((s, m) => s + m.hours, 0);
  let html = `
    <div class="tb-summary">
      <div class="tb-stat"><div class="tb-stat-n">5</div><div class="tb-stat-l">章節主題</div></div>
      <div class="tb-stat"><div class="tb-stat-n">${MODULES.length}</div><div class="tb-stat-l">互動模組</div></div>
      <div class="tb-stat"><div class="tb-stat-n">約 ${totalHours}</div><div class="tb-stat-l">建議授課節數</div></div>
      <div class="tb-stat"><div class="tb-stat-n">2</div><div class="tb-stat-l">學分・一學期</div></div>
    </div>
    <p class="tb-note">
      下表為各模組對應的課本節次、學習重點與建議節數,供學期授課進度規劃參考。
      建議節數為單節 50 分鐘的概估,實際可依班級狀況與設備調整。
    </p>`;

  CH_ORDER.forEach(ch => {
    const info = CHAPTER_INFO[ch];
    const mods = modulesOf(ch);
    const chHours = mods.reduce((s, m) => s + m.hours, 0);
    html += `
      <div class="tb-ch-block">
        <div class="tb-ch-head" style="background:${chColor(ch)}">
          <span class="tb-ch-tag">${ch.toUpperCase()}</span>
          <span class="tb-ch-name">${info.name}</span>
          <span class="tb-ch-meta">${mods.length} 模組・約 ${chHours} 節</span>
          <a class="tb-ch-link" href="${info.hub}" target="_blank">開啟章節 ↗</a>
        </div>
        <table class="tb-table">
          <thead><tr><th style="width:74px">課本</th><th style="width:38%">模組</th><th>學習重點</th><th style="width:64px">節數</th></tr></thead>
          <tbody>
            ${mods.map(m => `
              <tr>
                <td><span class="tb-pill">${m.tag}</span></td>
                <td><a class="tb-mod-link" href="${m.link}" target="_blank">${m.icon} ${esc(m.title)}</a></td>
                <td class="tb-obj">${esc(m.obj)}</td>
                <td class="tb-hr">${m.hours}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  });
  $('#panel-overview').innerHTML = html;
})();

/* ============================================================
 * Tab 2 — 作業指派產生器
 * ============================================================ */
(function renderAssign() {
  let html = `
    <div class="tb-grid2">
      <div class="tb-card">
        <h3>① 選擇要指派的模組</h3>
        <div class="tb-assign-fields">
          <label>作業名稱<input type="text" id="aTitle" placeholder="例:第 3 章 結構分析作業" maxlength="40"></label>
          <label>繳交期限<input type="text" id="aDue" placeholder="例:5/30(五)前" maxlength="30"></label>
        </div>
        <div class="tb-pick" id="aPick"></div>
      </div>
      <div class="tb-card">
        <h3>② 產生作業連結與 QR Code</h3>
        <div id="aResult" class="tb-empty">勾選左側模組後,連結與 QR Code 會顯示在這裡。</div>
      </div>
    </div>`;
  $('#panel-assign').innerHTML = html;

  /* 模組勾選清單 */
  const pick = $('#aPick');
  CH_ORDER.forEach(ch => {
    const info = CHAPTER_INFO[ch];
    const mods = modulesOf(ch);
    const grp = document.createElement('div');
    grp.className = 'tb-pick-grp';
    grp.innerHTML = `
      <div class="tb-pick-head">
        <span class="tb-dot" style="background:${chColor(ch)}"></span>
        <strong>${ch.toUpperCase()}　${info.short}</strong>
        <button class="tb-mini" data-ch="${ch}">全選</button>
      </div>
      <div class="tb-pick-list">
        ${mods.map(m => `
          <label class="tb-check">
            <input type="checkbox" value="${m.id}">
            <span>${m.icon} ${esc(m.title)}</span>
          </label>`).join('')}
      </div>`;
    pick.appendChild(grp);
  });

  function selectedIds() {
    return [...pick.querySelectorAll('input:checked')].map(i => i.value);
  }
  function update() {
    const ids = selectedIds();
    const box = $('#aResult');
    if (!ids.length) {
      box.className = 'tb-empty';
      box.textContent = '勾選左側模組後,連結與 QR Code 會顯示在這裡。';
      return;
    }
    const code = encodeAssign(ids);
    const url = new URL('index.html?a=' + code, location.href).href;
    const title = ($('#aTitle').value || '').trim();
    const due = ($('#aDue').value || '').trim();

    /* QR Code(qrcode-generator,MIT) */
    let qrSvg = '';
    try {
      const qr = qrcode(0, 'M');
      qr.addData(url);
      qr.make();
      qrSvg = qr.createSvgTag(4, 8);
    } catch (e) {
      qrSvg = '<p style="color:var(--danger);font-size:12px">QR 產生失敗(連結過長)</p>';
    }

    box.className = '';
    box.innerHTML = `
      <div class="tb-assign-out">
        <div class="tb-qr">${qrSvg}</div>
        <div class="tb-assign-info">
          <div class="tb-out-row">
            <span class="tb-out-label">已選 ${ids.length} 個模組</span>
            ${title ? `<span class="tb-out-label" style="background:var(--brand-light);color:var(--brand-dark)">${esc(title)}</span>` : ''}
            ${due ? `<span class="tb-out-label" style="background:var(--warning-light);color:#92400e">⏰ ${esc(due)}</span>` : ''}
          </div>
          <textarea class="tb-url" readonly rows="3">${esc(url)}</textarea>
          <div class="tb-out-btns">
            <button class="btn btn-primary btn-sm" id="aCopy">📋 複製連結</button>
            <a class="btn btn-ghost btn-sm" href="${esc(url)}" target="_blank">預覽作業頁</a>
            <button class="btn btn-ghost btn-sm" id="aPrint">🖨 列印作業單</button>
          </div>
        </div>
      </div>
      <ul class="tb-assign-mods">
        ${ids.map(id => { const m = moduleById(id); return `<li><span class="tb-pill">${m.tag}</span>${m.icon} ${esc(m.title)}</li>`; }).join('')}
      </ul>
      <p class="tb-tip">學生掃描 QR Code 或開啟連結後,首頁會出現「老師指派的作業」橫幅,點選即可逐一完成。</p>`;

    $('#aCopy').addEventListener('click', () => {
      const ta = box.querySelector('.tb-url');
      ta.select();
      navigator.clipboard.writeText(url).then(
        () => showToast('已複製作業連結', 'success'),
        () => { document.execCommand('copy'); showToast('已複製作業連結', 'success'); }
      );
    });
    $('#aPrint').addEventListener('click', () => printAssignment(ids, title, due, url, qrSvg));
  }

  pick.addEventListener('change', update);
  pick.querySelectorAll('.tb-mini').forEach(btn => {
    btn.addEventListener('click', () => {
      const boxes = [...pick.querySelectorAll(`input[value^="${btn.dataset.ch}-"]`)];
      const allOn = boxes.every(b => b.checked);
      boxes.forEach(b => b.checked = !allOn);
      btn.textContent = allOn ? '全選' : '取消';
      update();
    });
  });
  $('#aTitle').addEventListener('input', update);
  $('#aDue').addEventListener('input', update);

  /* 列印作業單(另開視窗) */
  function printAssignment(ids, title, due, url, qrSvg) {
    const w = window.open('', '_blank');
    if (!w) { showToast('瀏覽器封鎖了彈出視窗', 'warning'); return; }
    const rows = ids.map((id, i) => {
      const m = moduleById(id);
      return `<tr><td>${i + 1}</td><td>${m.tag}</td><td>${m.icon} ${esc(m.title)}</td><td>${esc(m.obj)}</td><td class="chk"></td></tr>`;
    }).join('');
    w.document.write(`<!DOCTYPE html><html lang="zh-Hant"><head><meta charset="UTF-8">
      <title>${esc(title || 'PC13110 學習作業單')}</title>
      <style>
        body{font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;color:#0f172a;padding:32px;max-width:760px;margin:0 auto}
        h1{font-size:21px;margin:0 0 4px} .sub{color:#64748b;font-size:13px;margin-bottom:16px}
        .meta{display:flex;gap:24px;font-size:14px;border:1px solid #cbd5e1;border-radius:8px;padding:12px 16px;margin-bottom:16px}
        .meta b{color:#1d4ed8}
        table{width:100%;border-collapse:collapse;font-size:13px}
        th,td{border:1px solid #cbd5e1;padding:8px 10px;text-align:left;vertical-align:top}
        th{background:#f1f5f9} td.chk{width:54px;text-align:center}
        .qr{float:right;margin:0 0 8px 16px} .qr svg{width:118px;height:118px}
        .link{font-size:11px;color:#475569;word-break:break-all;margin-top:8px}
        .name{margin-top:22px;font-size:14px} .name span{display:inline-block;border-bottom:1px solid #0f172a;width:160px}
        @media print{body{padding:0}}
      </style></head><body>
      <div class="qr">${qrSvg}</div>
      <h1>${esc(title || 'PC13110 工程設計學習平台 — 學習作業單')}</h1>
      <div class="sub">普通型高中生活科技 PC13110・趙珩宇 編</div>
      <div class="meta"><div>繳交期限:<b>${esc(due || '________')}</b></div><div>指派模組:<b>${ids.length} 個</b></div></div>
      <p style="font-size:13px;color:#334155">請以手機掃描右上 QR Code,或開啟下方連結進入平台,完成下列模組後在最右欄打勾。</p>
      <table><thead><tr><th>#</th><th>課本</th><th>模組名稱</th><th>學習重點</th><th>完成</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="link">連結:${esc(url)}</div>
      <div class="name">學生姓名／座號:<span></span>　　完成日期:<span></span></div>
      <script>window.onload=function(){window.print();}<\/script>
      </body></html>`);
    w.document.close();
  }
})();

/* ============================================================
 * Tab 3 — 學生進度彙整
 * ============================================================ */
(function renderProgress() {
  $('#panel-progress').innerHTML = `
    <div class="tb-card">
      <h3>① 貼入學生的學習紀錄代碼</h3>
      <p class="tb-note" style="margin:0 0 10px">
        請學生在平台首頁點「📤 匯出學習紀錄」,把代碼(<code>PC13110~</code> 開頭)交給你。
        每位學生一行,可一次貼入多位。
      </p>
      <textarea id="pInput" class="tb-codes" rows="6" placeholder="PC13110~eyJ2Ijox...&#10;PC13110~eyJ2Ijox..."></textarea>
      <div class="tb-out-btns">
        <button class="btn btn-primary btn-sm" id="pAnalyze">📊 彙整分析</button>
        <button class="btn btn-ghost btn-sm" id="pLoadLocal">讀取本機進度</button>
        <button class="btn btn-ghost btn-sm" id="pClear">清空</button>
      </div>
    </div>
    <div id="pResult"></div>`;

  const input = $('#pInput');

  $('#pLoadLocal').addEventListener('click', () => {
    const code = exportProgressCode('(本機示範)');
    input.value = (input.value.trim() ? input.value.trim() + '\n' : '') + code;
    showToast('已加入本機進度', 'success');
  });
  $('#pClear').addEventListener('click', () => { input.value = ''; $('#pResult').innerHTML = ''; });
  $('#pAnalyze').addEventListener('click', analyze);

  function analyze() {
    const lines = input.value.split(/[\r\n]+/).map(s => s.trim()).filter(Boolean);
    if (!lines.length) { showToast('請先貼入學習紀錄代碼', 'warning'); return; }
    const students = [];
    let bad = 0;
    lines.forEach(line => {
      const p = parseProgressCode(line);
      if (p) students.push(p); else bad++;
    });
    if (!students.length) {
      $('#pResult').innerHTML = `<div class="tb-card" style="border-color:var(--danger)">
        <p style="color:var(--danger);margin:0">無法解析任何代碼,請確認是否完整複製(以 <code>PC13110~</code> 開頭)。</p></div>`;
      return;
    }
    if (typeof SoundFX !== 'undefined') SoundFX.success();
    renderResult(students, bad);
  }

  function renderResult(students, bad) {
    const total = MODULES.length;
    /* 班級統計 */
    const pcts = students.map(s => Math.round(s.done.length / total * 100));
    const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / students.length);
    const fullCount = pcts.filter(p => p === 100).length;
    /* 模組完成熱度 */
    const heat = {};
    MODULES.forEach(m => heat[m.id] = 0);
    students.forEach(s => s.done.forEach(id => { if (heat[id] != null) heat[id]++; }));

    let html = `
      <div class="tb-summary">
        <div class="tb-stat"><div class="tb-stat-n">${students.length}</div><div class="tb-stat-l">已彙整人數</div></div>
        <div class="tb-stat"><div class="tb-stat-n">${avg}%</div><div class="tb-stat-l">平均完成率</div></div>
        <div class="tb-stat"><div class="tb-stat-n">${fullCount}</div><div class="tb-stat-l">全部完成人數</div></div>
        <div class="tb-stat"><div class="tb-stat-n">${total}</div><div class="tb-stat-l">模組總數</div></div>
      </div>
      ${bad ? `<p class="tb-tip" style="color:var(--danger)">⚠ 有 ${bad} 筆代碼無法解析,已略過。</p>` : ''}`;

    /* 學生表 */
    html += `<div class="tb-card"><h3>② 各學生完成情形</h3>
      <table class="tb-table tb-stu">
        <thead><tr><th>學生</th><th style="width:34%">整體完成度</th>
          ${CH_ORDER.map(ch => `<th>${ch.toUpperCase()}</th>`).join('')}
          <th>平均分</th></tr></thead><tbody>`;
    students
      .map((s, i) => ({ s, pct: pcts[i] }))
      .sort((a, b) => b.pct - a.pct)
      .forEach(({ s, pct }) => {
        const doneSet = new Set(s.done);
        const chCells = CH_ORDER.map(ch => {
          const mods = modulesOf(ch);
          const d = mods.filter(m => doneSet.has(m.id)).length;
          const full = d === mods.length;
          return `<td class="tb-cc ${full ? 'full' : d ? 'part' : 'none'}">${d}/${mods.length}</td>`;
        }).join('');
        const scoreVals = Object.values(s.scores);
        const avgScore = scoreVals.length ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : '—';
        html += `<tr>
          <td class="tb-stu-name">${esc(s.name)}</td>
          <td><div class="tb-rowbar"><span style="width:${pct}%;background:${pct === 100 ? 'var(--success)' : 'var(--brand)'}"></span></div>
            <span class="tb-rowpct">${pct}%</span></td>
          ${chCells}
          <td class="tb-hr">${avgScore}</td>
        </tr>`;
      });
    html += `</tbody></table></div>`;

    /* 模組完成熱度 */
    html += `<div class="tb-card"><h3>③ 各模組完成熱度</h3>
      <p class="tb-note" style="margin:0 0 12px">顏色越深表示完成人數越多;偏淺的模組可在課堂多加引導。</p>`;
    CH_ORDER.forEach(ch => {
      html += `<div class="tb-heat-row">
        <div class="tb-heat-ch" style="color:${chColor(ch)}">${ch.toUpperCase()}</div>
        <div class="tb-heat-cells">
          ${modulesOf(ch).map(m => {
            const n = heat[m.id], ratio = students.length ? n / students.length : 0;
            const bg = ratio === 0 ? 'var(--bg-soft)' : `color-mix(in srgb, ${chColor(ch)} ${Math.round(20 + ratio * 80)}%, #fff)`;
            const fg = ratio > 0.55 ? '#fff' : 'var(--text-soft)';
            return `<div class="tb-heat-cell" style="background:${bg};color:${fg}" title="${esc(m.title)}:${n}/${students.length} 人完成">
              <span class="thc-ic">${m.icon}</span><span class="thc-n">${n}</span></div>`;
          }).join('')}
        </div>
      </div>`;
    });
    html += `</div>`;

    $('#pResult').innerHTML = html;
    $('#pResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
})();

/* ============================================================
 * Tab 4 — 備課資源
 * ============================================================ */
(function renderNotes() {
  let html = `<p class="tb-note">
    每個模組的備課重點:教學目標、建議節數、學生常見迷思、課堂討論題與評量觀察點。點章節標題可展開／收合。
  </p>`;
  CH_ORDER.forEach((ch, ci) => {
    const info = CHAPTER_INFO[ch];
    const mods = modulesOf(ch);
    html += `
      <div class="tb-acc ${ci === 0 ? 'open' : ''}">
        <button class="tb-acc-head" style="border-left:5px solid ${chColor(ch)}">
          <span class="tb-acc-tag" style="background:${chColor(ch)}">${ch.toUpperCase()}</span>
          <span class="tb-acc-name">${info.name}</span>
          <span class="tb-acc-meta">${mods.length} 模組</span>
          <span class="tb-acc-arrow">▾</span>
        </button>
        <div class="tb-acc-body">
          ${mods.map(m => {
            const n = TEACH_NOTES[m.id] || {};
            return `
              <div class="tb-note-card">
                <div class="tb-note-top">
                  <span class="tb-note-ic">${m.icon}</span>
                  <h4>${esc(m.title)}</h4>
                  <span class="tb-pill">課本 ${m.tag}</span>
                  <span class="tb-pill" style="background:var(--brand-light);color:var(--brand-dark)">建議 ${m.hours} 節</span>
                  <a class="tb-note-link" href="${m.link}" target="_blank">開啟 ↗</a>
                </div>
                <dl class="tb-note-dl">
                  <dt>🎯 教學目標</dt><dd>${esc(m.obj)}</dd>
                  <dt>⚠ 常見迷思</dt><dd>${esc(n.mis || '')}</dd>
                  <dt>💬 課堂討論</dt><dd>${esc(n.dis || '')}</dd>
                  <dt>✅ 評量觀察點</dt><dd>${esc(n.as || '')}</dd>
                </dl>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  });
  $('#panel-notes').innerHTML = html;
  $('#panel-notes').querySelectorAll('.tb-acc-head').forEach(head => {
    head.addEventListener('click', () => {
      if (typeof SoundFX !== 'undefined') SoundFX.click();
      head.parentElement.classList.toggle('open');
    });
  });
})();

/* ============================================================
 * Tab 5 — 班級實驗室(像素實驗室多人連線監看)
 * ============================================================ */
(function renderClassroom() {
  const isHttps = location.protocol === 'https:';
  $('#panel-classroom').innerHTML = `
    <div class="tb-card">
      <h3>① 建立班級代碼</h3>
      <p class="tb-note" style="margin:0 0 10px">
        班級代碼把同一班學生分到同一個像素實驗室。把代碼、連結或 QR Code 給學生即可。
      </p>
      <div class="tb-assign-fields">
        <label>班級代碼<input type="text" id="clRoom" placeholder="例:901" maxlength="12"></label>
        <button class="btn btn-ghost btn-sm" id="clGen" style="align-self:flex-end">🎲 隨機產生</button>
      </div>
      <div id="clJoin" class="tb-empty">輸入班級代碼後,這裡會出現給學生的連結與 QR Code。</div>
    </div>
    <div class="tb-card">
      <h3>② 連線監看與控制</h3>
      ${isHttps
        ? `<p class="tb-note" style="color:var(--danger);margin:0">
            這是線上版(GitHub Pages),無法連到本機伺服器。請改用老師電腦的本機網址開啟此頁
            (例:<code>http://localhost:8731/teacher.html</code>),並先在終端機啟動
            <code>node server/server.js</code>。</p>`
        : `<div class="tb-out-btns" style="margin-bottom:12px">
            <button class="btn btn-primary btn-sm" id="clConnect">▶ 連線監看</button>
            <span id="clStatus" class="tb-out-label">尚未連線</span>
          </div>
          <div id="clRoster" class="tb-empty">連線後,這裡會即時顯示班上學生與所在位置。</div>
          <div id="clControls" style="display:none;margin-top:12px">
            <div class="tb-out-btns">
              <input type="text" id="clMsg" placeholder="輸入要廣播給全班的訊息" maxlength="80"
                style="flex:1;min-width:180px;font-family:var(--font-sans);font-size:13px;padding:8px 11px;border:1.5px solid var(--border);border-radius:9px">
              <button class="btn btn-primary btn-sm" id="clSend">📢 廣播訊息</button>
              <button class="btn btn-ghost btn-sm" id="clSummon">🧲 集合全班</button>
            </div>
          </div>`}
    </div>`;

  const roomInput = $('#clRoom');
  const cleanRoom = () => roomInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);

  $('#clGen').addEventListener('click', () => {
    roomInput.value = 'C' + Math.floor(1000 + Math.random() * 9000);
    updateJoin();
  });
  roomInput.addEventListener('input', updateJoin);

  function updateJoin() {
    const code = cleanRoom();
    const box = $('#clJoin');
    if (!code) {
      box.className = 'tb-empty';
      box.textContent = '輸入班級代碼後,這裡會出現給學生的連結與 QR Code。';
      return;
    }
    const url = new URL('lobby.html?room=' + code, location.href).href;
    let qr = '';
    try { const q = qrcode(0, 'M'); q.addData(url); q.make(); qr = q.createSvgTag(4, 8); } catch (e) {}
    box.className = '';
    box.innerHTML = `
      <div class="tb-assign-out">
        <div class="tb-qr">${qr}</div>
        <div class="tb-assign-info">
          <div class="tb-out-row"><span class="tb-out-label">班級代碼　${esc(code)}</span></div>
          <textarea class="tb-url" readonly rows="2">${esc(url)}</textarea>
          <div class="tb-out-btns"><button class="btn btn-ghost btn-sm" id="clCopy">📋 複製連結</button></div>
        </div>
      </div>
      <p class="tb-tip">學生可掃 QR、開連結,或在實驗室入口自行輸入代碼「${esc(code)}」加入。</p>`;
    $('#clCopy').addEventListener('click', () => {
      const ta = box.querySelector('.tb-url'); ta.select();
      navigator.clipboard.writeText(url).then(
        () => showToast('已複製班級連結', 'success'),
        () => { document.execCommand('copy'); showToast('已複製班級連結', 'success'); });
    });
  }

  if (isHttps) return;   /* 線上版沒有伺服器,以下監看功能略過 */

  /* ---- 老師端 WebSocket 連線 ---- */
  let ws = null;
  const PORTALS = [
    { id: '1', x: 180, y: 140 }, { id: '2', x: 380, y: 140 }, { id: '3', x: 580, y: 140 },
    { id: '4', x: 260, y: 380 }, { id: '5', x: 500, y: 380 },
  ];
  function areaOf(x, y) {
    let best = 999, name = '';
    PORTALS.forEach(p => { const d = Math.hypot(p.x - x, p.y - y); if (d < best) { best = d; name = p.id; } });
    return best < 80 ? '第 ' + name + ' 章傳送門附近' : '實驗室中走動';
  }
  function setStatus(text, on) {
    const el = $('#clStatus');
    el.textContent = text;
    el.style.background = on ? 'var(--success-light)' : 'var(--bg-soft)';
    el.style.color = on ? '#15803d' : 'var(--text-soft)';
  }
  function renderRoster(players) {
    const box = $('#clRoster');
    if (!players.length) {
      box.className = 'tb-empty';
      box.textContent = '目前班上沒有學生在線。';
      return;
    }
    box.className = '';
    box.innerHTML = `
      <div class="tb-cl-count">🟢 在線學生　${players.length} 人</div>
      <div class="tb-cl-list">${players.map(p =>
        `<div class="tb-cl-item"><b>${esc(p.name)}</b><span>${areaOf(p.x, p.y)}</span></div>`
      ).join('')}</div>`;
  }
  $('#clConnect').addEventListener('click', () => {
    if (ws) { ws.close(); return; }
    const code = cleanRoom();
    if (!code) { showToast('請先輸入班級代碼', 'warning'); return; }
    setStatus('連線中…', false);
    try { ws = new WebSocket('ws://' + location.hostname + ':8732'); }
    catch (e) { setStatus('無法連線', false); ws = null; return; }
    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ t: 'join', role: 'teacher', room: code, name: '老師' }));
      setStatus('已連線　班級 ' + code, true);
      $('#clConnect').textContent = '■ 中斷連線';
      $('#clControls').style.display = 'block';
    });
    ws.addEventListener('message', ev => {
      let m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.t === 'roster') renderRoster(m.players || []);
    });
    ws.addEventListener('close', () => {
      ws = null;
      setStatus('已中斷連線', false);
      $('#clConnect').textContent = '▶ 連線監看';
      $('#clControls').style.display = 'none';
      const box = $('#clRoster');
      box.className = 'tb-empty';
      box.textContent = '連線後,這裡會即時顯示班上學生與所在位置。';
    });
    ws.addEventListener('error', () => { /* close 會接著觸發 */ });
  });
  $('#clSend').addEventListener('click', () => {
    const msg = $('#clMsg').value.trim();
    if (!ws || ws.readyState !== 1) { showToast('尚未連線', 'warning'); return; }
    if (!msg) return;
    ws.send(JSON.stringify({ t: 'notice', text: msg }));
    $('#clMsg').value = '';
    showToast('已廣播給全班', 'success');
  });
  $('#clSummon').addEventListener('click', () => {
    if (!ws || ws.readyState !== 1) { showToast('尚未連線', 'warning'); return; }
    ws.send(JSON.stringify({ t: 'summon', x: 380, y: 260 }));
    showToast('已召集全班到實驗室中央', 'success');
  });
})();
