// V 形槽塊（vblock）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 長方塊 60×40×35，頂面中央由前到後有一道 V 形槽：槽口寬 30、槽深 15。
difference() {
  union() {
    translate([0,0,0]) cube([60,40,35]);
  }
  union() {
    multmatrix([[1,0,0,0],[0,0,-1,41],[0,1,0,0],[0,0,0,1]]) linear_extrude(height=42) polygon([[15,35],[30,20],[45,35],[45,36],[15,36]]);
  }
}
