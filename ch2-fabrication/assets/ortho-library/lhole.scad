// L 形孔塊（lhole）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 底座 60×40×15；左邊立板寬 20、高 45；底座右邊有直徑 12 的垂直貫穿孔（圓心 x=42、y=20）；立板有直徑 12 的左右貫穿孔（中心高 32）。
difference() {
  union() {
    translate([0,0,0]) cube([60,40,15]);
    translate([0,0,0]) cube([20,40,45]);
  }
  union() {
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([42,20,0]) cylinder(h=17, r=6, $fn=64);
    multmatrix([[0,0,1,-1],[1,0,0,0],[0,1,0,0],[0,0,0,1]]) translate([20,32,0]) cylinder(h=22, r=6, $fn=64);
  }
}
