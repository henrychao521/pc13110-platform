/* ============================================================
 * sheet-track.js — pc13110 專用：把平台各種「有對錯的作答」整理成 SheetLog 紀錄
 * （規格：/Volumes/Work/classroom-sheets/SPEC.md；送出、佇列、班級座號元件都在共用的 sheet-log.js）
 *
 * 一頁（或工坊的一台機台）是一份作答：
 *   SheetTrack.register(page, key, def)   登記一題（def：{t, stem, options:[原始順序文字], answer:原始索引, items:[排序項目]}）
 *   SheetTrack.attempt(page, key, {ok, a, final})
 *        每按一次「送出／檢查答案」記一次。第一次作答的對錯與所選記在 ok／a，tries 累計到答對為止；
 *        答對（或 final:true，例如不給重答的題目）就算這題完成。
 *   SheetTrack.flush(page)                這份作答還沒全部完成也先送（關閉工坊課程視窗、離開頁面時）
 *   全部已登記的題目都完成時自動送出一筆，之後再作答就是新的一份（新的 sid）。
 *
 * ok 記「第一次作答」的對錯（鑑別度要看第一次），tries 記同一題到答對為止總共答了幾次
 * （一直沒答對就記已答的次數）；a 是第一次所選，k 是正解，選項代號一律用原始資料順序的 A–F。
 * endpoint 空字串時 SheetLog.send 什麼都不做，這裡照常記錄但不會有任何網路請求。
 * ============================================================ */
(function (global) {
  'use strict';

  var defs = {};      // q → {q, page, t, stem, options, answer, items, h}（給 tools/sheets/build_items.py 收集題庫）
  var groups = {};    // page → {sid, start, items:{key→state}, sent}

  function strip(html) {
    return String(html == null ? '' : html).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
  }
  function code(i) { return 'ABCDEF'.charAt(i) || ''; }

  /* 頁面代號：/ch1-engineering/pages/trends.html → ch1.trends */
  function autoPage() {
    var m = /\/(ch\d)-[^/]+\/pages\/([\w-]+)\.html/.exec(global.location.pathname);
    return m ? m[1] + '.' + m[2] : 'misc';
  }

  function register(page, key, def) {
    page = page || autoPage();
    var q = page + ':' + key;
    if (defs[q]) return defs[q];
    var t = def.t || 'single', options = null, answer = null, items = null;
    if (t === 'order') {
      items = (def.items || []).map(strip);
      answer = items.map(function (_, i) { return i + 1; }).join('>');
    } else if (def.optionMap) {           // 選項本身沒有固定順序（例如隨機抽出的模型），直接給代號→文字
      options = {};
      Object.keys(def.optionMap).forEach(function (k) { options[k] = strip(def.optionMap[k]); });
      answer = def.answer;
    } else {
      options = {};
      (def.options || []).forEach(function (o, i) { options[code(i)] = strip(o); });
      answer = typeof def.answer === 'number' ? code(def.answer) : def.answer;
    }
    var d = { q: q, page: page, t: t, stem: strip(def.stem).replace(/^(第 ?\d+ ?(\/ ?\d+ ?)?題|情境 ?\d+)\s*/, ''),
      options: options, answer: answer, items: items, h: '' };
    d.ready = (global.SheetLog ? SheetLog.hash({ type: t, stem: d.stem, options: options, answer: answer, items: items })
      : Promise.resolve('')).then(function (h) { d.h = h; return h; });
    defs[q] = d;
    return d;
  }

  function group(page) {
    var g = groups[page];
    if (!g || g.sent) {
      g = groups[page] = { sid: global.SheetLog ? SheetLog.newSid() : '', start: Date.now(), items: {}, order: [], sent: false };
    }
    return g;
  }

  function attempt(page, key, r) {
    page = page || autoPage();
    var q = page + ':' + key, d = defs[q];
    if (!d) return;
    var g = group(page), s = g.items[key];
    if (!s) { s = g.items[key] = { ok: r.ok ? 1 : 0, a: String(r.a || ''), tries: 0, done: false }; g.order.push(key); }
    if (s.done) return;                    // 答對之後再按不算
    s.tries++;
    if (r.ok || r.final) s.done = true;
    if (allDone(page, g)) send(page, g);
  }

  function allDone(page, g) {
    var keys = Object.keys(defs).filter(function (q) { return defs[q].page === page; });
    return keys.length > 0 && keys.every(function (q) {
      var s = g.items[q.slice(page.length + 1)];
      return s && s.done;
    });
  }

  function send(page, g) {
    if (!g || g.sent || !g.order.length) return;
    g.sent = true;
    var list = g.order.map(function (key) { return { key: key, s: g.items[key], d: defs[page + ':' + key] }; });
    var sec = Math.round((Date.now() - g.start) / 1000);
    var nOk = list.reduce(function (n, x) { return n + x.s.ok; }, 0);
    // 指紋是非同步算的（通常在作答前早就算好了），等全部算完再送
    Promise.all(list.map(function (x) { return x.d.ready; })).then(function () {
      if (!global.SheetLog) return;
      SheetLog.send({
        sid: g.sid, page: page, kind: 'quiz',
        items: list.map(function (x) {
          return { q: x.d.q, h: x.d.h, t: x.d.t, ok: x.s.ok, a: x.s.a, k: x.d.answer || '', tries: x.s.tries };
        }),
        meta: { score: nOk, max: list.length, sec: sec },
      });
    });
  }

  function flush(page) {
    var g = groups[page || autoPage()];
    if (g && !g.sent) send(page || autoPage(), g);
  }

  // 離開頁面時，做到一半的作答也送出（先進佇列，送不完下次開頁補送）
  global.addEventListener('pagehide', function () {
    Object.keys(groups).forEach(function (p) { flush(p); });
  });

  /* ---------- 工坊機台認證：一台機台＝一份作答（步驟排序＋認證測驗） ---------- */
  function workshopDefs(m) {
    var page = 'workshop.' + m.id;
    register(page, 'steps', { t: 'order', stem: '把「' + m.name + '」的操作步驟排成正確順序', items: m.steps || [] });
    (m.quiz || []).forEach(function (q, i) {
      register(page, 'q' + (i + 1), { t: 'single', stem: q.q, options: q.options, answer: q.answer });
    });
    return page;
  }

  /* 右下角的班級座號按鈕讓開音效開關（.sound-toggle 在 right:20 bottom:20）；sheet-log.js 讀這兩個 CSS 變數 */
  if (global.document) {
    var st = document.createElement('style');
    st.textContent = ':root{--sl-bottom:78px}';
    (document.head || document.documentElement).appendChild(st);
  }

  global.SheetTrack = {
    register: register, attempt: attempt, flush: flush, workshopDefs: workshopDefs,
    autoPage: autoPage, code: code, defs: defs,
  };
})(window);
