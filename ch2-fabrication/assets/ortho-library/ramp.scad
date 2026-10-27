// 斜坡塊（ramp）— 由 ortho_lib_work/objects.py 產生，請改 objects.py 後重建
// 深 40；正視輪廓左邊高 40、平頂寬 20，再從 x=20 斜下到右端高 15。
union() {
    multmatrix([[1,0,0,0],[0,0,-1,40],[0,1,0,0],[0,0,0,1]]) linear_extrude(height=40) polygon([[0,0],[60,0],[60,15],[20,40],[0,40]]);
}
