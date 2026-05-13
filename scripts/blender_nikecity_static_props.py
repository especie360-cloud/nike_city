import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import bpy
import mathutils
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


def rod(name, start, end, radius, material, vertices=10, bevel_amount=0.001):
    start_v = mathutils.Vector(start)
    end_v = mathutils.Vector(end)
    mid = (start_v + end_v) * 0.5
    direction = end_v - start_v
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=direction.length, location=mid)
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    assign(obj, material)
    bpy.ops.object.shade_smooth()
    if bevel_amount:
        mod = obj.modifiers.new("tiny rod bevel", "BEVEL")
        mod.width = bevel_amount
        mod.segments = 1
        obj.modifiers.new("weighted normals", "WEIGHTED_NORMAL")
    return obj


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


def traffic_light_asset():
    clear_scene()
    global M
    M = make_materials()
    cyl("traffic light pole", (0, 0, 0.38), 0.014, 0.62, M["pole"], 12)
    cyl("traffic light base", (0, 0, 0.07), 0.055, 0.035, M["black"], 20, 0.004)
    cube("traffic light black head", (0, -0.012, 0.68), (0.14, 0.075, 0.34), M["black"], 0, 0.012)
    cyl("traffic top yellow lamp", (0, -0.052, 0.78), 0.035, 0.012, M["yellow"], 20, 0.002, (math.pi / 2, 0, 0))
    cyl("traffic middle white lamp", (0, -0.052, 0.68), 0.032, 0.012, M["white"], 20, 0.002, (math.pi / 2, 0, 0))
    cyl("traffic bottom yellow lamp", (0, -0.052, 0.58), 0.035, 0.012, M["yellow"], 20, 0.002, (math.pi / 2, 0, 0))
    cube("traffic side visor top", (0, -0.075, 0.78), (0.11, 0.018, 0.022), M["yellow"], 0, 0.003)
    cube("traffic side visor mid", (0, -0.075, 0.68), (0.1, 0.018, 0.02), M["white"], 0, 0.003)
    cube("traffic side visor bottom", (0, -0.075, 0.58), (0.11, 0.018, 0.022), M["yellow"], 0, 0.003)
    cube("traffic small cross arm", (0.11, 0, 0.76), (0.22, 0.02, 0.02), M["pole"], 0, 0.003)
    export_prop("prop_traffic_light.glb")


def bicycle_asset(filename, frame_key):
    clear_scene()
    global M
    M = make_materials()
    frame_material = M[frame_key]
    seat_material = M["black"]
    cyl("bike rear wheel", (-0.22, 0, 0.14), 0.13, 0.025, M["black"], 36, 0.003, (math.pi / 2, 0, 0))
    cyl("bike rear wheel inner", (-0.22, 0.002, 0.14), 0.085, 0.027, M["white"], 28, 0.002, (math.pi / 2, 0, 0))
    cyl("bike front wheel", (0.24, 0, 0.14), 0.13, 0.025, M["black"], 36, 0.003, (math.pi / 2, 0, 0))
    cyl("bike front wheel inner", (0.24, 0.002, 0.14), 0.085, 0.027, M["white"], 28, 0.002, (math.pi / 2, 0, 0))
    rear = (-0.22, 0, 0.14)
    front = (0.24, 0, 0.14)
    crank = (0, 0, 0.24)
    seat = (-0.07, 0, 0.45)
    handle = (0.27, 0, 0.48)
    rod("bike lower tube", rear, crank, 0.015, frame_material)
    rod("bike chain stay", crank, front, 0.015, frame_material)
    rod("bike top tube", seat, handle, 0.014, frame_material)
    rod("bike rear tube", rear, seat, 0.014, frame_material)
    rod("bike front tube", crank, handle, 0.014, frame_material)
    rod("bike seat post", (-0.07, 0, 0.29), seat, 0.012, frame_material)
    cube("bike black seat", (-0.05, 0, 0.49), (0.16, 0.07, 0.035), seat_material, 0, 0.008)
    rod("bike front fork left", (0.22, -0.018, 0.16), handle, 0.011, frame_material)
    rod("bike front fork right", (0.26, 0.018, 0.16), handle, 0.011, frame_material)
    rod("bike handlebar stem", handle, (0.31, 0, 0.57), 0.011, frame_material)
    cube("bike handlebar", (0.31, 0, 0.57), (0.2, 0.025, 0.025), seat_material, 0, 0.004)
    cyl("bike pedal hub", (0, 0, 0.24), 0.035, 0.03, M["black"], 18, 0.002, (math.pi / 2, 0, 0))
    cube("bike pedal left", (0.055, -0.02, 0.25), (0.1, 0.018, 0.016), frame_material, math.radians(20), 0.002)
    cube("bike tiny rear fender", (-0.22, 0, 0.28), (0.22, 0.032, 0.028), frame_material, 0, 0.004)
    export_prop(filename)


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
    traffic_light_asset()
    bicycle_asset("prop_bicycle_yellow.glb", "yellow")
    bicycle_asset("prop_bicycle_white.glb", "white")


build_all()
