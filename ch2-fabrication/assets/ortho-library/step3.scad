// 三階梯塊（step3）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 寬 60、深 40；由左到右三階，高度 45、30、15，每階寬 20。
union() {
    translate([0,0,0]) cube([20,40,45]);
    translate([20,0,0]) cube([20,40,30]);
    translate([40,0,0]) cube([20,40,15]);
}
