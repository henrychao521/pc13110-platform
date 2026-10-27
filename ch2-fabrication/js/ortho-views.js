/* 三視圖繪圖器（第三角法）— 依物件庫 window.ORTHO_LIB 的線條資料畫 SVG。
 * 線條由 OpenSCAD 網格正投影算出（ortho_lib_work/build.py），這裡只負責排版與線型：
 *   可見線：粗實線　隱藏線：虛線　中心線：細鏈線（CNS 3／ISO 128 線型）
 * 第三角法：俯視在正視正上方、右側視在正視正右方、左側視在左、仰視在下、後視在右側視右邊。
 * 所有視圖共用同一比例尺，所以「長對正、高平齊、寬相等」由排版保證。
 * 本檔不依賴 DOM，可在 node 測試裡執行（globalThis.OrthoViews）。 */
(function (root) {
  'use strict';
  var NAMES = { front: '正視圖', top: '俯視圖', right: '右側視圖', left: '左側視圖', bottom: '仰視圖', rear: '後視圖', iso: '等角圖' };
  var THEMES = {
    paper: { bg: '#FFFFFF', line: '#111827', ctr: '#111827', label: '#334155', frame: '#CBD5E1', proj: '#94A3B8' },
    dark: { bg: '#1E293B', line: '#E0E7FF', ctr: '#E0E7FF', label: '#FBBF24', frame: '#334155', proj: '#64748B' }
  };

  function lib() { return root.ORTHO_LIB; }
  function obj(id) { var L = lib(); return L && L.objects[id]; }

  /* ---- 線條變換（產生干擾選項用；測試會檢查變換後和正解不同） ---- */
  function cloneView(v) {
    return { box: v.box.slice(), vis: v.vis.map(function (p) { return p.slice(); }),
      hid: v.hid.map(function (p) { return p.slice(); }), ctr: v.ctr.map(function (p) { return p.slice(); }) };
  }
  function mapPts(arr, fu, fv) {
    return arr.map(function (p) { var o = []; for (var i = 0; i < p.length; i += 2) { o.push(fu(p[i]), fv(p[i + 1])); } return o; });
  }
  /* xf：'mirrorU' 左右翻、'mirrorV' 上下翻、'hid2vis' 虛線改實線、'nohid' 拿掉虛線、'vis2hid' 實線內部改虛線（外框不變） */
  function transform(v, xf) {
    var o = cloneView(v);
    if (!xf) return o;
    var b = o.box;
    if (xf === 'mirrorU' || xf === 'mirrorV') {
      var su = xf === 'mirrorU', c = su ? b[0] + b[2] : b[1] + b[3];
      var fu = su ? function (x) { return c - x; } : function (x) { return x; };
      var fv = su ? function (y) { return y; } : function (y) { return c - y; };
      o.vis = mapPts(o.vis, fu, fv); o.hid = mapPts(o.hid, fu, fv); o.ctr = mapPts(o.ctr, fu, fv);
    } else if (xf === 'hid2vis') { o.vis = o.vis.concat(o.hid); o.hid = []; }
    else if (xf === 'nohid') { o.hid = []; }
    return o;
  }
  function viewOf(spec) {             /* spec = { obj, view, xf } */
    var O = obj(spec.obj);
    if (!O) throw new Error('物件庫沒有 ' + spec.obj);
    return transform(O.views[spec.view], spec.xf);
  }

  /* ---- SVG ---- */
  function lineStyle(scalePx) {        /* scalePx：每 mm 幾 px */
    var vis = Math.max(1.3, Math.min(2.6, scalePx * 0.75));
    return { vis: vis, hid: vis * 0.6, ctr: vis * 0.38,
      dash: [vis * 2.4, vis * 1.4], chain: [vis * 6, vis * 1.2, vis * 0.6, vis * 1.2] };
  }
  function f1(x) { return Math.round(x * 10) / 10; }
  function pathOf(polys, X, Y) {
    return polys.map(function (p) {
      var d = '';
      for (var i = 0; i < p.length; i += 2) d += (i ? 'L' : 'M') + f1(X(p[i])) + ' ' + f1(Y(p[i + 1]));
      return d;
    }).join('');
  }
  /* 把一個視圖畫到 (ox, oy)（畫面左上）位置；s = px/0.1mm */
  function viewGroup(v, ox, oy, s, th, st, opt) {
    var b = v.box;
    var X = function (u) { return ox + (u - b[0]) * s; };
    var Y = function (w) { return oy + (b[3] - w) * s; };
    var g = '';
    if (opt && opt.frame) g += '<rect x="' + f1(ox - 4) + '" y="' + f1(oy - 4) + '" width="' + f1((b[2] - b[0]) * s + 8) + '" height="' + f1((b[3] - b[1]) * s + 8) + '" fill="none" stroke="' + th.frame + '" stroke-width="0.8" stroke-dasharray="2 2"/>';
    if (v.ctr.length) g += '<path data-k="center" d="' + pathOf(v.ctr, X, Y) + '" fill="none" stroke="' + th.ctr + '" stroke-width="' + f1(st.ctr) + '" stroke-dasharray="' + st.chain.map(f1).join(' ') + '"/>';
    if (v.hid.length) g += '<path data-k="hidden" d="' + pathOf(v.hid, X, Y) + '" fill="none" stroke="' + th.line + '" stroke-width="' + f1(st.hid) + '" stroke-dasharray="' + st.dash.map(f1).join(' ') + '" stroke-linecap="butt"/>';
    if (v.vis.length) g += '<path data-k="visible" d="' + pathOf(v.vis, X, Y) + '" fill="none" stroke="' + th.line + '" stroke-width="' + f1(st.vis) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    return g;
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* 單一視圖。opt: { pxPerMm, theme, pad, label, title } */
  function svgSingle(v, opt) {
    opt = opt || {};
    var th = THEMES[opt.theme || 'paper'];
    var s = (opt.pxPerMm || 2) / 10, pad = opt.pad == null ? 10 : opt.pad;
    var b = v.box, w = (b[2] - b[0]) * s, h = (b[3] - b[1]) * s;
    var W = opt.width || w + pad * 2, H = opt.height || h + pad * 2 + (opt.label ? 16 : 0);
    var ox = (W - w) / 2, oy = (H - (opt.label ? 16 : 0) - h) / 2;
    var st = lineStyle(opt.pxPerMm || 2);
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f1(W) + ' ' + f1(H) + '" width="' + f1(W) + '" height="' + f1(H) + '"' +
      ' role="img" aria-label="' + esc(opt.title || '視圖') + '" style="max-width:100%;height:auto;background:' + th.bg + '">';
    out += viewGroup(v, ox, oy, s, th, st, opt);
    if (opt.label) out += '<text x="' + f1(W / 2) + '" y="' + f1(H - 4) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + th.label + '" font-family="PingFang TC,Noto Sans TC,sans-serif">' + esc(opt.label) + '</text>';
    return out + '</svg>';
  }

  /* 第三角法排版。layout：'three'（俯／正／右）或 'six'（六視圖）。
   * views：{ front:viewData, top:..., right:... } 可用 '?' 代表空格（補缺題），也可用 null 不畫。
   * opt: { maxWidth, maxHeight, theme, gapMm, labels, names, projLines, symbol, title }
   *   names：視圖名稱覆寫，例如 { front: '前視圖', top: '上視圖' }（高中課本用語） */
  function svgLayout(views, layout, opt) {
    opt = opt || {};
    var th = THEMES[opt.theme || 'paper'];
    var keys = layout === 'six' ? ['top', 'left', 'front', 'right', 'rear', 'bottom'] : ['top', 'front', 'right'];
    var ref = views.front && views.front !== '?' ? views.front : null;
    function boxOf(k) {
      var v = views[k];
      if (v && v !== '?') return v.box;
      return null;
    }
    /* 尺寸（0.1mm）：寬 W = x 範圍、深 D = y 範圍、高 H = z 範圍，由任一可得的視圖推得 */
    var W = 0, D = 0, H = 0;
    keys.forEach(function (k) {
      var b = boxOf(k); if (!b) return;
      var bw = b[2] - b[0], bh = b[3] - b[1];
      if (k === 'front' || k === 'rear') { W = Math.max(W, bw); H = Math.max(H, bh); }
      if (k === 'top' || k === 'bottom') { W = Math.max(W, bw); D = Math.max(D, bh); }
      if (k === 'right' || k === 'left') { D = Math.max(D, bw); H = Math.max(H, bh); }
    });
    var gap = (opt.gapMm == null ? 14 : opt.gapMm) * 10;
    var labH = opt.labels === false ? 0 : 1;
    /* 各格的外框尺寸（0.1mm）與左上角位置；正視左上角為原點 */
    var cell = {
      front: [0, 0, W, H], top: [0, -(D + gap), W, D], right: [W + gap, 0, D, H],
      left: [-(D + gap), 0, D, H], bottom: [0, H + gap, W, D], rear: [W + gap + D + gap, 0, W, H]
    };
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    keys.forEach(function (k) { var c = cell[k]; minX = Math.min(minX, c[0]); minY = Math.min(minY, c[1]); maxX = Math.max(maxX, c[0] + c[2]); maxY = Math.max(maxY, c[1] + c[3]); });
    var padPx = opt.pad == null ? 12 : opt.pad, labPx = labH ? 18 : 0;
    var maxW = opt.maxWidth || 360, maxH = opt.maxHeight || 1e9;
    var sx = (maxW - padPx * 2) / (maxX - minX);
    var nRows = layout === 'six' ? 3 : 2;
    var sy = (maxH - padPx * 2 - labPx * nRows) / (maxY - minY);
    var s = Math.min(sx, sy, (opt.maxPxPerMm || 4) / 10);
    var st = lineStyle(s * 10);
    /* 每列標籤要佔高度：把列與列之間的距離加上 labPx（不影響長對正、高平齊） */
    function rowOf(k) { return k === 'top' ? 0 : (k === 'bottom' ? 2 : 1); }
    var Wpx = (maxX - minX) * s + padPx * 2, Hpx = (maxY - minY) * s + padPx * 2 + labPx * nRows;
    var out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + f1(Wpx) + ' ' + f1(Hpx) + '" width="' + f1(Wpx) + '" height="' + f1(Hpx) + '"' +
      ' role="img" aria-label="' + esc(opt.title || '第三角法視圖') + '" style="max-width:100%;height:auto;background:' + th.bg + '">';
    var place = {};
    keys.forEach(function (k) {
      var c = cell[k];
      var ox = padPx + (c[0] - minX) * s, oy = padPx + (c[1] - minY) * s + labPx * rowOf(k);
      place[k] = [ox, oy, c[2] * s, c[3] * s];
    });
    if (opt.projLines) {   /* 投影對齊細線：長對正（俯↔正）、高平齊（正↔右） */
      var pf = place.front, pt = place.top, pr = place.right;
      var pl = '';
      [0, pf[2]].forEach(function (dx) { pl += 'M' + f1(pf[0] + dx) + ' ' + f1(pt[1] + pt[3]) + 'L' + f1(pf[0] + dx) + ' ' + f1(pf[1]); });
      [0, pf[3]].forEach(function (dy) { pl += 'M' + f1(pf[0] + pf[2]) + ' ' + f1(pf[1] + dy) + 'L' + f1(pr[0]) + ' ' + f1(pf[1] + dy); });
      out += '<path data-k="proj" d="' + pl + '" stroke="' + th.proj + '" stroke-width="0.7" stroke-dasharray="1.5 2.5" fill="none"/>';
    }
    keys.forEach(function (k) {
      var v = views[k], p = place[k];
      if (v == null) return;
      if (v === '?') {
        out += '<g data-missing="' + k + '"><rect x="' + f1(p[0]) + '" y="' + f1(p[1]) + '" width="' + f1(p[2]) + '" height="' + f1(p[3]) + '" fill="none" stroke="' + th.label + '" stroke-width="2" stroke-dasharray="6 4" rx="4"/>' +
          '<text x="' + f1(p[0] + p[2] / 2) + '" y="' + f1(p[1] + p[3] / 2 + 9) + '" text-anchor="middle" font-size="26" font-weight="800" fill="' + th.label + '" font-family="Inter,sans-serif">?</text></g>';
      } else {
        /* 視圖本身的外框（box）可能比格子小（例如圓柱的俯視）；置中對齊格子：u/v 的原點相同所以直接用格子 */
        var b = v.box, cw = p[2], chh = p[3];
        var ox = p[0] + (cw - (b[2] - b[0]) * s) / 2, oy = p[1] + (chh - (b[3] - b[1]) * s) / 2;
        out += '<g data-view="' + k + '">' + viewGroup(v, ox, oy, s, th, st, opt) + '</g>';
      }
      if (labH) out += '<text x="' + f1(p[0] + p[2] / 2) + '" y="' + f1(p[1] + p[3] + 14) + '" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + th.label + '" font-family="PingFang TC,Noto Sans TC,sans-serif">' + esc((opt.names && opt.names[k]) || NAMES[k]) + '</text>';
    });
    if (opt.symbol !== false) {   /* 第三角法投影符號（截頭圓錐：左邊兩同心圓、右邊梯形，ISO 5456-2） */
      var sz = 13, sx0 = Wpx - padPx - sz * 2.6, sy0 = padPx;
      if (layout === 'six') { sx0 = Wpx - padPx - sz * 2.6; sy0 = padPx; }
      out += '<g aria-label="第三角法符號" stroke="' + th.label + '" fill="none" stroke-width="1">' +
        '<circle cx="' + f1(sx0 + sz / 2) + '" cy="' + f1(sy0 + sz / 2) + '" r="' + f1(sz / 2) + '"/>' +
        '<circle cx="' + f1(sx0 + sz / 2) + '" cy="' + f1(sy0 + sz / 2) + '" r="' + f1(sz / 4.2) + '"/>' +
        '<path d="M' + f1(sx0 + sz * 1.25) + ' ' + f1(sy0 + sz * 0.27) + 'L' + f1(sx0 + sz * 2.5) + ' ' + f1(sy0) + 'L' + f1(sx0 + sz * 2.5) + ' ' + f1(sy0 + sz) + 'L' + f1(sx0 + sz * 1.25) + ' ' + f1(sy0 + sz * 0.73) + 'Z"/></g>';
    }
    return out + '</svg>';
  }

  /* 給測試／判分用：把視圖轉成不受折線串接方式影響的簽章（0.5 mm 量化，平移到原點） */
  function signature(v) {
    var b = v.box, out = [];
    function seg(kind, p) {
      for (var i = 0; i + 3 < p.length; i += 2) {
        var a = [Math.round((p[i] - b[0]) / 5), Math.round((p[i + 1] - b[1]) / 5)], c = [Math.round((p[i + 2] - b[0]) / 5), Math.round((p[i + 3] - b[1]) / 5)];
        if (a[0] > c[0] || (a[0] === c[0] && a[1] > c[1])) { var t = a; a = c; c = t; }
        if (a[0] === c[0] && a[1] === c[1]) continue;
        out.push(kind + a.join(',') + ';' + c.join(','));
      }
    }
    v.vis.forEach(function (p) { seg('v', p); });
    v.hid.forEach(function (p) { seg('h', p); });
    out.push('box' + Math.round((b[2] - b[0]) / 5) + 'x' + Math.round((b[3] - b[1]) / 5));
    out.sort();
    var u = [];
    out.forEach(function (x) { if (u[u.length - 1] !== x) u.push(x); });
    return u.join('|');
  }

  root.OrthoViews = { NAMES: NAMES, THEMES: THEMES, lib: lib, obj: obj, transform: transform, viewOf: viewOf,
    svgSingle: svgSingle, svgLayout: svgLayout, signature: signature, lineStyle: lineStyle };
})(typeof window !== 'undefined' ? window : globalThis);
