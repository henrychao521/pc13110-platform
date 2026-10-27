// 雙層圓柱（cylstack）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 下層圓柱直徑 56、高 15；上層同軸圓柱直徑 32、高 25；中心有直徑 14 的貫穿孔。
difference() {
  union() {
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]) translate([28,28,0]) cylinder(h=15, r=28, $fn=64);
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,15],[0,0,0,1]]) translate([28,28,0]) cylinder(h=25, r=16, $fn=64);
  }
  union() {
    multmatrix([[1,0,0,0],[0,1,0,0],[0,0,1,-1],[0,0,0,1]]) translate([28,28,0]) cylinder(h=42, r=7, $fn=64);
  }
}
