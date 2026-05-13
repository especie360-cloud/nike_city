import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy
from nikecity_blender_common import (
    ASSETS,
    ZONE_DIR,
    assign,
    bench,
    clear_scene,
    cone,
    cube,
    cyl,
    lamp,
    make_materials,
    nike_sign,
    rounded_box,
    setup_scene,
    sphere,
    tree,
)


PROPS_DIR = ASSETS / "models" / "props"
PROPS_DIR.mkdir(parents=True, exist_ok=True)
M = {}


def export_prop(filename):
    setup_scene()
    bpy.ops.wm.save_as_mainfile(filepath=str(ASSETS / f"{Path(filename).stem}.blend"))
    bpy.ops.export_scene.gltf(
        filepath=str(PROPS_DIR / filename),
        export_format="GLB",
        export_yup=True,
        use_selection=False,
    )


def umbrella_asset():
    clear_scene()
    global M
    M = make_materials()
    cyl("umbrella pole", (0, 0, 0.28), 0.014, 0.42, M["pole"], 12)
    cyl("umbrella base disk", (0, 0, 0.075), 0.065, 0.035, M["yellow"], 28, 0.005)
    cyl("umbrella canopy volume", (0, 0, 0.54), 0.22, 0.055, M["yellow"], 40, 0.008)
    cone("umbrella tiny peak", (0, 0, 0.61), 0.08, 0.075, M["yellow"], 32)
    for a in range(4):
        cube("white umbrella canopy panel", (0, 0, 0.575), (0.22, 0.038, 0.014), M["white"], a * math.pi / 2, 0.003)
    export_prop("prop_umbrella.glb")


def lamp_asset():
    clear_scene()
    global M
    M = make_materials()
    lamp(0, 0, M, 1.0)
    export_prop("prop_lamp.glb")


def bench_asset():
    clear_scene()
    global M
    M = make_materials()
    bench(0, 0, M, 0)
    cyl("bench left foot", (-0.12, 0, 0.095), 0.012, 0.14, M["pole"], 10)
    cyl("bench right foot", (0.12, 0, 0.095), 0.012, 0.14, M["pole"], 10)
    export_prop("prop_bench.glb")


def tree_yellow_asset():
    clear_scene()
    global M
    M = make_materials()
    tree(0, 0, M, 1.0, False)
    export_prop("prop_tree_yellow.glb")


def tree_white_asset():
    clear_scene()
    global M
    M = make_materials()
    tree(0, 0, M, 1.0, True)
    export_prop("prop_tree_white.glb")


def cone_tree_asset():
    clear_scene()
    global M
    M = make_materials()
    cyl("cone tree trunk", (0, 0, 0.18), 0.026, 0.26, M["amber"], 12)
    cone("cone tree lower crown", (0, 0, 0.42), 0.16, 0.28, M["yellow"], 36)
    cone("cone tree middle crown", (0, 0, 0.58), 0.125, 0.22, M["yellow"], 36)
    cone("cone tree white cap", (0, 0, 0.73), 0.07, 0.105, M["white"], 28)
    export_prop("prop_tree_cone.glb")


def sign_asset():
    clear_scene()
    global M
    M = make_materials()
    nike_sign(0, 0, M, 0)
    export_prop("prop_nike_sign.glb")


def flag_asset():
    clear_scene()
    global M
    M = make_materials()
    cyl("flag pole", (0, 0, 0.42), 0.012, 0.72, M["pole"], 12)
    cube("black flag panel", (0.13, 0, 0.74), (0.34, 0.04, 0.19), M["black"], 0, 0.01)
    cube("flag yellow slash", (0.13, -0.022, 0.745), (0.18, 0.012, 0.026), M["yellow"], math.radians(-18), 0.003)
    cyl("flag top bead", (0, 0, 0.8), 0.026, 0.026, M["yellow"], 16, 0.003)
    export_prop("prop_flag.glb")


def bollard_asset():
    clear_scene()
    global M
    M = make_materials()
    cyl("small bollard black base", (0, 0, 0.07), 0.045, 0.04, M["black"], 20, 0.004)
    cyl("small bollard body", (0, 0, 0.2), 0.028, 0.23, M["yellow"], 20, 0.004)
    cone("small bollard white cap", (0, 0, 0.345), 0.04, 0.075, M["white"], 24)
    export_prop("prop_bollard.glb")


def fountain_asset():
    clear_scene()
    global M
    M = make_materials()
    cyl("fountain outer ring", (0, 0, 0.09), 0.22, 0.06, M["porcelain"], 48, 0.008)
    cyl("fountain black water", (0, 0, 0.135), 0.15, 0.035, M["black"], 48, 0.004)
    cyl("fountain yellow center", (0, 0, 0.19), 0.055, 0.09, M["yellow"], 32, 0.004)
    sphere("fountain white drop", (0, 0, 0.285), 0.04, M["white"], (1, 1, 1.25))
    export_prop("prop_fountain.glb")


def parking_sign_asset():
    clear_scene()
    global M
    M = make_materials()
    cyl("parking sign pole", (0, 0, 0.34), 0.012, 0.5, M["pole"], 12)
    cube("parking sign yellow board", (0, 0, 0.62), (0.22, 0.045, 0.28), M["yellow"], 0, 0.012)
    cyl("parking black circle", (0, -0.027, 0.62), 0.085, 0.012, M["black"], 32, 0.002, (math.pi / 2, 0, 0))
    cube("parking p vertical", (-0.018, -0.036, 0.62), (0.026, 0.012, 0.1), M["yellow"], 0, 0.001)
    cube("parking p top", (0.022, -0.037, 0.65), (0.075, 0.012, 0.026), M["yellow"], 0, 0.001)
    export_prop("prop_parking_sign.glb")


def build_all():
    umbrella_asset()
    lamp_asset()
    bench_asset()
    tree_yellow_asset()
    tree_white_asset()
    cone_tree_asset()
    sign_asset()
    flag_asset()
    bollard_asset()
    fountain_asset()
    parking_sign_asset()


build_all()
