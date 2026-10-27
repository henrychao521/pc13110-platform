// 凸台座（boss）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 底板 70×44×12；正中央凸起直徑 26、高 20 的圓凸台；直徑 12 的孔從凸台頂面貫穿到底；底板四角各一個直徑 8 的孔。
difference() {
  union() {
    translate([0,0,0]) cube([70,44,12]);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,12],[0,0,0,1]]) translate([35,22,0]) cylinder(h=20, r=13, $fn=64);
  }
  union() {
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([35,22,0]) cylinder(h=34, r=6, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([10,10,0]) cylinder(h=14, r=4, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([10,34,0]) cylinder(h=14, r=4, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([60,10,0]) cylinder(h=14, r=4, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([60,34,0]) cylinder(h=14, r=4, $fn=64);
  }
}
