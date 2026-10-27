// 沉頭孔塊（cbore）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 長方塊 60×40×25，中央有直徑 12 的貫穿孔，孔口有直徑 24、深 8 的沉頭。
difference() {
  union() {
    translate([0,0,0]) cube([60,40,25]);
  }
  union() {
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([30,20,0]) cylinder(h=27, r=6, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,17],[0,0,0,1]]) translate([30,20,0]) cylinder(h=9, r=12, $fn=64);
  }
}
