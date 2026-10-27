// 角架（bracket）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 底板 60×40×10；後方立板 60×10×45；立板中央有直徑 14 的前後貫穿孔（中心高 30），底板左右各有一個直徑 10 的垂直孔。
difference() {
  union() {
    translate([0,0,0]) cube([60,40,10]);
    translate([0,30,0]) cube([60,10,45]);
  }
  union() {
    multmatrix([[1,0,0,0],[0,0,-1,41],[0,1,0,0],[0,0,0,1]]) translate([30,30,0]) cylinder(h=12, r=7, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([15,15,0]) cylinder(h=12, r=5, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([45,15,0]) cylinder(h=12, r=5, $fn=64);
  }
}
