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


def umbrella(x, y, scale=1.0):
    cyl("casual umbrella pole", (x, y, 0.28 * scale), 0.012 * scale, 0.38 * scale, M["pole"], 12)
    cyl("casual umbrella base", (x, y, 0.095 * scale), 0.06 * scale, 0.025 * scale, M["yellow"], 24, 0.004)
    cyl("casual umbrella canopy", (x, y, 0.52 * scale), 0.18 * scale, 0.035 * scale, M["yellow"], 36, 0.006)
    for a in range(4):
        cube("casual white canopy segment", (x, y, 0.545 * scale), (0.17 * scale, 0.03 * scale, 0.012 * scale), M["white"], a * math.pi / 2, 0.002)


def shoe_on_roof():
    rounded_box("roof shoe sole", 0.72, 0.23, 0.06, 0.06, M["white"], (-0.38, 0.28, 0.98))
    rounded_box("black casual shoe body", 0.66, 0.22, 0.16, 0.06, M["black"], (-0.38, 0.28, 1.06))
    rounded_box("shoe heel block", 0.22, 0.23, 0.22, 0.05, M["black"], (-0.65, 0.28, 1.1))
    rounded_box("shoe toe cap", 0.24, 0.2, 0.12, 0.08, M["black"], (-0.08, 0.28, 1.04))
    for i in range(4):
        cube("yellow shoe lace", (-0.42 + i * 0.08, 0.16, 1.155), (0.055, 0.012, 0.012), M["yellow"], math.radians(20), 0.001)
    swoosh((-0.25, 0.145, 1.105), 0.22, math.radians(12), M["yellow"], "shoe side swoosh")


def casual_store():
    rounded_box("casual store rounded body", 2.34, 1.08, 0.78, 0.24, M["porcelain"], (0.18, 0.14, 0.52))
    rounded_box("casual store black lower glass wrap", 2.18, 0.96, 0.42, 0.2, M["black"], (0.18, 0.14, 0.38))
    rounded_box("casual store white roof cap", 2.42, 1.16, 0.12, 0.25, M["porcelain"], (0.18, 0.14, 0.94))
    cube("casual front yellow entry frame", (-0.38, -0.43, 0.48), (0.45, 0.04, 0.42), M["yellow"], 0, 0.012)
    cube("casual front black door", (-0.38, -0.46, 0.43), (0.28, 0.018, 0.3), M["black"], 0, 0.006)
    cube("casual yellow awning left", (-0.38, -0.49, 0.66), (0.48, 0.08, 0.055), M["yellow"], 0, 0.008)
    cube("casual front window", (0.55, -0.46, 0.46), (0.48, 0.02, 0.32), M["black"], 0, 0.006)
    cube("casual yellow awning right", (0.55, -0.49, 0.66), (0.5, 0.08, 0.055), M["yellow"], 0, 0.008)
    cube("casual curved side glass hint", (1.35, 0.12, 0.48), (0.04, 0.52, 0.34), M["black"], 0, 0.008)
    for y in (-0.18, 0.12, 0.42):
        cube("casual side yellow mullion", (1.375, y, 0.48), (0.018, 0.035, 0.34), M["yellow"], 0, 0.002)
    swoosh((0.48, 0.42, 1.035), 0.5, math.radians(14), M["black"], "roof black swoosh")
    shoe_on_roof()


def props():
    for x, y in [(-1.58, -0.62), (-1.08, -0.98), (-0.42, -0.98), (0.22, -1.0), (0.78, -0.82)]:
        umbrella(x, y, 0.72)
    tree(1.72, 0.9, M, 0.78, False)
    tree(1.5, -0.9, M, 0.58, False)
    tree(-1.75, 0.7, M, 0.64, True)
    for x, y in [(-1.8, -0.1), (-1.1, 0.88), (1.2, -0.82), (1.72, 0.15)]:
        lamp(x, y, M, 0.72)
    bench(-1.66, 0.12, M, math.radians(4))
    nike_sign(-1.78, 1.02, M, math.radians(-4))
    nike_sign(-1.75, -1.3, M, math.radians(5))


def build():
    base_platform("casual", 4.1, 2.9, 0.46, M)
    rounded_box("casual subtle walking plaza", 3.55, 2.36, 0.025, 0.34, M["porcelain"], (0, -0.04, 0.13))
    casual_store()
    props()


clear_scene()
M = make_materials()
build()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_casual.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_casual.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
