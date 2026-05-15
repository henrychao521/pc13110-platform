// 通用互動引擎 — 給所有平台共用
// 使用方式：Interactions.SequencePuzzle({...}), Interactions.HotspotHunt({...}), etc.
// 也接受舊參數別名：mountId（自動加 #）/ onPass（等同 onComplete）/ items[i] 為 {id,label} 物件
// 並把 SequencePuzzle / HotspotHunt / DiagnosisQuiz 暴露到 window 全域以便相容既有呼叫

window.Interactions = (function() {

  // ============================================================
  // 1. 步驟排序拼圖
  //    用法：把步驟陣列打亂，使用者拖曳排回正確順序
  // ============================================================
  function SequencePuzzle(opts = {}) {
    // 參數別名相容：mountId → container='#'+mountId；onPass → onComplete；items[i] 物件取 label
    const container = opts.container != null ? opts.container : (opts.mountId ? '#' + opts.mountId : null);
    const onComplete = opts.onComplete || opts.onPass;
    const title = opts.title || '把下方步驟排回正確順序';
    const items = (opts.items || []).map(it =>
      typeof it === 'string' ? it : (it && (it.label != null ? it.label : (it.text != null ? it.text : String(it.id)))));

    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) return;

    // 打亂步驟
    const shuffled = [...items.keys()].sort(() => Math.random() - 0.5);
    const userOrder = shuffled.slice();
    let solved = false;

    root.innerHTML = `
      <div class="sp-wrapper" style="background:var(--bg-soft);border-radius:14px;padding:18px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h4 style="margin:0;font-size:16px">🧩 ${title}</h4>
          <button class="sp-shuffle" style="background:#fff;border:1px solid var(--border);padding:6px 12px;border-radius:8px;font-size:12px;cursor:pointer;font-family:var(--font-sans)">↻ 重新洗牌</button>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px">拖曳卡片上下移動 → 排成正確順序後點「檢查答案」。</p>
        <ol class="sp-list" style="list-style:none;padding:0;margin:0"></ol>
        <div style="display:flex;gap:10px;margin-top:14px;justify-content:space-between">
          <div class="sp-feedback" style="flex:1;font-size:13px;display:flex;align-items:center"></div>
          <button class="sp-check btn btn-primary" style="padding:10px 22px">檢查答案</button>
        </div>
      </div>
    `;

    const listEl = root.querySelector('.sp-list');
    const feedbackEl = root.querySelector('.sp-feedback');

    function renderList() {
      listEl.innerHTML = userOrder.map((origIdx, displayIdx) => `
        <li class="sp-item" draggable="true" data-orig="${origIdx}" style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:grab;user-select:none;display:flex;align-items:center;gap:12px;transition:all .15s">
          <span style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono);min-width:28px">${displayIdx + 1}.</span>
          <span style="flex:1;font-size:14px">${items[origIdx]}</span>
          <span style="color:var(--text-light)">⋮⋮</span>
        </li>
      `).join('');

      // 拖曳邏輯
      let dragged = null;
      listEl.querySelectorAll('.sp-item').forEach(li => {
        li.addEventListener('dragstart', e => { dragged = li; li.style.opacity = '.4'; });
        li.addEventListener('dragend', () => { if (dragged) dragged.style.opacity = '1'; dragged = null; });
        li.addEventListener('dragover', e => { e.preventDefault(); li.style.borderColor = 'var(--primary)'; });
        li.addEventListener('dragleave', () => { li.style.borderColor = 'var(--border)'; });
        li.addEventListener('drop', e => {
          e.preventDefault();
          li.style.borderColor = 'var(--border)';
          if (!dragged || dragged === li) return;
          const draggedIdx = userOrder.indexOf(parseInt(dragged.dataset.orig));
          const targetIdx = userOrder.indexOf(parseInt(li.dataset.orig));
          userOrder.splice(targetIdx, 0, userOrder.splice(draggedIdx, 1)[0]);
          renderList();
        });
        // 觸控簡易支援：點擊上下箭頭
        li.addEventListener('dblclick', () => {
          const idx = userOrder.indexOf(parseInt(li.dataset.orig));
          if (idx > 0) {
            [userOrder[idx - 1], userOrder[idx]] = [userOrder[idx], userOrder[idx - 1]];
            renderList();
          }
        });
      });
    }
    renderList();

    root.querySelector('.sp-shuffle').addEventListener('click', () => {
      userOrder.sort(() => Math.random() - 0.5);
      renderList();
      feedbackEl.innerHTML = '';
      solved = false;
    });

    root.querySelector('.sp-check').addEventListener('click', () => {
      const correct = userOrder.every((v, i) => v === i);
      if (correct) {
        feedbackEl.innerHTML = '<span style="color:var(--success);font-weight:700">✓ 排序正確！</span>';
        listEl.querySelectorAll('.sp-item').forEach(li => {
          li.style.background = 'var(--success-light)';
          li.style.borderColor = 'var(--success)';
        });
        if (!solved) {
          solved = true;
          if (typeof SoundFX !== 'undefined') SoundFX.win();
          if (onComplete) onComplete();
        }
      } else {
        const correctCount = userOrder.filter((v, i) => v === i).length;
        feedbackEl.innerHTML = `<span style="color:var(--danger)">✗ 還有錯誤（${correctCount} / ${items.length} 正確）</span>`;
        if (typeof SoundFX !== 'undefined') SoundFX.error();
        // 高亮對的、標紅錯的
        listEl.querySelectorAll('.sp-item').forEach((li, displayIdx) => {
          const origIdx = parseInt(li.dataset.orig);
          if (origIdx === displayIdx) {
            li.style.background = 'var(--success-light)';
            li.style.borderColor = 'var(--success)';
          } else {
            li.style.background = 'var(--danger-light)';
            li.style.borderColor = 'var(--danger)';
          }
        });
        setTimeout(() => listEl.querySelectorAll('.sp-item').forEach(li => {
          li.style.background = '#fff';
          li.style.borderColor = 'var(--border)';
        }), 1500);
      }
    });
  }

  // ============================================================
  // 2. 熱點獵殺：給一張圖，學生點出所有「問題位置」
  //    options: { container, image, hotspots: [{x, y, r, label}], targetText, onAllFound }
  // ============================================================
  function HotspotHunt({ container, imageHTML, hotspots, instruction = '點出圖中所有問題位置', onAllFound }) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) return;

    const found = new Set();

    root.innerHTML = `
      <div class="hh-wrapper" style="background:var(--bg-soft);border-radius:14px;padding:18px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h4 style="margin:0;font-size:16px">🎯 ${instruction}</h4>
          <span class="hh-progress" style="font-size:13px;color:var(--text-muted)">已找到 0 / ${hotspots.length}</span>
        </div>
        <div class="hh-image" style="position:relative;background:#fff;border-radius:10px;padding:8px;border:1px solid var(--border);overflow:hidden">
          ${imageHTML}
        </div>
        <div class="hh-feedback" style="margin-top:12px;font-size:13px;min-height:32px"></div>
      </div>
    `;

    const imgEl = root.querySelector('.hh-image');
    const progressEl = root.querySelector('.hh-progress');
    const feedbackEl = root.querySelector('.hh-feedback');

    // 渲染熱點（透明圓圈疊在圖上）
    hotspots.forEach((h, i) => {
      const dot = document.createElement('button');
      dot.className = 'hh-dot';
      dot.dataset.idx = i;
      dot.style.cssText = `position:absolute;left:${h.x}%;top:${h.y}%;width:${h.r || 8}%;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,0);border:2px dashed transparent;cursor:pointer;transform:translate(-50%,-50%);transition:all .2s`;
      dot.addEventListener('mouseenter', () => { if (!found.has(i)) dot.style.background = 'rgba(255,255,255,.15)'; });
      dot.addEventListener('mouseleave', () => { if (!found.has(i)) dot.style.background = 'rgba(255,255,255,0)'; });
      dot.addEventListener('click', () => {
        if (found.has(i)) return;
        found.add(i);
        dot.style.background = 'rgba(34,197,94,.45)';
        dot.style.borderColor = '#16a34a';
        dot.style.borderStyle = 'solid';
        progressEl.textContent = `已找到 ${found.size} / ${hotspots.length}`;
        feedbackEl.innerHTML = `<div style="background:var(--success-light);color:#15803d;padding:8px 12px;border-radius:8px;border-left:3px solid var(--success)">✓ <strong>${h.label}</strong> — ${h.explanation || ''}</div>`;
        if (typeof SoundFX !== 'undefined') SoundFX.success();
        if (found.size === hotspots.length) {
          if (typeof SoundFX !== 'undefined') SoundFX.win();
          feedbackEl.innerHTML = `<div style="background:var(--success-light);color:#15803d;padding:12px;border-radius:8px;border-left:4px solid var(--success);font-weight:700">🏆 全部找到！你掌握了找出問題的能力。</div>`;
          if (onAllFound) onAllFound();
        }
      });
      imgEl.appendChild(dot);
    });

    // 點到空處 → 提示
    imgEl.addEventListener('click', e => {
      if (e.target.classList.contains('hh-dot')) return;
      const rect = imgEl.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width * 100);
      const cy = ((e.clientY - rect.top) / rect.height * 100);
      // 顯示一個短暫的「沒問題」標記
      const miss = document.createElement('div');
      miss.style.cssText = `position:absolute;left:${cx}%;top:${cy}%;width:24px;height:24px;border-radius:50%;background:rgba(220,38,38,.4);transform:translate(-50%,-50%);pointer-events:none;animation:fadeOut 1s forwards`;
      imgEl.appendChild(miss);
      setTimeout(() => miss.remove(), 1000);
      if (typeof SoundFX !== 'undefined') SoundFX.click();
    });
  }

  // ============================================================
  // 3. 多選題快答（用於診斷類）
  //    options: { container, question, image, options: [{text, correct, explain}] }
  // ============================================================
  function DiagnosisQuiz({ container, question, image, options, onAnswer }) {
    const root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!root) return;

    root.innerHTML = `
      <div style="background:var(--bg-soft);border-radius:14px;padding:18px;border:1px solid var(--border)">
        <h4 style="margin-bottom:14px;font-size:16px">🔍 ${question}</h4>
        ${image ? `<div style="background:#fff;border-radius:10px;padding:12px;margin-bottom:14px;border:1px solid var(--border);text-align:center">${image}</div>` : ''}
        <div class="dq-options" style="display:grid;grid-template-columns:1fr;gap:8px"></div>
        <div class="dq-feedback" style="margin-top:12px;font-size:13px;min-height:24px"></div>
      </div>
    `;

    const optsEl = root.querySelector('.dq-options');
    const feedbackEl = root.querySelector('.dq-feedback');
    let answered = false;

    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.style.cssText = 'background:#fff;border:2px solid var(--border);border-radius:10px;padding:12px 16px;font-size:14px;text-align:left;cursor:pointer;font-family:var(--font-sans);transition:all .2s';
      btn.innerHTML = `<strong>${String.fromCharCode(65 + i)}.</strong> ${opt.text}`;
      btn.addEventListener('mouseenter', () => { if (!answered) btn.style.borderColor = 'var(--primary)'; });
      btn.addEventListener('mouseleave', () => { if (!answered) btn.style.borderColor = 'var(--border)'; });
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        // 標記所有選項
        optsEl.querySelectorAll('button').forEach((b, j) => {
          b.disabled = true;
          if (options[j].correct) {
            b.style.background = 'var(--success-light)';
            b.style.borderColor = 'var(--success)';
            b.style.color = '#15803d';
          } else if (j === i) {
            b.style.background = 'var(--danger-light)';
            b.style.borderColor = 'var(--danger)';
            b.style.color = '#a72d2d';
          }
        });
        const isCorrect = opt.correct;
        feedbackEl.innerHTML = `<div style="background:${isCorrect ? 'var(--success-light)' : 'var(--danger-light)'};color:${isCorrect ? '#15803d' : '#a72d2d'};padding:10px 14px;border-radius:8px;border-left:3px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}">${isCorrect ? '✓ 答對！' : '✗ 不正確。'} ${opt.explain || options.find(o => o.correct)?.explain || ''}</div>`;
        if (typeof SoundFX !== 'undefined') (isCorrect ? SoundFX.success : SoundFX.error)();
        if (onAnswer) onAnswer(isCorrect, i);
      });
      optsEl.appendChild(btn);
    });
  }

  return { SequencePuzzle, HotspotHunt, DiagnosisQuiz };
})();

// 全域別名（修復既有以 typeof SequencePuzzle === 'function' 偵測的呼叫端：hand-tools / drill / mechanism 等 M3）
window.SequencePuzzle = window.Interactions.SequencePuzzle;
window.HotspotHunt = window.Interactions.HotspotHunt;
window.DiagnosisQuiz = window.Interactions.DiagnosisQuiz;

// 共用樣式
if (!document.getElementById('interactions-style')) {
  const style = document.createElement('style');
  style.id = 'interactions-style';
  style.textContent = `
    @keyframes fadeOut { from { opacity: .9; transform: translate(-50%,-50%) scale(1); } to { opacity: 0; transform: translate(-50%,-50%) scale(2); } }
    .sp-item:active { cursor: grabbing; }
    .hh-dot:focus { outline: none; }
  `;
  document.head.appendChild(style);
}
