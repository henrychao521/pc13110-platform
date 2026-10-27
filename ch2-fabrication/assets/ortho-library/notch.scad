// 凹槽塊（notch）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 長方塊 60×40×30，頂面中央由前到後挖一道寬 20、深 15 的方槽（貫穿前後）。
difference() {
  union() {
    translate([0,0,0]) cube([60,40,30]);
  }
  union() {
    translate([20,-1,15]) cube([20,42,16]);
  }
}
