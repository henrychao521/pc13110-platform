// 前斜切塊（chamfer）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 長方塊 60×40×40，前上方被一個斜面切掉：斜面從正面高 20 處，斜上到頂面離正面 15 處。
union() {
    multmatrix([[0,0,1,0],[1,0,0,0],[0,1,0,0],[0,0,0,1]]) linear_extrude(height=60) polygon([[0,0],[40,0],[40,40],[15,40],[0,20]]);
}
