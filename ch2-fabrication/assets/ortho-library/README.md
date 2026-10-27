# 三視圖物件庫

18 個教學用實體，分 4 級難度。每個物件都由「凸基本體（長方體、圓柱、凸多邊形擠出）＋聯集／差集」定義，
三視圖、六視圖的線條是從 3D 網格**正投影算出來的**，不是手畫的，所以位置、線型由構造保證。

| 難度 | 物件 |
|---|---|
| 1 基礎 | block 長方塊、lblock L 形塊、step3 三階梯塊、tee 倒 T 形塊 |
| 2 進階 | notch 凹槽塊、chamfer 前斜切塊、ramp 斜坡塊、holeplate 圓孔板 |
| 3 挑戰 | vblock V 形槽塊、tslot T 形槽塊、dovetail 鳩尾槽塊、cbore 沉頭孔塊、cylstack 雙層圓柱 |
| 4 綜合 | bracket 角架、lhole L 形孔塊、slotplate 長孔板、boss 凸台座、rib 肋板角架 |

## 檔案

| 檔案 | 內容 |
|---|---|
| `<id>.scad` | OpenSCAD 原始碼（由產生程式寫出；要改形狀請改產生程式的 `objects.py`） |
| `<id>.stl` | 二進位 STL（OpenSCAD 2021.01 匯出，$fn=64），給 3D 檢視器 |
| `library-data.js` | `window.ORTHO_LIB`：每個物件 6 個視圖＋等角圖的線條（vis 可見線、hid 隱藏線、ctr 中心線，單位 0.1 mm） |

## 座標與投影（第三角法）

- X＝寬（正視圖由左到右）、Y＝深（y=0 是正面）、Z＝高。
- 正視圖從正面（-Y）看；俯視圖從上（+Z）看，俯視圖的下緣是物體正面；右側視圖從右（+X）看，左緣是物體正面。
- 排版（`ortho-views.js`）：俯視在正視正上方、仰視在正下方、右側視在正右方、左側視在正左方、後視在右側視的右邊；
  六個視圖共用比例尺，所以長對正、高平齊、寬相等由排版保證。
- 線型（CNS 3／ISO 128）：可見輪廓＝粗實線；被擋住的輪廓＝虛線；孔與圓柱的軸＝細鏈線（中心線，超出輪廓 3 mm）。
  可見線與隱藏線重疊時只畫可見線。

## 產生與驗證

本資料夾是 livingtech-tools 網站 `models/orthographic/library/` 的複本（只取 STL、.scad、library-data.js）；
產生程式與測試在該資料夾的 `src/`（工作版本：LivingTechBooks/docs/review_2026-10/ortho_lib_work/）。

1. `build.py`：objects.py → .scad → OpenSCAD 匯出 STL → 投影器（project.py）：挑出稜線（兩面夾角 > 20°）與輪廓邊，
   在交點切段，每小段從 3D 中點朝觀察者打射線判斷遮擋（可見／隱藏），同一直線上做區間聯集，可見優先。
2. `verify_views.py`：**不用網格**，直接由解析定義算每條視線的「進出實體」深度，找出深度不連續處，
   和投影器畫出的線比對（可見線、隱藏線的召回率與精確率）。
3. `test_library.py`：上面的驗算＋突變測試（故意把線改錯，驗算器要抓得到）＋外框一致＋中心線落在圓心。
4. `test_quiz.mjs`：每一題測驗的正解只對應一個選項。

本頁（ch2-fabrication/pages/orthographic.html）用 `../js/ortho-views.js` 排版、`../js/ortho-quiz.js` 出題；題目正解唯一性用 `test_quiz.mjs` 檢查。

授權：本站自製（OpenSCAD 建模、Blender 渲染、程式繪製），隨網站授權使用。
