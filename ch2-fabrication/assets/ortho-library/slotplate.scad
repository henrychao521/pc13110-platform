// 長孔板（slotplate）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 平板 70×40×12，中央有一個長 40、寬 16 的長圓孔（兩端半圓）垂直貫穿。
difference() {
  union() {
    translate([0,0,0]) cube([70,40,12]);
  }
  union() {
    translate([23,12,-1]) cube([24,16,14]);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([23,20,0]) cylinder(h=14, r=8, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([47,20,0]) cylinder(h=14, r=8, $fn=64);
  }
}
