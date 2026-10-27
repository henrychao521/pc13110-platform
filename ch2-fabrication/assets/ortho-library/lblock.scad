// L 形塊（lblock）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 底座 60×40×15；左邊立起一塊寬 20、全深、高 45 的立板，正視看是 L 形。
union() {
    translate([0,0,0]) cube([60,40,15]);
    translate([0,0,0]) cube([20,40,45]);
}
