import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy
from nikecity_blender_common import (
    ASSETS,
    ZONE_DIR,
    base_platform,
    bench,
    clear_scene,
    cube,
    cyl,
    lamp,
    make_materials,
    nike_sign,
    rounded_box,
    setup_scene,
    sphere,
    swoosh,
    tree,
)


M = {}


def smile_icon(x, y, z, scale=1.0):
    cyl("raised smile disk", (x, y, z), 0.26 * scale, 0.05 * scale, M["yellow"], 48, 0.008)
    cyl("smile left eye", (x - 0.085 * scale, y - 0.002, z + 0.03 * scale), 0.026 * scale, 0.014 * scale, M["black"], 18, 0.002)
    cyl("smile right eye", (x + 0.085 * scale, y - 0.002, z + 0.03 * scale), 0.026 * scale, 0.014 * scale, M["black"], 18, 0.002)
    cube("smile mouth base", (x, y - 0.006, z - 0.045 * scale), (0.17 * scale, 0.012, 0.026 * scale), M["black"], math.radians(0), 0.01)
    cyl("smile mouth left rounded", (x - 0.085 * scale, y - 0.007, z - 0.035 * scale), 0.02 * scale, 0.012, M["black"], 16, 0.001)
    cyl("smile mouth right rounded", (x + 0.085 * scale, y - 0.007, z - 0.035 * scale), 0.02 * scale, 0.012, M["black"], 16, 0.001)


def roof_scooter(x, y, z, scale=1.0, rot=0):
    cube("tiny scooter deck", (x, y, z), (0.38 * scale, 0.045 * scale, 0.035 * scale), M["yellow"], rot, 0.008)
    cube("tiny scooter handle", (x + math.cos(rot) * 0.16 * scale, y + math.sin(rot) * 0.16 * scale, z + 0.07 * scale), (0.035 * scale, 0.03 * scale, 0.16 * scale), M["yellow"], rot, 0.004)
    for dx in (-0.16, 0.16):
        cyl("tiny scooter wheel", (x + math.cos(rot) * dx * scale, y + math.sin(rot) * dx * scale, z - 0.02 * scale), 0.035 * scale, 0.018 * scale, M["black"], 16, 0.001, (math.pi / 2, 0, rot))


def shop_building(name, x, y, black_side=False):
    body_mat = M["black"] if black_side else M["porcelain"]
    rounded_box(f"{name} main body", 0.82, 0.78, 0.74, 0.12, body_mat, (x, y, 0.47))
    rounded_box(f"{name} white roof cap", 0.86, 0.82, 0.08, 0.12, M["porcelain"], (x, y, 0.88))
    cube(f"{name} yellow front facade", (x, y - 0.42, 0.43), (0.58, 0.035, 0.36), M["yellow"], 0, 0.01)
    cube(f"{name} black front glass", (x, y - 0.445, 0.42), (0.38, 0.018, 0.26), M["black"], 0, 0.006)
    cube(f"{name} yellow awning", (x, y - 0.46, 0.62), (0.48, 0.07, 0.055), M["yellow"], 0, 0.008)
    cube(f"{name} side black panel", (x - 0.43, y, 0.48), (0.035, 0.48, 0.28), M["black"], 0, 0.006)
    swoosh((x - 0.45, y - 0.05, 0.5), 0.36, math.radians(82), M["yellow"], f"{name} side swoosh")
    roof_scooter(x, y, 0.96, 0.72, math.radians(12))


def round_smile_hub():
    cyl("round juvenile smile hub body", (0.05, -0.84, 0.42), 0.55, 0.58, M["porcelain"], 64, 0.012)
    cyl("black glass ring smile hub", (0.05, -0.84, 0.44), 0.57, 0.34, M["black"], 64, 0.006)
    cyl("white smile hub roof", (0.05, -0.84, 0.76), 0.6, 0.12, M["porcelain"], 64, 0.008)
    smile_icon(0.05, -0.84, 0.86, 0.72)
    for a in range(8):
        angle = a * math.tau / 8
        cube("thin yellow hub mullion", (0.05 + math.cos(angle) * 0.55, -0.84 + math.sin(angle) * 0.55, 0.42), (0.025, 0.02, 0.34), M["yellow"], angle, 0.002)


def rounded_kiosk():
    rounded_box("rounded interactive kiosk body", 0.76, 0.76, 0.58, 0.16, M["porcelain"], (0.9, 0.72, 0.43))
    rounded_box("kiosk black glass wrap", 0.66, 0.66, 0.34, 0.12, M["black"], (0.9, 0.72, 0.45))
    rounded_box("kiosk roof cap", 0.82, 0.82, 0.08, 0.16, M["porcelain"], (0.9, 0.72, 0.77))
    rounded_box("kiosk black roof inset", 0.5, 0.5, 0.035, 0.08, M["black"], (0.9, 0.72, 0.835))
    cube("kiosk yellow loop mark", (0.9, 0.72, 0.865), (0.24, 0.03, 0.016), M["yellow"], math.radians(35), 0.003)
    cube("kiosk yellow loop mark cross", (0.9, 0.72, 0.868), (0.24, 0.03, 0.016), M["yellow"], math.radians(-35), 0.003)


def tiny_experience_kiosk():
    rounded_box("tiny yellow experience kiosk", 0.72, 0.38, 0.45, 0.08, M["yellow"], (1.18, -0.52, 0.36))
    cube("tiny kiosk black glass front", (1.18, -0.725, 0.36), (0.48, 0.025, 0.28), M["black"], 0, 0.006)
    cube("tiny kiosk black side", (0.8, -0.52, 0.36), (0.025, 0.26, 0.28), M["black"], 0, 0.004)
    rounded_box("tiny kiosk white roof edge", 0.76, 0.42, 0.06, 0.08, M["porcelain"], (1.18, -0.52, 0.62))


def props():
    for x, y, white in [(-1.85, 1.05, False), (1.82, 1.05, False), (-1.55, -1.25, True), (1.76, -1.2, True)]:
        tree(x, y, M, 0.72, white)
    for x, y in [(-1.75, 0.1), (-0.65, 1.35), (1.6, 0.45), (-0.65, -1.4), (0.85, -1.32)]:
        lamp(x, y, M, 0.72)
    bench(-1.05, -0.7, M, math.radians(6))
    bench(1.65, -0.58, M, math.radians(-8))
    nike_sign(1.75, 0.62, M, math.radians(4))


def build():
    base_platform("juvenile", 4.42, 3.52, 0.48, M)
    shop_building("left youth store", -1.2, 0.36, True)
    shop_building("rear youth store", -0.36, 1.02, True)
    rounded_kiosk()
    round_smile_hub()
    tiny_experience_kiosk()
    props()


clear_scene()
M = make_materials()
build()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_juvenil.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_juvenil.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
