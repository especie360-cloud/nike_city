import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy
from nikecity_blender_common import (
    ASSETS,
    ZONE_DIR,
    base_platform,
    clear_scene,
    cube,
    cyl,
    lamp,
    make_materials,
    rounded_box,
    setup_scene,
    tree,
)


M = {}


def double_icon_sign():
    for x in (-0.42, 0.42):
        cyl("generic sign pole", (x, -0.18, 0.38), 0.014, 0.55, M["pole"], 12)
        cyl("generic sign foot", (x, -0.18, 0.1), 0.04, 0.025, M["side"], 18, 0.002)
    rounded_box("generic white sign board", 1.22, 0.08, 0.56, 0.04, M["porcelain"], (0, -0.2, 0.68))
    cube("generic black sign trim top", (0, -0.246, 0.95), (1.18, 0.018, 0.03), M["black"], 0, 0.002)
    cube("generic black sign trim bottom", (0, -0.246, 0.41), (1.18, 0.018, 0.03), M["black"], 0, 0.002)

    for x, color, letter in [(-0.3, M["white"], "p"), (0.34, M["yellow"], "m")]:
        cyl("generic icon outer disk", (x, -0.258, 0.68), 0.18, 0.018, M["black"], 36, 0.002, (math.pi / 2, 0, 0))
        cyl("generic icon inner disk", (x, -0.272, 0.68), 0.135, 0.014, color, 36, 0.002, (math.pi / 2, 0, 0))
        cube(f"generic {letter} icon stem", (x - 0.035, -0.282, 0.67), (0.028, 0.01, 0.12), M["black"], 0, 0.002)
        cube(f"generic {letter} icon cap", (x + 0.02, -0.284, 0.71), (0.085, 0.01, 0.03), M["black"], 0, 0.002)
        if letter == "m":
            cube("generic m second stem", (x + 0.045, -0.282, 0.66), (0.024, 0.01, 0.1), M["black"], 0, 0.002)


def props():
    tree(0.82, 0.62, M, 0.72, False)
    tree(1.1, -0.74, M, 0.58, False)
    tree(-1.1, -0.58, M, 0.48, True)
    lamp(1.28, 0.05, M, 0.72)
    lamp(-1.15, 0.18, M, 0.58)
    for x, y, w, d in [
        (0.78, 0.62, 0.74, 0.58),
        (1.08, -0.76, 0.56, 0.46),
        (-0.12, -0.2, 1.48, 0.62),
    ]:
        rounded_box("generic subtle paving island line", w, d, 0.012, 0.12, M["paving"], (x, y, 0.145))
        rounded_box("generic inner white paving cover", max(w - 0.05, 0.1), max(d - 0.05, 0.1), 0.014, 0.1, M["porcelain"], (x, y, 0.152))


clear_scene()
M = make_materials()
base_platform("generic", 2.85, 2.2, 0.34, M)
double_icon_sign()
props()
setup_scene()

bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / "zona_generica.blend"))
bpy.ops.export_scene.gltf(
    filepath=str(ZONE_DIR / "zona_generica.glb"),
    export_format="GLB",
    export_yup=True,
    use_selection=False,
)
