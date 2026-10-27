// 圓孔板（holeplate）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 平板 60×40×15，正中央有一個直徑 16 的垂直貫穿孔。
difference() {
  union() {
    translate([0,0,0]) cube([60,40,15]);
  }
  union() {
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([30,20,0]) cylinder(h=17, r=8, $fn=64);
  }
}
