// 肋板角架（rib）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 底板 60×40×10；左邊立板寬 10、全深、高 45；中間有一片厚 10 的三角肋板連接立板與底板（深 20 處到底板右端）。
union() {
    translate([0,0,0]) cube([60,40,10]);
    translate([0,0,0]) cube([10,40,45]);
    multmatrix([[1,0,0,0],[0,0,-1,25],[0,1,0,0],[0,0,0,1]]) linear_extrude(height=10) polygon([[10,10],[50,10],[10,45]]);
}
