// 鳩尾槽塊（dovetail）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 長方塊 60×40×30，頂面由前到後貫穿一道鳩尾槽：槽口寬 20、槽底寬 36、深 12。
difference() {
  union() {
    translate([0,0,0]) cube([60,40,30]);
  }
  union() {
    multmatrix([[1,0,0,0],[0,0,-1,41],[0,1,0,0],[0,0,0,1]]) linear_extrude(height=42) polygon([[12,18],[48,18],[40,30],[20,30]]);
    translate([20,-1,29]) cube([20,42,2]);
  }
}
