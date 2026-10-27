// 倒 T 形塊（tee）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 底座 60×40×15；中間立起寬 20（x 20～40）、全深、高 45 的立板。
union() {
    translate([0,0,0]) cube([60,40,15]);
    translate([20,0,0]) cube([20,40,45]);
}
