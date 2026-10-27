// T 形槽塊（tslot）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 長方塊 60×40×40，由前到後貫穿一道 T 形槽：槽口寬 10、深 12；下方寬槽寬 30、高 12。
difference() {
  union() {
    translate([0,0,0]) cube([60,40,40]);
  }
  union() {
    translate([25,-1,28]) cube([10,42,13]);
    translate([15,-1,16]) cube([30,42,12]);
  }
}
