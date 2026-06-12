#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""產生第 3 章 AR 齒輪組模型(嚙合齒輪對,含旋轉動畫)。

輸出:
  assets/models/gear-train.glb   — 網頁 3D 檢視(model-viewer)/ Android Scene Viewer
  assets/models/gear-train.usdz  — iOS AR Quick Look(iPhone Safari 點 AR 直接擺上桌)

需求(建議用 venv):
  pip install numpy pygltflib usd-core
用法:
  python tools/generate_gear_model.py

幾何規格(公尺,Y 朝上,AR 為 1:1 真實尺寸):
  大齒輪 16 齒 / 小齒輪 8 齒,模數 4 mm → 齒數比 2:1
  動畫 8 秒:大齒輪 +360°,小齒輪 −720°(轉向相反、轉速兩倍)
"""
import math
import struct
import sys
from pathlib import Path

import numpy as np

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "assets" / "models"

# ---------------- 齒輪參數 ----------------
MODULE = 0.004            # 模數 4 mm
Z_A, Z_B = 16, 8          # 齒數(比 2:1)
R_A = MODULE * Z_A / 2    # 節圓半徑 0.032
R_B = MODULE * Z_B / 2    # 節圓半徑 0.016
CENTER_DIST = R_A + R_B   # 0.048,節圓相切
GEAR_THICK = 0.014
GEAR_Y = 0.023            # 齒輪中心高度
POS_A = (-CENTER_DIST / 2, GEAR_Y, 0.0)
POS_B = (+CENTER_DIST / 2, GEAR_Y, 0.0)
DUR = 8.0                 # 動畫秒數

# ---------------- 平面網格工具(每面獨立頂點 → 硬邊緣) ----------------
class MeshBuilder:
    def __init__(self):
        self.pos, self.nrm, self.idx = [], [], []

    def add_tri(self, a, b, c, n=None):
        if n is None:
            n = np.cross(np.subtract(b, a), np.subtract(c, a))
            ln = np.linalg.norm(n)
            n = n / ln if ln > 1e-12 else np.array([0.0, 1.0, 0.0])
        base = len(self.pos)
        self.pos += [a, b, c]
        self.nrm += [tuple(n)] * 3
        self.idx += [base, base + 1, base + 2]

    def add_quad(self, a, b, c, d):  # a-b-c-d 逆時針
        self.add_tri(a, b, c)
        self.add_tri(a, c, d)

    def arrays(self):
        return (np.array(self.pos, dtype=np.float32),
                np.array(self.nrm, dtype=np.float32),
                np.array(self.idx, dtype=np.uint32))


def gear_outline(z, module, phase):
    """簡化梯形齒外形(俯視 XZ 平面),回傳極座標點列 [(r, ang), ...]。"""
    pitch = 2 * math.pi / z
    r_pitch = module * z / 2
    r_tip = r_pitch + module          # 齒頂
    r_root = r_pitch - 1.2 * module   # 齒根
    tip_w = 0.28 * pitch              # 齒頂角寬
    root_w = 0.55 * pitch             # 齒在齒根的角寬
    pts = []
    for k in range(z):
        c = phase + k * pitch
        pts.append((r_tip, c - tip_w / 2))
        pts.append((r_tip, c + tip_w / 2))
        pts.append((r_root, c + root_w / 2))
        a0, a1 = c + root_w / 2, c + pitch - root_w / 2
        for t in (1, 2, 3):           # 齒間根圓弧
            pts.append((r_root, a0 + (a1 - a0) * t / 3))
    return pts


def polar_xz(r, ang, y):
    # 由上往下看(+Y 向下視角)逆時針
    return (r * math.cos(ang), y, -r * math.sin(ang))


def build_gear(z, module, thick, phase=0.0):
    """齒輪實體:外形擠出,上下蓋用中心扇形(齒形對中心為星形,扇形三角化有效)。"""
    mb = MeshBuilder()
    out = gear_outline(z, module, phase)
    n = len(out)
    top, bot = thick / 2, -thick / 2
    ct, cb = (0.0, top, 0.0), (0.0, bot, 0.0)
    for i in range(n):
        r0, a0 = out[i]
        r1, a1 = out[(i + 1) % n]
        pt0t, pt1t = polar_xz(r0, a0, top), polar_xz(r1, a1, top)
        pt0b, pt1b = polar_xz(r0, a0, bot), polar_xz(r1, a1, bot)
        mb.add_tri(ct, pt0t, pt1t, (0, 1, 0))          # 上蓋
        mb.add_tri(cb, pt1b, pt0b, (0, -1, 0))         # 下蓋
        mb.add_quad(pt0b, pt1b, pt1t, pt0t)            # 側壁
    return mb


def build_cylinder(r, y0, y1, seg=32, cx=0.0, cz=0.0):
    mb = MeshBuilder()
    for i in range(seg):
        a0, a1 = 2 * math.pi * i / seg, 2 * math.pi * (i + 1) / seg
        p0t = (cx + r * math.cos(a0), y1, cz - r * math.sin(a0))
        p1t = (cx + r * math.cos(a1), y1, cz - r * math.sin(a1))
        p0b = (cx + r * math.cos(a0), y0, cz - r * math.sin(a0))
        p1b = (cx + r * math.cos(a1), y0, cz - r * math.sin(a1))
        mb.add_quad(p0b, p1b, p1t, p0t)                # 側壁
        mb.add_tri((cx, y1, cz), p0t, p1t, (0, 1, 0))  # 頂蓋
        mb.add_tri((cx, y0, cz), p1b, p0b, (0, -1, 0)) # 底蓋
    return mb


def build_box(sx, sy, sz, y0=0.0):
    mb = MeshBuilder()
    x, z = sx / 2, sz / 2
    y1 = y0 + sy
    a = (-x, y0, -z); b = (x, y0, -z); c = (x, y0, z); d = (-x, y0, z)
    e = (-x, y1, -z); f = (x, y1, -z); g = (x, y1, z); h = (-x, y1, z)
    mb.add_quad(e, h, g, f)   # 上
    mb.add_quad(a, b, c, d)   # 下
    mb.add_quad(d, c, g, h)   # 前 +z
    mb.add_quad(b, a, e, f)   # 後 -z
    mb.add_quad(a, d, h, e)   # 左 -x
    mb.add_quad(c, b, f, g)   # 右 +x
    return mb


def merge(*builders):
    mb = MeshBuilder()
    for b in builders:
        base = len(mb.pos)
        mb.pos += b.pos
        mb.nrm += b.nrm
        mb.idx += [i + base for i in b.idx]
    return mb


# ---------------- 場景三個部件 ----------------
# 底座(深灰):平板 + 兩支固定軸
base = merge(
    build_box(0.146, 0.012, 0.092),
    build_cylinder(0.005, 0.012, 0.040, cx=POS_A[0]),
    build_cylinder(0.005, 0.012, 0.040, cx=POS_B[0]),
)
# 大齒輪(鋼灰):齒形 + 輪轂;齒對準 0°(朝向小齒輪)
gear_a = merge(
    build_gear(Z_A, MODULE, GEAR_THICK, phase=0.0),
    build_cylinder(0.011, GEAR_THICK / 2, GEAR_THICK / 2 + 0.004, seg=24),
)
# 小齒輪(黃銅):相位偏移半個齒距 → 朝大齒輪方向(180°)正好是齒槽,兩輪互相嚙合
gear_b = merge(
    build_gear(Z_B, MODULE, GEAR_THICK, phase=math.pi / Z_B),
    build_cylinder(0.009, GEAR_THICK / 2, GEAR_THICK / 2 + 0.004, seg=24),
)

MATS = {
    "base":  dict(color=(0.13, 0.15, 0.18), metallic=0.4, roughness=0.6),
    "gearA": dict(color=(0.62, 0.66, 0.72), metallic=0.9, roughness=0.35),
    "gearB": dict(color=(0.85, 0.62, 0.22), metallic=0.9, roughness=0.30),
}

# ---------------- glTF (.glb) ----------------
def write_glb(path):
    import pygltflib as g

    blob = bytearray()
    buffer_views, accessors = [], []

    def push(data, target):
        while len(blob) % 4:
            blob.append(0)
        offset = len(blob)
        blob.extend(data.tobytes())
        buffer_views.append(g.BufferView(buffer=0, byteOffset=offset,
                                         byteLength=data.nbytes, target=target))
        return len(buffer_views) - 1

    def add_mesh(mb, mat_idx):
        pos, nrm, idx = mb.arrays()
        bv_p = push(pos, g.ARRAY_BUFFER)
        bv_n = push(nrm, g.ARRAY_BUFFER)
        bv_i = push(idx, g.ELEMENT_ARRAY_BUFFER)
        accessors.append(g.Accessor(bufferView=bv_p, componentType=g.FLOAT,
                                    count=len(pos), type=g.VEC3,
                                    min=pos.min(axis=0).tolist(),
                                    max=pos.max(axis=0).tolist()))
        a_p = len(accessors) - 1
        accessors.append(g.Accessor(bufferView=bv_n, componentType=g.FLOAT,
                                    count=len(nrm), type=g.VEC3))
        a_n = len(accessors) - 1
        accessors.append(g.Accessor(bufferView=bv_i, componentType=g.UNSIGNED_INT,
                                    count=len(idx), type=g.SCALAR))
        a_i = len(accessors) - 1
        return g.Mesh(primitives=[g.Primitive(
            attributes=g.Attributes(POSITION=a_p, NORMAL=a_n),
            indices=a_i, material=mat_idx)])

    materials = [g.Material(
        name=k,
        pbrMetallicRoughness=g.PbrMetallicRoughness(
            baseColorFactor=[*m["color"], 1.0],
            metallicFactor=m["metallic"], roughnessFactor=m["roughness"]),
        doubleSided=False) for k, m in MATS.items()]

    meshes = [add_mesh(base, 0), add_mesh(gear_a, 1), add_mesh(gear_b, 2)]

    # 動畫:每 0.5 秒一個關鍵影格,繞 Y 軸旋轉(四元數)
    times = np.arange(0, DUR + 1e-6, 0.5, dtype=np.float32)
    def quats(deg_per_cycle):
        q = []
        for t in times:
            ang = math.radians(deg_per_cycle) * (t / DUR)
            q.append((0.0, math.sin(ang / 2), 0.0, math.cos(ang / 2)))
        return np.array(q, dtype=np.float32)

    bv_t = push(times, None)
    accessors.append(g.Accessor(bufferView=bv_t, componentType=g.FLOAT,
                                count=len(times), type=g.SCALAR,
                                min=[0.0], max=[float(DUR)]))
    a_time = len(accessors) - 1
    a_rot = []
    for deg in (360.0, -720.0):
        q = quats(deg)
        bv = push(q, None)
        accessors.append(g.Accessor(bufferView=bv, componentType=g.FLOAT,
                                    count=len(q), type=g.VEC4))
        a_rot.append(len(accessors) - 1)

    gltf = g.GLTF2(
        asset=g.Asset(generator="pc13110 tools/generate_gear_model.py", version="2.0"),
        scene=0,
        scenes=[g.Scene(nodes=[0])],
        nodes=[
            g.Node(name="GearTrain", children=[1, 2, 3]),
            g.Node(name="Base", mesh=meshes[0]),
            g.Node(name="GearA", mesh=meshes[1], translation=list(POS_A)),
            g.Node(name="GearB", mesh=meshes[2], translation=list(POS_B)),
        ],
        meshes=[],
        materials=materials,
        animations=[g.Animation(
            name="spin",
            samplers=[
                g.AnimationSampler(input=a_time, output=a_rot[0], interpolation="LINEAR"),
                g.AnimationSampler(input=a_time, output=a_rot[1], interpolation="LINEAR"),
            ],
            channels=[
                g.AnimationChannel(sampler=0, target=g.AnimationChannelTarget(node=2, path="rotation")),
                g.AnimationChannel(sampler=1, target=g.AnimationChannelTarget(node=3, path="rotation")),
            ])],
        bufferViews=buffer_views,
        accessors=accessors,
        buffers=[g.Buffer(byteLength=len(blob))],
    )
    # add_mesh 回傳的是 Mesh 物件;掛回 gltf 並把 node.mesh 改為索引
    gltf.meshes = meshes
    for i, node_mesh in ((1, 0), (2, 1), (3, 2)):
        gltf.nodes[i].mesh = node_mesh
    gltf.set_binary_blob(bytes(blob))
    gltf.save_binary(str(path))
    print(f"✓ {path.relative_to(REPO)}  ({path.stat().st_size/1024:.0f} KB)")


# ---------------- USD (.usdz) ----------------
def write_usdz(path):
    from pxr import Gf, Sdf, Usd, UsdGeom, UsdShade, UsdUtils, Vt

    FPS = 24.0
    end_tc = DUR * FPS
    usda = path.with_suffix(".usda")
    stage = Usd.Stage.CreateNew(str(usda))
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    UsdGeom.SetStageMetersPerUnit(stage, 1.0)
    stage.SetStartTimeCode(0)
    stage.SetEndTimeCode(end_tc)
    stage.SetTimeCodesPerSecond(FPS)
    stage.SetFramesPerSecond(FPS)

    root = UsdGeom.Xform.Define(stage, "/GearTrain")
    Usd.ModelAPI(root.GetPrim()).SetKind("component")
    stage.SetDefaultPrim(root.GetPrim())

    def add_material(name, color, metallic, roughness):
        mat = UsdShade.Material.Define(stage, f"/GearTrain/Materials/{name}")
        sh = UsdShade.Shader.Define(stage, f"/GearTrain/Materials/{name}/PBR")
        sh.CreateIdAttr("UsdPreviewSurface")
        sh.CreateInput("diffuseColor", Sdf.ValueTypeNames.Color3f).Set(Gf.Vec3f(*color))
        sh.CreateInput("metallic", Sdf.ValueTypeNames.Float).Set(metallic)
        sh.CreateInput("roughness", Sdf.ValueTypeNames.Float).Set(roughness)
        mat.CreateSurfaceOutput().ConnectToSource(sh.ConnectableAPI(), "surface")
        return mat

    mats = {k: add_material(k.capitalize(), m["color"], m["metallic"], m["roughness"])
            for k, m in MATS.items()}

    def add_mesh(parent_path, name, mb, mat):
        pos, nrm, idx = mb.arrays()
        mesh = UsdGeom.Mesh.Define(stage, f"{parent_path}/{name}")
        mesh.CreatePointsAttr(Vt.Vec3fArray([Gf.Vec3f(*p) for p in pos.tolist()]))
        mesh.CreateFaceVertexCountsAttr(Vt.IntArray([3] * (len(idx) // 3)))
        mesh.CreateFaceVertexIndicesAttr(Vt.IntArray(idx.tolist()))
        mesh.CreateNormalsAttr(Vt.Vec3fArray([Gf.Vec3f(*n) for n in nrm.tolist()]))
        mesh.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
        mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
        mesh.CreateExtentAttr(UsdGeom.PointBased(mesh).ComputeExtent(
            mesh.GetPointsAttr().Get()))
        UsdShade.MaterialBindingAPI.Apply(mesh.GetPrim()).Bind(mat)
        return mesh

    add_mesh("/GearTrain", "Base", base, mats["base"])

    def add_gear(name, mb, mat, pos3, deg_per_cycle):
        x = UsdGeom.Xform.Define(stage, f"/GearTrain/{name}")
        x.AddTranslateOp().Set(Gf.Vec3d(*pos3))
        rot = x.AddRotateYOp()
        rot.Set(0.0, time=0)
        rot.Set(float(deg_per_cycle), time=end_tc)
        add_mesh(f"/GearTrain/{name}", "Mesh", mb, mat)

    add_gear("GearA", gear_a, mats["gearA"], POS_A, 360.0)
    add_gear("GearB", gear_b, mats["gearB"], POS_B, -720.0)

    stage.Save()
    ok = UsdUtils.CreateNewARKitUsdzPackage(str(usda), str(path))
    if not ok:
        sys.exit("✗ usdz 打包失敗")
    print(f"✓ {path.relative_to(REPO)}  ({path.stat().st_size/1024:.0f} KB)")

    checker = UsdUtils.ComplianceChecker(arkit=True, verbose=False)
    checker.CheckCompliance(str(path))
    errs = checker.GetErrors() + checker.GetFailedChecks()
    if errs:
        print("⚠ usdchecker(--arkit)發現問題:")
        for e in errs:
            print("  -", e)
    else:
        print("✓ usdchecker --arkit 通過")
    usda.unlink()  # 中間檔不留在 repo


if __name__ == "__main__":
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    write_glb(OUT_DIR / "gear-train.glb")
    write_usdz(OUT_DIR / "gear-train.usdz")
