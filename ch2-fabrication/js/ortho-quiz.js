/* PC13110 三視圖判讀挑戰題庫（6 題，淺→中→難）。
 * 選項是物件庫的視圖：{ obj, view, xf }，xf 為干擾變換（mirrorU 左右翻、mirrorV 上下翻、hid2vis 虛線畫成實線、nohid 漏畫虛線）。
 * 每題 options[0] 是正解；畫面上會洗牌，作答紀錄用原始順序的 A–D。
 * 測試（ortho_lib_work/test_quiz.mjs）會檢查：正解和題目物件的真實視圖完全相同，其他選項都不同、彼此也不同。 */
(function (root) {
  'use strict';
  root.ORTHO_QUIZ_PC = [
    { level: '淺', type: 'view', obj: 'lblock', view: 'top',
      options: [
        { obj: 'lblock', view: 'top', note: '正確的上視圖' },
        { obj: 'lblock', view: 'top', xf: 'mirrorU', note: '左右相反（立板畫到右邊）' },
        { obj: 'block', view: 'top', note: '少了高低交界的分界線' },
        { obj: 'chamfer', view: 'top', note: '分界線方向錯（畫成前後分界）' }],
      why: 'L 形塊的立板在左邊（x 0～20），從正上方看，立板頂面和底座頂面高度不同，交界處要畫一條實線，位置和前視圖的內角「長對正」。' },
    { level: '淺', type: 'view', obj: 'notch', view: 'front',
      options: [
        { obj: 'notch', view: 'front', note: '正確的前視圖（凹字形）' },
        { obj: 'tee', view: 'front', note: '倒 T 形塊的前視圖' },
        { obj: 'block', view: 'front', note: '漏掉槽口的矩形' },
        { obj: 'notch', view: 'front', xf: 'mirrorV', note: '上下顛倒（槽口在下）' }],
      why: '凹槽由前到後貫穿，從正前方直接看得到槽口，所以前視圖是凹字形，槽的三邊都是實線。' },
    { level: '中', type: 'view', obj: 'chamfer', view: 'right',
      options: [
        { obj: 'chamfer', view: 'right', note: '正確的右側視圖' },
        { obj: 'chamfer', view: 'left', note: '左側視圖（斜面方向相反）' },
        { obj: 'chamfer', view: 'right', xf: 'mirrorV', note: '上下顛倒' },
        { obj: 'ramp', view: 'right', note: '斜坡塊的右側視圖' }],
      why: '右側視圖畫在前視圖右邊，靠近前視圖的那一邊（左邊）就是物體的正面。斜面在前上方，所以缺角在左上。' },
    { level: '中', type: 'view', obj: 'cbore', view: 'front',
      options: [
        { obj: 'cbore', view: 'front', note: '正確的前視圖（沉頭孔用虛線）' },
        { obj: 'cbore', view: 'front', xf: 'hid2vis', note: '孔畫成實線（看得到的線才畫實線）' },
        { obj: 'cbore', view: 'front', xf: 'mirrorV', note: '沉頭畫到底面' },
        { obj: 'cbore', view: 'front', xf: 'nohid', note: '漏畫隱藏線' }],
      why: '孔在物體內部，從前面看不到，所以用虛線；沉頭在頂面，虛線的台階也在上方。中心線（細鏈線）畫在孔的軸上。' },
    { level: '難', type: 'triplet', obj: 'tslot',
      options: [
        { front: { obj: 'tslot', view: 'front' }, top: { obj: 'tslot', view: 'top' }, right: { obj: 'tslot', view: 'right' }, note: '三視圖完全正確' },
        { front: { obj: 'tslot', view: 'front', xf: 'mirrorV' }, top: { obj: 'tslot', view: 'top' }, right: { obj: 'tslot', view: 'right' }, note: '前視圖錯誤（T 槽上下顛倒）' },
        { front: { obj: 'tslot', view: 'front' }, top: { obj: 'tslot', view: 'top', xf: 'hid2vis' }, right: { obj: 'tslot', view: 'right' }, note: '上視圖錯誤（看不到的寬槽畫成實線）' },
        { front: { obj: 'tslot', view: 'front' }, top: { obj: 'tslot', view: 'top' }, right: { obj: 'tslot', view: 'right', xf: 'nohid' }, note: '右側視圖錯誤（漏畫隱藏線）' }],
      why: 'T 形槽前後貫穿，前視圖直接看到 T 字；從上面只看得到窄的槽口（實線），下方較寬的槽被擋住要畫虛線；右側視圖的槽在內部，全部用虛線。' },
    { level: '難', type: 'triplet', obj: 'bracket',
      options: [
        { front: { obj: 'bracket', view: 'front' }, top: { obj: 'bracket', view: 'top' }, right: { obj: 'bracket', view: 'right' }, note: '三視圖完全正確' },
        { front: { obj: 'bracket', view: 'front', xf: 'hid2vis' }, top: { obj: 'bracket', view: 'top' }, right: { obj: 'bracket', view: 'right' }, note: '前視圖錯誤（底板的孔畫成實線）' },
        { front: { obj: 'bracket', view: 'front' }, top: { obj: 'bracket', view: 'bottom' }, right: { obj: 'bracket', view: 'right' }, note: '上視圖錯誤（放成仰視圖）' },
        { front: { obj: 'bracket', view: 'front' }, top: { obj: 'bracket', view: 'top' }, right: { obj: 'bracket', view: 'left' }, note: '右側視圖錯誤（放成左側視圖）' }],
      why: '底板的孔從前面看不到，要用虛線；上視圖要從正上方看（看得到兩個圓孔、立板的孔是虛線）；右側視圖的立板在後方，所以畫在右邊。' }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
